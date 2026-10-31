import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../src/config/gameConfig'
import { ChaseMatchEngine } from '../src/game/runtime/chaseMatchEngine'
import { CHASE_CONFIG, chaseSpeedMultiplier } from '../src/game/rules/chase'
import { CHASE_CARD_DETAILS, type ChaseCardType } from '../src/game/rules/chaseCards'
import {
  DECK_CARD_TYPES,
  botLoadout,
  defaultLoadout,
  validateLoadout,
  type MatchLoadout
} from '../src/game/rules/loadouts'
import { createRoundPowers, echoRound, forwardHit, shadowOpacity } from '../src/game/rules/roundPowers'
import type { SeatId } from '../src/game/model/types'

function start(plan = defaultLoadout()) {
  const g = new ChaseMatchEngine(42, 'new-powers', DECK_CARD_TYPES)
  g.join('human', 'PLAYER')
  expect(g.configureLoadout(0, plan).accepted).toBe(true)
  g.ready()
  g.advance(
    GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds + CHASE_CONFIG.deckSetupSeconds
  )
  for (const s of g.state.seats) {
    s.isBot = false
    s.hand = []
  }
  for (const p of g.state.arena!.players) {
    p.x = 2 + p.seatId * 3
    p.z = 22
  }
  g.state.arena!.coins = []
  g.state.arena!.powers = []
  const alien = g.state.aliens[0]
  alien.holderSeatId = 0
  alien.readyAt = g.state.now
  return g
}
function give(g: ChaseMatchEngine, seat: SeatId, type: ChaseCardType) {
  const card = { id: `new-${seat}-${type}`, type, state: 'ARMED' as const }
  g.state.seats[seat].hand = [card]
  return card
}
function pickup(g: ChaseMatchEngine, seat: SeatId, type: 'TURBO' | 'DUPLICATE') {
  const p = g.state.arena!.players[seat]
  g.state.arena!.powers = [{ id: `pick-${type}`, type, x: p.x, z: p.z, opensAt: g.state.now }]
  g.advance(0.05)
}
describe('three round loadouts and tiers', () => {
  it('requires exactly 3x3, rejects pickups/foreign cards and repeated Epics, permits General repeats', () => {
    const plan = defaultLoadout()
    expect(validateLoadout(plan)).toBe(true)
    for (const bad of [
      null,
      [],
      [plan[0]],
      [...plan, plan[0]],
      [['FREEZE'], ...plan.slice(1)],
      [['TURBO', 'SKIP', 'FREEZE'], ...plan.slice(1)],
      [['DUPLICATE', 'SKIP', 'FREEZE'], ...plan.slice(1)],
      [['x', 'SKIP', 'FREEZE'], ...plan.slice(1)]
    ])
      expect(validateLoadout(bad)).toBe(false)
    plan[0][0] = 'SHADOW'
    plan[1][0] = 'SHADOW'
    expect(validateLoadout(plan)).toBe(false)
    plan[1][0] = 'FREEZE'
    plan[2][0] = 'FREEZE'
    expect(validateLoadout(plan)).toBe(true)
    expect(CHASE_CARD_DETAILS.CHAOS.rarity).toBe('EPIC')
    expect(CHASE_CARD_DETAILS.DUPLICATE.rarity).toBe('RARE')
    expect(CHASE_CARD_DETAILS.FREEZE.rarity).toBe('GENERAL')
  })
  it('creates valid deterministic varied bot decks without repeated Epics or pickups', () => {
    const signatures = new Set<string>()
    for (let seed = 0; seed < 50; seed++)
      for (let seat = 0; seat < 8; seat++) {
        const plan = botLoadout(seed, seat, DECK_CARD_TYPES)
        expect(validateLoadout(plan)).toBe(true)
        expect(plan).toEqual(botLoadout(seed, seat, DECK_CARD_TYPES))
        signatures.add(JSON.stringify(plan))
      }
    expect(signatures.size).toBeGreaterThan(50)
  })
  it('locks future decks once live and replaces unused cards with the exact next planned deck', () => {
    const plan: MatchLoadout = [
      ['CHAOS', 'FREEZE', 'SKIP'],
      ['SHADOW', 'VACUNE', 'INVISIBLE'],
      ['SYMBIOSIS', 'HIDDEN_WATCH', 'FREEZE']
    ]
    const g = start(plan)
    expect(g.configureLoadout(0, defaultLoadout()).accepted).toBe(false)
    give(g, 0, 'CHAOS')
    g.activate(0, 'new-0-CHAOS', 'ORIGINAL')
    g.state.fuseEndsAt = g.state.now + 0.01
    g.advance(GAME_CONFIG.takeoverSequenceSeconds + 0.1)
    expect(g.state.round).toBe(2)
    expect(g.state.seats[0].hand.map((c) => c.type)).toEqual(plan[1])
    expect(g.state.seats[0].hand.filter((c) => c.state === 'ARMED')).toHaveLength(1)
  })
})
describe('shared rare pickups', () => {
  it('schedules exactly one Turbo per round and one Echo per match in a varied random round', () => {
    const rounds = new Set<number>()
    for (let seed = 1; seed < 100; seed++) {
      rounds.add(echoRound(seed))
      const all = [1, 2, 3].flatMap((round) => {
        const powers = createRoundPowers(seed, round, [], 10)
        expect(powers.filter((p) => p.type === 'TURBO')).toHaveLength(1)
        expect(powers).toEqual(createRoundPowers(seed, round, [], 10))
        expect(powers.every((p) => p.opensAt >= 12 && p.opensAt < 19)).toBe(true)
        return powers
      })
      expect(all.filter((p) => p.type === 'DUPLICATE')).toHaveLength(1)
    }
    expect(rounds.size).toBe(3)
  })
  it('hides future appearances, grants Turbo once and permanently cancels its boost on Freeze', () => {
    const g = start(),
      p = g.state.arena!.players[1]
    g.state.arena!.powers = createRoundPowers(42, 1, [], g.state.now)
    expect(g.snapshot(0).arena!.powers).toEqual([])
    pickup(g, 1, 'TURBO')
    expect(p.turboUntil).toBe(g.state.fuseEndsAt)
    expect(chaseSpeedMultiplier(p, g.state.now)).toBe(2)
    expect(g.state.seats[1].heat).toBe(1)
    const freeze = give(g, 0, 'FREEZE')
    expect(g.activate(0, freeze.id, 'ORIGINAL').accepted).toBe(true)
    expect(p.turboUntil).toBe(0)
    expect(p.frozenUntil).toBe(0)
    expect(chaseSpeedMultiplier(p, g.state.now)).toBe(1)
    g.advance(2.1)
    expect(chaseSpeedMultiplier(p, g.state.now)).toBe(1)
    expect(g.state.seats[1].heat).toBe(1)
  })
  it('Echo excludes collector, occupied and vaccinated seats, shares the fuse, transfers for +1, expires at takeover', () => {
    const g = start(),
      now = g.state.now,
      deadline = g.state.fuseEndsAt
    for (const p of g.state.arena!.players) if (![0, 1, 2].includes(p.seatId)) p.vaccinatedUntil = deadline
    pickup(g, 1, 'DUPLICATE')
    expect(g.state.aliens).toHaveLength(2)
    const echo = g.state.aliens.find((a) => a.id === 'ECHO')!
    expect(echo.holderSeatId).toBe(2)
    expect(g.state.fuseEndsAt).toBe(deadline)
    g.advance(1.1)
    const a = g.state.arena!.players[2],
      b = g.state.arena!.players[1]
    a.x = 10
    a.z = 10
    b.x = 11
    b.z = 10
    expect(g.pass(2, 'ECHO', 0).accepted).toBe(true)
    expect(g.state.seats[2].heat).toBe(1)
    expect(g.state.seats[1].heat).toBe(1)
    expect(g.state.now).toBeGreaterThan(now)
    g.state.fuseEndsAt = g.state.now + 0.01
    g.advance(0.02)
    expect(g.state.aliens.map((a) => a.id)).toEqual(['ORIGINAL'])
    expect(g.state.arena!.powers).toEqual([])
  })
})
describe('anti-return and activation points', () => {
  it('blocks only the immediate giver of the same alien for 2.5s, including UI target eligibility', () => {
    const g = start(),
      players = g.state.arena!.players
    players[0].x = 10
    players[0].z = 10
    players[1].x = 11
    players[1].z = 10
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(true)
    g.advance(1.1)
    expect(g.snapshot(1).arena!.throwReady).toBe(false)
    expect(g.snapshot(1).arena!.returnBlockedUntil).toBeGreaterThan(g.state.now)
    expect(g.pass(1, 'ORIGINAL', 1).accepted).toBe(false)
    g.advance(1.39)
    expect(g.pass(1, 'ORIGINAL', 1).accepted).toBe(false)
    g.advance(0.02)
    expect(g.pass(1, 'ORIGINAL', 1).accepted).toBe(true)
    expect(g.snapshot(1).arena!.returnBlockedUntil).toBeUndefined()
    expect(g.state.seats[1].heat).toBe(1)
  })
  it.each(['FREEZE', 'SKIP', 'INVISIBLE', 'HIDDEN_WATCH', 'CHAOS', 'SHADOW', 'VACUNE', 'SYMBIOSIS'] as const)(
    'awards +1 exactly once for accepted %s activation, never loading/rejected retries',
    (type) => {
      const g = start(),
        card = give(g, 0, type)
      const before = g.state.seats[0].heat
      expect(g.activate(0, card.id, 'ORIGINAL').accepted).toBe(true)
      expect(g.state.seats[0].heat).toBe(before + 1)
      expect(g.activate(0, card.id, 'ORIGINAL').accepted).toBe(false)
      expect(g.state.seats[0].heat).toBe(before + 1)
    }
  )
})
describe('Shadow, Symbiosis and Vacune', () => {
  it('Shadow awards activation and one trap bonus, keeps the attacker holding, removes immediately', () => {
    const g = start(),
      players = g.state.arena!.players
    players[0].x = 10
    players[0].z = 10
    players[1].x = 11
    players[1].z = 10
    const card = give(g, 1, 'SHADOW')
    g.activate(1, card.id, 'ORIGINAL')
    players[1].x = 25
    players[1].z = 20
    expect(g.snapshot(0).arena!.throwReady).toBe(true)
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(true)
    expect(g.state.arena!.shadows).toEqual([])
    expect(g.state.seats[1].heat).toBe(2)
    expect(g.state.seats[0].heat).toBe(0)
    expect(g.state.aliens[0]).toMatchObject({ holderSeatId: 0, turn: 0 })
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(false)
  })
  it('Shadow blinks then fades within 5s; expiry grants no trap bonus and cannot collect coins', () => {
    const g = start(),
      card = give(g, 1, 'SHADOW')
    g.activate(1, card.id, 'ORIGINAL')
    expect(shadowOpacity(0, 5)).toBe(1)
    expect(shadowOpacity(4.15, 5)).not.toBe(shadowOpacity(4.25, 5))
    expect(shadowOpacity(4.85, 5)).toBeCloseTo(0.5)
    expect(shadowOpacity(5, 5)).toBe(0)
    g.advance(5.01)
    expect(g.state.arena!.shadows).toEqual([])
    expect(g.state.seats[1].heat).toBe(1)
  })
  it('Symbiosis hits only the first body in a straight 5m segment, never behind or beyond', () => {
    const source = { x: 10, z: 10, yaw: Math.PI / 2 }
    expect(
      forwardHit(source, [
        { x: 13, z: 10 },
        { x: 11, z: 10 }
      ])
    ).toEqual({ x: 11, z: 10 })
    expect(
      forwardHit(source, [
        { x: 9, z: 10 },
        { x: 16, z: 10 },
        { x: 12, z: 11 }
      ])
    ).toBeUndefined()
    const g = start(),
      p = g.state.arena!.players
    Object.assign(p[0], source)
    Object.assign(p[1], { x: 14.9, z: 10 })
    const card = give(g, 0, 'SYMBIOSIS')
    expect(g.activate(0, card.id, 'ORIGINAL').accepted).toBe(true)
    expect(g.state.aliens[0].holderSeatId).toBe(1)
    expect(g.state.seats[0].heat).toBe(2)
  })
  it('Symbiosis cannot tunnel through an immune body or bypass anti-return protection', () => {
    const g = start(),
      p = g.state.arena!.players
    Object.assign(p[0], { x: 10, z: 10, yaw: Math.PI / 2 })
    Object.assign(p[1], { x: 12, z: 10, immuneUntil: g.state.fuseEndsAt })
    Object.assign(p[2], { x: 14, z: 10 })
    const card = give(g, 0, 'SYMBIOSIS')
    g.activate(0, card.id, 'ORIGINAL')
    expect(g.state.aliens[0].holderSeatId).toBe(0)
    expect(card.state).toBe('SPENT')
    expect(g.state.seats[0].heat).toBe(1)
  })
  it('Vacune resists Freeze/Echo, reveals only to its owner, identifies decoys and expires with the round', () => {
    const g = start(),
      p = g.state.arena!.players
    const v = give(g, 1, 'VACUNE')
    g.activate(1, v.id, 'ORIGINAL')
    p[2].invisibleUntil = g.state.fuseEndsAt
    g.aimInput(2, 1, 0, 1)
    expect(g.snapshot(1).arena!.players[2].x).toBe(p[2].x)
    expect(g.snapshot(0).arena!.players[2].x).toBe(0)
    expect(g.snapshot(1).arena!.motion?.some((m) => m.seatId === 2)).toBe(true)
    const freeze = give(g, 0, 'FREEZE')
    g.activate(0, freeze.id, 'ORIGINAL')
    expect(p[1].frozenUntil).toBe(0)
    g.state.aliens.push({ id: 'ECHO', holderSeatId: 2, turn: 0, heldSince: g.state.now, readyAt: g.state.now })
    Object.assign(p[0], { x: 25, z: 20 })
    Object.assign(p[1], { x: 11, z: 10 })
    Object.assign(p[2], { x: 12, z: 10 })
    expect(g.pass(2, 'ECHO', 0).accepted).toBe(false)
    Object.assign(p[0], { x: 10, z: 10 })
    Object.assign(p[1], { x: 11, z: 10 })
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(true)
    g.state.fuseEndsAt = g.state.now + 0.01
    g.advance(0.02)
    expect(p[1].vaccinatedUntil).toBe(0)
  })
  it('keeps a Turbo boost against Freeze while Vacune is active, without a bot-only speed rule', () => {
    const g = start(),
      p = g.state.arena!.players[1]
    pickup(g, 1, 'TURBO')
    g.activate(1, give(g, 1, 'VACUNE').id, 'ORIGINAL')
    g.activate(0, give(g, 0, 'FREEZE').id, 'ORIGINAL')
    expect(chaseSpeedMultiplier(p, g.state.now)).toBe(2)
    expect(p.frozenUntil).toBe(0)
    expect(p.turboUntil).toBe(g.state.fuseEndsAt)
  })
  it('keeps worst-case active clone/power snapshots below the targeted transport budget', () => {
    const g = start()
    for (const seat of g.state.seats) {
      seat.displayName = 'A'.repeat(24)
      g.activate(seat.id, give(g, seat.id, 'SHADOW').id, 'ORIGINAL')
    }
    expect(g.state.arena!.shadows).toHaveLength(8)
    g.state.arena!.coins = Array.from({ length: 10 }, (_, i) => ({ id: `coin${i}`, x: i + 2, z: 10 }))
    g.state.arena!.powers = createRoundPowers(42, echoRound(42), [], g.state.now - 10)
    for (const seat of g.state.seats) {
      seat.hand.push({ id: `unused-${seat.id}`, type: 'INVISIBLE', state: 'ARMED' })
      g.aimInput(seat.id, 1, Math.PI / 4, 1)
    }
    const snapshot = g.snapshot(0)
    snapshot.events = snapshot.events.slice(-16)
    expect(new TextEncoder().encode(JSON.stringify(snapshot)).length).toBeLessThan(13 * 1024)
    expect(snapshot.seats.slice(1).every((seat) => seat.hand.length === 0)).toBe(true)
    g.state.fuseEndsAt = g.state.now + 0.01
    g.advance(0.02)
    expect(g.state.arena!.shadows).toEqual([])
  })
})

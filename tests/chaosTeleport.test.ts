import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../src/config/gameConfig'
import { ChaseMatchEngine } from '../src/game/runtime/chaseMatchEngine'
import { CHASE_CONFIG } from '../src/game/rules/chase'
import { DECK_CARD_TYPES } from '../src/game/rules/loadouts'
import { chaosDestination } from '../src/game/rules/roundPowers'
import { projectChasePlayer, smoothChasePose } from '../src/presentation/chaseMotion'

function game() {
  const g = new ChaseMatchEngine(42, 'teleport-test', DECK_CARD_TYPES)
  g.join('human', 'PLAYER')
  g.ready()
  g.advance(
    GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds + CHASE_CONFIG.deckSetupSeconds
  )
  for (const seat of g.state.seats) {
    seat.isBot = false
    seat.hand = []
  }
  for (const p of g.state.arena!.players) {
    p.x = 2 + p.seatId
    p.z = 22
  }
  g.state.arena!.players[0].x = g.state.arena!.players[0].z = 10
  g.state.arena!.coins = []
  g.state.arena!.powers = []
  g.state.aliens[0].holderSeatId = 0
  g.state.aliens[0].readyAt = g.state.now
  g.state.seats[0].hand = [
    { id: 'chaos', type: 'CHAOS', state: 'ARMED' },
    { id: 'freeze', type: 'FREEZE', state: 'AVAILABLE' },
    { id: 'skip', type: 'SKIP', state: 'AVAILABLE' }
  ]
  return g
}

describe('authoritative random teleport Chaos', () => {
  it('is reproducible, varied, inside bounds, displaced and clear of fixed furniture/body overlap', () => {
    const origin = { x: 10, z: 10 },
      bodies = [
        { x: 26, z: 12 },
        { x: 4, z: 20 }
      ]
    const quadrants = new Set<string>()
    for (let seed = 0; seed < 300; seed++) {
      const p = chaosDestination(seed, 0, origin, bodies)!
      expect(p).toEqual(chaosDestination(seed, 0, origin, bodies))
      expect(p.x).toBeGreaterThanOrEqual(CHASE_CONFIG.minX + 0.45)
      expect(p.x).toBeLessThanOrEqual(CHASE_CONFIG.maxX - 0.45)
      expect(p.z).toBeGreaterThanOrEqual(CHASE_CONFIG.minZ + 0.45)
      expect(p.z).toBeLessThanOrEqual(CHASE_CONFIG.maxZ - 0.45)
      expect(Math.hypot(p.x - 16, p.z - 16)).toBeGreaterThanOrEqual(4)
      expect(Math.hypot(p.x - origin.x, p.z - origin.z)).toBeGreaterThanOrEqual(2)
      expect(bodies.every((body) => Math.hypot(p.x - body.x, p.z - body.z) >= 0.75)).toBe(true)
      quadrants.add(`${p.x > 16}:${p.z > 16}`)
    }
    expect(quadrants.size).toBe(4)
  })
  it('does not reject an otherwise valid destination merely because it is within enemy throw range', () => {
    const origin = { x: 10, z: 10 }
    const p = chaosDestination(42, 0, origin, [])!
    const threat = { x: p.x + 1, z: p.z }
    expect(chaosDestination(42, 0, origin, [threat])).toEqual(p)
  })
  it.each(['ORIGINAL', 'ECHO'] as const)(
    'carries %s without changing either alien, the fuse, buffs, arrival or score beyond activation',
    (id) => {
      const g = game(),
        p = g.state.arena!.players[0],
        now = g.state.now
      if (id === 'ECHO') {
        g.state.aliens[0].holderSeatId = 1
        g.state.aliens.push({ id: 'ECHO', holderSeatId: 0, turn: 4, readyAt: now + 0.6, heldSince: now - 1 })
      }
      p.frozenUntil = now + 2
      p.immuneUntil = now + 3
      p.invisibleUntil = now + 10
      p.turboUntil = now + 12
      p.vaccinatedUntil = now + 8
      const before = { ...p },
        aliens = g.state.aliens.map((a) => ({ ...a })),
        deadline = g.state.fuseEndsAt
      const score = g.state.seats[0].heat,
        passes = g.state.seats[0].successfulPasses
      expect(g.activate(0, 'chaos', id).accepted).toBe(true)
      expect(g.state.aliens).toEqual(aliens)
      expect(g.state.fuseEndsAt).toBe(deadline)
      expect(p).toMatchObject({
        frozenUntil: before.frozenUntil,
        immuneUntil: before.immuneUntil,
        invisibleUntil: before.invisibleUntil,
        turboUntil: before.turboUntil,
        vaccinatedUntil: before.vaccinatedUntil,
        touchedThisRound: before.touchedThisRound,
        yaw: before.yaw,
        teleportRevision: 1
      })
      expect(g.snapshot(0).arena!.players[0].teleportRevision).toBe(1)
      expect(g.state.seats[0].heat).toBe(score + 1)
      expect(g.state.seats[0].successfulPasses).toBe(passes)
      expect(g.activate(0, 'chaos', id).accepted).toBe(false)
      expect(p.teleportRevision).toBe(1)
      expect(g.state.seats[0].heat).toBe(score + 1)
    }
  )
  it('consumes and advances immediately, permits ordering but preserves the ordinary activation cooldown', () => {
    const g = game()
    expect(g.activate(0, 'chaos', 'ORIGINAL').accepted).toBe(true)
    expect(g.state.seats[0].hand.find((c) => c.id === 'chaos')!.state).toBe('SPENT')
    expect(g.state.seats[0].hand.find((c) => c.id === 'freeze')!.state).toBe('ARMED')
    expect(g.orderDeck(0, ['skip', 'freeze']).accepted).toBe(true)
    expect(g.activate(0, 'skip', 'ORIGINAL').accepted).toBe(false)
    g.advance(1.21)
    expect(g.activate(0, 'skip', 'ORIGINAL').accepted).toBe(true)
  })
  it('does not collect coins or powers along the jump; contact at the destination still works', () => {
    const g = game(),
      p = g.state.arena!.players[0]
    const end = chaosDestination(g.state.seed, 0, p, g.state.arena!.players.slice(1))!
    const mid = { x: (p.x + end.x) / 2, z: (p.z + end.z) / 2 }
    g.state.arena!.coins = [{ id: 'mid', ...mid }]
    g.state.arena!.powers = [{ id: 'mid-turbo', type: 'TURBO', ...mid, opensAt: g.state.now }]
    g.activate(0, 'chaos', 'ORIGINAL')
    expect({ x: p.x, z: p.z }).toEqual(end)
    g.advance(0.05)
    expect(g.state.arena!.coins.map((c) => c.id)).toEqual(['mid'])
    expect(g.state.arena!.powers!.map((c) => c.id)).toEqual(['mid-turbo'])
    expect(g.state.seats[0].heat).toBe(1)
    g.state.arena!.coins.push({ id: 'destination', ...end })
    g.advance(0.05)
    expect(g.state.arena!.coins.map((c) => c.id)).toEqual(['mid'])
    expect(g.state.seats[0].heat).toBe(2)
  })
  it('invalidates the pre-teleport recipient hint and cannot throw across the map via an old edge cache', () => {
    const g = game(),
      players = g.state.arena!.players
    players[1].x = 10.1
    players[1].z = 10
    for (const p of players.slice(2)) p.immuneUntil = g.state.now + 10
    g.advance(0.05)
    expect(g.snapshot(0).arena!.throwReady).toBe(true)
    g.activate(0, 'chaos', 'ORIGINAL')
    expect(g.snapshot(0).arena!.throwReady).toBe(false)
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(false)
    expect(g.state.seats[0].heat).toBe(1)
  })
  it('preserves same-alien anti-return protection after teleporting', () => {
    const g = game(),
      players = g.state.arena!.players
    g.state.aliens[0].holderSeatId = 1
    players[1].x = 10.5
    players[1].z = 10
    expect(g.pass(1, 'ORIGINAL', 0).accepted).toBe(true)
    expect(g.activate(0, 'chaos', 'ORIGINAL').accepted).toBe(true)
    players[1].x = players[0].x + 0.5
    players[1].z = players[0].z
    g.advance(1.1)
    expect(g.snapshot(0).arena!.returnBlockedUntil).toBeGreaterThan(g.state.now)
    expect(g.pass(0, 'ORIGINAL', 1).accepted).toBe(false)
    g.advance(1.41)
    expect(g.pass(0, 'ORIGINAL', 1).accepted).toBe(true)
  })
  it('does not disclose an invisible caster destination to ordinary opponents', () => {
    const g = game()
    g.state.arena!.players[0].invisibleUntil = g.state.now + 10
    expect(g.activate(0, 'chaos', 'ORIGINAL').accepted).toBe(true)
    expect(g.snapshot(1).arena!.players[0]).toMatchObject({ x: 0, z: 0 })
    const own = g.snapshot(0).arena!.players[0]
    expect(own.x).toBe(g.state.arena!.players[0].x)
    expect(own.z).toBe(g.state.arena!.players[0].z)
  })
  it('is locked during takeover and rejects without moving, consuming or scoring', () => {
    const g = game()
    g.state.fuseEndsAt = g.state.now + 0.01
    g.advance(0.02)
    const before = { ...g.state.arena!.players[0] },
      score = g.state.seats[0].heat
    expect(g.activate(0, 'chaos', 'ORIGINAL').accepted).toBe(false)
    expect(g.state.arena!.players[0]).toEqual(before)
    expect(g.state.seats[0].heat).toBe(score)
  })
  it('snaps the shared displayed pose on a new teleport revision, then resumes ordinary smoothing', () => {
    const g = game(),
      p = g.state.arena!.players[0],
      before = { x: p.x, z: p.z, yaw: p.yaw }
    g.activate(0, 'chaos', 'ORIGINAL')
    for (const fps of [30, 60, 120]) {
      const snapped = smoothChasePose(before, p, 1 / fps)
      expect(snapped.x).toBe(p.x)
      expect(snapped.z).toBe(p.z)
      expect(snapped.teleportRevision).toBe(1)
      const next = smoothChasePose(snapped, { ...p, x: p.x + 0.1 }, 1 / fps)
      expect(next.x).toBeGreaterThan(p.x)
      expect(next.x).toBeLessThan(p.x + 0.1)
    }
    expect(projectChasePlayer(p, undefined, g.state.now, 0).teleportRevision).toBe(1)
  })
  it('does not require a destination or target in the current-card client action', () => {
    const source = readFileSync('src/client/gameClient.ts', 'utf8')
    const action = source.slice(
      source.indexOf('export function requestCurrentCard()'),
      source.indexOf('export function requestContainmentTap')
    )
    expect(action).not.toContain('targetSeatId')
    expect(action).not.toContain("card.type === 'CHAOS'")
    expect(action).toContain('requestActivateCard(card.id)')
  })
})

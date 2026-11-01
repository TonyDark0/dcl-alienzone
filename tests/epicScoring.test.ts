import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../src/config/gameConfig'
import type { AlienId, SeatId } from '../src/game/model/types'
import { CHASE_CONFIG } from '../src/game/rules/chase'
import { type ChaseCardType } from '../src/game/rules/chaseCards'
import { DECK_CARD_TYPES } from '../src/game/rules/loadouts'
import { isChaosSuccess, isVacuneSuccess } from '../src/game/rules/epicScoring'
import { ChaseMatchEngine } from '../src/game/runtime/chaseMatchEngine'

function start() {
  const g = new ChaseMatchEngine(42, 'epic-scoring', DECK_CARD_TYPES)
  g.join('human', 'PLAYER')
  g.ready()
  g.advance(
    GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds + CHASE_CONFIG.deckSetupSeconds
  )
  for (const s of g.state.seats) {
    s.isBot = false
    s.hand = []
  }
  for (const p of g.state.arena!.players) Object.assign(p, { x: 2 + p.seatId * 3, z: 22 })
  Object.assign(g.state.arena!.players[0], { x: 10, z: 10, yaw: Math.PI / 2 })
  g.state.arena!.coins = []
  g.state.arena!.powers = []
  Object.assign(g.state.aliens[0], { holderSeatId: 0, readyAt: g.state.now })
  return g
}
function give(g: ChaseMatchEngine, owner: SeatId, type: ChaseCardType) {
  const card = { id: `test-${owner}-${type}-${g.state.sequence}`, type, state: 'ARMED' as const }
  g.state.seats[owner].hand = [card]
  return card
}
function activate(g: ChaseMatchEngine, owner: SeatId, type: ChaseCardType) {
  const card = give(g, owner, type)
  expect(g.activate(owner, card.id, 'ORIGINAL').accepted).toBe(true)
  return card
}
function echoPickup(g: ChaseMatchEngine, owner: SeatId) {
  const p = g.state.arena!.players[owner]
  g.state.arena!.powers = [{ id: 'echo', type: 'DUPLICATE', x: p.x, z: p.z, opensAt: g.state.now }]
  g.advance(0.05)
}
function near(g: ChaseMatchEngine, target: SeatId, source: SeatId = 0) {
  const p = g.state.arena!.players
  Object.assign(p[target], { x: p[source].x + 0.6, z: p[source].z })
}
const vacuneAwards = (g: ChaseMatchEngine) =>
  g.state.events.filter((e) => e.kind === 'REACTION_RESOLVED' && e.cardType === 'VACUNE')

describe('pure Epic success conditions', () => {
  const followup = { alienId: 'ORIGINAL' as const, turn: 4, round: 1, activatedAt: 10 }
  it.each([0, 0.25, 2.999, 3])('accepts a matching Chaos transfer after %ss', (elapsed) => {
    expect(isChaosSuccess(followup, { id: 'ORIGINAL', turn: 4 }, 1, 10 + elapsed)).toBe(true)
  })
  it('rejects late, stale, different-alien, different-round, missing and backwards-time matches', () => {
    const alien = { id: 'ORIGINAL' as const, turn: 4 }
    expect(isChaosSuccess(followup, alien, 1, 13.001)).toBe(false)
    expect(isChaosSuccess(followup, { ...alien, turn: 5 }, 1, 11)).toBe(false)
    expect(isChaosSuccess(followup, { ...alien, id: 'ECHO' }, 1, 11)).toBe(false)
    expect(isChaosSuccess(followup, alien, 2, 11)).toBe(false)
    expect(isChaosSuccess(undefined, alien, 1, 11)).toBe(false)
    expect(isChaosSuccess(followup, alien, 1, 9)).toBe(false)
  })
  it.each(['FREEZE', 'DUPLICATE'] as const)('qualifies a foreign %s for an unclaimed active Vacune', (type) => {
    expect(isVacuneSuccess({ seatId: 1, vaccinatedUntil: 20 }, 0, type, 10, true)).toBe(true)
  })
  it.each(['INVISIBLE', 'SHADOW', 'CHAOS', 'SKIP', 'SYMBIOSIS', 'VACUNE', 'TURBO', 'HIDDEN_WATCH'] as const)(
    'does not count %s as an immune activation',
    (type) => expect(isVacuneSuccess({ seatId: 1, vaccinatedUntil: 20 }, 0, type, 10, true)).toBe(false)
  )
  it('rejects own activations, expiry and an already claimed vaccine', () => {
    const owner = { seatId: 1 as const, vaccinatedUntil: 20 }
    expect(isVacuneSuccess(owner, 1, 'FREEZE', 10, true)).toBe(false)
    expect(isVacuneSuccess(owner, 0, 'FREEZE', 20, true)).toBe(false)
    expect(isVacuneSuccess(owner, 0, 'FREEZE', 21, true)).toBe(false)
    expect(isVacuneSuccess(owner, 0, 'FREEZE', 10, false)).toBe(false)
  })
})

describe('Vacune activation + one foreign immunity success', () => {
  it('awards +1 then +1 on accepted foreign Freeze, never again for repeated/replayed Freeze or Echo', () => {
    const g = start()
    activate(g, 1, 'VACUNE')
    expect(g.state.seats[1].heat).toBe(1)
    const freeze = activate(g, 0, 'FREEZE')
    expect(g.state.seats[1].heat).toBe(2)
    expect(g.state.arena!.players[1].frozenUntil).toBe(0)
    expect(g.activate(0, freeze.id, 'ORIGINAL').accepted).toBe(false)
    g.advance(1.21)
    activate(g, 0, 'FREEZE')
    echoPickup(g, 0)
    expect(g.state.aliens.some((a) => a.id === 'ECHO')).toBe(true)
    expect(g.state.seats[1].heat).toBe(2)
    expect(vacuneAwards(g)).toHaveLength(1)
    expect(vacuneAwards(g)[0]).toMatchObject({ heat: 1, path: [1], cardType: 'VACUNE' })
  })
  it('qualifies accepted foreign Echo activation even though the vaccine excludes its owner as a recipient', () => {
    const g = start()
    activate(g, 1, 'VACUNE')
    echoPickup(g, 0)
    expect(g.state.seats[1].heat).toBe(2)
    expect(g.state.aliens.find((a) => a.id === 'ECHO')!.holderSeatId).not.toBe(1)
    expect(vacuneAwards(g)).toHaveLength(1)
    expect(vacuneAwards(g)[0].alienId).toBe('ECHO')
    activate(g, 2, 'FREEZE')
    expect(g.state.seats[1].heat).toBe(2)
  })
  it('does not award the bonus for collecting your own Echo, but still grants the ordinary pickup point', () => {
    const g = start()
    activate(g, 1, 'VACUNE')
    echoPickup(g, 1)
    expect(g.state.seats[1].heat).toBe(2)
    expect(vacuneAwards(g)).toHaveLength(0)
    activate(g, 0, 'FREEZE')
    expect(g.state.seats[1].heat).toBe(3)
    expect(vacuneAwards(g)).toHaveLength(1)
  })
  it('does not score an unconsumed Echo with no eligible recipient or a rejected activation', () => {
    const g = start()
    activate(g, 1, 'VACUNE')
    for (const p of g.state.arena!.players) if (p.seatId > 0) p.immuneUntil = g.state.fuseEndsAt
    echoPickup(g, 0)
    expect(g.state.arena!.powers).toHaveLength(1)
    expect(g.state.aliens).toHaveLength(1)
    expect(g.state.seats[1].heat).toBe(1)
    expect(g.activate(0, 'missing', 'ORIGINAL').accepted).toBe(false)
    expect(vacuneAwards(g)).toHaveLength(0)
  })
  it('does not score Invisible, Shadow, earlier Freeze, own Freeze or an expired vaccine', () => {
    const g = start()
    activate(g, 0, 'FREEZE')
    activate(g, 1, 'VACUNE')
    expect(g.state.arena!.players[1].frozenUntil).toBe(0)
    activate(g, 2, 'INVISIBLE')
    activate(g, 3, 'SHADOW')
    expect(g.state.seats[1].heat).toBe(1)
    g.advance(1.21)
    activate(g, 1, 'FREEZE')
    expect(g.state.seats[1].heat).toBe(2) // Two activations, not vaccine success.
    expect(vacuneAwards(g)).toHaveLength(0)
    g.state.arena!.players[1].vaccinatedUntil = g.state.now
    activate(g, 4, 'FREEZE')
    expect(g.state.seats[1].heat).toBe(2)
    expect(vacuneAwards(g)).toHaveLength(0)
  })
  it('resolves each active vaccine independently, once', () => {
    const g = start()
    activate(g, 1, 'VACUNE')
    activate(g, 2, 'VACUNE')
    activate(g, 0, 'FREEZE')
    expect(g.state.seats[1].heat).toBe(2)
    expect(g.state.seats[2].heat).toBe(2)
    expect(vacuneAwards(g).map((e) => e.path[0])).toEqual([1, 2])
  })
  it('does not score a rejected incoming Echo throw as a new Echo activation', () => {
    const g = start()
    activate(g, 1, 'VACUNE')
    g.state.aliens.push({ id: 'ECHO', holderSeatId: 2, readyAt: g.state.now, heldSince: g.state.now, turn: 0 })
    near(g, 1, 2)
    expect(g.pass(2, 'ECHO', 0).accepted).toBe(false)
    expect(g.state.seats[1].heat).toBe(1)
    expect(vacuneAwards(g)).toHaveLength(0)
  })
  it('clears pending success at takeover, including the final attack', () => {
    for (const round of [1, 3]) {
      const g = start()
      g.state.round = round
      activate(g, 1, 'VACUNE')
      g.state.fuseEndsAt = g.state.now + 0.01
      g.advance(0.02)
      const points = g.state.seats[1].heat
      expect(g.state.arena!.players[1].vaccinatedUntil).toBe(0)
      expect(g.activate(0, give(g, 0, 'FREEZE').id, 'ORIGINAL').accepted).toBe(false)
      expect(g.state.seats[1].heat).toBe(points)
      expect(vacuneAwards(g)).toHaveLength(0)
      if (round === 1) {
        g.advance(GAME_CONFIG.takeoverSequenceSeconds)
        g.state.arena!.coins = []
        g.state.arena!.powers = []
        // An orphaned immunity timestamp cannot resurrect last round's pending reward.
        g.state.arena!.players[1].vaccinatedUntil = g.state.fuseEndsAt
        const before = g.state.seats[1].heat
        activate(g, 0, 'FREEZE')
        expect(g.state.seats[1].heat).toBe(before)
      }
    }
  })
})

describe('Chaos success reuses the existing transfer point', () => {
  it.each(['ORIGINAL', 'ECHO'] as AlienId[])('counts a timely %s throw as the second point, not a third', (id) => {
    const g = start()
    if (id === 'ECHO') {
      g.state.aliens[0].holderSeatId = 2
      g.state.aliens.push({ id, holderSeatId: 0, turn: 4, readyAt: g.state.now, heldSince: g.state.now })
    }
    const alien = g.state.aliens.find((a) => a.id === id)!
    activate(g, 0, 'CHAOS')
    expect(g.state.seats[0].heat).toBe(1)
    expect(g.pass(0, id, alien.turn).accepted).toBe(false)
    near(g, 1)
    g.advance(0.05)
    const turn = alien.turn
    expect(g.pass(0, id, turn).accepted).toBe(true)
    expect(g.state.seats[0].heat).toBe(2)
    expect(g.state.seats[0].successfulPasses).toBe(1)
    expect(g.state.events.filter((e) => e.kind === 'PASS').at(-1)).toMatchObject({ heat: 1, cardType: 'CHAOS' })
    expect(g.pass(0, id, turn).accepted).toBe(false)
    expect(g.state.seats[0].heat).toBe(2)
  })
  it.each([3, 3.001])('keeps the ordinary throw point at %ss, tagging Chaos only within the window', (elapsed) => {
    const g = start()
    activate(g, 0, 'CHAOS')
    g.advance(elapsed)
    near(g, 1)
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(true)
    expect(g.state.seats[0].heat).toBe(2)
    expect(g.state.events.filter((e) => e.kind === 'PASS').at(-1)?.cardType).toBe(elapsed <= 3 ? 'CHAOS' : undefined)
  })
  it('does not count an alien acquired after teleporting without one', () => {
    const g = start()
    g.state.aliens[0].holderSeatId = 2
    activate(g, 0, 'CHAOS')
    near(g, 2)
    expect(g.pass(2, 'ORIGINAL', 0).accepted).toBe(true)
    g.advance(1.1)
    near(g, 1)
    expect(g.pass(0, 'ORIGINAL', 1).accepted).toBe(true)
    expect(g.state.seats[0].heat).toBe(2)
    expect(g.state.events.filter((e) => e.kind === 'PASS').at(-1)?.cardType).toBeUndefined()
  })
  it('does not treat a decoy hit as a successful transfer; a later real throw can qualify', () => {
    const g = start()
    activate(g, 0, 'CHAOS')
    near(g, 1)
    activate(g, 1, 'SHADOW')
    Object.assign(g.state.arena!.players[1], { x: 29, z: 23 })
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(true)
    expect(g.state.aliens[0].holderSeatId).toBe(0)
    expect(g.state.seats[0].heat).toBe(1)
    expect(g.state.seats[1].heat).toBe(2)
    g.advance(1.05)
    near(g, 2)
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(true)
    expect(g.state.seats[0].heat).toBe(2)
    expect(g.state.events.filter((e) => e.kind === 'PASS').at(-1)?.cardType).toBe('CHAOS')
  })
  it('does not multiply a transfer point when Symbiosis also completes Chaos', () => {
    const g = start()
    activate(g, 0, 'CHAOS')
    g.advance(1.21)
    near(g, 1)
    g.state.arena!.players[0].yaw = Math.PI / 2
    activate(g, 0, 'SYMBIOSIS')
    expect(g.state.seats[0].heat).toBe(3) // Two activations + exactly one transfer.
    const pass = g.state.events.filter((e) => e.kind === 'PASS').at(-1)!
    expect(pass).toMatchObject({ heat: 1, cardType: 'SYMBIOSIS' })
    expect(pass.message).toContain('CHAOS + SYMBIOSIS SUCCESS')
    expect(g.state.seats[0].successfulPasses).toBe(1)
  })
})

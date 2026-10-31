import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../src/config/gameConfig'
import { ChaseMatchEngine } from '../src/game/runtime/chaseMatchEngine'
import { cardCategory, type CardSlotState, type SeatId } from '../src/game/model/types'
import { CHASE_CARD_TYPES, type ChaseCardType } from '../src/game/rules/chaseCards'
import { CHASE_CONFIG } from '../src/game/rules/chase'

function game(seed = 71, allCards = true) {
  const g = allCards ? new ChaseMatchEngine(seed, `chase-${seed}`, CHASE_CARD_TYPES) : new ChaseMatchEngine(seed)
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
    p.x = 10 + (p.seatId % 4) * 4
    p.z = p.seatId < 4 ? 10 : 22
    p.touchedThisRound = false
  }
  const alien = g.state.aliens[0]
  alien.holderSeatId = 0
  alien.readyAt = g.state.now
  g.state.arena!.players[0].touchedThisRound = true
  return g
}
function give(g: ChaseMatchEngine, seatId: SeatId, type: ChaseCardType, target?: SeatId) {
  const card: CardSlotState = { id: `test-${type}-${g.state.seats[seatId].hand.length}`, type, state: 'AVAILABLE' }
  g.state.seats[seatId].hand.push(card)
  expect(g.equip(seatId, card.id, cardCategory(type), target).accepted).toBe(true)
  return card
}
function contact(g: ChaseMatchEngine, source: SeatId = 0, target: SeatId = 1) {
  const players = g.state.arena!.players
  players[source].x = 16
  players[source].z = 16
  players[target].x = 17.05
  players[target].z = 16
  g.moveInput(source, 1, 0, 100)
  g.advance(0.1)
  const alien = g.state.aliens.find((candidate) => candidate.holderSeatId === source)
  if (alien) g.pass(source, alien.id, alien.turn)
}
describe('authoritative running tags', () => {
  it('exposes only accepted live inputs for forecast, withholding invisible enemies', () => {
    const g = game()
    expect(g.steerInput(0, 1, 1, 1).accepted).toBe(true)
    expect(g.steerInput(1, 1, -1, 1).accepted).toBe(true)
    g.state.arena!.players[1].invisibleUntil = g.state.now + 10
    const snapshot = g.snapshot(0)
    expect(snapshot.arena!.motion).toHaveLength(1)
    expect(snapshot.arena!.motion![0]).toMatchObject({ seatId: 0, x: 1, z: 1, steering: true })
    expect(g.snapshot(1).arena!.motion).toHaveLength(2)
    g.advance(0.5)
    expect(g.snapshot(0).arena!.motion).toEqual([])
  })
  it('clears forecast inputs at takeover, never extending the match through presentation', () => {
    const g = game()
    g.steerInput(0, 1, 1, 1)
    g.state.fuseEndsAt = g.state.now + 0.05
    g.advance(0.1)
    expect(g.state.phase).toBe('TAKEOVER')
    expect(g.snapshot(0).arena!.motion).toEqual([])
  })
  it('requires an explicit throw in range for +1 without resetting the fuse', () => {
    const g = game(),
      deadline = g.state.fuseEndsAt
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(false)
    contact(g)
    expect(g.state.aliens[0].holderSeatId).toBe(1)
    expect(g.state.seats[0].heat).toBe(1)
    expect(g.state.seats[0].successfulPasses).toBe(1)
    expect(g.state.fuseEndsAt).toBe(deadline)
  })
  it('does not ping-pong merely by touching, even after arrival grace expires', () => {
    const g = game()
    contact(g)
    for (let i = 0; i < 20; i++) {
      g.moveInput(1, -1, 0, 200 + i)
      g.advance(0.1)
    }
    expect(g.state.aliens[0].turn).toBe(1)
    expect(g.state.seats.reduce((sum, seat) => sum + seat.heat, 0)).toBe(1)
  })
  it('normalizes malicious speed, rejects invalid/reordered intents and expires stale input', () => {
    const g = game(),
      p = g.state.arena!.players[0],
      x = p.x
    expect(g.moveInput(0, Infinity, 0, 0).accepted).toBe(false)
    expect(g.moveInput(0, 100000, 0, 1).accepted).toBe(true)
    expect(g.moveInput(0, -1, 0, 1).accepted).toBe(false)
    g.advance(1)
    expect(p.x - x).toBeLessThanOrEqual(3.2 * 0.4 + 0.001)
    const stopped = p.x
    g.advance(1)
    expect(p.x).toBe(stopped)
  })
  it('never gives both aliens to the same astronaut', () => {
    const g = game()
    g.state.aliens.push({ id: 'ECHO', holderSeatId: 1, heldSince: g.state.now, readyAt: g.state.now, turn: 0 })
    contact(g)
    expect(g.state.aliens.map((a) => a.holderSeatId)).toEqual([0, 1])
  })
})
describe('running power semantics', () => {
  it('Freeze slows only others for 2s, restores normal speed and never changes the fuse', () => {
    const g = game(),
      now = g.state.now,
      deadline = g.state.fuseEndsAt
    const card = give(g, 0, 'FREEZE')
    expect(g.activate(0, card.id, 'ORIGINAL').accepted).toBe(true)
    expect(g.state.arena!.players[0].frozenUntil).toBe(0)
    expect(g.state.arena!.players.slice(1).every((p) => p.frozenUntil === now + 2)).toBe(true)
    g.moveInput(1, 1, 0, 1)
    const x = g.state.arena!.players[1].x
    g.advance(0.2)
    expect(g.state.arena!.players[1].x - x).toBeCloseTo(3.2 * 0.5 * 0.2)
    expect(g.state.fuseEndsAt).toBe(deadline)
    expect(card.state).toBe('SPENT')
    g.advance(1.9)
    const afterFreeze = g.state.arena!.players[1].x
    g.moveInput(1, 1, 0, 2)
    g.advance(0.1)
    expect(g.state.arena!.players[1].x - afterFreeze).toBeCloseTo(3.2 * 0.1)
    expect(g.state.fuseEndsAt).toBe(deadline)
  })
  it('Skip grants 3s immunity and +1 only on accepted activation, not while loaded', () => {
    const g = game(),
      card = give(g, 1, 'SKIP'),
      now = g.state.now
    expect(g.state.arena!.players[1].immuneUntil).toBe(0)
    expect(g.activate(1, card.id, 'ORIGINAL').accepted).toBe(true)
    expect(g.state.arena!.players[1].immuneUntil).toBe(now + 3)
    contact(g)
    expect(g.state.aliens[0].holderSeatId).toBe(0)
    expect(g.state.seats[1].heat).toBe(1)
    g.advance(3)
    expect(card.state).toBe('SPENT')
  })
  it('Invisible lasts 10s, conceals remote coordinates and hand, but does not grant immunity', () => {
    const g = game(),
      card = give(g, 1, 'INVISIBLE'),
      now = g.state.now
    g.activate(1, card.id, 'ORIGINAL')
    expect(g.state.arena!.players[1].invisibleUntil).toBe(now + 10)
    expect(g.snapshot(0).arena!.players[1]).toMatchObject({ x: 0, z: 0 })
    expect(g.snapshot(0).seats[1].hand).toHaveLength(0)
    expect(g.snapshot(1).arena!.players[1].x).not.toBe(0)
    contact(g)
    expect(g.state.aliens[0].holderSeatId).toBe(1)
    g.advance(10)
    expect(card.state).toBe('SPENT')
  })
  it('Chaos arms without a target, locks the queue and redirects the next incoming alien once', () => {
    const g = game(),
      card = give(g, 1, 'CHAOS')
    expect(g.activate(1, card.id, 'ORIGINAL').accepted).toBe(true)
    expect(card.state).toBe('ACTIVE')
    expect(g.orderDeck(1, []).accepted).toBe(false)
    expect(g.state.aliens[0].holderSeatId).toBe(0)
    contact(g)
    expect([0, 1]).not.toContain(g.state.aliens[0].holderSeatId)
    expect(card.state).toBe('SPENT')
    expect(g.state.seats[1].heat).toBe(2)
    expect(g.activate(1, card.id, 'ORIGINAL').accepted).toBe(false)
  })
  it('Chaos waits if every random destination is protected, without creating a loop', () => {
    const g = game()
    for (const p of g.state.arena!.players.slice(2)) p.immuneUntil = g.state.now + 2
    const card = give(g, 1, 'CHAOS')
    g.activate(1, card.id, 'ORIGINAL')
    contact(g)
    expect(card.state).toBe('ACTIVE')
    expect(g.state.aliens[0].holderSeatId).toBe(1)
    g.advance(2.1)
    expect(card.state).toBe('SPENT')
    expect([0, 1]).not.toContain(g.state.aliens[0].holderSeatId)
  })
  it('Echo spawns on a different eligible player, shares the fuse and remains globally unique', () => {
    const g = game(),
      card = give(g, 3, 'DUPLICATE'),
      deadline = g.state.fuseEndsAt
    expect(g.activate(3, card.id, 'ORIGINAL').accepted).toBe(false)
    const collector = g.state.arena!.players[3]
    g.state.arena!.powers = [
      { id: 'echo-test', type: 'DUPLICATE', x: collector.x, z: collector.z, opensAt: g.state.now }
    ]
    g.advance(0.05)
    expect(g.state.aliens).toHaveLength(2)
    expect([0, 3]).not.toContain(g.state.aliens[1].holderSeatId)
    const other = give(g, 4, 'DUPLICATE')
    expect(g.activate(4, other.id, 'ORIGINAL').accepted).toBe(false)
    expect(other.state).toBe('ARMED')
    expect(g.state.fuseEndsAt).toBe(deadline)
  })
  it('Hidden Watch retains 6s without affecting movement or the round clock', () => {
    const g = game(),
      card = give(g, 2, 'HIDDEN_WATCH'),
      now = g.state.now
    g.activate(2, card.id, 'ORIGINAL')
    expect(g.state.seats[0].hiddenUntil).toBe(now + 6)
    expect(g.snapshot(0).fuseEndsAt).toBe(0)
  })
  it('locked rares cannot be granted by a forged load/activate request', () => {
    const g = game(5, false),
      card = give(g, 0, 'CHAOS', 3)
    expect(g.activate(0, card.id, 'ORIGINAL').accepted).toBe(false)
    expect(card.state).toBe('ARMED')
  })
})
describe('running round lifecycle', () => {
  it('Turbo is a board-only pickup lasting the remaining round at 2x and clears at takeover', () => {
    const g = game(),
      card = give(g, 0, 'TURBO'),
      now = g.state.now
    const p = g.state.arena!.players[0]
    p.x = p.z = 16
    p.yaw = 0
    expect(g.activate(0, card.id, 'ORIGINAL').accepted).toBe(false)
    g.state.arena!.powers = [{ id: 'turbo-test', type: 'TURBO', x: p.x, z: p.z, opensAt: now }]
    g.advance(0.05)
    expect(p.turboUntil).toBe(g.state.fuseEndsAt)
    g.steerInput(0, 1, 0, 1)
    g.advance(0.1)
    expect(p.z - 16).toBeCloseTo(3.2 * 2 * 0.1)
    expect(card.state).toBe('ARMED')
    g.state.fuseEndsAt = g.state.now + 0.01
    g.advance(0.02)
    expect(p.turboUntil).toBe(0)
  })
  it('allows the final containment bonus before results without restoring a takeover penalty', () => {
    const g = game()
    for (let round = 1; round <= 3; round++) {
      g.state.aliens[0].holderSeatId = 0
      g.state.arena!.players[0].touchedThisRound = true
      const before = g.state.seats[0].heat
      g.state.fuseEndsAt = g.state.now + 0.01
      g.advance(0.02)
      expect(g.state.seats[0].heat).toBe(before)
      const challenge = g.state.containment!
      for (let index = 0; index < 3; index++) {
        const opens = challenge.startedAt + 0.4 + index * 0.72
        g.advance(opens - g.state.now + 0.001)
        expect(g.containmentTap(0, challenge.id, index).accepted).toBe(true)
      }
      g.advance(challenge.startedAt + 5.01 - g.state.now)
      expect(g.state.seats[0].heat).toBe(before + 1)
    }
    expect(g.state.phase).toBe('MATCH_RESULT')
    expect(g.state.containment?.bonusAwarded).toBe(true)
    expect(g.state.containment?.contained).toBe(false)
  })
  it('expires a prior movement stream and accepts fresh controls after reconnect', () => {
    const g = game()
    g.moveInput(0, 1, 0, 1000)
    g.disconnect('human')
    expect(g.state.seats[0].isBot).toBe(true)
    expect(g.join('human', 'RETURNING')).toBe(0)
    expect(g.moveInput(0, -1, 0, 1).accepted).toBe(true)
    g.resetMovementInput(0)
    expect(g.moveInput(0, 0, 1, 1).accepted).toBe(true)
  })
  it('a finite cycle of active Chaos cards resolves once per card, without a server loop', () => {
    const g = game()
    const a = give(g, 1, 'CHAOS', 2),
      b = give(g, 2, 'CHAOS', 1)
    for (const p of g.state.arena!.players.slice(3)) p.immuneUntil = g.state.now + 5
    g.activate(1, a.id, 'ORIGINAL')
    g.activate(2, b.id, 'ORIGINAL')
    contact(g)
    expect(a.state).toBe('SPENT')
    expect(b.state).toBe('SPENT')
    expect(g.state.aliens[0].holderSeatId).toBe(0)
    expect(g.state.aliens[0].turn).toBe(3)
  })
  it('awards untouched once per round, no -5 penalty, removes Echo and clears timed effects', () => {
    const g = game()
    g.state.seats[0].heat = 4
    g.state.aliens.push({ id: 'ECHO', holderSeatId: 1, heldSince: g.state.now, readyAt: g.state.now, turn: 0 })
    g.state.arena!.players[1].touchedThisRound = true
    g.state.arena!.players[2].invisibleUntil = g.state.now + 10
    g.state.fuseEndsAt = g.state.now + 0.01
    g.advance(0.02)
    expect(g.state.phase).toBe('TAKEOVER')
    expect(g.state.seats[0].heat).toBe(4)
    expect(g.state.seats[1].heat).toBe(0)
    expect(g.state.seats.slice(2).every((s) => s.heat === 1)).toBe(true)
    expect(g.state.aliens).toHaveLength(1)
    expect(g.state.arena!.players[2].invisibleUntil).toBe(0)
    g.advance(0.5)
    expect(g.state.seats[2].heat).toBe(1)
  })
  it('a one-human match with bots finishes exactly 3 takeovers deterministically', () => {
    const run = () => {
      const g = new ChaseMatchEngine(35)
      g.join('human', 'PLAYER')
      g.ready()
      g.advance(130)
      expect(g.state.phase).toBe('MATCH_RESULT')
      expect(g.state.takeovers).toBe(3)
      expect(g.state.seats.flatMap((s) => s.hand).some((c) => c.type === 'CHAOS' || c.type === 'DUPLICATE')).toBe(false)
      expect(g.state.seats.reduce((n, s) => n + s.successfulPasses, 0)).toBeGreaterThan(0)
      return g.state
    }
    expect(run()).toEqual(run())
  })
  it('keeps a targeted snapshot below the transport budget after a complete match', () => {
    const g = new ChaseMatchEngine(9, 'payload', CHASE_CARD_TYPES)
    g.join('human', 'PLAYER')
    g.ready()
    g.advance(130)
    const snapshot = g.snapshot(0)
    snapshot.events = snapshot.events.slice(-16)
    expect(new TextEncoder().encode(JSON.stringify(snapshot)).length).toBeLessThan(13 * 1024)
  })
  it('completes varied full-power bot simulations without invalid bounds or overlapping aliens', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const g = new ChaseMatchEngine(seed, `stress-${seed}`, CHASE_CARD_TYPES)
      g.join('human', 'PLAYER')
      g.ready()
      for (let step = 0; step < 520; step++) {
        g.advance(0.25)
        expect(new Set(g.state.aliens.map((a) => a.holderSeatId)).size).toBe(g.state.aliens.length)
        for (const p of g.state.arena!.players) {
          expect(
            p.x >= CHASE_CONFIG.minX && p.x <= CHASE_CONFIG.maxX && p.z >= CHASE_CONFIG.minZ && p.z <= CHASE_CONFIG.maxZ
          ).toBe(true)
        }
      }
      expect(g.state.phase).toBe('MATCH_RESULT')
      expect(g.state.takeovers).toBe(3)
    }
  })
})

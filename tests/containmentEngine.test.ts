import { describe, expect, it } from 'vitest'

import { GAME_CONFIG } from '../src/config/gameConfig'
import type { SeatId } from '../src/game/model/types'
import { containmentTargetOpensAt, type ContainmentChallenge } from '../src/game/rules/containment'
import { MatchEngine } from '../src/game/runtime/matchEngine'
import { ActionGate } from '../src/server/actionGate'

function startGame(seed = 17) {
  const game = new MatchEngine(seed, `containment-test-${seed}`)
  for (let seat = 0; seat < 8; seat++) game.join(`human-${seat}`, `PLAYER ${seat}`)
  game.ready()
  game.advance(GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds + 0.1)
  return game
}

function attack(game: MatchEngine, victim = 0 as SeatId): ContainmentChallenge {
  const original = game.state.aliens.find((alien) => alien.id === 'ORIGINAL')!
  original.holderSeatId = victim
  game.state.fuseEndsAt = game.state.now + 0.05
  game.advance(0.05)
  expect(game.state.phase).toBe('TAKEOVER')
  return game.state.containment!
}

function tap(game: MatchEngine, challenge: ContainmentChallenge, index: number) {
  game.advance(Math.max(0, containmentTargetOpensAt(challenge, index) + 0.2 - game.state.now))
  return game.containmentTap(challenge.victimSeatId, challenge.id, index)
}

function resolve(game: MatchEngine, challenge: ContainmentChallenge) {
  game.advance(Math.max(0, challenge.startedAt + 4.3 - game.state.now))
}

function nextRound(game: MatchEngine) {
  game.advance(Math.max(0, game.state.phaseEndsAt - game.state.now) + 0.01)
}

describe('authoritative takeover challenge', () => {
  it('retains the original -5 penalty and awards exactly +1 after three valid hits', () => {
    const game = startGame()
    game.state.seats[0].heat = 10
    const challenge = attack(game)
    expect(game.state.seats[0].heat).toBe(5)
    for (let index = 0; index < 3; index++) expect(tap(game, challenge, index).accepted).toBe(true)
    expect(game.state.seats[0].heat).toBe(5)
    resolve(game, challenge)
    expect(game.state.seats[0].heat).toBe(6)
    expect(challenge).toMatchObject({ resolved: true, bonusAwarded: true, contained: true })
    game.advance(0.2)
    expect(game.state.seats[0].heat).toBe(6)
    expect(game.state.events.filter((event) => event.kind === 'CONTAINMENT')).toHaveLength(1)
    expect(game.state.seats[0].successfulPasses).toBe(0)
  })

  it.each([0, 1, 2])('awards no bonus for %s hits but still contains the first attack', (hits) => {
    const game = startGame()
    const challenge = attack(game)
    for (let index = 0; index < hits; index++) tap(game, challenge, index)
    resolve(game, challenge)
    expect(challenge.bonusAwarded).toBe(false)
    expect(challenge.contained).toBe(true)
    expect(game.state.seats[0].heat).toBe(0)
    nextRound(game)
    expect(game.state.phase).toBe('HOLDING')
    expect(game.state.round).toBe(2)
    expect(game.state.containment).toBeNull()
  })

  it('rejects other seats, stale challenges, premature taps, replays and non-takeover input', () => {
    const game = startGame()
    expect(game.containmentTap(0, 'fake', 0).accepted).toBe(false)
    const challenge = attack(game)
    expect(game.containmentTap(0, challenge.id, 0).accepted).toBe(false)
    game.advance(0.6)
    expect(game.containmentTap(1, challenge.id, 0).accepted).toBe(false)
    expect(game.containmentTap(0, `${challenge.id}:old`, 0).accepted).toBe(false)
    expect(game.containmentTap(0, challenge.id, 1).accepted).toBe(false)
    expect(game.containmentTap(0, challenge.id, 0).accepted).toBe(true)
    expect(game.containmentTap(0, challenge.id, 0).accepted).toBe(false)
    resolve(game, challenge)
    expect(game.containmentTap(0, challenge.id, 4).accepted).toBe(false)
    nextRound(game)
    expect(game.containmentTap(0, challenge.id, 0).accepted).toBe(false)
  })

  it('uses the authenticated seat and deduplicates action envelopes', () => {
    const game = startGame()
    const challenge = attack(game)
    game.advance(0.6)
    const gate = new ActionGate()
    const envelope = { clientActionId: 'target-0', matchId: game.state.matchId, round: game.state.round }
    const apply = (seat: SeatId) => game.containmentTap(seat, challenge.id, 0)
    expect(gate.run('stranger', envelope, game.state.matchId, game.state.round, null, apply).accepted).toBe(false)
    expect(gate.run('other', envelope, game.state.matchId, game.state.round, 1, apply).accepted).toBe(false)
    expect(gate.run('victim', envelope, game.state.matchId, game.state.round, 0, apply).accepted).toBe(true)
    expect(gate.run('victim', envelope, game.state.matchId, game.state.round, 0, apply).accepted).toBe(true)
    expect(challenge.hits.filter(Boolean)).toHaveLength(1)
  })

  it('ends the third round even after a perfect attempt and includes its bonus in results', () => {
    const game = startGame()
    for (let round = 1; round <= 3; round++) {
      const challenge = attack(game)
      for (let index = 0; index < 5; index++) tap(game, challenge, index)
      resolve(game, challenge)
      expect(challenge.bonusAwarded).toBe(true)
      expect(challenge.contained).toBe(round < 3)
      expect(game.state.seats[0].heat).toBe(1) // Each new attack still applies the original penalty.
      nextRound(game)
    }
    expect(game.state.phase).toBe('MATCH_RESULT')
    expect(game.snapshot(0).seats[0].heat).toBe(1)
    expect(game.state.takeovers).toBe(3)
    expect(game.containmentTap(0, game.state.containment!.id, 4).accepted).toBe(false)
  })

  it('ignoring every prompt never blocks the third-round ending', () => {
    const game = startGame()
    for (let round = 1; round <= 3; round++) {
      const challenge = attack(game)
      game.advance(5.01)
      expect(challenge).toMatchObject({ resolved: true, bonusAwarded: false, contained: round < 3 })
    }
    expect(game.state.phase).toBe('MATCH_RESULT')
  })

  it('neither changes card hands nor creates an Echo attack challenge', () => {
    const game = startGame()
    const hands = JSON.stringify(game.state.seats.map((seat) => seat.hand))
    game.state.aliens.push({ id: 'ECHO', holderSeatId: 1, heldSince: game.state.now, readyAt: game.state.now, turn: 0 })
    const challenge = attack(game)
    expect(challenge.victimSeatId).toBe(0)
    expect(game.state.aliens.map((alien) => alien.id)).toEqual(['ORIGINAL'])
    tap(game, challenge, 0)
    resolve(game, challenge)
    expect(JSON.stringify(game.state.seats.map((seat) => seat.hand))).toBe(hands)
    expect(game.containmentTap(1, challenge.id, 0).accepted).toBe(false)
  })

  it('bots use the same timed targets and threshold, with repeatable non-perfect performance', () => {
    const outcomes: number[] = []
    for (let seed = 1; seed <= 12; seed++) {
      const simulate = () => {
        const game = startGame(seed)
        game.state.seats[0].isBot = true
        const challenge = attack(game)
        resolve(game, challenge)
        expect(challenge.bonusAwarded).toBe(challenge.hits.filter(Boolean).length >= 3)
        return challenge.hits.filter(Boolean).length
      }
      const hits = simulate()
      expect(simulate()).toBe(hits)
      outcomes.push(hits)
    }
    expect(new Set(outcomes).size).toBeGreaterThan(1)
    expect(outcomes.some((hits) => hits < 5)).toBe(true)
  })
})

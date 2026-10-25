import { beforeEach, describe, expect, it } from 'vitest'

import { GAME_CONFIG } from '../src/config/gameConfig'
import type { CardSlotState } from '../src/game/model/types'
import { MatchEngine } from '../src/game/runtime/matchEngine'

let game: MatchEngine

function startGame() {
  game = new MatchEngine(17, 'test-match')
  expect(game.join('human', 'YOU')).toBe(0)
  expect(game.ready().accepted).toBe(true)
  game.advance(GAME_CONFIG.roomEntryCountdownSeconds)
  expect(game.state.phase).toBe('ROUND_START')
  game.advance(GAME_CONFIG.crewSeatingSequenceSeconds)
  expect(game.state.phase).toBe('HOLDING')
}

function giveDuplicate(): CardSlotState {
  const card = game.state.seats[0].hand.find(
    (candidate) =>
      candidate.type === 'CHAOS' ||
      candidate.type === 'HIDDEN_WATCH' ||
      candidate.type === 'FREEZE' ||
      candidate.type === 'DUPLICATE'
  )!
  card.type = 'DUPLICATE'
  card.state = 'AVAILABLE'
  return card
}

function spawnEcho() {
  const card = giveDuplicate()
  expect(game.equip(0, card.id, 'INTERVENTION').accepted).toBe(true)
  expect(game.activate(0, card.id, 'ORIGINAL').accepted).toBe(true)
  expect(game.state.aliens.map((alien) => alien.id).sort()).toEqual(['ECHO', 'ORIGINAL'])
}

describe('shared-clock ECHO alien', () => {
  beforeEach(startGame)

  it('can award hold POINTS but owns no attack clock', () => {
    spawnEcho()
    const original = game.state.aliens.find((alien) => alien.id === 'ORIGINAL')!
    const echo = game.state.aliens.find((alien) => alien.id === 'ECHO')!
    original.holderSeatId = 4
    echo.holderSeatId = 0
    echo.readyAt = game.state.now
    echo.heldSince = game.state.now - 2
    const before = game.state.seats[0].heat

    expect(game.pass(0, 'ECHO', echo.turn).accepted).toBe(true)
    expect(game.state.seats[0].heat).toBeGreaterThan(before)
    expect('fuseEndsAt' in echo).toBe(false)
  })

  it('skips an occupied seat before consuming that seat reaction', () => {
    spawnEcho()
    const original = game.state.aliens.find((alien) => alien.id === 'ORIGINAL')!
    const echo = game.state.aliens.find((alien) => alien.id === 'ECHO')!
    game.state.direction = 1
    original.holderSeatId = 1
    echo.holderSeatId = 0
    echo.readyAt = game.state.now
    echo.heldSince = game.state.now - 2
    const defense = game.state.seats[1].hand.find((card) => card.type === 'REVERSE' || card.type === 'SKIP')!
    defense.state = 'ACTIVE'
    defense.type = 'SKIP'
    const previousHeat = game.state.seats[1].heat

    expect(game.pass(0, 'ECHO', echo.turn).accepted).toBe(true)
    expect(echo.holderSeatId).toBe(2)
    expect(defense.state).toBe('ACTIVE')
    expect(game.state.seats[1].heat).toBe(previousHeat)
  })

  it('awards SKIP on an incoming echo without moving the original', () => {
    spawnEcho()
    for (const seat of game.state.seats) {
      seat.isBot = false
      for (const card of seat.hand) card.state = 'AVAILABLE'
    }
    const original = game.state.aliens.find((alien) => alien.id === 'ORIGINAL')!
    const echo = game.state.aliens.find((alien) => alien.id === 'ECHO')!
    original.holderSeatId = 4
    echo.holderSeatId = 0
    echo.readyAt = game.state.now
    echo.heldSince = game.state.now - 2
    game.state.direction = 1
    const defense = game.state.seats[1].hand[0]
    defense.type = 'SKIP'
    defense.state = 'ACTIVE'
    const before = game.state.seats[1].heat
    expect(game.pass(0, 'ECHO', echo.turn).accepted).toBe(true)
    expect(echo.holderSeatId).toBe(2)
    expect(original.holderSeatId).toBe(4)
    expect(defense.state).toBe('SPENT')
    expect(game.state.seats[1].heat).toBe(before + 1)
  })

  it('passes the requested alien without moving or advancing the other alien', () => {
    spawnEcho()
    const original = game.state.aliens.find((alien) => alien.id === 'ORIGINAL')!
    const echo = game.state.aliens.find((alien) => alien.id === 'ECHO')!
    game.state.direction = 1
    original.holderSeatId = 0
    original.readyAt = game.state.now
    original.heldSince = game.state.now - 2
    echo.holderSeatId = 2
    echo.readyAt = game.state.now
    echo.heldSince = game.state.now - 2
    const echoTurn = echo.turn

    expect(game.pass(0, 'ORIGINAL', original.turn).accepted).toBe(true)
    expect(original.holderSeatId).toBe(1)
    expect(echo.holderSeatId).toBe(2)
    expect(echo.turn).toBe(echoTurn)
    expect(game.state.events[game.state.events.length - 1]).toMatchObject({
      kind: 'PASS',
      alienId: 'ORIGINAL',
      path: [0, 1]
    })
  })

  it('never auto-passes either alien after a long human hold', () => {
    spawnEcho()
    for (const seat of game.state.seats) seat.isBot = false
    const original = game.state.aliens.find((alien) => alien.id === 'ORIGINAL')!
    const echo = game.state.aliens.find((alien) => alien.id === 'ECHO')!
    game.state.direction = 1
    original.holderSeatId = 0
    echo.holderSeatId = 1
    for (const alien of [original, echo]) {
      alien.readyAt = game.state.now
      alien.heldSince = game.state.now - 5
    }
    const firstPassSequence = game.state.sequence

    game.advance(6)

    expect(original.holderSeatId).toBe(0)
    expect(echo.holderSeatId).toBe(1)
    expect(new Set(game.state.aliens.map((alien) => alien.holderSeatId)).size).toBe(2)
    expect(
      game.state.events
        .filter((event) => event.sequence > firstPassSequence && event.kind === 'PASS')
        .map((event) => event.alienId)
    ).toEqual([])
  })

  it('removes the echo and penalizes only the original holder at takeover', () => {
    spawnEcho()
    const original = game.state.aliens.find((alien) => alien.id === 'ORIGINAL')!
    const echo = game.state.aliens.find((alien) => alien.id === 'ECHO')!
    original.holderSeatId = 0
    echo.holderSeatId = 1
    game.state.seats[0].heat = 8
    game.state.seats[1].heat = 8
    game.state.fuseEndsAt = game.state.now + 0.01

    game.advance(0.02)

    expect(game.state.phase).toBe('TAKEOVER')
    expect(game.state.aliens.map((alien) => alien.id)).toEqual(['ORIGINAL'])
    expect(game.state.takeoverVictimSeatId).toBe(0)
    expect(game.state.seats[0].heat).toBe(3)
    expect(game.state.seats[1].heat).toBe(8)
  })

  it('reserves the complete cinematic window before starting the next round', () => {
    game.state.fuseEndsAt = game.state.now + 0.01
    game.advance(0.02)

    expect(game.state.phase).toBe('TAKEOVER')
    game.advance(GAME_CONFIG.takeoverSequenceSeconds - 0.03)
    expect(game.state.phase).toBe('TAKEOVER')
    game.advance(0.04)
    expect(game.state.phase).toBe('HOLDING')
  })

  it('keeps the final takeover active for the full animation before results', () => {
    game.state.takeovers = GAME_CONFIG.takeoversPerMatch - 1
    game.state.fuseEndsAt = game.state.now + 0.01
    game.advance(0.02)

    expect(game.state.phase).toBe('TAKEOVER')
    expect(game.state.takeovers).toBe(GAME_CONFIG.takeoversPerMatch)
    game.advance(GAME_CONFIG.takeoverSequenceSeconds - 0.03)
    expect(game.state.phase).toBe('TAKEOVER')
    game.advance(0.04)
    expect(game.state.phase).toBe('MATCH_RESULT')
  })

  it('lets bots pass, equip and spend interventions through the same API', () => {
    while (game.state.phase !== 'MATCH_RESULT' && game.state.now < 140) game.advance(0.1)
    const botCards = game.state.seats.slice(1).flatMap((seat) => seat.hand)
    expect(game.state.phase).toBe('MATCH_RESULT')
    expect(botCards.some((card) => card.state === 'SPENT')).toBe(true)
    expect(game.state.events.some((event) => event.kind === 'CARD')).toBe(true)
  })

  it('redacts the exact shared clock only for a Hidden Watch victim', () => {
    game.state.seats[0].hiddenUntil = game.state.now + 6
    const hidden = game.snapshot(0)
    const publicView = game.snapshot(1)

    expect(hidden.fuseEndsAt).toBe(0)
    expect([5, 10, 16]).toContain(hidden.fuseRemainingSeconds)
    expect(publicView.fuseEndsAt).toBe(game.state.fuseEndsAt)
    expect(publicView.fuseRemainingSeconds).toBeGreaterThan(16)
  })

  it('publishes and expires a seat-specific quick reaction', () => {
    expect(game.react(0, 'HA!').accepted).toBe(true)
    const reaction = game.snapshot(0).reactions[0]
    expect(reaction).toMatchObject({ seatId: 0, value: 'HA!' })
    expect(reaction.until).toBeCloseTo(game.state.now + GAME_CONFIG.quickReactionSeconds)

    game.advance(0.75)
    expect(game.react(0, 'HA!').accepted).toBe(true)
    expect(game.snapshot(0).reactions[0].until).toBeCloseTo(game.state.now + GAME_CONFIG.quickReactionSeconds)

    game.advance(1.51)
    expect(game.snapshot(0).reactions).toEqual([])
  })
})

describe('explicit card activation', () => {
  beforeEach(startGame)

  function prepareIncomingReaction() {
    for (const seat of game.state.seats) seat.isBot = false
    const original = game.state.aliens.find((alien) => alien.id === 'ORIGINAL')!
    const defense = game.state.seats[1].hand.find((card) => card.type === 'REVERSE' || card.type === 'SKIP')!
    game.state.direction = 1
    original.holderSeatId = 0
    original.readyAt = game.state.now
    original.heldSince = game.state.now - GAME_CONFIG.minimumScoringHoldSeconds
    defense.state = 'AVAILABLE'
    expect(game.equip(1, defense.id, 'REACTION').accepted).toBe(true)
    return { original, defense }
  }

  it('loads a reaction without firing it from the deck selection', () => {
    const { original, defense } = prepareIncomingReaction()

    expect(defense.state).toBe('ARMED')
    expect(game.pass(0, 'ORIGINAL', original.turn).accepted).toBe(true)
    expect(original.holderSeatId).toBe(1)
    expect(defense.state).toBe('ARMED')
  })

  it('fires a reaction only after its loaded slot is activated', () => {
    const { original, defense } = prepareIncomingReaction()

    expect(game.activate(1, defense.id, 'ORIGINAL').accepted).toBe(true)
    expect(defense.state).toBe('ACTIVE')
    expect(game.pass(0, 'ORIGINAL', original.turn).accepted).toBe(true)
    expect(original.holderSeatId).not.toBe(1)
    expect(defense.state).toBe('SPENT')
  })

  it('awards exactly one POINTS for a consumed SKIP, not for loading or activating it', () => {
    const { original, defense } = prepareIncomingReaction()
    defense.type = 'SKIP'
    const before = game.state.seats[1].heat
    expect(game.activate(1, defense.id, 'ORIGINAL').accepted).toBe(true)
    expect(game.state.seats[1].heat).toBe(before)
    const turn = original.turn
    expect(game.pass(0, 'ORIGINAL', turn).accepted).toBe(true)
    expect(original.holderSeatId).toBe(2)
    expect(game.state.seats[1].heat).toBe(before + 1)
    expect(game.state.seats[1].successfulPasses).toBe(0)
    expect(defense.state).toBe('SPENT')
    expect(game.pass(0, 'ORIGINAL', turn).accepted).toBe(false)
    expect(game.state.seats[1].heat).toBe(before + 1)
    expect(
      game.state.events.some((event) => event.kind === 'REACTION_RESOLVED' && event.path[0] === 1 && event.heat === 1)
    ).toBe(true)
  })

  it('keeps intervention selection and activation as separate actions', () => {
    const card = giveDuplicate()

    expect(game.equip(0, card.id, 'INTERVENTION').accepted).toBe(true)
    expect(card.state).toBe('ARMED')
    expect(game.state.aliens).toHaveLength(1)

    expect(game.activate(0, card.id, 'ORIGINAL').accepted).toBe(true)
    expect(card.state).toBe('SPENT')
    expect(game.state.aliens).toHaveLength(2)
  })
})

describe('bot scoring cadence', () => {
  it('uses the same scoring hold duration for every bot seat', () => {
    const passTimes: number[] = []
    const awardedHeat: number[] = []

    for (const botSeatId of [1, 3, 7] as const) {
      const simulation = new MatchEngine(17, `bot-cadence-${botSeatId}`)
      expect(simulation.ready().accepted).toBe(true)
      simulation.advance(GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds)
      for (const seat of simulation.state.seats) {
        seat.isBot = seat.id === botSeatId
        for (const card of seat.hand) card.state = 'SPENT'
      }
      const alien = simulation.state.aliens[0]
      alien.holderSeatId = botSeatId
      alien.readyAt = simulation.state.now
      alien.heldSince = simulation.state.now
      simulation.state.fuseEndsAt = simulation.state.now + 20

      const startedAt = simulation.state.now
      simulation.advance(GAME_CONFIG.botScoringHoldSeconds - 0.01)
      expect(alien.holderSeatId).toBe(botSeatId)
      simulation.advance(0.3)

      const pass = simulation.state.events.find(
        (event) => event.kind === 'PASS' && event.at >= startedAt && event.path[0] === botSeatId
      )!
      passTimes.push(pass.at - startedAt)
      awardedHeat.push(pass.heat)
    }

    expect(passTimes.every((time) => Math.abs(time - passTimes[0]) < 0.001)).toBe(true)
    expect(awardedHeat).toEqual([1, 1, 1])
  })
})

describe('seat identities', () => {
  it('uses natural callsigns instead of exposing bot labels', () => {
    const match = new MatchEngine(17, 'identity-test')
    const names = match.state.seats.map((seat) => seat.displayName)

    expect(new Set(names).size).toBe(8)
    expect(names.every((name) => !name.includes('BOT'))).toBe(true)
  })
})

describe('multiplayer match progress', () => {
  it('finishes seeded bot matches without colliding or deadlocking two aliens', () => {
    for (let seed = 1; seed <= 32; seed++) {
      const simulation = new MatchEngine(seed, `stress-${seed}`)
      expect(simulation.ready().accepted).toBe(true)

      while (simulation.state.phase !== 'MATCH_RESULT' && simulation.state.now < 150) {
        simulation.advance(0.1)
        const holders = simulation.state.aliens.map((alien) => alien.holderSeatId)
        expect(new Set(holders).size, `seed ${seed} at ${simulation.state.now.toFixed(2)}s`).toBe(holders.length)
      }

      expect(simulation.state.phase, `seed ${seed} stopped at ${simulation.state.now.toFixed(2)}s`).toBe('MATCH_RESULT')
    }
  })
})

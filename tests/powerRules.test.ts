import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../src/config/gameConfig'
import { MatchEngine } from '../src/game/runtime/matchEngine'
import type { CardSlotState, SeatId } from '../src/game/model/types'

function match(seed = 19) {
  const game = new MatchEngine(seed)
  game.join('human', 'PLAYER')
  game.ready()
  game.advance(GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds)
  for (const seat of game.state.seats) seat.isBot = false
  game.state.direction = 1
  return game
}
function chaos(game: MatchEngine, seatId: SeatId = 0): CardSlotState {
  const card = game.state.seats[seatId].hand.find((card) => !['REVERSE', 'SKIP', 'DUPLICATE'].includes(card.type))!
  card.type = 'CHAOS'
  return card
}
function hold(game: MatchEngine, seatId: SeatId) {
  const alien = game.state.aliens[0]
  alien.holderSeatId = seatId
  alien.readyAt = game.state.now
  alien.heldSince = game.state.now - 2
  return alien
}
describe('round-scoped Echo', () => {
  it('deals exactly one shared Echo per round and expires the previous unspent card', () => {
    const game = match()
    const echo = () => game.state.seats.flatMap((seat) => seat.hand).filter((card) => card.type === 'DUPLICATE')
    expect(echo()).toHaveLength(1)
    const previousId = echo()[0].id
    game.state.fuseEndsAt = game.state.now + 0.01
    game.advance(0.02)
    game.advance(GAME_CONFIG.takeoverSequenceSeconds + 0.01)
    expect(game.state.round).toBe(2)
    expect(echo()).toHaveLength(1)
    expect(echo()[0].id).not.toBe(previousId)
    expect(game.state.seats.flatMap((seat) => seat.hand).some((card) => card.id === previousId)).toBe(false)
  })
  it('varies the Echo recipient across seeds and keeps replay deterministic', () => {
    const owner = (seed: number) =>
      match(seed).state.seats.find((seat) => seat.hand.some((card) => card.type === 'DUPLICATE'))!.id
    expect(owner(19)).toBe(owner(19))
    expect(new Set(Array.from({ length: 20 }, (_, seed) => owner(seed))).size).toBeGreaterThan(1)
  })
})
describe('targeted Chaos', () => {
  it('requires a valid other player, does not activate on selection, and redirects only its owner once', () => {
    const game = match()
    const card = chaos(game)
    game.equip(0, card.id, 'INTERVENTION')
    expect(game.activate(0, card.id, 'ORIGINAL').accepted).toBe(false)
    expect(card.state).toBe('ARMED')
    expect(game.equip(0, card.id, 'INTERVENTION', 0).accepted).toBe(false)
    expect(game.equip(0, card.id, 'INTERVENTION', 99).accepted).toBe(false)
    expect(game.equip(0, card.id, 'INTERVENTION', 5).accepted).toBe(true)
    expect(game.state.seats[0].chaosTargetSeatId).toBeUndefined()
    expect(game.activate(0, card.id, 'ORIGINAL').accepted).toBe(true)
    const alien = hold(game, 1)
    game.pass(1, alien.id, alien.turn)
    expect(alien.holderSeatId).toBe(2)
    hold(game, 0)
    game.pass(0, alien.id, alien.turn)
    expect(alien.holderSeatId).toBe(5)
    expect(game.state.seats[0].chaosTargetSeatId).toBeUndefined()
    hold(game, 0)
    game.pass(0, alien.id, alien.turn)
    expect(alien.holderSeatId).toBe(1)
  })
  it('resolves the chosen target reaction normally and awards Skip once', () => {
    const game = match()
    const card = chaos(game)
    game.equip(0, card.id, 'INTERVENTION', 5)
    game.activate(0, card.id, 'ORIGINAL')
    const skip = game.state.seats[5].hand.find((card) => ['SKIP', 'REVERSE'].includes(card.type))!
    skip.type = 'SKIP'
    skip.state = 'ACTIVE'
    const alien = hold(game, 0)
    game.pass(0, alien.id, alien.turn)
    expect(alien.holderSeatId).toBe(6)
    expect(game.state.seats[5].heat).toBe(1)
  })
  it('skips a Chaos target occupied by Echo before consuming its defense', () => {
    const game = match()
    game.state.aliens.push({
      id: 'ECHO',
      holderSeatId: 5,
      heldSince: game.state.now,
      readyAt: game.state.now,
      turn: 0
    })
    const card = chaos(game)
    game.equip(0, card.id, 'INTERVENTION', 5)
    game.activate(0, card.id, 'ORIGINAL')
    const defense = game.state.seats[5].hand[0]
    defense.type = 'SKIP'
    defense.state = 'ACTIVE'
    const alien = hold(game, 0)
    game.pass(0, alien.id, alien.turn)
    expect(alien.holderSeatId).toBe(6)
    expect(defense.state).toBe('ACTIVE')
    expect(game.state.seats[5].heat).toBe(0)
  })
})
describe('no automatic passing', () => {
  it('keeps the alien with an inactive human until the shared clock causes takeover', () => {
    const game = match()
    const alien = hold(game, 0)
    game.advance(6)
    expect(alien.holderSeatId).toBe(0)
    expect(game.state.seats[0].heat).toBe(0)
    game.state.fuseEndsAt = game.state.now + 0.01
    game.advance(0.02)
    expect(game.state.phase).toBe('TAKEOVER')
    expect(game.state.takeoverVictimSeatId).toBe(0)
  })
})

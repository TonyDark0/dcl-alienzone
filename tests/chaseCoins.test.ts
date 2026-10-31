import { describe, expect, it } from 'vitest'
import { createRoundCoins, resolveCoinContacts, coinContactTime, COIN_CONFIG } from '../src/game/rules/chaseCoins'
import { CHASE_CONFIG, initialChasePlayer } from '../src/game/rules/chase'
import { ChaseMatchEngine } from '../src/game/runtime/chaseMatchEngine'
import { GAME_CONFIG } from '../src/config/gameConfig'
import { planChaseBot } from '../src/game/rules/chaseBots'
import { coinEntranceScale } from '../src/presentation/coinMotion'
import { syncMatchStateToUi } from '../src/ui/adapters/localMatchUiAdapter'
import { resetLabUi, getUiState } from '../src/ui/state/uiState'
import type { SeatId } from '../src/game/model/types'

function running() {
  const game = new ChaseMatchEngine(41)
  game.join('human', 'PLAYER')
  game.ready()
  expect(game.state.arena!.coins).toEqual([])
  game.advance(
    GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds + CHASE_CONFIG.deckSetupSeconds
  )
  for (const seat of game.state.seats) seat.isBot = false
  return game
}

describe('round coin generation', () => {
  it('generates exactly 10 separated, bounded coins for varied seeds, rounds and player positions', () => {
    for (let seed = 1; seed <= 300; seed++)
      for (let round = 1; round <= 3; round++) {
        const players = Array.from({ length: 8 }, (_, seat) => ({
          x: 2 + ((seed * 7 + seat * 3) % 28),
          z: 10 + ((seed + seat) % 12)
        }))
        const coins = createRoundCoins(seed, round, players)
        expect(coins).toHaveLength(10)
        expect(coins).toEqual(createRoundCoins(seed, round, players))
        for (const coin of coins) {
          expect(coin.x).toBeGreaterThanOrEqual(CHASE_CONFIG.minX + 1)
          expect(coin.x).toBeLessThanOrEqual(CHASE_CONFIG.maxX - 1)
          expect(coin.z).toBeGreaterThanOrEqual(CHASE_CONFIG.minZ + 1)
          expect(coin.z).toBeLessThanOrEqual(CHASE_CONFIG.maxZ - 1)
          expect(Math.hypot(coin.x - 16, coin.z - 16)).toBeGreaterThanOrEqual(COIN_CONFIG.roomClearance)
          expect(players.every((p) => Math.hypot(p.x - coin.x, p.z - coin.z) >= 1)).toBe(true)
          for (const other of coins.filter((c) => c !== coin))
            expect(Math.hypot(other.x - coin.x, other.z - coin.z)).toBeGreaterThanOrEqual(1.5)
        }
      }
  })
  it('reshuffles positions between rounds and never repeats a round ID', () => {
    const a = createRoundCoins(41, 1, []),
      b = createRoundCoins(41, 2, []),
      c = createRoundCoins(41, 3, [])
    expect(a.map(({ x, z }) => [x, z])).not.toEqual(b.map(({ x, z }) => [x, z]))
    expect(new Set([...a, ...b, ...c].map((coin) => coin.id)).size).toBe(30)
  })
})

describe('first-contact authority', () => {
  const coin = { id: '1:0', x: 10, z: 10 }
  it('awards the first swept contact, not player array order, even if the endpoint has passed the coin', () => {
    const later = { seatId: 0 as const, from: { x: 8, z: 10 }, to: { x: 11, z: 10 } }
    const first = { seatId: 1 as const, from: { x: 9, z: 10 }, to: { x: 13, z: 10 } }
    const result = resolveCoinContacts([coin], [later, first])
    expect(result.claims).toEqual([{ coinId: '1:0', seatId: 1 }])
    expect(resolveCoinContacts([coin], [first, later])).toEqual(result)
    expect(result.remaining).toEqual([])
    expect(resolveCoinContacts(result.remaining, [first, later]).claims).toEqual([])
  })
  it('uses a deterministic exact-tie policy and does not collect from out of range', () => {
    const motion = { from: { x: 10, z: 10 }, to: { x: 10, z: 10 } }
    expect(
      resolveCoinContacts(
        [coin],
        [
          { seatId: 7, ...motion },
          { seatId: 0, ...motion }
        ]
      ).claims[0].seatId
    ).toBe(0)
    expect(coinContactTime(coin, { seatId: 0, from: { x: 10, z: 11 }, to: { x: 11, z: 11 } })).toBeNull()
    expect(coinContactTime(coin, { seatId: 0, from: { x: NaN, z: 10 }, to: coin })).toBeNull()
  })
})

describe('coin match lifecycle and score feedback', () => {
  it('awards +1 once for either role, with no pass, alien change or predicted score', () => {
    const g = running(),
      players = g.state.arena!.players
    for (const p of players) {
      p.x = 2
      p.z = 10
    }
    g.state.seats[1].isBot = true
    players[1].x = 24
    players[1].z = 16
    g.state.arena!.coins = [{ id: '1:0', x: 24, z: 16 }]
    const deadline = g.state.fuseEndsAt,
      alien = { ...g.state.aliens[0] }
    g.advance(0.05)
    expect(g.state.seats[1].heat).toBe(1)
    expect(g.state.seats[1].successfulPasses).toBe(0)
    expect(g.state.aliens[0]).toEqual(alien)
    expect(g.state.fuseEndsAt).toBe(deadline)
    expect(g.state.arena!.coins).toEqual([])
    resetLabUi()
    syncMatchStateToUi(g.snapshot(0))
    expect(getUiState().seatNotices).toContainEqual(
      expect.objectContaining({ seatId: 1, text: '+1', tone: 'POINTS', source: 'COIN' })
    )
    expect(getUiState().seatPassCues).toEqual([])
    g.advance(0.1)
    expect(g.state.seats[1].heat).toBe(1)
    g.state.arena!.coins = [{ id: '1:1', x: 2, z: 10 }]
    g.advance(0.05)
    expect(g.state.seats[0].heat).toBe(1)
  })
  it('never respawns collected coins, discards leftovers and generates exactly 30 over three rounds', () => {
    const g = running(),
      ids = new Set<string>()
    for (let round = 1; round <= 3; round++) {
      expect(g.state.arena!.coins).toHaveLength(10)
      const coins = g.state.arena!.coins!
      for (const coin of coins) ids.add(coin.id)
      const snapshot = g.snapshot(0)
      snapshot.events = snapshot.events.slice(-16)
      expect(new TextEncoder().encode(JSON.stringify(snapshot)).length).toBeLessThan(13 * 1024)
      // Remove just one via an authoritative touch; no replacement during this round.
      g.state.arena!.players[0].x = coins[0].x
      g.state.arena!.players[0].z = coins[0].z
      g.advance(0.1)
      expect(g.state.arena!.coins!.length).toBeLessThan(10)
      const remaining = g.state.arena!.coins!.map((coin) => coin.id)
      g.advance(0.2)
      expect(g.state.arena!.coins!.every((coin) => remaining.includes(coin.id))).toBe(true)
      g.state.fuseEndsAt = g.state.now + 0.01
      g.advance(0.02)
      expect(g.state.phase).toBe('TAKEOVER')
      expect(g.state.arena!.coins).toEqual([])
      g.advance(GAME_CONFIG.takeoverSequenceSeconds)
    }
    expect(ids.size).toBe(30)
    expect(g.state.phase).toBe('MATCH_RESULT')
    expect(g.state.arena!.coins).toEqual([])
  })
  it('lets an idle non-carrier seek public coins, without changing movement speed', () => {
    const self = { ...initialChasePlayer(1), x: 16, z: 16 }
    const plan = planChaseBot(self, [], [], 10, 3, undefined, undefined, [{ id: '1:0', x: 24, z: 16 }])
    expect(Math.sin(plan.heading)).toBeGreaterThan(0.8)
    expect(plan.target).toBeUndefined()
  })
  it('bounces on appearance and settles at the base scale', () => {
    expect(coinEntranceScale(0)).toBeCloseTo(0.12)
    expect(coinEntranceScale(0.3)).toBeGreaterThan(1)
    expect(coinEntranceScale(0.45)).toBeCloseTo(1)
    expect(coinEntranceScale(100)).toBeCloseTo(1)
  })
})

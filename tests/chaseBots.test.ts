import { describe, expect, it } from 'vitest'
import { CHASE_CONFIG, initialChasePlayer, aimChasePlayer } from '../src/game/rules/chase'
import type { SeatId } from '../src/game/model/types'
import { planChaseBot, roundStarter } from '../src/game/rules/chaseBots'
import { ChaseMatchEngine } from '../src/game/runtime/chaseMatchEngine'
import { GAME_CONFIG } from '../src/config/gameConfig'

const player = (seat: number, x: number, z: number) => ({ ...initialChasePlayer(seat as SeatId), x, z })

describe('fair, deterministic open-room bot steering', () => {
  it('shuffles round starters without repetition or dependence on gameplay RNG', () => {
    const first = new Set<number>()
    for (let seed = 1; seed <= 100; seed++) {
      const starters = [0, 1, 2].map((round) => roundStarter(seed, round, 8))
      expect(new Set(starters).size).toBe(3)
      first.add(starters[0])
      expect(starters).toEqual([0, 1, 2].map((round) => roundStarter(seed, round, 8)))
    }
    expect(first.size).toBe(8)
  })
  it('leads visible moving targets, briefly locks a target and excludes immune/occupied seats', () => {
    const self = player(0, 20, 16),
      a = player(1, 24, 16),
      b = player(2, 25, 16)
    a.moving = true
    a.yaw = 0
    const plan = planChaseBot(self, [a, b], [0], 10, 7)
    expect(plan.target).toBe(1)
    expect(plan.heading).toBeLessThan(Math.PI / 2)
    b.x = 23
    expect(planChaseBot(self, [a, b], [0], 10.25, 7, plan).target).toBe(1)
    a.immuneUntil = 15
    expect(planChaseBot(self, [a, b], [0], 10.5, 7, plan).target).toBe(2)
    expect(planChaseBot(self, [a, b], [0, 2], 10.5, 7, plan).target).toBeUndefined()
  })
  it('does not read invisible positions and reduces immediate recipient preference', () => {
    const self = player(0, 20, 16),
      a = player(1, 22, 16),
      b = player(2, 22.5, 16)
    expect(planChaseBot(self, [a, b], [0], 10, 7, undefined, 1).target).toBe(2)
    a.invisibleUntil = 20
    const before = planChaseBot(self, [a, b], [0, 1], 10, 7)
    a.x = -999
    a.z = 999
    expect(planChaseBot(self, [a, b], [0, 1], 10, 7)).toEqual(before)
  })
  it('escapes a visible threat without running into the boundary and varies roaming by seat', () => {
    const self = player(0, CHASE_CONFIG.minX + 0.3, CHASE_CONFIG.minZ + 0.3)
    const threat = player(1, self.x + 1, self.z + 1)
    const plan = planChaseBot(self, [threat], [1], 10, 19)
    const next = { ...self }
    aimChasePlayer(next, 1, plan.heading, 0.25, 10)
    expect(next.x).toBeGreaterThan(self.x)
    expect(next.z).toBeGreaterThanOrEqual(self.z)
    const headings = new Set(
      Array.from({ length: 8 }, (_, seat) => planChaseBot(player(seat, 24, 16), [], [], 10, 19).heading)
    )
    expect(headings.size).toBeGreaterThanOrEqual(3)
  })
})

describe('authoritative human/bot speed parity', () => {
  it('uses the shuffled starters in real rounds and keeps a live motion snapshot within 13KB', () => {
    const g = new ChaseMatchEngine(41)
    g.join('human', 'PLAYER')
    g.ready()
    g.advance(
      GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds + CHASE_CONFIG.deckSetupSeconds
    )
    const starters: SeatId[] = []
    for (let round = 0; round < 3; round++) {
      expect(g.state.phase).toBe('HOLDING')
      starters.push(g.state.aliens[0].holderSeatId)
      expect(starters[round]).toBe(roundStarter(41, round, 8))
      g.aimInput(0, 1, 0, round + 1)
      g.advance(0.1)
      const snapshot = g.snapshot(0)
      snapshot.events = snapshot.events.slice(-16)
      expect(new TextEncoder().encode(JSON.stringify(snapshot)).length).toBeLessThan(13 * 1024)
      g.state.fuseEndsAt = g.state.now + 0.01
      g.advance(0.02)
      g.advance(GAME_CONFIG.takeoverSequenceSeconds)
    }
    expect(new Set(starters).size).toBe(3)
    expect(g.state.phase).toBe('MATCH_RESULT')
  })
  it('uses identical speed for eight headings, including Freeze, Turbo and combined effects', () => {
    class StraightBotEngine extends ChaseMatchEngine {
      heading = 0
      sequence = 0
      protected bots() {
        this.aimInput(1, 1, this.heading, ++this.sequence)
      }
    }
    for (const effect of ['NORMAL', 'FREEZE', 'TURBO', 'BOTH'])
      for (let heading = 0; heading < 8; heading++) {
        const g = new StraightBotEngine(35)
        g.join('human', 'PLAYER')
        g.ready()
        g.advance(
          GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds + CHASE_CONFIG.deckSetupSeconds
        )
        for (const seat of g.state.seats) {
          seat.isBot = seat.id === 1
          seat.hand = []
        }
        const human = g.state.arena!.players[0],
          bot = g.state.arena!.players[1]
        for (const p of [human, bot]) {
          p.x = 24
          p.z = 16
          p.frozenUntil = ['FREEZE', 'BOTH'].includes(effect) ? g.state.now + 2 : 0
          p.turboUntil = ['TURBO', 'BOTH'].includes(effect) ? g.state.now + 5 : 0
        }
        g.heading = (heading * Math.PI) / 4
        g.aimInput(1, 1, g.heading, ++g.sequence)
        for (let step = 1; step <= 10; step++) {
          g.aimInput(0, 1, g.heading, step)
          g.advance(0.1)
        }
        expect(bot.x).toBeCloseTo(human.x, 8)
        expect(bot.z).toBeCloseTo(human.z, 8)
        const factor = effect === 'FREEZE' ? 0.5 : effect === 'TURBO' ? 2 : 1
        expect(Math.hypot(human.x - 24, human.z - 16)).toBeCloseTo(CHASE_CONFIG.speed * factor, 8)
      }
  })
})

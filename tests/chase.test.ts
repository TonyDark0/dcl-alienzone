import { describe, expect, it } from 'vitest'
import {
  CHASE_CONFIG,
  initialChasePlayer,
  locomotionFor,
  moveChasePlayer,
  normalizeMove,
  steerChasePlayer,
  chaseSpeedMultiplier
} from '../src/game/rules/chase'
import { CHASE_CARD_TYPES, dealChaseHand, STARTER_CARDS } from '../src/game/rules/chaseCards'
import { createProgressionProfile, PROGRESSION_IMPLEMENTATION_ENABLED } from '../src/game/rules/progression'
import { AVAILABLE_RUNNING_CLIPS, RUNNING_CLIPS, runningAnimation } from '../src/presentation/runningAnimation'

describe('running movement and animation contract', () => {
  it('rejects malformed input and normalizes diagonal or oversized direction', () => {
    expect(normalizeMove(NaN, 0)).toBeNull()
    expect(normalizeMove(0, Infinity)).toBeNull()
    expect(Math.hypot(normalizeMove(1, 1)!.x, normalizeMove(1, 1)!.z)).toBeCloseTo(1)
    const player = initialChasePlayer(0),
      start = player.x
    moveChasePlayer(player, 10000, 0, 0.1, 0)
    expect(player.x - start).toBeCloseTo(CHASE_CONFIG.speed * 0.1)
  })
  it('clamps bounds and slows movement without stopping it', () => {
    const player = initialChasePlayer(0)
    player.frozenUntil = 5
    const x = player.x
    moveChasePlayer(player, 1, 0, 1, 1)
    expect(player.x - x).toBeCloseTo(CHASE_CONFIG.speed * 0.5)
    expect(locomotionFor(player, true, 1)).toBe('SLOW')
    moveChasePlayer(player, 1, 0, 100, 6)
    expect(player.x).toBe(CHASE_CONFIG.maxX)
  })
  it('plays the delivered loops and scales the carrying and normal clip identically', () => {
    expect(AVAILABLE_RUNNING_CLIPS).toEqual(['AST_RUNNING', 'AST_RUNNING_ALIEN'])
    expect(runningAnimation('RUN')).toMatchObject({ clip: RUNNING_CLIPS.RUN, speed: 1, fallback: false })
    expect(runningAnimation('RUN_HOLDING')).toMatchObject({ clip: 'AST_RUNNING_ALIEN', speed: 1 })
    expect(runningAnimation('SLOW')).toMatchObject({ clip: 'AST_RUNNING', speed: 0.5 })
    expect(runningAnimation('SLOW', AVAILABLE_RUNNING_CLIPS, true)).toMatchObject({
      clip: 'AST_RUNNING_ALIEN',
      speed: 0.5
    })
    expect(runningAnimation('TURBO', AVAILABLE_RUNNING_CLIPS, true)).toMatchObject({
      clip: 'AST_RUNNING_ALIEN',
      speed: 2
    })
    expect(runningAnimation('IDLE')).toMatchObject({ clip: 'AST_IDLE_STANDING', speed: 1 })
    expect(runningAnimation('IDLE', AVAILABLE_RUNNING_CLIPS, true)).toMatchObject({
      clip: 'AST_RUNNING_ALIEN',
      speed: 0
    })
    expect(runningAnimation('RUN', [])).toMatchObject({ clip: 'AST_IDLE_STANDING', speed: 0, fallback: true })
  })
  it('turns A/D in place, moves relative to facing and never turns around on S', () => {
    const p = initialChasePlayer(0)
    p.x = p.z = 16
    p.yaw = 0
    steerChasePlayer(p, 0, 1, 0.25, 0)
    expect(p.x).toBe(16)
    expect(p.z).toBe(16)
    expect(p.yaw).toBeCloseTo(0.6)
    expect(p.moving).toBe(false)
    const yaw = p.yaw
    steerChasePlayer(p, 1, 0, 0.1, 0)
    expect(p.x).toBeGreaterThan(16)
    expect(p.z).toBeGreaterThan(16)
    steerChasePlayer(p, -1, 0, 0.1, 0)
    expect(p.x).toBeCloseTo(16)
    expect(p.z).toBeCloseTo(16)
    expect(p.yaw).toBe(yaw)
    steerChasePlayer(p, 0, -1, 0.25, 0)
    expect(p.yaw).toBeCloseTo(0)
  })
  it('multiplies simultaneous slow and turbo, and recovers at server expiry', () => {
    const p = initialChasePlayer(0)
    p.frozenUntil = 5
    p.turboUntil = 8
    expect(chaseSpeedMultiplier(p, 0)).toBe(1)
    expect(runningAnimation('SLOW', AVAILABLE_RUNNING_CLIPS, true, chaseSpeedMultiplier(p, 0))).toMatchObject({
      speed: 1
    })
    expect(chaseSpeedMultiplier(p, 5)).toBe(2)
    expect(chaseSpeedMultiplier(p, 8)).toBe(1)
  })
})
describe('starter unlocks and deferred progression', () => {
  it('deals finite deterministic starter-only hands for humans and bots', () => {
    for (let seat = 0; seat < 8; seat++) {
      const hand = dealChaseHand(7, seat)
      expect(hand).toHaveLength(3)
      expect(new Set(hand.map((card) => card.id)).size).toBe(3)
      expect(new Set(hand.map((card) => card.type))).toEqual(new Set(STARTER_CARDS))
      expect(hand.filter((card) => card.state === 'ARMED')).toHaveLength(1)
      expect(hand.every((card) => (STARTER_CARDS as readonly string[]).includes(card.type))).toBe(true)
      expect(hand).toEqual(dealChaseHand(7, seat))
    }
    expect(dealChaseHand(7, 0)).not.toEqual(dealChaseHand(8, 0))
  })
  it('defines ten approved powers including round pickups, with no Reverse', () => {
    expect(CHASE_CARD_TYPES).toHaveLength(10)
    expect(CHASE_CARD_TYPES).toContain('TURBO')
    expect(CHASE_CARD_TYPES).not.toContain('REVERSE')
  })
  it('creates isolated profiles without granting currency or enabling claims', () => {
    const a = createProgressionProfile(),
      b = createProgressionProfile()
    a.unlockedCards.pop()
    expect(b.unlockedCards).toHaveLength(3)
    expect(b.claimedRewardIds).toHaveLength(0)
    expect(PROGRESSION_IMPLEMENTATION_ENABLED).toBe(false)
  })
})

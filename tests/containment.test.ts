import { describe, expect, it } from 'vitest'

import {
  canHitContainmentTarget,
  CONTAINMENT_CONFIG,
  containmentResolvesAt,
  containmentTargetOpensAt,
  createContainmentChallenge,
  currentContainmentTarget,
  earnsContainmentBonus
} from '../src/game/rules/containment'
import { containmentLayout } from '../src/ui/theme/containmentLayout'

describe('containment rules', () => {
  it('creates five reproducible, non-consecutive positions without sharing mutable hits', () => {
    const first = createContainmentChallenge('match', 17, 1, 0, 10)
    const second = createContainmentChallenge('match', 17, 1, 0, 10)
    expect(first).toEqual(second)
    expect(first.slots).toHaveLength(5)
    first.slots.forEach((slot, index) => {
      expect(slot).toBeGreaterThanOrEqual(0)
      expect(slot).toBeLessThan(6)
      if (index) expect(slot).not.toBe(first.slots[index - 1])
    })
    first.hits[0] = true
    expect(second.hits[0]).toBe(false)
    expect(createContainmentChallenge('match', 17, 2, 0, 10).id).not.toBe(first.id)
  })

  it('uses all targets as the denominator, including those never tapped', () => {
    const challenge = createContainmentChallenge('match', 1, 1, 0, 0)
    challenge.hits = [true, false, false, false, false]
    expect(earnsContainmentBonus(challenge)).toBe(false)
    challenge.hits = [true, true, false, false, false]
    expect(earnsContainmentBonus(challenge)).toBe(false)
    challenge.hits[2] = true
    expect(earnsContainmentBonus(challenge)).toBe(true)
    challenge.slots = [0, 1, 2, 3]
    challenge.hits = [true, true, false, false]
    expect(earnsContainmentBonus(challenge)).toBe(false) // Exactly 50% is not over 50%.
  })

  it('rejects future, duplicate, expired, malformed and resolved target attempts', () => {
    const challenge = createContainmentChallenge('match', 1, 1, 0, 0)
    const opensAt = containmentTargetOpensAt(challenge, 0)
    expect(canHitContainmentTarget(challenge, 0, opensAt - 0.01)).toBe(false)
    expect(canHitContainmentTarget(challenge, 0, opensAt + 0.1)).toBe(true)
    for (const index of [-1, 5, 0.5, NaN, Infinity]) {
      expect(canHitContainmentTarget(challenge, index, opensAt + 0.1)).toBe(false)
    }
    expect(canHitContainmentTarget(challenge, 0, NaN)).toBe(false)
    expect(canHitContainmentTarget(challenge, 0, opensAt + CONTAINMENT_CONFIG.targetSeconds + 0.1)).toBe(true)
    expect(canHitContainmentTarget(challenge, 0, opensAt + 1)).toBe(false)
    challenge.hits[0] = true
    expect(canHitContainmentTarget(challenge, 0, opensAt + 0.1)).toBe(false)
    challenge.resolved = true
    expect(canHitContainmentTarget(challenge, 1, containmentTargetOpensAt(challenge, 1))).toBe(false)
  })

  it('keeps all five targets and network grace inside the existing five-second cinematic', () => {
    const challenge = createContainmentChallenge('match', 1, 1, 0, 0)
    expect(currentContainmentTarget(challenge, 0)).toBeNull()
    for (let index = 0; index < 5; index++) {
      expect(currentContainmentTarget(challenge, containmentTargetOpensAt(challenge, index) + 0.01)).toBe(index)
    }
    expect(currentContainmentTarget(challenge, 4.1)).toBeNull()
    expect(containmentResolvesAt(challenge)).toBeCloseTo(4.25)
    expect(containmentResolvesAt(challenge)).toBeLessThan(5)
  })
})

describe('containment safe target field', () => {
  it.each([
    [1920, 1080, false],
    [1600, 720, true],
    [1280, 720, true],
    [960, 540, true]
  ] as const)('keeps every target inside the central field on %sx%s', (width, height, mobile) => {
    for (let slot = 0; slot < 6; slot++) {
      const layout = containmentLayout(width, height, mobile, slot)
      expect(layout.targetSize).toBeGreaterThanOrEqual(108)
      expect(layout.left).toBeGreaterThanOrEqual(0)
      expect(layout.top).toBeGreaterThanOrEqual(0)
      expect(layout.left + layout.targetSize).toBeLessThanOrEqual(layout.fieldWidth)
      expect(layout.top + layout.targetSize).toBeLessThanOrEqual(layout.fieldHeight)
      const screenLeft = width / 2 - layout.fieldWidth / 2 + layout.left
      const screenTop = height * 0.48 - layout.fieldHeight / 2 + layout.top
      expect(screenLeft).toBeGreaterThan(width * 0.2)
      expect(screenLeft + layout.targetSize).toBeLessThan(width * 0.8)
      expect(screenTop).toBeGreaterThan(height * 0.2)
      expect(screenTop + layout.targetSize).toBeLessThan(height * 0.8)
    }
  })
})

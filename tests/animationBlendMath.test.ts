import { describe, expect, it } from 'vitest'

import { clamp01, smoothBlendProgress } from '../src/presentation/animationBlendMath'

describe('animation blend math', () => {
  it('clamps progress to the valid weight range', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(2)).toBe(1)
  })

  it('uses a smooth curve with exact endpoints', () => {
    expect(smoothBlendProgress(0, 0.2)).toBe(0)
    expect(smoothBlendProgress(0.1, 0.2)).toBeCloseTo(0.5)
    expect(smoothBlendProgress(0.2, 0.2)).toBe(1)
    expect(smoothBlendProgress(0.02, 0.2)).toBeLessThan(0.01)
    expect(smoothBlendProgress(0.18, 0.2)).toBeGreaterThan(0.99)
  })

  it('completes immediately when duration is disabled', () => {
    expect(smoothBlendProgress(0, 0)).toBe(1)
  })
})

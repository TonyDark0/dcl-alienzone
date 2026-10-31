import { describe, expect, it } from 'vitest'
import { stepPowerToast } from '../src/ui/state/powerToast'
import { powerToastLayout } from '../src/ui/theme/hudLayout'

describe('latest-only compact power toast', () => {
  it('replaces immediately with newest sequence, never queues older activations', () => {
    const a = { sequence: 1, type: 'FREEZE' as const, playerName: 'A' }
    const b = { sequence: 2, type: 'TURBO' as const, playerName: 'B' }
    let state = stepPowerToast(null, 'match', [a], true, 0)
    state = stepPowerToast(state, 'match', [a, b], true, 100)
    expect(state.active).toEqual(b)
    expect(state.startedAt).toBe(100)
    state = stepPowerToast(state, 'match', [a, b], true, 500)
    expect(state.startedAt).toBe(100)
    state = stepPowerToast(state, 'match', [a, b], true, 1000)
    expect(state.active).toBeNull()
    expect(stepPowerToast(state, 'match', [a], true, 1010).active).toBeNull()
  })
  it('clears outside play and resets for another match', () => {
    const a = { sequence: 4, type: 'SKIP' as const, playerName: 'A' }
    const state = stepPowerToast(null, 'a', [a], true, 0)
    expect(stepPowerToast(state, 'a', [a], false, 1).active).toBeNull()
    expect(stepPowerToast(state, 'b', [], true, 2).lastSequence).toBe(0)
  })
  it('matches the first score row size, clears desktop tools and honours compact layout', () => {
    expect(powerToastLayout(false, false)).toEqual({ top: 202, right: 56, width: 208, height: 34 })
    expect(powerToastLayout(true, true)).toEqual({ top: 82, right: 12, width: 164, height: 28 })
  })
})

import { describe, expect, it } from 'vitest'
import { applyTakeoverPenalty, heatForSuccessfulPass } from '../src/game/rules/scoring'

describe('POINTS scoring', () => {
  it('awards POINTS from the remaining-fuse bands', () => {
    expect(heatForSuccessfulPass(16, 2, true)).toBe(1)
    expect(heatForSuccessfulPass(15, 2, true)).toBe(2)
    expect(heatForSuccessfulPass(12, 2, true)).toBe(2)
    expect(heatForSuccessfulPass(10, 2, true)).toBe(3)
    expect(heatForSuccessfulPass(8, 2, true)).toBe(3)
    expect(heatForSuccessfulPass(5, 2, true)).toBe(4)
    expect(heatForSuccessfulPass(4, 2, true)).toBe(4)
  })

  it('awards no POINTS for an automatic pass', () => {
    expect(heatForSuccessfulPass(4, 5, false)).toBe(0)
  })

  it('does not award POINTS for a manual pass held for less than two seconds', () => {
    expect(heatForSuccessfulPass(4, 1.99, true)).toBe(0)
    expect(heatForSuccessfulPass(4, 2, true)).toBe(4)
  })

  it('never reduces POINTS below zero after a takeover', () => {
    expect(applyTakeoverPenalty(12)).toBe(7)
    expect(applyTakeoverPenalty(3)).toBe(0)
  })
})

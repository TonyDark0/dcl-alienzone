import { describe, expect, it } from 'vitest'
import { applyFreezeExtension } from '../src/game/rules/fuse'

describe('fuse rules', () => {
  it('caps Freeze extensions at the hard limit', () => {
    expect(applyFreezeExtension(28)).toBe(33)
    expect(applyFreezeExtension(37)).toBe(38)
  })
})

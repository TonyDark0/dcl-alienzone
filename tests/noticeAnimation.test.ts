import { describe, expect, it } from 'vitest'
import { noticeAnimation, NOTICE_ANIMATION_SECONDS } from '../src/presentation/noticeAnimation'

describe('coin pickup readability', () => {
  it('makes only coin notices 2.2 times larger with a stronger outline and extra name clearance', () => {
    const ordinary = noticeAnimation(0.5),
      coin = noticeAnimation(0.5, true)
    expect(ordinary.scale).toBe(1)
    expect(coin.scale).toBe(2.2)
    expect(coin.outline).toBeGreaterThan(ordinary.outline)
    expect(coin.height).toBeGreaterThan(ordinary.height)
    expect(coin.visibility).toBe(1)
    expect(coin.rise).toBeGreaterThan(ordinary.rise)
  })
  it('keeps the grow/hold/rise/shrink/fade sequence and restores the ordinary profile', () => {
    expect(noticeAnimation(0, true)).toMatchObject({ visibility: 0, scale: 1.1 })
    expect(noticeAnimation(0.14, true)).toMatchObject({ visibility: 1, scale: 2.2 })
    expect(noticeAnimation(1.5, true).visibility).toBe(1)
    const exit = noticeAnimation(2, true)
    expect(exit.visibility).toBeGreaterThan(0)
    expect(exit.visibility).toBeLessThan(1)
    expect(exit.scale).toBeLessThan(2.2)
    expect(noticeAnimation(NOTICE_ANIMATION_SECONDS, true).visibility).toBe(0)
    expect(noticeAnimation(0.5, false).outline).toBe(0.14)
  })
})

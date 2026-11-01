import { describe, expect, it } from 'vitest'
import {
  createLoadoutDraft,
  epicPlacement,
  moveLoadoutCard,
  replaceLoadoutCard,
  selectLoadoutSlot
} from '../src/ui/state/loadoutDraft'
import { validateLoadout } from '../src/game/rules/loadouts'
import { loadoutLayout } from '../src/ui/theme/loadoutLayout'

describe('round-block editor draft', () => {
  it('starts with exactly three independent decks of three cards', () => {
    const a = createLoadoutDraft(),
      b = createLoadoutDraft()
    expect(a.plan.map((row) => row.length)).toEqual([3, 3, 3])
    expect(validateLoadout(a.plan)).toBe(true)
    a.plan[0][0] = 'SHADOW'
    expect(a.plan[1][0]).toBe('FREEZE')
    expect(b.plan[0][0]).toBe('FREEZE')
  })
  it('replaces only the explicitly selected round and slot, without mutating the previous draft', () => {
    const before = selectLoadoutSlot(createLoadoutDraft(), 1, 2)
    const after = replaceLoadoutCard(before, 'SHADOW')
    expect(after.plan[1]).toEqual(['FREEZE', 'SKIP', 'SHADOW'])
    expect(after.plan[0]).toEqual(before.plan[0])
    expect(after.plan[2]).toEqual(before.plan[2])
    expect(before.plan[1][2]).toBe('INVISIBLE')
    expect(after.message).toBe('Round 2 · Card 3 changed to SHADOW.')
  })
  it('identifies the exact occupied Epic slot, permits its own slot, and frees it when replaced', () => {
    const first = replaceLoadoutCard(createLoadoutDraft(), 'CHAOS')
    expect(epicPlacement(first, 'CHAOS')).toBeNull()
    const second = selectLoadoutSlot(first, 2, 2)
    expect(epicPlacement(second, 'CHAOS')).toEqual({ round: 0, slot: 0 })
    const denied = replaceLoadoutCard(second, 'CHAOS')
    expect(denied.plan).toBe(second.plan)
    expect(denied.message).toContain('Round 1 · Card 1')
    const freed = replaceLoadoutCard(selectLoadoutSlot(denied, 0, 0), 'FREEZE')
    expect(epicPlacement(selectLoadoutSlot(freed, 2, 2), 'CHAOS')).toBeNull()
    expect(validateLoadout(replaceLoadoutCard(selectLoadoutSlot(freed, 2, 2), 'CHAOS').plan)).toBe(true)
  })
  it('permits repeatable General cards and treats the current card as a no-op', () => {
    const before = createLoadoutDraft()
    expect(replaceLoadoutCard(before, 'FREEZE')).toBe(before)
    const after = replaceLoadoutCard(selectLoadoutSlot(before, 0, 1), 'FREEZE')
    expect(after.plan[0]).toEqual(['FREEZE', 'FREEZE', 'INVISIBLE'])
    expect(validateLoadout(after.plan)).toBe(true)
  })
  it('moves the selected card within its round, follows its new slot and ignores both boundaries', () => {
    const before = selectLoadoutSlot(createLoadoutDraft(), 1, 1)
    const earlier = moveLoadoutCard(before, -1)
    expect(earlier.plan[1]).toEqual(['SKIP', 'FREEZE', 'INVISIBLE'])
    expect(earlier.slot).toBe(0)
    expect(earlier.round).toBe(1)
    expect(earlier.plan[0]).toEqual(before.plan[0])
    expect(before.plan[1]).toEqual(['FREEZE', 'SKIP', 'INVISIBLE'])
    expect(moveLoadoutCard(earlier, -1)).toBe(earlier)
    const later = moveLoadoutCard(moveLoadoutCard(earlier, 1), 1)
    expect(later.plan[1]).toEqual(['FREEZE', 'INVISIBLE', 'SKIP'])
    expect(moveLoadoutCard(later, 1)).toBe(later)
  })
  it('rejects out-of-range or fractional selection indices', () => {
    const before = createLoadoutDraft()
    for (const [r, s] of [
      [-1, 0],
      [3, 0],
      [0, 3],
      [0, -1],
      [1.5, 0],
      [0, NaN]
    ]) {
      expect(selectLoadoutSlot(before, r, s)).toBe(before)
    }
  })
})

describe('loadout panel layout', () => {
  it.each([
    [1920, 1080, false, false],
    [1366, 768, false, true],
    [2560, 1080, false, false],
    [1600, 720, true, true]
  ])('keeps round blocks and the catalog separate at %ix%i', (w, h, mobile, compact) => {
    const layout = loadoutLayout(w, h, mobile, compact)
    expect(layout.stacked).toBe(false)
    expect(layout.deckWidth + layout.catalogWidth + layout.detailWidth + 32 + 2 * layout.padding).toBe(
      layout.panelWidth
    )
    expect(layout.catalogColumns * (layout.cardWidth + 12)).toBeLessThanOrEqual(layout.catalogWidth - 24)
    expect(layout.detailWidth - 24).toBeGreaterThan(260)
    expect((layout.deckWidth - 12) * 0.32).toBeGreaterThan(140)
    expect(layout.slotHeight).toBeGreaterThanOrEqual(44)
    const allDeckBlocksAndOrdering = 22 + 3 * (12 + 22 + layout.slotHeight + 8) + 20 + 48 + (compact ? 0 : 36)
    expect(allDeckBlocksAndOrdering).toBeLessThanOrEqual(layout.paneHeight)
    expect(layout.catalogRows * (layout.cardHeight + 12) + 180).toBeLessThanOrEqual(layout.paneHeight)
    expect(layout.cardHeight / layout.cardWidth).toBeGreaterThan(1.4)
    expect(layout.bodyHeight + 172 + layout.padding * 2).toBe(layout.panelHeight)
  })
  it('stacks both sections in a narrow aspect instead of squeezing them into columns', () => {
    const layout = loadoutLayout(800, 1000, false, true)
    expect(layout.stacked).toBe(true)
    expect(layout.deckWidth).toBe(layout.catalogWidth)
    expect(layout.detailWidth).toBe(layout.catalogWidth)
    expect(layout.deckWidth + layout.padding * 2).toBe(layout.panelWidth)
  })
  it.each([
    [400, 900, true],
    [800, 1000, false]
  ])('keeps narrow controls readable without changing the global renderer at %ix%i', (w, h, mobile) => {
    const layout = loadoutLayout(w, h, mobile, true)
    const scale = Math.min(w / (mobile ? 1600 : 1920), h / (mobile ? 720 : 1080))
    expect(layout.stacked).toBe(true)
    expect(layout.panelWidth * scale).toBeLessThanOrEqual(w)
    expect(layout.panelHeight * scale).toBeLessThanOrEqual(h)
    expect(layout.panelHeight * scale).toBeGreaterThan(h * 0.85)
    expect(44 * layout.density * scale).toBeGreaterThanOrEqual(43.9)
    expect(layout.catalogColumns * (layout.cardWidth + 12 * layout.density)).toBeLessThanOrEqual(
      layout.catalogWidth - 24 * layout.density
    )
    expect(layout.catalogRows * (layout.cardHeight + 12 * layout.density) + 180 * layout.density).toBeLessThanOrEqual(
      layout.paneHeight
    )
  })
})

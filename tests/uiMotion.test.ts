import { describe, expect, it } from 'vitest'
import { createMenuMotion, entranceMotion, stepMenuMotion } from '../src/ui/state/uiMotion'
import { getControlMotion, pressControl, setControlHovered } from '../src/ui/state/interactionState'
import { hudLayout } from '../src/ui/theme/hudLayout'

describe('sci-fi UI presentation without gameplay delays', () => {
  it('finishes an entrance, exits the old page, then enters the requested page', () => {
    const state = createMenuMotion('HOME', 0)
    expect(stepMenuMotion(state, 'HOME', 0).opacity).toBe(0)
    expect(stepMenuMotion(state, 'HOME', 220)).toMatchObject({ key: 'HOME', opacity: 1, blocking: false })
    expect(stepMenuMotion(state, 'HELP', 300)).toMatchObject({ key: 'HOME', blocking: true })
    expect(stepMenuMotion(state, 'HELP', 460)).toMatchObject({ key: 'HELP', opacity: 0, blocking: false })
    expect(stepMenuMotion(state, 'HELP', 680)).toMatchObject({ key: 'HELP', opacity: 1, blocking: false })
  })

  it('rapid navigation resolves to the latest page without extending a blocking layer forever', () => {
    const state = createMenuMotion('HOME', 0)
    stepMenuMotion(state, 'HOME', 220)
    stepMenuMotion(state, 'HELP', 300)
    stepMenuMotion(state, 'RECORDS', 340)
    expect(stepMenuMotion(state, 'RECORDS', 460).key).toBe('RECORDS')
    expect(stepMenuMotion(state, 'RECORDS', 680).blocking).toBe(false)
  })

  it('can reverse a menu exit and restart a hidden picker cleanly', () => {
    const state = createMenuMotion('HOME', 0)
    stepMenuMotion(state, 'HELP', 300)
    expect(stepMenuMotion(state, 'HOME', 340).blocking).toBe(false)
    entranceMotion('test-picker', true, 160, 100)
    expect(entranceMotion('test-picker', true, 160, 260).opacity).toBe(1)
    entranceMotion('test-picker', false, 160, 300)
    expect(entranceMotion('test-picker', true, 160, 500).opacity).toBe(0)
  })

  it('animates hover in 120ms, preserves press feedback and ignores disabled presses', () => {
    const id = 'test-control'
    expect(getControlMotion(id, false, 1000).press).toBe(0)
    setControlHovered(id, true)
    getControlMotion(id, false, 1000)
    expect(getControlMotion(id, false, 1120).hover).toBe(1)
    pressControl(id, 1120)
    expect(getControlMotion(id, false, 1130).press).toBe(1)
    expect(getControlMotion(id, true, 1130).press).toBe(0)
    expect(getControlMotion(id, false, 1310).press).toBe(0)
    setControlHovered(id, false)
  })

  it.each([
    [844, 390, true],
    [1920, 1080, false],
    [1280, 720, false]
  ])('keeps the main dock separated and clear of a native right-corner reserve at %ix%i', (width, height, mobile) => {
    const layout = hudLayout(width, height, mobile)
    if (!layout.stacked) {
      const right = layout.virtualWidth / 2 + layout.passWidth / 2 + layout.gap + layout.wingWidth
      expect(right).toBeLessThanOrEqual(layout.virtualWidth - 224)
      expect(layout.gap).toBeGreaterThanOrEqual(12)
    }
    expect(layout.passWidth).toBeGreaterThanOrEqual(320)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@dcl/sdk/react-ecs', () => ({
  default: {
    createElement: (type: unknown, props: any, ...children: any[]) => ({
      type,
      props: props ?? {},
      children: children.flat(Infinity).filter(Boolean)
    })
  },
  UiEntity: 'UiEntity',
  Label: 'Label'
}))
vi.mock('../src/presentation/audioDirector', () => ({ playUiSound: vi.fn() }))
import { validateLoadout } from '../src/game/rules/loadouts'

type Node = { type: unknown; props: any; children: Node[] }
const nodes = (node: Node, visible = false): Node[] =>
  visible && node.props.uiTransform?.display === 'none'
    ? []
    : [node, ...(node.children ?? []).flatMap((child) => nodes(child, visible))]
let Editor: typeof import('../src/ui/components/MatchLoadoutEditor').MatchLoadoutEditor
beforeEach(async () => {
  vi.resetModules()
  Editor = (await import('../src/ui/components/MatchLoadoutEditor')).MatchLoadoutEditor
})

function harness(narrow = false) {
  const confirm = vi.fn(),
    back = vi.fn()
  const render = (visible = false) =>
    nodes(
      Editor({
        compact: true,
        viewport: narrow ? { width: 800, height: 1000, mobile: false } : { width: 1600, height: 720, mobile: true },
        onBack: back,
        onConfirm: confirm
      }) as Node,
      visible
    )
  const find = (id: string) => render().find((node) => node.props.interactionId === id)!
  const press = (id: string) => {
    const node = find(id)
    expect(node, id).toBeDefined()
    node.props.onPress()
  }
  const tier = (value: 'ALL' | 'GENERAL' | 'EPIC') => press(`loadout-tier:${value}`)
  const page = (value: number) =>
    render()
      .find((node) => node.props.id === 'loadout-catalog')!
      .props.onPage(value)
  return { confirm, back, render, find, press, tier, page }
}

describe('preview / equip round-deck workshop', () => {
  it('shows nine slots and whole portrait cards with separate preview and equip, never a hidden immediate replacement', () => {
    const h = harness()
    const slots = h.render().filter((n) => String(n.props.interactionId).startsWith('loadout-slot:'))
    expect(slots).toHaveLength(9)
    expect(slots.filter((n) => n.props.selected)).toHaveLength(1)
    for (const round of [1, 2, 3]) expect(h.render().some((n) => n.props.value === `ROUND ${round}`)).toBe(true)
    expect(h.find('loadout-move:-1').props.disabled).toBe(true)
    const catalog = h.render().filter((n) => String(n.props.interactionId).startsWith('loadout-preview:'))
    expect(catalog).toHaveLength(3)
    expect(catalog.every((n) => n.props.portrait && n.props.height > n.props.width)).toBe(true)
    h.tier('EPIC')
    h.press('loadout-preview:SHADOW')
    h.press('loadout-confirm')
    expect(h.confirm.mock.calls[0][0][0][0]).toBe('FREEZE')
    expect(h.render().some((n) => n.props.value === 'CARD PREVIEW · NOT EQUIPPED')).toBe(true)
    h.press('loadout-equip')
    expect(h.find('loadout-slot:0:0').props.type).toBe('SHADOW')
    expect(h.find('loadout-equip').props.disabled).toBe(true)
    expect(h.render().some((n) => n.props.value === 'EQUIPPED IN THIS SLOT')).toBe(true)
  })
  it('reaches all eight deck cards through filters/pages, excluding Rare pickups', () => {
    const h = harness(),
      all: string[] = []
    for (const category of ['GENERAL', 'EPIC'] as const) {
      h.tier(category)
      for (const index of [0, 1]) {
        h.page(index)
        all.push(
          ...h
            .render()
            .filter((n) => String(n.props.interactionId).startsWith('loadout-preview:'))
            .map((n) => n.props.card.type)
        )
      }
    }
    expect(all).toHaveLength(8)
    expect(new Set(all).size).toBe(8)
    expect(all).not.toContain('TURBO')
    expect(all).not.toContain('DUPLICATE')
  })
  it('previews occupied Epics, blocks duplicate equip even through a stale callback, edits only its selected round/slot', () => {
    const h = harness()
    h.tier('EPIC')
    h.press('loadout-preview:SHADOW')
    h.press('loadout-equip')
    h.press('loadout-slot:1:1')
    h.press('loadout-preview:SHADOW')
    expect(h.find('loadout-preview:SHADOW').props.actionLabel).toBe('USED R1 / C1')
    expect(h.find('loadout-equip').props.disabled).toBe(true)
    h.press('loadout-equip')
    expect(h.find('loadout-slot:1:1').props.type).toBe('SKIP')
    h.page(1)
    h.press('loadout-preview:VACUNE')
    h.press('loadout-equip')
    h.press('loadout-move:-1')
    expect(h.find('loadout-slot:1:0').props.selected).toBe(true)
    expect(h.find('loadout-slot:1:0').props.type).toBe('VACUNE')
    expect(h.find('loadout-slot:0:0').props.type).toBe('SHADOW')
    h.press('loadout-slot:2:0')
    h.page(1)
    h.press('loadout-preview:SYMBIOSIS')
    h.press('loadout-equip')
    h.press('loadout-confirm')
    const plan = h.confirm.mock.calls[0][0]
    expect(validateLoadout(plan)).toBe(true)
    expect(plan.map((r: string[]) => r[0])).toEqual(['SHADOW', 'VACUNE', 'SYMBIOSIS'])
    h.tier('GENERAL')
    h.press('loadout-preview:FREEZE')
    h.press('loadout-equip')
    expect(plan[2][0]).toBe('SYMBIOSIS')
    h.press('loadout-back')
    expect(h.back).toHaveBeenCalledOnce()
  })
  it('switches narrow layouts through rounds → library → detail → equipped rounds, without a scroll region', () => {
    const h = harness(true)
    expect(h.render(true).some((n) => n.props.value === 'CARD LIBRARY')).toBe(false)
    h.press('loadout-slot:2:1')
    expect(h.render(true).some((n) => n.props.value === 'CARD LIBRARY')).toBe(true)
    h.tier('EPIC')
    h.press('loadout-preview:SHADOW')
    expect(h.render(true).some((n) => n.props.value === 'CARD PREVIEW · NOT EQUIPPED')).toBe(true)
    h.press('loadout-equip')
    expect(h.render(true).filter((n) => String(n.props.interactionId).startsWith('loadout-slot:'))).toHaveLength(9)
    expect(h.find('loadout-slot:2:1').props.type).toBe('SHADOW')
  })
})

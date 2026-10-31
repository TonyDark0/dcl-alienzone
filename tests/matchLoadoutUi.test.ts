import { describe, expect, it, vi } from 'vitest'
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
import { MatchLoadoutEditor } from '../src/ui/components/MatchLoadoutEditor'
import { CardTile } from '../src/ui/components/CardTile'
import { ActionButton } from '../src/ui/components/ActionButton'
import { validateLoadout } from '../src/game/rules/loadouts'
type Node = { type: unknown; props: any; children: Node[] }
const nodes = (node: Node): Node[] => [node, ...(node.children ?? []).flatMap(nodes)]
describe('pre-match touch deck builder', () => {
  it('shows all nine slots in three round blocks, edits only the selected slot and submits a detached valid plan', () => {
    const confirm = vi.fn(),
      back = vi.fn()
    const render = () =>
      nodes(
        MatchLoadoutEditor({
          compact: true,
          viewport: { width: 1600, height: 720, mobile: true },
          onBack: back,
          onConfirm: confirm
        }) as Node
      )
    let tree = render()
    const tier = (value: 'GENERAL' | 'EPIC') => {
      render()
        .find((node) => node.props.interactionId === `loadout-tier:${value}`)!
        .props.onPress()
    }
    const page = (value: number) => {
      render()
        .find((node) => node.props.id === 'loadout-catalog')!
        .props.onPage(value)
    }
    const slots = tree.filter((node) => String(node.props.interactionId).startsWith('loadout-slot:'))
    expect(slots).toHaveLength(9)
    expect(slots.filter((node) => node.props.selected)).toHaveLength(1)
    for (const round of [1, 2, 3]) expect(tree.some((node) => node.props.value === `ROUND ${round}`)).toBe(true)
    expect(tree.some((node) => node.props.value === '3 ROUNDS · 3 CARDS EACH')).toBe(true)
    expect(tree.some((node) => node.props.value === 'CHANGE ROUND 1 · CARD 1')).toBe(true)
    expect(tree.find((node) => node.props.interactionId === 'loadout-move:-1')!.props.disabled).toBe(true)
    const catalogue = tree.filter(
      (node) => node.type === CardTile && String(node.props.interactionId).startsWith('loadout-add:')
    )
    expect(catalogue).toHaveLength(2)
    expect(catalogue.every((node) => node.props.wrapTitle)).toBe(true)
    expect(catalogue.every((node) => node.props.horizontal)).toBe(true)
    expect(catalogue.some((node) => ['TURBO', 'DUPLICATE'].includes(node.props.card.type))).toBe(false)
    const allCards: string[] = []
    for (const category of ['GENERAL', 'EPIC'] as const) {
      tier(category)
      for (const index of [0, 1]) {
        page(index)
        allCards.push(
          ...render()
            .filter((node) => node.type === CardTile)
            .map((node) => node.props.card.type)
        )
      }
    }
    expect(new Set(allCards).size).toBe(8)
    expect(allCards).toHaveLength(8)
    tier('EPIC')
    render()
      .find((node) => node.props.interactionId === 'loadout-add:SHADOW')!
      .props.onPress()
    tree = render()
    tree.find((node) => node.props.interactionId === 'loadout-slot:1:1')!.props.onPress()
    tier('EPIC')
    tree = render()
    expect(tree.some((node) => node.props.value === 'CHANGE ROUND 2 · CARD 2')).toBe(true)
    const usedShadow = tree.find((node) => node.props.interactionId === 'loadout-add:SHADOW')!
    expect(usedShadow.props.interactionDisabled).toBe(true)
    expect(usedShadow.props.actionLabel).toBe('USED: R1 · C1')
    // Stale callbacks cannot duplicate the Epic even if an input slips past a disabled control.
    tree.find((node) => node.props.interactionId === 'loadout-add:SHADOW')!.props.onPress()
    expect(render().some((node) => String(node.props.value).includes('SHADOW is already in Round 1 · Card 1'))).toBe(
      true
    )
    tree = render()
    page(1)
    tree = render()
    tree.find((node) => node.props.interactionId === 'loadout-add:VACUNE')!.props.onPress()
    tree = render()
    expect(tree.find((node) => node.props.interactionId === 'loadout-add:VACUNE')!.props.actionLabel).toBe(
      'IN THIS SLOT'
    )
    tree.find((node) => node.props.interactionId === 'loadout-move:-1')!.props.onPress()
    tree = render()
    expect(tree.find((node) => node.props.interactionId === 'loadout-slot:1:0')!.props.selected).toBe(true)
    expect(tree.find((node) => node.props.interactionId === 'loadout-slot:0:0')!.props.type).toBe('SHADOW')
    tree.find((node) => node.props.interactionId === 'loadout-slot:2:0')!.props.onPress()
    tier('EPIC')
    page(1)
    tree = render()
    tree.find((node) => node.props.interactionId === 'loadout-add:SYMBIOSIS')!.props.onPress()
    expect(confirm).not.toHaveBeenCalled()
    render()
      .find((node) => node.props.interactionId === 'loadout-confirm')!
      .props.onPress()
    expect(confirm).toHaveBeenCalledOnce()
    const plan = confirm.mock.calls[0][0]
    expect(validateLoadout(plan)).toBe(true)
    expect(plan.map((round: string[]) => round[0])).toEqual(['SHADOW', 'VACUNE', 'SYMBIOSIS'])
    tier('GENERAL')
    render()
      .find((node) => node.props.interactionId === 'loadout-add:FREEZE')!
      .props.onPress()
    expect(plan[2][0]).toBe('SYMBIOSIS')
    render()
      .find((node) => node.props.interactionId === 'loadout-back')!
      .props.onPress()
    expect(back).toHaveBeenCalledOnce()
  })
})

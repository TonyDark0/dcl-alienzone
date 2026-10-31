import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UiCardView, UiSeatView } from '../src/ui/state/uiState'

interface ElementNode {
  type: unknown
  props: Record<string, any>
  children: ElementNode[]
}
vi.mock('@dcl/sdk/react-ecs', () => ({
  default: {
    createElement: (type: unknown, props: Record<string, any> | null, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children: children.flat(Infinity).filter(Boolean)
    })
  },
  UiEntity: 'UiEntity',
  Label: 'Label'
}))
vi.mock('../src/presentation/audioDirector', () => ({ playUiSound: vi.fn() }))

import { ActionButton } from '../src/ui/components/ActionButton'
import { CardHand } from '../src/ui/components/CardHand'
import { CardTile } from '../src/ui/components/CardTile'
import { SciFiSurface } from '../src/ui/components/SciFiSurface'
import { CARD_DETAILS } from '../src/game/rules/deck'

function nodes(node: ElementNode): ElementNode[] {
  return [node, ...(node.children ?? []).flatMap(nodes)]
}
const equip = vi.fn(),
  activate = vi.fn()
const freeze: UiCardView = {
  ...CARD_DETAILS.FREEZE,
  type: 'FREEZE',
  id: 'freeze',
  category: 'INTERVENTION',
  state: 'AVAILABLE'
}
const seats = [
  { id: 0, displayName: 'YOU' },
  { id: 1, displayName: 'VEGA' }
] as UiSeatView[]
function hand(cards: UiCardView[], interactionDisabled = false) {
  return CardHand({
    cards,
    compact: true,
    interactionDisabled,
    onEquip: equip,
    onActivate: activate,
    seats,
    localSeatId: 0
  }) as unknown as ElementNode
}
beforeEach(() => {
  hand([], true)
  equip.mockClear()
  activate.mockClear()
})

describe('skinned control contracts', () => {
  it('browsing and loading never activates an intervention; the loaded slot does', () => {
    const header = nodes(hand([freeze])).find(
      (n) => n.type === ActionButton && n.props.interactionId === 'card-category:INTERVENTION'
    )!
    header.props.onPress()
    expect(activate).not.toHaveBeenCalled()
    const tile = nodes(hand([freeze])).find((n) => n.type === CardTile && n.props.interactionId === 'deck-card:freeze')!
    tile.props.onPress()
    expect(equip).toHaveBeenCalledWith('freeze', 'INTERVENTION')
    expect(activate).not.toHaveBeenCalled()
    const loaded = nodes(hand([{ ...freeze, state: 'ARMED' }])).find(
      (n) => n.type === CardTile && n.props.interactionId === 'intervention-ready'
    )!
    loaded.props.onPress()
    expect(activate).toHaveBeenCalledExactlyOnceWith('freeze')
  })

  it('Chaos without a destination opens selection, then loads a target without activating', () => {
    const chaos: UiCardView = {
      ...CARD_DETAILS.CHAOS,
      type: 'CHAOS',
      category: 'INTERVENTION',
      id: 'chaos',
      state: 'ARMED'
    }
    nodes(hand([chaos]))
      .find((n) => n.type === CardTile && n.props.interactionId === 'intervention-ready')!
      .props.onPress()
    expect(activate).not.toHaveBeenCalled()
    nodes(hand([chaos]))
      .find((n) => n.type === ActionButton && n.props.interactionId === 'chaos-target:1')!
      .props.onPress()
    expect(equip).toHaveBeenCalledExactlyOnceWith('chaos', 'INTERVENTION', 1)
    expect(activate).not.toHaveBeenCalled()
  })

  it('dispatches enabled actions immediately, and disabled or active passive tiles have no handler', () => {
    const press = vi.fn()
    const button = ActionButton({ label: 'PASS', onPress: press }) as unknown as ElementNode
    nodes(button)
      .find((n) => n.props.onMouseDown)!
      .props.onMouseDown()
    expect(press).toHaveBeenCalledTimes(1)
    expect(
      nodes(ActionButton({ label: 'WAIT', disabled: true, onPress: press }) as unknown as ElementNode).some(
        (n) => n.props.onMouseDown
      )
    ).toBe(false)
    const passive = CardTile({
      card: { ...freeze, state: 'ACTIVE' },
      passive: true,
      onPress: press
    }) as unknown as ElementNode
    expect(passive.props.onMouseDown).toBeUndefined()
  })

  it('decorative frame and fill never intercept input or reduce child icon opacity', () => {
    const surface = SciFiSurface({}) as unknown as ElementNode
    for (const node of nodes(surface)) {
      expect(node.props.uiTransform.pointerFilter).toBe('none')
      expect(node.props.onMouseDown).toBeUndefined()
      expect(node.props.uiTransform.opacity).toBeUndefined()
      expect(node.props.uiTransform.width).toBe('100%')
      expect(node.props.uiTransform.height).toBe('100%')
    }
  })
})

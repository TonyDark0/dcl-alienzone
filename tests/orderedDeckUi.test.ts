import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UiCardView } from '../src/ui/state/uiState'
const fixture = vi.hoisted(() => ({ order: vi.fn(), activate: vi.fn(), target: vi.fn(), mobile: true }))
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
vi.mock('@dcl/sdk/platform', () => ({ isMobile: () => fixture.mobile }))
vi.mock('../src/presentation/audioDirector', () => ({ playUiSound: vi.fn() }))
vi.mock('../src/client/gameClient', () => ({
  requestDeckOrder: fixture.order,
  requestCurrentCard: fixture.activate,
  requestCardTarget: fixture.target
}))
import { OrderedDeck } from '../src/ui/components/OrderedDeck'
import { ActionButton } from '../src/ui/components/ActionButton'
import { CardTile } from '../src/ui/components/CardTile'
import { resetLabUi, updateUiState } from '../src/ui/state/uiState'
import { CHASE_CARD_DETAILS } from '../src/game/rules/chaseCards'
type Node = { type: unknown; props: any; children: Node[] }
const nodes = (node: Node): Node[] => [node, ...(node.children ?? []).flatMap(nodes)]
let match = 0
beforeEach(() => {
  resetLabUi()
  fixture.order.mockClear()
  fixture.activate.mockClear()
  fixture.target.mockClear()
  fixture.mobile = true
  const cards: UiCardView[] = (['FREEZE', 'SKIP', 'INVISIBLE'] as const).map((type, index) => ({
    ...CHASE_CARD_DETAILS[type],
    id: `card-${index}`,
    type,
    category: 'INTERVENTION',
    state: index === 0 ? 'ARMED' : 'AVAILABLE'
  }))
  updateUiState({ matchId: `ui-${++match}`, phase: 'HOLDING', localSeatId: 0, cards })
})
describe('touch-compatible single deck UI', () => {
  it('shows irreversible active Chaos in the ready slot and disables ordering/activation', () => {
    const chaos: UiCardView = {
      ...CHASE_CARD_DETAILS.CHAOS,
      tier: 'EPIC',
      id: 'chaos',
      type: 'CHAOS',
      category: 'INTERVENTION',
      state: 'ACTIVE'
    }
    updateUiState({
      cards: [
        chaos,
        { ...CHASE_CARD_DETAILS.FREEZE, id: 'later', type: 'FREEZE', category: 'INTERVENTION', state: 'AVAILABLE' }
      ]
    })
    const tree = nodes(OrderedDeck({ compact: true }) as Node)
    const tile = tree.find((node) => node.type === CardTile)!
    expect(tile.props.card.type).toBe('CHAOS')
    expect(tile.props.passive).toBe(true)
    expect(tile.props.stateLabel).toContain('LOCKED')
    expect(
      tree.find((node) => node.type === ActionButton && node.props.interactionId === 'order-deck-open')!.props.disabled
    ).toBe(true)
    expect(tree.some((node) => node.props.label === 'CHOOSE TARGET')).toBe(false)
  })
  it('shows a five-second setup with make-first and arrow controls, never activation', () => {
    updateUiState({ phase: 'DECK_SETUP', lobbyCountdown: 5 })
    const tree = nodes(OrderedDeck({ compact: true, setup: true }) as Node)
    expect(tree.some((node) => String(node.props.value).includes('ORDER YOUR DECK · 5s'))).toBe(true)
    const cards = tree.filter((node) => node.type === CardTile)
    expect(cards).toHaveLength(3)
    cards[2].props.onPress()
    expect(fixture.order).toHaveBeenCalledExactlyOnceWith(['card-2', 'card-0', 'card-1'])
    expect(fixture.activate).not.toHaveBeenCalled()
    tree
      .find((node) => node.type === ActionButton && node.props.interactionId === 'queue-right:card-0')!
      .props.onPress()
    expect(fixture.order).toHaveBeenLastCalledWith(['card-1', 'card-0', 'card-2'])
  })
  it('offers one touch-ready card, no separate category controls, with a non-pausing live picker', () => {
    let tree = nodes(OrderedDeck({ compact: true }) as Node)
    expect(tree.filter((node) => node.type === CardTile)).toHaveLength(1)
    const ready = tree.find((node) => node.type === CardTile)!
    expect(ready.props.actionLabel).toBe('ACTIVATE')
    ready.props.onPress()
    expect(fixture.activate).toHaveBeenCalledOnce()
    tree.find((node) => node.type === ActionButton && node.props.interactionId === 'order-deck-open')!.props.onPress()
    tree = nodes(OrderedDeck({ compact: true }) as Node)
    expect(tree.some((node) => String(node.props.value).includes('does NOT pause'))).toBe(true)
    expect(
      tree.some(
        (node) => String(node.props.value).includes('INTERVENTION') || String(node.props.value).includes('REACTION')
      )
    ).toBe(false)
    expect(
      tree.find((node) => node.type === ActionButton && node.props.interactionId === 'queue-left:card-0')!.props
        .disabled
    ).toBe(true)
  })
  it('shows the shared activation cooldown without requiring hover to explain a disabled card', () => {
    updateUiState({ snapshotServerNow: 10, snapshotReceivedAtMs: Date.now(), cardReadyAt: 11.2 })
    const tree = nodes(OrderedDeck({ compact: true }) as Node)
    const ready = tree.find((node) => node.type === CardTile)!
    expect(ready.props.interactionDisabled).toBe(true)
    expect(ready.props.actionLabel).toBe('COOLDOWN')
    expect(ready.props.stateLabel).toContain('WAIT')
  })
})

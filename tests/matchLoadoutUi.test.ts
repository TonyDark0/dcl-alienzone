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
  it('edits all 3 rounds, rejects repeat Epics, excludes pickups and submits a valid 3x3 plan', () => {
    const confirm = vi.fn(),
      back = vi.fn()
    const render = () => nodes(MatchLoadoutEditor({ compact: true, onBack: back, onConfirm: confirm }) as Node)
    let tree = render()
    const catalogue = tree.filter(
      (node) => node.type === CardTile && String(node.props.interactionId).startsWith('loadout-add:')
    )
    expect(catalogue).toHaveLength(8)
    expect(catalogue.some((node) => ['TURBO', 'DUPLICATE'].includes(node.props.card.type))).toBe(false)
    catalogue.find((node) => node.props.card.type === 'SHADOW')!.props.onPress()
    tree = render()
    tree.find((node) => node.type === ActionButton && node.props.interactionId === 'loadout-round:1')!.props.onPress()
    tree = render()
    tree.find((node) => node.props.interactionId === 'loadout-add:SHADOW')!.props.onPress()
    expect(render().some((node) => String(node.props.value).includes('Each Epic can appear only once'))).toBe(true)
    tree = render()
    tree.find((node) => node.props.interactionId === 'loadout-add:VACUNE')!.props.onPress()
    tree = render()
    tree.find((node) => node.props.interactionId === 'loadout-round:2')!.props.onPress()
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
    render()
      .find((node) => node.props.interactionId === 'loadout-back')!
      .props.onPress()
    expect(back).toHaveBeenCalledOnce()
  })
})

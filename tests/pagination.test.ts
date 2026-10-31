import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
import { pageWindow } from '../src/ui/state/pagination'
import { PageNavigation } from '../src/ui/components/PageNavigation'
import { CardTile } from '../src/ui/components/CardTile'
import { CHASE_CARD_DETAILS } from '../src/game/rules/chaseCards'

type Node = { type: unknown; props: any; children: Node[] }
const nodes = (node: Node): Node[] => [node, ...(node.children ?? []).flatMap(nodes)]

describe('whole-item navigation', () => {
  it('shows every item exactly once without losing the last short page', () => {
    const items = Array.from({ length: 10 }, (_, i) => i)
    const pages = [0, 1, 2].map((index) => pageWindow(items, index, 4))
    expect(pages.flatMap((page) => page.items)).toEqual(items)
    expect(pages.map((page) => page.start)).toEqual([0, 4, 8])
    expect(pages.map((page) => page.items.length)).toEqual([4, 4, 2])
  })
  it('clamps invalid and stale pages, handles empty lists and preserves the input', () => {
    expect(pageWindow([], 99, 0)).toEqual({ page: 0, count: 1, start: 0, items: [] })
    expect(pageWindow([1, 2, 3], 99, 2).items).toEqual([3])
    expect(pageWindow([1, 2], -3, 1).page).toBe(0)
    expect(pageWindow([1, 2], NaN, NaN).items).toEqual([1])
    const values = [1, 2, 3]
    pageWindow(values, 0, 2).items.pop()
    expect(values).toEqual([1, 2, 3])
  })
  it('uses a three-unit cyan page rail and touch buttons with bounded navigation', () => {
    const onPage = vi.fn()
    const render = (page: number) => nodes(PageNavigation({ id: 'test', page, count: 3, onPage }) as Node)
    let tree = render(0)
    expect(tree.some((node) => node.props.uiTransform?.height === 3)).toBe(true)
    expect(tree.find((node) => node.props.interactionId === 'test:prev')!.props.disabled).toBe(true)
    tree.find((node) => node.props.interactionId === 'test:prev')!.props.onPress()
    expect(onPage).not.toHaveBeenCalled()
    tree.find((node) => node.props.interactionId === 'test:next')!.props.onPress()
    expect(onPage).toHaveBeenLastCalledWith(1)
    tree = render(2)
    expect(tree.find((node) => node.props.interactionId === 'test:next')!.props.disabled).toBe(true)
    tree.find((node) => node.props.interactionId === 'test:next')!.props.onPress()
    expect(onPage).toHaveBeenCalledOnce()
    expect(nodes(PageNavigation({ id: 'none', page: 0, count: 1, onPage }) as Node)[0].props.uiTransform.display).toBe(
      'none'
    )
  })
  it('keeps a horizontal catalog card entirely inside its fixed row', () => {
    const tree = nodes(
      CardTile({
        card: {
          ...CHASE_CARD_DETAILS.HIDDEN_WATCH,
          id: 'watch',
          type: 'HIDDEN_WATCH',
          category: 'INTERVENTION',
          tier: 'GENERAL',
          state: 'AVAILABLE'
        },
        horizontal: true,
        onPress: vi.fn()
      }) as Node
    )
    expect(tree[0].props.uiTransform.height).toBe(84)
    expect(tree.some((node) => node.props.value === 'HIDDEN WATCH')).toBe(true)
    const title = tree.find((node) => node.props.value === 'HIDDEN WATCH')!
    expect(title.props.uiTransform.height).toBe(42)
    expect(42 + 18 + 20).toBeLessThanOrEqual(tree[0].props.uiTransform.height)
  })
  it('does not request unstyleable native scrollbars in any scene-owned UI', () => {
    const visit = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((file) =>
        file.isDirectory()
          ? visit(resolve(dir, file.name))
          : file.name.endsWith('.tsx')
            ? [resolve(dir, file.name)]
            : []
      )
    for (const file of visit(resolve('src/ui'))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/overflow\s*:\s*['"]scroll['"]/)
    }
  })
})

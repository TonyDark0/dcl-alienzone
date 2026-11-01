import { readFileSync, readdirSync } from 'node:fs'
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
import { OBJECTIVE_STEPS, OBJECTIVE_GOAL, OBJECTIVE_LORE } from '../src/ui/state/tutorial'
import { ObjectiveInstructions } from '../src/ui/components/ObjectiveInstructions'

type Node = { type: unknown; props: any; children: Node[] }
const nodes = (node: Node): Node[] => [node, ...(node.children ?? []).flatMap(nodes)]
const render = (page: number, mobile = false) => nodes(ObjectiveInstructions({ page, compact: true, mobile }) as Node)

describe('illustrated Objective tutorial', () => {
  it('shows all six steps exactly once across three whole-step pages, with live captions', () => {
    const seen: string[] = []
    for (let page = 0; page < 3; page++) {
      const tree = render(page)
      expect(tree.filter((n) => n.props.uiBackground?.texture)).toHaveLength(2)
      expect(tree.some((n) => n.props.value === OBJECTIVE_LORE)).toBe(true)
      expect(tree.some((n) => n.props.value === OBJECTIVE_GOAL)).toBe(true)
      for (const step of OBJECTIVE_STEPS.slice(page * 2, page * 2 + 2)) {
        expect(tree.some((n) => n.props.value === step.description)).toBe(true)
        expect(tree.some((n) => String(n.props.value).endsWith(step.title))).toBe(true)
        seen.push(step.title)
      }
      expect(tree.some((n) => n.props.onMouseDown || n.props.onMouseUp)).toBe(false)
    }
    expect(new Set(seen).size).toBe(6)
  })
  it('shows Space and F only on desktop; mobile has explicit touch instructions', () => {
    expect(render(0).some((n) => n.props.value === 'SPACE · THROW')).toBe(true)
    expect(render(1).some((n) => n.props.value === 'F · ACTIVATE')).toBe(true)
    expect(render(0, true).some((n) => n.props.value === 'TAP THROW ALIEN')).toBe(true)
    expect(render(1, true).some((n) => n.props.value === 'TAP THE READY CARD')).toBe(true)
    expect(render(0, true).some((n) => String(n.props.value).includes('SPACE'))).toBe(false)
  })
  it('uses six distinct 256px alpha PNGs with exact-case paths and a small download budget', () => {
    let total = 0
    for (const step of OBJECTIVE_STEPS) {
      let cursor = process.cwd()
      for (const part of step.icon.split('/')) {
        expect(readdirSync(cursor)).toContain(part)
        cursor = resolve(cursor, part)
      }
      const bytes = readFileSync(step.icon)
      expect(bytes.subarray(1, 4).toString()).toBe('PNG')
      expect(bytes.readUInt32BE(16)).toBe(256)
      expect(bytes.readUInt32BE(20)).toBe(256)
      expect(bytes[25]).toBe(6)
      total += bytes.length
    }
    expect(new Set(OBJECTIVE_STEPS.map((s) => s.icon)).size).toBe(6)
    expect(total).toBeLessThan(150_000)
  })
  it('keeps a density-scaled narrow layout and icon layers non-blocking', () => {
    const tree = nodes(
      ObjectiveInstructions({ page: 2, compact: true, narrow: true, mobile: true, density: 4 }) as Node
    )
    for (const node of tree.filter((n) => n.props.uiBackground?.texture)) {
      expect(node.props.uiTransform.pointerFilter).toBe('none')
      expect(node.props.uiTransform.width).toBe(288)
    }
    expect(tree.filter((n) => n.props.uiTransform?.height === 166 * 4)).toHaveLength(2)
    expect(tree.some((n) => n.props.value === 'TAP LIT TARGETS')).toBe(true)
  })
  it('integrates three Objective pages and the selected, optimized Arcade logo into the lobby', () => {
    const source = readFileSync('src/ui/screens/LobbyScreen.tsx', 'utf8')
    expect(source).toContain('<ObjectiveInstructions')
    expect(source).toContain('[...OBJECTIVE_PAGES]')
    expect(source).toContain('az_logo_alienzone_arcade_v002.png')
    const logo = readFileSync('assets/Images/ui/branding/az_logo_alienzone_arcade_v002.png')
    expect(logo.readUInt32BE(16)).toBe(1024)
    expect(logo.readUInt32BE(20)).toBe(342)
    expect(logo[25]).toBe(6)
    expect(logo.length).toBeLessThan(900_000)
  })
})

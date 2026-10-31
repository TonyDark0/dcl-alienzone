import { beforeEach, describe, expect, it, vi } from 'vitest'

interface ElementNode {
  type: unknown
  props: Record<string, any>
  children: ElementNode[]
}

vi.mock('@dcl/sdk/ecs', () => ({
  engine: { RootEntity: 1 },
  UiCanvasInformation: { getOrNull: () => ({ width: 1920, height: 1080 }) }
}))
vi.mock('@dcl/sdk/platform', () => ({ isMobile: () => false }))
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
vi.mock('../src/client/gameClient', () => ({ requestContainmentTap: vi.fn() }))
vi.mock('../src/presentation/audioDirector', () => ({ playUiSound: vi.fn() }))

import { requestContainmentTap } from '../src/client/gameClient'
import { createContainmentChallenge } from '../src/game/rules/containment'
import { ActionButton } from '../src/ui/components/ActionButton'
import { ContainmentChallenge } from '../src/ui/components/ContainmentChallenge'
import { getUiState, resetLabUi, updateUiState } from '../src/ui/state/uiState'
import { syncMatchStateToUi } from '../src/ui/adapters/localMatchUiAdapter'
import { MatchEngine } from '../src/game/runtime/matchEngine'
import { setControlHovered } from '../src/ui/state/interactionState'
import { reconcileTapFeedback } from '../src/ui/state/containmentFeedback'
import { TakeoverFeedback } from '../src/ui/components/TakeoverFeedback'

function nodes(node: ElementNode): ElementNode[] {
  return [node, ...(node.children ?? []).flatMap(nodes)]
}
function render() {
  return ContainmentChallenge() as unknown as ElementNode | null
}
beforeEach(() => {
  resetLabUi()
  vi.mocked(requestContainmentTap).mockClear()
  updateUiState({
    matchId: 'ui-test',
    phase: 'TAKEOVER',
    round: 1,
    localSeatId: 0,
    takeoverVictimSeatId: 0,
    takeoverVictim: 'YOU',
    containment: createContainmentChallenge('ui-test', 17, 1, 0, 0),
    snapshotServerNow: 0.6,
    snapshotReceivedAtMs: Date.now()
  })
})

describe('takeover target UI', () => {
  it.each([1, 2, 3])('keeps taps and flashing red feedback local-victim-only in round %i', (round) => {
    updateUiState({ round, containment: createContainmentChallenge('ui-test', 17, round, 0, 0) })
    expect(nodes(render()!).some((node) => node.type === ActionButton)).toBe(true)
    expect((TakeoverFeedback() as unknown as ElementNode).props.uiTransform.display).toBe('flex')
    updateUiState({ localSeatId: 1 })
    expect(nodes(render()!).some((node) => node.type === ActionButton)).toBe(false)
    expect((TakeoverFeedback() as unknown as ElementNode).props.uiTransform.display).toBe('none')
  })
  it('highlights the available target on hover and flashes input separately from confirmed accuracy', () => {
    const id = 'containment:ui-test:containment:1:0'
    setControlHovered(id, true)
    const button = nodes(render()!).find((node) => node.type === ActionButton)!
    expect(button.props.accent).toBeDefined()
    setControlHovered(id, false)
    const pending = {
      challengeId: 'ui-test:containment:1',
      targetIndex: 0,
      status: 'PENDING' as const,
      atMs: Date.now()
    }
    updateUiState({ containmentPendingTarget: 0, containmentTapFeedback: pending })
    expect(nodes(render()!).map((node) => node.props.value)).toContain('TAP SENT')
    expect(nodes(render()!).map((node) => node.props.value)).not.toContain('HIT')
    const challenge = getUiState().containment!
    challenge.hits[0] = true
    const confirmed = reconcileTapFeedback(pending, challenge, Date.now())
    updateUiState({ containmentTapFeedback: confirmed })
    expect(nodes(render()!).map((node) => node.props.value)).toContain('HIT')
    expect(getUiState().heat).toBe(0)
    expect(reconcileTapFeedback(confirmed, challenge, Date.now() + 100)).toBe(confirmed)
    expect(reconcileTapFeedback(confirmed, null, Date.now())).toBeNull()
  })
  it('renders one target only for the attacked player and dispatches that target intent', () => {
    const buttons = nodes(render()!).filter((node) => node.type === ActionButton)
    expect(buttons).toHaveLength(1)
    expect(buttons[0].props.label).toBe('TAP')
    buttons[0].props.onPress()
    expect(requestContainmentTap).toHaveBeenCalledExactlyOnceWith('ui-test:containment:1', 0)
    expect(getUiState().heat).toBe(0)
  })

  it('does not expose a target to observers or outside takeover', () => {
    updateUiState({ localSeatId: 1 })
    expect(nodes(render()!).some((node) => node.type === ActionButton)).toBe(false)
    updateUiState({ localSeatId: null })
    expect(nodes(render()!).some((node) => node.type === ActionButton)).toBe(false)
    updateUiState({ phase: 'HOLDING' })
    expect(render()).toBeNull()
    updateUiState({ phase: 'MATCH_RESULT' })
    expect(render()).toBeNull()
  })

  it('hides an already submitted target immediately but does not suppress the next one', () => {
    updateUiState({ containmentPendingTarget: 0 })
    expect(nodes(render()!).some((node) => node.type === ActionButton)).toBe(false)
    updateUiState({ snapshotServerNow: 1.3, snapshotReceivedAtMs: Date.now() })
    const button = nodes(render()!).find((node) => node.type === ActionButton)!
    expect(button).toBeDefined()
    button.props.onPress()
    expect(requestContainmentTap).toHaveBeenCalledWith('ui-test:containment:1', 1)
  })

  it('does not replay a confirmed target, or show future targets during the lead-in', () => {
    getUiState().containment!.hits[0] = true
    expect(nodes(render()!).some((node) => node.type === ActionButton)).toBe(false)
    updateUiState({ snapshotServerNow: 0, snapshotReceivedAtMs: Date.now() })
    expect(nodes(render()!).some((node) => node.type === ActionButton)).toBe(false)
  })

  it('distinguishes the final breach from successful bonus accuracy', () => {
    const challenge = getUiState().containment!
    challenge.round = 3
    challenge.resolved = true
    challenge.bonusAwarded = true
    challenge.contained = false
    challenge.hits = [true, true, true, false, false]
    const labels = nodes(render()!).map((node) => node.props.value)
    expect(labels).toContain('CONTAINMENT BREACHED')
    expect(labels).toContain('3 / 5 HITS  •  +1')
    expect(labels).toContain('FINAL ATTACK • THE MATCH IS OVER')
    expect(nodes(render()!).some((node) => node.type === ActionButton)).toBe(false)
  })

  it('clears pending input between rounds and presents the server bonus as a numeric seat notice', () => {
    const game = new MatchEngine(17, 'ui-test')
    game.join('human', 'YOU')
    game.state.phase = 'TAKEOVER'
    game.state.round = 1
    game.state.now = 0.6
    game.state.takeoverVictimSeatId = 0
    game.state.containment = createContainmentChallenge('ui-test', 17, 1, 0, 0)
    updateUiState({ containmentPendingTarget: 0 })
    syncMatchStateToUi(game.snapshot(0))
    expect(getUiState().containmentPendingTarget).toBe(0)
    game.state.containment.hits[0] = true
    syncMatchStateToUi(game.snapshot(0))
    expect(getUiState().containmentPendingTarget).toBeNull()
    game.state.events.push({
      sequence: 1,
      at: 0.6,
      kind: 'CONTAINMENT',
      alienId: 'ORIGINAL',
      path: [0],
      heat: 1,
      message: 'CONTAINED'
    })
    syncMatchStateToUi(game.snapshot(0))
    expect(getUiState().seatNotices).toEqual([{ sequence: 1, seatId: 0, text: '+1', tone: 'POINTS' }])
    game.state.phase = 'HOLDING'
    game.state.round = 2
    game.state.containment = null
    syncMatchStateToUi(game.snapshot(0))
    expect(getUiState().containment).toBeNull()
    expect(getUiState().containmentPendingTarget).toBeNull()
  })
})

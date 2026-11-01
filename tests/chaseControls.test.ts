import { beforeEach, describe, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => ({
  tick: (_dt: number) => {},
  pressed: new Set<string>(),
  triggered: new Set<string>(),
  mobile: false,
  state: { arena: { players: [{ x: 16, z: 16, yaw: 0 }] } as any, phase: 'HOLDING', localSeatId: 0 as number | null },
  send: vi.fn(),
  throw: vi.fn(),
  activate: vi.fn()
}))
vi.mock('@dcl/sdk/ecs', () => ({
  engine: {
    addSystem: (tick: (dt: number) => void) => {
      fixture.tick = tick
    }
  },
  inputSystem: {
    isPressed: (key: string) => fixture.pressed.has(key),
    isTriggered: (key: string) => fixture.triggered.has(key)
  },
  InputAction: {
    IA_FORWARD: 'W',
    IA_BACKWARD: 'S',
    IA_LEFT: 'A',
    IA_RIGHT: 'D',
    IA_PRIMARY: 'E',
    IA_JUMP: 'SPACE',
    IA_SECONDARY: 'F'
  },
  PointerEventType: { PET_DOWN: 1 },
  PrimaryPointerInfo: { getOrNull: () => ({ worldRayDirection: { x: 1, y: -1, z: 0 } }) },
  Transform: { getOrNull: () => ({ position: { x: 16, y: 10, z: 16 } }) }
}))
vi.mock('@dcl/sdk/platform', () => ({ isMobile: () => fixture.mobile }))
vi.mock('../src/presentation/arenaActors', () => ({ getRenderedSeatPose: () => null }))
vi.mock('../src/ui/state/uiState', () => ({ getUiState: () => fixture.state }))
vi.mock('../src/client/gameClient', () => ({
  requestMove: fixture.send,
  requestPass: fixture.throw,
  requestCurrentCard: fixture.activate
}))
import { setupChaseControls } from '../src/client/chaseControls'

beforeEach(() => {
  fixture.pressed.clear()
  fixture.send.mockClear()
  fixture.throw.mockClear()
  fixture.activate.mockClear()
  fixture.triggered.clear()
  fixture.mobile = false
  fixture.state = { arena: { players: [{ x: 16, z: 16, yaw: 0 }] }, phase: 'HOLDING', localSeatId: 0 }
  setupChaseControls()
})
describe('running input intent stream', () => {
  it('sends key changes and release immediately, without coordinates or a score', () => {
    fixture.pressed.add('W')
    fixture.tick(0.016)
    expect(fixture.send).toHaveBeenLastCalledWith(1, 0, 1)
    fixture.pressed.clear()
    fixture.tick(0.016)
    expect(fixture.send).toHaveBeenLastCalledWith(0, 0, 2)
  })
  it('throttles held input and refreshes within the server timeout', () => {
    fixture.pressed.add('W')
    fixture.tick(0.01)
    for (let i = 0; i < 8; i++) fixture.tick(0.01)
    expect(fixture.send).toHaveBeenCalledTimes(1)
    fixture.tick(0.03)
    expect(fixture.send).toHaveBeenLastCalledWith(1, 0, 2)
  })
  it('sends full reversals and corners on the next frame, without a 50ms delay', () => {
    fixture.pressed.add('W')
    fixture.tick(1 / 120)
    fixture.pressed.delete('W')
    fixture.pressed.add('S')
    fixture.tick(1 / 120)
    expect(fixture.send).toHaveBeenLastCalledWith(1, Math.PI, 2)
    fixture.pressed.add('D')
    fixture.tick(1 / 120)
    expect(fixture.send).toHaveBeenLastCalledWith(1, (Math.PI * 3) / 4, 3)
    fixture.pressed.delete('S')
    fixture.tick(1 / 120)
    expect(fixture.send).toHaveBeenLastCalledWith(1, Math.PI / 2, 4)
  })
  it('does not send movement during takeover, intro, spectator or legacy mode', () => {
    fixture.pressed.add('D')
    for (const phase of ['TAKEOVER', 'ROUND_START', 'DECK_SETUP', 'COUNTDOWN', 'MATCH_RESULT']) {
      fixture.state.phase = phase
      fixture.tick(1)
    }
    fixture.state.phase = 'HOLDING'
    fixture.state.localSeatId = null
    fixture.tick(1)
    fixture.state.localSeatId = 0
    fixture.state.arena = null
    fixture.tick(1)
    expect(fixture.send).not.toHaveBeenCalled()
  })
  it.each([
    ['W', 0],
    ['D', Math.PI / 2],
    ['S', Math.PI],
    ['A', -Math.PI / 2]
  ] as const)('maps %s to screen-relative movement', (key, yaw) => {
    fixture.pressed.add(key)
    fixture.tick(0.12)
    expect(fixture.send).toHaveBeenLastCalledWith(1, yaw, 1)
  })
  it('normalizes diagonal speed, cancels opposing keys and maps Space/F to actions', () => {
    fixture.pressed.add('W')
    fixture.pressed.add('D')
    fixture.triggered.add('SPACE')
    fixture.triggered.add('F')
    fixture.tick(0.12)
    expect(fixture.send).toHaveBeenLastCalledWith(1, Math.PI / 4, 1)
    expect(fixture.throw).toHaveBeenCalledOnce()
    expect(fixture.activate).toHaveBeenCalledOnce()
    fixture.pressed.add('S')
    fixture.pressed.add('A')
    fixture.tick(0.12)
    expect(fixture.send).toHaveBeenLastCalledWith(0, Math.PI / 4, 2)
  })
  it('uses the mobile joystick direction without requiring a pointer or keyboard', () => {
    fixture.mobile = true
    fixture.pressed.add('A')
    fixture.pressed.add('S')
    fixture.tick(0.016)
    expect(fixture.send).toHaveBeenLastCalledWith(1, (-Math.PI * 3) / 4, 1)
  })
  it('E no longer throws; held Space does not repeat, and takeover ignores Space', () => {
    fixture.triggered.add('E')
    fixture.tick(0.016)
    expect(fixture.throw).not.toHaveBeenCalled()
    fixture.triggered.clear()
    fixture.triggered.add('SPACE')
    fixture.tick(0.016)
    expect(fixture.throw).toHaveBeenCalledOnce()
    fixture.triggered.clear()
    fixture.pressed.add('SPACE')
    fixture.tick(0.016)
    expect(fixture.throw).toHaveBeenCalledOnce()
    fixture.state.phase = 'TAKEOVER'
    fixture.triggered.add('SPACE')
    fixture.tick(0.016)
    expect(fixture.throw).toHaveBeenCalledOnce()
  })
})

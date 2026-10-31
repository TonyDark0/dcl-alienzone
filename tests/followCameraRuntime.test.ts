import { beforeEach, describe, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => ({
  entity: 10,
  pose: { x: 16, z: 16, yaw: 0 },
  serverPose: { x: 16, z: 16, yaw: 0 },
  transforms: new Map<number, any>(),
  systems: [] as Array<{ tick: (dt: number) => void; priority: number }>,
  virtualCamera: vi.fn(),
  lens: { fov: 50 },
  lock: { isPointerLocked: false },
  pointer: { screenCoordinates: { x: 600, y: 500 } },
  phase: 'HOLDING',
  round: 1,
  introElapsed: 0,
  localSeatId: 0 as number | null,
  victim: null as number | null
}))
vi.mock('@dcl/sdk/ecs', () => ({
  engine: {
    RootEntity: 0,
    CameraEntity: 1,
    addEntity: () => ++fixture.entity,
    addSystem: (tick: (dt: number) => void, priority = 100_000) => fixture.systems.push({ tick, priority })
  },
  Transform: {
    create: (entity: number, value: any) => fixture.transforms.set(entity, value),
    getMutable: (entity: number) => fixture.transforms.get(entity),
    get: () => {
      throw new Error('Do not read renderer-delayed camera Transforms')
    }
  },
  VirtualCamera: {
    create: (entity: number, config: any) => {
      fixture.lens.fov = config.fov
      fixture.virtualCamera(entity, config)
    },
    Transition: { Time: (seconds: number) => seconds },
    getOrNull: () => fixture.lens,
    getMutable: () => fixture.lens
  },
  MainCamera: { createOrReplace: vi.fn() },
  PointerLock: { getOrNull: () => fixture.lock, getMutable: () => fixture.lock },
  PrimaryPointerInfo: { getOrCreateMutable: () => fixture.pointer, getOrNull: () => fixture.pointer },
  UiCanvasInformation: { getOrNull: () => ({ width: 1920, height: 1080 }) }
}))
vi.mock('@dcl/sdk/math', () => ({
  Vector3: { create: (x: number, y: number, z: number) => ({ x, y, z }), Zero: () => ({ x: 0, y: 0, z: 0 }) },
  Quaternion: { fromLookAt: (from: any, target: any) => ({ from: { ...from }, target: { ...target } }) }
}))
vi.mock('@dcl/sdk/platform', () => ({ isMobile: () => false }))
vi.mock('../src/presentation/arenaActors', () => ({
  getRenderedSeatPose: () => fixture.pose,
  getSeatWorldPosition: () => ({ ...fixture.pose, y: 0 })
}))
vi.mock('../src/ui/state/uiState', () => ({
  getUiState: () => ({
    matchId: 'camera-test',
    arena: { players: [fixture.serverPose] },
    localSeatId: fixture.localSeatId,
    phase: fixture.phase,
    round: fixture.round,
    crewIntroElapsedSeconds: fixture.introElapsed,
    takeoverVictimSeatId: fixture.victim
  })
}))
import { setupOrbitCamera, setOrbitCameraActive } from '../src/client/orbitCamera'
import { globalDronePose, trackedDronePose } from '../src/presentation/chaseCameraMath'

beforeEach(() => {
  setOrbitCameraActive(false)
  fixture.transforms.clear()
  fixture.systems = []
  fixture.virtualCamera.mockClear()
  fixture.pose = { x: 16, z: 16, yaw: 0 }
  fixture.serverPose = { ...fixture.pose }
  fixture.lock.isPointerLocked = false
  fixture.pointer.screenCoordinates = { x: 600, y: 500 }
  fixture.phase = 'HOLDING'
  fixture.round = 1
  fixture.introElapsed = 0
  fixture.localSeatId = 0
  fixture.victim = null
  setupOrbitCamera()
  setOrbitCameraActive(true)
})

describe('local astronaut drone camera', () => {
  it('follows the rendered local actor after its update and writes one atomic camera pose', () => {
    expect(fixture.virtualCamera.mock.calls[0][1].lookAtEntity).toBeUndefined()
    expect(fixture.systems[0].priority).toBeLessThan(100_000)
    fixture.systems.push({
      priority: 100_000,
      tick: () => {
        fixture.pose = { x: 17, z: 18, yaw: 0.4 }
      }
    })
    for (const system of fixture.systems.sort((a, b) => b.priority - a.priority)) system.tick(1 / 60)
    const transform = fixture.transforms.get(fixture.entity),
      expected = trackedDronePose(fixture.pose)
    expect(transform.position).toEqual(expected.position)
    expect(transform.rotation).toEqual({ from: expected.position, target: expected.target })
    expect(transform.position.x).not.toBe(fixture.serverPose.x)
  })
  it('does not orbit or lag behind when the astronaut reverses heading', () => {
    const tick = fixture.systems[0].tick
    tick(1 / 60)
    const before = { ...fixture.transforms.get(fixture.entity).position }
    fixture.pose.yaw = Math.PI
    tick(1 / 60)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(before)
    fixture.pose.x -= 0.1
    fixture.pose.z -= 0.2
    tick(1 / 60)
    const transform = fixture.transforms.get(fixture.entity)
    expect(transform.position.x).toBeCloseTo(before.x - 0.1)
    expect(transform.position.z).toBeCloseTo(before.z - 0.2)
    expect(transform.rotation.target).toEqual(trackedDronePose(fixture.pose).target)
  })
  it('ignores cursor-recentering when Explorer captures/releases the mouse', () => {
    const tick = fixture.systems[0].tick
    tick(1 / 60)
    fixture.lock.isPointerLocked = true
    fixture.pointer.screenCoordinates = { x: 960, y: 540 }
    tick(1 / 60)
    expect(fixture.lock.isPointerLocked).toBe(false)
    fixture.pointer.screenCoordinates = { x: 600, y: 500 }
    tick(1 / 60)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(trackedDronePose(fixture.pose).position)
  })
  it.each([1, 2, 3])('shows another victim to everyone in round %i, then returns home', (round) => {
    const tick = fixture.systems[0].tick
    fixture.round = round
    fixture.phase = 'TAKEOVER'
    fixture.victim = 1
    tick(0.5)
    expect(fixture.transforms.get(fixture.entity).position).not.toEqual(trackedDronePose(fixture.pose).position)
    expect(fixture.lens.fov).toBe(50)
    tick(3.7)
    tick(0.7)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(trackedDronePose(fixture.pose).position)
    expect(fixture.lens.fov).toBeCloseTo(globalDronePose().fov)
  })
  it('prepares the own-suit close-up under countdown, then smoothly zooms out before deck setup', () => {
    fixture.phase = 'COUNTDOWN'
    fixture.systems[0].tick(0.016)
    const close = { ...fixture.transforms.get(fixture.entity).position }
    expect(close.y).toBeCloseTo(1.9)
    expect(fixture.lens.fov).toBe(50)
    fixture.phase = 'ROUND_START'
    fixture.systems[0].tick(0.3)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(close)
    fixture.systems[0].tick(1)
    expect(fixture.transforms.get(fixture.entity).position.y).toBeGreaterThan(close.y)
    expect(fixture.transforms.get(fixture.entity).position.y).toBeLessThan(trackedDronePose(fixture.pose).position.y)
    fixture.systems[0].tick(1.2)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(trackedDronePose(fixture.pose).position)
    fixture.phase = 'DECK_SETUP'
    fixture.systems[0].tick(0.016)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(trackedDronePose(fixture.pose).position)
  })
  it('does not replay the intro for a late join or a spectator', () => {
    fixture.phase = 'ROUND_START'
    fixture.introElapsed = 4
    fixture.systems[0].tick(0.016)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(trackedDronePose(fixture.pose).position)
    fixture.localSeatId = null
    fixture.phase = 'COUNTDOWN'
    fixture.systems[0].tick(0.016)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(globalDronePose().position)
  })
  it('keeps observers steady but shakes the local victim in the final round', () => {
    const tick = fixture.systems[0].tick
    fixture.round = 3
    fixture.phase = 'TAKEOVER'
    fixture.victim = 1
    tick(0.5)
    const observerPose = { ...fixture.transforms.get(fixture.entity).position }
    tick(0.1)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(observerPose)
    fixture.phase = 'HOLDING'
    tick(0.7)
    fixture.phase = 'TAKEOVER'
    fixture.victim = 0
    tick(0.5)
    const victimPose = { ...fixture.transforms.get(fixture.entity).position }
    tick(0.1)
    expect(fixture.transforms.get(fixture.entity).position).not.toEqual(victimPose)
    fixture.phase = 'HOLDING'
    fixture.victim = null
    tick(0.7)
    expect(fixture.transforms.get(fixture.entity).position).toEqual(trackedDronePose(fixture.pose).position)
  })
})

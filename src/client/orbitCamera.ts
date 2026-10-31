import {
  engine,
  Entity,
  MainCamera,
  PointerLock,
  PrimaryPointerInfo,
  Transform,
  VirtualCamera,
  UiCanvasInformation
} from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import type { SeatId } from '../game/model/types'
import { getRenderedSeatPose, getSeatWorldPosition } from '../presentation/arenaActors'
import { globalDronePose, trackedDronePose } from '../presentation/chaseCameraMath'
import { getUiState } from '../ui/state/uiState'

const CENTER = Vector3.create(globalDronePose().target.x, 0.665, globalDronePose().target.z)
const TAKEOVER_ENTER_SECONDS = 0.48
const TAKEOVER_RETURN_AT_SECONDS = 4.15
const TAKEOVER_RETURN_SECONDS = 0.62
const LOCAL_SHAKE_METERS = 0.035
const INTRO_HOLD_SECONDS = 0.6
const INTRO_ZOOM_SECONDS = 1.8

type CinematicMode = 'ORBIT' | 'ENTERING' | 'HOLDING' | 'RETURNING' | 'LOCKED_HOME'

let cameraEntity: Entity | null = null
let active = false
let mode: CinematicMode = 'ORBIT'
let wasTakeover = false
let takeoverElapsed = 0
let transitionElapsed = 0
let localVictim = false
let transitionFromPosition = Vector3.Zero()
let transitionFromTarget = Vector3.Zero()
let takeoverPosition = Vector3.Zero()
let takeoverTarget = Vector3.Zero()
let normalPosition = Vector3.Zero()
let normalTarget = CENTER
let cameraPosition = Vector3.Zero()
let cameraTarget = CENTER
let cameraFov = 50
let transitionFromFov = 50
let introElapsed = 0
let introMatchId: string | null = null

function normalLens(): number {
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  return globalDronePose((canvas?.width ?? 1920) / Math.max(1, canvas?.height ?? 1080)).fov
}

function cloneVector(value: Vector3): Vector3 {
  return Vector3.create(value.x, value.y, value.z)
}

function mix(from: Vector3, to: Vector3, amount: number): Vector3 {
  return Vector3.create(
    from.x + (to.x - from.x) * amount,
    from.y + (to.y - from.y) * amount,
    from.z + (to.z - from.z) * amount
  )
}

function smoothstep(value: number): number {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}

function currentNormalPose() {
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const aspect = (canvas?.width ?? 1920) / Math.max(1, canvas?.height ?? 1080)
  const state = getUiState()
  const player = state.localSeatId === null ? undefined : state.arena?.players[state.localSeatId]
  // Consume the same numerical pose just written by actors, including the owner's
  // invisible silhouette. No second smoothing stage or renderer feedback lag.
  const pose = player ? (getRenderedSeatPose(state.localSeatId!) ?? player) : null
  return pose ? trackedDronePose(pose, aspect) : globalDronePose(aspect)
}

function currentNormalPosition(): Vector3 {
  const pose = currentNormalPose()
  return Vector3.create(pose.position.x, pose.position.y, pose.position.z)
}

function currentNormalTarget(): Vector3 {
  const target = currentNormalPose().target
  return Vector3.create(target.x, target.y, target.z)
}

function setCameraPose(position: Vector3, target: Vector3, fov = normalLens()): void {
  if (cameraEntity === null) return
  cameraPosition = cloneVector(position)
  cameraTarget = cloneVector(target)
  Transform.getMutable(cameraEntity).position = position
  // Position and rotation travel in the SAME component update. A separate moving
  // lookAtEntity can lag behind the camera in the renderer while turning.
  Transform.getMutable(cameraEntity).rotation = Quaternion.fromLookAt(position, target)
  cameraFov = fov
  if (VirtualCamera.getOrNull(cameraEntity)?.fov !== fov) VirtualCamera.getMutable(cameraEntity).fov = fov
}

/** Reveal the assigned suit before the tracked drone view, never during a live fuse. */
function updateIntroCamera(dt: number): boolean {
  const state = getUiState()
  if (state.localSeatId === null || (state.phase !== 'COUNTDOWN' && state.phase !== 'ROUND_START')) return false
  if (introMatchId !== state.matchId || state.phase === 'COUNTDOWN') {
    introMatchId = state.matchId
    introElapsed = 0
  }
  if (state.phase === 'ROUND_START')
    introElapsed = Math.max(introElapsed + Math.max(0, dt), state.crewIntroElapsedSeconds ?? 0)
  const amount = smoothstep((introElapsed - INTRO_HOLD_SECONDS) / INTRO_ZOOM_SECONDS)
  const astronaut = getSeatWorldPosition(state.localSeatId)
  const yaw = state.arena?.players[state.localSeatId]?.yaw ?? 0
  // Front/three-quarter view inside the seat ring, not behind the room's walls.
  const position = Vector3.create(
    astronaut.x + Math.sin(yaw) * 1.6 + Math.cos(yaw) * 0.8,
    astronaut.y + 1.9,
    astronaut.z + Math.cos(yaw) * 1.6 - Math.sin(yaw) * 0.8
  )
  const target = Vector3.create(astronaut.x, astronaut.y + 0.95, astronaut.z)
  setCameraPose(
    mix(position, currentNormalPosition(), amount),
    mix(target, currentNormalTarget(), amount),
    50 + (normalLens() - 50) * amount
  )
  return true
}

function takeoverPose(seatId: SeatId): { position: Vector3; target: Vector3 } {
  const victim = getSeatWorldPosition(seatId)
  const radialX = victim.x - CENTER.x
  const radialZ = victim.z - CENTER.z
  const length = Math.max(0.001, Math.hypot(radialX, radialZ))
  const outwardX = radialX / length
  const outwardZ = radialZ / length
  const runner = getUiState().arena?.players[seatId]
  const tangentX = runner ? Math.cos(runner.yaw) : outwardZ
  const tangentZ = runner ? -Math.sin(runner.yaw) : -outwardX

  return {
    position: Vector3.create(
      victim.x + outwardX * 0.25 + tangentX * 1.8,
      victim.y + 1.42,
      victim.z + outwardZ * 0.25 + tangentZ * 1.8
    ),
    target: Vector3.create(victim.x - outwardX * 0.24, victim.y + 0.672, victim.z - outwardZ * 0.24)
  }
}

function beginTakeover(seatId: SeatId, isLocalVictim: boolean): void {
  if (cameraEntity === null) return
  const pose = takeoverPose(seatId)
  normalPosition = currentNormalPosition()
  normalTarget = currentNormalTarget()
  transitionFromPosition = cloneVector(cameraPosition)
  transitionFromTarget = cloneVector(cameraTarget)
  transitionFromFov = cameraFov
  takeoverPosition = pose.position
  takeoverTarget = pose.target
  takeoverElapsed = 0
  transitionElapsed = 0
  localVictim = isLocalVictim
  mode = 'ENTERING'
}

function beginReturn(): void {
  if (cameraEntity === null || mode === 'RETURNING' || mode === 'LOCKED_HOME') return
  transitionFromPosition = cloneVector(cameraPosition)
  transitionFromTarget = cloneVector(cameraTarget)
  transitionFromFov = cameraFov
  normalPosition = currentNormalPosition()
  normalTarget = currentNormalTarget()
  transitionElapsed = 0
  mode = 'RETURNING'
}

function updateTakeoverCamera(deltaSeconds: number): boolean {
  if (cameraEntity === null) return false
  const state = getUiState()
  const inTakeover = state.phase === 'TAKEOVER' && state.takeoverVictimSeatId !== null

  if (inTakeover && !wasTakeover) {
    wasTakeover = true
    beginTakeover(state.takeoverVictimSeatId!, state.takeoverVictimSeatId === state.localSeatId)
  } else if (!inTakeover && wasTakeover) {
    wasTakeover = false
    beginReturn()
  }

  if (!inTakeover && mode === 'LOCKED_HOME') mode = 'ORBIT'
  if (mode === 'ORBIT') return false

  takeoverElapsed += Math.max(0, deltaSeconds)
  if (inTakeover && takeoverElapsed >= TAKEOVER_RETURN_AT_SECONDS && mode !== 'RETURNING' && mode !== 'LOCKED_HOME') {
    beginReturn()
  }

  if (mode === 'ENTERING') {
    transitionElapsed += Math.max(0, deltaSeconds)
    const amount = smoothstep(transitionElapsed / TAKEOVER_ENTER_SECONDS)
    setCameraPose(
      mix(transitionFromPosition, takeoverPosition, amount),
      mix(transitionFromTarget, takeoverTarget, amount),
      transitionFromFov + (50 - transitionFromFov) * amount
    )
    if (amount >= 1) mode = 'HOLDING'
    return true
  }

  if (mode === 'HOLDING') {
    const shake = localVictim
      ? Vector3.create(
          Math.sin(takeoverElapsed * 47) * LOCAL_SHAKE_METERS,
          Math.sin(takeoverElapsed * 61) * LOCAL_SHAKE_METERS * 0.55,
          Math.cos(takeoverElapsed * 43) * LOCAL_SHAKE_METERS
        )
      : Vector3.Zero()
    setCameraPose(
      Vector3.create(takeoverPosition.x + shake.x, takeoverPosition.y + shake.y, takeoverPosition.z + shake.z),
      takeoverTarget,
      50
    )
    return true
  }

  if (mode === 'RETURNING') {
    transitionElapsed += Math.max(0, deltaSeconds)
    const amount = smoothstep(transitionElapsed / TAKEOVER_RETURN_SECONDS)
    setCameraPose(
      mix(transitionFromPosition, normalPosition, amount),
      mix(transitionFromTarget, normalTarget, amount),
      transitionFromFov + (normalLens() - transitionFromFov) * amount
    )
    if (amount >= 1) mode = inTakeover ? 'LOCKED_HOME' : 'ORBIT'
    return true
  }

  setCameraPose(normalPosition, normalTarget)
  return true
}

export function setupOrbitCamera() {
  PrimaryPointerInfo.getOrCreateMutable(engine.RootEntity)

  cameraEntity = engine.addEntity()
  normalPosition = currentNormalPosition()
  Transform.create(cameraEntity, { position: normalPosition })
  VirtualCamera.create(cameraEntity, {
    fov: normalLens(),
    defaultTransition: { transitionMode: VirtualCamera.Transition.Time(0) }
  })

  engine.addSystem(
    (deltaSeconds) => {
      if (!active || cameraEntity === null) return
      if (getUiState().arena && PointerLock.getOrNull(engine.CameraEntity)?.isPointerLocked)
        PointerLock.getMutable(engine.CameraEntity).isPointerLocked = false
      if (updateIntroCamera(deltaSeconds)) return
      if (updateTakeoverCamera(deltaSeconds)) return
      setCameraPose(currentNormalPosition(), currentNormalTarget())
    },
    90_000,
    'alienzone-drone-camera-after-actors'
  )
}

export function setOrbitCameraActive(nextActive: boolean) {
  if (cameraEntity === null || active === nextActive) return
  active = nextActive
  if (nextActive) {
    normalPosition = currentNormalPosition()
    normalTarget = currentNormalTarget()
    setCameraPose(normalPosition, normalTarget)
    updateIntroCamera(0)
  } else {
    mode = 'ORBIT'
    wasTakeover = false
    takeoverElapsed = 0
    localVictim = false
    introElapsed = 0
    introMatchId = null
  }
  MainCamera.createOrReplace(engine.CameraEntity, {
    virtualCameraEntity: nextActive ? cameraEntity : undefined
  })
}

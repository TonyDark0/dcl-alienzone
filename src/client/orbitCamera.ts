import { engine, Entity, MainCamera, PointerLock, PrimaryPointerInfo, Transform, VirtualCamera } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import type { SeatId } from '../game/model/types'
import { getSeatWorldPosition } from '../presentation/arenaActors'
import { orbitPoint } from '../presentation/orbitMath'
import { getUiState } from '../ui/state/uiState'

const CENTER = Vector3.create(16, 0.665, 16)
const RADIUS = 3.8556
const HEIGHT = 3.15
const RADIANS_PER_SCREEN_PIXEL = 0.006
const MAX_SCREEN_DELTA_PER_FRAME = 100
const TAKEOVER_ENTER_SECONDS = 0.48
const TAKEOVER_RETURN_AT_SECONDS = 4.15
const TAKEOVER_RETURN_SECONDS = 0.62
const LOCAL_SHAKE_METERS = 0.035

type CinematicMode = 'ORBIT' | 'ENTERING' | 'HOLDING' | 'RETURNING' | 'LOCKED_HOME'

let cameraEntity: Entity | null = null
let targetEntity: Entity | null = null
let angleRadians = Math.PI
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

function currentNormalPosition(): Vector3 {
  const point = orbitPoint(CENTER.x, CENTER.z, RADIUS, HEIGHT, angleRadians)
  return Vector3.create(point.x, point.y, point.z)
}

function setCameraPose(position: Vector3, target: Vector3): void {
  if (cameraEntity === null || targetEntity === null) return
  Transform.getMutable(cameraEntity).position = position
  Transform.getMutable(targetEntity).position = target
}

function takeoverPose(seatId: SeatId): { position: Vector3; target: Vector3 } {
  const victim = getSeatWorldPosition(seatId)
  const radialX = victim.x - CENTER.x
  const radialZ = victim.z - CENTER.z
  const length = Math.max(0.001, Math.hypot(radialX, radialZ))
  const outwardX = radialX / length
  const outwardZ = radialZ / length
  const tangentX = outwardZ
  const tangentZ = -outwardX

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
  if (cameraEntity === null || targetEntity === null) return
  const pose = takeoverPose(seatId)
  normalPosition = currentNormalPosition()
  transitionFromPosition = cloneVector(Transform.get(cameraEntity).position)
  transitionFromTarget = cloneVector(Transform.get(targetEntity).position)
  takeoverPosition = pose.position
  takeoverTarget = pose.target
  takeoverElapsed = 0
  transitionElapsed = 0
  localVictim = isLocalVictim
  mode = 'ENTERING'
}

function beginReturn(): void {
  if (cameraEntity === null || targetEntity === null || mode === 'RETURNING' || mode === 'LOCKED_HOME') return
  transitionFromPosition = cloneVector(Transform.get(cameraEntity).position)
  transitionFromTarget = cloneVector(Transform.get(targetEntity).position)
  normalPosition = currentNormalPosition()
  transitionElapsed = 0
  mode = 'RETURNING'
}

function updateTakeoverCamera(deltaSeconds: number): boolean {
  if (cameraEntity === null || targetEntity === null) return false
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
      mix(transitionFromTarget, takeoverTarget, amount)
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
      takeoverTarget
    )
    return true
  }

  if (mode === 'RETURNING') {
    transitionElapsed += Math.max(0, deltaSeconds)
    const amount = smoothstep(transitionElapsed / TAKEOVER_RETURN_SECONDS)
    setCameraPose(mix(transitionFromPosition, normalPosition, amount), mix(transitionFromTarget, CENTER, amount))
    if (amount >= 1) mode = inTakeover ? 'LOCKED_HOME' : 'ORBIT'
    return true
  }

  setCameraPose(normalPosition, CENTER)
  return true
}

export function setupOrbitCamera() {
  const mobile = isMobile()

  targetEntity = engine.addEntity()
  Transform.create(targetEntity, { position: CENTER })

  cameraEntity = engine.addEntity()
  normalPosition = currentNormalPosition()
  Transform.create(cameraEntity, { position: normalPosition })
  VirtualCamera.create(cameraEntity, {
    lookAtEntity: targetEntity,
    fov: 50,
    defaultTransition: { transitionMode: VirtualCamera.Transition.Time(0) }
  })

  engine.addSystem((deltaSeconds) => {
    if (!active || cameraEntity === null) return
    if (updateTakeoverCamera(deltaSeconds)) return

    // Desktop only consumes mouse movement while the Explorer cursor is locked. On mobile,
    // PrimaryPointerInfo receives the active screen swipe directly. Vertical movement is
    // intentionally ignored: the arena keeps its fixed height and viewing angle.
    const cursorLocked = PointerLock.getOrNull(engine.CameraEntity)?.isPointerLocked ?? false
    if (!mobile && !cursorLocked) return

    const deltaX = PrimaryPointerInfo.getOrNull(engine.RootEntity)?.screenDelta?.x ?? 0
    if (deltaX === 0) return

    const limitedDelta = Math.min(Math.max(deltaX, -MAX_SCREEN_DELTA_PER_FRAME), MAX_SCREEN_DELTA_PER_FRAME)
    angleRadians -= limitedDelta * RADIANS_PER_SCREEN_PIXEL
    normalPosition = currentNormalPosition()
    setCameraPose(normalPosition, CENTER)
  })
}

export function setOrbitCameraActive(nextActive: boolean) {
  if (cameraEntity === null || active === nextActive) return
  active = nextActive
  if (nextActive) {
    normalPosition = currentNormalPosition()
    setCameraPose(normalPosition, CENTER)
  } else {
    mode = 'ORBIT'
    wasTakeover = false
    takeoverElapsed = 0
    localVictim = false
  }
  MainCamera.createOrReplace(engine.CameraEntity, {
    virtualCameraEntity: nextActive ? cameraEntity : undefined
  })
}

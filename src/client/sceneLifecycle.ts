import {
  AvatarModifierArea,
  AvatarModifierType,
  engine,
  Entity,
  InputModifier,
  TouchScreenControls,
  Transform
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import type { MatchPhase } from '../game/model/types'
import { clearArenaActors, createArenaActors, updateArenaActors } from '../presentation/arenaActors'
import { getUiState } from '../ui/state/uiState'
import { setOrbitCameraActive } from './orbitCamera'

const ARENA_PHASES: MatchPhase[] = [
  'COUNTDOWN',
  'ROUND_START',
  'HOLDING',
  'RESOLVING_CHAIN',
  'TAKEOVER',
  'ROUND_RESULT'
]

let arenaRoot: Entity | null = null
let currentMode: 'LOBBY' | 'MATCH' | null = null

function createAvatarHideArea() {
  const area = engine.addEntity()
  const size = Vector3.create(32, 30, 32)
  Transform.create(area, { position: Vector3.create(16, 15, 16), scale: size })
  AvatarModifierArea.create(area, {
    area: size,
    modifiers: [AvatarModifierType.AMT_HIDE_AVATARS, AvatarModifierType.AMT_DISABLE_PASSPORTS],
    excludeIds: []
  })
}

export function setupSceneLifecycle() {
  InputModifier.createOrReplace(engine.PlayerEntity, {
    mode: InputModifier.Mode.Standard({
      disableAll: false,
      disableWalk: true,
      disableJog: true,
      disableRun: true,
      disableJump: true,
      disableEmote: true,
      disableDoubleJump: true,
      disableGliding: true
    })
  })
  TouchScreenControls.hideAll()
  TouchScreenControls.hideJoystick()
  TouchScreenControls.hideCrosshair()
  createAvatarHideArea()
}

export function updateSceneLifecycle(phase: MatchPhase, deltaSeconds: number) {
  const matchActive = ARENA_PHASES.includes(phase)
  // Engage the gameplay camera behind the opaque three-second countdown so
  // the room is revealed from its final pose with no visible camera move.
  setOrbitCameraActive(phase === 'COUNTDOWN' || matchActive)
  const nextMode = matchActive ? 'MATCH' : 'LOBBY'
  if (nextMode === currentMode) {
    if (matchActive) {
      const state = getUiState()
      updateArenaActors(
        deltaSeconds,
        phase,
        state.takeoverVictimSeatId,
        state.seats,
        state.seatReactions,
        state.seatNotices,
        state.seatPassCues
      )
    }
    return
  }
  currentMode = nextMode

  if (matchActive) {
    if (arenaRoot === null) {
      arenaRoot = engine.addEntity()
      Transform.create(arenaRoot, { position: Vector3.Zero() })
      createArenaActors(arenaRoot, getUiState().matchId)
    }
    const state = getUiState()
    updateArenaActors(
      deltaSeconds,
      phase,
      state.takeoverVictimSeatId,
      state.seats,
      state.seatReactions,
      state.seatNotices,
      state.seatPassCues
    )
    return
  }

  if (arenaRoot !== null) {
    engine.removeEntityWithChildren(arenaRoot)
    arenaRoot = null
    clearArenaActors()
  }
}

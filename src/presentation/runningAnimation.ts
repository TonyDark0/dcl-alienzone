import type { LocomotionState } from '../game/rules/chase'
import { CHASE_CONFIG } from '../game/rules/chase'

export const RUNNING_CLIPS = {
  RUN: 'AST_RUNNING',
  RUN_HOLDING: 'AST_RUNNING_ALIEN',
  SLOW: 'AST_RUNNING',
  TURBO: 'AST_RUNNING'
} as const
// Verified in all eight GLBs: normal 0.7333s, carrying 1.3s. Speed modifiers reuse these loops.
export const AVAILABLE_RUNNING_CLIPS: readonly string[] = ['AST_RUNNING', 'AST_RUNNING_ALIEN']

export function runningAnimation(
  state: LocomotionState,
  available: readonly string[] = AVAILABLE_RUNNING_CLIPS,
  holding = false,
  movementMultiplier?: number
) {
  const carrying = holding || state === 'RUN_HOLDING'
  const desired = carrying
    ? RUNNING_CLIPS.RUN_HOLDING
    : state === 'IDLE'
      ? undefined
      : state === 'FROZEN'
        ? undefined
        : RUNNING_CLIPS[state]
  const speed =
    state === 'IDLE' || state === 'FROZEN'
      ? 0
      : (movementMultiplier ??
        (state === 'SLOW'
          ? CHASE_CONFIG.freezeSpeedMultiplier
          : state === 'TURBO'
            ? CHASE_CONFIG.turboSpeedMultiplier
            : 1))
  return desired && available.includes(desired)
    ? { clip: desired, speed, loop: true, fallback: false }
    : { clip: 'AST_IDLE_STANDING', speed: state === 'IDLE' && !carrying ? 1 : 0, loop: true, fallback: !!desired }
}

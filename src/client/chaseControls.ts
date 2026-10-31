import { engine, inputSystem, InputAction, PointerEventType } from '@dcl/sdk/ecs'
import { getUiState } from '../ui/state/uiState'
import { requestMove, requestPass, requestCurrentCard } from './gameClient'

export function setupChaseControls() {
  let elapsed = 0,
    sequence = 0,
    lastForward = 0,
    lastYaw = 0
  engine.addSystem(
    (dt) => {
      const state = getUiState()
      if (!state.arena || state.phase !== 'HOLDING' || state.localSeatId === null) {
        elapsed = 0
        lastForward = 0
        return
      }
      // Same screen-relative directions for desktop WASD and the native mobile joystick.
      const x = Number(inputSystem.isPressed(InputAction.IA_RIGHT)) - Number(inputSystem.isPressed(InputAction.IA_LEFT))
      const z =
        Number(inputSystem.isPressed(InputAction.IA_FORWARD)) - Number(inputSystem.isPressed(InputAction.IA_BACKWARD))
      const forward = Math.min(1, Math.hypot(x, z))
      const yaw = forward > 0 ? Math.atan2(x, z) : lastYaw
      if (inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)) requestPass()
      if (inputSystem.isTriggered(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN)) requestCurrentCard()
      elapsed += Math.max(0, dt)
      const aimChanged = Math.abs(Math.atan2(Math.sin(yaw - lastYaw), Math.cos(yaw - lastYaw))) > 0.025
      // Every direction/start/stop edge is immediate, including a full reversal.
      // Only unchanged held intent is throttled to 10 Hz.
      if (forward === lastForward && !aimChanged && elapsed < 0.1) return
      elapsed = 0
      lastForward = forward
      lastYaw = yaw
      requestMove(forward, yaw, ++sequence)
    },
    110_000,
    'alienzone-wasd-and-touch-input'
  )
}

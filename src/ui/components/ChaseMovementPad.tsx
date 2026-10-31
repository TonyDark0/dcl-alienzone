import { InputAction } from '@dcl/sdk/ecs'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { SciFiSurface } from './SciFiSurface'
import { UI_COLORS } from '../theme/tokens'

/** Dedicated mobile control, separate from cards and reactions. Uses SDK-held input actions. */
export function ChaseMovementPad() {
  if (!isMobile()) return <UiEntity uiTransform={{ display: 'none' }} />
  return (
    <UiEntity uiTransform={{ positionType: 'absolute', position: { left: 16, bottom: 20 }, width: 204, height: 204 }}>
      {[
        { label: '↑', action: InputAction.IA_FORWARD, x: 68, y: 0 },
        { label: '↶', action: InputAction.IA_LEFT, x: 0, y: 68 },
        { label: '↓', action: InputAction.IA_BACKWARD, x: 68, y: 136 },
        { label: '↷', action: InputAction.IA_RIGHT, x: 136, y: 68 }
      ].map((button) => (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { left: button.x, top: button.y },
            width: 68,
            height: 68,
            alignItems: 'center',
            justifyContent: 'center',
            pointerFilter: 'block'
          }}
          uiInputBinding={{ actions: [button.action] }}
        >
          <SciFiSurface />
          <Label value={button.label} fontSize={30} color={UI_COLORS.cyan} uiTransform={{ pointerFilter: 'none' }} />
        </UiEntity>
      ))}
    </UiEntity>
  )
}

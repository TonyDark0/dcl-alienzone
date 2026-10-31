import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import type { Color4 } from '@dcl/sdk/math'
import { playUiSound } from '../../presentation/audioDirector'

import { getControlMotion, pressControl, setControlHovered } from '../state/interactionState'
import { SciFiSurface } from './SciFiSurface'
import { UI_COLORS, UI_SIZE, UI_SPACING, UI_TYPE } from '../theme/tokens'

interface ActionButtonProps {
  label: string
  hint?: string
  tone?: 'primary' | 'secondary' | 'danger'
  accent?: Color4
  width?: number | `${number}%`
  height?: number
  fontSize?: number
  disabled?: boolean
  interactionId?: string
  sound?: 'press' | 'menu'
  onPress: () => void
}

export function ActionButton({
  label,
  hint,
  tone = 'primary',
  accent = UI_COLORS.cyan,
  width = 300,
  height = UI_SIZE.tapTarget,
  fontSize = UI_TYPE.strong,
  disabled = false,
  interactionId,
  sound = 'press',
  onPress
}: ActionButtonProps) {
  const controlId = interactionId ?? `action:${label}`
  const motion = getControlMotion(controlId, disabled)
  const hintColor = disabled
    ? UI_COLORS.textMuted
    : tone === 'danger'
      ? UI_COLORS.danger
      : tone === 'secondary'
        ? UI_COLORS.cyan
        : UI_COLORS.alien

  return (
    <UiEntity
      uiTransform={{
        width,
        minHeight: hint ? height + 24 : height,
        flexShrink: 0,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <UiEntity
        uiTransform={{
          width: '100%',
          height,
          flexShrink: 0,
          justifyContent: 'center',
          alignItems: 'center',
          pointerFilter: 'block'
        }}
        onMouseDown={
          disabled
            ? undefined
            : () => {
                pressControl(controlId)
                playUiSound(sound)
                onPress()
              }
        }
        onMouseEnter={
          disabled
            ? undefined
            : () => {
                setControlHovered(controlId, true)
                playUiSound('highlight')
              }
        }
        onMouseLeave={disabled ? undefined : () => setControlHovered(controlId, false)}
      >
        <SciFiSurface
          primary={tone !== 'secondary' && !disabled}
          tone={disabled ? UI_COLORS.disabled : tone === 'secondary' ? accent : UI_COLORS.white}
          hover={motion.hover}
          press={motion.press}
        />
        <Label
          value={label}
          fontSize={fontSize}
          color={disabled ? UI_COLORS.textMuted : UI_COLORS.white}
          textAlign="middle-center"
          uiTransform={{ width: '92%', height: '100%', pointerFilter: 'none' }}
        />
      </UiEntity>
      {hint ? (
        <Label
          value={hint}
          fontSize={UI_TYPE.caption}
          color={hintColor}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: 18, margin: { top: UI_SPACING.xs } }}
        />
      ) : null}
    </UiEntity>
  )
}

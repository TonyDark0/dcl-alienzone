import ReactEcs, { Button, Label, UiEntity } from '@dcl/sdk/react-ecs'
import { playUiSound } from '../../presentation/audioDirector'

import { isControlHovered, setControlHovered } from '../state/interactionState'
import { UI_COLORS, UI_SIZE, UI_SPACING, UI_TYPE } from '../theme/tokens'

interface ActionButtonProps {
  label: string
  hint?: string
  tone?: 'primary' | 'secondary' | 'danger'
  width?: number
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
  width = 300,
  fontSize = UI_TYPE.strong,
  disabled = false,
  interactionId,
  sound = 'press',
  onPress
}: ActionButtonProps) {
  const controlId = interactionId ?? `action:${label}`
  const hovered = !disabled && isControlHovered(controlId)
  const variant = tone === 'secondary' ? 'secondary' : 'primary'
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
        minHeight: hint ? UI_SIZE.tapTarget + 20 : UI_SIZE.tapTarget,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Button
        variant={variant}
        value={label}
        disabled={disabled}
        fontSize={fontSize}
        textAlign="middle-center"
        uiTransform={{
          width: '100%',
          height: UI_SIZE.tapTarget,
          pointerFilter: 'block',
          opacity: disabled ? 0.58 : hovered ? 0.9 : 1
        }}
        onMouseDown={
          disabled
            ? undefined
            : () => {
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
      />
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

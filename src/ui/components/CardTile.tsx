import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { playUiSound } from '../../presentation/audioDirector'

import type { UiCardView } from '../state/uiState'
import { isControlHovered, setControlHovered } from '../state/interactionState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'

interface CardTileProps {
  card: UiCardView
  onPress: () => void
  compact?: boolean
  interactionId?: string
  interactionDisabled?: boolean
  mini?: boolean
  passive?: boolean
  stateLabel?: string
  actionLabel?: string
}

const STATE_COLOR = {
  AVAILABLE: UI_COLORS.cyan,
  ARMED: UI_COLORS.alien,
  ACTIVE: UI_COLORS.warning,
  SPENT: UI_COLORS.disabled
} as const

const STATE_HINT = {
  AVAILABLE: 'TAP TO ARM',
  ARMED: 'TAP TO ACTIVATE',
  ACTIVE: 'READY',
  SPENT: 'DISCARDED'
} as const

export function CardTile({
  card,
  onPress,
  compact = false,
  interactionId,
  interactionDisabled = false,
  mini = false,
  passive = false,
  stateLabel,
  actionLabel
}: CardTileProps) {
  const tone = STATE_COLOR[card.state]
  const disabled = card.state === 'SPENT' || interactionDisabled || passive
  const visuallyDisabled = card.state === 'SPENT' || interactionDisabled
  const controlId = interactionId ?? `card:${card.name}`
  const hovered = !disabled && isControlHovered(controlId)
  const detail =
    actionLabel ?? (interactionDisabled ? 'LOCKED' : mini || compact ? STATE_HINT[card.state] : card.description)
  const displayName = card.name

  return (
    <UiEntity
      uiTransform={{
        width: mini ? (compact ? 94 : 118) : compact ? 196 : 246,
        height: mini ? (compact ? 82 : 98) : compact ? 82 : 100,
        padding: mini ? UI_SPACING.xs : compact ? UI_SPACING.sm : UI_SPACING.md,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: { left: hovered ? 10 : 6, top: hovered ? 3 : 2, right: 2, bottom: 2 },
        borderColor: tone,
        pointerFilter: 'block',
        opacity: visuallyDisabled ? 0.58 : hovered ? 1 : 0.94
      }}
      uiBackground={{
        color: disabled ? UI_COLORS.space950 : hovered ? UI_COLORS.space700Hover : UI_COLORS.space900Glass
      }}
      onMouseDown={
        disabled
          ? undefined
          : () => {
              playUiSound('press')
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
      <UiEntity
        uiTransform={{
          width: '100%',
          height: mini ? (compact ? 18 : 22) : compact ? 24 : 30,
          flexShrink: 0,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Label
          value={displayName}
          fontSize={
            mini
              ? displayName.length > 10
                ? compact
                  ? 9
                  : 10
                : compact
                  ? 11
                  : 13
              : compact
                ? UI_TYPE.body
                : UI_TYPE.strong
          }
          color={UI_COLORS.white}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: '100%' }}
        />
      </UiEntity>
      <Label
        value={stateLabel ?? card.state}
        fontSize={mini ? 8 : compact ? 10 : UI_TYPE.caption}
        color={tone}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: mini ? 10 : 16, flexShrink: 0 }}
      />
      {mini ? (
        <UiEntity
          uiTransform={{ width: compact ? 24 : 30, height: compact ? 24 : 30, flexShrink: 0 }}
          uiBackground={{
            texture: { src: card.icon, filterMode: 'bi-linear', wrapMode: 'clamp' },
            textureMode: 'stretch'
          }}
        />
      ) : null}
      <Label
        value={detail}
        fontSize={mini ? 8 : compact ? 10 : UI_TYPE.caption}
        color={visuallyDisabled ? UI_COLORS.textMuted : tone}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: mini ? 10 : 18, flexShrink: 0 }}
      />
    </UiEntity>
  )
}

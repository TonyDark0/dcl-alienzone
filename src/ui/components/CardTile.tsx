import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { playUiSound } from '../../presentation/audioDirector'

import type { UiCardView } from '../state/uiState'
import { getControlMotion, pressControl, setControlHovered } from '../state/interactionState'
import { SciFiSurface } from './SciFiSurface'
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
  AVAILABLE: 'TAP TO LOAD',
  ARMED: 'TAP TO ACTIVATE',
  ACTIVE: 'READY',
  SPENT: 'SPENT'
} as const

export function cardTileSize(compact: boolean) {
  return { width: compact ? 128 : 148, height: compact ? 148 : 168 }
}

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
  const tone =
    card.tier && card.state !== 'SPENT'
      ? card.tier === 'GENERAL'
        ? UI_COLORS.alien
        : card.tier === 'EPIC'
          ? UI_COLORS.danger
          : UI_COLORS.violet
      : card.state === 'AVAILABLE' || card.state === 'ARMED'
        ? card.category === 'INTERVENTION'
          ? UI_COLORS.violet
          : UI_COLORS.cyan
        : STATE_COLOR[card.state]
  const disabled = card.state === 'SPENT' || interactionDisabled || passive
  const visuallyDisabled = card.state === 'SPENT' || interactionDisabled
  const controlId = interactionId ?? `card:${card.name}`
  const motion = getControlMotion(controlId, disabled)
  const size = cardTileSize(compact)
  const detail =
    actionLabel ?? (interactionDisabled ? 'LOCKED' : mini || compact ? STATE_HINT[card.state] : card.description)
  const displayName = card.name

  return (
    <UiEntity
      uiTransform={{
        width: mini ? size.width : compact ? 224 : 268,
        height: mini ? size.height : compact ? 180 : 204,
        flexShrink: 0,
        padding: mini ? 12 : UI_SPACING.md,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerFilter: 'block'
      }}
      onMouseDown={
        disabled
          ? undefined
          : () => {
              pressControl(controlId)
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
      <SciFiSurface tone={visuallyDisabled ? UI_COLORS.disabled : tone} hover={motion.hover} press={motion.press} />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: mini ? 30 : 34,
          flexShrink: 0,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Label
          value={displayName}
          fontSize={mini ? (compact ? 17 : 19) : UI_TYPE.strong}
          color={UI_COLORS.white}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: '100%' }}
        />
      </UiEntity>
      <Label
        value={stateLabel ?? (card.state === 'ARMED' ? 'LOADED' : card.state)}
        fontSize={mini ? 12 : 14}
        color={tone}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: 20, flexShrink: 0 }}
      />
      <UiEntity
        uiTransform={{
          width: compact ? 46 : 56,
          height: compact ? 46 : 56,
          flexShrink: 0,
          margin: { top: 2, bottom: 4 },
          pointerFilter: 'none'
        }}
        uiBackground={{
          texture: { src: card.icon, filterMode: 'bi-linear', wrapMode: 'clamp' },
          textureMode: 'stretch'
        }}
      />
      <Label
        value={detail}
        fontSize={mini ? 11 : UI_TYPE.caption}
        color={visuallyDisabled ? UI_COLORS.textMuted : tone}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: mini ? 18 : 40, flexShrink: 0 }}
      />
    </UiEntity>
  )
}

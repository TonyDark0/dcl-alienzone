import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { playUiSound } from '../../presentation/audioDirector'

import type { UiCardView } from '../state/uiState'
import { getControlMotion, pressControl, setControlHovered } from '../state/interactionState'
import { SciFiSurface } from './SciFiSurface'
import { CardHologram, CardSurface } from './CardSurface'
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
  wrapTitle?: boolean
  horizontal?: boolean
  portrait?: boolean
  selected?: boolean
  density?: number
  width?: number
  height?: number
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
  actionLabel,
  wrapTitle = false,
  horizontal = false,
  portrait = false,
  selected = false,
  density = 1,
  width = 164,
  height = 236
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

  if (portrait)
    return (
      <UiEntity
        uiTransform={{
          width,
          height,
          padding: 12 * density,
          flexDirection: 'column',
          flexShrink: 0,
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
        <CardSurface tone={tone} hover={motion.hover} selected={selected} />
        <Label
          value={card.tier ?? 'POWER'}
          fontSize={11 * density}
          color={tone}
          uiTransform={{ width: '100%', height: 18 * density, flexShrink: 0, pointerFilter: 'none' }}
        />
        <Label
          value={displayName}
          fontSize={17 * density}
          color={UI_COLORS.white}
          uiTransform={{ width: '100%', height: 42 * density, flexShrink: 0, pointerFilter: 'none' }}
        />
        <UiEntity
          uiTransform={{
            width: '100%',
            flexGrow: 1,
            minHeight: 0,
            justifyContent: 'center',
            alignItems: 'center',
            pointerFilter: 'none'
          }}
        >
          <CardHologram
            icon={card.icon}
            tone={tone}
            size={(height / density < 220 ? 60 : 76) * density}
            hover={motion.hover}
            density={density}
          />
        </UiEntity>
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 1,
            flexShrink: 0,
            margin: { bottom: 5 * density },
            pointerFilter: 'none'
          }}
          uiBackground={{ color: tone }}
        />
        <Label
          value={actionLabel ?? (selected ? 'SELECTED' : 'VIEW CARD')}
          fontSize={12 * density}
          color={selected ? UI_COLORS.white : tone}
          uiTransform={{ width: '100%', height: 38 * density, flexShrink: 0, pointerFilter: 'none' }}
        />
      </UiEntity>
    )

  if (horizontal)
    return (
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 84,
          padding: 10,
          flexShrink: 0,
          flexDirection: 'row',
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
          uiTransform={{ width: 44, height: 44, flexShrink: 0, margin: { left: 4, right: 12 }, pointerFilter: 'none' }}
          uiBackground={{
            texture: { src: card.icon, filterMode: 'bi-linear', wrapMode: 'clamp' },
            textureMode: 'stretch'
          }}
        />
        <UiEntity
          uiTransform={{
            flexGrow: 1,
            minWidth: 0,
            height: 64,
            flexDirection: 'column',
            justifyContent: 'center',
            pointerFilter: 'none'
          }}
        >
          <Label
            value={displayName}
            fontSize={17}
            color={UI_COLORS.white}
            uiTransform={{ width: '100%', height: 42, flexShrink: 0, pointerFilter: 'none' }}
          />
          <Label
            value={stateLabel ?? card.state}
            fontSize={12}
            color={tone}
            uiTransform={{ width: '100%', height: 18, flexShrink: 0, pointerFilter: 'none' }}
          />
        </UiEntity>
        <Label
          value={detail}
          fontSize={12}
          color={visuallyDisabled ? UI_COLORS.textMuted : tone}
          uiTransform={{ width: 104, height: 44, flexShrink: 0, margin: { left: 8 }, pointerFilter: 'none' }}
        />
      </UiEntity>
    )

  return (
    <UiEntity
      uiTransform={{
        width: mini ? size.width : compact ? 224 : 268,
        height: mini ? size.height : compact ? 180 : 204,
        flexShrink: 0,
        padding: mini ? (wrapTitle ? 8 : 12) : UI_SPACING.md,
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
      <CardSurface tone={visuallyDisabled ? UI_COLORS.disabled : tone} hover={motion.hover} selected={selected} />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: mini ? (wrapTitle ? 44 : 30) : 34,
          flexShrink: 0,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Label
          value={displayName}
          fontSize={mini ? (compact || wrapTitle ? 17 : 19) : UI_TYPE.strong}
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
        uiTransform={{ width: '100%', height: wrapTitle ? 18 : 20, flexShrink: 0 }}
      />
      <UiEntity
        uiTransform={{
          width: compact ? 46 : 56,
          height: compact ? 46 : 56,
          flexShrink: 0,
          margin: { top: 2, bottom: wrapTitle ? 2 : 4 },
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

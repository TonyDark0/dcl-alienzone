import type { CardCategory, SeatId } from '../../game/model/types'
import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { playUiSound } from '../../presentation/audioDirector'

import type { UiCardView, UiSeatView } from '../state/uiState'
import { UI_COLORS } from '../theme/tokens'
import { CardTile, cardTileSize } from './CardTile'
import { SciFiSurface } from './SciFiSurface'
import { entranceMotion, UI_MOTION } from '../state/uiMotion'
import { ActionButton } from './ActionButton'
import { getControlMotion, pressControl, setControlHovered } from '../state/interactionState'

interface CardHandProps {
  cards: readonly UiCardView[]
  compact: boolean
  interactionDisabled: boolean
  onEquip: (cardId: string | null, category: CardCategory, targetSeatId?: number) => void
  seats: readonly UiSeatView[]
  localSeatId: SeatId | null
  onActivate: (cardId: string) => void
}

let openCategory: CardCategory | null = null
let choosingTargetCardId: string | null = null

function EmptySlot({
  title,
  hint,
  compact,
  disabled,
  onPress
}: {
  title: string
  hint: string
  compact: boolean
  disabled: boolean
  onPress: () => void
}) {
  const controlId = `empty-slot:${title}`
  const motion = getControlMotion(controlId, disabled)
  return (
    <UiEntity
      uiTransform={{
        width: cardTileSize(compact).width,
        height: cardTileSize(compact).height,
        flexShrink: 0,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerFilter: 'block'
      }}
      onMouseDown={
        disabled
          ? undefined
          : () => {
              pressControl(controlId)
              playUiSound('menu')
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
        tone={disabled ? UI_COLORS.disabled : title === 'INTERVENTION' ? UI_COLORS.violet : UI_COLORS.cyan}
        hover={motion.hover}
        press={motion.press}
      />
      <Label
        value={title}
        fontSize={compact ? 13 : 15}
        color={UI_COLORS.textMuted}
        textAlign="middle-center"
        uiTransform={{ height: 28 }}
      />
      <Label value="＋" fontSize={42} color={UI_COLORS.cyan} textAlign="middle-center" uiTransform={{ height: 54 }} />
      <Label
        value={hint}
        fontSize={11}
        color={UI_COLORS.textMuted}
        textAlign="middle-center"
        uiTransform={{ height: 26 }}
      />
    </UiEntity>
  )
}

export function CardHand({
  cards,
  compact,
  interactionDisabled,
  onEquip,
  onActivate,
  seats,
  localSeatId
}: CardHandProps) {
  if (interactionDisabled) {
    openCategory = null
    choosingTargetCardId = null
  }
  const reaction = cards.find(
    (card) => card.category === 'REACTION' && (card.state === 'ARMED' || card.state === 'ACTIVE')
  )
  const intervention = cards.find((card) => card.category === 'INTERVENTION' && card.state === 'ARMED')
  const categoryCards = openCategory
    ? cards.filter((card) => card.category === openCategory && card.state !== 'SPENT')
    : []
  const openDeck = (category: CardCategory) => {
    openCategory = openCategory === category ? null : category
  }
  const size = cardTileSize(compact)
  const handWidth = size.width * 2 + 12
  const handHeight = size.height + 60
  const popup = entranceMotion('card-picker', openCategory !== null, UI_MOTION.picker)
  const targetPopup = entranceMotion('chaos-picker', choosingTargetCardId !== null, UI_MOTION.picker)

  return (
    <UiEntity
      uiTransform={{
        width: handWidth,
        height: handHeight,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 40
      }}
    >
      {choosingTargetCardId ? (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { right: 0, bottom: handHeight + 12 - targetPopup.offset },
            width: compact ? 380 : 440,
            padding: 20,
            opacity: targetPopup.opacity,
            flexDirection: 'column',
            zIndex: 46,
            pointerFilter: 'block'
          }}
        >
          <SciFiSurface tone={UI_COLORS.violet} />
          <Label
            value="CHAOS · CHOOSE A PLAYER"
            fontSize={16}
            color={UI_COLORS.cyan}
            uiTransform={{ width: '100%', height: 30 }}
          />
          <UiEntity uiTransform={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>
            {seats
              .filter((seat) => seat.id !== localSeatId)
              .map((seat) => (
                <UiEntity uiTransform={{ width: '50%', padding: 3 }}>
                  <ActionButton
                    label={seat.displayName}
                    tone="secondary"
                    width={compact ? 160 : 190}
                    height={56}
                    fontSize={14}
                    interactionId={`chaos-target:${seat.id}`}
                    onPress={() => {
                      onEquip(choosingTargetCardId!, 'INTERVENTION', seat.id)
                      choosingTargetCardId = null
                    }}
                  />
                </UiEntity>
              ))}
          </UiEntity>
          <ActionButton
            label="CANCEL"
            tone="secondary"
            width={compact ? 340 : 400}
            height={52}
            onPress={() => {
              choosingTargetCardId = null
            }}
          />
        </UiEntity>
      ) : openCategory ? (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { right: 0, bottom: handHeight + 12 - popup.offset },
            width: Math.max(320, categoryCards.length * (size.width + 12) + 28),
            minHeight: size.height + 100,
            padding: 20,
            opacity: popup.opacity,
            flexDirection: 'column',
            zIndex: 45,
            pointerFilter: 'block'
          }}
        >
          <SciFiSurface tone={openCategory === 'INTERVENTION' ? UI_COLORS.violet : UI_COLORS.cyan} />
          <UiEntity
            uiTransform={{
              width: '100%',
              height: 52,
              margin: { bottom: 8 },
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Label value={`CHOOSE ${openCategory} CARD`} fontSize={14} color={UI_COLORS.cyan} />
            <UiEntity uiTransform={{ flexGrow: 1 }} />
            <ActionButton
              label="CLOSE ×"
              tone="secondary"
              width={88}
              height={52}
              fontSize={13}
              interactionId="card-picker-close"
              sound="menu"
              onPress={() => {
                openCategory = null
              }}
            />
          </UiEntity>
          <UiEntity
            uiTransform={{
              width: '100%',
              flexGrow: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {categoryCards.map((card, index) => (
              <UiEntity
                uiTransform={{
                  width: size.width,
                  height: size.height,
                  flexShrink: 0,
                  margin: { left: index === 0 ? 0 : 12 }
                }}
              >
                <CardTile
                  card={card}
                  compact={compact}
                  mini
                  interactionId={`deck-card:${card.id}`}
                  interactionDisabled={interactionDisabled}
                  actionLabel={card.state === 'ARMED' || card.state === 'ACTIVE' ? 'LOADED' : 'TAP TO LOAD'}
                  onPress={() => {
                    if (card.state === 'AVAILABLE') onEquip(card.id, card.category)
                    if (card.type === 'CHAOS' && card.state !== 'ACTIVE') choosingTargetCardId = card.id
                    openCategory = null
                  }}
                />
              </UiEntity>
            ))}
            {categoryCards.length === 0 ? (
              <Label
                value="NO CARDS REMAIN"
                fontSize={12}
                color={UI_COLORS.textMuted}
                uiTransform={{ width: '100%', height: 48 }}
                textAlign="middle-center"
              />
            ) : null}
          </UiEntity>
        </UiEntity>
      ) : null}

      <UiEntity
        uiTransform={{
          width: '100%',
          height: 52,
          flexShrink: 0,
          margin: { bottom: 8 },
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        {(['REACTION', 'INTERVENTION'] as const).map((category) => (
          <ActionButton
            label={interactionDisabled ? 'LOCKED' : `${category} ↑`}
            width={size.width}
            height={52}
            tone="secondary"
            sound="menu"
            accent={category === 'INTERVENTION' ? UI_COLORS.violet : UI_COLORS.cyan}
            fontSize={compact ? 12 : 14}
            disabled={interactionDisabled}
            interactionId={`card-category:${category}`}
            onPress={() => openDeck(category)}
          />
        ))}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', flexGrow: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
        {reaction ? (
          <CardTile
            card={reaction}
            compact={compact}
            mini
            interactionDisabled={interactionDisabled}
            passive={reaction.state === 'ACTIVE'}
            stateLabel={reaction.state === 'ACTIVE' ? 'ACTIVE' : 'LOADED'}
            actionLabel={reaction.state === 'ACTIVE' ? 'POWER ACTIVE' : 'TAP TO ACTIVATE'}
            interactionId="reaction-equipped"
            onPress={() => onActivate(reaction.id)}
          />
        ) : (
          <EmptySlot
            title="REACTION"
            hint="TAP TO CHOOSE"
            compact={compact}
            disabled={interactionDisabled}
            onPress={() => openDeck('REACTION')}
          />
        )}
        {intervention ? (
          <CardTile
            card={intervention}
            compact={compact}
            mini
            interactionDisabled={interactionDisabled}
            passive={intervention.state === 'ACTIVE'}
            stateLabel={
              intervention.type === 'CHAOS'
                ? intervention.targetSeatId === undefined
                  ? 'NO TARGET'
                  : `TO ${seats.find((seat) => seat.id === intervention.targetSeatId)?.displayName.slice(0, 12) ?? '?'}`
                : 'LOADED'
            }
            actionLabel={
              intervention.state === 'ACTIVE'
                ? 'WAITING FOR ALIEN'
                : intervention.type === 'CHAOS' && intervention.targetSeatId === undefined
                  ? 'CHOOSE A PLAYER'
                  : 'TAP TO ACTIVATE'
            }
            interactionId="intervention-ready"
            onPress={() => {
              if (intervention.type === 'CHAOS' && intervention.targetSeatId === undefined)
                choosingTargetCardId = intervention.id
              else onActivate(intervention.id)
            }}
          />
        ) : (
          <EmptySlot
            title="INTERVENTION"
            hint="TAP TO CHOOSE"
            compact={compact}
            disabled={interactionDisabled}
            onPress={() => openDeck('INTERVENTION')}
          />
        )}
      </UiEntity>
    </UiEntity>
  )
}

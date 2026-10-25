import type { CardCategory, SeatId } from '../../game/model/types'
import ReactEcs, { Button, Label, UiEntity } from '@dcl/sdk/react-ecs'
import { playUiSound } from '../../presentation/audioDirector'

import type { UiCardView, UiSeatView } from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'
import { CardTile } from './CardTile'

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
  return (
    <UiEntity
      uiTransform={{
        width: compact ? 94 : 118,
        height: compact ? 82 : 98,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: disabled ? UI_COLORS.disabled : UI_COLORS.space700,
        pointerFilter: 'block',
        opacity: disabled ? 0.58 : 1
      }}
      uiBackground={{ color: UI_COLORS.space950 }}
      onMouseDown={
        disabled
          ? undefined
          : () => {
              playUiSound('menu')
              onPress()
            }
      }
    >
      <Label value={title} fontSize={compact ? 9 : 11} color={UI_COLORS.textMuted} textAlign="middle-center" />
      <Label value="＋" fontSize={compact ? 22 : 28} color={UI_COLORS.cyanMuted} textAlign="middle-center" />
      <Label value={hint} fontSize={8} color={UI_COLORS.textMuted} textAlign="middle-center" />
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
    playUiSound('menu')
    openCategory = openCategory === category ? null : category
  }

  return (
    <UiEntity
      uiTransform={{
        width: compact ? 200 : 248,
        height: compact ? 126 : 142,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 40
      }}
    >
      {choosingTargetCardId ? (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { right: 0, bottom: compact ? 134 : 150 },
            width: compact ? 350 : 400,
            padding: 12,
            flexDirection: 'column',
            zIndex: 46,
            pointerFilter: 'block',
            borderWidth: 2,
            borderColor: UI_COLORS.cyan
          }}
          uiBackground={{ color: UI_COLORS.space950 }}
        >
          <Label
            value="CHAOS · CHOOSE A PLAYER"
            fontSize={13}
            color={UI_COLORS.cyan}
            uiTransform={{ width: '100%', height: 30 }}
          />
          <UiEntity uiTransform={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>
            {seats
              .filter((seat) => seat.id !== localSeatId)
              .map((seat) => (
                <Button
                  value={seat.displayName}
                  variant="secondary"
                  fontSize={12}
                  uiTransform={{ width: '48%', height: 42, margin: 2 }}
                  onMouseDown={() => {
                    playUiSound('press')
                    onEquip(choosingTargetCardId!, 'INTERVENTION', seat.id)
                    choosingTargetCardId = null
                  }}
                />
              ))}
          </UiEntity>
          <Button
            value="CANCEL"
            variant="secondary"
            uiTransform={{ width: '100%', height: 40 }}
            onMouseDown={() => {
              choosingTargetCardId = null
            }}
          />
        </UiEntity>
      ) : openCategory ? (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { right: 0, bottom: compact ? 134 : 150 },
            width: Math.max(compact ? 284 : 340, categoryCards.length * (compact ? 106 : 130) + 32),
            minHeight: compact ? 152 : 184,
            padding: compact ? 10 : UI_SPACING.md,
            flexDirection: 'column',
            borderWidth: 2,
            borderColor: UI_COLORS.cyan,
            zIndex: 45,
            pointerFilter: 'block'
          }}
          uiBackground={{ color: UI_COLORS.space950 }}
        >
          <UiEntity uiTransform={{ width: '100%', height: 24, flexDirection: 'row', alignItems: 'center' }}>
            <Label
              value={`CHOOSE ${openCategory} CARD`}
              fontSize={compact ? 10 : UI_TYPE.caption}
              color={UI_COLORS.cyan}
            />
            <UiEntity uiTransform={{ flexGrow: 1 }} />
            <UiEntity
              uiTransform={{ pointerFilter: 'block' }}
              onMouseDown={() => {
                playUiSound('menu')
                openCategory = null
              }}
            >
              <Label value="CLOSE  ×" fontSize={compact ? 10 : UI_TYPE.caption} color={UI_COLORS.white} />
            </UiEntity>
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
                  width: compact ? 94 : 118,
                  height: compact ? 82 : 98,
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

      <UiEntity uiTransform={{ width: '100%', height: 40, flexDirection: 'row', justifyContent: 'space-between' }}>
        {(['REACTION', 'INTERVENTION'] as const).map((category) => (
          <UiEntity
            uiTransform={{
              width: compact ? 94 : 118,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              pointerFilter: 'block'
            }}
            uiBackground={{ color: UI_COLORS.space950 }}
            onMouseDown={interactionDisabled ? undefined : () => openDeck(category)}
          >
            <Label
              value={interactionDisabled ? 'LOCKED' : `${category} ↑`}
              fontSize={compact ? 9 : 10}
              color={UI_COLORS.cyan}
              textAlign="middle-center"
            />
          </UiEntity>
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
            actionLabel={reaction.state === 'ACTIVE' ? 'WAITING FOR ALIEN' : 'TAP TO ACTIVATE'}
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
            stateLabel={
              intervention.type === 'CHAOS'
                ? intervention.targetSeatId === undefined
                  ? 'NO TARGET'
                  : `TO ${seats.find((seat) => seat.id === intervention.targetSeatId)?.displayName.slice(0, 12) ?? '?'}`
                : 'LOADED'
            }
            actionLabel={
              intervention.type === 'CHAOS' && intervention.targetSeatId === undefined
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

import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { requestCurrentCard, requestDeckOrder } from '../../client/gameClient'
import { queuedCards } from '../../game/rules/chaseCards'
import { getUiState } from '../state/uiState'
import { UI_COLORS } from '../theme/tokens'
import { entranceMotion, UI_MOTION } from '../state/uiMotion'
import { CardTile } from './CardTile'
import { ActionButton } from './ActionButton'
import { SciFiSurface } from './SciFiSurface'

let deckOpen = false
let deckMatchId = ''

/** One queue, one ready slot. Reordering never pauses the authoritative match. */
export function OrderedDeck({ compact = false, setup = false }: { compact?: boolean; setup?: boolean }) {
  const state = getUiState()
  if (deckMatchId !== state.matchId) {
    deckMatchId = state.matchId
    deckOpen = false
  }
  const queue = queuedCards(state.cards)
  const current = queue[0]
  const live = state.phase === 'HOLDING'
  const now = state.snapshotServerNow + Math.max(0, Date.now() - state.snapshotReceivedAtMs) / 1000
  const cooldown = Math.max(0, state.cardReadyAt - now)
  const canOrder = live || setup
  const open = canOrder && (setup || deckOpen)
  const motion = entranceMotion('ordered-deck', open, UI_MOTION.picker)
  const choose = (id: string) =>
    requestDeckOrder([id, ...queue.filter((card) => card.id !== id).map((card) => card.id)])
  const move = (index: number, direction: number) => {
    const ids = queue.map((card) => card.id),
      next = index + direction
    if (next < 0 || next >= ids.length) return
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    requestDeckOrder(ids)
  }
  const width = compact ? 680 : 760
  return (
    <UiEntity
      uiTransform={
        setup
          ? { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }
          : { width: 160, height: 224, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }
      }
    >
      {!setup ? (
        <UiEntity uiTransform={{ flexDirection: 'column', alignItems: 'center' }}>
          <ActionButton
            label="ORDER DECK ↑"
            tone="secondary"
            width={160}
            height={52}
            fontSize={14}
            disabled={!live}
            interactionId="order-deck-open"
            sound="menu"
            onPress={() => {
              deckOpen = !deckOpen
            }}
          />
          {current ? (
            <CardTile
              card={current}
              mini
              compact={compact}
              interactionId="current-card"
              stateLabel={cooldown > 0 ? `WAIT ${Math.ceil(cooldown)}s` : 'READY'}
              actionLabel={cooldown > 0 ? 'COOLDOWN' : isMobile() ? 'ACTIVATE' : 'F · ACTIVATE'}
              interactionDisabled={!live || cooldown > 0}
              onPress={() => requestCurrentCard()}
            />
          ) : (
            <Label
              value="DECK EMPTY"
              fontSize={16}
              color={UI_COLORS.textMuted}
              uiTransform={{ width: 160, height: 140 }}
            />
          )}
        </UiEntity>
      ) : null}
      {open ? (
        <UiEntity
          uiTransform={
            setup
              ? { width, padding: 24, flexDirection: 'column', pointerFilter: 'block', opacity: motion.opacity }
              : {
                  positionType: 'absolute',
                  position: { right: 0, bottom: 236 - motion.offset },
                  width,
                  padding: 24,
                  flexDirection: 'column',
                  pointerFilter: 'block',
                  opacity: motion.opacity,
                  zIndex: 60
                }
          }
        >
          <SciFiSurface tone={UI_COLORS.violet} />
          <UiEntity uiTransform={{ width: '100%', height: 56, flexDirection: 'row', alignItems: 'center' }}>
            <Label
              value={setup ? `ORDER YOUR DECK · ${state.lobbyCountdown ?? 5}s` : 'YOUR DECK · LEFT TO RIGHT'}
              fontSize={22}
              color={UI_COLORS.cyan}
              uiTransform={{ flexGrow: 1 }}
            />
            {!setup ? (
              <ActionButton
                label="CLOSE ×"
                width={104}
                height={52}
                tone="secondary"
                fontSize={14}
                interactionId="order-deck-close"
                onPress={() => {
                  deckOpen = false
                }}
              />
            ) : null}
          </UiEntity>
          <Label
            value={
              setup
                ? 'Choose your first card or change the full order. The match starts automatically.'
                : 'Reordering does NOT pause the alien timer. Only the first card can activate.'
            }
            fontSize={15}
            color={UI_COLORS.textMuted}
            uiTransform={{ width: '100%', height: 42 }}
          />
          <UiEntity
            uiTransform={{
              width: '100%',
              height: compact ? 310 : 330,
              flexShrink: 0,
              overflow: 'hidden',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            {queue.map((card, index) => (
              <UiEntity
                uiTransform={{
                  width: compact ? 160 : 180,
                  margin: { left: 4, right: 4 },
                  flexShrink: 0,
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Label
                  value={index === 0 ? '1 · READY' : `${index + 1} · NEXT`}
                  fontSize={16}
                  color={index === 0 ? UI_COLORS.alien : UI_COLORS.cyan}
                  uiTransform={{ width: '100%', height: 26 }}
                />
                <CardTile
                  card={card}
                  mini
                  compact={compact}
                  stateLabel={index === 0 ? 'SELECTED' : 'IN QUEUE'}
                  actionLabel="MAKE FIRST"
                  interactionId={`queue-card:${card.id}`}
                  onPress={() => choose(card.id)}
                />
                <Label
                  value={card.description}
                  fontSize={13}
                  color={UI_COLORS.textMuted}
                  textAlign="middle-center"
                  uiTransform={{ width: '100%', height: 80 }}
                />
                <UiEntity
                  uiTransform={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', height: 56 }}
                >
                  <ActionButton
                    label="←"
                    width={72}
                    height={52}
                    disabled={index === 0}
                    tone="secondary"
                    interactionId={`queue-left:${card.id}`}
                    onPress={() => move(index, -1)}
                  />
                  <ActionButton
                    label="→"
                    width={72}
                    height={52}
                    disabled={index === queue.length - 1}
                    tone="secondary"
                    interactionId={`queue-right:${card.id}`}
                    onPress={() => move(index, 1)}
                  />
                </UiEntity>
              </UiEntity>
            ))}
            {!queue.length ? (
              <Label value="NO CARDS REMAIN" color={UI_COLORS.textMuted} fontSize={18} uiTransform={{ height: 100 }} />
            ) : null}
          </UiEntity>
          <Label
            value={
              setup
                ? 'Review your first-round order. The other two decks are already locked.'
                : 'Unused cards expire at round end; your next prepared deck replaces them.'
            }
            fontSize={14}
            color={UI_COLORS.textMuted}
            uiTransform={{ width: '100%', height: 32 }}
          />
        </UiEntity>
      ) : null}
    </UiEntity>
  )
}

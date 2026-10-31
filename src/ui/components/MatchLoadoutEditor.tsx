import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { CHASE_CARD_DETAILS } from '../../game/rules/chaseCards'
import { DECK_CARD_TYPES, validateLoadout, type DeckCardType, type MatchLoadout } from '../../game/rules/loadouts'
import { playUiSound } from '../../presentation/audioDirector'
import {
  createLoadoutDraft,
  epicPlacement,
  moveLoadoutCard,
  replaceLoadoutCard,
  selectLoadoutSlot,
  slotLabel
} from '../state/loadoutDraft'
import { getControlMotion, pressControl, setControlHovered } from '../state/interactionState'
import { loadoutLayout } from '../theme/loadoutLayout'
import { UI_COLORS } from '../theme/tokens'
import { ActionButton } from './ActionButton'
import { CardTile } from './CardTile'
import { Panel } from './Panel'
import { SciFiSurface } from './SciFiSurface'
import { PageNavigation } from './PageNavigation'
import { pageWindow } from '../state/pagination'

let draft = createLoadoutDraft()
let catalogTier: 'GENERAL' | 'EPIC' = 'GENERAL'
let catalogPage = 0
let editorPane: 'DECKS' | 'CARDS' = 'DECKS'

function LoadoutSlot({
  type,
  slot,
  selected,
  height,
  interactionId,
  onPress
}: {
  type: DeckCardType
  slot: number
  selected: boolean
  height: number
  interactionId: string
  onPress: () => void
}) {
  const detail = CHASE_CARD_DETAILS[type]
  const motion = getControlMotion(interactionId, false)
  return (
    <UiEntity
      uiTransform={{
        width: '32%',
        minWidth: 0,
        height,
        padding: 6,
        flexShrink: 0,
        flexDirection: 'column',
        pointerFilter: 'block'
      }}
      onMouseDown={() => {
        pressControl(interactionId)
        playUiSound('press')
        onPress()
      }}
      onMouseEnter={() => {
        setControlHovered(interactionId, true)
        playUiSound('highlight')
      }}
      onMouseLeave={() => setControlHovered(interactionId, false)}
    >
      <SciFiSurface tone={selected ? UI_COLORS.cyan : UI_COLORS.space700} hover={motion.hover} press={motion.press} />
      <Label
        value={`CARD ${slot + 1}${slot === 0 ? ' · FIRST' : ''}`}
        fontSize={12}
        color={selected ? UI_COLORS.cyan : UI_COLORS.textMuted}
        uiTransform={{ width: '100%', height: 18, flexShrink: 0, pointerFilter: 'none' }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          flexGrow: 1,
          minHeight: 32,
          flexDirection: 'row',
          alignItems: 'center',
          pointerFilter: 'none'
        }}
      >
        <UiEntity
          uiTransform={{ width: 28, height: 28, flexShrink: 0, margin: { left: 4, right: 6 }, pointerFilter: 'none' }}
          uiBackground={{
            texture: { src: detail.icon, filterMode: 'bi-linear', wrapMode: 'clamp' },
            textureMode: 'stretch'
          }}
        />
        <Label
          value={detail.name}
          fontSize={15}
          color={UI_COLORS.white}
          uiTransform={{ flexGrow: 1, minWidth: 0, height: 36, pointerFilter: 'none' }}
        />
      </UiEntity>
      <Label
        value={selected ? 'SELECTED' : 'TAP TO CHANGE'}
        fontSize={11}
        color={selected ? UI_COLORS.cyan : UI_COLORS.textMuted}
        uiTransform={{ width: '100%', height: 16, flexShrink: 0, pointerFilter: 'none' }}
      />
    </UiEntity>
  )
}

export function MatchLoadoutEditor({
  compact,
  viewport = { width: 1920, height: 1080, mobile: false },
  onBack,
  onConfirm
}: {
  compact: boolean
  viewport?: { width: number; height: number; mobile: boolean }
  onBack: () => void
  onConfirm: (plan: MatchLoadout) => void
}) {
  const layout = loadoutLayout(viewport.width, viewport.height, viewport.mobile, compact)
  const selectedType = draft.plan[draft.round][draft.slot]
  const selected = CHASE_CARD_DETAILS[selectedType]
  const catalog = pageWindow(
    DECK_CARD_TYPES.filter((type) => CHASE_CARD_DETAILS[type].rarity === catalogTier),
    catalogPage,
    layout.catalogRows
  )
  const asCard = (type: DeckCardType) => ({
    ...CHASE_CARD_DETAILS[type],
    id: `catalog-${type}`,
    type,
    category: 'INTERVENTION' as const,
    tier: CHASE_CARD_DETAILS[type].rarity,
    state: 'AVAILABLE' as const
  })
  return (
    <Panel
      variant="accent"
      uiTransform={{
        width: layout.panelWidth,
        height: layout.panelHeight,
        padding: layout.padding,
        flexDirection: 'column'
      }}
    >
      <Label
        value="3 ROUNDS · 3 CARDS EACH"
        fontSize={compact ? 26 : 32}
        color={UI_COLORS.white}
        uiTransform={{ width: '100%', height: 44, flexShrink: 0 }}
      />
      <Label
        value="1. Tap a card slot.   2. Choose its replacement.   3. Set the play order."
        fontSize={15}
        color={UI_COLORS.textMuted}
        uiTransform={{ width: '100%', height: 30, flexShrink: 0, margin: { bottom: 6 } }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: layout.bodyHeight,
          flexShrink: 0,
          flexDirection: layout.stacked ? 'column' : 'row',
          overflow: 'hidden'
        }}
      >
        {layout.stacked ? (
          <UiEntity
            uiTransform={{
              width: '100%',
              height: 50,
              flexShrink: 0,
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            {(['DECKS', 'CARDS'] as const).map((pane) => (
              <ActionButton
                label={pane === 'DECKS' ? 'YOUR 3 ROUNDS' : 'AVAILABLE CARDS'}
                tone="secondary"
                accent={editorPane === pane ? UI_COLORS.cyan : UI_COLORS.space700}
                width="49%"
                height={44}
                fontSize={15}
                interactionId={`loadout-pane:${pane}`}
                onPress={() => {
                  editorPane = pane
                }}
              />
            ))}
          </UiEntity>
        ) : null}
        <UiEntity
          uiTransform={{
            width: layout.deckWidth,
            height: layout.paneHeight,
            display: layout.stacked && editorPane !== 'DECKS' ? 'none' : 'flex',
            flexShrink: 0,
            flexDirection: 'column',
            overflow: 'hidden',
            margin: layout.stacked ? 0 : { right: 16 }
          }}
        >
          <Label
            value="YOUR ROUND DECKS · PLAY LEFT TO RIGHT"
            fontSize={14}
            color={UI_COLORS.cyan}
            textAlign="middle-left"
            uiTransform={{ width: '100%', height: 22, flexShrink: 0 }}
          />
          {draft.plan.map((row, round) => (
            <Panel
              variant={round === draft.round ? 'accent' : 'quiet'}
              uiTransform={{
                width: '100%',
                padding: 6,
                margin: { bottom: 4 },
                flexShrink: 0,
                flexDirection: 'column'
              }}
            >
              <UiEntity
                uiTransform={{
                  width: '100%',
                  height: 22,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}
              >
                <Label
                  value={`ROUND ${round + 1}`}
                  fontSize={18}
                  color={UI_COLORS.white}
                  textAlign="middle-left"
                  uiTransform={{ width: '40%', height: '100%' }}
                />
                <Label
                  value={round === draft.round ? `3 / 3 CARDS · EDITING CARD ${draft.slot + 1}` : '3 / 3 CARDS'}
                  fontSize={12}
                  color={round === draft.round ? UI_COLORS.cyan : UI_COLORS.textMuted}
                  textAlign="middle-right"
                  uiTransform={{ width: '60%', height: '100%' }}
                />
              </UiEntity>
              <UiEntity
                uiTransform={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', flexShrink: 0 }}
              >
                {row.map((type, slot) => (
                  <LoadoutSlot
                    type={type}
                    slot={slot}
                    selected={round === draft.round && slot === draft.slot}
                    height={layout.slotHeight}
                    interactionId={`loadout-slot:${round}:${slot}`}
                    onPress={() => {
                      draft = selectLoadoutSlot(draft, round, slot)
                      catalogTier = CHASE_CARD_DETAILS[type].rarity as 'GENERAL' | 'EPIC'
                      catalogPage = 0
                      if (layout.stacked) editorPane = 'CARDS'
                    }}
                  />
                ))}
              </UiEntity>
            </Panel>
          ))}
          <Label
            value={`REORDER: ${slotLabel(draft.round, draft.slot)}`}
            fontSize={13}
            color={UI_COLORS.cyan}
            uiTransform={{ width: '100%', height: 20, flexShrink: 0 }}
          />
          <UiEntity
            uiTransform={{
              width: '100%',
              height: 48,
              flexDirection: 'row',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            {([-1, 1] as const).map((direction) => (
              <ActionButton
                label={direction === -1 ? '← EARLIER' : 'LATER →'}
                width="48%"
                height={44}
                fontSize={15}
                tone="secondary"
                disabled={draft.slot + direction < 0 || draft.slot + direction > 2}
                interactionId={`loadout-move:${direction}`}
                onPress={() => {
                  draft = moveLoadoutCard(draft, direction)
                }}
              />
            ))}
          </UiEntity>
        </UiEntity>
        <Panel
          variant="quiet"
          uiTransform={{
            width: layout.catalogWidth,
            height: layout.paneHeight,
            display: layout.stacked && editorPane !== 'CARDS' ? 'none' : 'flex',
            flexShrink: 0,
            padding: 12,
            flexDirection: 'column'
          }}
        >
          <Label
            value={`CHANGE ${slotLabel(draft.round, draft.slot).toUpperCase()}`}
            fontSize={19}
            color={UI_COLORS.cyan}
            textAlign="middle-left"
            uiTransform={{ width: '100%', height: 26, flexShrink: 0 }}
          />
          <Label
            value={`NOW: ${selected.name}`}
            fontSize={15}
            color={UI_COLORS.white}
            textAlign="middle-left"
            uiTransform={{ width: '100%', height: 22, flexShrink: 0 }}
          />
          <Label
            value={selected.description}
            fontSize={13}
            color={UI_COLORS.textMuted}
            textAlign="top-left"
            uiTransform={{ width: '100%', height: 64, flexShrink: 0 }}
          />
          <UiEntity
            uiTransform={{
              width: '100%',
              height: 48,
              flexShrink: 0,
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            {(['GENERAL', 'EPIC'] as const).map((tier) => (
              <ActionButton
                label={`${catalogTier === tier ? '• ' : ''}${tier}`}
                tone="secondary"
                accent={tier === 'GENERAL' ? UI_COLORS.alien : UI_COLORS.danger}
                width="49%"
                height={44}
                fontSize={14}
                interactionId={`loadout-tier:${tier}`}
                onPress={() => {
                  catalogTier = tier
                  catalogPage = 0
                }}
              />
            ))}
          </UiEntity>
          <UiEntity
            uiTransform={{ width: '100%', flexGrow: 1, minHeight: 0, flexDirection: 'column', overflow: 'hidden' }}
          >
            {catalog.items.map((type) => {
              const placed = epicPlacement(draft, type)
              const current = selectedType === type
              return (
                <UiEntity
                  key={`catalog-card-${type}`}
                  uiTransform={{ width: '100%', height: 92, padding: { bottom: 8 }, flexShrink: 0 }}
                >
                  <CardTile
                    mini
                    wrapTitle
                    horizontal
                    compact={compact}
                    card={asCard(type)}
                    stateLabel={catalogTier === 'GENERAL' ? 'GENERAL · REPEATABLE' : 'EPIC · ONCE PER MATCH'}
                    actionLabel={
                      placed ? `USED: R${placed.round + 1} · C${placed.slot + 1}` : current ? 'IN THIS SLOT' : 'REPLACE'
                    }
                    interactionDisabled={!!placed || current}
                    interactionId={`loadout-add:${type}`}
                    onPress={() => {
                      draft = replaceLoadoutCard(draft, type)
                    }}
                  />
                </UiEntity>
              )
            })}
          </UiEntity>
          <PageNavigation
            id="loadout-catalog"
            page={catalog.page}
            count={catalog.count}
            onPage={(page) => {
              catalogPage = page
            }}
          />
          <Label
            value={
              catalogTier === 'EPIC'
                ? 'To move an Epic, replace its old slot first.'
                : 'Turbo / Echo: board pickups only.'
            }
            fontSize={11}
            color={UI_COLORS.violet}
            uiTransform={{ width: '100%', height: 24, flexShrink: 0 }}
          />
        </Panel>
      </UiEntity>
      <Label
        value={draft.message || 'Each round uses its own 3-card deck. Unused cards are discarded when that round ends.'}
        color={draft.message ? UI_COLORS.cyan : UI_COLORS.textMuted}
        fontSize={14}
        uiTransform={{ width: '100%', height: 36, flexShrink: 0 }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 64,
          flexShrink: 0,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <ActionButton
          label="BACK"
          tone="secondary"
          width="28%"
          height={60}
          onPress={onBack}
          interactionId="loadout-back"
        />
        <ActionButton
          label="READY · FIND MATCH"
          width="68%"
          height={60}
          onPress={() => {
            if (validateLoadout(draft.plan)) onConfirm(draft.plan.map((row) => [...row]) as MatchLoadout)
          }}
          interactionId="loadout-confirm"
        />
      </UiEntity>
    </Panel>
  )
}

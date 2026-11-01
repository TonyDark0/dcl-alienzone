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
import { CardHologram, CardSurface } from './CardSurface'
import { Panel } from './Panel'
import { PageNavigation } from './PageNavigation'
import { pageWindow } from '../state/pagination'

let draft = createLoadoutDraft()
let catalogTier: 'ALL' | 'GENERAL' | 'EPIC' = 'ALL'
let catalogPage = 0
let editorPane: 'DECKS' | 'CARDS' | 'DETAILS' = 'DECKS'
let previewType: DeckCardType = 'FREEZE'
const tierColor = (type: DeckCardType) =>
  CHASE_CARD_DETAILS[type].rarity === 'EPIC' ? UI_COLORS.danger : UI_COLORS.alien

function LoadoutSlot({
  type,
  slot,
  selected,
  density = 1,
  height,
  interactionId,
  onPress
}: {
  type: DeckCardType
  slot: number
  selected: boolean
  density?: number
  height: number
  interactionId: string
  onPress: () => void
}) {
  const u = (value: number) => value * density
  const detail = CHASE_CARD_DETAILS[type]
  const motion = getControlMotion(interactionId, false)
  return (
    <UiEntity
      uiTransform={{
        width: '32%',
        minWidth: 0,
        height,
        padding: u(7),
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
      <CardSurface tone={selected ? UI_COLORS.cyan : tierColor(type)} selected={selected} hover={motion.hover} />
      <Label
        value={`0${slot + 1}${slot === 0 ? ' · FIRST' : ''}`}
        fontSize={u(11)}
        color={selected ? UI_COLORS.cyan : UI_COLORS.textMuted}
        uiTransform={{ width: '100%', height: u(17), flexShrink: 0, pointerFilter: 'none' }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          flexGrow: 1,
          minHeight: 30,
          flexDirection: 'row',
          alignItems: 'center',
          pointerFilter: 'none'
        }}
      >
        <UiEntity
          uiTransform={{ width: u(22), height: u(22), flexShrink: 0, margin: { right: u(4) }, pointerFilter: 'none' }}
          uiBackground={{
            texture: { src: detail.icon, filterMode: 'bi-linear', wrapMode: 'clamp' },
            textureMode: 'stretch'
          }}
        />
        <Label
          value={detail.name}
          fontSize={u(13)}
          color={UI_COLORS.white}
          uiTransform={{ flexGrow: 1, minWidth: 0, height: u(32), pointerFilter: 'none' }}
        />
      </UiEntity>
      <Label
        value={selected ? 'EDITING' : 'CHANGE'}
        fontSize={u(10)}
        color={selected ? UI_COLORS.cyan : UI_COLORS.textMuted}
        uiTransform={{ width: '100%', height: u(13), flexShrink: 0, pointerFilter: 'none' }}
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
  const u = (value: number) => value * layout.density
  const selectedType = draft.plan[draft.round][draft.slot]
  const preview = CHASE_CARD_DETAILS[previewType]
  const placed = epicPlacement(draft, previewType)
  const current = previewType === selectedType
  const columns = catalogTier === 'ALL' ? layout.catalogColumns : Math.min(2, layout.catalogColumns)
  const catalog = pageWindow(
    DECK_CARD_TYPES.filter((type) => catalogTier === 'ALL' || CHASE_CARD_DETAILS[type].rarity === catalogTier),
    catalogPage,
    columns * layout.catalogRows
  )
  const paneDisplay = (pane: typeof editorPane) =>
    layout.stacked && editorPane !== pane ? ('none' as const) : ('flex' as const)
  const asCard = (type: DeckCardType) => ({
    ...CHASE_CARD_DETAILS[type],
    id: `catalog-${type}`,
    type,
    category: 'INTERVENTION' as const,
    tier: CHASE_CARD_DETAILS[type].rarity,
    state: 'AVAILABLE' as const
  })
  const restriction = placed
    ? `USED IN R${placed.round + 1} · CARD ${placed.slot + 1}. Replace that slot first.`
    : preview.rarity === 'EPIC'
      ? 'EPIC · One slot in the entire match. Unused cards expire.'
      : 'GENERAL · Repeatable across your three round decks.'
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
      <UiEntity uiTransform={{ width: '100%', height: u(84), flexShrink: 0, flexDirection: 'column' }}>
        <UiEntity uiTransform={{ width: '100%', height: u(40), flexDirection: 'row', alignItems: 'center' }}>
          <Label
            value={layout.stacked ? 'YOUR 3 ROUND DECKS' : 'PREPARE YOUR LOADOUT'}
            fontSize={u(compact ? 25 : 32)}
            textAlign="middle-left"
            color={UI_COLORS.white}
            uiTransform={{ flexGrow: 1, height: u(40) }}
          />
          <Label
            value="3 ROUNDS / 9 SLOTS"
            fontSize={u(14)}
            color={UI_COLORS.cyan}
            uiTransform={{ width: u(220), height: u(36), display: layout.stacked ? 'none' : 'flex' }}
          />
        </UiEntity>
        <Label
          value={
            layout.stacked
              ? 'CHOOSE SLOT → PREVIEW CARD → EQUIP'
              : '01  CHOOSE A SLOT     →     02  PREVIEW A CARD     →     03  EQUIP & ORDER'
          }
          fontSize={u(compact ? 12 : 14)}
          textAlign="middle-left"
          color={UI_COLORS.textMuted}
          uiTransform={{ width: '100%', height: u(36) }}
        />
      </UiEntity>
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
              height: u(50),
              flexShrink: 0,
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            {(['DECKS', 'CARDS', 'DETAILS'] as const).map((pane) => (
              <ActionButton
                label={pane === 'DECKS' ? 'YOUR ROUNDS' : pane === 'CARDS' ? 'CARD LIBRARY' : 'CARD DETAIL'}
                tone="secondary"
                accent={editorPane === pane ? UI_COLORS.cyan : UI_COLORS.space700}
                width="32%"
                height={u(44)}
                fontSize={u(14)}
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
            display: paneDisplay('DECKS'),
            flexShrink: 0,
            flexDirection: 'column',
            overflow: 'hidden',
            margin: layout.stacked ? 0 : { right: u(16) }
          }}
        >
          <Label
            value="YOUR ROUND DECKS · PLAY LEFT TO RIGHT"
            fontSize={u(13)}
            textAlign="middle-left"
            color={UI_COLORS.cyan}
            uiTransform={{ width: '100%', height: u(22), flexShrink: 0 }}
          />
          {draft.plan.map((row, round) => (
            <Panel
              variant={round === draft.round ? 'accent' : 'quiet'}
              uiTransform={{
                width: '100%',
                padding: u(6),
                margin: { bottom: u(8) },
                flexShrink: 0,
                flexDirection: 'column'
              }}
            >
              <UiEntity
                uiTransform={{
                  width: '100%',
                  height: u(22),
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}
              >
                <Label
                  value={`ROUND ${round + 1}`}
                  fontSize={u(17)}
                  color={UI_COLORS.white}
                  textAlign="middle-left"
                  uiTransform={{ width: '40%', height: '100%' }}
                />
                <Label
                  value={round === draft.round ? `3 / 3 · EDITING ${draft.slot + 1}` : '3 / 3 CARDS'}
                  fontSize={u(11)}
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
                    density={layout.density}
                    type={type}
                    slot={slot}
                    selected={round === draft.round && slot === draft.slot}
                    height={layout.slotHeight}
                    interactionId={`loadout-slot:${round}:${slot}`}
                    onPress={() => {
                      draft = selectLoadoutSlot(draft, round, slot)
                      previewType = type
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
            fontSize={u(12)}
            color={UI_COLORS.cyan}
            uiTransform={{ width: '100%', height: u(20), flexShrink: 0 }}
          />
          <UiEntity
            uiTransform={{
              width: '100%',
              height: u(48),
              flexDirection: 'row',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            {([-1, 1] as const).map((direction) => (
              <ActionButton
                label={direction === -1 ? '← EARLIER' : 'LATER →'}
                width="48%"
                height={u(44)}
                fontSize={u(14)}
                tone="secondary"
                disabled={draft.slot + direction < 0 || draft.slot + direction > 2}
                interactionId={`loadout-move:${direction}`}
                onPress={() => {
                  draft = moveLoadoutCard(draft, direction)
                  previewType = draft.plan[draft.round][draft.slot]
                }}
              />
            ))}
          </UiEntity>
          {!compact ? (
            <Label
              value="Each round has exactly 3 cards. Leftovers do not carry over."
              fontSize={u(12)}
              color={UI_COLORS.textMuted}
              uiTransform={{ width: '100%', height: u(36), flexShrink: 0 }}
            />
          ) : null}
        </UiEntity>
        <Panel
          variant="quiet"
          uiTransform={{
            width: layout.catalogWidth,
            height: layout.paneHeight,
            display: paneDisplay('CARDS'),
            flexShrink: 0,
            padding: u(12),
            margin: layout.stacked ? 0 : { right: u(16) },
            flexDirection: 'column'
          }}
        >
          <Label
            value="CARD LIBRARY"
            fontSize={u(19)}
            color={UI_COLORS.white}
            textAlign="middle-left"
            uiTransform={{ width: '100%', height: u(28), flexShrink: 0 }}
          />
          <Label
            value={`Choose a card for R${draft.round + 1} / slot ${draft.slot + 1}. Preview before equipping.`}
            fontSize={u(12)}
            color={UI_COLORS.textMuted}
            textAlign="middle-left"
            uiTransform={{ width: '100%', height: u(22), flexShrink: 0 }}
          />
          <UiEntity
            uiTransform={{
              width: '100%',
              height: u(48),
              flexShrink: 0,
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            {(['ALL', 'GENERAL', 'EPIC'] as const).map((tier) => (
              <ActionButton
                label={`${catalogTier === tier ? '• ' : ''}${tier}`}
                tone="secondary"
                accent={tier === 'EPIC' ? UI_COLORS.danger : tier === 'GENERAL' ? UI_COLORS.alien : UI_COLORS.cyan}
                width="32%"
                height={u(40)}
                fontSize={u(12)}
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
            {Array.from({ length: Math.ceil(catalog.items.length / columns) }, (_, row) => (
              <UiEntity
                uiTransform={{
                  width: '100%',
                  height: layout.cardHeight + u(12),
                  flexShrink: 0,
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                {catalog.items.slice(row * columns, row * columns + columns).map((type) => {
                  const used = epicPlacement(draft, type)
                  return (
                    <UiEntity
                      key={`catalog-card-${type}`}
                      uiTransform={{
                        width: layout.cardWidth + u(12),
                        height: layout.cardHeight,
                        padding: { left: u(6), right: u(6) },
                        flexShrink: 0
                      }}
                    >
                      <CardTile
                        density={layout.density}
                        portrait
                        width={layout.cardWidth}
                        height={layout.cardHeight}
                        compact={compact}
                        card={asCard(type)}
                        selected={previewType === type}
                        actionLabel={
                          used
                            ? `USED R${used.round + 1} / C${used.slot + 1}`
                            : previewType === type
                              ? 'VIEWING'
                              : 'VIEW CARD'
                        }
                        interactionId={`loadout-preview:${type}`}
                        onPress={() => {
                          previewType = type
                          if (layout.stacked) editorPane = 'DETAILS'
                        }}
                      />
                    </UiEntity>
                  )
                })}
              </UiEntity>
            ))}
          </UiEntity>
          <PageNavigation
            id="loadout-catalog"
            density={layout.density}
            page={catalog.page}
            count={catalog.count}
            onPage={(page) => {
              catalogPage = page
            }}
          />
        </Panel>
        <Panel
          variant="quiet"
          uiTransform={{
            width: layout.detailWidth,
            height: layout.paneHeight,
            display: paneDisplay('DETAILS'),
            flexShrink: 0,
            padding: u(12),
            flexDirection: 'column'
          }}
        >
          <Label
            value={current ? 'EQUIPPED IN THIS SLOT' : 'CARD PREVIEW · NOT EQUIPPED'}
            fontSize={u(11)}
            color={UI_COLORS.cyan}
            uiTransform={{ width: '100%', height: u(22), flexShrink: 0 }}
          />
          <Label
            value={preview.rarity}
            fontSize={u(12)}
            color={tierColor(previewType)}
            uiTransform={{ width: '100%', height: u(18), flexShrink: 0 }}
          />
          <Label
            value={preview.name}
            fontSize={u(compact ? 22 : 26)}
            color={UI_COLORS.white}
            uiTransform={{ width: '100%', height: u(40), flexShrink: 0 }}
          />
          <CardHologram
            density={layout.density}
            icon={preview.icon}
            tone={tierColor(previewType)}
            size={u(compact ? 44 : 96)}
          />
          <Label
            value={preview.description}
            fontSize={u(compact ? 13 : 15)}
            color={UI_COLORS.white}
            textAlign="top-left"
            uiTransform={{ width: '100%', height: u(compact ? 104 : 132), flexShrink: 0 }}
          />
          <Label
            value={restriction}
            fontSize={u(12)}
            color={placed ? UI_COLORS.danger : tierColor(previewType)}
            textAlign="top-left"
            uiTransform={{ width: '100%', height: u(compact ? 44 : 54), flexShrink: 0 }}
          />
          <UiEntity uiTransform={{ flexGrow: 1, minHeight: 0 }} />
          <Label
            value={`TARGET: ROUND ${draft.round + 1} · CARD ${draft.slot + 1}`}
            fontSize={u(12)}
            color={UI_COLORS.cyan}
            uiTransform={{ width: '100%', height: u(24), flexShrink: 0 }}
          />
          <ActionButton
            label={placed ? 'ALREADY USED' : current ? 'EQUIPPED' : 'EQUIP CARD'}
            tone="secondary"
            accent={tierColor(previewType)}
            width="100%"
            height={u(52)}
            fontSize={u(16)}
            disabled={!!placed || current}
            interactionId="loadout-equip"
            onPress={() => {
              // Revalidate the current slot, never trust a stale preview/disabled control.
              draft = replaceLoadoutCard(draft, previewType)
              if (layout.stacked && draft.plan[draft.round][draft.slot] === previewType) editorPane = 'DECKS'
            }}
          />
        </Panel>
      </UiEntity>
      <Label
        value={
          previewType !== selectedType && !placed
            ? 'Preview only — tap EQUIP CARD to replace the highlighted slot.'
            : draft.message ||
              '3 cards per round. General repeats; each Epic once per match. Turbo / Echo are board pickups.'
        }
        color={UI_COLORS.textMuted}
        fontSize={u(13)}
        uiTransform={{ width: '100%', height: u(30), flexShrink: 0 }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: u(58),
          flexShrink: 0,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <ActionButton
          label="BACK"
          tone="secondary"
          width="24%"
          height={u(54)}
          fontSize={u(17)}
          onPress={onBack}
          interactionId="loadout-back"
        />
        <ActionButton
          label="READY · FIND MATCH"
          width="36%"
          height={u(54)}
          fontSize={u(18)}
          interactionId="loadout-confirm"
          onPress={() => {
            if (validateLoadout(draft.plan)) onConfirm(draft.plan.map((row) => [...row]) as MatchLoadout)
          }}
        />
      </UiEntity>
    </Panel>
  )
}

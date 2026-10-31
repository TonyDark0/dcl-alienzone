import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { CHASE_CARD_DETAILS } from '../../game/rules/chaseCards'
import { DECK_CARD_TYPES, defaultLoadout, validateLoadout, type MatchLoadout } from '../../game/rules/loadouts'
import { ActionButton } from './ActionButton'
import { CardTile } from './CardTile'
import { Panel } from './Panel'
import { UI_COLORS } from '../theme/tokens'

let plan = defaultLoadout()
let selectedRound = 0
let selectedSlot = 0
let error = ''
export function MatchLoadoutEditor({
  compact,
  onBack,
  onConfirm
}: {
  compact: boolean
  onBack: () => void
  onConfirm: (plan: MatchLoadout) => void
}) {
  const asCard = (type: MatchLoadout[0][0], id: string) => ({
    ...CHASE_CARD_DETAILS[type],
    id,
    type,
    category: 'INTERVENTION' as const,
    tier: CHASE_CARD_DETAILS[type].rarity,
    state: 'AVAILABLE' as const
  })
  return (
    <Panel
      variant="accent"
      uiTransform={{
        width: '88%',
        maxWidth: 1040,
        height: '92%',
        maxHeight: 880,
        padding: compact ? 16 : 28,
        flexDirection: 'column'
      }}
    >
      <Label
        value="PREPARE YOUR 3 ROUND DECKS"
        fontSize={compact ? 24 : 32}
        color={UI_COLORS.white}
        uiTransform={{ width: '100%', height: 46, flexShrink: 0 }}
      />
      <Label
        value="3 cards per round. General: repeatable. Each Epic: one slot per match. Rare: board pickups only."
        fontSize={14}
        color={UI_COLORS.textMuted}
        uiTransform={{ width: '100%', height: 42, flexShrink: 0 }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 56,
          flexShrink: 0,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        {[0, 1, 2].map((round) => (
          <ActionButton
            label={`ROUND ${round + 1}`}
            width="32%"
            height={52}
            fontSize={18}
            tone={round === selectedRound ? 'primary' : 'secondary'}
            interactionId={`loadout-round:${round}`}
            onPress={() => {
              selectedRound = round
              error = ''
            }}
          />
        ))}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', flexGrow: 1, minHeight: 0, overflow: 'scroll', flexDirection: 'column' }}>
        <UiEntity
          uiTransform={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'center',
            margin: { top: 12, bottom: 12 },
            flexShrink: 0
          }}
        >
          {plan[selectedRound].map((type, slot) => (
            <UiEntity
              uiTransform={{
                width: compact ? 160 : 190,
                margin: { left: 4, right: 4 },
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Label
                value={`${slot + 1} · ${slot === selectedSlot ? 'EDITING' : 'IN ORDER'}`}
                color={slot === selectedSlot ? UI_COLORS.cyan : UI_COLORS.textMuted}
                fontSize={14}
                uiTransform={{ height: 28 }}
              />
              <CardTile
                mini
                compact={compact}
                card={asCard(type, `plan-${selectedRound}-${slot}`)}
                stateLabel={CHASE_CARD_DETAILS[type].rarity}
                actionLabel="SELECT SLOT"
                onPress={() => {
                  selectedSlot = slot
                  error = ''
                }}
              />
              <UiEntity uiTransform={{ width: '100%', height: 52, flexDirection: 'row', justifyContent: 'center' }}>
                {[-1, 1].map((direction) => (
                  <ActionButton
                    label={direction === -1 ? '←' : '→'}
                    width={72}
                    height={48}
                    tone="secondary"
                    disabled={slot + direction < 0 || slot + direction > 2}
                    interactionId={`loadout-move:${slot}:${direction}`}
                    onPress={() => {
                      const row = plan[selectedRound]
                      const next = slot + direction
                      ;[row[slot], row[next]] = [row[next], row[slot]]
                      selectedSlot = next
                    }}
                  />
                ))}
              </UiEntity>
            </UiEntity>
          ))}
        </UiEntity>
        <Label
          value="CHOOSE A CARD FOR THE SELECTED SLOT"
          fontSize={16}
          color={UI_COLORS.cyan}
          uiTransform={{ height: 34, flexShrink: 0 }}
        />
        <UiEntity uiTransform={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          {DECK_CARD_TYPES.map((type) => (
            <UiEntity uiTransform={{ margin: 6, flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <CardTile
                mini
                compact={compact}
                card={asCard(type, `catalog-${type}`)}
                stateLabel={CHASE_CARD_DETAILS[type].rarity}
                actionLabel="PUT IN SLOT"
                interactionId={`loadout-add:${type}`}
                onPress={() => {
                  const proposed = plan.map((row) => [...row]) as MatchLoadout
                  proposed[selectedRound][selectedSlot] = type
                  if (!validateLoadout(proposed)) error = 'Each Epic can appear only once across all 3 decks.'
                  else {
                    plan = proposed
                    error = ''
                  }
                }}
              />
            </UiEntity>
          ))}
        </UiEntity>
        <Label
          value={CHASE_CARD_DETAILS[plan[selectedRound][selectedSlot]].description}
          fontSize={15}
          color={UI_COLORS.textMuted}
          uiTransform={{ width: '100%', height: 80, flexShrink: 0 }}
        />
      </UiEntity>
      <Label
        value={
          error || 'Unused cards expire at round end. Chaos locks your queue until it redirects an incoming alien.'
        }
        color={error ? UI_COLORS.danger : UI_COLORS.textMuted}
        fontSize={14}
        uiTransform={{ width: '100%', height: 42, flexShrink: 0 }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 68,
          flexShrink: 0,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <ActionButton
          label="BACK"
          tone="secondary"
          width="32%"
          height={60}
          onPress={onBack}
          interactionId="loadout-back"
        />
        <ActionButton
          label="FIND MATCH"
          width="64%"
          height={60}
          onPress={() => {
            if (validateLoadout(plan)) onConfirm(plan.map((row) => [...row]) as MatchLoadout)
          }}
          interactionId="loadout-confirm"
        />
      </UiEntity>
    </Panel>
  )
}

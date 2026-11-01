import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { OBJECTIVE_GOAL, OBJECTIVE_LORE, OBJECTIVE_STEPS } from '../state/tutorial'
import { UI_COLORS } from '../theme/tokens'
import { SciFiSurface } from './SciFiSurface'

/** Whole illustrated steps, not a scrollable wall of text. Two steps per page. */
export function ObjectiveInstructions({
  page,
  compact,
  mobile = false,
  narrow = false,
  density = 1
}: {
  page: number
  compact: boolean
  mobile?: boolean
  narrow?: boolean
  density?: number
}) {
  const u = (value: number) => value * density
  const start = Math.max(0, Math.min(2, page)) * 2
  return (
    <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
      <Label
        value={OBJECTIVE_LORE}
        fontSize={u(compact ? 14 : 17)}
        color={UI_COLORS.textMuted}
        textAlign="top-left"
        uiTransform={{ width: '100%', height: u(narrow ? 64 : compact ? 46 : 56), flexShrink: 0 }}
      />
      <Label
        value={OBJECTIVE_GOAL}
        fontSize={u(compact ? 14 : 18)}
        color={UI_COLORS.alien}
        textAlign="top-left"
        uiTransform={{ width: '100%', height: u(narrow ? 46 : 36), flexShrink: 0 }}
      />
      <UiEntity
        uiTransform={{ width: '100%', flexDirection: narrow ? 'column' : 'row', justifyContent: 'space-between' }}
      >
        {OBJECTIVE_STEPS.slice(start, start + 2).map((step, index) => (
          <UiEntity
            uiTransform={{
              width: narrow ? '100%' : '49%',
              height: u(narrow ? 166 : compact ? 218 : 246),
              padding: u(narrow ? 10 : 14),
              flexShrink: 0,
              flexDirection: narrow ? 'row' : 'column',
              alignItems: 'center',
              margin: { bottom: u(10) }
            }}
          >
            <SciFiSurface quiet tone={index === 0 ? UI_COLORS.cyan : UI_COLORS.alien} />
            <UiEntity
              uiTransform={{
                width: u(narrow ? 72 : compact ? 64 : 80),
                height: u(narrow ? 72 : compact ? 64 : 80),
                flexShrink: 0,
                margin: { right: u(narrow ? 10 : 0), bottom: u(narrow ? 0 : 6) },
                pointerFilter: 'none'
              }}
              uiBackground={{ texture: { src: step.icon, filterMode: 'bi-linear' }, textureMode: 'stretch' }}
            />
            <UiEntity
              uiTransform={{ width: narrow ? undefined : '100%', flexGrow: 1, minWidth: 0, flexDirection: 'column' }}
            >
              <Label
                value={`${start + index + 1}. ${step.title}`}
                color={UI_COLORS.white}
                fontSize={u(compact ? 14 : 17)}
                textAlign={narrow ? 'middle-left' : 'middle-center'}
                uiTransform={{ width: '100%', height: u(narrow ? 34 : 26), flexShrink: 0 }}
              />
              <Label
                value={mobile ? step.touch : step.desktop}
                color={UI_COLORS.cyan}
                fontSize={u(compact ? 12 : 14)}
                textAlign={narrow ? 'middle-left' : 'middle-center'}
                uiTransform={{ width: '100%', height: u(28), flexShrink: 0 }}
              />
              <Label
                value={step.description}
                color={UI_COLORS.textMuted}
                fontSize={u(narrow ? 12 : compact ? 14 : 16)}
                textAlign="top-left"
                uiTransform={{ width: '100%', height: u(narrow ? 84 : 80), flexShrink: 0 }}
              />
            </UiEntity>
          </UiEntity>
        ))}
      </UiEntity>
      <Label
        value={
          page === 0
            ? 'NO AUTO-PASS · Only a successful, in-range throw scores.'
            : page === 1
              ? 'GENERAL: repeatable · EPIC: once per match · RARE: board pickups only.'
              : '3 ROUNDS · No elimination · Highest total wins.'
        }
        fontSize={u(compact ? 12 : 14)}
        color={UI_COLORS.textMuted}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: u(narrow ? 40 : 32), flexShrink: 0 }}
      />
    </UiEntity>
  )
}

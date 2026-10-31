import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import { isMobile } from '@dcl/sdk/platform'
import { CARD_DETAILS } from '../../game/rules/deck'
import { getUiState } from '../state/uiState'
import { UI_COLORS } from '../theme/tokens'
import { hudLayout, powerToastLayout } from '../theme/hudLayout'
import { POWER_TOAST_MS, stepPowerToast, type PowerToastState } from '../state/powerToast'

let toast: PowerToastState | null = null

export function PowerAnnouncement() {
  const state = getUiState()
  const now = Date.now()
  toast = stepPowerToast(
    toast,
    state.matchId,
    state.powerActivations,
    ['HOLDING', 'TAKEOVER'].includes(state.phase),
    now
  )
  const active = toast.active
  if (!active) return <UiEntity uiTransform={{ display: 'none' }} />
  const age = (now - toast.startedAt) / POWER_TOAST_MS
  const enter = Math.min(1, age / 0.22)
  const exit = Math.min(1, (1 - age) / 0.25)
  const visibility = Math.max(0, Math.min(enter, exit))
  const card = CARD_DETAILS[active.type]
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const mobile = isMobile()
  const { compact } = hudLayout(canvas?.width ?? 1920, canvas?.height ?? 1080, mobile)
  const layout = powerToastLayout(compact, mobile)
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { right: layout.right + (1 - enter) * 8, top: layout.top },
        width: layout.width,
        height: layout.height,
        opacity: visibility,
        padding: { left: 5, right: 5 },
        flexDirection: 'row',
        alignItems: 'center',
        pointerFilter: 'none',
        zIndex: 65,
        borderWidth: { left: 3 },
        borderColor: UI_COLORS.violet
      }}
      uiBackground={{ color: UI_COLORS.space900 }}
    >
      <UiEntity
        uiTransform={{
          width: compact ? 20 : 26,
          height: compact ? 20 : 26,
          margin: { right: 5 },
          flexShrink: 0,
          pointerFilter: 'none'
        }}
        uiBackground={{
          texture: { src: card.icon, filterMode: 'bi-linear', wrapMode: 'clamp' },
          textureMode: 'stretch'
        }}
      />
      <UiEntity
        uiTransform={{
          flexGrow: 1,
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
          pointerFilter: 'none'
        }}
      >
        <Label
          value={card.name}
          fontSize={compact ? 10 : 12}
          color={UI_COLORS.white}
          textAlign="middle-left"
          uiTransform={{ width: '100%', height: '50%', flexShrink: 0, pointerFilter: 'none' }}
        />
        <Label
          value={active.playerName.slice(0, 18)}
          fontSize={compact ? 9 : 11}
          color={UI_COLORS.cyan}
          textAlign="middle-left"
          uiTransform={{ width: '100%', height: '50%', flexShrink: 0, pointerFilter: 'none' }}
        />
      </UiEntity>
    </UiEntity>
  )
}

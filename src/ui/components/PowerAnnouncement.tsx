import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { CARD_DETAILS } from '../../game/rules/deck'
import { getUiState } from '../state/uiState'
import { UI_COLORS } from '../theme/tokens'

/** Local presentation clock; snapshots never restart an already-seen activation. */
const pending: Array<{ sequence: number; type: keyof typeof CARD_DETAILS; playerName: string }> = []
let lastSequence = 0
let lastMatch = ''
let active: (typeof pending)[number] | null = null
let startedAt = 0

export function PowerAnnouncement() {
  const state = getUiState()
  const now = Date.now()
  if (state.matchId !== lastMatch) {
    lastMatch = state.matchId
    lastSequence = 0
    pending.length = 0
    active = null
  }
  for (const event of state.powerActivations) {
    if (event.sequence <= lastSequence) continue
    pending.push(event)
    lastSequence = event.sequence
  }
  if (!['HOLDING', 'TAKEOVER'].includes(state.phase)) {
    active = null
    pending.length = 0
  }
  if (active && now - startedAt >= 900) active = null
  if (!active && pending.length) {
    active = pending.shift()!
    startedAt = now
  }
  if (!active) return <UiEntity uiTransform={{ display: 'none' }} />
  const age = (now - startedAt) / 900
  const enter = Math.min(1, age / 0.22)
  const exit = Math.min(1, (1 - age) / 0.25)
  const visibility = Math.max(0, Math.min(enter, exit))
  const scale = 0.65 + 0.35 * (1 - Math.pow(1 - visibility, 3))
  const card = CARD_DETAILS[active.type]
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { left: 0, top: 0 },
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        pointerFilter: 'none',
        zIndex: 65
      }}
    >
      <UiEntity
        uiTransform={{
          width: 480 * scale,
          height: 210 * scale,
          opacity: visibility,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerFilter: 'none'
        }}
      >
        <UiEntity
          uiTransform={{ width: 88 * scale, height: 88 * scale, flexShrink: 0, pointerFilter: 'none' }}
          uiBackground={{
            texture: { src: card.icon, filterMode: 'bi-linear', wrapMode: 'clamp' },
            textureMode: 'stretch'
          }}
        />
        <Label
          value={card.name}
          fontSize={34 * scale}
          color={UI_COLORS.white}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: 52 * scale, flexShrink: 0 }}
        />
        <Label
          value={active.playerName}
          fontSize={19 * scale}
          color={UI_COLORS.cyan}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: 32 * scale, flexShrink: 0 }}
        />
      </UiEntity>
    </UiEntity>
  )
}

import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import type { ThreatLevel } from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'
import { SciFiSurface } from './SciFiSurface'

interface DangerMeterProps {
  level: ThreatLevel
  compact?: boolean
}

const LEVEL_SEGMENTS: Record<ThreatLevel, number> = {
  SAFE: 2,
  DANGER: 4,
  CRITICAL: 6
}

const LEVEL_COLOR = {
  SAFE: UI_COLORS.alien,
  DANGER: UI_COLORS.warning,
  CRITICAL: UI_COLORS.danger
} as const

export function DangerMeter({ level, compact = false }: DangerMeterProps) {
  const activeSegments = LEVEL_SEGMENTS[level]
  const activeColor = LEVEL_COLOR[level]

  return (
    <UiEntity
      uiTransform={{
        width: compact ? 184 : 238,
        height: compact ? 70 : 80,
        justifyContent: 'center',
        flexDirection: 'column',
        padding: { left: UI_SPACING.md, right: UI_SPACING.md, top: UI_SPACING.xs, bottom: UI_SPACING.xs }
      }}
    >
      <SciFiSurface tone={activeColor} />
      <UiEntity uiTransform={{ width: '100%', height: 20, flexDirection: 'row', alignItems: 'center' }}>
        <Label
          value="DANGER"
          fontSize={compact ? 10 : UI_TYPE.caption}
          color={UI_COLORS.textMuted}
          textAlign="middle-left"
        />
        <UiEntity uiTransform={{ flexGrow: 1 }} />
        <Label value={level} fontSize={compact ? 10 : UI_TYPE.caption} color={activeColor} textAlign="middle-right" />
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: 12, flexDirection: 'row', margin: { top: UI_SPACING.xs } }}>
        {[0, 1, 2, 3, 4, 5].map((segment) => (
          <UiEntity
            uiTransform={{ flexGrow: 1, height: 10, margin: { left: 2, right: 2 } }}
            uiBackground={{ color: segment < activeSegments ? activeColor : UI_COLORS.space700 }}
          />
        ))}
      </UiEntity>
    </UiEntity>
  )
}

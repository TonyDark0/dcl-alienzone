import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'
import { SciFiSurface } from './SciFiSurface'

interface StatBadgeProps {
  label: string
  value: string
  tone?: 'cyan' | 'alien' | 'danger'
  width?: number
}

const TONE = {
  cyan: UI_COLORS.cyan,
  alien: UI_COLORS.alien,
  danger: UI_COLORS.danger
} as const

export function StatBadge({ label, value, tone = 'cyan', width = 138 }: StatBadgeProps) {
  return (
    <UiEntity
      uiTransform={{
        width,
        height: 68,
        padding: { left: UI_SPACING.md, right: UI_SPACING.md, top: UI_SPACING.sm, bottom: UI_SPACING.sm },
        margin: { left: UI_SPACING.xs, right: UI_SPACING.xs },
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <SciFiSurface tone={TONE[tone]} />
      <Label value={label} fontSize={UI_TYPE.caption} color={UI_COLORS.textMuted} textAlign="middle-left" />
      <Label value={value} fontSize={UI_TYPE.title} color={TONE[tone]} textAlign="middle-left" />
    </UiEntity>
  )
}

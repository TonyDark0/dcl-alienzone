import ReactEcs, { UiEntity, type UiTransformProps } from '@dcl/sdk/react-ecs'

import { UI_COLORS, UI_SPACING } from '../theme/tokens'
import { SciFiSurface } from './SciFiSurface'

export type PanelVariant = 'default' | 'accent' | 'danger' | 'quiet'

interface PanelProps {
  children?: ReactEcs.JSX.ReactNode
  variant?: PanelVariant
  uiTransform?: UiTransformProps
}

const PANEL_COLORS = {
  default: { background: UI_COLORS.space900Glass, border: UI_COLORS.space700 },
  accent: { background: UI_COLORS.space900Glass, border: UI_COLORS.cyan },
  danger: { background: UI_COLORS.space900Glass, border: UI_COLORS.danger },
  quiet: { background: UI_COLORS.space950Glass, border: UI_COLORS.cyanMuted }
} as const

export function Panel({ children, variant = 'default', uiTransform = {} }: PanelProps) {
  const colors = PANEL_COLORS[variant]

  return (
    <UiEntity
      uiTransform={{
        padding: UI_SPACING.md,
        ...uiTransform
      }}
    >
      <SciFiSurface tone={colors.border} quiet={variant === 'quiet'} />
      {children}
    </UiEntity>
  )
}

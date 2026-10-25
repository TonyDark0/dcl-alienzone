import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import type { UiSeatView } from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'

interface SeatChipProps {
  seat: UiSeatView
  compact?: boolean
}

const SEAT_COLORS = [
  UI_COLORS.cyan,
  UI_COLORS.danger,
  UI_COLORS.warning,
  UI_COLORS.alien,
  UI_COLORS.cyan,
  UI_COLORS.danger,
  UI_COLORS.warning,
  UI_COLORS.cyan
] as const

export function SeatChip({ seat, compact = false }: SeatChipProps) {
  const tone = seat.isHolder ? UI_COLORS.danger : seat.isLocal ? UI_COLORS.alien : UI_COLORS.cyanMuted
  const seatColor = SEAT_COLORS[seat.id]

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: compact ? 28 : 34,
        margin: { bottom: 2 },
        padding: { left: compact ? 6 : UI_SPACING.sm, right: compact ? 6 : UI_SPACING.sm },
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: { left: seat.isHolder ? 5 : 2 },
        borderColor: tone
      }}
      uiBackground={{ color: seat.isHolder ? UI_COLORS.dangerMuted : UI_COLORS.space900 }}
    >
      <UiEntity
        uiTransform={{ width: compact ? 10 : 12, height: compact ? 10 : 12, margin: { right: compact ? 6 : 8 } }}
        uiBackground={{ color: seatColor }}
      />
      <Label
        value={`${seat.id + 1}  ${seat.name}${seat.alienCount > 0 ? `  ${seat.alienCount === 2 ? '×2' : '●'}` : ''}`}
        fontSize={compact ? 10 : UI_TYPE.caption}
        color={seat.isBot ? UI_COLORS.textMuted : UI_COLORS.white}
        uiTransform={{ flexGrow: 1 }}
      />
      <Label value={`${seat.heat}`} fontSize={compact ? 11 : UI_TYPE.body} color={tone} textAlign="middle-right" />
    </UiEntity>
  )
}

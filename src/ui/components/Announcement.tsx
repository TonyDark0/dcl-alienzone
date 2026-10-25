import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'

interface AnnouncementProps {
  message: string | null
  compact?: boolean
}

export function Announcement({ message, compact = false }: AnnouncementProps) {
  return (
    <UiEntity
      uiTransform={{
        display: message ? 'flex' : 'none',
        positionType: 'absolute',
        position: { top: compact ? 80 : 98, left: '30%' },
        width: '40%',
        minHeight: compact ? 38 : 48,
        padding: { left: UI_SPACING.lg, right: UI_SPACING.lg, top: UI_SPACING.sm, bottom: UI_SPACING.sm },
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: { top: 2, bottom: 2 },
        borderColor: UI_COLORS.alien,
        zIndex: 10
      }}
      uiBackground={{ color: UI_COLORS.space950 }}
    >
      <Label
        value={message ?? ''}
        fontSize={compact ? UI_TYPE.caption : UI_TYPE.body}
        color={UI_COLORS.alien}
        textAlign="middle-center"
      />
    </UiEntity>
  )
}

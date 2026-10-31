import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { UI_COLORS } from '../theme/tokens'
import { ActionButton } from './ActionButton'

/** Scene-owned pagination replaces unstyleable Explorer scrollbars. The rail is a page indicator, not a fake scroll thumb. */
export function PageNavigation({
  id,
  page,
  count,
  onPage
}: {
  id: string
  page: number
  count: number
  onPage: (page: number) => void
}) {
  if (count <= 1) return <UiEntity uiTransform={{ display: 'none' }} />
  return (
    <UiEntity uiTransform={{ width: '100%', height: 54, flexShrink: 0, flexDirection: 'column' }}>
      <UiEntity
        uiTransform={{ width: '100%', height: 3, flexDirection: 'row', margin: { bottom: 5 }, pointerFilter: 'none' }}
      >
        {Array.from({ length: count }, (_, index) => (
          <UiEntity
            uiTransform={{ flexGrow: 1, height: 3, margin: { left: 2, right: 2 }, pointerFilter: 'none' }}
            uiBackground={{ color: index === page ? UI_COLORS.cyan : UI_COLORS.space700 }}
          />
        ))}
      </UiEntity>
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 44,
          flexShrink: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <ActionButton
          label="← PREV"
          tone="secondary"
          width={108}
          height={44}
          fontSize={13}
          disabled={page <= 0}
          interactionId={`${id}:prev`}
          onPress={() => {
            if (page > 0) onPage(page - 1)
          }}
        />
        <Label
          value={`${page + 1} / ${count}`}
          color={UI_COLORS.textMuted}
          fontSize={13}
          uiTransform={{ flexGrow: 1, height: 44 }}
        />
        <ActionButton
          label="NEXT →"
          tone="secondary"
          width={108}
          height={44}
          fontSize={13}
          disabled={page >= count - 1}
          interactionId={`${id}:next`}
          onPress={() => {
            if (page < count - 1) onPage(page + 1)
          }}
        />
      </UiEntity>
    </UiEntity>
  )
}

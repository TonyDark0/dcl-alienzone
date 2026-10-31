import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { getUiState } from '../state/uiState'
import { OrderedDeck } from '../components/OrderedDeck'

export function DeckSetupScreen() {
  if (getUiState().phase !== 'DECK_SETUP') return <UiEntity uiTransform={{ display: 'none' }} />
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { left: 0, top: 0 },
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 70
      }}
    >
      <OrderedDeck compact={isMobile()} setup />
    </UiEntity>
  )
}

import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

import { getUiState } from '../state/uiState'

export function TakeoverFeedback() {
  const state = getUiState()
  const visible =
    state.phase === 'TAKEOVER' && state.localSeatId !== null && state.takeoverVictimSeatId === state.localSeatId
  const pulse = visible ? 0.5 + Math.sin(Date.now() * 0.013) * 0.5 : 0

  return (
    <UiEntity
      uiTransform={{
        display: visible ? 'flex' : 'none',
        positionType: 'absolute',
        position: { top: 0, right: 0, bottom: 0, left: 0 },
        width: '100%',
        height: '100%',
        pointerFilter: 'none',
        zIndex: 95
      }}
      uiBackground={{ color: Color4.create(1, 0.02, 0.06, 0.07 + pulse * 0.12) }}
    />
  )
}

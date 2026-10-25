import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import ReactEcs, { ScreenInsetArea, UiEntity } from '@dcl/sdk/react-ecs'

import { UI_CONFIG } from '../config/uiConfig'
import { TakeoverFeedback } from './components/TakeoverFeedback'
import { PowerAnnouncement } from './components/PowerAnnouncement'
import { UiLabControls } from './debug/UiLabControls'
import { LobbyScreen } from './screens/LobbyScreen'
import { MatchHud } from './screens/MatchHud'
import { ResultsScreen } from './screens/ResultsScreen'
import { getUiState } from './state/uiState'
import { UI_COLORS } from './theme/tokens'

export function AlienzoneUiRoot() {
  const phase = getUiState().phase
  const lobbyBackdrop = phase === 'BOOT' || phase === 'LOBBY' || phase === 'COUNTDOWN'
  const resultBackdrop = phase === 'MATCH_RESULT'
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const canvasAspect = Math.max(1, canvas?.width ?? 1920) / Math.max(1, canvas?.height ?? 1080)
  const imageAspect = 16 / 9
  const resultImageWidth = (
    canvasAspect < imageAspect ? `${(imageAspect / canvasAspect) * 100}%` : '100%'
  ) as `${number}%`
  const resultImageHeight = (
    canvasAspect > imageAspect ? `${(canvasAspect / imageAspect) * 100}%` : '100%'
  ) as `${number}%`

  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%' }}>
      <UiEntity
        uiTransform={{
          display: lobbyBackdrop ? 'flex' : 'none',
          positionType: 'absolute',
          position: { top: 0, right: 0, bottom: 0, left: 0 },
          width: '100%',
          height: '100%',
          pointerFilter: 'none'
        }}
        uiBackground={{ color: UI_COLORS.lobbyBackdrop }}
      />
      <UiEntity
        uiTransform={{
          display: resultBackdrop ? 'flex' : 'none',
          positionType: 'absolute',
          position: { top: 0, right: 0, bottom: 0, left: 0 },
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          pointerFilter: 'none'
        }}
        uiBackground={{ color: UI_COLORS.lobbyBackdrop }}
      >
        <UiEntity
          uiTransform={{ width: resultImageWidth, height: resultImageHeight, flexShrink: 0 }}
          uiBackground={{
            texture: { src: 'assets/Images/ui/BG_end_match.png', wrapMode: 'clamp', filterMode: 'bi-linear' },
            textureMode: 'stretch'
          }}
        />
      </UiEntity>
      <ScreenInsetArea>
        <LobbyScreen />
        <MatchHud />
        <PowerAnnouncement />
        {UI_CONFIG.showUiLabOnBoot ? <UiLabControls /> : null}
        <ResultsScreen />
      </ScreenInsetArea>
      <TakeoverFeedback />
    </UiEntity>
  )
}

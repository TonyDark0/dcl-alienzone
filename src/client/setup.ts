import { engine } from '@dcl/sdk/ecs'

import { setupAnimationBlendSystem } from '../presentation/animationBlend'
import { setMusicCueForPhase, setupAudioDirector } from '../presentation/audioDirector'
import { setupUi } from '../ui'
import { getUiState } from '../ui/state/uiState'
import { setupGameClient } from './gameClient'
import { setupOrbitCamera } from './orbitCamera'
import { setupSceneLifecycle, updateSceneLifecycle } from './sceneLifecycle'

export function setupClient() {
  console.log('[CLIENT] DCL Alienzone mobile-first client initialized')
  setupAnimationBlendSystem()
  setupSceneLifecycle()
  setupOrbitCamera()
  setupAudioDirector()
  setupGameClient()
  setupUi()

  engine.addSystem((deltaSeconds) => {
    const phase = getUiState().phase
    updateSceneLifecycle(phase, deltaSeconds)
    setMusicCueForPhase(phase)
  })
}

import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'

import { UI_CONFIG } from './config/uiConfig'
import { AlienzoneUiRoot } from './ui/uiRoot'

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(AlienzoneUiRoot, {
    virtualWidth: UI_CONFIG.virtualWidth,
    virtualHeight: UI_CONFIG.virtualHeight,
    screenInset: UI_CONFIG.screenInset
  })
}

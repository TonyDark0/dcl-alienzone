import { GAME_CONFIG } from '../../config/gameConfig'

export function applyFreezeExtension(currentFuseSeconds: number): number {
  return Math.min(GAME_CONFIG.fuseHardCapSeconds, currentFuseSeconds + GAME_CONFIG.freezeExtensionSeconds)
}

import { GAME_CONFIG, POINTS_BANDS } from '../../config/gameConfig'

export function heatForSuccessfulPass(
  remainingFuseSeconds: number,
  heldForSeconds: number,
  isManualPass: boolean
): number {
  if (!isManualPass || heldForSeconds < GAME_CONFIG.minimumScoringHoldSeconds) return 0

  const remaining = Math.max(0, remainingFuseSeconds)
  return POINTS_BANDS.find((band) => remaining > band.minRemainingExclusive)?.heat ?? 4
}

export function applyTakeoverPenalty(currentHeat: number): number {
  return Math.max(GAME_CONFIG.minimumHeat, currentHeat - GAME_CONFIG.takeoverPenaltyHeat)
}

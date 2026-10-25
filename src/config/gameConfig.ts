export const GAME_CONFIG = {
  minHumanPlayers: 1,
  maxHumanPlayers: 8,
  seats: 8,
  roomEntryCountdownSeconds: 3,
  crewSeatingSequenceSeconds: 6.2,
  takeoversPerMatch: 3,
  baseFuseSeconds: 28,
  takeoverSequenceSeconds: 5,
  freezeExtensionSeconds: 5,
  fuseHardCapSeconds: 38,
  takeoverPenaltyHeat: 5,
  minimumHeat: 0,
  minimumScoringHoldSeconds: 2,
  botScoringHoldSeconds: 2.25,
  botCriticalPassSeconds: 0.95,
  quickReactionSeconds: 1.5,
  botManualPassDangerSeconds: 10,
  maxBotRiskPassesPerRound: 1
} as const

export const POINTS_BANDS = [
  { minRemainingExclusive: 15, heat: 1 },
  { minRemainingExclusive: 10, heat: 2 },
  { minRemainingExclusive: 5, heat: 3 },
  { minRemainingExclusive: Number.NEGATIVE_INFINITY, heat: 4 }
] as const

import { STARTER_CARDS, type ChaseCardType } from './chaseCards'

/** Data contract only. No client claim endpoint, grants, clock or Storage writes yet. */
export interface ProgressionProfile {
  version: 1
  unlockedCards: ChaseCardType[]
  unlockedSkins: string[]
  lifetimePoints: number
  wins: number
  qualifiedPlayDatesUtc: string[]
  claimedRewardIds: string[]
}
export function createProgressionProfile(): ProgressionProfile {
  return {
    version: 1,
    unlockedCards: [...STARTER_CARDS],
    unlockedSkins: [],
    lifetimePoints: 0,
    wins: 0,
    qualifiedPlayDatesUtc: [],
    claimedRewardIds: []
  }
}
export const PROGRESSION_IMPLEMENTATION_ENABLED = false
export const PROPOSED_MILESTONES = [
  { id: 'FIRST_WIN', condition: 'Win a completed match', reward: 'Card unlock or cosmetic; owner approval pending' },
  {
    id: 'SEVEN_PLAY_DAYS',
    condition: 'Complete a match on 7 qualifying days; streak/reset policy pending',
    reward: 'Rare card unlock; exact card pending'
  },
  {
    id: 'POINTS_MILESTONE',
    condition: 'Reach a lifetime points threshold; value pending',
    reward: 'Rare card unlock; exact card pending'
  },
  {
    id: 'LEADERBOARD_24H',
    condition: 'Hold a defined leaderboard rank for 24 hours; rank/window pending',
    reward: 'Exclusive cosmetic; owner approval pending'
  },
  {
    id: 'MOST_COINS',
    condition: 'Collect the most score coins in a match; reward tracking not implemented',
    reward: 'Owner approval pending'
  },
  {
    id: 'WEEKLY_CHEST',
    condition: 'Seven qualifying play days; claim/calendar policy pending',
    reward: 'Free card; duplicate and reward pool policy pending'
  }
] as const

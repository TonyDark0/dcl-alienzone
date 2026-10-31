import { Storage } from '@dcl/sdk/server'

export interface LeaderboardEntry {
  playerId: string
  displayName: string
  bestHeat: number
  wins: number
}

// Keep legacy danger-band records untouched; running scores are not comparable.
export const LEADERBOARD_KEY = 'alienzone:leaderboard:running:v1'

export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const raw = await Storage.get<string>(LEADERBOARD_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as LeaderboardEntry[]
    return Array.isArray(parsed) ? parsed.slice(0, 100) : []
  } catch {
    console.error('[SERVER] Invalid leaderboard payload in DCL Storage')
    return []
  }
}

export async function saveLeaderboard(entries: LeaderboardEntry[]): Promise<boolean> {
  return Storage.set(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 100)))
}

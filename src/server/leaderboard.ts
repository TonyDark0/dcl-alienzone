import type { SeatId, SeatState } from '../game/model/types'
import type { LeaderboardEntry } from './persistence'

export interface CompletedMatchResult {
  playerId: string
  displayName: string
  heat: number
  won: boolean
}

function compareSeatsForWinner(a: SeatState, b: SeatState): number {
  if (b.heat !== a.heat) return b.heat - a.heat
  if (a.takeovers !== b.takeovers) return a.takeovers - b.takeovers
  return b.successfulPasses - a.successfulPasses
}

export function isSeatWinner(seats: readonly SeatState[], seatId: SeatId): boolean {
  const candidate = seats.find((seat) => seat.id === seatId)
  if (!candidate) return false

  // A perfect tie is a shared win, matching the game tie-break policy.
  return seats.every((seat) => compareSeatsForWinner(seat, candidate) >= 0)
}

function rankingOrder(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.bestHeat !== a.bestHeat) return b.bestHeat - a.bestHeat
  if (b.wins !== a.wins) return b.wins - a.wins
  return a.displayName.localeCompare(b.displayName)
}

export function mergeLeaderboardResult(
  entries: readonly LeaderboardEntry[],
  result: CompletedMatchResult
): LeaderboardEntry[] {
  const matchingEntries = entries.filter((entry) => entry.playerId === result.playerId)
  const existing = matchingEntries[0]
  const entry: LeaderboardEntry = {
    playerId: result.playerId,
    displayName: result.displayName,
    bestHeat: Math.max(existing?.bestHeat ?? 0, result.heat),
    wins: (existing?.wins ?? 0) + (result.won ? 1 : 0)
  }

  return [...entries.filter((candidate) => candidate.playerId !== result.playerId), entry]
    .sort(rankingOrder)
    .slice(0, 100)
}

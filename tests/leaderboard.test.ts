import { describe, expect, it } from 'vitest'

import type { SeatState } from '../src/game/model/types'
import { isSeatWinner, mergeLeaderboardResult } from '../src/server/leaderboard'

function seat(id: SeatState['id'], heat: number, takeovers = 0, successfulPasses = 0): SeatState {
  return { id, playerId: null, isBot: id !== 0, heat, takeovers, successfulPasses }
}

describe('leaderboard persistence helpers', () => {
  it('applies the documented tie-breaks before granting a win', () => {
    const seats = [seat(0, 8, 0, 2), seat(1, 8, 1, 5), seat(2, 8, 0, 1)]

    expect(isSeatWinner(seats, 0)).toBe(true)
    expect(isSeatWinner(seats, 1)).toBe(false)
    expect(isSeatWinner(seats, 2)).toBe(false)
  })

  it('preserves a player best score and accumulates wins', () => {
    const previous = [
      { playerId: 'alpha', displayName: 'Alpha', bestHeat: 9, wins: 1 },
      { playerId: 'beta', displayName: 'Beta', bestHeat: 8, wins: 3 }
    ]

    const updated = mergeLeaderboardResult(previous, {
      playerId: 'alpha',
      displayName: 'Alpha Renamed',
      heat: 7,
      won: true
    })

    expect(updated.find((entry) => entry.playerId === 'alpha')).toEqual({
      playerId: 'alpha',
      displayName: 'Alpha Renamed',
      bestHeat: 9,
      wins: 2
    })
  })
})

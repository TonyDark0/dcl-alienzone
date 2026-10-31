import type { CardType } from '../../game/model/types'
export interface PowerToastEvent {
  sequence: number
  type: CardType
  playerName: string
}
export interface PowerToastState {
  matchId: string
  lastSequence: number
  active: PowerToastEvent | null
  startedAt: number
}
export const POWER_TOAST_MS = 900

export function stepPowerToast(
  previous: PowerToastState | null,
  matchId: string,
  events: readonly PowerToastEvent[],
  playing: boolean,
  now: number
): PowerToastState {
  const state: PowerToastState =
    previous?.matchId === matchId ? { ...previous } : { matchId, lastSequence: 0, active: null, startedAt: 0 }
  const latest = events
    .filter((event) => event.sequence > state.lastSequence)
    .sort((a, b) => b.sequence - a.sequence)[0]
  if (latest) {
    state.lastSequence = latest.sequence
    state.active = latest
    state.startedAt = now
  }
  if (!playing || now - state.startedAt >= POWER_TOAST_MS) state.active = null
  return state
}

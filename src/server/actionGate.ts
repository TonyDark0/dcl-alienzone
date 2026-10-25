import type { SeatId } from '../game/model/types'
import type { ActionResult } from '../game/runtime/matchEngine'

export interface ActionEnvelope {
  clientActionId: string
  matchId: string
  round: number
}

/** Authenticated sender -> owned seat. Retried messages return the first result without applying twice. */
export class ActionGate {
  private results = new Map<string, ActionResult>()

  clear() {
    this.results.clear()
  }

  run(
    sender: string,
    action: ActionEnvelope,
    matchId: string,
    round: number,
    seatId: SeatId | null,
    apply: (seatId: SeatId) => ActionResult
  ): ActionResult {
    if (seatId === null) return { accepted: false, reason: 'You do not have an active seat.' }
    if (action.matchId !== matchId || action.round !== round) {
      return { accepted: false, reason: 'The match or round already changed.' }
    }
    if (!action.clientActionId || action.clientActionId.length > 96) {
      return { accepted: false, reason: 'Invalid action.' }
    }

    const key = `${sender}:${matchId}:${action.clientActionId}`
    const previous = this.results.get(key)
    if (previous) return previous

    const result = apply(seatId)
    this.results.set(key, result)
    if (this.results.size > 2_048) {
      const oldest = this.results.keys().next().value
      if (oldest) this.results.delete(oldest)
    }
    return result
  }
}

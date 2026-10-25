import type { SeatId } from '../../game/model/types'
import type { SeatReactionState } from '../../game/runtime/matchEngine'
import type { UiSeatReaction } from '../state/uiState'

/**
 * Reconciles immediate local feedback with authoritative reactions. The local
 * icon appears on the input frame; later snapshots confirm its lifetime
 * without replaying or briefly hiding the same reaction.
 */
export function mergeSeatReactions(
  authoritative: readonly SeatReactionState[],
  serverNow: number,
  localSeatId: SeatId | null,
  previous: readonly UiSeatReaction[],
  clientNowMs: number
): UiSeatReaction[] {
  const merged: UiSeatReaction[] = authoritative
    .filter((reaction) => reaction.until > serverNow)
    .map((reaction) => {
      const prior = previous.find((candidate) => candidate.seatId === reaction.seatId)
      const preserveLocalPresentation = reaction.seatId === localSeatId && prior?.value === reaction.value
      return {
        ...reaction,
        presentationId: preserveLocalPresentation ? prior.presentationId : reaction.until
      }
    })

  const optimistic = previous.find(
    (reaction) =>
      reaction.seatId === localSeatId &&
      reaction.optimisticUntilMs !== undefined &&
      reaction.optimisticUntilMs > clientNowMs
  )
  if (!optimistic) return merged

  const acknowledgedIndex = merged.findIndex(
    (reaction) => reaction.seatId === optimistic.seatId && reaction.value === optimistic.value
  )
  if (acknowledgedIndex >= 0) {
    merged[acknowledgedIndex] = {
      ...merged[acknowledgedIndex],
      presentationId: optimistic.presentationId,
      optimisticUntilMs: optimistic.optimisticUntilMs
    }
    return merged
  }

  const staleIndex = merged.findIndex((reaction) => reaction.seatId === optimistic.seatId)
  if (staleIndex >= 0) merged.splice(staleIndex, 1)
  merged.push(optimistic)
  return merged
}

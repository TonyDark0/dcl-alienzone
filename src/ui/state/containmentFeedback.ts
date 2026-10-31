import type { ContainmentChallenge } from '../../game/rules/containment'

export interface TapFeedback {
  challengeId: string
  targetIndex: number
  status: 'PENDING' | 'HIT' | 'MISS'
  atMs: number
}
export const TAP_FEEDBACK_MS = 450

/** An input flash is immediate, but green HIT requires authoritative confirmation. */
export function reconcileTapFeedback(
  feedback: TapFeedback | null,
  challenge: ContainmentChallenge | null,
  nowMs: number
): TapFeedback | null {
  if (!feedback || !challenge || feedback.challengeId !== challenge.id) return null
  if (challenge.hits[feedback.targetIndex] && feedback.status !== 'HIT')
    return { ...feedback, status: 'HIT', atMs: nowMs }
  return feedback
}

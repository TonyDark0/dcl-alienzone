import type { AlienId, CardType, SeatId } from '../model/types'

export const CHAOS_SUCCESS_SECONDS = 3

export interface ChaosFollowup {
  alienId: AlienId
  turn: number
  round: number
  activatedAt: number
}

/** The existing +1 transfer is the success point, never a third award. */
export function isChaosSuccess(
  followup: ChaosFollowup | undefined,
  alien: { id: AlienId; turn: number },
  round: number,
  now: number
): boolean {
  if (!followup) return false
  const elapsed = now - followup.activatedAt
  return (
    followup.round === round &&
    followup.alienId === alien.id &&
    followup.turn === alien.turn &&
    elapsed >= 0 &&
    elapsed <= CHAOS_SUCCESS_SECONDS + 1e-9
  )
}

/** Only an accepted foreign activation during an active, unclaimed vaccine can qualify. */
export function isVacuneSuccess(
  owner: { seatId: SeatId; vaccinatedUntil?: number },
  caster: SeatId,
  power: CardType,
  now: number,
  pending: boolean
): boolean {
  return (
    pending &&
    owner.seatId !== caster &&
    (owner.vaccinatedUntil ?? 0) > now &&
    (power === 'FREEZE' || power === 'DUPLICATE')
  )
}

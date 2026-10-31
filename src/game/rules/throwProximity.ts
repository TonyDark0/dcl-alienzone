import type { SeatId } from '../model/types'
import { CHASE_CONFIG } from './chase'

type Target = { seatId: SeatId; x: number; z: number }
export interface RecentThrowTarget {
  seatId: SeatId
  until: number
  turn: number
}
const distance = (source: { x: number; z: number }, target: Target) =>
  Math.hypot(target.x - source.x, target.z - source.z)

/** Input-latency forgiveness is bounded and based only on server-observed range. */
export function nearbyThrowTarget(
  source: { x: number; z: number },
  eligible: readonly Target[],
  recent: RecentThrowTarget | undefined,
  now: number,
  turn: number
): Target | undefined {
  const nearest = eligible
    .filter((target) => distance(source, target) <= CHASE_CONFIG.throwRadius)
    .sort((a, b) => distance(source, a) - distance(source, b) || a.seatId - b.seatId)[0]
  const previous =
    recent && recent.turn === turn && recent.until >= now
      ? eligible.find(
          (target) =>
            target.seatId === recent.seatId &&
            distance(source, target) <= CHASE_CONFIG.throwRadius + CHASE_CONFIG.throwEdgeTolerance
        )
      : undefined
  if (
    previous &&
    (!nearest || distance(source, previous) <= distance(source, nearest) + CHASE_CONFIG.throwTargetStickiness)
  )
    return previous
  return nearest
}

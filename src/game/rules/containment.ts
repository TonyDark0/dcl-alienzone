import type { SeatId } from '../model/types'
import { nextRandom } from './deck'

export const CONTAINMENT_CONFIG = {
  targets: 5,
  leadInSeconds: 0.4,
  targetSeconds: 0.72,
  networkGraceSeconds: 0.25,
  bonusPoints: 1
} as const

export interface ContainmentChallenge {
  id: string
  victimSeatId: SeatId
  round: number
  startedAt: number
  slots: number[]
  hits: boolean[]
  resolved: boolean
  bonusAwarded: boolean
  contained: boolean
}

/** Separate RNG stream: the new challenge must not change hands, routes or bot decisions. */
export function createContainmentChallenge(
  matchId: string,
  seed: number,
  round: number,
  victimSeatId: SeatId,
  startedAt: number
): ContainmentChallenge {
  let random = (seed ^ Math.imul(round, 104729) ^ Math.imul(victimSeatId + 1, 7919)) >>> 0
  const slots: number[] = []
  for (let index = 0; index < CONTAINMENT_CONFIG.targets; index++) {
    random = nextRandom(random)
    let slot = random % 6
    if (slot === slots[index - 1]) slot = (slot + 1 + ((random >>> 8) % 5)) % 6
    slots.push(slot)
  }
  return {
    id: `${matchId}:containment:${round}`,
    victimSeatId,
    round,
    startedAt,
    slots,
    hits: slots.map(() => false),
    resolved: false,
    bonusAwarded: false,
    contained: false
  }
}

export function containmentTargetOpensAt(challenge: ContainmentChallenge, index: number): number {
  return challenge.startedAt + CONTAINMENT_CONFIG.leadInSeconds + index * CONTAINMENT_CONFIG.targetSeconds
}

export function containmentResolvesAt(challenge: ContainmentChallenge): number {
  return containmentTargetOpensAt(challenge, challenge.slots.length) + CONTAINMENT_CONFIG.networkGraceSeconds
}

export function currentContainmentTarget(challenge: ContainmentChallenge, now: number): number | null {
  if (challenge.resolved || !Number.isFinite(now)) return null
  const elapsed = now - containmentTargetOpensAt(challenge, 0)
  const index = Math.floor(elapsed / CONTAINMENT_CONFIG.targetSeconds)
  return index >= 0 && index < challenge.slots.length ? index : null
}

export function canHitContainmentTarget(challenge: ContainmentChallenge, index: number, now: number): boolean {
  if (
    challenge.resolved ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= challenge.slots.length ||
    challenge.hits[index] ||
    !Number.isFinite(now)
  )
    return false
  const opensAt = containmentTargetOpensAt(challenge, index)
  return (
    now + 1e-8 >= opensAt && now < opensAt + CONTAINMENT_CONFIG.targetSeconds + CONTAINMENT_CONFIG.networkGraceSeconds
  )
}

export function containmentHitCount(challenge: ContainmentChallenge): number {
  return challenge.hits.filter(Boolean).length
}

export function earnsContainmentBonus(challenge: ContainmentChallenge): boolean {
  // The denominator is every issued target, including ignored/expired targets.
  return containmentHitCount(challenge) * 2 > challenge.slots.length
}

export function botContainmentAttempt(seed: number, round: number, seat: SeatId, index: number) {
  const random = nextRandom(
    (seed ^ Math.imul(round + 1, 7919) ^ Math.imul(seat + 1, 104729) ^ Math.imul(index + 1, 997)) >>> 0
  )
  return { hit: random % 10 < 7, delaySeconds: 0.18 + ((random >>> 8) % 200) / 1000 }
}

import type { SeatId } from '../model/types'
import { CHASE_CONFIG } from './chase'
import { createRoundCoins, coinContactTime, type CoinMotion } from './chaseCoins'
import { nextRandom } from './deck'

export interface BoardPower {
  id: string
  type: 'TURBO' | 'DUPLICATE'
  x: number
  z: number
  opensAt: number
}
export interface ShadowDecoy {
  id: string
  owner: SeatId
  x: number
  z: number
  yaw: number
  bornAt: number
  endsAt: number
}
export interface SymbiosisShot {
  id: string
  x: number
  z: number
  toX: number
  toZ: number
  at: number
  endsAt: number
}
export function echoRound(seed: number) {
  return 1 + ((nextRandom(seed ^ 0x4543484f) >>> 8) % 3)
}
export function createRoundPowers(
  seed: number,
  round: number,
  players: readonly { x: number; z: number }[],
  now: number
): BoardPower[] {
  const positions = createRoundCoins(seed ^ 0x504f5745, round, players)
  const types: BoardPower['type'][] = round === echoRound(seed) ? ['TURBO', 'DUPLICATE'] : ['TURBO']
  return types.map((type, i) => ({
    ...positions[i],
    id: `power-${round}-${type}`,
    type,
    opensAt: now + 2 + ((nextRandom(seed ^ (round * 781) ^ (i * 349)) >>> 8) % 700) / 100
  }))
}
export function firstPowerCollector(power: BoardPower, motions: readonly CoinMotion[]) {
  return motions
    .map((motion) => ({ seatId: motion.seatId, time: coinContactTime(power, motion) }))
    .filter((hit): hit is { seatId: SeatId; time: number } => hit.time !== null)
    .sort((a, b) => a.time - b.time || a.seatId - b.seatId)[0]?.seatId
}
/** First body intersecting the forward 5m segment. Never bend the shot toward a target. */
export function forwardHit<T extends { x: number; z: number }>(
  source: { x: number; z: number; yaw: number },
  targets: readonly T[]
): T | undefined {
  const dx = Math.sin(source.yaw),
    dz = Math.cos(source.yaw)
  return targets
    .map((target) => {
      const x = target.x - source.x,
        z = target.z - source.z
      const along = x * dx + z * dz
      const perpendicular = Math.abs(x * dz - z * dx)
      const entry = along - Math.sqrt(Math.max(0, 0.4 ** 2 - perpendicular ** 2))
      return { target, along, perpendicular, entry: Math.max(0, entry) }
    })
    .filter((hit) => hit.along >= 0 && hit.entry <= 5 && hit.perpendicular <= 0.4)
    .sort((a, b) => a.entry - b.entry)[0]?.target
}
export function moveShadow(shadow: ShadowDecoy, seed: number, dt: number, now: number) {
  const segment = Math.floor((now - shadow.bornAt) / 0.65)
  const random = nextRandom(seed ^ Math.imul(segment + 1, 104729) ^ Math.imul(shadow.owner + 1, 7919))
  let yaw = (random / 0x100000000) * Math.PI * 2
  let x = shadow.x + Math.sin(yaw) * CHASE_CONFIG.speed * dt
  let z = shadow.z + Math.cos(yaw) * CHASE_CONFIG.speed * dt
  if (x < CHASE_CONFIG.minX || x > CHASE_CONFIG.maxX || z < CHASE_CONFIG.minZ || z > CHASE_CONFIG.maxZ) {
    yaw += Math.PI
    x = shadow.x + Math.sin(yaw) * CHASE_CONFIG.speed * dt
    z = shadow.z + Math.cos(yaw) * CHASE_CONFIG.speed * dt
  }
  shadow.x = Math.max(CHASE_CONFIG.minX, Math.min(CHASE_CONFIG.maxX, x))
  shadow.z = Math.max(CHASE_CONFIG.minZ, Math.min(CHASE_CONFIG.maxZ, z))
  shadow.yaw = yaw
}
export function shadowOpacity(now: number, endsAt: number): number {
  const remaining = endsAt - now
  if (remaining <= 0) return 0
  if (remaining > 1) return 1
  if (remaining <= 0.3) return remaining / 0.3
  return Math.floor(remaining * 10) % 2 ? 1 : 0.2
}

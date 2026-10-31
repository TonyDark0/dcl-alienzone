import type { SeatId } from '../model/types'
import { CHASE_CONFIG } from './chase'

export const COIN_CONFIG = {
  perRound: 10,
  // ~0.24m coin radius at 1.5× + 0.35m astronaut body + 0.06m touch tolerance.
  pickupRadius: 0.24 + 0.35 + 0.06,
  edgeMargin: 1,
  minimumSpacing: 1.5,
  roomClearance: 4
} as const

export interface ChaseCoin {
  id: string
  x: number
  z: number
}

type Point = { x: number; z: number }
export interface CoinMotion {
  seatId: SeatId
  from: Point
  to: Point
}

/** Separate random stream: pickups cannot change cards, starters or containment. */
export function createRoundCoins(seed: number, round: number, players: readonly Point[]): ChaseCoin[] {
  let random = (Math.imul(seed, 1664525) ^ Math.imul(round, 0x9e3779b9) ^ 0x434f494e) >>> 0
  const next = () => {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0
    return random / 0x100000000
  }
  const coins: ChaseCoin[] = []
  const minX = CHASE_CONFIG.minX + COIN_CONFIG.edgeMargin
  const maxX = CHASE_CONFIG.maxX - COIN_CONFIG.edgeMargin
  const minZ = CHASE_CONFIG.minZ + COIN_CONFIG.edgeMargin
  const maxZ = CHASE_CONFIG.maxZ - COIN_CONFIG.edgeMargin
  const clear = (point: Point) =>
    Math.hypot(point.x - 16, point.z - 16) >= COIN_CONFIG.roomClearance &&
    players.every((player) => Math.hypot(point.x - player.x, point.z - player.z) >= 1) &&
    coins.every((coin) => Math.hypot(point.x - coin.x, point.z - coin.z) >= COIN_CONFIG.minimumSpacing)
  const add = (point: Point) => coins.push({ id: `${round}:${coins.length}`, ...point })
  for (let attempt = 0; attempt < 256 && coins.length < COIN_CONFIG.perRound; attempt++) {
    const point = { x: minX + next() * (maxX - minX), z: minZ + next() * (maxZ - minZ) }
    if (clear(point)) add(point)
  }
  // Finite fallback rather than an unbounded random retry. Eight player discs
  // cannot occupy this entire grid; spacing and room clearance stay enforced.
  for (let row = 0; row <= 8 && coins.length < COIN_CONFIG.perRound; row++)
    for (let column = 0; column <= 17 && coins.length < COIN_CONFIG.perRound; column++) {
      const point = { x: minX + (column * (maxX - minX)) / 17, z: minZ + (row * (maxZ - minZ)) / 8 }
      if (clear(point)) add(point)
    }
  return coins
}

/** Fraction of an authoritative simulation step at first contact, including fast crossings. */
export function coinContactTime(coin: Point, motion: CoinMotion): number | null {
  const x = motion.from.x - coin.x,
    z = motion.from.z - coin.z
  const dx = motion.to.x - motion.from.x,
    dz = motion.to.z - motion.from.z
  if (![x, z, dx, dz].every(Number.isFinite)) return null
  const c = x * x + z * z - COIN_CONFIG.pickupRadius ** 2
  if (c <= 0) return 0
  const a = dx * dx + dz * dz
  if (a <= 1e-12) return null
  const b = 2 * (x * dx + z * dz),
    discriminant = b * b - 4 * a * c
  if (discriminant < 0) return null
  const time = (-b - Math.sqrt(discriminant)) / (2 * a)
  return time >= 0 && time <= 1 ? time : null
}

export function resolveCoinContacts(coins: readonly ChaseCoin[], motions: readonly CoinMotion[]) {
  const claims: Array<{ coinId: string; seatId: SeatId }> = []
  const remaining = coins.filter((coin) => {
    let winner: SeatId | undefined,
      first = Infinity
    for (const motion of motions) {
      const time = coinContactTime(coin, motion)
      if (
        time !== null &&
        (time < first - 1e-9 || (Math.abs(time - first) <= 1e-9 && (winner === undefined || motion.seatId < winner)))
      ) {
        winner = motion.seatId
        first = time
      }
    }
    if (winner === undefined) return true
    claims.push({ coinId: coin.id, seatId: winner })
    return false
  })
  return { remaining, claims }
}

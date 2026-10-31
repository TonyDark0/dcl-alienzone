import type { SeatId } from '../model/types'
import type { ChaseCoin } from './chaseCoins'
import type { BoardPower, ShadowDecoy, SymbiosisShot } from './roundPowers'

/** Owner-revised 30m horizontal × 15m deep area, centered on the authored room. */
export const CHASE_CONFIG = {
  minX: 1,
  maxX: 31,
  minZ: 8.5,
  maxZ: 23.5,
  deckSetupSeconds: 5,
  throwRadius: 1.5,
  throwEdgeTolerance: 0.2,
  throwEdgeGraceSeconds: 0.15,
  throwTargetStickiness: 0.15,
  speed: 3.2,
  turnSpeedRadians: 2.4,
  freezeSpeedMultiplier: 0.5,
  turboSpeedMultiplier: 2,
  tagRadius: 0.8,
  contactReleaseRadius: 1.05,
  arrivalGraceSeconds: 1,
  returnProtectionSeconds: 2.5,
  inputTimeoutSeconds: 0.4,
  freezeSeconds: 2,
  immunitySeconds: 3,
  invisibleSeconds: 10,
  hiddenWatchSeconds: 6
} as const

export type LocomotionState = 'IDLE' | 'RUN' | 'RUN_HOLDING' | 'FROZEN' | 'SLOW' | 'TURBO'
export interface ChasePlayer {
  seatId: SeatId
  x: number
  z: number
  yaw: number
  moving: boolean
  frozenUntil: number
  turboUntil: number
  vaccinatedUntil?: number
  immuneUntil: number
  invisibleUntil: number
  touchedThisRound: boolean
  /** Monotonic server-owned discontinuity marker; clients must not interpolate a teleport. */
  teleportRevision?: number
}
export interface ChaseArenaState {
  players: ChasePlayer[]
  coins?: ChaseCoin[]
  powers?: BoardPower[]
  shadows?: ShadowDecoy[]
  shots?: SymbiosisShot[]
  staticAnimationFallback: boolean
  /** Server-accepted held inputs for bounded, presentation-only extrapolation. */
  motion?: ChaseMotion[]
  throwReady?: boolean
  throwTargetSeatId?: SeatId
  returnBlockedUntil?: number
}
export interface ChaseMotion {
  seatId: SeatId
  x: number
  z: number
  until: number
  steering: boolean
  aimYaw?: number
}
export function initialChasePlayer(seatId: SeatId): ChasePlayer {
  const angle = (Math.PI * 2 * seatId) / 8 + Math.PI / 36
  return {
    seatId,
    x: 16 + Math.sin(angle) * 2.0825,
    z: 16 + Math.cos(angle) * 2.0825,
    yaw: angle + Math.PI,
    moving: false,
    frozenUntil: 0,
    turboUntil: 0,
    immuneUntil: 0,
    invisibleUntil: 0,
    touchedThisRound: false
  }
}
export function normalizeMove(x: number, z: number) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null
  const length = Math.hypot(x, z)
  const divisor = Math.max(1, length)
  return { x: x / divisor, z: z / divisor }
}
export function chaseSpeedMultiplier(player: ChasePlayer, now: number): number {
  return (
    (player.frozenUntil > now && (player.vaccinatedUntil ?? 0) <= now ? CHASE_CONFIG.freezeSpeedMultiplier : 1) *
    (player.turboUntil > now ? CHASE_CONFIG.turboSpeedMultiplier : 1)
  )
}
export function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}
export function moveChasePlayer(
  player: ChasePlayer,
  x: number,
  z: number,
  dt: number,
  now: number,
  faceMovement = true
) {
  const input = normalizeMove(x, z)
  if (!input || !Number.isFinite(dt) || dt <= 0) {
    player.moving = false
    return
  }
  const beforeX = player.x,
    beforeZ = player.z
  const speed = CHASE_CONFIG.speed * chaseSpeedMultiplier(player, now)
  player.x = Math.max(CHASE_CONFIG.minX, Math.min(CHASE_CONFIG.maxX, player.x + input.x * speed * dt))
  player.z = Math.max(CHASE_CONFIG.minZ, Math.min(CHASE_CONFIG.maxZ, player.z + input.z * speed * dt))
  player.moving = Math.hypot(player.x - beforeX, player.z - beforeZ) > 0.00001
  if (player.moving && faceMovement) player.yaw = Math.atan2(input.x, input.z)
}
/** A/D steer in place; W/S move along facing, without reversing the astronaut's yaw. */
export function steerChasePlayer(player: ChasePlayer, forward: number, turn: number, dt: number, now: number) {
  if (![forward, turn, dt].every(Number.isFinite) || dt <= 0) {
    player.moving = false
    return
  }
  player.yaw = wrapAngle(player.yaw + Math.max(-1, Math.min(1, turn)) * CHASE_CONFIG.turnSpeedRadians * dt)
  const amount = Math.max(-1, Math.min(1, forward))
  moveChasePlayer(player, Math.sin(player.yaw) * amount, Math.cos(player.yaw) * amount, dt, now, false)
}
export function locomotionFor(player: ChasePlayer, holding: boolean, now: number): LocomotionState {
  if (!player.moving) return 'IDLE'
  if (player.frozenUntil > now) return 'SLOW'
  if (player.turboUntil > now) return 'TURBO'
  return holding ? 'RUN_HOLDING' : 'RUN'
}

/** WASD / joystick heading is an intent, never a client position or speed. */
export function aimChasePlayer(player: ChasePlayer, forward: number, yaw: number, dt: number, now: number) {
  if (![forward, yaw, dt].every(Number.isFinite) || dt <= 0) return
  player.yaw = wrapAngle(yaw)
  const amount = Math.max(0, Math.min(1, forward))
  moveChasePlayer(player, Math.sin(player.yaw) * amount, Math.cos(player.yaw) * amount, dt, now, false)
}

import {
  aimChasePlayer,
  moveChasePlayer,
  steerChasePlayer,
  wrapAngle,
  type ChaseMotion,
  type ChasePlayer
} from '../game/rules/chase'

export type ChasePose = { x: number; z: number; yaw: number; teleportRevision?: number }
export const MAX_MOTION_FORECAST_SECONDS = 0.2

/** Fill the spaces between 10 Hz snapshots, without changing authoritative state.
 * Never continue indefinitely after a lost packet, input expiry or phase change. */
export function projectChasePlayer(
  player: ChasePlayer,
  motion: ChaseMotion | undefined,
  snapshotNow: number,
  age: number
) {
  const projected = { ...player }
  if (!motion || !Number.isFinite(age) || age < 0) return projected
  const end = Math.min(snapshotNow + Math.min(age, MAX_MOTION_FORECAST_SECONDS), motion.until)
  let now = snapshotNow
  while (now < end - 1e-8) {
    // Split at speed-effect boundaries so forecast and animation recover together.
    const boundaries = [end, now + 1 / 60, player.frozenUntil, player.turboUntil].filter((at) => at > now + 1e-8)
    const next = Math.min(...boundaries)
    // Sample inside the interval: floating-point values just below an expiry
    // must not apply the old speed for an entire extra forecast step.
    const effectTime = (now + next) / 2
    if (motion.aimYaw !== undefined) aimChasePlayer(projected, motion.x, motion.aimYaw, next - now, effectTime)
    else if (motion.steering) steerChasePlayer(projected, motion.x, motion.z, next - now, effectTime)
    else moveChasePlayer(projected, motion.x, motion.z, next - now, effectTime)
    now = next
  }
  if (snapshotNow + age >= motion.until || age > MAX_MOTION_FORECAST_SECONDS) projected.moving = false
  return projected
}

/** The numerical pose is owned here, not read back from renderer-delayed Transforms. */
export function smoothChasePose(previous: ChasePose, target: ChasePose, dt: number, snap = false): ChasePose {
  snap ||= (target.teleportRevision ?? 0) !== (previous.teleportRevision ?? 0)
  const elapsed = Math.max(0, Number.isFinite(dt) ? dt : 0)
  const amount = snap ? 1 : 1 - Math.exp(-elapsed * 30)
  // Reach 95% of a new facing in 100ms rather than dragging the suit through a
  // wide-looking U-turn. Translation never follows this visual yaw or gains speed.
  const turnAmount = snap ? 1 : 1 - Math.exp(-elapsed * 30)
  return {
    x: previous.x + (target.x - previous.x) * amount,
    z: previous.z + (target.z - previous.z) * amount,
    yaw: previous.yaw + wrapAngle(target.yaw - previous.yaw) * turnAmount,
    ...(target.teleportRevision === undefined ? {} : { teleportRevision: target.teleportRevision })
  }
}

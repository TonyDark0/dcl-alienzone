import type { SeatId } from '../model/types'
import { CHASE_CONFIG, chaseSpeedMultiplier, type ChasePlayer } from './chase'
import type { ChaseCoin } from './chaseCoins'

export interface BotPlanMemory {
  target?: SeatId
  targetUntil: number
  heading: number
}

function noise(seed: number): number {
  let value = (seed ^ 0x9e3779b9) >>> 0
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad)
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97)
  return ((value ^ (value >>> 15)) >>> 0) / 0x100000000
}

/** An isolated seeded shuffle: AI/card RNG cannot bias the next round starter. */
export function roundStarter(seed: number, roundIndex: number, seats: number): SeatId {
  const order = Array.from({ length: seats }, (_, index) => index as SeatId)
  for (let index = seats - 1; index > 0; index--) {
    const other = Math.floor(noise(seed + index * 7919) * (index + 1))
    ;[order[index], order[other]] = [order[other], order[index]]
  }
  return order[roundIndex % seats]
}

const distance = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z)

function intercept(player: ChasePlayer, now: number) {
  const lead = player.moving ? CHASE_CONFIG.speed * chaseSpeedMultiplier(player, now) * 0.3 : 0
  return {
    x: Math.max(CHASE_CONFIG.minX, Math.min(CHASE_CONFIG.maxX, player.x + Math.sin(player.yaw) * lead)),
    z: Math.max(CHASE_CONFIG.minZ, Math.min(CHASE_CONFIG.maxZ, player.z + Math.cos(player.yaw) * lead))
  }
}

/** Inputs are visible observations only; no hidden positions or private hands. */
export function planChaseBot(
  self: ChasePlayer,
  observations: readonly ChasePlayer[],
  holders: readonly SeatId[],
  now: number,
  seed: number,
  memory?: BotPlanMemory,
  recentRecipient?: SeatId,
  coins: readonly ChaseCoin[] = []
): BotPlanMemory {
  const visible = observations.filter((other) => other.seatId !== self.seatId && other.invisibleUntil <= now)
  const carrying = holders.includes(self.seatId)
  const eligible = visible.filter((other) => !holders.includes(other.seatId) && other.immuneUntil <= now)
  let target =
    carrying && memory && memory.targetUntil > now
      ? eligible.find((other) => other.seatId === memory.target)
      : undefined
  if (carrying && !target) {
    const cost = (other: ChasePlayer) =>
      distance(self, intercept(other, now)) +
      (other.seatId === recentRecipient ? 2 : 0) +
      noise(seed + self.seatId * 101 + other.seatId * 373) * 0.6
    target = [...eligible].sort((a, b) => cost(a) - cost(b) || a.seatId - b.seatId)[0]
  }
  if (target) {
    // Near enough to throw: don't lead past a stationary/turning target.
    const aim = distance(self, target) < 2 ? target : intercept(target, now)
    return {
      target: target.seatId,
      targetUntil: memory?.target === target.seatId && memory.targetUntil > now ? memory.targetUntil : now + 1.25,
      heading: Math.atan2(aim.x - self.x, aim.z - self.z)
    }
  }

  const threats = visible.filter((other) => holders.includes(other.seatId))
  const epoch = Math.floor(now / 4)
  const coin = [...coins].sort((a, b) => distance(self, a) - distance(self, b) || a.id.localeCompare(b.id))[0]
  const waypoint = coin ?? {
    x:
      CHASE_CONFIG.minX +
      2 +
      noise(seed + self.seatId * 887 + epoch * 97) * (CHASE_CONFIG.maxX - CHASE_CONFIG.minX - 4),
    z:
      CHASE_CONFIG.minZ +
      2 +
      noise(seed + self.seatId * 557 + epoch * 193) * (CHASE_CONFIG.maxZ - CHASE_CONFIG.minZ - 4)
  }
  let best = -Infinity,
    heading = memory?.heading ?? self.yaw
  // Score candidate escape steps, rather than driving everybody straight into
  // the same corner. This is open-room steering, not GLB obstacle pathfinding.
  for (let index = 0; index < 16; index++) {
    const yaw = (index * Math.PI) / 8
    const stride = CHASE_CONFIG.speed * chaseSpeedMultiplier(self, now) * 0.7
    const next = { x: self.x + Math.sin(yaw) * stride, z: self.z + Math.cos(yaw) * stride }
    const edge = Math.min(
      next.x - CHASE_CONFIG.minX,
      CHASE_CONFIG.maxX - next.x,
      next.z - CHASE_CONFIG.minZ,
      CHASE_CONFIG.maxZ - next.z
    )
    if (edge < 0.25) continue
    const clearance = threats.length ? Math.min(...threats.map((other) => distance(next, intercept(other, now)))) : 8
    const crowd = visible.reduce((cost, other) => cost + Math.max(0, 1.8 - distance(next, other)), 0)
    const continuity = memory ? Math.cos(yaw - memory.heading) * 0.25 : 0
    const score =
      Math.min(8, clearance) * 2.8 -
      1.4 / Math.max(0.25, edge) -
      crowd * 1.2 -
      distance(next, waypoint) * (coin ? 0.8 : 0.3) +
      continuity
    if (score > best) {
      best = score
      heading = yaw
    }
  }
  return { targetUntil: 0, heading }
}

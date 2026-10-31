import { CHASE_CONFIG } from '../game/rules/chase'

export const FOLLOW_CAMERA_CONFIG = {
  behind: 3.2,
  headHeight: 1.5,
  aboveHead: 1.5,
  targetHeight: 1.1,
  lookAhead: 0.55,
  maxYawOffset: Math.PI / 6,
  maxHeightOffset: 0.5,
  sensitivity: 0.003
} as const

/** Same 60-degree world pose for everyone; fit the arena through the lens, not camera motion. */
export function globalDronePose(aspect = 16 / 9) {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9
  const angle = Math.PI / 3
  const target = {
    x: (CHASE_CONFIG.minX + CHASE_CONFIG.maxX) / 2,
    y: 0,
    z: (CHASE_CONFIG.minZ + CHASE_CONFIG.maxZ) / 2
  }
  const height = 20 * 0.85
  const position = { x: target.x, y: height, z: target.z - height / Math.tan(angle) }
  let lens = Math.tan((40 * Math.PI) / 360)
  // Include head/name height and leave clear margins for the HUD. A very narrow
  // portrait screen necessarily uses a wider lens than a landscape phone.
  for (const x of [CHASE_CONFIG.minX, CHASE_CONFIG.maxX])
    for (const z of [CHASE_CONFIG.minZ, CHASE_CONFIG.maxZ])
      for (const y of [0, 2.4]) {
        const dy = y - position.y,
          dz = z - position.z
        const depth = -dy * Math.sin(angle) + dz * Math.cos(angle)
        const up = dy * Math.cos(angle) + dz * Math.sin(angle)
        lens = Math.max(lens, Math.abs(x - position.x) / (depth * safeAspect * 0.88), Math.abs(up) / (depth * 0.78))
      }
  return {
    position,
    target,
    fov: Math.min(170, (2 * Math.atan(lens) * 180) / Math.PI)
  }
}

/** Track the displayed astronaut, not its facing: WASD stays screen-relative.
 * Keep the old lens so moving 10% closer is a real zoom, not cancelled by fitting
 * the whole arena again. The far edge can now leave the player's view. */
export function trackedDronePose(player: { x: number; z: number }, aspect = 16 / 9) {
  const reference = globalDronePose(aspect)
  const height = reference.position.y * 0.9
  const target = { x: player.x, y: 0.9, z: player.z }
  return {
    position: {
      x: target.x,
      y: target.y + height,
      // Virtual cameras outside the approved parcels are disabled by Explorer.
      // Near the south edge, adjust pitch slightly, never move the aim off the player.
      z: Math.max(0.25, target.z - height / Math.tan(Math.PI / 3))
    },
    target,
    fov: reference.fov
  }
}

export function limitedCameraLook(yaw: number, height: number, dx: number, dy: number) {
  const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))
  return {
    yaw: clamp(
      yaw + clamp(Number.isFinite(dx) ? dx : 0, 100) * FOLLOW_CAMERA_CONFIG.sensitivity,
      FOLLOW_CAMERA_CONFIG.maxYawOffset
    ),
    height: clamp(height - clamp(Number.isFinite(dy) ? dy : 0, 100) * 0.004, FOLLOW_CAMERA_CONFIG.maxHeightOffset)
  }
}
export function followCameraPose(player: { x: number; z: number; yaw: number }, yawOffset = 0, heightOffset = 0) {
  const config = FOLLOW_CAMERA_CONFIG
  const yaw = player.yaw + Math.max(-config.maxYawOffset, Math.min(config.maxYawOffset, yawOffset))
  return {
    position: {
      x: player.x - Math.sin(yaw) * config.behind,
      y:
        config.headHeight +
        config.aboveHead +
        Math.max(-config.maxHeightOffset, Math.min(config.maxHeightOffset, heightOffset)),
      z: player.z - Math.cos(yaw) * config.behind
    },
    target: {
      x: player.x + Math.sin(player.yaw) * config.lookAhead,
      y: config.targetHeight,
      z: player.z + Math.cos(player.yaw) * config.lookAhead
    }
  }
}

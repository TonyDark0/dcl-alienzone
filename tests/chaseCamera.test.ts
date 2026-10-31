import { describe, expect, it } from 'vitest'
import { followCameraPose, limitedCameraLook, FOLLOW_CAMERA_CONFIG } from '../src/presentation/chaseCameraMath'

describe('drone third-person camera', () => {
  it('stays behind each heading and 1.5m above the nominal head', () => {
    for (let i = 0; i < 8; i++) {
      const p = { x: 16, z: 16, yaw: (i * Math.PI) / 4 },
        pose = followCameraPose(p)
      expect((pose.position.x - p.x) * Math.sin(p.yaw) + (pose.position.z - p.z) * Math.cos(p.yaw)).toBeCloseTo(
        -FOLLOW_CAMERA_CONFIG.behind
      )
      expect(pose.position.y - FOLLOW_CAMERA_CONFIG.headHeight).toBe(1.5)
    }
  })
  it('tracks a moving player without changing camera distance', () => {
    const a = followCameraPose({ x: 16, z: 16, yaw: 0 }),
      b = followCameraPose({ x: 18, z: 19, yaw: 0 })
    expect(b.position.x - a.position.x).toBe(2)
    expect(b.target.z - a.target.z).toBe(3)
  })
  it('limits mouse look to 30 degrees and 1-2m above the head', () => {
    let look = { yaw: 0, height: 0 }
    for (let i = 0; i < 30; i++) look = limitedCameraLook(look.yaw, look.height, 10000, -10000)
    expect(look.yaw).toBeCloseTo(Math.PI / 6)
    expect(look.height).toBe(0.5)
    const pose = followCameraPose({ x: 16, z: 16, yaw: 0 }, look.yaw, look.height)
    expect(pose.position.y).toBe(3.5)
    expect(limitedCameraLook(0, 0, NaN, Infinity)).toEqual({ yaw: 0, height: 0 })
  })
})

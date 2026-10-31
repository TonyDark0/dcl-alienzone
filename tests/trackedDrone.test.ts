import { describe, expect, it } from 'vitest'
import { CHASE_CONFIG } from '../src/game/rules/chase'
import { globalDronePose, trackedDronePose } from '../src/presentation/chaseCameraMath'

describe('player-centered drone framing', () => {
  it('is 10% closer without widening the lens to cancel the zoom', () => {
    const old = globalDronePose(),
      next = trackedDronePose({ x: 16, z: 16 })
    const distance = (pose: typeof old) =>
      Math.hypot(pose.position.x - pose.target.x, pose.position.y - pose.target.y, pose.position.z - pose.target.z)
    expect(distance(next) / distance(old)).toBeCloseTo(0.9)
    expect(next.fov).toBe(old.fov)
    expect(next.target).toEqual({ x: 16, y: 0.9, z: 16 })
    expect(Math.atan2(next.position.y - next.target.y, next.target.z - next.position.z)).toBeCloseTo(Math.PI / 3)
  })
  it.each([9 / 16, 16 / 9, 4 / 3, 21 / 9])(
    'keeps the astronaut centered and the camera inside parcels at aspect %f',
    (aspect) => {
      for (const x of [CHASE_CONFIG.minX, 16, CHASE_CONFIG.maxX]) {
        for (const z of [CHASE_CONFIG.minZ, 16, CHASE_CONFIG.maxZ]) {
          const pose = trackedDronePose({ x, z }, aspect)
          expect(pose.target).toEqual({ x, y: 0.9, z })
          expect(pose.position.x).toBe(x)
          expect(pose.position.x).toBeGreaterThan(0)
          expect(pose.position.x).toBeLessThan(48)
          expect(pose.position.z).toBeGreaterThan(0)
          expect(pose.position.z).toBeLessThan(32)
          expect(pose.fov).toBe(globalDronePose(aspect).fov)
          expect(Number.isFinite(pose.fov)).toBe(true)
        }
      }
    }
  )
})

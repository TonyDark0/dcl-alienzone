import { describe, expect, it } from 'vitest'
import {
  CHASE_CONFIG,
  aimChasePlayer,
  initialChasePlayer,
  steerChasePlayer,
  type ChaseMotion
} from '../src/game/rules/chase'
import { projectChasePlayer, smoothChasePose } from '../src/presentation/chaseMotion'
import { followCameraPose } from '../src/presentation/chaseCameraMath'

function player() {
  return { ...initialChasePlayer(0), x: 16, z: 12, yaw: 0 }
}
const motion: ChaseMotion = { seatId: 0, x: 1, z: 0, until: 10, steering: true }

describe('continuous snapshot presentation', () => {
  it('reverses along the same line without steering through a U or changing speed', () => {
    for (const fps of [30, 60, 120]) {
      const runner = player()
      aimChasePlayer(runner, 1, 0, 0.1, 0)
      const startZ = runner.z
      let pose = { x: runner.x, z: runner.z, yaw: 0 }
      for (let frame = 0; frame < fps / 10; frame++) {
        aimChasePlayer(runner, 1, Math.PI, 1 / fps, 0.1 + frame / fps)
        const next = smoothChasePose(pose, runner, 1 / fps)
        expect(next.x).toBeCloseTo(16)
        expect(next.z).toBeLessThan(pose.z)
        pose = next
      }
      expect(startZ - runner.z).toBeCloseTo(CHASE_CONFIG.speed * 0.1)
      expect(Math.abs(pose.yaw)).toBeGreaterThan(Math.PI * 0.95)
    }
  })
  it('fills a snapshot gap at the normal speed without mutating server state', () => {
    const p = player(),
      before = { ...p }
    const projected = projectChasePlayer(p, motion, 0, 0.1)
    expect(projected.z - p.z).toBeCloseTo(3.2 * 0.1)
    expect(projected.moving).toBe(true)
    expect(p).toEqual(before)
  })
  it('does not visibly brake every 100ms at 30, 60 or 120 fps', () => {
    for (const fps of [30, 60, 120]) {
      let snapshot = player(),
        pose = { x: snapshot.x, z: snapshot.z, yaw: 0 },
        snapshotNow = 0
      const speeds: number[] = []
      for (let frame = 1; frame <= fps; frame++) {
        const now = frame / fps
        if (frame % (fps / 10) === 0) {
          snapshot = { ...player(), z: 12 + CHASE_CONFIG.speed * now }
          snapshotNow = now
        }
        const projected = projectChasePlayer(snapshot, motion, snapshotNow, now - snapshotNow)
        const next = smoothChasePose(pose, projected, 1 / fps)
        if (frame > fps / 2) speeds.push((next.z - pose.z) * fps)
        pose = next
      }
      expect(Math.min(...speeds)).toBeGreaterThan(3.19)
      expect(Math.max(...speeds)).toBeLessThan(3.21)
    }
  })
  it('projects accepted turning with the same movement rule', () => {
    const input = { ...motion, z: 1 },
      expected = player()
    for (let i = 0; i < 6; i++) steerChasePlayer(expected, 1, 1, 1 / 60, i / 60)
    const actual = projectChasePlayer(player(), input, 0, 0.1)
    expect(actual.x).toBeCloseTo(expected.x)
    expect(actual.z).toBeCloseTo(expected.z)
    expect(actual.yaw).toBeCloseTo(expected.yaw)
  })
  it('stops extrapolating on input expiry and caps lost-packet travel', () => {
    expect(projectChasePlayer(player(), { ...motion, until: 0.05 }, 0, 0.15)).toMatchObject({ moving: false })
    expect(projectChasePlayer(player(), { ...motion, until: 0.05 }, 0, 0.15).z).toBeCloseTo(12 + 3.2 * 0.05)
    const lost = projectChasePlayer(player(), motion, 0, 2)
    expect(lost.z).toBeCloseTo(12 + 3.2 * 0.2)
    expect(lost.moving).toBe(false)
    expect(projectChasePlayer(player(), undefined, 0, 0.1)).toEqual(player())
  })
  it('obeys bounds, stationary input and effect expiration without a speed boost', () => {
    const p = player()
    p.frozenUntil = 0.05
    p.turboUntil = 0.1
    const projected = projectChasePlayer(p, motion, 0, 0.15)
    expect(projected.z - p.z).toBeCloseTo(3.2 * (0.05 + 0.05 * 2 + 0.05))
    expect(projectChasePlayer(p, { ...motion, x: 0 }, 0, 0.1).moving).toBe(false)
    expect(projectChasePlayer({ ...p, z: CHASE_CONFIG.maxZ - 0.1 }, motion, 0, 0.2).z).toBe(CHASE_CONFIG.maxZ)
  })
  it('uses the shortest turn across ±pi and keeps camera and body on one pose', () => {
    let pose = { x: 16, z: 16, yaw: Math.PI - 0.1 }
    const target = { x: 17, z: 18, yaw: -Math.PI + 0.2 }
    for (let frame = 0; frame < 30; frame++) {
      const next = smoothChasePose(pose, target, 1 / 60)
      expect(next.yaw).toBeGreaterThanOrEqual(pose.yaw)
      expect(next.yaw - pose.yaw).toBeLessThan(0.13)
      const camera = followCameraPose(next)
      expect(Math.hypot(camera.position.x - next.x, camera.position.z - next.z)).toBeCloseTo(3.2)
      pose = next
    }
    expect(smoothChasePose(pose, target, 0.01, true).x).toBe(17)
  })
})

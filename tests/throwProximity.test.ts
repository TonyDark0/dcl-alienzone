import { describe, expect, it } from 'vitest'
import { nearbyThrowTarget } from '../src/game/rules/throwProximity'
import { ChaseMatchEngine } from '../src/game/runtime/chaseMatchEngine'
import { GAME_CONFIG } from '../src/config/gameConfig'
import { CHASE_CONFIG } from '../src/game/rules/chase'
import { smoothChasePose } from '../src/presentation/chaseMotion'

describe('bounded throw contact forgiveness', () => {
  const source = { x: 16, z: 16 },
    recent = { seatId: 1 as const, until: 10.15, turn: 3 }
  it('requires real core contact before permitting the short edge window', () => {
    const target = { seatId: 1 as const, x: 17.6, z: 16 }
    expect(nearbyThrowTarget(source, [target], undefined, 10, 3)).toBeUndefined()
    expect(nearbyThrowTarget(source, [target], recent, 10.1, 3)).toBe(target)
    expect(nearbyThrowTarget(source, [target], recent, 10.16, 3)).toBeUndefined()
    expect(nearbyThrowTarget(source, [{ ...target, x: 17.71 }], recent, 10.1, 3)).toBeUndefined()
    expect(nearbyThrowTarget(source, [target], recent, 10.1, 4)).toBeUndefined()
    expect(nearbyThrowTarget(source, [], recent, 10.1, 3)).toBeUndefined()
  })
  it('stabilizes nearly tied targets, but never ignores a substantially closer one', () => {
    const a = { seatId: 1 as const, x: 17.45, z: 16 },
      b = { seatId: 2 as const, x: 17.4, z: 16 }
    expect(nearbyThrowTarget(source, [b, a], recent, 10, 3)).toBe(a)
    b.x = 17
    expect(nearbyThrowTarget(source, [a, b], recent, 10, 3)).toBe(b)
  })
  it('uses the same UI/server target, expires without extension and rechecks immunity/ownership', () => {
    const g = new ChaseMatchEngine(41)
    g.join('human', 'PLAYER')
    g.ready()
    g.advance(
      GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds + CHASE_CONFIG.deckSetupSeconds
    )
    for (const seat of g.state.seats) seat.isBot = false
    const players = g.state.arena!.players,
      alien = g.state.aliens[0]
    for (const p of players) {
      p.x = 2
      p.z = 10
    }
    players[0].x = players[0].z = 16
    players[1].x = 17.45
    players[1].z = 16
    alien.holderSeatId = 0
    alien.readyAt = g.state.now
    alien.turn = 3
    g.advance(0.05)
    expect(g.snapshot(0).arena).toMatchObject({ throwReady: true, throwTargetSeatId: 1 })
    players[1].x = 17.6
    g.advance(0.1)
    expect(g.snapshot(0).arena!.throwReady).toBe(true)
    players[1].immuneUntil = g.state.now + 1
    expect(g.pass(0, 'ORIGINAL', 3).accepted).toBe(false)
    players[1].immuneUntil = 0
    players[1].invisibleUntil = g.state.now + 1
    expect(g.snapshot(0).arena!.throwTargetSeatId).toBeUndefined()
    expect(g.snapshot(0).arena!.throwReady).toBe(true)
    g.advance(0.1)
    expect(g.snapshot(0).arena!.throwReady).toBe(false)
    expect(g.pass(0, 'ORIGINAL', 3).accepted).toBe(false)
    players[1].x = 17.4
    g.advance(0.05)
    players[1].x = 17.6
    expect(g.pass(0, 'ORIGINAL', 3).accepted).toBe(true)
    expect(g.pass(0, 'ORIGINAL', 3).accepted).toBe(false)
    expect(g.pass(1, 'ORIGINAL', 4).accepted).toBe(false)
  })
})

describe('frame-independent suit turning', () => {
  it('quickly eases hard corners without adding movement delay or snapping across angle wrap', () => {
    const before = { x: 16, z: 16, yaw: 0 },
      target = { x: 16.3, z: 16, yaw: Math.PI / 2 }
    const next = smoothChasePose(before, target, 1 / 60)
    expect(next.yaw).toBeGreaterThan(0)
    expect(next.yaw).toBeLessThan(0.65)
    expect(next.x - before.x).toBeCloseTo(0.3 * (1 - Math.exp(-30 / 60)))
    for (const fps of [30, 60, 120]) {
      let pose = before
      for (let frame = 0; frame < fps / 2; frame++) pose = smoothChasePose(pose, target, 1 / fps)
      expect(pose.yaw).toBeCloseTo((Math.PI / 2) * (1 - Math.exp(-15)), 8)
      expect(pose.x).toBeCloseTo(target.x, 5)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { ChaseMatchEngine } from '../src/game/runtime/chaseMatchEngine'
import { CHASE_CONFIG } from '../src/game/rules/chase'
import { queuedCards } from '../src/game/rules/chaseCards'
import { GAME_CONFIG } from '../src/config/gameConfig'
import { cursorAimYaw } from '../src/client/cursorAim'
import { globalDronePose } from '../src/presentation/chaseCameraMath'

function setup() {
  const game = new ChaseMatchEngine(87)
  game.join('human', 'PLAYER')
  game.ready()
  game.advance(GAME_CONFIG.roomEntryCountdownSeconds + GAME_CONFIG.crewSeatingSequenceSeconds)
  return game
}
function running() {
  const game = setup()
  game.advance(5)
  for (const seat of game.state.seats) seat.isBot = false
  for (const player of game.state.arena!.players) {
    player.x = 23.5
    player.z = 23.5
  }
  const alien = game.state.aliens[0]
  alien.holderSeatId = 0
  alien.readyAt = game.state.now
  game.state.arena!.players[0].x = 16
  game.state.arena!.players[0].z = 16
  game.state.arena!.players[1].x = 17.4
  game.state.arena!.players[1].z = 16
  return game
}
describe('single ordered deck', () => {
  it('offers exactly five setup seconds without a live alien, input or activation', () => {
    const g = setup()
    expect(g.state.phase).toBe('DECK_SETUP')
    expect(g.snapshot(0).countdownRemainingSeconds).toBeCloseTo(5)
    expect(g.state.aliens).toHaveLength(0)
    expect(g.state.round).toBe(0)
    const queue = queuedCards(g.state.seats[0].hand),
      reversed = queue.map((c) => c.id).reverse()
    expect(queue).toHaveLength(3)
    expect(g.orderDeck(0, reversed).accepted).toBe(true)
    expect(g.activate(0, reversed[0], 'ORIGINAL').accepted).toBe(false)
    expect(g.aimInput(0, 1, 0, 1).accepted).toBe(false)
    g.advance(4.99)
    expect(g.state.phase).toBe('DECK_SETUP')
    g.advance(0.02)
    expect(g.state.phase).toBe('HOLDING')
    expect(queuedCards(g.state.seats[0].hand).map((c) => c.id)).toEqual(reversed)
    expect(g.state.fuseEndsAt - g.state.roundStartedAt).toBe(28)
  })
  it('uses default order without input and advances one slot after each accepted activation', () => {
    const g = running(),
      hand = g.state.seats[0].hand
    const ids = ['FREEZE', 'SKIP', 'INVISIBLE'].map((type) => hand.find((c) => c.type === type)!.id)
    expect(g.orderDeck(0, ids).accepted).toBe(true)
    expect(g.activate(0, ids[1], 'ORIGINAL').accepted).toBe(false)
    const deadline = g.state.fuseEndsAt
    expect(g.activate(0, ids[0], 'ORIGINAL').accepted).toBe(true)
    expect(queuedCards(g.state.seats[0].hand)[0]).toMatchObject({ id: ids[1], state: 'ARMED' })
    expect(g.activate(0, ids[1], 'ORIGINAL').accepted).toBe(false)
    g.advance(1.3)
    expect(g.activate(0, ids[1], 'ORIGINAL').accepted).toBe(true)
    expect(g.orderDeck(0, [ids[2]]).accepted).toBe(true)
    expect(g.state.arena!.players[0].immuneUntil).toBeGreaterThan(g.state.now)
    expect(g.state.seats[0].hand.filter((c) => c.state === 'ARMED')).toHaveLength(1)
    expect(g.state.fuseEndsAt).toBe(deadline)
  })
  it('rejects missing, duplicate, foreign or consumed cards without changing the queue', () => {
    const g = running(),
      original = queuedCards(g.state.seats[0].hand).map((c) => c.id)
    for (const ids of [[], [original[0], original[0], original[2]], ['foreign', ...original.slice(1)]])
      expect(g.orderDeck(0, ids).accepted).toBe(false)
    expect(queuedCards(g.state.seats[0].hand).map((c) => c.id)).toEqual(original)
    expect(g.activate(0, original[0], 'ORIGINAL').accepted).toBe(true)
    expect(g.orderDeck(0, original).accepted).toBe(false)
  })
})
describe('manual nearby throws', () => {
  it('does not transfer on overlap; revalidates range, ownership and turn on every E request', () => {
    const g = running(),
      alien = g.state.aliens[0],
      deadline = g.state.fuseEndsAt
    g.state.arena!.players[1].x = 16.1
    g.advance(0.1)
    expect(alien.holderSeatId).toBe(0)
    expect(g.snapshot(0).arena!.throwReady).toBe(true)
    g.state.arena!.players[1].x = 18
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(false)
    expect(g.snapshot(0).arena!.throwReady).toBe(false)
    g.state.arena!.players[1].x = 17.4
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(true)
    expect(alien.holderSeatId).toBe(1)
    expect(g.state.seats[0].heat).toBe(1)
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(false)
    expect(g.pass(1, 'ORIGINAL', 1).accepted).toBe(false)
    expect(g.state.fuseEndsAt).toBe(deadline)
  })
  it('excludes immune and other-alien holders, with one clock and no double occupancy', () => {
    const g = running(),
      now = g.state.now,
      players = g.state.arena!.players
    players[1].immuneUntil = now + 3
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(false)
    players[1].immuneUntil = 0
    g.state.aliens.push({ id: 'ECHO', holderSeatId: 1, turn: 0, readyAt: now, heldSince: now })
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(false)
    players[2].x = 16
    players[2].z = 17.3
    expect(g.pass(0, 'ORIGINAL', 0).accepted).toBe(true)
    expect(g.state.aliens.map((a) => a.holderSeatId)).toEqual([2, 1])
    expect(new Set(g.state.aliens.map((a) => a.holderSeatId)).size).toBe(2)
  })
  it('clamps WASD/joystick speed and limits movement to the revised 30 by 15m arena', () => {
    const g = running(),
      p = g.state.arena!.players[0],
      start = p.x
    expect(CHASE_CONFIG.maxX - CHASE_CONFIG.minX).toBe(30)
    expect(CHASE_CONFIG.maxZ - CHASE_CONFIG.minZ).toBe(15)
    expect(g.aimInput(0, 10000, Math.PI / 2, 1).accepted).toBe(true)
    g.advance(0.1)
    expect(p.x - start).toBeCloseTo(0.32)
    expect(g.aimInput(0, 1, NaN, 2).accepted).toBe(false)
    p.x = CHASE_CONFIG.maxX - 0.01
    g.advance(0.1)
    expect(p.x).toBe(CHASE_CONFIG.maxX)
  })
})
describe('archived cursor projection and mobile global framing', () => {
  it('faces the pointer intersection rather than the mesh or camera direction', () => {
    expect(cursorAimYaw({ x: 16, z: 16 }, { x: 16, y: 10, z: 16 }, { x: 1, y: -1, z: 0 })).toBeCloseTo(Math.PI / 2)
    expect(cursorAimYaw({ x: 16, z: 16 }, { x: 16, y: 10, z: 16 }, { x: 0, y: -1, z: 1 })).toBe(0)
    expect(cursorAimYaw({ x: 16, z: 16 }, { x: 16, y: 10, z: 16 }, { x: 0, y: 0, z: 1 })).toBeNull()
    expect(cursorAimYaw({ x: 16, z: 16 }, { x: 16, y: 10, z: 16 }, { x: 0, y: -1, z: 0 })).toBeNull()
  })
  it('centers on the authored room and fits all 30 by 15m corners at 60 degrees on desktop and mobile', () => {
    for (const aspect of [16 / 9, 20 / 9, 4 / 3, 9 / 16]) {
      const pose = globalDronePose(aspect),
        p = pose.position
      expect(p).toEqual(globalDronePose().position)
      expect(p.x >= 0 && p.x <= 48 && p.z >= 0 && p.z <= 32).toBe(true)
      expect(p.y).toBeLessThan(30)
      expect(p.y).toBeCloseTo(20 * 0.85)
      expect(p.x).toBe(16)
      expect(pose.target).toEqual({ x: 16, y: 0, z: 16 })
      expect((Math.atan2(p.y, 16 - p.z) * 180) / Math.PI).toBeCloseTo(60)
      const length = Math.hypot(p.y, 16 - p.z),
        fy = -p.y / length,
        fz = (16 - p.z) / length
      for (const x of [1, 31])
        for (const z of [8.5, 23.5])
          for (const y of [0, 2.4]) {
            const dx = x - p.x,
              dy = y - p.y,
              dz = z - p.z
            const depth = dy * fy + dz * fz,
              tan = Math.tan((pose.fov * Math.PI) / 360)
            expect(Math.abs(dx / (depth * tan * aspect))).toBeLessThanOrEqual(0.880001)
            expect(Math.abs((dy * fz - dz * fy) / (depth * tan))).toBeLessThanOrEqual(0.780001)
          }
    }
  })
})

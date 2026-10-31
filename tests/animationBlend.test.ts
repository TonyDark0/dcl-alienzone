import { beforeEach, describe, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => ({
  states: [] as Array<{
    clip: string
    playing: boolean
    weight: number
    shouldReset?: boolean
    loop?: boolean
    speed?: number
  }>,
  update: (_dt: number) => {}
}))
vi.mock('@dcl/sdk/ecs', () => ({
  Animator: {
    getClipOrNull: (_entity: number, name: string) => fixture.states.find((state) => state.clip === name),
    getMutable: () => ({ states: fixture.states })
  },
  engine: {
    addSystem: (update: (dt: number) => void) => {
      fixture.update = update
    }
  }
}))
import { blendToAnimation, cancelAnimationBlend, setupAnimationBlendSystem } from '../src/presentation/animationBlend'
import type { Entity } from '@dcl/sdk/ecs'
import { createSeatAnimationStates } from '../src/presentation/seatAnimation'

const entity = 100 as Entity
setupAnimationBlendSystem()
beforeEach(() => {
  cancelAnimationBlend(entity)
  fixture.states = [
    { clip: 'idle', playing: true, weight: 1 },
    { clip: 'sit', playing: false, weight: 0 }
  ]
})
describe('animation crossfades', () => {
  it('clears the reset pulse while weights change and completes without an extra source', () => {
    blendToAnimation(entity, 'idle', 'sit', 1)
    expect(fixture.states[1].shouldReset).toBe(true)
    fixture.update(0.5)
    expect(fixture.states[1].shouldReset).toBe(false)
    expect(fixture.states[0].weight + fixture.states[1].weight).toBeCloseTo(1)
    fixture.update(0.5)
    expect(fixture.states[0]).toMatchObject({ playing: false, weight: 0 })
    expect(fixture.states[1]).toMatchObject({ playing: true, weight: 1 })
  })
  it('preserves the visible pose when a transition reverses mid-blend', () => {
    blendToAnimation(entity, 'idle', 'sit', 1)
    fixture.update(0.4)
    const previousWeight = fixture.states[0].weight
    blendToAnimation(entity, 'sit', 'idle', 1)
    expect(fixture.states[0].weight).toBe(previousWeight)
    expect(fixture.states[0].shouldReset).toBe(false)
    fixture.update(0.5)
    expect(fixture.states[0].weight + fixture.states[1].weight).toBeCloseTo(1)
  })

  it('holds the reclined chair through the takeover and recovers without a weight gap', () => {
    fixture.states = createSeatAnimationStates()
    blendToAnimation(entity, 'SEAT_IDLE', 'SEAT_TAKEOVER_RECLINE', 0.48)
    for (let frame = 0; frame < 150; frame++) {
      fixture.update(1 / 30)
      expect(fixture.states[0].weight + fixture.states[1].weight).toBeCloseTo(1)
      expect(fixture.states[1].playing).toBe(true)
      expect(fixture.states[1].speed).toBe(0)
      expect(fixture.states[1].loop).toBe(true)
    }
    expect(fixture.states[1].weight).toBe(1)
    blendToAnimation(entity, 'SEAT_TAKEOVER_RECLINE', 'SEAT_IDLE', 0.85)
    expect(fixture.states[1].weight).toBe(1)
    for (let frame = 0; frame < 27; frame++) {
      fixture.update(1 / 30)
      expect(fixture.states[0].weight + fixture.states[1].weight).toBeCloseTo(1)
    }
    expect(fixture.states[0]).toMatchObject({ playing: true, weight: 1, speed: 0 })
    expect(fixture.states[1]).toMatchObject({ playing: false, weight: 0 })
  })

  it('preserves chair weights when a new takeover interrupts recovery', () => {
    fixture.states = createSeatAnimationStates()
    blendToAnimation(entity, 'SEAT_IDLE', 'SEAT_TAKEOVER_RECLINE', 0.48)
    fixture.update(0.48)
    blendToAnimation(entity, 'SEAT_TAKEOVER_RECLINE', 'SEAT_IDLE', 0.85)
    fixture.update(0.4)
    const weights = fixture.states.map((state) => state.weight)
    blendToAnimation(entity, 'SEAT_IDLE', 'SEAT_TAKEOVER_RECLINE', 0.48)
    expect(fixture.states.map((state) => state.weight)).toEqual(weights)
    expect(fixture.states[1].shouldReset).toBe(false)
    fixture.update(0.48)
    expect(fixture.states[1]).toMatchObject({ playing: true, weight: 1 })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => ({
  states: [] as Array<{ clip: string; playing: boolean; weight: number; shouldReset?: boolean }>,
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
})

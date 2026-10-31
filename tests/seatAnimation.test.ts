import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ASSET_PATHS } from '../src/presentation/assetManifest'
import { createSeatAnimationStates } from '../src/presentation/seatAnimation'

describe('seat pose playback', () => {
  it('keeps both single-key poses alive rather than letting recline finish during a blend', () => {
    const states = createSeatAnimationStates()
    expect(states).toEqual([
      { clip: 'SEAT_IDLE', playing: true, loop: true, speed: 0, weight: 1 },
      { clip: 'SEAT_TAKEOVER_RECLINE', playing: false, loop: true, speed: 0, weight: 0 }
    ])
  })

  it('creates independent playback state for every chair', () => {
    const first = createSeatAnimationStates()
    const second = createSeatAnimationStates()
    first[0].weight = 0
    first[1].playing = true
    expect(second[0].weight).toBe(1)
    expect(second[1].playing).toBe(false)
  })

  it('verifies that frozen playback still matches the exported GLB', () => {
    const bytes = readFileSync(resolve(process.cwd(), ASSET_PATHS.seat))
    const glb = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8')) as {
      accessors: Array<{ count: number; min?: number[]; max?: number[] }>
      animations: Array<{ name: string; channels: unknown[]; samplers: Array<{ input: number; output: number }> }>
    }
    for (const state of createSeatAnimationStates()) {
      const clip = glb.animations.find((animation) => animation.name === state.clip)
      expect(clip, state.clip).toBeDefined()
      expect(clip?.channels.length).toBeGreaterThan(0)
      for (const sampler of clip?.samplers ?? []) {
        const input = glb.accessors[sampler.input]
        expect(input.count, `${state.clip}: motion added; review frozen pose playback`).toBe(1)
        expect(input.min?.[0]).toBeCloseTo(1 / 24)
        expect(input.max?.[0]).toBeCloseTo(1 / 24)
        expect(glb.accessors[sampler.output].count).toBe(1)
      }
    }
  })
})

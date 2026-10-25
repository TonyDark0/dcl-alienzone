import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ASTRONAUT_VARIANT_PATHS } from '../src/presentation/assetManifest'
import { astronautVariantsForMatch } from '../src/presentation/astronautVariants'
import { ASTRONAUT_CLIP_SECONDS } from '../src/presentation/animationClips'

interface GlbAnimation {
  name?: string
  channels?: unknown[]
  samplers?: Array<{ input: number }>
}

interface GlbJson {
  accessors?: Array<{ max?: number[] }>
  animations?: GlbAnimation[]
}

function readGlbJson(assetPath: string): GlbJson {
  const bytes = readFileSync(resolve(process.cwd(), assetPath))
  const jsonChunkLength = bytes.readUInt32LE(12)
  return JSON.parse(
    bytes
      .subarray(20, 20 + jsonChunkLength)
      .toString('utf8')
      .replace(/[\0 ]+$/, '')
  ) as GlbJson
}

describe('astronaut skin assignment', () => {
  it('assigns every skin exactly once and remains stable for the match', () => {
    const first = astronautVariantsForMatch('alienzone-match-42')
    const repeated = astronautVariantsForMatch('alienzone-match-42')

    expect(first).toEqual(repeated)
    expect(first).toHaveLength(8)
    expect(new Set(first).size).toBe(8)
    expect([...first].sort()).toEqual([...ASTRONAUT_VARIANT_PATHS].sort())
  })

  it('reshuffles skins for a new match', () => {
    expect(astronautVariantsForMatch('alienzone-match-42')).not.toEqual(astronautVariantsForMatch('alienzone-match-43'))
  })

  it('embeds the complete runtime clip set in every astronaut GLB', () => {
    const requiredClips = [
      'AST_IDLE_SEATED',
      'AST_SIT_DOWN',
      'AST_IDLE_STANDING',
      'AST_TAKEOVER',
      'AST_HOLD_SAFE',
      'AST_PASS'
    ]

    for (const assetPath of ASTRONAUT_VARIANT_PATHS) {
      const glb = readGlbJson(assetPath)
      const clips = new Map((glb.animations ?? []).map((animation) => [animation.name, animation]))

      for (const clipName of requiredClips) expect(clips.has(clipName), `${assetPath}: ${clipName}`).toBe(true)

      for (const [name, expectedDuration] of Object.entries(ASTRONAUT_CLIP_SECONDS)) {
        const actualDuration = Math.max(
          0,
          ...(clips.get(name)?.samplers ?? []).map((sampler) => glb.accessors?.[sampler.input]?.max?.[0] ?? 0)
        )
        expect(actualDuration, `${assetPath}: update runtime timing after re-exporting ${name}`).toBeCloseTo(
          expectedDuration,
          3
        )
      }

      const takeover = clips.get('AST_TAKEOVER')
      expect(takeover?.channels?.length, `${assetPath}: AST_TAKEOVER channels`).toBeGreaterThan(0)

      const duration = Math.max(
        0,
        ...(takeover?.samplers ?? []).map((sampler) => glb.accessors?.[sampler.input]?.max?.[0] ?? 0)
      )
      expect(duration, `${assetPath}: AST_TAKEOVER duration`).toBeGreaterThan(3.7)
    }
  })
})

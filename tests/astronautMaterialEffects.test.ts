import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import type { Entity } from '@dcl/sdk/ecs'

const fixture = vi.hoisted(() => ({ materials: new Map<number, any>(), write: vi.fn(), remove: vi.fn() }))
vi.mock('@dcl/sdk/ecs', () => ({
  GltfNodeModifiers: {
    has: (entity: number) => fixture.materials.has(entity),
    createOrReplace: (entity: number, value: any) => {
      fixture.materials.set(entity, value)
      fixture.write(entity, value)
    },
    deleteFrom: (entity: number) => {
      fixture.materials.delete(entity)
      fixture.remove(entity)
    }
  },
  Material: { Texture: { Common: (value: any) => value } },
  MaterialTransparencyMode: { MTM_ALPHA_BLEND: 2, MTM_OPAQUE: 0 }
}))
vi.mock('@dcl/sdk/math', () => ({
  Color4: { create: (r: number, g: number, b: number, a: number) => ({ r, g, b, a }) },
  Color3: { create: (r: number, g: number, b: number) => ({ r, g, b }) }
}))
import {
  clearAstronautMaterial,
  updateAstronautMaterial,
  stepAstronautMaterial
} from '../src/presentation/astronautMaterialEffects'
import { ASTRONAUT_VARIANT_PATHS } from '../src/presentation/assetManifest'

const entity = 500 as Entity
const normal = { frozen: false, invisible: false, local: true }
const material = () => fixture.materials.get(entity).modifiers[0].material.material.pbr
beforeEach(() => {
  clearAstronautMaterial(entity)
  fixture.write.mockClear()
  fixture.remove.mockClear()
})

describe('temporary astronaut material effects', () => {
  it('keeps the original GLB material untouched when no effect is active', () => {
    updateAstronautMaterial(entity, normal, 0.016)
    expect(fixture.write).not.toHaveBeenCalled()
    expect(fixture.remove).not.toHaveBeenCalled()
  })
  it('uses a reversible icy tint/gloss on the existing atlas, without restarting a stable effect', () => {
    const intent = { ...normal, frozen: true }
    updateAstronautMaterial(entity, intent, 0.1)
    expect(material().albedoColor.r).toBeCloseTo(0.75)
    updateAstronautMaterial(entity, intent, 0.1)
    expect(material()).toMatchObject({
      albedoColor: { r: 0.5, g: 0.92, b: 1, a: 1 },
      metallic: 0.08,
      transparencyMode: 0,
      castShadows: true
    })
    expect(material().roughness).toBeCloseTo(0.22)
    expect(material().texture.src).toBe('assets/Images/textures/az_tex_gameplay_color_atlas_v001.png')
    expect(fixture.materials.get(entity).modifiers[0].path).toBe('')
    const writes = fixture.write.mock.calls.length
    for (let frame = 0; frame < 60; frame++) updateAstronautMaterial(entity, intent, 1 / 60)
    expect(fixture.write.mock.calls.length).toBe(writes)
    updateAstronautMaterial(entity, normal, 0.1)
    expect(fixture.materials.has(entity)).toBe(true)
    updateAstronautMaterial(entity, normal, 0.1)
    expect(fixture.materials.has(entity)).toBe(false)
  })
  it('gives the owner a 25% ghost, disables shadows immediately and handles overlapping Freeze', () => {
    updateAstronautMaterial(entity, { ...normal, invisible: true, frozen: true }, 0.01)
    expect(fixture.materials.get(entity).modifiers[0].castShadows).toBe(false)
    updateAstronautMaterial(entity, { ...normal, invisible: true, frozen: true }, 0.2)
    expect(material().albedoColor.a).toBeCloseTo(0.25)
    expect(material().transparencyMode).toBe(2)
    updateAstronautMaterial(entity, { ...normal, frozen: true }, 0.2)
    expect(material().albedoColor.a).toBe(1)
    expect(material().castShadows).toBe(true)
    expect(material().albedoColor.r).toBe(0.5)
    clearAstronautMaterial(entity)
    expect(fixture.materials.has(entity)).toBe(false)
    updateAstronautMaterial(entity, normal, 0.016)
    expect(fixture.materials.has(entity)).toBe(false)
  })
  it('never gives remote invisibility the owner-only translucent silhouette or a shadow', () => {
    updateAstronautMaterial(entity, { frozen: false, invisible: true, local: false }, 0.2)
    expect(material().albedoColor.a).toBe(0)
    expect(material().castShadows).toBe(false)
    expect(fixture.materials.get(entity).modifiers[0].castShadows).toBe(false)
    updateAstronautMaterial(entity, { ...normal, local: false }, 0.2)
    expect(fixture.materials.has(entity)).toBe(false)
  })
  it('finishes a 200ms transition consistently at different frame rates without changing its input state', () => {
    for (const fps of [30, 60, 120]) {
      const original = { ice: 0, ghost: 0 }
      let state = original
      for (let frame = 0; frame < fps; frame++)
        state = stepAstronautMaterial(state, { ...normal, frozen: true, invisible: true }, 1 / fps)
      expect(state).toEqual({ ice: 1, ghost: 1 })
      expect(original).toEqual({ ice: 0, ghost: 0 })
    }
  })
  it('uses exactly the same shared atlas bytes embedded in all eight authored variants', () => {
    const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
    const expected = hash(readFileSync('assets/Images/textures/az_tex_gameplay_color_atlas_v001.png'))
    for (const path of ASTRONAUT_VARIANT_PATHS) {
      const bytes = readFileSync(path),
        length = bytes.readUInt32LE(12)
      const glb = JSON.parse(bytes.subarray(20, 20 + length).toString())
      const view = glb.bufferViews[glb.images[0].bufferView]
      const start = 20 + length + 8 + (view.byteOffset ?? 0)
      expect(hash(bytes.subarray(start, start + view.byteLength)), path).toBe(expected)
    }
  })
})

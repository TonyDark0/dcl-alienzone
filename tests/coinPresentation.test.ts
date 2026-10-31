import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'

const fixture = vi.hoisted(() => ({
  id: 500,
  transforms: new Map<number, any>(),
  models: new Map<number, any>(),
  removed: [] as number[]
}))
vi.mock('@dcl/sdk/ecs', () => ({
  engine: {
    addEntity: () => ++fixture.id,
    removeEntityWithChildren: (id: number) => {
      fixture.removed.push(id)
      for (const [child, value] of fixture.transforms)
        if (value.parent === id) {
          fixture.models.delete(child)
          fixture.transforms.delete(child)
        }
      fixture.transforms.delete(id)
    }
  },
  Transform: {
    create: (id: number, value: any) => fixture.transforms.set(id, value),
    getMutable: (id: number) => fixture.transforms.get(id)
  },
  GltfContainer: { create: (id: number, value: any) => fixture.models.set(id, value) }
}))
vi.mock('@dcl/sdk/math', () => ({
  Vector3: { create: (x: number, y: number, z: number) => ({ x, y, z }) },
  Quaternion: { fromEulerDegrees: (x: number, y: number, z: number) => ({ x, y, z }) }
}))
import { updateArenaCoins, clearArenaCoins } from '../src/presentation/arenaCoins'
import { ASSET_PATHS } from '../src/presentation/assetManifest'

beforeEach(() => {
  clearArenaCoins()
  fixture.transforms.clear()
  fixture.models.clear()
  fixture.removed = []
})

describe('shared GLB coin presentation', () => {
  it('creates ten shared models once, bounces/spins them, and removes only server-collected coins', () => {
    const coins = Array.from({ length: 10 }, (_, id) => ({ id: `1:${id}`, x: 2 + id * 2, z: 10 }))
    updateArenaCoins(400 as any, 'HOLDING', coins, 0.016)
    expect(fixture.models.size).toBe(10)
    const roots = [...fixture.transforms].filter(([, value]) => value.parent === 400)
    expect(roots).toHaveLength(10)
    const first = roots[0][1],
      before = { ...first.rotation }
    expect(first.scale.x).toBeCloseTo(0.12)
    updateArenaCoins(400 as any, 'HOLDING', coins, 0.3)
    expect(first.rotation).not.toEqual(before)
    expect(first.scale.x).toBeGreaterThan(1)
    expect(fixture.models.size).toBe(10)
    for (const model of fixture.models.values())
      expect(model).toEqual({ src: ASSET_PATHS.coin, visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
    updateArenaCoins(400 as any, 'HOLDING', coins.slice(1), 0.2)
    expect(fixture.models.size).toBe(9)
    expect(fixture.removed).toHaveLength(1)
    updateArenaCoins(400 as any, 'TAKEOVER', coins, 0.016)
    expect(fixture.models.size).toBe(0)
    expect(fixture.removed).toHaveLength(10)
    clearArenaCoins()
    expect(fixture.removed).toHaveLength(10)
  })
  it('keeps the inspected native model bounds, pivot and absence of auto-play clips explicit', () => {
    const binary = readFileSync(ASSET_PATHS.coin)
    expect(binary.subarray(0, 4).toString()).toBe('glTF')
    const glb = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString())
    expect(glb.nodes).toHaveLength(1)
    expect(glb.nodes[0].scale ?? [1, 1, 1]).toEqual([1, 1, 1])
    expect(glb.nodes[0].translation ?? [0, 0, 0]).toEqual([0, 0, 0])
    expect(glb.nodes[0].rotation ?? [0, 0, 0, 1]).toEqual([0, 0, 0, 1])
    expect(glb.animations ?? []).toHaveLength(0)
    const primitive = glb.meshes[0].primitives[0],
      positions = glb.accessors[primitive.attributes.POSITION]
    expect(positions.max[0] - positions.min[0]).toBeCloseTo(0.3203, 3)
    expect((positions.max[1] + positions.min[1]) / 2).toBeCloseTo(0.4745378, 5)
    expect((positions.max[2] + positions.min[2]) / 2).toBeCloseTo(0.0590875, 5)
    expect(glb.accessors[primitive.indices].count / 3).toBe(26)
  })
})

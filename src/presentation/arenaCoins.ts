import { engine, GltfContainer, Transform, type Entity } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import type { MatchPhase } from '../game/model/types'
import type { ChaseCoin } from '../game/rules/chaseCoins'
import { ASSET_PATHS } from './assetManifest'
import { coinEntranceScale } from './coinMotion'

// Inspected coin.glb: identity node transform, 0.3203 × 0.3046 × 0.0278m,
// center (0, 0.4745378, 0.0590875), 26 triangles, no animations/colliders.
const COIN_SCALE = 1.5
const actors = new Map<string, { entity: Entity; bornAt: number }>()
let elapsed = 0

export function clearArenaCoins() {
  for (const { entity } of actors.values()) engine.removeEntityWithChildren(entity)
  actors.clear()
  elapsed = 0
}

/** Render only authoritative remaining coins; visual bob/spin never claims a pickup. */
export function updateArenaCoins(parent: Entity, phase: MatchPhase, coins: readonly ChaseCoin[], dt: number) {
  const current = phase === 'HOLDING' ? coins : []
  const ids = new Set(current.map((coin) => coin.id))
  for (const [id, { entity }] of actors)
    if (!ids.has(id)) {
      engine.removeEntityWithChildren(entity)
      actors.delete(id)
    }
  elapsed += Math.max(0, dt)
  for (const coin of current) {
    let actor = actors.get(coin.id)
    if (actor === undefined) {
      const entity = engine.addEntity()
      Transform.create(entity, { parent, position: Vector3.create(coin.x, 0.55, coin.z) })
      const model = engine.addEntity()
      Transform.create(model, {
        parent: entity,
        position: Vector3.create(0, -0.4745378 * COIN_SCALE, -0.0590875 * COIN_SCALE),
        scale: Vector3.create(COIN_SCALE, COIN_SCALE, COIN_SCALE)
      })
      GltfContainer.create(model, {
        src: ASSET_PATHS.coin,
        visibleMeshesCollisionMask: 0,
        invisibleMeshesCollisionMask: 0
      })
      actor = { entity, bornAt: elapsed }
      actors.set(coin.id, actor)
    }
    const transform = Transform.getMutable(actor.entity)
    transform.position = Vector3.create(coin.x, 0.55 + Math.sin(elapsed * 2.5 + coin.x) * 0.05, coin.z)
    transform.rotation = Quaternion.fromEulerDegrees(0, elapsed * 60 + coin.x * 17, 0)
    const scale = coinEntranceScale(elapsed - actor.bornAt)
    transform.scale = Vector3.create(scale, scale, scale)
  }
}

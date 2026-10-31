import {
  Animator,
  Billboard,
  BillboardMode,
  engine,
  GltfContainer,
  GltfNodeModifiers,
  Material,
  MaterialTransparencyMode,
  MeshRenderer,
  TextShape,
  Transform,
  type Entity
} from '@dcl/sdk/ecs'
import { Color3, Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { CHASE_CARD_DETAILS } from '../game/rules/chaseCards'
import { shadowOpacity } from '../game/rules/roundPowers'
import { getUiState } from '../ui/state/uiState'
import { astronautVariantsForMatch } from './astronautVariants'
import { smoothChasePose, type ChasePose } from './chaseMotion'

const powers = new Map<string, Entity>()
const shots = new Map<string, Entity>()
const shadows = new Map<
  string,
  { entity: Entity; label: Entity; background: Entity; opacity: number; pose: ChasePose }
>()
export function clearArenaPowers() {
  for (const entity of powers.values()) engine.removeEntityWithChildren(entity)
  for (const entity of shots.values()) engine.removeEntityWithChildren(entity)
  for (const { entity } of shadows.values()) engine.removeEntityWithChildren(entity)
  powers.clear()
  shots.clear()
  shadows.clear()
}
/** Presentation of server-owned pickups/decoys only; no local contact or points. */
export function updateArenaPowers(parent: Entity, dt: number) {
  const state = getUiState()
  const now = state.snapshotServerNow + Math.max(0, Date.now() - state.snapshotReceivedAtMs) / 1000
  const current = state.phase === 'HOLDING' ? (state.arena?.powers ?? []) : []
  for (const [id, entity] of powers)
    if (!current.some((power) => power.id === id)) {
      engine.removeEntityWithChildren(entity)
      powers.delete(id)
    }
  for (const power of current) {
    let entity = powers.get(power.id)
    if (entity === undefined) {
      entity = engine.addEntity()
      Transform.create(entity, {
        parent,
        position: Vector3.create(power.x, 0.9, power.z),
        scale: Vector3.create(0.95, 0.95, 0.95)
      })
      Billboard.create(entity, { billboardMode: BillboardMode.BM_ALL })
      MeshRenderer.setPlane(entity)
      const texture = Material.Texture.Common({ src: CHASE_CARD_DETAILS[power.type].icon })
      Material.setPbrMaterial(entity, {
        texture,
        albedoColor: Color4.White(),
        roughness: 1,
        metallic: 0,
        emissiveTexture: texture,
        emissiveColor: Color3.White(),
        emissiveIntensity: 1,
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_TEST,
        alphaTest: 0.02,
        castShadows: false
      })
      const label = engine.addEntity()
      Transform.create(label, {
        parent: entity,
        position: Vector3.create(0, 0.65, 0),
        scale: Vector3.create(0.16, 0.16, 0.16)
      })
      TextShape.create(label, {
        text: CHASE_CARD_DETAILS[power.type].name,
        fontSize: 3,
        textColor: Color4.create(0.75, 0.55, 1, 1),
        outlineColor: Color3.Black(),
        outlineWidth: 0.15
      })
      powers.set(power.id, entity)
    }
    Transform.getMutable(entity).position.y = 0.9 + Math.sin(now * 3) * 0.12
  }
  const activeShots = state.phase === 'HOLDING' ? (state.arena?.shots ?? []) : []
  for (const [id, entity] of shots)
    if (!activeShots.some((shot) => shot.id === id && shot.endsAt > now)) {
      engine.removeEntityWithChildren(entity)
      shots.delete(id)
    }
  for (const shot of activeShots) {
    if (shot.endsAt <= now) continue
    let entity = shots.get(shot.id)
    if (entity === undefined) {
      entity = engine.addEntity()
      Transform.create(entity, { parent, scale: Vector3.create(0.45, 0.45, 0.45) })
      MeshRenderer.setPlane(entity)
      Billboard.create(entity, { billboardMode: BillboardMode.BM_ALL })
      Material.setBasicMaterial(entity, {
        texture: Material.Texture.Common({ src: 'assets/Images/ui/reactions/az_ui_reaction_alien_v001.png' }),
        alphaTexture: Material.Texture.Common({
          src: 'assets/Images/ui/reactions/az_ui_reaction_alien_alpha_v001.png'
        }),
        diffuseColor: Color4.White(),
        alphaTest: 0.02,
        castShadows: false
      })
      shots.set(shot.id, entity)
    }
    const t = Math.max(0, Math.min(1, (now - shot.at) / (shot.endsAt - shot.at)))
    Transform.getMutable(entity).position = Vector3.create(
      shot.x + (shot.toX - shot.x) * t,
      1.1,
      shot.z + (shot.toZ - shot.z) * t
    )
  }
  const activeShadows = state.phase === 'HOLDING' ? (state.arena?.shadows ?? []) : []
  for (const [id, { entity }] of shadows)
    if (!activeShadows.some((shadow) => shadow.id === id)) {
      engine.removeEntityWithChildren(entity)
      shadows.delete(id)
    }
  const variants = astronautVariantsForMatch(state.matchId)
  const viewer = state.localSeatId === null ? undefined : state.arena?.players[state.localSeatId]
  for (const shadow of activeShadows) {
    let actor = shadows.get(shadow.id)
    if (!actor) {
      const entity = engine.addEntity()
      Transform.create(entity, { parent, position: Vector3.create(shadow.x, 0, shadow.z) })
      GltfContainer.create(entity, {
        src: variants[shadow.owner],
        visibleMeshesCollisionMask: 0,
        invisibleMeshesCollisionMask: 0
      })
      Animator.create(entity, { states: [{ clip: 'AST_RUNNING', playing: true, loop: true, speed: 1, weight: 1 }] })
      const label = engine.addEntity()
      Transform.create(label, {
        parent: entity,
        position: Vector3.create(0, 1.512, 0),
        scale: Vector3.create(0.045, 0.045, 0.045)
      })
      Billboard.create(label, { billboardMode: BillboardMode.BM_ALL })
      TextShape.create(label, {
        text: '',
        fontSize: 10,
        textColor: Color4.White(),
        outlineColor: Color3.Black(),
        outlineWidth: 0.12,
        width: 5,
        height: 0.8
      })
      const background = engine.addEntity()
      Transform.create(background, {
        parent: label,
        position: Vector3.create(0, 0, 0.035),
        scale: Vector3.create(4.875, 1.175, 1)
      })
      MeshRenderer.setPlane(background)
      Material.setBasicMaterial(background, {
        texture: Material.Texture.Common({ src: 'assets/Images/ui/az_ui_nameplate_pill_v001.png' }),
        diffuseColor: Color4.White(),
        alphaTest: 0.02
      })
      actor = { entity, label, background, opacity: 1, pose: { x: shadow.x, z: shadow.z, yaw: shadow.yaw } }
      shadows.set(shadow.id, actor)
    }
    const transform = Transform.getMutable(actor.entity)
    actor.pose = smoothChasePose(actor.pose, shadow, dt)
    transform.position = Vector3.create(actor.pose.x, 0, actor.pose.z)
    transform.rotation = Quaternion.fromEulerDegrees(0, (actor.pose.yaw * 180) / Math.PI, 0)
    const identified = shadow.owner === state.localSeatId || (viewer?.vaccinatedUntil ?? 0) > state.snapshotServerNow
    TextShape.getMutable(actor.label).text =
      `${state.seats[shadow.owner]?.displayName ?? 'CREW'}${identified ? ' · SHADOW' : ''}`
    Transform.getMutable(actor.background).scale.x = Math.min(
      7.75,
      Math.max(3.125, (1.15 + TextShape.getMutable(actor.label).text.length * 0.34) * 1.25)
    )
    const human = !state.seats[shadow.owner]?.isBot
    TextShape.getMutable(actor.label).textColor = human
      ? Color4.create(0.72, 0.36, 1, actor.opacity)
      : Color4.create(1, 1, 1, actor.opacity)
    const opacity = Math.round(shadowOpacity(now, shadow.endsAt) * 20) / 20
    if (opacity !== actor.opacity) {
      actor.opacity = opacity
      GltfNodeModifiers.createOrReplace(actor.entity, {
        modifiers: [
          {
            path: '',
            castShadows: opacity === 1,
            material: {
              material: {
                $case: 'pbr',
                pbr: {
                  texture: Material.Texture.Common({
                    src: 'assets/Images/textures/az_tex_gameplay_color_atlas_v001.png'
                  }),
                  albedoColor: Color4.create(1, 1, 1, opacity),
                  roughness: 1,
                  metallic: 0,
                  transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
                  alphaTest: 0,
                  castShadows: opacity === 1
                }
              }
            }
          }
        ]
      })
      TextShape.getMutable(actor.label).textColor = human
        ? Color4.create(0.72, 0.36, 1, opacity)
        : Color4.create(1, 1, 1, opacity)
      Material.setBasicMaterial(actor.background, {
        texture: Material.Texture.Common({ src: 'assets/Images/ui/az_ui_nameplate_pill_v001.png' }),
        diffuseColor: Color4.create(1, 1, 1, opacity),
        alphaTest: 0.02
      })
    }
  }
}

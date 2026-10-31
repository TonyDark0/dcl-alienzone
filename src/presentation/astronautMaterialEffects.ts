import { GltfNodeModifiers, Material, MaterialTransparencyMode, type Entity } from '@dcl/sdk/ecs'
import { Color3, Color4 } from '@dcl/sdk/math'

export interface AstronautMaterialState {
  ice: number
  ghost: number
}
export interface AstronautMaterialIntent {
  frozen: boolean
  invisible: boolean
  local: boolean
}

const EFFECT_TRANSITION_SECONDS = 0.2
const states = new Map<Entity, AstronautMaterialState & { key: string }>()
const ATLAS = 'assets/Images/textures/az_tex_gameplay_color_atlas_v001.png'

/** Presentation only. Deadlines, speed and who can see whom remain authoritative. */
export function stepAstronautMaterial(
  previous: AstronautMaterialState,
  intent: AstronautMaterialIntent,
  dt: number
): AstronautMaterialState {
  const step = Math.min(1, Math.max(0, Number.isFinite(dt) ? dt : 0) / EFFECT_TRANSITION_SECONDS)
  const approach = (value: number, target: number) =>
    value + Math.sign(target - value) * Math.min(Math.abs(target - value), step)
  return {
    ice: approach(previous.ice, Number(intent.frozen)),
    ghost: approach(previous.ghost, Number(intent.invisible))
  }
}

export function clearAstronautMaterial(entity: Entity) {
  if (GltfNodeModifiers.has(entity)) GltfNodeModifiers.deleteFrom(entity)
  states.delete(entity)
}

export function updateAstronautMaterial(entity: Entity, intent: AstronautMaterialIntent, dt: number) {
  const previous = states.get(entity) ?? { ice: 0, ghost: 0, key: '' }
  const state = stepAstronautMaterial(previous, intent, dt)
  if (state.ice === 0 && state.ghost === 0) {
    if (previous.key) clearAstronautMaterial(entity)
    return
  }
  // Quantize only material writes, not the timing. Stable effects don't rewrite
  // a whole material every frame. The shared atlas matches all eight GLBs.
  const ice = Math.round(state.ice * 20) / 20
  const ghost = Math.round(state.ghost * 20) / 20
  const castShadows = !intent.invisible && ghost === 0
  const opacity = 1 - ghost * (intent.local ? 0.75 : 1)
  const key = `${ice}:${ghost}:${intent.local}:${castShadows}`
  states.set(entity, { ...state, key })
  if (key === previous.key) return
  GltfNodeModifiers.createOrReplace(entity, {
    modifiers: [
      {
        path: '',
        castShadows,
        material: {
          material: {
            $case: 'pbr',
            pbr: {
              texture: Material.Texture.Common({ src: ATLAS }),
              albedoColor: Color4.create(1 - ice * 0.5, 1 - ice * 0.08, 1, opacity),
              metallic: ice * 0.08,
              roughness: 1 - ice * 0.78,
              // A low blue-white lift keeps dark atlas swatches readable as chilled;
              // no bloom, outline mesh, shader or additional texture is introduced.
              emissiveColor: Color3.create(ice * 0.12, ice * 0.25, ice * 0.32),
              emissiveIntensity: 0.35,
              transparencyMode:
                ghost > 0 ? MaterialTransparencyMode.MTM_ALPHA_BLEND : MaterialTransparencyMode.MTM_OPAQUE,
              alphaTest: 0,
              castShadows
            }
          }
        }
      }
    ]
  })
}

import { Animator, engine, type Entity } from '@dcl/sdk/ecs'

import { smoothBlendProgress } from './animationBlendMath'

export const DEFAULT_ANIMATION_BLEND_SECONDS = 0.5

interface ActiveAnimationBlend {
  entity: Entity
  toClipName: string
  elapsedSeconds: number
  durationSeconds: number
  fromClips: Array<{ name: string; startWeight: number }>
  toStartWeight: number
}

const activeBlends = new Map<Entity, ActiveAnimationBlend>()
let systemInstalled = false

/** Installs the shared animation-weight system once on the client. */
export function setupAnimationBlendSystem(): void {
  if (systemInstalled) return
  systemInstalled = true
  engine.addSystem(updateAnimationBlends, 0, 'alienzone-animation-blends')
}

/**
 * Crossfades between clips registered in an entity's Animator. Movement
 * between gameplay anchors remains the responsibility of Transform code.
 */
export function blendToAnimation(
  entity: Entity,
  fromClipName: string,
  toClipName: string,
  durationSeconds = DEFAULT_ANIMATION_BLEND_SECONDS
): boolean {
  if (fromClipName === toClipName) return false

  const fromClip = Animator.getClipOrNull(entity, fromClipName)
  const toClip = Animator.getClipOrNull(entity, toClipName)
  if (!fromClip || !toClip) return false

  activeBlends.delete(entity)

  // A gameplay event can interrupt an in-progress crossfade (for example,
  // HOLD_SAFE -> PASS -> TAKEOVER). Fade every currently visible source out
  // together so no orphaned idle/pass clip keeps competing with TAKEOVER.
  const animator = Animator.getMutable(entity)
  let fromClips = animator.states
    .filter((state) => state.clip !== toClipName && state.playing && (state.weight ?? 1) > 0)
    .map((state) => ({ name: state.clip, startWeight: state.weight ?? 1 }))

  if (fromClips.length === 0) {
    fromClip.playing = true
    fromClip.weight = 1
    fromClips = [{ name: fromClipName, startWeight: 1 }]
  }

  // An interrupted blend may return to a clip that is still contributing.
  // Preserve its pose and weight instead of snapping it back to frame zero.
  const toStartWeight = toClip.playing ? (toClip.weight ?? 1) : 0
  toClip.shouldReset = toStartWeight === 0
  toClip.playing = true
  toClip.weight = toStartWeight

  if (durationSeconds <= 0) {
    for (const source of fromClips) {
      const clip = Animator.getClipOrNull(entity, source.name)
      if (!clip) continue
      clip.playing = false
      clip.weight = 0
    }
    toClip.weight = 1
    return true
  }

  activeBlends.set(entity, {
    entity,
    toClipName,
    elapsedSeconds: 0,
    durationSeconds,
    fromClips,
    toStartWeight
  })

  return true
}

export function cancelAnimationBlend(entity: Entity): void {
  activeBlends.delete(entity)
}

function updateAnimationBlends(deltaTime: number): void {
  for (const [entity, blend] of activeBlends) {
    const toClip = Animator.getClipOrNull(entity, blend.toClipName)

    if (!toClip) {
      activeBlends.delete(entity)
      continue
    }

    blend.elapsedSeconds += Math.max(0, deltaTime)
    toClip.shouldReset = false
    const progress = smoothBlendProgress(blend.elapsedSeconds, blend.durationSeconds)

    for (const source of blend.fromClips) {
      const clip = Animator.getClipOrNull(entity, source.name)
      if (!clip) continue
      clip.shouldReset = false
      clip.weight = source.startWeight * (1 - progress)
    }
    toClip.weight = blend.toStartWeight + (1 - blend.toStartWeight) * progress

    if (progress < 1) continue

    for (const source of blend.fromClips) {
      const clip = Animator.getClipOrNull(entity, source.name)
      if (!clip) continue
      clip.playing = false
      clip.weight = 0
    }
    toClip.playing = true
    toClip.weight = 1
    activeBlends.delete(entity)
  }
}

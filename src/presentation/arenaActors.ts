import {
  Animator,
  Billboard,
  BillboardMode,
  engine,
  GltfContainer,
  Material,
  MeshRenderer,
  TextAlignMode,
  TextShape,
  Transform,
  VisibilityComponent,
  type Entity
} from '@dcl/sdk/ecs'
import { Color3, Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

import type { MatchPhase, SeatId } from '../game/model/types'
import type { UiSeatNotice, UiSeatPassCue, UiSeatReaction, UiSeatView } from '../ui/state/uiState'
import { ASSET_PATHS } from './assetManifest'
import { blendToAnimation, cancelAnimationBlend } from './animationBlend'
import { astronautVariantsForMatch } from './astronautVariants'
import { ASTRONAUT_CLIP_SECONDS } from './animationClips'
import { createSeatAnimationStates } from './seatAnimation'
import { getUiState } from '../ui/state/uiState'
import { locomotionFor, chaseSpeedMultiplier } from '../game/rules/chase'
import { projectChasePlayer, smoothChasePose, type ChasePose } from './chaseMotion'
import { AVAILABLE_RUNNING_CLIPS, runningAnimation } from './runningAnimation'
import { updateAstronautMaterial, clearAstronautMaterial } from './astronautMaterialEffects'
import { noticeAnimation, NOTICE_ANIMATION_SECONDS } from './noticeAnimation'

const ARENA_CENTER = Vector3.create(16, 0, 16)
const SEAT_RADIUS = 2.0825
const SEAT_SCALE = Vector3.create(1, 1, 1)
const ASTRONAUT_SCALE = Vector3.create(1, 1, 1)
const STANDING_PREVIEW_SECONDS = 1
// Durations exported in all eight astronaut variants (seconds).
const SIT_DOWN_CLIP_SECONDS = ASTRONAUT_CLIP_SECONDS.AST_SIT_DOWN
const PASS_CLIP_SECONDS = ASTRONAUT_CLIP_SECONDS.AST_PASS
const RING_OFFSET_RADIANS = (5 * Math.PI) / 180
const LOCAL_ROTATION_OFFSET = Quaternion.fromEulerDegrees(0, 0, 0)
const NAME_LABEL_HEIGHT = 1.512
const NOTICE_LABEL_HEIGHT = 1.652
const REACTION_ICON_HEIGHT = 1.82
const NAME_LABEL_SCALE = Vector3.create(0.045, 0.045, 0.045)
const REACTION_ICON_SCALE = Vector3.create(0.32, 0.32, 0.32)
const HIDDEN_SCALE = Vector3.create(0, 0, 0)
const NOTICE_LABEL_SCALE = Vector3.create(0.055, 0.055, 0.055)
const REACTION_ANIMATION_SECONDS = 1.5
const HUMAN_NAME_COLOR = Color4.create(0.72, 0.36, 1, 1)
const BOT_NAME_COLOR = Color4.White()
const POINTS_NOTICE_COLOR = Color4.create(0.67, 1, 0.34, 1)
const COIN_NOTICE_COLOR = Color4.create(1, 0.94, 0.3, 1)
const CARD_NOTICE_COLOR = Color4.create(0.18, 0.9, 1, 1)
const PENALTY_NOTICE_COLOR = Color4.create(1, 0.25, 0.38, 1)
const SIT_ENTER_BLEND_SECONDS = 0.45
// Begin settling before the non-looping sit clip reaches its last frame. This
// preserves the authored final pose while blending into the seated breathing
// cycle instead of switching only after the clip has already stopped.
const SIT_SETTLE_BLEND_SECONDS = 0.9
const SIT_SETTLE_OVERLAP_SECONDS = SIT_SETTLE_BLEND_SECONDS
const HOLD_BLEND_SECONDS = 0.3
const PASS_ENTER_BLEND_SECONDS = 0.12
const PASS_EXIT_BLEND_SECONDS = 0.22
const TAKEOVER_ENTER_BLEND_SECONDS = 0.4
const TAKEOVER_EXIT_BLEND_SECONDS = 0.75
const SEAT_TAKEOVER_ENTER_BLEND_SECONDS = 0.48
const SEAT_TAKEOVER_EXIT_BLEND_SECONDS = 0.85

interface SeatActors {
  seatId: SeatId
  seat: Entity
  astronaut: Entity
  nameLabel: Entity
  nameBackground: Entity
  reactionIcon: Entity
  noticeLabel: Entity
  alienMarker: Entity
  alienTimer: Entity
  wasConcealed: boolean
  displayedPose: ChasePose
  displayedName: string
  displayedAsBot: boolean | null
  displayedReaction: string
  displayedReactionPresentationId: number
  reactionElapsedSeconds: number
  currentAstronautClip: string
  displayedPassSequence: number
  passElapsedSeconds: number
  displayedNotice: string
  displayedNoticeSequence: number
  noticeElapsedSeconds: number
  noticeIsCoin: boolean
}

let actors: SeatActors[] = []
let sitElapsedSeconds = 0
let sitStarted = false
let seated = false
let takeoverSeatId: SeatId | null = null

function astronautStates() {
  return [
    { clip: 'AST_IDLE_SEATED', playing: false, loop: true, weight: 0 },
    { clip: 'AST_SIT_DOWN', playing: false, loop: false, weight: 0 },
    { clip: 'AST_IDLE_STANDING', playing: true, loop: true, weight: 1 },
    { clip: 'AST_TAKEOVER', playing: false, loop: false, weight: 0 },
    { clip: 'AST_HOLD_SAFE', playing: false, loop: true, weight: 0 },
    { clip: 'AST_PASS', playing: false, loop: false, weight: 0 },
    ...AVAILABLE_RUNNING_CLIPS.map((clip) => ({ clip, playing: false, loop: true, weight: 0 }))
  ]
}

function seatAnchor(index: number) {
  const angle = (Math.PI * 2 * index) / 8 + RING_OFFSET_RADIANS
  const position = Vector3.create(
    ARENA_CENTER.x + Math.sin(angle) * SEAT_RADIUS,
    ARENA_CENTER.y,
    ARENA_CENTER.z + Math.cos(angle) * SEAT_RADIUS
  )

  return {
    position,
    rotation: Quaternion.multiply(Quaternion.fromLookAt(position, ARENA_CENTER), LOCAL_ROTATION_OFFSET)
  }
}

function addNameBackground(parent: Entity): Entity {
  const background = engine.addEntity()
  Transform.create(background, {
    parent,
    position: Vector3.create(0, 0, 0.035),
    scale: Vector3.create(4.875, 1.175, 1)
  })
  MeshRenderer.setPlane(background)
  Material.setBasicMaterial(background, {
    texture: Material.Texture.Common({ src: 'assets/Images/ui/az_ui_nameplate_pill_v001.png' }),
    diffuseColor: Color4.White(),
    alphaTest: 0.02
  })
  return background
}

function nameplateWidth(text: string): number {
  return Math.min(7.75, Math.max(3.125, (1.15 + text.length * 0.34) * 1.25))
}

function reactionTexture(value: string): string {
  if (value === 'HA!') return 'assets/Images/ui/reactions/az_ui_reaction_laugh_v001.png'
  if (value === 'NO!') return 'assets/Images/ui/reactions/az_ui_reaction_sad_v001.png'
  return 'assets/Images/ui/reactions/az_ui_reaction_alien_v001.png'
}

function setReactionMaterial(entity: Entity, src: string, opacity: number): void {
  const alphaSrc = src.replace('_v001.png', '_alpha_v001.png')
  Material.setBasicMaterial(entity, {
    texture: Material.Texture.Common({ src }),
    alphaTexture: Material.Texture.Common({ src: alphaSrc }),
    diffuseColor: Color4.create(1, 1, 1, opacity),
    alphaTest: 0.02,
    castShadows: false
  })
}

export function getSeatWorldPosition(seatId: SeatId): Vector3 {
  const runner = getUiState().arena?.players[seatId]
  if (runner && runner.invisibleUntil <= getUiState().snapshotServerNow) return Vector3.create(runner.x, 0, runner.z)
  const actor = actors.find((candidate) => candidate.seatId === seatId)
  const position = actor ? Transform.get(actor.astronaut).position : seatAnchor(seatId).position
  return Vector3.create(position.x, position.y, position.z)
}

export function getRenderedSeatPose(seatId: SeatId): { x: number; z: number; yaw: number } | null {
  const actor = actors.find((candidate) => candidate.seatId === seatId)
  if (!actor) return null
  return { ...actor.displayedPose }
}

export function createArenaActors(root: Entity, matchId: string): void {
  if (actors.length > 0) return
  const astronautVariants = astronautVariantsForMatch(matchId)

  actors = Array.from({ length: 8 }, (_, index) => {
    const seatId = index as SeatId
    const anchor = seatAnchor(index)

    const seat = engine.addEntity()
    Transform.create(seat, {
      parent: root,
      position: anchor.position,
      rotation: anchor.rotation,
      scale: SEAT_SCALE
    })
    GltfContainer.create(seat, {
      src: ASSET_PATHS.seat,
      visibleMeshesCollisionMask: 0,
      invisibleMeshesCollisionMask: 0
    })
    Animator.create(seat, { states: createSeatAnimationStates() })

    const astronaut = engine.addEntity()
    Transform.create(astronaut, {
      parent: root,
      position: anchor.position,
      rotation: anchor.rotation,
      scale: ASTRONAUT_SCALE
    })
    GltfContainer.create(astronaut, {
      src: astronautVariants[index] ?? ASSET_PATHS.astronaut,
      visibleMeshesCollisionMask: 0,
      invisibleMeshesCollisionMask: 0
    })
    Animator.create(astronaut, { states: astronautStates() })

    const nameLabel = engine.addEntity()
    Transform.create(nameLabel, {
      parent: root,
      position: Vector3.create(anchor.position.x, anchor.position.y + NAME_LABEL_HEIGHT, anchor.position.z),
      scale: NAME_LABEL_SCALE
    })
    Billboard.create(nameLabel, { billboardMode: BillboardMode.BM_ALL })
    const nameBackground = addNameBackground(nameLabel)
    TextShape.create(nameLabel, {
      text: `SEAT ${index + 1}`,
      fontSize: 10,
      textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
      width: 5,
      height: 0.8,
      textColor: Color4.White(),
      outlineColor: Color3.Black(),
      outlineWidth: 0.12
    })

    const reactionIcon = engine.addEntity()
    Transform.create(reactionIcon, {
      parent: root,
      position: Vector3.create(anchor.position.x, anchor.position.y + REACTION_ICON_HEIGHT, anchor.position.z),
      scale: HIDDEN_SCALE
    })
    Billboard.create(reactionIcon, { billboardMode: BillboardMode.BM_ALL })
    MeshRenderer.setPlane(reactionIcon)
    setReactionMaterial(reactionIcon, 'assets/Images/ui/reactions/az_ui_reaction_alien_v001.png', 0)

    const noticeLabel = engine.addEntity()
    Transform.create(noticeLabel, {
      parent: root,
      position: Vector3.create(anchor.position.x, anchor.position.y + NOTICE_LABEL_HEIGHT, anchor.position.z),
      scale: NOTICE_LABEL_SCALE
    })
    Billboard.create(noticeLabel, { billboardMode: BillboardMode.BM_ALL })
    TextShape.create(noticeLabel, {
      text: '',
      fontSize: 20,
      textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
      width: 7,
      height: 1.4,
      textColor: POINTS_NOTICE_COLOR,
      outlineColor: Color3.Black(),
      outlineWidth: 0.14
    })

    // Existing transparent reaction art is a temporary carrier marker until the alien GLB is delivered.
    const alienMarker = engine.addEntity()
    Transform.create(alienMarker, {
      parent: root,
      position: Vector3.create(anchor.position.x, 2.15, anchor.position.z),
      scale: HIDDEN_SCALE
    })
    Billboard.create(alienMarker, { billboardMode: BillboardMode.BM_ALL })
    MeshRenderer.setPlane(alienMarker)
    setReactionMaterial(alienMarker, 'assets/Images/ui/reactions/az_ui_reaction_alien_v001.png', 1)
    const alienTimer = engine.addEntity()
    Transform.create(alienTimer, { parent: root, position: Vector3.create(anchor.position.x, 2.52, anchor.position.z) })
    Billboard.create(alienTimer, { billboardMode: BillboardMode.BM_ALL })
    TextShape.create(alienTimer, {
      text: '',
      fontSize: 2,
      textColor: Color4.White(),
      outlineColor: Color3.Black(),
      outlineWidth: 0.15
    })

    return {
      seatId,
      seat,
      astronaut,
      nameLabel,
      nameBackground,
      reactionIcon,
      noticeLabel,
      alienMarker,
      alienTimer,
      wasConcealed: false,
      displayedPose: {
        x: anchor.position.x,
        z: anchor.position.z,
        yaw: (Math.PI * 2 * index) / 8 + RING_OFFSET_RADIANS + Math.PI
      },
      displayedName: '',
      displayedAsBot: null,
      displayedReaction: '',
      displayedReactionPresentationId: 0,
      reactionElapsedSeconds: REACTION_ANIMATION_SECONDS,
      currentAstronautClip: 'AST_IDLE_STANDING',
      displayedPassSequence: -1,
      passElapsedSeconds: PASS_CLIP_SECONDS,
      displayedNotice: '',
      displayedNoticeSequence: -1,
      noticeElapsedSeconds: NOTICE_ANIMATION_SECONDS,
      noticeIsCoin: false
    }
  })

  sitElapsedSeconds = 0
  sitStarted = false
  seated = false
  takeoverSeatId = null
}

function noticeColor(tone: UiSeatNotice['tone']): Color4 {
  if (tone === 'PENALTY') return PENALTY_NOTICE_COLOR
  if (tone === 'CARD') return CARD_NOTICE_COLOR
  return POINTS_NOTICE_COLOR
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function animateNotice(actor: SeatActors, deltaSeconds: number, tone: UiSeatNotice['tone']): void {
  actor.noticeElapsedSeconds = Math.min(
    NOTICE_ANIMATION_SECONDS,
    actor.noticeElapsedSeconds + Math.max(0, deltaSeconds)
  )
  const { visibility, scale, rise, height, outline } = noticeAnimation(actor.noticeElapsedSeconds, actor.noticeIsCoin)
  const transform = Transform.getMutable(actor.noticeLabel)
  transform.position.y = height + rise
  transform.scale = Vector3.create(
    NOTICE_LABEL_SCALE.x * scale,
    NOTICE_LABEL_SCALE.y * scale,
    NOTICE_LABEL_SCALE.z * scale
  )
  const color = actor.noticeIsCoin ? COIN_NOTICE_COLOR : noticeColor(tone)
  const label = TextShape.getMutable(actor.noticeLabel)
  label.textColor = Color4.create(color.r, color.g, color.b, visibility)
  label.outlineWidth = outline
}

function animateReaction(actor: SeatActors, deltaSeconds: number): void {
  actor.reactionElapsedSeconds = Math.min(
    REACTION_ANIMATION_SECONDS,
    actor.reactionElapsedSeconds + Math.max(0, deltaSeconds)
  )
  const elapsed = actor.reactionElapsedSeconds
  const enter = clamp01(elapsed / 0.18)
  const exit = clamp01((elapsed - 1.05) / (REACTION_ANIMATION_SECONDS - 1.05))
  const visibility = Math.min(enter, 1 - exit)
  const scale = 0.5 + visibility * 0.5
  const rise = clamp01(elapsed / REACTION_ANIMATION_SECONDS) * 0.12
  const transform = Transform.getMutable(actor.reactionIcon)
  transform.position.y = REACTION_ICON_HEIGHT + rise
  transform.scale =
    visibility <= 0
      ? HIDDEN_SCALE
      : Vector3.create(REACTION_ICON_SCALE.x * scale, REACTION_ICON_SCALE.y * scale, REACTION_ICON_SCALE.z * scale)
  Material.getFlatMutable(actor.reactionIcon).diffuseColor = Color4.create(1, 1, 1, visibility)
}

function updateActorLabels(
  deltaSeconds: number,
  seats: readonly UiSeatView[],
  reactions: readonly UiSeatReaction[],
  notices: readonly UiSeatNotice[]
): void {
  for (const actor of actors) {
    const seat = seats.find((candidate) => candidate.id === actor.seatId)
    const nextName = seat?.displayName?.trim() || `SEAT ${actor.seatId + 1}`
    const nextIsBot = seat?.isBot ?? true
    const reaction = reactions.find((candidate) => candidate.seatId === actor.seatId)
    if (nextName !== actor.displayedName || nextIsBot !== actor.displayedAsBot) {
      actor.displayedName = nextName
      actor.displayedAsBot = nextIsBot
      const label = TextShape.getMutable(actor.nameLabel)
      const visibleLabel = nextName.slice(0, 20)
      label.text = visibleLabel
      label.textColor = nextIsBot ? BOT_NAME_COLOR : HUMAN_NAME_COLOR
      const background = Transform.getMutable(actor.nameBackground)
      background.scale = Vector3.create(nameplateWidth(visibleLabel), 1.175, 1)
    }

    if (reaction && reaction.presentationId !== actor.displayedReactionPresentationId) {
      actor.displayedReaction = reaction.value
      actor.displayedReactionPresentationId = reaction.presentationId
      actor.reactionElapsedSeconds = 0
      setReactionMaterial(actor.reactionIcon, reactionTexture(reaction.value), 0)
    }
    animateReaction(actor, deltaSeconds)

    const activeNotices = notices
      .filter((candidate) => candidate.seatId === actor.seatId)
      .sort((a, b) => a.sequence - b.sequence)
    const activeNotice = activeNotices[activeNotices.length - 1]
    if (activeNotice && activeNotice.sequence !== actor.displayedNoticeSequence) {
      actor.displayedNoticeSequence = activeNotice.sequence
      actor.displayedNotice = activeNotice.text
      actor.noticeElapsedSeconds = 0
      actor.noticeIsCoin = activeNotice.source === 'COIN'
      TextShape.getMutable(actor.noticeLabel).text = activeNotice.text
    }
    const noticeTone = activeNotice?.tone ?? 'POINTS'
    animateNotice(actor, deltaSeconds, noticeTone)
    if (!activeNotice && actor.noticeElapsedSeconds >= NOTICE_ANIMATION_SECONDS && actor.displayedNotice !== '') {
      actor.displayedNotice = ''
      TextShape.getMutable(actor.noticeLabel).text = ''
    }
  }
}

export function clearArenaActors(): void {
  for (const actor of actors) {
    cancelAnimationBlend(actor.astronaut)
    clearAstronautMaterial(actor.astronaut)
    cancelAnimationBlend(actor.seat)
  }
  actors = []
  sitElapsedSeconds = 0
  sitStarted = false
  seated = false
  takeoverSeatId = null
}

function settleIntoSeats(deltaSeconds: number): void {
  if (seated) return
  sitElapsedSeconds += Math.max(0, deltaSeconds)
  if (!sitStarted) {
    if (sitElapsedSeconds < STANDING_PREVIEW_SECONDS) return
    sitStarted = true
    for (const actor of actors) {
      blendToAnimation(actor.astronaut, actor.currentAstronautClip, 'AST_SIT_DOWN', SIT_ENTER_BLEND_SECONDS)
      actor.currentAstronautClip = 'AST_SIT_DOWN'
    }
  }
  if (sitElapsedSeconds < STANDING_PREVIEW_SECONDS + SIT_DOWN_CLIP_SECONDS - SIT_SETTLE_OVERLAP_SECONDS) return

  seated = true
  for (const actor of actors) {
    blendToAnimation(actor.astronaut, 'AST_SIT_DOWN', 'AST_IDLE_SEATED', SIT_SETTLE_BLEND_SECONDS)
    actor.currentAstronautClip = 'AST_IDLE_SEATED'
  }
}

function baselineClip(actor: SeatActors, seats: readonly UiSeatView[]): string {
  return seats.find((seat) => seat.id === actor.seatId)?.isHolder ? 'AST_HOLD_SAFE' : 'AST_IDLE_SEATED'
}

function updateTakeover(victimSeatId: SeatId | null, seats: readonly UiSeatView[]): void {
  if (victimSeatId === takeoverSeatId) return

  if (takeoverSeatId !== null) {
    const previous = actors.find((actor) => actor.seatId === takeoverSeatId)
    if (previous) {
      const nextClip = baselineClip(previous, seats)
      blendToAnimation(previous.astronaut, previous.currentAstronautClip, nextClip, TAKEOVER_EXIT_BLEND_SECONDS)
      previous.currentAstronautClip = nextClip
      if (!getUiState().arena)
        blendToAnimation(previous.seat, 'SEAT_TAKEOVER_RECLINE', 'SEAT_IDLE', SEAT_TAKEOVER_EXIT_BLEND_SECONDS)
    }
  }

  takeoverSeatId = victimSeatId
  if (victimSeatId === null) return

  const next = actors.find((actor) => actor.seatId === victimSeatId)
  if (!next) return
  blendToAnimation(next.astronaut, next.currentAstronautClip, 'AST_TAKEOVER', TAKEOVER_ENTER_BLEND_SECONDS)
  next.currentAstronautClip = 'AST_TAKEOVER'
  next.passElapsedSeconds = PASS_CLIP_SECONDS
  if (!getUiState().arena)
    blendToAnimation(next.seat, 'SEAT_IDLE', 'SEAT_TAKEOVER_RECLINE', SEAT_TAKEOVER_ENTER_BLEND_SECONDS)
}

function updateRunningActors(deltaSeconds: number, phase: MatchPhase): void {
  const state = getUiState()
  if (!state.arena || !['HOLDING', 'TAKEOVER'].includes(phase)) return
  const now = state.snapshotServerNow + Math.max(0, Date.now() - state.snapshotReceivedAtMs) / 1000
  for (const actor of actors) {
    const authoritativePlayer = state.arena.players[actor.seatId]
    if (!authoritativePlayer) continue
    const player =
      phase === 'HOLDING'
        ? projectChasePlayer(
            authoritativePlayer,
            state.arena.motion?.find((input) => input.seatId === actor.seatId),
            state.snapshotServerNow,
            Math.max(0, now - state.snapshotServerNow)
          )
        : authoritativePlayer
    const seat = state.seats.find((candidate) => candidate.id === actor.seatId)
    const localPlayer = state.localSeatId === null ? undefined : state.arena.players[state.localSeatId]
    const reveals = (localPlayer?.vaccinatedUntil ?? 0) > state.snapshotServerNow
    const invisible =
      phase === 'HOLDING' && player.invisibleUntil > state.snapshotServerNow && (!reveals || !!seat?.isLocal)
    const visible = !invisible || !!seat?.isLocal
    if (phase !== 'HOLDING') clearAstronautMaterial(actor.astronaut)
    else
      updateAstronautMaterial(
        actor.astronaut,
        {
          frozen: player.frozenUntil > now,
          invisible,
          local: !!seat?.isLocal
        },
        deltaSeconds
      )
    for (const entity of [
      actor.astronaut,
      actor.nameLabel,
      actor.nameBackground,
      actor.reactionIcon,
      actor.noticeLabel,
      actor.alienMarker,
      actor.alienTimer
    ])
      if (VisibilityComponent.getOrNull(entity)?.visible !== visible)
        VisibilityComponent.createOrReplace(entity, { visible })
    if (!visible) {
      actor.wasConcealed = true
      continue
    }
    const transform = Transform.getMutable(actor.astronaut)
    actor.displayedPose = smoothChasePose(
      actor.displayedPose,
      player,
      deltaSeconds,
      phase === 'TAKEOVER' || actor.wasConcealed
    )
    actor.wasConcealed = false
    transform.position.x = actor.displayedPose.x
    transform.position.z = actor.displayedPose.z
    transform.rotation = Quaternion.fromEulerDegrees(0, (actor.displayedPose.yaw * 180) / Math.PI, 0)
    for (const entity of [
      actor.nameLabel,
      actor.reactionIcon,
      actor.noticeLabel,
      actor.alienMarker,
      actor.alienTimer
    ]) {
      const label = Transform.getMutable(entity)
      label.position.x = transform.position.x
      label.position.z = transform.position.z
    }
    const held = state.aliens.find((alien) => alien.holderSeatId === actor.seatId)
    Transform.getMutable(actor.alienMarker).scale = held ? Vector3.create(0.48, 0.48, 0.48) : HIDDEN_SCALE
    TextShape.getMutable(actor.alienTimer).text = !held
      ? ''
      : state.preciseFuseHidden
        ? '?'
        : `${Math.max(0, Math.ceil(state.fuseRemainingSeconds - (now - state.snapshotServerNow)))}`
    if (phase === 'TAKEOVER' && actor.seatId === state.takeoverVictimSeatId) continue
    const animation = runningAnimation(
      locomotionFor(player, !!held, now),
      AVAILABLE_RUNNING_CLIPS,
      !!held,
      chaseSpeedMultiplier(player, now)
    )
    if (actor.currentAstronautClip !== animation.clip) {
      blendToAnimation(actor.astronaut, actor.currentAstronautClip, animation.clip, 0.45)
      actor.currentAstronautClip = animation.clip
    }
    const currentClip = Animator.get(actor.astronaut).states.find((clip) => clip.clip === animation.clip)
    const clip = currentClip?.speed !== animation.speed ? Animator.getClipOrNull(actor.astronaut, animation.clip) : null
    if (clip && clip.speed !== animation.speed) clip.speed = animation.speed
  }
}

function updateGameplayAnimations(
  deltaSeconds: number,
  phase: MatchPhase,
  seats: readonly UiSeatView[],
  passCues: readonly UiSeatPassCue[]
): void {
  if (!seated) return

  for (const actor of actors) {
    if (phase === 'TAKEOVER' && actor.seatId === takeoverSeatId) continue

    const latestPass = passCues.filter((cue) => cue.seatId === actor.seatId).sort((a, b) => b.sequence - a.sequence)[0]
    if (latestPass && latestPass.sequence > actor.displayedPassSequence) {
      actor.displayedPassSequence = latestPass.sequence
      blendToAnimation(actor.astronaut, actor.currentAstronautClip, 'AST_PASS', PASS_ENTER_BLEND_SECONDS)
      actor.currentAstronautClip = 'AST_PASS'
      actor.passElapsedSeconds = 0
    }

    if (actor.currentAstronautClip === 'AST_PASS') {
      actor.passElapsedSeconds += Math.max(0, deltaSeconds)
      if (actor.passElapsedSeconds < PASS_CLIP_SECONDS - PASS_EXIT_BLEND_SECONDS) continue
      const nextClip = baselineClip(actor, seats)
      blendToAnimation(actor.astronaut, 'AST_PASS', nextClip, PASS_EXIT_BLEND_SECONDS)
      actor.currentAstronautClip = nextClip
      continue
    }

    if (phase !== 'HOLDING') continue
    const nextClip = baselineClip(actor, seats)
    if (nextClip === actor.currentAstronautClip) continue
    blendToAnimation(actor.astronaut, actor.currentAstronautClip, nextClip, HOLD_BLEND_SECONDS)
    actor.currentAstronautClip = nextClip
  }
}

export function updateArenaActors(
  deltaSeconds: number,
  phase: MatchPhase,
  victimSeatId: SeatId | null,
  seats: readonly UiSeatView[],
  reactions: readonly UiSeatReaction[],
  notices: readonly UiSeatNotice[],
  passCues: readonly UiSeatPassCue[]
): void {
  if (actors.length === 0) return
  updateActorLabels(deltaSeconds, seats, reactions, notices)
  // Load actors during the covered countdown, but show the full intro afterward.
  if (phase === 'COUNTDOWN') return
  settleIntoSeats(deltaSeconds)
  updateTakeover(phase === 'TAKEOVER' ? victimSeatId : null, seats)
  if (getUiState().arena && ['HOLDING', 'TAKEOVER'].includes(phase)) {
    updateRunningActors(deltaSeconds, phase)
    return
  }
  updateGameplayAnimations(deltaSeconds, phase, seats, passCues)
}

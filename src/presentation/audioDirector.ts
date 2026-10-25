import {
  AssetLoad,
  AudioSource,
  MediaState,
  Transform,
  assetLoadLoadingStateSystem,
  audioEventsSystem,
  engine,
  type Entity
} from '@dcl/sdk/ecs'

import { AUDIO_CONFIG } from '../config/audioConfig'
import type { MatchPhase } from '../game/model/types'
import { ASSET_PATHS, ASTRONAUT_VARIANT_PATHS } from './assetManifest'
import { musicCueForPhase, type MusicCue } from './musicCue'

interface MusicTrack {
  entity: Entity
  assetPath: string
  maximumVolume: number
  currentVolume: number
}

let musicTracks: Record<MusicCue, MusicTrack> | null = null
let desiredCue: MusicCue = 'LOBBY'
let receivedUserGesture = false
let initialized = false
let uiAudioEntities: Record<'highlight' | 'press' | 'menu', Entity> | null = null

function registerAudioDiagnostics(entity: Entity, label: string): void {
  audioEventsSystem.registerAudioEventsEntity(entity, (event) => {
    if (event.state === MediaState.MS_ERROR) console.error(`[AUDIO] ${label} could not be decoded or loaded`)
    else if (event.state === MediaState.MS_PLAYING) console.log(`[AUDIO] Playing: ${label}`)
  })
}

function preloadRuntimeAssets(): void {
  const entity = engine.addEntity()
  AssetLoad.create(entity, {
    assets: [
      AUDIO_CONFIG.lobbyMusic.assetPath,
      AUDIO_CONFIG.matchMusic.assetPath,
      AUDIO_CONFIG.ui.highlight,
      AUDIO_CONFIG.ui.press,
      AUDIO_CONFIG.ui.menu,
      ...ASTRONAUT_VARIANT_PATHS,
      ASSET_PATHS.seat
    ]
  })
  assetLoadLoadingStateSystem.registerAssetLoadLoadingStateEntity(entity, (event) => {
    if (event.currentState === 2 || event.currentState === 3) {
      console.error(`[ASSET] Failed to preload ${event.asset}`)
    }
  })
}

function requireTrack(cue: MusicCue): MusicTrack {
  if (musicTracks === null) throw new Error('Audio director has not been initialized')
  return musicTracks[cue]
}

function createMusicTrack(assetPath: string, maximumVolume: number): MusicTrack {
  const entity = engine.addEntity()
  // Explorer requires a Transform to instantiate AudioSource, including global audio.
  Transform.create(entity, { position: { x: 16, y: 1, z: 16 } })
  AudioSource.create(entity, {
    audioClipUrl: assetPath,
    playing: false,
    loop: true,
    volume: 0,
    global: true
  })
  registerAudioDiagnostics(entity, assetPath)

  return { entity, assetPath, maximumVolume, currentVolume: 0 }
}

function startTrack(track: MusicTrack) {
  const source = AudioSource.getMutable(track.entity)
  track.currentVolume = 0
  source.volume = 0
  source.loop = true
  source.global = true
  AudioSource.playSound(track.entity, track.assetPath, true)
}

function fadeVolume(current: number, target: number, maximumVolume: number, deltaSeconds: number): number {
  const duration = Math.max(AUDIO_CONFIG.musicFadeSeconds, 0.01)
  const step = (maximumVolume * Math.min(Math.max(deltaSeconds, 0), 0.25)) / duration

  if (current < target) return Math.min(target, current + step)
  return Math.max(target, current - step)
}

function updateMusicFades(deltaSeconds: number) {
  if (musicTracks === null) return

  for (const cue of ['LOBBY', 'MATCH'] as const) {
    const track = musicTracks[cue]
    const targetVolume = cue === desiredCue ? track.maximumVolume : 0
    const nextVolume = fadeVolume(track.currentVolume, targetVolume, track.maximumVolume, deltaSeconds)

    if (Math.abs(nextVolume - track.currentVolume) > 0.0001) {
      track.currentVolume = nextVolume
      AudioSource.getMutable(track.entity).volume = nextVolume
    }

    if (cue !== desiredCue && nextVolume <= 0.0001) {
      const source = AudioSource.getMutable(track.entity)
      if (source.playing) AudioSource.stopSound(track.entity, false)
    }
  }
}

export function setupAudioDirector() {
  if (initialized) return
  initialized = true
  preloadRuntimeAssets()
  musicTracks = {
    LOBBY: createMusicTrack(AUDIO_CONFIG.lobbyMusic.assetPath, AUDIO_CONFIG.lobbyMusic.volume),
    MATCH: createMusicTrack(AUDIO_CONFIG.matchMusic.assetPath, AUDIO_CONFIG.matchMusic.volume)
  }
  uiAudioEntities = {
    highlight: createUiSound(AUDIO_CONFIG.ui.highlight),
    press: createUiSound(AUDIO_CONFIG.ui.press),
    menu: createUiSound(AUDIO_CONFIG.ui.menu)
  }

  startTrack(requireTrack(desiredCue))
  engine.addSystem(updateMusicFades)
}

function createUiSound(assetPath: string): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: { x: 16, y: 1, z: 16 } })
  AudioSource.create(entity, {
    audioClipUrl: assetPath,
    playing: false,
    loop: false,
    volume: AUDIO_CONFIG.ui.volume,
    global: true
  })
  registerAudioDiagnostics(entity, assetPath)
  return entity
}

export function playUiSound(cue: 'highlight' | 'press' | 'menu') {
  if (cue !== 'highlight') notifyAudioUserGesture()
  const entity = uiAudioEntities?.[cue]
  if (entity === undefined) return
  AudioSource.playSound(entity, AudioSource.get(entity).audioClipUrl, true)
}

export function setMusicCueForPhase(phase: MatchPhase) {
  const nextCue = musicCueForPhase(phase)
  if (!initialized || nextCue === desiredCue) return

  // Until a separate match track is supplied, preserve the same loop across
  // menu/gameplay transitions instead of restarting two copies of the file.
  const previousTrack = requireTrack(desiredCue)
  const nextTrack = requireTrack(nextCue)
  if (musicTracks && previousTrack.assetPath === nextTrack.assetPath) {
    musicTracks[desiredCue] = nextTrack
    musicTracks[nextCue] = previousTrack
    desiredCue = nextCue
    return
  }
  desiredCue = nextCue
  startTrack(requireTrack(desiredCue))
}

// The first game interaction retries the local clip for browsers with autoplay
// restrictions. Native Explorer clients simply receive an inaudible-safe restart.
export function notifyAudioUserGesture() {
  if (!initialized || receivedUserGesture) return
  receivedUserGesture = true
  startTrack(requireTrack(desiredCue))
}

export function restartCurrentMusic() {
  if (!initialized) return
  startTrack(requireTrack(desiredCue))
}

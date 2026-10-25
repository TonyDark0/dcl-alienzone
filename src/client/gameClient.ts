import { engine } from '@dcl/sdk/ecs'
import { getPlayer } from '@dcl/sdk/src/players'

import type { AlienId, CardCategory } from '../game/model/types'
import type { MatchSnapshot } from '../game/runtime/matchEngine'
import { notifyAudioUserGesture } from '../presentation/audioDirector'
import { room } from '../shared/messages'
import { ServerStatus } from '../shared/schemas'
import { syncMatchStateToUi } from '../ui/adapters/localMatchUiAdapter'
import { getUiState, updateUiState, type UiLeaderboardEntry } from '../ui/state/uiState'

let sequence = 0
let roomReady = false
let joinSent = false
let lastHeartbeatValue = 0
let lastHeartbeatSeenAt = 0
let nextClientHeartbeatAt = 0
let localReactionPresentationId = 0
let serverWasAlive = false

const HEARTBEAT_FRESHNESS_MS = 7_000

function actionId(prefix: string): string {
  sequence += 1
  return `${prefix}-${sequence}`
}

function envelope(prefix: string) {
  const state = getUiState()
  return { clientActionId: actionId(prefix), matchId: state.matchId, round: state.round }
}

function parseLeaderboard(payload: string): UiLeaderboardEntry[] {
  const parsed = JSON.parse(payload) as unknown
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .filter(
      (entry) =>
        typeof entry.displayName === 'string' && typeof entry.bestHeat === 'number' && typeof entry.wins === 'number'
    )
    .map((entry) => ({
      displayName: String(entry.displayName).slice(0, 24),
      bestHeat: Number(entry.bestHeat),
      wins: Number(entry.wins)
    }))
    .slice(0, 10)
}

export function setupGameClient() {
  updateUiState({ phase: 'BOOT', announcement: 'WAKING CONTAINMENT SERVER', leaderboardLoading: true })

  room.onMessage('matchSnapshot', (data) => {
    try {
      syncMatchStateToUi(JSON.parse(data.payload) as MatchSnapshot)
    } catch {
      updateUiState({ phase: 'BOOT', announcement: 'INVALID SERVER SNAPSHOT' })
    }
  })
  room.onMessage('actionResult', (data) => {
    if (data.accepted) updateUiState({ lastActionError: null, passPending: false })
    else updateUiState({ lastActionError: data.reason, announcement: data.reason, passPending: false })
  })
  room.onMessage('leaderboardSnapshot', (data) => {
    try {
      updateUiState({ leaderboard: parseLeaderboard(data.payload), leaderboardLoading: false })
    } catch {
      updateUiState({ leaderboard: [], leaderboardLoading: false })
    }
  })
  room.onReady((ready) => {
    roomReady = ready
    if (!ready) {
      joinSent = false
      updateUiState({ phase: 'BOOT', announcement: 'RECONNECTING TO DCL MULTIPLAYER' })
    }
  })

  engine.addSystem(() => {
    for (const [, status] of engine.getEntitiesWith(ServerStatus)) {
      if (status.heartbeatAt !== lastHeartbeatValue) {
        lastHeartbeatValue = status.heartbeatAt
        lastHeartbeatSeenAt = Date.now()
      }
      break
    }
    const serverAlive = lastHeartbeatSeenAt > 0 && Date.now() - lastHeartbeatSeenAt <= HEARTBEAT_FRESHNESS_MS
    if (!serverAlive) {
      if (serverWasAlive) {
        serverWasAlive = false
        joinSent = false
        updateUiState({
          phase: 'BOOT',
          announcement: 'RECONNECTING TO DCL MULTIPLAYER',
          passPending: false,
          lastActionError: null
        })
      }
      return
    }
    if (!serverWasAlive) {
      serverWasAlive = true
      joinSent = false
    }
    if (!roomReady) return
    if (!joinSent) {
      joinSent = true
      const player = getPlayer()
      void room.send('requestJoin', { displayName: player?.name ?? 'PLAYER' })
      void room.send('requestLeaderboard', { requestId: actionId('leaderboard') })
    }
    if (Date.now() >= nextClientHeartbeatAt) {
      nextClientHeartbeatAt = Date.now() + 5_000
      void room.send('clientHeartbeat', { requestId: actionId('heartbeat') })
    }
  })
}

export function requestReady() {
  notifyAudioUserGesture()
  void room.send('requestReady', envelope('ready'))
}

export function requestRematch() {
  notifyAudioUserGesture()
  void room.send('requestRematch', envelope('rematch'))
}

export function requestReturnToLobby() {
  notifyAudioUserGesture()
  void room.send('requestReturnToLobby', envelope('return-lobby'))
}

export function requestLeaderboard() {
  void room.send('requestLeaderboard', { requestId: actionId('leaderboard') })
}

export function requestPass() {
  notifyAudioUserGesture()
  const state = getUiState()
  const alien = state.heldAlien
  if (!alien || !state.canLocalPass || state.passPending) return
  updateUiState({ passPending: true })
  void room.send('requestPass', { ...envelope('pass'), alienId: alien.id, turn: alien.turn })
}

export function requestEquipCard(cardId: string | null, category: CardCategory, targetSeatId?: number) {
  notifyAudioUserGesture()
  void room.send('equipCard', { ...envelope('equip'), cardId: cardId ?? '', category, targetSeatId })
}

export function requestActivateCard(cardId: string, alienId: AlienId = 'ORIGINAL') {
  notifyAudioUserGesture()
  void room.send('activateCard', { ...envelope('activate'), cardId, alienId })
}

export function sendReaction(value: string) {
  notifyAudioUserGesture()
  const state = getUiState()
  if (state.localSeatId !== null) {
    localReactionPresentationId += 1
    const optimisticReaction = {
      seatId: state.localSeatId,
      value,
      until: 0,
      presentationId: localReactionPresentationId,
      optimisticUntilMs: Date.now() + 1_500
    }
    updateUiState({
      seatReactions: [
        ...state.seatReactions.filter((reaction) => reaction.seatId !== state.localSeatId),
        optimisticReaction
      ]
    })
  }
  void room.send('reaction', { value })
}

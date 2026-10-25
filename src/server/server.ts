import { engine } from '@dcl/sdk/ecs'
import { syncEntity } from '@dcl/sdk/network'
import { AUTH_SERVER_PEER_ID } from '@dcl/sdk/network/message-bus-sync'

import type { AlienId, CardCategory, SeatId } from '../game/model/types'
import { MatchEngine, type ActionResult } from '../game/runtime/matchEngine'
import { room } from '../shared/messages'
import { ServerStatus } from '../shared/schemas'
import { ActionGate, type ActionEnvelope } from './actionGate'
import { isSeatWinner, mergeLeaderboardResult } from './leaderboard'
import { loadLeaderboard, saveLeaderboard, type LeaderboardEntry } from './persistence'

const HEARTBEAT_MS = 2_000
const SNAPSHOT_MS = 200
const CLIENT_GRACE_MS = 15_000

let game: MatchEngine
let matchNumber = 0
let lastTickAt = 0
let nextHeartbeatAt = 0
let nextSnapshotAt = 0
let leaderboard: LeaderboardEntry[] = []
let persistedMatchId = ''
let saveInFlight = false
let retrySaveAt = 0

const clients = new Map<string, { displayName: string; seenAt: number; playing: boolean }>()
const actionGate = new ActionGate()

function normalizeName(value: string): string {
  return value.trim().slice(0, 24) || 'PLAYER'
}

function createGame() {
  const seed = (Date.now() + ++matchNumber * 104729) >>> 0
  game = new MatchEngine(seed, `alienzone-${Date.now()}-${matchNumber}`)
  actionGate.clear()
  for (const [playerId, client] of clients) {
    if (client.playing && Date.now() - client.seenAt <= CLIENT_GRACE_MS) game.join(playerId, client.displayName)
  }
}

function advanceToNow() {
  const now = Date.now()
  game.advance(Math.max(0, now - lastTickAt) / 1000)
  lastTickAt = now
}

function sendSnapshot(to: string[] = [...clients.keys()]) {
  for (const playerId of to) {
    const seat = game.state.seats.find((candidate) => candidate.playerId === playerId)
    const snapshot = game.snapshot(seat?.id ?? null)
    snapshot.events = snapshot.events.slice(-16)
    void room.send('matchSnapshot', { payload: JSON.stringify(snapshot) }, { to: [playerId] })
  }
}

function sendLeaderboard(to: string[] = [...clients.keys()]) {
  if (to.length > 0) void room.send('leaderboardSnapshot', { payload: JSON.stringify(leaderboard) }, { to })
}

function sendActionResult(playerId: string, clientActionId: string, result: ActionResult) {
  void room.send(
    'actionResult',
    { clientActionId, accepted: result.accepted, reason: result.reason },
    { to: [playerId] }
  )
}

function runPlayerAction(from: string | undefined, envelope: ActionEnvelope, apply: (seatId: SeatId) => ActionResult) {
  if (!from) return
  advanceToNow()
  const playerId = from.toLowerCase()
  const client = clients.get(playerId)
  if (client) client.seenAt = Date.now()
  const seat = game.state.seats.find((candidate) => candidate.playerId === playerId && !candidate.isBot)
  const result = actionGate.run(playerId, envelope, game.state.matchId, game.state.round, seat?.id ?? null, apply)
  sendActionResult(playerId, envelope.clientActionId, result)
  sendSnapshot([playerId])
}

function persistMatchResult() {
  if (
    game.state.phase !== 'MATCH_RESULT' ||
    persistedMatchId === game.state.matchId ||
    saveInFlight ||
    Date.now() < retrySaveAt
  ) {
    return
  }

  const matchId = game.state.matchId
  let nextLeaderboard = leaderboard
  for (const seat of game.state.seats) {
    if (!seat.playerId) continue
    nextLeaderboard = mergeLeaderboardResult(nextLeaderboard, {
      playerId: seat.playerId,
      displayName: seat.displayName,
      heat: seat.heat,
      won: isSeatWinner(game.state.seats, seat.id)
    })
  }

  saveInFlight = true
  void saveLeaderboard(nextLeaderboard)
    .then((saved) => {
      if (!saved) {
        retrySaveAt = Date.now() + 2_000
        console.error('[SERVER] Leaderboard save failed; retry scheduled')
        return
      }
      leaderboard = nextLeaderboard
      persistedMatchId = matchId
      sendLeaderboard()
    })
    .catch(() => {
      retrySaveAt = Date.now() + 2_000
    })
    .finally(() => {
      saveInFlight = false
    })
}

export async function setupServer() {
  leaderboard = await loadLeaderboard()
  createGame()
  lastTickAt = Date.now()

  const statusEntity = engine.addEntity()
  ServerStatus.create(statusEntity, { heartbeatAt: lastTickAt, revision: 2 })
  ServerStatus.validateBeforeChange((value) => value.senderAddress.toLowerCase() === AUTH_SERVER_PEER_ID.toLowerCase())
  syncEntity(statusEntity, [ServerStatus.componentId], 1)

  room.onMessage('requestJoin', (data, context) => {
    if (!context) return
    advanceToNow()
    const playerId = context.from.toLowerCase()
    const displayName = normalizeName(data.displayName)
    const playing = clients.get(playerId)?.playing ?? false
    clients.set(playerId, { displayName, seenAt: Date.now(), playing })
    if (playing) game.join(playerId, displayName)
    sendSnapshot([playerId])
    sendLeaderboard([playerId])
  })

  room.onMessage('clientHeartbeat', (_data, context) => {
    if (!context) return
    const playerId = context.from.toLowerCase()
    const client = clients.get(playerId)
    if (!client) return
    client.seenAt = Date.now()
    if (client.playing) game.join(playerId, client.displayName)
  })

  room.onMessage('requestReady', (data, context) => {
    if (!context) return
    const client = clients.get(context.from.toLowerCase())
    if (
      client &&
      data.matchId === game.state.matchId &&
      data.round === game.state.round &&
      ['LOBBY', 'COUNTDOWN'].includes(game.state.phase)
    ) {
      const joined = game.join(context.from.toLowerCase(), client.displayName)
      if (joined !== null) client.playing = true
    }
    runPlayerAction(context.from, data, () =>
      game.state.phase === 'COUNTDOWN' ? { accepted: true, reason: '' } : game.ready()
    )
  })

  room.onMessage('requestRematch', (data, context) => {
    runPlayerAction(context?.from, data, () => {
      if (game.state.phase !== 'MATCH_RESULT') {
        return { accepted: false, reason: 'The match is not over yet.' }
      }
      if (persistedMatchId !== game.state.matchId) {
        return { accepted: false, reason: 'Saving results. Try again in a moment.' }
      }
      createGame()
      return game.ready()
    })
  })

  room.onMessage('requestReturnToLobby', (data, context) => {
    runPlayerAction(context?.from, data, () => {
      if (game.state.phase !== 'MATCH_RESULT') {
        return { accepted: false, reason: 'The match is not over yet.' }
      }
      if (persistedMatchId !== game.state.matchId) {
        return { accepted: false, reason: 'Saving results. Try again in a moment.' }
      }
      for (const client of clients.values()) client.playing = false
      createGame()
      return { accepted: true, reason: '' }
    })
  })

  room.onMessage('requestPass', (data, context) => {
    runPlayerAction(context?.from, data, (seatId) => game.pass(seatId, data.alienId as AlienId, data.turn))
  })

  room.onMessage('equipCard', (data, context) => {
    runPlayerAction(context?.from, data, (seatId) => {
      if (data.category !== 'REACTION' && data.category !== 'INTERVENTION') {
        return { accepted: false, reason: 'Invalid card category.' }
      }
      return game.equip(seatId, data.cardId || null, data.category as CardCategory, data.targetSeatId)
    })
  })

  room.onMessage('activateCard', (data, context) => {
    runPlayerAction(context?.from, data, (seatId) => game.activate(seatId, data.cardId, data.alienId as AlienId))
  })

  room.onMessage('reaction', (data, context) => {
    if (!context || !['PASS!', 'NO!', 'HA!'].includes(data.value)) return
    const seat = game.state.seats.find((candidate) => candidate.playerId === context.from.toLowerCase())
    if (!seat) return
    advanceToNow()
    game.react(seat.id, data.value)
    sendSnapshot()
  })

  room.onMessage('requestLeaderboard', (_data, context) => {
    if (context) sendLeaderboard([context.from.toLowerCase()])
  })

  engine.addSystem(() => {
    advanceToNow()
    const now = Date.now()
    for (const [playerId, client] of clients) {
      if (now - client.seenAt > CLIENT_GRACE_MS) game.disconnect(playerId)
      if (now - client.seenAt > 120_000) clients.delete(playerId)
    }
    persistMatchResult()
    if (now >= nextHeartbeatAt) {
      nextHeartbeatAt = now + HEARTBEAT_MS
      ServerStatus.getMutable(statusEntity).heartbeatAt = now
    }
    if (now >= nextSnapshotAt) {
      nextSnapshotAt = now + SNAPSHOT_MS
      sendSnapshot()
    }
  })

  console.log('[SERVER] DCL Alienzone multiplayer engine ready: independent seats, bots, cards and ECHO')
}

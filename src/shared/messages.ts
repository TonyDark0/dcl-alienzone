import { Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

const action = {
  clientActionId: Schemas.String,
  matchId: Schemas.String,
  round: Schemas.Int
}

export const room = registerMessages({
  requestJoin: Schemas.Map({ displayName: Schemas.String }),
  clientHeartbeat: Schemas.Map({ requestId: Schemas.String }),
  requestReady: Schemas.Map({ ...action, loadout: Schemas.Optional(Schemas.Array(Schemas.Array(Schemas.String))) }),
  requestRematch: Schemas.Map(action),
  requestReturnToLobby: Schemas.Map(action),
  requestPass: Schemas.Map({ ...action, alienId: Schemas.String, turn: Schemas.Int }),
  moveIntent: Schemas.Map({
    matchId: Schemas.String,
    round: Schemas.Int,
    sequence: Schemas.Int,
    forward: Schemas.Float,
    aimYaw: Schemas.Float
  }),
  orderDeck: Schemas.Map({ ...action, cardIds: Schemas.Array(Schemas.String) }),
  chooseCardTarget: Schemas.Map({ ...action, cardId: Schemas.String, targetSeatId: Schemas.Int }),
  containmentTap: Schemas.Map({ ...action, challengeId: Schemas.String, targetIndex: Schemas.Int }),
  equipCard: Schemas.Map({
    ...action,
    cardId: Schemas.String,
    category: Schemas.String,
    targetSeatId: Schemas.Optional(Schemas.Int)
  }),
  activateCard: Schemas.Map({ ...action, cardId: Schemas.String, alienId: Schemas.String }),
  actionResult: Schemas.Map({
    clientActionId: Schemas.String,
    accepted: Schemas.Boolean,
    reason: Schemas.String
  }),
  reaction: Schemas.Map({ value: Schemas.String }),
  requestLeaderboard: Schemas.Map({ requestId: Schemas.String }),
  matchSnapshot: Schemas.Map({ payload: Schemas.String }),
  leaderboardSnapshot: Schemas.Map({ payload: Schemas.String }),
  serverNotice: Schemas.Map({ code: Schemas.String, message: Schemas.String })
})

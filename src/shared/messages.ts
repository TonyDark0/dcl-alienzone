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
  requestReady: Schemas.Map(action),
  requestRematch: Schemas.Map(action),
  requestReturnToLobby: Schemas.Map(action),
  requestPass: Schemas.Map({ ...action, alienId: Schemas.String, turn: Schemas.Int }),
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

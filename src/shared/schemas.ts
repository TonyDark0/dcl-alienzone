import { engine, Schemas } from '@dcl/sdk/ecs'

export const ServerStatus = engine.defineComponent('alienzone::ServerStatus', {
  heartbeatAt: Schemas.Int64,
  revision: Schemas.Int
})

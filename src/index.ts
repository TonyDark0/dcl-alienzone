import { executeTask } from '@dcl/sdk/ecs'
import { isServer } from '@dcl/sdk/network'

// Message schemas and synced components must exist before the engine seals.
import './shared/messages'
import './shared/schemas'

export function main() {
  executeTask(async () => {
    if (isServer()) {
      const { setupServer } = await import('./server/server')
      await setupServer()
      return
    }

    const { setupClient } = await import('./client/setup')
    setupClient()
  })
}

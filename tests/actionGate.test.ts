import { describe, expect, it } from 'vitest'

import { ActionGate } from '../src/server/actionGate'

describe('server action ownership and idempotency', () => {
  it('applies one authenticated action once and replays its result on retry', () => {
    const gate = new ActionGate()
    let applications = 0
    const action = { clientActionId: 'pass-1', matchId: 'match-a', round: 2 }
    const apply = () => {
      applications += 1
      return { accepted: true, reason: '' }
    }

    expect(gate.run('wallet-a', action, 'match-a', 2, 3, apply).accepted).toBe(true)
    expect(gate.run('wallet-a', action, 'match-a', 2, 3, apply).accepted).toBe(true)
    expect(applications).toBe(1)
  })

  it('rejects actions without an owned seat or from an obsolete round', () => {
    const gate = new ActionGate()
    const action = { clientActionId: 'card-1', matchId: 'match-a', round: 1 }
    expect(gate.run('wallet-a', action, 'match-a', 1, null, () => ({ accepted: true, reason: '' })).accepted).toBe(
      false
    )
    expect(gate.run('wallet-a', action, 'match-a', 2, 0, () => ({ accepted: true, reason: '' })).accepted).toBe(false)
  })
})

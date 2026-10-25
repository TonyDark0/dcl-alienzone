import { describe, expect, it } from 'vitest'

import { mergeSeatReactions } from '../src/ui/adapters/reactionPresentation'
import type { UiSeatReaction } from '../src/ui/state/uiState'

describe('quick reaction presentation', () => {
  it('keeps an optimistic reaction visible while the server message is in flight', () => {
    const optimistic: UiSeatReaction = {
      seatId: 0,
      value: 'HA!',
      until: 0,
      presentationId: 7,
      optimisticUntilMs: 2_500
    }

    expect(mergeSeatReactions([], 10, 0, [optimistic], 1_000)).toEqual([optimistic])
  })

  it('acknowledges the local reaction without restarting its animation', () => {
    const optimistic: UiSeatReaction = {
      seatId: 0,
      value: 'NO!',
      until: 0,
      presentationId: 8,
      optimisticUntilMs: 2_500
    }
    const merged = mergeSeatReactions([{ seatId: 0, value: 'NO!', until: 11.5 }], 10, 0, [optimistic], 1_100)

    expect(merged[0]).toMatchObject({ value: 'NO!', until: 11.5, presentationId: 8 })
  })

  it('does not let a stale acknowledgement replace a newer rapid reaction', () => {
    const newest: UiSeatReaction = {
      seatId: 0,
      value: 'PASS!',
      until: 0,
      presentationId: 9,
      optimisticUntilMs: 2_500
    }
    const merged = mergeSeatReactions([{ seatId: 0, value: 'HA!', until: 11.5 }], 10, 0, [newest], 1_100)

    expect(merged).toEqual([newest])
  })
})

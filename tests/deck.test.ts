import { describe, expect, it } from 'vitest'

import { cardCategory } from '../src/game/model/types'
import { dealHands } from '../src/game/rules/deck'

describe('finite seeded deck', () => {
  it('deals every seat two reactions and two interventions', () => {
    const hands = dealHands(8, 20260826)
    expect(hands).toHaveLength(8)
    for (const hand of hands) {
      expect(hand).toHaveLength(4)
      expect(hand.filter((card) => cardCategory(card.type) === 'REACTION')).toHaveLength(2)
      expect(hand.filter((card) => cardCategory(card.type) === 'INTERVENTION')).toHaveLength(2)
      expect(new Set(hand.map((card) => card.id)).size).toBe(4)
    }
  })

  it('is repeatable for one seed and changes across matches', () => {
    expect(dealHands(8, 91)).toEqual(dealHands(8, 91))
    expect(dealHands(8, 91)).not.toEqual(dealHands(8, 92))
  })
})

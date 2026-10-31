import type { CardSlotState } from '../model/types'
import { CHASE_CARD_DETAILS, STARTER_CARDS, type ChaseCardType } from './chaseCards'
import { nextRandom } from './deck'

export const DECK_CARD_TYPES = [
  'FREEZE',
  'SKIP',
  'INVISIBLE',
  'HIDDEN_WATCH',
  'CHAOS',
  'SHADOW',
  'SYMBIOSIS',
  'VACUNE'
] as const
export type DeckCardType = (typeof DECK_CARD_TYPES)[number]
export type MatchLoadout = [DeckCardType[], DeckCardType[], DeckCardType[]]
export function isDeckCard(value: string): value is DeckCardType {
  return (DECK_CARD_TYPES as readonly string[]).includes(value)
}
/** Exactly 3x3. Every Epic type can occupy only one slot across the whole match. */
export function validateLoadout(
  value: unknown,
  unlocked: readonly ChaseCardType[] = DECK_CARD_TYPES
): value is MatchLoadout {
  if (!Array.isArray(value) || value.length !== 3) return false
  const epics = new Set<string>()
  for (const round of value) {
    if (!Array.isArray(round) || round.length !== 3) return false
    for (const type of round) {
      if (typeof type !== 'string' || !isDeckCard(type) || !unlocked.includes(type)) return false
      if (CHASE_CARD_DETAILS[type].rarity === 'EPIC') {
        if (epics.has(type)) return false
        epics.add(type)
      }
    }
  }
  return true
}
export function defaultLoadout(): MatchLoadout {
  return Array.from({ length: 3 }, () => [...STARTER_CARDS]) as MatchLoadout
}
export function botLoadout(seed: number, seat: number, unlocked: readonly ChaseCardType[]): MatchLoadout {
  let random = (seed ^ Math.imul(seat + 1, 104729)) >>> 0
  const epics = unlocked.filter((type) => isDeckCard(type) && CHASE_CARD_DETAILS[type].rarity === 'EPIC')
  const general = unlocked.filter((type) => isDeckCard(type) && CHASE_CARD_DETAILS[type].rarity === 'GENERAL')
  const rounds: DeckCardType[][] = []
  for (let r = 0; r < 3; r++) {
    const pool = [...general, ...epics]
    const hand: DeckCardType[] = []
    for (let slot = 0; slot < 3; slot++) {
      random = nextRandom(random)
      const type = pool.length ? pool[(random >>> 8) % pool.length] : 'SKIP'
      hand.push(type as DeckCardType)
      pool.splice(pool.indexOf(type), 1)
      if (CHASE_CARD_DETAILS[type].rarity === 'EPIC') epics.splice(epics.indexOf(type), 1)
    }
    rounds.push(hand)
  }
  return rounds as MatchLoadout
}
export function handForRound(plan: MatchLoadout, round: number, prefix: string): CardSlotState[] {
  return plan[round - 1].map((type, slot) => ({
    id: `${prefix}-r${round}-${slot}`,
    type,
    state: slot === 0 ? 'ARMED' : 'AVAILABLE'
  }))
}

import { type CardSlotState, type CardType } from '../model/types'
import { CARD_DETAILS, nextRandom } from './deck'
import { CHASE_CONFIG } from './chase'

export const CHASE_CARD_TYPES = [
  'FREEZE',
  'SKIP',
  'INVISIBLE',
  'HIDDEN_WATCH',
  'CHAOS',
  'DUPLICATE',
  'TURBO',
  'SHADOW',
  'SYMBIOSIS',
  'VACUNE'
] as const
export type ChaseCardType = (typeof CHASE_CARD_TYPES)[number]
export const STARTER_CARDS: readonly ChaseCardType[] = ['FREEZE', 'SKIP', 'INVISIBLE']
export const CHASE_CARD_DETAILS: Record<
  ChaseCardType,
  {
    name: string
    icon: string
    description: string
    rarity: 'GENERAL' | 'EPIC' | 'RARE'
    starter: boolean
  }
> = {
  TURBO: {
    ...CARD_DETAILS.TURBO,
    rarity: 'RARE',
    starter: false,
    description:
      'Board pickup: 2x speed for this round. Freeze cancels it to 1x without slowing that hit. One spawn per round.'
  },
  SHADOW: { ...CARD_DETAILS.SHADOW, rarity: 'EPIC', starter: false },
  SYMBIOSIS: { ...CARD_DETAILS.SYMBIOSIS, rarity: 'EPIC', starter: false },
  VACUNE: { ...CARD_DETAILS.VACUNE, rarity: 'EPIC', starter: false },
  FREEZE: {
    ...CARD_DETAILS.FREEZE,
    description: `Slow every other astronaut and their running animation to 50% for ${CHASE_CONFIG.freezeSeconds} seconds. The alien timer keeps running.`,
    rarity: 'GENERAL',
    starter: true
  },
  SKIP: {
    ...CARD_DETAILS.SKIP,
    description: 'Become immune to both aliens for 3 seconds. Does not remove an alien you already carry.',
    rarity: 'GENERAL',
    starter: true
  },
  INVISIBLE: {
    ...CARD_DETAILS.INVISIBLE,
    rarity: 'GENERAL',
    starter: true,
    description: 'Invisible to others for 10s, except players using Vacune. Not immune to throws.'
  },
  HIDDEN_WATCH: { ...CARD_DETAILS.HIDDEN_WATCH, rarity: 'GENERAL', starter: false },
  CHAOS: {
    ...CARD_DETAILS.CHAOS,
    description:
      'Arm an irreversible random redirect. Your deck locks until an alien is redirected once. One use per match.',
    rarity: 'EPIC',
    starter: false
  },
  DUPLICATE: {
    ...CARD_DETAILS.DUPLICATE,
    description:
      'One board pickup per match in a random round. Spawn a transferable, scoring Echo on another eligible astronaut. Shares the original fuse and never attacks.',
    rarity: 'RARE',
    starter: false
  }
}
export function isChaseCard(type: CardType): type is ChaseCardType {
  return (CHASE_CARD_TYPES as readonly CardType[]).includes(type)
}
/** Finite hands, no reward grant or persistent economy implied by this seed. */
export function dealChaseHand(
  seed: number,
  seat: number,
  unlocked: readonly ChaseCardType[] = STARTER_CARDS
): CardSlotState[] {
  let random = (seed + seat * 104729) >>> 0
  const pool = [...new Set(unlocked.filter((type) => type !== 'DUPLICATE' && type !== 'TURBO'))]
  // The starter deck has exactly one of each default power, with a seeded order.
  for (let i = pool.length - 1; i > 0; i--) {
    random = nextRandom(random)
    const other = (random >>> 16) % (i + 1)
    ;[pool[i], pool[other]] = [pool[other], pool[i]]
  }
  return pool
    .slice(0, 3)
    .map((type, slot) => ({ id: `chase-${seed}-${seat}-${slot}`, type, state: slot === 0 ? 'ARMED' : 'AVAILABLE' }))
}

export function queuedCards<T extends { state: string }>(hand: readonly T[]): T[] {
  return hand.filter((card) => card.state === 'AVAILABLE' || card.state === 'ARMED')
}
export function armFirstCard(hand: CardSlotState[]) {
  for (const card of hand) if (card.state === 'ARMED') card.state = 'AVAILABLE'
  if (hand.some((card) => card.type === 'CHAOS' && card.state === 'ACTIVE')) return
  const next = queuedCards(hand)[0]
  if (next) next.state = 'ARMED'
}

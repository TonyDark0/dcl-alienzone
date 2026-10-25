import { cardCategory, type CardSlotState, type CardType } from '../model/types'

export function nextRandom(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0
}

/** Finite public deck: two reactions and two interventions per seat. */
export function dealHands(seats: number, seed: number): CardSlotState[][] {
  let random = seed >>> 0
  const shuffle = <T>(items: T[]): T[] => {
    for (let i = items.length - 1; i > 0; i--) {
      random = nextRandom(random)
      const j = random % (i + 1)
      ;[items[i], items[j]] = [items[j], items[i]]
    }
    return items
  }
  const actions: CardType[] = shuffle(['CHAOS', 'HIDDEN_WATCH', 'FREEZE'])
  const reactions = shuffle(Array.from({ length: seats * 2 }, (_, i): CardType => (i % 2 ? 'SKIP' : 'REVERSE')))
  const interventions = shuffle(Array.from({ length: seats * 2 }, (_, i) => actions[i % actions.length]))
  return Array.from({ length: seats }, (_, seat) =>
    shuffle([...reactions.slice(seat * 2, seat * 2 + 2), ...interventions.slice(seat * 2, seat * 2 + 2)]).map(
      (type, slot) => ({ id: `${seed}-${seat}-${slot}`, type, state: 'AVAILABLE' as const })
    )
  )
}

export const CARD_DETAILS: Record<CardType, { name: string; icon: string; description: string }> = {
  REVERSE: {
    name: 'REVERSE',
    icon: 'assets/Images/ui/cards/az_card_reverse_v001.png',
    description: 'Activate before arrival. Return the alien and reverse direction.'
  },
  SKIP: {
    name: 'SKIP',
    icon: 'assets/Images/ui/cards/az_card_skip_v001.png',
    description: 'Activate before arrival. Skip the incoming alien and earn +1.'
  },
  CHAOS: {
    name: 'CHAOS',
    icon: 'assets/Images/ui/cards/az_card_chaos_v001.png',
    description: 'Choose a player, then activate. Your next pass redirects to that player.'
  },
  HIDDEN_WATCH: {
    name: 'HIDDEN WATCH',
    icon: 'assets/Images/ui/cards/az_card_hidden_watch_v001.png',
    description: "Hides the selected holder's exact fuse for 6 seconds."
  },
  FREEZE: {
    name: 'FREEZE',
    icon: 'assets/Images/ui/cards/az_card_freeze_v001.png',
    description: 'Adds up to 5 seconds to the shared fuse, capped at 38 seconds.'
  },
  DUPLICATE: {
    name: 'ECHO',
    icon: 'assets/Images/ui/cards/az_card_echo_v001.png',
    description: 'One shared bonus card per round, randomly assigned. Spawn a scoring alien that never attacks.'
  }
}

export function loadedCard(hand: readonly CardSlotState[], category: 'REACTION' | 'INTERVENTION') {
  return hand.find(
    (card) => (card.state === 'ARMED' || card.state === 'ACTIVE') && cardCategory(card.type) === category
  )
}

export function activeReaction(hand: readonly CardSlotState[]) {
  return hand.find((card) => card.state === 'ACTIVE' && cardCategory(card.type) === 'REACTION')
}

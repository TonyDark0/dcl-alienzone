export type SeatId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type MatchPhase =
  | 'BOOT'
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'ROUND_START'
  | 'HOLDING'
  | 'RESOLVING_CHAIN'
  | 'TAKEOVER'
  | 'ROUND_RESULT'
  | 'MATCH_RESULT'
  | 'REMATCH'

export type Direction = 1 | -1
export type CardState = 'AVAILABLE' | 'ARMED' | 'ACTIVE' | 'SPENT'
export const PLAYABLE_CARD_TYPES = ['REVERSE', 'SKIP', 'CHAOS', 'HIDDEN_WATCH', 'FREEZE', 'DUPLICATE'] as const
export type CardType = (typeof PLAYABLE_CARD_TYPES)[number]
export type CardCategory = 'REACTION' | 'INTERVENTION'
export type AlienId = 'ORIGINAL' | 'ECHO'

export function cardCategory(type: CardType): CardCategory {
  return type === 'REVERSE' || type === 'SKIP' ? 'REACTION' : 'INTERVENTION'
}

export interface CardSlotState {
  id: string
  type: CardType
  state: CardState
  targetSeatId?: SeatId
}

export function isPlayableCardType(value: string): value is CardType {
  return PLAYABLE_CARD_TYPES.some((cardType) => cardType === value)
}

export interface SeatState {
  id: SeatId
  playerId: string | null
  isBot: boolean
  heat: number
  takeovers: number
  successfulPasses: number
  displayName?: string
  hand?: CardSlotState[]
}

export interface MatchState {
  phase: MatchPhase
  sequence: number
  round: number
  direction: Direction
  holderSeatId: SeatId | null
  fuseEndsAt: number | null
  seats: SeatState[]
}

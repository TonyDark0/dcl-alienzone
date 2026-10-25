import type { AlienId, CardCategory, CardState, CardType, Direction, MatchPhase, SeatId } from '../../game/model/types'

export type ThreatLevel = 'SAFE' | 'DANGER' | 'CRITICAL'
export type { CardState }

export interface UiSeatView {
  id: SeatId
  name: string
  displayName: string
  heat: number
  isBot: boolean
  isHolder: boolean
  isLocal: boolean
  alienCount: number
  takeovers: number
  successfulPasses: number
}

export interface UiCardView {
  id: string
  type: CardType
  category: CardCategory
  name: string
  icon: string
  description: string
  state: CardState
  targetSeatId?: SeatId
}

export interface UiAlienView {
  id: AlienId
  holderSeatId: SeatId
  holderName: string
  turn: number
  isLocalHolder: boolean
  inTransit: boolean
  heldForSeconds: number
}

export interface UiSeatReaction {
  seatId: SeatId
  value: string
  until: number
  presentationId: number
  optimisticUntilMs?: number
}

export interface UiSeatNotice {
  sequence: number
  seatId: SeatId
  text: string
  tone: 'POINTS' | 'CARD' | 'PENALTY'
}

export interface UiSeatPassCue {
  sequence: number
  seatId: SeatId
}

export interface UiLeaderboardEntry {
  displayName: string
  bestHeat: number
  wins: number
}

export interface AlienzoneUiState {
  matchId: string
  phase: MatchPhase
  round: number
  localSeatId: SeatId | null
  takeovers: number
  heat: number
  direction: Direction
  threat: ThreatLevel
  preciseFuseHidden: boolean
  holderName: string
  isLocalHolder: boolean
  canLocalPass: boolean
  heldAlien: UiAlienView | null
  aliens: UiAlienView[]
  seatReactions: UiSeatReaction[]
  seatNotices: UiSeatNotice[]
  seatPassCues: UiSeatPassCue[]
  powerActivations: Array<{ sequence: number; type: CardType; playerName: string }>
  passPending: boolean
  cards: UiCardView[]
  seats: UiSeatView[]
  announcement: string | null
  takeoverVictim: string | null
  takeoverVictimSeatId: SeatId | null
  lobbyCountdown: number | null
  leaderboard: UiLeaderboardEntry[]
  leaderboardLoading: boolean
  lastActionError: string | null
}

const LAB_SEATS: UiSeatView[] = Array.from({ length: 8 }, (_, id) => ({
  id: id as SeatId,
  name: id === 0 ? 'YOU' : ['NOVA', 'MILO', 'LYRA', 'ORBIT', 'VEGA', 'SOL', 'ATLAS', 'IRIS'][id],
  displayName: id === 0 ? 'PLAYER' : ['NOVA', 'MILO', 'LYRA', 'ORBIT', 'VEGA', 'SOL', 'ATLAS', 'IRIS'][id],
  heat: id === 0 ? 7 : 0,
  isBot: id !== 0,
  isHolder: id === 0,
  isLocal: id === 0,
  alienCount: id === 0 ? 1 : 0,
  takeovers: 0,
  successfulPasses: 0
}))

function createLabState(): AlienzoneUiState {
  return {
    matchId: '',
    phase: 'BOOT',
    round: 0,
    localSeatId: null,
    takeovers: 0,
    heat: 0,
    direction: 1,
    threat: 'SAFE',
    preciseFuseHidden: false,
    holderName: 'WAITING',
    isLocalHolder: false,
    canLocalPass: false,
    heldAlien: null,
    aliens: [],
    seatReactions: [],
    seatNotices: [],
    seatPassCues: [],
    powerActivations: [],
    passPending: false,
    cards: [],
    seats: LAB_SEATS,
    announcement: 'WAKING CONTAINMENT SERVER',
    takeoverVictim: null,
    takeoverVictimSeatId: null,
    lobbyCountdown: null,
    leaderboard: [],
    leaderboardLoading: true,
    lastActionError: null
  }
}

let uiState = createLabState()

export function getUiState(): Readonly<AlienzoneUiState> {
  return uiState
}

export function updateUiState(patch: Partial<AlienzoneUiState>) {
  uiState = { ...uiState, ...patch }
}

export function cycleLabThreat() {
  const next: Record<ThreatLevel, ThreatLevel> = { SAFE: 'DANGER', DANGER: 'CRITICAL', CRITICAL: 'SAFE' }
  updateUiState({ threat: next[uiState.threat] })
}

export function toggleLabDirection() {
  updateUiState({ direction: uiState.direction === 1 ? -1 : 1 })
}

export function simulateLabTakeover() {
  updateUiState({
    takeoverVictim: uiState.holderName,
    takeoverVictimSeatId: 0,
    takeovers: Math.min(3, uiState.takeovers + 1)
  })
}

export function simulateLabResults() {
  updateUiState({ phase: 'MATCH_RESULT', takeoverVictim: null, takeoverVictimSeatId: null })
}

export function resetLabUi() {
  uiState = createLabState()
}

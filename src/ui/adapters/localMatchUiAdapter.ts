import { cardCategory, type SeatId } from '../../game/model/types'
import type { MatchSnapshot } from '../../game/runtime/matchEngine'
import { CARD_DETAILS } from '../../game/rules/deck'
import { getUiState, updateUiState, type ThreatLevel, type UiAlienView, type UiSeatNotice } from '../state/uiState'
import { mergeSeatReactions } from './reactionPresentation'

function threatForFuse(seconds: number): ThreatLevel {
  if (seconds <= 5) return 'CRITICAL'
  if (seconds <= 15) return 'DANGER'
  return 'SAFE'
}

export function syncMatchStateToUi(state: Readonly<MatchSnapshot>) {
  const previousUi = getUiState()
  const localSeat = state.localSeatId === null ? undefined : state.seats[state.localSeatId]
  const aliens: UiAlienView[] = state.aliens.map((alien) => ({
    id: alien.id,
    holderSeatId: alien.holderSeatId,
    holderName: state.seats[alien.holderSeatId].displayName,
    turn: alien.turn,
    isLocalHolder: alien.holderSeatId === state.localSeatId,
    inTransit: state.now < alien.readyAt,
    heldForSeconds: Math.max(0, state.now - alien.heldSince)
  }))
  const heldAlien = aliens.find((alien) => alien.isLocalHolder) ?? null
  const phaseChanged = previousUi.phase !== state.phase || previousUi.round !== state.round
  const lastActionError = phaseChanged ? null : previousUi.lastActionError
  const passStillPending =
    previousUi.passPending &&
    previousUi.heldAlien?.id === heldAlien?.id &&
    previousUi.heldAlien?.turn === heldAlien?.turn
  const seatNotices: UiSeatNotice[] = state.events
    .filter((event) => state.now - event.at <= 2.2)
    .flatMap<UiSeatNotice>((event): UiSeatNotice[] => {
      const seatId = event.path[0]
      if (seatId === undefined) return []
      if (event.kind === 'PASS' && event.heat > 0) {
        return [{ sequence: event.sequence, seatId, text: `+${event.heat}`, tone: 'POINTS' as const }]
      }
      if (event.kind === 'TAKEOVER' && event.heat < 0) {
        return [{ sequence: event.sequence, seatId, text: `${event.heat}`, tone: 'PENALTY' as const }]
      }
      if (event.kind === 'REACTION_RESOLVED' && event.heat > 0) {
        return [{ sequence: event.sequence, seatId, text: `+${event.heat}`, tone: 'POINTS' as const }]
      }
      return []
    })
  const seatPassCues = state.events
    .filter((event) => event.kind === 'PASS' && state.now - event.at <= 1)
    .flatMap((event) => {
      const seatId = event.path[0]
      return seatId === undefined ? [] : [{ sequence: event.sequence, seatId }]
    })
  const serverReactions = mergeSeatReactions(
    state.reactions,
    state.now,
    state.localSeatId,
    previousUi.seatReactions,
    Date.now()
  )

  updateUiState({
    matchId: state.matchId,
    phase: state.phase,
    round: state.round,
    localSeatId: state.localSeatId,
    takeovers: state.takeovers,
    heat: localSeat?.heat ?? 0,
    direction: state.direction,
    threat: threatForFuse(state.fuseRemainingSeconds),
    preciseFuseHidden: (localSeat?.hiddenUntil ?? 0) > state.now,
    holderName: aliens.map((alien) => `${alien.id === 'ECHO' ? 'ECHO' : 'ALIEN'}: ${alien.holderName}`).join('  •  '),
    isLocalHolder: heldAlien !== null && state.phase === 'HOLDING',
    canLocalPass: heldAlien !== null && !heldAlien.inTransit && state.phase === 'HOLDING',
    heldAlien,
    aliens,
    seatReactions: serverReactions,
    seatNotices,
    seatPassCues,
    powerActivations: state.events
      .filter((event) => event.kind === 'CARD' && event.cardType && state.now - event.at <= 2)
      .map((event) => ({
        sequence: event.sequence,
        type: event.cardType!,
        playerName: state.seats[event.path[0]].displayName
      })),
    passPending: passStillPending,
    cards: state.localHand.map((card) => ({
      id: card.id,
      type: card.type,
      category: cardCategory(card.type),
      name: CARD_DETAILS[card.type].name,
      icon: CARD_DETAILS[card.type].icon,
      description: CARD_DETAILS[card.type].description,
      state: card.state,
      targetSeatId: card.targetSeatId
    })),
    seats: state.seats.map((seat) => ({
      id: seat.id as SeatId,
      name: seat.id === state.localSeatId ? 'YOU' : seat.displayName,
      displayName: seat.displayName,
      heat: seat.heat,
      isBot: seat.isBot,
      isHolder: state.aliens.some((alien) => alien.holderSeatId === seat.id),
      isLocal: seat.id === state.localSeatId,
      alienCount: state.aliens.filter((alien) => alien.holderSeatId === seat.id).length,
      takeovers: seat.takeovers,
      successfulPasses: seat.successfulPasses
    })),
    announcement: lastActionError ?? state.announcement,
    takeoverVictim: state.takeoverVictimSeatId === null ? null : state.seats[state.takeoverVictimSeatId].displayName,
    takeoverVictimSeatId: state.takeoverVictimSeatId,
    lobbyCountdown:
      state.countdownRemainingSeconds === null ? null : Math.max(1, Math.ceil(state.countdownRemainingSeconds)),
    lastActionError
  })
}

import { cardCategory, type SeatId } from '../../game/model/types'
import type { MatchSnapshot } from '../../game/runtime/matchEngine'
import { CARD_DETAILS } from '../../game/rules/deck'
import { CHASE_CARD_DETAILS, isChaseCard } from '../../game/rules/chaseCards'
import { getUiState, updateUiState, type ThreatLevel, type UiAlienView, type UiSeatNotice } from '../state/uiState'
import { mergeSeatReactions } from './reactionPresentation'
import { reconcileTapFeedback } from '../state/containmentFeedback'
import { GAME_CONFIG } from '../../config/gameConfig'

function threatForFuse(seconds: number): ThreatLevel {
  if (seconds <= 5) return 'CRITICAL'
  if (seconds <= 15) return 'DANGER'
  return 'SAFE'
}

export function syncMatchStateToUi(state: Readonly<MatchSnapshot>) {
  const previousUi = getUiState()
  if (
    state.matchId === previousUi.matchId &&
    (state.now < previousUi.snapshotServerNow || state.revision < previousUi.snapshotRevision)
  )
    return
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
      if (
        (event.kind === 'REACTION_RESOLVED' ||
          event.kind === 'CONTAINMENT' ||
          event.kind === 'COIN' ||
          event.kind === 'CARD') &&
        event.heat > 0
      ) {
        return [
          {
            sequence: event.sequence,
            seatId,
            text: `+${event.heat}`,
            tone: 'POINTS' as const,
            source: event.kind === 'COIN' ? 'COIN' : undefined
          }
        ]
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
    arena: state.arena ?? null,
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
    canLocalPass:
      heldAlien !== null &&
      !heldAlien.inTransit &&
      state.phase === 'HOLDING' &&
      (!state.arena || !!state.arena.throwReady),
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
    cardReadyAt: localSeat?.interventionReadyAt ?? 0,
    passPending: passStillPending,
    cards: state.localHand.map((card) => ({
      id: card.id,
      tier: state.arena && isChaseCard(card.type) ? CHASE_CARD_DETAILS[card.type].rarity : undefined,
      type: card.type,
      category: cardCategory(card.type),
      name: (state.arena && isChaseCard(card.type) ? CHASE_CARD_DETAILS[card.type] : CARD_DETAILS[card.type]).name,
      icon: (state.arena && isChaseCard(card.type) ? CHASE_CARD_DETAILS[card.type] : CARD_DETAILS[card.type]).icon,
      description: (state.arena && isChaseCard(card.type) ? CHASE_CARD_DETAILS[card.type] : CARD_DETAILS[card.type])
        .description,
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
    containment: state.containment ?? null,
    containmentTapFeedback:
      state.phase === 'TAKEOVER'
        ? reconcileTapFeedback(previousUi.containmentTapFeedback, state.containment ?? null, Date.now())
        : null,
    containmentPendingTarget:
      state.phase === 'TAKEOVER' &&
      state.matchId === previousUi.matchId &&
      state.containment?.id === previousUi.containment?.id &&
      !state.containment?.resolved &&
      previousUi.containmentPendingTarget !== null &&
      !state.containment?.hits[previousUi.containmentPendingTarget]
        ? previousUi.containmentPendingTarget
        : null,
    snapshotServerNow: state.now,
    crewIntroElapsedSeconds:
      state.phase === 'ROUND_START'
        ? Math.max(0, GAME_CONFIG.crewSeatingSequenceSeconds - (state.phaseEndsAt - state.now))
        : 0,
    snapshotRevision: state.revision,
    fuseRemainingSeconds: state.fuseRemainingSeconds,
    snapshotReceivedAtMs: Date.now(),
    lobbyCountdown:
      state.countdownRemainingSeconds === null ? null : Math.max(1, Math.ceil(state.countdownRemainingSeconds)),
    lastActionError
  })
}

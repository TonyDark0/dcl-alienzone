import { GAME_CONFIG } from '../../config/gameConfig'
import {
  cardCategory,
  type AlienId,
  type CardSlotState,
  type MatchPhase,
  type SeatId,
  type SeatState
} from '../model/types'
import { activeReaction, dealHands, loadedCard, nextRandom } from '../rules/deck'
import { applyTakeoverPenalty, heatForSuccessfulPass } from '../rules/scoring'
import type { ChaseArenaState } from '../rules/chase'
import {
  CONTAINMENT_CONFIG,
  botContainmentAttempt,
  canHitContainmentTarget,
  containmentResolvesAt,
  containmentTargetOpensAt,
  createContainmentChallenge,
  currentContainmentTarget,
  earnsContainmentBonus,
  type ContainmentChallenge
} from '../rules/containment'

export interface AlienState {
  id: AlienId
  holderSeatId: SeatId
  heldSince: number
  readyAt: number
  turn: number
}

export interface GameSeat extends SeatState {
  hand: CardSlotState[]
  displayName: string
  hiddenUntil: number
  interventionReadyAt: number
  chaosTargetSeatId?: SeatId
}

export interface MatchEvent {
  sequence: number
  at: number
  kind: 'PASS' | 'CARD' | 'REACTION_RESOLVED' | 'TAKEOVER' | 'ROUND' | 'CONTAINMENT' | 'COIN'
  alienId: AlienId
  path: SeatId[]
  heat: number
  message: string
  cardType?: CardSlotState['type']
}

export interface SeatReactionState {
  seatId: SeatId
  value: string
  until: number
}

export interface GameState {
  arena?: ChaseArenaState
  matchId: string
  rulesVersion: string
  seed: number
  revision: number
  sequence: number
  phase: MatchPhase
  now: number
  phaseEndsAt: number
  round: number
  roundStartedAt: number
  fuseEndsAt: number
  direction: 1 | -1
  aliens: AlienState[]
  seats: GameSeat[]
  takeovers: number
  takeoverVictimSeatId: SeatId | null
  containment: ContainmentChallenge | null
  echoUsedThisRound: boolean
  reactions: SeatReactionState[]
  events: MatchEvent[]
  announcement: string | null
  announcementUntil: number
}

export interface MatchSnapshot extends GameState {
  localSeatId: SeatId | null
  holderSeatId: SeatId
  heldForSeconds: number
  fuseRemainingSeconds: number
  countdownRemainingSeconds: number | null
  localHand: CardSlotState[]
}

export interface ActionResult {
  accepted: boolean
  reason: string
}
const ok = (): ActionResult => ({ accepted: true, reason: '' })
const no = (reason: string): ActionResult => ({ accepted: false, reason })
const TRAVEL_SECONDS = 0.35
const BOT_CALLSIGNS = ['NOVA', 'MILO', 'LYRA', 'ORBIT', 'VEGA', 'SOL', 'ATLAS', 'IRIS'] as const

/** One deterministic, renderer-free authority per table. Time is supplied by the server. */
export class MatchEngine {
  state: GameState
  private random: number
  private nextBotAt = 0

  constructor(seed = 1, matchId = `match-${seed}`) {
    this.random = seed >>> 0
    const hands = dealHands(GAME_CONFIG.seats, seed)
    this.state = {
      matchId,
      rulesVersion: '3.1-takeover-containment',
      seed,
      revision: 0,
      sequence: 0,
      phase: 'LOBBY',
      now: 0,
      phaseEndsAt: 0,
      round: 0,
      roundStartedAt: 0,
      fuseEndsAt: 0,
      direction: 1,
      aliens: [],
      takeovers: 0,
      takeoverVictimSeatId: null,
      containment: null,
      echoUsedThisRound: false,
      reactions: [],
      events: [],
      announcement: null,
      announcementUntil: 0,
      seats: hands.map((hand, id) => ({
        id: id as SeatId,
        playerId: null,
        displayName: BOT_CALLSIGNS[id],
        isBot: true,
        heat: 0,
        takeovers: 0,
        successfulPasses: 0,
        hand,
        hiddenUntil: 0,
        interventionReadyAt: 0
      }))
    }
  }

  protected pick<T>(items: T[]): T {
    this.random = nextRandom(this.random)
    return items[this.random % items.length]
  }

  protected emit(
    kind: MatchEvent['kind'],
    alienId: AlienId,
    path: SeatId[],
    heat: number,
    message: string,
    cardType?: CardSlotState['type']
  ) {
    const s = this.state
    s.sequence++
    s.revision++
    s.events.push({ sequence: s.sequence, at: s.now, kind, alienId, path, heat, message, cardType })
    s.events = s.events.slice(-32)
    s.announcement = message
    s.announcementUntil = s.now + 1.8
  }

  join(playerId: string, name: string): SeatId | null {
    const existing = this.state.seats.find((seat) => seat.playerId === playerId)
    if (existing) {
      existing.isBot = false
      existing.displayName = name
      return existing.id
    }
    if (!['LOBBY', 'COUNTDOWN', 'MATCH_RESULT'].includes(this.state.phase)) return null
    const seat = this.state.seats.find((candidate) => candidate.playerId === null)
    if (!seat) return null
    seat.playerId = playerId
    seat.displayName = name
    seat.isBot = false
    this.state.revision++
    return seat.id
  }

  disconnect(playerId: string) {
    const seat = this.state.seats.find((candidate) => candidate.playerId === playerId)
    if (seat && !seat.isBot) {
      seat.isBot = true
      this.state.revision++
    }
  }

  ready(): ActionResult {
    if (this.state.phase !== 'LOBBY') return no('The match is already in progress.')
    this.state.phase = 'COUNTDOWN'
    this.state.phaseEndsAt = this.state.now + GAME_CONFIG.roomEntryCountdownSeconds
    this.state.revision++
    return ok()
  }

  private beginCrewSeating() {
    this.state.phase = 'ROUND_START'
    this.state.phaseEndsAt = this.state.now + GAME_CONFIG.crewSeatingSequenceSeconds
    this.state.revision++
  }

  start() {
    this.state.direction = this.pick([1, -1])
    this.beginRound(this.pick(this.state.seats).id)
  }

  protected finishCrewSeating() {
    this.start()
  }

  protected beginRound(holder: SeatId) {
    const s = this.state
    s.round++
    s.phase = 'HOLDING'
    s.roundStartedAt = s.now
    s.fuseEndsAt = s.now + GAME_CONFIG.baseFuseSeconds
    s.echoUsedThisRound = false
    // Echo is a single shared, round-scoped bonus card, never a per-player deal.
    for (const seat of s.seats) {
      seat.hand = seat.hand.filter((card) => card.type !== 'DUPLICATE')
      seat.chaosTargetSeatId = undefined
    }
    const echoOwner = this.pick(s.seats)
    echoOwner.hand.push({ id: `${s.matchId}-echo-${s.round}`, type: 'DUPLICATE', state: 'AVAILABLE' })
    s.takeoverVictimSeatId = null
    s.containment = null
    s.aliens = [{ id: 'ORIGINAL', holderSeatId: holder, heldSince: s.now, readyAt: s.now, turn: 0 }]
    for (const seat of s.seats) seat.hiddenUntil = 0
    this.emit('ROUND', 'ORIGINAL', [holder], 0, `ROUND ${s.round} / 3`)
  }

  private next(from: SeatId): SeatId {
    return ((from + this.state.direction + this.state.seats.length) % this.state.seats.length) as SeatId
  }

  private otherHolder(id: AlienId): SeatId | undefined {
    return this.state.aliens.find((alien) => alien.id !== id)?.holderSeatId
  }

  protected active(): boolean {
    if (this.state.phase !== 'HOLDING') return false
    if (this.state.now >= this.state.fuseEndsAt) {
      this.takeover()
      return false
    }
    return true
  }

  /** Collision check precedes defense consumption, for both aliens and every hop. */
  private route(alien: AlienState, initialTarget: SeatId, source: SeatId): SeatId[] {
    let target = initialTarget
    let previous = source
    const path: SeatId[] = [source]
    // Finite cards guarantee termination. Guard also accommodates skipped occupied seats.
    const maxHops = this.state.seats.reduce((n, seat) => n + seat.hand.length, 0) * 2 + this.state.seats.length * 2
    for (let hops = 0; hops < maxHops; hops++) {
      path.push(target)
      if (target === this.otherHolder(alien.id)) {
        target = this.next(target)
        continue
      }
      const seat = this.state.seats[target]
      const defense = activeReaction(seat.hand)
      if (!defense) {
        alien.holderSeatId = target
        return path
      }
      defense.state = 'SPENT'
      const defenseHeat = defense.type === 'SKIP' ? 1 : 0
      seat.heat += defenseHeat
      this.emit('REACTION_RESOLVED', alien.id, [seat.id], defenseHeat, `${seat.displayName}: ${defense.type}`)
      if (defense.type === 'REVERSE') {
        this.state.direction = this.state.direction === 1 ? -1 : 1
        const returningTo = previous
        previous = target
        target = returningTo
      } else {
        previous = target
        target = this.next(target)
      }
    }
    // Corrupt/unexpected state fails closed to a non-overlapping holder, never loops.
    target = this.next(source)
    while (target === this.otherHolder(alien.id)) target = this.next(target)
    alien.holderSeatId = target
    path.push(target)
    return path
  }

  pass(seatId: SeatId, alienId: AlienId, expectedTurn: number, manual = true): ActionResult {
    if (!this.active()) return no('Wait for the next round.')
    const alien = this.state.aliens.find((candidate) => candidate.id === alienId)
    if (!alien || alien.holderSeatId !== seatId || alien.turn !== expectedTurn) return no('That turn already changed.')
    if (this.state.now < alien.readyAt) return no('The alien is still in transit.')
    const heat = heatForSuccessfulPass(this.state.fuseEndsAt - this.state.now, this.state.now - alien.heldSince, manual)
    const seat = this.state.seats[seatId]
    seat.heat += heat
    if (heat > 0) seat.successfulPasses++
    let target = this.next(seatId)
    if (seat.chaosTargetSeatId !== undefined) {
      target = seat.chaosTargetSeatId
      seat.chaosTargetSeatId = undefined
    }
    const path = this.route(alien, target, seatId)
    alien.turn++
    alien.readyAt = this.state.now + TRAVEL_SECONDS
    alien.heldSince = alien.readyAt
    this.emit('PASS', alienId, path, heat, `${alienId === 'ECHO' ? 'ECHO' : 'ALIEN'} · PASS +${heat}`)
    return ok()
  }

  equip(
    seatId: SeatId,
    cardId: string | null,
    category: 'REACTION' | 'INTERVENTION',
    targetSeatId?: number
  ): ActionResult {
    if (!this.active()) return no('Cards can only be armed during an active round.')
    const seat = this.state.seats[seatId]
    if (!seat) return no('Invalid seat.')
    if (category === 'REACTION' && this.state.aliens.some((alien) => alien.holderSeatId === seatId)) {
      return no('Change your reaction after passing the alien.')
    }
    const card = cardId === null ? undefined : seat.hand.find((candidate) => candidate.id === cardId)
    if (cardId !== null && (!card || card.state === 'SPENT' || cardCategory(card.type) !== category))
      return no('Card unavailable.')
    if (
      targetSeatId !== undefined &&
      (!Number.isInteger(targetSeatId) || !this.state.seats[targetSeatId] || targetSeatId === seatId)
    )
      return no('Choose another player.')
    for (const candidate of seat.hand) {
      if (cardCategory(candidate.type) === category && (candidate.state === 'ARMED' || candidate.state === 'ACTIVE'))
        candidate.state = 'AVAILABLE'
    }
    if (card) {
      card.state = 'ARMED'
      card.targetSeatId = card.type === 'CHAOS' ? (targetSeatId as SeatId | undefined) : undefined
    }
    this.state.revision++
    return ok()
  }

  activate(seatId: SeatId, cardId: string, targetId: AlienId): ActionResult {
    if (!this.active()) return no('Wait for the next round.')
    const s = this.state
    const seat = s.seats[seatId]
    const card = seat?.hand.find((candidate) => candidate.id === cardId)
    if (!card || card.state !== 'ARMED') return no('Load the card first.')

    if (cardCategory(card.type) === 'REACTION') {
      card.state = 'ACTIVE'
      this.emit('CARD', 'ORIGINAL', [seatId], 0, `${seat.displayName}: ${card.type} READY`, card.type)
      return ok()
    }

    const target = s.aliens.find((alien) => alien.id === targetId)
    if (s.now < seat.interventionReadyAt) return no('Wait a moment before intervening again.')
    if (!target) return no('That alien is no longer active.')
    if (
      card.type === 'CHAOS' &&
      (card.targetSeatId === undefined || card.targetSeatId === seatId || !s.seats[card.targetSeatId])
    )
      return no('Select a player before activating Chaos.')
    if (card.type === 'DUPLICATE') {
      if (s.echoUsedThisRound) return no('Only one ECHO can spawn per round. Your card was not spent.')
      const source = s.aliens[0].holderSeatId
      const echo: AlienState = {
        id: 'ECHO',
        holderSeatId: source,
        heldSince: s.now + TRAVEL_SECONDS,
        readyAt: s.now + TRAVEL_SECONDS,
        turn: 0
      }
      s.aliens.push(echo)
      this.route(echo, this.next(source), source)
      s.echoUsedThisRound = true
    } else if (card.type === 'CHAOS') {
      if (seat.chaosTargetSeatId !== undefined) return no('Your next pass already has a Chaos target.')
      seat.chaosTargetSeatId = card.targetSeatId
    } else if (card.type === 'FREEZE') {
      const deadline = Math.min(s.roundStartedAt + GAME_CONFIG.fuseHardCapSeconds, s.fuseEndsAt + 5)
      if (deadline <= s.fuseEndsAt) return no('The round reached its time cap. Your card was not spent.')
      s.fuseEndsAt = deadline
    } else if (card.type === 'HIDDEN_WATCH') {
      const victim = s.seats[target.holderSeatId]
      if (victim.hiddenUntil > s.now) return no('That holder already has a hidden fuse. Your card was not spent.')
      victim.hiddenUntil = s.now + 6
    }
    card.state = 'SPENT'
    seat.interventionReadyAt = s.now + 1.2
    this.emit(
      'CARD',
      targetId,
      [seatId],
      0,
      `${seat.displayName}: ${card.type === 'DUPLICATE' ? 'ECHO' : card.type.replace('_', ' ')}`,
      card.type
    )
    return ok()
  }

  react(seatId: SeatId, value: string): ActionResult {
    if (!['HOLDING', 'TAKEOVER'].includes(this.state.phase)) return no('Reactions are only available during play.')
    if (!['PASS!', 'NO!', 'HA!'].includes(value)) return no('Invalid reaction.')

    const reaction = { seatId, value, until: this.state.now + GAME_CONFIG.quickReactionSeconds }
    const existing = this.state.reactions.findIndex((candidate) => candidate.seatId === seatId)
    if (existing >= 0) this.state.reactions[existing] = reaction
    else this.state.reactions.push(reaction)
    this.state.revision++
    return ok()
  }

  protected takeoverScore(score: number): number {
    return applyTakeoverPenalty(score)
  }

  protected takeover() {
    const s = this.state
    if (s.phase !== 'HOLDING') return
    const original = s.aliens.find((alien) => alien.id === 'ORIGINAL')!
    const victim = s.seats[original.holderSeatId]
    const before = victim.heat
    victim.heat = this.takeoverScore(victim.heat)
    victim.takeovers++
    s.takeovers++
    s.takeoverVictimSeatId = victim.id
    s.aliens = [original]
    s.phase = 'TAKEOVER'
    s.phaseEndsAt = s.now + GAME_CONFIG.takeoverSequenceSeconds
    s.containment = createContainmentChallenge(s.matchId, s.seed, s.round, victim.id, s.now)
    this.emit('TAKEOVER', 'ORIGINAL', [victim.id], victim.heat - before, `${victim.displayName}: TAKEOVER`)
  }

  containmentTap(seatId: SeatId, challengeId: string, targetIndex: number): ActionResult {
    const s = this.state
    const challenge = s.containment
    if (s.phase !== 'TAKEOVER' || !challenge || challenge.id !== challengeId)
      return no('That containment challenge has ended.')
    if (challenge.victimSeatId !== seatId) return no('Only the attacked astronaut can contain this alien.')
    if (!canHitContainmentTarget(challenge, targetIndex, s.now)) return no('That target is not available.')
    challenge.hits[targetIndex] = true
    s.revision++
    return ok()
  }

  private updateContainment() {
    const s = this.state
    const challenge = s.containment
    if (!challenge || challenge.resolved) return
    const victim = s.seats[challenge.victimSeatId]
    const index = currentContainmentTarget(challenge, s.now)
    if (victim.isBot && index !== null && !challenge.hits[index]) {
      const attempt = botContainmentAttempt(s.seed, s.round, victim.id, index)
      if (attempt.hit && s.now >= containmentTargetOpensAt(challenge, index) + attempt.delaySeconds)
        this.containmentTap(victim.id, challenge.id, index)
    }
    if (s.now + 1e-8 < containmentResolvesAt(challenge)) return
    challenge.resolved = true
    challenge.bonusAwarded = earnsContainmentBonus(challenge)
    challenge.contained = s.takeovers < GAME_CONFIG.takeoversPerMatch
    if (challenge.bonusAwarded) victim.heat += CONTAINMENT_CONFIG.bonusPoints
    this.emit(
      'CONTAINMENT',
      'ORIGINAL',
      [victim.id],
      challenge.bonusAwarded ? CONTAINMENT_CONFIG.bonusPoints : 0,
      `${victim.displayName}: ${challenge.contained ? 'ALIEN CONTAINED' : 'CONTAINMENT BREACHED'}`
    )
  }

  protected bots() {
    const s = this.state
    for (const seat of s.seats) {
      if (!seat.isBot) continue
      const held = s.aliens.find((alien) => alien.holderSeatId === seat.id)
      if (!held && !loadedCard(seat.hand, 'REACTION')) {
        const available = seat.hand.filter(
          (card) => card.state === 'AVAILABLE' && cardCategory(card.type) === 'REACTION'
        )
        if (available.length) {
          const reaction = available[(seat.id + s.round) % available.length]
          this.equip(seat.id, reaction.id, 'REACTION')
          this.activate(seat.id, reaction.id, 'ORIGINAL')
        }
      }
      const remaining = s.fuseEndsAt - s.now
      // Qualitative danger, also available to humans under Hidden Watch. No exact-time prediction.
      const critical = remaining <= 5
      if (held) {
        const wait = critical ? GAME_CONFIG.botCriticalPassSeconds : GAME_CONFIG.botScoringHoldSeconds
        if (s.now - held.heldSince >= wait) this.pass(seat.id, held.id, held.turn)
      }
      if (s.now - s.roundStartedAt < 3 + seat.id * 0.55 || s.now < seat.interventionReadyAt) continue
      // Individual opportunities, never a global quota. Reproducible but different each deal.
      if ((Math.floor(s.now * 4) + seat.id * 3 + (s.seed % 17)) % 13 !== 0) continue
      const choices = seat.hand.filter((card) => card.state !== 'SPENT' && cardCategory(card.type) === 'INTERVENTION')
      const card = choices.find((candidate) =>
        candidate.type === 'FREEZE'
          ? critical
          : candidate.type === 'DUPLICATE'
            ? remaining > 8 && !s.echoUsedThisRound
            : true
      )
      if (!card) continue
      this.equip(
        seat.id,
        card.id,
        'INTERVENTION',
        card.type === 'CHAOS' ? this.pick(s.seats.filter((other) => other.id !== seat.id)).id : undefined
      )
      const target = s.aliens.find((alien) => alien.holderSeatId !== seat.id) ?? s.aliens[0]
      this.activate(seat.id, card.id, target.id)
    }
  }

  protected updateGameplay(_seconds: number) {}

  advance(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return
    const end = this.state.now + seconds
    // Consume elapsed time instead of discarding stalled frames. Idle/result fast-forwards.
    while (this.state.now < end - 1e-8) {
      const s = this.state
      if (['BOOT', 'LOBBY', 'MATCH_RESULT'].includes(s.phase)) {
        s.now = end
        break
      }
      const step = Math.min(end - s.now, 0.05)
      s.now = Math.min(end, s.now + step)
      s.reactions = s.reactions.filter((reaction) => reaction.until > s.now)
      if (s.phase === 'COUNTDOWN' && s.now + 1e-8 >= s.phaseEndsAt) this.beginCrewSeating()
      else if (s.phase === 'ROUND_START' && s.now + 1e-8 >= s.phaseEndsAt) this.finishCrewSeating()
      else if (s.phase === 'DECK_SETUP' && s.now + 1e-8 >= s.phaseEndsAt) this.start()
      else if (s.phase === 'TAKEOVER') {
        this.updateContainment()
        if (s.now + 1e-8 < s.phaseEndsAt) continue
        if (s.takeovers === GAME_CONFIG.takeoversPerMatch) {
          s.phase = 'MATCH_RESULT'
          s.takeoverVictimSeatId = null
          s.revision++
        } else this.beginRound(this.next(s.takeoverVictimSeatId!))
      } else if (s.phase === 'HOLDING') {
        if (s.now + 1e-8 >= s.fuseEndsAt) {
          this.takeover()
          continue
        }
        this.updateGameplay(step)
        if (s.now + 1e-8 >= this.nextBotAt) {
          this.nextBotAt = s.now + 0.25
          this.bots()
        }
      }
      if (s.now >= s.announcementUntil) s.announcement = null
    }
  }

  snapshot(localSeatId: SeatId | null): MatchSnapshot {
    const original = this.state.aliens.find((alien) => alien.id === 'ORIGINAL')
    const exactRemaining = Math.max(0, this.state.fuseEndsAt - this.state.now)
    const hidden = localSeatId !== null && this.state.seats[localSeatId].hiddenUntil > this.state.now
    const visibleRemaining = hidden ? (exactRemaining <= 5 ? 5 : exactRemaining <= 15 ? 10 : 16) : exactRemaining
    return {
      ...this.state,
      fuseEndsAt: hidden ? 0 : this.state.fuseEndsAt,
      localSeatId,
      holderSeatId: original?.holderSeatId ?? 0,
      heldForSeconds: Math.max(0, this.state.now - (original?.heldSince ?? this.state.now)),
      fuseRemainingSeconds: visibleRemaining,
      countdownRemainingSeconds: ['COUNTDOWN', 'DECK_SETUP'].includes(this.state.phase)
        ? Math.max(0, this.state.phaseEndsAt - this.state.now)
        : null,
      localHand: localSeatId === null ? [] : this.state.seats[localSeatId].hand
    }
  }
}

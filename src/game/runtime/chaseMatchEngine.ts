import { type AlienId, type SeatId } from '../model/types'
import {
  CHASE_CONFIG,
  aimChasePlayer,
  initialChasePlayer,
  moveChasePlayer,
  normalizeMove,
  steerChasePlayer,
  wrapAngle
} from '../rules/chase'
import {
  CHASE_CARD_DETAILS,
  STARTER_CARDS,
  armFirstCard,
  queuedCards,
  isChaseCard,
  type ChaseCardType
} from '../rules/chaseCards'
import { MatchEngine, type ActionResult, type AlienState } from './matchEngine'
import { planChaseBot, roundStarter, type BotPlanMemory } from '../rules/chaseBots'
import { createRoundCoins, resolveCoinContacts } from '../rules/chaseCoins'
import { nearbyThrowTarget, type RecentThrowTarget } from '../rules/throwProximity'
import { botLoadout, handForRound, validateLoadout, type MatchLoadout } from '../rules/loadouts'
import {
  chaosDestination,
  createRoundPowers,
  firstPowerCollector,
  forwardHit,
  moveShadow,
  type ShadowDecoy
} from '../rules/roundPowers'

const yes = (): ActionResult => ({ accepted: true, reason: '' })
const no = (reason: string): ActionResult => ({ accepted: false, reason })
type MoveIntent = { x: number; z: number; until: number; sequence: number; steering: boolean; aimYaw?: number }

/** Production running-tag rules. The seated engine remains an isolated regression reference. */
export class ChaseMatchEngine extends MatchEngine {
  private inputs = new Map<SeatId, MoveIntent>()
  private unlocked = new Map<SeatId, readonly ChaseCardType[]>()
  private botPlans = new Map<SeatId, BotPlanMemory>()
  private recentRecipients = new Map<SeatId, { seatId: SeatId; until: number }>()
  private throwTargets = new Map<AlienId, RecentThrowTarget>()
  private loadouts = new Map<SeatId, MatchLoadout>()
  private returnProtection = new Map<AlienId, { giver: SeatId; receiver: SeatId; turn: number; until: number }>()
  private chaosCasts = 0

  constructor(seed = 1, matchId = `chase-${seed}`, unlocked: readonly ChaseCardType[] = STARTER_CARDS) {
    super(seed, matchId)
    this.state.rulesVersion = '6.1-chaos-teleport'
    this.state.arena = {
      players: this.state.seats.map((seat) => initialChasePlayer(seat.id)),
      coins: [],
      powers: [],
      shadows: [],
      staticAnimationFallback: false
    }
    for (const seat of this.state.seats) {
      this.unlocked.set(seat.id, [...unlocked])
      const plan = botLoadout(seed, seat.id, unlocked)
      this.loadouts.set(seat.id, plan)
      seat.hand = handForRound(plan, 1, `${matchId}-${seat.id}`)
    }
  }

  configureLoadout(seatId: SeatId, plan: unknown): ActionResult {
    if (!['LOBBY', 'COUNTDOWN'].includes(this.state.phase)) return no('Round loadouts are locked for this match.')
    if (!this.state.seats[seatId] || !validateLoadout(plan, this.unlocked.get(seatId)))
      return no('Choose 3 cards per round; each Epic is allowed once per match. Pickups cannot enter a deck.')
    const copy = plan.map((round) => [...round]) as MatchLoadout
    this.loadouts.set(seatId, copy)
    this.state.seats[seatId].hand = handForRound(copy, 1, `${this.state.matchId}-${seatId}`)
    this.state.revision++
    return yes()
  }

  protected finishCrewSeating() {
    this.state.phase = 'DECK_SETUP'
    this.state.phaseEndsAt = this.state.now + CHASE_CONFIG.deckSetupSeconds
    this.state.revision++
  }

  protected beginRound(_holder: SeatId) {
    super.beginRound(roundStarter(this.state.seed, this.state.round, this.state.seats.length))
    const s = this.state
    this.inputs.clear()
    this.botPlans.clear()
    this.recentRecipients.clear()
    this.throwTargets.clear()
    this.returnProtection.clear()
    // Discard the entire previous round; never carry unused cards or legacy Echo grants.
    for (const seat of s.seats) {
      if (s.round > 1) seat.hand = handForRound(this.loadouts.get(seat.id)!, s.round, `${s.matchId}-${seat.id}`)
      else seat.hand = seat.hand.filter((card) => card.type !== 'DUPLICATE' && card.type !== 'TURBO')
      armFirstCard(seat.hand)
    }
    for (const player of s.arena!.players) {
      player.moving = false
      player.frozenUntil = player.immuneUntil = player.invisibleUntil = 0
      player.turboUntil = 0
      player.vaccinatedUntil = 0
      player.touchedThisRound = s.aliens.some((alien) => alien.holderSeatId === player.seatId)
    }
    s.aliens[0].readyAt = s.now + CHASE_CONFIG.arrivalGraceSeconds
    s.arena!.coins = createRoundCoins(s.seed, s.round, s.arena!.players)
    s.arena!.powers = createRoundPowers(s.seed, s.round, s.arena!.players, s.now)
    s.arena!.shadows = []
    s.arena!.shots = []
  }

  moveInput(seatId: SeatId, x: number, z: number, sequence: number): ActionResult {
    return this.acceptMoveInput(seatId, x, z, sequence, false)
  }

  steerInput(seatId: SeatId, forward: number, turn: number, sequence: number): ActionResult {
    return this.acceptMoveInput(seatId, forward, turn, sequence, true)
  }

  aimInput(seatId: SeatId, forward: number, yaw: number, sequence: number): ActionResult {
    if (!Number.isFinite(yaw) || !Number.isFinite(forward)) return no('Invalid aim input.')
    return this.acceptMoveInput(seatId, Math.max(0, Math.min(1, forward)), 0, sequence, true, wrapAngle(yaw))
  }

  private acceptMoveInput(
    seatId: SeatId,
    x: number,
    z: number,
    sequence: number,
    steering: boolean,
    aimYaw?: number
  ): ActionResult {
    if (!this.active()) return no('Movement is locked during the intro or takeover.')
    if (!this.state.seats[seatId]) return no('Invalid astronaut.')
    const input =
      steering && Number.isFinite(x) && Number.isFinite(z)
        ? { x: Math.max(-1, Math.min(1, x)), z: Math.max(-1, Math.min(1, z)) }
        : normalizeMove(x, z)
    if (!input || !Number.isSafeInteger(sequence) || sequence < 0) return no('Invalid movement input.')
    if (sequence <= (this.inputs.get(seatId)?.sequence ?? -1)) return no('Stale movement input.')
    this.inputs.set(seatId, {
      ...input,
      sequence,
      steering,
      aimYaw,
      until: this.state.now + CHASE_CONFIG.inputTimeoutSeconds
    })
    return yes()
  }

  resetMovementInput(seatId: SeatId) {
    this.inputs.delete(seatId)
    this.botPlans.delete(seatId)
    const player = this.state.arena?.players[seatId]
    if (player) player.moving = false
  }

  join(playerId: string, name: string): SeatId | null {
    const wasBot = this.state.seats.find((seat) => seat.playerId === playerId)?.isBot
    const seatId = super.join(playerId, name)
    if (seatId !== null && wasBot) this.resetMovementInput(seatId)
    return seatId
  }

  disconnect(playerId: string) {
    const seat = this.state.seats.find((candidate) => candidate.playerId === playerId)
    if (seat && !seat.isBot) this.resetMovementInput(seat.id)
    super.disconnect(playerId)
  }

  pass(seatId: SeatId, alienId: AlienId, turn: number, _manual = true): ActionResult {
    if (!this.active()) return no('Throwing is locked during setup or takeover.')
    const alien = this.state.aliens.find((candidate) => candidate.id === alienId)
    if (!alien || alien.holderSeatId !== seatId || alien.turn !== turn) return no('You no longer hold that alien.')
    if (this.state.now < alien.readyAt) return no('Wait for the alien to arrive.')
    const target = this.nearbyTarget(alien)
    const decoy = this.nearbyShadow(alien)
    const source = this.state.arena!.players[seatId]
    if (
      decoy &&
      (target === undefined ||
        Math.hypot(decoy.x - source.x, decoy.z - source.z) <
          Math.hypot(this.state.arena!.players[target].x - source.x, this.state.arena!.players[target].z - source.z))
    ) {
      this.hitShadow(alien, decoy)
      return yes()
    }
    if (target === undefined) return no('Move closer to an eligible astronaut.')
    this.transfer(alien, target)
    return yes()
  }

  private nearbyTarget(alien: AlienState): SeatId | undefined {
    const source = this.state.arena!.players[alien.holderSeatId]
    return nearbyThrowTarget(
      source,
      this.state.arena!.players.filter((target) => this.eligibleTarget(alien, target.seatId)),
      this.throwTargets.get(alien.id),
      this.state.now,
      alien.turn
    )?.seatId
  }

  private eligibleShadows(attacker: SeatId): ShadowDecoy[] {
    const s = this.state
    if ((s.arena!.players[attacker].vaccinatedUntil ?? 0) > s.now) return []
    return (s.arena!.shadows ?? []).filter((shadow) => shadow.owner !== attacker && shadow.endsAt > s.now)
  }

  private nearbyShadow(alien: AlienState): ShadowDecoy | undefined {
    const source = this.state.arena!.players[alien.holderSeatId]
    return this.eligibleShadows(alien.holderSeatId)
      .filter((shadow) => Math.hypot(shadow.x - source.x, shadow.z - source.z) <= CHASE_CONFIG.throwRadius)
      .sort(
        (a, b) =>
          Math.hypot(a.x - source.x, a.z - source.z) - Math.hypot(b.x - source.x, b.z - source.z) ||
          a.id.localeCompare(b.id)
      )[0]
  }

  private hitShadow(alien: AlienState, shadow: ShadowDecoy) {
    const s = this.state
    s.arena!.shadows = s.arena!.shadows!.filter((other) => other.id !== shadow.id)
    s.seats[shadow.owner].heat++
    alien.readyAt = s.now + CHASE_CONFIG.arrivalGraceSeconds
    this.throwTargets.delete(alien.id)
    this.emit('REACTION_RESOLVED', alien.id, [shadow.owner], 1, `${s.seats[shadow.owner].displayName}: SHADOW +1`)
  }

  private spawnEcho(caster: SeatId): boolean {
    const s = this.state
    if (s.echoUsedThisRound || s.aliens.some((alien) => alien.id === 'ECHO')) return false
    const choices = s.arena!.players.filter(
      (other) =>
        other.seatId !== caster &&
        !s.aliens.some((alien) => alien.holderSeatId === other.seatId) &&
        other.immuneUntil <= s.now &&
        (other.vaccinatedUntil ?? 0) <= s.now
    )
    if (!choices.length) return false
    const holder = this.pick(choices)
    s.aliens.push({
      id: 'ECHO',
      holderSeatId: holder.seatId,
      turn: 0,
      heldSince: s.now,
      readyAt: s.now + CHASE_CONFIG.arrivalGraceSeconds
    })
    holder.touchedThisRound = true
    s.echoUsedThisRound = true
    return true
  }

  private updateThrowTargets() {
    for (const alien of this.state.aliens) {
      const targetId = this.nearbyTarget(alien)
      if (targetId === undefined) {
        this.throwTargets.delete(alien.id)
        continue
      }
      const source = this.state.arena!.players[alien.holderSeatId],
        target = this.state.arena!.players[targetId]
      // Leaving the core radius never refreshes the edge window.
      if (Math.hypot(target.x - source.x, target.z - source.z) <= CHASE_CONFIG.throwRadius)
        this.throwTargets.set(alien.id, {
          seatId: targetId,
          until: this.state.now + CHASE_CONFIG.throwEdgeGraceSeconds,
          turn: alien.turn
        })
    }
  }

  private eligibleTarget(alien: AlienState, target: SeatId): boolean {
    const s = this.state
    const protection = this.returnProtection.get(alien.id)
    return (
      target !== alien.holderSeatId &&
      !!s.seats[target] &&
      !s.aliens.some((other) => other.id !== alien.id && other.holderSeatId === target) &&
      s.arena!.players[target].immuneUntil <= s.now &&
      !(alien.id === 'ECHO' && (s.arena!.players[target].vaccinatedUntil ?? 0) > s.now) &&
      !(
        protection &&
        protection.turn === alien.turn &&
        protection.receiver === alien.holderSeatId &&
        protection.giver === target &&
        protection.until > s.now
      )
    )
  }

  private transfer(alien: AlienState, target: SeatId): boolean {
    if (!this.eligibleTarget(alien, target)) return false
    const s = this.state
    const source = alien.holderSeatId
    this.throwTargets.delete(alien.id)
    this.recentRecipients.set(source, { seatId: target, until: s.now + 4 })
    alien.holderSeatId = target
    alien.turn++
    this.returnProtection.set(alien.id, {
      giver: source,
      receiver: target,
      turn: alien.turn,
      until: s.now + CHASE_CONFIG.returnProtectionSeconds
    })
    alien.readyAt = s.now + CHASE_CONFIG.arrivalGraceSeconds
    alien.heldSince = s.now
    s.arena!.players[target].touchedThisRound = true
    s.seats[source].heat++
    s.seats[source].successfulPasses++
    this.emit('PASS', alien.id, [source, target], 1, `${s.seats[source].displayName}: +1`)
    return true
  }

  orderDeck(seatId: SeatId, cardIds: string[]): ActionResult {
    if (this.state.phase !== 'DECK_SETUP' && !this.active()) return no('Deck ordering is locked now.')
    const seat = this.state.seats[seatId]
    if (!seat) return no('Invalid astronaut.')
    const queue = queuedCards(seat.hand)
    if (
      cardIds.length !== queue.length ||
      new Set(cardIds).size !== queue.length ||
      cardIds.some((id) => !queue.some((card) => card.id === id))
    )
      return no('The deck changed. Try ordering it again.')
    seat.hand = [
      ...cardIds.map((id) => queue.find((card) => card.id === id)!),
      ...seat.hand.filter((card) => !queue.includes(card))
    ]
    armFirstCard(seat.hand)
    this.state.revision++
    return yes()
  }

  // Compatibility wrapper for archived clients/tests. Category no longer selects a slot.
  equip(seatId: SeatId, cardId: string | null, _category: 'REACTION' | 'INTERVENTION', target?: number): ActionResult {
    const seat = this.state.seats[seatId]
    const queue = queuedCards(seat?.hand ?? [])
    const card = queue.find((candidate) => candidate.id === cardId)
    if (!card) return no('Card unavailable.')
    if (target !== undefined && (!Number.isInteger(target) || !this.state.seats[target] || target === seatId))
      return no('Choose another astronaut.')
    const result = this.orderDeck(seatId, [
      card.id,
      ...queue.filter((other) => other !== card).map((other) => other.id)
    ])
    return result
  }

  chooseCardTarget(_seatId: SeatId, _cardId: string, _target: number): ActionResult {
    return no('Chaos teleports its user immediately; it has no target selection.')
  }

  activate(seatId: SeatId, cardId: string, targetId: AlienId): ActionResult {
    if (!this.active()) return no('Cards are locked during the intro or takeover.')
    const s = this.state
    const seat = s.seats[seatId]
    const card = seat?.hand.find((candidate) => candidate.id === cardId)
    if (!card || card.state !== 'ARMED' || queuedCards(seat.hand)[0] !== card || !isChaseCard(card.type))
      return no('Only the first card in your deck can activate.')
    if (!this.unlocked.get(seatId)?.includes(card.type)) return no('This card has not been unlocked.')
    if (s.now < seat.interventionReadyAt) return no('Wait a moment before activating another power.')
    const player = s.arena!.players[seatId]
    if (card.type === 'CHAOS') {
      const destination = chaosDestination(s.seed, this.chaosCasts, player, [
        ...s.arena!.players.filter((other) => other.seatId !== seatId),
        ...(s.arena!.shadows ?? [])
      ])
      if (!destination) return no('No valid teleport destination is available.')
      this.chaosCasts++
      player.x = destination.x
      player.z = destination.z
      player.teleportRevision = (player.teleportRevision ?? 0) + 1
      this.botPlans.delete(seatId)
      this.throwTargets.clear()
      card.state = 'SPENT'
      card.targetSeatId = undefined
      this.updateThrowTargets()
    } else if (card.type === 'TURBO' || card.type === 'DUPLICATE') {
      return no('This power is a board pickup, not a deck card.')
    } else if (card.type === 'FREEZE') {
      for (const other of s.arena!.players)
        if (other.seatId !== seatId) {
          if ((other.vaccinatedUntil ?? 0) > s.now) continue
          if (other.turboUntil > s.now) {
            other.turboUntil = 0
            other.frozenUntil = 0
          } else other.frozenUntil = Math.max(other.frozenUntil, s.now + CHASE_CONFIG.freezeSeconds)
        }
      card.state = 'SPENT'
    } else if (card.type === 'SKIP' || card.type === 'INVISIBLE') {
      if (card.type === 'SKIP') player.immuneUntil = s.now + CHASE_CONFIG.immunitySeconds
      else player.invisibleUntil = s.now + CHASE_CONFIG.invisibleSeconds
      card.state = 'ACTIVE'
    } else if (card.type === 'HIDDEN_WATCH') {
      const alien = s.aliens.find((candidate) => candidate.id === targetId)
      if (!alien) return no('That alien is no longer active.')
      const victim = s.seats[alien.holderSeatId]
      if (victim.hiddenUntil > s.now) return no('That astronaut already has a hidden timer.')
      victim.hiddenUntil = s.now + CHASE_CONFIG.hiddenWatchSeconds
      card.state = 'SPENT'
    } else if (card.type === 'VACUNE') {
      player.vaccinatedUntil = s.fuseEndsAt
      player.frozenUntil = 0
      card.state = 'ACTIVE'
    } else if (card.type === 'SHADOW') {
      s.arena!.shadows!.push({
        id: card.id,
        owner: seatId,
        x: player.x,
        z: player.z,
        yaw: player.yaw,
        bornAt: s.now,
        endsAt: s.now + 5
      })
      card.state = 'SPENT'
    } else if (card.type === 'SYMBIOSIS') {
      const alien = s.aliens.find((other) => other.holderSeatId === seatId)
      if (!alien || s.now < alien.readyAt) return no('Hold an arrived alien before using Symbiosis.')
      const targets = [
        ...s
          .arena!.players.filter((other) => other.seatId !== seatId)
          .map((other) => ({ ...other, shadow: undefined as ShadowDecoy | undefined })),
        ...this.eligibleShadows(seatId).map((shadow) => ({ ...shadow, seatId: shadow.owner, shadow }))
      ]
      const hit = forwardHit(player, targets)
      const distance = hit ? Math.min(5, Math.hypot(hit.x - player.x, hit.z - player.z)) : 5
      s.arena!.shots!.push({
        id: card.id,
        x: player.x,
        z: player.z,
        toX: player.x + Math.sin(player.yaw) * distance,
        toZ: player.z + Math.cos(player.yaw) * distance,
        at: s.now,
        endsAt: s.now + 0.35
      })
      if (hit?.shadow) this.hitShadow(alien, hit.shadow)
      else if (hit) this.transfer(alien, hit.seatId)
      card.state = 'SPENT'
    }
    seat.interventionReadyAt = s.now + 1.2
    seat.heat++
    armFirstCard(seat.hand)
    this.emit('CARD', targetId, [seatId], 1, `${seat.displayName}: ${CHASE_CARD_DETAILS[card.type].name} +1`, card.type)
    return yes()
  }

  protected updateGameplay(seconds: number) {
    const s = this.state
    const players = s.arena!.players
    const motions = players.map((player) => ({ seatId: player.seatId, from: { x: player.x, z: player.z }, to: player }))
    for (const player of players) {
      const input = this.inputs.get(player.seatId)
      const fresh = input && input.until > s.now
      if (fresh && input.aimYaw !== undefined) aimChasePlayer(player, input.x, input.aimYaw, seconds, s.now)
      else if (fresh && input.steering) steerChasePlayer(player, input.x, input.z, seconds, s.now)
      else moveChasePlayer(player, fresh ? input.x : 0, fresh ? input.z : 0, seconds, s.now)
      for (const card of s.seats[player.seatId].hand)
        if (
          card.state === 'ACTIVE' &&
          ((card.type === 'SKIP' && player.immuneUntil <= s.now) ||
            (card.type === 'INVISIBLE' && player.invisibleUntil <= s.now))
        )
          card.state = 'SPENT'
    }
    const pickups = resolveCoinContacts(s.arena!.coins ?? [], motions)
    s.arena!.coins = pickups.remaining
    for (const claim of pickups.claims) {
      s.seats[claim.seatId].heat++
      this.emit('COIN', 'ORIGINAL', [claim.seatId], 1, `${s.seats[claim.seatId].displayName}: +1`)
    }
    // Merely touching never transfers an alien. Teleportation is not a transfer either.
    for (const shadow of s.arena!.shadows ?? []) moveShadow(shadow, s.seed, seconds, s.now)
    s.arena!.shadows = (s.arena!.shadows ?? []).filter((shadow) => shadow.endsAt > s.now)
    s.arena!.shots = (s.arena!.shots ?? []).filter((shot) => shot.endsAt > s.now)
    s.arena!.powers = (s.arena!.powers ?? []).filter((power) => {
      if (power.opensAt > s.now) return true
      // A body crossing before the pickup actually appears cannot collect it.
      const fraction = Math.max(0, Math.min(1, (power.opensAt - (s.now - seconds)) / seconds))
      const collector = firstPowerCollector(
        power,
        motions.map((motion) => ({
          ...motion,
          from: {
            x: motion.from.x + (motion.to.x - motion.from.x) * fraction,
            z: motion.from.z + (motion.to.z - motion.from.z) * fraction
          }
        }))
      )
      if (collector === undefined) return true
      if (power.type === 'TURBO') {
        players[collector].turboUntil = s.fuseEndsAt
        players[collector].frozenUntil = 0
      } else if (!this.spawnEcho(collector)) return true
      s.seats[collector].heat++
      this.emit(
        'CARD',
        'ORIGINAL',
        [collector],
        1,
        `${s.seats[collector].displayName}: ${CHASE_CARD_DETAILS[power.type].name} +1`,
        power.type
      )
      return false
    })
    this.updateThrowTargets()
    s.revision++
  }

  protected bots() {
    const s = this.state,
      players = s.arena!.players
    for (const seat of s.seats) {
      if (!seat.isBot) continue
      const self = players[seat.id]
      let held = s.aliens.find((alien) => alien.holderSeatId === seat.id)
      if (held) this.pass(seat.id, held.id, held.turn)
      held = s.aliens.find((alien) => alien.holderSeatId === seat.id)
      const vaccinated = (self.vaccinatedUntil ?? 0) > s.now
      const visible = players
        .filter((other) => other.seatId !== seat.id && (vaccinated || other.invisibleUntil <= s.now))
        .filter((other) => !held || this.eligibleTarget(held, other.seatId))
        .map((other) => (vaccinated ? { ...other, invisibleUntil: 0 } : other))
      const holders = s.aliens.map((alien) => alien.holderSeatId)
      const recent = this.recentRecipients.get(seat.id)
      const plan = planChaseBot(
        self,
        visible,
        holders,
        s.now,
        s.seed,
        this.botPlans.get(seat.id),
        recent && recent.until > s.now ? recent.seatId : undefined,
        [...(s.arena!.coins ?? []), ...(s.arena!.powers ?? []).filter((power) => power.opensAt <= s.now)]
      )
      if (held) {
        const decoy = this.eligibleShadows(seat.id).sort(
          (a, b) => Math.hypot(a.x - self.x, a.z - self.z) - Math.hypot(b.x - self.x, b.z - self.z)
        )[0]
        const target = visible.find((other) => other.seatId === plan.target)
        if (
          decoy &&
          (!target || Math.hypot(decoy.x - self.x, decoy.z - self.z) < Math.hypot(target.x - self.x, target.z - self.z))
        )
          plan.heading = Math.atan2(decoy.x - self.x, decoy.z - self.z)
      }
      this.botPlans.set(seat.id, plan)
      this.aimInput(seat.id, 1, plan.heading, (this.inputs.get(seat.id)?.sequence ?? -1) + 1)
      const nearestThreat = visible
        .filter((other) => holders.includes(other.seatId))
        .sort(
          (a, b) =>
            Math.hypot(a.x - self.x, a.z - self.z) - Math.hypot(b.x - self.x, b.z - self.z) || a.seatId - b.seatId
        )[0]
      if (s.now < seat.interventionReadyAt || s.now - s.roundStartedAt < 2 + seat.id * 0.6) continue
      const danger = nearestThreat && Math.hypot(nearestThreat.x - self.x, nearestThreat.z - self.z) < 3
      const prey = visible.find((other) => other.seatId === plan.target)
      const card = seat.hand.find(
        (candidate) =>
          (candidate.state === 'AVAILABLE' || candidate.state === 'ARMED') &&
          (candidate.type === 'FREEZE'
            ? !!held && !!prey && Math.hypot(prey.x - self.x, prey.z - self.z) < 6 && prey.frozenUntil <= s.now
            : candidate.type === 'SKIP' || candidate.type === 'INVISIBLE'
              ? !held && danger
              : candidate.type === 'TURBO'
                ? !!held || danger
                : candidate.type === 'CHAOS'
                  ? danger || (!!held && s.fuseEndsAt - s.now < 8)
                  : candidate.type === 'DUPLICATE'
                    ? !s.echoUsedThisRound && s.fuseEndsAt - s.now > 6
                    : candidate.type === 'SHADOW'
                      ? !held && danger
                      : candidate.type === 'VACUNE'
                        ? s.now - s.roundStartedAt < 6 || danger
                        : candidate.type === 'SYMBIOSIS'
                          ? !!held && !!prey && Math.hypot(prey.x - self.x, prey.z - self.z) <= 5
                          : candidate.type === 'HIDDEN_WATCH' &&
                            s.aliens.some((alien) => alien.holderSeatId !== seat.id))
      )
      if (!card) continue
      const affectedAlien = s.aliens.find((alien) => alien.holderSeatId !== seat.id)?.id ?? 'ORIGINAL'
      if (this.equip(seat.id, card.id, 'INTERVENTION').accepted) this.activate(seat.id, card.id, affectedAlien)
    }
  }

  protected takeoverScore(score: number): number {
    return score
  }

  protected takeover() {
    if (this.state.phase !== 'HOLDING') return
    this.state.arena!.coins = []
    this.state.arena!.powers = []
    this.state.arena!.shadows = []
    this.state.arena!.shots = []
    this.returnProtection.clear()
    this.throwTargets.clear()
    for (const player of this.state.arena!.players) {
      player.moving = false
      player.invisibleUntil = player.frozenUntil = player.immuneUntil = 0
      player.turboUntil = 0
      player.vaccinatedUntil = 0
      if (!player.touchedThisRound) {
        this.state.seats[player.seatId].heat++
        this.emit(
          'REACTION_RESOLVED',
          'ORIGINAL',
          [player.seatId],
          1,
          `${this.state.seats[player.seatId].displayName}: UNTOUCHED +1`
        )
      }
    }
    for (const seat of this.state.seats) for (const card of seat.hand) card.state = 'SPENT'
    this.inputs.clear()
    super.takeover()
  }

  snapshot(localSeatId: SeatId | null) {
    const result = super.snapshot(localSeatId)
    const reveals =
      localSeatId !== null && (this.state.arena!.players[localSeatId].vaccinatedUntil ?? 0) > this.state.now
    const held =
      this.state.phase === 'HOLDING' && localSeatId !== null
        ? this.state.aliens.find((alien) => alien.holderSeatId === localSeatId && alien.readyAt <= this.state.now)
        : undefined
    const throwTarget = held ? this.nearbyTarget(held) : undefined
    const guard = held ? this.returnProtection.get(held.id) : undefined
    const guardedGiver = guard ? this.state.arena!.players[guard.giver] : undefined
    const local = localSeatId === null ? undefined : this.state.arena!.players[localSeatId]
    result.seats = result.seats.map((seat) => ({ ...seat, hand: seat.id === localSeatId ? seat.hand : [] }))
    result.arena = {
      ...this.state.arena!,
      coins: this.state.arena!.coins?.map((coin) => ({ ...coin })),
      powers: this.state
        .arena!.powers?.filter((power) => power.opensAt <= this.state.now)
        .map((power) => ({ ...power })),
      shadows: this.state.arena!.shadows?.map((shadow) => ({ ...shadow })),
      shots: this.state.arena!.shots?.map((shot) => ({ ...shot })),
      motion: [...this.inputs.entries()]
        .filter(
          ([seatId, input]) =>
            input.until > this.state.now &&
            (reveals || seatId === localSeatId || this.state.arena!.players[seatId].invisibleUntil <= this.state.now)
        )
        .map(([seatId, input]) => ({
          seatId,
          x: input.x,
          z: input.z,
          until: input.until,
          steering: input.steering,
          aimYaw: input.aimYaw
        })),
      throwReady: throwTarget !== undefined || (!!held && this.nearbyShadow(held) !== undefined),
      returnBlockedUntil:
        guard &&
        held &&
        guard.turn === held.turn &&
        guard.until > this.state.now &&
        local &&
        guardedGiver &&
        Math.hypot(local.x - guardedGiver.x, local.z - guardedGiver.z) <=
          CHASE_CONFIG.throwRadius + CHASE_CONFIG.throwEdgeTolerance
          ? guard.until
          : undefined,
      throwTargetSeatId:
        throwTarget !== undefined &&
        (reveals || this.state.arena!.players[throwTarget].invisibleUntil <= this.state.now)
          ? throwTarget
          : undefined,
      players: this.state.arena!.players.map((player) => ({
        ...player,
        // Do not disclose hidden enemies' live coordinates in an ordinary snapshot.
        x: !reveals && player.invisibleUntil > this.state.now && player.seatId !== localSeatId ? 0 : player.x,
        z: !reveals && player.invisibleUntil > this.state.now && player.seatId !== localSeatId ? 0 : player.z
      }))
    }
    return result
  }
}

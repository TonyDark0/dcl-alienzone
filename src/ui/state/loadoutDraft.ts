import { CHASE_CARD_DETAILS } from '../../game/rules/chaseCards'
import { defaultLoadout, validateLoadout, type DeckCardType, type MatchLoadout } from '../../game/rules/loadouts'

export type LoadoutDraft = { plan: MatchLoadout; round: number; slot: number; message: string }

export function createLoadoutDraft(): LoadoutDraft {
  return { plan: defaultLoadout(), round: 0, slot: 0, message: '' }
}

export function slotLabel(round: number, slot: number) {
  return `Round ${round + 1} · Card ${slot + 1}`
}

export function selectLoadoutSlot(draft: LoadoutDraft, round: number, slot: number): LoadoutDraft {
  if (![round, slot].every((index) => Number.isInteger(index) && index >= 0 && index < 3)) return draft
  return { ...draft, round, slot, message: '' }
}

/** A selected Epic is legal in its own slot, but cannot be duplicated elsewhere. */
export function epicPlacement(draft: LoadoutDraft, type: DeckCardType) {
  if (CHASE_CARD_DETAILS[type].rarity !== 'EPIC') return null
  for (let round = 0; round < 3; round++) {
    for (let slot = 0; slot < 3; slot++) {
      if (draft.plan[round][slot] === type && (round !== draft.round || slot !== draft.slot)) return { round, slot }
    }
  }
  return null
}

export function replaceLoadoutCard(draft: LoadoutDraft, type: DeckCardType): LoadoutDraft {
  const placement = epicPlacement(draft, type)
  if (placement)
    return {
      ...draft,
      message: `${CHASE_CARD_DETAILS[type].name} is already in ${slotLabel(placement.round, placement.slot)}.`
    }
  if (draft.plan[draft.round][draft.slot] === type) return draft
  const plan = draft.plan.map((row) => [...row]) as MatchLoadout
  plan[draft.round][draft.slot] = type
  if (!validateLoadout(plan)) return draft
  return {
    ...draft,
    plan,
    message: `${slotLabel(draft.round, draft.slot)} changed to ${CHASE_CARD_DETAILS[type].name}.`
  }
}

export function moveLoadoutCard(draft: LoadoutDraft, direction: -1 | 1): LoadoutDraft {
  const next = draft.slot + direction
  if (next < 0 || next > 2) return draft
  const plan = draft.plan.map((row) => [...row]) as MatchLoadout
  const row = plan[draft.round]
  ;[row[draft.slot], row[next]] = [row[next], row[draft.slot]]
  return {
    ...draft,
    plan,
    slot: next,
    message: `${CHASE_CARD_DETAILS[row[next]].name} moved to ${slotLabel(draft.round, next)}.`
  }
}

const ROOT = 'assets/Images/ui/tutorial/v001'

export const OBJECTIVE_LORE =
  'A baby alien hatched inside the ship. When its timer expires, it attacks the astronaut carrying it.'
export const OBJECTIVE_GOAL = 'Avoid the attacks and finish all 3 rounds with the most points.'

export const OBJECTIVE_STEPS = [
  {
    title: 'MOVE & EVADE',
    icon: `${ROOT}/az_ui_tutorial_move_v001.png`,
    desktop: 'W A S D',
    touch: 'MOVE JOYSTICK',
    description:
      'Run around the ship to escape the carrier, approach a target or collect coins. Everyone has the same base speed.'
  },
  {
    title: 'GET CLOSE & THROW',
    icon: `${ROOT}/az_ui_tutorial_throw_v001.png`,
    desktop: 'SPACE · THROW',
    touch: 'TAP THROW ALIEN',
    description:
      'Carry the alien near an eligible astronaut. When THROW lights up, press it for +1 on a successful pass. Touching alone never passes it.'
  },
  {
    title: 'PREPARE & PLAY CARDS',
    icon: `${ROOT}/az_ui_tutorial_deck_v001.png`,
    desktop: 'F · ACTIVATE',
    touch: 'TAP THE READY CARD',
    description:
      'Set 3 cards for each round before finding a match. Play the first card for +1. Reorder any time; unused cards expire each round.'
  },
  {
    title: 'COLLECT SHARED COINS',
    icon: `${ROOT}/az_ui_tutorial_coins_v001.png`,
    desktop: 'FIRST CONTACT · +1',
    touch: 'FIRST CONTACT · +1',
    description:
      'Be first to touch a coin for +1. There are 10 per round, shared by everyone. Collected coins vanish; leftovers expire, with no respawn.'
  },
  {
    title: 'WATCH THE ALIEN',
    icon: `${ROOT}/az_ui_tutorial_danger_v001.png`,
    desktop: 'SHARED TIMER',
    touch: 'SHARED TIMER',
    description:
      'The original alien attacks its holder when time runs out. Holding it gives no points. Avoid both aliens for an entire round to earn +1.'
  },
  {
    title: 'CONTAIN THE ATTACK',
    icon: `${ROOT}/az_ui_tutorial_contain_v001.png`,
    desktop: 'CLICK LIT TARGETS',
    touch: 'TAP LIT TARGETS',
    description:
      'If attacked, hit at least 3 of 5 timed targets for +1. The crew contains attacks 1 and 2. Attack 3 ends the match, even if you earn the bonus.'
  }
] as const

export const OBJECTIVE_PAGES = [0, 1, 2] as const

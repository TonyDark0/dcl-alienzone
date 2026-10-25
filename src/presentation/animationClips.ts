// Verified against the exported animation input accessors in all eight variants.
export const ASTRONAUT_CLIP_SECONDS = {
  AST_SIT_DOWN: 3.566666666666667,
  AST_PASS: 0.4
} as const

export const ASTRONAUT_CLIPS = {
  idleStanding: 'AST_IDLE_STANDING',
  sitDown: 'AST_SIT_DOWN',
  idleSeated: 'AST_IDLE_SEATED',
  receiveLeft: 'AST_RECEIVE_LEFT',
  receiveRight: 'AST_RECEIVE_RIGHT',
  holdSafe: 'AST_HOLD_SAFE',
  holdDanger: 'AST_HOLD_DANGER',
  holdCritical: 'AST_HOLD_CRITICAL',
  passLeft: 'AST_PASS_LEFT',
  passRight: 'AST_PASS_RIGHT',
  playCard: 'AST_PLAY_CARD',
  defend: 'AST_DEFEND',
  takeover: 'AST_TAKEOVER',
  victory: 'AST_VICTORY'
} as const

export const ALIEN_CLIPS = {
  hatchExit: 'ALN_HATCH_EXIT',
  idle: 'ALN_IDLE_CUTE',
  attach: 'ALN_ATTACH',
  heldHappy: 'ALN_HELD_HAPPY',
  passFlight: 'ALN_PASS_FLIGHT',
  agitated: 'ALN_AGITATED',
  critical: 'ALN_CRITICAL',
  takeover: 'ALN_TAKEOVER'
} as const

export const SEAT_CLIPS = {
  idle: 'SEAT_IDLE',
  takeoverRecline: 'SEAT_TAKEOVER_RECLINE'
} as const

export const EGG_CLIPS = {
  hatch: 'EGG_HATCH'
} as const

export const VFX_CLIPS = {
  hatchBurst: 'VFX_HATCH_BURST',
  takeoverBurst: 'VFX_TAKEOVER_BURST'
} as const

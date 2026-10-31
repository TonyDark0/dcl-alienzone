export const UI_MOTION = { hover: 120, press: 80, release: 110, enter: 220, exit: 160, picker: 160 } as const

export function easeOutUi(value: number): number {
  const t = Math.max(0, Math.min(1, value))
  return 1 - (1 - t) ** 3
}

export interface MenuMotionState {
  shown: string
  requested: string
  startedAt: number
  stage: 'enter' | 'idle' | 'exit'
}

export function createMenuMotion(key: string, now: number): MenuMotionState {
  return { shown: key, requested: key, startedAt: now, stage: 'enter' }
}

/** Pure, interruptible menu state. It never dispatches or delays gameplay requests. */
export function stepMenuMotion(state: MenuMotionState, requested: string, now: number) {
  if (requested !== state.requested) {
    state.requested = requested
    if (requested === state.shown) {
      state.stage = 'enter'
      state.startedAt = now
    } else if (state.stage !== 'exit') {
      state.stage = 'exit'
      state.startedAt = now
    }
  }
  if (state.stage === 'exit' && now - state.startedAt >= UI_MOTION.exit) {
    state.shown = state.requested
    state.stage = 'enter'
    state.startedAt = now
  }
  if (state.stage === 'enter' && now - state.startedAt >= UI_MOTION.enter) state.stage = 'idle'
  const opacity =
    state.stage === 'exit'
      ? 1 - easeOutUi((now - state.startedAt) / UI_MOTION.exit)
      : state.stage === 'enter'
        ? easeOutUi((now - state.startedAt) / UI_MOTION.enter)
        : 1
  return { key: state.shown, opacity, offset: (1 - opacity) * 8, blocking: state.stage === 'exit' }
}

const entrances = new Map<string, { visible: boolean; startedAt: number }>()
export function entranceMotion(id: string, visible: boolean, duration: number = UI_MOTION.enter, now = Date.now()) {
  let entry = entrances.get(id)
  if (!entry) {
    entry = { visible: false, startedAt: now }
    entrances.set(id, entry)
  }
  if (visible && !entry.visible) entry.startedAt = now
  entry.visible = visible
  const opacity = visible ? easeOutUi((now - entry.startedAt) / duration) : 0
  return { opacity, offset: (1 - opacity) * 8 }
}

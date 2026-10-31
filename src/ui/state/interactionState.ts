// React-ECS re-renders every frame, so this small presentation-only state is
// enough for desktop hover feedback. Gameplay state never depends on it.
import { easeOutUi } from './uiMotion'

let hoveredControl: string | null = null
const motion = new Map<
  string,
  { hover: number; from: number; target: number; updatedAt: number; pressedUntil: number }
>()

function freshControl(now: number) {
  if (motion.size >= 128) motion.clear()
  return { hover: 0, from: 0, target: 0, updatedAt: now, pressedUntil: 0 }
}

export function pressControl(controlId: string, now = Date.now()) {
  const entry = motion.get(controlId) ?? freshControl(now)
  entry.pressedUntil = now + 80
  motion.set(controlId, entry)
}

export function getControlMotion(controlId: string, disabled = false, now = Date.now()) {
  let entry = motion.get(controlId)
  if (!entry) {
    entry = freshControl(now)
    motion.set(controlId, entry)
  }
  const target = !disabled && hoveredControl === controlId ? 1 : 0
  if (target !== entry.target) {
    entry.from = entry.hover
    entry.target = target
    entry.updatedAt = now
  }
  entry.hover = entry.from + (entry.target - entry.from) * easeOutUi((now - entry.updatedAt) / 120)
  const press =
    disabled || entry.pressedUntil <= 0
      ? 0
      : now < entry.pressedUntil
        ? 1
        : Math.max(0, 1 - (now - entry.pressedUntil) / 110)
  return { hover: entry.hover, press }
}

export function isControlHovered(controlId: string): boolean {
  return hoveredControl === controlId
}

export function setControlHovered(controlId: string, hovered: boolean) {
  if (hovered) {
    hoveredControl = controlId
    return
  }

  if (hoveredControl === controlId) hoveredControl = null
}

// React-ECS re-renders every frame, so this small presentation-only state is
// enough for desktop hover feedback. Gameplay state never depends on it.
let hoveredControl: string | null = null

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

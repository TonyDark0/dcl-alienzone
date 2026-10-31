/** A central six-position target field avoids native HUD corners on both platforms. */
export function containmentLayout(width: number, height: number, mobile: boolean, slot: number) {
  const targetSize = mobile ? 108 : 120
  const fieldWidth = Math.max(targetSize, Math.min(600, width * 0.48))
  const fieldHeight = Math.max(targetSize, Math.min(240, height * 0.32))
  const safeSlot = Math.min(5, Math.max(0, Math.floor(slot)))
  return {
    targetSize,
    fieldWidth,
    fieldHeight,
    left: (safeSlot % 3) * ((fieldWidth - targetSize) / 2),
    top: Math.floor(safeSlot / 3) * (fieldHeight - targetSize)
  }
}

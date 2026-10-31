/** Layout uses SDK virtual units, never raw device pixels or an extra interactable inset. */
export function hudLayout(width: number, height: number, mobile: boolean, insetWidth = 0) {
  const referenceWidth = mobile ? 1600 : 1920
  const referenceHeight = mobile ? 720 : 1080
  const scale = Math.max(0.01, Math.min(width / referenceWidth, height / referenceHeight))
  const virtualWidth = Math.max(0, width - insetWidth) / scale
  const compact = mobile || height <= 800
  const wingWidth = compact ? 300 : 332
  const passWidth = compact ? 360 : 460
  const gap = 16
  const stacked = virtualWidth < passWidth + 2 * wingWidth + 2 * gap + 448
  return { compact, wingWidth, passWidth, gap, stacked, virtualWidth }
}

/** Match the first scoreboard row's exact virtual size and vertical position. */
export function powerToastLayout(compact: boolean, mobile: boolean) {
  const edge = compact ? 12 : 24
  return {
    top: (mobile ? edge : 118) + (compact ? 60 : 72) + 4 + (compact ? 6 : 8),
    right: mobile ? edge : 56,
    width: (compact ? 176 : 224) - (compact ? 12 : 16),
    height: compact ? 28 : 34
  }
}

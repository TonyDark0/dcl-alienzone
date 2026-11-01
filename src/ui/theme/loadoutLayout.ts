/** Use the same virtual reference as the main renderer; do not apply the scale twice. */
export function loadoutLayout(width: number, height: number, mobile: boolean, compact: boolean) {
  const scale = Math.max(0.01, Math.min(width / (mobile ? 1600 : 1920), height / (mobile ? 720 : 1080)))
  const narrow = width / Math.max(1, height) < 1.25
  // Narrow panels use their available physical width and compensate this renderer's
  // known virtual scale, not a guessed global mobile multiplier.
  const density = narrow ? Math.max(1, 1 / scale) : 1
  const panelWidth = Math.min(narrow ? Number.POSITIVE_INFINITY : 1540, Math.floor((width / scale) * 0.96))
  const panelHeight = Math.min(narrow ? 1000 * density : 940, Math.floor((height / scale) * 0.94))
  const padding = (compact ? 16 : 24) * density
  const innerWidth = panelWidth - padding * 2
  const stacked = width / Math.max(1, height) < 1.25 || innerWidth < 1280
  const deckWidth = stacked ? innerWidth : Math.floor((innerWidth - 32) * 0.34)
  const catalogWidth = stacked ? innerWidth : Math.floor((innerWidth - 32) * 0.43)
  const detailWidth = stacked ? innerWidth : innerWidth - deckWidth - catalogWidth - 32
  // Header 84 + footer 88. All three panes have explicit, independently budgeted heights.
  const bodyHeight = panelHeight - padding * 2 - 172 * density
  const paneHeight = bodyHeight - (stacked ? 50 * density : 0)
  const catalogColumns = Math.max(1, Math.min(3, Math.floor((catalogWidth - 24 * density) / (140 * density))))
  const cardWidth = Math.min(
    (compact ? 156 : 180) * density,
    Math.floor((catalogWidth - (24 + 12 * catalogColumns) * density) / catalogColumns)
  )
  const cardHeight = Math.round(cardWidth * 1.42)
  const catalogRows = Math.max(1, Math.min(2, Math.floor((paneHeight - 180 * density) / (cardHeight + 12 * density))))
  return {
    panelWidth,
    density,
    panelHeight,
    padding,
    stacked,
    bodyHeight,
    paneHeight,
    catalogRows,
    catalogColumns,
    cardWidth,
    cardHeight,
    deckWidth,
    catalogWidth,
    detailWidth,
    slotHeight: (compact ? 80 : 94) * density
  }
}

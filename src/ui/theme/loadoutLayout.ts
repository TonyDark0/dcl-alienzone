/** Use the same virtual reference as the main renderer; do not apply the scale twice. */
export function loadoutLayout(width: number, height: number, mobile: boolean, compact: boolean) {
  const scale = Math.max(0.01, Math.min(width / (mobile ? 1600 : 1920), height / (mobile ? 720 : 1080)))
  const panelWidth = Math.min(1240, Math.floor((width / scale) * 0.92))
  const panelHeight = Math.min(940, Math.floor((height / scale) * 0.94))
  const padding = compact ? 16 : 24
  const innerWidth = panelWidth - padding * 2
  const stacked = width / Math.max(1, height) < 1.25 || innerWidth < 900
  const deckWidth = stacked ? innerWidth : Math.floor((innerWidth - 16) * 0.56)
  // Header: 44 + 30 + 6. Footer: 36 + 64. Explicit height avoids nested percentage overflow.
  const bodyHeight = panelHeight - padding * 2 - 180
  const paneHeight = bodyHeight - (stacked ? 50 : 0)
  // Catalog padding 24, context 112, category tabs 48, pager 54, pickup note 24.
  const catalogRows = Math.max(1, Math.min(4, Math.floor((paneHeight - 262) / 92)))
  return {
    panelWidth,
    panelHeight,
    padding,
    stacked,
    bodyHeight,
    paneHeight,
    catalogRows,
    deckWidth,
    catalogWidth: stacked ? innerWidth : innerWidth - deckWidth - 16,
    slotHeight: compact ? 82 : 94
  }
}

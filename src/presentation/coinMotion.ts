/** Small presentation-only entrance bounce; no collision/score timing lives here. */
export function coinEntranceScale(age: number): number {
  const t = Math.max(0, Math.min(1, age / 0.45))
  const back = 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2
  return 0.12 + 0.88 * back
}

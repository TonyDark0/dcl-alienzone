export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function smoothBlendProgress(elapsedSeconds: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 1

  const progress = clamp01(elapsedSeconds / durationSeconds)
  // Quintic smootherstep keeps velocity and acceleration continuous at both
  // ends of the crossfade, avoiding the mechanical snap of a short linear fade.
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10)
}

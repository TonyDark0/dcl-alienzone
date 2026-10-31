export const NOTICE_ANIMATION_SECONDS = 2.2

/** Coin pickups get their own readable profile; ordinary point/card notices stay unchanged. */
export function noticeAnimation(elapsed: number, coin = false) {
  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  const entry = coin ? 0.14 : 0.22
  const holdUntil = coin ? 1.55 : 1.35
  const visibility = Math.min(
    clamp(elapsed / entry),
    1 - clamp((elapsed - holdUntil) / (NOTICE_ANIMATION_SECONDS - holdUntil))
  )
  return {
    visibility,
    scale: (0.5 + visibility * 0.5) * (coin ? 2.2 : 1),
    height: coin ? 1.85 : 1.652,
    rise: clamp((elapsed - entry) / (NOTICE_ANIMATION_SECONDS - entry)) * (coin ? 0.28 : 0.12),
    outline: coin ? 0.22 : 0.14
  }
}

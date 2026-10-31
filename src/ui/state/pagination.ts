/** Always expose whole items; clamp stale pages after the list changes. */
export function pageWindow<T>(items: readonly T[], requestedPage: number, requestedSize: number) {
  const size = Math.max(1, Math.floor(Number.isFinite(requestedSize) ? requestedSize : 1))
  const count = Math.max(1, Math.ceil(items.length / size))
  const page = Math.max(0, Math.min(count - 1, Math.floor(Number.isFinite(requestedPage) ? requestedPage : 0)))
  const start = page * size
  return { page, count, start, items: items.slice(start, start + size) }
}

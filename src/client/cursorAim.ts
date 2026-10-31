/** Intersect the pointer ray with the movement plane, not the clicked mesh. */
export function cursorAimYaw(
  player: { x: number; z: number },
  origin: { x: number; y: number; z: number },
  ray: { x: number; y: number; z: number }
): number | null {
  if (![origin.x, origin.y, origin.z, ray.x, ray.y, ray.z].every(Number.isFinite) || ray.y >= -0.0001) return null
  const distance = -origin.y / ray.y
  if (distance < 0) return null
  const dx = origin.x + ray.x * distance - player.x,
    dz = origin.z + ray.z * distance - player.z
  return Math.hypot(dx, dz) < 0.15 ? null : Math.atan2(dx, dz)
}

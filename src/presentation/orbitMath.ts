export interface OrbitPoint {
  x: number
  y: number
  z: number
}

export function orbitPoint(
  centerX: number,
  centerZ: number,
  radius: number,
  height: number,
  angleRadians: number
): OrbitPoint {
  return {
    x: centerX + Math.sin(angleRadians) * radius,
    y: height,
    z: centerZ + Math.cos(angleRadians) * radius
  }
}

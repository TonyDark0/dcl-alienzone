import { describe, expect, it } from 'vitest'

import { orbitPoint } from '../src/presentation/orbitMath'

describe('orbitPoint', () => {
  it('keeps camera radius and height fixed around the arena center', () => {
    const centerX = 16
    const centerZ = 16
    const radius = 12
    const point = orbitPoint(centerX, centerZ, radius, 7, Math.PI / 3)
    const measuredRadius = Math.hypot(point.x - centerX, point.z - centerZ)

    expect(measuredRadius).toBeCloseTo(radius)
    expect(point.y).toBe(7)
  })
})

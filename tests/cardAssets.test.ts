import { readFileSync, readdirSync } from 'node:fs'
import { dirname, basename, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CARD_DETAILS } from '../src/game/rules/deck'

describe('power and brand PNG assets', () => {
  it('resolves all six icons with exact casing and alpha at the mobile budget', () => {
    for (const card of Object.values(CARD_DETAILS)) {
      const file = resolve(card.icon)
      let cursor = process.cwd()
      for (const part of card.icon.split('/')) {
        expect(readdirSync(cursor), `Path case: ${card.icon}`).toContain(part)
        cursor = resolve(cursor, part)
      }
      const bytes = readFileSync(file)
      expect(bytes.subarray(1, 4).toString()).toBe('PNG')
      expect(bytes.readUInt32BE(16)).toBe(256)
      expect(bytes.readUInt32BE(20)).toBe(256)
      expect(bytes[25], `RGBA: ${card.icon}`).toBe(6)
      expect(bytes.length).toBeLessThan(250_000)
    }
    const logo = 'assets/Images/ui/branding/az_logo_alienzone_v001.png'
    expect(readdirSync(dirname(logo))).toContain(basename(logo))
    expect(readFileSync(logo)[25]).toBe(6)
  })
})

import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { SCI_FI_SLICES, SCI_FI_TEXTURES } from '../src/ui/theme/sciFiSkins'

function decodeRgba(file: string) {
  const png = readFileSync(file)
  expect(png.subarray(1, 4).toString()).toBe('PNG')
  expect(png.readUInt32BE(16)).toBe(512)
  expect(png.readUInt32BE(20)).toBe(256)
  expect(png[24]).toBe(8)
  expect(png[25]).toBe(6)
  const chunks: Buffer[] = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset)
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT')
      chunks.push(png.subarray(offset + 8, offset + 8 + length))
    offset += length + 12
  }
  const raw = inflateSync(Buffer.concat(chunks))
  const stride = 512 * 4
  const pixels = Buffer.alloc(stride * 256)
  for (let y = 0; y < 256; y++) {
    const filter = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? pixels[y * stride + x - 4] : 0
      const b = y ? pixels[(y - 1) * stride + x] : 0
      const c = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0
      const p = a + b - c
      const pa = Math.abs(p - a),
        pb = Math.abs(p - b),
        pc = Math.abs(p - c)
      const predictor =
        filter === 1
          ? a
          : filter === 2
            ? b
            : filter === 3
              ? Math.floor((a + b) / 2)
              : filter === 4
                ? pa <= pb && pa <= pc
                  ? a
                  : pb <= pc
                    ? b
                    : c
                : 0
      pixels[y * stride + x] = (raw[y * (stride + 1) + x + 1] + predictor) & 255
    }
  }
  return (x: number, y: number) => [...pixels.subarray((y * 512 + x) * 4, (y * 512 + x) * 4 + 4)]
}

describe('shared sci-fi UI skins', () => {
  it('ships exactly three small RGBA textures, with exact path casing', () => {
    expect(Object.keys(SCI_FI_TEXTURES)).toHaveLength(3)
    for (const file of Object.values(SCI_FI_TEXTURES)) {
      let cursor = process.cwd()
      for (const part of file.split('/')) {
        expect(readdirSync(cursor)).toContain(part)
        cursor = resolve(cursor, part)
      }
      expect(readFileSync(file).length).toBeLessThan(60_000)
      expect(decodeRgba(file)(0, 0)[3]).toBe(0)
    }
    expect(SCI_FI_SLICES.top + SCI_FI_SLICES.bottom).toBeLessThan(0.5)
  })

  it('keeps panel centres opaque, frame centres transparent and actual edge notches clear', () => {
    const fill = decodeRgba(SCI_FI_TEXTURES.fill)
    const frame = decodeRgba(SCI_FI_TEXTURES.frame)
    expect(fill(256, 128)[3]).toBe(255)
    expect(frame(256, 128)[3]).toBe(0)
    expect(fill(256, 3)[3]).toBe(0)
    expect(frame(4, 128)[3]).toBeGreaterThan(200)
  })

  it('bakes real gradients without applying a darkening tint to live icons', () => {
    const fill = decodeRgba(SCI_FI_TEXTURES.fill)
    const primary = decodeRgba(SCI_FI_TEXTURES.primary)
    expect(fill(256, 20)[2]).toBeGreaterThan(fill(256, 230)[2])
    expect(primary(256, 20)[0]).toBeGreaterThan(primary(256, 230)[0])
    expect(primary(256, 100)[0]).toBeGreaterThan(200)
  })
})

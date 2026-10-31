import { Color4 } from '@dcl/sdk/math'

export const SCI_FI_TEXTURES = {
  fill: 'assets/Images/ui/scifi/v001/az_ui_sf_fill_v001.png',
  primary: 'assets/Images/ui/scifi/v001/az_ui_sf_primary_v001.png',
  frame: 'assets/Images/ui/scifi/v001/az_ui_sf_frame_v001.png'
} as const

// Caps preserve the asymmetric cuts and stepped edge ends at every panel size.
export const SCI_FI_SLICES = { left: 32 / 512, right: 32 / 512, top: 24 / 256, bottom: 24 / 256 } as const

export function mixUiColor(a: Color4, b: Color4, amount: number): Color4 {
  const t = Math.max(0, Math.min(1, amount))
  return Color4.create(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t, a.a + (b.a - a.a) * t)
}

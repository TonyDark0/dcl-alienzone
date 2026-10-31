import { Color4 } from '@dcl/sdk/math'

export const UI_COLORS = {
  transparent: Color4.create(0, 0, 0, 0),
  space950: Color4.create(0.018, 0.035, 0.055, 0.96),
  space950Glass: Color4.create(0.018, 0.035, 0.055, 0.86),
  space900: Color4.create(0.03, 0.065, 0.09, 0.94),
  space900Glass: Color4.create(0.03, 0.065, 0.09, 0.82),
  space800: Color4.create(0.055, 0.105, 0.135, 0.96),
  space800Glass: Color4.create(0.055, 0.105, 0.135, 0.82),
  space700: Color4.create(0.094, 0.231, 0.286, 1),
  space700Hover: Color4.create(0.11, 0.22, 0.26, 0.98),
  cyan: Color4.create(0.396, 0.878, 0.875, 1),
  cyanMuted: Color4.create(0.18, 0.9, 1, 0.34),
  cyanHover: Color4.create(0.3, 0.95, 1, 1),
  alien: Color4.create(0.67, 1, 0.34, 1),
  alienMuted: Color4.create(0.67, 1, 0.34, 0.24),
  alienHover: Color4.create(0.76, 1, 0.48, 1),
  warning: Color4.create(1, 0.82, 0.4, 1),
  violet: Color4.create(0.678, 0.573, 1, 1),
  danger: Color4.create(1, 0.384, 0.412, 1),
  dangerMuted: Color4.create(1, 0.25, 0.38, 0.22),
  dangerHover: Color4.create(1, 0.38, 0.48, 1),
  white: Color4.create(0.953, 0.98, 1, 1),
  textMuted: Color4.create(0.639, 0.718, 0.769, 1),
  disabled: Color4.create(0.25, 0.33, 0.36, 1),
  lobbyBackdrop: Color4.create(0.027, 0.067, 0.106, 1),
  scrim: Color4.create(0.005, 0.012, 0.02, 0.78)
} as const

export const UI_SPACING = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
} as const

export const UI_TYPE = {
  caption: 12,
  body: 16,
  strong: 20,
  title: 26,
  display: 42,
  hero: 58
} as const

export const UI_SIZE = {
  tapTarget: 72,
  panelBorder: 2,
  hudMaxWidth: 1320
} as const

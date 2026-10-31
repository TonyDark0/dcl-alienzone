import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { mixUiColor, SCI_FI_SLICES, SCI_FI_TEXTURES } from '../theme/sciFiSkins'
import { UI_COLORS } from '../theme/tokens'

/** Decorative sibling only: never captures input or dims live labels/icons. */
export function SciFiSurface({
  tone = UI_COLORS.cyan,
  primary = false,
  hover = 0,
  press = 0,
  quiet = false
}: {
  tone?: Color4
  primary?: boolean
  hover?: number
  press?: number
  quiet?: boolean
}) {
  const fill = Math.min(1, Math.max(0.78, 0.92 + hover * 0.08 - press * 0.14))
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: press * 2, left: press * 2, right: press * 2, bottom: 0 },
        width: '100%',
        height: '100%',
        pointerFilter: 'none'
      }}
      uiBackground={{
        texture: {
          src: primary ? SCI_FI_TEXTURES.primary : SCI_FI_TEXTURES.fill,
          filterMode: 'bi-linear',
          wrapMode: 'clamp'
        },
        textureMode: 'nine-slices',
        textureSlices: SCI_FI_SLICES,
        color: Color4.create(fill, fill, fill, quiet ? 0.94 : 1)
      }}
    >
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: 0, left: 0, right: 0, bottom: 0 },
          width: '100%',
          height: '100%',
          pointerFilter: 'none'
        }}
        uiBackground={{
          texture: { src: SCI_FI_TEXTURES.frame, filterMode: 'bi-linear', wrapMode: 'clamp' },
          textureMode: 'nine-slices',
          textureSlices: SCI_FI_SLICES,
          color: mixUiColor(tone, UI_COLORS.white, hover * 0.8)
        }}
      />
    </UiEntity>
  )
}

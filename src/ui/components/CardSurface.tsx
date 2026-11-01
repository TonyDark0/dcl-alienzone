import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { CARD_SLICES, CARD_TEXTURES, mixUiColor } from '../theme/sciFiSkins'
import { UI_COLORS } from '../theme/tokens'

/** Thin double-bezel collectible frame. Color never multiplies into live icon/text children. */
export function CardSurface({
  tone,
  hover = 0,
  selected = false
}: {
  tone: Color4
  hover?: number
  selected?: boolean
}) {
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 0, left: 0 },
        width: '100%',
        height: '100%',
        pointerFilter: 'none'
      }}
      uiBackground={{ texture: { src: CARD_TEXTURES.fill }, textureMode: 'nine-slices', textureSlices: CARD_SLICES }}
    >
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: 0, left: 0 },
          width: '100%',
          height: '100%',
          pointerFilter: 'none'
        }}
        uiBackground={{
          texture: { src: CARD_TEXTURES.fill },
          textureMode: 'nine-slices',
          textureSlices: CARD_SLICES,
          color: Color4.create(tone.r, tone.g, tone.b, selected ? 0.2 : 0.09 + hover * 0.045)
        }}
      />
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: 0, left: 0 },
          width: '100%',
          height: '100%',
          pointerFilter: 'none'
        }}
        uiBackground={{
          texture: { src: CARD_TEXTURES.frame },
          textureMode: 'nine-slices',
          textureSlices: CARD_SLICES,
          color: mixUiColor(tone, UI_COLORS.white, selected ? 0.5 : hover * 0.4)
        }}
      />
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: 7, left: '50%' },
          margin: { left: selected ? -19 : -12 },
          width: selected ? 38 : 24,
          height: 2,
          pointerFilter: 'none'
        }}
        uiBackground={{ color: tone }}
      />
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: 7, left: '50%' },
          margin: { left: -12 },
          width: 24,
          height: 2,
          pointerFilter: 'none'
        }}
        uiBackground={{ color: tone }}
      />
    </UiEntity>
  )
}

export function CardHologram({
  icon,
  tone,
  size = 80,
  hover = 0,
  density = 1
}: {
  icon: string
  tone: Color4
  size?: number
  hover?: number
  density?: number
}) {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: size + 28 * density,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerFilter: 'none'
      }}
    >
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: 0 },
          width: size * 1.35,
          height: 38 * density,
          pointerFilter: 'none'
        }}
        uiBackground={{ texture: { src: CARD_TEXTURES.pedestal }, textureMode: 'stretch', color: tone }}
      />
      <UiEntity
        uiTransform={{
          width: size,
          height: size,
          margin: { bottom: (16 + hover * 4) * density },
          pointerFilter: 'none'
        }}
        uiBackground={{ texture: { src: icon, filterMode: 'bi-linear', wrapMode: 'clamp' }, textureMode: 'stretch' }}
      />
    </UiEntity>
  )
}

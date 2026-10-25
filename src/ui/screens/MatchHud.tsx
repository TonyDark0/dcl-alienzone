import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { GAME_CONFIG } from '../../config/gameConfig'
import { playUiSound } from '../../presentation/audioDirector'

import { requestActivateCard, requestEquipCard, requestPass, sendReaction } from '../../client/gameClient'
import { ActionButton } from '../components/ActionButton'
import { CardHand } from '../components/CardHand'
import { DangerMeter } from '../components/DangerMeter'
import { Panel } from '../components/Panel'
import { SeatChip } from '../components/SeatChip'
import { isControlHovered, setControlHovered } from '../state/interactionState'
import { getUiState } from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'

interface ReactionButtonProps {
  reaction: string
  image: string
  compact: boolean
  hasRightMargin: boolean
  onPress: () => void
}

function ReactionButton({ reaction, image, compact, hasRightMargin, onPress }: ReactionButtonProps) {
  const controlId = `reaction:${reaction}`
  const hovered = isControlHovered(controlId)

  return (
    <UiEntity
      uiTransform={{
        flexGrow: 1,
        height: compact ? 48 : 58,
        margin: { right: hasRightMargin ? 4 : 0 },
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: hovered ? 2 : 1,
        borderColor: hovered ? UI_COLORS.cyanHover : UI_COLORS.cyanMuted,
        pointerFilter: 'block',
        opacity: hovered ? 1 : 0.92
      }}
      uiBackground={{ color: hovered ? UI_COLORS.space700Hover : UI_COLORS.space800Glass }}
      onMouseDown={() => {
        playUiSound('press')
        onPress()
      }}
      onMouseEnter={() => {
        setControlHovered(controlId, true)
        playUiSound('highlight')
      }}
      onMouseLeave={() => setControlHovered(controlId, false)}
    >
      <UiEntity
        uiTransform={{ width: compact ? 40 : 50, height: compact ? 40 : 50 }}
        uiBackground={{
          texture: { src: image, wrapMode: 'clamp', filterMode: 'bi-linear' },
          textureMode: 'stretch'
        }}
      />
    </UiEntity>
  )
}

export function MatchHud() {
  const state = getUiState()
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const compact = (canvas?.height ?? 720) <= 800
  const mobile = isMobile()
  const edge = compact ? 12 : UI_SPACING.lg
  const directionLabel = state.direction === 1 ? '→' : '←'
  const visible = ['HOLDING', 'RESOLVING_CHAIN', 'TAKEOVER', 'ROUND_RESULT'].includes(state.phase)
  const reactionSize = compact ? 48 : 58
  const passHint = !state.isLocalHolder
    ? 'WAIT FOR YOUR TURN'
    : state.heldAlien?.inTransit
      ? 'ALIEN IN TRANSIT'
      : (state.heldAlien?.heldForSeconds ?? 0) < GAME_CONFIG.minimumScoringHoldSeconds
        ? `HOLD ${Math.max(
            1,
            Math.ceil(GAME_CONFIG.minimumScoringHoldSeconds - (state.heldAlien?.heldForSeconds ?? 0))
          )}s`
        : 'PASS NOW'

  return (
    <UiEntity uiTransform={{ display: visible ? 'flex' : 'none', width: '100%', height: '100%' }}>
      {/* DCL owns minimap, chat, profile, emotes, locomotion, system settings and
          audio/graphics. This HUD contains game state and game actions only. */}
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: mobile ? edge : 118, left: mobile ? edge : 56 },
          width: compact ? 176 : 224,
          flexDirection: 'column'
        }}
      >
        <Panel variant="accent" uiTransform={{ width: '100%', height: compact ? 50 : 62, padding: compact ? 8 : 12 }}>
          <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center' }}>
            <UiEntity uiTransform={{ flexGrow: 1 }} />
            <Label
              value={`${state.heat}`}
              fontSize={compact ? UI_TYPE.title : UI_TYPE.display}
              color={UI_COLORS.white}
            />
          </UiEntity>
        </Panel>
        <Panel
          variant="quiet"
          uiTransform={{ width: '100%', padding: compact ? 6 : 8, margin: { top: 4 }, flexDirection: 'column' }}
        >
          {state.seats.map((seat) => (
            <SeatChip seat={seat} compact={compact} />
          ))}
        </Panel>
      </UiEntity>

      <Panel
        variant="quiet"
        uiTransform={{
          positionType: 'absolute',
          position: { top: edge, left: '39%' },
          width: '22%',
          height: compact ? 58 : 70,
          padding: compact ? 8 : 12,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <UiEntity uiTransform={{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <UiEntity uiTransform={{ width: '68%', justifyContent: 'center', alignItems: 'center' }}>
            <Label
              value={`ROUND ${state.round} / 3`}
              fontSize={compact ? UI_TYPE.body : UI_TYPE.strong}
              color={UI_COLORS.white}
            />
          </UiEntity>
          <UiEntity uiTransform={{ width: '32%', justifyContent: 'center', alignItems: 'center' }}>
            <Label value={directionLabel} fontSize={compact ? UI_TYPE.title : UI_TYPE.display} color={UI_COLORS.cyan} />
          </UiEntity>
        </UiEntity>
        <UiEntity
          uiTransform={{
            width: compact ? 96 : 118,
            height: compact ? 10 : 12,
            margin: { top: 6 },
            flexDirection: 'row'
          }}
        >
          {[0, 1, 2].map((takeover) => (
            <UiEntity
              uiTransform={{ flexGrow: 1, height: '100%', margin: { left: 2, right: 2 } }}
              uiBackground={{ color: takeover < state.takeovers ? UI_COLORS.danger : UI_COLORS.space700 }}
            />
          ))}
        </UiEntity>
      </Panel>

      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: edge, left: '62%' },
          width: compact ? 184 : 238,
          height: compact ? 50 : 62
        }}
      >
        <DangerMeter level={state.threat} compact={compact} />
      </UiEntity>

      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: edge, left: '66%' },
          width: compact ? 200 : 248,
          height: compact ? 130 : 146,
          alignItems: 'center'
        }}
      >
        <CardHand
          seats={state.seats}
          localSeatId={state.localSeatId}
          cards={state.cards}
          compact={compact}
          interactionDisabled={state.phase !== 'HOLDING'}
          onEquip={requestEquipCard}
          onActivate={requestActivateCard}
        />
      </UiEntity>

      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: edge, left: '35%' },
          width: '30%',
          height: compact ? 112 : 132,
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}
      >
        <Label
          value={
            state.isLocalHolder
              ? `YOU HOLD ${state.heldAlien?.id === 'ECHO' ? 'THE ECHO' : 'THE ALIEN'}`
              : state.holderName
          }
          fontSize={compact ? 10 : UI_TYPE.caption}
          color={state.isLocalHolder ? UI_COLORS.danger : UI_COLORS.textMuted}
          textAlign="middle-center"
          uiTransform={{ margin: { bottom: compact ? 4 : UI_SPACING.sm } }}
        />
        <ActionButton
          label={state.passPending ? 'SENDING…' : 'PASS'}
          hint={passHint}
          width={compact ? 320 : 460}
          fontSize={compact ? UI_TYPE.title : 32}
          disabled={!state.canLocalPass || state.passPending}
          interactionId="match-pass"
          onPress={requestPass}
        />
      </UiEntity>

      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: edge, right: '66%' },
          width: compact ? 170 : 214,
          height: compact ? 112 : 132,
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}
      >
        <Label value="QUICK REACTIONS" fontSize={compact ? 9 : UI_TYPE.caption} color={UI_COLORS.textMuted} />
        <UiEntity
          uiTransform={{
            width: '100%',
            height: reactionSize,
            flexDirection: 'row',
            margin: { top: compact ? 4 : 8 }
          }}
        >
          {[
            ['PASS!', 'assets/Images/ui/reactions/az_ui_reaction_alien_v001.png'],
            ['HA!', 'assets/Images/ui/reactions/az_ui_reaction_laugh_v001.png'],
            ['NO!', 'assets/Images/ui/reactions/az_ui_reaction_sad_v001.png']
          ].map(([reaction, image], index) => (
            <ReactionButton
              reaction={reaction}
              image={image}
              compact={compact}
              hasRightMargin={index < 2}
              onPress={() => sendReaction(reaction)}
            />
          ))}
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

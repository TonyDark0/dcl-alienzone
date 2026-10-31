import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { GAME_CONFIG } from '../../config/gameConfig'
import { playUiSound } from '../../presentation/audioDirector'

import { requestPass, sendReaction } from '../../client/gameClient'
import { ActionButton } from '../components/ActionButton'
import { OrderedDeck } from '../components/OrderedDeck'
import { DangerMeter } from '../components/DangerMeter'
import { Panel } from '../components/Panel'
import { SeatChip } from '../components/SeatChip'
import { getControlMotion, pressControl, setControlHovered } from '../state/interactionState'
import { SciFiSurface } from '../components/SciFiSurface'
import { hudLayout } from '../theme/hudLayout'
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
  const motion = getControlMotion(controlId)

  return (
    <UiEntity
      uiTransform={{
        flexGrow: 1,
        height: 92,
        margin: { right: hasRightMargin ? 4 : 0 },
        justifyContent: 'center',
        alignItems: 'center',
        pointerFilter: 'block'
      }}
      onMouseDown={() => {
        pressControl(controlId)
        playUiSound('press')
        onPress()
      }}
      onMouseEnter={() => {
        setControlHovered(controlId, true)
        playUiSound('highlight')
      }}
      onMouseLeave={() => setControlHovered(controlId, false)}
    >
      <SciFiSurface hover={motion.hover} press={motion.press} />
      <UiEntity
        uiTransform={{ width: compact ? 64 : 72, height: compact ? 64 : 72, pointerFilter: 'none' }}
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
  const mobile = isMobile()
  const layout = hudLayout(
    canvas?.width ?? 1920,
    canvas?.height ?? 1080,
    mobile,
    (canvas?.screenInsetArea?.left ?? 0) + (canvas?.screenInsetArea?.right ?? 0)
  )
  const compact = layout.compact
  const running = !!state.arena
  const runner = state.localSeatId === null ? undefined : state.arena?.players[state.localSeatId]
  const estimatedNow = state.snapshotServerNow + Math.max(0, Date.now() - state.snapshotReceivedAtMs) / 1000
  const effect =
    runner && runner.frozenUntil > estimatedNow
      ? `SLOWED ${Math.ceil(runner.frozenUntil - estimatedNow)}s`
      : runner && runner.immuneUntil > estimatedNow
        ? `IMMUNE ${Math.ceil(runner.immuneUntil - estimatedNow)}s`
        : runner && runner.turboUntil > estimatedNow
          ? 'TURBO ×2 · ROUND'
          : runner && (runner.vaccinatedUntil ?? 0) > estimatedNow
            ? 'VACUNE · ROUND'
            : runner && runner.invisibleUntil > estimatedNow
              ? `INVISIBLE ${Math.ceil(runner.invisibleUntil - estimatedNow)}s`
              : null
  const edge = compact ? 12 : UI_SPACING.lg
  const directionLabel = state.direction === 1 ? '→' : '←'
  const visible = ['HOLDING', 'RESOLVING_CHAIN', 'TAKEOVER', 'ROUND_RESULT'].includes(state.phase)
  const reactionSize = 92
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
        <Panel variant="accent" uiTransform={{ width: '100%', height: compact ? 60 : 72, padding: compact ? 8 : 12 }}>
          <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center' }}>
            <Label
              value={`${state.heat}`}
              fontSize={compact ? UI_TYPE.title : UI_TYPE.display}
              color={UI_COLORS.white}
              textAlign="middle-center"
              uiTransform={{ width: '100%', height: '100%' }}
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
          position: { top: edge, left: '50%' },
          margin: { left: compact ? -272 : -312 },
          width: compact ? 300 : 344,
          height: compact ? 70 : 80,
          padding: compact ? 10 : 12,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <UiEntity
          uiTransform={{
            width: '100%',
            height: compact ? 34 : 38,
            flexShrink: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <UiEntity uiTransform={{ width: running ? '100%' : '68%', justifyContent: 'center', alignItems: 'center' }}>
            <Label
              value={`ROUND ${state.round} / 3`}
              fontSize={compact ? UI_TYPE.body : UI_TYPE.strong}
              color={UI_COLORS.white}
            />
          </UiEntity>
          <UiEntity
            uiTransform={{
              display: running ? 'none' : 'flex',
              width: '32%',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Label value={directionLabel} fontSize={compact ? 28 : 32} color={UI_COLORS.cyan} />
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
          position: { top: edge, left: '50%' },
          margin: { left: compact ? 40 : 44 },
          width: compact ? 184 : 238,
          height: compact ? 70 : 80
        }}
      >
        <DangerMeter level={state.threat} compact={compact} />
      </UiEntity>

      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: layout.stacked ? 172 : edge, left: '50%' },
          display: state.phase === 'TAKEOVER' ? 'none' : 'flex',
          margin: { left: layout.stacked ? 18 : layout.passWidth / 2 + layout.gap },
          width: layout.wingWidth,
          height: compact ? 208 : 228,
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}
      >
        <OrderedDeck compact={compact} />
      </UiEntity>

      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: edge, left: '50%' },
          display: state.phase === 'TAKEOVER' ? 'none' : 'flex',
          margin: { left: -layout.passWidth / 2 },
          width: layout.passWidth,
          height: 148,
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
        {running ? (
          <UiEntity uiTransform={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
            {effect ? (
              <Label value={effect} fontSize={16} color={UI_COLORS.warning} uiTransform={{ height: 24 }} />
            ) : null}
            <ActionButton
              label={state.passPending ? 'SENDING…' : mobile ? 'THROW ALIEN' : 'E · THROW ALIEN'}
              hint={
                state.lastActionError ??
                (!state.isLocalHolder
                  ? 'EVADE · COLLECT COINS'
                  : state.heldAlien?.inTransit
                    ? 'ALIEN ARRIVING'
                    : state.canLocalPass
                      ? `THROW TO ${state.seats.find((seat) => seat.id === state.arena?.throwTargetSeatId)?.displayName ?? 'ASTRONAUT'}`
                      : (state.arena?.returnBlockedUntil ?? 0) > estimatedNow
                        ? `RETURN PROTECTED · ${Math.ceil(state.arena!.returnBlockedUntil! - estimatedNow)}s`
                        : 'MOVE CLOSER · 1.5m')
              }
              width={layout.passWidth}
              height={80}
              fontSize={30}
              disabled={!state.canLocalPass || state.passPending || state.phase !== 'HOLDING'}
              interactionId="match-throw"
              onPress={requestPass}
            />
            <Label
              value={
                mobile ? 'JOYSTICK TO MOVE · TAP TO THROW / ACTIVATE' : 'WASD TO MOVE · E TO THROW · F TO ACTIVATE'
              }
              fontSize={12}
              color={UI_COLORS.textMuted}
              uiTransform={{ height: 22 }}
            />
          </UiEntity>
        ) : (
          <ActionButton
            label={state.passPending ? 'SENDING…' : state.canLocalPass ? 'PASS' : 'WAIT'}
            hint={passHint}
            width={layout.passWidth}
            height={92}
            fontSize={42}
            disabled={!state.canLocalPass || state.passPending}
            interactionId="match-pass"
            onPress={requestPass}
          />
        )}
      </UiEntity>

      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: layout.stacked ? 172 : edge, left: '50%' },
          display: state.phase === 'TAKEOVER' ? 'none' : 'flex',
          margin: {
            left: layout.stacked ? -layout.wingWidth - 18 : -layout.passWidth / 2 - layout.gap - layout.wingWidth
          },
          width: layout.wingWidth,
          height: 132,
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

import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import { requestContainmentTap } from '../../client/gameClient'
import { containmentHitCount, currentContainmentTarget } from '../../game/rules/containment'
import { getUiState } from '../state/uiState'
import { containmentLayout } from '../theme/containmentLayout'
import { UI_COLORS } from '../theme/tokens'
import { ActionButton } from './ActionButton'
import { Panel } from './Panel'
import { isControlHovered } from '../state/interactionState'
import { TAP_FEEDBACK_MS } from '../state/containmentFeedback'

/** Non-modal takeover interaction; never covers the whole arena with a panel. */
export function ContainmentChallenge() {
  const state = getUiState()
  const challenge = state.containment
  if (state.phase !== 'TAKEOVER' || !challenge) return null
  const localVictim = state.localSeatId === challenge.victimSeatId
  const now = state.snapshotServerNow + Math.max(0, Date.now() - state.snapshotReceivedAtMs) / 1000
  const index = currentContainmentTarget(challenge, now)
  const pending = index !== null && state.containmentPendingTarget === index
  const canTap = localVictim && index !== null && !challenge.hits[index] && !pending
  const mobile = isMobile()
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const referenceWidth = mobile ? 1600 : 1920
  const referenceHeight = mobile ? 720 : 1080
  const scale = Math.max(
    0.01,
    Math.min((canvas?.width ?? 1920) / referenceWidth, (canvas?.height ?? 1080) / referenceHeight)
  )
  const width =
    Math.max(
      1,
      (canvas?.width ?? 1920) - (canvas?.screenInsetArea?.left ?? 0) - (canvas?.screenInsetArea?.right ?? 0)
    ) / scale
  const height =
    Math.max(
      1,
      (canvas?.height ?? 1080) - (canvas?.screenInsetArea?.top ?? 0) - (canvas?.screenInsetArea?.bottom ?? 0)
    ) / scale
  const layout = containmentLayout(width, height, mobile, index === null ? 0 : challenge.slots[index])
  const controlId = `containment:${challenge.id}:${index}`
  const hovered = canTap && isControlHovered(controlId)
  const flash = state.containmentTapFeedback
  const flashAge = flash ? Date.now() - flash.atMs : TAP_FEEDBACK_MS
  const showFlash = localVictim && flash?.challengeId === challenge.id && flashAge < TAP_FEEDBACK_MS
  const flashLayout = containmentLayout(width, height, mobile, flash ? challenge.slots[flash.targetIndex] : 0)
  const flashColor =
    flash?.status === 'HIT' ? UI_COLORS.alien : flash?.status === 'MISS' ? UI_COLORS.danger : UI_COLORS.cyan
  const hits = containmentHitCount(challenge)
  const result = challenge.resolved
    ? challenge.contained
      ? 'ALIEN CONTAINED'
      : 'CONTAINMENT BREACHED'
    : localVictim
      ? 'CONTAIN THE ALIEN'
      : `${state.takeoverVictim ?? 'ASTRONAUT'} IS RESISTING`
  const feedback = challenge.resolved
    ? `${hits} / 5 HITS${challenge.bonusAwarded ? '  •  +1' : '  •  NO BONUS'}`
    : localVictim
      ? 'TAP EACH TARGET • HIT 3 OF 5 FOR +1'
      : 'WATCH THE CREW CONTAINMENT ATTEMPT'

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'absolute',
        position: { top: 0, left: 0 },
        pointerFilter: 'none'
      }}
    >
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: mobile ? 106 : 132, left: '50%' },
          width: 660,
          maxWidth: '84%',
          height: 54,
          margin: { left: -330 },
          justifyContent: 'center',
          alignItems: 'center',
          pointerFilter: 'none'
        }}
      >
        <Label
          value={result}
          fontSize={mobile ? 22 : 28}
          color={challenge.resolved && !challenge.contained ? UI_COLORS.danger : UI_COLORS.cyan}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: '100%', pointerFilter: 'none' }}
        />
      </UiEntity>
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { top: '48%', left: '50%' },
          margin: { left: -layout.fieldWidth / 2, top: -layout.fieldHeight / 2 },
          width: layout.fieldWidth,
          height: layout.fieldHeight,
          pointerFilter: 'none'
        }}
      >
        {canTap && index !== null ? (
          <UiEntity
            key={`${challenge.id}:${index}`}
            uiTransform={{
              positionType: 'absolute',
              position: { left: layout.left, top: layout.top },
              width: layout.targetSize,
              height: layout.targetSize
            }}
          >
            <ActionButton
              label="TAP"
              tone="secondary"
              width={layout.targetSize}
              height={layout.targetSize}
              fontSize={30}
              accent={hovered ? UI_COLORS.white : UI_COLORS.cyan}
              interactionId={controlId}
              onPress={() => requestContainmentTap(challenge.id, index)}
            />
          </UiEntity>
        ) : null}
        {showFlash && flash ? (
          <UiEntity
            uiTransform={{
              positionType: 'absolute',
              position: { left: flashLayout.left, top: flashLayout.top },
              width: flashLayout.targetSize,
              height: flashLayout.targetSize,
              borderWidth: 3,
              borderColor: flashColor,
              opacity: 1 - Math.pow(flashAge / TAP_FEEDBACK_MS, 2),
              alignItems: 'center',
              justifyContent: 'center',
              pointerFilter: 'none'
            }}
            uiBackground={{ color: UI_COLORS.space900 }}
          >
            <Label
              value={flash.status === 'PENDING' ? 'TAP SENT' : flash.status}
              fontSize={flash.status === 'PENDING' ? 18 : 30}
              color={flashColor}
              textAlign="middle-center"
              uiTransform={{ width: '100%', height: '100%', pointerFilter: 'none' }}
            />
          </UiEntity>
        ) : null}
      </UiEntity>
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: mobile ? 56 : 74, left: '50%' },
          width: 660,
          maxWidth: '84%',
          margin: { left: -330 },
          height: 114,
          pointerFilter: 'none'
        }}
      >
        <Panel
          variant="quiet"
          uiTransform={{
            width: '100%',
            height: '100%',
            padding: 12,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerFilter: 'none'
          }}
        >
          <Label
            value={feedback}
            fontSize={mobile ? 17 : 21}
            textAlign="middle-center"
            color={UI_COLORS.white}
            uiTransform={{ width: '100%', height: 36, flexShrink: 0, pointerFilter: 'none' }}
          />
          <Label
            value={
              challenge.resolved
                ? challenge.round === 3
                  ? 'FINAL ATTACK • THE MATCH IS OVER'
                  : 'THE CREW IS SAFE • NEXT ROUND'
                : `${hits} / 5 HITS${pending ? ' • REGISTERING TAP' : ''}`
            }
            fontSize={16}
            color={UI_COLORS.textMuted}
            textAlign="middle-center"
            uiTransform={{ width: '100%', height: 28, flexShrink: 0, pointerFilter: 'none' }}
          />
        </Panel>
      </UiEntity>
    </UiEntity>
  )
}

import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import { ActionButton } from '../components/ActionButton'
import { requestRematch, requestReturnToLobby } from '../../client/gameClient'
import { Panel } from '../components/Panel'
import { getUiState } from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'

export function ResultsScreen() {
  const state = getUiState()
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const compact = (canvas?.height ?? 720) <= 800
  const ranking = [...state.seats]
    .sort((a, b) => b.heat - a.heat || a.takeovers - b.takeovers || b.successfulPasses - a.successfulPasses)
    .map((seat, index) => ({ seat, rank: index + 1 }))
  const localResult = ranking.find((entry) => entry.seat.isLocal)
  const rankedSeats = ranking.slice(0, 4)
  if (localResult && localResult.rank > 4) rankedSeats[3] = localResult
  const visible = state.phase === 'MATCH_RESULT'

  return (
    <UiEntity
      uiTransform={{
        display: visible ? 'flex' : 'none',
        positionType: 'absolute',
        position: { top: 0, right: 0, bottom: 0, left: 0 },
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        pointerFilter: 'block',
        zIndex: 90
      }}
      onMouseDown={() => undefined}
    >
      <Panel
        variant="accent"
        uiTransform={{
          width: compact ? '72%' : '64%',
          maxWidth: 720,
          height: compact ? '88%' : '72%',
          maxHeight: 620,
          padding: compact ? UI_SPACING.lg : UI_SPACING.xl,
          flexDirection: 'column'
        }}
      >
        <UiEntity
          uiTransform={{
            width: '100%',
            height: compact ? 76 : 104,
            flexDirection: 'column',
            flexShrink: 0,
            alignItems: 'center'
          }}
        >
          <Label
            value="MATCH COMPLETE"
            fontSize={UI_TYPE.caption}
            color={UI_COLORS.cyan}
            textAlign="middle-center"
            uiTransform={{
              width: '100%',
              height: compact ? 18 : 22,
              margin: { top: compact ? 2 : UI_SPACING.xs, bottom: compact ? 8 : UI_SPACING.sm }
            }}
          />
          <Label
            value="RANKING"
            fontSize={compact ? UI_TYPE.title : UI_TYPE.display}
            color={UI_COLORS.white}
            textAlign="middle-center"
            textWrap="nowrap"
            uiTransform={{ width: '100%', height: compact ? 38 : 54 }}
          />
        </UiEntity>

        <UiEntity
          uiTransform={{
            width: '100%',
            flexDirection: 'column',
            flexGrow: 1,
            margin: { top: compact ? UI_SPACING.sm : UI_SPACING.lg }
          }}
        >
          {rankedSeats.map(({ seat, rank }, index) => (
            <UiEntity
              uiTransform={{
                width: '100%',
                height: compact ? 54 : 64,
                padding: { left: UI_SPACING.md, right: UI_SPACING.md },
                margin: { bottom: UI_SPACING.sm },
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: { left: index === 0 ? 6 : 2 },
                borderColor: index === 0 ? UI_COLORS.alien : UI_COLORS.space700
              }}
              uiBackground={{ color: index === 0 ? UI_COLORS.alienMuted : UI_COLORS.space800 }}
            >
              <Label
                value={`${rank}`.padStart(2, '0')}
                fontSize={UI_TYPE.title}
                color={index === 0 ? UI_COLORS.alien : UI_COLORS.textMuted}
              />
              <Label
                value={seat.name}
                fontSize={UI_TYPE.strong}
                color={UI_COLORS.white}
                uiTransform={{ margin: { left: UI_SPACING.lg } }}
              />
              <UiEntity uiTransform={{ flexGrow: 1 }} />
              <Label value={`${seat.heat}`} fontSize={UI_TYPE.strong} color={UI_COLORS.cyan} />
            </UiEntity>
          ))}
        </UiEntity>

        <UiEntity
          uiTransform={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'center',
            margin: { top: UI_SPACING.lg }
          }}
        >
          <UiEntity uiTransform={{ margin: { right: UI_SPACING.md } }}>
            <ActionButton
              label="MAIN MENU"
              hint="RETURN TO THE LOBBY"
              tone="secondary"
              width={compact ? 260 : 300}
              interactionId="results-main-menu"
              sound="menu"
              onPress={requestReturnToLobby}
            />
          </UiEntity>
          <ActionButton
            label="REMATCH"
            hint="START A NEW CONTAINMENT"
            width={compact ? 260 : 300}
            interactionId="results-rematch"
            onPress={requestRematch}
          />
        </UiEntity>
        {state.lastActionError ? (
          <Label
            value={state.lastActionError}
            fontSize={UI_TYPE.caption}
            color={UI_COLORS.danger}
            textAlign="middle-center"
            uiTransform={{ width: '100%', height: 18, margin: { top: UI_SPACING.sm } }}
          />
        ) : null}
      </Panel>
    </UiEntity>
  )
}

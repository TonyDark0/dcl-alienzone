import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import ReactEcs, { Button, Label, UiEntity } from '@dcl/sdk/react-ecs'

import { requestLeaderboard, requestReady } from '../../client/gameClient'
import { playUiSound } from '../../presentation/audioDirector'
import { PLAYABLE_CARD_TYPES } from '../../game/model/types'
import { CARD_DETAILS } from '../../game/rules/deck'
import { ActionButton } from '../components/ActionButton'
import { LeaderboardPanel } from '../components/LeaderboardPanel'
import { Panel } from '../components/Panel'
import { getUiState } from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'

type LobbyPage = 'HOME' | 'INSTRUCTIONS' | 'LEADERBOARD'

let lobbyPage: LobbyPage = 'HOME'

const SCORE_ROWS = [
  ['MORE THAN 15s', '+1'],
  ['OVER 10s TO 15s', '+2'],
  ['OVER 5s TO 10s', '+3'],
  ['5s OR LESS', '+4']
] as const

const CARD_ROWS = PLAYABLE_CARD_TYPES.map((type) => {
  const card = CARD_DETAILS[type]
  return [card.icon, card.name, card.description] as const
})

function ClosedLobbyPrompt({ compact }: { compact: boolean }) {
  return (
    <Panel
      variant="accent"
      uiTransform={{
        width: compact ? 520 : 620,
        padding: compact ? UI_SPACING.lg : UI_SPACING.xl,
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Label value="DCL ALIENZONE" fontSize={compact ? UI_TYPE.title : UI_TYPE.display} color={UI_COLORS.cyan} />
      <Label value="SOCIAL ALIEN SURVIVAL" fontSize={UI_TYPE.body} color={UI_COLORS.white} />
      <Label
        value="CONNECTING TO DECENTRALAND MULTIPLAYER"
        fontSize={UI_TYPE.caption}
        color={UI_COLORS.textMuted}
        textAlign="middle-center"
        uiTransform={{ margin: { top: UI_SPACING.md, bottom: UI_SPACING.lg } }}
      />
      <ActionButton
        label="CONNECTING…"
        hint="PREPARING THE CONTAINMENT ROOM"
        width={compact ? 360 : 420}
        disabled
        interactionId="lobby-connecting"
        onPress={() => undefined}
      />
    </Panel>
  )
}

function LobbyHome({ compact }: { compact: boolean }) {
  return (
    <Panel
      variant="accent"
      uiTransform={{
        width: compact ? 660 : 760,
        height: compact ? 590 : 690,
        maxWidth: '88%',
        maxHeight: '92%',
        padding: compact ? 24 : 32,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <UiEntity
        uiTransform={{ width: compact ? 520 : 620, height: compact ? 176 : 210, maxWidth: '100%', flexShrink: 0 }}
        uiBackground={{
          texture: {
            src: 'assets/Images/ui/branding/az_logo_alienzone_v001.png',
            filterMode: 'bi-linear',
            wrapMode: 'clamp'
          },
          textureMode: 'stretch'
        }}
      />
      <Label
        value="A baby alien escaped inside the ship, pass it before it takes control."
        fontSize={compact ? 14 : 18}
        color={UI_COLORS.textMuted}
        textAlign="middle-center"
        uiTransform={{ width: '92%', height: compact ? 56 : 66, flexShrink: 0, margin: { top: 8, bottom: 20 } }}
      />
      <UiEntity uiTransform={{ width: '100%', height: 80, flexShrink: 0, justifyContent: 'center' }}>
        <ActionButton
          label="PLAY NEW MATCH"
          width={compact ? 420 : 480}
          interactionId="lobby-play"
          onPress={() => {
            lobbyPage = 'HOME'
            requestReady()
          }}
        />
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: 80, flexShrink: 0, justifyContent: 'center' }}>
        <ActionButton
          label="HOW TO PLAY"
          tone="secondary"
          width={compact ? 420 : 480}
          interactionId="lobby-instructions"
          sound="menu"
          onPress={() => {
            lobbyPage = 'INSTRUCTIONS'
          }}
        />
      </UiEntity>
      <ActionButton
        label="WORLD LEADERBOARD"
        tone="secondary"
        width={compact ? 420 : 480}
        interactionId="lobby-leaderboard"
        sound="menu"
        onPress={() => {
          requestLeaderboard()
          lobbyPage = 'LEADERBOARD'
        }}
      />
    </Panel>
  )
}

type InstructionPage = 'OBJECTIVE' | 'SCORING' | 'CARDS'
let instructionPage: InstructionPage = 'OBJECTIVE'

function HelpText({
  value,
  height,
  compact,
  accent = false
}: {
  value: string
  height: number
  compact: boolean
  accent?: boolean
}) {
  return (
    <Label
      value={value}
      fontSize={compact ? 14 : 17}
      color={accent ? UI_COLORS.alien : UI_COLORS.textMuted}
      textAlign="top-left"
      uiTransform={{ width: '100%', height, flexShrink: 0, margin: { bottom: 10 } }}
    />
  )
}

function Instructions({ compact }: { compact: boolean }) {
  return (
    <Panel
      variant="accent"
      uiTransform={{
        width: '86%',
        maxWidth: 1040,
        height: compact ? '94%' : '86%',
        maxHeight: 820,
        padding: compact ? 20 : 32,
        flexDirection: 'column'
      }}
    >
      <UiEntity uiTransform={{ width: '100%', height: compact ? 60 : 76, flexShrink: 0, flexDirection: 'column' }}>
        <Label
          value="HOW TO PLAY"
          fontSize={compact ? 28 : 38}
          color={UI_COLORS.white}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: compact ? 36 : 48, flexShrink: 0 }}
        />
        <Label
          value="HOLD. PASS. OUTSMART THE CREW."
          fontSize={compact ? 12 : 14}
          color={UI_COLORS.textMuted}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: 24, flexShrink: 0 }}
        />
      </UiEntity>
      <UiEntity
        uiTransform={{ width: '100%', height: 52, flexShrink: 0, flexDirection: 'row', margin: { bottom: 16 } }}
      >
        {(['OBJECTIVE', 'SCORING', 'CARDS'] as const).map((page) => (
          <Button
            value={page}
            variant={instructionPage === page ? 'primary' : 'secondary'}
            fontSize={compact ? 14 : 17}
            uiTransform={{
              width: '33.33%',
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: { bottom: 3 },
              borderColor: instructionPage === page ? UI_COLORS.cyan : UI_COLORS.space700,
              pointerFilter: 'block'
            }}
            onMouseDown={() => {
              playUiSound('menu')
              instructionPage = page
            }}
          />
        ))}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', flexGrow: 1, minHeight: 0, flexDirection: 'column' }}>
        {instructionPage === 'OBJECTIVE' ? (
          <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
            <HelpText
              compact={compact}
              height={compact ? 100 : 124}
              value="A baby alien has hatched aboard the ship. Its curious face hides a dangerous instinct: when the timer runs out, it attacks the astronaut carrying it. Pass it between the crew and stay out of its grasp."
            />
            <HelpText
              compact={compact}
              accent
              height={compact ? 66 : 86}
              value="Your objective is to avoid the alien's attacks and finish the 3 rounds with the most points."
            />
          </UiEntity>
        ) : instructionPage === 'SCORING' ? (
          <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
            <HelpText
              compact={compact}
              height={compact ? 44 : 54}
              value="After a 2-second hold, a manual PASS awards the amount below. The shared time remaining determines your reward; holding alone does not add points."
            />
            {SCORE_ROWS.map(([time, heat]) => (
              <UiEntity
                uiTransform={{
                  width: '100%',
                  height: compact ? 36 : 44,
                  flexShrink: 0,
                  padding: { left: 16, right: 16 },
                  margin: { bottom: 6 },
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
                uiBackground={{ color: UI_COLORS.space800 }}
              >
                <Label
                  value={time}
                  fontSize={compact ? 14 : 17}
                  color={UI_COLORS.white}
                  uiTransform={{ width: '65%', height: '100%' }}
                  textAlign="middle-left"
                />
                <Label
                  value={heat}
                  fontSize={compact ? 16 : 20}
                  color={UI_COLORS.alien}
                  uiTransform={{ width: '35%', height: '100%' }}
                  textAlign="middle-right"
                />
              </UiEntity>
            ))}
            <HelpText
              compact={compact}
              height={compact ? 40 : 50}
              value="PASS before 2s: +0. There is no automatic pass: holding until the timer ends risks an attack. ECHO scores the same way."
            />
            <HelpText
              compact={compact}
              accent
              height={compact ? 40 : 50}
              value="SKIP: +1 when your activated card actually skips an incoming alien. Loading or activating it awards nothing."
            />
            <HelpText
              compact={compact}
              height={compact ? 34 : 44}
              value="TAKEOVER: −5, with a minimum of 0. Only the original alien attacks."
            />
          </UiEntity>
        ) : (
          <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
            <HelpText
              compact={compact}
              height={compact ? 66 : 78}
              value="You receive 2 reactions and 2 interventions for the match. One shared ECHO bonus goes to a random player each round. Browse to LOAD, then tap the loaded card to ACTIVATE. CHAOS requires a chosen player first."
            />
            {[0, 2, 4].map((offset) => (
              <UiEntity
                uiTransform={{
                  width: '100%',
                  height: compact ? 92 : 104,
                  flexShrink: 0,
                  margin: { bottom: 8 },
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                }}
              >
                {CARD_ROWS.slice(offset, offset + 2).map(([icon, name, description]) => (
                  <UiEntity
                    uiTransform={{
                      width: '49%',
                      height: '100%',
                      padding: compact ? 8 : 12,
                      flexDirection: 'column',
                      borderWidth: { left: 3 },
                      borderColor: UI_COLORS.cyan
                    }}
                    uiBackground={{ color: UI_COLORS.space800 }}
                  >
                    <UiEntity
                      uiTransform={{
                        width: compact ? 30 : 36,
                        height: compact ? 30 : 36,
                        positionType: 'absolute',
                        position: { right: 8, top: 6 }
                      }}
                      uiBackground={{
                        texture: { src: icon, filterMode: 'bi-linear', wrapMode: 'clamp' },
                        textureMode: 'stretch'
                      }}
                    />
                    <Label
                      value={name}
                      fontSize={compact ? 14 : 17}
                      color={UI_COLORS.white}
                      textAlign="middle-left"
                      uiTransform={{ width: '100%', height: 24, flexShrink: 0 }}
                    />
                    <Label
                      value={description}
                      fontSize={compact ? 12 : 14}
                      color={UI_COLORS.textMuted}
                      textAlign="top-left"
                      uiTransform={{ width: '100%', height: compact ? 50 : 56, flexShrink: 0 }}
                    />
                  </UiEntity>
                ))}
              </UiEntity>
            ))}
          </UiEntity>
        )}
      </UiEntity>
      <UiEntity
        uiTransform={{ width: '100%', height: 76, flexShrink: 0, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActionButton
          label="BACK"
          tone="secondary"
          width={compact ? 280 : 340}
          interactionId="instructions-back"
          sound="menu"
          onPress={() => {
            lobbyPage = 'HOME'
          }}
        />
      </UiEntity>
    </Panel>
  )
}

function Leaderboard({ compact }: { compact: boolean }) {
  const state = getUiState()
  return (
    <Panel
      variant="accent"
      uiTransform={{
        width: compact ? 720 : 820,
        height: compact ? '94%' : '82%',
        maxWidth: '88%',
        maxHeight: 780,
        padding: compact ? UI_SPACING.md : UI_SPACING.xl,
        flexDirection: 'column'
      }}
    >
      <UiEntity uiTransform={{ width: '100%', flexGrow: 1 }}>
        <LeaderboardPanel entries={state.leaderboard} loading={state.leaderboardLoading} compact={compact} expanded />
      </UiEntity>
      <UiEntity
        uiTransform={{ width: '100%', height: compact ? 68 : 84, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActionButton
          label="BACK"
          tone="secondary"
          width={compact ? 300 : 360}
          interactionId="leaderboard-back"
          sound="menu"
          onPress={() => {
            lobbyPage = 'HOME'
          }}
        />
      </UiEntity>
    </Panel>
  )
}

function Countdown({ compact }: { compact: boolean }) {
  const state = getUiState()
  return (
    <Panel
      variant="quiet"
      uiTransform={{
        width: compact ? 320 : 380,
        height: compact ? 110 : 132,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Label value="ENTERING CONTAINMENT ROOM" fontSize={UI_TYPE.caption} color={UI_COLORS.warning} />
      <Label
        value={`${state.lobbyCountdown ?? 3}`}
        fontSize={compact ? 38 : 48}
        color={UI_COLORS.white}
        textAlign="middle-center"
      />
      <Label value="SEALING THE DOORS" fontSize={UI_TYPE.caption} color={UI_COLORS.textMuted} />
    </Panel>
  )
}

export function LobbyScreen() {
  const state = getUiState()
  const visible = state.phase === 'BOOT' || state.phase === 'LOBBY' || state.phase === 'COUNTDOWN'
  if (!visible) return <UiEntity uiTransform={{ display: 'none', width: '100%', height: '100%' }} />

  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const compact = (canvas?.height ?? 720) <= 800

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 0, right: 0, bottom: 0, left: 0 },
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        pointerFilter: 'block',
        zIndex: 80
      }}
      uiBackground={{ color: UI_COLORS.lobbyBackdrop }}
      onMouseDown={() => undefined}
    >
      {state.phase === 'BOOT' ? (
        <ClosedLobbyPrompt compact={compact} />
      ) : state.phase === 'COUNTDOWN' ? (
        <Countdown compact={compact} />
      ) : lobbyPage === 'INSTRUCTIONS' ? (
        <Instructions compact={compact} />
      ) : lobbyPage === 'LEADERBOARD' ? (
        <Leaderboard compact={compact} />
      ) : (
        <LobbyHome compact={compact} />
      )}
    </UiEntity>
  )
}

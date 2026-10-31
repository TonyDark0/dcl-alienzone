import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'

import { requestLeaderboard, requestReady } from '../../client/gameClient'
import { CHASE_CARD_TYPES, CHASE_CARD_DETAILS } from '../../game/rules/chaseCards'
import { ActionButton } from '../components/ActionButton'
import { LeaderboardPanel } from '../components/LeaderboardPanel'
import { Panel } from '../components/Panel'
import { getUiState } from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'
import { createMenuMotion, stepMenuMotion, type MenuMotionState } from '../state/uiMotion'
import { SciFiSurface } from '../components/SciFiSurface'
import { MatchLoadoutEditor } from '../components/MatchLoadoutEditor'
import { PageNavigation } from '../components/PageNavigation'
import { pageWindow } from '../state/pagination'

type LobbyPage = 'HOME' | 'INSTRUCTIONS' | 'LEADERBOARD' | 'LOADOUT'

let lobbyPage: LobbyPage = 'HOME'
let lobbyMotion: MenuMotionState | null = null

const SCORE_ROWS = [
  ['SUCCESSFUL NEARBY THROW', '+1'],
  ['FIRST TO TOUCH A COIN', '+1'],
  ['ACTIVATE A CARD / COLLECT A POWER', '+1'],
  ['FOOL AN ATTACKER WITH SHADOW', '+1'],
  ['NEVER HELD EITHER ALIEN IN A ROUND', '+1'],
  ['CONTAINMENT: HIT AT LEAST 3 OF 5', '+1']
] as const

const CARD_ROWS = CHASE_CARD_TYPES.map((type) => {
  const card = CHASE_CARD_DETAILS[type]
  return [card.icon, card.name, card.description, card.rarity] as const
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
            lobbyPage = 'LOADOUT'
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
let instructionSubpage = 0

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
  const pages = pageWindow(
    instructionPage === 'CARDS' ? CARD_ROWS.map((_, index) => index) : instructionPage === 'SCORING' ? [0, 1] : [0],
    instructionSubpage,
    instructionPage === 'CARDS' ? 2 : 1
  )
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
          value="RUN. TAG. OUTSMART THE CREW."
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
          <UiEntity uiTransform={{ width: '33.33%', padding: { left: 4, right: 4 } }}>
            <ActionButton
              label={page}
              tone={instructionPage === page ? 'primary' : 'secondary'}
              fontSize={compact ? 16 : 18}
              width="100%"
              height={48}
              interactionId={`tutorial-tab:${page}`}
              sound="menu"
              onPress={() => {
                instructionPage = page
                instructionSubpage = 0
              }}
            />
          </UiEntity>
        ))}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', flexGrow: 1, minHeight: 0, flexDirection: 'column', overflow: 'hidden' }}>
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
            <HelpText
              compact={compact}
              height={compact ? 118 : 132}
              value="Prepare three ordered decks before finding a match: three cards per round. Unused cards expire. Move with WASD or the mobile joystick; E / THROW passes to a nearby astronaut. F / the ready card activates your next power. Collect coins for +1 each: ten per round, with no replacements."
            />
          </UiEntity>
        ) : instructionPage === 'SCORING' ? (
          <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
            {pages.page === 0 ? (
              <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
                <HelpText
                  compact={compact}
                  height={compact ? 70 : 76}
                  value="An accepted throw, coin collection or power activation awards +1. Shadow grants one extra point if an attacker throws at the decoy. Rejected inputs and ordering cards give nothing. Holding awards nothing. Humans and bots use the same rules."
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
                      uiTransform={{ width: '86%', height: '100%' }}
                      textAlign="middle-left"
                    />
                    <Label
                      value={heat}
                      fontSize={compact ? 16 : 20}
                      color={UI_COLORS.alien}
                      uiTransform={{ width: '14%', height: '100%' }}
                      textAlign="middle-right"
                    />
                  </UiEntity>
                ))}
              </UiEntity>
            ) : (
              <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
                <HelpText
                  compact={compact}
                  height={compact ? 40 : 50}
                  value="A new holder has a 1-second arrival grace. You cannot return the same alien to its immediate giver for 2.5 seconds. Touching alone never passes it. Echo follows these rules too."
                />
                <HelpText
                  compact={compact}
                  accent
                  height={compact ? 40 : 50}
                  value="Skip protects for 3s. Invisible hides for 10s, except from Vacune. Freeze slows others to 50% for 2s; on Turbo it cancels the boost to normal speed instead. The timer keeps running."
                />
                <HelpText
                  compact={compact}
                  height={compact ? 34 : 44}
                  value="Only the original alien attacks. A takeover no longer subtracts points in running mode."
                />
                <HelpText
                  compact={compact}
                  accent
                  height={compact ? 90 : 100}
                  value="CONTAINMENT: If attacked, tap the 5 targets as they appear. Hit at least 3 to earn +1; missed targets count. The crew contains the first 2 attacks regardless of your hits. The third attack ends the match, but you can still earn the bonus."
                />
              </UiEntity>
            )}
          </UiEntity>
        ) : (
          <UiEntity uiTransform={{ width: '100%', flexDirection: 'column' }}>
            <HelpText
              compact={compact}
              height={compact ? 108 : 116}
              value="General (green): repeat across rounds. Epic (red): each type once per match. Rare (purple): board pickups, never in decks. Prepare 3 cards per round; unused cards expire. F / the ready card activates the next power for +1. Reorder without pausing. Chaos teleports you randomly on activation; it may land you near danger. A carried alien and its timer stay with you."
            />
            {[pages.start].map((offset) => (
              <UiEntity
                uiTransform={{
                  width: '100%',
                  height: compact ? 144 : 152,
                  flexShrink: 0,
                  margin: { bottom: 8 },
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                }}
              >
                {CARD_ROWS.slice(offset, offset + 2).map(([icon, name, description, tier]) => (
                  <UiEntity
                    uiTransform={{
                      width: '49%',
                      height: '100%',
                      padding: compact ? 8 : 12,
                      flexDirection: 'column'
                    }}
                  >
                    <SciFiSurface
                      quiet
                      tone={
                        tier === 'GENERAL' ? UI_COLORS.alien : tier === 'EPIC' ? UI_COLORS.danger : UI_COLORS.violet
                      }
                    />
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
                      uiTransform={{ width: '78%', height: 24, flexShrink: 0 }}
                    />
                    <Label
                      value={description}
                      fontSize={compact ? 12 : 14}
                      color={UI_COLORS.textMuted}
                      textAlign="top-left"
                      uiTransform={{ width: '100%', height: compact ? 102 : 108, flexShrink: 0 }}
                    />
                  </UiEntity>
                ))}
              </UiEntity>
            ))}
          </UiEntity>
        )}
      </UiEntity>
      <PageNavigation
        id="instructions-pages"
        page={pages.page}
        count={pages.count}
        onPage={(page) => {
          instructionSubpage = page
        }}
      />
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
  if (!visible) {
    lobbyMotion = null
    return <UiEntity uiTransform={{ display: 'none', width: '100%', height: '100%' }} />
  }

  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const compact = (canvas?.height ?? 720) <= 800
  const now = Date.now()
  if (state.phase !== 'LOBBY') lobbyMotion = null
  else if (!lobbyMotion) lobbyMotion = createMenuMotion(lobbyPage, now)
  const motion = lobbyMotion
    ? stepMenuMotion(lobbyMotion, lobbyPage, now)
    : { key: lobbyPage, opacity: 1, offset: 0, blocking: false }

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
      <UiEntity
        uiTransform={{
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: motion.opacity,
          position: { top: motion.offset }
        }}
      >
        {state.phase === 'BOOT' ? (
          <ClosedLobbyPrompt compact={compact} />
        ) : state.phase === 'COUNTDOWN' ? (
          <Countdown compact={compact} />
        ) : motion.key === 'LOADOUT' ? (
          <MatchLoadoutEditor
            compact={compact || isMobile()}
            viewport={{ width: canvas?.width ?? 1920, height: canvas?.height ?? 1080, mobile: isMobile() }}
            onBack={() => {
              lobbyPage = 'HOME'
            }}
            onConfirm={(plan) => {
              requestReady(plan)
            }}
          />
        ) : motion.key === 'INSTRUCTIONS' ? (
          <Instructions compact={compact} />
        ) : motion.key === 'LEADERBOARD' ? (
          <Leaderboard compact={compact} />
        ) : (
          <LobbyHome compact={compact} />
        )}
      </UiEntity>
      {motion.blocking ? (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { top: 0, left: 0 },
            width: '100%',
            height: '100%',
            pointerFilter: 'block'
          }}
          onMouseDown={() => undefined}
        />
      ) : null}
    </UiEntity>
  )
}

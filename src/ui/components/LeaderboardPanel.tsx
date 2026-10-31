import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import type { UiLeaderboardEntry } from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'
import { Panel } from './Panel'
import { SciFiSurface } from './SciFiSurface'
import { PageNavigation } from './PageNavigation'
import { pageWindow } from '../state/pagination'

let leaderboardPage = 0

interface LeaderboardPanelProps {
  entries: UiLeaderboardEntry[]
  loading: boolean
  compact: boolean
  expanded?: boolean
}

function rankingOrder(a: UiLeaderboardEntry, b: UiLeaderboardEntry): number {
  if (b.bestHeat !== a.bestHeat) return b.bestHeat - a.bestHeat
  if (b.wins !== a.wins) return b.wins - a.wins
  return a.displayName.localeCompare(b.displayName)
}

export function LeaderboardPanel({ entries, loading, compact, expanded = false }: LeaderboardPanelProps) {
  const rankedEntries = [...entries].sort(rankingOrder).slice(0, expanded ? 10 : compact ? 4 : 5)
  const records = pageWindow(rankedEntries, leaderboardPage, expanded ? 4 : rankedEntries.length || 1)

  return (
    <Panel
      variant="quiet"
      uiTransform={{
        width: expanded ? '100%' : compact ? '23%' : '24%',
        height: expanded ? '100%' : compact ? '92%' : '82%',
        padding: compact ? UI_SPACING.md : UI_SPACING.lg,
        flexDirection: 'column'
      }}
    >
      <Label value="RECORDS" fontSize={UI_TYPE.caption} color={UI_COLORS.cyan} />
      <UiEntity
        uiTransform={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          margin: { top: 4, bottom: compact ? 12 : 18 }
        }}
      >
        <Label value="WORLD LEADERBOARD" fontSize={compact ? UI_TYPE.body : UI_TYPE.strong} color={UI_COLORS.white} />
        <UiEntity uiTransform={{ flexGrow: 1 }} />
        <Label
          value="BEST"
          fontSize={UI_TYPE.caption}
          color={UI_COLORS.textMuted}
          textAlign="middle-right"
          uiTransform={{ width: compact ? 74 : 90 }}
        />
        <Label
          value="WINS"
          fontSize={UI_TYPE.caption}
          color={UI_COLORS.textMuted}
          textAlign="middle-right"
          uiTransform={{ width: compact ? 44 : 56 }}
        />
      </UiEntity>

      {loading ? (
        <UiEntity uiTransform={{ flexGrow: 1, justifyContent: 'center' }}>
          <Label value="SYNCING WORLD RECORDS…" fontSize={UI_TYPE.caption} color={UI_COLORS.textMuted} />
        </UiEntity>
      ) : rankedEntries.length === 0 ? (
        <UiEntity uiTransform={{ flexGrow: 1, justifyContent: 'center' }}>
          <Label value="NO RECORDS YET" fontSize={UI_TYPE.body} color={UI_COLORS.alien} />
          <Label
            value="PLAY A MATCH TO SET THE FIRST RECORD"
            fontSize={UI_TYPE.caption}
            color={UI_COLORS.textMuted}
            uiTransform={{ margin: { top: UI_SPACING.sm } }}
          />
        </UiEntity>
      ) : (
        <UiEntity
          uiTransform={{ width: '100%', flexGrow: 1, minHeight: 0, overflow: 'hidden', flexDirection: 'column' }}
        >
          {records.items.map((entry, row) => {
            const index = records.start + row
            const leading = index === 0
            return (
              <UiEntity
                uiTransform={{
                  width: '100%',
                  height: compact ? 52 : 56,
                  flexShrink: 0,
                  padding: { left: UI_SPACING.sm, right: UI_SPACING.sm },
                  margin: { bottom: 4 },
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <SciFiSurface tone={leading ? UI_COLORS.warning : UI_COLORS.space700} />
                <Label
                  value={`${index + 1}`}
                  fontSize={compact ? UI_TYPE.body : UI_TYPE.strong}
                  color={leading ? UI_COLORS.warning : UI_COLORS.textMuted}
                />
                <Label
                  value={entry.displayName}
                  fontSize={compact ? 12 : UI_TYPE.body}
                  color={UI_COLORS.white}
                  uiTransform={{ margin: { left: UI_SPACING.sm }, flexGrow: 1 }}
                />
                <Label
                  value={`${entry.bestHeat}`}
                  fontSize={compact ? UI_TYPE.body : UI_TYPE.strong}
                  color={UI_COLORS.cyan}
                  textAlign="middle-right"
                  uiTransform={{ width: compact ? 74 : 90 }}
                />
                <Label
                  value={`${entry.wins}`}
                  fontSize={compact ? UI_TYPE.body : UI_TYPE.strong}
                  color={UI_COLORS.alien}
                  textAlign="middle-right"
                  uiTransform={{ width: compact ? 44 : 56 }}
                />
              </UiEntity>
            )
          })}
        </UiEntity>
      )}
      {!loading && rankedEntries.length ? (
        <PageNavigation
          id="world-ranking"
          page={records.page}
          count={records.count}
          onPage={(page) => {
            leaderboardPage = page
          }}
        />
      ) : null}
    </Panel>
  )
}

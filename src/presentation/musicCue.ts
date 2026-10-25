import type { MatchPhase } from '../game/model/types'

export type MusicCue = 'LOBBY' | 'MATCH'

const MATCH_MUSIC_PHASES: readonly MatchPhase[] = [
  'ROUND_START',
  'HOLDING',
  'RESOLVING_CHAIN',
  'TAKEOVER',
  'ROUND_RESULT'
]

export function musicCueForPhase(phase: MatchPhase): MusicCue {
  return MATCH_MUSIC_PHASES.includes(phase) ? 'MATCH' : 'LOBBY'
}

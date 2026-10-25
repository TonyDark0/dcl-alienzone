import { describe, expect, it } from 'vitest'

import { musicCueForPhase } from '../src/presentation/musicCue'

describe('musicCueForPhase', () => {
  it('uses the lobby loop before, after and between matches', () => {
    expect(musicCueForPhase('BOOT')).toBe('LOBBY')
    expect(musicCueForPhase('LOBBY')).toBe('LOBBY')
    expect(musicCueForPhase('COUNTDOWN')).toBe('LOBBY')
    expect(musicCueForPhase('MATCH_RESULT')).toBe('LOBBY')
  })

  it('uses the match loop only while the table is active', () => {
    expect(musicCueForPhase('ROUND_START')).toBe('MATCH')
    expect(musicCueForPhase('HOLDING')).toBe('MATCH')
    expect(musicCueForPhase('RESOLVING_CHAIN')).toBe('MATCH')
    expect(musicCueForPhase('TAKEOVER')).toBe('MATCH')
    expect(musicCueForPhase('ROUND_RESULT')).toBe('MATCH')
  })
})

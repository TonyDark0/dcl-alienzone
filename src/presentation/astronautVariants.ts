import { ASTRONAUT_VARIANT_PATHS } from './assetManifest'

function hashMatchId(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Returns one stable, non-repeating astronaut skin per seat for this match. */
export function astronautVariantsForMatch(matchId: string): string[] {
  const variants: string[] = [...ASTRONAUT_VARIANT_PATHS]
  let randomState = hashMatchId(matchId || 'ALIENZONE-LOCAL')

  for (let index = variants.length - 1; index > 0; index -= 1) {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0
    const other = randomState % (index + 1)
    ;[variants[index], variants[other]] = [variants[other], variants[index]]
  }

  return variants
}

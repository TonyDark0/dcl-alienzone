import { SEAT_CLIPS } from './animationClips'

/**
 * Both clips in the current seat GLB are single-key poses at 1/24 second,
 * not motion timelines. Keep the selected pose alive at speed zero so the
 * renderer cannot finish it while its crossfade is still in progress.
 * Blending the weights supplies the recline and recovery motion.
 */
export function createSeatAnimationStates() {
  return [
    { clip: SEAT_CLIPS.idle, playing: true, loop: true, speed: 0, weight: 1 },
    { clip: SEAT_CLIPS.takeoverRecline, playing: false, loop: true, speed: 0, weight: 0 }
  ]
}

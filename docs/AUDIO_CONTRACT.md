# Audio Contract

## Music

| Context                    | Runtime path                                                | Format                             | Base volume |
| -------------------------- | ----------------------------------------------------------- | ---------------------------------- | ----------: |
| Lobby, results and rematch | `assets/Audio/music/az_mus_lobby_containment_loop_v001.mp3` | MP3 stereo, 44.1 kHz, 128–160 kbps |        0.46 |
| Active match and takeover  | `assets/Audio/music/az_mus_match_alienzone_loop_v001.mp3`   | MP3 stereo, 44.1 kHz, 128–160 kbps |        0.48 |

Source folders:

- `art-source/audio/az_mus_lobby_containment_loop_v001/`
- `art-source/audio/az_mus_match_alienzone_loop_v001/`

Both tracks must loop seamlessly. The director crossfades between lobby and match cues and retries the current cue after the first user gesture to satisfy autoplay restrictions.

The dedicated match file is not present in the current repository. Until it is exported, runtime configuration intentionally uses the valid lobby file for both cues so entering a match never crossfades to silence. Replace the fallback path in `src/config/audioConfig.ts` when `az_mus_match_alienzone_loop_v001.mp3` is added.

## UI audio

Buttons, hover/highlight and menu changes use the copied native Decentraland UI sounds under `assets/Audio/ui/native/`. DCL Alienzone does not duplicate the Explorer's global volume or accessibility controls.

## Gameplay SFX targets

- `assets/Audio/sfx/az_sfx_pass_v001.ogg`
- `assets/Audio/sfx/az_sfx_card_arm_v001.ogg`
- `assets/Audio/sfx/az_sfx_takeover_impact_v001.ogg`

Future SFX must be short, normalized, licensed and mixed below dialogue/voice-chat comfort levels.

## Acceptance

- Every audio entity has a Transform, including global sources. Music sources loop. When both cues temporarily use the same asset, preserve playback across phase changes rather than restart the file.

- Lobby cue starts after an allowed gesture if autoplay is blocked.
- Match cue replaces lobby cue without an abrupt cut.
- Returning to lobby restores the lobby cue.
- Missing optional audio never blocks gameplay.
- Takeover remains understandable with audio muted.

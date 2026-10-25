# Metrics and Validation Plan

## Privacy

- Collect only product and performance signals needed for balance.
- Prefer pseudonymous session identifiers.
- Do not transmit visible names or wallet addresses unless required by an approved Decentraland service.
- Gameplay must continue when telemetry fails.

## Product events

| Event             | Minimum fields                                      |
| ----------------- | --------------------------------------------------- |
| `scene_loaded`    | platform, load time, build version                  |
| `lobby_action`    | play, tutorial or leaderboard                       |
| `match_started`   | human count, bot count, seed                        |
| `pass_resolved`   | points band, alien type, selected Chaos destination |
| `card_armed`      | card type, category                                 |
| `card_activated`  | card type, accepted/rejected                        |
| `takeover`        | victim type, POINTS delta, round                    |
| `match_completed` | duration, final rank, rematch intent                |
| `disconnect`      | phase and reconnect result                          |

## Balance indicators

- POINTS distribution by remaining-fuse band.
- Percentage of manual passes held for at least two seconds.
- Manual hold duration and attacks after inactive holds.
- Card arm, activation and rejection rates.
- Echo score contribution.
- Takeover penalty impact.
- Human-versus-bot win rate.
- Early-leader conversion rate.

Investigate when most passes remain in the safe band, bots dominate, one card is rarely equipped, or the opening leader almost always wins.

## Technical indicators

- Client FPS and frame-time spikes.
- Server action rejection and snapshot delay.
- Asset load failures.
- Memory before and after three rematches.
- Leaderboard load/save failure.
- Mobile UI overflow or unreachable controls.

## Playtest questions

Observe before explaining. Ask:

- What did you think would happen next, and why?
- How did you believe POINTS was awarded?
- Did you understand the difference between reactions and interventions?
- Could you find the leaderboard?
- Did the takeover feel clear and consequential?

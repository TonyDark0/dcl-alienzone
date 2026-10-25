# Technical Architecture

## Principles

- Composite-first static scene authoring.
- Renderer-independent deterministic rules.
- Small authoritative snapshots rather than synchronized animation frames.
- Presentation derives from state and never decides rules.
- Mobile-first budgets and graceful visual degradation.
- Decentraland infrastructure only.

## Runtime split

`src/index.ts` selects the authoritative server or client with `isServer()`.

### Server

- Owns `MatchEngine`, deadlines, bots, hands, scoring and ranking.
- Maps connected wallet addresses to seats.
- Validates and deduplicates action envelopes.
- Sends player-targeted snapshots every 200 ms.
- Publishes a heartbeat through `alienzone::ServerStatus`.
- Persists the global leaderboard to Scene Storage after match completion.

### Client

- Sends intents only: ready, pass, equip, activate, reaction, rematch and menu.
- Maps snapshots to UI state.
- Creates astronaut and seat instances after the black countdown, during the visible crew-seating phase.
- Shuffles the eight astronaut GLB skin variants from `matchId`, assigning one non-repeating variant per seat.
- Drives skeletal animation, virtual camera, UI, audio and visual effects.
- Presents local quick reactions optimistically on the input frame, then reconciles their lifetime against server snapshots without replaying the animation.
- Never predicts authoritative score or card consumption.

## State machine

`BOOT → LOBBY → COUNTDOWN → HOLDING → TAKEOVER → HOLDING … → MATCH_RESULT`

Presentation-only labels may refer to round start or chain resolution, but the authoritative loop remains small.

- `BOOT`: waiting for server heartbeat and room connection.
- `LOBBY`: opaque 2D navigation; no gameplay input.
- `COUNTDOWN`: preload/create arena and position camera behind the overlay.
- `HOLDING`: passes and cards accepted.
- `TAKEOVER`: inputs locked; 4.2-second cinematic.
- `MATCH_RESULT`: persist records and show ranking.
- Rematch creates a new seeded engine and starts another countdown.
- Main Menu creates a new engine and returns to the lobby.

## Multiplayer messages

All writes include `clientActionId`, expected `matchId` and expected round where applicable. The server rejects stale or duplicate actions. Snapshots contain local seat, public seats, local hand, alien holders, direction, deadlines, events and leaderboard-independent match state.

## Alien model

`aliens[]` contains `ORIGINAL` and optional `ECHO`. Each alien has holder, arrival time, held-since time and turn. A Chaos destination belongs to its caster's seat and applies only to that seat's next pass. Both aliens share one deadline, direction and phase. Destination collision is resolved before reaction consumption. Each round removes all old Echo cards, then assigns one uniquely identified bonus card to one seeded-random seat.

## Lobby and leaderboard

The client requests the leaderboard after joining and again when the leaderboard page opens. The server also broadcasts it after a completed match is persisted. Storage key: `alienzone:leaderboard:global:v1`.

## Camera and actors

- Arena center: `(16, 0, 16)`.
- Seat radius: `2.0825 m`.
- Seat-ring clockwise offset around the arena center: `5°`.
- Seat and astronaut local yaw offset: `0°`.
- Orbit look target: `(16, 0.83125, 16)`.
- Default orbit radius: `3.8556 m`; look-target Y: `0.665 m`; camera height: `3.15 m`; FOV: `50°`.
- Takeover camera position remains unchanged; its look target is lowered to `Y 0.672`.
- Horizontal mouse/touch movement changes yaw only.
- Takeover uses a lateral close-up, optional local shake and smooth return.
- Native avatars, locomotion and passports are hidden/disabled in the arena.

## Persistence

Scene Storage holds the versioned global leaderboard. Active match state remains in memory. Storage failure never changes the authoritative result; rematch waits until the completed result is safely persisted.

## Testing

Pure tests cover scoring, deck distribution, Echo behavior, collision, persistence ranking, fuse and action gates. SDK build and typecheck validate integration.

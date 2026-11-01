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

- Owns `ChaseMatchEngine`, proxy positions, deadlines, bots, hands, scoring and ranking. `MatchEngine` retains shared lifecycle/containment and the archived seated regression rules; the server never instantiates it directly.
- Maps connected wallet addresses to seats.
- Validates and deduplicates action envelopes.
- Sends player-targeted snapshots every 100 ms. Other players' hands and invisible enemies' live coordinates are withheld.
- Includes only accepted, unexpired motion intents for visible players (and the recipient's own seat); invisible enemies' intents are withheld too.
- Publishes a heartbeat through `alienzone::ServerStatus`.
- Persists the global leaderboard to Scene Storage after match completion.

### Client

- Sends intents only: ready, movement direction, explicit nearby throw, deck ordering, equip, activate, reaction, containment target tap, rematch and menu. Throws are validated afresh on the server, never automatic from contact.
- Maps snapshots to UI state.
- Creates astronaut and seat instances during the covered countdown, then reveals the visible crew-seating phase.
- Shuffles the eight astronaut GLB skin variants from `matchId`, assigning one non-repeating variant per seat.
- Drives skeletal animation, virtual camera, UI, audio and visual effects.
- Presents local quick reactions optimistically on the input frame, then reconciles their lifetime against server snapshots without replaying the animation.
- Never predicts authoritative score or card consumption.

## State machine

`BOOT → LOBBY → COUNTDOWN → ROUND_START (visible seating) → DECK_SETUP (5s) → HOLDING → TAKEOVER → HOLDING … → MATCH_RESULT`

Presentation-only labels may refer to round start or chain resolution, but the authoritative loop remains small.

- `BOOT`: waiting for server heartbeat and room connection.
- `LOBBY`: opaque 2D navigation; no gameplay input.
- `COUNTDOWN`: preload/create arena and prepare the local suit close-up behind the overlay. During the visible seating intro, hold that framing for 0.6s and zoom out over 1.8s; no fuse runs. Snapshot-derived intro elapsed time prevents a late join replaying an expired reveal.
- Pre-match loadout: `requestReady` carries an optional 3×3 card-type plan, validated server-side before entry; reject Rare/unknown cards and repeated Epic types. Store a private per-seat deep copy and reuse the client's plan on rematch. `DECK_SETUP` remains a five-second first-round review before any fuse. Live ordering accepts only complete permutations of the current remaining queue. Chaos resolves immediately without a queue lock. Expire all cards at takeover and load only the next prepared deck.
- `HOLDING`: forward/heading intents and queue/card actions accepted. Normalized screen-relative WASD on desktop; native joystick direction on mobile. Inputs expire after 0.4s and contain match, round and monotonic sequence, never a position or timestamp. Space / THROW requests are separately validated for ownership, current alien turn, one-second arrival grace, nearest eligible target and 1.5m range. Contact alone does nothing. Bots use the same APIs.
- `TAKEOVER`: passing/cards locked; five-second cinematic with five server-timed containment targets for the attacked seat. Resolve the optional +1 bonus at 4.25 seconds, before phase completion and persistence. Client sends target intents only; target windows, ownership, replay rejection and the strict majority threshold belong to the server. Challenge randomness is isolated from the existing gameplay RNG.
- `MATCH_RESULT`: persist records and show ranking.
- Rematch creates a new seeded engine and starts another countdown.
- Main Menu creates a new engine and returns to the lobby.

## Epic success scoring

The v6.2 authority keeps a private per-seat Chaos follow-up record (alien ID, turn, round, activation time) and a pending Vacune bonus set. A successful transfer consumes the Chaos record and can tag its existing PASS point as success within 3s; it never increments score twice. Symbiosis tags its normal transfer similarly. Vacune registers on accepted activation and resolves once on accepted foreign Freeze/Echo while vaccinated, emitting a single numeric REACTION_RESOLVED point notice. Rejected/own/prior activations and mere Echo throw attempts do not resolve it. Both round start and takeover clear pending conditions. No client bonus intent or new persistence service is introduced.

## Multiplayer messages

Discrete gameplay actions include `clientActionId`, expected `matchId` and round. Movement uses a separately monotonic input sequence with match/round and is not a score-producing action request. The authenticated sender is mapped to its owned seat. Input magnitudes are normalized, speed/bounds are server-owned, and the client interpolates presentation only. No client-reported contacts, positions or scores are accepted.

## Alien model

`aliens[]` contains `ORIGINAL` and optional `ECHO`, sharing one deadline/phase; Echo never attacks. Rare pickups have independent seeded positions/appearance times: one Turbo per round, one Echo per match in a random round, no hand grant or respawn. First swept authoritative contact after appearance activates once. Chaos immediately teleports the caster to an independently seeded valid map position, without danger filtering, ownership/timer changes or collection along the jump. A monotonic `teleportRevision` makes presentation snap rather than interpolate across the map. A per-alien record blocks immediate return to its giver for 2.5s; teleporting preserves it. Ordinary throws and Symbiosis honor immunity/occupancy; `throwReady` is only a UI hint. Shadow is an expiring non-participant decoy; trap attempts remove it, keep ownership and grant its owner +1. Symbiosis uses a straight 5m first-body query; flight visuals do not decide hits. Vacune changes only its recipient's hidden-position visibility and incoming Echo/Freeze eligibility for that round. Preview deck selection includes all approved powers, while persistent progression/storage claims remain disabled. See [v6.2 contract](ROUND_POWERS_AND_LOADOUTS.md).

`throwProximity.ts` selects the same target for the UI and the server action. An in-core server observation can retain that target for 150ms within a maximum 1.7m distance; no observation means no forgiveness. The cache is keyed by alien/current turn, expires without renewal outside 1.5m and clears at transfer/round/takeover. Eligibility is reapplied on every query. A 0.15m target preference margin avoids rapid switching between nearly tied candidates. Hidden target identity is omitted from the hint, and invisible live coordinates remain withheld.

## Shared round coins

`chaseCoins.ts` generates exactly ten separated positions per round from an isolated seed stream and a bounded fallback grid. Coordinates stay one metre inside the gameplay bounds, outside a four-metre central furniture clearance and at least one metre from current astronauts. No replenishment occurs. `ChaseMatchEngine.updateGameplay()` resolves swept proxy/coin contact after integrating all players; earliest contact in the step wins, with seat ID breaking exact ties. The combined 0.65m contact radius matches the scaled coin/body plus a small tolerance. One COIN event adds +1 once, never a successful pass or ownership change. The remaining array is cleared at takeover and replaced, not appended, next round. Snapshots clone the public coin records; no client claim/position/score message exists. Maximum extra snapshot records: ten. Bots may seek visible coins while still evading threats/chasing with an alien.

`arenaCoins.ts` creates runtime-only shared-source GLBs under the match root, one pivot-corrected model per authoritative remaining coin. No physics/pointer collider, Animator or shader is needed. A 0.45s entrance scale bounce, 60°/s own-axis spin and 0.05m bob are local presentation only. Removal is snapshot-driven and all instances clear at takeover/menu/results. COIN events reuse numeric +1 nameplate notices, not AST_PASS or card announcements. No storage write occurs per coin.

## Lobby and leaderboard

The client requests the leaderboard after joining and when its page opens. The server broadcasts it after persistence. Running storage key: `alienzone:leaderboard:running:v1`. The old `alienzone:leaderboard:global:v1` is preserved, not read or overwritten by the running board; scores from different rules are not comparable.

## Bot decisions

`chaseBots.ts` is a pure deterministic open-room planner. Visible observations drive short-horizon interception, 1.25-second target commitment, a recent-recipient preference penalty and candidate escape headings penalized for edges/crowding. Distinct seeded waypoints refresh every four seconds. Invisible enemy positions and private hands never inform the planner. The server can reorder its own queue before using the same card API as a human. Freeze is saved for nearby unslowed prey, defenses for visible danger; there is no bot-only speed factor. Both roles integrate the same 3.2m/s base and timed multipliers. Round starters use a separately seeded shuffle without repeat, independent of AI/card random consumption.

## Camera and actors

- `astronautMaterialEffects.ts` applies temporary `GltfNodeModifiers` at the whole-model path using the existing shared atlas, verified byte-for-byte against all eight variants. A 0.2s parameter transition combines Freeze tint/gloss with owner-only 25% Invisible opacity. Existing remote `VisibilityComponent` concealment remains immediate, with shadow casting explicitly off. Effects are derived from authoritative phase/deadlines; stable material writes are quantized/cached. Deleting the override restores the original GLB material; takeover and actor cleanup clear it. No meshes, textures, rigs or server state are changed.
- COIN event metadata survives the UI adapter as `UiSeatNotice.source = 'COIN'`. `noticeAnimation.ts` selects its 2.2× scale, stronger outline, gold/white contrast and longer full-opacity hold without affecting ordinary notices or awarding predicted score.
- Movement arena and camera center: `(16, 0, 16)`, X 1–31 / Z 8.5–23.5 (30×15m), inside the unchanged six parcels (48×32m). This matches the existing authored room and intro/seat ring center; GLBs and static composite transforms are untouched.
- Seat radius: `2.0825 m`.
- Seat-ring clockwise offset around the arena center: `5°`.
- Seat and astronaut local yaw offset: `0°`.
- Participant drone camera: follow the local actor's scene-owned displayed pose after actors update, aim at torso Y 0.9, and write camera position/rotation atomically. Keep a fixed world heading and nominal 60° pitch, with relative height 15.3m (10% shorter distance than the former shared view). Clamp camera Z to at least 0.25m inside parcels, steepening pitch slightly at the south edge without moving the target off the player. Retain the previous aspect-aware FOV for a genuine zoom, no longer fitting every arena corner during tracking. Spectators keep `(16,17,6.185)` aimed at `(16,0,16)`. The front/three-quarter suit reveal eases into tracking before deck setup; all attack returns restore it. Native framing/occlusion and portrait readability still need testing. WASD controls proxy movement; the cursor stays free.
- Movement presentation forecasts accepted inputs for at most 0.2s between snapshots, respecting input expiry, speed effects and bounds. It smooths a scene-owned numerical pose instead of reading renderer-delayed Transforms. Facing uses a 30/s shortest-angle response (~95% in 100ms), independent of translation (also 30/s). Direction/start/stop edges send immediately; unchanged held intent refreshes at 10Hz. Authoritative movement already changes heading instantly and never follows the eased yaw, so a reversal does not need a U-turn or gain speed. This is not local input prediction: the initial server round-trip remains. No extrapolated contact or score is sent to the server.
- The camera system runs at priority 90,000 and writes position/orientation atomically. There is no moving look-at target or mouse orbit. All three rounds enter the lateral attack close-up for every client, then return smoothly. FOV blends to 50° for close-ups and returns to the aspect-fitted global lens. Only the local victim receives shake/red feedback and interactive targets; observers remain steady.
- Takeover uses the moving victim's current position and orientation for a lateral close-up, target height `0.672`.
- Astronauts move inside provisional X 1–31 / Z 8.5–23.5 bounds with the delivered `AST_RUNNING` / `AST_RUNNING_ALIEN` loops. Freeze/Turbo apply the same 0.5×/2× factors to position integration and animation; Freeze cancels an existing Turbo to normal speed instead of slowing that hit. Vacune resists Freeze. Chairs retain their intro anchors. Names/notices/reactions follow the astronaut and face the camera. Shadow reuses the owner's loaded GLB/skin/nameplate and running loop, with bounded smoothing, final blink/fade and cleanup.
- Takeover uses a lateral close-up, optional local shake and smooth return.
- Native avatars, locomotion and passports are hidden/disabled in the arena.

The open-room preview does not infer map obstacles from GLB physics. A divided-map collision/navigation definition and native camera/roof-occlusion checks are release requirements. Do not present automation success as visual verification.

The owner updated `assets/Models/environment/az_env_spaceship_containment_room_v001.glb` to approximately 29.76×14.95m local X/Z and kept its transform at (16,0.08,16). The camera and nominal 30×15m movement bounds now share that center instead of the six-parcel center at X 24. Code does not edit/stretch this mesh, add another floor or change its composite transform. Verify mesh edges, roof visibility and mobile controls in native Explorer; numerical camera tests are not visual acceptance.

## Persistence

Scene Storage holds the versioned global leaderboard. Active match state remains in memory. Storage failure never changes the authoritative result; rematch waits until the completed result is safely persisted.

## Testing

Pure tests cover scoring, deck distribution, Echo behavior, collision, persistence ranking, fuse and action gates. SDK build and typecheck validate integration.

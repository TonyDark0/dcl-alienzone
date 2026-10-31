# DCL Alienzone — Product and Technical Brief

## Product statement

DCL Alienzone is a mobile-first social running-tag game for Decentraland SDK7. One to eight players control astronaut proxies inside a spaceship after a shared seated introduction. A baby alien attacks the holder of the original creature when the shared fuse expires.

Players earn +1 per accepted nearby throw, +1 per shared coin collected, +1 for a round without receiving either alien and an optional +1 containment bonus. Ten coins spawn per round, thirty per match, without replenishment; leftovers expire. The match ends after exactly three takeovers; nobody is eliminated. A local suit reveal zooms out to a fixed-heading, nominal 60° drone tracking the local astronaut, 10% closer than the previous shared view. The revised area remains 30×15m, with responsive screen-relative WASD / mobile joystick movement. The two running loops are integrated; native visual checks and a divided arena remain production dependencies. Coins are match points; progression is a proposal, not a live economy.

## Product goals

- Deliver a complete, replayable party game rather than a technical demo.
- Work with one human plus bots and scale to eight humans.
- Prioritize mobile readability, short sessions and immediate rematches.
- Use Decentraland's authoritative multiplayer server and Scene Storage without external hosting.
- Present a distinctive low-poly spaceship and astronaut cast while respecting mobile budgets.
- Keep gameplay deterministic, testable and open source.

## Core loop

1. Enter the opaque 2D home menu; Play opens the three-round, three-card-per-round deck builder before matchmaking.
2. Confirm the validated plan and join a match; empty seats become bots with valid varied plans.
3. The arena and local suit camera reveal are prepared during the countdown.
4. Review the first-round order during a five-second setup, then run, evade and explicitly throw the original alien or Echo. Same-alien immediate return is blocked for 2.5s.
5. Activate the first card for +1, reorder the current queue without pausing, collect board-only Turbo/Echo and use random Chaos teleportation, decoys, protection or a straight shot. Discard leftovers and use the next prepared deck each round. See [v6.1 Powers](ROUND_POWERS_AND_LOADOUTS.md).
6. The original alien triggers a takeover when the shared fuse expires.
7. Repeat until the third takeover.
8. Show the containment ranking, persist human records and offer rematch or main menu.

## Platform constraints

- Decentraland SDK7.
- Six parcels in an owner-approved 3×2 World layout (48×32m).
- Native Explorer on desktop and mobile; mobile is the primary target.
- Authoritative Decentraland multiplayer server.
- Decentraland Scene Storage for the global leaderboard.
- No external backend, custom shader, VAT runtime, wallet-gated gameplay or required NFT.
- GLB skeletal animation through `Animator`.
- Three shared authored materials and a shared color atlas.
- Native Decentraland system UI remains responsible for account, chat, voice, graphics, audio settings and exit.

## Audience and session

- Casual and social Decentraland players.
- One to eight humans, completed to eight seats by bots.
- Target match length: approximately 2–4 minutes.
- Directional running/tagging supported by strategic cards.

## Team responsibilities

### Product Manager

Own scope, acceptance criteria, playtest priorities, hackathon submission, release notes and DCL NAME deployment coordination.

### Game / SDK Developer

Own authoritative rules, networking, bots, cards, UI state, camera, audio integration, persistence, tests and performance instrumentation.

### UI / UX Designer

Own mobile-first lobby, tutorial, leaderboard, HUD, card states, safe areas, feedback and accessibility. Essential information must never rely on color alone.

### 3D Artist

Own the spaceship, egg, astronaut, seat, alien and takeover VFX within the approved geometry, material and atlas budgets.

### Rigger / Animator

Own the astronaut, alien, egg, seat and VFX rigs; NLA clip names; clean loop boundaries; in-place animation; and combined rig/blend-shape exports.

### Audio Designer

Own one seamless lobby loop, one seamless match loop and gameplay SFX. Native Decentraland UI sounds remain the source for buttons and menu navigation.

## Product acceptance

- A new player can understand the objective and scoring from the English tutorial.
- The lobby exposes Play, How to Play and World Leaderboard.
- One human can complete a full match with bots.
- Every action is validated by the server.
- Three takeovers end the match.
- Ranking uses POINTS, then fewer takeovers, then more scoring passes; perfect ties are shared.
- The global leaderboard shows best POINTS and wins for human players.
- The takeover reads visually without a modal.
- Desktop and mobile layouts remain usable around native Decentraland UI.
- Typecheck, tests and SDK build pass.

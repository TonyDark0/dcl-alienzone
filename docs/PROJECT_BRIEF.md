# DCL Alienzone — Product and Technical Brief

## Product statement

DCL Alienzone is a mobile-first social push-your-luck game for Decentraland SDK7. One to eight players are represented by fixed astronaut proxies in a spaceship containment room. A cute baby alien escaped from a central egg and takes over the astronaut holding the original creature when the shared fuse expires.

Players earn POINTS by holding an alien for at least two seconds and completing a manual pass. Waiting until the fuse is dangerous awards more POINTS. The match ends after exactly three takeovers; nobody is eliminated.

## Product goals

- Deliver a complete, replayable party game rather than a technical demo.
- Work with one human plus bots and scale to eight humans.
- Prioritize mobile readability, short sessions and immediate rematches.
- Use Decentraland's authoritative multiplayer server and Scene Storage without external hosting.
- Present a distinctive low-poly spaceship and astronaut cast while respecting mobile budgets.
- Keep gameplay deterministic, testable and open source.

## Core loop

1. Enter the opaque 2D lobby.
2. Start a match; empty seats become bots.
3. The arena and fixed camera are prepared during the countdown.
4. Hold and pass the original alien or non-attacking ECHO.
5. Arm reactions and interventions while other players act.
6. The original alien triggers a takeover when the shared fuse expires.
7. Repeat until the third takeover.
8. Show the containment ranking, persist human records and offer rematch or main menu.

## Platform constraints

- Decentraland SDK7.
- Four parcels in a centered 2×2 World layout.
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
- One-button core action supported by strategic cards.

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

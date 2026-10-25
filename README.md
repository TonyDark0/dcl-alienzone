# DCL Alienzone

![Alienzone](assets/Images/ui/branding/az_logo_alienzone_v001.png)

Visual references: [Cards and lettering](docs/CARDS_REFERENCE.md). Current rules: [Game Rules](docs/GAME_RULES.md).

A social push-your-luck game for **Decentraland SDK7**, designed for 1–8 players and deployment as a **Decentraland World linked to a DCL NAME**.

A baby alien escaped from an egg aboard a spaceship. Astronauts pass it before the shared fuse expires; the player holding the original alien at zero suffers a visual takeover. After three takeovers, the player with the most **POINTS** wins.

## Play / Creator Success review

**Public test World: TBD — not deployed.** The owner must supply the exact DCL NAME and authorize deployment. This repository is not a live game URL. Replace this status with the verified visit link after publishing and testing the World.

- [Game Design Document](design/gdd.md): the official sections at the required `/design/gdd.md` path.
- [Application readiness](design/STUDIO_READINESS.md): evidence and remaining requirements.
- [Featured-game research](design/PLAYTEST_NOTES.md): owner-reported observations and unconfirmed play/return records.

Prepared against [Studio Onboarding](https://docs.decentraland.org/creator/studio-onboarding), checked **2026-10-25**. Repository preparation does not imply program acceptance or funding.

## How to play

- Hold, then pass before the alien attacks.
- Risk later passes to earn more points.
- Use cards to disrupt other players.

A manual pass scores only after a two-second hold: +1 / +2 / +3 / +4 depending on shared time remaining. An attack costs 5, never below zero. Holding alone scores nothing; there is no automatic pass. Select a card to load it, then tap the loaded slot to activate it. The table receives only **one Echo card per round**. See the rules for targeting, collision handling and tie-breakers.

## Current status

The authoritative multiplayer loop, scoring, cards, bots, leaderboard, responsive UI, camera and current astronaut/seat/environment assets are integrated. The production alien, egg and takeover VFX GLBs still need to be exported to the paths defined in [`docs/GLB_NAMING_AND_ASSET_PATHS.md`](docs/GLB_NAMING_AND_ASSET_PATHS.md).

This is a **playable local core loop**, not a certified mobile release. Dedicated match music is pending; the lobby track is the fallback. Native mobile performance, live World persistence and deployed multi-human behavior require testing. Current return hooks are records and rivalry; daily progression and proven D1 retention are not implemented claims.

## Quick start

Requirements: **Node.js 22 LTS**, npm, Git, **Git LFS**, the native Decentraland client and Visual Studio Code. Creator Hub supports import, preview and publishing. The old Decentraland SDK7 VS Code extension is deprecated and is not required.

```bash
git clone https://github.com/TonyDark0/dcl-alienzone.git
cd dcl-alienzone
git lfs install
git lfs pull
npm ci
npm run start
```

You can also import this folder through **Creator Hub → Scenes → Import** and use **Preview**.

Keep the preview server running while playing. If a GLB or image contains a Git LFS text pointer instead of binary content, run `git lfs pull`; do not export over it. The exact SDK/server build is pinned in `package-lock.json`; do not upgrade it to reproduce this build.

Other commands:

```bash
npm run start:web    # browser preview
npm run start:multi  # multiple clients for multiplayer testing
npm run ci           # format, typecheck, tests and build
```

## Project documentation

- [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md): product, audience, experience and team responsibilities.
- [`docs/SCOPE.md`](docs/SCOPE.md): binding MVP boundaries.
- [`docs/GAME_RULES.md`](docs/GAME_RULES.md): match loop, scoring, cards and resolution.
- [`docs/TECHNICAL_ARCHITECTURE.md`](docs/TECHNICAL_ARCHITECTURE.md): state, networking and code architecture.
- [`docs/GLB_NAMING_AND_ASSET_PATHS.md`](docs/GLB_NAMING_AND_ASSET_PATHS.md): exact asset names and locations.
- [`docs/ANIMATION_CONTRACT.md`](docs/ANIMATION_CONTRACT.md): rigs, clips and takeover animation contract.
- [`docs/PRESENTATION_SPEC.md`](docs/PRESENTATION_SPEC.md): camera, HUD, reactions and audio.
- [`docs/UI_SYSTEM.md`](docs/UI_SYSTEM.md): React-ECS design system and responsive behavior.
- [`docs/AUDIO_CONTRACT.md`](docs/AUDIO_CONTRACT.md): music routes, formats and mix.
- [`docs/METRICS.md`](docs/METRICS.md): telemetry and validation criteria.
- [`docs/PERFORMANCE_BUDGET.md`](docs/PERFORMANCE_BUDGET.md): mobile performance budget.
- [`docs/AI_AGENT_WORKFLOW.md`](docs/AI_AGENT_WORKFLOW.md): safe, verifiable AI-assisted workflow.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): World and DCL NAME deployment.
- [`docs/BACKLOG.md`](docs/BACKLOG.md): vertical slice, MVP and later work.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): frozen decisions and open questions.

## Structure

```text
assets/             Exported assets consumed by Decentraland
art-source/         Blender sources and concept art; not deployed
design/             GDD, application readiness and research; not deployed
docs/               Production brief and contracts; not deployed
src/                SDK7 source code
tests/              Renderer-independent rule tests
.agents/skills/      Official Decentraland skills for coding agents
```

## Open source

Project code is [MIT licensed](LICENSE); third-party material retains its own license. See [third-party notices and asset provenance](THIRD_PARTY_NOTICES.md). Never commit private keys, seed phrases, tokens, player records or `.env` files. Large art binaries use Git LFS; generated builds, temporary downloads and logs are excluded.

## Deployment status

The approved scene stays at **2×2 parcels**, using Decentraland's authoritative server and Scene Storage rather than a separately hosted backend. `scene.json` intentionally has no invented `worldConfiguration.name`. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Publishing this repository does not deploy the World or submit the application. Before applying, add a real test-World link, confirm applicant/contact and content-rights declarations, and review the readiness checklist.

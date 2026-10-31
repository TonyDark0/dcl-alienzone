# DCL Alienzone

![Alienzone](assets/Images/ui/branding/az_logo_alienzone_v001.png)

Visual references: [Cards and lettering](docs/CARDS_REFERENCE.md). Current rules: [Game Rules](docs/GAME_RULES.md).

Local UI integration: [Sci-fi design system](docs/SCI_FI_DESIGN_SYSTEM.md), with reusable notched frames, gradient surfaces and presentation-only interaction/menu motion. Native desktop/mobile visual validation remains a release check.

A social running-tag game for **Decentraland SDK7**, designed for 1–8 players and deployment as a **Decentraland World linked to a DCL NAME**.

A baby alien escaped from an egg aboard a spaceship. Astronauts pass it before the shared fuse expires; the player holding the original alien at zero suffers a visual takeover. After three takeovers, the player with the most **POINTS** wins.

## Play / Creator Success review

**Public test World: TBD — not deployed.** The owner must supply the exact DCL NAME and authorize deployment. This repository is not a live game URL. Replace this status with the verified visit link after publishing and testing the World.

- [Game Design Document](design/gdd.md): current v6.1 running-tag mechanics, test questions and honest evidence gaps at the required `/design/gdd.md` path.
- [Application readiness](design/STUDIO_READINESS.md): evidence and remaining requirements.
- [Featured-game research](design/PLAYTEST_NOTES.md): owner-reported observations and unconfirmed play/return records.

Prepared against [Studio Onboarding](https://docs.decentraland.org/creator/studio-onboarding), checked **2026-10-31**. Repository preparation does not imply program acceptance or funding. The current GDD separates playable mechanics from proposed rewards and unmeasured retention.

## How to play

- Before matchmaking, prepare three ordered decks of three cards, one per round. Three round blocks show all nine slots; tap a slot, choose its replacement and set Earlier/Later order. General/Epic catalog pages show complete options without native scrollbars. Review the first deck during the five-second setup. F / touch activates its head for +1; current-round reordering never pauses play. Unused cards expire each round.
- Desktop: WASD moves in screen-relative directions; E throws within 1.5m. Mobile: use the native joystick and touch THROW / the ready card. Contact alone never transfers the alien.
- Your suit is revealed in close-up before a smooth zoom-out to a fixed-heading, nominal 60° drone tracking your own astronaut at center, 10% closer than the former shared camera. Direction changes send immediately and the suit turns quickly without a U-shaped movement arc. All three attack close-ups are shared; shake, red flashes and tapping are local-victim-only.
- Earn +1 per transfer and +1 for a whole round without receiving either alien.
- First to touch a coin earns +1. Exactly 10 spawn each round, 30 per match, never more than 10 at once. Collected coins disappear for everyone; leftovers expire and are replaced by 10 fresh positions next round. There is no mid-round respawn or shop currency.
- Use cards to disrupt other players.

The original alien uses one 28-second shared timer that never restarts on a throw. Three takeovers end the match. Hit at least three of five containment targets when attacked for an optional +1. Prepare three ordered decks of three cards before matchmaking; leftovers expire each round. Green General cards repeat; each red Epic type can occupy one slot per match. Purple Turbo (one per round) and Echo (one per match) are board-only pickups. Accepted activations/pickups grant +1; valid transfers retain +1. Same-alien immediate return is blocked for 2.5s. Chaos immediately teleports you to a random valid arena point, with no safety guarantee, target selection or queue lock; any held alien and its timer stay with you. Shadow adds a decoy, Symbiosis a straight 5m throw, and Vacune round-long Freeze/Echo protection plus Invisible/Shadow visibility. Full rules: [Round Powers and Loadouts](docs/ROUND_POWERS_AND_LOADOUTS.md).

## Current status

The owner revised the room and movement area to 30×15m, centered at (16,16), with gameplay bounds X 1–31 / Z 8.5–23.5. Each participant's drone now follows their own astronaut rather than the room center; the camera stays inside the approved parcels and does not rotate with body yaw. The updated environment GLB measures approximately 29.76×14.95m in local X/Z. Its composite transform, all seats and scales are preserved; no GLB is edited or stretched by code. Native desktop/mobile visual, edge and control testing is still pending.

The authoritative multiplayer loop, scoring, cards, bots, leaderboard, responsive UI, camera and current astronaut/seat/environment assets are integrated. The production alien, egg and takeover VFX GLBs still need to be exported to the paths defined in [`docs/GLB_NAMING_AND_ASSET_PATHS.md`](docs/GLB_NAMING_AND_ASSET_PATHS.md).

This is a **local running-mode preview**, not a certified mobile release. All eight GLBs supply `AST_RUNNING` and `AST_RUNNING_ALIEN`. Freeze slows movement/animation to 50% for 2s; Turbo boosts both to 2x for the round, cancelled to normal speed by an incoming Freeze. The controller has open-room bounds, not divided-map obstacle navigation; coins/powers are implemented, portals are not. The coin GLB spins/bobs/bounces, but presentation never decides collection. Shadow clones reuse existing GLBs; eight simultaneous clones approach the six-parcel triangle guidance and require native mobile profiling. New power icons temporarily reuse existing PNGs. The missing alien GLB uses an existing reaction marker. Dedicated match music is pending; lobby music is the fallback. Native desktop/mobile visuals, input latency, World persistence and deployed multi-human behavior require testing. Progression/daily rewards remain [a proposal](docs/PROGRESSION_PROPOSAL.md). Existing leaderboard data is preserved.

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

The approved scene remains **3×2 parcels (48×32m)**, with the revised 30×15m movement area centered on the existing room, using Decentraland's authoritative server and Scene Storage rather than a separately hosted backend. `scene.json` intentionally has no invented `worldConfiguration.name`. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Publishing this repository does not deploy the World or submit the application. Before applying, add a real test-World link, confirm applicant/contact and content-rights declarations, and review the readiness checklist.

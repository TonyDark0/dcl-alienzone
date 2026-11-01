# MVP Scope

This document defines the binding DCL Alienzone MVP. Scope changes require an entry in `DECISIONS.md`.

## Included

- Decentraland World linked to a DCL NAME.
- Six parcels in the owner-approved 3×2 layout (48×32m).
- Opaque 2D lobby with Play, How to Play and World Leaderboard.
- One to eight human players with bots filling empty seats.
- Eight moving astronaut proxies after the seated introduction and five-second deck setup; native avatars remain hidden. A local suit reveal zooms out into a fixed-heading, nominal 60° drone view that tracks the local astronaut, 10% closer than the former shared camera. The 30×15m area stays centered on the existing room at (16,16). WASD on desktop; native joystick on mobile, with immediate direction edges and quick visual turning. All three attack close-ups are shared; shake, red feedback and tapping remain local to the victim.
- One original alien and one optional non-attacking ECHO.
- Exactly three takeovers per match; no elimination.
- +1 per successful tag, +1 per untouched round and the containment bonus. No danger bands or takeover score penalty in running mode.
- Ten shared random coin pickups per round, thirty per match, at most ten simultaneous: first contact awards +1 and removes the coin; leftovers expire without value. No mid-round respawn or economy.
- Three pre-match ordered decks of three cards, one per round. General green: Freeze, Hidden Watch, Invisible, Skip. Epic red, each type once per match: Chaos, Shadow, Symbiosis, Vacune. Discard unused cards each round; no persistent reward economy is enabled.
- Rare purple board-only pickups: one 2x Turbo per round and one Echo per match in a random round. Chaos immediately teleports the caster to a random valid point, without safety guarantees or changing any carried alien/timer. Five-second Shadow decoys and straight-five-metre Symbiosis. Vacune resists Freeze/Echo and reveals invisible astronauts/decoys for one round.
- Generated transparent logo and power icons, with a sub-second latest-only activation notification at the top-right, aligned with the first scoreboard row.
- One ready slot per player; F / touch activates the current round queue head for +1. Live reordering does not pause play; Chaos consumes immediately without a queue lock. A 2.5s per-alien protection prevents immediate return to its giver.
- Epic scoring: +1 activation and one conditional success point. Shadow traps and the first foreign Freeze/Echo activation during Vacune give one bonus. Symbiosis and a same-alien Chaos throw within 3s reuse the existing transfer point, never a third. Ordinary late throws retain their point. Pending conditions clear at takeover.
- Authoritative server state, validation, bots and Scene Storage leaderboard.
- Mobile-first HUD, reactions, camera takeover, music and SFX.
- Attacked-seat takeover containment: five timed targets and a single +1 bonus for at least three hits.
- Shared atlas and three authored material roles.
- MIT-licensed public repository preparation.

## Explicitly excluded

- VAT or custom shaders.
- External paid or free-tier backend services.
- Real-time free text chat or custom voice.
- Matchmaking across multiple external regions.
- User wearables or avatar appearance inside the arena.
- Economy, token, wallet signature or required NFT.
- Live card crafting, progression rewards, currencies and shop. A data contract and milestone proposal are included, not a live economy.
- Elimination, spectator systems or more than three takeovers.
- Facial animation, lip sync, physics simulation or procedural tentacles.
- Additional parcels without an approved layout revision.
- Dynamic downloads from third-party hosts.

## Change rule

A feature enters the MVP only when it fixes the core loop, is required for platform/accessibility compliance, or replaces work of comparable size. Everything else goes to the backlog.

## Definition of done

- Full match playable by one human and bots.
- Same authoritative rules for humans and bots.
- English UI, source messages and documentation.
- DCL Alienzone branding across metadata, code, assets and docs.
- Global leaderboard visible from the lobby.
- Current GLB and audio paths resolve.
- Mobile and desktop UI pass layout review.
- Format, typecheck, tests and build pass.

# MVP Scope

This document defines the binding DCL Alienzone MVP. Scope changes require an entry in `DECISIONS.md`.

## Included

- Decentraland World linked to a DCL NAME.
- Four parcels in a 2×2 layout.
- Opaque 2D lobby with Play, How to Play and World Leaderboard.
- One to eight human players with bots filling empty seats.
- Eight fixed astronaut proxies; native avatars and locomotion hidden in the arena.
- One original alien and one optional non-attacking ECHO.
- Exactly three takeovers per match; no elimination.
- POINTS scoring based on server fuse danger after a minimum hold.
- Finite dealt hands with Reverse, Skip, Chaos, Hidden Watch, Freeze and Echo.
- One shared random Echo bonus per round, targeted Chaos, manual passing without auto-pass.
- Generated transparent logo and power icons, with a sub-second centre activation announcement.
- One armed reaction and one armed intervention per player.
- Authoritative server state, validation, bots and Scene Storage leaderboard.
- Mobile-first HUD, reactions, camera takeover, music and SFX.
- Shared atlas and three authored material roles.
- MIT-licensed public repository preparation.

## Explicitly excluded

- VAT or custom shaders.
- External paid or free-tier backend services.
- Real-time free text chat or custom voice.
- Matchmaking across multiple external regions.
- User wearables or avatar appearance inside the arena.
- Economy, token, wallet signature or required NFT.
- Card crafting, progression, currencies or additional card types.
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

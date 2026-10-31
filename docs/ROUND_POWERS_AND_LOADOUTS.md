# Round Loadouts and Powers — v6

Owner-approved running-mode revision, 2026-10-29. This supersedes older deck/card semantics; the archived seated engine is unchanged. No publishing or native client launch is authorized.

## Preparation and categories

Play New Match opens a touch-compatible deck builder **before joining the match**. Prepare three ordered decks of exactly three cards each, one deck per round. Select a round, select a slot, choose a card and use arrows to order it. Find Match submits the complete plan. The server validates it before starting; future-round decks cannot change after entry. Rematch reuses the submitted plan; Main Menu permits editing before a new match.

| Category | Color  | Availability                                               | Cards                                 |
| -------- | ------ | ---------------------------------------------------------- | ------------------------------------- |
| General  | Green  | Repeatable across round decks                              | Freeze, Hidden Watch, Invisible, Skip |
| Epic     | Red    | Each type can occupy only one slot across the entire match | Chaos, Shadow, Symbiosis, Vacune      |
| Rare     | Purple | Shared board pickups only, never selectable in a deck      | Turbo, Echo                           |

Skip's General classification and Symbiosis/Vacune's Epic classification are implementation assumptions announced to the owner. General duplicates are permitted within the three-slot limit; Epic duplicates are rejected across all nine slots. The local preview makes the approved eight deck powers selectable; persistent unlocks, card ownership, reward chests and currency remain disabled proposals, not grants.

Each round activates only its own planned deck. Discard **all** remaining cards at takeover, including unused and active cards. Replace with the next prepared deck when the next round starts. F / touch activates the first available card; ordinary live reordering changes only the current round and does not pause anything. The existing five-second first-round review remains after seating. A shared 1.2s activation cooldown remains.

## Points and transfer safeguards

- Every accepted card activation awards +1 once, including automatic activation on a Rare pickup. Loading, reordering, rejected actions, repeated requests and merely armed/spent cards award nothing.
- A successful transfer still awards +1 to its outgoing holder, for either alien. A successful Symbiosis or Chaos redirect can therefore earn one transfer point in addition to the separate activation point.
- Shadow awards +1 when activated and another +1 only if an attacker actually attempts a valid throw into that decoy. It does not award points for ordinary expiry.
- Coins, untouched-round and containment bonuses retain their existing rules.
- Each alien separately protects its immediate giver from receiving that same alien back for 2.5s after transfer. This is not global immunity: another recipient or the other alien can still reach that astronaut if otherwise eligible. The UI, bots, Chaos and Symbiosis all use the same server eligibility checks.
- Preserve one-second arrival grace, explicit E/touch ordinary throws, 1.5m proximity with the existing bounded edge allowance, Skip protection, one alien per astronaut and server-owned deadlines/points. A new nonce is required after each transfer.

## Rare board pickups

Positions and appearance times use an isolated seeded stream. They appear 2–9s into the round, inside the movement area and away from initial astronauts/central furniture. There is exactly one Turbo appearance per round and exactly one Echo appearance per match in one seeded random round. Uncollected pickups expire at takeover; no respawn or carry-over. They do not replace or increase the ten score coins per round.

The server selects the first swept body contact after appearance; ties use seat ID. Astronauts, including bots, can collect. Decoys cannot. A pickup cannot be activated remotely from a menu or injected into a hand.

### Turbo

Activate automatically on contact: movement and selected running animation become 2x until round end. An incoming Freeze permanently removes this boost and leaves the collector at normal 1x speed; **that cancelling Freeze does not slow them**. This is not ongoing Freeze immunity: a later Freeze can slow normally. If Vacune is already active, Freeze has no effect and does not cancel Turbo. Collecting Turbo clears an existing slow. No five-second Turbo deck card remains.

### Echo

Activate on contact, spawning a second non-attacking alien on a random eligible astronaut other than the collector and the original holder. Skip-protected and vaccinated astronauts cannot receive it. If there is no eligible destination, the pickup stays unconsumed and awards nothing until activation is possible or the round ends.

Echo can be passed for the same +1, respects anti-return/proximity/arrival/occupancy rules, and shares the original alien's deadline exactly. It never starts its own clock or attack. At takeover it disappears; the next round starts with one original alien. There is no second Echo pickup elsewhere in that match, even if this one expired uncollected.

## General powers

- **Freeze:** slow other non-vaccinated astronauts and their running animation to 50% for 2s; the caster is unaffected by their own card. The alien clock continues. Against Turbo, use the cancellation rule above.
- **Hidden Watch:** conceal the selected alien holder's exact timer for 6s; danger bands remain visible.
- **Invisible:** conceal the caster for 10s, except from a Vacune user. The owner sees a ghost. It is not immunity; blind contact can still throw to them. Ordinary viewers do not receive hidden coordinates or movement forecasts.
- **Skip:** immune to incoming aliens for 3s; does not remove a held alien. Activation now awards +1 like every other power.

## Epic powers

### Chaos

Activate first; it does not auto-arm on receipt. There is no target selection. Once armed it cannot be cancelled, replaced or bypassed by ordering/activating another card. It locks the ready slot until the **next incoming alien** is automatically sent to a random eligible astronaut once. Arming while already holding an alien does not redirect that existing possession.

Honor Skip, Vacune for Echo, double-occupancy and same-alien return protection. If all destinations are temporarily unavailable, retain the armed card/alien until one becomes eligible or takeover expires the card. Finite chained redirects are capped by the number of seats; each card is consumed once. After resolution, unlock the next queued card. One Chaos slot per match.

### Shadow

Spawn one roaming clone using the owner's current astronaut skin, running loop, name color and nameplate. It is a decoy, not a ninth participant: no hand, pickups, points, alien ownership, collision immunity, leaderboard or takeover target. It moves at normal base speed inside bounds and lasts 5s. Its final second blinks repeatedly, then fades during the final 0.3s.

A valid ordinary or Symbiosis throw aimed into the decoy removes it immediately and grants the owner exactly one extra point. The attacker keeps the alien, earns no transfer point and observes the ordinary arrival/retry delay. The nearest body wins ordinary targeting; a real body wins an exact distance tie. Its owner cannot farm their own decoy. A Vacune viewer identifies decoys and their targeting ignores them. Non-vaccinated bots can chase and throw at a nearby decoy, using the same validation as humans.

At most eight simultaneous clones are possible (one Epic slot per owner per match). The renderer reuses existing GLBs, not new exported variants. Network state still exposes separate decoy records to the client implementation; this is a gameplay deception, **not** an anti-ESP/privacy guarantee.

### Symbiosis

Requires an arrived alien. Fire along the authoritative facing, straight ahead for at most 5m, with a 0.4m body radius. Resolve the first body intersecting the segment immediately; the short flight marker is presentation only. Never bend or automatically aim at another player.

A valid real target receives the alien and grants the ordinary transfer point. An immune, occupied or return-protected first body stops the shot without transfer; it cannot tunnel through to a later player. A miss consumes the card but leaves the alien with the caster. Every accepted shot still earns its activation point. No held/arrived alien means rejection without consumption or points. A decoy follows Shadow's trap rule.

### Vacune

Round-long protection from Freeze and **incoming Echo only**, plus visibility of invisible astronauts and identification of Shadow decoys. It does not protect against the original alien, remove an alien already held, reveal private hands, or prevent a takeover. Clears a current slow on activation. The server sends hidden coordinates/forecasts only to the vaccinated recipient (and the invisible owner), never globally. Ends at takeover and cannot carry over to another deck.

## Presentation and acceptance

- Existing icon PNGs are reused as temporary artwork for Shadow, Symbiosis, Vacune and Turbo; no new assets or final icon art were generated in this revision.
- The latest-only 0.9s top-right announcement and per-astronaut +1 notices remain. New tier frames apply to cards and the tutorial. Score displays stay numeric.
- Retain tracked camera, all three shared takeover close-ups and local-only shake/red/tapping.
- Automated tests must cover deck validation/expiry, seeded appearance, once-only contact/points, protection on both aliens, Chaos lock/cycles, decoy expiry/traps, ray misses/first body, Vacune visibility and worst-case snapshot size.
- Native desktop/mobile verification is still required for touch layout, clone identification, alpha sorting, collision feel, simultaneous clone creation and frame pacing. Eight 3,416-triangle clones add up to 27,328 triangles; the inspected core GLB peak is ~57,386 triangles before labels/markers/primitive geometry, close to the six-parcel 60,000 guidance. Final alien/VFX geometry needs a fresh budget review. No parcel expansion or GLB modification is assumed.

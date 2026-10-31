# DCL Alienzone

Decentraland Creator Success — working V0 application GDD. Updated **2026-10-31** to the implemented **v6.1 running-tag** rules. This replaces the former seated-pass design; sitting remains only in the introduction. Detailed rules: [Game Rules](../docs/GAME_RULES.md) and [Round Powers and Loadouts](../docs/ROUND_POWERS_AND_LOADOUTS.md).

| Field                   | Current status                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public experience title | DCL Alienzone. Owner IP/content-rights declaration and title clearance: pending confirmation.                                                                                   |
| Creator / repository    | TonyDark0 — [dcl-alienzone](https://github.com/TonyDark0/dcl-alienzone). Formal studio name and Discord/email: pending.                                                         |
| Target                  | Decentraland World linked to the owner's DCL NAME. Exact NAME, verified visit URL and public deployment evidence: pending. A hypothetical deployment is not a verified release. |
| Platforms               | Native desktop and mobile Explorer; mobile-first controls are implemented, hardware acceptance is pending.                                                                      |
| Application stage       | V0 proposed, not awarded or agreed. See [readiness](STUDIO_READINESS.md) for prerequisites that remain open.                                                                    |

## 0. TL;DR

| Field             | Answer                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Player promise    | Run through a spaceship, evade a baby alien, chase another astronaut to throw it away, and use a prepared card sequence to outscore the crew over three short rounds.                      |
| Primary player    | Casual competitive party-game players arriving alone or with friends; one to eight humans, filled to eight participants with bots.                                                         |
| Current build     | Local playable running-tag prototype: authoritative proxy movement, explicit proximity throws, three round decks, score coins, board powers, containment, results and saved human records. |
| Requested support | A focused V0 validation cycle, not funding for an already-certified mobile release or an agreed V1 scope.                                                                                  |
| Question to test  | Do new players understand the chase/throw interaction and voluntarily repeat it because other humans and card timing change their decisions?                                               |
| Key uncertainty   | Immediate replay is plausible; next-day return and deeper progression remain unproven. Rewards, unlocks, skins and daily chests are proposals, not live features.                          |

## 1. Player Promise

**One-line promise:** Outrun the crew, pass a dangerous baby alien before its countdown expires, and use cards and shared pickups to finish three rounds with the most points.

**Familiar comparison:** Running hot potato with tactical cards. Unlike a seated passing circle, every non-holder can evade, collect coins, prepare a power or position for a chase.

**Why this game:** A recognizable low-poly astronaut cast and spaceship make the carried threat and social rivalry legible. No player is eliminated: being attacked produces a short containment challenge, then everyone continues until the third attack ends the match.

**Pillars**

1. Shared danger with readable ownership, explicit throws and a common deadline.
2. Decisions while not holding the alien: evasion, positioning, coins and card timing.
3. Short mobile-compatible matches, coherent presentation and immediate rematches.
4. Equal authoritative movement and scoring rules for humans and bots.

## 2. First Minutes & How to Play

| Phase                     | Player experience                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arrival                   | The opaque home menu offers Play New Match, How to Play and World Leaderboard. Browsing does not occupy a match seat.                                                                                                                     |
| Preparation, player-paced | Play opens three visible round blocks, each with three numbered card slots. Tap a slot, choose its replacement in the General/Epic catalog, and set order with Earlier/Later. Card 1 is first. Full-item pages replace native scrollbars. |
| Entry                     | READY · FIND MATCH submits all nine cards for server validation. Empty seats become bots. An opaque three-second countdown prepares the actors and camera.                                                                                |
| Visible introduction      | Your assigned suit appears in close-up, then the camera eases out during the standing/sitting sequence. The first-round deck gets a five-second order review. No alien fuse runs during preparation or the intro.                         |
| Live round                | A random starter receives the original alien. Run/evade, use cards and collect coins. If carrying an arrived alien, approach an eligible astronaut and explicitly throw it. The shared 28-second fuse never resets on a transfer.         |
| Takeover                  | When the original fuse expires, everyone sees a five-second close-up of its holder being attacked. Only that player gets shake, red pulses and five timed TAP targets. At least three hits earns one bonus point.                         |
| Round continuation        | The first two attacks are contained regardless of TAP performance. Everyone remains in play. Leftover coins, pickups, effects and cards expire; the next planned deck and ten new coins enter the next round. Positions carry forward.    |
| Results                   | The third attack ends the match, still allowing its containment bonus. Rank by points, then fewer attacks, then more successful transfers; perfect ties share the win. Save human records and offer Rematch/Main Menu.                    |

**Player-facing instructions**

- Move with WASD or the mobile joystick. Run away from carriers; chase someone if you hold an alien.
- Get within 1.5m and press E / tap THROW ALIEN. Touching alone never transfers it.
- Press F / tap the ready card to use it. Reorder the current deck without pausing.
- Touch coins and purple board powers to collect them. Finish three rounds with the most points.

Q is not an exposed input in the installed SDK; F is the owner-approved card key. The throw button only enables for an arrived alien and a server-confirmed eligible nearby target. A one-second arrival grace prevents instant rethrows. That alien's immediate giver is protected against its return for 2.5s; this is not global immunity. One astronaut cannot carry both aliens.

The tracked drone keeps a fixed world heading at a nominal 60° angle, centered on the local astronaut. It does not rotate with the suit. All three takeover close-ups are shared, returning to each player's tracked view when play resumes.

**Comprehension evidence:** The owner has tested local desktop previews. Cold-player understanding of preparation, movement, throws and scoring has not been measured. The deck builder plus intro creates an onboarding risk; do not claim an observed time-to-first-action.

## 3. Core Loop

| Step                  | Input → feedback → change                                                                                                          | Why repeat?                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Read and position     | See holders, danger, nearby pickups and opponents → choose pursuit, evasion or collection → move through the 30×15m area.          | Humans, visible threats and seeded pickups change routes.               |
| Prepare and intervene | Reorder the remaining queue or activate its head → icon/name/caster announcement and effect feedback → change the immediate chase. | Counterplay and the cost of using a finite card make timing matter.     |
| Chase and throw       | Reach an eligible target and press E / tap THROW → alien transfer and +1 → ownership changes, shared fuse does not.                | Escape danger or create a new pursuit without automatic contact passes. |
| Collect               | Touch a shared coin or board power → pickup disappears for everyone → +1 and, for powers, its effect.                              | First contact wins; chasing a pickup can expose you to the alien.       |
| Contain and regroup   | Watch the attack; the victim taps timed targets → optional +1 → next round, or final ranking and rematch.                          | Keep all players involved and make outcomes visible.                    |

**Scoring in this build**

| Event                                                  | Points                                            |
| ------------------------------------------------------ | ------------------------------------------------- |
| Successful original or Echo transfer                   | +1 to its outgoing holder                         |
| First server-confirmed coin contact                    | +1 to the collector                               |
| Accepted card or board-power activation                | +1 once                                           |
| Entire round without receiving either alien            | +1 at takeover; starting holders count as touched |
| Victim hits at least three of five containment targets | +1 once, including the final attack               |
| A valid attempted throw into your Shadow decoy         | +1 extra to the decoy owner                       |

There are no danger-band points, two-second scoring hold, automatic pass or takeover score deduction. Merely holding, preparing/reordering cards and rejected/repeated actions award nothing. Symbiosis can earn its activation point plus a successful transfer point; Chaos teleportation is not a transfer. Score UI displays numbers only.

Exactly ten shared coins spawn at each round start, thirty per match and never more than ten at once. Collected coins do not respawn. Leftovers disappear at takeover without value. Coins are match points, not spendable or persistent currency.

Each live round lasts 28 seconds plus a five-second attack. Three rounds plus entry/intro/setup take approximately two minutes before player-paced deck preparation, loading, network waits and result browsing. Typical sessions target 2–4 minutes; observed device/user timings are pending.

### Prepared decks and powers

Before matchmaking, prepare **three ordered decks of three cards**, one per round. General cards may repeat, including within a round; each Epic type may occupy only one of the nine slots. Future decks are fixed after entry. Unused current-round cards are discarded, not saved. Rematch reuses the submitted plan; Main Menu permits editing.

The preview defaults to Freeze/Skip/Invisible for each round but allows all eight approved deck powers. This is a testing catalog, not a persistent ownership or unlock grant. Only the queue head activates, with a shared 1.2s cooldown. Live reordering never pauses play.

| Category                  | Card         | Implemented effect                                                                                                                                                                                                   |
| ------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| General · green           | Freeze       | Slow other non-vaccinated astronauts and their running animation to 50% for 2s. The alien clock continues. Against Turbo, cancel to normal speed without slowing that hit.                                           |
| General · green           | Skip         | Immunity to incoming aliens for 3s; does not remove one already carried.                                                                                                                                             |
| General · green           | Invisible    | Hide yourself for 10s except from Vacune users. The owner sees a ghost. Not immunity: a blind nearby throw can still hit.                                                                                            |
| General · green           | Hidden Watch | Hide the selected alien holder's exact timer for 6s; danger feedback remains.                                                                                                                                        |
| Epic · red                | Chaos        | Immediately teleport yourself to a random valid point. It may be safer or more dangerous. Keep any carried alien, timer and effects. Consume immediately and advance the queue; no target picker or lock.            |
| Epic · red                | Shadow       | Spawn a roaming suit/name decoy for 5s. A valid attempted throw at it destroys it and grants the owner the trap bonus; attacker keeps the alien. Otherwise it blinks and fades on expiry.                            |
| Epic · red                | Symbiosis    | With an arrived alien, fire straight along your facing up to 5m. The first body stops the shot. A valid recipient receives the alien; a miss or blocked first body consumes the card but leaves ownership unchanged. |
| Epic · red                | Vacune       | For the rest of the round, resist Freeze and incoming Echo, see invisible astronauts and identify decoys. Does not protect against the original or remove a held alien.                                              |
| Rare · purple, board only | Turbo        | One random appearance per round. Contact gives 2x movement/animation until takeover or a cancelling Freeze. A later Freeze can slow normally.                                                                        |
| Rare · purple, board only | Echo         | One random appearance in one random round per match. Contact spawns a transferable second alien on another eligible astronaut, not the collector or original holder. Same fuse and transfer points; never attacks.   |

Rare powers never enter decks and do not replace coins. They auto-activate on authoritative contact and expire uncollected at takeover, without respawning. If Echo has no eligible recipient, it stays unconsumed until activation becomes possible or the round ends. Echo vanishes at takeover; each next round begins with only the original. See the [v6.1 contract](../docs/ROUND_POWERS_AND_LOADOUTS.md) for protection, visibility and collision edge cases.

## 4. Why Players Come Back

### 4.1 The next-day (D1) sentence

A player who enjoyed a match may return to challenge a recognizable friend, beat their saved score and try a different deck order against that person's tactics. This is a **rivalry/mastery hypothesis**, not demonstrated next-day retention. An immediate rematch is not evidence of returning tomorrow.

### 4.2 The progression chain

Repeatable chase/throw/card decisions → improved play and a saved score/win record → visible competitive status → another tactical challenge. This supports mastery but currently grants no deeper persistent capability.

| Moment               | Current continuity                                       | Missing evidence / proposed future work                                       |
| -------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| End of first session | Human best score and wins; ranking and rematch.          | Deployed persistence and voluntary rematch observations.                      |
| End of first week    | Familiar names, improved routes/card timing and records. | Actual return visits and the reason for them; no live reward track.           |
| Week 3+              | No validated long-term progression loop.                 | Test whether rivalry is sufficient before agreeing any new retention feature. |

Card unlocks, astronaut skins, lifetime milestones, seven-day rewards and chests are documented in the [Progression Proposal](../docs/PROGRESSION_PROPOSAL.md). They are not active inventory, currency, claims or promised release dates. No daily economy is implied by coin collection.

### 4.3 Two return hooks

| Hypothesis                                        | Trigger                                                                     | What is anticipated                                             | Current limitation                                                                                           |
| ------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Named leaderboard rivalry                         | Compare saved human records after a match or later visit.                   | Beat a recognizable rival.                                      | No daily reset or rival alert; D1 effectiveness is unmeasured.                                               |
| Rematch with a revised plan and human counterplay | Rematch preserves the plan; returning to Main Menu lets the player edit it. | Try a different answer to an opponent's pursuit or card timing. | Replay variation is not a guaranteed next-day trigger; bots support practice, not proof of social retention. |

No unlock/reward system is added just to fill an application section. Agree the smallest testable next step with the owner and program if these hypotheses fail.

## 5. Social by Design

| Lens                      | Design and evidence                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repeatable social loop    | A chases B → B evades, protects themselves or deploys a decoy → a throw succeeds or fails → another chase and a shared result invite a rematch.                                                        |
| Disappearance test        | Bots preserve the mechanics, but human bluffing, remembered opponents, deliberately chosen pursuit and shared reactions disappear. Human benefit needs observation.                                    |
| From strangers to a group | Up to eight seats share a match, visible names/suit colors, holders, effects and ranking. Voice/chat are optional native DCL tools, not required custom systems.                                       |
| Quiet hours               | One human plays with seven bots. Humans and bots have the same 3.2m/s base speed, effect multipliers, proximity checks and scoring. Bots use open-room steering, not obstacle navigation.              |
| Intended group            | Two humans allow direct counterplay; four to eight are the desired group. Local solo-plus-bots has been owner-tested; controlled multi-human/mobile results remain pending.                            |
| Continuity                | Save human records. Persistent crews, relationship tracking and rival notifications are not implemented.                                                                                               |
| Drop-in / drop-out        | Seats join before play; no new human takes over a seat mid-round. Disconnected seats become bots and their returning owners can recover them. Deployed reconnect/full-table behavior needs validation. |
| Bystander                 | Participants share attacks and results; the opaque home menu is not an external spectator experience.                                                                                                  |
| Memorable moment          | A pursuer commits to a Shadow clone while its owner escapes, or Chaos escapes one chase but lands beside another carrier. These are designed possibilities, not recorded player testimonials.          |
| Bring a friend            | Challenge a known player and adjust the next deck to their tactics; verify that players actually choose to do so.                                                                                      |

## 6. Mobile-First

| Verb               | Touch                                                                                 | Desktop                                         |
| ------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Move / aim         | Native joystick; normalized direction and quick turning.                              | Screen-relative WASD; no cursor-aim dependency. |
| Throw              | Explicit THROW ALIEN button when an eligible target is near.                          | E; contact alone does nothing.                  |
| Prepare            | Tap one of nine pre-match slots, replace and reorder it; whole-item catalog pages.    | Same pointer interactions.                      |
| Activate / reorder | Tap the single ready card or ORDER DECK; movement/game clock continue.                | F activates; pointer changes order.             |
| Contain            | Tap the victim-only timed targets; visible sent/hit/miss feedback, no hover required. | Pointer click with optional hover feedback.     |
| Regroup            | Tap Rematch/Main Menu or optional emoji reactions.                                    | Same pointer interactions.                      |

**UI:** Bottom-center throw action, reactions to the left and one ready card plus queue control to the right. Top HUD exposes round, danger and numeric score; a latest-only 0.9s top-right notification identifies activated powers/casters. Three deck blocks, explicit selection context and whole-item pages replace thick native scene scrollbars. Device insets apply once; native DCL account/chat/settings remain native.

**Performance targets, not certification:** 30 fps on a named mobile device/client and 60 fps on recommended desktop hardware. Record device/OS/client, load time, frame pacing, input latency and memory through a match and repeated rematches. Profile the eight-player/Shadow peak, transparency and UI around native controls. Actual device measurements are pending.

**Technical limits:** Six approved parcels (3×2, 48×32m); movement is a centered 30×15m open room, X 1–31 / Z 8.5–23.5. The controller does not infer obstacles from GLB colliders. No new map divisions, portals, custom shader, VAT or external backend is claimed. Authoritative-server/camera/audio/blending support needs native mobile testing; compilation is not platform acceptance.

## 7. World, Look & Story

**Story:** A baby alien has hatched aboard the spaceship. The crew tries to avoid its attacks while competing for the highest score across three rounds. The first two takeovers are contained; the third ends the match. Holding longer does not increase points.

**Look:** Eight colored low-poly astronaut proxies share a spaceship and a standing/sitting introduction before running play. Authored in-place running/carrying loops are integrated. A suit-reveal zoom identifies the local astronaut; the tracked drone supports pursuit and lateral attack close-ups make consequences visible. Sci-fi notched frames, gradients, transparent reaction/power art and numeric feedback form the UI language.

**Known presentation gaps:** The agreed production alien/egg/takeover-VFX exports are incomplete; the missing alien uses existing reaction art as a carrier marker. Several powers temporarily reuse icons, and match music has a lobby-loop fallback. Freeze uses an atlas-preserving chilled material; Invisible uses an owner-only ghost. Final assets, blending, alpha sorting and touch readability still require native review. Concept art and tests are not evidence of final render quality.

## 8. Audience & Comparables

**Audience:** Casual competitive party-game players who enjoy short movement-based pursuit with tactical powers, alone for practice or together for social counterplay. Not a deep RPG, parkour campaign, token economy or paid-power game.

**First group:** Invite a small group to the test World for a scheduled observation session. No Discover placement, organic acquisition, event attendance or return rate is promised.

| Comparable                           | Creator observation                                                                                                                       | Lesson for Alienzone                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Shroom Zom — 8/10                    | Strong atmosphere and musical-platform puzzle; triggering/reset feedback and a next-day motive were unclear.                              | Make throws, pickups and state changes legible; clever interactions alone do not establish retention.  |
| Old McTiger's Farm — 2/10            | Onboarding and spending/progression were unclear; inventory/shop appeared unavailable during the visit, and art styles felt inconsistent. | Avoid dead-end menus, explain what points achieve and maintain coherent assets.                        |
| Antrom RPG / Dice Masters — 7/10     | Skippable voiced lore, players, daily systems and crafting; dense menus and UI overlaps increased effort.                                 | Keep the optional tutorial readable and distinguish visible return motivation from measured retention. |
| Traditional hot potato / running tag | A visible threat and deadline explain pursuit; instant elimination and idle waiting can sideline friends.                                 | Keep all players through three attacks; use movement, cards and collection during non-holder time.     |

These are the owner's qualitative observations, not competitor analytics or independent asset judgments. Featured eligibility, exact play durations, 90-minute total and second-day visits are not fully confirmed. See [research notes](PLAYTEST_NOTES.md); do not fabricate missing records.

## 9. 4 Week Plan (v1 scope)

The template heading is retained, but the requested round is **V0**. This is a proposed sequence of questions from the existing prototype, not an agreed four-week V0 contract or V1 award. Scope, dates and deliverables must be agreed with Creator Success. Publish and verify the application test World before submitting; this plan does not substitute for that prerequisite.

| Stage             | Question                                                                                               | Smallest test and decision evidence                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 — Comprehension | Can new players prepare three round decks, move, throw and explain scoring without live coaching?      | Observe a small cold-player group, recording prompts needed, first valid throw, rejection confusion and a score explanation. Fix communication issues before adding mechanics. |
| 2 — Social loop   | Do human pursuit, deception and powers cause meaningful choices and voluntary rematches?               | Observe a multi-human session against solo/bot baseline, plus Echo, Chaos, anti-return and disconnect cases. Record actual decisions and rematches, not only opinions.         |
| 3 — Return        | Does a saved rival/record or a revised deck motivate an actual later visit?                            | Invite a follow-up without promising rewards; record who returns, what they seek and whether it occurs without prompting. D1 evidence is distinct from same-session replay.    |
| 4 — Delivery      | Does the same core interaction remain readable and responsive in the deployed World on desktop/mobile? | Test loading, full matches, repeated navigation/rematches, server restart/persistence and peak effects. Record device data, failures and known limitations.                    |

**Scoring question:** Does rewarding coins and accepted activations support the chase, or let players ignore the alien and farm easier points? Observe behavior before proposing another score change. The GDD updates no rule.

**Continuation signals:** Unprompted repeated loops, intentional counterplay, understanding of ownership/range, and a specific goal on return. No numeric program-pass threshold or retention result is claimed. Proposed observation records live in [Metrics](../docs/METRICS.md).

**Not building without a new scope decision:** Live rewards/unlocks, shop/currency, wearable-gated powers, portals, divided-map navigation, more cards, external matchmaking or paid advantages. Final presentation work remains subject to asset review and device budgets.

**Top risk and fallback:** The game may produce enjoyable immediate rematches without a credible next-day goal. If observed, agree one small social/progression experiment with the owner and program rather than hiding the gap behind more content. Native mobile performance and deployed human/persistence behavior remain technical release gates.

**Submission status:** Mechanic documentation is current, not a claim of application completion. Confirm contact/age/content rights, genuine research visits, reviewer access, the deployed World link and real playtest evidence before submission. No deployment or application is performed by updating this repository.

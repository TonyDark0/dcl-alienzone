# DCL Alienzone

Decentraland Creator Success Program — working V0 application GDD.

| Field                     | Answer                                                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public experience title   | DCL Alienzone. Owner IP / Content Policy declaration: TBD. Name screening: not searched. Unresolved: title clearance and final asset-rights confirmation. |
| Deployment target         | Decentraland World; exact DCL NAME and public visit URL: TBD. Approved scene layout: 2×2.                                                                 |
| Studio / team name        | DCL Alienzone project; GitHub owner: TonyDark0. Formal studio name: TBD.                                                                                  |
| Date                      | 2026-10-25                                                                                                                                                |
| Contact (Discord + email) | TBD. Public project contact: GitHub issues after repository publication.                                                                                  |

## 0. TL;DR

| Field                    | Answer                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Player promise           | You are an astronaut. Pass a baby alien to outscore the crew while live cards disrupt its route and its shared timer threatens possession.                                 |
| Primary player           | For casual party-game players arriving alone or with friends in Decentraland, looking for short competitive sessions without movement or reflex-heavy controls.            |
| Current status           | Playable local core loop with authoritative rules, bots, cards, astronaut animation and leaderboard integration. Public test World: TBD; no deployed vertical-slice claim. |
| Requested round          | V0; first application proposed, not accepted or agreed.                                                                                                                    |
| Live at end of the round | Players can enter the World, complete a three-round match alone with bots or with friends, understand the result, and rematch with saved human records.                    |

## 1. Player Promise

**One-line promise**

You are an astronaut. Pass a baby alien to outscore the crew while live cards disrupt its route and its shared timer threatens possession.

**One familiar comparison**

Social hot potato with an off-turn card game: waiting players can still change what happens.

**Why this game**

The creator wants a complete, visually coherent mobile game inside Decentraland, not a technical demonstration. Fixed astronauts, a readable spaceship and a cute-to-angry alien make passing and punishment visible without relying on wearable combinations or facial animation.

## 2. First Minutes & How to Play

| Time                      | Player experience                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–5 seconds after control | You see Alienzone and Play New Match. You can join immediately without reading the optional instructions.                                                                                   |
| 5–10 seconds              | You see a three-second entry countdown, then the crew standing and sitting. The camera is prepared behind the countdown. Gameplay begins after seating, not necessarily within ten seconds. |
| 10–60 seconds             | You see the current holder and direction. You hold an alien, then tap PASS for points; cards let you affect play before your next turn.                                                     |
| 1–3 minutes               | You experience three shared-timer rounds, visible attacks and a final ranking. More points win; nobody is eliminated.                                                                       |
| 3–10 minutes              | You choose a rematch, adapt to a new hand and opponents, or compare saved human records in World Leaderboard.                                                                               |
| Natural stopping point    | You finish the ranking, save your record and choose Main Menu or Rematch. A concrete next-day goal beyond rivalry is still TBD.                                                             |

**Player-facing How to Play**

- Hold, then pass before the alien attacks.
- Risk later passes to earn more points.
- Use cards to disrupt other players.

The program's 5/10 comprehension rule is **not tested**. Joining is immediately available, but the seating sequence delays the first pass; test whether this harms comprehension before changing its approved presentation.

## 3. Core Loop

| #   | Step (verb) | Player input → feedback → state change                                                       | Why do it again?                                        |
| --- | ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Read        | Watch holders, direction and danger → visual cues → choose a risk and route.                 | Other people and cards change the next arrival.         |
| 2   | Prepare     | Browse, load and activate a card → icon and caster announcement → defend or alter live play. | Timing matters even while another seat holds the alien. |
| 3   | Risk        | Hold an alien for at least two seconds → danger grows → a later valid pass can score more.   | Balance higher points against being attacked.           |
| 4   | Pass        | Tap PASS → alien travels and points appear → next eligible seat receives it.                 | Routing and active defenses change the next decision.   |
| 5   | Regroup     | Watch the attack and ranking → see the outcome → begin another round or request a rematch.   | Learn opponents' tactics and challenge their result.    |

| Field                                       | Answer                                                                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One complete loop takes                     | A round starts with 28 seconds and can extend to at most 38, followed by a five-second attack sequence. Three rounds complete a match; scoring passes provide earlier payoffs. |
| Decision, challenge, or expression          | Time a risky pass, prepare a defense, choose a Chaos destination, or intervene during another player's hold.                                                                   |
| Shortest satisfying visit / typical session | One match, approximately two minutes / two to four minutes targeted; real device and user timings: TBD.                                                                        |
| Why repetition 10 remains appealing         | Finite shuffled hands, one globally unique Echo recipient per round, changing routes and human decisions vary familiar content. Long-term appeal is not yet measured.          |

**Pillars**

1. Shared danger, readable punishment, no elimination.
2. Meaningful choices while someone else holds the alien.
3. Short mobile sessions, coherent art, one-button passing.

Exact scoring bands, tie-breakers and the six-card contract are maintained in [Game Rules](../docs/GAME_RULES.md) and the [illustrated card reference](../docs/CARDS_REFERENCE.md).

## 4. Why Players Come Back

### 4.1 The next-day (D1) sentence

A player who enjoyed their first session may return the next day to beat a recognizable friend's saved record and challenge that friend again, anticipating this from the named leaderboard and shared match. This is a **rivalry hypothesis**, not a scheduled reward or demonstrated D1 mechanism; cold-player validation and a stronger concrete return trigger are TBD.

### 4.2 The progression chain

Repeatable action → saved best score / wins → visible competitive status → a new tactical target. This supports mastery and rivalry, but does not yet provide deeper persistent progression.

| Moment                                    | What persists or has been built?                                | What becomes possible next?                                | How can another player tell?                                    |
| ----------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| End of first session                      | Human best match score and wins.                                | Chase a record or rematch a recognized opponent.           | Named World Leaderboard.                                        |
| End of first week                         | Improved records, remembered opponents and card knowledge.      | Better timing and counterplay; no new unlocked ability.    | Records are visible; tactical learning is demonstrated in play. |
| Week 3+ — what takes more than two weeks? | TBD: a lasting social/progression goal beyond the same records. | TBD; no economy, unlock track or daily system is approved. | TBD.                                                            |

You return and compare your saved record with familiar names. You try a different card timing against someone you remember. Your moves improve, but the build grants no new capability after a week; this is an acknowledged design gap, not a claimed progression feature.

### 4.3 Two return hooks

| Selected hook                           | Exact trigger or timing                                                                           | What the player anticipates                                       | Reminder channel + no-reminder fallback                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Persistent named leaderboard rivalry | Check the saved board after a match or on a later visit; no daily reset or automated rival alert. | Improve a record against a familiar person.                       | No custom notification; remember the person and compare the board. D1 effectiveness: TBD.                                              |
| 2. Social rematch with a fresh hand     | A completed three-round match offers Rematch; another visit provides another shuffled hand.       | Try counterplay with friends rather than repeat a fixed solution. | Voluntary friend invitation; bots support practice if friends are absent. This is replay variation, not a guaranteed tomorrow trigger. |

Before proposing additional progression, agree the smallest justified change with the owner and Creator Success. This document does not authorize adding features outside [Scope](../docs/SCOPE.md).

## 5. Social by Design

| Lens                                  | Design and current evidence                                                                                                                                                                                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The repeatable social loop            | A passes toward B → B voluntarily prepares a defense or intervenes → their actions change who holds the alien and earns points → a visible attack and shared ranking invite another contest.                                                                                                                                  |
| The disappearance test                | Bots preserve the rules, but human bluffing, grudges, deliberately chosen rivals and shared reactions disappear. The mechanical loop survives; its social meaning does not.                                                                                                                                                   |
| From strangers to a group             | Play joins one table during the entry countdown; names, holders, direction and card feedback identify participants. No voice is required. Clear first-time comprehension: not tested.                                                                                                                                         |
| Recognition & continuity              | Names appear above astronauts and in results. Saved human records support recognition; persistent crews, relationship tracking and rival alerts are not implemented.                                                                                                                                                          |
| Quiet hours & player counts           | One human practices timing and card combinations against seven bots. Two humans enable intentional social counterplay; four to eight are the intended group, with eight total seats. Owner has tested desktop solo-plus-bots locally; controlled multi-human/mobile results: TBD. No guaranteed human-arrival service exists. |
| Drop-in / drop-out                    | New players join before play begins; there is no mid-round seat takeover by a new human. Disconnected humans become bot-controlled; returning owners can recover their existing seat. Late-arrival guidance, full-table behavior and deployed reconnects need validation.                                                     |
| Visible play (the bystander test)     | A participating player sees an alien being passed until it attacks a holder; the opaque lobby is not an external spectator experience.                                                                                                                                                                                        |
| Shareable play (the memorable moment) | A prepared defense sends the alien back just before expiry and the intended attacker suffers the takeover instead.                                                                                                                                                                                                            |
| Bring-a-friend                        | After a friend survives your targeted pass, invite a rematch. Their counterplay makes the next hand personal instead of just another bot simulation.                                                                                                                                                                          |

## 6. Mobile-First

| Core-loop verb | Touch controls                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Read           | Inspect holder labels, numeric scores and compact danger/direction HUD; drag to orbit the arena.      |
| Prepare        | Tap a card category, choose a card, then tap the loaded slot; Chaos also requires a player selection. |
| Risk           | Keep holding; no continuous press, movement input or auto-pass is required.                           |
| Pass           | Tap the main bottom-centre PASS button.                                                               |
| Regroup        | Tap Rematch or Main Menu after results; optional emoji reactions use separate touch buttons.          |

**UI plan**

The primary action is central at the bottom, emoji reactions on its left and two card slots on its right. Compact top HUD, optional instructions and responsive menus must leave native Decentraland controls accessible; no duplicated account, audio or graphics settings.

**Performance**

Targets: 30 fps on a named mobile device/client and 60 fps on recommended desktop hardware with eight occupied seats. Device models, OS/client versions, geometry totals for the latest astronaut exports, frame times and memory results: TBD. Validate one human plus seven bots and an eight-human session; do not infer performance from a successful build.

**Desktop-only dependencies**

The design requires no keyboard, custom shader or VAT. Native mobile support for the current camera, skeletal blending, UI alpha, audio and authoritative-server SDK build is an unverified dependency until tested. If a cosmetic feature fails, preserve cards, readable passing and scoring without that cosmetic feature; do not claim cross-client parity from desktop tests.

## 7. World, Look & Story

**Story / world**

A baby alien hatches inside the spaceship and wants to control the crew. Pass it away before it attacks, but risk holding longer to finish three rounds with the highest score.

**Visual direction**

Eight low-poly astronauts sit around the broken egg in a matte, solid-colour spaceship. One atlas and three authored material roles unify assets; cute idle and angry attack silhouettes make the alien's state legible. Screen-level signature: a circular crew, a tiny carried creature, and a close side-view takeover. Production alien/egg/VFX are still pending; concept art is not evidence of final in-engine quality.

## 8. Audience & Comparables

**Primary player + arrival context**

For casual party-game players arriving alone or with friends in Decentraland, looking for short competitive sessions without movement or reflex-heavy controls.

**How the first group arrives**

The owner invites a small group to the published World for an agreed playtest, reaching the two-human social threshold together. Discover/Event packaging can follow release, but no placement, event schedule or acquisition result is promised.

**Deliberately not for**

Players seeking free-roaming parkour, a deep RPG economy or purchasable competitive advantages.

### Comparables

| Lens                                              | Comparable A — Antrom RPG / Dice Masters, Decentraland                                                               | Comparable B — hot potato, traditional party game                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| What we observed works                            | Owner reports a skippable voiced lore introduction, active users and visible daily reasons to return.                | A visible object, passing and a shared deadline make risk understandable.                |
| What does not fit our audience or context—and why | Dense menus and crafting add onboarding cost; our short sessions need fewer systems.                                 | Waiting for a turn leaves little agency; instant elimination sidelines friends.          |
| What we will do differently                       | Keep the optional tutorial compact, maintain a coherent astronaut cast and test touch layout before expanding scope. | Off-turn cards, an optional scoring-only Echo and no elimination keep everyone involved. |

Observations are qualitative, not competitor analytics. See [research notes](PLAYTEST_NOTES.md).

## 9. 4 Week Plan (v1 scope)

Requested support is **V0**. The plan below is a proposed four-week polishing/validation slice from the existing prototype, not an agreed V1 award or contract. Calendar dates and accepted deliverables: TBD with Creator Success. The application test World is a prerequisite, not a promised grant-funded substitute for applying.

| Week                                                   | What is playable / done                                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Prototype definition                               | Validate the application test World, freeze the current rules and observe first-time users; agree the V0 slice and investigate the return/progression gap without adding unapproved systems. |
| 2 — Core interaction + first-group test                | Validate a solo match and a two-to-eight-human group, card targeting, Echo collisions, disconnect continuity and record persistence.                                                         |
| 3 — Core systems refinement                            | Integrate approved final alien/egg assets, check animation and audio, and resolve mobile layout/performance problems using the real eight-seat scene.                                        |
| 4 — Playable release, including testing and deployment | Complete mobile/desktop regression and World redeployment, verify visit links, record known limitations, and review continuation/return evidence.                                            |

**What keeps the experience changing after launch**

- Variation comes from shuffled finite hands, the unique round Echo recipient and human decisions; no new map or content cadence is promised.
- If an update is skipped, opponent choices and risk timing still vary each match.
- N/A: no power progression or scheduled progression reset; new players receive equal gameplay rules immediately.
- If players rematch voluntarily but never return later, revisit the documented retention hypothesis before adding content.

**Not building in v1**

VAT/custom shaders, external backend, multi-table cross-realm matchmaking, daily economy/progression, wearable-gated powers and extra card types are deferred outside the approved MVP. No v2 restoration is committed. Standing non-goal: paid competitive advantages, because equal rules support readable social competition.

**Top risk + fallback**

The main product risk is that random hands and records create immediate rematches but no compelling later return. Test that openly; if it fails, agree one small social/status return mechanism with the owner and program before implementation rather than disguising a score increase as progression. Technical release gates remain mobile support and World server/persistence validation.

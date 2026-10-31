# Progression and Daily Rewards — Proposal, Not Live

Owner-approved scope for this iteration: data structure and proposal only. No currency, shop, daily chest, login claim, rare unlock or skin grant is active. Nothing here promises a claimable reward or an implementation date.

## Starting access

- The v6 local preview defaults to Freeze, Skip and Invisible in each of three round decks and allows selection from the eight approved deck powers. This is a playtest catalogue, not a persistent inventory grant.
- General green: Freeze/Hidden Watch/Invisible/Skip; Epic red: Chaos/Shadow/Symbiosis/Vacune. Turbo/Echo are purple board pickups, not future unlock inventory: Turbo gives 2x for the round, Echo appears once per match. See [current contract](ROUND_POWERS_AND_LOADOUTS.md).
- Bots use the same approved card rules and valid 3×3 plans. No bot-only pickups or movement bonus exist.
- The eight existing astronaut variants remain visual match variations, not claimed exclusive skin ownership.

## Suggested unlock structure

| Milestone                                | Possible reward              | Still needs a decision                                                   |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| First completed match win                | Hidden Watch unlock          | Approve mapping; shared-win eligibility                                  |
| Lifetime points milestone                | Chaos unlock                 | Point threshold; historical record migration                             |
| Complete a match on seven days           | Epic or cosmetic unlock TBD  | Echo is now board-only; mapping, missed days and time zone need approval |
| A qualifying seven-day reward track      | One free card chest          | Calendar; manual claim vs automatic; reward pool; duplicates             |
| Hold a leaderboard position for 24 hours | Exclusive astronaut cosmetic | Rank cutoff; rolling window; proof across idle server shutdowns          |
| Most coins in a match                    | Cosmetic or unlock progress  | Score pickups exist; reward tracking, tie and anti-farming policy TBD    |

Daily exclusives should be cosmetic (or have a later non-purchase earn path) so a new player is not permanently weaker. Rare cards should add a tradeoff or situational tactic rather than a strictly stronger baseline. Keep permanent unlocks distinct from consumable card copies and from the random hand dealt per match.

## Proposed technical structure

`src/game/rules/progression.ts` defines a versioned profile with unlocked cards/skins, lifetime points, wins, qualifying date keys and claimed reward IDs. `PROGRESSION_IMPLEMENTATION_ENABLED` remains false. It is not connected to persistence, UI claims or the dealer. The current preview uses an explicit approved catalogue and per-match loadout validation, not profile-owned grants. The initial reward mappings below remain proposals requiring revision for v6.

When approved, the DCL server should load a wallet-scoped profile, calculate completion using server-owned match results and issue idempotent reward IDs. Check Storage success, serialize profile updates per wallet, retry failed checkpoints and never allow the client to submit points, dates, win counts or a reward choice outside an approved pool. A UTC date convention is only a candidate; do not launch a streak before selecting a time-zone/reset policy.

The DCL server sleeps when no players remain. “Top for 24 hours” therefore needs a precisely defined eligibility window and persisted observations; it cannot be implemented as an in-memory 24-hour timer. Existing best-match leaderboard values belong to old scoring rules: preserve them, but start a separately versioned running-mode board rather than comparing incomparable scores.

## Before activating the economy

Approve the milestone-to-reward mappings, thresholds, claim cadence, duplicate conversion, chest contents, inventory capacity, reconnect/replay behavior, missed-day policy and coin sources/sinks. Test a full week using a controllable server calendar, including duplicate claims, failed writes and server restarts. Do not add purchasable items or wallet transactions implicitly.

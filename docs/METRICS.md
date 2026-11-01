# Metrics and Validation Plan

Updated 2026-10-31 for v6.2 running tag. This is an observation/instrumentation plan, not a claim that an analytics pipeline or measured retention exists. It replaces seated hold-band and dual-category metrics. No new tracking service is authorized by this document.

## Privacy

- Collect only product/performance signals needed for the agreed test.
- Prefer pseudonymous session identifiers; do not publish wallet addresses or names as analytics.
- Do not transmit player data to a new third-party service. Existing native leaderboard persistence has its own approved purpose.
- Obtain participant agreement before recording sessions; aggregate observations in reports.
- Gameplay must continue if optional telemetry or an observation tool fails.

## Questions before feature counts

| Question                           | Observe                                                                                                                             | Interpretation                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Is the interaction understood?     | Unprompted preparation, first valid throw, attempted contact-only passes, range/arrival rejection confusion, explanation of points. | Enjoyment after coaching suggests a communication issue; understanding without engagement suggests a mechanic issue. |
| Do humans change behavior?         | Intentional pursuit/evasion, response to a specific rival/card, deception, voluntary rematches; distinguish humans from bots.       | Bot simulations establish rule behavior, not social value.                                                           |
| Does scoring support the chase?    | Points by source, time chasing/evading versus collecting, cards used tactically versus spent just for +1.                           | Investigate incentives before adding features or changing scoring.                                                   |
| Is there a reason to return later? | Actual later-day visits, a specific intended goal, whether return was prompted.                                                     | Same-session replay and stated intent are not D1/D7 retention.                                                       |
| Is delivery reliable?              | Device/client data, full matches, rematches, cold server entry, reconnect and persisted results.                                    | Passing tests/build is not native or deployed acceptance.                                                            |

## Proposed product events / manual observation fields

These records may begin as a manual playtest sheet. Runtime game events do not imply this full schema is currently captured.

| Event                             | Minimum fields                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| scene_loaded                      | pseudonymous session, platform/client, build, load time                                           |
| deck_prepared                     | round/slot edits, order changes, preparation duration, help required; no private opponents' hands |
| match_started                     | human/bot counts, build/rules version                                                             |
| throw_requested / resolved        | alien type, accepted/rejection reason, observed range, round, resulting transfer point            |
| card_activated                    | type, tier, round, accepted/rejection reason; Chaos is a teleport, not a selected pass target     |
| pickup_collected                  | coin/Turbo/Echo, round, accepted once, score source                                               |
| takeover / containment            | round, victim human/bot, hits out of five, bonus resolved                                         |
| match_completed / rematch_started | duration, points by source, rank, whether rematch actually began                                  |
| return_visit                      | agreed pseudonymous participant, interval/day, intended goal, prompted/unprompted                 |
| disconnect / persistence          | phase, seat recovery, save/load success and retry result                                          |

## Balance and technical checks

- Separate transfer, coin, activation, untouched-round, containment, Shadow-trap and Vacune-success points. Chaos/Symbiosis success attribution reuses the transfer point; never double-count it in totals. Record Chaos's 3s same-alien window and Vacune's once-only accepted foreign Freeze/Echo condition.
- Compare humans/bots under equal base speed and effect rules, accounting for experience and active player count.
- Review avoided-alien versus aggressive-transfer strategies, early-leader conversion, card choices and tactical value.
- Inspect range/arrival/anti-return rejections, hidden/immune targets, Echo occupancy and ownership consistency.
- Confirm exactly ten coin spawns per round, at most ten present, once-only collection and no respawn.
- Confirm one Turbo per round, one Echo appearance per match and no deck injection.
- Measure FPS/frame-time spikes, input-to-feedback delay, snapshot delay, asset failures and memory through repeated rematches.
- Exercise eight participants/maximum Shadow effects, transparency and UI readability around native controls.
- Verify cold server startup, dropped/replayed intents, reconnect, result persistence and failures without duplicate points.

## Playtest prompts

Observe before explaining; record when coaching becomes necessary.

- What were you trying to do, and what did you expect?
- What makes THROW available, and does touching someone alone work?
- How do your three round decks work, and what happens to unused cards?
- How did you earn those points? What do the coins let you do?
- Why did you use that card then? What changed because the opponent was a person?
- What happened when the alien attacked? Did you understand the TAP result?
- Observe whether a rematch starts without suggesting it.
- On an actual later visit, ask what brought the player back and what they want next.

No pass/fail retention threshold, program approval, acquisition result or measured performance is claimed. Agree thresholds with the owner/program after the test population and question are defined.

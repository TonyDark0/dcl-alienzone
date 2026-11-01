# Game Rules — Running Tag Preview

## Objective and loop

A baby alien has hatched aboard the ship. Avoid its attacks and finish three rounds with the most points. Nobody is eliminated.

1. Play opens preparation for three ordered decks of three cards. Find Match submits that validated plan and joins the table; bots fill remaining positions, up to eight astronauts. See [Round Powers and Loadouts](ROUND_POWERS_AND_LOADOUTS.md) for the authoritative v6 card contract.
2. The three-second opaque countdown prepares the camera and actors. The room reveals your assigned astronaut in close-up for 0.6s, then eases out to your tracked drone view over 1.8s during the existing visible standing/seating intro. No alien fuse runs during this reveal.
3. A five-second first-round order review appears after the visible intro, before the first alien or fuse. Future decks were already selected before matchmaking. Round starters use an isolated seeded shuffle without repetition; later rounds resume from previous positions with a new original holder and the next planned deck, discarding all leftovers.
4. Desktop: WASD moves in screen-relative directions, E throws and F activates the ready card. Mobile: the native joystick moves/aims, with explicit THROW and ready-card touch controls. Direction changes send immediately; the suit turns quickly without a turning-radius movement arc. Merely touching never passes an alien. A fixed-heading, nominal 60° drone follows your own astronaut at center, 10% closer than the former shared camera; not all of the 30×15m area must remain visible. All three rounds show the victim's close-up to everyone and return smoothly to your tracked view. Only the victim receives shake, red flashes and TAP targets. Native avatars remain hidden and immobile; the server owns every proxy.
5. The original timer expires after 28 seconds, without resetting on a tag. Only its holder is attacked. All movement stops for the existing five-second takeover cinematic and containment challenge.
6. First and second attacks are contained narratively. The third ends the match. Rematch and Main Menu remain available after results are saved.

The current arena is an **open-room movement preview**, bounded at X 1–31 / Z 8.5–23.5 (30×15m) inside the approved six-parcel, 48×32m scene. The owner revised the room size and explicitly kept its existing position; code does not move or stretch its mesh. Score coins are implemented; the proposed divided map and portals are not, nor does the 2D controller infer obstacle colliders from the spaceship GLB. Chairs retain their original positions and scales. Map edges and a matching obstacle/navigation contract must be reviewed before a competitive release.

## Points

- Successful explicit nearby throw: **+1** to the outgoing holder, identically for the original and Echo.
- First contact with a shared coin: **+1** to the collector, identically for humans and bots, with or without an alien.
- A whole round without receiving **either** alien: **+1**, awarded once at takeover. The starting holder and Echo spawn recipient count as having received an alien.
- Containment: **+1** to the attacked player for at least three hits out of five.
- Every accepted card activation or Rare pickup activation: **+1 once**. Shadow adds **+1** once if an attacker throws at its decoy. Vacune adds **+1** once on the first accepted foreign Freeze/Echo activation during its protection. Symbiosis's successful transfer point and Chaos's timely follow-up transfer point are their second points, never a third award. Chaos requires the same alien carried at teleport to be passed within 3s; a later throw still earns its ordinary point but is not a Chaos success. Rejected requests, ordering/loading and holding alone award nothing.
- No two-second scoring hold, danger bands, automatic timed pass or -5 takeover penalty in this mode.
- Ranking: most points, then fewer attacks, then more successful transfers; perfect ties share the win.
- UI score displays remain numeric only. Documentation uses “points”.

Epic success does not create an unconditional +2 grant. Shadow needs an actual decoy trap; Vacune needs a foreign accepted Freeze/Echo while active; Symbiosis needs a real successful shot; Chaos needs its held alien transferred within 3s. Each success resolves once. No score is predicted by the client.

## Throwing and fairness

- One-second grace after arrival before another ordinary throw of that alien.
- For 2.5s after a transfer, the recipient cannot return that same alien to its immediate giver. Other recipients and the other alien use independent eligibility. Bots, Symbiosis and UI availability respect this protection too. Chaos preserves the existing protection when teleporting.
- Space / THROW requires a server-observed eligible astronaut within the 1.5m core. Nearly tied targets remain stable within 0.15m. After a valid core contact, a maximum 150ms window allows up to 0.2m extra distance to accommodate crossing/input latency; leaving the core never extends that window. A fresh distant target cannot use it. UI and throw validation use the same target selection, with seat ID breaking exact ties. Invisible target identity remains concealed. Each transfer needs a new explicit action; touching or holding Space never generates automatic transfers. Ownership, current turn, arrival grace, immunity and double occupancy are rechecked even inside the edge window.
- Base speed remains server-controlled at 3.2m/s for humans and bots. Heading must be finite and forward magnitude is clamped to 0–1. WASD/joystick diagonals cannot add speed. Unrefreshed movement expires after 0.4 seconds; stale sequence numbers are rejected.
- A player cannot carry both aliens. The other holder and immune players are ineligible throw targets. Range/eligibility is rechecked on receipt, even when the UI was previously enabled. Rejected throws never consume a power or award points.
- Freeze slows others to 50% for 2s, not card use or the alien clock. Vacune resists it. On a Turbo collector, that Freeze removes the 2x boost permanently and leaves normal 1x speed without slowing that hit. Turbo is a round-long board pickup, not a five-second card. Repeated ordinary slows extend expiry, not strength.
- Human and bot positions are simulated by the same controller. Bots anticipate visible target movement, briefly commit to a target, reduce recent-recipient preference, choose distinct roaming waypoints and evaluate escape directions against visible carriers, edges and crowding. They call the same validated throw/card APIs, never pursue hidden coordinates and receive no movement bonus. This is open-room steering, not obstacle pathfinding.

## Round coins

- Exactly ten coins spawn together at the start of each of the three rounds: thirty spawned per match, never more than ten available at once. Positions are seeded separately from cards, starters and containment, one metre inside the movement edges, at least 1.5m apart and outside the central furniture/room clearance. They do not spawn directly on an astronaut.
- The server checks the astronaut proxy's swept movement within a 0.65m combined contact radius. The first contact in the simulation step wins; exact ties use seat ID, not human/bot status or packet arrival order. No click/key is required on desktop or mobile.
- A collected coin disappears for every player, grants exactly +1 and is never replaced during that round. Remaining coins expire without awarding points at takeover. The next round starts with ten new positions, not leftovers plus ten. No coins are active during intro, deck setup, takeover or results.
- Invisible, slowed, boosted and alien-carrying astronauts can collect using the same rules. Coins do not reset the fuse, activate cards, change alien ownership or count as successful throws.
- Non-carrying bots may seek public coins while evaluating threats. Coins are score opportunities only: no inventory, shop balance, daily grant or persistent currency is introduced.
- A larger, high-contrast +1 numeric notice appears above the collector. Shared coin GLBs spin, bob and scale in with a short bounce; those visuals never decide collection or delay eligibility.

## Cards

Prepare **three decks of three cards**, one per round, before matchmaking. The preview defaults to Freeze, Skip and Invisible in each round but permits all eight approved deck powers. This is not a persistent unlock/reward grant. Unused cards expire at takeover; the next planned deck replaces them.

F / tapping the ready card activates only the queue head. Ordering never activates a power or restores a spent card. Current-round reordering remains available without pausing. Chaos resolves immediately and advances the queue; it does not arm an incoming redirect or lock ordering. Future-round decks cannot change during the match. General is green and repeatable; each red Epic type can occupy only one slot per match; purple Rare powers appear only on the board.

| Card         | Tier        | Effect                                                                                                                                                  |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Freeze       | General     | Slow others to 50% for 2s; cancel Turbo to 1x instead. Vacune resists.                                                                                  |
| Skip         | General     | Immune to receiving either alien for 3s; keeps any alien already held.                                                                                  |
| Invisible    | General     | Hidden for 10s except from Vacune. Blind throws can still hit.                                                                                          |
| Hidden Watch | General     | Hide the selected alien holder's exact timer for 6s.                                                                                                    |
| Chaos        | Epic        | Immediately teleport yourself to a random valid map position, potentially safer or more dangerous. Keep any carried alien and its timer.                |
| Shadow       | Epic        | Five-second roaming decoy. A throw at it destroys it immediately and awards its owner a trap bonus; attacker keeps the alien.                           |
| Symbiosis    | Epic        | Straight 5m throw along facing. First body only; misses consume the card but keep the alien.                                                            |
| Vacune       | Epic        | Round-long Freeze/Echo protection, Invisible visibility and Shadow identification; does not block the original.                                         |
| Turbo        | Rare pickup | Exactly one appearance per round. Collect for 2x until round end or a cancelling Freeze.                                                                |
| Echo         | Rare pickup | Exactly one appearance per match in a random round. Spawn a second transferable scoring alien sharing the original fuse; no attack or round carry-over. |

Turbo and Echo auto-activate on server-confirmed contact, never enter a hand, and do not replace the ten score coins. Uncollected pickups expire; neither respawns. Their appearance times/positions are seeded independently. No eligible Echo recipient means no consumption or activation point until it can resolve.

One shared activation cooldown is 1.2 seconds. Timed effects clear at takeover; active cards become spent. Hidden Watch remains attached to the affected player, not to every future holder. Rejected activations do not spend cards. Cards announce icon, name and caster for 0.9 seconds in a nonblocking top-right notification, aligned and sized to the first scoreboard row. A new activation immediately replaces the old notification; there is no central queue.

Freeze has a temporary cyan/glossy material treatment on affected astronauts. Invisible shows a 25%-opacity ghost only to its owner; other players still see no astronaut, name, marker or shadow. Material transitions are presentation only and restore the authored skin; they do not change card duration, movement, targeting rules or score.

Persistent unlock criteria, card ownership, rewards and shop pricing are not live. See [Progression Proposal](PROGRESSION_PROPOSAL.md). Several new powers temporarily reuse existing PNGs; distinct final art is pending. Full interactions, visibility guarantees and implementation assumptions are recorded in [Round Powers and Loadouts](ROUND_POWERS_AND_LOADOUTS.md).

## Takeover containment

Only the attacked astronaut gets five sequential, seeded-position TAP targets. First target opens 0.4 seconds after takeover, each remains visible for 0.72 seconds, and the server permits a fixed 0.25-second receipt allowance. All five targets count; duplicate taps cannot add hits. Hover highlights an available target. Clicking immediately flashes TAP SENT; green HIT requires server confirmation and rejection flashes MISS. Flash feedback lasts up to 450ms and never awards predicted points. Three or more hits awards +1 once at 4.25 seconds, before the five-second cinematic ends and scores are saved. Misses incur no extra penalty. The existing attack animation, close-up and local red feedback remain visible, with no takeover modal.

## Assets and verification status

All eight GLBs now supply `AST_RUNNING` and `AST_RUNNING_ALIEN`. Runtime selects the carrying loop for either alien and changes playback speed with the same multiplier used by authoritative movement. No separate slow/turbo clips are requested. Takeover temporarily reuses the existing authored clip; chairs do not chase or recline remotely.

The alien GLB is absent from the agreed path, so the running preview uses the existing transparent alien-reaction art as a carrier marker, with the shared countdown above it. It is not a newly generated creature or final attack asset.

Automated tests/build do not constitute a desktop/mobile visual, control-latency or collision playtest. Native Explorer has not been opened by this change.

# Game Rules

## Objective

A baby alien has hatched aboard the ship. Its curious face hides a dangerous instinct: when the timer runs out, it attacks the astronaut carrying it. Pass it between the crew and stay out of its grasp.

Avoid being attacked by the alien and finish the three rounds with the most points.

## Match and scoring

- Press **Play New Match** to join the table. Players browsing the lobby do not occupy a seat. Other players may join during the three-second entry countdown; bots fill the remaining seats.
- Eight fixed seats, one to eight humans, exactly three rounds/takeovers. Nobody is eliminated.
- The visible crew-seating sequence finishes before the first shared timer starts.
- Hold an alien for at least two seconds, then pass manually to score. Holding alone awards nothing.
- There is **no automatic pass** and no maximum hold duration. An inactive human keeps the alien until they pass or the original alien attacks.
- Bots make deliberate passes through the same validated API as humans.
- At pass acceptance, more than 15 seconds remaining awards +1; more than 10 through 15 awards +2; more than 5 through 10 awards +3; 5 or less awards +4.
- A pass before two seconds awards 0. A takeover subtracts 5, with a minimum score of 0.
- A successful activated Skip awards its owner +1 when consumed, not when loaded or activated. This is not counted as a manual scoring pass.
- Ranking: most points, then fewer attacks received, then more successful scoring passes; perfect ties share the win.
- Scores in the gameplay HUD and ranking are numbers only, without a currency suffix.

## Shared timer and two aliens

The original alien starts each round with 28 seconds. Freeze extends the deadline by up to five seconds, never beyond 38 seconds from the start of the round.

Echo shares the same deadline and direction and scores using the same rules, but never attacks. It disappears at the original alien's takeover. Two aliens cannot occupy one seat: routing skips an occupied seat **before** checking or consuming its reaction.

## Cards

Every player receives two reactions and two standard interventions for the whole match. Standard interventions are Chaos, Hidden Watch and Freeze. This finite base hand does not refill.

**Exactly one shared Echo bonus card** is assigned to one random seat at the beginning of each round. Humans and bots are equally eligible. Any previous Echo card expires, even if unused. This bonus is in addition to the recipient's remaining base hand, so its hand may contain five cards. Only one Echo can be spawned across the entire table in that round.

Open a category header to browse. Selecting a card only loads it; tapping the loaded slot activates it. One reaction and one intervention can be loaded. Rejected actions never spend the card.

### Reactions

Activate Reverse or Skip before the alien arrives. The activated card waits for an incoming original or Echo, then is consumed.

- **Reverse:** return the alien to the previous source and flip the shared direction.
- **Skip:** move the incoming alien onward and award the defender +1.
- Defenses chain in order until an eligible holder is found.
- An occupied-seat collision is not a Skip card use and awards nothing.

### Interventions

- **Chaos:** loading opens a player picker. Select another seat (human or bot), then tap the loaded card to activate it. Without a valid destination it cannot activate. It changes **the caster's next manual pass**, whenever their turn arrives, to the chosen player. It does not move another holder's alien. The redirected arrival resolves collisions and active reactions normally. The pending redirect expires if unused when the round ends.
- **Hidden Watch:** hide the selected alien holder's exact remaining time for six seconds; qualitative danger remains visible.
- **Freeze:** the former Cool Down card. Extend the shared deadline by up to five seconds; this does not pause animations or freeze a player.
- **Echo:** spend the one shared round card to spawn the non-attacking alien. A second simultaneous activation cannot create a third alien.

Interventions can be activated while another player holds an alien. The server validates the target, card state, round, cooldown and deadline. Bots use the same rules and target selection.

## Activation feedback

Each accepted card activation displays its PNG icon, card name and caster's display name in the centre. Zoom/fade entry, hold and exit take 0.9 seconds total per announcement. The overlay never blocks passing or card input. Triggering a prepared reaction does not repeat the activation announcement; Skip's +1 still appears at the defending seat.

## End of round and records

At expiry, only the original holder is attacked. Echo vanishes. The five-second camera/animation sequence completes before the next round or final ranking.

Human records persist through Decentraland Scene Storage: best match points and wins. Existing storage keys remain compatible. World Leaderboard is available from the lobby.

For visual references, see [Cards Reference](CARDS_REFERENCE.md).

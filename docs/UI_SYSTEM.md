# DCL Alienzone UI System

## Foundation

The UI uses SDK7 React-ECS with a 1920×1080 virtual canvas. SDK 7.26+ supplies a 1600×720 virtual canvas override on mobile. The renderer uses `screenInset: 'none'` so opaque backgrounds cover the complete screen; `AlienzoneUiRoot` applies one `ScreenInsetArea` to interactive content.

Only one `setUiRenderer` call is allowed.

## Ownership

Decentraland owns profile, chat, voice, minimap, system menus, graphics/audio settings and World exit.

DCL Alienzone owns lobby navigation, tutorial, leaderboard, POINTS, seats, fuse danger, direction, cards, pass, quick reactions, results and takeover feedback.

## Lobby

The opaque lobby exposes three clear actions:

1. **Play New Match**
2. **How to Play**
3. **World Leaderboard**

The tutorial uses three touch-friendly tabs: Objective, Scoring and Cards. Text blocks reserve explicit heights to prevent wrapped text overlapping later rows. It covers exact POINTS thresholds, zero-score cases, Skip's +1 trigger bonus, takeover penalty, tie-breaks, loading versus activation, finite hands and Echo behavior. The leaderboard shows rank, display name, best POINTS and wins.

## HUD

- Top-left: local POINTS and seat ranking.
- Top-center: round, arrow-only direction and takeover progress.
- Beside top-center: danger band, kept clear of native Local Tools.
- Bottom-left of PASS: three square image-based quick reactions.
- Bottom-center: PASS as the primary action with dominant typography.
- Bottom-right of PASS: two card-category slots, Reaction and Intervention. Each opens its filtered card menu upward.
- Names above 3D astronauts identify every seat; reaction images animate independently above the persistent nameplate for 1.5 seconds and restart when tapped repeatedly.
- Camera-facing notices above each name show POINTS changes and activated cards.
- Containment Ranking uses the same fully opaque black backdrop as the lobby.

## Card interaction

- The base hand contains four dealt cards; one randomly chosen seat receives the unique round Echo bonus.
- The deck button opens the hand without pausing.
- Tapping a card in the deck loads it without activating it.
- Only one reaction and one intervention remain loaded.
- Activated reactions resolve on arrival; no alien is passed automatically.
- Loaded cards are activated from their dedicated slot. Reactions wait in an active state for the next incoming alien; interventions resolve immediately.
- Spent cards are unavailable; the category picker lists remaining cards.
- Card labels are centered: title, availability/state, icon and action hint.
- Chaos loading opens a player picker; activation requires a selected destination. A centred icon/name/caster announcement zooms and fades over 0.9 seconds per accepted activation.
- The lobby uses the transparent Alienzone lettering, one centred tagline and three plain buttons without hints or seat counts. Scores use numbers only.
- Category pickers group the remaining cards with a fixed 12-unit gap in a compact panel; a single remaining card is centered and an exhausted category displays an empty-state message.

## Takeover presentation

There is no takeover modal and no Continue button. The HUD remains visible while:

- Camera pushes to a lateral close-up.
- Astronaut and seat animate.
- Local victim receives subtle camera shake and a flashing red filter.
- Camera returns smoothly and input unlocks.

## Responsive rules

- Essential controls stay inside device safe areas.
- Mobile uses the same hierarchy, not a reduced desktop afterthought.
- PASS keeps a minimum 64-unit touch target.
- No essential action depends on hover.
- Text and icons accompany every color state.
- Native bottom-right controls keep an explicit reserve.

## Acceptance

- Category headers open the reaction/intervention hand without activating a power. Selecting an available card loads it; tapping the loaded tile activates it. Selecting an already-loaded card is a no-op. Activated reactions remain visibly ready until consumed.

- Objective and scoring are understandable without external documentation.
- Leaderboard is reachable from the lobby.
- Holder, POINTS, takeovers, threat and pass state are readable in under two seconds.
- The UI does not duplicate Decentraland system settings.
- No Spanish or obsolete DCL Alienzone predecessor branding remains in player-facing UI.

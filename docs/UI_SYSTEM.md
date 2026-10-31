# DCL Alienzone UI System

## Foundation

The UI uses SDK7 React-ECS with a 1920×1080 virtual canvas. SDK 7.26+ supplies a 1600×720 virtual canvas override on mobile. The renderer uses `screenInset: 'none'` so opaque backgrounds cover the complete screen; `AlienzoneUiRoot` applies one `ScreenInsetArea` to interactive content.

Only one `setUiRenderer` call is allowed.

## Sci-fi skin — approved local integration

The approved [Sci-Fi Design System](SCI_FI_DESIGN_SYSTEM.md) is implemented locally: original RGBA nine-slice surfaces, angular alpha cut-outs, thick accent spines, navy/teal gradients, cyan navigation and coral primary actions. Three shared 512×256 textures skin existing components; live text, power icons and reactions remain separate. The generated approval board is an art-source reference, never a runtime texture.

Desktop hover eases over 120 ms; press feedback starts immediately and releases over 110 ms. Lobby page navigation exits over 160 ms and enters over 220 ms, with interruptible state. The three-second entry countdown and game requests are not delayed by transitions. Results and card pickers have short entrance feedback. No custom shader, UI framework or backend dependency is added.

## Content navigation

Scene-owned menus do not use `overflow: 'scroll'`: the pinned SDK exposes no scrollbar width/color styling and the Explorer's stock gray controls do not match the visual system. `PageNavigation` uses 44-unit Previous/Next buttons, a page count and a three-unit cyan segmented indicator. Hide it when there is only one page. This is discrete whole-item navigation, not a fake scroll thumb; it works without wheel input, dragging or hover. Native DCL menus remain unchanged.

The loadout editor fits all nine round slots without scrolling. The catalog uses complete horizontal card options and General/Epic tabs, with the number of visible rows calculated from the available height. Narrow aspect ratios switch between round decks and available cards instead of nesting scroll regions. Tutorial scoring uses two pages; tutorial cards show two complete entries per page; the expanded world leaderboard shows four records per page and retains global rank numbers. The current-round queue has at most three cards and fits without scrolling. Main actions stay outside paged content.

## Ownership

Decentraland owns profile, chat, voice, minimap, system menus, graphics/audio settings and World exit.

DCL Alienzone owns lobby navigation, tutorial, leaderboard, points, astronauts, fuse danger, running/tag controls, cards, quick reactions, results and takeover feedback.

## Lobby

The opaque lobby exposes three clear actions:

1. **Play New Match**
2. **How to Play**
3. **World Leaderboard**

The tutorial uses three touch-friendly tabs: Objective, Scoring and Cards. Text blocks reserve explicit heights to prevent overlap. Current content explains WASD / mobile joystick, E / touch throws, F / touch activation, five-second deck setup, untouched-round points, containment and locked powers. The leaderboard shows running-mode records separately from legacy scores.

## HUD

- Top-left: local POINTS and seat ranking.
- Top-center: round and takeover progress; no ring-direction arrow in running mode.
- Beside top-center: danger band, kept clear of native Local Tools.
- Bottom-left of the central status dock: three square image-based quick reactions.
- Bottom-center: E · THROW ALIEN (THROW ALIEN on mobile), enabled only while holding an arrived alien with a server-confirmed eligible target. Core range is 1.5m, with the bounded 150ms/0.2m server-observed edge window. Hint names the selected target unless invisible, otherwise shows arrival/range guidance and rejected-action feedback. Non-carriers are prompted to evade/collect coins. Desktop WASD moves in screen-relative directions. Mobile uses the native joystick, kept clear of scene buttons.
- If only the immediate giver is nearby and still return-protected, show RETURN PROTECTED with the remaining seconds instead of misleading MOVE CLOSER guidance. The server provides that recipient-only deadline. Turbo displays ×2 / ROUND; Vacune displays ROUND. These hints never decide eligibility, effects or points.
- Bottom-right of the central status dock: one ready card plus ORDER DECK. F or a touch activates the first card only. The queue picker opens upward without pausing.
- Names above 3D astronauts identify every seat; reaction images animate independently above the persistent nameplate for 1.5 seconds and restart when tapped repeatedly.
- Camera-facing notices above each name show POINTS changes and activated cards.
- A server-confirmed coin collection has its own 2.2×-scale numeric +1 notice, warm yellow/white color, stronger dark outline and longer full-opacity hold, without triggering AST_PASS or a central announcement. Ordinary point notices remain unchanged. Ten coins spawn each round; no coin-shop balance or inventory UI is introduced. Tutorial scoring includes coin contact and round expiry.
- Ranking retains `BG_end_match.png` as the full-screen results background, with a dark framed panel and centred MATCH COMPLETE / bold RANKING headings.

## Card interaction

- Play opens the pre-match builder: three ordered decks of exactly three cards, round/slot selection, catalogue and touch arrow ordering. Find Match submits the plan before joining. General green is repeatable; each red Epic type appears once per match; purple Turbo/Echo are board-only pickups. The preview catalogue includes the eight approved deck powers, not a persistent unlock grant.
- DECK_SETUP reviews the first planned deck for five server-timed seconds after seating. Future decks remain locked. All leftovers expire at takeover; the next round loads its prepared deck.
- Tapping a queued card makes it first, without activating it. Left/right buttons reorder the entire queue and work with touch, without drag or hover. The same picker remains available during play without pausing movement, incoming throws or the fuse.
- Only the first unused card is ready. F / touch consumes or activates it, then advances the queue. Already active effects continue their lifetime independently of the ready slot. The existing 1.2-second activation cooldown is displayed on the next card.
- Spent/active cards cannot be reinserted, duplicated or refunded by ordering. No category controls exist in the running HUD; the archived seated components are not used there.
- Card labels are centered: title, availability/state, icon and action hint.
- Chaos immediately teleports its user randomly and advances the ready slot, with no target picker or queue lock. Its accepted activation uses the same top-right icon/name/caster row as other powers: 208×34 desktop or 164×28 compact virtual units. New activations replace the prior row immediately; a short slide/fade keeps its 0.9-second lifetime. It never intercepts input. Every accepted card/pickup activation also shows a numeric +1 notice.
- The lobby uses the transparent Alienzone lettering, one centred tagline and three plain buttons without hints or seat counts. Scores use numbers only.
- The compact queue panel centers its at-most-three remaining cards without native scrollbars and displays DECK EMPTY when exhausted. The mobile picker uses explicit touch controls and leaves the native movement joystick visible.

## Takeover presentation

There is no takeover modal and no Continue button. The HUD remains visible while:

- In all three rounds, everyone sees the attacked astronaut's lateral close-up, followed by a smooth return to their own tracked drone view. Only the victim receives shake, red pulses and interactive tapping. At match entry a local suit close-up zooms out during seating. The fixed-heading, nominal 60° drone centers the local astronaut, 10% closer than the previous shared camera, retaining its viewport-aware lens rather than fitting the entire arena. HUD overlays stay screen-anchored; mobile uses the same tracking and input actions.
- The astronaut uses the existing takeover clip. The chair remains at its original anchor; it does not follow or recline at a remote running position.
- Local victim receives subtle camera shake and a flashing red filter.
- Only the attacked player sees five sequential, random-position TAP targets in a central safe field. The compact instruction is “TAP EACH TARGET • HIT 3 OF 5 FOR +1”. Observers see the victim's containment status and hit count, not interactive targets.
- Hover brightens an available target. A tap immediately displays TAP SENT at its position, then green HIT only on authoritative confirmation or red MISS on rejection; feedback fades over 450ms. Points are never predicted. Targets are 108 virtual units on mobile and 120 on desktop, with no hover requirement. Device insets are applied once by the existing root wrapper.
- Movement, card controls and emoji controls are hidden during this five-second phase; the score and round HUD remain. A small result label distinguishes successful resistance from the unavoidable final breach. No full-screen black backdrop or modal is added.
- Camera returns smoothly and input unlocks.

## Responsive rules

- Essential controls stay inside device safe areas.
- Mobile uses the same hierarchy, not a reduced desktop afterthought.
- The central status panel is 92 units high. Mobile movement uses the native joystick, not the archived four-button pad. Emoji controls use 92-unit high boxes; the single ready slot and queue controls are touch-enabled. These are SDK virtual units, not physical touch-point guarantees; validate their actual rendered size and DCL coexistence on mobile.
- No essential action depends on hover.
- Text and icons accompany every color state.
- Native bottom-right controls keep an explicit reserve.
- The dock uses centred status with separate fixed-width wings; available width includes hardware insets once. A narrow-layout fallback moves the wings above the centre. Reserve the native joystick's lower-left area.

## Acceptance

- ORDER DECK opens the current-round queue without activating a power. Selecting an available card moves it to the front; tapping the ready tile activates it. Timed powers keep their duration after advancement; Chaos consumes immediately. The server revalidates all actions. See [Round Powers and Loadouts](ROUND_POWERS_AND_LOADOUTS.md).

- Objective and scoring are understandable without external documentation.
- Leaderboard is reachable from the lobby.
- Holder, numeric score, round, threat and local movement/power status should be readable in under two seconds; this requires a native playtest, not just automated layout checks.
- The UI does not duplicate Decentraland system settings.
- No Spanish or obsolete DCL Alienzone predecessor branding remains in player-facing UI.

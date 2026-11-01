# Alienzone Sci-Fi UI — Refined v002

Owner approved the initial local implementation on 2026-10-25 and supplied four card/HUD/layout references on 2026-10-31. This v002 refinement is local only; no Git publication, client launch or deployment is included.

## Visual grammar

Dark navy/teal gradient surfaces, clipped 45-degree corners, concave edge notches, thin double-bezel outlines and small corner caps instead of heavy full-height spines. Upright cards have fine inset rails, rarity color, independent power art and a holographic pedestal. Cyan identifies navigation; coral identifies primary actions; violet identifies interventions; amber identifies active/warning states. Information uses normal readable sans-serif rather than baked labels or decorative microtext.

| Token             | Value                 |
| ----------------- | --------------------- |
| Menu canvas       | `#07111B`             |
| Panel gradient    | `#183B49` → `#0B1824` |
| Cyan accent       | `#65E0DF`             |
| Primary gradient  | `#FF6269` → `#D92B51` |
| Intervention      | `#AD92FF`             |
| Warning           | `#FFD166`             |
| Text / muted text | `#F3FAFF` / `#A3B7C4` |

Keep scores numeric, English copy, the existing Alienzone logo and all six power/reaction subjects. No new mechanics, shader, external service, system-settings menu, inventory, currency or deck slot.

## Component structure

`SciFiSurface` supplies nonblocking v002 panel layers. `CardSurface` adds a portrait double bezel and `CardHologram` displays the existing icon above an original elliptical pedestal. `Panel`, `ActionButton`, `CardTile`, card/Chaos pickers, tutorial tabs, score/danger widgets, leaderboard/results rows and activation notices consume that grammar. Gameplay handlers stay on their existing controls; decorative children never handle pointer input.

Surface state never multiplies opacity into the live icon/text subtree. This preserves internal black features and emoji brightness. Press darkens/translates only the inner graphic; the hit box and neighbouring controls do not move.

## Runtime assets

```text
assets/Images/ui/scifi/v002/
  az_ui_sf_fill_v002.png       Navy/teal gradient with real alpha silhouette
  az_ui_sf_primary_v002.png    Coral gradient, same silhouette
  az_ui_sf_frame_v002.png      Thin double bezel, transparent centre, tinted by role
  az_ui_sf_card_fill_v002.png  Upright card gradient
  az_ui_sf_card_frame_v002.png Thin portrait frame, real alpha corners
  az_ui_sf_pedestal_v002.png   Small translucent elliptical energy base
```

The three panel images remain 512×256 RGBA. Add two shared 256×512 RGBA card surfaces and one 128×64 RGBA pedestal: **2.53125 MiB combined uncompressed base-level pixel data** across six textures, excluding mipmaps/renderer overhead. No per-card full-size bitmap or copied reference pixels. Shared across controls; no unique image per player, card or score. Nine-slice caps protect 32 source pixels horizontally and 24 vertically. The stepped notches are near protected edge ends, not an arbitrarily stretchable centre decoration.

Regenerate on Windows with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Generate-SciFiRefinement.ps1
```

No generator runs inside the scene or CI. Runtime uses the supplied PNGs. The original vector construction lives in the script, not a crop from the generated review board. The latter is preserved separately in `art-source/ui/scifi/` and excluded from deployment.

## Interaction states

Pre-match preparation shows three round blocks with three numbered slots each, an explicit selected round/slot, General/Epic catalog tabs and whole-item pages with a thin cyan indicator. All/General/Epic filters show full portrait cards. Selecting one previews it without editing the plan; EQUIP CARD commits to the highlighted slot. Used Epics remain inspectable, but equip is disabled and their occupied slot is named. EARLIER/LATER changes the selected equipped card's order. Wide layouts show round decks, library and detail/action panes together. Narrow layouts use Rounds/Library/Detail tabs with renderer-scale-aware type and touch sizing. During a match there is one ordered queue and one ready card. Selecting/reordering does not activate; tapping the ready card or F does. Spent/locked controls have no active handler. Chaos teleports immediately with no target picker or queue lock. See [UI System](UI_SYSTEM.md) for current behavior; archived seated components are not the production UI.

THROW ALIEN stays centered, with reactions on the left and the single ready card/ORDER DECK on the right. Server-confirmed range, ownership and arrival determine availability; contact alone never transfers the alien. Native client controls and device insets remain outside these hit areas; no blanket desktop interactable inset is added. Instructions, expanded leaderboard and catalog use complete pages instead of thick native scene scrollbars.

## Motion

| Transition                    | Duration / constraints                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| Hover                         | 120 ms, brighter graphic and frame, desktop only                                      |
| Press / release               | 80 ms pulse + 110 ms release; dispatch action on the original press                   |
| Lobby page exit / entry       | 160 / 220 ms; latest requested page wins; old-menu input blocked only during its exit |
| Card / target picker entry    | 160 ms upward fade; no fullscreen input shield                                        |
| Results entry                 | 220 ms fade with small vertical motion                                                |
| Power notice / emoji reaction | Existing 900 / 1,500 ms retained                                                      |

`uiMotion.ts` contains presentation-only timing; `interactionState.ts` holds bounded local control feedback. No server deadlines, card states, scoring or camera transitions are modified. A phase change to countdown cancels lobby page motion immediately so the arena preparation timing stays intact.

## Verification and remaining checks

Automated tests cover alpha/colour/gradient integrity, exact asset casing, motion completion/interruption, action-dock spacing, nonblocking decoration and card-load/activation contracts. These do not substitute for native-client screenshots or mobile hardware tests.

Before release, verify actual touch sizes, corners at the client's nine-slice scale, menus around native overlays, a full match with Echo/Chaos, results, and repeated navigation/rematches on desktop and mobile. In-client visual/performance approval remains pending; compilation alone is not a visual QA result.

## Layout review tooling

`scripts/Preview-Loadout.mjs` renders an offline HTML approximation from the actual React-ECS tree with development-only mocks. Existing Playwright/browser paths can be supplied through `ALIENZONE_PLAYWRIGHT_PATH` and `ALIENZONE_BROWSER_PATH`. Generated images stay in ignored `tmp/ui-v002-review/`. It adds no game dependency, loads no external assets and uses no signed-in browser profile. This catches distribution/clipping problems but is not a native DCL screenshot or proof of font/nine-slice parity. Native desktop/mobile verification remains required.

# Alienzone Sci-Fi UI — Integrated v001

Owner approved local implementation on 2026-10-25. **No Git commit/push or World deployment is authorized by this UI approval.**

## Visual grammar

Dark navy/teal gradient surfaces, clipped 45-degree corners, concave edge notches, thin outlines with localized heavy spines. Cyan identifies navigation; coral identifies primary actions; violet identifies interventions; amber identifies active/warning states. Information uses normal readable sans-serif rather than baked labels or decorative microtext.

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

`SciFiSurface` supplies nonblocking fill/frame layers. `Panel`, `ActionButton`, `CardTile`, card/Chaos pickers, tutorial tabs, score/danger widgets, leaderboard/results rows and activation notices consume that grammar. Gameplay handlers stay on their existing controls; decorative children never handle pointer input.

Surface state never multiplies opacity into the live icon/text subtree. This preserves internal black features and emoji brightness. Press darkens/translates only the inner graphic; the hit box and neighbouring controls do not move.

## Runtime assets

```text
assets/Images/ui/scifi/v001/
  az_ui_sf_fill_v001.png       Navy/teal gradient with real alpha silhouette
  az_ui_sf_primary_v001.png    Coral gradient, same silhouette
  az_ui_sf_frame_v001.png      White outline/spine, transparent centre, tinted by role
```

All three are original procedural 512×256 RGBA images: **1.5 MiB combined uncompressed base-level pixel data**, excluding mipmaps/renderer overhead. Shared across controls; no unique image per player, card or score. Nine-slice caps protect 32 source pixels horizontally and 24 vertically. The stepped notches are near protected edge ends, not an arbitrarily stretchable centre decoration.

Regenerate on Windows with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Generate-SciFiSkins.ps1
```

No generator runs inside the scene or CI. Runtime uses the supplied PNGs. The original vector construction lives in the script, not a crop from the generated review board. The latter is preserved separately in `art-source/ui/scifi/` and excluded from deployment.

## Interaction states

Pre-match preparation shows three round blocks with three numbered slots each, an explicit selected round/slot, General/Epic catalog tabs and whole-item pages with a thin cyan indicator. REPLACE edits only that slot; EARLIER/LATER changes its order. During a match there is one ordered queue and one ready card. Selecting/reordering does not activate; tapping the ready card or F does. Spent/locked controls have no active handler. Chaos teleports immediately with no target picker or queue lock. See [UI System](UI_SYSTEM.md) for current behavior; archived seated components are not the production UI.

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

# Presentation Specification

## Art direction

A matte, solid-color, low-poly spaceship interior compatible with the shared atlas. Astronaut proxies retain Decentraland-like body proportions while wearing a unified suit. The alien changes from cute and trusting while idle/held to stylized threatening during takeover, without gore.

## Camera

- Participants use a drone that follows their own displayed astronaut and aims at its torso (Y 0.9). Position and aim update together after actors, without a second follow delay or renderer Transform readback.
- Keep a fixed world heading and nominal `60°` angle relative to the floor. The camera-to-target distance is 10% shorter than the former shared view (relative height 15.3m). Near the south edge, camera Z stays at least 0.25m inside the parcels, with a slightly steeper angle so the astronaut remains centered.
- Retain the former viewport-aware lens instead of widening it to undo the zoom. The view follows the astronaut, so it no longer guarantees the entire 30×15m arena remains visible. Spectators keep the previous room-centered global pose. Native desktop/phone readability and edge checks remain required.
- No mouse orbit, free translation, zoom, pitch or UI arrow controls.
- WASD / native joystick moves the astronaut; E / touch throws and F / touch activates the ready card.
- The local suit close-up is prepared under countdown. At room reveal, show the assigned astronaut for 0.6s, then zoom out smoothly over 1.8s into the tracked view during seating, before deck setup and any fuse. Late joins use snapshot intro time; spectators retain the global view.

Takeover:

1. All three rounds show a smooth lateral push toward the victim to everyone, including the final attack.
2. Use the moving astronaut's pose, a lowered relative look target at `Y 0.672` and a 50° close-up lens.
3. Lock movement/card input.
4. Play the astronaut attack response; the chair stays at its intro anchor.
5. Apply subtle shake only for the local victim.
6. Apply a flashing red UI filter only for the local victim.
7. Smooth return to the local astronaut's tracked view before active play resumes.

## HUD hierarchy

1. Local POINTS and seat ranking.
2. Round, danger and takeover count; no ring-direction arrow in running mode.
3. One ready card and the ordered deck.
4. Large THROW ALIEN action with arrival/range guidance.
5. Optional quick reactions.

## Feedback

- Coins use the owner-delivered GLB at a pivot-corrected 1.5× scale (~0.48m diameter), centered ~0.55m above the floor. They spin 60°/s around their own Y axis, bob ±0.05m and enter with a 0.45s scale bounce. They vanish after authoritative collection or at takeover; there is no optimistic disappearance or pickup decision in rendering.
- Body yaw eases independently of translation at 30/s (~95% of a turn in 100ms), along the shortest rotation. Direction/start/stop edges send immediately; unchanged held intent refreshes at 10Hz. No turning radius or facing-dependent movement arc is added. Movement speed, authoritative contacts and points remain server-owned; initial network latency is not eliminated.
- Screen-relative movement and explicit nearby throwing do not use a seated ring-direction indicator.
- Each name uses one four-vertex camera-facing plane with a semi-transparent pill texture; its width follows the displayed text. Human names are purple and bot names are white.
- Quick reactions display independently above the persistent nameplate. Each square image enters from 50% scale and zero opacity, reaches full scale and opacity, rises slightly, then exits toward 50% scale and zero opacity. It lasts 1.5 seconds, and another press restarts the complete animation even when it repeats the same reaction. Reactions never render as world-space words.
- Score deltas and activated cards appear in a separate camera-facing label directly above the name. The label enters from 50% scale and zero opacity, reaches full scale and opacity, rises, then exits at 50% scale and zero opacity.
- Coin +1 notices alone are 2.2× larger, warm yellow/white with a thicker black outline. Their baseline is Y 1.85 (ordinary notices: 1.652), with up to 0.28m rise. They reach full size/opacity in 0.14s, remain fully visible through 1.55s, then shrink/fade within 2.2s. Repeated pickups restart the notice from the new authoritative sequence. The nameplate is not replaced and no additional points are granted by this animation.
- Danger uses SAFE / DANGER / CRITICAL bands.
- Hidden Watch removes exact time but never removes danger language.
- Chaos must visually read as an intentional reroute, not desynchronization.
- Echo must be labeled as non-attacking.
- Power tiers use green General, red Epic and purple Rare frames. Turbo/Echo appear as floating, bobbing existing-icon pickups rather than deck tiles. Symbiosis uses a short straight-flight marker; the server resolves the first hit immediately, not the visual.
- Shadow reuses its owner's astronaut, running clip and nameplate. The owner and Vacune viewers see a SHADOW suffix; others see the owner's normal name/color. Its last second blinks, then fades over the last 0.3s; a trap hit removes it immediately. See [v6 contract](ROUND_POWERS_AND_LOADOUTS.md).

## Astronaut power materials

- Freeze keeps the current atlas and UV variation, applying a cyan/chilled tint and glossier PBR response. This is an ice-like material treatment, not a newly painted frost/crack texture. A small blue-white color lift aids dark atlas regions; no bloom or outline geometry is added.
- Invisible shows only the owner a 25%-opacity silhouette. Other clients immediately hide the astronaut and its world labels/markers, preserving the existing visibility/privacy rules. Shadows are disabled while invisible; a translucent remote silhouette is never revealed.
- Material entry/exit blends over 0.2s. Ice and ghost effects compose, then restore the authored appearance without changing/reloading the GLB, UVs, skin assignment, skeleton or animation. Stable effects do not rewrite their material every frame; takeover and cleanup remove overrides immediately.
- Native desktop/mobile tests must check alpha sorting, contrast, highlights, name/alien-marker clearance and restoration. Automated checks cannot confirm the final rendered appearance.

## Results

Show match ranking, POINTS, Main Menu and Rematch. Global records are available from the lobby.

## Accessibility

- Essential messages never rely only on red/green.
- Takeover reads without sound.
- Mobile touch targets remain large.
- Reduced-motion mode is a future accessibility item; the current shake is intentionally subtle.

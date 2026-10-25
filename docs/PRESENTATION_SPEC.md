# Presentation Specification

## Art direction

A matte, solid-color, low-poly spaceship interior compatible with the shared atlas. Astronaut proxies retain Decentraland-like body proportions while wearing a unified suit. The alien changes from cute and trusting while idle/held to stylized threatening during takeover, without gore.

## Camera

- Orbit center/look target: `(16, 0.665, 16)`.
- Radius: `3.8556 m`.
- Camera height: `3.15 m`.
- FOV: `50°`.
- Horizontal rotation only through mouse or mobile swipe.
- No free translation, zoom, pitch or UI arrow controls.
- The camera is positioned during countdown before the lobby overlay disappears.

Takeover:

1. Smooth lateral push toward the victim and alien-hand anchor.
2. Preserve the approved camera position and use a lowered look target at `Y 0.672`.
3. Lock orbit input.
4. Play astronaut and seat attack response.
5. Apply subtle shake only for the local victim.
6. Apply a flashing red UI filter only for the local victim.
7. Smooth return before active play resumes.

## HUD hierarchy

1. Local POINTS and seat ranking.
2. Round, arrow-only direction, danger and takeover count.
3. Armed reaction, armed intervention and deck.
4. Large PASS action.
5. Optional quick reactions.

## Feedback

- Direction uses an arrow without redundant direction text.
- Each name uses one four-vertex camera-facing plane with a semi-transparent pill texture; its width follows the displayed text. Human names are purple and bot names are white.
- Quick reactions display independently above the persistent nameplate. Each square image enters from 50% scale and zero opacity, reaches full scale and opacity, rises slightly, then exits toward 50% scale and zero opacity. It lasts 1.5 seconds, and another press restarts the complete animation even when it repeats the same reaction. Reactions never render as world-space words.
- Score deltas and activated cards appear in a separate camera-facing label directly above the name. The label enters from 50% scale and zero opacity, reaches full scale and opacity, rises, then exits at 50% scale and zero opacity.
- Danger uses SAFE / DANGER / CRITICAL bands.
- Hidden Watch removes exact time but never removes danger language.
- Chaos must visually read as an intentional reroute, not desynchronization.
- Echo must be labeled as non-attacking.

## Results

Show match ranking, POINTS, Main Menu and Rematch. Global records are available from the lobby.

## Accessibility

- Essential messages never rely only on red/green.
- Takeover reads without sound.
- Mobile touch targets remain large.
- Reduced-motion mode is a future accessibility item; the current shake is intentionally subtle.

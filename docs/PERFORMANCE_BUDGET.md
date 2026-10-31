# Mobile Performance Budget

## Geometry targets

- Environment and fixed props: up to 8,000 triangles.
- Egg and hatch VFX: up to 2,000 triangles.
- Alien: up to 3,500 triangles.
- Astronaut: up to 3,000 triangles each, 24,000 for eight.
- Seats: one reusable instanced GLB, minimized after visual approval.
- Avoid decorative geometry that does not improve gameplay readability.
- Round coins: ten shared-source GLB instances, 26 triangles each (260 total), with at most twenty runtime entities including pivot roots. No per-coin unique materials, textures or physics colliders.
- Shadow reuses its owner's 3,416-triangle GLB, with at most eight temporary clones (27,328 extra triangles) and no physics colliders. Inspected GLB-only worst case: 16 astronauts × 3,416 + eight chairs × 166 + environment 1,142 + coins 260 = **57,386 triangles**, before name/marker/primitive geometry. This approaches six parcels' 60,000 guidance. Native mobile frame pacing and the final alien/VFX budget need review; no automatic GLB reduction or parcel expansion is approved.
- Rare board pickups and Symbiosis flight use existing-icon billboard quads, not additional 3D assets. Clone records and render entities expire at takeover/menu cleanup; natural exit blinks/fades during the existing five-second life.

## Materials and textures

Strict authored material set for future exports:

- `MAT_AZ_ATLAS_OPAQUE`
- `MAT_AZ_ATLAS_TINT`
- `MAT_AZ_ATLAS_EMISSIVE`

Use one shared color atlas. Avoid large alpha surfaces, custom shaders, per-player materials and runtime texture overrides.

Approved exception: temporary Freeze/Invisible whole-model material overrides reuse this same atlas with no new texture or geometry. Cache stable states and quantize parameter changes during 0.2s transitions. Only the owner needs a visible alpha-blended astronaut; remote invisible proxies remain hidden with shadows disabled. Delete overrides on expiry/takeover/cleanup. Native mobile transparency/draw-cost checks are still required.

## Animation

- Skeletal clips only for MVP.
- Minimize bones that do not contribute to silhouette or deformation.
- No finger rigs unless the final silhouette requires them.
- Reuse identical astronaut topology/rigging across eight UV-variant GLBs and one seat GLB across all seats.
- World-space nameplates use one textured quad per seat; never construct rounded backgrounds from sphere or cylinder primitives.
- Animation blending runs only on state changes.

## Runtime

- Authoritative snapshots at 10 Hz; unchanged movement intents refresh at 10 Hz and direction/start/stop edges send immediately.
- Open-room bot plans update at 4 Hz, using at most 16 candidate escape directions per bot; every role uses the same movement integrator and speed.
- No per-frame networked transforms.
- UI derives from compact snapshots.
- Inactive lobby does not create gameplay actors until countdown.
- Remove arena children when returning to lobby.
- Optional audio or VFX failure must not block the loop.

## Acceptance

- Stable native mobile frame pacing in a full eight-seat match.
- No sustained memory growth after three rematches.
- No missing atlas or GLB requests.
- Takeover camera remains smooth with all actors visible.
- SDK scene limits and build statistics are reviewed before release.

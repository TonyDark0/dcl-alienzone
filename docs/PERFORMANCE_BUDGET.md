# Mobile Performance Budget

## Geometry targets

- Environment and fixed props: up to 8,000 triangles.
- Egg and hatch VFX: up to 2,000 triangles.
- Alien: up to 3,500 triangles.
- Astronaut: up to 3,000 triangles each, 24,000 for eight.
- Seats: one reusable instanced GLB, minimized after visual approval.
- Avoid decorative geometry that does not improve gameplay readability.

## Materials and textures

Strict authored material set for future exports:

- `MAT_AZ_ATLAS_OPAQUE`
- `MAT_AZ_ATLAS_TINT`
- `MAT_AZ_ATLAS_EMISSIVE`

Use one shared color atlas. Avoid large alpha surfaces, custom shaders, per-player materials and runtime texture overrides.

## Animation

- Skeletal clips only for MVP.
- Minimize bones that do not contribute to silhouette or deformation.
- No finger rigs unless the final silhouette requires them.
- Reuse identical astronaut topology/rigging across eight UV-variant GLBs and one seat GLB across all seats.
- World-space nameplates use one textured quad per seat; never construct rounded backgrounds from sphere or cylinder primitives.
- Animation blending runs only on state changes.

## Runtime

- Authoritative snapshots at 5 Hz.
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

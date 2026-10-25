# Animation Contract

## General rules

- Skeletal GLB clips are the supported MVP path.
- VAT is deferred.
- Every clip must be in-place with zero root motion.
- Code controls transforms, pass paths and camera.
- NLA strip and exported animation names must match exactly.
- Blend shapes may be combined with the rig inside authored clips; runtime morph control is not required.

## Astronaut

File: `az_chr_astronaut_base_v001.glb`

Required clips:

- `AST_IDLE_STANDING`
- `AST_SIT_DOWN`
- `AST_IDLE_SEATED`
- `AST_HOLD_SAFE`
- `AST_PASS`
- `AST_TAKEOVER`

No separate recovery clip is required. Code crossfades `AST_TAKEOVER → AST_IDLE_SEATED`.

`AST_HOLD_SAFE` is intentionally a static authored pose. It does not need a longer NLA strip: runtime keeps the clip weighted at 1 for as long as the authoritative seat holds an alien, then crossfades to `AST_PASS` or `AST_IDLE_SEATED`.

The approved body shape is the balanced low-triangle Decentraland-like avatar: medium torso and limbs, elbows near waist, compact boots and animation-safe joints.

## Alien

File: `az_chr_alien_base_v001.glb`

Required clips:

- `ALN_IDLE_CUTE`
- `ALN_HELD_HAPPY`
- `ALN_JUMP_PASS`
- `ALN_CRITICAL`
- `ALN_TAKEOVER_ATTACK`

The attack clip should transform the readable mood from cute to threatening without gore or horror realism. No `ALN_RESET` or `ALN_EXPELLED` clip is required; code blends back to the next valid state.

## Seat

File: `az_prp_astronaut_seat_base_v001.glb`

Required clips:

- `SEAT_IDLE`
- `SEAT_TAKEOVER_RECLINE`

No recovery clip is required. Code blends the reclined pose back into `SEAT_IDLE`.

## Egg and VFX

Egg file: `az_prp_alien_egg_center_v001.glb`

- `EGG_HATCH`

VFX file: `az_vfx_takeover_cloud_v001.glb`

- `VFX_HATCH_BURST`
- `VFX_TAKEOVER_BURST`

## Runtime sequence

- The arena actors load behind the black three-second room-entry countdown; their seating sequence does not advance while covered.
- When that overlay closes, the arena appears with no game HUD. Astronauts remain visibly in `AST_IDLE_STANDING` for one second.
- During the following 6.2-second server phase, code blends into the 3.5667-second `AST_SIT_DOWN` clip. Its final 0.9 seconds overlap a smooth crossfade into `AST_IDLE_SEATED`, completing before the first fuse starts. Tests compare runtime timing against all eight exported GLBs.
- An authoritative holder crossfades into the static `AST_HOLD_SAFE` pose and remains there for the complete hold.
- Every accepted manual or automatic pass triggers the 0.4-second `AST_PASS` clip on its source astronaut, overlapping its ending with the next authoritative seated/holder pose.
- Takeover blends astronaut and seat into their attack poses.
- Runtime crossfades use a quintic ease. Ordinary pose changes blend for approximately 0.3–0.9 seconds; takeover recovery uses 0.75–0.85 seconds.
- The takeover state lasts 5 seconds so the current approximately 3.83-second astronaut clip and its recovery blend complete before the next round or final ranking.
- Camera begins a lateral close-up, may shake for the local victim, then returns smoothly.
- Code crossfades back to idle before the next round.

## Export acceptance

- Clip names match exactly.
- Loops have clean boundaries.
- Non-looping clips do not contain extra idle time.
- No root translation or rotation.
- No duplicate rigs or hidden characters.
- Deformation remains acceptable at the 3,000-triangle astronaut budget.

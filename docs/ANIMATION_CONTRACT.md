# Animation Contract

## Running-mode addition (2026-10-29)

The current server uses running tag after the seated intro. Astronauts move;
chairs stay at their original anchors and scales. The owner supplied both
in-place loops in all eight variant GLBs, verified on 2026-10-29:

- `AST_RUNNING`: ordinary running, currently 0.7333 seconds per cycle.
- `AST_RUNNING_ALIEN`: running with either alien, currently 1.3 seconds per cycle.

Both are registered and looped. Freeze slows server movement and the selected
running clip to 50% for two seconds, rather than stopping them. Turbo speeds
both to 200% until round end when its board pickup is collected. An incoming
Freeze cancels Turbo to normal speed instead of slowing that hit; Vacune
resists Freeze. No separate slow/turbo NLA clips are needed.
The carrying clip is selected even when slowed/boosted. A stationary carrier
holds that loop's current pose at speed 0; ordinary standing uses the authored
standing idle. Crossfades do not reset on each input/snapshot or speed change.

Keep identical rig, rest pose, scale, TEXCOORD_0 and existing variant paths.
Do not export root motion. The code changes no user-authored GLB. Export tests
verify both required running names in every variant; native playtests still
need to check cycle boundaries, foot sliding and transitions.

The existing `AST_TAKEOVER` remains a temporary running-mode attack fallback.
It was authored for seated gameplay and may require a standing adaptation;
do not claim its visual fit has been verified. The seated-only descriptions
below document the retained intro and archived gameplay controller.

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

The current exported seat GLB contains one key per channel in both clips, at
1/24 second. These are static poses, not timed motion clips. Runtime registers
both with `speed: 0` and `loop: true`: the active pose stays alive throughout
the takeover, while a 0.48-second quintic weight blend reclines the chair and a
0.85-second blend returns it to idle. Do not play the reclined pose as a
non-looping one-shot: it can finish before the blend completes and cause a snap.
If a future re-export adds animated motion, review this playback policy instead
of freezing the new timeline. No GLB or chair Transform changes are needed for
the current correction. Native visual verification remains pending; do not launch
Explorer until the owner requests it.

## Egg and VFX

Egg file: `az_prp_alien_egg_center_v001.glb`

- `EGG_HATCH`

VFX file: `az_vfx_takeover_cloud_v001.glb`

- `VFX_HATCH_BURST`
- `VFX_TAKEOVER_BURST`

## Runtime sequence

- The arena actors load behind the black three-second room-entry countdown; their seating sequence does not advance while covered.
- When that overlay closes, the arena appears with no game HUD. Astronauts remain visibly in `AST_IDLE_STANDING` for one second.
- After the seated intro, a separate five-second DECK_SETUP shows the ordered three-card UI. No alien, movement, card activation or fuse starts until this deadline; the seated pose stays visible behind the menu.
- During the following 6.2-second server phase, code blends into the 3.5667-second `AST_SIT_DOWN` clip. Its final 0.9 seconds overlap a smooth crossfade into `AST_IDLE_SEATED`, completing before the first fuse starts. Tests compare runtime timing against all eight exported GLBs.
- An authoritative holder crossfades into the static `AST_HOLD_SAFE` pose and remains there for the complete hold.
- Every accepted manual or automatic pass triggers the 0.4-second `AST_PASS` clip on its source astronaut, overlapping its ending with the next authoritative seated/holder pose.
- Takeover blends astronaut and seat into their attack poses.
- Runtime crossfades use a quintic ease. Ordinary pose changes blend for approximately 0.3–0.9 seconds; takeover recovery uses 0.75–0.85 seconds.
- The takeover state lasts 5 seconds so the current approximately 3.83-second astronaut clip and its recovery blend complete before the next round or final ranking.
- During the same five seconds, the attacked player's five-target containment UI runs over the cinematic. It awards +1 for at least three hits without replacing, restarting or extending the skeletal clips. Containment succeeds narratively for the first two attacks; the final attack ends the match even when its bonus is earned. No new GLB clips are assumed or generated.
- All three rounds show the victim's lateral close-up to everyone, then return smoothly to the local astronaut's tracked drone view (fixed heading, nominal 60°, 10% closer than the previous shared view). Shake, red pulses and tapping remain local-victim-only in every round. The assigned suit reveal/zoom-out plays during the existing visible seating intro and does not extend its clip durations or the later deck setup.
- Code crossfades back to idle before the next round.

## Export acceptance

- Clip names match exactly.
- Loops have clean boundaries.
- Non-looping clips do not contain extra idle time.
- No root translation or rotation.
- No duplicate rigs or hidden characters.
- Deformation remains acceptable at the 3,000-triangle astronaut budget.

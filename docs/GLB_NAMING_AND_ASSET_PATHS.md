# GLB Naming and Asset Paths

## Convention

```text
az_<type>_<description>_v###.<extension>
```

Types:

- `env`: environment
- `chr`: character
- `prp`: prop
- `vfx`: mesh-based visual effect
- `tex`: texture
- `mus`: music
- `sfx`: sound effect
- `concept`: concept art

Use lowercase filenames, underscores, semantic descriptions and three-digit versions. Animation clip and material names remain uppercase.

## Required runtime GLBs

| Asset                      | Filename                                     | Folder                                |
| -------------------------- | -------------------------------------------- | ------------------------------------- |
| Spaceship containment room | `az_env_spaceship_containment_room_v001.glb` | `assets/Models/environment/`          |
| Rigged astronaut           | `az_chr_astronaut_base_v001.glb`             | `assets/Models/characters/astronaut/` |
| Rigged alien               | `az_chr_alien_base_v001.glb`                 | `assets/Models/characters/alien/`     |
| Rigged central egg         | `az_prp_alien_egg_center_v001.glb`           | `assets/Models/gameplay/`             |
| Animated astronaut seat    | `az_prp_astronaut_seat_base_v001.glb`        | `assets/Models/gameplay/`             |
| Rigged takeover VFX        | `az_vfx_takeover_cloud_v001.glb`             | `assets/Models/vfx/`                  |

The environment contains fixed room geometry and props, but not seats, astronauts, alien, egg, cameras or Blender lights. Character and animated prop GLBs must contain one reusable instance, one armature where required, in-place clips and no root motion.

### Astronaut UV constraint

SDK7's `GltfContainer` does not expose a per-instance UV-channel selector. The project therefore uses eight astronaut GLB variants with identical topology, rig, clips, transforms, material name and texture atlas. Each file selects one authored UV layout. At match creation, the runtime deterministically shuffles all eight paths from the authoritative match id and assigns each seat one unique variant for the complete match.

Variant files live in `assets/Models/characters/astronaut/variants/` and follow `az_chr_astronaut_skin_01_v001.glb` through `az_chr_astronaut_skin_08_v001.glb`.

## Shared texture and materials

Runtime atlas:

`assets/Images/textures/az_tex_gameplay_color_atlas_v001.png`

Source atlas:

`art-source/textures/az_tex_gameplay_color_atlas_v001.png`

Future Blender exports must use exactly:

- `MAT_AZ_ATLAS_OPAQUE`
- `MAT_AZ_ATLAS_TINT`
- `MAT_AZ_ATLAS_EMISSIVE`

The three material roles share one atlas. Runtime per-player tint and avatar-derived textures are not used.

Existing GLBs exported before the rebrand may still contain legacy internal material names. They must be migrated in Blender on the next authored export; runtime paths no longer use the legacy filename prefix.

## Coordinates and transforms

- Apply transforms before export.
- Root location and rotation: zero.
- Root scale: one.
- Use meters.
- Positive Y is up.
- Animations stay in place; code controls world movement.
- Remove cameras, Blender lights and unintended hidden meshes.

## Colliders

The game disables locomotion and uses code-level ECS boundaries. Character, seat, alien, egg and VFX GLBs must not contain colliders. The environment may include only simplified colliders if future camera or pointer behavior requires them.

## Current budgets

| Asset group                       |             Maximum triangles |
| --------------------------------- | ----------------------------: |
| Environment including fixed props |                         8,000 |
| Egg and hatch VFX                 |                         2,000 |
| Alien                             |                         3,500 |
| Each astronaut                    |                         3,000 |
| Eight astronauts                  |                        24,000 |
| Seat set                          | minimize and instance one GLB |

Current environment export: approximately 4,170 triangles.

## Validation checklist

- Opens in an independent GLB viewer.
- Correct filename and folder.
- Transform applied.
- No missing texture.
- Only approved materials.
- Required NLA clips present once.
- No root motion.
- No unintended colliders, lights, cameras or duplicate characters.
- Typecheck/build can resolve the runtime path.

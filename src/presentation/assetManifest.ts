export const ASTRONAUT_VARIANT_PATHS = [
  'assets/Models/characters/astronaut/variants/az_chr_astronaut_skin_01_v001.glb',
  'assets/Models/characters/astronaut/variants/az_chr_astronaut_skin_02_v001.glb',
  'assets/Models/characters/astronaut/variants/az_chr_astronaut_skin_03_v001.glb',
  'assets/Models/characters/astronaut/variants/az_chr_astronaut_skin_04_v001.glb',
  'assets/Models/characters/astronaut/variants/az_chr_astronaut_skin_05_v001.glb',
  'assets/Models/characters/astronaut/variants/az_chr_astronaut_skin_06_v001.glb',
  'assets/Models/characters/astronaut/variants/az_chr_astronaut_skin_07_v001.glb',
  'assets/Models/characters/astronaut/variants/az_chr_astronaut_skin_08_v001.glb'
] as const

export const ASSET_PATHS = {
  environment: 'assets/Models/environment/az_env_spaceship_containment_room_v001.glb',
  astronaut: ASTRONAUT_VARIANT_PATHS[0],
  alien: 'assets/Models/characters/alien/az_chr_alien_base_v001.glb',
  alienEgg: 'assets/Models/gameplay/az_prp_alien_egg_center_v001.glb',
  seat: 'assets/Models/gameplay/az_prp_astronaut_seat_base_v001.glb',
  takeoverVfx: 'assets/Models/vfx/az_vfx_takeover_cloud_v001.glb'
} as const

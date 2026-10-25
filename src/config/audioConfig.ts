export const AUDIO_CONFIG = {
  musicFadeSeconds: 0.9,
  lobbyMusic: {
    assetPath: 'assets/Audio/music/az_mus_lobby_containment_loop_v001.mp3',
    volume: 0.46
  },
  matchMusic: {
    // Safe release fallback until the dedicated match mix is exported at its contracted path.
    assetPath: 'assets/Audio/music/az_mus_lobby_containment_loop_v001.mp3',
    volume: 0.48
  },
  ui: {
    highlight: 'assets/Audio/ui/native/dcl_ui_button_highlight.wav',
    press: 'assets/Audio/ui/native/dcl_ui_button_press.wav',
    menu: 'assets/Audio/ui/native/dcl_ui_menu_switch.wav',
    volume: 0.72
  }
} as const

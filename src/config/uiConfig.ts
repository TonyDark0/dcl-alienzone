export const UI_CONFIG = {
  virtualWidth: 1920,
  virtualHeight: 1080,
  // Render the scene UI on the whole screen so modal backdrops also cover the
  // Explorer-reserved desktop rail. Interactive game content is constrained
  // once, inside AlienzoneUiRoot, with the native ScreenInsetArea component.
  screenInset: 'none' as const,
  // The Explorer owns this corner on mobile even inside the reported
  // interactable area. Keep Alienzone actions out of the native buttons.
  nativeBottomRightReserve: 224,
  showUiLabOnBoot: false
} as const

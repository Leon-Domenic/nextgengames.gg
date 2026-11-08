// Settings Manager for NextGenGames Board Brawl
// Handles persistent preferences, live cross-component events, and default configurations

export const SETTINGS_KEYS = {
  MASTER_VOLUME: 'ngg_master_volume',
  MASTER_MUTED: 'ngg_master_muted',
  SFX_VOLUME: 'ngg_audio_sfx_vol',
  SFX_MUTED: 'ngg_audio_sfx_muted',
  MUSIC_VOLUME: 'ngg_audio_music_vol',
  MUSIC_MUTED: 'ngg_audio_music_muted',
  STEPS_AUDIO: 'ngg_audio_steps_enabled',
  AMBIANCE_AUDIO: 'ngg_audio_ambiance_enabled',
  EMOTES_AUDIO: 'ngg_audio_emotes_enabled',
  GRAPHICS_QUALITY: 'ngg_graphics_quality',
  SCREEN_SHAKE: 'ngg_screen_shake_enabled',
  CAMERA_MODE: 'ngg_camera_mode',
  CAMERA_FOLLOW: 'ngg_camera_follow_enabled',
  PARTICLES_ENABLED: 'ngg_particles_enabled',
  HIGH_CONTRAST_TILES: 'ngg_high_contrast_tiles',
  FAST_DICE: 'ngg_fast_dice_enabled',
  RENT_OVERLAYS: 'ngg_rent_overlays_enabled',
  AUTO_END_TURN: 'ngg_auto_end_turn',
  CONFIRM_ACTIONS: 'ngg_confirm_high_value_actions',
  STREAMER_MODE: 'ngg_streamer_mode',
};

export const DEFAULT_SETTINGS = {
  masterVolume: 100,
  masterMuted: false,
  sfxVolume: 80,
  sfxMuted: false,
  musicVolume: 45,
  musicMuted: true,
  stepsAudio: true,
  ambianceAudio: true,
  emotesAudio: true,
  graphicsQuality: 'high', // 'low' | 'medium' | 'high'
  screenShake: true,
  cameraMode: 'follow', // 'isometric' | 'follow' | 'topdown'
  cameraFollow: true,
  particlesEnabled: true,
  highContrastTiles: false,
  fastDiceRoll: false,
  showRentOverlays: true,
  autoEndTurn: false,
  confirmHighValueActions: true,
  streamerMode: false,
};

// Safe localStorage access
export function getSavedSetting(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultValue;
    if (typeof defaultValue === 'boolean') return val === 'true';
    if (typeof defaultValue === 'number') {
      const num = Number(val);
      return isNaN(num) ? defaultValue : num;
    }
    return val;
  } catch (e) {
    return defaultValue;
  }
}

export function saveSetting(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, String(value));
    window.dispatchEvent(new CustomEvent('ngg_settings_changed', {
      detail: { key, value }
    }));
  } catch (e) {
    console.warn('Failed to save setting:', key, e);
  }
}

export function getAllSettings() {
  return {
    masterVolume: getSavedSetting(SETTINGS_KEYS.MASTER_VOLUME, DEFAULT_SETTINGS.masterVolume),
    masterMuted: getSavedSetting(SETTINGS_KEYS.MASTER_MUTED, DEFAULT_SETTINGS.masterMuted),
    sfxVolume: getSavedSetting(SETTINGS_KEYS.SFX_VOLUME, DEFAULT_SETTINGS.sfxVolume),
    sfxMuted: getSavedSetting(SETTINGS_KEYS.SFX_MUTED, DEFAULT_SETTINGS.sfxMuted),
    musicVolume: getSavedSetting(SETTINGS_KEYS.MUSIC_VOLUME, DEFAULT_SETTINGS.musicVolume),
    musicMuted: getSavedSetting(SETTINGS_KEYS.MUSIC_MUTED, DEFAULT_SETTINGS.musicMuted),
    stepsAudio: getSavedSetting(SETTINGS_KEYS.STEPS_AUDIO, DEFAULT_SETTINGS.stepsAudio),
    ambianceAudio: getSavedSetting(SETTINGS_KEYS.AMBIANCE_AUDIO, DEFAULT_SETTINGS.ambianceAudio),
    emotesAudio: getSavedSetting(SETTINGS_KEYS.EMOTES_AUDIO, DEFAULT_SETTINGS.emotesAudio),
    graphicsQuality: getSavedSetting(SETTINGS_KEYS.GRAPHICS_QUALITY, DEFAULT_SETTINGS.graphicsQuality),
    screenShake: getSavedSetting(SETTINGS_KEYS.SCREEN_SHAKE, DEFAULT_SETTINGS.screenShake),
    cameraMode: getSavedSetting(SETTINGS_KEYS.CAMERA_MODE, DEFAULT_SETTINGS.cameraMode),
    cameraFollow: getSavedSetting(SETTINGS_KEYS.CAMERA_FOLLOW, DEFAULT_SETTINGS.cameraFollow),
    particlesEnabled: getSavedSetting(SETTINGS_KEYS.PARTICLES_ENABLED, DEFAULT_SETTINGS.particlesEnabled),
    highContrastTiles: getSavedSetting(SETTINGS_KEYS.HIGH_CONTRAST_TILES, DEFAULT_SETTINGS.highContrastTiles),
    fastDiceRoll: getSavedSetting(SETTINGS_KEYS.FAST_DICE, DEFAULT_SETTINGS.fastDiceRoll),
    showRentOverlays: getSavedSetting(SETTINGS_KEYS.RENT_OVERLAYS, DEFAULT_SETTINGS.showRentOverlays),
    autoEndTurn: getSavedSetting(SETTINGS_KEYS.AUTO_END_TURN, DEFAULT_SETTINGS.autoEndTurn),
    confirmHighValueActions: getSavedSetting(SETTINGS_KEYS.CONFIRM_ACTIONS, DEFAULT_SETTINGS.confirmHighValueActions),
    streamerMode: getSavedSetting(SETTINGS_KEYS.STREAMER_MODE, DEFAULT_SETTINGS.streamerMode),
  };
}

export function resetAllSettings() {
  if (typeof window === 'undefined') return;
  try {
    saveSetting(SETTINGS_KEYS.MASTER_VOLUME, DEFAULT_SETTINGS.masterVolume);
    saveSetting(SETTINGS_KEYS.MASTER_MUTED, DEFAULT_SETTINGS.masterMuted);
    saveSetting(SETTINGS_KEYS.SFX_VOLUME, DEFAULT_SETTINGS.sfxVolume);
    saveSetting(SETTINGS_KEYS.SFX_MUTED, DEFAULT_SETTINGS.sfxMuted);
    saveSetting(SETTINGS_KEYS.MUSIC_VOLUME, DEFAULT_SETTINGS.musicVolume);
    saveSetting(SETTINGS_KEYS.MUSIC_MUTED, DEFAULT_SETTINGS.musicMuted);
    saveSetting(SETTINGS_KEYS.STEPS_AUDIO, DEFAULT_SETTINGS.stepsAudio);
    saveSetting(SETTINGS_KEYS.AMBIANCE_AUDIO, DEFAULT_SETTINGS.ambianceAudio);
    saveSetting(SETTINGS_KEYS.EMOTES_AUDIO, DEFAULT_SETTINGS.emotesAudio);
    saveSetting(SETTINGS_KEYS.GRAPHICS_QUALITY, DEFAULT_SETTINGS.graphicsQuality);
    saveSetting(SETTINGS_KEYS.SCREEN_SHAKE, DEFAULT_SETTINGS.screenShake);
    saveSetting(SETTINGS_KEYS.CAMERA_MODE, DEFAULT_SETTINGS.cameraMode);
    saveSetting(SETTINGS_KEYS.CAMERA_FOLLOW, DEFAULT_SETTINGS.cameraFollow);
    saveSetting(SETTINGS_KEYS.PARTICLES_ENABLED, DEFAULT_SETTINGS.particlesEnabled);
    saveSetting(SETTINGS_KEYS.HIGH_CONTRAST_TILES, DEFAULT_SETTINGS.highContrastTiles);
    saveSetting(SETTINGS_KEYS.FAST_DICE, DEFAULT_SETTINGS.fastDiceRoll);
    saveSetting(SETTINGS_KEYS.RENT_OVERLAYS, DEFAULT_SETTINGS.showRentOverlays);
    saveSetting(SETTINGS_KEYS.AUTO_END_TURN, DEFAULT_SETTINGS.autoEndTurn);
    saveSetting(SETTINGS_KEYS.CONFIRM_ACTIONS, DEFAULT_SETTINGS.confirmHighValueActions);
    saveSetting(SETTINGS_KEYS.STREAMER_MODE, DEFAULT_SETTINGS.streamerMode);

    window.dispatchEvent(new CustomEvent('ngg_settings_reset'));
  } catch (e) {
    console.error('Failed to reset settings:', e);
  }
}

export function triggerTestShake() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ngg_test_shake', { detail: { intensity: 'heavy' } }));
}

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { sounds, MUSIC_PLAYLIST } from '@/lib/audio';
import {
  SETTINGS_KEYS,
  DEFAULT_SETTINGS,
  getAllSettings,
  saveSetting,
  resetAllSettings,
  triggerTestShake,
} from '@/lib/settings';
import { CHARACTERS, CHARACTER_MAP } from '@/lib/board-brawl/characters.js';
import { DICE_SKIN_MAP } from '@/lib/board-brawl/diceSkins.js';
import {
  X,
  Volume2,
  Volume1,
  VolumeX,
  Music,
  Sliders,
  Sparkles,
  RotateCcw,
  Monitor,
  Zap,
  Check,
  Gamepad2,
  Info,
  Keyboard,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Eye,
  EyeOff,
  Palette,
  ShieldAlert,
  Compass,
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onOpenCosmetics }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [activeTab, setActiveTab] = useState('audio'); // 'audio' | 'graphics' | 'gameplay' | 'controls' | 'info'

  // Master & Audio state
  const [masterVolume, setMasterVolume] = useState(100);
  const [masterMuted, setMasterMuted] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(80);
  const [musicVolume, setMusicVolume] = useState(45);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Audio specific toggles
  const [stepsAudio, setStepsAudio] = useState(true);
  const [ambianceAudio, setAmbianceAudio] = useState(true);
  const [emotesAudio, setEmotesAudio] = useState(true);

  // Graphics & Visuals state
  const [graphicsQuality, setGraphicsQuality] = useState('high'); // 'low' | 'medium' | 'high'
  const [screenShake, setScreenShake] = useState(true);
  const [cameraMode, setCameraMode] = useState('follow'); // 'isometric' | 'follow' | 'topdown'
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [highContrastTiles, setHighContrastTiles] = useState(false);
  const [showRentOverlays, setShowRentOverlays] = useState(true);

  // Gameplay state
  const [fastDiceRoll, setFastDiceRoll] = useState(false);
  const [autoEndTurn, setAutoEndTurn] = useState(false);
  const [confirmHighValueActions, setConfirmHighValueActions] = useState(true);
  const [streamerMode, setStreamerMode] = useState(false);

  // Cosmetics Equipped state
  const [equippedCharId, setEquippedCharId] = useState('warrior');
  const [equippedDiceSkinId, setEquippedDiceSkinId] = useState('classic_red');

  // Success indicator for reset
  const [showResetNotice, setShowResetNotice] = useState(false);

  // Sync state with soundManager and settings on mount and open
  useEffect(() => {
    if (!isOpen) return;

    const syncState = () => {
      // Audio sync
      setMasterVolume(Math.round(sounds.getMasterVolume ? sounds.getMasterVolume() * 100 : 100));
      setMasterMuted(sounds.isMasterMuted ? sounds.isMasterMuted() : false);
      setSfxVolume(Math.round(sounds.getSfxVolume() * 100));
      setMusicVolume(Math.round(sounds.getMusicVolume() * 100));
      setSfxMuted(sounds.isSfxMuted());
      setMusicMuted(sounds.isMusicMuted());
      if (sounds.getCurrentTrackIndex) {
        setCurrentTrackIndex(sounds.getCurrentTrackIndex());
      }

      // Settings sync
      const s = getAllSettings();
      setStepsAudio(s.stepsAudio);
      setAmbianceAudio(s.ambianceAudio);
      setEmotesAudio(s.emotesAudio);
      setGraphicsQuality(s.graphicsQuality);
      setScreenShake(s.screenShake);
      setCameraMode(s.cameraMode);
      setParticlesEnabled(s.particlesEnabled);
      setHighContrastTiles(s.highContrastTiles);
      setFastDiceRoll(s.fastDiceRoll);
      setShowRentOverlays(s.showRentOverlays);
      setAutoEndTurn(s.autoEndTurn);
      setConfirmHighValueActions(s.confirmHighValueActions);
      setStreamerMode(s.streamerMode);

      if (typeof window !== 'undefined') {
        setEquippedCharId(localStorage.getItem('ngg_equipped_character') || 'warrior');
        setEquippedDiceSkinId(localStorage.getItem('ngg_equipped_dice_skin') || 'classic_red');
      }
    };

    syncState();
    const unsubAudio = sounds.subscribe(syncState);

    const handleSettingsChanged = () => syncState();
    window.addEventListener('ngg_settings_changed', handleSettingsChanged);

    return () => {
      unsubAudio();
      window.removeEventListener('ngg_settings_changed', handleSettingsChanged);
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Audio Handlers
  const handleMasterVolumeChange = (e) => {
    const val = Number(e.target.value);
    setMasterVolume(val);
    if (sounds.setMasterVolume) sounds.setMasterVolume(val / 100);
    saveSetting(SETTINGS_KEYS.MASTER_VOLUME, val);
  };

  const handleToggleMasterMute = () => {
    if (sounds.setMasterMuted) {
      const newMuted = sounds.setMasterMuted(!masterMuted);
      setMasterMuted(newMuted);
      saveSetting(SETTINGS_KEYS.MASTER_MUTED, newMuted);
    }
  };

  const handleSfxChange = (e) => {
    const val = Number(e.target.value);
    setSfxVolume(val);
    sounds.setSfxVolume(val / 100);
    saveSetting(SETTINGS_KEYS.SFX_VOLUME, val);
  };

  const handleSfxCommit = () => {
    sounds.playTestSfx();
  };

  const handleToggleSfxMute = () => {
    const newMuted = sounds.toggleSfxMute();
    setSfxMuted(newMuted);
    saveSetting(SETTINGS_KEYS.SFX_MUTED, newMuted);
  };

  const handleMusicChange = (e) => {
    const val = Number(e.target.value);
    setMusicVolume(val);
    sounds.setMusicVolume(val / 100);
    saveSetting(SETTINGS_KEYS.MUSIC_VOLUME, val);
  };

  const handleToggleMusic = () => {
    const isPlaying = sounds.toggleMusic();
    setMusicMuted(!isPlaying);
    saveSetting(SETTINGS_KEYS.MUSIC_MUTED, !isPlaying);
  };

  const handleTrackChange = (index) => {
    if (sounds.setTrack) {
      sounds.setTrack(index);
      setCurrentTrackIndex(index);
    }
  };

  const handleNextTrack = () => {
    if (sounds.nextTrack) {
      sounds.nextTrack();
      if (sounds.getCurrentTrackIndex) setCurrentTrackIndex(sounds.getCurrentTrackIndex());
    }
  };

  const handlePrevTrack = () => {
    if (sounds.prevTrack) {
      sounds.prevTrack();
      if (sounds.getCurrentTrackIndex) setCurrentTrackIndex(sounds.getCurrentTrackIndex());
    }
  };

  // Specific Audio Handlers
  const handleToggleStepsAudio = () => {
    const newVal = !stepsAudio;
    setStepsAudio(newVal);
    saveSetting(SETTINGS_KEYS.STEPS_AUDIO, newVal);
  };

  const handleToggleAmbianceAudio = () => {
    const newVal = !ambianceAudio;
    setAmbianceAudio(newVal);
    saveSetting(SETTINGS_KEYS.AMBIANCE_AUDIO, newVal);
  };

  const handleToggleEmotesAudio = () => {
    const newVal = !emotesAudio;
    setEmotesAudio(newVal);
    saveSetting(SETTINGS_KEYS.EMOTES_AUDIO, newVal);
  };

  // Visuals Handlers
  const handleSelectGraphicsQuality = (quality) => {
    setGraphicsQuality(quality);
    saveSetting(SETTINGS_KEYS.GRAPHICS_QUALITY, quality);
  };

  const handleSelectCameraMode = (mode) => {
    setCameraMode(mode);
    saveSetting(SETTINGS_KEYS.CAMERA_MODE, mode);
  };

  const handleToggleScreenShake = () => {
    const newVal = !screenShake;
    setScreenShake(newVal);
    saveSetting(SETTINGS_KEYS.SCREEN_SHAKE, newVal);
  };

  const handleToggleParticles = () => {
    const newVal = !particlesEnabled;
    setParticlesEnabled(newVal);
    saveSetting(SETTINGS_KEYS.PARTICLES_ENABLED, newVal);
  };

  const handleToggleHighContrast = () => {
    const newVal = !highContrastTiles;
    setHighContrastTiles(newVal);
    saveSetting(SETTINGS_KEYS.HIGH_CONTRAST_TILES, newVal);
  };

  const handleToggleRentOverlays = () => {
    const newVal = !showRentOverlays;
    setShowRentOverlays(newVal);
    saveSetting(SETTINGS_KEYS.RENT_OVERLAYS, newVal);
  };

  // Gameplay Handlers
  const handleToggleFastDice = () => {
    const newVal = !fastDiceRoll;
    setFastDiceRoll(newVal);
    saveSetting(SETTINGS_KEYS.FAST_DICE, newVal);
  };

  const handleToggleAutoEndTurn = () => {
    const newVal = !autoEndTurn;
    setAutoEndTurn(newVal);
    saveSetting(SETTINGS_KEYS.AUTO_END_TURN, newVal);
  };

  const handleToggleConfirmActions = () => {
    const newVal = !confirmHighValueActions;
    setConfirmHighValueActions(newVal);
    saveSetting(SETTINGS_KEYS.CONFIRM_ACTIONS, newVal);
  };

  const handleToggleStreamerMode = () => {
    const newVal = !streamerMode;
    setStreamerMode(newVal);
    saveSetting(SETTINGS_KEYS.STREAMER_MODE, newVal);
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    resetAllSettings();
    if (sounds.setMasterVolume) sounds.setMasterVolume(1.0);
    if (sounds.setMasterMuted) sounds.setMasterMuted(false);
    sounds.setSfxVolume(0.8);
    sounds.setMusicVolume(0.45);
    sounds.setSfxMuted(false);

    setMasterVolume(100);
    setMasterMuted(false);
    setSfxVolume(80);
    setMusicVolume(45);
    setSfxMuted(false);
    setStepsAudio(true);
    setAmbianceAudio(true);
    setEmotesAudio(true);
    setGraphicsQuality('high');
    setScreenShake(true);
    setCameraMode('follow');
    setParticlesEnabled(true);
    setHighContrastTiles(false);
    setFastDiceRoll(false);
    setShowRentOverlays(true);
    setAutoEndTurn(false);
    setConfirmHighValueActions(true);
    setStreamerMode(false);

    sounds.playTestSfx();
    setShowResetNotice(true);
    setTimeout(() => setShowResetNotice(false), 2500);
  };

  const currentTrack = MUSIC_PLAYLIST[currentTrackIndex] || MUSIC_PLAYLIST[0];
  const equippedChar = CHARACTER_MAP[equippedCharId] || CHARACTERS[0];
  const equippedDice = DICE_SKIN_MAP[equippedDiceSkinId] || { name: 'Classic Red', icon: '🎲' };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '740px',
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 48px)',
          margin: 'auto',
          background: '#ffffff',
          borderRadius: '24px',
          border: '3px solid #38bdf8',
          boxShadow: '0 25px 75px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          animation: 'settingsModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Ribbon Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #0f172a 100%)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '3px solid #38bdf8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(56, 189, 248, 0.45)',
                color: '#0c4a6e',
              }}
            >
              <Sliders size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                GAME SETTINGS
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.25)',
                    border: '1px solid #38bdf8',
                    color: '#e0f2fe',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                  }}
                >
                  LIVE
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#bae6fd', fontWeight: 600 }}>
                Board Brawl Audio, Visuals, Gameplay Rules & Keybinds
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Settings"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 5-Tab Segmented Navigation */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'audio', label: 'Audio & Jukebox', icon: Volume2 },
            { id: 'graphics', label: 'Visuals & 3D', icon: Monitor },
            { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
            { id: 'controls', label: 'Keybinds', icon: Keyboard },
            { id: 'info', label: 'About & Loadout', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  sounds.playPawnStep?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: isActive ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: isActive ? '#e0f2fe' : '#ffffff',
                  color: isActive ? '#0369a1' : '#64748b',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.18)' : 'none',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* TAB 1: AUDIO & JUKEBOX */}
          {activeTab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Master Volume Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={handleToggleMasterMute}
                      title={masterMuted ? 'Unmute Master' : 'Mute Master Audio'}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        border: 'none',
                        background: masterMuted ? '#fee2e2' : '#e0f2fe',
                        color: masterMuted ? '#ef4444' : '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {masterMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        Master Volume
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Global game audio level scaling all sound channels
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: masterMuted ? '#fee2e2' : '#0284c7',
                      color: masterMuted ? '#b91c1c' : '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      minWidth: '58px',
                      textAlign: 'center',
                    }}
                  >
                    {masterMuted ? 'MUTED' : `${masterVolume}%`}
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterMuted ? 0 : masterVolume}
                  onChange={handleMasterVolumeChange}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '6px',
                    outline: 'none',
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                    background: `linear-gradient(to right, #0284c7 0%, #38bdf8 ${
                      masterMuted ? 0 : masterVolume
                    }%, #cbd5e1 ${masterMuted ? 0 : masterVolume}%, #cbd5e1 100%)`,
                  }}
                />
              </div>

              {/* Sound Effects (SFX) Volume Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={handleToggleSfxMute}
                      title={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        border: 'none',
                        background: sfxMuted ? '#fee2e2' : '#e0f2fe',
                        color: sfxMuted ? '#ef4444' : '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {sfxMuted || sfxVolume === 0 ? (
                        <VolumeX size={20} />
                      ) : sfxVolume < 50 ? (
                        <Volume1 size={20} />
                      ) : (
                        <Volume2 size={20} />
                      )}
                    </button>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        Sound Effects Volume
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Dice rolls, pawn steps, cash register, landmark builds & surges
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: sfxMuted ? '#f1f5f9' : '#0284c7',
                      color: sfxMuted ? '#94a3b8' : '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      minWidth: '58px',
                      textAlign: 'center',
                    }}
                  >
                    {sfxMuted ? 'MUTED' : `${sfxVolume}%`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxMuted ? 0 : sfxVolume}
                    onChange={handleSfxChange}
                    onMouseUp={handleSfxCommit}
                    onTouchEnd={handleSfxCommit}
                    style={{
                      flex: 1,
                      height: '8px',
                      borderRadius: '6px',
                      outline: 'none',
                      accentColor: '#0284c7',
                      cursor: 'pointer',
                      background: `linear-gradient(to right, #0284c7 0%, #38bdf8 ${
                        sfxMuted ? 0 : sfxVolume
                      }%, #cbd5e1 ${sfxMuted ? 0 : sfxVolume}%, #cbd5e1 100%)`,
                    }}
                  />

                  <button
                    onClick={() => sounds.playTestSfx()}
                    title="Play Test SFX"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#ffffff',
                      border: '1px solid #38bdf8',
                      borderRadius: '10px',
                      color: '#0284c7',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
                    }}
                  >
                    <Sparkles size={14} color="#0284c7" />
                    Test SFX
                  </button>
                </div>
              </div>

              {/* Jukebox & Background Music Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '2px solid #a7f3d0',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: '#dcfce7',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Music size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#064e3b' }}>
                        Board Brawl Jukebox & Music
                      </div>
                      <div style={{ fontSize: '12px', color: '#047857' }}>
                        Original soundtrack playlist & ambient background audio
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: musicMuted ? '#f1f5f9' : '#10b981',
                      color: musicMuted ? '#94a3b8' : '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      minWidth: '58px',
                      textAlign: 'center',
                    }}
                  >
                    {musicMuted ? 'PAUSED' : `${musicVolume}%`}
                  </div>
                </div>

                {/* Track Title Display & Selector */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bbf7d0',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: musicMuted ? '#cbd5e1' : '#10b981',
                        boxShadow: musicMuted ? 'none' : '0 0 8px #10b981',
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        🎵 {currentTrack.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Track {currentTrackIndex + 1} of {MUSIC_PLAYLIST.length}
                      </div>
                    </div>
                  </div>

                  {/* Playback Controls (Prev, Play/Pause, Next) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={handlePrevTrack}
                      title="Previous Track"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <SkipBack size={14} />
                    </button>

                    <button
                      onClick={handleToggleMusic}
                      title={musicMuted ? 'Play Music' : 'Pause Music'}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: musicMuted ? '#10b981' : '#f43f5e',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {musicMuted ? <Play size={14} /> : <Pause size={14} />}
                      {musicMuted ? 'Play' : 'Pause'}
                    </button>

                    <button
                      onClick={handleNextTrack}
                      title="Next Track"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <SkipForward size={14} />
                    </button>
                  </div>
                </div>

                {/* Track Selector Dropdown */}
                <select
                  value={currentTrackIndex}
                  onChange={(e) => handleTrackChange(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #a7f3d0',
                    background: '#ffffff',
                    color: '#064e3b',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {MUSIC_PLAYLIST.map((t, idx) => (
                    <option key={t.id} value={idx}>
                      {idx + 1}. {t.title}
                    </option>
                  ))}
                </select>

                {/* Music Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicMuted ? 0 : musicVolume}
                  onChange={handleMusicChange}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '6px',
                    outline: 'none',
                    accentColor: '#10b981',
                    cursor: 'pointer',
                    background: `linear-gradient(to right, #10b981 0%, #34d399 ${
                      musicMuted ? 0 : musicVolume
                    }%, #cbd5e1 ${musicMuted ? 0 : musicVolume}%, #cbd5e1 100%)`,
                  }}
                />
              </div>

              {/* Individual Audio Category Toggles */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                {/* Steps SFX */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Pawn Footsteps</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Hop audio on tiles</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={stepsAudio}
                    onChange={handleToggleStepsAudio}
                    style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                </div>

                {/* Ambiance SFX */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>City Ambiance</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Crowd & festival murmur</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={ambianceAudio}
                    onChange={handleToggleAmbianceAudio}
                    style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                </div>

                {/* Emotes SFX */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Emote Chimes</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Tomato & reaction sounds</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emotesAudio}
                    onChange={handleToggleEmotesAudio}
                    style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISUALS & 3D GRAPHICS */}
          {activeTab === 'graphics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 3D Render Quality */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    3D Board Render Quality
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Adjust shadow resolution, antialiasing passes, and WebGL pixel ratio
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'low', name: 'Standard', desc: 'Battery Saver / 30FPS' },
                    { id: 'medium', name: 'Enhanced', desc: 'Balanced / 60FPS' },
                    { id: 'high', name: 'Ultra 60FPS', desc: 'Soft Shadows / 2x Sampling' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectGraphicsQuality(q.id)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '14px',
                        border: graphicsQuality === q.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: graphicsQuality === q.id ? '#e0f2fe' : '#ffffff',
                        color: graphicsQuality === q.id ? '#0369a1' : '#475569',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontWeight: 900, fontSize: '14px' }}>{q.name}</span>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{q.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Perspective Mode */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Compass size={20} color="#0284c7" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      Camera Framing & Tracking
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Select your preferred perspective angle over the tabletop board
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'follow', name: 'Dynamic Follow', desc: 'Auto-centers moving pawns' },
                    { id: 'isometric', name: 'Isometric 45°', desc: 'Classic diamond perspective' },
                    { id: 'topdown', name: 'Top-Down 2D', desc: "Tactical bird's eye view" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectCameraMode(m.id)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '14px',
                        border: cameraMode === m.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: cameraMode === m.id ? '#e0f2fe' : '#ffffff',
                        color: cameraMode === m.id ? '#0369a1' : '#475569',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontWeight: 900, fontSize: '14px' }}>{m.name}</span>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Shake FX with Live Preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: '#fef08a',
                      color: '#ca8a04',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      Screen Shake Rumble FX
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Kinetic impact on doubles surges, demolitions, and bankruptcy
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {screenShake && (
                    <button
                      onClick={() => triggerTestShake()}
                      title="Test Screen Shake Live"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1px solid #ca8a04',
                        background: '#fef9c3',
                        color: '#a16207',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Test Shake
                    </button>
                  )}

                  <button
                    onClick={handleToggleScreenShake}
                    style={{
                      width: '52px',
                      height: '30px',
                      borderRadius: '15px',
                      background: screenShake ? '#0284c7' : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: screenShake ? '25px' : '3px',
                        transition: 'left 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Rent Value Badges on Tiles */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Tile Rent Value Badges
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Permanently show rental cost pills directly over developed city tiles
                  </div>
                </div>

                <button
                  onClick={handleToggleRentOverlays}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    background: showRentOverlays ? '#0284c7' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: showRentOverlays ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>

              {/* Ambient Particles & Confetti */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Celebration Confetti & Particles
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Victory fireworks, card sparks, and doubles celebration explosions
                  </div>
                </div>

                <button
                  onClick={handleToggleParticles}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    background: particlesEnabled ? '#0284c7' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: particlesEnabled ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>

              {/* High-Contrast Ownership Borders */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    High-Contrast Property Outlines
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Enhance visibility of player ownership colors for color-blind accessibility
                  </div>
                </div>

                <button
                  onClick={handleToggleHighContrast}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    background: highContrastTiles ? '#0284c7' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: highContrastTiles ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GAMEPLAY */}
          {activeTab === 'gameplay' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Roll Mode */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: '#dcfce7',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      Quick Roll Mode
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Fast-forward 3D dice physics and reduce bounce duration to 300ms
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleToggleFastDice}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    background: fastDiceRoll ? '#0284c7' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: fastDiceRoll ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>

              {/* Auto-End Turn */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Auto-Pass Empty Turns
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Automatically conclude your turn when landing on neutral tiles with no actions
                  </div>
                </div>

                <button
                  onClick={handleToggleAutoEndTurn}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    background: autoEndTurn ? '#0284c7' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: autoEndTurn ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>

              {/* High-Stakes Action Confirmation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Confirm High-Stakes Actions
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Require confirmation popup before mortgaging assets or playing high-cost cards
                  </div>
                </div>

                <button
                  onClick={handleToggleConfirmActions}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    background: confirmHighValueActions ? '#0284c7' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: confirmHighValueActions ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>

              {/* Streamer Mode */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: '#e0e7ff',
                      color: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {streamerMode ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      Streamer Privacy Mode
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Mask room join code (`BB-****`) in HUD to prevent Twitch stream sniping
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleToggleStreamerMode}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    background: streamerMode ? '#0284c7' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: streamerMode ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CONTROLS & KEYBINDS */}
          {activeTab === 'controls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Master keyboard shortcuts and gestures for rapid, competitive tabletop gameplay:
              </div>

              {/* Keyboard Shortcuts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { key: 'SPACE', desc: 'Roll 3D Dice / Pass Turn' },
                  { key: 'C', desc: 'Toggle Action Cards Dock' },
                  { key: 'E', desc: 'Open Emote & Reaction Wheel' },
                  { key: 'S', desc: 'Open Game Settings Menu' },
                  { key: 'M', desc: 'Quick Master Audio Mute' },
                  { key: 'ESC', desc: 'Close Modals / Deselect' },
                ].map((binding) => (
                  <div
                    key={binding.key}
                    style={{
                      padding: '14px 18px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                      {binding.desc}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '8px',
                        fontWeight: 900,
                        fontSize: '12px',
                        color: '#0f172a',
                        boxShadow: '0 2px 0 #94a3b8',
                        fontFamily: 'monospace',
                      }}
                    >
                      {binding.key}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mouse & Touch Gestures */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1px solid #a7f3d0',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#065f46' }}>
                  🖱️ 3D Board Camera Gestures
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#047857' }}>
                  <div>• <b>Left Click & Drag</b>: Orbit / tilt camera around the diamond board</div>
                  <div>• <b>Mouse Scroll Wheel / Pinch</b>: Zoom in on property tiles or zoom out for overview</div>
                  <div>• <b>Right Click & Drag</b>: Smoothly pan across tabletop quadrants</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ABOUT & LOADOUT */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Equipped Loadout Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '2px solid #93c5fd',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: '#ffffff',
                      border: '2px solid #60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)',
                    }}
                  >
                    {equippedChar.avatar || '⚔️'}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>
                      Current Loadout
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                      {equippedChar.name} &bull; {equippedDice.icon || '🎲'} {equippedDice.name}
                    </div>
                  </div>
                </div>

                {onOpenCosmetics && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCosmetics();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                    }}
                  >
                    <Palette size={14} />
                    Cosmetics Shop
                  </button>
                )}
              </div>

              {/* Game Version & Engine Info */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                  🎲 NextGenGames Board Brawl
                </div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                  Board Brawl is an arcade tabletop multiplayer game inspired by Business Tour and Monopoly,
                  featuring 3D physics dice, tactical action cards, city development, and real-time multiplayer showdowns.
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                    }}
                  >
                    v2.4.0 Live
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Engine: Three.js WebGL & Socket.IO
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Platform: NextGenGames.gg
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Reset & Done) */}
        <div
          style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleResetDefaults}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {showResetNotice && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#10b981',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                <Check size={14} /> Defaults Restored!
              </span>
            )}

            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                transition: 'transform 0.1s ease',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

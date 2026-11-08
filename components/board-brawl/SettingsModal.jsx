'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '@/lib/audio';
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
  Info
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('audio'); // 'audio' | 'gameplay' | 'info'

  // Audio state
  const [sfxVolume, setSfxVolumeState] = useState(80);
  const [musicVolume, setMusicVolumeState] = useState(45);
  const [sfxMuted, setSfxMutedState] = useState(false);
  const [musicMuted, setMusicMutedState] = useState(true);

  // Gameplay & Visuals state
  const [screenShake, setScreenShake] = useState(true);
  const [autoFollowPawn, setAutoFollowPawn] = useState(true);
  const [fastDiceRoll, setFastDiceRoll] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState('high'); // 'low' | 'medium' | 'high'
  const [showRentOverlays, setShowRentOverlays] = useState(true);

  // Success indicator for reset
  const [showResetNotice, setShowResetNotice] = useState(false);

  // Sync state with soundManager on mount and subscription
  useEffect(() => {
    const syncAudioState = () => {
      setSfxVolumeState(Math.round(sounds.getSfxVolume() * 100));
      setMusicVolumeState(Math.round(sounds.getMusicVolume() * 100));
      setSfxMutedState(sounds.isSfxMuted());
      setMusicMutedState(sounds.isMusicMuted());
    };

    syncAudioState();
    const unsubscribe = sounds.subscribe(syncAudioState);

    // Load gameplay preferences from localStorage
    if (typeof window !== 'undefined') {
      try {
        const shake = localStorage.getItem('ngg_screen_shake_enabled');
        if (shake !== null) setScreenShake(shake === 'true');

        const follow = localStorage.getItem('ngg_camera_follow_enabled');
        if (follow !== null) setAutoFollowPawn(follow === 'true');

        const fast = localStorage.getItem('ngg_fast_dice_enabled');
        if (fast !== null) setFastDiceRoll(fast === 'true');

        const quality = localStorage.getItem('ngg_graphics_quality');
        if (quality !== null) setGraphicsQuality(quality);

        const rent = localStorage.getItem('ngg_rent_overlays_enabled');
        if (rent !== null) setShowRentOverlays(rent === 'true');
      } catch (e) {}
    }

    return () => unsubscribe();
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

  if (!isOpen) return null;

  // Handlers
  const handleSfxChange = (e) => {
    const val = Number(e.target.value);
    setSfxVolumeState(val);
    sounds.setSfxVolume(val / 100);
  };

  const handleSfxCommit = () => {
    // Play a preview sound when releasing the slider
    sounds.playTestSfx();
  };

  const handleToggleSfxMute = () => {
    const newMuted = sounds.toggleSfxMute();
    setSfxMutedState(newMuted);
  };

  const handleMusicChange = (e) => {
    const val = Number(e.target.value);
    setMusicVolumeState(val);
    sounds.setMusicVolume(val / 100);
  };

  const handleToggleMusic = () => {
    const isPlaying = sounds.toggleMusic();
    setMusicMutedState(!isPlaying);
  };

  const handleToggleScreenShake = () => {
    const newVal = !screenShake;
    setScreenShake(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ngg_screen_shake_enabled', String(newVal));
    }
  };

  const handleToggleAutoFollow = () => {
    const newVal = !autoFollowPawn;
    setAutoFollowPawn(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ngg_camera_follow_enabled', String(newVal));
    }
  };

  const handleToggleFastDice = () => {
    const newVal = !fastDiceRoll;
    setFastDiceRoll(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ngg_fast_dice_enabled', String(newVal));
    }
  };

  const handleSelectGraphicsQuality = (quality) => {
    setGraphicsQuality(quality);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ngg_graphics_quality', quality);
    }
  };

  const handleToggleRentOverlays = () => {
    const newVal = !showRentOverlays;
    setShowRentOverlays(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ngg_rent_overlays_enabled', String(newVal));
    }
  };

  const handleResetDefaults = () => {
    sounds.setSfxVolume(0.8);
    sounds.setMusicVolume(0.45);
    sounds.setSfxMuted(false);
    setScreenShake(true);
    setAutoFollowPawn(true);
    setFastDiceRoll(false);
    setGraphicsQuality('high');
    setShowRentOverlays(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ngg_screen_shake_enabled', 'true');
      localStorage.setItem('ngg_camera_follow_enabled', 'true');
      localStorage.setItem('ngg_fast_dice_enabled', 'false');
      localStorage.setItem('ngg_graphics_quality', 'high');
      localStorage.setItem('ngg_rent_overlays_enabled', 'true');
    }

    sounds.playTestSfx();
    setShowResetNotice(true);
    setTimeout(() => setShowResetNotice(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '680px',
          maxWidth: '100%',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '24px',
          border: '3px solid #38bdf8',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header with Cyberpunk Cyan/Blue Ribbon */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
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
                background: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
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
                  letterSpacing: '0.6px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                GAME SETTINGS
              </div>
              <div style={{ fontSize: '12px', color: '#bae6fd', fontWeight: 700 }}>
                Audio, Visuals & Gameplay Controls
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
              border: '1px solid rgba(255, 255, 255, 0.25)',
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

        {/* 2. Sub-Header Tabs */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={() => setActiveTab('audio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'audio' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: activeTab === 'audio' ? '#e0f2fe' : '#ffffff',
              color: activeTab === 'audio' ? '#0369a1' : '#64748b',
              transition: 'all 0.2s ease',
            }}
          >
            <Volume2 size={16} />
            Audio & Sound
          </button>

          <button
            onClick={() => setActiveTab('gameplay')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'gameplay' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: activeTab === 'gameplay' ? '#e0f2fe' : '#ffffff',
              color: activeTab === 'gameplay' ? '#0369a1' : '#64748b',
              transition: 'all 0.2s ease',
            }}
          >
            <Gamepad2 size={16} />
            Gameplay & Graphics
          </button>

          <button
            onClick={() => setActiveTab('info')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'info' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: activeTab === 'info' ? '#e0f2fe' : '#ffffff',
              color: activeTab === 'info' ? '#0369a1' : '#64748b',
              transition: 'all 0.2s ease',
            }}
          >
            <Info size={16} />
            About
          </button>
        </div>

        {/* 3. Modal Body Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* TAB 1: AUDIO */}
          {activeTab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Sound Effects Volume Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={handleToggleSfxMute}
                      title={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
                      style={{
                        width: '38px',
                        height: '38px',
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
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        Sound Effects Volume
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Dice rolls, pawn steps, cash registers, card swooshes, and surges
                      </div>
                    </div>
                  </div>

                  {/* Volume Percentage Badge */}
                  <div
                    style={{
                      background: sfxMuted ? '#f1f5f9' : '#0284c7',
                      color: sfxMuted ? '#94a3b8' : '#ffffff',
                      fontWeight: 800,
                      fontSize: '14px',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      minWidth: '54px',
                      textAlign: 'center',
                    }}
                  >
                    {sfxMuted ? 'MUTED' : `${sfxVolume}%`}
                  </div>
                </div>

                {/* SFX Volume Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

                  {/* Test SFX Button */}
                  <button
                    onClick={() => sounds.playTestSfx()}
                    title="Play Test Sound"
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
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
                    }}
                  >
                    <Sparkles size={14} color="#0284c7" />
                    Test Sound
                  </button>
                </div>
              </div>

              {/* Background Music Volume Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={handleToggleMusic}
                      title={musicMuted ? 'Start / Unmute Music' : 'Mute Music'}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        border: 'none',
                        background: musicMuted ? '#fee2e2' : '#dcfce7',
                        color: musicMuted ? '#ef4444' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {musicMuted || musicVolume === 0 ? (
                        <VolumeX size={20} />
                      ) : (
                        <Music size={20} />
                      )}
                    </button>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        Music Volume
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Board Brawl thematic ambient background soundtrack
                      </div>
                    </div>
                  </div>

                  {/* Volume Percentage Badge */}
                  <div
                    style={{
                      background: musicMuted ? '#f1f5f9' : '#10b981',
                      color: musicMuted ? '#94a3b8' : '#ffffff',
                      fontWeight: 800,
                      fontSize: '14px',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      minWidth: '54px',
                      textAlign: 'center',
                    }}
                  >
                    {musicMuted ? 'PAUSED' : `${musicVolume}%`}
                  </div>
                </div>

                {/* Music Volume Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicMuted ? 0 : musicVolume}
                    onChange={handleMusicChange}
                    style={{
                      flex: 1,
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

                  {/* Music Play/Pause Toggle Button */}
                  <button
                    onClick={handleToggleMusic}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: musicMuted ? '#10b981' : '#fee2e2',
                      border: musicMuted ? '1px solid #059669' : '1px solid #f87171',
                      borderRadius: '10px',
                      color: musicMuted ? '#ffffff' : '#b91c1c',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {musicMuted ? '▶ Play Music' : '❚❚ Pause Music'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GAMEPLAY & GRAPHICS */}
          {activeTab === 'gameplay' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Screen Shake Toggle */}
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
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
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
                      Screen Shake FX
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Camera rumble on doubles surges, demolitions, and landmark constructions
                    </div>
                  </div>
                </div>

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

              {/* Auto Follow Pawn Camera */}
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
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#e0f2fe',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Monitor size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      Dynamic 3D Camera Follow
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Automatically center view on the active pawn when it takes steps
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleToggleAutoFollow}
                  style={{
                    width: '52px',
                    height: '30px',
                    borderRadius: '15px',
                    background: autoFollowPawn ? '#0284c7' : '#cbd5e1',
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
                      left: autoFollowPawn ? '25px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>

              {/* Fast Dice Rolls */}
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
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
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
                      Faster physics calculation and shorter 3D dice bounce duration
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

              {/* Graphics Quality Picker */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    3D Board Render Quality
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Adjust shadow fidelity, lighting passes, and particle count
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {['low', 'medium', 'high'].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSelectGraphicsQuality(q)}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: graphicsQuality === q ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: graphicsQuality === q ? '#e0f2fe' : '#ffffff',
                        color: graphicsQuality === q ? '#0369a1' : '#475569',
                        fontWeight: 800,
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {q === 'low' ? 'Standard' : q === 'medium' ? 'Enhanced' : 'Ultra 60FPS'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  Board Brawl is an arcade tabletop multiplayer game featuring 3D physics dice,
                  tactical action cards, city development, and real-time multiplayer showdowns.
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #e2e8f0',
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
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Engine: Three.js & Socket.IO
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer Actions (Reset & Close) */}
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
    </div>
  );
}

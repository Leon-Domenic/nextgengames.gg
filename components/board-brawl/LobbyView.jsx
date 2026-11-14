'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CHARACTERS } from '@/lib/board-brawl/characters';
import { DICE_SKIN_MAP, DICE_SKINS } from '@/lib/board-brawl/diceSkins';
import { DEFAULT_BOARD_BACKGROUND_ID, getBoardBackground } from '@/lib/board-brawl/boardBackgrounds';
import { sounds } from '@/lib/audio';
import CosmeticsShopModal from '@/components/board-brawl/CosmeticsShopModal';
import SettingsModal from '@/components/board-brawl/SettingsModal';
import EmojiReactionPicker from '@/components/board-brawl/EmojiReactionPicker';
import EmojiReactionBubble from '@/components/board-brawl/EmojiReactionBubble';
import {
  PLAYER_COLOR_FAMILIES,
  ALL_PLAYER_SUBCOLORS,
  resolvePlayerColor,
  getTeamSubcolor
} from '@/lib/board-brawl/types';
import {
  Users, Bot, Play, Copy, CheckCheck, Settings, ShoppingCart, X, Home,
  ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles, Dices, ShoppingBag
} from 'lucide-react';

export const PLAYER_COLORS = [
  { id: 'cyan', name: 'Cyan Sky', hex: '#00f0ff', accent: '#0284c7', headerBg: '#0284c7' },
  { id: 'orange', name: 'Blazing Orange', hex: '#f97316', accent: '#ea580c', headerBg: '#ea580c' },
  { id: 'emerald', name: 'Cyber Emerald', hex: '#10b981', accent: '#059669', headerBg: '#059669' },
  { id: 'gold', name: 'Vegas Gold', hex: '#f59e0b', accent: '#d97706', headerBg: '#d97706' },
  { id: 'purple', name: 'Electric Violet', hex: '#8b5cf6', accent: '#6d28d9', headerBg: '#7c3aed' },
  { id: 'crimson', name: 'Inferno Crimson', hex: '#ef4444', accent: '#b91c1c', headerBg: '#dc2626' },
];

const SLOT_COLORS = PLAYER_COLORS;

export default function LobbyView({
  players = [],
  user,
  isHost: propIsHost,
  roomId,
  mode = 'blitz',
  onChangeMode,
  onAddBot,
  onRemovePlayer,
  onStartGame,
  onChangeCharacter,
  onChangeColor,
  onChangeDiceSkin,
  equippedDiceSkin = 'classic_red',
  onChangeBoardBackground,
  equippedBoardBackground = DEFAULT_BOARD_BACKGROUND_ID,
  onCopyLink,
  copiedLink,
  playerReactions = {},
  onSendReaction,
}) {
  const myPlayer = players.find(p => p.id === user?.id)
    || (players.filter(p => !p.isBot).length === 1 ? players.filter(p => !p.isBot)[0] : players[0]);
  const isHost = propIsHost !== undefined ? propIsHost : Boolean(myPlayer && players[0] && myPlayer.id === players[0].id);
  const myCharIndex = CHARACTERS.findIndex(c => c.id === myPlayer?.avatarToken);
  const [currentCharIdx, setCurrentCharIdx] = useState(myCharIndex >= 0 ? myCharIndex : 0);
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activePickerSlot, setActivePickerSlot] = useState(null);
  const [activeFamilyId, setActiveFamilyId] = useState(null);

  const handlePrevChar = () => {
    const nextIdx = (currentCharIdx - 1 + CHARACTERS.length) % CHARACTERS.length;
    setCurrentCharIdx(nextIdx);
    sounds.playBuy();
    if (onChangeCharacter) {
      onChangeCharacter(CHARACTERS[nextIdx].id);
    }
  };

  const handleNextChar = () => {
    const nextIdx = (currentCharIdx + 1) % CHARACTERS.length;
    setCurrentCharIdx(nextIdx);
    sounds.playBuy();
    if (onChangeCharacter) {
      onChangeCharacter(CHARACTERS[nextIdx].id);
    }
  };

  // Dynamic slots calculation (up to 6 players maximum)
  const maxSlots = 6;
  const hasOpenSlot = players.length < maxSlots;
  const totalCards = players.length + (hasOpenSlot ? 1 : 0);

  // Check if enemy team or opponents are entirely bots
  const mySlotIdx = players.findIndex(p => p && (p.id === user?.id || p.id === myPlayer?.id));
  const myTeamParity = mySlotIdx >= 0 ? (mySlotIdx % 2) : 0;

  // In 3v3 mode, enemy team are slots with opposite parity. In FFA, enemies are all other players.
  const enemyTeamPlayers = mode === '3v3'
    ? players.filter((p, idx) => p && (idx % 2 !== myTeamParity))
    : players.filter((p, idx) => p && idx !== mySlotIdx);
  const isEnemyAllBots = enemyTeamPlayers.length > 0 && enemyTeamPlayers.every(p => p.isBot);

  // Batch helper to set enemy bot team family in 3v3
  const handleSetEnemyTeamFamily = (familyId) => {
    const family = PLAYER_COLOR_FAMILIES.find(f => f.id === familyId) || PLAYER_COLOR_FAMILIES[0];
    const enemyBots = players.map((p, idx) => ({ player: p, slotIdx: idx })).filter(({ player, slotIdx }) => player && (slotIdx % 2 !== myTeamParity) && player.isBot);
    enemyBots.forEach(({ player }, i) => {
      const shade = family.subcolors[i % family.subcolors.length];
      if (onChangeColor) {
        onChangeColor(shade.hex, player.id);
      }
    });
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1260px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
    }}>
      {/* Cosmetics Shop Modal */}
      <CosmeticsShopModal
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        currentUserId={user?.id}
        equippedCharacter={CHARACTERS[currentCharIdx]?.id || 'hat'}
        equippedDiceSkin={equippedDiceSkin}
        equippedBoardBackground={equippedBoardBackground}
        onEquipCharacter={(charId) => {
          const idx = CHARACTERS.findIndex(c => c.id === charId);
          if (idx >= 0) setCurrentCharIdx(idx);
          if (onChangeCharacter) onChangeCharacter(charId);
        }}
        onEquipDiceSkin={(skinId) => {
          if (onChangeDiceSkin) onChangeDiceSkin(skinId);
        }}
        onEquipBoardBackground={(bgId) => {
          if (onChangeBoardBackground) onChangeBoardBackground(bgId);
        }}
        userCash={5000}
        userCoins={50}
      />

      {/* Game Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenCosmetics={() => {
          setShowSettings(false);
          setShowShop(true);
        }}
      />

      {/* 1. Top Business Tour Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        position: 'relative',
      }}>
        {/* Left: Home + User Profile Capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/browsergames"
            title="Return to Games Hub"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#0284c7',
              border: '2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'transform 0.1s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Home size={24} />
          </Link>

          {/* Profile Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
            border: '2px solid #bef264',
            borderRadius: '14px',
            padding: '4px 16px 4px 6px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#1e293b',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}>
              {(() => {
                const char = myPlayer?.avatarToken ? CHARACTERS.find(c => c.id === myPlayer.avatarToken) : null;
                if (char?.avatar) {
                  return <img src={char.avatar} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />;
                }
                return char?.icon || '🎩';
              })()}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {user?.username || myPlayer?.name || 'DOMI'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800 }}>
                <span style={{ color: '#fef08a' }}>🪐 1,500 Space Credits</span>
                <span style={{ color: '#fde047' }}>🪙 10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: PRIVATE TABLE Gold Banner (Business Tour Style) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '-6px',
        }}>
          <div style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
            padding: '10px 48px',
            borderRadius: '10px',
            border: '3px solid #fef08a',
            boxShadow: '0 6px 20px rgba(217, 119, 6, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
          }}>
            <span style={{
              fontSize: '20px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textShadow: '0 2px 4px rgba(146, 64, 14, 0.8), 0 0 10px rgba(254, 240, 138, 0.4)',
            }}>
              PRIVATE TABLE
            </span>
          </div>
        </div>

        {/* Right Action Icons (Shop, Tasks, Settings, Close) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Shopping Bag Button -> Opens Cosmetics Shop */}
          <button
            onClick={() => {
              setShowSettings(false);
              setShowShop(true);
            }}
            title="Open Cosmetics Shop (Characters & 3D Dice Skins)"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#0284c7',
              border: '2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
              position: 'relative',
            }}
          >
            <ShoppingCart size={20} />
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#f59e0b',
              color: '#060709',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              ★
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              sounds.playBuild();
              setShowShop(false);
              setShowSettings(true);
            }}
            title="Game Settings"
            aria-label="Open Settings"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#0284c7',
              border: '2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
              transition: 'transform 0.1s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Settings size={20} />
          </button>

          {/* Close / Leave Button */}
          <Link
            href="/browsergames"
            title="Leave Lobby"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#e11d48',
              border: '2px solid #fda4af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(225, 29, 72, 0.4)',
              textDecoration: 'none',
              transition: 'transform 0.1s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <X size={22} />
          </Link>
        </div>
      </div>

      {/* 2. Secondary Table Settings Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '14px',
        padding: '8px 16px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}>
        {/* Table Room & Password Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
            TABLE SETTINGS
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(148, 163, 184, 0.2)',
            padding: '4px 12px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: '13px',
            color: '#0369a1',
          }}>
            <span>#{roomId}</span>
            <button
              onClick={onCopyLink}
              title="Copy Room Link"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: copiedLink ? '#16a34a' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {copiedLink ? <CheckCheck size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs (Blitz 20m vs Normal 60m) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #bae6fd',
            borderRadius: '10px',
            padding: '3px',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)',
          }}>
            <button
              onClick={() => {
                if (isHost && onChangeMode) {
                  sounds.playBuy();
                  onChangeMode('blitz');
                }
              }}
              title={isHost ? "Switch to 20-Minute Blitz Mode" : "Blitz Mode: 20 Minutes (Host controls)"}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                background: mode === 'blitz' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: mode === 'blitz' ? '#ffffff' : '#64748b',
                border: 'none',
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: isHost ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: mode === 'blitz' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              ⚡ BLITZ (20M)
            </button>
            <button
              onClick={() => {
                if (isHost && onChangeMode) {
                  sounds.playBuy();
                  onChangeMode('normal');
                }
              }}
              title={isHost ? "Switch to 60-Minute Normal Mode" : "Normal Mode: 60 Minutes (Host controls)"}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                background: mode === 'normal' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: mode === 'normal' ? '#ffffff' : '#64748b',
                border: 'none',
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: isHost ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: mode === 'normal' ? '0 2px 8px rgba(245, 158, 11, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              🏆 NORMAL (60M)
            </button>
            <button
              onClick={() => {
                if (isHost && onChangeMode) {
                  sounds.playBuy();
                  onChangeMode('3v3');
                }
              }}
              title={isHost ? "Switch to 3v3 Team Battle Mode (30 Minutes)" : "3v3 Team Mode: 30 Minutes (Host controls)"}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                background: mode === '3v3' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'transparent',
                color: mode === '3v3' ? '#ffffff' : '#64748b',
                border: 'none',
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: isHost ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: mode === '3v3' ? '0 2px 8px rgba(139, 92, 246, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              👥 3V3 TEAMS (30M)
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playBuild();
              setShowSettings(true);
            }}
            title="Open Game Settings"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.85)',
              color: '#475569',
              border: '1.5px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 900,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 0.1s ease',
            }}
          >
            SETTINGS
          </button>
          <button
            onClick={() => {
              setShowSettings(false);
              setShowShop(true);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: '1.5px solid #fef08a',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
          >
            <ShoppingBag size={14} />
            COSMETICS SHOP
          </button>
        </div>
      </div>

      {/* Dynamic Player Grid responsive styling */}
      <style>{`
        .lobby-player-grid {
          display: grid;
          grid-template-columns: repeat(${totalCards}, minmax(0, 1fr));
          gap: ${totalCards >= 6 ? '10px' : (totalCards >= 4 ? '12px' : '16px')};
          width: 100%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 1024px) {
          .lobby-player-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 640px) {
          .lobby-player-grid {
            grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)) !important;
            gap: 10px !important;
          }
        }
      `}</style>

      {/* 3. Up to 6 Character Pedestal Cards (Dynamic) */}
      <div
        className="lobby-player-grid"
        style={{
          flex: 1,
          marginBottom: '24px',
          maxWidth: totalCards <= 2 ? '540px' : (totalCards === 3 ? '780px' : (totalCards === 4 ? '1020px' : '100%')),
          margin: '0 auto 24px auto',
        }}
      >
        {players.map((player, slotIdx) => {
          const isMe = Boolean(player && (player.id === user?.id || player.id === myPlayer?.id));
          const canCustomizeColor = isMe || Boolean(player?.isBot && (isHost || isEnemyAllBots));
          const defaultHex = mode === '3v3'
            ? getTeamSubcolor(slotIdx % 2 === 0 ? 'cyan' : 'crimson', Math.floor(slotIdx / 2)).hex
            : (ALL_PLAYER_SUBCOLORS[slotIdx % ALL_PLAYER_SUBCOLORS.length]?.hex || '#00f0ff');
          const playerColorHex = player?.avatarColor || defaultHex;
          const colorObj = resolvePlayerColor(playerColorHex);
          const slotColor = colorObj;
          const activeChar = isMe
            ? CHARACTERS[currentCharIdx]
            : (player ? (CHARACTERS.find(c => c.id === player.avatarToken) || CHARACTERS[slotIdx % CHARACTERS.length]) : null);
          const activeDiceSkin = isMe
            ? (DICE_SKIN_MAP[equippedDiceSkin] || DICE_SKINS[0])
            : (player?.diceSkin ? (DICE_SKIN_MAP[player.diceSkin] || DICE_SKINS[slotIdx % DICE_SKINS.length]) : DICE_SKINS[slotIdx % DICE_SKINS.length]);

          return (
            <div
              key={player.id}
              style={{
                background: '#ffffff',
                border: isMe ? '3px solid #0284c7' : '2px solid #e2e8f0',
                borderRadius: '20px',
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '430px',
                boxShadow: isMe
                  ? '0 12px 30px rgba(2, 132, 199, 0.25), 0 0 0 2px #38bdf8'
                  : '0 8px 24px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                transition: 'all 0.25s ease',
              }}
            >
              {/* 3v3 Team Alliance Badge */}
              {mode === '3v3' && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: slotIdx % 2 === 0 ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span>{slotIdx % 2 === 0 ? 'TEAM A (CYAN)' : 'TEAM B (CRIMSON)'}</span>
                  <span style={{ opacity: 0.85 }}>•</span>
                  <span>{colorObj.shadeRole || `Slot ${slotIdx + 1}`}</span>
                </div>
              )}

              {/* Card Header Ribbon with Avatar, Username & Remove Button */}
              <div style={{
                background: slotColor.headerBg,
                padding: totalCards >= 6 ? '8px 10px' : '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: totalCards >= 6 ? '8px' : '10px',
                borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
                borderTopLeftRadius: '17px',
                borderTopRightRadius: '17px',
              }}>
                <div
                  onClick={() => setActivePickerSlot(activePickerSlot === slotIdx ? null : slotIdx)}
                  title="Click avatar to react with emoji"
                  style={{
                    width: totalCards >= 6 ? '32px' : '36px',
                    height: totalCards >= 6 ? '32px' : '36px',
                    borderRadius: '10px',
                    background: '#1e293b',
                    border: '2px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: totalCards >= 6 ? '16px' : '18px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {activeChar?.avatar ? (
                    <img
                      src={activeChar.avatar}
                      alt={activeChar.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    activeChar?.icon || '🎩'
                  )}
                  <EmojiReactionBubble reaction={playerReactions?.[player.id]} position="top-left" />
                </div>

                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div
                    title={player.name}
                    style={{
                      fontSize: totalCards >= 6 ? '12px' : '14px',
                      fontWeight: 900,
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {player.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#fef08a', fontWeight: 800 }}>
                    {isMe ? 'YOU' : (player.isBot ? 'SMART AI BOT' : 'PLAYER')}
                  </div>
                </div>

                {/* Right: P1 Badge or Host Kick/Remove Button */}
                {isMe ? (
                  <div style={{
                    background: '#0284c7',
                    border: '1.5px solid #ffffff',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    color: '#fff',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                  }}>
                    P1
                  </div>
                ) : (
                  isHost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playBuy();
                        onRemovePlayer?.(player.id);
                      }}
                      title={player.isBot ? `Remove ${player.name} (Bot)` : `Kick ${player.name}`}
                      aria-label={`Remove ${player.name}`}
                      style={{
                        marginLeft: 'auto',
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: '1.5px solid #ffffff',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                        e.currentTarget.style.transform = 'scale(1.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <X size={15} strokeWidth={2.8} />
                    </button>
                  )
                )}
              </div>

              {/* Character Standee & Carousel Area */}
              <div style={{
                flex: 1,
                background: 'linear-gradient(180deg, #f8fafc 0%, #ede9fe 100%)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: totalCards >= 6 ? '12px 6px' : '16px 10px',
                borderBottomLeftRadius: '17px',
                borderBottomRightRadius: '17px',
              }}>
                {/* Standee Shadow Pedestal */}
                <div style={{
                  position: 'absolute',
                  bottom: '36px',
                  width: totalCards >= 6 ? '100px' : '120px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 70%)',
                }} />

                {/* Left Carousel Arrow (Only for Local Player) */}
                {isMe && (
                  <button
                    onClick={handlePrevChar}
                    title="Previous Character"
                    style={{
                      position: 'absolute',
                      left: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '2px solid #cbd5e1',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      color: '#334155',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}

                {/* Full-Body Standee Visual */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '10px',
                  zIndex: 2,
                  width: '100%',
                }}>
                  {/* Standee Character Avatar Big Icon (Click to React) */}
                  <div
                    onClick={() => setActivePickerSlot(activePickerSlot === slotIdx ? null : slotIdx)}
                    title="Click avatar to react with emoji"
                    style={{
                      position: 'relative',
                      width: totalCards >= 6 ? '82px' : '96px',
                      height: totalCards >= 6 ? '82px' : '96px',
                      borderRadius: totalCards >= 6 ? '20px' : '24px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                      border: `4px solid ${slotColor.hex}`,
                      boxShadow: `0 8px 20px ${slotColor.hex}44`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: totalCards >= 6 ? '44px' : '52px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {activeChar?.avatar ? (
                      <img
                        src={activeChar.avatar}
                        alt={activeChar.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                    ) : (
                      activeChar?.icon || '🎩'
                    )}

                    {/* Reaction Bubble Displayed Next to Avatar */}
                    <EmojiReactionBubble reaction={playerReactions?.[player.id]} position="pedestal" />

                    {/* Reaction Picker Popover */}
                    <EmojiReactionPicker
                      isOpen={activePickerSlot === slotIdx}
                      onClose={() => setActivePickerSlot(null)}
                      onSelectEmoji={(emoji) => onSendReaction?.(player.id, emoji)}
                      position="pedestal"
                      playerName={player.name}
                    />
                  </div>

                  {/* Character Name & Role Title */}
                  <div style={{ textAlign: 'center', width: '100%', padding: '0 4px' }}>
                    <div
                      title={activeChar?.name}
                      style={{
                        fontSize: totalCards >= 6 ? '13px' : '15px',
                        fontWeight: 900,
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {activeChar?.name || 'Tycoon'}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                      {activeChar?.title || 'City Mogul'}
                    </div>
                  </div>

                  {/* Selectable Distinct Player Colors - Hierarchical Family + Subcolor System */}
                  {canCustomizeColor ? (
                    <div style={{
                      marginTop: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 3,
                      width: '100%',
                      maxWidth: '220px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {isMe ? 'Color & Shade' : '🤖 Bot Color'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {mode === '3v3' && player?.isBot && isEnemyAllBots && (
                            <button
                              onClick={() => {
                                sounds.playPawnStep?.();
                                handleSetEnemyTeamFamily(colorObj.familyId || 'crimson');
                              }}
                              title="Set entire enemy bot team to this color family"
                              style={{
                                fontSize: '8px',
                                fontWeight: 800,
                                color: '#0284c7',
                                background: 'rgba(2, 132, 199, 0.1)',
                                border: '1px solid rgba(2, 132, 199, 0.3)',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                cursor: 'pointer',
                              }}
                            >
                              Team All
                            </button>
                          )}
                          <span style={{
                            fontSize: '8px',
                            fontWeight: 900,
                            color: '#ffffff',
                            background: colorObj.headerBg || '#0284c7',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}>
                            {colorObj.shadeRole || 'Primary'}
                          </span>
                        </div>
                      </div>

                      {/* Tier 1: 6 Distinct Color Family Circles */}
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {PLAYER_COLOR_FAMILIES.map((family) => {
                          const isFamilyActive = (colorObj.familyId || 'cyan') === family.id;
                          return (
                            <button
                              key={family.id}
                              onClick={() => {
                                sounds.playPawnStep?.();
                                const targetPlayerId = isMe ? null : player.id;
                                if (colorObj.familyId !== family.id) {
                                  // Switch to the first shade in this family
                                  if (onChangeColor) onChangeColor(family.subcolors[0].hex, targetPlayerId);
                                }
                              }}
                              title={`${family.name}`}
                              style={{
                                width: totalCards >= 6 ? '18px' : '20px',
                                height: totalCards >= 6 ? '18px' : '20px',
                                borderRadius: '50%',
                                background: family.baseHex,
                                border: isFamilyActive ? '2.5px solid #0f172a' : '1.5px solid rgba(0,0,0,0.15)',
                                boxShadow: isFamilyActive ? `0 0 8px ${family.baseHex}, 0 2px 4px rgba(0,0,0,0.25)` : 'none',
                                cursor: 'pointer',
                                transform: isFamilyActive ? 'scale(1.2)' : 'scale(1)',
                                transition: 'all 0.15s ease',
                                outline: 'none',
                                padding: 0,
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Tier 2: 3 Coordinated Subcolors for Active Family */}
                      {(() => {
                        const curFamily = PLAYER_COLOR_FAMILIES.find(f => f.id === (colorObj.familyId || 'cyan')) || PLAYER_COLOR_FAMILIES[0];
                        return (
                          <div style={{
                            display: 'flex',
                            gap: '3px',
                            justifyContent: 'center',
                            background: 'rgba(241, 245, 249, 0.9)',
                            padding: '3px 6px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}>
                            {curFamily.subcolors.map((sub) => {
                              const isSelected = playerColorHex.toLowerCase() === sub.hex.toLowerCase();
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => {
                                    sounds.playPawnStep?.();
                                    const targetPlayerId = isMe ? null : player.id;
                                    if (onChangeColor) onChangeColor(sub.hex, targetPlayerId);
                                  }}
                                  title={`${sub.name} (${sub.shadeRole})`}
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    padding: '2px 4px',
                                    borderRadius: '6px',
                                    background: isSelected ? sub.hex : 'transparent',
                                    border: isSelected ? '1.5px solid #ffffff' : '1px solid transparent',
                                    color: isSelected ? (['gold', 'cyan', 'orange'].includes(curFamily.id) ? '#0f172a' : '#ffffff') : '#475569',
                                    cursor: 'pointer',
                                    fontSize: '8px',
                                    fontWeight: 900,
                                    boxShadow: isSelected ? `0 2px 6px ${sub.hex}88` : 'none',
                                    transition: 'all 0.12s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <span style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: sub.hex,
                                    border: isSelected ? '1px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
                                    flexShrink: 0,
                                  }} />
                                  <span>{sub.shadeRole === 'Primary' ? 'Pri' : (sub.shadeRole === 'Subcolor 1' ? 'Sub 1' : 'Sub 2')}</span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 3 }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: playerColorHex, border: '2px solid #ffffff', boxShadow: `0 0 6px ${playerColorHex}` }} />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
                        {colorObj.name} {colorObj.shadeRole ? `(${colorObj.shadeRole})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Carousel Arrow (Only for Local Player) */}
                {isMe && (
                  <button
                    onClick={handleNextChar}
                    title="Next Character"
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '2px solid #cbd5e1',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      color: '#334155',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                )}

                {/* Equipped Board Background Badge on Bottom Left of Standee */}
                {isMe && (
                  <div
                    onClick={() => setShowShop(true)}
                    title={`Equipped Board Theme: ${getBoardBackground(equippedBoardBackground).name} (Click to open Shop)`}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      padding: '3px 7px',
                      borderRadius: '12px',
                      background: getBoardBackground(equippedBoardBackground).badgeBg || '#15803d',
                      border: '1.5px solid #ffffff',
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 900,
                      color: '#ffffff',
                      cursor: 'pointer',
                      zIndex: 5,
                      transition: 'transform 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span>{getBoardBackground(equippedBoardBackground).icon || '🌱'}</span>
                    <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getBoardBackground(equippedBoardBackground).name}
                    </span>
                  </div>
                )}

                {/* Equipped Dice Skin Badge at Bottom of Standee */}
                <div
                  onClick={() => {
                    if (isMe) setShowShop(true);
                  }}
                  title={isMe ? `Equipped 3D Dice: ${activeDiceSkin.name} (Click to open Shop)` : `Equipped Dice: ${activeDiceSkin.name}`}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    padding: '3px 7px',
                    borderRadius: '12px',
                    background: activeDiceSkin.badgeBg || '#dc2626',
                    border: '1.5px solid #ffffff',
                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#ffffff',
                    cursor: isMe ? 'pointer' : 'default',
                    zIndex: 5,
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (isMe) e.currentTarget.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (isMe) e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span>{activeDiceSkin.icon || '🎲'}</span>
                  <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeDiceSkin.name}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* If fewer than 6 players, render 1 dynamic "+ ADD BOT / INVITE" card */}
        {hasOpenSlot && (
          <div
            key={`empty-slot-${players.length}`}
            style={{
              background: 'rgba(255, 255, 255, 0.55)',
              border: '2px dashed rgba(56, 189, 248, 0.7)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: totalCards >= 6 ? '20px 10px' : '24px 16px',
              minHeight: '430px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{
              width: totalCards >= 6 ? '60px' : '72px',
              height: totalCards >= 6 ? '60px' : '72px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '2px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: totalCards >= 6 ? '26px' : '32px',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.1)',
            }}>
              👤
            </div>

            <div style={{
              fontSize: totalCards >= 6 ? '13px' : '15px',
              fontWeight: 900,
              color: '#0369a1',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}>
              Slot {players.length + 1} Open
            </div>

            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              marginBottom: '20px',
            }}>
              {players.length}/6 Players Joined
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '170px' }}>
              <button
                onClick={() => {
                  sounds.playBuy();
                  onAddBot?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: '2px solid #38bdf8',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Bot size={16} />
                + ADD BOT
              </button>

              <button
                onClick={() => {
                  sounds.playBuy();
                  onCopyLink?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid #cbd5e1',
                  borderRadius: '12px',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {copiedLink ? <CheckCheck size={14} color="#16a34a" /> : <Copy size={14} />}
                {copiedLink ? 'COPIED!' : 'INVITE'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Start Match & Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        borderRadius: '16px',
        padding: '14px 24px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
      }}>
        {/* Left: Players Count & Readiness */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: players.length >= 2 ? '#16a34a' : '#f59e0b',
            boxShadow: players.length >= 2 ? '0 0 10px #22c55e' : '0 0 10px #f59e0b',
          }} />
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>
            {players.length >= 2
              ? `Table Ready (${players.length}/6 Players Joined)`
              : `Waiting for Opponents (${players.length}/6 Joined - Add at least 1 Bot)`}
          </span>
        </div>

        {/* Center / Right: Big Green START MATCH Button (Business Tour Style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {players.length < 6 && (
            <button
              onClick={onAddBot}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: 'rgba(2, 132, 199, 0.1)',
                border: '2px solid #0284c7',
                borderRadius: '12px',
                color: '#0284c7',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              <Bot size={16} />
              + Add Bot
            </button>
          )}

          <button
            onClick={onStartGame}
            disabled={players.length < 2}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 36px',
              background: players.length >= 2
                ? 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)'
                : '#94a3b8',
              border: players.length >= 2 ? '3px solid #86efac' : 'none',
              borderRadius: '14px',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 900,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              cursor: players.length >= 2 ? 'pointer' : 'not-allowed',
              boxShadow: players.length >= 2
                ? '0 6px 20px rgba(34, 197, 94, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
                : 'none',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={(e) => {
              if (players.length >= 2) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              if (players.length >= 2) e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Play size={20} fill="#ffffff" />
            START MATCH
          </button>
        </div>
      </div>
    </div>
  );
}

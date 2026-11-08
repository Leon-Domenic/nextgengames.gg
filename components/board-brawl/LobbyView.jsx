'use client';

import React, { useState } from 'react';
import { CHARACTERS } from '@/lib/board-brawl/characters';
import { DICE_SKIN_MAP, DICE_SKINS } from '@/lib/board-brawl/diceSkins';
import { sounds } from '@/lib/audio';
import CosmeticsShopModal from '@/components/board-brawl/CosmeticsShopModal';
import SettingsModal from '@/components/board-brawl/SettingsModal';
import EmojiReactionPicker from '@/components/board-brawl/EmojiReactionPicker';
import EmojiReactionBubble from '@/components/board-brawl/EmojiReactionBubble';
import {
  Users, Bot, Play, Copy, CheckCheck, Settings, ShoppingCart, ListChecks, X, Home,
  ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles, Dices, ShoppingBag
} from 'lucide-react';

export const PLAYER_COLORS = [
  { id: 'cyan', name: 'Cyan Sky', hex: '#00f0ff', accent: '#0284c7', headerBg: '#0284c7' },
  { id: 'rose', name: 'Neon Rose', hex: '#ec4899', accent: '#be185d', headerBg: '#e11d48' },
  { id: 'emerald', name: 'Cyber Emerald', hex: '#10b981', accent: '#059669', headerBg: '#059669' },
  { id: 'gold', name: 'Vegas Gold', hex: '#f59e0b', accent: '#d97706', headerBg: '#d97706' },
  { id: 'purple', name: 'Electric Violet', hex: '#8b5cf6', accent: '#6d28d9', headerBg: '#7c3aed' },
  { id: 'crimson', name: 'Inferno Crimson', hex: '#ef4444', accent: '#b91c1c', headerBg: '#dc2626' },
];

const SLOT_COLORS = PLAYER_COLORS;

export default function LobbyView({
  players = [],
  user,
  roomId,
  mode = 'blitz',
  onAddBot,
  onStartGame,
  onChangeCharacter,
  onChangeColor,
  onChangeDiceSkin,
  equippedDiceSkin = 'classic_red',
  onCopyLink,
  copiedLink,
  playerReactions = {},
  onSendReaction,
}) {
  const isHost = players[0]?.id === user?.id || (players.length > 0 && !players[0]?.isBot);
  const myPlayer = players.find(p => p.id === user?.id) || players[0];
  const myCharIndex = CHARACTERS.findIndex(c => c.id === myPlayer?.avatarToken);
  const [currentCharIdx, setCurrentCharIdx] = useState(myCharIndex >= 0 ? myCharIndex : 0);
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activePickerSlot, setActivePickerSlot] = useState(null);

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

  // We support up to 4 slots in standard Business Tour tabletop format
  const slots = [0, 1, 2, 3];

  return (
    <div style={{
      width: '100%',
      maxWidth: '1160px',
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
        onEquipCharacter={(charId) => {
          const idx = CHARACTERS.findIndex(c => c.id === charId);
          if (idx >= 0) setCurrentCharIdx(idx);
          if (onChangeCharacter) onChangeCharacter(charId);
        }}
        onEquipDiceSkin={(skinId) => {
          if (onChangeDiceSkin) onChangeDiceSkin(skinId);
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
          <a
            href="/games"
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
            }}
          >
            <Home size={24} />
          </a>

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
              {myPlayer?.avatarToken ? (CHARACTERS.find(c => c.id === myPlayer.avatarToken)?.icon || '🎩') : '🎩'}
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

          <div style={{
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
          }}>
            <ListChecks size={20} />
          </div>
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
          >
            <Settings size={20} />
          </button>
          <a
            href="/games"
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
            }}
          >
            <X size={22} />
          </a>
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

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              sounds.playBuild();
              setShowSettings(true);
            }}
            title="Open Game Settings"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: mode === 'blitz' ? '#0284c7' : 'rgba(255, 255, 255, 0.7)',
              color: mode === 'blitz' ? '#ffffff' : '#475569',
              border: 'none',
              fontSize: '12px',
              fontWeight: 900,
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: mode === 'blitz' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'transform 0.1s ease',
            }}
          >
            QUICK SETTINGS
          </button>
          <div style={{
            padding: '6px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#0284c7',
            border: '2px solid #38bdf8',
            fontSize: '12px',
            fontWeight: 900,
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)',
          }}>
            BUSINESS TOUR 48
          </div>
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

      {/* 3. 4 Character Pedestal Cards (Image 2 Business Tour Exact Layout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        flex: 1,
        marginBottom: '24px',
      }}>
        {slots.map((slotIdx) => {
          const player = players[slotIdx];
          const isSlotOccupied = !!player;
          const isMe = player && player.id === user?.id;
          const playerColorHex = player?.avatarColor || PLAYER_COLORS[slotIdx % PLAYER_COLORS.length].hex;
          const colorObj = PLAYER_COLORS.find(c => c.hex.toLowerCase() === playerColorHex.toLowerCase()) || {
            name: 'Player',
            hex: playerColorHex,
            headerBg: playerColorHex,
            accent: playerColorHex
          };
          const slotColor = colorObj;
          const activeChar = isMe
            ? CHARACTERS[currentCharIdx]
            : (player ? (CHARACTERS.find(c => c.id === player.avatarToken) || CHARACTERS[slotIdx % CHARACTERS.length]) : null);
          const activeDiceSkin = isMe
            ? (DICE_SKIN_MAP[equippedDiceSkin] || DICE_SKINS[0])
            : (player?.diceSkin ? (DICE_SKIN_MAP[player.diceSkin] || DICE_SKINS[slotIdx % DICE_SKINS.length]) : DICE_SKINS[slotIdx % DICE_SKINS.length]);

          if (!isSlotOccupied) {
            // Empty Slot Card (with + ADD BOT & + INVITE FRIEND buttons)
            return (
              <div
                key={`empty-slot-${slotIdx}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.45)',
                  border: '2px dashed rgba(148, 163, 184, 0.6)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  minHeight: '430px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                }}>
                  👤
                </div>

                <div style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#64748b',
                  marginBottom: '20px',
                  textTransform: 'uppercase',
                }}>
                  Slot {slotIdx + 1} Open
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '180px' }}>
                  <button
                    onClick={onAddBot}
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
                      fontSize: '13px',
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
                    onClick={onCopyLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.9)',
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
                    <Copy size={14} />
                    INVITE
                  </button>
                </div>
              </div>
            );
          }

          // Occupied Slot Card (Matches Business Tour Pedestal Standee Card)
          return (
            <div
              key={player.id}
              style={{
                background: '#ffffff',
                border: isMe ? '3px solid #0284c7' : '2px solid #e2e8f0',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '430px',
                boxShadow: isMe
                  ? '0 12px 30px rgba(2, 132, 199, 0.25), 0 0 0 2px #38bdf8'
                  : '0 8px 24px rgba(0, 0, 0, 0.08)',
                position: 'relative',
              }}
            >
              {/* Card Header Ribbon with Avatar & Username */}
              <div style={{
                background: slotColor.headerBg,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
              }}>
                <div
                  onClick={() => setActivePickerSlot(activePickerSlot === slotIdx ? null : slotIdx)}
                  title="Click avatar to react with emoji"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#1e293b',
                    border: '2px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {activeChar?.icon || '🎩'}
                  <EmojiReactionBubble reaction={playerReactions?.[player.id]} position="top-left" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    textTransform: 'uppercase',
                  }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#fef08a', fontWeight: 800 }}>
                    {isMe ? 'YOU' : (player.isBot ? 'SMART AI BOT' : 'PLAYER')}
                  </div>
                </div>

                {isMe && (
                  <div style={{
                    background: '#0284c7',
                    border: '1.5px solid #ffffff',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    color: '#fff',
                    fontWeight: 900,
                  }}>
                    P1
                  </div>
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
                padding: '16px',
              }}>
                {/* Standee Shadow Pedestal */}
                <div style={{
                  position: 'absolute',
                  bottom: '36px',
                  width: '120px',
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
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '32px',
                      height: '32px',
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
                    <ChevronLeft size={20} />
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
                }}>
                  {/* Standee Character Avatar Big Icon (Click to React) */}
                  <div
                    onClick={() => setActivePickerSlot(activePickerSlot === slotIdx ? null : slotIdx)}
                    title="Click avatar to react with emoji"
                    style={{
                      position: 'relative',
                      width: '100px',
                      height: '100px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                      border: `4px solid ${slotColor.hex}`,
                      boxShadow: `0 8px 20px ${slotColor.hex}44`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '54px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {activeChar?.icon || '🎩'}

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
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>
                      {activeChar?.name || 'Tycoon'}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                      {activeChar?.title || 'City Mogul'}
                    </div>
                  </div>

                  {/* 6 Selectable Distinct Player Colors */}
                  {isMe ? (
                    <div style={{
                      marginTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '5px',
                      zIndex: 3,
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Pawn & Property Color
                      </div>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {PLAYER_COLORS.map((col) => {
                          const isSelected = playerColorHex.toLowerCase() === col.hex.toLowerCase();
                          return (
                            <button
                              key={col.id}
                              onClick={() => {
                                sounds.playPawnStep?.();
                                if (onChangeColor) onChangeColor(col.hex);
                              }}
                              title={`${col.name} (${col.hex})`}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: col.hex,
                                border: isSelected ? '3px solid #ffffff' : '2px solid rgba(0,0,0,0.15)',
                                boxShadow: isSelected ? `0 0 10px ${col.hex}, 0 2px 6px rgba(0,0,0,0.25)` : '0 1px 3px rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                transform: isSelected ? 'scale(1.22)' : 'scale(1)',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                outline: 'none',
                                padding: 0,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 3 }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: playerColorHex, border: '2px solid #ffffff', boxShadow: `0 0 6px ${playerColorHex}` }} />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>{colorObj.name}</span>
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
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '32px',
                      height: '32px',
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
                    <ChevronRight size={20} />
                  </button>
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
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: activeDiceSkin.badgeBg || '#dc2626',
                    border: '1.5px solid #ffffff',
                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
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
                  <span>{activeDiceSkin.name}</span>
                </div>
              </div>
            </div>
          );
        })}
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
              ? `Table Ready (${players.length}/4 Players Joined)`
              : `Waiting for Opponents (${players.length}/4 Joined - Add at least 1 Bot)`}
          </span>
        </div>

        {/* Center / Right: Big Green START MATCH Button (Business Tour Style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {players.length < 4 && (
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

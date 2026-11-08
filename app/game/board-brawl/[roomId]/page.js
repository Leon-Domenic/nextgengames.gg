'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSocket } from '@/lib/socket';
import { sounds } from '@/lib/audio';
import ScreenShakeWrapper from '@/components/board-brawl/ScreenShakeWrapper';
import TomatoOverlay from '@/components/board-brawl/TomatoOverlay';
import DiceRoller3D from '@/components/board-brawl/DiceRoller3D';
import Board3D from '@/components/board-brawl/Board3D';
import ActionModal from '@/components/board-brawl/ActionModal';
import EmoteWheel from '@/components/board-brawl/EmoteWheel';
import VictoryPodium from '@/components/board-brawl/VictoryPodium';
import LobbyView from '@/components/board-brawl/LobbyView';
import CosmeticsShopModal from '@/components/board-brawl/CosmeticsShopModal';
import SettingsModal from '@/components/board-brawl/SettingsModal';
import EventCardModal from '@/components/board-brawl/EventCardModal';
import ActionCardDock from '@/components/board-brawl/ActionCardDock';
import ActionCardPlayOverlay from '@/components/board-brawl/ActionCardPlayOverlay';
import FestivalSelectModal from '@/components/board-brawl/FestivalSelectModal';
import DebtLiquidationModal from '@/components/board-brawl/DebtLiquidationModal';
import EmojiReactionPicker from '@/components/board-brawl/EmojiReactionPicker';
import EmojiReactionBubble from '@/components/board-brawl/EmojiReactionBubble';
import {
  Users, Bot, Play, MessageSquare, Send, Sparkles, AlertCircle, Copy, CheckCheck,
  Volume2, VolumeX, Crown, ShieldAlert, X, ShoppingBag, Home, Settings
} from 'lucide-react';
import { TOKEN_ICONS, CHARACTERS } from '@/lib/board-brawl/characters.js';

const CORNER_SLOT_THEMES = [
  { headerBg: '#e11d48', accent: '#fb7185', name: 'Pink/Red' },
  { headerBg: '#059669', accent: '#34d399', name: 'Green' },
  { headerBg: '#d97706', accent: '#fbbf24', name: 'Yellow' },
  { headerBg: '#0284c7', accent: '#38bdf8', name: 'Blue' },
];

export default function BoardBrawlArenaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { roomId } = params;
  const modeQuery = searchParams.get('mode') || 'blitz';

  const { user, loading, playAsGuest } = useAuth();
  const [guestInitializing, setGuestInitializing] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [splatEvent, setSplatEvent] = useState(null);
  const [actionCardPlayEvent, setActionCardPlayEvent] = useState(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isVictim, setIsVictim] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showInGameShop, setShowInGameShop] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [playerReactions, setPlayerReactions] = useState({});

  // Sync background music state reactively
  useEffect(() => {
    const syncMusic = () => {
      setMusicPlaying(!sounds.isMusicMuted());
    };
    syncMusic();
    return sounds.subscribe(syncMusic);
  }, []);

  // Global Keybind Shortcuts (S for Settings, M for Mute)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.key === 's' || e.key === 'S') {
        setShowSettingsModal(prev => {
          if (!prev) setShowInGameShop(false);
          return !prev;
        });
      } else if (e.key === 'm' || e.key === 'M') {
        if (sounds.toggleMute) sounds.toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [equippedDiceSkin, setEquippedDiceSkin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ngg_equipped_dice_skin') || 'classic_red';
    }
    return 'classic_red';
  });

  const socket = getSocket();
  const chatBottomRef = useRef(null);

  // Auto-init guest if visitor has no session
  useEffect(() => {
    if (!loading && !user && !guestInitializing) {
      let isMounted = true;
      playAsGuest().catch(() => {}).finally(() => {
        if (isMounted) setGuestInitializing(false);
      });
      return () => { isMounted = false; };
    }
  }, [loading, user, guestInitializing, playAsGuest]);

  // Join Room & Real-time State Sync (Defensively debounced to prevent socket storms)
  const hasJoinedRef = useRef(false);
  const gameStateRef = useRef(null);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!socket || loading || guestInitializing) return;

    const joinRoom = () => {
      socket.emit('join_game_room', {
        roomId,
        user: user || { id: `anon_${Date.now()}`, username: 'Guest Tycoon', is_guest: true },
        isSpectator: false,
        mode: modeQuery,
      });
      hasJoinedRef.current = true;
    };

    const handleStateUpdate = (newState) => {
      if (newState && newState.roomId === roomId) {
        setGameState(newState);
      }
    };

    const handleTomatoImpact = (data) => {
      setSplatEvent({
        ...data,
        timestamp: Date.now(),
      });
    };

    const handleTauntSound = ({ sender, tauntId }) => {
      if (tauntId === 'chaching') sounds.playCash();
      else if (tauntId === 'payup') sounds.playBuyout();
      else if (tauntId === 'splat') sounds.playTomatoSplat();
      else sounds.playDoublesSurge();
    };

    const handlePlayerReaction = (data) => {
      if (data?.playerId && data?.emoji) {
        sounds.playBuild?.();
        setPlayerReactions(prev => ({
          ...prev,
          [data.playerId]: {
            emoji: data.emoji,
            timestamp: data.timestamp || Date.now(),
          },
        }));
      }
    };

    // Attach listeners FIRST
    socket.on('game_state_update', handleStateUpdate);
    socket.on('tomato_impact_event', handleTomatoImpact);
    socket.on('action_card_played', (cardData) => setActionCardPlayEvent(cardData));
    socket.on('taunt_sound_event', handleTauntSound);
    socket.on('player_reaction_event', handlePlayerReaction);
    socket.on('connect', joinRoom);

    // Initial join attempt once per room
    if (!hasJoinedRef.current) {
      if (socket.connected) {
        joinRoom();
      } else {
        socket.connect();
      }
    }

    // Safety fallback: only re-request state if not yet received, without rejoining
    const syncInterval = setInterval(() => {
      if (!gameStateRef.current) {
        socket.emit('request_game_state', { roomId });
      }
    }, 2000);

    return () => {
      clearInterval(syncInterval);
      socket.off('game_state_update', handleStateUpdate);
      socket.off('tomato_impact_event', handleTomatoImpact);
      socket.off('action_card_played');
      socket.off('taunt_sound_event', handleTauntSound);
      socket.off('player_reaction_event', handlePlayerReaction);
      socket.off('connect', joinRoom);
    };
  }, [socket, roomId, user?.id, loading, guestInitializing, modeQuery]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.chat]);

  if (loading || (!gameState && !guestInitializing)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #7dd3fc 0%, #e0f2fe 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #bae6fd',
          borderTopColor: '#0284c7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px',
        }} />
        <h2 style={{ color: '#0369a1', fontSize: '22px', fontWeight: 900, margin: 0 }}>
          CONNECTING TO TABLE #{roomId}
        </h2>
        <p style={{ color: '#0284c7', fontSize: '14px', marginTop: '6px' }}>
          Preparing Business Tour 3D Arena...
        </p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #7dd3fc 0%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          background: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '440px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>
            Room Unavailable
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
            Table #{roomId} could not be synchronized or has been concluded.
          </p>
          <button
            onClick={() => router.push('/games')}
            style={{
              padding: '12px 24px',
              background: '#0284c7',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = currentPlayer?.id === user?.id;
  const myPlayerObj = gameState.players.find(p => p.id === user?.id);

  // Actions
  const handleStartGame = () => {
    socket.emit('game_action', { roomId, action: 'start_game' });
  };

  const handleAddBot = () => {
    socket.emit('game_action', { roomId, action: 'add_bot' });
  };

  const handleSelectCharacter = (charId) => {
    if (!user) return;
    socket.emit('game_action', {
      roomId,
      action: 'select_character',
      payload: { playerId: user.id, token: charId }
    });
  };

  const handleSelectColor = (colorHex) => {
    if (!user) return;
    sounds.playBuy();
    socket.emit('game_action', {
      roomId,
      action: 'select_character',
      payload: { playerId: user.id, color: colorHex }
    });
  };

  const handleSelectDiceSkin = (skinId) => {
    setEquippedDiceSkin(skinId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ngg_equipped_dice_skin', skinId);
    }
    if (user) {
      socket.emit('game_action', {
        roomId,
        action: 'select_dice_skin',
        payload: { playerId: user.id, skinId }
      });
    }
  };

  const handleRollDice = () => {
    if (!isMyTurn) return;
    socket.emit('game_action', { roomId, action: 'roll_dice', payload: { playerId: user.id } });
  };

  const handleBuyCity = (tileId, level) => {
    socket.emit('game_action', { roomId, action: 'buy_city', payload: { playerId: user.id, tileId, level } });
  };

  const handleBuyoutCity = (tileId) => {
    socket.emit('game_action', { roomId, action: 'buyout_city', payload: { playerId: user.id, tileId } });
  };

  const handleUpgradeCity = (tileId) => {
    socket.emit('game_action', { roomId, action: 'upgrade_city', payload: { playerId: user.id, tileId } });
  };

  const handleEndTurn = () => {
    socket.emit('game_action', { roomId, action: 'end_turn', payload: { playerId: user.id } });
  };

  const handleThrowTomato = (targetPlayerId) => {
    if (!user || user.id === targetPlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'throw_tomato',
      payload: { fromPlayerId: user.id, targetPlayerId }
    });
  };

  const handlePlayActionCard = (cardId, target) => {
    if (!socket || !user) return;
    socket.emit('game_action', {
      roomId,
      action: 'play_action_card',
      payload: { playerId: user.id, cardId, target }
    });
  };

  const handleDismissEventCard = () => {
    if (!socket || !user) return;
    socket.emit('game_action', {
      roomId,
      action: 'dismiss_event_card',
      payload: { playerId: user.id }
    });
  };

  const handleSetFestival = (tileId) => {
    if (!socket || !user) return;
    socket.emit('game_action', {
      roomId,
      action: 'set_festival',
      payload: { playerId: user.id, tileId }
    });
  };

  const handlePayBail = () => {
    if (!socket || !user) return;
    socket.emit('game_action', {
      roomId,
      action: 'pay_bail',
      payload: { playerId: user.id }
    });
  };

  const handleDeclareBankruptcy = () => {
    if (!socket || !user) return;
    socket.emit('game_action', {
      roomId,
      action: 'declare_bankruptcy',
      payload: { playerId: user.id }
    });
  };

  const handleSendChat = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !user) return;
    socket.emit('game_action', {
      roomId,
      action: 'send_chat',
      payload: { sender: user.username, text: chatInput.trim() }
    });
    setChatInput('');
  };

  const handleSendTaunt = (tauntId) => {
    if (!user) return;
    socket.emit('game_action', {
      roomId,
      action: 'send_taunt',
      payload: { sender: user.username, tauntId }
    });
  };

  const handleSendReaction = (targetPlayerId, emoji) => {
    sounds.playBuild?.();
    setPlayerReactions(prev => ({
      ...prev,
      [targetPlayerId]: {
        emoji,
        timestamp: Date.now(),
      }
    }));
    if (socket) {
      socket.emit('game_action', {
        roomId,
        action: 'send_reaction',
        payload: {
          playerId: targetPlayerId,
          sender: user?.username || myPlayerObj?.name || 'Player',
          emoji,
        }
      });
    }
  };

  const copyInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nextgengames.gg';
    navigator.clipboard.writeText(`${origin}/game/board-brawl/${roomId}?mode=${modeQuery}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <ScreenShakeWrapper shakeTrigger={shakeTrigger} intensity="heavy">
      <div style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 90,
        background: 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 30%, #bae6fd 65%, #e0f2fe 100%)',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Tomato Sabotage Overlay with Trajectory Flight & Screen Splat */}
        <TomatoOverlay
          splatEvent={splatEvent}
          currentUserId={user?.id}
          players={gameState.players}
          onVictimImpact={() => setShakeTrigger(prev => prev + 1)}
        />

        {/* Action Card Announcement Banner */}
        <ActionCardPlayOverlay lastActionCardPlayed={actionCardPlayEvent || gameState.lastActionCardPlayed} />

        {/* Cinematic Event Card Draw Modal */}
        <EventCardModal
          eventData={gameState.activeEventCard}
          isMyTurn={isMyTurn}
          onDismiss={handleDismissEventCard}
        />

        {/* Hand Action Cards Dock */}
        {gameState.status === 'playing' && myPlayerObj && (
          <ActionCardDock
            cards={myPlayerObj.cards}
            myPlayer={myPlayerObj}
            gameState={gameState}
            onPlayCard={handlePlayActionCard}
            disabled={!isMyTurn && gameState.turnState !== 'roll' && gameState.turnState !== 'action'}
          />
        )}

        {/* World Championship Festival Select Modal */}
        {isMyTurn && gameState.turnState === 'festival_select' && (
          <FestivalSelectModal
            properties={gameState.properties}
            myPlayer={myPlayerObj}
            onSelectFestival={handleSetFestival}
            onSkip={() => handleEndTurn(myPlayerObj?.id)}
            turnTimer={gameState.turnTimerRemaining}
          />
        )}

        {/* Debt Liquidation / Insolvency Modal */}
        {isMyTurn && gameState.turnState === 'debt' && (
          <DebtLiquidationModal
            pendingDebt={gameState.pendingDebt}
            myPlayer={myPlayerObj}
            creditor={gameState.players.find(p => p.id === gameState.pendingDebt?.creditorId)}
            properties={gameState.properties}
            onDeclareBankruptcy={handleDeclareBankruptcy}
            turnTimer={gameState.turnTimerRemaining}
          />
        )}

        {/* Victory Podium */}
        {gameState.status === 'finished' && (
          <VictoryPodium
            winner={gameState.winner}
            winReason={gameState.winReason}
            players={gameState.players}
            onReturnToHub={() => router.push('/games')}
          />
        )}

        {/* 1. PRE-MATCH LOBBY VIEW (IMAGE 2 BUSINESS TOUR PRIVATE TABLE) */}
        {gameState.status === 'waiting' && (
          <LobbyView
            players={gameState.players}
            user={user}
            roomId={roomId}
            mode={gameState.mode}
            onAddBot={handleAddBot}
            onStartGame={handleStartGame}
            onChangeCharacter={handleSelectCharacter}
            onChangeColor={handleSelectColor}
            onChangeDiceSkin={handleSelectDiceSkin}
            equippedDiceSkin={myPlayerObj?.diceSkin || equippedDiceSkin}
            onCopyLink={copyInviteLink}
            copiedLink={copiedLink}
            playerReactions={playerReactions}
            onSendReaction={handleSendReaction}
          />
        )}

        {/* 2. IN-GAME BUSINESS TOUR TABLETOP ARENA (IMAGE 3) */}
        {gameState.status === 'playing' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
          }}>
            {/* Top-Left Home / Exit Button */}
            <button
              onClick={() => router.push('/games')}
              title="Return to Games Hub"
              style={{
                position: 'absolute',
                top: '16px',
                left: '286px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid #bae6fd',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                cursor: 'pointer',
                zIndex: 35,
                transition: 'all 0.15s ease',
              }}
            >
              <Home size={20} />
            </button>

            {/* Top-Left Settings Button */}
            <button
              onClick={() => {
                sounds.playBuild();
                setShowInGameShop(false);
                setShowSettingsModal(true);
              }}
              title="Game Settings"
              style={{
                position: 'absolute',
                top: '16px',
                left: '336px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid #bae6fd',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                cursor: 'pointer',
                zIndex: 35,
                transition: 'all 0.15s ease',
              }}
            >
              <Settings size={20} />
            </button>

            {/* 4 Corner Player HUD Capsules (Business Tour Style) */}
            {/* Slot 0: Top-Left */}
            {gameState.players[0] && (
              <PlayerCornerCard
                player={gameState.players[0]}
                isCurrent={gameState.activePlayerIndex === 0}
                isMe={gameState.players[0].id === user?.id}
                timer={gameState.turnTimerRemaining}
                turnDuration={gameState.turnDuration || (gameState.mode === 'blitz' ? 15 : 30)}
                theme={CORNER_SLOT_THEMES[0]}
                position="top-left"
                onThrowTomato={handleThrowTomato}
                canTomato={myPlayerObj?.freeTomatoes > 0}
                activeReaction={playerReactions[gameState.players[0].id]}
                onSendReaction={(emoji) => handleSendReaction(gameState.players[0].id, emoji)}
              />
            )}

            {/* Slot 1: Top-Right */}
            {gameState.players[1] && (
              <PlayerCornerCard
                player={gameState.players[1]}
                isCurrent={gameState.activePlayerIndex === 1}
                isMe={gameState.players[1].id === user?.id}
                timer={gameState.turnTimerRemaining}
                turnDuration={gameState.turnDuration || (gameState.mode === 'blitz' ? 15 : 30)}
                theme={CORNER_SLOT_THEMES[1]}
                position="top-right"
                onThrowTomato={handleThrowTomato}
                canTomato={myPlayerObj?.freeTomatoes > 0}
                activeReaction={playerReactions[gameState.players[1].id]}
                onSendReaction={(emoji) => handleSendReaction(gameState.players[1].id, emoji)}
              />
            )}

            {/* Slot 2: Bottom-Left */}
            {gameState.players[2] && (
              <PlayerCornerCard
                player={gameState.players[2]}
                isCurrent={gameState.activePlayerIndex === 2}
                isMe={gameState.players[2].id === user?.id}
                timer={gameState.turnTimerRemaining}
                turnDuration={gameState.turnDuration || (gameState.mode === 'blitz' ? 15 : 30)}
                theme={CORNER_SLOT_THEMES[2]}
                position="bottom-left"
                onThrowTomato={handleThrowTomato}
                canTomato={myPlayerObj?.freeTomatoes > 0}
                activeReaction={playerReactions[gameState.players[2].id]}
                onSendReaction={(emoji) => handleSendReaction(gameState.players[2].id, emoji)}
              />
            )}

            {/* Slot 3: Bottom-Right */}
            {gameState.players[3] && (
              <PlayerCornerCard
                player={gameState.players[3]}
                isCurrent={gameState.activePlayerIndex === 3}
                isMe={gameState.players[3].id === user?.id}
                timer={gameState.turnTimerRemaining}
                turnDuration={gameState.turnDuration || (gameState.mode === 'blitz' ? 15 : 30)}
                theme={CORNER_SLOT_THEMES[3]}
                position="bottom-right"
                onThrowTomato={handleThrowTomato}
                canTomato={myPlayerObj?.freeTomatoes > 0}
                activeReaction={playerReactions[gameState.players[3].id]}
                onSendReaction={(emoji) => handleSendReaction(gameState.players[3].id, emoji)}
              />
            )}

            {/* Top-Center Global Active Player & Turn Timer Pill */}
            {currentPlayer && !currentPlayer.isBankrupt && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 30,
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '16px',
                padding: '8px 18px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                minWidth: '220px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 900,
                  color: '#f8fafc',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  <span style={{ color: '#38bdf8' }}>{currentPlayer.name}{isMyTurn ? ' (YOU)' : ''}</span>
                  <span style={{ color: '#64748b' }}>•</span>
                  <span style={{
                    color: (gameState.turnTimerRemaining || 0) <= 3 ? '#ef4444' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    ⏱️ {gameState.turnTimerRemaining}s
                  </span>
                </div>

                {/* Draining Timer Bar */}
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, ((gameState.turnTimerRemaining || 0) / (gameState.turnDuration || 15)) * 100))}%`,
                    background: (gameState.turnTimerRemaining || 0) > 6 ? '#22c55e' : (gameState.turnTimerRemaining || 0) > 3 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.9s linear, background-color 0.3s ease',
                    boxShadow: (gameState.turnTimerRemaining || 0) <= 3 ? '0 0 8px #ef4444' : 'none',
                  }} />
                </div>
              </div>
            )}

            {/* Right Side Floating Utility Bar (Chat toggle, Music toggle) */}
            <div style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              zIndex: 60,
            }}>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowInGameShop(true);
                }}
                title="Open Cosmetics Shop"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: '2px solid #fef08a',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ShoppingBag size={22} />
              </button>

              <button
                onClick={() => setShowChatPanel(!showChatPanel)}
                title="Toggle Match Chat"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: showChatPanel ? '#0284c7' : 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #38bdf8',
                  color: showChatPanel ? '#ffffff' : '#0284c7',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <MessageSquare size={22} />
              </button>

              <button
                onClick={() => {
                  const isPlaying = sounds.toggleMusic();
                  setMusicPlaying(isPlaying);
                }}
                title={musicPlaying ? "Mute Music" : "Play Music"}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: musicPlaying ? '#10b981' : 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #34d399',
                  color: musicPlaying ? '#ffffff' : '#059669',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {musicPlaying ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>

              <button
                onClick={() => {
                  setShowInGameShop(false);
                  setShowSettingsModal(true);
                }}
                title="Open Game Settings"
                aria-label="Game Settings"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #38bdf8',
                  color: '#0284c7',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
              >
                <Settings size={22} />
              </button>
            </div>

            {/* Collapsible Floating Chat Panel */}
            {showChatPanel && (
              <div style={{
                position: 'absolute',
                right: '76px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '320px',
                height: '420px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '2px solid #bae6fd',
                borderRadius: '18px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 40,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span>💬 MATCH BROADCAST & CHAT</span>
                  <button
                    onClick={() => setShowChatPanel(false)}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{
                  flex: 1,
                  padding: '12px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {gameState.chat?.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: msg.isSystem ? 'rgba(2, 132, 199, 0.08)' : 'rgba(241, 245, 249, 0.9)',
                        borderLeft: msg.isSystem ? '3px solid #0284c7' : 'none',
                        fontSize: '12px',
                      }}
                    >
                      <strong style={{ color: msg.isSystem ? '#0369a1' : '#1e293b' }}>
                        {msg.sender}:{' '}
                      </strong>
                      <span style={{ color: '#334155' }}>{msg.text}</span>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                <form
                  onSubmit={handleSendChat}
                  style={{
                    padding: '8px 12px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Say something taunting..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* In-Game Cosmetics Shop Modal */}
            <CosmeticsShopModal
              isOpen={showInGameShop}
              onClose={() => setShowInGameShop(false)}
              currentUserId={user?.id}
              equippedCharacter={myPlayerObj?.avatarToken || 'hat'}
              equippedDiceSkin={myPlayerObj?.diceSkin || equippedDiceSkin}
              onEquipCharacter={handleSelectCharacter}
              onEquipDiceSkin={handleSelectDiceSkin}
              userCash={5000}
              userCoins={50}
            />

            {/* In-Game Dedicated Settings Modal */}
            <SettingsModal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              onOpenCosmetics={() => {
                setShowSettingsModal(false);
                setShowInGameShop(true);
              }}
            />

            {/* The Steady 45-Degree Diamond 3D Arena */}
            <Board3D
              properties={gameState.properties}
              players={gameState.players}
              activeTileId={currentPlayer?.position}
              lastDiceResult={gameState.lastDiceResult}
              diceSkin={myPlayerObj?.diceSkin || equippedDiceSkin}
              centerContent={null}
            />

            {/* Floating In-Game Roll Control (Only on active player's roll turn) */}
            {isMyTurn && gameState.turnState === 'roll' && (
              <div style={{
                position: 'absolute',
                bottom: '36px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 25,
              }}>
                <DiceRoller3D
                  dice={gameState.dice}
                  lastResult={gameState.lastDiceResult}
                  canRoll={isMyTurn && gameState.turnState === 'roll'}
                  onRoll={handleRollDice}
                  turnTimer={gameState.turnTimerRemaining}
                  isMyTurn={isMyTurn}
                  diceSkin={myPlayerObj?.diceSkin || equippedDiceSkin}
                  isInJail={myPlayerObj?.islandTurns > 0}
                  onPayBail={handlePayBail}
                  canPayBail={(myPlayerObj?.cash || 0) >= 100}
                />
              </div>
            )}

            {/* Centered Property Card Popup Overlay */}
            {isMyTurn && gameState.turnState === 'action' && (
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 85,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(3px)',
              }}>
                <ActionModal
                  currentTileId={currentPlayer?.position}
                  properties={gameState.properties}
                  player={currentPlayer}
                  players={gameState.players}
                  onBuy={handleBuyCity}
                  onBuyout={handleBuyoutCity}
                  onUpgrade={handleUpgradeCity}
                  onEndTurn={handleEndTurn}
                  turnTimer={gameState.turnTimerRemaining}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </ScreenShakeWrapper>
  );
}

// 4 Corner HUD Player Capsule Component (Exact Business Tour Recreation)
function PlayerCornerCard({
  player,
  isCurrent,
  isMe,
  timer,
  turnDuration = 15,
  theme,
  position,
  onThrowTomato,
  canTomato,
  activeReaction,
  onSendReaction,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const isBankrupt = player.isBankrupt;
  const activeChar = CHARACTERS.find(c => c.id === player.avatarToken) || CHARACTERS[0];
  const playerColor = player.avatarColor || theme.headerBg;

  const posStyles = {
    'top-left': { top: '16px', left: '16px' },
    'top-right': { top: '16px', right: '16px' },
    'bottom-left': { bottom: '16px', left: '16px' },
    'bottom-right': { bottom: '16px', right: '16px' },
  }[position] || { top: '16px', left: '16px' };

  return (
    <div
      id={`player-card-${player.id}`}
      style={{
        position: 'absolute',
        ...posStyles,
        width: '260px',
        background: '#ffffff',
        border: isCurrent ? '3px solid #f59e0b' : `2px solid ${playerColor}55`,
        borderRadius: '16px',
        boxShadow: isCurrent
          ? '0 8px 30px rgba(245, 158, 11, 0.45), 0 0 0 2px #fde047'
          : `0 8px 24px rgba(0, 0, 0, 0.08), 0 0 12px ${playerColor}22`,
        overflow: 'visible',
        zIndex: 20,
        opacity: isBankrupt ? 0.45 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Active Turn Running Progress Bar */}
      {isCurrent && !isBankrupt && (
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          borderTopLeftRadius: '14px',
          borderTopRightRadius: '14px',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, ((timer || 0) / (turnDuration || 15)) * 100))}%`,
            background: (timer || 0) > 6 ? '#22c55e' : (timer || 0) > 3 ? '#f59e0b' : '#ef4444',
            transition: 'width 0.9s linear, background-color 0.3s ease',
            boxShadow: (timer || 0) <= 3 ? '0 0 8px #ef4444' : 'none',
          }} />
        </div>
      )}

      {/* Colored Top Ribbon with Name & VIP Badge */}
      <div style={{
        background: playerColor,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#ffffff',
        borderTopLeftRadius: isCurrent ? '0' : '14px',
        borderTopRightRadius: isCurrent ? '0' : '14px',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
        }}>
          {player.name} {isMe && '(YOU)'}
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          padding: '1px 6px',
          fontSize: '10px',
          fontWeight: 900,
          color: '#fef08a',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}>
          <Crown size={12} fill="#fef08a" />
          VIP
        </div>
      </div>

      {/* Main Body: Avatar Circle & Monospace Green Cash Balance */}
      <div style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderBottomLeftRadius: '14px',
        borderBottomRightRadius: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar with Laurel Gold Rim (Click to React) */}
          <div
            onClick={() => setShowPicker(prev => !prev)}
            title="Click avatar to react with emoji"
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              border: '2px solid #fef08a',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              overflow: 'visible',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeChar?.avatar ? (
                <img src={activeChar.avatar} alt={activeChar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                activeChar?.icon || '🎩'
              )}
            </div>

            {/* Reaction Bubble Displayed Next to Avatar */}
            <EmojiReactionBubble reaction={activeReaction} position={position} />

            {/* Reaction Picker Popover */}
            <EmojiReactionPicker
              isOpen={showPicker}
              onClose={() => setShowPicker(false)}
              onSelectEmoji={onSendReaction}
              position={position}
              playerName={player.name}
            />
          </div>

          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: isBankrupt ? '#ef4444' : '#15803d',
              lineHeight: '1.1',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>{player.cash.toLocaleString()}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 900,
                color: '#0284c7',
                background: 'rgba(2, 132, 199, 0.12)',
                border: '1px solid #bae6fd',
                padding: '2px 6px',
                borderRadius: '6px',
                letterSpacing: '0.5px',
              }}>
                🪐 CR
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '3px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: isCurrent ? ((timer || 0) <= 3 ? '#ef4444' : '#d97706') : '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}>
                {isBankrupt ? 'BANKRUPT' : (isCurrent ? `⏱️ ${timer}s left` : 'Waiting')}
              </span>
              {player.shieldActive && (
                <span style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: '6px',
                  boxShadow: '0 0 8px rgba(2, 132, 199, 0.6)',
                }}>
                  🛡️ SHIELD
                </span>
              )}
              {player.rentSurgeTurns > 0 && (
                <span style={{
                  background: '#d97706',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: '6px',
                  boxShadow: '0 0 8px rgba(217, 119, 6, 0.6)',
                }}>
                  🔥 2X SURGE
                </span>
              )}
              {player.disadvantaged && (
                <span style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: '6px',
                }}>
                  🍅 BLINDED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right action button: Tomato Sabotage */}
        {!isMe && !isBankrupt && canTomato && (
          <button
            onClick={() => onThrowTomato(player.id)}
            title={`Throw tomato at ${player.name}!`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.2)',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🍅
          </button>
        )}
      </div>

      {/* Turn Countdown Progress Line */}
      {isCurrent && (
        <div style={{
          height: '4px',
          width: '100%',
          background: '#fde047',
          animation: 'pulse 1s ease-in-out infinite alternate',
        }} />
      )}
    </div>
  );
}

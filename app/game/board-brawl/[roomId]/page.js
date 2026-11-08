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
import {
  Users, Bot, Play, MessageSquare, Send, Sparkles, AlertCircle, Copy, CheckCheck
} from 'lucide-react';
import { TOKEN_ICONS } from '@/lib/board-brawl/characters.js';

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
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isVictim, setIsVictim] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const socket = getSocket();
  const chatBottomRef = useRef(null);

  // Auto-init guest if visitor has no session
  useEffect(() => {
    if (!loading && !user && !guestInitializing) {
      setGuestInitializing(true);
      playAsGuest().catch(() => {}).finally(() => setGuestInitializing(false));
    }
  }, [loading, user, guestInitializing, playAsGuest]);

  // Join Room & Real-time State Sync
  useEffect(() => {
    if (!socket || loading || guestInitializing) return;

    const joinRoom = () => {
      socket.emit('join_game_room', {
        roomId,
        user: user || { id: `anon_${Date.now()}`, username: 'Guest Tycoon', is_guest: true },
        isSpectator: false,
        mode: modeQuery,
      });
    };

    const handleStateUpdate = (newState) => {
      if (newState && newState.roomId === roomId) {
        setGameState(newState);
      }
    };

    const handleTomatoImpact = (data) => {
      setSplatEvent(data);
      if (data.targetPlayerId === user?.id) {
        setIsVictim(true);
        setShakeTrigger(prev => prev + 1);
      } else {
        setIsVictim(false);
      }
    };

    const handleTauntSound = ({ sender, tauntId }) => {
      if (tauntId === 'chaching') sounds.playCash();
      else if (tauntId === 'payup') sounds.playBuyout();
      else if (tauntId === 'splat') sounds.playTomatoSplat();
      else sounds.playDoublesSurge();
    };

    // Attach listeners FIRST
    socket.on('game_state_update', handleStateUpdate);
    socket.on('tomato_impact_event', handleTomatoImpact);
    socket.on('taunt_sound_event', handleTauntSound);
    socket.on('connect', joinRoom);

    // Initial join attempt
    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
    }

    // Safety fallback: re-request state every 2 seconds if not yet received
    const syncInterval = setInterval(() => {
      if (!gameState) {
        socket.emit('request_game_state', { roomId });
        joinRoom();
      }
    }, 2000);

    return () => {
      clearInterval(syncInterval);
      socket.off('game_state_update', handleStateUpdate);
      socket.off('tomato_impact_event', handleTomatoImpact);
      socket.off('taunt_sound_event', handleTauntSound);
      socket.off('connect', joinRoom);
    };
  }, [socket, roomId, user, loading, guestInitializing, modeQuery, gameState]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.chat]);

  if (!gameState) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          border: '4px solid rgba(0, 240, 255, 0.2)',
          borderTopColor: '#00f0ff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <h2 style={{ color: 'var(--text-primary, #fff)', fontSize: '22px', fontWeight: 800, margin: 0 }}>
          Connecting to Board Brawl arena <span style={{ color: '#00f0ff' }}>#{roomId}</span>
        </h2>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', maxWidth: '420px', margin: 0 }}>
          Synchronizing authoritative game state and real-time room channels...
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button
            onClick={() => {
              if (socket) {
                socket.connect();
                socket.emit('join_game_room', {
                  roomId,
                  user: user || { id: `anon_${Date.now()}`, username: 'Guest Tycoon', is_guest: true },
                  isSpectator: false,
                  mode: modeQuery,
                });
                socket.emit('request_game_state', { roomId });
              }
            }}
            style={{
              padding: '10px 18px',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ⚡ Re-sync Room
          </button>
          <button
            onClick={() => router.push('/friends')}
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-primary, #fff)',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Back to Friends Hub
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

  const copyInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nextgengames.gg';
    navigator.clipboard.writeText(`${origin}/join/${roomId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <ScreenShakeWrapper shakeTrigger={shakeTrigger} intensity="heavy">
      {/* Tomato Sabotage Overlay */}
      <TomatoOverlay splatEvent={splatEvent} isVictim={isVictim} />

      {/* Victory Podium */}
      {gameState.status === 'finished' && (
        <VictoryPodium
          winner={gameState.winner}
          winReason={gameState.winReason}
          players={gameState.players}
          onReturnToHub={() => router.push('/friends')}
        />
      )}

      {/* Top Players Header Bar (Inspired by the repo's clean HUD) */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '16px 20px 0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Left: Brand & Room Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(16, 20, 29, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '18px' }}>🎲</span>
            <div>
              <div style={{ fontSize: '10px', color: '#00f0ff', fontWeight: 900, letterSpacing: '0.5px' }}>BOARD BRAWL</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>Room #{roomId}</div>
            </div>
            <button
              onClick={copyInviteLink}
              title="Copy Invite Link"
              style={{
                background: copiedLink ? '#00ff88' : 'rgba(255, 255, 255, 0.08)',
                color: copiedLink ? '#060709' : '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '6px',
              }}
            >
              {copiedLink ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copiedLink ? 'Copied' : 'Invite'}
            </button>
          </div>
        </div>

        {/* Right: Players Roster Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}>
          {gameState.players.map((p, idx) => {
            const isCurrent = idx === gameState.activePlayerIndex && gameState.status === 'playing';
            const isMe = p.id === user?.id;

            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px 6px 6px',
                  borderRadius: '30px',
                  background: isCurrent
                    ? 'rgba(0, 240, 255, 0.12)'
                    : 'rgba(16, 20, 29, 0.85)',
                  border: isCurrent
                    ? `2px solid ${p.avatarColor || '#00f0ff'}`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isCurrent
                    ? `0 0 20px ${p.avatarColor || '#00f0ff'}44`
                    : '0 2px 8px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  opacity: p.isBankrupt ? 0.4 : 1,
                }}
              >
                {/* Character Avatar Circle */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${p.avatarColor || '#00f0ff'}33`,
                  border: `2px solid ${p.avatarColor || '#00f0ff'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  position: 'relative',
                }}>
                  {TOKEN_ICONS[p.avatarToken] || '🎩'}
                </div>

                {/* Name & Monospace Cash */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: isCurrent ? '#fff' : '#cbd5e1',
                    lineHeight: '1.2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span>{p.name}</span>
                    {isMe && <span style={{ fontSize: '9px', color: '#00f0ff' }}>(You)</span>}
                    {p.isBot && <span style={{ fontSize: '9px', color: '#a855f7' }}>[BOT]</span>}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    color: p.isBankrupt ? '#ef4444' : '#00ff88',
                    lineHeight: '1.2',
                  }}>
                    ${p.cash}
                  </div>
                </div>

                {/* Turn countdown ring if active */}
                {isCurrent && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    color: '#00f0ff',
                    padding: '2px 6px',
                    background: 'rgba(0, 240, 255, 0.15)',
                    borderRadius: '8px',
                    marginLeft: '2px',
                  }}>
                    {gameState.turnTimerRemaining}s
                  </span>
                )}

                {/* Direct Tomato Sabotage Button */}
                {!isMe && !p.isBankrupt && gameState.status === 'playing' && myPlayerObj?.freeTomatoes > 0 && (
                  <button
                    onClick={() => handleThrowTomato(p.id)}
                    title={`Hurl tomato at ${p.name}!`}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      transition: 'transform 0.1s',
                      marginLeft: '2px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🍅
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '24px',
        minHeight: 'calc(100vh - 120px)',
      }}>
        {/* Left: The Steady Board Brawl Arena */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Board3D
            properties={gameState.properties}
            players={gameState.players}
            activeTileId={currentPlayer?.position}
            lastDiceResult={gameState.lastDiceResult}
            centerContent={
              gameState.status === 'waiting' ? (
                /* Pre-Match Lobby View */
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: 'rgba(16, 20, 29, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '2px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '16px',
                  boxShadow: '0 0 40px rgba(0, 0, 0, 0.6)',
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎲</div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px 0', color: '#fff' }}>
                    BOARD BRAWL LOBBY
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
                    Room <strong style={{ color: '#00f0ff' }}>#{roomId}</strong> • Mode:{' '}
                    <strong style={{ color: '#00ff88' }}>{gameState.mode?.toUpperCase()}</strong>
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '280px', margin: '0 auto' }}>
                    <button
                      onClick={handleAddBot}
                      disabled={gameState.players.length >= 6}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: gameState.players.length >= 6 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Bot size={16} color="#00f0ff" />
                      + Add Smart AI Bot ({gameState.players.length}/6)
                    </button>

                    <button
                      onClick={handleStartGame}
                      disabled={gameState.players.length < 2}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px',
                        background: gameState.players.length >= 2 ? '#00f0ff' : 'rgba(255, 255, 255, 0.1)',
                        color: gameState.players.length >= 2 ? '#060709' : '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 900,
                        cursor: gameState.players.length >= 2 ? 'pointer' : 'not-allowed',
                        boxShadow: gameState.players.length >= 2 ? '0 0 25px rgba(0, 240, 255, 0.4)' : 'none',
                      }}
                    >
                      <Play size={18} fill={gameState.players.length >= 2 ? '#060709' : '#64748b'} />
                      START MATCH
                    </button>
                  </div>
                </div>
              ) : null
            }
          />

          {/* Floating In-Game Roll Control (Only on active player's roll turn) */}
          {gameState.status === 'playing' && isMyTurn && gameState.turnState === 'roll' && (
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
            }}>
              <DiceRoller3D
                dice={gameState.dice}
                lastResult={gameState.lastDiceResult}
                canRoll={isMyTurn && gameState.turnState === 'roll'}
                onRoll={handleRollDice}
                turnTimer={gameState.turnTimerRemaining}
                isMyTurn={isMyTurn}
              />
            </div>
          )}

          {/* Centered Action Modal Overlay (When player lands on property or opportunity) */}
          {gameState.status === 'playing' && isMyTurn && gameState.turnState === 'action' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 30,
              width: '440px',
              maxWidth: '90%',
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

        {/* Right Sidebar: Live Match Broadcast Feed & Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Match Tactical Sabotage Status */}
          <div style={{
            background: 'rgba(16, 20, 29, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: '11px', color: '#ff3344', fontWeight: 800, textTransform: 'uppercase' }}>
                🍅 Sabotage Arsenal
              </span>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                {myPlayerObj ? `${myPlayerObj.freeTomatoes} Free Tomatoes` : '3 Tomatoes / Match'}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Click 🍅 on any player above to blind & shake screen!
              </div>
            </div>
            <div style={{ fontSize: '28px' }}>🎯</div>
          </div>

          {/* Live In-Game Chat & Taunts */}
          <div style={{
            background: 'rgba(16, 20, 29, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: '260px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                Match Broadcast & Chat
              </span>
              <EmoteWheel
                onSendEmote={(em) => socket.emit('game_action', { roomId, action: 'send_chat', payload: { sender: user?.username || 'Player', text: em } })}
                onSendTaunt={handleSendTaunt}
              />
            </div>

            {/* Chat Messages Log */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '6px',
            }}>
              {gameState.chat?.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: msg.isSystem ? 'rgba(0, 240, 255, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                    color: msg.isSystem ? '#00f0ff' : '#f0f4f8',
                  }}
                >
                  <strong style={{ color: msg.isSystem ? '#00f0ff' : '#a855f7' }}>
                    {msg.sender}:{' '}
                  </strong>
                  <span>{msg.text}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Say something or taunt..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 12px',
                  background: '#00f0ff',
                  color: '#060709',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </ScreenShakeWrapper>
  );
}

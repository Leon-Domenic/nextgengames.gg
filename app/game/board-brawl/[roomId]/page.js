'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSocket } from '@/lib/socket';
import { sounds } from '@/lib/audio';
import ScreenShakeWrapper from '@/components/board-brawl/ScreenShakeWrapper';
import TomatoOverlay from '@/components/board-brawl/TomatoOverlay';
import DiceRoller3D from '@/components/board-brawl/DiceRoller3D';
import Board from '@/components/board-brawl/Board';
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

  const { user, loading } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [splatEvent, setSplatEvent] = useState(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isVictim, setIsVictim] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const socket = getSocket();
  const chatBottomRef = useRef(null);

  // Join Room
  useEffect(() => {
    if (!socket || loading) return;

    // Join game room
    socket.emit('join_game_room', {
      roomId,
      user: user || { id: `anon_${Date.now()}`, username: 'Spectator', is_guest: true },
      isSpectator: !user,
      mode: modeQuery,
    });

    const handleStateUpdate = (newState) => {
      setGameState(newState);
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

    socket.on('game_state_update', handleStateUpdate);
    socket.on('tomato_impact_event', handleTomatoImpact);
    socket.on('taunt_sound_event', handleTauntSound);

    return () => {
      socket.off('game_state_update', handleStateUpdate);
      socket.off('tomato_impact_event', handleTomatoImpact);
      socket.off('taunt_sound_event', handleTauntSound);
    };
  }, [socket, roomId, user, loading, modeQuery]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.chat]);

  if (!gameState) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#00f0ff', fontSize: '18px', fontWeight: 700 }}>
          Connecting to Board Brawl arena #{roomId}...
        </p>
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

      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '24px',
        minHeight: 'calc(100vh - 70px)',
      }}>
        {/* Left: The Board Brawl Arena */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Board
            properties={gameState.properties}
            players={gameState.players}
            activeTileId={currentPlayer?.position}
            centerContent={
              gameState.status === 'waiting' ? (
                /* Pre-Match Lobby View */
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎲</div>
                  <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 8px 0', color: '#fff' }}>
                    BOARD BRAWL LOBBY
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px 0' }}>
                    Room <strong style={{ color: '#00f0ff' }}>#{roomId}</strong> • Mode:{' '}
                    <strong style={{ color: '#00ff88' }}>{gameState.mode?.toUpperCase()}</strong>
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '280px', margin: '0 auto' }}>
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
              ) : (
                /* In-Game Center Stage: Dice & Decision Prompts */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '14px' }}>
                  {/* Turn Status Alert */}
                  <div style={{
                    padding: '8px 18px',
                    borderRadius: '24px',
                    background: `${currentPlayer?.avatarColor || '#00f0ff'}22`,
                    border: `1px solid ${currentPlayer?.avatarColor || '#00f0ff'}`,
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span>{TOKEN_ICONS[currentPlayer?.avatarToken] || '🎩'}</span>
                    <span>
                      {isMyTurn ? "👉 IT'S YOUR TURN!" : `${currentPlayer?.name}'s Turn`}
                    </span>
                    <span style={{ color: '#00f0ff' }}>({gameState.turnTimerRemaining}s)</span>
                  </div>

                  {/* 3D Dice Roller */}
                  <DiceRoller3D
                    dice={gameState.dice}
                    lastResult={gameState.lastDiceResult}
                    canRoll={isMyTurn && gameState.turnState === 'roll'}
                    onRoll={handleRollDice}
                    turnTimer={gameState.turnTimerRemaining}
                    isMyTurn={isMyTurn}
                  />

                  {/* Action Modal (Buy / Buyout / Upgrade) */}
                  {isMyTurn && gameState.turnState === 'action' && (
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
                  )}
                </div>
              )
            }
          />
        </div>

        {/* Right Sidebar: Players, Sabotage Tomatoes & Live Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Room Header & Invite Link */}
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
              <span style={{ fontSize: '11px', color: '#00f0ff', fontWeight: 800 }}>BOARD BRAWL</span>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>Room #{roomId}</div>
            </div>

            <button
              onClick={copyInviteLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: copiedLink ? '#00ff88' : 'rgba(255, 255, 255, 0.06)',
                color: copiedLink ? '#060709' : '#fff',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {copiedLink ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copiedLink ? 'Copied!' : 'Invite Link'}
            </button>
          </div>

          {/* Players Roster & Tactical Tomato Throwing */}
          <div style={{
            background: 'rgba(16, 20, 29, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                Tycoons ({gameState.players.length}/6)
              </span>
              {myPlayerObj && (
                <span style={{ fontSize: '12px', color: '#ff3344', fontWeight: 700 }}>
                  🍅 {myPlayerObj.freeTomatoes} Free Tomatoes
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {gameState.players.map((p, idx) => {
                const isCurrent = idx === gameState.activePlayerIndex && gameState.status === 'playing';
                const isMe = p.id === user?.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: isCurrent ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isCurrent ? `1px solid ${p.avatarColor}` : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      opacity: p.isBankrupt ? 0.4 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: `${p.avatarColor}33`,
                        border: `2px solid ${p.avatarColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                      }}>
                        {TOKEN_ICONS[p.avatarToken] || '🎩'}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {p.name}
                          {p.isBot && <span style={{ fontSize: '10px', color: '#a855f7' }}>[BOT]</span>}
                          {isMe && <span style={{ fontSize: '10px', color: '#00f0ff' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Cash: <strong style={{ color: '#00ff88' }}>${p.cash}</strong> • Net:{' '}
                          <strong>${p.netWorth}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Tomato Thrower Action Button */}
                    {!isMe && !p.isBankrupt && gameState.status === 'playing' && (
                      <button
                        onClick={() => handleThrowTomato(p.id)}
                        title={`Hurl tomato at ${p.name}!`}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(255, 51, 68, 0.15)',
                          border: '1px solid rgba(255, 51, 68, 0.4)',
                          color: '#ff3344',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 0 10px rgba(255, 51, 68, 0.2)',
                        }}
                      >
                        🍅 Throw
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
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

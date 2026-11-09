'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSocket } from '@/lib/socket';
import { sounds } from '@/lib/audio';
import ScreenShakeWrapper from '@/components/board-brawl/ScreenShakeWrapper';
import TomatoOverlay from '@/components/board-brawl/TomatoOverlay';
import TurnAnnouncementBanner from '@/components/board-brawl/TurnAnnouncementBanner';
import DiceRoller3D from '@/components/board-brawl/DiceRoller3D';
import Board3D from '@/components/board-brawl/Board3D';
import ActionModal from '@/components/board-brawl/ActionModal';
import AuctionModal from '@/components/board-brawl/AuctionModal';
import EmoteWheel from '@/components/board-brawl/EmoteWheel';
import VictoryPodium from '@/components/board-brawl/VictoryPodium';
import LobbyView from '@/components/board-brawl/LobbyView';
import CosmeticsShopModal from '@/components/board-brawl/CosmeticsShopModal';
import SettingsModal from '@/components/board-brawl/SettingsModal';
import EventCardModal from '@/components/board-brawl/EventCardModal';
import ActionCardDock from '@/components/board-brawl/ActionCardDock';
import ActionCardPlayOverlay from '@/components/board-brawl/ActionCardPlayOverlay';
import FestivalSelectModal from '@/components/board-brawl/FestivalSelectModal';
import WorldTourSelectModal from '@/components/board-brawl/WorldTourSelectModal';
import DebtLiquidationModal from '@/components/board-brawl/DebtLiquidationModal';
import TileInfoModal from '@/components/board-brawl/TileInfoModal';
import EmojiReactionPicker from '@/components/board-brawl/EmojiReactionPicker';
import EmojiReactionBubble from '@/components/board-brawl/EmojiReactionBubble';
import TradeModal from '@/components/board-brawl/TradeModal';
import TradeNotificationToast from '@/components/board-brawl/TradeNotificationToast';
import {
  Users, Bot, Play, MessageSquare, Send, Sparkles, AlertCircle, Copy, CheckCheck,
  Volume2, VolumeX, Crown, ShieldAlert, X, ShoppingBag, Home, Settings, Clock, ArrowRight, Handshake
} from 'lucide-react';
import { TILES } from '@/lib/board-brawl/types';
import { TOKEN_ICONS, CHARACTERS } from '@/lib/board-brawl/characters.js';
import { useTranslation } from '@/lib/board-brawl/i18n';

const CORNER_SLOT_THEMES = [
  { headerBg: '#e11d48', accent: '#fb7185', name: 'Pink/Red' },
  { headerBg: '#059669', accent: '#34d399', name: 'Green' },
  { headerBg: '#d97706', accent: '#fbbf24', name: 'Yellow' },
  { headerBg: '#0284c7', accent: '#38bdf8', name: 'Blue' },
  { headerBg: '#8b5cf6', accent: '#a78bfa', name: 'Violet' },
  { headerBg: '#06b6d4', accent: '#22d3ee', name: 'Cyan' },
];

export default function BoardBrawlArenaPage() {
  const { t } = useTranslation();
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
  const [inspectedTileId, setInspectedTileId] = useState(null);
  const [lastPaymentEvent, setLastPaymentEvent] = useState(null);
  const [cashFloatingBadges, setCashFloatingBadges] = useState({});
  const [playerReactions, setPlayerReactions] = useState({});
  const [localMatchTimeRemaining, setLocalMatchTimeRemaining] = useState(1200);
  const [tradeTargetPlayer, setTradeTargetPlayer] = useState(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isThrowingTomato, setIsThrowingTomato] = useState(false);
  const [activeCardTargeting, setActiveCardTargeting] = useState(null);

  // Pawn Movement Arrival & Modal Deferral State
  const [movementPendingArrival, setMovementPendingArrival] = useState(false);
  const landedPositionsRef = useRef({});
  const safetyArrivalTimerRef = useRef(null);
  const lastTomatoThrowRef = useRef(0);

  const handlePawnMovementStart = useCallback((playerId, targetTileId) => {
    // Only defer modals for the local player's pawn
    setMovementPendingArrival(true);
    if (safetyArrivalTimerRef.current) clearTimeout(safetyArrivalTimerRef.current);
    safetyArrivalTimerRef.current = setTimeout(() => {
      setMovementPendingArrival(false);
    }, 10000);
  }, []);

  const handlePawnMovementComplete = useCallback((playerId, targetTileId) => {
    if (landedPositionsRef.current) {
      landedPositionsRef.current[playerId] = targetTileId;
    }
    if (safetyArrivalTimerRef.current) {
      clearTimeout(safetyArrivalTimerRef.current);
    }
    // Defer showing ActionModal, EventCardModal, FestivalSelectModal, and WorldTourSelectModal
    // until the pawn has physically arrived and landed on the target tile (+ 350ms pause for visual landing impact)
    setTimeout(() => {
      setMovementPendingArrival(false);
    }, 350);
  }, []);

  // Ensure roll phase is never blocked by movement pending arrival
  useEffect(() => {
    if (gameState?.turnState === 'roll') {
      setMovementPendingArrival(false);
      if (safetyArrivalTimerRef.current) clearTimeout(safetyArrivalTimerRef.current);
    }
  }, [gameState?.turnState]);

  // Sync match timer with server state
  useEffect(() => {
    if (gameState?.matchTimeRemaining != null) {
      setLocalMatchTimeRemaining(gameState.matchTimeRemaining);
    }
  }, [gameState?.matchTimeRemaining]);

  // Smooth local 1-second countdown ticker
  useEffect(() => {
    if (gameState?.status !== 'playing') return;
    const timer = setInterval(() => {
      setLocalMatchTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState?.status]);

  const formatMatchTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return '20:00';
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChangeMode = (newMode) => {
    sounds.playBuy();
    socket?.emit('game_action', {
      roomId,
      action: 'set_game_mode',
      payload: { mode: newMode },
    });
  };

  // Sync background music state reactively
  useEffect(() => {
    sounds.init();
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
      setGuestInitializing(true);
      let isMounted = true;
      playAsGuest().catch(() => {}).finally(() => {
        if (isMounted) setGuestInitializing(false);
      });
      return () => { isMounted = false; };
    }
  }, [loading, user, guestInitializing, playAsGuest]);

  // Join Room & Real-time State Sync (Defensively debounced to prevent socket storms)
  const hasJoinedRef = useRef(false);
  const localPlayerIdRef = useRef(null);
  const gameStateRef = useRef(null);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    // Wait until user authentication is fully resolved to prevent temporary anon ID mismatches
    if (!socket || loading || guestInitializing || !user) return;

    const joinRoom = () => {
      localPlayerIdRef.current = user.id;
      socket.emit('join_game_room', {
        roomId,
        user,
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
    const handlePaymentEvent = (paymentData) => {
      if (!paymentData) return;
      setLastPaymentEvent(paymentData);

      const timestamp = paymentData.timestamp || Date.now();
      const badgeId = `${timestamp}_${Math.random()}`;

      if (paymentData.payerId) {
        setCashFloatingBadges((prev) => ({
          ...prev,
          [paymentData.payerId]: [
            ...(prev[paymentData.payerId] || []),
            {
              id: `debit_${badgeId}`,
              type: 'debit',
              text: `-₩${Number(paymentData.amount || 0).toLocaleString()}`,
            },
          ],
        }));

        const payerObj = gameStateRef.current?.players?.find(p => p.id === paymentData.payerId);
        if (payerObj?.avatarToken) {
          try { sounds.playDistress?.(payerObj.avatarToken); } catch (e) {}
        }
      }

      if (paymentData.receiverId) {
        setCashFloatingBadges((prev) => ({
          ...prev,
          [paymentData.receiverId]: [
            ...(prev[paymentData.receiverId] || []),
            {
              id: `credit_${badgeId}`,
              type: 'credit',
              text: `+₩${Number(paymentData.amount || 0).toLocaleString()}`,
            },
          ],
        }));
      }

      try { sounds.playCash?.(); } catch (e) {}

      setTimeout(() => {
        setCashFloatingBadges((prev) => {
          const next = { ...prev };
          if (paymentData.payerId && next[paymentData.payerId]) {
            next[paymentData.payerId] = next[paymentData.payerId].filter(b => !b.id.includes(badgeId));
          }
          if (paymentData.receiverId && next[paymentData.receiverId]) {
            next[paymentData.receiverId] = next[paymentData.receiverId].filter(b => !b.id.includes(badgeId));
          }
          return next;
        });
      }, 2200);
    };
    socket.on('payment_event', handlePaymentEvent);
    const handlePlayerKicked = ({ playerId }) => {
      const myId = user?.id || localPlayerIdRef.current;
      if (myId && playerId === myId) {
        alert('You were removed from the lobby by the host.');
        router.push('/browsergames');
      }
    };
    socket.on('player_kicked_event', handlePlayerKicked);
    const handleTradeCompleted = () => {
      try { sounds.playDealStruck?.(); } catch (e) {}
    };
    const handleTradeDeclined = () => {
      try { sounds.playBuy?.(); } catch (e) {}
    };
    socket.on('trade_completed_event', handleTradeCompleted);
    socket.on('trade_declined_event', handleTradeDeclined);
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
      socket.off('payment_event', handlePaymentEvent);
      socket.off('player_kicked_event', handlePlayerKicked);
      socket.off('trade_completed_event', handleTradeCompleted);
      socket.off('trade_declined_event', handleTradeDeclined);
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
            onClick={() => router.push('/browsergames')}
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

  const nonBots = gameState.players.filter(p => !p.isBot);
  const myPlayerObj = gameState.players.find(p => p.id === user?.id)
    || gameState.players.find(p => p.id === localPlayerIdRef.current)
    || (nonBots.length === 1 ? nonBots[0] : null);
  const isHost = Boolean(
    myPlayerObj && gameState.players[0] && myPlayerObj.id === gameState.players[0].id
  ) || (gameState.players.length > 0 && !gameState.players[0]?.isBot && (myPlayerObj?.id === gameState.players[0]?.id || !gameState.players.some(p => !p.isBot && p.id !== myPlayerObj?.id)));
  const currentPlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = Boolean(currentPlayer && myPlayerObj && currentPlayer.id === myPlayerObj.id);
  const activePlayerId = myPlayerObj?.id || user?.id;

  // Actions
  const handleStartGame = () => {
    socket.emit('game_action', { roomId, action: 'start_game' });
  };

  const handleAddBot = () => {
    socket.emit('game_action', { roomId, action: 'add_bot' });
  };

  const handleRemovePlayer = (playerId) => {
    sounds.playBuy();
    socket.emit('game_action', {
      roomId,
      action: 'remove_player',
      payload: { playerId }
    });
  };

  const handleSelectCharacter = (charId) => {
    if (!activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'select_character',
      payload: { playerId: activePlayerId, token: charId }
    });
  };

  const handleSelectColor = (colorHex) => {
    if (!activePlayerId) return;
    sounds.playBuy();
    socket.emit('game_action', {
      roomId,
      action: 'select_character',
      payload: { playerId: activePlayerId, color: colorHex }
    });
  };

  const handleSelectDiceSkin = (skinId) => {
    setEquippedDiceSkin(skinId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ngg_equipped_dice_skin', skinId);
    }
    if (activePlayerId) {
      socket.emit('game_action', {
        roomId,
        action: 'select_dice_skin',
        payload: { playerId: activePlayerId, skinId }
      });
    }
  };

  const handleRollDice = () => {
    if (!isMyTurn || !activePlayerId) return;
    setMovementPendingArrival(true);
    if (safetyArrivalTimerRef.current) clearTimeout(safetyArrivalTimerRef.current);
    safetyArrivalTimerRef.current = setTimeout(() => {
      setMovementPendingArrival(false);
    }, 10000);
    socket.emit('game_action', { roomId, action: 'roll_dice', payload: { playerId: activePlayerId } });
  };

  const handleBuyCity = (tileId, level) => {
    socket.emit('game_action', { roomId, action: 'buy_city', payload: { playerId: activePlayerId, tileId, level } });
  };

  const handleBuyoutCity = (tileId) => {
    socket.emit('game_action', { roomId, action: 'buyout_city', payload: { playerId: activePlayerId, tileId } });
  };

  const handleUpgradeCity = (tileId) => {
    socket.emit('game_action', { roomId, action: 'upgrade_city', payload: { playerId: activePlayerId, tileId } });
  };

  const handleEndTurn = () => {
    socket.emit('game_action', { roomId, action: 'end_turn', payload: { playerId: activePlayerId } });
  };

  const handlePlaceBid = (amount) => {
    socket.emit('game_action', {
      roomId,
      action: 'place_bid',
      payload: {
        playerId: activePlayerId,
        amount,
      },
    });
  };

  const handleThrowTomato = (targetPlayerId) => {
    if (!activePlayerId || activePlayerId === targetPlayerId || isThrowingTomato) return;
    const now = Date.now();
    // Strict 2500ms click debounce & lock to guarantee exactly 1 tomato per throw
    if (now - lastTomatoThrowRef.current < 2500) return;
    lastTomatoThrowRef.current = now;
    setIsThrowingTomato(true);
    setTimeout(() => setIsThrowingTomato(false), 2500);

    socket.emit('game_action', {
      roomId,
      action: 'throw_tomato',
      payload: { fromPlayerId: activePlayerId, targetPlayerId }
    });
  };

  const handlePlayActionCard = (cardId, target) => {
    if (!socket || !activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'play_action_card',
      payload: { playerId: activePlayerId, cardId, target }
    });
  };

  const handleDismissEventCard = () => {
    if (!socket || !activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'dismiss_event_card',
      payload: { playerId: activePlayerId }
    });
  };

  const handleSetFestival = (tileId) => {
    if (!socket || !activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'set_festival',
      payload: { playerId: activePlayerId, tileId }
    });
  };

  const handleSelectFlightDestination = (tileId) => {
    if (!socket || !activePlayerId) return;
    try {
      sounds.playFlightTakeoff?.();
    } catch (e) {}
    socket.emit('game_action', {
      roomId,
      action: 'select_flight_destination',
      payload: { playerId: activePlayerId, tileId }
    });
  };

  const handleSkipFlight = () => {
    if (!socket || !activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'skip_flight',
      payload: { playerId: activePlayerId }
    });
  };

  const handlePayBail = () => {
    if (!socket || !activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'pay_bail',
      payload: { playerId: activePlayerId }
    });
  };

  const handleDeclareBankruptcy = () => {
    if (!socket || !activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'declare_bankruptcy',
      payload: { playerId: activePlayerId }
    });
  };

  const handleSellPropertyToBank = (tileId) => {
    if (!socket || !activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'sell_property_to_bank',
      payload: { playerId: activePlayerId, tileId }
    });
  };

  const handleSettleDebt = () => {
    if (!socket || !activePlayerId) return;
    socket.emit('game_action', {
      roomId,
      action: 'settle_debt',
      payload: { playerId: activePlayerId }
    });
  };

  const handleOpenEmergencyTrade = () => {
    const creditor = gameState?.players?.find(p => p.id === gameState?.pendingDebt?.creditorId);
    const opponent = creditor && creditor.id !== activePlayerId && !creditor.isBankrupt
      ? creditor
      : gameState?.players?.find(p => p.id !== activePlayerId && !p.isBankrupt);
    setTradeTargetPlayer(opponent || null);
    setIsTradeModalOpen(true);
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

  const handleOpenTradeWith = (target) => {
    sounds.playBuy();
    setTradeTargetPlayer(target);
    setIsTradeModalOpen(true);
  };

  const handleProposeTrade = ({ proposerId, targetId, offer }) => {
    socket.emit('trade_propose', {
      roomId,
      proposerId,
      targetId,
      offer,
    });
  };

  const handleCounterTrade = (tradeId, updatedOffer) => {
    socket.emit('trade_counter', {
      roomId,
      playerId: activePlayerId,
      tradeId,
      updatedOffer,
    });
  };

  const handleRespondTrade = (tradeId, response) => {
    socket.emit('trade_respond', {
      roomId,
      playerId: activePlayerId,
      tradeId,
      response,
    });
  };

  const handleCancelTrade = (tradeId) => {
    socket.emit('trade_cancel', {
      roomId,
      playerId: activePlayerId,
      tradeId,
    });
    setIsTradeModalOpen(false);
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
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(24px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translate(-50%, -18px) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
          }
        `}</style>
        {/* Tomato Sabotage Overlay with Trajectory Flight & Screen Splat */}
        {/* 2-Second Flight Delay Turn Announcement Banner */}
            <TurnAnnouncementBanner
              activePlayer={currentPlayer}
              isMyTurn={isMyTurn}
              turnState={gameState?.turnState}
              turnIndex={(gameState?.round || 0) * 10 + (gameState?.activePlayerIndex || 0)}
            />

            <TomatoOverlay
          splatEvent={splatEvent}
          currentUserId={myPlayerObj?.id || user?.id}
          players={gameState.players}
          onVictimImpact={() => setShakeTrigger(prev => prev + 1)}
        />

        {/* Action Card Announcement Banner */}
        <ActionCardPlayOverlay lastActionCardPlayed={actionCardPlayEvent || gameState.lastActionCardPlayed} />

        {/* Cinematic Event Card Draw Modal */}
        {!movementPendingArrival && (
          <EventCardModal
            eventData={gameState.activeEventCard}
            isMyTurn={isMyTurn}
            onDismiss={handleDismissEventCard}
          />
        )}

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

        {/* Direct 3D World Map Targeting: World Tour Flight Control Map HUD */}
        {isMyTurn && gameState.turnState === 'flight_select' && !movementPendingArrival && (
          <div
            style={{
              position: 'fixed',
              top: '78px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 75,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 24px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '2px solid #38bdf8',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 28px rgba(56, 189, 248, 0.4)',
              animation: 'fadeIn 0.25s ease-out',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>✈️</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.04em' }}>
                  WORLD TOUR: Click any highlighted destination directly on the board to fly! (Ticket: 50,000 CR)
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Choose unowned city/resort or your own property • Time Remaining: <span style={{ color: '#fef08a', fontWeight: 800 }}>{gameState.turnTimerRemaining}s</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSkipFlight}
              style={{
                padding: '9px 18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#f8fafc',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
            >
              Skip Flight (Roll Dice)
            </button>
          </div>
        )}

        {/* Direct 3D World Map Targeting: Demolition Strike Action Card Banner */}
        {activeCardTargeting?.type === 'demolition' && (
          <div
            style={{
              position: 'fixed',
              top: '78px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 75,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 24px',
              borderRadius: '20px',
              background: 'rgba(30, 10, 15, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '2px solid #ef4444',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 28px rgba(239, 68, 68, 0.45)',
              animation: 'fadeIn 0.25s ease-out',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>💣</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#f87171', letterSpacing: '0.04em' }}>
                  DEMOLITION STRIKE: Click any opponent property directly on the board to demolish!
                </div>
                <div style={{ fontSize: '11px', color: '#fca5a5' }}>
                  Destroys hosted festival or downgrades city tier by 1
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveCardTargeting(null)}
              style={{
                padding: '9px 18px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#fee2e2',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; }}
            >
              Cancel Selection
            </button>
          </div>
        )}

        {/* Direct 3D World Map Targeting: World Fair Festival Banner */}
        {isMyTurn && gameState.turnState === 'festival_select' && !movementPendingArrival && (
          <div
            style={{
              position: 'fixed',
              top: '78px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 75,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 24px',
              borderRadius: '20px',
              background: 'rgba(30, 25, 10, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '2px solid #fbbf24',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 28px rgba(251, 191, 36, 0.45)',
              animation: 'fadeIn 0.25s ease-out',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>🎪</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.04em' }}>
                  WORLD FAIR FESTIVAL: Click one of your cities on the board to host (2x Rent)!
                </div>
                <div style={{ fontSize: '11px', color: '#fef08a' }}>
                  Doubles all rent on the selected property • Time Remaining: <span style={{ fontWeight: 800 }}>{gameState.turnTimerRemaining}s</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleEndTurn(myPlayerObj?.id)}
              style={{
                padding: '9px 18px',
                borderRadius: '12px',
                background: 'rgba(251, 191, 36, 0.22)',
                border: '1px solid rgba(251, 191, 36, 0.45)',
                color: '#fef08a',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.38)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.22)'; }}
            >
              Skip Festival
            </button>
          </div>
        )}

        {/* Debt Liquidation / Insolvency Modal */}
        {isMyTurn && gameState.turnState === 'debt' && !movementPendingArrival && (
          <DebtLiquidationModal
            pendingDebt={gameState.pendingDebt}
            myPlayer={myPlayerObj}
            creditor={gameState.players.find(p => p.id === gameState.pendingDebt?.creditorId)}
            properties={gameState.properties}
            onDeclareBankruptcy={handleDeclareBankruptcy}
            onSellProperty={handleSellPropertyToBank}
            onSettleDebt={handleSettleDebt}
            onOpenTrade={handleOpenEmergencyTrade}
            players={gameState.players}
            turnTimer={gameState.turnTimerRemaining}
                  turnDuration={gameState.turnDuration || (gameState.mode === 'blitz' ? 25 : 35)}
          />
        )}

        {/* P2P Trade & Loan Desk Modal */}
        <TradeModal
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          myPlayer={myPlayerObj}
          targetPlayer={tradeTargetPlayer}
          gameState={gameState}
          onProposeTrade={handleProposeTrade}
          onCounterTrade={handleCounterTrade}
          onRespondTrade={handleRespondTrade}
          onCancelTrade={handleCancelTrade}
        />

        {/* Incoming Trade Notification Toast */}
        <TradeNotificationToast
          activeTrade={gameState.activeTrade}
          myPlayerId={myPlayerObj?.id}
          players={gameState.players}
          onOpenTradeDesk={() => {
            if (gameState.activeTrade) {
              const otherPartyId = gameState.activeTrade.proposerId === myPlayerObj?.id
                ? gameState.activeTrade.targetId
                : gameState.activeTrade.proposerId;
              const rival = gameState.players.find(p => p.id === otherPartyId);
              if (rival) {
                setTradeTargetPlayer(rival);
                setIsTradeModalOpen(true);
              }
            }
          }}
          onDecline={(tradeId) => handleRespondTrade(tradeId, 'decline')}
        />

        {/* Victory Podium */}
        {gameState.status === 'finished' && (
          <VictoryPodium
            winner={gameState.winner}
            winReason={gameState.winReason}
            players={gameState.players}
            mode={gameState.mode}
            lobbyReturnRemaining={gameState.lobbyReturnRemaining}
            autoReturnSeconds={20}
            onReturnToLobby={() => {
              sounds.playBuy();
              socket?.emit('game_action', { roomId, action: 'return_to_lobby' });
            }}
            onReturnToHub={() => router.push('/browsergames')}
            onPlayAgain={() => {
              sounds.playBuy();
              socket?.emit('game_action', { roomId, action: 'return_to_lobby' });
            }}
          />
        )}

        {/* 1. PRE-MATCH LOBBY VIEW (IMAGE 2 BUSINESS TOUR PRIVATE TABLE) */}
        {gameState.status === 'waiting' && (
          <LobbyView
            players={gameState.players}
            user={user}
            isHost={isHost}
            roomId={roomId}
            mode={gameState.mode}
            onChangeMode={handleChangeMode}
            onAddBot={handleAddBot}
            onRemovePlayer={handleRemovePlayer}
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
              onClick={() => router.push('/browsergames')}
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
              title={t('gameSettings')}
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

            {/* Player HUD Capsules (Up to 6 Players Supported) */}
            {(() => {
              const total = gameState.players.length;
              const positions = total <= 4
                ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
                : ['top-left', 'top-right', 'mid-left', 'mid-right', 'bottom-left', 'bottom-right'];

              return gameState.players.map((player, idx) => {
                if (!player) return null;
                const pos = positions[idx] || (idx % 2 === 0 ? 'mid-left' : 'mid-right');
                const theme = CORNER_SLOT_THEMES[idx % CORNER_SLOT_THEMES.length];

                return (
                  <PlayerCornerCard
                    key={player.id || `player-${idx}`}
                    player={player}
                    isCurrent={gameState.activePlayerIndex === idx}
                    isMe={player.id === myPlayerObj?.id}
                    timer={gameState.turnTimerRemaining}
                    turnDuration={gameState.turnDuration || (gameState.mode === 'blitz' ? 25 : 35)}
                    cashBadges={cashFloatingBadges[player.id]}
                    theme={theme}
                    position={pos}
                    isCompact={total > 4}
                    onThrowTomato={handleThrowTomato}
                    isThrowingTomato={isThrowingTomato}
                    canTomato={myPlayerObj?.freeTomatoes > 0 || (myPlayerObj?.cash || 0) >= 50000}
                    myBucketCount={myPlayerObj?.freeTomatoes || 0}
                    activeReaction={playerReactions[player.id]}
                    onSendReaction={(emoji) => handleSendReaction(player.id, emoji)}
                    onOpenTrade={handleOpenTradeWith}
                  />
                );
              });
            })()}

            {/* Top-Middle Game Match Timer & Active Turn Dashboard */}
            <div style={{
              position: 'absolute',
              top: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 35,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              

              {/* 1. Overall Match Countdown Timer (Top Middle Side of Board) */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(10, 15, 29, 0.98) 100%)',
                backdropFilter: 'blur(16px)',
                border: localMatchTimeRemaining <= 120 
                  ? '1.5px solid #ef4444' 
                  : '1.5px solid rgba(56, 189, 248, 0.45)',
                borderRadius: '16px',
                padding: '7px 16px',
                boxShadow: localMatchTimeRemaining <= 120 
                  ? '0 0 20px rgba(239, 68, 68, 0.4), 0 8px 25px rgba(0, 0, 0, 0.45)' 
                  : '0 0 15px rgba(2, 132, 199, 0.25), 0 8px 25px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: gameState.mode === 'normal' 
                    ? 'rgba(245, 158, 11, 0.2)' 
                    : 'rgba(2, 132, 199, 0.25)',
                  border: gameState.mode === 'normal' 
                    ? '1px solid rgba(245, 158, 11, 0.4)' 
                    : '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}>
                  <Clock size={13} color={gameState.mode === 'normal' ? '#f59e0b' : '#38bdf8'} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: gameState.mode === 'normal' ? '#f59e0b' : '#38bdf8',
                  }}>
                    {gameState.mode === 'normal' ? 'NORMAL 60M' : 'BLITZ 20M'}
                  </span>
                </div>

                <div style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: '0.06em',
                  color: localMatchTimeRemaining <= 120 ? '#ef4444' : '#ffffff',
                  textShadow: localMatchTimeRemaining <= 120 
                    ? '0 0 10px rgba(239, 68, 68, 0.6)' 
                    : '0 0 10px rgba(56, 189, 248, 0.4)',
                }}>
                  {formatMatchTime(localMatchTimeRemaining)}
                </div>
              </div>

              {/* 2. Active Player & Turn Timer Pill */}
              {currentPlayer && !currentPlayer.isBankrupt && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '16px',
                  padding: '7px 16px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '190px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
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
                      width: `${Math.min(100, Math.max(0, ((gameState.turnTimerRemaining || 0) / (gameState.turnDuration || (gameState.mode === 'blitz' ? 25 : 35))) * 100))}%`,
                      background: (gameState.turnTimerRemaining || 0) > 6 ? '#22c55e' : (gameState.turnTimerRemaining || 0) > 3 ? '#f59e0b' : '#ef4444',
                      transition: (gameState.turnTimerRemaining || 0) >= ((gameState.turnDuration || (gameState.mode === 'blitz' ? 25 : 35)) - 1) ? 'none' : 'width 0.95s linear, background-color 0.3s ease',
                      boxShadow: (gameState.turnTimerRemaining || 0) <= 3 ? '0 0 8px #ef4444' : 'none',
                    }} />
                  </div>
                </div>
              )}

              {/* 3. Tomato Bucket HUD Capsule */}
              {myPlayerObj && (
                <div
                  title={`Tomato Bucket: ${(myPlayerObj.freeTomatoes || 0) > 0 ? `${myPlayerObj.freeTomatoes} Free in Bucket` : 'Bucket Empty'} ${(myPlayerObj.cash || 0) >= 50000 ? '(Extra throws: 50,000 CR)' : '(50,000 CR needed for extras)'}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(12px)',
                    border: (myPlayerObj.freeTomatoes || 0) > 0 ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '16px',
                    padding: '6px 14px',
                    boxShadow: (myPlayerObj.freeTomatoes || 0) > 0 ? '0 0 16px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.5))' }}>🍅</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: (myPlayerObj.freeTomatoes || 0) > 0 ? '#fca5a5' : '#e2e8f0',
                      letterSpacing: '0.04em',
                      lineHeight: 1.1,
                    }}>
                      {(myPlayerObj.freeTomatoes || 0) > 0 ? `${myPlayerObj.freeTomatoes} FREE` : 'EMPTY (50k CR)'}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      BUCKET
                    </span>
                  </div>
                </div>
              )}
            </div>

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
                title={t('shop')}
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
                title={t('chat')}
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
                title={musicPlaying ? t('muteMusic') : t('playMusic')}
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
                title={t('openSettings')}
                aria-label={t('gameSettings')}
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
              lastPayment={lastPaymentEvent}
              properties={gameState.properties}
              players={gameState.players}
              activeTileId={currentPlayer?.position}
              lastDiceResult={gameState.lastDiceResult}
              diceSkin={myPlayerObj?.diceSkin || equippedDiceSkin}
              communityJackpot={gameState.communityJackpot || 100000}
              centerContent={null}
              onTileClick={(tileId) => setInspectedTileId(tileId)}
              onInspectTile={(tileId) => setInspectedTileId(tileId)}
              onPawnMovementStart={handlePawnMovementStart}
              onPawnMovementComplete={handlePawnMovementComplete}
            />

            {/* Clickable 3D Tile Info Inspector Modal */}
            <TileInfoModal
              isOpen={inspectedTileId !== null}
              tileId={inspectedTileId}
              properties={gameState.properties}
              players={gameState.players}
              onClose={() => setInspectedTileId(null)}
            />

            {/* Floating In-Game Roll Control & Status Bar */}
            {gameState.turnState === 'roll' && (
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
                  activePlayerName={currentPlayer?.name}
                  diceSkin={myPlayerObj?.diceSkin || equippedDiceSkin}
                  isInJail={myPlayerObj?.islandTurns > 0}
                  onPayBail={handlePayBail}
                  canPayBail={(myPlayerObj?.cash || 0) >= 100000}
                />
              </div>
            )}

            {/* Fallback Action & Turn End Safeguard Button (When in Action phase) */}
            {isMyTurn && gameState.turnState === 'action' && (
              <div style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 80,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(16px)',
                border: '2px solid #f59e0b',
                padding: '8px 20px',
                borderRadius: '16px',
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.5), 0 8px 32px rgba(0, 0, 0, 0.6)',
                animation: 'fadeIn 0.25s ease',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#fde047', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    DECISION ACTIVE ({gameState.turnTimerRemaining}s)
                  </span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 700 }}>
                    Buy, Upgrade, or Pass
                  </span>
                </div>

                <button
                  onClick={handleEndTurn}
                  title="Pass this property action and end turn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '13px',
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span>PASS / END TURN</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Centered Property Card Popup Overlay */}
            {isMyTurn && gameState.turnState === 'action' && !movementPendingArrival && (
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
                animation: 'fadeIn 0.3s ease-out',
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
                  turnDuration={gameState.turnDuration || (gameState.mode === 'blitz' ? 25 : 35)}
                />
              </div>
            )}

            {/* Lightning Public Auction Modal */}
            {gameState.auction && gameState.auction.active && (
              <AuctionModal
                auction={gameState.auction}
                myPlayer={myPlayerObj}
                players={gameState.players}
                onPlaceBid={handlePlaceBid}
              />
            )}
          </div>
        )}
      </div>
    </ScreenShakeWrapper>
  );
}

// HUD Player Capsule Component (Supports 2-6 Players)
function PlayerCornerCard({
  player,
  isCurrent,
  isMe,
  timer,
  turnDuration = 25,
  cashBadges = [],
  theme,
  position,
  isCompact = false,
  onThrowTomato,
  isThrowingTomato = false,
  canTomato,
  myBucketCount = 0,
  activeReaction,
  onSendReaction,
  onOpenTrade,
}) {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const isBankrupt = player.isBankrupt;
  const activeChar = CHARACTERS.find(c => c.id === player.avatarToken) || CHARACTERS[0];
  const playerColor = player.avatarColor || theme.headerBg;
  const isResetting = (timer || 0) >= (turnDuration - 1);

  const posStyles = {
    'top-left': { top: '16px', left: '16px' },
    'top-right': { top: '16px', right: '16px' },
    'mid-left': { top: '50%', left: '16px', transform: 'translateY(-50%)' },
    'mid-right': { top: '50%', right: '16px', transform: 'translateY(-50%)' },
    'bottom-left': { bottom: '16px', left: '16px' },
    'bottom-right': { bottom: '16px', right: '16px' },
  }[position] || { top: '16px', left: '16px' };

  return (
    <div
      id={`player-card-${player.id}`}
      style={{
        position: 'absolute',
        ...posStyles,
        width: isCompact ? '230px' : '260px',
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
      {/* Floating Cash Debit / Credit Badges */}
      {cashBadges && cashBadges.map((badge) => (
        <div
          key={badge.id}
          style={{
            position: 'absolute',
            top: '-28px',
            right: '12px',
            padding: '4px 12px',
            borderRadius: '999px',
            fontWeight: 900,
            fontSize: '13px',
            letterSpacing: '0.5px',
            color: '#ffffff',
            background: badge.type === 'debit'
              ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            boxShadow: badge.type === 'debit'
              ? '0 4px 14px rgba(239, 68, 68, 0.7), 0 0 10px rgba(239, 68, 68, 0.4)'
              : '0 4px 14px rgba(16, 185, 129, 0.7), 0 0 10px rgba(16, 185, 129, 0.4)',
            animation: 'cashBadgeFloat 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            zIndex: 100,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {badge.text}
        </div>
      ))}

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
            width: `${Math.min(100, Math.max(0, ((timer || 0) / (turnDuration || 25)) * 100))}%`,
            background: (timer || 0) > 6 ? '#22c55e' : (timer || 0) > 3 ? '#f59e0b' : '#ef4444',
            transition: isResetting ? 'none' : 'width 0.95s linear, background-color 0.3s ease',
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
                {isBankrupt ? t('bankrupt') : (isCurrent ? `⏱️ ${timer}s ${t('timeLeft')}` : t('waiting'))}
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
              {isMe && (
                <span style={{
                  background: (player.freeTomatoes || 0) > 0 ? '#ef4444' : '#475569',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '6px',
                  boxShadow: (player.freeTomatoes || 0) > 0 ? '0 0 6px rgba(239, 68, 68, 0.4)' : 'none',
                }}>
                  🍅 BUCKET: {(player.freeTomatoes || 0) > 0 ? `${player.freeTomatoes} FREE` : 'EMPTY (50k CR)'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right action buttons: Trade & Tomato Sabotage */}
        {!isMe && !isBankrupt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 🤝 Trade Button */}
            <button
              onClick={() => {
                try { onOpenTrade?.(player); } catch (e) {}
              }}
              title={`Trade & negotiate with ${player.name}`}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1.5px solid #00f0ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 240, 255, 0.3)',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🤝
            </button>

            {/* Tomato Sabotage */}
            {canTomato && (
              <button
                disabled={isThrowingTomato}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (isThrowingTomato) return;
                  try { onThrowTomato?.(player.id); } catch (err) {}
                }}
                title={isThrowingTomato ? 'Reloading tomato...' : `🍅 Throw Tomato at ${player.name} (${myBucketCount > 0 ? `${myBucketCount} in Bucket` : '50k CR'})`}
                style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isThrowingTomato ? 'rgba(100, 116, 139, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                  border: isThrowingTomato ? '1.5px solid #64748b' : '1.5px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  cursor: isThrowingTomato ? 'not-allowed' : 'pointer',
                  opacity: isThrowingTomato ? 0.45 : 1,
                  boxShadow: isThrowingTomato ? 'none' : '0 2px 8px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.15s ease',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => { if (!isThrowingTomato) e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span>{isThrowingTomato ? '⌛' : '🍅'}</span>
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: isThrowingTomato ? '#64748b' : myBucketCount > 0 ? '#ef4444' : '#0284c7',
                  color: '#ffffff',
                  fontSize: '8px',
                  fontWeight: 900,
                  padding: '1px 4px',
                  borderRadius: '999px',
                  lineHeight: 1,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}>
                  {isThrowingTomato ? '⌛' : myBucketCount > 0 ? `x${myBucketCount}` : '50k'}
                </span>
              </button>
            )}
          </div>
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

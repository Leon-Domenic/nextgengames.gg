'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Crown, Flame, Target, ArrowRight, Clock, Coins, Building2, RotateCcw } from 'lucide-react';
import { TOKEN_ICONS } from '@/lib/board-brawl/characters';

export default function VictoryPodium({
  winner,
  winReason,
  players = [],
  mode = 'blitz',
  lobbyReturnRemaining,
  autoReturnSeconds = 20,
  onReturnToLobby,
  onReturnToHub,
  onPlayAgain,
}) {
  const initialSeconds = typeof lobbyReturnRemaining === 'number' && lobbyReturnRemaining > 0
    ? lobbyReturnRemaining
    : autoReturnSeconds;
  const [countdown, setCountdown] = useState(initialSeconds);

  useEffect(() => {
    if (typeof lobbyReturnRemaining === 'number' && lobbyReturnRemaining > 0) {
      setCountdown(lobbyReturnRemaining);
    }
  }, [lobbyReturnRemaining]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onReturnToLobby) onReturnToLobby();
          else if (onPlayAgain) onPlayAgain();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onReturnToLobby, onPlayAgain]);
  useEffect(() => {
    // Blast celebratory confetti on podium reveal
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 400);
    } catch (e) {}
  }, []);

  // Compute final rankings: winner always #1, then active players by net worth desc, then bankrupt players
  const rankedPlayers = [...players].sort((a, b) => {
    if (a.id === winner?.id) return -1;
    if (b.id === winner?.id) return 1;
    if (a.isBankrupt && !b.isBankrupt) return 1;
    if (!a.isBankrupt && b.isBankrupt) return -1;
    return (b.netWorth || 0) - (a.netWorth || 0);
  });

  const tomatoTerrorist = [...players].sort((a, b) => (b.tomatoesThrown || 0) - (a.tomatoesThrown || 0))[0];
  const juiceSponge = [...players].sort((a, b) => (b.tomatoesHit || 0) - (a.tomatoesHit || 0))[0];

  const getRankBadge = (index) => {
    if (index === 0) {
      return {
        label: '1ST',
        sub: 'CHAMPION',
        icon: <Crown size={18} color="#f59e0b" />,
        border: '1.5px solid #f59e0b',
        bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.12) 100%)',
        textColor: '#fbbf24',
        shadow: '0 0 20px rgba(245, 158, 11, 0.35)',
      };
    }
    if (index === 1) {
      return {
        label: '2ND',
        sub: 'RUNNER UP',
        icon: <Medal size={18} color="#94a3b8" />,
        border: '1.5px solid #94a3b8',
        bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.18) 0%, rgba(100, 116, 139, 0.08) 100%)',
        textColor: '#e2e8f0',
        shadow: '0 0 15px rgba(148, 163, 184, 0.2)',
      };
    }
    if (index === 2) {
      return {
        label: '3RD',
        sub: '3RD PLACE',
        icon: <Medal size={18} color="#d97706" />,
        border: '1.5px solid #d97706',
        bg: 'linear-gradient(135deg, rgba(217, 119, 6, 0.18) 0%, rgba(180, 83, 9, 0.08) 100%)',
        textColor: '#fcd34d',
        shadow: '0 0 15px rgba(217, 119, 6, 0.2)',
      };
    }
    return {
      label: `${index + 1}TH`,
      sub: `RANK #${index + 1}`,
      icon: null,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      bg: 'rgba(255, 255, 255, 0.04)',
      textColor: '#94a3b8',
      shadow: 'none',
    };
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'rgba(6, 7, 12, 0.96)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto',
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%)',
        border: '2px solid rgba(56, 189, 248, 0.5)',
        boxShadow: '0 0 70px rgba(2, 132, 199, 0.35)',
        borderRadius: '24px',
        padding: '32px 28px',
        textAlign: 'center',
      }}>
        {/* Top Trophy Trophy Icon */}
        <div style={{
          width: '76px',
          height: '76px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(2, 132, 199, 0.25) 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px auto',
          border: '2px solid #f59e0b',
          boxShadow: '0 0 35px rgba(245, 158, 11, 0.45)',
        }}>
          <Trophy size={40} color="#fbbf24" />
        </div>

        {/* Mode & Concluded Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            fontSize: '11px',
            color: mode === 'normal' ? '#f59e0b' : '#38bdf8',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            background: mode === 'normal' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: mode === 'normal' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '999px',
            padding: '3px 12px',
          }}>
            {mode === 'normal' ? '🏆 60-MINUTE NORMAL MODE' : '⚡ 20-MINUTE BLITZ MODE'}
          </span>
          <span style={{
            fontSize: '11px',
            color: '#94a3b8',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            MATCH CONCLUDED
          </span>
        </div>

        {/* Winner Name */}
        <h1 style={{
          fontSize: '34px',
          fontWeight: 900,
          margin: '4px 0 6px 0',
          color: '#ffffff',
          letterSpacing: '-0.02em',
          textShadow: '0 2px 14px rgba(255, 255, 255, 0.3)',
        }}>
          {winner?.name || 'Player'} WINS!
        </h1>

        {/* Victory Condition Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#94a3b8',
          fontSize: '13px',
          background: 'rgba(255, 255, 255, 0.06)',
          padding: '6px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '26px',
        }}>
          <span>Victory Condition:</span>
          <strong style={{ color: '#00ff88', textTransform: 'uppercase' }}>
            {winReason || 'Highest Asset Valuation'}
          </strong>
        </div>

        {/* ============================================================== */}
        {/* FINAL SCOREBOARD & STANDINGS PLACINGS */}
        {/* ============================================================== */}
        <div style={{
          textAlign: 'left',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            padding: '0 4px',
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 900,
              color: '#38bdf8',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
            }}>
              📊 FINAL SCOREBOARD & STANDINGS
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Ranked by Combined Assets (Cash + Properties)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rankedPlayers.map((player, idx) => {
              if (!player) return null;
              const badge = getRankBadge(idx);
              const isWinner = player.id === winner?.id;
              const playerColor = player.avatarColor || '#00f0ff';
              const tokenKey = player.avatarToken || 'hat';
              const tokenEmoji = TOKEN_ICONS[tokenKey] || '🎩';

              return (
                <div
                  key={player.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: badge.bg,
                    border: badge.border,
                    boxShadow: badge.shadow,
                    transition: 'transform 0.1s ease',
                  }}
                >
                  {/* Left: Rank & Player info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Rank Indicator */}
                    <div style={{
                      minWidth: '44px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '14px',
                        fontWeight: 900,
                        color: badge.textColor,
                      }}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: badge.textColor,
                        opacity: 0.8,
                        letterSpacing: '0.04em',
                      }}>
                        {badge.sub}
                      </span>
                    </div>

                    {/* Avatar & Player Name */}
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: `2px solid ${playerColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      boxShadow: `0 0 10px ${playerColor}44`,
                    }}>
                      {tokenEmoji}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: '#ffffff',
                        }}>
                          {player.name}
                        </span>
                        {player.isBot && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(148, 163, 184, 0.2)',
                            color: '#94a3b8',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                          }}>
                            BOT
                          </span>
                        )}
                        {isWinner && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#f59e0b',
                            color: '#000',
                          }}>
                            WINNER
                          </span>
                        )}
                        {player.isBankrupt && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                          }}>
                            BANKRUPT
                          </span>
                        )}
                      </div>

                      {/* Sub-breakdown of Cash & Properties */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '11px',
                        color: '#94a3b8',
                        marginTop: '2px',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Coins size={12} color="#fbbf24" />
                          Cash: ₩{(player.cash || 0).toLocaleString()}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Building2 size={12} color="#38bdf8" />
                          Properties: {player.propertiesCount || 0}
                          {player.landmarksCount > 0 && ` (${player.landmarksCount} 🏰)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Asset Value */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 900,
                      color: isWinner ? '#fbbf24' : '#00ff88',
                      fontFamily: 'monospace',
                      letterSpacing: '0.03em',
                    }}>
                      ₩{(player.netWorth || 0).toLocaleString()}
                    </div>
                    <span style={{
                      fontSize: '10px',
                      color: '#64748b',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      Total Valuation
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hall of Fame Awards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '26px' }}>
          <div style={{
            background: 'rgba(255, 51, 68, 0.1)',
            border: '1px solid rgba(255, 51, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
              <Flame size={15} color="#ff3344" />
              <strong style={{ fontSize: '11px', color: '#ff6677', textTransform: 'uppercase' }}>Tomato Terrorist</strong>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
              {tomatoTerrorist?.name || 'None'}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {tomatoTerrorist?.tomatoesThrown || 0} Tomatoes Thrown
            </span>
          </div>

          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
              <Target size={15} color="#eab308" />
              <strong style={{ fontSize: '11px', color: '#eab308', textTransform: 'uppercase' }}>Juice Sponge</strong>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
              {juiceSponge?.name || 'None'}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {juiceSponge?.tomatoesHit || 0} Splats Absorbed
            </span>
          </div>
        </div>

        {/* Auto Return Countdown Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '14px',
          padding: '12px 18px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#38bdf8" />
            <span style={{ fontSize: '13px', color: '#e0f2fe', fontWeight: 700 }}>
              Auto-returning to room lobby in <strong style={{ color: '#38bdf8', fontSize: '15px' }}>{countdown}s</strong>
            </span>
          </div>

          <div style={{
            width: '120px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, (countdown / autoReturnSeconds) * 100))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #38bdf8 0%, #00f0ff 100%)',
              transition: 'width 1s linear',
            }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              if (onReturnToLobby) onReturnToLobby();
              else if (onPlayAgain) onPlayAgain();
            }}
            style={{
              flex: 1.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
              color: '#060709',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={17} />
            RETURN TO LOBBY ({countdown}s)
          </button>

          <button
            onClick={onReturnToHub}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              border: '1.5px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            LEAVE TO HUB
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

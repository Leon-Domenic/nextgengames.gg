'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/audio';
import { DICE_SKIN_MAP, DICE_SKINS } from '@/lib/board-brawl/diceSkins';
import { Dices, Sparkles } from 'lucide-react';

export default function DiceRoller3D({
  dice = [1, 1],
  lastResult,
  canRoll,
  onRoll,
  turnTimer,
  isMyTurn,
  diceSkin = 'classic_red',
  isInJail = false,
  onPayBail,
  canPayBail = false,
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [showDoublesCelebration, setShowDoublesCelebration] = useState(false);
  const lastRollIdRef = useRef(null);

  const skin = DICE_SKIN_MAP[diceSkin] || DICE_SKINS[0];

  useEffect(() => {
    // Only trigger rolling animation when a NEW unique roll ID arrives
    if (!lastResult || !lastResult.id || lastResult.id === lastRollIdRef.current) return;
    lastRollIdRef.current = lastResult.id;

    setIsRolling(true);
    sounds.playDiceRoll();

    const isFast = typeof window !== 'undefined' && localStorage.getItem('ngg_fast_dice_enabled') === 'true';
    const rollDuration = isFast ? 320 : 750;

    const rollTimeout = setTimeout(() => {
      setIsRolling(false);
      if (lastResult.isDoubles) {
        sounds.playDoublesSurge();
        setShowDoublesCelebration(true);
        setTimeout(() => setShowDoublesCelebration(false), isFast ? 1400 : 2400);
      }
    }, rollDuration);

    return () => clearTimeout(rollTimeout);
  }, [lastResult]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 20px',
      background: 'rgba(15, 23, 42, 0.94)',
      backdropFilter: 'blur(16px)',
      borderRadius: '18px',
      border: isMyTurn && canRoll ? `2px solid ${skin.accentColor || '#00f0ff'}` : '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: isMyTurn && canRoll ? `0 0 30px ${skin.accentColor || '#00f0ff'}55` : '0 4px 20px rgba(0, 0, 0, 0.5)',
      position: 'relative',
      userSelect: 'none',
      gap: '8px',
    }}>
      {/* Doubles Celebration Banner */}
      {showDoublesCelebration && (
        <div style={{
          position: 'absolute',
          top: '-26px',
          background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
          padding: '6px 18px',
          borderRadius: '20px',
          color: '#fff',
          fontWeight: 900,
          fontSize: '13px',
          letterSpacing: '1px',
          boxShadow: '0 0 25px #00f0ff',
          zIndex: 10,
        }}>
          ✨ DOUBLES! EXTRA ROLL! ✨
        </div>
      )}

      {/* Equipped Dice Skin Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 800,
        color: skin.accentColor || '#fef08a',
        background: 'rgba(255, 255, 255, 0.06)',
        padding: '2px 10px',
        borderRadius: '10px',
      }}>
        <span>{skin.icon || '🎲'}</span>
        <span>{skin.name}</span>
      </div>

      {/* Real-time Roll Control */}
      {isMyTurn && canRoll ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={onRoll}
            disabled={isRolling}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 32px',
              background: `linear-gradient(135deg, ${skin.accentColor || '#00f0ff'} 0%, #0284c7 100%)`,
              color: '#060709',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '16px',
              letterSpacing: '0.5px',
              cursor: isRolling ? 'default' : 'pointer',
              boxShadow: `0 0 25px ${skin.accentColor || '#00f0ff'}66, inset 0 1px 1px rgba(255, 255, 255, 0.4)`,
              transition: 'all 0.15s ease',
              transform: isRolling ? 'scale(0.96)' : 'scale(1)',
            }}
          >
            <Dices size={22} className={isRolling ? 'animate-spin' : ''} />
            {isRolling
              ? 'ROLLING 3D DICE...'
              : isInJail
              ? `ROLL FOR DOUBLES (${turnTimer}s)`
              : `ROLL 3D DICE (${turnTimer}s)`}
          </button>

          {/* Active Roll Timer Countdown Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, ((turnTimer || 0) / 15) * 100))}%`,
              backgroundColor: (turnTimer || 0) > 6 ? '#22c55e' : (turnTimer || 0) > 3 ? '#f59e0b' : '#ef4444',
              transition: 'width 0.9s linear, background-color 0.3s ease',
              boxShadow: (turnTimer || 0) <= 3 ? '0 0 8px #ef4444' : 'none',
            }} />
          </div>

          {isInJail && (
            <button
              onClick={() => onPayBail?.()}
              disabled={!canPayBail}
              style={{
                padding: '6px 14px',
                background: canPayBail ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: canPayBail ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                color: canPayBail ? '#fef08a' : '#64748b',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: canPayBail ? 'pointer' : 'not-allowed',
                letterSpacing: '0.04em',
              }}
            >
              🌴 PAY 100 CR BAIL & ESCAPE
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#94a3b8',
          fontWeight: 700,
        }}>
          <span>🎲</span>
          <span>{isMyTurn ? 'Resolving action...' : `Awaiting turn... (${turnTimer}s)`}</span>
        </div>
      )}
    </div>
  );
}

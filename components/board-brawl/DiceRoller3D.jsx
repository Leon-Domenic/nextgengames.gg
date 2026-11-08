'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '@/lib/audio';
import { Dices, Sparkles } from 'lucide-react';

export default function DiceRoller3D({
  dice = [1, 1],
  lastResult,
  canRoll,
  onRoll,
  turnTimer,
  isMyTurn,
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [showDoublesCelebration, setShowDoublesCelebration] = useState(false);

  useEffect(() => {
    if (!lastResult) return;
    setIsRolling(true);
    sounds.playDiceRoll();

    const rollTimeout = setTimeout(() => {
      setIsRolling(false);
      if (lastResult.isDoubles) {
        sounds.playDoublesSurge();
        setShowDoublesCelebration(true);
        setTimeout(() => setShowDoublesCelebration(false), 2400);
      }
    }, 800);

    return () => clearTimeout(rollTimeout);
  }, [lastResult]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px 20px',
      background: 'rgba(16, 22, 34, 0.88)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: isMyTurn ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: isMyTurn ? '0 0 30px rgba(0, 240, 255, 0.35)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
      position: 'relative',
      userSelect: 'none',
    }}>
      {/* Doubles Electric Surge Banner */}
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
          animation: 'pulse 0.8s infinite alternate',
          zIndex: 10,
        }}>
          ✨ DOUBLES! EXTRA ROLL! ✨
        </div>
      )}

      {/* Real-time Roll Control */}
      {isMyTurn && canRoll ? (
        <button
          onClick={onRoll}
          disabled={isRolling}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
            color: '#060709',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 900,
            fontSize: '16px',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
            transition: 'all 0.15s ease',
            transform: isRolling ? 'scale(0.96)' : 'scale(1)',
          }}
        >
          <Dices size={22} className={isRolling ? 'animate-spin' : ''} />
          {isRolling ? 'ROLLING 3D DICE...' : `ROLL 3D DICE (${turnTimer}s)`}
        </button>
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

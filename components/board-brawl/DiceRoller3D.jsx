'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '@/lib/audio';
import { Dices, Sparkles } from 'lucide-react';

const PIP_COORDS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [25, 75], [75, 25], [75, 75]],
  5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
  6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
};

// Rotations for 3D cube faces
const FACE_ROTATIONS = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateX(-90deg) rotateY(0deg)',
  3: 'rotateY(90deg)',
  4: 'rotateY(-90deg)',
  5: 'rotateX(90deg) rotateY(0deg)',
  6: 'rotateX(180deg) rotateY(0deg)',
};

function Die3D({ value, rolling }) {
  const pips = PIP_COORDS[value] || PIP_COORDS[1];

  return (
    <div style={{
      width: '64px',
      height: '64px',
      perspective: '600px',
      display: 'inline-block',
      margin: '0 8px',
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: rolling ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: rolling
          ? `rotateX(${Math.random() * 720}deg) rotateY(${Math.random() * 720}deg) rotateZ(${Math.random() * 720}deg)`
          : (FACE_ROTATIONS[value] || FACE_ROTATIONS[1]),
      }}>
        {/* Face 1 (Front) */}
        <div style={{
          position: 'absolute',
          width: '64px',
          height: '64px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2), 0 4px 15px rgba(0,0,0,0.5)',
          transform: 'translateZ(32px)',
        }}>
          {pips.map(([x, y], idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: value === 1 ? '#ff3344' : '#111827',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
    }, 600);

    return () => clearTimeout(rollTimeout);
  }, [lastResult]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(16, 20, 29, 0.85)',
      borderRadius: '16px',
      border: isMyTurn ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: isMyTurn ? '0 0 25px rgba(0, 240, 255, 0.3)' : 'none',
      position: 'relative',
    }}>
      {/* Doubles Electric Surge Banner */}
      {showDoublesCelebration && (
        <div style={{
          position: 'absolute',
          top: '-24px',
          background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
          padding: '6px 16px',
          borderRadius: '20px',
          color: '#fff',
          fontWeight: 900,
          fontSize: '13px',
          letterSpacing: '1px',
          boxShadow: '0 0 20px #00f0ff',
          animation: 'pulse 0.8s infinite alternate',
          zIndex: 10,
        }}>
          ✨ DOUBLES! EXTRA ROLL! ✨
        </div>
      )}

      {/* 3D Dice Stage */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 16px 0' }}>
        <Die3D value={dice[0]} rolling={isRolling} />
        <Die3D value={dice[1]} rolling={isRolling} />
      </div>

      {/* Dice Total */}
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', marginBottom: '12px' }}>
        Sum: <span style={{ color: '#fff', fontSize: '18px' }}>{dice[0] + dice[1]}</span>
      </div>

      {/* Roll Action Button */}
      {isMyTurn && canRoll ? (
        <button
          onClick={onRoll}
          disabled={isRolling}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #00f0ff, #0ea5e9)',
            color: '#060709',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 900,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
            transition: 'transform 0.1s ease',
          }}
        >
          <Dices size={18} />
          ROLL DICE ({turnTimer}s)
        </button>
      ) : (
        <div style={{
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#64748b',
          fontWeight: 600,
        }}>
          {isMyTurn ? 'Evaluating tile...' : `Waiting for player... (${turnTimer}s)`}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { CARD_RARITY } from '@/lib/board-brawl/cards';
import { sounds } from '@/lib/audio';
import { Sparkles, Zap, Shield, Flame } from 'lucide-react';

export default function CardYoinkOverlay({
  yoinkData,
  currentUserId,
  onComplete,
}) {
  const [phase, setPhase] = useState('approach'); // 'approach' | 'pinch' | 'yoink' | 'pull' | 'result'
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!yoinkData || !yoinkData.stolenCard) return;

    setVisible(true);
    setPhase('approach');

    // Audio sequence
    try {
      sounds.playPawnStep?.();
    } catch (e) {}

    // Timeline
    // 1. Approach -> Pinch Clamp at 600ms
    const t1 = setTimeout(() => {
      setPhase('pinch');
      try {
        sounds.playCardDraw?.();
        sounds.playTaunt?.();
      } catch (e) {}
    }, 600);

    // 2. Pinch -> Yoink Burst at 950ms
    const t2 = setTimeout(() => {
      setPhase('yoink');
      try {
        sounds.playDoublesSurge?.();
      } catch (e) {}
    }, 950);

    // 3. Fast Pull / Snatched at 1450ms
    const t3 = setTimeout(() => {
      setPhase('pull');
      try {
        sounds.playCash?.();
      } catch (e) {}
    }, 1450);

    // 4. Result Banner at 2100ms
    const t4 = setTimeout(() => {
      setPhase('result');
    }, 2100);

    // 5. Complete / Dismiss at 3200ms
    const t5 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300);
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [yoinkData, onComplete]);

  if (!visible || !yoinkData || !yoinkData.stolenCard) return null;

  const { thiefName, victimName, thiefId, victimId, stolenCard } = yoinkData;
  const isMeThief = String(thiefId) === String(currentUserId);
  const isMeVictim = String(victimId) === String(currentUserId);
  const rarity = CARD_RARITY[stolenCard.rarity] || CARD_RARITY.EPIC;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 130,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'yoinkFadeIn 0.25s ease-out',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes yoinkFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sneakyCreep {
          0% { transform: translate(120px, -180px) rotate(15deg); }
          50% { transform: translate(40px, -70px) rotate(-8deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        @keyframes pinchSnap {
          0% { transform: scale(1.15) rotate(0deg); }
          50% { transform: scale(0.92) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes cardSquash {
          0% { transform: scale(1); }
          40% { transform: scale(1.06, 0.9); }
          100% { transform: scale(1); }
        }
        @keyframes comicPop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.35) rotate(8deg); opacity: 1; }
          80% { transform: scale(1.05) rotate(-3deg); }
          100% { transform: scale(1.15) rotate(4deg); }
        }
        @keyframes yoinkSwoosh {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          30% { transform: translate(-30px, 20px) rotate(-8deg) scale(1.02); }
          100% { transform: translate(-420px, -360px) rotate(-38deg) scale(0.35); opacity: 0; }
        }
        @keyframes speedLineDash {
          0% { stroke-dashoffset: 60; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>

      {/* Top Banner Tag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 20px',
          borderRadius: '999px',
          background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '13px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          boxShadow: '0 0 25px rgba(245, 158, 11, 0.6)',
          marginBottom: '20px',
        }}
      >
        <span>🤏</span>
        <span>{isMeThief ? 'YOU YOINKED A CARD!' : isMeVictim ? 'YOUR CARD WAS STOLEN!' : 'CARD HEIST IN PROGRESS!'}</span>
        <Sparkles size={16} />
      </div>

      {/* Subtitle Description */}
      <div
        style={{
          color: '#f8fafc',
          fontSize: '20px',
          fontWeight: 900,
          textAlign: 'center',
          marginBottom: '36px',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        }}
      >
        <span style={{ color: '#38bdf8' }}>{thiefName}</span>
        <span style={{ color: '#94a3b8', margin: '0 8px' }}>is snatching a card from</span>
        <span style={{ color: '#f43f5e' }}>{victimName}</span>!
      </div>

      {/* MAIN YOINK STAGE */}
      <div
        style={{
          position: 'relative',
          width: '320px',
          height: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* THE CARD BEING YOINKED */}
        <div
          style={{
            position: 'absolute',
            width: '230px',
            height: '320px',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, #0b1329 0%, #172554 50%, #090d1a 100%)',
            border: `3px solid ${rarity.border}`,
            boxShadow: `0 0 40px ${rarity.border}66, 0 20px 40px rgba(0, 0, 0, 0.7)`,
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#ffffff',
            transformOrigin: 'top center',
            animation:
              phase === 'pull'
                ? 'yoinkSwoosh 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards'
                : phase === 'pinch' || phase === 'yoink'
                ? 'cardSquash 0.35s ease-out'
                : 'none',
          }}
        >
          {/* Card Top Pill */}
          <div
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              background: rarity.border,
              color: '#000000',
              fontWeight: 900,
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            {stolenCard.rarity} ACTION
          </div>

          {/* Card Big Icon */}
          <div
            style={{
              fontSize: '56px',
              marginBottom: '10px',
              filter: `drop-shadow(0 0 15px ${rarity.border}88)`,
            }}
          >
            {stolenCard.icon || '🃏'}
          </div>

          {/* Card Title */}
          <div
            style={{
              fontSize: '17px',
              fontWeight: 900,
              color: '#ffffff',
              marginBottom: '6px',
              letterSpacing: '-0.01em',
            }}
          >
            {stolenCard.title}
          </div>

          {/* Badge */}
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: rarity.border,
              letterSpacing: '0.08em',
              marginBottom: '12px',
            }}
          >
            [{stolenCard.badge || 'TACTICAL'}]
          </div>

          {/* Card Description */}
          <div
            style={{
              fontSize: '11px',
              lineHeight: 1.4,
              color: '#cbd5e1',
              fontWeight: 600,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {stolenCard.summary || stolenCard.description}
          </div>

          {/* Stolen From Victim Tag */}
          <div
            style={{
              marginTop: '10px',
              fontSize: '10px',
              fontWeight: 800,
              color: '#f43f5e',
              background: 'rgba(244, 63, 94, 0.15)',
              padding: '3px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(244, 63, 94, 0.3)',
            }}
          >
            From: {victimName}
          </div>
        </div>

        {/* PINCHED FINGERS / HAND SVG */}
        <div
          style={{
            position: 'absolute',
            top: '-70px',
            left: '50%',
            width: '180px',
            height: '200px',
            marginLeft: '-90px',
            zIndex: 10,
            transformOrigin: '50% 85%',
            animation:
              phase === 'approach'
                ? 'sneakyCreep 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                : phase === 'pinch' || phase === 'yoink'
                ? 'pinchSnap 0.35s ease-out forwards'
                : phase === 'pull'
                ? 'yoinkSwoosh 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards'
                : 'none',
          }}
        >
          <svg viewBox="0 0 200 240" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              {/* Shading gradients for cartoon hand */}
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="50%" stopColor="#fba663" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient id="gloveCuff" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <filter id="handShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.6)" />
              </filter>
            </defs>

            {/* Arm / Cyber Cuff reaching down from top right */}
            <path
              d="M 120 0 L 175 0 L 155 75 L 105 70 Z"
              fill="url(#gloveCuff)"
              stroke="#0f172a"
              strokeWidth="4"
            />
            {/* Cyber Neon Band */}
            <path
              d="M 110 65 Q 130 78 153 72"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Hand Group with Pinch Fingers */}
            <g filter="url(#handShadow)">
              {/* Back of Hand / Palm */}
              <path
                d="M 105 70 C 85 85, 75 110, 85 135 C 95 155, 115 165, 130 150 C 145 135, 155 105, 150 75 Z"
                fill="url(#skinGrad)"
                stroke="#7c2d12"
                strokeWidth="4"
              />

              {/* Folded Pinky, Ring & Middle fingers tucked in back */}
              <path
                d="M 128 135 C 140 142, 148 130, 140 120 C 132 110, 125 125, 128 135 Z"
                fill="#fba663"
                stroke="#7c2d12"
                strokeWidth="3.5"
              />
              <path
                d="M 118 145 C 130 155, 138 140, 130 130 C 122 120, 115 135, 118 145 Z"
                fill="#fba663"
                stroke="#7c2d12"
                strokeWidth="3.5"
              />

              {/* CURVED INDEX FINGER (Pinching down from left) */}
              <path
                d="M 88 115 C 75 130, 78 160, 92 182 C 98 192, 106 195, 108 190 C 112 180, 106 160, 102 145 C 100 135, 102 125, 106 118 Z"
                fill="url(#skinGrad)"
                stroke="#7c2d12"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* Index Finger Tip & Nail */}
              <ellipse cx="106" cy="188" rx="5" ry="4" fill="#ffedd5" stroke="#7c2d12" strokeWidth="1.5" />

              {/* CURVED THUMB (Pinching up and clamping against Index Finger) */}
              <path
                d="M 120 130 C 128 145, 126 168, 114 186 C 110 192, 104 193, 103 188 C 102 180, 108 165, 112 150 C 114 140, 116 132, 120 130 Z"
                fill="url(#skinGrad)"
                stroke="#7c2d12"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* Thumb Tip & Nail */}
              <ellipse cx="104" cy="188" rx="4" ry="4" fill="#ffedd5" stroke="#7c2d12" strokeWidth="1.5" />

              {/* PINCH CLAMP CONTACT POINT (Sparks at (105, 190)) */}
              {(phase === 'pinch' || phase === 'yoink' || phase === 'pull') && (
                <g transform="translate(105, 190)">
                  <circle cx="0" cy="0" r="10" fill="#facc15" opacity="0.8" />
                  <path d="M 0 -16 L 3 -4 L 15 0 L 3 4 L 0 16 L -3 4 L -15 0 L -3 -4 Z" fill="#ffffff" />
                  <circle cx="-8" cy="-8" r="2.5" fill="#f59e0b" />
                  <circle cx="8" cy="-8" r="2.5" fill="#f59e0b" />
                  <circle cx="-6" cy="9" r="2" fill="#ef4444" />
                  <circle cx="7" cy="9" r="2" fill="#ef4444" />
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* COMIC "YOINK!" BURST BUBBLE */}
        {(phase === 'yoink' || phase === 'pull') && (
          <div
            style={{
              position: 'absolute',
              top: '30px',
              right: '-40px',
              zIndex: 25,
              animation: 'comicPop 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
            }}
          >
            <div
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #facc15 0%, #f59e0b 50%, #ef4444 100%)',
                color: '#000000',
                padding: '10px 22px',
                borderRadius: '16px',
                border: '4px solid #ffffff',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.9), 0 0 20px #ef4444',
                transform: 'rotate(12deg)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  textShadow: '0 2px 0 #ffffff',
                }}
              >
                💥 YOINK! 💥
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  marginTop: '4px',
                  letterSpacing: '0.08em',
                }}
              >
                SNATCHED!
              </div>
            </div>
          </div>
        )}

        {/* MOTION SPEED TRAILS WHEN PULLING */}
        {phase === 'pull' && (
          <svg
            style={{
              position: 'absolute',
              inset: '-40px',
              width: '400px',
              height: '480px',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <line x1="200" y1="220" x2="60" y2="40" stroke="#facc15" strokeWidth="4" strokeDasharray="12 8" />
            <line x1="230" y1="260" x2="90" y2="80" stroke="#38bdf8" strokeWidth="3" strokeDasharray="16 10" />
            <line x1="180" y1="300" x2="40" y2="120" stroke="#ef4444" strokeWidth="3" strokeDasharray="14 8" />
          </svg>
        )}
      </div>

      {/* RESULT ANNOUNCEMENT AT BOTTOM */}
      {phase === 'result' && (
        <div
          style={{
            marginTop: '32px',
            padding: '12px 28px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
            border: '2px solid #34d399',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.5)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'yoinkFadeIn 0.3s ease-out',
          }}
        >
          <Sparkles size={18} />
          <span>
            {isMeThief
              ? `You added [${stolenCard.title}] to your action hand!`
              : isMeVictim
              ? `${thiefName} stole your [${stolenCard.title}]!`
              : `${thiefName} added [${stolenCard.title}] to their hand!`}
          </span>
        </div>
      )}
    </div>
  );
}

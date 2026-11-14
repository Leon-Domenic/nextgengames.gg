'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { formatCash } from '@/lib/board-brawl/types';
import { TOKEN_ICONS } from '@/lib/board-brawl/characters';

// Procedural SVG Banknote with glowing emerald body and ornate gold borders
function CashNoteSprite({ size = 70, rotation = 0 }) {
  const width = size;
  const height = size * 0.52;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        filter: 'drop-shadow(0 6px 14px rgba(6, 78, 59, 0.75))',
        willChange: 'transform',
      }}
    >
      <svg viewBox="0 0 140 74" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="billGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="40%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="goldTrimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Bill Body */}
        <rect x="2" y="2" width="136" height="70" rx="6" fill="url(#billGreenGrad)" stroke="url(#goldTrimGrad)" strokeWidth="2.5" />

        {/* Ornate Inner Border */}
        <rect x="7" y="7" width="126" height="60" rx="4" fill="none" stroke="rgba(254, 240, 138, 0.45)" strokeWidth="1" strokeDasharray="3,2" />

        {/* Center Vignette / Seal */}
        <circle cx="70" cy="37" r="18" fill="rgba(2, 44, 34, 0.5)" stroke="url(#goldTrimGrad)" strokeWidth="1.5" />
        <text x="70" y="42" fill="#fef08a" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="monospace">
          CR
        </text>

        {/* Corner Denominations */}
        <text x="14" y="21" fill="#fef08a" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          $
        </text>
        <text x="126" y="21" fill="#fef08a" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          $
        </text>
        <text x="14" y="62" fill="#fef08a" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          $
        </text>
        <text x="126" y="62" fill="#fef08a" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          $
        </text>

        {/* Label */}
        <text x="70" y="63" fill="rgba(254, 240, 138, 0.85)" fontSize="7" fontWeight="800" textAnchor="middle" letterSpacing="0.8">
          SPACE CREDITS
        </text>
      </svg>
    </div>
  );
}

// Procedural 3D-styled Spinning Gold Coin
function GoldCoinSprite({ size = 32 }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.6))',
      }}
    >
      <svg viewBox="0 0 50 50" width="100%" height="100%">
        <defs>
          <radialGradient id="coinGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
        </defs>
        <circle cx="25" cy="25" r="23" fill="url(#coinGrad)" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="25" cy="25" r="18" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" strokeDasharray="2,2" />
        <text x="25" y="32" fill="#78350f" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="monospace">
          ₩
        </text>
      </svg>
    </div>
  );
}

export default function CashRainOverlay({
  active = false,
  player = null,
  amount = 200000,
  onComplete = null,
}) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2600);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [active, onComplete]);

  // Generate deterministic particles when active
  const particles = useMemo(() => {
    if (!visible) return [];
    const count = 48;
    const items = [];

    for (let i = 0; i < count; i++) {
      const isCoin = i % 3 === 0;
      const left = Math.random() * 96 + 2; // 2% to 98% viewport width
      const delay = Math.random() * 0.9; // 0s to 0.9s delay
      const duration = 1.35 + Math.random() * 0.85; // 1.35s to 2.2s fall
      const size = isCoin ? 26 + Math.random() * 14 : 58 + Math.random() * 28;
      const rotation = (Math.random() - 0.5) * 60;
      const drift = (Math.random() - 0.5) * 120; // sideways drift in px

      items.push({
        id: i,
        isCoin,
        left,
        delay,
        duration,
        size,
        rotation,
        drift,
      });
    }
    return items;
  }, [visible]);

  if (!visible) return null;

  const playerIcon = TOKEN_ICONS[player?.avatarToken] || '🚀';
  const playerColor = player?.avatarColor || '#10b981';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 92,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes cashRainFall {
          0% {
            transform: translateY(-80px) rotateX(0deg) rotateZ(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(105vh) rotateX(720deg) rotateZ(180deg);
            opacity: 0;
          }
        }

        @keyframes cashRainBannerBounce {
          0% {
            transform: translate(-50%, -60px) scale(0.6);
            opacity: 0;
          }
          40% {
            transform: translate(-50%, 0) scale(1.06);
            opacity: 1;
          }
          60% {
            transform: translate(-50%, 0) scale(0.98);
          }
          80% {
            transform: translate(-50%, 0) scale(1.0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -30px) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes coinTumble {
          0% {
            transform: translateY(-50px) rotateY(0deg) rotateZ(0deg);
            opacity: 0;
          }
          10% { opacity: 1; }
          90% { opacity: 0.95; }
          100% {
            transform: translateY(105vh) rotateY(1080deg) rotateZ(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Floating Header Banner */}
      <div
        style={{
          position: 'absolute',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'cashRainBannerBounce 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(2, 44, 34, 0.98) 100%)',
          border: '2px solid #34d399',
          borderRadius: '22px',
          padding: '12px 28px',
          boxShadow: '0 0 45px rgba(16, 185, 129, 0.6), 0 20px 40px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontSize: '32px',
            filter: 'drop-shadow(0 0 10px rgba(254, 240, 138, 0.8))',
          }}
        >
          {playerIcon}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#6ee7b7' }}>
              🏁 START TILE CROSSED!
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: playerColor,
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '2px 8px',
                borderRadius: '8px',
              }}
            >
              {player?.name || 'Player'}
            </span>
          </div>

          <div
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#fef08a',
              letterSpacing: '-0.3px',
              textShadow: '0 0 16px rgba(254, 240, 138, 0.5)',
            }}
          >
            +{formatCash(amount)} SPACE CREDITS! 💸
          </div>
        </div>
      </div>

      {/* Raining Cash Notes and Gold Coins */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            animation: p.isCoin
              ? `coinTumble ${p.duration}s linear ${p.delay}s forwards`
              : `cashRainFall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
            willChange: 'transform, opacity',
          }}
        >
          {p.isCoin ? (
            <GoldCoinSprite size={p.size} />
          ) : (
            <CashNoteSprite size={p.size} rotation={p.rotation} />
          )}
        </div>
      ))}
    </div>
  );
}

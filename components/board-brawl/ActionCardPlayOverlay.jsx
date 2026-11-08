'use client';

import React, { useEffect, useState } from 'react';
import { CARD_RARITY } from '@/lib/board-brawl/cards';
import { sounds } from '@/lib/audio';
import { Zap, Sparkles, Shield, Flame } from 'lucide-react';

export default function ActionCardPlayOverlay({ lastActionCardPlayed }) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!lastActionCardPlayed || !lastActionCardPlayed.card) return;

    setData(lastActionCardPlayed);
    setVisible(true);

    if (lastActionCardPlayed.card.id === 'toll_shield') {
      try { sounds.playShield?.(); } catch (e) {}
    } else {
      try { sounds.playCardPlay?.(); } catch (e) {}
    }

    const timer = setTimeout(() => {
      setVisible(false);
    }, 3200);

    return () => clearTimeout(timer);
  }, [lastActionCardPlayed]);

  if (!visible || !data) return null;

  const { card, playerName } = data;
  const rarity = CARD_RARITY[card.rarity] || CARD_RARITY.COMMON;

  return (
    <div
      style={{
        position: 'fixed',
        top: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
        pointerEvents: 'none',
        animation: 'slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          border: `2px solid ${rarity.border}`,
          borderRadius: '999px',
          padding: '10px 24px',
          boxShadow: `0 12px 36px rgba(0, 0, 0, 0.5), 0 0 30px ${rarity.border}66`,
          color: '#ffffff',
        }}
      >
        {/* Card Icon Circle */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${rarity.border}44 0%, rgba(0,0,0,0.5) 80%)`,
            border: `2px solid ${rarity.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
          }}
        >
          {card.icon}
        </div>

        {/* Text Details */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>
            <span style={{ color: '#38bdf8', fontWeight: 900 }}>{playerName}</span> PLAYED AN ACTION CARD
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {card.title}
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 900,
                color: rarity.border,
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {card.badge}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

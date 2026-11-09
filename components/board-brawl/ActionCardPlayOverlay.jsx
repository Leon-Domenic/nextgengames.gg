'use client';

import React, { useEffect, useState } from 'react';
import { CARD_RARITY } from '@/lib/board-brawl/cards';
import { sounds } from '@/lib/audio';
import { t } from '@/lib/board-brawl/i18n';
import { Zap, Sparkles, Shield, Flame, Info } from 'lucide-react';

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

    // Retain notification on screen for at least 3.5 seconds (4000ms)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [lastActionCardPlayed]);

  if (!visible || !data) return null;

  const { card, playerName, targetPayload } = data;
  const rarity = CARD_RARITY[card.rarity] || CARD_RARITY.COMMON;
  const outcomeText = card.summary || card.description || '';

  return (
    <div
      style={{
        position: 'fixed',
        top: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
        pointerEvents: 'none',
        animation: 'slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        maxWidth: '92vw',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.96) 100%)',
          backdropFilter: 'blur(16px)',
          border: `2px solid ${rarity.border}`,
          borderRadius: '20px',
          padding: '12px 24px',
          boxShadow: `0 12px 36px rgba(0, 0, 0, 0.55), 0 0 30px ${rarity.border}66`,
          color: '#ffffff',
          maxWidth: '560px',
        }}
      >
        {/* Card Icon Circle */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${rarity.border}44 0%, rgba(0,0,0,0.5) 80%)`,
            border: `2px solid ${rarity.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}
        >
          {card.icon}
        </div>

        {/* Text Details & Outcome */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              <span style={{ color: '#38bdf8' }}>{playerName}</span> played {t(card.id + '_title', {}, t(card.title, {}, card.title))}!
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
                flexShrink: 0,
              }}
            >
              {card.badge}
            </span>
          </div>

          {/* Clear explanation of what happened / effect */}
          {outcomeText && (
            <div
              style={{
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: 1.4,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={12} style={{ color: rarity.border, flexShrink: 0 }} />
              <span>
                {outcomeText}
                {targetPayload?.targetPlayerName && ` (Target: ${targetPayload.targetPlayerName})`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

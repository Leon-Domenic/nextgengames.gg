'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CARD_RARITY } from '@/lib/board-brawl/cards';
import { sounds } from '@/lib/audio';
import { t, useTranslation } from '@/lib/board-brawl/i18n';
import { Sparkles, Zap, Shield, AlertTriangle, ArrowRight, Clock } from 'lucide-react';

const DISPLAY_DURATION_MS = 7500; // 7.5 seconds display time (7-8s requirement)

export default function EventCardModal({
  eventData,
  isMyTurn,
  onDismiss,
}) {
  const { t } = useTranslation();
  const [remainingMs, setRemainingMs] = useState(DISPLAY_DURATION_MS);
  const onDismissRef = useRef(onDismiss);
  const activeEventKeyRef = useRef('');
  const startTimeRef = useRef(null);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const eventKey = eventData
    ? `${eventData.card?.id || 'card'}_${eventData.drawerId || ''}_${eventData.timestamp || ''}`
    : '';

  useEffect(() => {
    if (!eventData || !eventData.card || !eventKey) return;

    // Only start a fresh timer if this is a genuinely NEW event card draw
    if (activeEventKeyRef.current !== eventKey) {
      activeEventKeyRef.current = eventKey;
      // Anchor start time to eventData.timestamp if recent, otherwise current time
      const now = Date.now();
      const eventTime = eventData.timestamp && Math.abs(now - eventData.timestamp) < DISPLAY_DURATION_MS
        ? eventData.timestamp
        : now;
      startTimeRef.current = eventTime;

      try {
        sounds.playCardDraw?.();
      } catch (e) {}
    }

    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, DISPLAY_DURATION_MS - elapsed);
      setRemainingMs(left);

      if (left <= 0) {
        clearInterval(interval);
        onDismissRef.current?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [eventKey]);

  if (!eventData || !eventData.card) return null;

  const { card, drawerName } = eventData;
  const rarityConfig = CARD_RARITY[card.rarity] || CARD_RARITY.COMMON;
  const isDisaster = card.rarity === 'DISASTER';
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / DISPLAY_DURATION_MS) * 100));
  const secondsLeft = Math.ceil(remainingMs / 1000);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 7, 20, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* 3D Card Container */}
      <div
        style={{
          position: 'relative',
          width: '380px',
          maxWidth: '92vw',
          background: isDisaster
            ? 'linear-gradient(145deg, #1f0808 0%, #3b0d0d 50%, #150303 100%)'
            : 'linear-gradient(145deg, #0b1528 0%, #172554 50%, #080f1d 100%)',
          border: `2px solid ${rarityConfig.border}`,
          borderRadius: '24px',
          boxShadow: `0 0 50px ${rarityConfig.border}55, 0 25px 50px -12px rgba(0, 0, 0, 0.7)`,
          padding: '24px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          transform: 'scale(1)',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Floating Glow Pill */}
        <div
          style={{
            position: 'absolute',
            top: '-14px',
            background: rarityConfig.border,
            color: isDisaster ? '#ffffff' : '#000000',
            fontWeight: 900,
            fontSize: '11px',
            letterSpacing: '0.12em',
            padding: '4px 14px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            boxShadow: `0 4px 14px ${rarityConfig.border}66`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isDisaster ? <AlertTriangle size={13} /> : <Sparkles size={13} />}
          <span>{t(card.rarity?.toLowerCase() + 'EventCard', {}, `${card.rarity} EVENT CARD`)}</span>
        </div>

        {/* Drawer Attribution */}
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
          {t('drawnByLabel', {}, 'Drawn by')}{' '}
          <span style={{ color: '#38bdf8', fontWeight: 800 }}>{drawerName || t('player', {}, 'Player')}</span>
        </div>

        {/* Card Artwork / Icon Circle */}
        <div
          style={{
            marginTop: '16px',
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${rarityConfig.border}33 0%, rgba(0,0,0,0.4) 80%)`,
            border: `2px solid ${rarityConfig.border}88`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '52px',
            boxShadow: `inset 0 0 20px ${rarityConfig.border}44`,
          }}
        >
          {card.icon}
        </div>

        {/* Badge category */}
        <div
          style={{
            marginTop: '12px',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: rarityConfig.border,
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '3px 10px',
            borderRadius: '8px',
          }}
        >
          {t(card.id + '_badge', {}, t(card.badge, {}, card.badge))}
        </div>

        {/* Card Title */}
        <h2
          style={{
            margin: '8px 0 0 0',
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#f8fafc',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          {t(card.id + '_title', {}, t(card.title, {}, card.title))}
        </h2>

        {/* Flavor Description */}
        <p
          style={{
            marginTop: '10px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#cbd5e1',
            padding: '0 8px',
          }}
        >
          {t(card.id + '_desc', {}, t(card.description, {}, card.description))}
        </p>

        {/* Visual Impact Summary Pill */}
        <div
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: '12px',
            background: isDisaster ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${isDisaster ? '#ef4444' : '#38bdf8'}66`,
            color: isDisaster ? '#fca5a5' : '#7dd3fc',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Zap size={15} />
          <span>{t(card.id + '_summary', {}, t(card.summary, {}, card.summary))}</span>
        </div>

        {/* Animated Countdown Timer Bar */}
        <div
          style={{
            width: '100%',
            marginTop: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            height: '6px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: isDisaster
                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                : 'linear-gradient(90deg, #38bdf8, #818cf8)',
              borderRadius: '999px',
              boxShadow: `0 0 10px ${rarityConfig.border}`,
              transition: 'width 0.05s linear',
            }}
          />
        </div>

        {/* Bottom Countdown & Action Button */}
        <div style={{ marginTop: '16px', width: '100%' }}>
          <button
            onClick={() => onDismiss?.()}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: '14px',
              border: 'none',
              background: isDisaster
                ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '14px',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: isDisaster ? '0 4px 16px rgba(239, 68, 68, 0.4)' : '0 4px 16px rgba(2, 132, 199, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Clock size={15} />
            <span>{t('dismissOk', { seconds: secondsLeft }, `DISMISS / OK (${secondsLeft}s)`)}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/audio';
import { useTranslation } from '@/lib/board-brawl/i18n';
import { Sparkles, Plane, Trophy, Dice6, ArrowRight } from 'lucide-react';

export default function TurnAnnouncementBanner({
  activePlayer,
  isMyTurn,
  turnState = 'roll',
  turnIndex = 0,
  doublesCount = 0,
}) {
  const { t } = useTranslation();
  const [banner, setBanner] = useState(null);
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!activePlayer) return;

    // Do NOT show turn announcement popups during active board targeting or modal decision states
    // so players have 100% unobstructed view and full clickable access to board tiles
    if (
      turnState === 'flight_select' ||
      turnState === 'festival_select' ||
      turnState === 'championship_select' ||
      turnState === 'temple_choice'
    ) {
      setBanner(null);
      return;
    }

    // Unique turn key: player id + turn state + turn counter + doubles step
    const currentKey = `${activePlayer.id}_${turnIndex}_${turnState}_${doublesCount}`;
    if (lastKeyRef.current === currentKey) return;
    lastKeyRef.current = currentKey;

    const isDoublesBonus = turnState === 'roll' && doublesCount > 0;

    const bannerData = {
      id: currentKey,
      player: activePlayer,
      isMyTurn,
      isFlight: false,
      isChampionship: false,
      isTempleChoice: false,
      title: isDoublesBonus
        ? (isMyTurn
            ? `✨ ${t('doublesRollAgain', {}, 'DOUBLES! ROLL AGAIN!')}`
            : `✨ ${t('playerRolledDoubles', { player: activePlayer.name.toUpperCase() }, `${activePlayer.name.toUpperCase()} ROLLED DOUBLES!`)}`)
        : (isMyTurn
            ? `⭐ ${t('yourTurnUpper', {}, 'YOUR TURN!')}`
            : t('playerTurnUpper', { player: activePlayer.name.toUpperCase() }, `${activePlayer.name.toUpperCase()}'S TURN`)),
      subtitle: isDoublesBonus
        ? (isMyTurn
            ? t('hitRollDoublesBonus', {}, 'Hit Roll Dice for your bonus doubles throw!')
            : t('getsBonusThrow', { player: activePlayer.name }, `${activePlayer.name} gets a bonus throw!`))
        : (isMyTurn
            ? t('rollOrPlayCardHint', {}, 'Roll the 3D dice or play an action card!')
            : t('preparingDiceRoll', {}, 'Preparing 3D dice roll...')),
      color: isMyTurn ? '#38bdf8' : (activePlayer.avatarColor || '#f59e0b'),
    };

    setBanner(bannerData);

    try {
      if (isMyTurn) {
        sounds.playDoublesSurge?.();
      } else {
        sounds.playHover?.();
      }
    } catch (e) {}

    const timer = setTimeout(() => {
      setBanner((prev) => (prev?.id === currentKey ? null : prev));
    }, 2200);

    return () => clearTimeout(timer);
  }, [activePlayer?.id, isMyTurn, turnState, turnIndex]);

  if (!banner) return null;

  return (
    <div
      key={banner.id}
      style={{
        position: 'fixed',
        top: '16%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 88,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'flightBannerIn 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <style>{`
        @keyframes flightBannerIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -40px) scale(0.85);
          }
          12% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.04);
          }
          20% {
            transform: translate(-50%, 0) scale(1.0);
          }
          82% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 25px) scale(0.92);
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 28px',
          borderRadius: '999px',
          background: banner.isMyTurn
            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.96) 0%, rgba(59, 130, 246, 0.96) 50%, rgba(147, 51, 234, 0.96) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)',
          border: banner.isMyTurn
            ? '2.5px solid #ffffff'
            : `2.5px solid ${banner.color}`,
          boxShadow: banner.isMyTurn
            ? '0 0 45px rgba(56, 189, 248, 0.7), 0 16px 40px rgba(0, 0, 0, 0.7)'
            : `0 0 35px ${banner.color}66, 0 16px 40px rgba(0, 0, 0, 0.7)`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#ffffff',
        }}
      >
        {/* Avatar Token Icon */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: `${banner.color}33`,
            border: `2px solid ${banner.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: `0 0 16px ${banner.color}88`,
            flexShrink: 0,
          }}
        >
          {banner.isFlight ? '✈️' : banner.isChampionship ? '🏆' : banner.isTempleChoice ? '🏛️' : (banner.player?.avatarToken ? '🎩' : '🤖')}
        </div>

        {/* Text Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 900,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: banner.isMyTurn ? '#ffffff' : (banner.color || '#ffffff'),
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{banner.title}</span>
            {banner.isMyTurn && (
              <span
                style={{
                  background: '#ffffff',
                  color: '#0284c7',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '1px',
                }}
              >
                {t('liveBadge', {}, 'LIVE')}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.88)',
              marginTop: '1px',
            }}
          >
            {banner.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

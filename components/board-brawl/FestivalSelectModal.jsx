'use client';

import React from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { Sparkles, Trophy, ArrowRight, X } from 'lucide-react';

export default function FestivalSelectModal({
  properties = {},
  myPlayer,
  player,
  onSelectFestival,
  onSkip,
  turnTimer = 15,
}) {
  const userPlayer = myPlayer || player;
  if (!userPlayer) return null;

  const ownedCityIds = Object.keys(properties).filter((tId) => {
    const prop = properties[tId];
    return prop && prop.ownerId === userPlayer.id;
  });

  const handleSelect = (tileId) => {
    try { sounds.playDoublesSurge?.(); } catch (e) {}
    onSelectFestival?.(tileId);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 7, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '420px',
          maxWidth: '92vw',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)',
          border: '2px solid #fbbf24',
          borderRadius: '24px',
          boxShadow: '0 0 50px rgba(251, 191, 36, 0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          padding: '24px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Top Header Pill */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            color: '#000000',
            fontWeight: 900,
            fontSize: '11px',
            letterSpacing: '0.12em',
            padding: '4px 16px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
          }}
        >
          <Trophy size={14} />
          <span>WORLD CHAMPIONSHIP ({turnTimer}s)</span>
        </div>

        {/* Big Icon */}
        <div
          style={{
            marginTop: '16px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(0,0,0,0.5) 80%)',
            border: '2px solid #fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '42px',
          }}
        >
          🎪
        </div>

        <h2 style={{ margin: '12px 0 6px 0', fontSize: '22px', fontWeight: 900, color: '#fef08a' }}>
          HOST 2X WORLD FESTIVAL
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
          Select one of your owned cities to host the global celebration and double all rent payments (2X)!
        </p>

        {/* Owned Cities List */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '180px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {ownedCityIds.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '13px', padding: '16px 0' }}>
              You do not own any cities yet to host the festival.
            </div>
          ) : (
            ownedCityIds.map((tId) => {
              const tile = TILES[tId];
              const prop = properties[tId];
              const currentRent = tile?.rent ? (tile.rent[Math.max(0, (prop?.level || 1) - 1)] || tile.rent[0]) : 0;
              const isCurrentFestival = prop?.festival;

              return (
                <button
                  key={tId}
                  onClick={() => handleSelect(parseInt(tId))}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: isCurrentFestival ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: isCurrentFestival ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isCurrentFestival
                      ? 'rgba(251, 191, 36, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)')
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{tile?.flag || '🏛️'}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>{tile?.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Tier {prop?.level || 1} {prop?.isLandmark ? '👑 Landmark' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#fef08a' }}>
                      {(currentRent * 2).toLocaleString()} CR
                    </div>
                    <div style={{ fontSize: '10px', color: '#a3e635' }}>2X RENT</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Skip Button */}
        <div style={{ marginTop: '16px', width: '100%' }}>
          <button
            onClick={() => onSkip?.()}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <span>Skip / Pass Turn</span>
          </button>
        </div>
      </div>
    </div>
  );
}

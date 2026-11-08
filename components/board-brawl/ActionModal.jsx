'use client';

import React, { useState, useEffect } from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { useTranslation } from '@/lib/board-brawl/i18n';
import { Zap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const LANDMARK_ICONS = {
  Egypt: '🏛️',
  Greece: '🏛️',
  Czechia: '🏰',
  Austria: '🎻',
  Hungary: '🏰',
  Spain: '💃',
  Italy: '🏟️',
  Germany: '🏰',
  Netherlands: '🌷',
  Belgium: '🍫',
  UK: '🕰️',
  Ireland: '🍀',
  France: '🗼',
  Japan: '⛩️',
  Singapore: '🦁',
  UAE: '🏜️',
  Monaco: '🛥️',
};

export default function ActionModal({
  currentTileId,
  properties = {},
  player,
  players = [],
  onBuy,
  onBuyout,
  onUpgrade,
  onSetFestival,
  onEndTurn,
  turnTimer,
}) {
  const { t } = useTranslation();
  const tile = TILES[currentTileId];

  // Defensive safety: If not a city tile, automatically complete turn action so human is never stuck!
  useEffect(() => {
    if (!tile || tile.type !== 'city') {
      onEndTurn?.();
    }
  }, [tile, onEndTurn]);

  // Handle Escape key to pass/end turn cleanly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onEndTurn?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEndTurn]);

  if (!tile || tile.type !== 'city') return null;

  const prop = properties[currentTileId] || {};
  const isOwner = prop.ownerId === player?.id;
  const isRival = prop.ownerId && prop.ownerId !== player?.id;
  const rivalOwner = isRival ? players.find(p => p.id === prop.ownerId) : null;

  // Selected upgrade tier for purchasing (1 = Land, 2 = Cottage, 3 = Hotel, 4 = Landmark)
  const currentLvl = prop.level || 0;
  const [selectedTier, setSelectedTier] = useState(() => {
    if (!prop.ownerId) return 2; // Default to Buy + Cottage
    if (isOwner) return Math.min(5, currentLvl + 1);
    return 1;
  });
  const [isBusy, setIsBusy] = useState(false);

  const handleAction = (callback) => {
    if (isBusy) return;
    setIsBusy(true);
    callback();
    setTimeout(() => setIsBusy(false), 1200);
  };

  // Financial calculations
  const totalVal = tile.price + (Math.max(0, currentLvl - 1)) * tile.housePrice;
  const buyoutCost = totalVal * 2;
  const canBuyout = isRival && !prop.isLandmark && player?.cash >= buyoutCost;

  // Upgrade pricing for fresh buy
  const tierCost = (targetLvl) => {
    if (!prop.ownerId) {
      if (targetLvl === 1) return tile.price;
      return tile.price + (targetLvl - 1) * tile.housePrice;
    }
    // Upgrading existing
    return tile.housePrice;
  };

  const costToBuild = tierCost(selectedTier);
  const canAfford = player?.cash >= costToBuild;
  const currentRent = tile.rent ? (tile.rent[Math.max(0, currentLvl - 1)] || tile.rent[0]) : 0;
  const nextRent = tile.rent ? (tile.rent[Math.max(0, selectedTier - 1)] || tile.rent[0]) : 0;

  const landmarkEmoji = LANDMARK_ICONS[tile.country] || tile.flag || '🏛️';
  const ribbonColor = tile.color || '#2563eb';

  return (
    <div style={{
      width: '100%',
      maxWidth: '440px',
      maxHeight: 'min(90vh, 590px)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '26px',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 40px rgba(59, 130, 246, 0.15)',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      userSelect: 'none',
      animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Turn Countdown Progress Bar */}
      <div style={{
        width: '100%',
        height: '5px',
        backgroundColor: 'rgba(0, 0, 0, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, ((turnTimer || 0) / 15) * 100))}%`,
          backgroundColor: (turnTimer || 0) > 6 ? '#22c55e' : (turnTimer || 0) > 3 ? '#f59e0b' : '#ef4444',
          transition: 'width 0.9s linear, background-color 0.3s ease',
          boxShadow: (turnTimer || 0) <= 3 ? '0 0 8px #ef4444' : 'none',
        }} />
      </div>

      {/* Top Business Tour Style Curved Ribbon Header */}
      <div style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${ribbonColor} 0%, #1e3a8a 100%)`,
        padding: '14px 18px 16px',
        textAlign: 'center',
        color: '#ffffff',
        borderBottomLeftRadius: '22px',
        borderBottomRightRadius: '22px',
        boxShadow: `0 8px 20px -4px ${ribbonColor}66`,
        flexShrink: 0,
      }}>
        {/* Country Flag Badge */}
        <div style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '28px',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}>
          {tile.flag || '🌐'}
        </div>

        {/* City Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 900,
          margin: 0,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          textShadow: '0 2px 4px rgba(0,0,0,0.35)',
        }}>
          {t(tile.name)}
        </h2>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1.2px',
          opacity: 0.9,
          textTransform: 'uppercase',
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span>{tile.country} • {tile.colorGroup} District</span>
          {turnTimer !== undefined && (
            <span style={{
              background: (turnTimer || 0) <= 3 ? '#ef4444' : 'rgba(255,255,255,0.22)',
              color: '#ffffff',
              padding: '1px 7px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 900,
            }}>
              ⏱️ {turnTimer}s
            </span>
          )}
        </div>

        {/* Star Badge */}
        <div style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Sparkles size={18} color="#facc15" />
        </div>
      </div>

      <div style={{ padding: '14px 18px 18px', flex: 1 }}>
        {/* Center Stylized 3D Miniature Landmark Pedestal */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <div style={{
            width: '80px',
            height: '62px',
            background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)',
            borderRadius: '16px',
            transform: 'perspective(400px) rotateX(20deg)',
            boxShadow: '0 8px 20px -5px rgba(0,0,0,0.2), inset 0 2px 4px #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '34px',
          }}>
            <span style={{ transform: 'rotateX(-20deg)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}>
              {landmarkEmoji}
            </span>
          </div>
        </div>

        {/* 4 Upgrade Tier Slots (Plot, Cottage, Hotel, Golden Landmark) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '16px',
        }}>
          {/* Slot 1: Plot */}
          <div
            onClick={() => !prop.ownerId && setSelectedTier(1)}
            style={{
              background: selectedTier === 1 ? 'linear-gradient(180deg, #eff6ff, #dbeafe)' : '#f8fafc',
              border: selectedTier === 1 ? '2px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '10px 4px',
              textAlign: 'center',
              cursor: !prop.ownerId ? 'pointer' : 'default',
              transform: selectedTier === 1 ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease',
              boxShadow: selectedTier === 1 ? '0 6px 14px rgba(37, 99, 235, 0.2)' : 'none',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{t('plot')}</div>
            <div style={{ fontSize: '20px', margin: '4px 0' }}>🌱</div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>{Math.round(tile.price / 1000)}K CR</div>
          </div>

          {/* Slot 2: Cottage */}
          <div
            onClick={() => (!prop.ownerId || isOwner) && setSelectedTier(2)}
            style={{
              background: selectedTier === 2 ? 'linear-gradient(180deg, #ecfdf5, #d1fae5)' : '#f8fafc',
              border: selectedTier === 2 ? '2px solid #10b981' : '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '10px 4px',
              textAlign: 'center',
              cursor: (!prop.ownerId || isOwner) ? 'pointer' : 'default',
              transform: selectedTier === 2 ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease',
              boxShadow: selectedTier === 2 ? '0 6px 14px rgba(16, 185, 129, 0.2)' : 'none',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>{t('cottage')}</div>
            <div style={{ fontSize: '20px', margin: '4px 0' }}>🏡</div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>
              {Math.round((prop.ownerId ? tile.housePrice : tile.price + tile.housePrice) / 1000)}K CR
            </div>
          </div>

          {/* Slot 3: Hotel */}
          <div
            onClick={() => (!prop.ownerId || isOwner) && setSelectedTier(3)}
            style={{
              background: selectedTier === 3 ? 'linear-gradient(180deg, #fff7ed, #ffedd5)' : '#f8fafc',
              border: selectedTier === 3 ? '2px solid #f97316' : '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '10px 4px',
              textAlign: 'center',
              cursor: (!prop.ownerId || isOwner) ? 'pointer' : 'default',
              transform: selectedTier === 3 ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease',
              boxShadow: selectedTier === 3 ? '0 6px 14px rgba(249, 115, 22, 0.2)' : 'none',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>{t('hotel')}</div>
            <div style={{ fontSize: '20px', margin: '4px 0' }}>🏢</div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>
              {Math.round((prop.ownerId ? tile.housePrice : tile.price + tile.housePrice * 2) / 1000)}K CR
            </div>
          </div>

          {/* Slot 4: Golden Landmark */}
          <div
            onClick={() => (!prop.ownerId || isOwner) && setSelectedTier(4)}
            style={{
              background: selectedTier === 4 ? 'linear-gradient(180deg, #fefce8, #fef08a)' : '#f8fafc',
              border: selectedTier === 4 ? '2px solid #eab308' : '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '10px 4px',
              textAlign: 'center',
              cursor: (!prop.ownerId || isOwner) ? 'pointer' : 'default',
              transform: selectedTier === 4 ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease',
              boxShadow: selectedTier === 4 ? '0 6px 14px rgba(234, 179, 8, 0.25)' : 'none',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#ca8a04', textTransform: 'uppercase' }}>{t('landmark')}</div>
            <div style={{ fontSize: '20px', margin: '4px 0' }}>👑</div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>
              {Math.round((prop.ownerId ? tile.housePrice : tile.price + tile.housePrice * 3) / 1000)}K CR
            </div>
          </div>
        </div>

        {/* Landmark Protection Notice */}
        {selectedTier === 4 && (
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#b45309',
            background: '#fef3c7',
            padding: '6px 12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '14px',
          }}>
            <ShieldCheck size={14} />
            <span>{t('cannotBeBoughtOut')}</span>
          </div>
        )}

        {/* Dynamic Financial Banner */}
        <div style={{
          background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #fcd34d',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          boxShadow: 'inset 0 1px 2px #ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>🪙</span>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>{t('rentYield')}</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#78350f' }}>{nextRent.toLocaleString()} CR</div>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 900,
            color: '#b45309',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}>
            FULL DISTRICT: 2X
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Case 1: Unowned -> Big Juicy Green Button */}
          {!prop.ownerId && (
            <button
              onClick={() => { sounds.playBuild(); onBuy(tile.id, selectedTier); }}
              disabled={!canAfford}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: canAfford ? 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)' : '#cbd5e1',
                border: 'none',
                borderRadius: '18px',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '16px',
                letterSpacing: '0.5px',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                boxShadow: canAfford ? '0 10px 20px -5px rgba(22, 163, 74, 0.4), inset 0 2px 2px rgba(255,255,255,0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.1s ease',
              }}
            >
              <span>{t('buyAndUpgrade')} ({costToBuild.toLocaleString()} Space Credits)</span>
            </button>
          )}

          {/* Case 2: Owned by Player -> Upgrade Button */}
          {isOwner && !prop.isLandmark && (
            <button
              onClick={() => { sounds.playBuild(); onUpgrade(tile.id); }}
              disabled={!canAfford}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: canAfford ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)' : '#cbd5e1',
                border: 'none',
                borderRadius: '18px',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '16px',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                boxShadow: canAfford ? '0 10px 20px -5px rgba(37, 99, 235, 0.4)' : 'none',
              }}
            >
              <span>{t('upgradeLevel')} ({tile.housePrice.toLocaleString()} Space Credits)</span>
            </button>
          )}

          {/* Case 3: Owned by Rival -> 2X Hostile Buyout Button */}
          {isRival && (
            <>
              <div style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#ef4444',
                background: '#fee2e2',
                padding: '8px',
                borderRadius: '10px',
                textAlign: 'center',
              }}>
                {t('ownedBy', { owner: rivalOwner?.name || 'Rival', rent: currentRent.toLocaleString() })}
              </div>

              {!prop.isLandmark && (
                <button
                  onClick={() => { sounds.playBuyout(); onBuyout(tile.id); }}
                  disabled={!canBuyout}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: canBuyout ? 'linear-gradient(180deg, #ec4899 0%, #d946ef 100%)' : '#cbd5e1',
                    border: 'none',
                    borderRadius: '18px',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '15px',
                    cursor: canBuyout ? 'pointer' : 'not-allowed',
                    boxShadow: canBuyout ? '0 10px 20px -5px rgba(217, 70, 239, 0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Zap size={18} />
                  <span>{t('hostileBuyout2x')} ({buyoutCost.toLocaleString()} Space Credits)</span>
                </button>
              )}
            </>
          )}

          {/* Pass / End Turn Button */}
          <button
            onClick={onEndTurn}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              color: '#64748b',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>{t('pass')}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

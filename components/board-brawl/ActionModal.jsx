'use client';

import React, { useState, useEffect } from 'react';
import { TILES, formatCash, getDistrictName, getMonopolyTitle } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import SmoothTimerBar from '@/components/board-brawl/SmoothTimerBar';
import { useTranslation } from '@/lib/board-brawl/i18n';
import CountryFlag from '@/components/board-brawl/CountryFlag';
import { Zap, ArrowRight, ShieldCheck, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

const LANDMARK_ICONS = {
  Egypt: '🏛️',
  Greece: '🏛️',
  Poland: '🏰',
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
  Bali: '🏝️',
  Hawaii: '🌺',
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
  turnDuration = 25,
}) {
  const { t } = useTranslation();
  const maxDuration = turnDuration || 25;
  const isResetting = (turnTimer || 0) >= (maxDuration - 1);
  const progressPct = Math.min(100, Math.max(0, ((turnTimer || 0) / maxDuration) * 100));
  const tile = TILES[currentTileId];
  const isCity = tile?.type === 'city';
  const isResort = tile?.type === 'resort';
  const isActionable = isCity || isResort;

  // Defensive safety: If not actionable, automatically complete turn action
  useEffect(() => {
    if (!tile || !isActionable) {
      onEndTurn?.();
    }
  }, [tile, isActionable, onEndTurn]);

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

  const prop = properties[currentTileId] || {};
  const isOwner = prop.ownerId === player?.id;
  const isRival = prop.ownerId && prop.ownerId !== player?.id;
  const rivalOwner = isRival ? players.find(p => p.id === prop.ownerId) : null;
  const currentLvl = prop.level || 0;

  // Orbit check: laps >= 1 means completed at least 1 full orbit around the board
  const playerLaps = player?.laps ?? player?.orbits ?? 0;
  const hasCompletedFirstOrbit = playerLaps >= 1;

  // Initial selected tier logic
  const [selectedTier, setSelectedTier] = useState(() => {
    if (!prop.ownerId) {
      // Unowned: default to highest available tier within player's budget & orbit rules
      const pCash = player?.cash || 0;
      if (hasCompletedFirstOrbit && pCash >= (tile?.price || 0) + 3 * (tile?.housePrice || 0)) {
        return 4; // 3 Houses
      }
      if (pCash >= (tile?.price || 0) + 2 * (tile?.housePrice || 0)) {
        return 3; // 2 Houses
      }
      if (pCash >= (tile?.price || 0) + 1 * (tile?.housePrice || 0)) {
        return 2; // 1 House
      }
      return 1; // Plot
    }
    if (isOwner) {
      if (currentLvl === 4) return 5; // Hotel unlocked!
      if (currentLvl === 5) return 6; // Landmark unlocked!
      if (currentLvl === 3) return hasCompletedFirstOrbit ? 4 : 3;
      if (currentLvl < 3) return Math.min(3, currentLvl + 1);
    }
    return 1;
  });

  const [isBusy, setIsBusy] = useState(false);

  const handleAction = (callback) => {
    if (isBusy) return;
    setIsBusy(true);
    callback();
    setTimeout(() => setIsBusy(false), 1200);
  };

  if (!tile || !isActionable) return null;

  // Financial calculations
  const totalVal = isResort
    ? tile.price
    : (tile.price + (Math.max(0, currentLvl - 1)) * (tile.housePrice || 0));
  const buyoutCost = totalVal * 2;
  const canBuyout = isRival && !prop.isLandmark && player?.cash >= buyoutCost;

  // Tier cost calculation
  const getTierCost = (targetLvl) => {
    if (isResort) return tile.price;
    if (!prop.ownerId) {
      if (targetLvl === 1) return tile.price;
      return tile.price + (targetLvl - 1) * tile.housePrice;
    }
    // Upgrading existing property
    const diff = targetLvl - currentLvl;
    return Math.max(0, diff) * tile.housePrice;
  };

  // Determine if a tier is locked by rules
  const getTierLockStatus = (tierLvl) => {
    if (!isCity) return { isLocked: false, reason: '' };

    // Tier 4: 3 Houses -> Requires completing 1st orbit
    if (tierLvl === 4 && !hasCompletedFirstOrbit) {
      return { isLocked: true, reason: 'Orbit 2 Req.' };
    }

    // Tier 5: Hotel -> ONLY available after 3 houses have been built!
    if (tierLvl === 5) {
      if (!prop.ownerId) {
        return { isLocked: true, reason: 'Need 3 Houses' };
      }
      if (currentLvl < 4) {
        return { isLocked: true, reason: 'Need 3 Houses' };
      }
    }

    // Tier 6: Landmark -> ONLY available after Hotel
    if (tierLvl === 6) {
      if (!prop.ownerId || currentLvl < 5) {
        return { isLocked: true, reason: 'Need Hotel' };
      }
    }

    // On upgrades: tiers below or equal to current level are already built
    if (isOwner && tierLvl <= currentLvl) {
      return { isLocked: false, isAlreadyBuilt: true, reason: 'Built' };
    }

    return { isLocked: false, reason: '' };
  };

  const costToBuild = isResort ? tile.price : getTierCost(selectedTier);
  const playerCash = player?.cash || 0;
  const canAfford = playerCash >= costToBuild;
  const remBalance = playerCash - costToBuild;
  const remBuyout = playerCash - buyoutCost;

  // Rent calculations
  const RESORT_IDS = [6, 12, 20, 28];
  const rivalResortsCount = isRival
    ? RESORT_IDS.filter(id => properties[id]?.ownerId === rivalOwner?.id).length
    : 0;
  const playerResortsCount = isOwner
    ? RESORT_IDS.filter(id => properties[id]?.ownerId === player?.id).length
    : (!prop.ownerId ? RESORT_IDS.filter(id => properties[id]?.ownerId === player?.id).length + 1 : 0);

  const currentRent = isResort
    ? (tile.baseRent * (isRival ? Math.pow(2, Math.max(0, rivalResortsCount - 1)) : 1))
    : (tile.rent ? (tile.rent[Math.min(4, Math.max(0, currentLvl - 1))] || tile.rent[0]) : 0);

  const getRentForTier = (tierLvl) => {
    if (isResort) {
      return tile.baseRent * Math.pow(2, Math.max(0, playerResortsCount - 1));
    }
    if (tierLvl >= 6) {
      return Math.round((tile.rent?.[4] || 0) * 1.5);
    }
    return tile.rent?.[tierLvl - 1] || tile.rent?.[0] || 0;
  };

  const nextRent = getRentForTier(selectedTier);
  const landmarkEmoji = isResort ? '🏖️' : (LANDMARK_ICONS[tile.country] || tile.flag || '🏛️');
  const ribbonColor = tile.color || (isResort ? '#06b6d4' : '#2563eb');

  // Building tiers configuration (Plot, 1 House, 2 Houses, 3 Houses, Hotel / Landmark)
  const showLandmarkSlot = currentLvl >= 4;
  const TIERS = [
    {
      level: 1,
      name: 'PLOT',
      subtitle: 'Land',
      icon: '🌱',
      accentColor: '#3b82f6',
      bgGradient: 'linear-gradient(180deg, #eff6ff, #dbeafe)',
    },
    {
      level: 2,
      name: '1 HOUSE',
      subtitle: 'Cottage',
      icon: '🏡',
      accentColor: '#10b981',
      bgGradient: 'linear-gradient(180deg, #ecfdf5, #d1fae5)',
    },
    {
      level: 3,
      name: '2 HOUSES',
      subtitle: 'Duplex',
      icon: '🏘️',
      accentColor: '#059669',
      bgGradient: 'linear-gradient(180deg, #f0fdf4, #bbf7d0)',
    },
    {
      level: 4,
      name: '3 HOUSES',
      subtitle: 'Terrace',
      icon: '🏙️',
      accentColor: '#f97316',
      bgGradient: 'linear-gradient(180deg, #fff7ed, #fed7aa)',
    },
    showLandmarkSlot && currentLvl === 5
      ? {
          level: 6,
          name: 'LANDMARK',
          subtitle: 'Immune',
          icon: '👑',
          accentColor: '#ca8a04',
          bgGradient: 'linear-gradient(180deg, #fefce8, #fde047)',
        }
      : {
          level: 5,
          name: 'HOTEL',
          subtitle: 'Resort',
          icon: '🏨',
          accentColor: '#ea580c',
          bgGradient: 'linear-gradient(180deg, #fff1f2, #fecdd3)',
        },
  ];

  const selectedTierObj = TIERS.find(t => t.level === selectedTier) || TIERS[0];
  const selectedLockStatus = getTierLockStatus(selectedTier);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      padding: '16px',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '520px',
        background: '#ffffff',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.2)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'actionModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Top Smooth Timer Bar */}
        <div style={{
          width: '100%',
          height: '7px',
          background: 'rgba(0,0,0,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <SmoothTimerBar
            duration={maxDuration}
            remaining={turnTimer || 0}
            color={(turnTimer || 0) <= 5 ? '#ef4444' : ((turnTimer || 0) <= 10 ? '#f59e0b' : '#10b981')}
          />
        </div>

        {/* Header Ribbon Banner */}
        <div style={{
          background: ribbonColor,
          color: '#ffffff',
          padding: '18px 24px',
          position: 'relative',
          textAlign: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        }}>
          {/* Flag / Icon */}
          <div style={{
            position: 'absolute',
            left: '18px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '28px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}>
            {tile.country ? <CountryFlag country={tile.country} style={{ width: '32px', height: '22px' }} /> : '🏙️'}
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
            <span>{tile.country} • {getDistrictName(tile.colorGroup)} District</span>
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
            right: '18px',
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

        <div style={{ padding: '16px 20px 20px', flex: 1 }}>
          {/* Stylized Miniature Pedestal */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <div style={{
              width: '84px',
              height: '64px',
              background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)',
              borderRadius: '16px',
              transform: 'perspective(400px) rotateX(20deg)',
              boxShadow: '0 8px 20px -5px rgba(0,0,0,0.2), inset 0 2px 4px #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
            }}>
              <span style={{ transform: 'rotateX(-20deg)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}>
                {landmarkEmoji}
              </span>
            </div>
          </div>

          {isResort ? (
            /* Resort Card */
            <div style={{
              background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
              border: '2px solid #06b6d4',
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '16px',
              boxShadow: '0 8px 20px -5px rgba(6, 182, 212, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🏖️</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      4 RESORTS MONOPOLY SYSTEM
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#155e75' }}>
                      Line {Math.floor(tile.id / 8)} Coastal Resort
                    </div>
                  </div>
                </div>
                <div style={{
                  background: '#06b6d4',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 900,
                }}>
                  BASE RENT {formatCash(tile.baseRent)} CR
                </div>
              </div>

              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                border: '1px solid #a5f3fc',
              }}>
                {!prop.ownerId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#0e7490' }}>💳 Remaining Balance:</span>
                    <span style={{ fontWeight: 900, color: remBalance >= 0 ? '#15803d' : '#b91c1c' }}>
                      {formatCash(Math.max(0, remBalance))} CR
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#0e7490' }}>📈 Rent Multiplier:</span>
                  <span style={{ fontWeight: 900, color: '#0891b2' }}>2x per Resort Owned (1x, 2x, 4x, 8x)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#0e7490' }}>🏆 Win Condition:</span>
                  <span style={{ fontWeight: 900, color: '#047857' }}>Own all 4 Resorts for INSTANT WIN!</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 5 Reworked Construction Tiers Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '6px',
                marginBottom: '16px',
              }}>
                {TIERS.map((tier) => {
                  const lockInfo = getTierLockStatus(tier.level);
                  const isSelected = selectedTier === tier.level;
                  const isBuilt = isOwner && tier.level <= currentLvl;
                  const cost = getTierCost(tier.level);
                  const rem = playerCash - cost;
                  const isClickable = !lockInfo.isLocked && (!isOwner || tier.level > currentLvl);

                  return (
                    <div
                      key={tier.level}
                      onClick={() => {
                        if (isClickable) {
                          setSelectedTier(tier.level);
                        }
                      }}
                      style={{
                        background: isSelected
                          ? tier.bgGradient
                          : (lockInfo.isLocked ? '#f1f5f9' : '#f8fafc'),
                        border: isSelected
                          ? `2px solid ${tier.accentColor}`
                          : (isBuilt ? '1px solid #86efac' : '1px solid #e2e8f0'),
                        borderRadius: '14px',
                        padding: '8px 4px',
                        textAlign: 'center',
                        cursor: isClickable ? 'pointer' : 'default',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: isSelected
                          ? `0 8px 16px -2px ${tier.accentColor}40`
                          : 'none',
                        opacity: lockInfo.isLocked ? 0.65 : 1,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '116px',
                      }}
                    >
                      {/* Top Status Badge */}
                      {lockInfo.isLocked ? (
                        <div style={{
                          fontSize: '8px',
                          fontWeight: 900,
                          color: '#b45309',
                          background: '#fef3c7',
                          borderRadius: '4px',
                          padding: '1px 2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          lineHeight: 1.1,
                        }}>
                          <Lock size={9} />
                          <span>{lockInfo.reason}</span>
                        </div>
                      ) : isBuilt ? (
                        <div style={{
                          fontSize: '8px',
                          fontWeight: 900,
                          color: '#15803d',
                          background: '#dcfce7',
                          borderRadius: '4px',
                          padding: '1px 2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                        }}>
                          <CheckCircle2 size={9} />
                          <span>BUILT</span>
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: isSelected ? tier.accentColor : '#64748b',
                          textTransform: 'uppercase',
                        }}>
                          {tier.name}
                        </div>
                      )}

                      {/* Icon */}
                      <div style={{
                        fontSize: '20px',
                        margin: '3px 0',
                        filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'none',
                      }}>
                        {tier.icon}
                      </div>

                      {/* Cost */}
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color: isSelected ? '#0f172a' : '#334155',
                      }}>
                        {isBuilt ? 'ACTIVE' : `${Math.round(cost / 1000)}k CR`}
                      </div>

                      {/* Bottom Balance / Rent Preview */}
                      {!isBuilt && !lockInfo.isLocked && (
                        <div style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          color: rem >= 0 ? '#15803d' : '#b91c1c',
                          background: rem >= 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          borderRadius: '4px',
                          padding: '2px 1px',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                        }}>
                          {rem >= 0 ? `Left: ${Math.round(rem / 1000)}k` : 'Short!'}
                        </div>
                      )}

                      {lockInfo.isLocked && (
                        <div style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          color: '#64748b',
                          marginTop: '2px',
                        }}>
                          Locked
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Landmark Protection Notice */}
              {selectedTier === 6 && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#b45309',
                  background: '#fef3c7',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '12px',
                  border: '1px solid #fde68a',
                }}>
                  <ShieldCheck size={15} color="#ca8a04" />
                  <span>Landmark Sky Monument: Immune to Hostile Buyouts!</span>
                </div>
              )}

              {/* Dynamic Financial Yield Banner */}
              <div style={{
                background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #fcd34d',
                borderRadius: '14px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                boxShadow: 'inset 0 1px 2px #ffffff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🪙</span>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                      {t('rentYield')} ({selectedTierObj.name})
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#78350f' }}>
                      {formatCash(nextRent)} CR
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    background: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#b45309',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}>
                    {getDistrictName(tile.colorGroup).toUpperCase()} MONOPOLY: 2X
                  </div>
                  <div style={{
                    background: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#059669',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}>
                    ORBIT {playerLaps + 1}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Case 1: Unowned -> Big Juicy Green Button */}
            {!prop.ownerId && (
              <button
                onClick={() => {
                  sounds.playBuild();
                  onBuy(tile.id, isResort ? 1 : selectedTier);
                }}
                disabled={!canAfford || selectedLockStatus.isLocked}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: canAfford && !selectedLockStatus.isLocked
                    ? (isResort ? 'linear-gradient(180deg, #06b6d4 0%, #0891b2 100%)' : 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)')
                    : '#cbd5e1',
                  border: 'none',
                  borderRadius: '18px',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.5px',
                  cursor: canAfford && !selectedLockStatus.isLocked ? 'pointer' : 'not-allowed',
                  boxShadow: canAfford && !selectedLockStatus.isLocked
                    ? '0 10px 20px -5px rgba(22, 163, 74, 0.4), inset 0 2px 2px rgba(255,255,255,0.4)'
                    : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  transition: 'transform 0.1s ease',
                }}
              >
                <span>
                  {isResort
                    ? 'Acquire Resort'
                    : `Buy & Build ${selectedTierObj.name}`} • {formatCash(costToBuild)} CR
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: remBalance >= 0 ? '#dcfce7' : '#fee2e2' }}>
                  Remaining Balance: {Math.max(0, remBalance).toLocaleString()} CR
                </span>
              </button>
            )}

            {/* Case 2: Owned by Player -> Upgrade Button */}
            {isOwner && isCity && !prop.isLandmark && (
              <button
                onClick={() => {
                  sounds.playBuild();
                  onUpgrade(tile.id, selectedTier);
                }}
                disabled={!canAfford || selectedLockStatus.isLocked || selectedTier <= currentLvl}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: canAfford && !selectedLockStatus.isLocked && selectedTier > currentLvl
                    ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                    : '#cbd5e1',
                  border: 'none',
                  borderRadius: '18px',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: canAfford && !selectedLockStatus.isLocked && selectedTier > currentLvl ? 'pointer' : 'not-allowed',
                  boxShadow: canAfford && !selectedLockStatus.isLocked && selectedTier > currentLvl
                    ? '0 10px 20px -5px rgba(37, 99, 235, 0.4)'
                    : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                }}
              >
                <span>
                  Upgrade to {selectedTierObj.name} ({formatCash(costToBuild)} CR)
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: remBalance >= 0 ? '#dbeafe' : '#fee2e2' }}>
                  Remaining Balance: {Math.max(0, remBalance).toLocaleString()} CR
                </span>
              </button>
            )}

            {isOwner && isResort && (
              <div style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#0e7490',
                background: '#ecfeff',
                padding: '10px 14px',
                borderRadius: '14px',
                textAlign: 'center',
                border: '1px solid #a5f3fc',
              }}>
                🏖️ You own this resort! Current Rent: {formatCash(currentRent)} CR ({playerResortsCount} of 4 Resorts owned)
              </div>
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
                    onClick={() => {
                      sounds.playBuyout();
                      onBuyout(tile.id);
                    }}
                    disabled={!canBuyout}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      background: canBuyout ? 'linear-gradient(180deg, #ec4899 0%, #d946ef 100%)' : '#cbd5e1',
                      border: 'none',
                      borderRadius: '18px',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '15px',
                      cursor: canBuyout ? 'pointer' : 'not-allowed',
                      boxShadow: canBuyout ? '0 10px 20px -5px rgba(217, 70, 239, 0.4)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={18} />
                      <span>{t('buyoutProperty')} ({formatCash(buyoutCost)} CR)</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: remBuyout >= 0 ? '#fdf2f8' : '#fee2e2' }}>
                      Remaining Balance: {Math.max(0, remBuyout).toLocaleString()} CR
                    </span>
                  </button>
                )}
              </>
            )}

            {/* End Turn / Pass Action Button */}
            <button
              onClick={() => onEndTurn?.()}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                color: '#64748b',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{t('endTurn')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { TILES, RESORT_TILES, formatCash, formatFullCash } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import SmoothTimerBar from '@/components/board-brawl/SmoothTimerBar';
import { useTranslation } from '@/lib/board-brawl/i18n';
import CountryFlag from '@/components/board-brawl/CountryFlag';
import { Zap, ArrowRight, ShieldCheck, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

export default function ActionModal({
  currentTileId,
  properties = {},
  player,
  players = [],
  teamMode = 'ffa',
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
  const ownerPlayer = prop.ownerId ? players.find(p => p.id === prop.ownerId) : null;
  const isTeammate = teamMode !== 'ffa' && Boolean(ownerPlayer && player && ownerPlayer.id !== player.id && (ownerPlayer.team ?? 0) === (player.team ?? 0));
  const canUpgrade = isOwner || isTeammate;
  const isRival = Boolean(prop.ownerId && prop.ownerId !== player?.id && !isTeammate);
  const rivalOwner = isRival ? ownerPlayer : null;
  const currentLvl = prop.level || 0;
  const hasFestival = !!prop.festival;
  const hasChampionship = !!prop.worldChampionship;
  const rentMultiplier = (hasFestival ? 2 : 1) * (hasChampionship ? 2 : 1);

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
    if (canUpgrade) {
      if (currentLvl === 4) return 5; // Hotel unlocked!
      if (currentLvl === 3) return hasCompletedFirstOrbit ? 4 : 3;
      if (currentLvl < 3) return Math.min(3, currentLvl + 1);
    }
    return 1;
  });

  const [isBusy, setIsBusy] = useState(false);

  const handleAction = (callback) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      callback?.();
    } finally {
      setTimeout(() => setIsBusy(false), 1200);
    }
  };

  if (!tile || !isActionable) return null;

  // Financial calculations
  const totalVal = isResort
    ? tile.price
    : (tile.price + (Math.max(0, currentLvl - 1)) * (tile.housePrice || 0));
  const buyoutCost = totalVal * 2;
  const canBuyout = isRival && !prop.shielded && player?.cash >= buyoutCost;

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
      return { isLocked: true, reason: t('orbit2Req', {}, 'Orbit 2 Req.') };
    }

    // Tier 5: Hotel -> ONLY available after 3 houses have been built!
    if (tierLvl === 5) {
      if (!prop.ownerId) {
        return { isLocked: true, reason: t('need3Houses', {}, 'Need 3 Houses') };
      }
      if (currentLvl < 4) {
        return { isLocked: true, reason: t('need3Houses', {}, 'Need 3 Houses') };
      }
    }

    // On upgrades: tiers below or equal to current level are already built
    if (canUpgrade && tierLvl <= currentLvl) {
      return { isLocked: false, isAlreadyBuilt: true, reason: t('built', {}, 'Built') };
    }

    return { isLocked: false, reason: '' };
  };

  const costToBuild = isResort ? tile.price : getTierCost(selectedTier);
  const playerCash = player?.cash || 0;
  const canAfford = playerCash >= costToBuild;
  const remBalance = playerCash - costToBuild;
  const remBuyout = playerCash - buyoutCost;

  // Rent calculations
  const RESORT_IDS = RESORT_TILES;
  const rivalResortsCount = isRival
    ? RESORT_IDS.filter(id => properties[id]?.ownerId === rivalOwner?.id).length
    : 0;
  const playerResortsCount = isOwner
    ? RESORT_IDS.filter(id => properties[id]?.ownerId === player?.id).length
    : (!prop.ownerId ? RESORT_IDS.filter(id => properties[id]?.ownerId === player?.id).length + 1 : 0);

  const baseCurrentRent = isResort
    ? (tile.baseRent * (isRival ? Math.pow(2, Math.max(0, rivalResortsCount - 1)) : 1))
    : (tile.rent
        ? (tile.rent[Math.min(4, Math.max(0, currentLvl - 1))] || tile.rent[0])
        : 0);
  const currentRent = baseCurrentRent * rentMultiplier;

  const getRentForTier = (tierLvl) => {
    if (isResort) {
      return tile.baseRent * Math.pow(2, Math.max(0, playerResortsCount - 1)) * rentMultiplier;
    }
    const baseTierRent = tile.rent?.[Math.min(4, Math.max(0, tierLvl - 1))] || tile.rent?.[0] || 0;
    return baseTierRent * rentMultiplier;
  };

  const nextRent = getRentForTier(selectedTier);
  const ribbonColor = tile.color || (isResort ? '#06b6d4' : '#2563eb');

  // Building tiers configuration (Plot, 1 House, 2 Houses, 3 Houses, Hotel)
  const TIERS = [
    {
      level: 1,
      name: t('tierPlot', {}, 'PLOT'),
      subtitle: t('tierSubLand', {}, 'Land'),
      icon: '🌱',
      accentColor: '#3b82f6',
      bgGradient: 'linear-gradient(180deg, #eff6ff, #dbeafe)',
    },
    {
      level: 2,
      name: t('tier1House', {}, '1 HOUSE'),
      subtitle: t('tierSubCottage', {}, 'Cottage'),
      icon: '🏡',
      accentColor: '#10b981',
      bgGradient: 'linear-gradient(180deg, #ecfdf5, #d1fae5)',
    },
    {
      level: 3,
      name: t('tier2Houses', {}, '2 HOUSES'),
      subtitle: t('tierSubDuplex', {}, 'Duplex'),
      icon: '🏘️',
      accentColor: '#059669',
      bgGradient: 'linear-gradient(180deg, #f0fdf4, #bbf7d0)',
    },
    {
      level: 4,
      name: t('tier3Houses', {}, '3 HOUSES'),
      subtitle: t('tierSubTerrace', {}, 'Terrace'),
      icon: '🏙️',
      accentColor: '#f97316',
      bgGradient: 'linear-gradient(180deg, #fff7ed, #fed7aa)',
    },
    {
      level: 5,
      name: t('tierHotel', {}, 'HOTEL'),
      subtitle: t('tierSubResort', {}, 'Resort'),
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
            <span>{tile.country} • {tile.colorGroup} {t('district', {}, 'District')}</span>
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

          {(hasFestival || hasChampionship) && (
            <div style={{
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}>
              {hasFestival && (
                <span style={{
                  background: 'rgba(234, 88, 12, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}>
                  🎪 {t('festival2x', {}, '2X FESTIVAL')}
                </span>
              )}
              {hasChampionship && (
                <span style={{
                  background: 'rgba(202, 138, 4, 0.92)',
                  border: '1px solid rgba(254, 240, 138, 0.7)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}>
                  🏆 {t('championship2x', {}, '2X CHAMPIONSHIP')}
                </span>
              )}
              {hasFestival && hasChampionship && (
                <span style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid #fde047',
                  color: '#fde047',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                }}>
                  ⚡ {t('rent4x', {}, '4X RENT')}
                </span>
              )}
            </div>
          )}

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
                {isResort ? '🏖️' : (tile.flag || '🏨')}
              </span>
            </div>
          </div>

          {isResort ? (
            /* Resort Card */
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.95) 100%)',
              border: `2px solid ${ribbonColor}`,
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '16px',
              boxShadow: `0 8px 20px -5px ${ribbonColor}40`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🏖️</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: ribbonColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t('resortsMonopolySystem', {}, '4 RESORTS MONOPOLY SYSTEM')}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                      {t('lineCoastalResort', { line: Math.floor(tile.id / 8) }, `Line ${Math.floor(tile.id / 8)} Coastal Resort`)}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: ribbonColor,
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 900,
                }}>
                  {t('baseRent', {}, 'BASE RENT')} {formatCash(tile.baseRent)} CR
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
                    <span style={{ fontWeight: 700, color: '#0e7490' }}>💳 {t('remainingBalance', {}, 'Remaining Balance')}:</span>
                    <span style={{ fontWeight: 900, color: remBalance >= 0 ? '#15803d' : '#b91c1c' }}>
                      {formatFullCash(Math.max(0, remBalance))} CR
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#0e7490' }}>📈 {t('rentMultiplierLabel', {}, 'Rent Multiplier')}:</span>
                  <span style={{ fontWeight: 900, color: '#0891b2' }}>{t('resortRentScale', {}, '2x per Resort Owned (1x, 2x, 4x, 8x)')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#0e7490' }}>🏆 {t('winConditionLabel', {}, 'Win Condition')}:</span>
                  <span style={{ fontWeight: 900, color: '#047857' }}>{t('resortInstantWinHint', {}, 'Own all 4 Resorts for INSTANT WIN!')}</span>
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
                  const isBuilt = canUpgrade && tier.level <= currentLvl;
                  const cost = getTierCost(tier.level);
                  const rem = playerCash - cost;
                  const isClickable = !lockInfo.isLocked && (!canUpgrade || tier.level > currentLvl);

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
                          <span>{t('builtUpper', {}, 'BUILT')}</span>
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
                        {isBuilt ? t('activeUpper', {}, 'ACTIVE') : `${Math.round(cost / 1000)}k CR`}
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
                          {rem >= 0 ? `${t('leftShort', {}, 'Left')}: ${Math.round(rem / 1000)}k` : t('shortCash', {}, 'Short!')}
                        </div>
                      )}

                      {lockInfo.isLocked && (
                        <div style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          color: '#64748b',
                          marginTop: '2px',
                        }}>
                          {t('locked', {}, 'Locked')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Financial Yield Banner */}
              <div style={{
                background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #fcd34d',
                borderRadius: '14px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '16px',
                boxShadow: 'inset 0 1px 2px #ffffff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🪙</span>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                      {t('rentYield')} ({selectedTierObj.name})
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#78350f', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{formatCash(nextRent)} CR</span>
                      {rentMultiplier > 1 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 900,
                          background: rentMultiplier === 4 ? '#7c2d12' : '#c2410c',
                          color: '#fef08a',
                          padding: '1px 6px',
                          borderRadius: '999px',
                        }}>
                          {rentMultiplier}X
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {hasFestival && (
                    <div style={{
                      background: '#fff7ed',
                      border: '1px solid #fb923c',
                      padding: '4px 9px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 900,
                      color: '#c2410c',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}>
                      🎪 {t('festival2x', {}, '2X FESTIVAL')}
                    </div>
                  )}
                  {hasChampionship && (
                    <div style={{
                      background: '#fefce8',
                      border: '1px solid #eab308',
                      padding: '4px 9px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 900,
                      color: '#a16207',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}>
                      🏆 {t('championship2x', {}, '2X CHAMPIONSHIP')}
                    </div>
                  )}
                  <div style={{
                    background: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#b45309',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}>
                    {t('fullDistrict2x', {}, 'FULL DISTRICT: 2X')}
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
                    {t('orbitUpper', {}, 'ORBIT')} {playerLaps + 1}
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
                onClick={() => handleAction(() => {
                  sounds.playBuild();
                  onBuy(tile.id, isResort ? 1 : selectedTier);
                })}
                disabled={isBusy || !canAfford || selectedLockStatus.isLocked}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: canAfford && !selectedLockStatus.isLocked
                    ? (isResort ? `linear-gradient(180deg, ${ribbonColor} 0%, ${ribbonColor}dd 100%)` : 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)')
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
                    ? t('acquireResort', {}, 'Acquire Resort')
                    : t('buyAndBuildTier', { tier: selectedTierObj.name }, `Buy & Build ${selectedTierObj.name}`)} • {formatCash(costToBuild)} CR
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: remBalance >= 0 ? '#dcfce7' : '#fee2e2' }}>
                  {t('remainingBalance', {}, 'Remaining Balance')}: {formatFullCash(Math.max(0, remBalance))} CR
                </span>
              </button>
            )}

            {/* Case 2: Owned by Player or Teammate -> Upgrade Button */}
            {canUpgrade && isCity && currentLvl < 5 && (
              <button
                onClick={() => handleAction(() => {
                  sounds.playBuild();
                  onUpgrade(tile.id, selectedTier);
                })}
                disabled={isBusy || !canAfford || selectedLockStatus.isLocked || selectedTier <= currentLvl}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: canAfford && !selectedLockStatus.isLocked && selectedTier > currentLvl
                    ? (isTeammate
                        ? 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)'
                        : 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)')
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
                  {isTeammate ? '🤝 ' : ''}
                  {isTeammate
                    ? t('upgradeTeammateToTier', { name: ownerPlayer?.name, tier: selectedTierObj.name }, `Upgrade Teammate ${ownerPlayer?.name}'s City to ${selectedTierObj.name}`)
                    : t('upgradeToTier', { tier: selectedTierObj.name }, `Upgrade to ${selectedTierObj.name}`)} ({formatCash(costToBuild)} CR)
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: remBalance >= 0 ? '#dbeafe' : '#fee2e2' }}>
                  {t('remainingBalance', {}, 'Remaining Balance')}: {formatFullCash(Math.max(0, remBalance))} CR
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
                🏖️ {t('ownResortNotice', { rent: formatCash(currentRent), count: playerResortsCount }, `You own this resort! Current Rent: ${formatCash(currentRent)} CR (${playerResortsCount} of 4 Resorts owned)`)}
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

                <button
                  onClick={() => handleAction(() => {
                    sounds.playBuyout();
                    onBuyout(tile.id);
                  })}
                  disabled={isBusy || !canBuyout}
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
                    <span>{t('hostileBuyout', {}, 'Hostile Buyout')} ({formatCash(buyoutCost)} CR)</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: remBuyout >= 0 ? '#fdf2f8' : '#fee2e2' }}>
                    {t('remainingBalance', {}, 'Remaining Balance')}: {formatFullCash(Math.max(0, remBuyout))} CR
                  </span>
                </button>
              </>
            )}

            {/* End Turn / Pass Action Button */}
            <button
              onClick={() => handleAction(() => onEndTurn?.())}
              disabled={isBusy}
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

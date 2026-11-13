'use client';

import React, { useEffect, useRef } from 'react';
import { TILES, RESORT_TILES } from '@/lib/board-brawl/types';
import { useTranslation } from '@/lib/board-brawl/i18n';
import CountryFlag from '@/components/board-brawl/CountryFlag';
import {
  X,
  Building,
  Home,
  Coins,
  Flame,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Award,
  Plane,
  HelpCircle,
  Info,
  Lock,
  Sparkles,
  MapPin,
} from 'lucide-react';

const TIER_NAMES = [
  { name: 'Plot', icon: '🌱', level: 1 },
  { name: 'Built Lv 1 (1 House)', icon: '🏡', level: 2 },
  { name: 'Built Lv 2 (2 Houses)', icon: '🏘️', level: 3 },
  { name: 'Built Lv 3 (3 Houses)', icon: '🏙️', level: 4 },
  { name: 'Hotel', icon: '🏨', level: 5 },
];

export default function TileInfoModal({
  isOpen,
  tileId,
  properties = {},
  players = [],
  onClose,
}) {
  const { t } = useTranslation();
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || tileId == null) return null;

  const tile = TILES.find((t) => t.id === tileId) || TILES[tileId];
  if (!tile) return null;

  const prop = properties[tileId] || {};
  const owner = prop.ownerId ? players.find((p) => p.id === prop.ownerId) : null;
  const currentLevel = prop.level || 0;
  const isCity = tile.type === 'city';
  const isResort = tile.type === 'resort';
  const hasFestival = !!prop.festival;
  const hasChampionship = !!prop.worldChampionship;
  const rentMultiplier = (hasFestival ? 2 : 1) * (hasChampionship ? 2 : 1);

  const RESORT_IDS = RESORT_TILES;
  const ownerResortsCount = isResort && owner ? RESORT_IDS.filter(id => properties[id]?.ownerId === owner.id).length : 0;
  const resortMultiplier = Math.pow(2, Math.max(0, ownerResortsCount - 1));

  // Financial calculations
  const totalVal = isResort
    ? tile.price
    : (isCity ? tile.price + Math.max(0, currentLevel - 1) * (tile.housePrice || 0) : 0);
  const buyoutCost = totalVal * 2;
  const rawBaseRent = isResort
    ? (tile.baseRent * (owner ? resortMultiplier : 1))
    : (isCity && tile.rent
        ? (tile.rent[Math.min(4, Math.max(0, currentLevel - 1))] || tile.rent[0])
        : 0);
  const activeRent = rawBaseRent * (hasFestival ? 2 : 1) * (hasChampionship ? 2 : 1);

  const ribbonColor = tile.color || (
    tile.type === 'start' ? '#10b981' :
    tile.type === 'jail' ? '#f59e0b' :
    tile.type === 'world_tour' ? '#06b6d4' :
    tile.type === 'resort' ? '#06b6d4' :
    tile.type === 'festival' ? '#8b5cf6' :
    tile.type === 'championship' ? '#f59e0b' :
    tile.type === 'armory' ? '#ef4444' :
    tile.type === 'tax' ? '#64748b' : '#ec4899'
  );

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(7, 11, 22, 0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: 'min(92vh, 680px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          borderRadius: '24px',
          border: `2px solid ${ribbonColor}55`,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.6), 0 0 35px ${ribbonColor}33`,
          color: '#ffffff',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Sleek Top Header Ribbon */}
        <div
          style={{
            background: `linear-gradient(135deg, ${ribbonColor} 0%, ${ribbonColor}dd 100%)`,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)',
              }}
            >
              {tile.country ? (
                <CountryFlag country={tile.country} code={tile.flag} width={30} height={20} />
              ) : (
                tile.flag || tile.icon || '📍'
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tile.country || tile.colorGroup?.replace('_', ' ') || t('specialZone', {}, 'SPECIAL ZONE')}</span>
                <span>•</span>
                <span>{t('tileHash', { id: tile.id }, `TILE #${tile.id}`)}</span>
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                }}
              >
                {t(tile.name)}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => onClose?.()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.45)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Section: Ownership Badge & Financial Status */}
          {isCity ? (
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: owner ? (owner.avatarColor || '#38bdf8') : 'rgba(255, 255, 255, 0.08)',
                      border: `2px solid ${owner ? (owner.avatarColor || '#38bdf8') : 'rgba(255, 255, 255, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      boxShadow: owner ? `0 0 12px ${owner.avatarColor || '#38bdf8'}66` : 'none',
                    }}
                  >
                    {owner ? (owner.avatarToken ? '🎩' : '👤') : '🏳️'}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('currentOwnership', {}, 'Current Ownership')}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: owner ? '#ffffff' : '#94a3b8' }}>
                      {owner ? owner.name : t('neutralUnowned', {}, 'Neutral / Unowned')}
                    </div>
                  </div>
                </div>

                {owner ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        background: `${owner.avatarColor || '#38bdf8'}22`,
                        color: owner.avatarColor || '#38bdf8',
                        border: `1px solid ${owner.avatarColor || '#38bdf8'}55`,
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('tierLabel', { level: currentLevel }, `Tier ${currentLevel}`)} • {t('tierName_' + currentLevel, {}, (TIER_NAMES.find((tier) => tier.level === currentLevel) || TIER_NAMES[0]).name)}
                    </span>
                    {prop.shielded && (
                      <span
                        style={{
                          background: 'rgba(14, 165, 233, 0.2)',
                          color: '#7dd3fc',
                          border: '1px solid rgba(56, 189, 248, 0.5)',
                          fontSize: '10px',
                          fontWeight: 900,
                          padding: '2px 7px',
                          borderRadius: '999px',
                        }}
                      >
                        🛡️ {t('cityShieldProtected', {}, 'City Shield Protected')}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{t('landPrice', {}, 'LAND PRICE')}</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>
                      {Math.round(tile.price / 1000)}K CR
                    </div>
                  </div>
                )}
              </div>

              {(hasFestival || hasChampionship) && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '6px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                  }}
                >
                  {hasFestival && (
                    <span
                      style={{
                        background: 'rgba(234, 88, 12, 0.2)',
                        color: '#fb923c',
                        border: '1px solid rgba(234, 88, 12, 0.45)',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        letterSpacing: '0.4px',
                      }}
                    >
                      🎪 2X FESTIVAL CITY • 2X RENT
                    </span>
                  )}
                  {hasChampionship && (
                    <span
                      style={{
                        background: 'rgba(234, 179, 8, 0.2)',
                        color: '#facc15',
                        border: '1px solid rgba(234, 179, 8, 0.45)',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        letterSpacing: '0.4px',
                      }}
                    >
                      🏆 2X CHAMPIONSHIP HOST
                    </span>
                  )}
                  {hasFestival && hasChampionship && (
                    <span
                      style={{
                        background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.35), rgba(234, 179, 8, 0.35))',
                        color: '#fef08a',
                        border: '1px solid rgba(250, 204, 21, 0.65)',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        letterSpacing: '0.4px',
                      }}
                    >
                      ⚡ 4X COMBINED RENT
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Special Tile Overview Box */
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: `${ribbonColor}25`,
                  border: `1px solid ${ribbonColor}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                {tile.icon || '⭐'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('zoneType', {}, 'Zone Type')}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                  {tile.type === 'start' && t('zoneStartDesc', {}, 'Universal Starting Grid & Payroll')}
                  {tile.type === 'jail' && (t('ancientTemple', {}, 'Ancient Temple'))}
                  {tile.type === 'world_tour' && t('zoneWorldTourDesc', {}, 'World Tour Supersonic Terminal')}
                  {tile.type === 'festival' && t('zoneFestivalDesc', {}, 'World Fair Championship Arena')}
                  {tile.type === 'championship' && t('zoneChampionshipDesc', {}, 'World Championship Stadium Arena')}
                  {tile.type === 'resort' && t('zoneResortDesc', {}, 'Line Coastal Resort (Rent doubles per resort owned, 4 Resorts = Instant Victory)')}
                  {tile.type === 'armory' && t('zoneArmoryDesc', {}, 'Tactical Armory Depot')}
                  {tile.type === 'tax' && t('zoneTaxDesc', {}, 'Municipal Revenue Assessment')}
                  {tile.type === 'chance' && t('mysteryCardDeck', {}, 'Mystery Card Deck')}
                </div>
              </div>
            </div>
          )}

          {/* Section: Rent Progression Breakdown Table (Only for Cities) */}
          {isCity && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 4px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Coins size={14} color="#38bdf8" />
                  <span>{t('rentProgressionTable', {}, 'Rent Progression Table')}</span>
                </div>
                {owner ? (
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: rentMultiplier === 4 ? '#fde047' : hasChampionship ? '#facc15' : hasFestival ? '#fb923c' : '#38bdf8',
                    }}
                  >
                    {t('activeRent', {}, 'Active Rent')}: <strong>{activeRent.toLocaleString()} CR</strong>
                    {rentMultiplier > 1 && ` (${rentMultiplier}X)`}
                  </div>
                ) : rentMultiplier > 1 ? (
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: rentMultiplier === 4 ? '#fde047' : hasChampionship ? '#facc15' : '#fb923c',
                    }}
                  >
                    {t('rentBonusActive', { mult: rentMultiplier }, `${rentMultiplier}X RENT BONUS ACTIVE`)}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'rgba(30, 41, 59, 0.75)',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                        textAlign: 'left',
                        color: '#94a3b8',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      <th style={{ padding: '10px 14px' }}>{t('developmentTier', {}, 'Development Tier')}</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>{t('rentYield', {}, 'Rent Yield')}</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>{t('buildCost', {}, 'Build Cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIER_NAMES.map((tier, idx) => {
                      const rentVal = tile.rent?.[tier.level - 1] || 0;
                      const displayRent = rentVal * rentMultiplier;
                      const isCurrentTier = currentLevel === tier.level;
                      const buildCost =
                        tier.level === 1
                          ? tile.price
                          : (tier.level - 1) * tile.housePrice;

                      return (
                        <tr
                          key={tier.level}
                          style={{
                            background: isCurrentTier
                              ? 'rgba(56, 189, 248, 0.16)'
                              : idx % 2 === 0
                              ? 'transparent'
                              : 'rgba(255, 255, 255, 0.02)',
                            borderBottom:
                              idx < TIER_NAMES.length - 1
                                ? '1px solid rgba(148, 163, 184, 0.1)'
                                : 'none',
                            color: isCurrentTier ? '#ffffff' : '#cbd5e1',
                            fontWeight: isCurrentTier ? 800 : 500,
                          }}
                        >
                          <td style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{tier.icon}</span>
                            <span>{tier.name}</span>
                            {isCurrentTier && (
                              <span
                                style={{
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  fontSize: '9px',
                                  fontWeight: 900,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '10px 14px',
                              textAlign: 'right',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: isCurrentTier
                                ? (rentMultiplier === 4 ? '#fde047' : hasChampionship ? '#facc15' : hasFestival ? '#fb923c' : '#38bdf8')
                                : '#e2e8f0',
                            }}
                          >
                            {displayRent.toLocaleString()} CR
                            {rentMultiplier > 1 && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: rentMultiplier === 4 ? '#fde047' : hasChampionship ? '#facc15' : '#fb923c',
                                  marginLeft: '4px',
                                }}
                              >
                                ({rentMultiplier}x)
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '10px 14px',
                              textAlign: 'right',
                              fontFamily: 'monospace',
                              color: '#94a3b8',
                              fontSize: '12px',
                            }}
                          >
                            {buildCost.toLocaleString()} CR
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Buyout Metric Banner */}
              {owner && (
                <div
                  style={{
                    background: prop.shielded
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(245, 158, 11, 0.12)',
                    border: `1px solid ${prop.shielded ? '#10b98155' : '#f59e0b55'}`,
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {prop.shielded ? (
                      <ShieldCheck size={18} color="#38bdf8" />
                    ) : (
                      <Zap size={18} color="#f59e0b" />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: prop.shielded ? '#7dd3fc' : '#fbbf24',
                        }}
                      >
                        {prop.shielded
                          ? t('cityShieldActiveTitle', {}, 'Fortress City Shield Active')
                          : t('hostileBuyoutValuation', {}, 'Hostile Buyout Valuation')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {prop.shielded
                          ? t('cityShieldProtectedDesc', {}, 'Protected against 1 hostile buyout or disaster attack')
                          : t('hostileBuyoutDesc', {}, 'Rivals can seize this tile by paying 2x total property value')}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#f59e0b' }}>
                      {buyoutCost.toLocaleString()} CR
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      ({t('twoXOfVal', { val: totalVal.toLocaleString() }, `2x of ${totalVal.toLocaleString()} CR`)})
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Rent Progression Breakdown Table (Only for Resorts) */}
          {isResort && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 4px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: ribbonColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🏖️</span>
                  <span>{t('resortsMonopolySystem', {}, '4 Resorts Monopoly System')}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {t('baseLabel', {}, 'Base')}: {(tile.baseRent || 0).toLocaleString()} CR
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                        color: '#94a3b8',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '10px 14px' }}>Resorts Owned</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Multiplier</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Rent Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { count: 1, mult: '1x', rent: (tile.baseRent || 0) * 1 },
                      { count: 2, mult: '2x', rent: (tile.baseRent || 0) * 2 },
                      { count: 3, mult: '4x', rent: (tile.baseRent || 0) * 4 },
                      { count: 4, mult: '8x + WIN', rent: (tile.baseRent || 0) * 8, win: true },
                    ].map((row, idx) => {
                      const isCurrent = ownerResortsCount === row.count;
                      return (
                        <tr
                          key={row.count}
                          style={{
                            background: isCurrent
                              ? 'rgba(6, 182, 212, 0.18)'
                              : idx % 2 === 0
                              ? 'transparent'
                              : 'rgba(255, 255, 255, 0.02)',
                            borderBottom: idx < 3 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
                            color: isCurrent ? '#ffffff' : '#cbd5e1',
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: isCurrent ? 800 : 600 }}>
                            {row.count} Resort{row.count > 1 ? 's' : ''}
                            {isCurrent && (
                              <span
                                style={{
                                  marginLeft: '6px',
                                  background: ribbonColor,
                                  color: '#ffffff',
                                  fontSize: '9px',
                                  fontWeight: 900,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: row.win ? '#34d399' : '#38bdf8' }}>
                            {row.mult}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: row.win ? '#34d399' : '#e2e8f0' }}>
                            {row.rent.toLocaleString()} CR
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section: Special Tile Mechanics Deep Dive */}
          {!isCity && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} color="#38bdf8" />
                  <span>Tile Mechanics & Rules</span>
                </div>

                {tile.type === 'start' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Salary Grant:</strong> Every time you pass or land on the START tile, you automatically collect <strong>200,000 Space Credits</strong> (200K CR) directly into your treasury.
                    </p>
                    <p>
                      <strong>Strategic Value:</strong> Passing START provides essential liquidity to finance new construction, purchase hotels, or survive high rent districts on the northern board.
                    </p>
                  </div>
                )}

                {tile.type === 'jail' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Ancient Temple Choice:</strong> When you land here, choose whether to <strong>Stay Outside</strong> safely (no penalty) or <strong>Enter &amp; Roll 1 Die</strong>:
                    </p>
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li><strong>Roll 1–3:</strong> Trapped inside the temple ruins for up to <strong>3 turns</strong>!</li>
                      <li><strong>Roll 4–6:</strong> Uncover <strong>+300.000 CR</strong> ancient treasure and stay free!</li>
                    </ul>
                    <p>
                      <strong>Escape Routes (if trapped):</strong>
                    </p>
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li>Roll <strong>Doubles</strong> on your dice turn.</li>
                      <li>Pay <strong>100.000 CR</strong> bail to leave the Ancient Temple immediately.</li>
                      <li>Serve 3 turns; on the 4th turn, you are released freely.</li>
                    </ul>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                      💡 <em>Pro Tip:</em> High risk, high reward — staying outside is always safe when rival hotels dominate the board!
                    </p>
                  </div>
                )}

                {tile.type === 'world_tour' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Supersonic Fast-Travel:</strong> Landing on World Tour activates flight mode for your next turn upon paying a <strong>50,000 Space Credits</strong> (50K CR) boarding pass.
                    </p>
                    <p>
                      <strong>Destination Freedom:</strong> Select ANY tile on the board to travel directly to it. Land on neutral monopolies, snatch empty premium cities, or upgrade your key hotels.
                    </p>
                  </div>
                )}

                {tile.type === 'festival' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Championship Host:</strong> Landing on the World Fair lets you designate one of your owned properties to host the global tournament.
                    </p>
                    <p>
                      <strong>2X Rent Multiplier:</strong> The selected city instantly receives a <strong>2x Rent multiplier</strong> banner! Opponents who step on it will pay double the regular tariff.
                    </p>
                  </div>
                )}

                {tile.type === 'championship' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Stadium Host Selection:</strong> Landing on the World Championship Stadium lets you select one of your owned cities to host the global championship.
                    </p>
                    <p>
                      <strong>2X Championship Multiplier (Stacks to 4X):</strong> The hosted city earns a <strong>🏆 2x Championship Host</strong> banner! Hosting on a <strong>🎪 Festive City</strong> stacks both bonuses for <strong>4x Rent</strong>.
                    </p>
                  </div>
                )}

                {tile.type === 'armory' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Offensive Depot:</strong> Landing on the Armory immediately grants you <strong>+2 Free Rotten Tomatoes</strong> (🍅) added to your inventory.
                    </p>
                    <p>
                      <strong>Sabotage Rules:</strong> Throw tomatoes at rivals to inflict the <strong>BLINDED</strong> status for 1 turn. Blinded players cannot roll doubles and have their dice roll capped!
                    </p>
                  </div>
                )}

                {tile.type === 'tax' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Property Tax Assessment:</strong> Landing on this sector taxes you <strong>10% of the total built worth</strong> of all Houses and Hotels you currently own across the board (empty plots and resorts incur 0 CR).
                    </p>
                    <p>
                      <strong>Jackpot Contribution:</strong> 100% of collected Property Tax flows directly into the <strong>World Championship Community Jackpot</strong>.
                    </p>
                  </div>
                )}

                {tile.type === 'chance' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>{t('mysteryCardDrawTitle', {}, 'Mystery Card Draw')}:</strong> {t('mysteryCardDrawDesc', {}, 'Pull a Mystery Card that can turn the match around in a single turn.')}
                    </p>
                    <p>
                      <strong>{t('potentialPulls', {}, 'Potential Pulls')}:</strong> {t('mysteryPullsDesc', {}, 'Syndicate heists, Fortress City Shields, dividend payouts (+150K CR), municipal grants (+100K CR), IRS audits, or emergency supersonic travel passes.')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Dismiss Action */}
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(148, 163, 184, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#38bdf8" />
            <span>{t('clickTileInspectHint', {}, 'Click any board tile in 3D to inspect its intelligence')}</span>
          </div>

          <button
            onClick={() => onClose?.()}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {t('closeInspector', {}, 'Close Inspector')}
          </button>
        </div>
      </div>
    </div>
  );
}

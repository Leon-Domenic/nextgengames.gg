'use client';

import React, { useEffect, useRef } from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { t } from '@/lib/board-brawl/i18n';
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
  Landmark as LandmarkIcon,
} from 'lucide-react';

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
  Australia: '🦘',
  USA: '🗽',
};

const TIER_NAMES = [
  { name: 'Base Land', icon: '🌱', level: 1 },
  { name: 'Level 1 (1 Villa)', icon: '🏡', level: 2 },
  { name: 'Level 2 (2 Villas)', icon: '🏘️', level: 3 },
  { name: 'Level 3 (3 Villas)', icon: '🏢', level: 4 },
  { name: 'Landmark', icon: '🏰', level: 5 },
];

export default function TileInfoModal({
  isOpen,
  tileId,
  properties = {},
  players = [],
  onClose,
}) {
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

  const RESORT_IDS = [6, 12, 20, 28];
  const ownerResortsCount = isResort && owner ? RESORT_IDS.filter(id => properties[id]?.ownerId === owner.id).length : 0;
  const resortMultiplier = Math.pow(2, Math.max(0, ownerResortsCount - 1));

  // Financial calculations
  const totalVal = isResort
    ? tile.price
    : (isCity ? tile.price + Math.max(0, currentLevel - 1) * (tile.housePrice || 0) : 0);
  const buyoutCost = totalVal * 2;
  const rawBaseRent = isResort
    ? (tile.baseRent * (owner ? resortMultiplier : 1))
    : (isCity && tile.rent ? (tile.rent[Math.max(0, currentLevel - 1)] || tile.rent[0]) : 0);
  const activeRent = hasFestival ? rawBaseRent * 2 : rawBaseRent;

  const ribbonColor = tile.color || (
    tile.type === 'start' ? '#10b981' :
    tile.type === 'jail' ? '#f59e0b' :
    tile.type === 'world_tour' ? '#06b6d4' :
    tile.type === 'resort' ? '#06b6d4' :
    tile.type === 'festival' ? '#8b5cf6' :
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
              {tile.flag || tile.icon || '📍'}
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
                <span>{tile.country || tile.colorGroup?.replace('_', ' ') || 'SPECIAL ZONE'}</span>
                <span>•</span>
                <span>TILE #{tile.id}</span>
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
                    Current Ownership
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: owner ? '#ffffff' : '#94a3b8' }}>
                    {owner ? owner.name : 'Neutral / Unowned'}
                  </div>
                </div>
              </div>

              {owner ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px',
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
                    Tier {currentLevel} • {TIER_NAMES[Math.min(4, Math.max(0, currentLevel - 1))]?.name}
                  </span>
                  {hasFestival && (
                    <span
                      style={{
                        background: 'rgba(234, 88, 12, 0.2)',
                        color: '#fb923c',
                        border: '1px solid rgba(234, 88, 12, 0.4)',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Flame size={12} /> 2X FESTIVAL
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>LAND PRICE</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>
                    ₩{Math.round(tile.price / 1000)}K CR
                  </div>
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
                  Zone Type
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                  {tile.type === 'start' && 'Universal Starting Grid & Payroll'}
                  {tile.type === 'jail' && 'Resort Island Prison'}
                  {tile.type === 'world_tour' && 'World Tour Supersonic Terminal'}
                  {tile.type === 'festival' && 'World Fair Championship Arena'}
                  {tile.type === 'resort' && 'Line Coastal Resort (Rent doubles per resort owned, 4 Resorts = Instant Victory)'}
                  {tile.type === 'armory' && 'Tactical Armory Depot'}
                  {tile.type === 'tax' && 'Municipal Revenue Assessment'}
                  {tile.type === 'chance' && 'Chance Tactical Mystery Deck'}
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
                  <span>Rent Progression Table</span>
                </div>
                {owner && (
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: hasFestival ? '#fb923c' : '#38bdf8',
                    }}
                  >
                    Active Rent: <strong>₩{activeRent.toLocaleString()} CR</strong>
                  </div>
                )}
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
                      <th style={{ padding: '10px 14px' }}>Development Tier</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Rent Yield</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Build Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIER_NAMES.map((tier, idx) => {
                      const rentVal = tile.rent?.[idx] || 0;
                      const displayRent = hasFestival ? rentVal * 2 : rentVal;
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
                              color: isCurrentTier ? (hasFestival ? '#fb923c' : '#38bdf8') : '#e2e8f0',
                            }}
                          >
                            ₩{displayRent.toLocaleString()} CR
                            {hasFestival && (
                              <span style={{ fontSize: '10px', color: '#fb923c', marginLeft: '4px' }}>
                                (2x)
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
                            ₩{buildCost.toLocaleString()} CR
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
                    background: prop.isLandmark
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(245, 158, 11, 0.12)',
                    border: `1px solid ${prop.isLandmark ? '#10b98155' : '#f59e0b55'}`,
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {prop.isLandmark ? (
                      <ShieldCheck size={18} color="#10b981" />
                    ) : (
                      <Zap size={18} color="#f59e0b" />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: prop.isLandmark ? '#34d399' : '#fbbf24',
                        }}
                      >
                        {prop.isLandmark
                          ? 'Landmark Fortress Protected'
                          : 'Hostile Buyout Valuation'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {prop.isLandmark
                          ? 'Landmarks cannot be bought out by any rival'
                          : 'Rivals can seize this tile by paying 2x total property value'}
                      </div>
                    </div>
                  </div>
                  {!prop.isLandmark && (
                    <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#f59e0b' }}>
                        ₩{buyoutCost.toLocaleString()} CR
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        (2x of ₩{totalVal.toLocaleString()})
                      </div>
                    </div>
                  )}
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
                    color: '#06b6d4',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🏖️</span>
                  <span>4 Resorts Monopoly System</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Base: ₩{(tile.baseRent || 0).toLocaleString()} CR
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
                                  background: '#06b6d4',
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
                            ₩{row.rent.toLocaleString()} CR
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
                      <strong>Salary Grant:</strong> Every time you pass or land on the START tile, you automatically collect <strong>200,000 Space Credits</strong> (₩200K) directly into your treasury.
                    </p>
                    <p>
                      <strong>Strategic Value:</strong> Passing START provides essential liquidity to finance new construction, purchase hotels, or survive high rent districts on the northern board.
                    </p>
                  </div>
                )}

                {tile.type === 'jail' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Detention:</strong> When sent to Resort Island, you are detained for up to <strong>3 turns</strong> and cannot move around the board.
                    </p>
                    <p>
                      <strong>Escape Routes:</strong>
                    </p>
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li>Roll <strong>Doubles</strong> on your dice turn.</li>
                      <li>Pay <strong>100,000 Space Credits</strong> (₩100K) bail to leave immediately.</li>
                      <li>Serve 3 turns; on the 4th turn, you are released freely.</li>
                    </ul>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                      💡 <em>Pro Tip:</em> In the late game with rival landmarks everywhere, staying safe on the island avoids paying millions in rent!
                    </p>
                  </div>
                )}

                {tile.type === 'world_tour' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Supersonic Fast-Travel:</strong> Landing on World Tour activates flight mode for your next turn upon paying a <strong>50,000 Space Credits</strong> (₩50K) boarding pass.
                    </p>
                    <p>
                      <strong>Destination Freedom:</strong> Select ANY tile on the board to travel directly to it. Land on neutral monopolies, snatch empty premium cities, or upgrade your key landmarks.
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
                      <strong>Tax Assessment:</strong> Landing on this sector triggers mandatory payment of <strong>₩{tile.amount?.toLocaleString() || '120,000'} CR</strong> into the municipal coffer.
                    </p>
                    <p>
                      <strong>Shield Immunity:</strong> Players holding an active <strong>Energy Shield</strong> (🛡️) absorb 100% of the tax liability without paying a single credit.
                    </p>
                  </div>
                )}

                {tile.type === 'chance' && (
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p>
                      <strong>Tactical Card Draw:</strong> Pull an instant tactical card that can alter fortunes in a single turn.
                    </p>
                    <p>
                      <strong>Potential Pulls:</strong> Stock dividend payouts (+₩150K), municipal grants (+₩100K), IRS audits, free tomato crates, or emergency supersonic travel passes.
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
            <span>Click any board tile in 3D to inspect its intelligence</span>
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
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

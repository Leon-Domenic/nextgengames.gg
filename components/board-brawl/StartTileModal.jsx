'use client';

import React, { useState } from 'react';
import { TILES, formatCash } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import CountryFlag from '@/components/board-brawl/CountryFlag';
import {
  Sparkles,
  Dice5,
  Hammer,
  Shield,
  ArrowRight,
  X,
  Building,
  Crown,
  ChevronDown,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { isTeammate } from '@/lib/board-brawl/engine';

export default function StartTileModal({
  properties = {},
  myPlayer,
  players = [],
  mode = '',
  turnTimer = 25,
  onExtraRoll,
  onUpgradeProperty,
  onBuyShield,
  onPass,
  onMinimize,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'upgrade_select'
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  if (!myPlayer) return null;

  // Filter all upgradable cities owned by player or teammate
  const eligibleCities = Object.keys(properties)
    .map((tId) => {
      const tile = TILES[tId];
      const prop = properties[tId];
      if (!tile || tile.type !== 'city' || !prop?.ownerId) return null;

      const isMine = prop.ownerId === myPlayer.id;
      const owner = players.find((p) => p.id === prop.ownerId);
      const isTeam = isTeammate(myPlayer, owner, players, mode);

      if (!isMine && !isTeam) return null;
      if (prop.isLandmark || prop.level >= 6) return null;

      const nextLevel = (prop.level || 1) + 1;
      // Orbit 1 lock: level 4+ requires laps >= 1
      if (nextLevel >= 4 && (myPlayer.laps || 0) < 1) return null;

      const cost = tile.housePrice || 100000;
      const canAfford = myPlayer.cash >= cost;

      return {
        tile,
        prop,
        tileId: parseInt(tId, 10),
        nextLevel,
        cost,
        canAfford,
        isMine,
        owner,
      };
    })
    .filter(Boolean);

  const handleRollAgain = () => {
    try {
      sounds.playDiceRoll?.();
    } catch (e) {}
    onExtraRoll?.();
  };

  const handleUpgrade = (tId) => {
    try {
      sounds.playHouseConstruct?.();
      sounds.playCash?.();
    } catch (e) {}
    onUpgradeProperty?.(tId);
  };

  const handleShield = () => {
    try {
      sounds.playShield?.();
      sounds.playCash?.();
    } catch (e) {}
    onBuyShield?.();
  };

  const handlePass = () => {
    try {
      sounds.playClick?.();
    } catch (e) {}
    onPass?.();
  };

  const getTierLabel = (lvl) => {
    if (lvl === 6) return { name: 'Landmark', icon: '👑', color: '#fbbf24' };
    if (lvl === 5) return { name: 'Hotel', icon: '🏨', color: '#f43f5e' };
    if (lvl === 4) return { name: '3 Houses', icon: '🏡🏡🏡', color: '#38bdf8' };
    if (lvl === 3) return { name: '2 Houses', icon: '🏡🏡', color: '#34d399' };
    if (lvl === 2) return { name: '1 House', icon: '🏡', color: '#a78bfa' };
    return { name: 'Plot', icon: '📍', color: '#94a3b8' };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 95,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.22s ease-out',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '560px',
          maxWidth: '94vw',
          maxHeight: '90vh',
          background: 'linear-gradient(155deg, #064e3b 0%, #022c22 45%, #0f172a 100%)',
          border: '2px solid #10b981',
          borderRadius: '26px',
          boxShadow: '0 0 55px rgba(16, 185, 129, 0.45), 0 25px 50px -12px rgba(0, 0, 0, 0.85)',
          padding: '26px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Minimize / Close Header Button */}
        {onMinimize && (
          <button
            onClick={onMinimize}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Minimize modal to view board"
          >
            <ChevronDown size={18} />
          </button>
        )}

        {/* Top Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '11px',
              letterSpacing: '1px',
              padding: '4px 12px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.6)',
            }}
          >
            <span>🚀</span> START LAUNCHPAD PRIVILEGE
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '4px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <Clock size={13} />
            <span>{turnTimer}s</span>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '2px 0 6px 0', color: '#f8fafc', letterSpacing: '-0.5px' }}>
          Landed on START! 🏁
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px 0', lineHeight: 1.4 }}>
          You collected your <strong style={{ color: '#34d399' }}>+200,000 Space Credits</strong> salary! Select your tactical Launchpad privilege for this turn:
        </p>

        {activeTab === 'overview' ? (
          /* Main 3 Actions Overview */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Action 1: One More Roll */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.5)',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                    color: '#ffffff',
                  }}
                >
                  <Dice5 size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                      One More Roll
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        background: '#10b981',
                        color: '#022c22',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      FREE BONUS
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Re-roll dice immediately and take another movement turn!
                  </div>
                </div>
              </div>

              <button
                onClick={handleRollAgain}
                style={{
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                  transition: 'transform 0.15s ease, filter 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              >
                <span>Roll Again</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Action 2: Remote Field Upgrade (+1 Level) */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)',
                border: '1.5px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
                    color: '#ffffff',
                  }}
                >
                  <Hammer size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                      Remote Field Upgrade (+1)
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      PAID BUILD
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Dispatch construction drones to upgrade ANY owned city by +1 level!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('upgrade_select')}
                disabled={eligibleCities.length === 0}
                style={{
                  background:
                    eligibleCities.length > 0
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                  color: eligibleCities.length > 0 ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: eligibleCities.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: eligibleCities.length > 0 ? '0 4px 14px rgba(217, 119, 6, 0.4)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => eligibleCities.length > 0 && (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={(e) => eligibleCities.length > 0 && (e.currentTarget.style.transform = 'scale(1.0)')}
              >
                <span>Select City ({eligibleCities.length})</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Action 3: Planetary Defense Shield */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)',
                border: '1.5px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                    color: '#ffffff',
                  }}
                >
                  <Shield size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                      Planetary Defense Shield
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#e9d5ff',
                        background: 'rgba(168, 85, 247, 0.25)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      ₩100K CR
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Deploy forcefield: completely absorbs the next rent toll or attack!
                  </div>
                </div>
              </div>

              <button
                onClick={handleShield}
                disabled={myPlayer.shieldActive || myPlayer.cash < 100000}
                style={{
                  background: myPlayer.shieldActive
                    ? 'rgba(168, 85, 247, 0.2)'
                    : myPlayer.cash >= 100000
                    ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: myPlayer.shieldActive ? '#c084fc' : myPlayer.cash >= 100000 ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: myPlayer.shieldActive || myPlayer.cash < 100000 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow:
                    !myPlayer.shieldActive && myPlayer.cash >= 100000 ? '0 4px 14px rgba(147, 51, 234, 0.4)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) =>
                  !myPlayer.shieldActive && myPlayer.cash >= 100000 && (e.currentTarget.style.transform = 'scale(1.04)')
                }
                onMouseLeave={(e) =>
                  !myPlayer.shieldActive && myPlayer.cash >= 100000 && (e.currentTarget.style.transform = 'scale(1.0)')
                }
              >
                <span>{myPlayer.shieldActive ? 'Already Shielded' : 'Equip (100K)'}</span>
                {!myPlayer.shieldActive && <Shield size={14} />}
              </button>
            </div>
          </div>
        ) : (
          /* Select City Sub-View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                ← Back to Privileges
              </button>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Your Cash: <strong style={{ color: '#34d399' }}>{formatCash(myPlayer.cash)} CR</strong>
              </span>
            </div>

            <div
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px',
              }}
            >
              {eligibleCities.map((item) => {
                const curTier = getTierLabel(item.prop.level || 1);
                const nextTier = getTierLabel(item.nextLevel);

                return (
                  <div
                    key={item.tileId}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CountryFlag country={item.tile.country} code={item.tile.flag} size={24} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc' }}>
                          {item.tile.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '2px' }}>
                          <span style={{ color: curTier.color }}>
                            {curTier.icon} {curTier.name}
                          </span>
                          <span style={{ color: '#64748b' }}>→</span>
                          <span style={{ color: nextTier.color, fontWeight: 700 }}>
                            {nextTier.icon} {nextTier.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: item.canAfford ? '#fbbf24' : '#ef4444' }}>
                          {formatCash(item.cost)} CR
                        </div>
                        {!item.canAfford && (
                          <div style={{ fontSize: '10px', color: '#ef4444' }}>Insufficient CR</div>
                        )}
                      </div>

                      <button
                        onClick={() => handleUpgrade(item.tileId)}
                        disabled={!item.canAfford}
                        style={{
                          background: item.canAfford
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'rgba(255, 255, 255, 0.1)',
                          color: item.canAfford ? '#ffffff' : '#64748b',
                          fontWeight: 800,
                          fontSize: '12px',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: item.canAfford ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: item.canAfford ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none',
                        }}
                      >
                        <Hammer size={12} />
                        <span>Build +1</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer: Pass Option */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Prefer to bank all 200,000 CR?
          </div>

          <button
            onClick={handlePass}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontWeight: 700,
              fontSize: '13px',
              padding: '8px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          >
            Pass & End Turn
          </button>
        </div>
      </div>
    </div>
  );
}

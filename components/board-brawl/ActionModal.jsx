'use client';

import React from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { Building2, Zap, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';

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
  const tile = TILES[currentTileId];
  if (!tile) return null;

  const prop = properties[currentTileId] || {};
  const isOwner = prop.ownerId === player?.id;
  const isRival = prop.ownerId && prop.ownerId !== player?.id;
  const rivalOwner = isRival ? players.find(p => p.id === prop.ownerId) : null;

  // Buyout math: 2x total invested value
  const totalVal = tile.price + (prop.level - 1) * tile.housePrice;
  const buyoutCost = totalVal * 2;
  const canBuyout = isRival && !prop.isLandmark && player?.cash >= buyoutCost;

  // Construction math
  const canBuyLand = !prop.ownerId && player?.cash >= tile.price;
  const canBuyWithHouse = !prop.ownerId && player?.cash >= (tile.price + tile.housePrice);
  const canUpgrade = isOwner && !prop.isLandmark && player?.cash >= tile.housePrice;

  return (
    <div style={{
      width: '100%',
      maxWidth: '440px',
      background: 'rgba(15, 23, 42, 0.94)',
      border: '2px solid rgba(56, 189, 248, 0.5)',
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.25)',
      borderRadius: '20px',
      padding: '24px',
      textAlign: 'center',
      backdropFilter: 'blur(16px)',
      color: '#f8fafc',
    }}>
      {/* City Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '28px' }}>{tile.flag || tile.icon}</span>
        <h3 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '0.5px' }}>
          {tile.name}
        </h3>
      </div>
      <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px 0', fontWeight: 600 }}>
        {tile.country ? `${tile.country} • ${tile.colorGroup?.toUpperCase()} DISTRICT` : tile.description}
      </p>

      {/* Case 1: Unowned City Purchase */}
      {!prop.ownerId && tile.type === 'city' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => { sounds.playBuild(); onBuy(tile.id, 1); }}
            disabled={!canBuyLand}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: canBuyLand ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: canBuyLand ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: canBuyLand ? '#38bdf8' : '#64748b',
              fontWeight: 800,
              fontSize: '14px',
              cursor: canBuyLand ? 'pointer' : 'not-allowed',
            }}
          >
            <span>Buy Land</span>
            <span>${tile.price}</span>
          </button>

          <button
            onClick={() => { sounds.playBuild(); onBuy(tile.id, 2); }}
            disabled={!canBuyWithHouse}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: canBuyWithHouse ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.25))' : 'rgba(255, 255, 255, 0.05)',
              border: canBuyWithHouse ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: canBuyWithHouse ? '#4ade80' : '#64748b',
              fontWeight: 800,
              fontSize: '14px',
              cursor: canBuyWithHouse ? 'pointer' : 'not-allowed',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} />
              <span>Buy + 1st House</span>
            </div>
            <span>${tile.price + tile.housePrice}</span>
          </button>
        </div>
      )}

      {/* Case 2: Owned by Player (Upgrade to 2/3 Houses or Hotel) */}
      {isOwner && tile.type === 'city' && !prop.isLandmark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>
            You own {tile.name}! Current Level: {prop.level >= 5 ? 'Luxury Hotel' : `${prop.level - 1} House(s)`}
          </div>

          <button
            onClick={() => { sounds.playBuild(); onUpgrade(tile.id); }}
            disabled={!canUpgrade}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: canUpgrade ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.25))' : 'rgba(255, 255, 255, 0.05)',
              border: canUpgrade ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: canUpgrade ? '#facc15' : '#64748b',
              fontWeight: 800,
              fontSize: '14px',
              cursor: canUpgrade ? 'pointer' : 'not-allowed',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} />
              <span>{prop.level >= 4 ? 'Upgrade to Luxury Hotel' : 'Build Next House'}</span>
            </div>
            <span>${tile.housePrice}</span>
          </button>
        </div>
      )}

      {/* Case 3: Owned by Rival (Sabotage 2x Buyout option) */}
      {isRival && tile.type === 'city' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '13px', color: '#f87171', fontWeight: 700 }}>
            Owned by {rivalOwner?.name || 'Rival'}! Rent paid.
          </div>

          {!prop.isLandmark && (
            <button
              onClick={() => { sounds.playBuyout(); onBuyout(tile.id); }}
              disabled={!canBuyout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: canBuyout ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.25))' : 'rgba(255, 255, 255, 0.05)',
                border: canBuyout ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: canBuyout ? '#f87171' : '#64748b',
                fontWeight: 800,
                fontSize: '14px',
                cursor: canBuyout ? 'pointer' : 'not-allowed',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} />
                <span>Hostile Buyout (2x)</span>
              </div>
              <span>${buyoutCost}</span>
            </button>
          )}
        </div>
      )}

      {/* Pass / End Turn Button */}
      <button
        onClick={onEndTurn}
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          color: '#e2e8f0',
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <span>Pass & End Turn</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
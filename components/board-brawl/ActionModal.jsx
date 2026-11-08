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
      background: 'rgba(16, 20, 29, 0.95)',
      border: '2px solid rgba(0, 240, 255, 0.4)',
      boxShadow: '0 0 30px rgba(0, 240, 255, 0.25)',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      backdropFilter: 'blur(12px)',
    }}>
      {/* City Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '24px' }}>{tile.flag || tile.icon}</span>
        <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: '#fff' }}>
          {tile.name}
        </h3>
      </div>
      <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
        {tile.country ? `${tile.country} • ${tile.colorGroup?.toUpperCase()} Group` : tile.description}
      </p>

      {/* Case 1: Unowned City Purchase */}
      {!prop.ownerId && tile.type === 'city' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => { sounds.playCash(); onBuy(tile.id, 1); }}
            disabled={!canBuyLand}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: canBuyLand ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: canBuyLand ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: canBuyLand ? '#00f0ff' : '#64748b',
              fontWeight: 800,
              fontSize: '13px',
              cursor: canBuyLand ? 'pointer' : 'not-allowed',
            }}
          >
            <span>🏗️ Buy Land Only</span>
            <span>${tile.price}</span>
          </button>

          <button
            onClick={() => { sounds.playCash(); onBuy(tile.id, 2); }}
            disabled={!canBuyWithHouse}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: canBuyWithHouse ? 'linear-gradient(135deg, #00f0ff, #0ea5e9)' : 'rgba(255, 255, 255, 0.05)',
              color: canBuyWithHouse ? '#060709' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '14px',
              cursor: canBuyWithHouse ? 'pointer' : 'not-allowed',
              boxShadow: canBuyWithHouse ? '0 0 15px rgba(0, 240, 255, 0.3)' : 'none',
            }}
          >
            <span>🏡 Buy Land + 1 House</span>
            <span>${tile.price + tile.housePrice}</span>
          </button>
        </div>
      )}

      {/* Case 2: Rival City - 2x Buyout Option */}
      {isRival && !prop.isLandmark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            background: 'rgba(255, 51, 68, 0.12)',
            border: '1px solid rgba(255, 51, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '13px',
            color: '#ff99aa',
          }}>
            Owned by <strong>{rivalOwner?.name}</strong>. You can execute a <strong>2x Buyout</strong> to steal it!
          </div>

          <button
            onClick={() => { sounds.playBuyout(); onBuyout(tile.id); }}
            disabled={!canBuyout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: canBuyout ? 'linear-gradient(135deg, #ff3344, #f97316)' : 'rgba(255, 255, 255, 0.05)',
              color: canBuyout ? '#fff' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '14px',
              cursor: canBuyout ? 'pointer' : 'not-allowed',
              boxShadow: canBuyout ? '0 0 20px rgba(255, 51, 68, 0.4)' : 'none',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} />
              BUY OUT & STEAL CITY (2x)
            </span>
            <span>${buyoutCost}</span>
          </button>
        </div>
      )}

      {/* Case 3: Own City - Upgrade Houses / Landmark */}
      {isOwner && !prop.isLandmark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => { sounds.playCash(); onUpgrade(tile.id); }}
            disabled={!canUpgrade}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: canUpgrade ? 'linear-gradient(135deg, #00ff88, #10b981)' : 'rgba(255, 255, 255, 0.05)',
              color: canUpgrade ? '#060709' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '14px',
              cursor: canUpgrade ? 'pointer' : 'not-allowed',
              boxShadow: canUpgrade ? '0 0 20px rgba(0, 255, 136, 0.3)' : 'none',
            }}
          >
            <span>
              {prop.level >= 4 ? '👑 Upgrade to LANDMARK (Permanent Immunity)' : `🏡 Upgrade to Level ${prop.level + 1}`}
            </span>
            <span>${tile.housePrice}</span>
          </button>
        </div>
      )}

      {/* Skip / End Turn Button */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onEndTurn}
          style={{
            padding: '10px 24px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Skip / End Turn ({turnTimer}s)
        </button>
      </div>
    </div>
  );
}

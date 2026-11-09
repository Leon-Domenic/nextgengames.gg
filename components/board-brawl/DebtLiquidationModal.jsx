'use client';

import React from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import CountryFlag from '@/components/board-brawl/CountryFlag';
import { AlertOctagon, Skull, DollarSign, Handshake, Building, ArrowRight, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

export default function DebtLiquidationModal({
  pendingDebt,
  myPlayer,
  creditor,
  properties = {},
  onDeclareBankruptcy,
  onSellProperty,
  onSettleDebt,
  onOpenTrade,
  players = [],
  turnTimer = 15,
}) {
  if (!pendingDebt || !myPlayer) return null;

  const debtAmount = pendingDebt.amount || 0;
  const currentCash = myPlayer.cash || 0;
  const shortfall = Math.max(0, debtAmount - currentCash);
  const canSettle = currentCash >= debtAmount;

  // Find all properties owned by myPlayer
  const ownedTiles = Object.keys(properties || {})
    .filter((tileId) => properties[tileId]?.ownerId === myPlayer.id)
    .map((tileId) => {
      const id = parseInt(tileId, 10);
      const tile = TILES[id] || {};
      const prop = properties[tileId] || {};
      const basePrice = tile.price || 0;
      const housePrice = tile.housePrice || Math.floor(basePrice * 0.5);
      const upgradeInvestment = prop.level > 1 ? (prop.level - 1) * housePrice : 0;
      const totalInvestment = basePrice + upgradeInvestment;
      const refund = Math.floor(totalInvestment * 0.70);

      let levelText = 'Land (Lvl 1)';
      if (prop.isLandmark) {
        levelText = 'Landmark (Lvl 5)';
      } else if (prop.level === 2) {
        levelText = '1 House (Lvl 2)';
      } else if (prop.level === 3) {
        levelText = '2 Houses (Lvl 3)';
      } else if (prop.level === 4) {
        levelText = '3 Houses (Lvl 4)';
      }

      return {
        id,
        tile,
        prop,
        basePrice,
        housePrice,
        totalInvestment,
        refund,
        levelText,
      };
    });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 3, 3, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 95,
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
          width: '540px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(155deg, #1c0606 0%, #120303 50%, #0a0101 100%)',
          border: '2px solid rgba(239, 68, 68, 0.8)',
          borderRadius: '24px',
          boxShadow: '0 0 50px rgba(239, 68, 68, 0.45), 0 25px 60px -10px rgba(0, 0, 0, 0.95)',
          padding: '24px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Top Header Badge & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '11px',
              letterSpacing: '0.12em',
              padding: '5px 14px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
            }}
          >
            <AlertOctagon size={14} />
            <span>EMERGENCY DEBT SETTLEMENT DESK</span>
          </div>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#fca5a5',
            }}
          >
            ⏱️ {turnTimer}s remaining
          </div>
        </div>

        {/* Narrative Banner */}
        <div style={{ textAlign: 'center', margin: '4px 0 0 0' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 900, color: '#fca5a5', letterSpacing: '-0.01em' }}>
            INSOLVENCY CRISIS
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
            You owe <span style={{ color: '#ef4444', fontWeight: 900 }}>{debtAmount.toLocaleString()} Space Credits</span> to{' '}
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>{creditor?.name || 'the Landlord'}</span>. Liquidate properties for 70% value, negotiate an emergency loan, or declare bankruptcy!
          </p>
        </div>

        {/* Financial Overview Card */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Debt</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444', marginTop: '2px' }}>
              {debtAmount.toLocaleString()} CR
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Available Cash</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#4ade80', marginTop: '2px' }}>
              {currentCash.toLocaleString()} CR
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Deficit</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: shortfall > 0 ? '#f87171' : '#4ade80', marginTop: '2px' }}>
              {shortfall > 0 ? `-${shortfall.toLocaleString()} CR` : 'COVERED!'}
            </div>
          </div>
        </div>

        {/* 1. PAY DEBT & CONTINUE BUTTON (Enabled when cash >= debt) */}
        {canSettle && (
          <button
            onClick={() => {
              sounds?.cash?.();
              onSettleDebt?.();
            }}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '15px',
              letterSpacing: '0.04em',
              border: '2px solid #86efac',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              animation: 'pulse 1.8s infinite',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <DollarSign size={20} />
            <span>💰 PAY DEBT & CONTINUE ({debtAmount.toLocaleString()} CR)</span>
          </button>
        )}

        {/* 2. LIQUIDATE PROPERTIES SECTION (70% Bank Value) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={14} />
              LIQUIDATE PROPERTIES (70% BANK VALUE)
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {ownedTiles.length} {ownedTiles.length === 1 ? 'City' : 'Cities'} Owned
            </span>
          </div>

          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
            }}
          >
            {ownedTiles.length === 0 ? (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                No properties owned to liquidate. Try negotiating an emergency loan below!
              </div>
            ) : (
              ownedTiles.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderLeft: `5px solid ${item.tile.color || '#3b82f6'}`,
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '14px' }}>
                      {item.tile.country ? (
                        <CountryFlag country={item.tile.country} code={item.tile.flag} width={20} height={14} />
                      ) : (
                        <span>{item.tile.flag || '🏙️'}</span>
                      )}
                      <span>{item.tile.name || `Tile #${item.id}`}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#cbd5e1' }}>{item.levelText}</span>
                      <span>•</span>
                      <span>Cost: {item.totalInvestment.toLocaleString()} CR</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sounds?.cash?.();
                      onSellProperty?.(item.id);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontWeight: 800,
                      fontSize: '12px',
                      letterSpacing: '0.02em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                      transition: 'transform 0.1s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <span>Sell 70%</span>
                    <span style={{ color: '#fef08a', fontWeight: 900 }}>+{item.refund.toLocaleString()} CR</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. EMERGENCY NEGOTIATION / TRADE SECTION */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Handshake size={14} />
              EMERGENCY PLAYER NEGOTIATION
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Trade cards, property rights, or borrow funds from rivals to stay alive!
            </span>
          </div>

          <button
            onClick={() => {
              sounds?.click?.();
              onOpenTrade?.();
            }}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              borderRadius: '10px',
              padding: '10px 16px',
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 12px rgba(2, 132, 199, 0.4)',
              transition: 'transform 0.1s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>🤝 Propose Trade / Loan</span>
          </button>
        </div>

        {/* 4. SURRENDER & DECLARE BANKRUPTCY */}
        <button
          onClick={() => {
            sounds?.bell?.();
            onDeclareBankruptcy?.();
          }}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '14px',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.1s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Skull size={17} />
          <span>💀 SURRENDER & DECLARE BANKRUPTCY</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { AlertOctagon, Skull, ArrowRight, DollarSign, Home } from 'lucide-react';

export default function DebtLiquidationModal({
  pendingDebt,
  myPlayer,
  creditor,
  properties = {},
  onDeclareBankruptcy,
  turnTimer = 15,
}) {
  if (!pendingDebt || !myPlayer) return null;

  const debtAmount = pendingDebt.amount || 0;
  const shortfall = Math.max(0, debtAmount - (myPlayer.cash || 0));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 3, 3, 0.85)',
        backdropFilter: 'blur(10px)',
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
          width: '420px',
          maxWidth: '92vw',
          background: 'linear-gradient(145deg, #2a0808 0%, #150303 100%)',
          border: '2px solid #ef4444',
          borderRadius: '24px',
          boxShadow: '0 0 50px rgba(239, 68, 68, 0.5), 0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          padding: '24px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '11px',
            letterSpacing: '0.12em',
            padding: '4px 16px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
          }}
        >
          <AlertOctagon size={14} />
          <span>DEBT LIQUIDATION OBLIGATION ({turnTimer}s)</span>
        </div>

        {/* Skull Icon */}
        <div
          style={{
            marginTop: '16px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(0,0,0,0.6) 80%)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
          }}
        >
          💀
        </div>

        <h2 style={{ margin: '12px 0 6px 0', fontSize: '22px', fontWeight: 900, color: '#fca5a5' }}>
          INSOLVENCY WARNING
        </h2>

        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
          You owe rent of <span style={{ color: '#ef4444', fontWeight: 900 }}>{debtAmount.toLocaleString()} Space Credits</span> to{' '}
          <span style={{ color: '#38bdf8', fontWeight: 800 }}>{creditor?.name || 'Landlord'}</span>. Your available balance is insufficient!
        </p>

        {/* Summary Card */}
        <div
          style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#94a3b8' }}>Total Rent Owed:</span>
            <span style={{ color: '#ef4444', fontWeight: 900 }}>{debtAmount.toLocaleString()} CR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#94a3b8' }}>Available Space Credits:</span>
            <span style={{ color: '#a3e635', fontWeight: 900 }}>{myPlayer.cash || 0} CR</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ color: '#cbd5e1', fontWeight: 700 }}>Uncovered Deficit:</span>
            <span style={{ color: '#f87171', fontWeight: 900 }}>-{shortfall.toLocaleString()} CR</span>
          </div>
        </div>

        {/* Bankruptcy Surrender Button */}
        <button
          onClick={() => onDeclareBankruptcy?.()}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '15px',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(239, 68, 68, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.1s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Skull size={18} />
          <span>SURRENDER & DECLARE BANKRUPTCY</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { TILES } from '@/lib/board-brawl/types.js';
import { CHARACTERS } from '@/lib/board-brawl/characters.js';
import { Handshake, X, ArrowRight, Clock } from 'lucide-react';
import { sounds } from '@/lib/audio';

export default function TradeNotificationToast({
  activeTrade,
  myPlayerId,
  players = [],
  onOpenTradeDesk,
  onDecline,
}) {
  const isIncomingForMe = Boolean(
    activeTrade &&
    activeTrade.targetId === myPlayerId &&
    (activeTrade.status === 'pending' || activeTrade.status === 'countered')
  );

  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!isIncomingForMe || !activeTrade?.expiresAt) return;
    try {
      sounds.playBuy();
    } catch (e) {}

    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((activeTrade.expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
    }, 500);

    return () => clearInterval(interval);
  }, [isIncomingForMe, activeTrade?.expiresAt]);

  if (!isIncomingForMe || !activeTrade) return null;

  const proposer = players.find(p => p.id === activeTrade.proposerId);
  const proposerChar = CHARACTERS.find(c => c.id === proposer?.avatarToken) || CHARACTERS[0];

  const off = activeTrade.offer || {};

  // Build brief summary
  const pGives = [];
  if (off.proposerTileIds?.length) {
    pGives.push(off.proposerTileIds.map(tid => TILES[tid]?.name || `#${tid}`).join(', '));
  }
  if (off.proposerCardIds?.length) {
    pGives.push(`${off.proposerCardIds.length} Card(s)`);
  }
  if (off.proposerCash > 0) {
    pGives.push(`${(off.proposerCash / 1000).toFixed(0)}k CR`);
  }
  if (off.loan && off.loan.principal > 0) {
    pGives.push(`Loan: ${(off.loan.principal / 1000).toFixed(0)}k`);
  }

  const tGives = [];
  if (off.targetTileIds?.length) {
    tGives.push(off.targetTileIds.map(tid => TILES[tid]?.name || `#${tid}`).join(', '));
  }
  if (off.targetCardIds?.length) {
    tGives.push(`${off.targetCardIds.length} Card(s)`);
  }
  if (off.targetCash > 0) {
    tGives.push(`${(off.targetCash / 1000).toFixed(0)}k CR`);
  }

  const offeredText = pGives.length > 0 ? pGives.join(' + ') : 'Cash/Terms';
  const requestedText = tGives.length > 0 ? tGives.join(' + ') : 'Cash/Terms';

  return (
    <div style={{
      position: 'fixed',
      top: '18px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 95,
      animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      maxWidth: '560px',
      width: 'calc(100vw - 32px)',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.98) 100%)',
      border: '2px solid #f59e0b',
      borderRadius: '16px',
      boxShadow: '0 0 30px rgba(245, 158, 11, 0.4), 0 10px 25px rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(16px)',
      overflow: 'hidden',
    }}>
      {/* 30s Countdown Progress Line */}
      <div style={{
        height: '3px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, (secondsLeft / 30) * 100))}%`,
          background: secondsLeft <= 5 ? '#ef4444' : '#f59e0b',
          transition: 'width 0.5s linear, background-color 0.3s',
        }} />
      </div>

      <div style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Proposer Info & Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: proposer?.avatarColor || '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            {proposerChar?.icon || '🎩'}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>
                {proposer?.name || 'Rival Tycoon'}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#fbbf24',
                padding: '1px 5px',
                borderRadius: '4px',
              }}>
                TRADE OFFER
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Clock size={12} />
                {secondsLeft}s
              </span>
            </div>

            <div style={{
              fontSize: '11px',
              color: '#cbd5e1',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '1px',
            }}>
              <span style={{ color: '#00f0ff', fontWeight: 700 }}>Offered:</span> {offeredText}
              <span style={{ margin: '0 4px', color: '#64748b' }}>➔</span>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>For:</span> {requestedText}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => onDecline(activeTrade.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <X size={14} />
            Decline
          </button>

          <button
            onClick={onOpenTradeDesk}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: '1px solid #fef08a',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)',
            }}
          >
            <Handshake size={14} />
            Open Desk
          </button>
        </div>
      </div>
    </div>
  );
}

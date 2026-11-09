'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TILES } from '@/lib/board-brawl/types.js';
import { CHARACTERS } from '@/lib/board-brawl/characters.js';
import { sounds } from '@/lib/audio';
import {
  Handshake,
  CheckCircle2,
  XCircle,
  Building,
  Palmtree,
  Zap,
  DollarSign,
  ArrowRight,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

const BANNER_DISPLAY_MS = 4000;

export default function ActionBannerOverlay({
  paymentEvent,
  tradeAction,
  players = [],
  properties = {},
  currentUserId,
  onOpenTradeDesk,
}) {
  const [currentBanner, setCurrentBanner] = useState(null);
  const queueRef = useRef([]);
  const isDisplayingRef = useRef(false);
  const dismissTimerRef = useRef(null);
  const lastPaymentEventIdRef = useRef('');
  const lastTradeActionIdRef = useRef('');

  // Helper to resolve player info
  const getPlayer = (id) => {
    if (!id) return null;
    const p = players.find((x) => String(x.id) === String(id));
    if (!p) return { name: 'Bank / Pot', avatarToken: 'robot', icon: '🏦', color: '#94a3b8' };
    const char = CHARACTERS.find((c) => c.id === p.avatarToken) || { icon: '👤' };
    return {
      id: p.id,
      name: p.name || 'Player',
      icon: char.icon || '👤',
      color: p.avatarColor || '#38bdf8',
    };
  };

  // Helper to show next in queue
  const showNextBanner = () => {
    if (queueRef.current.length === 0) {
      setCurrentBanner(null);
      isDisplayingRef.current = false;
      return;
    }

    isDisplayingRef.current = true;
    const nextBanner = queueRef.current.shift();
    setCurrentBanner(nextBanner);

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      showNextBanner();
    }, BANNER_DISPLAY_MS);
  };

  const enqueueBanner = (bannerItem) => {
    queueRef.current.push(bannerItem);
    if (!isDisplayingRef.current) {
      showNextBanner();
    }
  };

  // Immediate full dismissal when user clicks close (X)
  const dismissBanner = (e) => {
    if (e) e.stopPropagation();
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    queueRef.current = [];
    isDisplayingRef.current = false;
    setCurrentBanner(null);
  };

  // 1. Process incoming payment events (Rent, Resort Rent, Tax, Buyout)
  useEffect(() => {
    if (!paymentEvent || !paymentEvent.id || paymentEvent.id === lastPaymentEventIdRef.current) return;
    lastPaymentEventIdRef.current = paymentEvent.id;

    const { payerId, receiverId, amount, type, tileId } = paymentEvent;
    const payer = getPlayer(payerId);
    const receiver = getPlayer(receiverId);
    const tile = tileId != null ? (TILES[tileId] || {}) : null;
    const prop = tileId != null ? (properties[tileId] || {}) : {};

    let banner = null;

    if (type === 'rent' || type === 'resort_rent') {
      const isResort = type === 'resort_rent';
      banner = {
        id: paymentEvent.id,
        category: 'rent',
        type,
        icon: isResort ? <Palmtree size={22} className="text-cyan-400" /> : <Building size={22} className="text-rose-400" />,
        badgeText: isResort ? 'RESORT RENT' : 'CITY RENT',
        badgeBg: isResort ? 'rgba(6, 182, 212, 0.2)' : 'rgba(244, 63, 94, 0.2)',
        badgeBorder: isResort ? '#06b6d4' : '#f43f5e',
        badgeColor: isResort ? '#67e8f9' : '#fda4af',
        title: isResort ? 'Resort Rent Paid!' : 'City Rent Paid!',
        payer,
        receiver,
        amount: amount || 0,
        tileName: tile?.name || (isResort ? 'Resort' : 'City'),
        tileFlag: tile?.flag || '',
        propLevel: prop.level || 1,
        isLandmark: !!prop.isLandmark,
        borderGlow: isResort ? 'rgba(6, 182, 212, 0.6)' : 'rgba(239, 68, 68, 0.6)',
      };

      try {
        if (currentUserId && receiverId === currentUserId) {
          sounds.playCash?.();
        } else if (currentUserId && payerId === currentUserId) {
          sounds.playDistress?.(payer?.avatarToken);
        } else {
          sounds.playCash?.();
        }
      } catch (e) {}
    } else if (type === 'buyout') {
      banner = {
        id: paymentEvent.id,
        category: 'buyout',
        type,
        icon: <Zap size={22} className="text-amber-400 animate-pulse" />,
        badgeText: 'HOSTILE BUYOUT',
        badgeBg: 'rgba(245, 158, 11, 0.2)',
        badgeBorder: '#f59e0b',
        badgeColor: '#fde047',
        title: 'Hostile Takeover!',
        payer,
        receiver,
        amount: amount || 0,
        tileName: tile?.name || 'Property',
        tileFlag: tile?.flag || '',
        propLevel: prop.level || 1,
        borderGlow: 'rgba(245, 158, 11, 0.7)',
      };
      try { sounds.playCash?.(); } catch (e) {}
    } else if (type === 'tax') {
      banner = {
        id: paymentEvent.id,
        category: 'tax',
        type,
        icon: <DollarSign size={22} className="text-emerald-400" />,
        badgeText: 'MUNICIPAL TAX',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
        badgeBorder: '#10b981',
        badgeColor: '#6ee7b7',
        title: 'Municipal Development Tax',
        payer,
        receiver: { name: 'Community Pot', icon: '💰', color: '#10b981' },
        amount: amount || 0,
        tileName: tile?.name || 'City Tax',
        tileFlag: '🏛️',
        borderGlow: 'rgba(16, 185, 129, 0.6)',
      };
    }

    if (banner) {
      enqueueBanner(banner);
    }
  }, [paymentEvent, currentUserId, players, properties]);

  // 2. Process incoming trade events (Deal Proposed, Deal Accepted, Deal Declined)
  useEffect(() => {
    const tradeEventId = tradeAction ? `${tradeAction.type}_${tradeAction.trade?.id || tradeAction.trade?.tradeId || ''}_${tradeAction.timestamp || ''}` : '';
    if (!tradeAction || !tradeEventId || tradeEventId === lastTradeActionIdRef.current) return;
    lastTradeActionIdRef.current = tradeEventId;

    const { type, trade } = tradeAction;
    if (!trade) return;

    const proposer = getPlayer(trade.proposerId);
    const target = getPlayer(trade.targetId);

    let banner = null;

    if (type === 'proposed' || type === 'countered') {
      const isCounter = type === 'countered';
      const isForMe = currentUserId && String(trade.targetId) === String(currentUserId);

      // Extract brief summary of offer
      const off = trade.offer || {};
      const offerParts = [];
      if (off.proposerCash > 0) offerParts.push(`${(off.proposerCash / 1000).toLocaleString()}k CR`);
      if (off.proposerTileIds?.length) {
        offerParts.push(off.proposerTileIds.map((tid) => TILES[tid]?.name || `#${tid}`).join(', '));
      }
      const reqParts = [];
      if (off.targetCash > 0) reqParts.push(`${(off.targetCash / 1000).toLocaleString()}k CR`);
      if (off.targetTileIds?.length) {
        reqParts.push(off.targetTileIds.map((tid) => TILES[tid]?.name || `#${tid}`).join(', '));
      }

      banner = {
        id: `trade_${trade.id || Date.now()}`,
        category: 'trade_proposal',
        icon: <Handshake size={22} className="text-sky-400" />,
        badgeText: isCounter ? 'TRADE COUNTER-OFFER' : 'TRADE DEAL PROPOSED',
        badgeBg: isCounter ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
        badgeBorder: isCounter ? '#a855f7' : '#38bdf8',
        badgeColor: isCounter ? '#d8b4fe' : '#7dd3fc',
        title: isCounter ? 'Counter-Offer Dispatched!' : 'Trade Deal Proposed!',
        payer: proposer,
        receiver: target,
        offerSummary: offerParts.join(' + ') || 'Terms',
        requestSummary: reqParts.join(' + ') || 'Terms',
        isForMe,
        trade,
        borderGlow: isCounter ? 'rgba(168, 85, 247, 0.7)' : 'rgba(56, 189, 248, 0.7)',
      };

      try {
        if (isForMe) {
          sounds.playNotification?.();
        } else {
          sounds.playCardDraw?.();
        }
      } catch (e) {}
    } else if (type === 'accepted') {
      // Extract what proposer gave and target gave from trade.offer if available
      const off = trade.offer || {};
      const pGives = [];
      if (off.proposerCash > 0) pGives.push(`${(off.proposerCash / 1000).toLocaleString()}k CR`);
      if (off.proposerTileIds?.length) {
        pGives.push(off.proposerTileIds.map((tid) => TILES[tid]?.name || `#${tid}`).join(', '));
      }
      if (off.proposerCardIds?.length) {
        pGives.push(`${off.proposerCardIds.length} Card(s)`);
      }
      const tGives = [];
      if (off.targetCash > 0) tGives.push(`${(off.targetCash / 1000).toLocaleString()}k CR`);
      if (off.targetTileIds?.length) {
        tGives.push(off.targetTileIds.map((tid) => TILES[tid]?.name || `#${tid}`).join(', '));
      }
      if (off.targetCardIds?.length) {
        tGives.push(`${off.targetCardIds.length} Card(s)`);
      }

      banner = {
        id: `trade_acc_${trade.tradeId || trade.id || Date.now()}`,
        category: 'trade_accepted',
        icon: <CheckCircle2 size={22} className="text-emerald-400" />,
        badgeText: 'DEAL STRUCK & ACCEPTED',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
        badgeBorder: '#10b981',
        badgeColor: '#6ee7b7',
        title: 'Trade Deal Finalized!',
        payer: proposer,
        receiver: target,
        proposerGives: pGives.join(' + ') || null,
        targetGives: tGives.join(' + ') || null,
        summary: trade.summary || 'Assets and Capital Exchanged',
        borderGlow: 'rgba(16, 185, 129, 0.8)',
      };
      try { sounds.playDealStruck?.(); } catch (e) {}
    } else if (type === 'declined') {
      banner = {
        id: `trade_dec_${trade.tradeId || trade.id || Date.now()}`,
        category: 'trade_declined',
        icon: <XCircle size={22} className="text-rose-400" />,
        badgeText: 'DEAL DECLINED',
        badgeBg: 'rgba(239, 68, 68, 0.2)',
        badgeBorder: '#ef4444',
        badgeColor: '#fca5a5',
        title: 'Trade Deal Declined',
        payer: proposer,
        receiver: target,
        summary: trade.reason === 'cancelled' ? 'Trade offer was withdrawn' : 'The trade terms were rejected',
        borderGlow: 'rgba(239, 68, 68, 0.5)',
      };
    }

    if (banner) {
      enqueueBanner(banner);
    }
  }, [tradeAction, currentUserId, players]);

  if (!currentBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '82px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 85,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none', // Lets clicks pass around the banner
        animation: 'actionBannerDrop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        maxWidth: '92vw',
      }}
    >
      <style>{`
        @keyframes actionBannerDrop {
          0% {
            opacity: 0;
            transform: translate(-50%, -24px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.0);
          }
        }
      `}</style>

      <div
        onClick={() => {
          if (currentBanner.isForMe && onOpenTradeDesk) {
            onOpenTradeDesk(currentBanner.trade);
          }
        }}
        style={{
          pointerEvents: 'auto', // Banner box and its X button ALWAYS receive clicks!
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 24px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(11, 19, 36, 0.96) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(16px)',
          border: `2px solid ${currentBanner.badgeBorder}`,
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.65), 0 0 35px ${currentBanner.borderGlow}`,
          color: '#ffffff',
          minWidth: '320px',
          maxWidth: '580px',
          cursor: currentBanner.isForMe ? 'pointer' : 'default',
        }}
      >
        {/* Top Header Pill & Category */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 12px',
              borderRadius: '999px',
              background: currentBanner.badgeBg,
              border: `1px solid ${currentBanner.badgeBorder}`,
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: currentBanner.badgeColor,
              textTransform: 'uppercase',
            }}
          >
            {currentBanner.icon}
            <span>{currentBanner.badgeText}</span>
          </div>

          <button
            onClick={dismissBanner}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#94a3b8';
            }}
            title="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body: Rent Paid */}
        {currentBanner.category === 'rent' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginTop: '4px' }}>
            {/* Payer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ fontSize: '20px' }}>{currentBanner.payer?.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.payer?.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {currentBanner.payer?.name}
                </div>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>
                  -{currentBanner.amount.toLocaleString()} CR
                </div>
              </div>
            </div>

            {/* Transfer Indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#cbd5e1', fontWeight: 800 }}>
                <span>{currentBanner.tileFlag}</span>
                <span>{currentBanner.tileName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Receiver */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right', minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.receiver?.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {currentBanner.receiver?.name}
                </div>
                <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>
                  +{currentBanner.amount.toLocaleString()} CR
                </div>
              </div>
              <span style={{ fontSize: '20px' }}>{currentBanner.receiver?.icon}</span>
            </div>
          </div>
        )}

        {/* Content Body: Hostile Buyout */}
        {currentBanner.category === 'buyout' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{currentBanner.payer?.icon}</span>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.payer?.color }}>
                  {currentBanner.payer?.name}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>
                  bought {currentBanner.tileFlag} {currentBanner.tileName} from
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.receiver?.color }}>
                {currentBanner.receiver?.name}
              </span>
              <span style={{ fontSize: '18px' }}>{currentBanner.receiver?.icon}</span>
            </div>
          </div>
        )}

        {/* Content Body: Municipal Tax */}
        {currentBanner.category === 'tax' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{currentBanner.payer?.icon}</span>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.payer?.color }}>
                  {currentBanner.payer?.name}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>
                  contributed {currentBanner.amount.toLocaleString()} CR tax
                </span>
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>
              ➔ Community Pot
            </div>
          </div>
        )}

        {/* Content Body: Trade Deal Proposed */}
        {currentBanner.category === 'trade_proposal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>{currentBanner.payer?.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.payer?.color }}>
                  {currentBanner.payer?.name}
                </span>
              </div>
              <ArrowRight size={14} className="text-sky-400" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.receiver?.color }}>
                  {currentBanner.receiver?.name}
                </span>
                <span style={{ fontSize: '18px' }}>{currentBanner.receiver?.icon}</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', gap: '12px', background: 'rgba(255, 255, 255, 0.04)', padding: '5px 10px', borderRadius: '8px' }}>
              <div><strong style={{ color: '#38bdf8' }}>Offering:</strong> {currentBanner.offerSummary}</div>
              <div><strong style={{ color: '#f59e0b' }}>Requesting:</strong> {currentBanner.requestSummary}</div>
            </div>

            {currentBanner.isForMe && (
              <div style={{ marginTop: '2px', textAlign: 'center', fontSize: '11px', fontWeight: 900, color: '#facc15', letterSpacing: '0.04em', background: 'rgba(234, 179, 8, 0.15)', padding: '4px 8px', borderRadius: '6px', border: '1px solid #eab308' }}>
                ⚡ PROPOSAL FOR YOU! CLICK HERE TO OPEN TRADE DESK
              </div>
            )}
          </div>
        )}

        {/* Content Body: Trade Accepted */}
        {currentBanner.category === 'trade_accepted' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {/* Players involved */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              {/* Proposer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '22px' }}>{currentBanner.payer?.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: currentBanner.payer?.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {currentBanner.payer?.name}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                      PROPOSER
                    </span>
                  </div>
                  {currentBanner.proposerGives && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      Gave: <span style={{ color: '#f8fafc' }}>{currentBanner.proposerGives}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Handshake Center Badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 900, color: '#34d399', letterSpacing: '0.05em' }}>
                  <Handshake size={18} />
                  <span>DEAL STRUCK</span>
                </div>
              </div>

              {/* Acceptor / Partner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, justifyContent: 'flex-end', textAlign: 'right' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                      ACCEPTED BY
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: currentBanner.receiver?.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {currentBanner.receiver?.name}
                    </span>
                  </div>
                  {currentBanner.targetGives && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      Gave: <span style={{ color: '#f8fafc' }}>{currentBanner.targetGives}</span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '22px' }}>{currentBanner.receiver?.icon}</span>
              </div>
            </div>

            {/* Terms Summary Pill */}
            {currentBanner.summary && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                {currentBanner.summary}
              </div>
            )}
          </div>
        )}

        {/* Content Body: Trade Declined */}
        {currentBanner.category === 'trade_declined' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>{currentBanner.payer?.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.payer?.color }}>
                {currentBanner.payer?.name}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 700 }}>
              {currentBanner.summary}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: currentBanner.receiver?.color }}>
                {currentBanner.receiver?.name}
              </span>
              <span style={{ fontSize: '18px' }}>{currentBanner.receiver?.icon}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

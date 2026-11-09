'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TILES, COLOR_GROUPS } from '@/lib/board-brawl/types.js';
import { CHARACTERS } from '@/lib/board-brawl/characters.js';
import { CARD_RARITY } from '@/lib/board-brawl/cards.js';
import CountryFlag from '@/components/board-brawl/CountryFlag';
import { sounds } from '@/lib/audio';
import {
  X, Check, Handshake, ArrowRightLeft, ShieldAlert, Sparkles, Clock, AlertTriangle, Coins, FileText, ChevronDown, ChevronUp
} from 'lucide-react';

export default function TradeModal({
  isOpen,
  onClose,
  myPlayer,
  targetPlayer,
  gameState,
  onProposeTrade,
  onCounterTrade,
  onRespondTrade,
  onCancelTrade,
}) {
  const activeTrade = gameState?.activeTrade;
  const isTradeActive = Boolean(activeTrade && (activeTrade.status === 'pending' || activeTrade.status === 'countered'));
  const isIncomingForMe = isTradeActive && activeTrade?.targetId === myPlayer?.id;
  const isSentByMe = isTradeActive && activeTrade?.proposerId === myPlayer?.id;

  // Mode: 'view' (inspecting incoming/active trade) vs 'edit' (composing trade or counter)
  const [isCounterEditing, setIsCounterEditing] = useState(false);

  // Proposal Basket State (from my perspective)
  const [giveTileIds, setGiveTileIds] = useState([]);
  const [giveCardIds, setGiveCardIds] = useState([]);
  const [giveCash, setGiveCash] = useState(0);

  const [reqTileIds, setReqTileIds] = useState([]);
  const [reqCardIds, setReqCardIds] = useState([]);
  const [reqCash, setReqCash] = useState(0);

  // Loan State
  const [loanEnabled, setLoanEnabled] = useState(false);
  const [loanDirection, setLoanDirection] = useState('lend'); // 'lend' (I lend to rival) | 'borrow' (I borrow from rival)
  const [loanPrincipal, setLoanPrincipal] = useState(200000);
  const [loanInterestRate, setLoanInterestRate] = useState(0.2); // 0, 0.1, 0.2
  const [loanRounds, setLoanRounds] = useState(2); // 2 or 3 rounds
  const [loanCollateralTileId, setLoanCollateralTileId] = useState(null);

  // 30-Second Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  useEffect(() => {
    if (!isTradeActive || !activeTrade?.expiresAt) {
      setSecondsRemaining(30);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((activeTrade.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(left);
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [isTradeActive, activeTrade?.expiresAt]);

  // When active trade changes, populate preview or counter state
  useEffect(() => {
    if (isTradeActive && activeTrade) {
      const isTarget = activeTrade.targetId === myPlayer?.id;
      const off = activeTrade.offer || {};

      if (isTarget) {
        // From target's perspective: proposer gave proposerTileIds, requested targetTileIds
        setGiveTileIds(off.targetTileIds || []);
        setGiveCardIds(off.targetCardIds || []);
        setGiveCash(off.targetCash || 0);

        setReqTileIds(off.proposerTileIds || []);
        setReqCardIds(off.proposerCardIds || []);
        setReqCash(off.proposerCash || 0);

        if (off.loan) {
          setLoanEnabled(true);
          setLoanDirection(off.loan.borrowerId === myPlayer?.id ? 'borrow' : 'lend');
          setLoanPrincipal(off.loan.principal || 200000);
          setLoanInterestRate(off.loan.interestRate || 0.2);
          setLoanRounds(off.loan.roundsRemaining || 2);
          setLoanCollateralTileId(off.loan.collateralTileId ?? null);
        } else {
          setLoanEnabled(false);
        }
      } else {
        // Proposer's perspective
        setGiveTileIds(off.proposerTileIds || []);
        setGiveCardIds(off.proposerCardIds || []);
        setGiveCash(off.proposerCash || 0);

        setReqTileIds(off.targetTileIds || []);
        setReqCardIds(off.targetCardIds || []);
        setReqCash(off.targetCash || 0);

        if (off.loan) {
          setLoanEnabled(true);
          setLoanDirection(off.loan.creditorId === myPlayer?.id ? 'lend' : 'borrow');
          setLoanPrincipal(off.loan.principal || 200000);
          setLoanInterestRate(off.loan.interestRate || 0.2);
          setLoanRounds(off.loan.roundsRemaining || 2);
          setLoanCollateralTileId(off.loan.collateralTileId ?? null);
        } else {
          setLoanEnabled(false);
        }
      }
    } else {
      // Reset basket for a fresh proposal
      setGiveTileIds([]);
      setGiveCardIds([]);
      setGiveCash(0);
      setReqTileIds([]);
      setReqCardIds([]);
      setReqCash(0);
      setLoanEnabled(false);
      setIsCounterEditing(false);
    }
  }, [isTradeActive, activeTrade, myPlayer?.id]);

  if (!isOpen || !myPlayer || !targetPlayer) return null;

  // Resolve properties owned by each player
  const myProperties = Object.keys(gameState.properties || {})
    .filter(tid => gameState.properties[tid]?.ownerId === myPlayer.id)
    .map(tid => ({ ...TILES[tid], prop: gameState.properties[tid] }));

  const targetProperties = Object.keys(gameState.properties || {})
    .filter(tid => gameState.properties[tid]?.ownerId === targetPlayer.id)
    .map(tid => ({ ...TILES[tid], prop: gameState.properties[tid] }));

  // Hand Action Cards
  const myCards = myPlayer.cards || [];
  const targetCards = targetPlayer.cards || [];

  // Characters
  const myChar = CHARACTERS.find(c => c.id === myPlayer.avatarToken) || CHARACTERS[0];
  const targetChar = CHARACTERS.find(c => c.id === targetPlayer.avatarToken) || CHARACTERS[0];

  // Helper toggle selections
  const toggleGiveTile = (tid) => {
    if (isSentByMe && !isCounterEditing) return;
    setGiveTileIds(prev => prev.includes(tid) ? prev.filter(id => id !== tid) : [...prev, tid]);
  };

  const toggleReqTile = (tid) => {
    if (isSentByMe && !isCounterEditing) return;
    setReqTileIds(prev => prev.includes(tid) ? prev.filter(id => id !== tid) : [...prev, tid]);
  };

  const toggleGiveCard = (cid) => {
    if (isSentByMe && !isCounterEditing) return;
    setGiveCardIds(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);
  };

  const toggleReqCard = (cid) => {
    if (isSentByMe && !isCounterEditing) return;
    setReqCardIds(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);
  };

  // Build the trade offer payload
  const buildOfferPayload = () => {
    let loanObj = null;
    if (loanEnabled && loanPrincipal > 0) {
      const borrowerId = loanDirection === 'borrow' ? myPlayer.id : targetPlayer.id;
      const creditorId = loanDirection === 'lend' ? myPlayer.id : targetPlayer.id;
      const totalRepayment = Math.round(loanPrincipal * (1 + loanInterestRate));
      const perRoundPayment = Math.round(totalRepayment / loanRounds);

      loanObj = {
        type: loanDirection,
        borrowerId,
        creditorId,
        principal: loanPrincipal,
        interestRate: loanInterestRate,
        totalRepayment,
        roundsRemaining: loanRounds,
        perRoundPayment,
        collateralTileId: loanCollateralTileId,
      };
    }

    return {
      proposerTileIds: giveTileIds,
      proposerCardIds: giveCardIds,
      proposerCash: giveCash,
      targetTileIds: reqTileIds,
      targetCardIds: reqCardIds,
      targetCash: reqCash,
      loan: loanObj,
    };
  };

  // Validation
  const myMaxCash = myPlayer.cash || 0;
  const targetMaxCash = targetPlayer.cash || 0;

  const myAfterCardCount = myCards.length - giveCardIds.length + reqCardIds.length;
  const targetAfterCardCount = targetCards.length - reqCardIds.length + giveCardIds.length;
  const handLimitExceeded = myAfterCardCount > 3 || targetAfterCardCount > 3;

  const hasAnyTradeItem = giveTileIds.length > 0 ||
    giveCardIds.length > 0 ||
    giveCash > 0 ||
    reqTileIds.length > 0 ||
    reqCardIds.length > 0 ||
    reqCash > 0 ||
    (loanEnabled && loanPrincipal > 0);

  const canSubmitProposal = hasAnyTradeItem && !handLimitExceeded;

  // Actions
  const handleSendProposal = () => {
    if (!canSubmitProposal) return;
    sounds.playBuy();
    const offer = buildOfferPayload();
    onProposeTrade({
      proposerId: myPlayer.id,
      targetId: targetPlayer.id,
      offer,
    });
  };

  const handleSendCounter = () => {
    if (!canSubmitProposal || !activeTrade) return;
    sounds.playBuy();
    const offer = buildOfferPayload();
    onCounterTrade(activeTrade.id, offer);
    setIsCounterEditing(false);
  };

  const handleAcceptDeal = () => {
    if (!activeTrade) return;
    try {
      sounds.playDealStruck?.();
    } catch (e) {}
    onRespondTrade(activeTrade.id, 'accept');
    onClose();
  };

  const handleDeclineDeal = () => {
    if (!activeTrade) return;
    sounds.playBuy();
    onRespondTrade(activeTrade.id, 'decline');
    onClose();
  };

  const handleCancelMyProposal = () => {
    if (!activeTrade) return;
    onCancelTrade(activeTrade.id);
  };

  // Loan Repayment Calculation Preview
  const totalLoanRepay = Math.round(loanPrincipal * (1 + loanInterestRate));
  const perRoundLoanPayment = Math.round(totalLoanRepay / loanRounds);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(5, 10, 24, 0.85)',
      backdropFilter: 'blur(12px)',
      padding: '16px',
      userSelect: 'none',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '94vh',
        background: 'linear-gradient(180deg, #0b132b 0%, #070d1e 100%)',
        border: '2px solid rgba(0, 240, 255, 0.4)',
        borderRadius: '24px',
        boxShadow: '0 0 50px rgba(0, 240, 255, 0.25), 0 20px 40px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#ffffff',
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
          borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
            }}>
              <Handshake size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>P2P Trade & Negotiation Desk</span>
                {isTradeActive && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: isIncomingForMe ? '#f59e0b' : '#00f0ff',
                    color: '#000000',
                    letterSpacing: '0.5px',
                  }}>
                    {isIncomingForMe ? 'INCOMING OFFER' : 'ACTIVE OFFER'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Bilateral street transfer, tactical cards swap & tabletop peer loans
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 30-Second Countdown Bar */}
            {isTradeActive && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: secondsRemaining <= 5 ? '1px solid #ef4444' : '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '12px',
                padding: '4px 12px',
              }}>
                <Clock size={16} color={secondsRemaining <= 5 ? '#ef4444' : '#00f0ff'} />
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: '14px',
                  color: secondsRemaining <= 5 ? '#ef4444' : '#00f0ff',
                }}>
                  {secondsRemaining}s
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Bilateral Trade Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* LEFT: You Give (Your Offer) */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1.5px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: myPlayer.avatarColor || '#00f0ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}>
                  {myChar?.icon || '🎩'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#00f0ff' }}>
                    YOU GIVE (Your Offer)
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Balance: <span style={{ color: '#22c55e', fontFamily: 'monospace', fontWeight: 800 }}>{myMaxCash.toLocaleString()} CR</span>
                  </div>
                </div>
              </div>

              {giveTileIds.length + giveCardIds.length > 0 && (
                <span style={{ fontSize: '11px', color: '#00f0ff', fontWeight: 800 }}>
                  {giveTileIds.length} Props, {giveCardIds.length} Cards
                </span>
              )}
            </div>

            {/* Properties Selection */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Select Properties to Offer ({myProperties.length} Owned)
              </div>
              {myProperties.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '8px' }}>
                  No properties currently owned.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {myProperties.map(tile => {
                    const selected = giveTileIds.includes(tile.id);
                    return (
                      <button
                        key={tile.id}
                        onClick={() => toggleGiveTile(tile.id)}
                        disabled={isSentByMe && !isCounterEditing}
                        style={{
                          background: selected ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: selected ? '1.5px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: (isSentByMe && !isCounterEditing) ? 'default' : 'pointer',
                          color: '#ffffff',
                          transition: 'all 0.15s',
                        }}
                      >
                        {tile.country ? (
                          <CountryFlag country={tile.country} code={tile.flag} width={18} height={12} />
                        ) : (
                          <span style={{ fontSize: '14px' }}>{tile.flag}</span>
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{tile.name}</span>
                        <span style={{
                          fontSize: '9px',
                          background: tile.color,
                          padding: '1px 4px',
                          borderRadius: '4px',
                          fontWeight: 800,
                        }}>
                          {tile.prop?.isLandmark ? 'LANDMARK' : (tile.prop?.level > 1 ? `${tile.prop.level - 1}H` : 'LAND')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Cards Selection */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Select Hand Action Cards ({myCards.length}/3)
              </div>
              {myCards.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '6px' }}>
                  No action cards in hand.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {myCards.map((card, idx) => {
                    const selected = giveCardIds.includes(card.id);
                    const rarity = CARD_RARITY[card.rarity] || CARD_RARITY.COMMON;
                    return (
                      <button
                        key={`${card.id}_${idx}`}
                        onClick={() => toggleGiveCard(card.id)}
                        disabled={isSentByMe && !isCounterEditing}
                        style={{
                          background: selected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: selected ? '1.5px solid #a78bfa' : `1px solid ${rarity.border || 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '10px',
                          padding: '5px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: (isSentByMe && !isCounterEditing) ? 'default' : 'pointer',
                          color: '#ffffff',
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{card.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{card.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cash Slider & Quick Steppers */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Offer Cash Sweetener
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#22c55e', fontSize: '13px' }}>
                  +{giveCash.toLocaleString()} CR
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={myMaxCash}
                step="25000"
                value={giveCash}
                disabled={isSentByMe && !isCounterEditing}
                onChange={(e) => setGiveCash(parseInt(e.target.value) || 0)}
                style={{ width: '100%', accentColor: '#00f0ff', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[25000, 100000, 250000].map(amt => (
                  <button
                    key={amt}
                    disabled={isSentByMe && !isCounterEditing}
                    onClick={() => setGiveCash(prev => Math.min(myMaxCash, prev + amt))}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    +{amt / 1000}k
                  </button>
                ))}
                <button
                  disabled={isSentByMe && !isCounterEditing}
                  onClick={() => setGiveCash(0)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    color: '#f87171',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: You Receive (Target's Assets) */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1.5px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: targetPlayer.avatarColor || '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}>
                  {targetChar?.icon || '🤖'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#a78bfa' }}>
                    YOU RECEIVE ({targetPlayer.name}&apos;s Assets)
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Balance: <span style={{ color: '#22c55e', fontFamily: 'monospace', fontWeight: 800 }}>{targetMaxCash.toLocaleString()} CR</span>
                  </div>
                </div>
              </div>

              {reqTileIds.length + reqCardIds.length > 0 && (
                <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 800 }}>
                  {reqTileIds.length} Props, {reqCardIds.length} Cards
                </span>
              )}
            </div>

            {/* Target Properties Selection */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Request Properties ({targetProperties.length} Owned)
              </div>
              {targetProperties.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '8px' }}>
                  Rival has no properties owned.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {targetProperties.map(tile => {
                    const selected = reqTileIds.includes(tile.id);
                    return (
                      <button
                        key={tile.id}
                        onClick={() => toggleReqTile(tile.id)}
                        disabled={isSentByMe && !isCounterEditing}
                        style={{
                          background: selected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: selected ? '1.5px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: (isSentByMe && !isCounterEditing) ? 'default' : 'pointer',
                          color: '#ffffff',
                          transition: 'all 0.15s',
                        }}
                      >
                        {tile.country ? (
                          <CountryFlag country={tile.country} code={tile.flag} width={18} height={12} />
                        ) : (
                          <span style={{ fontSize: '14px' }}>{tile.flag}</span>
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{tile.name}</span>
                        <span style={{
                          fontSize: '9px',
                          background: tile.color,
                          padding: '1px 4px',
                          borderRadius: '4px',
                          fontWeight: 800,
                        }}>
                          {tile.prop?.isLandmark ? 'LANDMARK' : (tile.prop?.level > 1 ? `${tile.prop.level - 1}H` : 'LAND')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Target Action Cards Selection */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Request Hand Cards ({targetCards.length}/3)
              </div>
              {targetCards.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '6px' }}>
                  Rival holds no action cards.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {targetCards.map((card, idx) => {
                    const selected = reqCardIds.includes(card.id);
                    const rarity = CARD_RARITY[card.rarity] || CARD_RARITY.COMMON;
                    return (
                      <button
                        key={`${card.id}_${idx}`}
                        onClick={() => toggleReqCard(card.id)}
                        disabled={isSentByMe && !isCounterEditing}
                        style={{
                          background: selected ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: selected ? '1.5px solid #f472b6' : `1px solid ${rarity.border || 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '10px',
                          padding: '5px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: (isSentByMe && !isCounterEditing) ? 'default' : 'pointer',
                          color: '#ffffff',
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{card.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{card.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cash Requested Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Request Rival Cash
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#22c55e', fontSize: '13px' }}>
                  +{reqCash.toLocaleString()} CR
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={targetMaxCash}
                step="25000"
                value={reqCash}
                disabled={isSentByMe && !isCounterEditing}
                onChange={(e) => setReqCash(parseInt(e.target.value) || 0)}
                style={{ width: '100%', accentColor: '#a78bfa', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[25000, 100000, 250000].map(amt => (
                  <button
                    key={amt}
                    disabled={isSentByMe && !isCounterEditing}
                    onClick={() => setReqCash(prev => Math.min(targetMaxCash, prev + amt))}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    +{amt / 1000}k
                  </button>
                ))}
                <button
                  disabled={isSentByMe && !isCounterEditing}
                  onClick={() => setReqCash(0)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    color: '#f87171',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Peer-to-Peer Loan Drawer */}
        <div style={{
          margin: '0 24px 16px 24px',
          background: 'rgba(10, 15, 30, 0.85)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '16px',
          padding: '12px 18px',
        }}>
          <div
            onClick={() => setLoanEnabled(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={18} color="#f59e0b" />
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b' }}>
                📜 Peer-to-Peer Loan & Collateral Clause
              </span>
              <span style={{
                fontSize: '10px',
                background: loanEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: loanEnabled ? '#22c55e' : '#94a3b8',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 800,
              }}>
                {loanEnabled ? 'INCLUDED IN DEAL' : 'OPTIONAL (CLICK TO ENABLE)'}
              </span>
            </div>
            {loanEnabled ? <ChevronUp size={18} color="#f59e0b" /> : <ChevronDown size={18} color="#94a3b8" />}
          </div>

          {loanEnabled && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Direction */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setLoanDirection('lend')}
                    disabled={isSentByMe && !isCounterEditing}
                    style={{
                      background: loanDirection === 'lend' ? '#f59e0b' : 'rgba(255, 255, 255, 0.05)',
                      color: loanDirection === 'lend' ? '#000000' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    I Lend Cash to Rival
                  </button>
                  <button
                    onClick={() => setLoanDirection('borrow')}
                    disabled={isSentByMe && !isCounterEditing}
                    style={{
                      background: loanDirection === 'borrow' ? '#f59e0b' : 'rgba(255, 255, 255, 0.05)',
                      color: loanDirection === 'borrow' ? '#000000' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    I Borrow Cash from Rival
                  </button>
                </div>

                {/* Principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Principal:</span>
                  <select
                    value={loanPrincipal}
                    disabled={isSentByMe && !isCounterEditing}
                    onChange={(e) => setLoanPrincipal(parseInt(e.target.value))}
                    style={{
                      background: '#0f172a',
                      color: '#22c55e',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                    }}
                  >
                    <option value="100000">100,000 CR</option>
                    <option value="200000">200,000 CR</option>
                    <option value="300000">300,000 CR</option>
                    <option value="500000">500,000 CR</option>
                  </select>
                </div>

                {/* Interest Rate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Interest:</span>
                  {[0, 0.1, 0.2].map(r => (
                    <button
                      key={r}
                      disabled={isSentByMe && !isCounterEditing}
                      onClick={() => setLoanInterestRate(r)}
                      style={{
                        background: loanInterestRate === r ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                        border: loanInterestRate === r ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        color: loanInterestRate === r ? '#f59e0b' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      {r * 100}%
                    </button>
                  ))}
                </div>

                {/* Term */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Term:</span>
                  {[2, 3].map(rounds => (
                    <button
                      key={rounds}
                      disabled={isSentByMe && !isCounterEditing}
                      onClick={() => setLoanRounds(rounds)}
                      style={{
                        background: loanRounds === rounds ? 'rgba(0, 240, 255, 0.3)' : 'transparent',
                        border: loanRounds === rounds ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        color: loanRounds === rounds ? '#00f0ff' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      {rounds} Orbits
                    </button>
                  ))}
                </div>
              </div>

              {/* Collateral Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pledged Collateral:</span>
                <select
                  value={loanCollateralTileId ?? ''}
                  disabled={isSentByMe && !isCounterEditing}
                  onChange={(e) => setLoanCollateralTileId(e.target.value === '' ? null : parseInt(e.target.value))}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '12px',
                  }}
                >
                  <option value="">No Collateral (Unsecured)</option>
                  {(loanDirection === 'borrow' ? myProperties : targetProperties).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.flag} {t.name} ({t.prop?.isLandmark ? 'Landmark' : `${t.prop?.level || 1}-Tier`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Repayment Summary Notice */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px dashed rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                color: '#fef08a',
              }}>
                ⚡ Auto-Garnishment: Debtor automatically pays <b>{perRoundLoanPayment.toLocaleString()} CR</b> every time they pass START ({loanRounds} rounds). If debtor cannot pay or defaults, collateral property transfers immediately.
              </div>
            </div>
          )}
        </div>

        {/* Warning Banner if Hand Limit Exceeded */}
        {handLimitExceeded && (
          <div style={{
            margin: '0 24px 10px 24px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#fca5a5',
          }}>
            <AlertTriangle size={16} color="#ef4444" />
            <span>Cannot exceed maximum 3 action cards per player hand! Deselect cards to proceed.</span>
          </div>
        )}

        {/* Action Button Footer */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(5, 10, 24, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Status info */}
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {isSentByMe && !isCounterEditing && (
              <span style={{ color: '#00f0ff', fontWeight: 800 }}>
                ⏳ Waiting for {targetPlayer.name} to accept, counter, or decline...
              </span>
            )}
            {isIncomingForMe && !isCounterEditing && (
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>
                📬 Trade proposed by {targetPlayer.name}! Review terms and respond.
              </span>
            )}
            {isCounterEditing && (
              <span style={{ color: '#ec4899', fontWeight: 800 }}>
                🔄 Counter-Offer Mode: Modify terms and send back to rival.
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* If local player sent active trade: Cancel option */}
            {isSentByMe && !isCounterEditing && (
              <button
                onClick={handleCancelMyProposal}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '8px 18px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Withdraw Proposal
              </button>
            )}

            {/* If incoming offer for me: Accept, Counter, Decline */}
            {isIncomingForMe && !isCounterEditing && (
              <>
                <button
                  onClick={handleDeclineDeal}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1.5px solid #ef4444',
                    borderRadius: '12px',
                    padding: '8px 18px',
                    color: '#fca5a5',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  Decline Deal
                </button>

                <button
                  onClick={() => setIsCounterEditing(true)}
                  style={{
                    background: 'rgba(245, 158, 11, 0.25)',
                    border: '1.5px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '8px 18px',
                    color: '#fbbf24',
                    fontSize: '13px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowRightLeft size={16} />
                  Counter-Offer
                </button>

                <button
                  onClick={handleAcceptDeal}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '2px solid #34d399',
                    borderRadius: '12px',
                    padding: '8px 24px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                  }}
                >
                  <Check size={18} />
                  Accept Deal
                </button>
              </>
            )}

            {/* If Counter Editing */}
            {isCounterEditing && (
              <>
                <button
                  onClick={() => setIsCounterEditing(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '8px 18px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Cancel Edit
                </button>

                <button
                  onClick={handleSendCounter}
                  disabled={!canSubmitProposal}
                  style={{
                    background: canSubmitProposal
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: canSubmitProposal ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '8px 24px',
                    color: canSubmitProposal ? '#000000' : '#64748b',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: canSubmitProposal ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: canSubmitProposal ? '0 0 20px rgba(245, 158, 11, 0.4)' : 'none',
                  }}
                >
                  <ArrowRightLeft size={18} />
                  Send Counter-Offer
                </button>
              </>
            )}

            {/* New Trade Proposal (Not yet active) */}
            {!isTradeActive && (
              <button
                onClick={handleSendProposal}
                disabled={!canSubmitProposal}
                style={{
                  background: canSubmitProposal
                    ? 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: canSubmitProposal ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '8px 26px',
                  color: canSubmitProposal ? '#000000' : '#64748b',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: canSubmitProposal ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: canSubmitProposal ? '0 0 25px rgba(0, 240, 255, 0.5)' : 'none',
                }}
              >
                <Handshake size={18} />
                Send Proposal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

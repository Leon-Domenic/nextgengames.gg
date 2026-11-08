'use client';

import React, { useState } from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { Zap, Clock, Gavel, ShieldCheck, Trophy, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function AuctionModal({
  auction,
  myPlayer,
  players = [],
  onPlaceBid,
}) {
  if (!auction || !auction.active) return null;

  const tile = TILES[auction.tileId];
  if (!tile) return null;

  const currentBid = auction.currentBid || Math.floor((tile.price || 100000) * 0.5);
  const highestBidder = auction.highestBidderId ? players.find(p => p.id === auction.highestBidderId) : null;
  const isMeHighest = Boolean(myPlayer && auction.highestBidderId === myPlayer.id);
  const myCash = myPlayer?.cash || 0;
  const isAntiSnipe = (auction.timeLeft || 0) <= 3;

  // Next bid amounts
  const minNextBid = auction.highestBidderId ? currentBid + 10000 : currentBid;
  const bidPlus10k = auction.highestBidderId ? currentBid + 10000 : currentBid + 10000;
  const bidPlus50k = auction.highestBidderId ? currentBid + 50000 : currentBid + 50000;
  const maxBid = Math.min(myCash, tile.price ? Math.max(tile.price, currentBid + 100000) : currentBid + 100000);

  const handleBid = (amount) => {
    if (amount <= currentBid && auction.highestBidderId) return;
    if (amount > myCash) return;
    sounds.playCash();
    onPlaceBid?.(amount);
  };

  const timerPct = Math.min(100, Math.max(0, ((auction.timeLeft || 0) / 10) * 100));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.25s ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'linear-gradient(180deg, #0b1120 0%, #030712 100%)',
        border: isAntiSnipe ? '2px solid #ef4444' : '2px solid #38bdf8',
        borderRadius: '24px',
        boxShadow: isAntiSnipe
          ? '0 0 40px rgba(239, 68, 68, 0.45), 0 20px 50px rgba(0, 0, 0, 0.8)'
          : '0 0 35px rgba(56, 189, 248, 0.35), 0 20px 50px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}>
        {/* Top Header Banner */}
        <div style={{
          background: 'linear-gradient(90deg, #0284c7 0%, #2563eb 50%, #7c3aed 100%)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gavel size={20} color="#ffffff" />
            <span style={{
              fontSize: '14px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}>
              ⚡ Lightning Public Auction
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isAntiSnipe ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            padding: '4px 10px',
            borderRadius: '12px',
            border: isAntiSnipe ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.2)',
          }}>
            <Clock size={15} color={isAntiSnipe ? '#ef4444' : '#f8fafc'} />
            <span style={{
              fontFamily: 'monospace',
              fontSize: '15px',
              fontWeight: 900,
              color: isAntiSnipe ? '#ef4444' : '#ffffff',
            }}>
              {auction.timeLeft}s
            </span>
          </div>
        </div>

        {/* 10-Second Countdown Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${timerPct}%`,
            height: '100%',
            background: isAntiSnipe
              ? 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)'
              : 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)',
            transition: 'width 0.9s linear',
            boxShadow: isAntiSnipe ? '0 0 10px #ef4444' : '0 0 8px #38bdf8',
          }} />
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Property Summary Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1.5px solid ${tile.color || '#38bdf8'}`,
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: tile.color || '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: `0 4px 12px ${tile.color ? tile.color + '66' : 'rgba(56,189,248,0.4)'}`,
              }}>
                {tile.flag || tile.icon || '🏙️'}
              </div>
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {tile.country || (tile.type === 'resort' ? 'Resort Island' : 'Metropolis')}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#ffffff',
                }}>
                  {tile.name}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Catalog Price
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {(tile.price || 0).toLocaleString()} CR
              </div>
            </div>
          </div>

          {/* Current Highest Bid Desk */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            padding: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Trophy size={14} color="#f59e0b" />
              <span>Current Highest Bid</span>
            </div>

            <div style={{
              fontSize: '32px',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: '#facc15',
              textShadow: '0 0 20px rgba(250, 204, 21, 0.5)',
              letterSpacing: '0.02em',
            }}>
              {currentBid.toLocaleString()} CR
            </div>

            {/* Highest Bidder Pill */}
            {auction.highestBidderId ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: isMeHighest ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                border: isMeHighest ? '1px solid #22c55e' : '1px solid #38bdf8',
              }}>
                <span style={{ fontSize: '14px' }}>
                  {isMeHighest ? '👑' : '👤'}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: isMeHighest ? '#4ade80' : '#7dd3fc',
                }}>
                  {isMeHighest ? 'You are the highest bidder!' : `${auction.highestBidderName || 'Player'} leads`}
                </span>
              </div>
            ) : (
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                fontStyle: 'italic',
                padding: '4px 10px',
              }}>
                No bids yet — starting at 50% catalog price!
              </div>
            )}

            {isAntiSnipe && (
              <div style={{
                fontSize: '11px',
                fontWeight: 900,
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                animation: 'pulse 1s infinite',
              }}>
                <AlertTriangle size={13} /> Anti-Snipe Active (+3s on bids)
              </div>
            )}
          </div>

          {/* Quick Bid Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              padding: '0 4px',
            }}>
              <span>YOUR LIQUIDITY:</span>
              <span style={{ color: myCash >= minNextBid ? '#4ade80' : '#ef4444', fontFamily: 'monospace', fontWeight: 900 }}>
                {myCash.toLocaleString()} CR
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {/* +10k Bid Button */}
              <button
                onClick={() => handleBid(bidPlus10k)}
                disabled={isMeHighest || myCash < bidPlus10k}
                style={{
                  background: isMeHighest || myCash < bidPlus10k
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: isMeHighest || myCash < bidPlus10k
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid #38bdf8',
                  color: isMeHighest || myCash < bidPlus10k ? '#64748b' : '#ffffff',
                  padding: '12px 6px',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: isMeHighest || myCash < bidPlus10k ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease',
                  boxShadow: isMeHighest || myCash < bidPlus10k ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                }}
              >
                <span>+10,000 CR</span>
                <span style={{ fontSize: '10px', opacity: 0.8, fontFamily: 'monospace' }}>
                  ({bidPlus10k.toLocaleString()})
                </span>
              </button>

              {/* +50k Bid Button */}
              <button
                onClick={() => handleBid(bidPlus50k)}
                disabled={isMeHighest || myCash < bidPlus50k}
                style={{
                  background: isMeHighest || myCash < bidPlus50k
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  border: isMeHighest || myCash < bidPlus50k
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid #60a5fa',
                  color: isMeHighest || myCash < bidPlus50k ? '#64748b' : '#ffffff',
                  padding: '12px 6px',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: isMeHighest || myCash < bidPlus50k ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease',
                  boxShadow: isMeHighest || myCash < bidPlus50k ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
                }}
              >
                <span>+50,000 CR</span>
                <span style={{ fontSize: '10px', opacity: 0.8, fontFamily: 'monospace' }}>
                  ({bidPlus50k.toLocaleString()})
                </span>
              </button>

              {/* Max Bid Button */}
              <button
                onClick={() => handleBid(maxBid)}
                disabled={isMeHighest || maxBid <= currentBid || myCash < maxBid}
                style={{
                  background: isMeHighest || maxBid <= currentBid || myCash < maxBid
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  border: isMeHighest || maxBid <= currentBid || myCash < maxBid
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid #fbbf24',
                  color: isMeHighest || maxBid <= currentBid || myCash < maxBid ? '#64748b' : '#ffffff',
                  padding: '12px 6px',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: isMeHighest || maxBid <= currentBid || myCash < maxBid ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease',
                  boxShadow: isMeHighest || maxBid <= currentBid || myCash < maxBid ? 'none' : '0 4px 14px rgba(217, 119, 6, 0.35)',
                }}
              >
                <span>MAX BID</span>
                <span style={{ fontSize: '10px', opacity: 0.8, fontFamily: 'monospace' }}>
                  ({maxBid.toLocaleString()})
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

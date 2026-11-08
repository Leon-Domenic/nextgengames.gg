'use client';

import React, { useState } from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { Plane, Coins, ArrowRight, X, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

export default function WorldTourSelectModal({
  properties = {},
  myPlayer,
  onSelectDestination,
  onSkip,
  turnTimer = 25,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'neutral' | 'owned'

  if (!myPlayer) return null;

  const currentPos = myPlayer.position ?? 16;
  const flightTicketCost = 50000;

  // Filter ONLY neutral city tiles or own owned city tiles (NO chance, tax, airport, etc.)
  const eligibleTiles = TILES.filter((tile) => {
    if (tile.type !== 'city') return false;
    const prop = properties[tile.id];
    return !prop?.ownerId || prop?.ownerId === myPlayer.id;
  });

  const neutralTiles = eligibleTiles.filter((t) => !properties[t.id]?.ownerId);
  const ownedTiles = eligibleTiles.filter((t) => properties[t.id]?.ownerId === myPlayer.id);

  const displayTiles =
    filter === 'neutral'
      ? neutralTiles
      : filter === 'owned'
      ? ownedTiles
      : eligibleTiles;

  const handleSelect = (tileId) => {
    try {
      sounds.playFlightTakeoff?.();
    } catch (e) {}
    onSelectDestination?.(tileId);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
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
          width: '560px',
          maxWidth: '94vw',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '2px solid #38bdf8',
          borderRadius: '24px',
          boxShadow: '0 0 60px rgba(2, 132, 199, 0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          padding: '26px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Top Header Pill */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '11px',
            letterSpacing: '0.12em',
            padding: '5px 18px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
            border: '1px solid #7dd3fc',
          }}
        >
          <Plane size={15} />
          <span>WORLD TOUR FLIGHT ({turnTimer}s)</span>
        </div>

        {/* Title */}
        <h2 style={{ margin: '14px 0 4px 0', fontSize: '24px', fontWeight: 900, color: '#f8fafc' }}>
          SELECT FLIGHT DESTINATION
        </h2>

        {/* Cost & Rule Description */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          fontSize: '12px',
        }}>
          <span style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            padding: '3px 10px',
            borderRadius: '8px',
            fontWeight: 800,
          }}>
            🎫 Ticket: 50,000 CR
          </span>
          <span style={{ color: '#94a3b8' }}>
            Only neutral cities & your owned properties available
          </span>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '16px',
          width: '100%',
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '7px',
              border: 'none',
              background: filter === 'all' ? '#0284c7' : 'transparent',
              color: filter === 'all' ? '#fff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            All Eligible ({eligibleTiles.length})
          </button>
          <button
            onClick={() => setFilter('neutral')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '7px',
              border: 'none',
              background: filter === 'neutral' ? '#0284c7' : 'transparent',
              color: filter === 'neutral' ? '#fff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            Neutral ({neutralTiles.length})
          </button>
          <button
            onClick={() => setFilter('owned')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '7px',
              border: 'none',
              background: filter === 'owned' ? '#0284c7' : 'transparent',
              color: filter === 'owned' ? '#fff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            Your Cities ({ownedTiles.length})
          </button>
        </div>

        {/* Scrollable Tiles Grid */}
        <div style={{
          width: '100%',
          maxHeight: '340px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '10px',
          padding: '4px',
          marginBottom: '18px',
        }}>
          {displayTiles.map((tile) => {
            const prop = properties[tile.id];
            const isOwned = prop?.ownerId === myPlayer.id;
            const crossesStart = tile.id < currentPos;

            return (
              <div
                key={tile.id}
                onClick={() => handleSelect(tile.id)}
                style={{
                  background: isOwned
                    ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(15, 23, 42, 0.7) 100%)'
                    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: isOwned ? '1.5px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#00f0ff';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 240, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isOwned ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '18px' }}>{tile.flag || '🏙️'}</span>
                    <strong style={{ fontSize: '14px', color: '#ffffff' }}>{tile.name}</strong>
                  </div>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: tile.color || '#38bdf8',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                  }} />
                </div>

                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  {isOwned ? (
                    <span style={{
                      color: '#38bdf8',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}>
                      <Building2 size={12} />
                      Your City (Lvl {prop?.level || 1})
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>
                      Neutral City • Price: ₩{(tile.price || 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Crossing Start Salary Bonus Callout */}
                {crossesStart && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#22c55e',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}>
                    <span>🚀 +200k CR Crossing START Bonus!</span>
                  </div>
                )}

                {/* Fly Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  marginTop: '4px',
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    color: '#00f0ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    TRAVEL
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Skip / Pass Button */}
        <button
          onClick={() => {
            sounds.playBuild?.();
            onSkip?.();
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          SKIP FLIGHT (PASS TURN)
        </button>
      </div>
    </div>
  );
}

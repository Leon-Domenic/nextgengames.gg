'use client';

import React from 'react';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { TOKEN_ICONS } from '@/lib/board-brawl/characters.js';

// Maps 0..31 tile index to grid row and column in an 8x8 grid
function getTileGridPos(index) {
  if (index >= 0 && index <= 7) {
    // Bottom row (left to right): row 8, col 1 to 8
    return { row: 8, col: index + 1 };
  } else if (index >= 8 && index <= 15) {
    // Left column (bottom to top): col 1, row 8 down to 1
    // index 8 is (row 8, col 1), 15 is (row 1, col 1)? Wait, left column goes from bottom up or top down
    // Standard board: 0 is bottom-right, goes clockwise or counterclockwise.
    // Let's make an intuitive 8x8 perimeter:
    // Bottom: 0 to 8 (col 8 to 1, row 8)
    // Left: 8 to 16 (col 1, row 8 to 1)
    // Top: 16 to 24 (col 1 to 8, row 1)
    // Right: 24 to 31 (col 8, row 1 to 7)
    return { row: 8 - (index - 8), col: 1 };
  } else if (index >= 16 && index <= 23) {
    // Top row (left to right): row 1, col 1 to 8
    return { row: 1, col: index - 16 + 1 };
  } else {
    // Right column (top to bottom): col 8, row 1 to 7
    return { row: index - 24 + 1, col: 8 };
  }
}

export default function Board({
  properties = {},
  players = [],
  activeTileId,
  onTileClick,
  centerContent,
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 1fr)',
      gridTemplateRows: 'repeat(8, 1fr)',
      width: '840px',
      height: '840px',
      maxWidth: '96vw',
      maxHeight: '96vw',
      background: 'var(--bg-dark)',
      border: '3px solid var(--border-medium)',
      borderRadius: '20px',
      boxShadow: '0 0 50px rgba(0, 0, 0, 0.4), inset 0 0 40px rgba(0, 240, 255, 0.05)',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* 32 Perimeter Tiles */}
      {TILES.map((tile) => {
        const gridPos = getTileGridPos(tile.id);
        const prop = properties[tile.id] || {};
        const owner = players.find(p => p.id === prop.ownerId);
        const playersHere = players.filter(p => !p.isBankrupt && p.position === tile.id);
        const isCorner = [0, 8, 16, 24].includes(tile.id);

        return (
          <div
            key={tile.id}
            onClick={() => onTileClick && onTileClick(tile)}
            style={{
              gridRow: gridPos.row,
              gridColumn: gridPos.col,
              background: owner ? `${owner.avatarColor}18` : 'var(--bg-surface)',
              border: owner ? `2px solid ${owner.avatarColor}` : '1px solid var(--border-dim)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '6px',
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.1s',
              zIndex: 2,
            }}
          >
            {/* Color Stripe for Cities */}
            {tile.type === 'city' && (
              <div style={{
                height: '6px',
                width: '100%',
                background: tile.color,
                borderRadius: '3px',
                marginBottom: '2px',
              }} />
            )}

            {/* Tile Header: Flag / Icon & Name */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: isCorner ? '20px' : '14px', display: 'block' }}>
                {tile.flag || tile.icon}
              </span>
              <span style={{
                fontSize: isCorner ? '11px' : '10px',
                fontWeight: 800,
                color: 'var(--text-main)',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {tile.name}
              </span>
            </div>

            {/* Level / Landmark Badge */}
            {tile.type === 'city' && prop.ownerId && (
              <div style={{ textAlign: 'center', margin: '2px 0' }}>
                {prop.isLandmark ? (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 900,
                    background: '#eab308',
                    color: '#000',
                    padding: '1px 4px',
                    borderRadius: '4px',
                  }}>
                    👑 LANDMARK
                  </span>
                ) : (
                  <span style={{ fontSize: '10px' }}>
                    {'🏡'.repeat(Math.max(1, prop.level - 1))}
                  </span>
                )}
                {prop.festival && (
                  <span style={{ fontSize: '9px', color: '#ff3344', display: 'block', fontWeight: 800 }}>
                    🎪 2x FESTIVAL
                  </span>
                )}
              </div>
            )}

            {/* Price / Rent Footer */}
            <div style={{ textAlign: 'center' }}>
              {tile.type === 'city' ? (
                <span style={{ fontSize: '9px', color: owner ? owner.avatarColor : 'var(--text-dim)', fontWeight: 700 }}>
                  ${prop.ownerId ? (tile.rent[Math.min(prop.level - 1, 4)] || tile.rent[0]) : tile.price}
                </span>
              ) : (
                <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                  {tile.type.toUpperCase()}
                </span>
              )}
            </div>

            {/* Players on this tile */}
            {playersHere.length > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '2px',
                left: '2px',
                right: '2px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '2px',
                zIndex: 10,
              }}>
                {playersHere.map((p) => (
                  <div
                    key={p.id}
                    title={`${p.name} ($${p.cash})`}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: p.avatarColor,
                      border: '2px solid #fff',
                      boxShadow: `0 0 10px ${p.avatarColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      animation: 'hop 0.4s ease-out',
                    }}
                  >
                    {TOKEN_ICONS[p.avatarToken] || '🎩'}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Board Center: Dice, Active Decision Prompts & Chat */}
      <div style={{
        gridRow: '2 / 8',
        gridColumn: '2 / 8',
        background: 'var(--bg-glass-heavy)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 5,
        position: 'relative',
      }}>
        {centerContent}
      </div>

      <style jsx global>{`
        @keyframes hop {
          0% { transform: translateY(-16px) scale(1.3); }
          50% { transform: translateY(-4px) scale(1.1); }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

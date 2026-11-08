'use client';

import React, { useEffect, useState } from 'react';

export default function EmojiReactionBubble({
  reaction,
  position = 'top-left',
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!reaction?.emoji || !reaction?.timestamp) {
      setVisible(false);
      return;
    }

    const elapsed = Date.now() - reaction.timestamp;
    if (elapsed < 3500) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3500 - elapsed);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [reaction?.emoji, reaction?.timestamp]);

  if (!visible || !reaction?.emoji) return null;

  // Placement next to the avatar box
  const placementStyle = {
    'top-left': { left: '52px', top: '-14px' },
    'top-right': { left: '52px', top: '-14px' },
    'bottom-left': { left: '52px', top: '-14px' },
    'bottom-right': { left: '52px', top: '-14px' },
    'pedestal': { top: '-34px', left: '50%', transform: 'translateX(-50%)' },
  }[position] || { left: '52px', top: '-14px' };

  return (
    <div
      style={{
        position: 'absolute',
        ...placementStyle,
        zIndex: 900,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        animation: 'reactionBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      <style>{`
        @keyframes reactionBounce {
          0% { transform: scale(0.3) translateY(12px); opacity: 0; }
          60% { transform: scale(1.25) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          border: '2.5px solid #38bdf8',
          borderRadius: '18px',
          padding: '4px 10px',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35), 0 2px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          lineHeight: 1.1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}
      >
        <span>{reaction.emoji}</span>
      </div>
    </div>
  );
}

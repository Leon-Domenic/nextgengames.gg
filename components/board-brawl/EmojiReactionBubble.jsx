'use client';

import React, { useEffect, useState } from 'react';

export default function EmojiReactionBubble({
  reaction,
  position = 'top-left',
}) {
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    if (!reaction?.emoji || !reaction?.timestamp) return;
    const elapsed = Date.now() - reaction.timestamp;
    if (elapsed < 3500) {
      const timer = setTimeout(() => {
        setTicker((t) => t + 1);
      }, 3500 - elapsed);
      return () => clearTimeout(timer);
    }
  }, [reaction?.emoji, reaction?.timestamp]);

  const isVisible = Boolean(
    reaction?.emoji &&
    reaction?.timestamp &&
    Date.now() - reaction.timestamp < 3500
  );

  if (!isVisible) return null;

  // Placement prominent over the avatar box
  const placementStyle = {
    'pedestal': { top: '-46px', left: '50%', transform: 'translateX(-50%)' },
  }[position] || { top: '-14px', left: '26px' };

  return (
    <div
      style={{
        position: 'absolute',
        ...placementStyle,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes reactionBounce {
          0% { transform: scale(0.3) translateY(10px); opacity: 0; }
          60% { transform: scale(1.22) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          border: '2.5px solid #38bdf8',
          borderRadius: '18px',
          padding: '6px 12px',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35), 0 2px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          lineHeight: 1,
          animation: 'reactionBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}
      >
        <span>{reaction.emoji}</span>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef } from 'react';
import { sounds } from '@/lib/audio';

export const BASIC_EMOJIS = ['😂', '🔥', '👑', '😎', '💀', '❤️', '👍', '🤑', '😭', '🎉', '😡', '🎲'];

export default function EmojiReactionPicker({
  isOpen,
  onClose,
  onSelectEmoji,
  position = 'top-left',
  playerName = 'Player',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Placement relative to avatar box depending on corner
  const placementStyle = {
    'top-left': { top: '50px', left: '0px' },
    'top-right': { top: '50px', left: '0px' },
    'bottom-left': { bottom: '50px', left: '0px' },
    'bottom-right': { bottom: '50px', left: '0px' },
    'pedestal': { top: '108px', left: '50%', transform: 'translateX(-50%)' },
  }[position] || { top: '50px', left: '0px' };

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        ...placementStyle,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '2px solid #38bdf8',
        borderRadius: '16px',
        padding: '10px 12px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 0 16px rgba(56, 189, 248, 0.25)',
        width: '240px',
        animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        paddingBottom: '6px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 900,
          color: '#bae6fd',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          React to {playerName}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '2px 4px',
            lineHeight: 1,
          }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Emoji Grid: 6 columns x 2 rows */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '6px',
      }}>
        {BASIC_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              sounds.playBuild?.();
              onSelectEmoji(emoji);
              onClose();
            }}
            onMouseEnter={() => sounds.playPawnStep?.()}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              fontSize: '20px',
              padding: '6px 2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.12s ease, background 0.12s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.25)';
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)';
              e.currentTarget.style.borderColor = '#38bdf8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

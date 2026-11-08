'use client';

import React, { useState } from 'react';
import { Smile, Volume2, Shield } from 'lucide-react';

const EMOTES = ['😂', '😡', '🤑', '😭', '🎩', '💀', '🔥', '👑'];

const TAUNTS = [
  { id: 'chaching', label: '💰 Cha-ching!' },
  { id: 'payup', label: '🏨 Pay up!' },
  { id: 'splat', label: '🍅 Eat tomato!' },
  { id: 'gg', label: '🤝 Good game!' },
];

export default function EmoteWheel({ onSendEmote, onSendTaunt }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="Emotes & Soundboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <Smile size={16} color="#00f0ff" />
        Taunts
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: '46px',
          right: 0,
          background: 'rgba(16, 20, 29, 0.96)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 0 25px rgba(0, 0, 0, 0.8)',
          width: '260px',
          zIndex: 100,
          backdropFilter: 'blur(10px)',
        }}>
          {/* Emotes Grid */}
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            Quick Emotes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {EMOTES.map((em, idx) => (
              <button
                key={idx}
                onClick={() => { onSendEmote(em); setOpen(false); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '20px',
                  padding: '6px',
                  cursor: 'pointer',
                }}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Taunt Audio Clips */}
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            Audio Taunts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TAUNTS.map((t) => (
              <button
                key={t.id}
                onClick={() => { onSendTaunt(t.id); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Volume2 size={13} color="#00f0ff" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

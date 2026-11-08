'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Target, ArrowRight } from 'lucide-react';

export default function VictoryPodium({
  winner,
  winReason,
  players = [],
  onReturnToHub,
}) {
  useEffect(() => {
    // Blast celebratory confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  const tomatoTerrorist = [...players].sort((a, b) => (b.tomatoesThrown || 0) - (a.tomatoesThrown || 0))[0];
  const juiceSponge = [...players].sort((a, b) => (b.tomatoesHit || 0) - (a.tomatoesHit || 0))[0];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'rgba(6, 7, 9, 0.94)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: 'linear-gradient(180deg, rgba(16, 20, 29, 0.95) 0%, rgba(10, 13, 18, 0.98) 100%)',
        border: '2px solid #00f0ff',
        boxShadow: '0 0 60px rgba(0, 240, 255, 0.35)',
        borderRadius: '24px',
        padding: '36px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          background: 'rgba(0, 240, 255, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)',
        }}>
          <Trophy size={36} color="#00f0ff" />
        </div>

        <span style={{ fontSize: '13px', color: '#00f0ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
          MATCH CONCLUDED
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '6px 0 8px 0', color: '#fff' }}>
          {winner?.name} WINS!
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 28px 0' }}>
          Victory Condition: <strong style={{ color: '#00ff88' }}>{winReason?.toUpperCase()}</strong>
        </p>

        {/* Hall of Fame Awards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(255, 51, 68, 0.1)',
            border: '1px solid rgba(255, 51, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <Flame size={16} color="#ff3344" />
              <strong style={{ fontSize: '12px', color: '#ff6677', textTransform: 'uppercase' }}>Tomato Terrorist</strong>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
              {tomatoTerrorist?.name || 'None'}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {tomatoTerrorist?.tomatoesThrown || 0} Tomatoes Thrown
            </span>
          </div>

          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <Target size={16} color="#eab308" />
              <strong style={{ fontSize: '12px', color: '#eab308', textTransform: 'uppercase' }}>Juice Sponge</strong>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
              {juiceSponge?.name || 'None'}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {juiceSponge?.tomatoesHit || 0} Splats Absorbed
            </span>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={onReturnToHub}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '16px',
            background: '#00f0ff',
            color: '#060709',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
          }}
        >
          RETURN TO FRIENDS HUB
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

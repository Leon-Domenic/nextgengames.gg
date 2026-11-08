'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/audio';

export default function TomatoOverlay({ splatEvent, isVictim }) {
  const [splatOpacity, setSplatOpacity] = useState(0);
  const [wipePercent, setWipePercent] = useState(0); // 0 to 100%
  const [flyingTomato, setFlyingTomato] = useState(null); // { from, to, progress }

  const wipeCounterRef = useRef(0);

  // Trigger flight or splat
  useEffect(() => {
    if (!splatEvent) return;

    sounds.playTomatoThrow();

    // Flight animation
    setFlyingTomato({
      active: true,
      scale: 0.5,
    });

    const flightTimeout = setTimeout(() => {
      setFlyingTomato(null);
      if (isVictim) {
        sounds.playTomatoSplat();
        setSplatOpacity(1);
        setWipePercent(0);
        wipeCounterRef.current = 0;
      }
    }, 600);

    return () => clearTimeout(flightTimeout);
  }, [splatEvent, isVictim]);

  // Splat auto-drip fadeout
  useEffect(() => {
    if (splatOpacity <= 0) return;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setSplatOpacity((prev) => {
          if (prev <= 0.05) {
            clearInterval(interval);
            return 0;
          }
          return prev - 0.05;
        });
      }, 100);
      return () => clearInterval(interval);
    }, 3500);

    return () => clearTimeout(timer);
  }, [splatOpacity]);

  // Interactive wipe mechanic: dragging cursor across screen
  const handleWipeInteraction = (e) => {
    if (splatOpacity <= 0) return;
    wipeCounterRef.current += 1;
    const progress = Math.min(100, Math.floor(wipeCounterRef.current * 4));
    setWipePercent(progress);

    if (progress >= 100) {
      setSplatOpacity(0);
    }
  };

  return (
    <>
      {/* 1. Flying Tomato Projectile */}
      {flyingTomato && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99998,
          pointerEvents: 'none',
          animation: 'tomatoFlight 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards',
          fontSize: '90px',
        }}>
          🍅
        </div>
      )}

      {/* 2. Viscous Tomato Splatter Decal on Victim's Screen */}
      {isVictim && splatOpacity > 0 && (
        <div
          onMouseMove={handleWipeInteraction}
          onTouchMove={handleWipeInteraction}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `radial-gradient(circle at 50% 50%, rgba(220, 20, 40, ${splatOpacity * 0.75}) 0%, rgba(180, 10, 30, ${splatOpacity * 0.5}) 50%, transparent 80%)`,
            opacity: splatOpacity,
            transition: 'opacity 0.2s ease',
            cursor: 'grab',
            userSelect: 'none',
            backdropFilter: `blur(${Math.max(0, (1 - wipePercent / 100) * 8)}px)`,
          }}
        >
          {/* Splat Graphic / SVG */}
          <div style={{
            position: 'relative',
            width: '650px',
            maxWidth: '90vw',
            height: '450px',
            pointerEvents: 'none',
          }}>
            <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.8))' }}>
              {/* Dripping Splat Blobs */}
              <path
                d="M 200,60 C 230,20 280,30 300,70 C 330,120 380,140 370,180 C 360,230 310,250 270,260 C 230,270 210,290 190,280 C 150,260 120,290 90,260 C 50,230 30,190 40,150 C 50,110 80,70 120,80 C 150,90 170,100 200,60 Z"
                fill="#cc1122"
              />
              <path
                d="M 180,90 C 210,50 260,70 270,110 C 280,150 330,170 310,200 C 290,230 250,240 220,230 C 180,220 160,240 140,230 C 110,220 90,190 100,160 C 110,130 150,130 180,90 Z"
                fill="#ff2233"
              />
              {/* Seeds & Pulp */}
              <circle cx="160" cy="140" r="6" fill="#ffe066" />
              <circle cx="240" cy="120" r="5" fill="#ffe066" />
              <circle cx="210" cy="180" r="7" fill="#ffe066" />
              <circle cx="280" cy="190" r="5" fill="#ffe066" />
              <circle cx="130" cy="180" r="4" fill="#ffe066" />
              <circle cx="190" cy="110" r="6" fill="#ffe066" />

              {/* Drips */}
              <rect x="180" y="270" width="12" height="40" rx="6" fill="#cc1122" />
              <rect x="250" y="250" width="8" height="55" rx="4" fill="#cc1122" />
              <rect x="110" y="240" width="10" height="35" rx="5" fill="#cc1122" />
            </svg>
          </div>

          {/* Interactive Wipe Prompt */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid #ff3344',
            padding: '12px 24px',
            borderRadius: '24px',
            color: '#fff',
            fontWeight: 800,
            fontSize: '16px',
            textAlign: 'center',
            boxShadow: '0 0 25px rgba(255, 51, 68, 0.6)',
            marginTop: '-40px',
            pointerEvents: 'none',
          }}>
            🍅 YOU GOT SPLATTERED!
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff99aa', marginTop: '4px' }}>
              👉 SWIPE / DRAG CURSOR ACROSS SCREEN TO WIPE IT OFF ({wipePercent}%)!
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes tomatoFlight {
          0% {
            transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -80%) scale(1.4) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.8) rotate(360deg);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

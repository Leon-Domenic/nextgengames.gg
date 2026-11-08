'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/audio';

export default function TomatoOverlay({
  splatEvent,
  currentUserId,
  players = [],
  onVictimImpact,
}) {
  const [flight, setFlight] = useState(null);
  const [cardSplat, setCardSplat] = useState(null);
  const [screenSplatOpacity, setScreenSplatOpacity] = useState(0);
  const [wipePercent, setWipePercent] = useState(0);

  const wipeCounterRef = useRef(0);
  const flightTimerRef = useRef(null);
  const cardSplatTimerRef = useRef(null);

  // Trigger flight from initiator card to target card
  useEffect(() => {
    if (!splatEvent || !splatEvent.fromPlayerId || !splatEvent.targetPlayerId) return;

    // Check if the current client is the victim
    const isVictim = !!(
      currentUserId &&
      (splatEvent.targetPlayerId === currentUserId || splatEvent.targetId === currentUserId)
    );

    // Resolve Thrower DOM Card
    const fromCard = typeof document !== 'undefined'
      ? document.getElementById(`player-card-${splatEvent.fromPlayerId}`)
      : null;

    // Resolve Target DOM Card
    const targetCard = typeof document !== 'undefined'
      ? document.getElementById(`player-card-${splatEvent.targetPlayerId}`)
      : null;

    // Viewport dimensions
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Starting Coordinates
    let sX = vw / 2;
    let sY = vh - 60;
    if (fromCard) {
      const r = fromCard.getBoundingClientRect();
      sX = r.left + r.width / 2;
      sY = r.top + r.height / 2;
    }

    // Ending Coordinates
    let eX = vw / 2;
    let eY = vh / 2;
    if (isVictim) {
      // Victim sees it hurtling straight into their screen center / camera
      eX = vw / 2;
      eY = vh / 2;
    } else if (targetCard) {
      const r = targetCard.getBoundingClientRect();
      eX = r.left + r.width / 2;
      eY = r.top + r.height / 2;
    }

    // Parabolic Arc Apex (curved upward trajectory)
    const mX = (sX + eX) / 2;
    const distance = Math.hypot(eX - sX, eY - sY);
    const arcHeight = Math.max(140, distance * 0.35);
    const mY = Math.min(sY, eY) - arcHeight;

    // Audio cue
    try {
      sounds.playTomatoThrow?.();
    } catch (e) {}

    const flightDuration = 700; // ms

    setFlight({
      active: true,
      startX: sX,
      startY: sY,
      midX: mX,
      midY: mY,
      endX: eX,
      endY: eY,
      isVictim,
      targetCard,
      targetPlayerName: splatEvent.targetPlayerName || 'Opponent',
      fromPlayerName: splatEvent.fromPlayerName || 'Player',
    });

    if (flightTimerRef.current) clearTimeout(flightTimerRef.current);

    flightTimerRef.current = setTimeout(() => {
      setFlight(null);

      // Play impact audio
      try {
        sounds.playTomatoSplat?.();
      } catch (e) {}

      if (isVictim) {
        // Full screen shake and dripping decal for the victim
        try {
          onVictimImpact?.();
        } catch (e) {}
        setScreenSplatOpacity(1);
        setWipePercent(0);
        wipeCounterRef.current = 0;
      } else {
        // Localized card splat burst on the target's card
        if (targetCard) {
          try {
            targetCard.classList.add('tomato-wobble');
            setTimeout(() => targetCard.classList.remove('tomato-wobble'), 500);
          } catch (e) {}
        }

        setCardSplat({
          active: true,
          x: eX,
          y: eY,
          targetName: splatEvent.targetPlayerName,
        });

        if (cardSplatTimerRef.current) clearTimeout(cardSplatTimerRef.current);
        cardSplatTimerRef.current = setTimeout(() => {
          setCardSplat(null);
        }, 2800);
      }
    }, flightDuration);

    return () => {
      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
    };
  }, [splatEvent, currentUserId, onVictimImpact]);

  // Screen Splat Auto-fadeout for victim
  useEffect(() => {
    if (screenSplatOpacity <= 0) return;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setScreenSplatOpacity((prev) => {
          if (prev <= 0.05) {
            clearInterval(interval);
            return 0;
          }
          return prev - 0.05;
        });
      }, 100);
      return () => clearInterval(interval);
    }, 4000);

    return () => clearTimeout(timer);
  }, [screenSplatOpacity]);

  // Interactive wipe mechanic: drag/swipe cursor to clean
  const handleWipeInteraction = () => {
    if (screenSplatOpacity <= 0) return;
    wipeCounterRef.current += 1;
    const progress = Math.min(100, Math.floor(wipeCounterRef.current * 4));
    setWipePercent(progress);

    if (progress >= 100) {
      setScreenSplatOpacity(0);
    }
  };

  return (
    <>
      {/* 1. Real Trajectory Flight Projectile */}
      {flight && flight.active && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 99998,
            pointerEvents: 'none',
            '--sX': `${flight.startX}px`,
            '--sY': `${flight.startY}px`,
            '--mX': `${flight.midX}px`,
            '--mY': `${flight.midY}px`,
            '--eX': `${flight.endX}px`,
            '--eY': `${flight.endY}px`,
            '--mScale': flight.isVictim ? '2.0' : '1.3',
            '--eScale': flight.isVictim ? '4.2' : '0.9',
            animation: 'tomatoTrajectory 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}
        >
          {/* Animated 3D-styled Tomato with Red Glow & Shadow */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Motion Blur Tail Streak */}
            <div style={{
              position: 'absolute',
              width: '60px',
              height: '24px',
              borderRadius: '999px',
              background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.6) 0%, transparent 80%)',
              filter: 'blur(6px)',
              transform: 'scale(1.4)',
              zIndex: -1,
            }} />

            {/* Glowing Juicy Tomato */}
            <span style={{
              fontSize: '62px',
              display: 'inline-block',
              filter: 'drop-shadow(0 8px 16px rgba(220, 38, 38, 0.8))',
              userSelect: 'none',
            }}>
              🍅
            </span>
          </div>
        </div>
      )}

      {/* 2. Localized Splat Burst on Target Card (When watching other players get hit) */}
      {cardSplat && cardSplat.active && (
        <div
          style={{
            position: 'fixed',
            left: cardSplat.x,
            top: cardSplat.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 99997,
            pointerEvents: 'none',
            animation: 'cardSplatAnimation 2.8s ease forwards',
          }}
        >
          {/* Dripping Splatter Stamp */}
          <div style={{ position: 'relative', width: '220px', height: '180px' }}>
            <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.6))' }}>
              <path
                d="M 100,30 C 130,10 160,25 170,55 C 185,85 195,115 175,135 C 150,155 120,140 100,150 C 75,160 50,145 35,125 C 20,100 15,65 40,45 C 65,25 80,45 100,30 Z"
                fill="#dc2626"
              />
              <path
                d="M 95,45 C 120,30 145,45 150,70 C 160,95 150,120 130,125 C 110,130 95,120 80,125 C 60,130 45,110 40,90 C 35,70 55,55 75,50 C 85,45 90,55 95,45 Z"
                fill="#ef4444"
              />
              {/* Seeds */}
              <circle cx="80" cy="80" r="3.5" fill="#fef08a" />
              <circle cx="120" cy="70" r="3" fill="#fef08a" />
              <circle cx="105" cy="100" r="4" fill="#fef08a" />
              <circle cx="140" cy="105" r="3" fill="#fef08a" />
              {/* Drips */}
              <rect x="85" y="140" width="7" height="25" rx="3.5" fill="#b91c1c" />
              <rect x="135" y="130" width="5" height="30" rx="2.5" fill="#b91c1c" />
            </svg>
          </div>
        </div>
      )}

      {/* 3. Full-Screen Viscous Tomato Splatter Decal on Victim's Screen */}
      {screenSplatOpacity > 0 && (
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
            background: `radial-gradient(circle at 50% 50%, rgba(220, 20, 40, ${screenSplatOpacity * 0.78}) 0%, rgba(180, 10, 30, ${screenSplatOpacity * 0.5}) 50%, transparent 80%)`,
            opacity: screenSplatOpacity,
            transition: 'opacity 0.2s ease',
            cursor: 'grab',
            userSelect: 'none',
            backdropFilter: `blur(${Math.max(0, (1 - wipePercent / 100) * 8)}px)`,
          }}
        >
          {/* Central Splat Graphic with Seeds & Thick Drips */}
          <div style={{
            position: 'relative',
            width: '680px',
            maxWidth: '92vw',
            height: '460px',
            pointerEvents: 'none',
          }}>
            <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.85))' }}>
              <path
                d="M 200,60 C 230,20 280,30 300,70 C 330,120 380,140 370,180 C 360,230 310,250 270,260 C 230,270 210,290 190,280 C 150,260 120,290 90,260 C 50,230 30,190 40,150 C 50,110 80,70 120,80 C 150,90 170,100 200,60 Z"
                fill="#b91c1c"
              />
              <path
                d="M 180,90 C 210,50 260,70 270,110 C 280,150 330,170 310,200 C 290,230 250,240 220,230 C 180,220 160,240 140,230 C 110,220 90,190 100,160 C 110,130 150,130 180,90 Z"
                fill="#dc2626"
              />
              <path
                d="M 190,110 C 210,85 240,95 245,120 C 250,145 280,155 265,175 C 250,195 220,200 195,195 C 175,190 160,205 145,195 C 125,185 115,165 125,145 C 135,125 165,125 190,110 Z"
                fill="#ef4444"
              />

              {/* Yellowish-white seeds */}
              <circle cx="160" cy="140" r="7" fill="#fef08a" />
              <circle cx="240" cy="120" r="6" fill="#fef08a" />
              <circle cx="210" cy="180" r="8" fill="#fef08a" />
              <circle cx="280" cy="190" r="6" fill="#fef08a" />
              <circle cx="130" cy="180" r="5" fill="#fef08a" />
              <circle cx="190" cy="110" r="7" fill="#fef08a" />

              {/* Viscous Running Drips */}
              <rect x="178" y="270" width="14" height="55" rx="7" fill="#991b1b" />
              <rect x="250" y="250" width="9" height="70" rx="4.5" fill="#991b1b" />
              <rect x="108" y="240" width="12" height="45" rx="6" fill="#991b1b" />
              <rect x="315" y="220" width="8" height="35" rx="4" fill="#991b1b" />
            </svg>
          </div>

          {/* Interactive Wipe Prompt */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.92)',
            border: '2px solid #ef4444',
            padding: '14px 28px',
            borderRadius: '24px',
            color: '#fff',
            fontWeight: 900,
            fontSize: '17px',
            textAlign: 'center',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.7)',
            marginTop: '-30px',
            pointerEvents: 'none',
            letterSpacing: '0.02em',
          }}>
            🍅 YOU GOT DIRECTLY SPLATTERED!
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5', marginTop: '6px' }}>
              👉 SWIPE OR DRAG YOUR CURSOR ACROSS SCREEN TO WIPE IT OFF ({wipePercent}%)!
            </div>
          </div>
        </div>
      )}

      {/* Trajectory & Splat Animations */}
      <style jsx global>{`
        @keyframes tomatoTrajectory {
          0% {
            transform: translate3d(calc(var(--sX) - 31px), calc(var(--sY) - 31px), 0) scale(0.5) rotate(0deg);
            opacity: 0.8;
          }
          45% {
            transform: translate3d(calc(var(--mX) - 31px), calc(var(--mY) - 31px), 0) scale(var(--mScale)) rotate(360deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(var(--eX) - 31px), calc(var(--eY) - 31px), 0) scale(var(--eScale)) rotate(720deg);
            opacity: 1;
          }
        }

        @keyframes cardSplatAnimation {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 1;
          }
          12% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 1;
          }
          20% {
            transform: translate(-50%, -50%) scale(1.0);
            opacity: 1;
          }
          75% {
            transform: translate(-50%, -50%) scale(1.0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -46%) scale(0.95);
            opacity: 0;
          }
        }

        .tomato-wobble {
          animation: cardWobble 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
        }

        @keyframes cardWobble {
          10%, 90% { transform: translate3d(-2px, 0, 0) rotate(-1deg); }
          20%, 80% { transform: translate3d(3px, 0, 0) rotate(1.5deg); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0) rotate(-2deg); }
          40%, 60% { transform: translate3d(4px, 0, 0) rotate(2deg); }
        }
      `}</style>
    </>
  );
}

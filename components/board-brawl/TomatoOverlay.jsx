'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/audio';

export default function TomatoOverlay({
  splatEvent,
  currentUserId,
  players = [],
  onVictimImpact,
}) {
  const [activeProjectile, setActiveProjectile] = useState(null);
  const [cardSplat, setCardSplat] = useState(null);
  const [screenSplat, setScreenSplat] = useState(null);
  const [wipePercent, setWipePercent] = useState(0);

  const wipeCounterRef = useRef(0);
  const animFrameRef = useRef(null);
  const cardSplatTimerRef = useRef(null);
  const screenSplatTimerRef = useRef(null);
  const trailPositionsRef = useRef([]);

  useEffect(() => {
    if (!splatEvent || !splatEvent.fromPlayerId || !splatEvent.targetPlayerId) return;

    // Check if the local client is the target/victim
    const isVictim = Boolean(
      currentUserId &&
      (splatEvent.targetPlayerId === currentUserId || splatEvent.targetId === currentUserId)
    );

    // Viewport dimensions
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    // 1. Resolve Thrower DOM Card coordinates
    const fromCard = typeof document !== 'undefined'
      ? document.getElementById(`player-card-${splatEvent.fromPlayerId}`)
      : null;

    let sX = vw * 0.15;
    let sY = vh * 0.85;
    if (fromCard) {
      const r = fromCard.getBoundingClientRect();
      sX = r.left + r.width / 2;
      sY = r.top + r.height / 2;
    }

    // 2. Resolve Target DOM Card coordinates
    const targetCard = typeof document !== 'undefined'
      ? document.getElementById(`player-card-${splatEvent.targetPlayerId}`)
      : null;

    let eX = vw / 2;
    let eY = vh / 2;
    if (isVictim) {
      // Victim sees the tomato hurtling directly straight into the center of their screen/camera
      eX = vw / 2;
      eY = vh / 2;
    } else if (targetCard) {
      const r = targetCard.getBoundingClientRect();
      eX = r.left + r.width / 2;
      eY = r.top + r.height / 2;
    } else {
      eX = vw * 0.8;
      eY = vh * 0.2;
    }

    // 3. Parabolic Quadratic Bézier Control Point (Apex high above the midpoint)
    const mX = (sX + eX) / 2;
    const distance = Math.hypot(eX - sX, eY - sY);
    const arcHeight = Math.max(160, distance * 0.38);
    const mY = Math.min(sY, eY) - arcHeight;

    // Play initial swoosh / throw audio
    try {
      sounds.playTomatoThrow?.();
    } catch (e) {}

    // Initialize animation state
    const duration = isVictim ? 620 : 680; // ms
    const startTime = performance.now();
    trailPositionsRef.current = [];

    // Cancel any previous in-flight animation
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const animateTrajectory = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);

      // Quadratic Bézier: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
      const invT = 1.0 - t;
      const curX = invT * invT * sX + 2 * invT * t * mX + t * t * eX;
      const curY = invT * invT * sY + 2 * invT * t * mY + t * t * eY;

      // 3D rotation & dynamic scale
      const rotationDeg = t * 720;
      let curScale = 0.8;
      if (isVictim) {
        // Zooms from normal size up to massive in-your-face impact scale
        curScale = 0.8 + t * t * 3.2;
      } else {
        // Rises to 1.35 at apex, drops to 1.0 on impact
        curScale = 0.75 + Math.sin(t * Math.PI) * 0.6;
      }

      // Record motion trail points (max 5)
      trailPositionsRef.current.push({ x: curX, y: curY, scale: curScale * 0.7 });
      if (trailPositionsRef.current.length > 5) {
        trailPositionsRef.current.shift();
      }

      setActiveProjectile({
        x: curX,
        y: curY,
        rotation: rotationDeg,
        scale: curScale,
        trails: [...trailPositionsRef.current],
        isVictim,
      });

      if (t < 1.0) {
        animFrameRef.current = requestAnimationFrame(animateTrajectory);
      } else {
        // === IMPACT UPON ARRIVAL ===
        setActiveProjectile(null);
        trailPositionsRef.current = [];

        // Play squish impact sound
        try {
          sounds.playTomatoSplat?.();
        } catch (e) {}

        if (isVictim) {
          // Trigger severe screen shake
          try {
            onVictimImpact?.();
          } catch (e) {}

          // Severe impact splatter covering majority of screen
          setScreenSplat({
            active: true,
            slidingDown: false,
            fading: false,
          });
          setWipePercent(0);
          wipeCounterRef.current = 0;

          // Lasts 2.3 seconds, then ketchup slides down and fades out
          if (screenSplatTimerRef.current) clearTimeout(screenSplatTimerRef.current);
          screenSplatTimerRef.current = setTimeout(() => {
            setScreenSplat(prev => prev ? { ...prev, slidingDown: true } : null);
            setTimeout(() => {
              setScreenSplat(prev => prev ? { ...prev, fading: true } : null);
              setTimeout(() => {
                setScreenSplat(null);
              }, 700);
            }, 600);
          }, 2400);
        } else {
          // Wobble the target player card on impact
          if (targetCard) {
            targetCard.classList.add('tomato-wobble');
            setTimeout(() => targetCard.classList.remove('tomato-wobble'), 500);
          }

          // Explosive splat with dripping ketchup on the target's avatar
          setCardSplat({
            active: true,
            x: eX,
            y: eY,
            targetName: splatEvent.targetPlayerName || 'Opponent',
          });

          if (cardSplatTimerRef.current) clearTimeout(cardSplatTimerRef.current);
          cardSplatTimerRef.current = setTimeout(() => {
            setCardSplat(null);
          }, 2600);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animateTrajectory);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (cardSplatTimerRef.current) clearTimeout(cardSplatTimerRef.current);
      if (screenSplatTimerRef.current) clearTimeout(screenSplatTimerRef.current);
    };
  }, [splatEvent, currentUserId, onVictimImpact]);

  // Interactive wipe mechanic: swipe/drag cursor across screen to clean off early
  const handleWipeInteraction = () => {
    if (!screenSplat || !screenSplat.active) return;
    wipeCounterRef.current += 1;
    const progress = Math.min(100, Math.floor(wipeCounterRef.current * 5));
    setWipePercent(progress);

    if (progress >= 100) {
      setScreenSplat(null);
      if (screenSplatTimerRef.current) clearTimeout(screenSplatTimerRef.current);
    }
  };

  return (
    <>
      {/* 1. Quadratic Bézier Parabolic Projectile Flight */}
      {activeProjectile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 99998,
            overflow: 'visible',
          }}
        >
          {/* Motion Trail Particles */}
          {activeProjectile.trails.map((pt, idx) => {
            const trailOpacity = (idx + 1) / activeProjectile.trails.length * 0.45;
            return (
              <div
                key={`trail-${idx}`}
                style={{
                  position: 'absolute',
                  left: pt.x,
                  top: pt.y,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.2) 65%, transparent 100%)',
                  transform: `translate(-50%, -50%) scale(${pt.scale * 0.7})`,
                  opacity: trailOpacity,
                  filter: 'blur(3px)',
                }}
              />
            );
          })}

          {/* Main 3D Spinning Tomato Sprite */}
          <div
            style={{
              position: 'absolute',
              left: activeProjectile.x,
              top: activeProjectile.y,
              transform: `translate(-50%, -50%) scale(${activeProjectile.scale}) rotate(${activeProjectile.rotation}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 10px 22px rgba(220, 38, 38, 0.85))',
              userSelect: 'none',
              willChange: 'transform, left, top',
            }}
          >
            {/* Speed Streak Flare */}
            <div
              style={{
                position: 'absolute',
                width: '70px',
                height: '30px',
                borderRadius: '999px',
                background: 'radial-gradient(ellipse, rgba(239, 68, 68, 0.7) 0%, transparent 75%)',
                filter: 'blur(5px)',
                zIndex: -1,
                transform: 'scale(1.5)',
              }}
            />

            <span style={{ fontSize: '56px', display: 'inline-block', lineHeight: 1 }}>
              🍅
            </span>
          </div>
        </div>
      )}

      {/* 2. Target Player Card Splat with Dripping Ketchup */}
      {cardSplat && cardSplat.active && (
        <div
          style={{
            position: 'fixed',
            left: cardSplat.x,
            top: cardSplat.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 99997,
            pointerEvents: 'none',
            animation: 'cardSplatPop 2.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div style={{ position: 'relative', width: '240px', height: '200px' }}>
            <svg
              viewBox="0 0 200 170"
              style={{
                width: '100%',
                height: '100%',
                filter: 'drop-shadow(0 6px 18px rgba(0, 0, 0, 0.65))',
              }}
            >
              {/* Outer viscous splash base */}
              <path
                d="M 100,25 C 135,5 168,22 178,54 C 194,86 200,118 180,140 C 152,162 118,145 98,156 C 72,168 44,150 28,128 C 12,100 8,62 36,40 C 64,18 80,42 100,25 Z"
                fill="#991b1b"
              />
              {/* Mid juicy tomato pulp layer */}
              <path
                d="M 96,38 C 124,20 152,36 158,64 C 170,92 160,120 138,128 C 116,134 100,122 82,128 C 60,134 44,112 38,90 C 32,68 54,50 76,46 C 88,40 92,50 96,38 Z"
                fill="#dc2626"
              />
              {/* Inner bright ketchup highlight */}
              <path
                d="M 98,52 C 118,38 138,48 142,68 C 148,88 138,106 122,112 C 108,116 96,108 82,112 C 68,116 58,100 54,84 C 50,68 66,56 82,54 Z"
                fill="#ef4444"
              />

              {/* Scattered yellow tomato seeds */}
              <circle cx="76" cy="74" r="4" fill="#fef08a" />
              <circle cx="122" cy="65" r="3.5" fill="#fef08a" />
              <circle cx="102" cy="98" r="4.5" fill="#fef08a" />
              <circle cx="140" cy="102" r="3.5" fill="#fef08a" />
              <circle cx="62" cy="98" r="3" fill="#fef08a" />

              {/* Viscous Running Ketchup Drips */}
              <rect x="80" y="145" width="8" height="32" rx="4" fill="#7f1d1d" className="drip-slide-1" />
              <rect x="132" y="136" width="6.5" height="38" rx="3.25" fill="#7f1d1d" className="drip-slide-2" />
              <rect x="48" y="120" width="6" height="24" rx="3" fill="#7f1d1d" className="drip-slide-3" />
            </svg>
          </div>
        </div>
      )}

      {/* 3. Severe Impact Screen Splatter (Target's Screen Covered with Juicy Viscous Decal) */}
      {screenSplat && screenSplat.active && (
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
            background: `radial-gradient(circle at 50% 50%, rgba(185, 28, 28, ${0.85 * (1 - wipePercent / 100)}) 0%, rgba(127, 29, 29, ${0.65 * (1 - wipePercent / 100)}) 55%, transparent 90%)`,
            backdropFilter: `blur(${Math.max(0, (1 - wipePercent / 100) * 8)}px)`,
            cursor: 'grab',
            userSelect: 'none',
            pointerEvents: 'auto',
            transform: screenSplat.slidingDown ? 'translateY(120px)' : 'translateY(0)',
            opacity: screenSplat.fading ? 0 : 1,
            transition: 'transform 0.8s ease-in, opacity 0.7s ease-out',
          }}
        >
          {/* Massive Screen-Covering Juicy Splat SVG with Running Ketchup Drips */}
          <div
            style={{
              position: 'relative',
              width: '92vw',
              maxWidth: '920px',
              height: '70vh',
              maxHeight: '620px',
              pointerEvents: 'none',
              animation: 'massiveSplatImpact 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
            }}
          >
            <svg
              viewBox="0 0 500 380"
              style={{
                width: '100%',
                height: '100%',
                filter: 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.9))',
              }}
            >
              {/* Base Thick Deep-Red Visceral Splat */}
              <path
                d="M 250,45 C 310,-10 390,15 420,70 C 460,135 520,165 500,225 C 485,285 410,315 360,325 C 300,340 270,370 240,355 C 190,330 150,375 110,335 C 50,295 20,240 35,185 C 48,130 90,80 145,95 C 185,108 215,115 250,45 Z"
                fill="#7f1d1d"
              />

              {/* Mid Layer Juicy Crimson Sauce */}
              <path
                d="M 235,70 C 285,30 355,50 375,95 C 405,145 450,175 425,225 C 400,270 345,285 305,280 C 255,270 225,300 200,285 C 160,265 130,295 100,265 C 60,225 45,185 60,145 C 75,105 120,105 165,115 C 200,125 215,95 235,70 Z"
                fill="#b91c1c"
              />

              {/* Top Fresh Puree & Highlights */}
              <path
                d="M 240,95 C 275,60 325,75 340,115 C 365,155 395,175 375,215 C 350,250 310,255 275,250 C 240,245 220,265 195,255 C 165,240 145,260 125,240 C 95,210 90,175 105,145 C 120,115 155,115 190,125 C 215,130 225,110 240,95 Z"
                fill="#ef4444"
              />

              {/* Concentrated Yellow Seeds */}
              <circle cx="180" cy="160" r="9" fill="#fef08a" />
              <circle cx="310" cy="135" r="8" fill="#fef08a" />
              <circle cx="265" cy="215" r="10" fill="#fef08a" />
              <circle cx="360" cy="225" r="8" fill="#fef08a" />
              <circle cx="145" cy="225" r="7.5" fill="#fef08a" />
              <circle cx="230" cy="135" r="8.5" fill="#fef08a" />
              <circle cx="340" cy="170" r="7" fill="#fef08a" />
              <circle cx="205" cy="245" r="8" fill="#fef08a" />
              <circle cx="290" cy="175" r="9.5" fill="#fef08a" />

              {/* Viscous Dripping Ketchup Running Down the Screen */}
              <rect x="220" y="340" width="22" height="90" rx="11" fill="#7f1d1d" className="drip-slide-heavy-1" />
              <rect x="330" y="310" width="16" height="110" rx="8" fill="#7f1d1d" className="drip-slide-heavy-2" />
              <rect x="130" y="320" width="18" height="80" rx="9" fill="#7f1d1d" className="drip-slide-heavy-3" />
              <rect x="420" y="270" width="13" height="65" rx="6.5" fill="#7f1d1d" className="drip-slide-heavy-4" />
              <rect x="70" y="270" width="14" height="60" rx="7" fill="#7f1d1d" className="drip-slide-heavy-5" />

              {/* Radial Splatter Droplets */}
              <circle cx="45" cy="80" r="12" fill="#b91c1c" />
              <circle cx="475" cy="95" r="14" fill="#b91c1c" />
              <circle cx="495" cy="265" r="11" fill="#b91c1c" />
              <circle cx="25" cy="265" r="10" fill="#b91c1c" />
              <circle cx="260" cy="15" r="13" fill="#b91c1c" />
            </svg>
          </div>

          {/* Interactive Screen Banner Prompt */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.94)',
              border: '2px solid #ef4444',
              padding: '14px 32px',
              borderRadius: '24px',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '18px',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.8), 0 10px 30px rgba(0, 0, 0, 0.7)',
              marginTop: '-20px',
              pointerEvents: 'none',
              letterSpacing: '0.04em',
            }}
          >
            🍅 DIRECT HIT! YOUR SCREEN IS SPLATTERED!
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5', marginTop: '5px' }}>
              👉 Swipe/drag cursor to wipe it off early ({wipePercent}%) or wait for ketchup to slide down
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Wobble, Drip Slides & Explosive Pop */}
      <style jsx global>{`
        @keyframes massiveSplatImpact {
          0% {
            transform: scale(0.2) rotate(-8deg);
            opacity: 0;
          }
          65% {
            transform: scale(1.08) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: scale(1.0) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes cardSplatPop {
          0% {
            transform: translate(-50%, -50%) scale(0.25);
            opacity: 1;
          }
          15% {
            transform: translate(-50%, -50%) scale(1.22);
            opacity: 1;
          }
          25% {
            transform: translate(-50%, -50%) scale(1.0);
            opacity: 1;
          }
          75% {
            transform: translate(-50%, -50%) scale(1.0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -44%) scale(0.96);
            opacity: 0;
          }
        }

        .drip-slide-heavy-1 {
          animation: dripRun 2.2s ease-in infinite alternate;
        }
        .drip-slide-heavy-2 {
          animation: dripRun 2.6s ease-in 0.2s infinite alternate;
        }
        .drip-slide-heavy-3 {
          animation: dripRun 2.0s ease-in 0.4s infinite alternate;
        }

        @keyframes dripRun {
          0% { height: 70px; }
          100% { height: 130px; }
        }

        .tomato-wobble {
          animation: cardWobble 0.48s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
        }

        @keyframes cardWobble {
          10%, 90% { transform: translate3d(-3px, 0, 0) rotate(-1.5deg); }
          20%, 80% { transform: translate3d(4px, 0, 0) rotate(2deg); }
          30%, 50%, 70% { transform: translate3d(-5px, 0, 0) rotate(-2.5deg); }
          40%, 60% { transform: translate3d(5px, 0, 0) rotate(2.5deg); }
        }
      `}</style>
    </>
  );
}

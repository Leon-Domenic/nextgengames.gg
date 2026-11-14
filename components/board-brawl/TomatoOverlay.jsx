'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sounds } from '@/lib/audio';

// High-fidelity 3D Vector Tomato Component (glossy red sphere with specular shine & star calyx)
function TomatoSprite({ size = 64, rotation = 0, scale = 1 }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 12px 24px rgba(185, 28, 28, 0.85))',
        willChange: 'transform',
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="tomatoBodyGrad" cx="38%" cy="34%" r="62%">
            <stop offset="0%" stopColor="#ff5252" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id="tomatoGloss" cx="30%" cy="26%" r="28%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ff8a80" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tomato Red Body */}
        <ellipse cx="50" cy="56" rx="42" ry="38" fill="url(#tomatoBodyGrad)" />

        {/* Specular Gloss Reflection */}
        <ellipse cx="36" cy="40" rx="14" ry="9" transform="rotate(-25 36 40)" fill="url(#tomatoGloss)" />

        {/* Star-shaped Green Calyx (Leafy Stem) */}
        <g fill="#15803d" stroke="#166534" strokeWidth="1.5" strokeLinejoin="round">
          {/* Leaves */}
          <path d="M 50,22 Q 42,8 32,16 Q 44,22 48,26 Z" />
          <path d="M 52,22 Q 62,8 68,17 Q 56,23 52,26 Z" />
          <path d="M 47,25 Q 30,22 26,32 Q 38,30 46,28 Z" />
          <path d="M 53,25 Q 70,22 74,32 Q 62,30 54,28 Z" />
          <path d="M 50,27 Q 50,38 48,42 Q 52,38 51,27 Z" />
          {/* Central Stem */}
          <path d="M 50,24 C 50,15 54,10 52,4 C 49,6 48,14 49,24 Z" fill="#166534" />
        </g>
      </svg>
    </div>
  );
}

export default function TomatoOverlay({
  splatEvent,
  currentUserId,
  players = [],
  onVictimImpact,
}) {
  const [renderedProjectiles, setRenderedProjectiles] = useState([]);
  const [cardSplats, setCardSplats] = useState([]);
  const [screenSplat, setScreenSplat] = useState(null);
  const [wipePercent, setWipePercent] = useState(0);

  const wipeCounterRef = useRef(0);
  const animFrameRef = useRef(null);
  const projectilesRef = useRef([]);
  const screenSplatTimerRef = useRef(null);
  const seenEventsRef = useRef(new Set());

  // Stable references for props to prevent re-renders from cancelling the flight
  const onVictimImpactRef = useRef(onVictimImpact);
  onVictimImpactRef.current = onVictimImpact;

  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  // Master 60 FPS animation loop
  const triggerTrajectory = useCallback((eventData) => {
    if (!eventData || !eventData.fromPlayerId || !eventData.targetPlayerId) return;

    const eventId = eventData.id || `${eventData.fromPlayerId}_${eventData.targetPlayerId}_${eventData.timestamp || Date.now()}_${Math.random()}`;
    if (seenEventsRef.current.has(eventId)) return;
    seenEventsRef.current.add(eventId);

    if (seenEventsRef.current.size > 200) {
      const it = seenEventsRef.current.values();
      for (let i = 0; i < 50; i++) seenEventsRef.current.delete(it.next().value);
    }

    const myId = currentUserIdRef.current;
    const isVictim = Boolean(
      myId && (eventData.targetPlayerId === myId || eventData.targetId === myId)
    );

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    // 1. Resolve Thrower DOM Card coordinates
    const fromCard = typeof document !== 'undefined'
      ? document.getElementById(`player-card-${eventData.fromPlayerId}`)
      : null;

    let sX = vw * 0.15;
    let sY = vh * 0.15;
    if (fromCard) {
      const r = fromCard.getBoundingClientRect();
      sX = r.left + r.width / 2;
      sY = r.top + r.height / 2;
    }

    // 2. Resolve Target DOM Card coordinates
    const targetCard = typeof document !== 'undefined'
      ? document.getElementById(`player-card-${eventData.targetPlayerId}`)
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
      eX = vw * 0.85;
      eY = vh * 0.15;
    }

    // 3. Parabolic Quadratic Bézier Control Point
    const mX = (sX + eX) / 2;
    const distance = Math.hypot(eX - sX, eY - sY);
    const arcHeight = Math.max(160, Math.min(340, distance * 0.35));

    let mY;
    if (isVictim) {
      // Direct charge towards the camera
      mY = Math.min(sY, eY) - 60;
    } else if (sY < vh * 0.4 && eY < vh * 0.4) {
      // Both cards are at the top: arc downwards into the 3D board view so everyone sees it!
      mY = Math.max(sY, eY) + arcHeight;
    } else if (sY > vh * 0.6 && eY > vh * 0.6) {
      // Both cards are at the bottom: arc upwards
      mY = Math.min(sY, eY) - arcHeight;
    } else {
      mY = (sY + eY) / 2 - arcHeight * 0.4;
    }

    // Clamp mY so trajectory is always visible on screen
    mY = Math.max(100, Math.min(vh - 120, mY));

    // Play throw whoosh audio
    try { sounds.playTomatoThrow?.(); } catch (e) {}

    // Add projectile to active list
    const newProjectile = {
      id: eventId,
      sX, sY, mX, mY, eX, eY,
      startTime: performance.now(),
      duration: isVictim ? 880 : 1100,
      isVictim,
      targetPlayerId: eventData.targetPlayerId,
      targetName: eventData.targetPlayerName || 'Opponent',
      trails: [],
      x: sX,
      y: sY,
      scale: isVictim ? 1.0 : 0.95,
      rotation: 0,
    };

    projectilesRef.current.push(newProjectile);

    // Start master animation loop if not already ticking
    if (!animFrameRef.current) {
      const tick = (now) => {
        const activeList = projectilesRef.current;
        if (!activeList || activeList.length === 0) {
          animFrameRef.current = null;
          setRenderedProjectiles([]);
          return;
        }

        const nextList = [];
        const updatedRenders = [];

        for (const p of activeList) {
          const elapsed = Math.max(0, now - p.startTime);
          const t = Math.min(1.0, elapsed / p.duration);

          // Quadratic Bézier: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
          const invT = 1.0 - t;
          const curX = invT * invT * p.sX + 2 * invT * t * p.mX + t * t * p.eX;
          const curY = invT * invT * p.sY + 2 * invT * t * p.mY + t * t * p.eY;

          const rotationDeg = t * 1080;
          let curScale;
          if (p.isVictim) {
            // Direct charge zooming up to 4.5x screen-covering crash
            curScale = 0.9 + t * t * 3.6;
          } else {
            // Arc trajectory: grows to 1.5 at apex, lands at 1.15
            curScale = 0.95 + Math.sin(t * Math.PI) * 0.55;
          }

          p.trails.push({ x: curX, y: curY, scale: curScale * 0.7 });
          if (p.trails.length > 8) p.trails.shift();

          if (t < 1.0) {
            p.x = curX;
            p.y = curY;
            p.scale = curScale;
            p.rotation = rotationDeg;
            nextList.push(p);
            updatedRenders.push({
              id: p.id,
              x: curX,
              y: curY,
              scale: curScale,
              rotation: rotationDeg,
              trails: [...p.trails],
              isVictim: p.isVictim,
            });
          } else {
            // === IMPACT UPON ARRIVAL ===
            try { sounds.playTomatoSplat?.(); } catch (e) {}

            if (p.isVictim) {
              // ONLY TARGET GETS SCREEN SHAKE & SCREEN SPLATTER!
              try { onVictimImpactRef.current?.(); } catch (e) {}

              setScreenSplat({
                active: true,
                slidingDown: false,
                fading: false,
              });
              setWipePercent(0);
              wipeCounterRef.current = 0;

              if (screenSplatTimerRef.current) clearTimeout(screenSplatTimerRef.current);
              screenSplatTimerRef.current = setTimeout(() => {
                setScreenSplat(prev => prev ? { ...prev, slidingDown: true } : null);
                setTimeout(() => {
                  setScreenSplat(prev => prev ? { ...prev, fading: true } : null);
                  setTimeout(() => setScreenSplat(null), 700);
                }, 600);
              }, 3500);
            } else {
              // THROWER OR SPECTATOR:
              // Wobble target card & show comic card splat on target's card!
              const cardEl = typeof document !== 'undefined'
                ? document.getElementById(`player-card-${p.targetPlayerId}`)
                : null;

              if (cardEl) {
                cardEl.classList.remove('tomato-wobble');
                void cardEl.offsetWidth; // force DOM reflow to re-trigger wobble
                cardEl.classList.add('tomato-wobble');
                setTimeout(() => cardEl?.classList.remove('tomato-wobble'), 600);
              }

              const splatId = `${p.id}_card_splat`;
              setCardSplats(prev => [
                ...prev,
                {
                  id: splatId,
                  x: p.eX,
                  y: p.eY,
                  targetName: p.targetName,
                }
              ]);

              setTimeout(() => {
                setCardSplats(prev => prev.filter(s => s.id !== splatId));
              }, 2800);
            }
          }
        }

        projectilesRef.current = nextList;
        setRenderedProjectiles(updatedRenders);

        if (nextList.length > 0) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          animFrameRef.current = null;
        }
      };

      animFrameRef.current = requestAnimationFrame(tick);
    }
  }, []);

  // Listen for prop-driven splat events
  useEffect(() => {
    if (splatEvent && splatEvent.fromPlayerId && splatEvent.targetPlayerId) {
      triggerTrajectory(splatEvent);
    }
  }, [splatEvent, triggerTrajectory]);

  // Listen for window-level custom tomato events (e.g. dispatched on socket receive)
  useEffect(() => {
    const handleCustomTomato = (e) => {
      if (e?.detail) triggerTrajectory(e.detail);
    };
    window.addEventListener('ngg_trigger_tomato', handleCustomTomato);
    return () => window.removeEventListener('ngg_trigger_tomato', handleCustomTomato);
  }, [triggerTrajectory]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (screenSplatTimerRef.current) clearTimeout(screenSplatTimerRef.current);
    };
  }, []);

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
      {/* 1. Quadratic Bézier Parabolic Projectiles Flight */}
      {renderedProjectiles.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 46,
            overflow: 'visible',
          }}
        >
          {renderedProjectiles.map((proj) => (
            <React.Fragment key={proj.id}>
              {/* Motion Trail Particles */}
              {proj.trails.map((pt, idx) => {
                const trailOpacity = ((idx + 1) / proj.trails.length) * 0.7;
                return (
                  <div
                    key={`${proj.id}-trail-${idx}`}
                    style={{
                      position: 'absolute',
                      left: pt.x,
                      top: pt.y,
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.5) 55%, transparent 100%)',
                      transform: `translate(-50%, -50%) scale(${pt.scale * 0.85})`,
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
                  left: proj.x,
                  top: proj.y,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  willChange: 'left, top',
                }}
              >
                {/* Speed Streak Flare */}
                <div
                  style={{
                    position: 'absolute',
                    width: '90px',
                    height: '44px',
                    borderRadius: '999px',
                    background: 'radial-gradient(ellipse, rgba(239, 68, 68, 0.75) 0%, transparent 75%)',
                    filter: 'blur(6px)',
                    zIndex: -1,
                    transform: 'scale(1.4)',
                  }}
                />

                <TomatoSprite
                  size={64}
                  rotation={proj.rotation}
                  scale={proj.scale}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 2. Target Player Card Splat with Dripping Ketchup & Comic Popup */}
      {cardSplats.map((splat) => (
        <div
          key={splat.id}
          style={{
            position: 'fixed',
            left: splat.x,
            top: splat.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 45,
            pointerEvents: 'none',
            animation: 'cardSplatPop 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Comic Direct Hit Badge - positioned under card for top cards */}
          <div
            style={{
              position: 'absolute',
              top: (splat.y && splat.y < 240) ? '60px' : '-36px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: '2px solid #ffffff',
              borderRadius: '999px',
              padding: '4px 14px',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 18px rgba(185, 28, 28, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'splatBadgeBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <span>🍅</span>
            <span>SPLAT! DIRECT HIT!</span>
          </div>

          <div style={{ position: 'relative', width: '220px', height: '190px' }}>
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
      ))}

      {/* 3. Severe Impact Screen Splatter (ONLY for the Target whose screen got hit!) */}
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
            background: `radial-gradient(circle at 50% 50%, rgba(185, 28, 28, ${0.92 * (1 - wipePercent / 100)}) 0%, rgba(127, 29, 29, ${0.78 * (1 - wipePercent / 100)}) 55%, rgba(0, 0, 0, ${0.65 * (1 - wipePercent / 100)}) 90%)`,
            backdropFilter: `blur(${Math.max(0, (1 - wipePercent / 100) * 12)}px)`,
            cursor: 'grab',
            userSelect: 'none',
            pointerEvents: 'auto',
            transform: screenSplat.slidingDown ? 'translateY(120px)' : 'translateY(0)',
            opacity: screenSplat.fading ? 0 : 1,
            transition: 'transform 0.8s ease-in, opacity 0.7s ease-out',
          }}
        >
          {/* Massive Screen-Covering Juicy Splat SVG */}
          <div
            style={{
              position: 'relative',
              width: '94vw',
              maxWidth: '1280px',
              height: '84vh',
              maxHeight: '850px',
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
              <path
                d="M 250,45 C 310,-10 390,15 420,70 C 460,135 520,165 500,225 C 485,285 410,315 360,325 C 300,340 270,370 240,355 C 190,330 150,375 110,335 C 50,295 20,240 35,185 C 48,130 90,80 145,95 C 185,108 215,115 250,45 Z"
                fill="#7f1d1d"
              />
              <path
                d="M 235,70 C 285,30 355,50 375,95 C 405,145 450,175 425,225 C 400,270 345,285 305,280 C 255,270 225,300 200,285 C 160,265 130,295 100,265 C 60,225 45,185 60,145 C 75,105 120,105 165,115 C 200,125 215,95 235,70 Z"
                fill="#b91c1c"
              />
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
            transform: translate(-50%, -50%) scale(1.25);
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

        @keyframes splatBadgeBounce {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          70% { transform: translateX(-50%) scale(1.15); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
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
          animation: cardWobble 0.52s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
        }

        @keyframes cardWobble {
          10%, 90% { transform: scale(0.97) rotate(-2.5deg); }
          20%, 80% { transform: scale(1.03) rotate(3deg); }
          30%, 50%, 70% { transform: scale(0.98) rotate(-3.5deg); }
          40%, 60% { transform: scale(1.02) rotate(3.5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </>
  );
}

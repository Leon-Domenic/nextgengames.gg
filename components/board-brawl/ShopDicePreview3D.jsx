'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Dices, RotateCcw, Zap, Flame, Wind } from 'lucide-react';
import DieCube3D, { FACE_TARGET_ROT } from '@/components/board-brawl/DieCube3D';
import { sounds } from '@/lib/audio';
import { DICE_SKINS, ROLL_ANIMATION_STYLES, ROLL_STYLE_MAP } from '@/lib/board-brawl/diceSkins';

/**
 * Interactive 3D Dice Showcase with Physics-Inspired Roll Animation & Tail Effects.
 * Features:
 * - 4 Selectable Roll Animation Styles (High Arc, Supersonic Spiral, Vortex Corkscrew, Zero-G Float)
 * - Thematic Particle Tail & Motion Trail Ribbons matching each dice skin's custom aura
 * - Dual-die 3D pedestal with ambient lighting and contact shadows
 * - Doubles surge fanfare and interactive trigger controls
 */
export default function ShopDicePreview3D({
  skin = DICE_SKINS[0],
  onRollComplete,
}) {
  const activeSkin = skin || DICE_SKINS[0];
  const [activeRollStyle, setActiveRollStyle] = useState(activeSkin.rollStyle || 'arc_drop');
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState({ d1: 1, d2: 1, isDoubles: true, rolledOnce: false });
  const [celebrationGlow, setCelebrationGlow] = useState(false);

  // Dynamic transform states for Die 1 & Die 2
  const [die1, setDie1] = useState({
    x: 74,
    y: 60,
    lift: 0,
    rx: FACE_TARGET_ROT[1].rx,
    ry: FACE_TARGET_ROT[1].ry,
    rz: 0,
    scale: 1,
  });
  const [die2, setDie2] = useState({
    x: 166,
    y: 60,
    lift: 0,
    rx: FACE_TARGET_ROT[1].rx,
    ry: FACE_TARGET_ROT[1].ry,
    rz: 0,
    scale: 1,
  });

  // Dynamic particle trail states
  const [particles, setParticles] = useState([]);
  const [trailRibbons, setTrailRibbons] = useState({ t1: [], t2: [] });

  const rafRef = useRef(null);
  const prevSkinIdRef = useRef(activeSkin.id);
  const particlesRef = useRef([]);
  const trailRibbonsRef = useRef({ t1: [], t2: [] });

  // Keep roll style synced when switching to a skin with a unique signature style
  useEffect(() => {
    if (activeSkin?.rollStyle) {
      setActiveRollStyle(activeSkin.rollStyle);
    }
  }, [activeSkin?.id, activeSkin?.rollStyle]);

  // Main 3D Roll Animation with distinct style trajectories and trail emissions
  const triggerRoll = useCallback((overrideStyle) => {
    if (isRolling) return;
    setIsRolling(true);
    setCelebrationGlow(false);

    const styleId = overrideStyle || activeRollStyle || 'arc_drop';
    const trail = activeSkin.trailEffect || {
      type: 'ruby',
      color: activeSkin.accentColor || '#38bdf8',
      secondaryColor: '#ffffff',
      particleIcon: '✦',
    };

    // Roll two values 1..6
    const val1 = Math.floor(Math.random() * 6) + 1;
    const val2 = Math.floor(Math.random() * 6) + 1;
    const isDoubles = val1 === val2;

    try {
      sounds.playDiceRoll?.();
    } catch (e) {}

    // Style-specific timing & motion parameters
    let flightMs = 520;
    let settleMs = 380;
    let revX1 = 720;
    let revY1 = 1080;
    let revX2 = 1080;
    let revY2 = 720;
    let revZ1 = 280;
    let revZ2 = -260;

    if (styleId === 'spiral_bullet') {
      flightMs = 390;
      settleMs = 300;
      revX1 = 360;
      revY1 = 1440;
      revZ1 = 1440;
      revX2 = 360;
      revY2 = 1440;
      revZ2 = -1440;
    } else if (styleId === 'vortex_warp') {
      flightMs = 620;
      settleMs = 420;
      revX1 = 1080;
      revY1 = 1080;
      revZ1 = 720;
      revX2 = 1080;
      revY2 = 1080;
      revZ2 = -720;
    } else if (styleId === 'moon_bounce') {
      flightMs = 700;
      settleMs = 500;
      revX1 = 360;
      revY1 = 540;
      revZ1 = 180;
      revX2 = 360;
      revY2 = 540;
      revZ2 = -180;
    }

    const totalMs = flightMs + settleMs;
    const startTime = performance.now();

    const tgt1 = FACE_TARGET_ROT[val1] || FACE_TARGET_ROT[1];
    const tgt2 = FACE_TARGET_ROT[val2] || FACE_TARGET_ROT[1];

    const endRx1 = tgt1.rx + revX1;
    const endRy1 = tgt1.ry + revY1;
    const endRx2 = tgt2.rx + revX2;
    const endRy2 = tgt2.ry + revY2;

    // Reset particle trail buffers
    particlesRef.current = [];
    trailRibbonsRef.current = { t1: [], t2: [] };
    setParticles([]);
    setTrailRibbons({ t1: [], t2: [] });

    let lastParticleTime = 0;

    const step = (now) => {
      const elapsed = now - startTime;

      // Complete roll animation
      if (elapsed >= totalMs) {
        setDie1({ x: 74, y: 60, lift: 0, rx: endRx1, ry: endRy1, rz: 0, scale: 1 });
        setDie2({ x: 166, y: 60, lift: 0, rx: endRx2, ry: endRy2, rz: 0, scale: 1 });
        setIsRolling(false);
        setRollResult({ d1: val1, d2: val2, isDoubles, rolledOnce: true });

        // Fade out leftover particles smoothly
        setParticles([]);
        setTrailRibbons({ t1: [], t2: [] });

        if (isDoubles) {
          setCelebrationGlow(true);
          try {
            sounds.playDoublesSurge?.();
          } catch (e) {}
          setTimeout(() => setCelebrationGlow(false), 2400);
        }

        onRollComplete?.({ d1: val1, d2: val2, isDoubles });
        return;
      }

      let curX1 = 74;
      let curY1 = 60;
      let curLift1 = 0;
      let curRx1 = endRx1;
      let curRy1 = endRy1;
      let curRz1 = 0;
      let curScale1 = 1;

      let curX2 = 166;
      let curY2 = 60;
      let curLift2 = 0;
      let curRx2 = endRx2;
      let curRy2 = endRy2;
      let curRz2 = 0;
      let curScale2 = 1;

      if (elapsed < flightMs) {
        // Flight Phase with style-specific aerodynamics
        const u = elapsed / flightMs;

        if (styleId === 'spiral_bullet') {
          // Supersonic Spiral: Low darting trajectory with horizontal drift and extreme barrel-roll
          const easeU = Math.pow(u, 1.4);
          const apex = Math.sin(u * Math.PI);
          curLift1 = apex * 24;
          curLift2 = apex * 28;
          curX1 = 74 - Math.sin(u * Math.PI * 2) * 12;
          curX2 = 166 + Math.sin(u * Math.PI * 2) * 12;
          curRx1 = easeU * endRx1;
          curRy1 = easeU * endRy1;
          curRz1 = (1 - easeU) * revZ1;
          curRx2 = easeU * endRx2;
          curRy2 = easeU * endRy2;
          curRz2 = (1 - easeU) * revZ2;
          curScale1 = 0.95 + apex * 0.15;
          curScale2 = 0.95 + apex * 0.15;
        } else if (styleId === 'vortex_warp') {
          // Vortex Corkscrew: Orbital 3D helix spiral
          const orbitAngle = u * Math.PI * 3.5;
          const orbR = Math.sin(u * Math.PI) * 22;
          curLift1 = Math.sin(u * Math.PI) * 44;
          curLift2 = Math.sin(u * Math.PI) * 48;
          curX1 = 74 + Math.cos(orbitAngle) * orbR;
          curY1 = 60 + Math.sin(orbitAngle) * (orbR * 0.45);
          curX2 = 166 - Math.cos(orbitAngle) * orbR;
          curY2 = 60 - Math.sin(orbitAngle) * (orbR * 0.45);
          const easeRot = 1 - Math.pow(1 - u, 2.2);
          curRx1 = easeRot * endRx1 + Math.sin(orbitAngle) * 45;
          curRy1 = easeRot * endRy1;
          curRz1 = (1 - easeRot) * revZ1;
          curRx2 = easeRot * endRx2 - Math.sin(orbitAngle) * 45;
          curRy2 = easeRot * endRy2;
          curRz2 = (1 - easeRot) * revZ2;
          curScale1 = 0.9 + Math.sin(u * Math.PI) * 0.22;
          curScale2 = 0.9 + Math.sin(u * Math.PI) * 0.22;
        } else if (styleId === 'moon_bounce') {
          // Zero-G Lunar Float: Slow high-altitude floating arc
          const floatApex = Math.sin(Math.pow(u, 0.88) * Math.PI);
          curLift1 = floatApex * 62;
          curLift2 = floatApex * 66;
          curX1 = 74 - floatApex * 6;
          curX2 = 166 + floatApex * 6;
          const easeRot = 1 - Math.pow(1 - u, 2.0);
          curRx1 = easeRot * endRx1;
          curRy1 = easeRot * endRy1;
          curRz1 = (1 - easeRot) * revZ1;
          curRx2 = easeRot * endRx2;
          curRy2 = easeRot * endRy2;
          curRz2 = (1 - easeRot) * revZ2;
          curScale1 = 1 + floatApex * 0.24;
          curScale2 = 1 + floatApex * 0.24;
        } else {
          // Classic High Arc Lob
          const easePos = 1 - Math.pow(1 - u, 2.1);
          const easeRot = 1 - Math.pow(1 - u, 2.4);
          const arc = Math.sin(u * Math.PI);
          curLift1 = arc * 46;
          curLift2 = arc * 52;
          curX1 = 74 - arc * 4;
          curX2 = 166 + arc * 4;
          curRx1 = easeRot * endRx1 + (1 - u) * 45;
          curRy1 = easeRot * endRy1;
          curRz1 = (1 - easeRot) * revZ1;
          curRx2 = easeRot * endRx2 - (1 - u) * 40;
          curRy2 = easeRot * endRy2;
          curRz2 = (1 - easeRot) * revZ2;
          curScale1 = 0.96 + arc * 0.18;
          curScale2 = 0.96 + arc * 0.18;
        }
      } else {
        // Tabletop Settle Phase
        const b = (elapsed - flightMs) / settleMs;
        curX1 = 74;
        curX2 = 166;
        curY1 = 60;
        curY2 = 60;

        if (styleId === 'moon_bounce') {
          // 3 Low-gravity gentle flutter hops
          const bounce1 = b < 0.45 ? Math.sin((b / 0.45) * Math.PI) * 18 : 0;
          const bounce2 = b >= 0.45 && b < 0.75 ? Math.sin(((b - 0.45) / 0.3) * Math.PI) * 8 : 0;
          const bounce3 = b >= 0.75 ? Math.sin(((b - 0.75) / 0.25) * Math.PI) * 3 : 0;
          const damp = Math.exp(-2.5 * b) * (1 - b);
          const wobble = Math.cos(b * Math.PI * 2.8) * damp;
          const totalBounce = bounce1 + bounce2 + bounce3;
          curLift1 = totalBounce;
          curLift2 = totalBounce;
          curRx1 = endRx1 + wobble * 14;
          curRy1 = endRy1 - wobble * 10;
          curRz1 = wobble * 8;
          curRx2 = endRx2 - wobble * 14;
          curRy2 = endRy2 + wobble * 10;
          curRz2 = -wobble * 8;
        } else if (styleId === 'spiral_bullet') {
          // Sharp skid stop & high-frequency micro-shudder
          const skidHop = b < 0.5 ? Math.sin((b / 0.5) * Math.PI) * 9 : 0;
          const damp = Math.exp(-4.2 * b) * (1 - b);
          const shudder = Math.cos(b * Math.PI * 5) * damp;
          curLift1 = skidHop;
          curLift2 = skidHop;
          curRx1 = endRx1 + shudder * 26;
          curRy1 = endRy1 - shudder * 18;
          curRz1 = shudder * 14;
          curRx2 = endRx2 - shudder * 26;
          curRy2 = endRy2 + shudder * 18;
          curRz2 = -shudder * 14;
        } else {
          // Dual Tabletop Bounces
          const bounce1 = b < 0.6 ? Math.sin((b / 0.6) * Math.PI) * 15 : 0;
          const bounce2 = b >= 0.6 ? Math.sin(((b - 0.6) / 0.4) * Math.PI) * 5 : 0;
          const damp = Math.exp(-3.4 * b) * (1 - b);
          const wobble = Math.cos(b * Math.PI * 2.5) * damp;
          const totalBounce = bounce1 + bounce2;
          curLift1 = totalBounce;
          curLift2 = totalBounce;
          curRx1 = endRx1 + wobble * 20;
          curRy1 = endRy1 - wobble * 16;
          curRz1 = wobble * 12;
          curRx2 = endRx2 - wobble * 20;
          curRy2 = endRy2 + wobble * 16;
          curRz2 = -wobble * 12;
        }
      }

      setDie1({
        x: curX1,
        y: curY1,
        lift: curLift1,
        rx: curRx1,
        ry: curRy1,
        rz: curRz1,
        scale: curScale1,
      });

      setDie2({
        x: curX2,
        y: curY2,
        lift: curLift2,
        rx: curRx2,
        ry: curRy2,
        rz: curRz2,
        scale: curScale2,
      });

      // Update Motion Trail Ribbons (Keep last 7 positions)
      const r1 = trailRibbonsRef.current.t1;
      const r2 = trailRibbonsRef.current.t2;
      r1.push({ x: curX1, y: curY1 - curLift1, time: now });
      r2.push({ x: curX2, y: curY2 - curLift2, time: now });
      if (r1.length > 7) r1.shift();
      if (r2.length > 7) r2.shift();
      setTrailRibbons({ t1: [...r1], t2: [...r2] });

      // Emit Particle Trail Sparks along the dice flight path
      if (elapsed < flightMs + 180 && now - lastParticleTime > 32) {
        lastParticleTime = now;
        const curParticles = particlesRef.current;

        // Die 1 & Die 2 particle puff
        [
          { x: curX1, y: curY1 - curLift1 },
          { x: curX2, y: curY2 - curLift2 },
        ].forEach((pos, idx) => {
          curParticles.push({
            id: Math.random(),
            x: pos.x + (Math.random() - 0.5) * 14,
            y: pos.y + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 1.8,
            vy: (Math.random() - 0.5) * 1.8 - 0.4,
            size: Math.random() * 8 + 6,
            icon: trail.particleIcon || '✦',
            color: idx === 0 ? trail.color : (trail.secondaryColor || trail.color),
            opacity: 1,
            life: 1.0,
            decay: 0.045 + Math.random() * 0.03,
          });
        });

        // Decay active particles
        for (let i = curParticles.length - 1; i >= 0; i--) {
          const p = curParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          p.opacity = Math.max(0, p.life);
          if (p.life <= 0) {
            curParticles.splice(i, 1);
          }
        }

        setParticles([...curParticles]);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  }, [isRolling, activeRollStyle, activeSkin, onRollComplete]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // When switching skins, trigger an automatic preview roll with signature style
  useEffect(() => {
    if (activeSkin?.id && activeSkin.id !== prevSkinIdRef.current) {
      prevSkinIdRef.current = activeSkin.id;
      const t = setTimeout(() => {
        triggerRoll(activeSkin.rollStyle || 'arc_drop');
      }, 90);
      return () => clearTimeout(t);
    }
  }, [activeSkin?.id, activeSkin?.rollStyle, triggerRoll]);

  const accentColor = activeSkin.accentColor || '#38bdf8';
  const trail = activeSkin.trailEffect || {
    type: 'ruby',
    name: 'Ruby Speed Streak',
    color: '#ef4444',
    secondaryColor: '#fca5a5',
    glow: 'rgba(239, 68, 68, 0.75)',
    particleIcon: '♦',
  };

  const shadowOpacity1 = Math.max(0.15, 0.65 - (die1.lift / 60) * 0.5);
  const shadowScale1 = Math.max(0.55, 1 - (die1.lift / 70) * 0.45);
  const shadowBlur1 = Math.max(2, 2 + die1.lift * 0.2);

  const shadowOpacity2 = Math.max(0.15, 0.65 - (die2.lift / 60) * 0.5);
  const shadowScale2 = Math.max(0.55, 1 - (die2.lift / 70) * 0.45);
  const shadowBlur2 = Math.max(2, 2 + die2.lift * 0.2);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '10px',
      }}
    >
      <style>{`
        @keyframes nggShopPedestalPulse {
          0%, 100% { box-shadow: 0 0 16px ${accentColor}33, inset 0 2px 8px rgba(255, 255, 255, 0.25); }
          50%      { box-shadow: 0 0 26px ${accentColor}66, inset 0 2px 14px rgba(255, 255, 255, 0.4); }
        }
        @keyframes nggShopDieFloatA {
          0%, 100% { transform: translateY(0px) rotateX(20deg) rotateZ(-12deg); }
          50%      { transform: translateY(-5px) rotateX(24deg) rotateZ(-8deg); }
        }
        @keyframes nggShopDieFloatB {
          0%, 100% { transform: translateY(-2px) rotateX(20deg) rotateZ(14deg); }
          50%      { transform: translateY(-7px) rotateX(24deg) rotateZ(10deg); }
        }
      `}</style>

      {/* 1. Roll Result Banner & Active Cosmetic Tags */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '14px',
          background: isRolling
            ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
            : celebrationGlow
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'rgba(255, 255, 255, 0.92)',
          border: isRolling
            ? '1.5px solid #38bdf8'
            : celebrationGlow
            ? '2px solid #fde047'
            : '1px solid #cbd5e1',
          color: isRolling || celebrationGlow ? '#ffffff' : '#334155',
          fontWeight: 900,
          fontSize: '11px',
          letterSpacing: '0.5px',
          boxShadow: celebrationGlow
            ? '0 0 18px rgba(245, 158, 11, 0.6)'
            : '0 2px 6px rgba(0, 0, 0, 0.08)',
          marginBottom: '6px',
          transition: 'all 0.2s ease',
          minHeight: '26px',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {isRolling ? (
          <>
            <Dices size={14} className="animate-spin" />
            <span>ROLLING • {ROLL_STYLE_MAP[activeRollStyle]?.name.toUpperCase() || '3D DICE'}...</span>
          </>
        ) : rollResult.rolledOnce ? (
          rollResult.isDoubles ? (
            <>
              <Sparkles size={14} color="#fde047" />
              <span>DOUBLES! {rollResult.d1} + {rollResult.d2} = {rollResult.d1 + rollResult.d2} (EXTRA TURN!)</span>
            </>
          ) : (
            <>
              <span>🎲</span>
              <span>ROLLED {rollResult.d1 + rollResult.d2} ({rollResult.d1} + {rollResult.d2})</span>
            </>
          )
        ) : (
          <>
            <span>{activeSkin.icon}</span>
            <span>{activeSkin.name.toUpperCase()} • 3D ARENA</span>
          </>
        )}
      </div>

      {/* 2. 3D Pedestal Stage with Particle Trail System */}
      <div
        onClick={() => triggerRoll()}
        title="Click arena to test roll animation"
        style={{
          width: '240px',
          height: '136px',
          borderRadius: '24px',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(226, 232, 240, 0.85) 100%)',
          border: `2px solid ${accentColor}`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isRolling ? 'default' : 'pointer',
          perspective: '540px',
          overflow: 'hidden',
          animation: 'nggShopPedestalPulse 4s ease-in-out infinite',
          boxShadow: celebrationGlow
            ? `0 0 25px ${accentColor}88, inset 0 0 15px rgba(251, 191, 36, 0.4)`
            : `0 8px 24px rgba(0, 0, 0, 0.12)`,
          userSelect: 'none',
        }}
      >
        {/* Ambient Stage Lights */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            width: '160px',
            height: '60px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, ${accentColor}44 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Circular Podium Floor Rim */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            width: '190px',
            height: '48px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.6) 0%, rgba(241, 245, 249, 0.3) 65%, transparent 100%)',
            border: `1.5px solid ${accentColor}55`,
            pointerEvents: 'none',
          }}
        />

        {/* SVG Motion Trail Ribbons */}
        {isRolling && (
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 8,
            }}
          >
            {/* Trail 1 */}
            {trailRibbons.t1.length > 2 && (
              <polyline
                points={trailRibbons.t1.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={trail.color}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.65"
                filter="blur(2px)"
              />
            )}
            {/* Trail 2 */}
            {trailRibbons.t2.length > 2 && (
              <polyline
                points={trailRibbons.t2.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={trail.secondaryColor || trail.color}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.65"
                filter="blur(2px)"
              />
            )}
          </svg>
        )}

        {/* Floating Sparks / Particles Along Flight Trajectory */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}px`,
              top: `${p.y}px`,
              color: p.color,
              fontSize: `${p.size}px`,
              opacity: p.opacity,
              transform: 'translate(-50%, -50%)',
              filter: `drop-shadow(0 0 4px ${p.color})`,
              pointerEvents: 'none',
              zIndex: 9,
              transition: 'none',
            }}
          >
            {p.icon}
          </div>
        ))}

        {/* Die 1 Contact Shadow */}
        <div
          style={{
            position: 'absolute',
            left: `${die1.x}px`,
            bottom: '22px',
            width: '44px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0) 70%)',
            opacity: shadowOpacity1,
            transform: `translate(-50%, 50%) scale(${shadowScale1})`,
            filter: `blur(${shadowBlur1}px)`,
            pointerEvents: 'none',
            transition: 'opacity 0.05s ease',
          }}
        />

        {/* Die 2 Contact Shadow */}
        <div
          style={{
            position: 'absolute',
            left: `${die2.x}px`,
            bottom: '22px',
            width: '44px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0) 70%)',
            opacity: shadowOpacity2,
            transform: `translate(-50%, 50%) scale(${shadowScale2})`,
            filter: `blur(${shadowBlur2}px)`,
            pointerEvents: 'none',
            transition: 'opacity 0.05s ease',
          }}
        />

        {/* Die 1 3D Container */}
        <div
          style={{
            position: 'absolute',
            left: `${die1.x}px`,
            top: `${die1.y - die1.lift}px`,
            transform: `translate(-50%, -50%) scale(${die1.scale})`,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              transformStyle: 'preserve-3d',
              transform: isRolling ? 'rotateX(22deg) rotateZ(-12deg)' : undefined,
              animation: !isRolling ? 'nggShopDieFloatA 4.5s ease-in-out infinite' : undefined,
            }}
          >
            <DieCube3D
              size={50}
              skin={activeSkin}
              rx={die1.rx}
              ry={die1.ry}
              rz={die1.rz}
            />
          </div>
        </div>

        {/* Die 2 3D Container */}
        <div
          style={{
            position: 'absolute',
            left: `${die2.x}px`,
            top: `${die2.y - die2.lift}px`,
            transform: `translate(-50%, -50%) scale(${die2.scale})`,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              transformStyle: 'preserve-3d',
              transform: isRolling ? 'rotateX(22deg) rotateZ(14deg)' : undefined,
              animation: !isRolling ? 'nggShopDieFloatB 4.2s ease-in-out infinite' : undefined,
            }}
          >
            <DieCube3D
              size={50}
              skin={activeSkin}
              rx={die2.rx}
              ry={die2.ry}
              rz={die2.rz}
            />
          </div>
        </div>

        {/* Click to Roll Overlay Hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '5px',
            fontSize: '9px',
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Click Arena to Roll
        </div>
      </div>

      {/* 3. Tail Effect & Animation Metadata Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '8px',
          gap: '6px',
        }}
      >
        {/* Tail Effect Tag */}
        <div
          title={`Trail Effect: ${trail.name}`}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.85)',
            border: `1.5px solid ${trail.color}55`,
            fontSize: '10px',
            fontWeight: 800,
            color: '#334155',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ fontSize: '13px' }}>{trail.particleIcon || '✨'}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{trail.name}</span>
        </div>

        {/* Signature Style Tag */}
        <div
          title={`Signature Roll Style: ${ROLL_STYLE_MAP[activeSkin.rollStyle || 'arc_drop']?.name}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.85)',
            border: `1.5px solid ${accentColor}55`,
            fontSize: '10px',
            fontWeight: 800,
            color: '#334155',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{ROLL_STYLE_MAP[activeRollStyle]?.icon || '⚡'}</span>
          <span>{ROLL_STYLE_MAP[activeRollStyle]?.badge || 'Classic Arc'}</span>
        </div>
      </div>

      {/* 4. Roll Animation Style Switcher (4 Selectable Styles) */}
      <div
        style={{
          width: '100%',
          marginTop: '8px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {ROLL_ANIMATION_STYLES.map((style) => {
          const isSelected = activeRollStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => {
                setActiveRollStyle(style.id);
                triggerRoll(style.id);
              }}
              title={style.desc}
              style={{
                flex: 1,
                padding: '5px 2px',
                borderRadius: '8px',
                border: isSelected ? `1.5px solid ${accentColor}` : '1px solid #cbd5e1',
                background: isSelected
                  ? `linear-gradient(135deg, ${accentColor}22 0%, rgba(255, 255, 255, 0.95) 100%)`
                  : 'rgba(255, 255, 255, 0.7)',
                color: isSelected ? '#0369a1' : '#64748b',
                fontWeight: isSelected ? 900 : 700,
                fontSize: '9.5px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '11px' }}>{style.icon}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{style.badge}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Interactive "Test Roll Animation" Button */}
      <button
        onClick={() => triggerRoll()}
        disabled={isRolling}
        style={{
          marginTop: '8px',
          width: '100%',
          padding: '8px 16px',
          borderRadius: '12px',
          background: isRolling
            ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
            : `linear-gradient(135deg, ${accentColor} 0%, #0284c7 100%)`,
          border: 'none',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '12px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          cursor: isRolling ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: `0 4px 14px ${accentColor}44`,
          transition: 'all 0.15s ease',
          transform: isRolling ? 'scale(0.98)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!isRolling) e.currentTarget.style.transform = 'translateY(-1.5px)';
        }}
        onMouseLeave={(e) => {
          if (!isRolling) e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Dices size={16} className={isRolling ? 'animate-spin' : ''} />
        <span>{isRolling ? 'Rolling 3D Dice...' : `🎲 Test Roll (${ROLL_STYLE_MAP[activeRollStyle]?.name})`}</span>
      </button>
    </div>
  );
}

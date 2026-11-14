'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { DICE_SKIN_MAP, DICE_SKINS } from '@/lib/board-brawl/diceSkins';
import DieCube3D, { FACE_TARGET_ROT } from '@/components/board-brawl/DieCube3D';
import { useTranslation } from '@/lib/board-brawl/i18n';

function DieNumberBox({ value, skin }) {
  const bg = skin?.palette?.body || '#dc2626';
  const borderColor = skin?.palette?.border || '#ef4444';
  const textColor = value === 1 || value === 4
    ? (skin?.palette?.pip || '#ffffff')
    : '#ffffff';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: bg,
        color: textColor,
        fontWeight: 900,
        fontSize: '17px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
        border: `1.5px solid ${borderColor}`,
      }}
    >
      {value}
    </span>
  );
}

export default function DiceThrowOverlay({
  lastDiceResult,
  players = [],
  diceSkin = 'classic_red',
  containerRef,
  getBoardCenter,
}) {
  const { t } = useTranslation();
  const [animState, setAnimState] = useState(null);
  const [revealedRollId, setRevealedRollId] = useState(null);
  const [pillPos, setPillPos] = useState(null);
  const lastIdRef = useRef(null);
  const rafRef = useRef(0);
  const getBoardCenterRef = useRef(getBoardCenter);
  getBoardCenterRef.current = getBoardCenter;

  useEffect(() => {
    if (!lastDiceResult || !lastDiceResult.id || lastDiceResult.id === lastIdRef.current) return;
    lastIdRef.current = lastDiceResult.id;

    const container = containerRef?.current;
    if (!container) {
      setRevealedRollId(lastDiceResult.id);
      return;
    }

    // Hide previous numeric badge cleanly while new dice are flying in
    setRevealedRollId(null);

    const resolveBoardCenterPx = () => {
      const rect = container.getBoundingClientRect();
      const norm = getBoardCenterRef.current?.();
      const nx = norm && Number.isFinite(norm.nx) ? norm.nx : 0.5;
      const ny = norm && Number.isFinite(norm.ny) ? norm.ny : 355 / 720;
      const zoom = norm && Number.isFinite(norm.zoom) ? norm.zoom : 1.0;
      return {
        cRect: rect,
        x: rect.width * nx,
        y: rect.height * ny,
        zoom,
      };
    };

    const initialBoard = resolveBoardCenterPx();
    const { cRect } = initialBoard;
    const centerX = initialBoard.x;
    const centerY = initialBoard.y;
    setPillPos({ x: centerX, y: Math.max(88, centerY - 68) });

    // Launch visibly from the rolling player's inner corner-card rim facing board center
    let startX = centerX;
    let startY = cRect.height - 90;
    const cardEl = typeof document !== 'undefined'
      ? document.getElementById(`player-card-${lastDiceResult.playerId}`)
      : null;
    if (cardEl) {
      const r = cardEl.getBoundingClientRect();
      const cardCx = (r.left + r.width * 0.5) - cRect.left;
      const cardCy = (r.top + r.height * 0.5) - cRect.top;
      const dx = centerX - cardCx;
      const dy = centerY - cardCy;
      const edgeScaleX = Math.abs(dx) > 1 ? (r.width * 0.36) / Math.abs(dx) : Infinity;
      const edgeScaleY = Math.abs(dy) > 1 ? (r.height * 0.38) / Math.abs(dy) : Infinity;
      const rimT = Math.min(0.9, Math.min(edgeScaleX, edgeScaleY));
      if (Number.isFinite(rimT) && rimT > 0) {
        startX = cardCx + dx * rimT;
        startY = cardCy + dy * rimT;
      } else {
        startX = cardCx;
        startY = cardCy;
      }
      startX = Math.max(24, Math.min(cRect.width - 24, startX));
      startY = Math.max(24, Math.min(cRect.height - 24, startY));
    }

    const roller = players.find((p) => p.id === lastDiceResult.playerId);
    const skinId = roller?.diceSkin || diceSkin || 'classic_red';
    const skin = DICE_SKIN_MAP[skinId] || DICE_SKINS[0];
    const rollStyle = skin.rollStyle || 'arc_drop';
    const trail = skin.trailEffect || {
      type: 'ruby',
      name: 'Ruby Speed Streak',
      color: '#ef4444',
      secondaryColor: '#fca5a5',
      particleIcon: '✦',
    };

    const isFast = typeof window !== 'undefined' && localStorage.getItem('ngg_fast_dice_enabled') === 'true';
    let flightMs = isFast ? 260 : 520;
    let settleMs = isFast ? 180 : 380;
    const holdMs = isFast ? 650 : 1200;
    const fadeMs = 260;

    if (rollStyle === 'spiral_bullet') {
      flightMs = isFast ? 200 : 400;
      settleMs = isFast ? 150 : 300;
    } else if (rollStyle === 'vortex_warp') {
      flightMs = isFast ? 300 : 620;
      settleMs = isFast ? 200 : 420;
    } else if (rollStyle === 'moon_bounce') {
      flightMs = isFast ? 340 : 680;
      settleMs = isFast ? 240 : 480;
    }

    const totalMs = flightMs + settleMs + holdMs + fadeMs;

    const isTempleRoll = lastDiceResult.rollKind === 'temple';
    const isSingleDie = isTempleRoll || lastDiceResult.d2 === 0;

    const revX1 = rollStyle === 'spiral_bullet' ? 360 : rollStyle === 'moon_bounce' ? 360 : 720;
    const revY1 = rollStyle === 'spiral_bullet' ? 1440 : rollStyle === 'moon_bounce' ? 540 : 1080;
    const revX2 = rollStyle === 'spiral_bullet' ? 360 : rollStyle === 'moon_bounce' ? 360 : 1080;
    const revY2 = rollStyle === 'spiral_bullet' ? 1440 : rollStyle === 'moon_bounce' ? 540 : 720;
    const spinZRate = rollStyle === 'spiral_bullet' ? 580 : 280;

    const diceSpecs = isSingleDie
      ? [{
          value: lastDiceResult.d1 || 1,
          offsetX: 0,
          offsetY: 0,
          restYaw: -14,
          revX: revX1,
          revY: revY1,
          spinZSign: 1,
          arcHeight: rollStyle === 'spiral_bullet' ? 95 : rollStyle === 'moon_bounce' ? 185 : 145,
        }]
      : [
          {
            value: lastDiceResult.d1 || 1,
            offsetX: -34,
            offsetY: -3,
            restYaw: -18,
            revX: revX1,
            revY: revY1,
            spinZSign: 1,
            arcHeight: rollStyle === 'spiral_bullet' ? 95 : rollStyle === 'moon_bounce' ? 185 : 145,
          },
          {
            value: lastDiceResult.d2 || 1,
            offsetX: 34,
            offsetY: 6,
            restYaw: 16,
            revX: revX2,
            revY: revY2,
            spinZSign: -1,
            arcHeight: rollStyle === 'spiral_bullet' ? 105 : rollStyle === 'moon_bounce' ? 195 : 160,
          },
        ];

    const startTime = performance.now();
    let didReveal = false;
    const trailPoints1 = [];
    const trailPoints2 = [];
    const activeParticles = [];
    let lastParticleTime = 0;

    const step = (now) => {
      const elapsed = now - startTime;
      if (elapsed >= totalMs) {
        setAnimState(null);
        return;
      }

      const liveBoard = resolveBoardCenterPx();
      const liveCenterX = liveBoard.x;
      const liveCenterY = liveBoard.y;
      const spreadScale = Math.min(1.18, Math.max(0.85, liveBoard.zoom * 0.92));

      if (!didReveal && elapsed >= flightMs + 60) {
        didReveal = true;
        setPillPos({ x: liveCenterX, y: Math.max(88, liveCenterY - 68) });
        setRevealedRollId(lastDiceResult.id);
      }

      const inFlight = elapsed < flightMs;
      const inSettle = !inFlight && elapsed < flightMs + settleMs;
      const tail = elapsed - (flightMs + settleMs + holdMs);
      const opacity = tail > 0 ? Math.max(0, 1 - tail / fadeMs) : 1;

      const diceFrames = diceSpecs.map((spec, specIdx) => {
        let tgtX = liveCenterX + spec.offsetX * spreadScale;
        let tgtY = liveCenterY + spec.offsetY * spreadScale;
        const tgt = FACE_TARGET_ROT[spec.value] || FACE_TARGET_ROT[1];
        const endRx = tgt.rx + spec.revX;
        const endRy = tgt.ry + spec.revY;

        if (inFlight) {
          const u = Math.min(1, elapsed / flightMs);
          const easePos = 1 - Math.pow(1 - u, 2.1);
          const easeRot = 1 - Math.pow(1 - u, 2.4);

          // Add vortex corkscrew displacement if skin has vortex style
          let vortexDx = 0;
          let vortexDy = 0;
          if (rollStyle === 'vortex_warp') {
            const vAngle = u * Math.PI * 4;
            const vR = Math.sin(u * Math.PI) * 26 * spec.spinZSign;
            vortexDx = Math.cos(vAngle) * vR;
            vortexDy = Math.sin(vAngle) * (vR * 0.5);
          }

          const curX = startX + (tgtX - startX) * easePos + vortexDx;
          const curY = startY + (tgtY - startY) * easePos + vortexDy;
          const curLift = Math.sin(u * Math.PI) * spec.arcHeight;

          // Track trail points
          const ribbon = specIdx === 0 ? trailPoints1 : trailPoints2;
          ribbon.push({ x: curX, y: curY - curLift });
          if (ribbon.length > 7) ribbon.shift();

          return {
            x: curX,
            y: curY,
            lift: curLift,
            scale: 0.48 + 0.5 * easePos + Math.sin(u * Math.PI) * 0.24,
            rx: easeRot * endRx + (1 - u) * 35 * spec.spinZSign,
            ry: easeRot * endRy,
            rz: (1 - easeRot) * spinZRate * spec.spinZSign,
            restYaw: spec.restYaw * (0.4 + 0.6 * easePos),
            tablePitch: 24 + 24 * easePos,
          };
        }

        if (inSettle) {
          const b = (elapsed - flightMs) / settleMs;
          let bounce = 0;
          let wobble = 0;

          if (rollStyle === 'moon_bounce') {
            const bounce1 = b < 0.45 ? Math.sin((b / 0.45) * Math.PI) * 20 : 0;
            const bounce2 = b >= 0.45 && b < 0.75 ? Math.sin(((b - 0.45) / 0.3) * Math.PI) * 9 : 0;
            const bounce3 = b >= 0.75 ? Math.sin(((b - 0.75) / 0.25) * Math.PI) * 4 : 0;
            bounce = bounce1 + bounce2 + bounce3;
            const damp = Math.exp(-2.6 * b) * (1 - b);
            wobble = Math.cos(b * Math.PI * 2.8) * damp;
          } else if (rollStyle === 'spiral_bullet') {
            const skidHop = b < 0.5 ? Math.sin((b / 0.5) * Math.PI) * 10 : 0;
            bounce = skidHop;
            const damp = Math.exp(-4.2 * b) * (1 - b);
            wobble = Math.cos(b * Math.PI * 5) * damp;
          } else {
            // Two damped tabletop bounces
            const bounce1 = b < 0.62 ? Math.sin((b / 0.62) * Math.PI) * 18 : 0;
            const bounce2 = b >= 0.62 ? Math.sin(((b - 0.62) / 0.38) * Math.PI) * 6 : 0;
            bounce = bounce1 + bounce2;
            const damp = Math.exp(-3.4 * b) * (1 - b);
            wobble = Math.cos(b * Math.PI * 2.5) * damp;
          }

          return {
            x: tgtX,
            y: tgtY,
            lift: bounce,
            scale: 0.98 + bounce * 0.005,
            rx: endRx + wobble * 22 * spec.spinZSign,
            ry: endRy - wobble * 16 * spec.spinZSign,
            rz: wobble * 14 * spec.spinZSign,
            restYaw: spec.restYaw,
            tablePitch: 48,
          };
        }

        return {
          x: tgtX,
          y: tgtY,
          lift: 0,
          scale: 0.98,
          rx: endRx,
          ry: endRy,
          rz: 0,
          restYaw: spec.restYaw,
          tablePitch: 48,
        };
      });

      // Spawn trail particles during flight
      if (inFlight && now - lastParticleTime > 28) {
        lastParticleTime = now;
        diceFrames.forEach((df, idx) => {
          activeParticles.push({
            id: Math.random(),
            x: df.x + (Math.random() - 0.5) * 16,
            y: df.y - df.lift + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 0.5,
            size: Math.random() * 8 + 7,
            icon: trail.particleIcon || '✦',
            color: idx === 0 ? trail.color : (trail.secondaryColor || trail.color),
            opacity: 1,
            life: 1.0,
            decay: 0.05 + Math.random() * 0.03,
          });
        });
      }

      // Update particle decay
      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.opacity = Math.max(0, p.life);
        if (p.life <= 0) {
          activeParticles.splice(i, 1);
        }
      }

      setAnimState({
        diceFrames,
        opacity,
        skin,
        trail,
        trailPoints1: [...trailPoints1],
        trailPoints2: [...trailPoints2],
        particles: [...activeParticles],
        launchBurst: inFlight && elapsed < 190 ? {
          x: startX,
          y: startY,
          progress: elapsed / 190,
          color: roller?.avatarColor || skin?.palette?.border || '#38bdf8',
        } : null,
      });
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [lastDiceResult?.id]);

  // Determine active skin for numeric badge (tracks whoever rolled lastDiceResult)
  const pillRoller = lastDiceResult
    ? players.find((p) => p.id === lastDiceResult.playerId)
    : null;
  const pillSkin = DICE_SKIN_MAP[pillRoller?.diceSkin || diceSkin || 'classic_red'] || DICE_SKINS[0];
  const showNumericPill = Boolean(lastDiceResult && revealedRollId === lastDiceResult.id);

  return (
    <>
      {/* 3D Flying & Landed Dice Cubes with Motion Trail & Particles */}
      {animState && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 34,
            opacity: animState.opacity,
          }}
        >
          {/* SVG Motion Trail Ribbons */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 32,
            }}
          >
            {animState.trailPoints1?.length > 2 && (
              <polyline
                points={animState.trailPoints1.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={animState.trail?.color || '#38bdf8'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
                filter="blur(3px)"
              />
            )}
            {animState.trailPoints2?.length > 2 && (
              <polyline
                points={animState.trailPoints2.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={animState.trail?.secondaryColor || animState.trail?.color || '#ec4899'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
                filter="blur(3px)"
              />
            )}
          </svg>

          {/* Floating Trail Particles */}
          {animState.particles?.map((p) => (
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
                filter: `drop-shadow(0 0 5px ${p.color})`,
                pointerEvents: 'none',
                zIndex: 33,
              }}
            >
              {p.icon}
            </div>
          ))}

          {/* Launch Shockwave Ring */}
          {animState.launchBurst && (
            <div
              style={{
                position: 'absolute',
                left: `${animState.launchBurst.x}px`,
                top: `${animState.launchBurst.y}px`,
                width: `${28 + animState.launchBurst.progress * 42}px`,
                height: `${28 + animState.launchBurst.progress * 42}px`,
                borderRadius: '50%',
                border: `2.5px solid ${animState.launchBurst.color}`,
                opacity: Math.max(0, 1 - animState.launchBurst.progress),
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 18px ${animState.launchBurst.color}`,
              }}
            />
          )}

          {/* Flying & Landed Dice with Ground Contact Shadows */}
          {animState.diceFrames.map((df, i) => (
            <React.Fragment key={i}>
              {/* Ground Contact Shadow on Turf */}
              <div
                style={{
                  position: 'absolute',
                  left: `${df.x}px`,
                  top: `${df.y + 12}px`,
                  width: `${Math.max(22, 46 - df.lift * 0.16)}px`,
                  height: `${Math.max(10, 18 - df.lift * 0.05)}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(ellipse at center, rgba(0,0,0,${df.lift < 1 ? 0.56 : 0.42}) 0%, rgba(0,0,0,0) 72%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />

              {/* Centered perspective per die */}
              <div
                style={{
                  position: 'absolute',
                  left: `${df.x}px`,
                  top: `${df.y - df.lift}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 35,
                }}
              >
                <div style={{ perspective: '420px' }}>
                  <div
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `scale(${df.scale}) rotateX(${df.tablePitch}deg) rotateZ(${df.restYaw}deg)`,
                    }}
                  >
                    <DieCube3D size={46} skin={animState.skin} rx={df.rx} ry={df.ry} rz={df.rz} />
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Persistent Numeric Roll Results Pill (Anchored Above True Board Center) */}
      {showNumericPill && (
        <div
          key={lastDiceResult.id || `${lastDiceResult.d1}_${lastDiceResult.d2}`}
          style={{
            position: 'absolute',
            top: pillPos ? `${pillPos.y}px` : '36%',
            left: pillPos ? `${pillPos.x}px` : '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 18,
            padding: '10px 22px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.96) 100%)',
            border: lastDiceResult.isDoubles ? '2px solid #a855f7' : '2px solid #38bdf8',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: lastDiceResult.isDoubles
              ? '0 0 25px rgba(168, 85, 247, 0.5), 0 12px 30px rgba(0, 0, 0, 0.5)'
              : '0 0 22px rgba(56, 189, 248, 0.4), 0 12px 30px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
          }}
        >
          {lastDiceResult.rollKind === 'temple' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏛️</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                {t('templeRollPrefix', {}, 'TEMPLE ROLL:')}
              </span>
              <DieNumberBox value={lastDiceResult.d1} skin={pillSkin} />
              <span
                style={{
                  padding: '3px 9px',
                  borderRadius: '10px',
                  background: (lastDiceResult.d1 || 0) >= 4
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                    : 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '0.4px',
                }}
              >
                {(lastDiceResult.d1 || 0) >= 4 ? t('templeTreasureBadge', {}, '+300.000 CR TREASURE!') : t('trapped3TurnsUpper', {}, 'TRAPPED 3 TURNS')}
              </span>
            </div>
          ) : lastDiceResult.d2 === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🍅</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#f87171', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                {t('blindedRollPrefix', {}, 'BLINDED ROLL:')}
              </span>
              <DieNumberBox value={lastDiceResult.d1} skin={pillSkin} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DieNumberBox value={lastDiceResult.d1} skin={pillSkin} />
              <span style={{ color: '#94a3b8', fontSize: '15px', fontWeight: 800 }}>+</span>
              <DieNumberBox value={lastDiceResult.d2} skin={pillSkin} />
            </div>
          )}

          {lastDiceResult.rollKind !== 'temple' && (
            <>
              <span style={{ color: '#64748b', fontSize: '16px', fontWeight: 900 }}>=</span>

              {/* Big Total */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    letterSpacing: '-0.5px',
                    background: lastDiceResult.isDoubles
                      ? 'linear-gradient(180deg, #fef08a 0%, #facc15 100%)'
                      : 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: lastDiceResult.isDoubles ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.6))' : 'none',
                  }}
                >
                  {(lastDiceResult.d1 || 0) + (lastDiceResult.d2 || 0)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  {t('rollWord', {}, 'Roll')}
                </span>
              </div>
            </>
          )}

          {lastDiceResult.isDoubles && (
            <div
              style={{
                padding: '3px 8px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                letterSpacing: '0.5px',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)',
              }}
            >
              <Sparkles size={12} /> {t('doublesUpperExcl', {}, 'DOUBLES!')}
            </div>
          )}
        </div>
      )}
    </>
  );
}

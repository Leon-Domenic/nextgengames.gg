'use client';

import React from 'react';
import { DICE_SKINS } from '@/lib/board-brawl/diceSkins';

export const PIP_LAYOUTS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

// Base rotation to bring face value 1..6 to the front (+Z)
export const FACE_TARGET_ROT = {
  1: { rx: 0, ry: 0 },
  2: { rx: -90, ry: 0 },
  3: { rx: 0, ry: -90 },
  4: { rx: 0, ry: 90 },
  5: { rx: 90, ry: 0 },
  6: { rx: 0, ry: 180 },
};

function DiceFace({ value, faceTransform, half, radius, borderWidth, pipOneSize, pipOtherSize, skin }) {
  const pips = PIP_LAYOUTS[value] || PIP_LAYOUTS[1];
  const pipColor =
    value === 1 || value === 4
      ? (skin.palette?.pip || '#ffffff')
      : (skin.palette?.pipAlt || skin.palette?.pip || '#ffffff');
  const dotSize = value === 1 ? pipOneSize : pipOtherSize;

  const isGold = skin.id === 'golden_vegas';
  const isCyber = skin.id === 'cyber_neon';
  const isMagma = skin.id === 'obsidian_flame';
  const isCosmic = skin.id === 'amethyst_galaxy';
  const isFrost = skin.id === 'arctic_frost';

  // Customized face gradient for distinctive visual finishes
  const faceBg = isGold
    ? `linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)`
    : isCyber
    ? `linear-gradient(145deg, #090d16 0%, #030712 100%)`
    : isFrost
    ? `linear-gradient(135deg, #0284c7 0%, #38bdf8 60%, #0369a1 100%)`
    : `linear-gradient(145deg, ${skin.palette?.body || '#dc2626'} 0%, ${skin.palette?.border || '#991b1b'} 100%)`;

  const faceBorder = isCyber
    ? `${borderWidth}px solid rgba(0, 240, 255, 0.7)`
    : isGold
    ? `${borderWidth}px solid rgba(254, 240, 138, 0.7)`
    : `${borderWidth}px solid rgba(255, 255, 255, 0.38)`;

  const pipGlow = isCyber
    ? `0 0 6px ${pipColor}, 0 0 10px ${pipColor}aa`
    : isMagma
    ? `0 0 5px ${pipColor}, 0 1px 2px rgba(0,0,0,0.8)`
    : isCosmic
    ? `0 0 5px ${pipColor}, 0 1px 2px rgba(0,0,0,0.5)`
    : isGold
    ? `inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0,0,0,0.9)`
    : `0 1px 2px rgba(0, 0, 0, 0.45), 0 0 5px ${pipColor}66`;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: `${radius}px`,
        background: faceBg,
        border: faceBorder,
        boxShadow: isGold
          ? 'inset 0 2px 7px rgba(255, 255, 200, 0.5), inset 0 -2px 6px rgba(180, 83, 9, 0.5)'
          : isCyber
          ? 'inset 0 0 8px rgba(0, 240, 255, 0.25), inset 0 2px 5px rgba(255, 255, 255, 0.2)'
          : 'inset 0 2px 5px rgba(255, 255, 255, 0.32), inset 0 -2px 5px rgba(0, 0, 0, 0.36)',
        transform: `${faceTransform} translateZ(${half}px)`,
        backfaceVisibility: 'hidden',
      }}
    >
      {pips.map(([px, py], i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${px}%`,
            top: `${py}%`,
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            borderRadius: '50%',
            background: pipColor,
            boxShadow: pipGlow,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Reusable pure-CSS 3D die cube used in the shop showcase, catalog grid,
 * flying dice roll overlay, and lobby player cards.
 */
export default function DieCube3D({
  size = 50,
  skin = DICE_SKINS[0],
  rx = -24,
  ry = 34,
  rz = 0,
  spin = false,
  spinDuration = '8s',
}) {
  const activeSkin = skin || DICE_SKINS[0];
  const half = size / 2;
  const radius = size >= 40 ? Math.round(size * 0.12) : Math.max(2, Math.round(size * 0.11));
  const coreInset = size >= 40 ? 2 : 1;
  const coreHalf = Math.max(4, half - coreInset);
  const coreColor = activeSkin.palette?.border || activeSkin.palette?.body || '#991b1b';
  const borderWidth = size >= 40 ? 1.5 : 1;
  const pipOneSize = Math.max(4.5, +(size * 0.24).toFixed(1));
  const pipOtherSize = Math.max(3.2, +(size * 0.18).toFixed(1));

  return (
    <>
      {spin && (
        <style>{`
          @keyframes nggDieCube3DSpin {
            0%   { transform: rotateX(-22deg) rotateY(20deg) rotateZ(-4deg); }
            50%  { transform: rotateX(-28deg) rotateY(200deg) rotateZ(4deg); }
            100% { transform: rotateX(-22deg) rotateY(380deg) rotateZ(-4deg); }
          }
        `}</style>
      )}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: spin ? undefined : `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
          animation: spin ? `nggDieCube3DSpin ${spinDuration} linear infinite` : undefined,
        }}
      >
        {/* Solid opaque inner core seals beveled seams from any 3D angle */}
        {[
          'rotateY(0deg)',
          'rotateY(180deg)',
          'rotateY(90deg)',
          'rotateY(-90deg)',
          'rotateX(90deg)',
          'rotateX(-90deg)',
        ].map((tf, i) => (
          <div
            key={`core-${i}`}
            style={{
              position: 'absolute',
              inset: `${coreInset}px`,
              background: coreColor,
              transform: `${tf} translateZ(${coreHalf}px)`,
            }}
          />
        ))}
        <DiceFace value={1} faceTransform="rotateY(0deg)" half={half} radius={radius} borderWidth={borderWidth} pipOneSize={pipOneSize} pipOtherSize={pipOtherSize} skin={activeSkin} />
        <DiceFace value={6} faceTransform="rotateY(180deg)" half={half} radius={radius} borderWidth={borderWidth} pipOneSize={pipOneSize} pipOtherSize={pipOtherSize} skin={activeSkin} />
        <DiceFace value={3} faceTransform="rotateY(90deg)" half={half} radius={radius} borderWidth={borderWidth} pipOneSize={pipOneSize} pipOtherSize={pipOtherSize} skin={activeSkin} />
        <DiceFace value={4} faceTransform="rotateY(-90deg)" half={half} radius={radius} borderWidth={borderWidth} pipOneSize={pipOneSize} pipOtherSize={pipOtherSize} skin={activeSkin} />
        <DiceFace value={2} faceTransform="rotateX(90deg)" half={half} radius={radius} borderWidth={borderWidth} pipOneSize={pipOneSize} pipOtherSize={pipOtherSize} skin={activeSkin} />
        <DiceFace value={5} faceTransform="rotateX(-90deg)" half={half} radius={radius} borderWidth={borderWidth} pipOneSize={pipOneSize} pipOtherSize={pipOtherSize} skin={activeSkin} />
      </div>
    </>
  );
}

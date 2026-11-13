'use client';

import React, { useEffect, useId, useState } from 'react';

const MASKED_PAWN_CACHE = new Map();
const MASKED_PAWN_INFLIGHT = new Map();
const PAWN_ASSET_VER = '5';

function parseHexColor01(hex) {
  const clean = String(hex || '#00f0ff').replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) / 255,
      parseInt(clean[1] + clean[1], 16) / 255,
      parseInt(clean[2] + clean[2], 16) / 255,
    ];
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [r / 255, g / 255, b / 255];
    }
  }
  return [0, 240 / 255, 1];
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function compositeMaskedPawnDataUrl(pawnSrc, pawnMaskSrc, colorHex, maskLumaFloor = 0.0) {
  const lumaFloor = Number.isFinite(maskLumaFloor) ? Math.max(0, Math.min(1, maskLumaFloor)) : 0;
  const key = `${pawnSrc}|${pawnMaskSrc}|${colorHex}|${lumaFloor}`;
  const cached = MASKED_PAWN_CACHE.get(key);
  if (cached) return Promise.resolve(cached);
  const inflight = MASKED_PAWN_INFLIGHT.get(key);
  if (inflight) return inflight;

  const job = (async () => {
    const [baseImg, maskImg] = await Promise.all([
      loadImage(`${pawnSrc}?v=${PAWN_ASSET_VER}`),
      loadImage(`${pawnMaskSrc}?v=${PAWN_ASSET_VER}`),
    ]);
    const w = baseImg.naturalWidth || baseImg.width;
    const h = baseImg.naturalHeight || baseImg.height;
    if (!w || !h) return null;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(maskImg, 0, 0, w, h);
    const maskData = ctx.getImageData(0, 0, w, h).data;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseImg, 0, 0, w, h);
    const baseImageData = ctx.getImageData(0, 0, w, h);
    const baseData = baseImageData.data;

    const [cr, cg, cb] = parseHexColor01(colorHex);

    for (let i = 0; i < baseData.length; i += 4) {
      const ba = baseData[i + 3] / 255;
      if (ba < 0.005) continue;
      const ma = maskData[i + 3] / 255;
      if (ma <= 0.004) continue;

      const maskW = Math.max(0, Math.min(1, ma / Math.max(ba, 0.0001)));
      const rawShade = Math.max(0, Math.min(1, maskData[i] / 255));
      const shade = lumaFloor + (1 - lumaFloor) * rawShade;
      const spec = smoothstep(0.76, 1.0, rawShade) * 0.14;

      const tr = Math.max(0, Math.min(1, cr * shade + spec));
      const tg = Math.max(0, Math.min(1, cg * shade + spec));
      const tb = Math.max(0, Math.min(1, cb * shade + spec));

      const br = baseData[i] / 255;
      const bg = baseData[i + 1] / 255;
      const bb = baseData[i + 2] / 255;

      baseData[i] = Math.round((br * (1 - maskW) + tr * maskW) * 255);
      baseData[i + 1] = Math.round((bg * (1 - maskW) + tg * maskW) * 255);
      baseData[i + 2] = Math.round((bb * (1 - maskW) + tb * maskW) * 255);
    }

    ctx.putImageData(baseImageData, 0, 0);
    const url = canvas.toDataURL('image/png');
    MASKED_PAWN_CACHE.set(key, url);
    return url;
  })()
    .catch(() => null)
    .finally(() => {
      MASKED_PAWN_INFLIGHT.delete(key);
    });

  MASKED_PAWN_INFLIGHT.set(key, job);
  return job;
}

/**
 * Renders a stylized 2D tabletop character figurine in the lobby player card.
 * - Characters with a custom `pawn` sprite render their transparent 2.5D figurine (`/pawns/*.png`)
 *   with subtle character-appropriate idle animations.
 * - Portrait-only characters render a sculpted collector-bust figurine without a square box.
 * - Remaining emblem/starter tokens render bespoke shaded 2D SVG pawns tinted to the player's color.
 */
function getPawnIdleAnimation(id) {
  switch (id) {
    case 'goose':
    case 'brawler':
      return 'nggPawnSwagger 2.4s ease-in-out infinite';
    case 'sloth':
      return 'nggPawnChillSway 4.8s ease-in-out infinite';
    case 'unicorn':
    case 'rocket':
    case 'mystic':
    case 'diamond':
    case 'fairydog':
      return 'nggPawnHover 3.0s ease-in-out infinite';
    case 'car':
    case 'yacht':
      return 'nggPawnCruise 2.8s ease-in-out infinite';
    case 'lobster':
    case 'duck':
      return 'nggPawnJaunty 3.1s ease-in-out infinite';
    default:
      return 'nggPawnFloat 3.4s ease-in-out infinite';
  }
}
function renderTopper(id, colorHex, gradPrefix) {
  switch (id) {
    case 'diamond':
      return (
        <g transform="translate(70, 50)">
          <polygon points="0,-34 28,-10 18,22 -18,22 -28,-10" fill={`url(#${gradPrefix}-gem)`} stroke="#e0f2fe" strokeWidth="1.8" />
          <polygon points="0,-34 12,-10 -12,-10" fill="#bae6fd" opacity="0.8" />
          <polygon points="-12,-10 12,-10 0,22" fill="#38bdf8" opacity="0.85" />
          <polygon points="-28,-10 -12,-10 0,22 -18,22" fill="#0284c7" opacity="0.72" />
          <polygon points="28,-10 12,-10 0,22 18,22" fill="#0369a1" opacity="0.72" />
          <path d="M-20,20 L20,20 L16,28 L-16,28 Z" fill={`url(#${gradPrefix}-gold)`} />
        </g>
      );
    case 'hat':
      return (
        <g transform="translate(70, 52)">
          <ellipse cx="0" cy="18" rx="34" ry="8" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
          <path d="M-20,16 L-16,-24 Q0,-29 16,-24 L20,16 Z" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
          <path d="M-19,8 L19,8 L20,15 L-20,15 Z" fill={`url(#${gradPrefix}-gold)`} />
          <circle cx="12" cy="30" r="8.5" fill="rgba(56, 189, 248, 0.25)" stroke="#fbbf24" strokeWidth="2.4" />
          <path d="M19,35 Q24,44 20,52" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case 'robot':
      return (
        <g transform="translate(70, 52)">
          <line x1="0" y1="-26" x2="0" y2="-38" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="-40" r="4.5" fill={colorHex} stroke="#ffffff" strokeWidth="1.2" />
          <rect x="-26" y="-26" width="52" height="44" rx="14" fill={`url(#${gradPrefix}-steel)`} stroke="#cbd5e1" strokeWidth="1.8" />
          <rect x="-18" y="-12" width="36" height="14" rx="7" fill="#0f172a" />
          <circle cx="-8" cy="-5" r="4" fill="#38bdf8" />
          <circle cx="8" cy="-5" r="4" fill="#38bdf8" />
          <rect x="-10" y="7" width="20" height="4" rx="2" fill={colorHex} opacity="0.9" />
        </g>
      );
    case 'crown':
      return (
        <g transform="translate(70, 54)">
          <path d="M-28,16 L-30,-14 L-14,0 L0,-26 L14,0 L30,-14 L28,16 Z" fill={`url(#${gradPrefix}-gold)`} stroke="#fef08a" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="-30" cy="-16" r="4" fill="#fef08a" />
          <circle cx="0" cy="-28" r="5" fill="#fef08a" />
          <circle cx="30" cy="-16" r="4" fill="#fef08a" />
          <circle cx="0" cy="4" r="5.5" fill="#e11d48" stroke="#fef08a" strokeWidth="1.4" />
          <circle cx="-16" cy="7" r="3.5" fill="#0284c7" stroke="#fef08a" strokeWidth="1" />
          <circle cx="16" cy="7" r="3.5" fill="#0284c7" stroke="#fef08a" strokeWidth="1" />
          <rect x="-29" y="14" width="58" height="8" rx="4" fill="#b45309" />
        </g>
      );
    case 'brawler':
      return (
        <g transform="translate(70, 50)">
          <path d="M-24,4 C-28,-22 -8,-30 12,-24 C26,-20 28,-2 22,14 L18,24 L-18,24 Z" fill="#dc2626" stroke="#fecaca" strokeWidth="1.6" />
          <ellipse cx="-14" cy="-2" rx="9" ry="12" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
          <path d="M-6,-14 Q6,-16 14,-8" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <rect x="-20" y="18" width="40" height="10" rx="3" fill={`url(#${gradPrefix}-gold)`} />
        </g>
      );
    case 'car':
      return (
        <g transform="translate(70, 52)">
          <circle cx="0" cy="-2" r="26" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M-20,-6 L20,-6 L17,8 Q0,14 -17,8 Z" fill={colorHex} stroke="#ffffff" strokeWidth="1.4" />
          <rect x="-3" y="-27" width="6" height="20" rx="2" fill="#ef4444" />
          <path d="M-24,14 L24,14 L20,24 L-20,24 Z" fill="#1e293b" />
        </g>
      );
    case 'yacht':
      return (
        <g transform="translate(70, 52)">
          <path d="M-30,-4 L0,-24 L30,-4 L22,12 L-22,12 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="-24" y="8" width="48" height="7" rx="2" fill="#0f172a" />
          <path d="M-18,15 L18,15 L14,20 L-14,20 Z" fill="#020617" />
          <circle cx="0" cy="-8" r="6.5" fill={`url(#${gradPrefix}-gold)`} />
        </g>
      );
    case 'rocket':
      return (
        <g transform="translate(70, 52)">
          <circle cx="0" cy="-4" r="27" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          <ellipse cx="0" cy="-3" rx="19" ry="15" fill={`url(#${gradPrefix}-gold)`} stroke="#fbbf24" strokeWidth="1.6" />
          <path d="M-10,-10 Q-3,-14 6,-10" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          <rect x="-22" y="18" width="44" height="8" rx="4" fill={colorHex} />
        </g>
      );
    case 'mystic':
      return (
        <g transform="translate(70, 48)">
          <circle cx="0" cy="-4" r="22" fill={`url(#${gradPrefix}-mystic)`} stroke="#f5d0fe" strokeWidth="1.8" />
          <circle cx="-7" cy="-11" r="6" fill="#ffffff" opacity="0.45" />
          <path d="M-22,10 Q0,28 22,10 L14,26 L-14,26 Z" fill={`url(#${gradPrefix}-gold)`} />
        </g>
      );
    case 'businesswoman':
      return (
        <g transform="translate(70, 52)">
          <rect x="-20" y="-22" width="40" height="44" rx="7" fill="#0f172a" stroke={colorHex} strokeWidth="2.2" />
          <rect x="-13" y="-13" width="26" height="18" rx="3" fill="#38bdf8" opacity="0.85" />
          <line x1="-8" y1="12" x2="8" y2="12" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case 'businessman':
    default:
      return (
        <g transform="translate(70, 52)">
          <path d="M-10,-16 L-10,-24 L10,-24 L10,-16" fill="none" stroke={`url(#${gradPrefix}-gold)`} strokeWidth="4" strokeLinecap="round" />
          <rect x="-26" y="-16" width="52" height="38" rx="7" fill="#78350f" stroke="#d97706" strokeWidth="1.8" />
          <line x1="-25" y1="0" x2="25" y2="0" stroke="#451a03" strokeWidth="2" />
          <rect x="-12" y="-3" width="6" height="7" rx="1.5" fill="#fbbf24" />
          <rect x="6" y="-3" width="6" height="7" rx="1.5" fill="#fbbf24" />
        </g>
      );
  }
}

export default function CharacterPawn2D({
  character,
  colorHex = '#00f0ff',
  size = 160,
  animate = true,
}) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');

  const pawnSrc = character?.pawn || (character?.id === 'pigeon' ? '/pawns/cantino.png' : null);
  const pawnMaskSrc = character?.pawnMask || null;
  const maskLumaFloor = Number.isFinite(character?.maskLumaFloor)
    ? Math.max(0, Math.min(1, character.maskLumaFloor))
    : 0.0;
  const cacheKey = pawnSrc && pawnMaskSrc ? `${pawnSrc}|${pawnMaskSrc}|${colorHex}|${maskLumaFloor}` : null;
  const cachedTintedSrc = cacheKey ? MASKED_PAWN_CACHE.get(cacheKey) || null : null;
  const [tintedSrc, setTintedSrc] = useState(cachedTintedSrc);

  useEffect(() => {
    if (!cacheKey) {
      setTintedSrc(null);
      return undefined;
    }
    const hit = MASKED_PAWN_CACHE.get(cacheKey);
    if (hit) {
      setTintedSrc(hit);
      return undefined;
    }
    let cancelled = false;
    compositeMaskedPawnDataUrl(pawnSrc, pawnMaskSrc, colorHex, maskLumaFloor).then((url) => {
      if (!cancelled && url) setTintedSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, pawnSrc, pawnMaskSrc, colorHex, maskLumaFloor]);

  if (!character) return null;

  // Bespoke 2.5D transparent sprite figurine
  if (pawnSrc) {
    const resolvedSrc = cacheKey ? cachedTintedSrc || tintedSrc || `${pawnSrc}?v=${PAWN_ASSET_VER}` : `${pawnSrc}?v=${PAWN_ASSET_VER}`;
    return (
      <>
        <style>{`
          @keyframes nggPawnFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          @keyframes nggPawnHover {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-7px) scale(1.018); }
          }
          @keyframes nggPawnSwagger {
            0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
            50% { transform: translateY(-4px) rotate(1.5deg); }
          }
          @keyframes nggPawnChillSway {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50% { transform: translateY(-3px) rotate(1deg); }
          }
          @keyframes nggPawnCruise {
            0%, 100% { transform: translate(0px, 0px); }
            50% { transform: translate(2px, -3px); }
          }
          @keyframes nggPawnJaunty {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-4px) rotate(-1deg); }
            75% { transform: translateY(-3px) rotate(1deg); }
          }
        `}</style>
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: animate ? getPawnIdleAnimation(character.id) : 'none',
            pointerEvents: 'none',
          }}
        >
          <img
            src={resolvedSrc}
            alt={character.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 14px rgba(15, 23, 42, 0.34))',
              userSelect: 'none',
            }}
            draggable={false}
          />
        </div>
      </>
    );
  }

  // Sculpted collector-bust 2D figurine for portrait characters (Rudolf, Barnaby, etc.)
  if (character.avatar) {
    const clipId = `bust-clip-${uid}`;
    return (
      <>
        <style>{`
          @keyframes nggPawnFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
        `}</style>
        <svg
          width={size * 0.84}
          height={size}
          viewBox="0 0 140 175"
          style={{
            overflow: 'visible',
            filter: 'drop-shadow(0 10px 14px rgba(15, 23, 42, 0.32))',
            animation: animate ? 'nggPawnFloat 3.4s ease-in-out infinite' : 'none',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <linearGradient id={`${uid}-cloak`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorHex} />
              <stop offset="55%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <clipPath id={clipId}>
              <circle cx="70" cy="62" r="46" />
            </clipPath>
          </defs>

          {/* Sculpted Pawn Torso & Collar */}
          <path
            d="M36,162 C36,120 48,100 70,100 C92,100 104,120 104,162 Q70,170 36,162 Z"
            fill={`url(#${uid}-cloak)`}
            stroke={colorHex}
            strokeWidth="2.5"
          />
          {/* Gold Cloak Trim & Center Crest */}
          <path d="M52,108 L70,128 L88,108" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="70" cy="134" r="6" fill={`url(#${uid}-gold)`} stroke="#ffffff" strokeWidth="1.2" />

          {/* Portrait Bust Medallion */}
          <circle cx="70" cy="62" r="49" fill={`url(#${uid}-gold)`} />
          <circle cx="70" cy="62" r="46" fill="#0f172a" />
          <image
            href={character.avatar}
            x="24"
            y="16"
            width="92"
            height="92"
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMin slice"
          />
          <circle cx="70" cy="62" r="46" fill="none" stroke={colorHex} strokeWidth="2.6" />
        </svg>
      </>
    );
  }

  // Sculpted 2D Vector Tabletop Pawn Illustration for all classic / emblem characters
  return (
    <>
      <style>{`
        @keyframes nggPawnFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <svg
        width={size * 0.84}
        height={size}
        viewBox="0 0 140 175"
        style={{
          overflow: 'visible',
          filter: 'drop-shadow(0 10px 14px rgba(15, 23, 42, 0.30))',
          animation: animate ? 'nggPawnFloat 3.4s ease-in-out infinite' : 'none',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id={`${uid}-body`} x1="15%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="28%" stopColor={colorHex} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="45%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id={`${uid}-steel`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id={`${uid}-gem`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="45%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <radialGradient id={`${uid}-mystic`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fae8ff" />
            <stop offset="45%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#6b21a8" />
          </radialGradient>
        </defs>

        {/* Sculpted Pawn Torso */}
        <path
          d="M42,158 C42,126 52,102 58,84 L82,84 C88,102 98,126 98,158 Q70,168 42,158 Z"
          fill={`url(#${uid}-body)`}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.6"
        />
        {/* Sculpted Collar Rim */}
        <ellipse cx="70" cy="84" rx="20" ry="6" fill={`url(#${uid}-gold)`} stroke="#fef08a" strokeWidth="1" />
        {/* Chest Glossy Rim Highlight */}
        <path
          d="M52,148 C53,124 58,104 62,92"
          fill="none"
          stroke="rgba(255,255,255,0.48)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Character Topper / Emblem Bust */}
        {renderTopper(character.id, colorHex, uid)}
      </svg>
    </>
  );
}

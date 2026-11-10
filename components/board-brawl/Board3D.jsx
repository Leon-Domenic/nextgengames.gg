'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TILES, formatCash } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { Sparkles } from 'lucide-react';
import {
  create3DHouse,
  create3DHotel,
  create3DLandmark,
  create3DResortAccent,
  createOwnerCrest,
  createProceduralPawn,
  generateDiceMaterials,
  create3DStartMonument,
  create3DPrisonMonument,
  create3DIslandMonument,
  create3DChampionshipMonument,
  create3DWorldTourMonument,
  create3DBanknoteStack,
} from '@/lib/board-brawl/pawnModels3D';
import { drawVectorFlag } from '@/lib/board-brawl/flags';

// Authentic Monopoly 45-Degree Diamond Perimeter Math
// 4 Sides with Square Corner Fields and Outward-Facing Cards
export function getTile3DPos(id, totalTiles = 32) {
  const R_outer = 56;
  const trackDepth = 13.0; // Elongated tiles leaving spacious lots for 3D houses
  const tilesPerSide = Math.max(1, Math.floor(totalTiles / 4));
  const numStreetTiles = Math.max(1, tilesPerSide - 1);
  const sideLength = R_outer * Math.SQRT2; // ~79.2 units
  const streetSpan = sideLength - 2 * trackDepth; // ~62.2 units
  const streetWidth = streetSpan / numStreetTiles; // ~5.65 units for 48 tiles

  const apexes = [
    new THREE.Vector2(0, R_outer),      // Corner 0: South (START)
    new THREE.Vector2(-R_outer, 0),     // Corner 1: West (LOST ISLAND / PRISON)
    new THREE.Vector2(0, -R_outer),     // Corner 2: North (CHAMPIONSHIPS / FESTIVAL)
    new THREE.Vector2(R_outer, 0),      // Corner 3: East (WORLD TOUR / AIRPORT)
  ];

  // Outward-facing track rotations:
  // Ensures card top (color header) points to the outside of the board,
  // and card bottom (price pill / track stripe) points to the inside (lawn).
  const sideRotations = [
    (3 * Math.PI) / 4,   // Side 0 (South -> West): color header faces outward
    Math.PI / 4,         // Side 1 (West -> North): color header faces outward
    -Math.PI / 4,        // Side 2 (North -> East): color header faces outward
    (-3 * Math.PI) / 4,  // Side 3 (East -> South): color header faces outward
  ];

  // Corner orientations: aligned with the diamond sides (45-degree angle) so edges are 100% flush!
  const cornerRotations = [
    -Math.PI / 4,        // Corner 0 (South)
    (-3 * Math.PI) / 4,  // Corner 1 (West)
    (3 * Math.PI) / 4,   // Corner 2 (North)
    Math.PI / 4,         // Corner 3 (East)
  ];

  // Canvas rotation so corner header / artwork faces outward toward its respective apex
  const cornerCanvasAngles = [
    -Math.PI / 4,        // Corner 0 (South)
    Math.PI / 4,         // Corner 1 (West)
    (3 * Math.PI) / 4,   // Corner 2 (North)
    (-3 * Math.PI) / 4,  // Corner 3 (East)
  ];

  const side = Math.floor(id / tilesPerSide) % 4;
  const indexInSide = id % tilesPerSide;

  if (indexInSide === 0) {
    // Corner square: trackDepth x trackDepth
    const apex = apexes[side];
    const u_inward = apex.clone().negate().normalize();
    const center = apex.clone().add(u_inward.multiplyScalar(trackDepth / Math.SQRT2));

    return {
      x: center.x,
      z: center.y,
      rotationY: cornerRotations[side],
      canvasAngle: cornerCanvasAngles[side],
      isCorner: true,
      width: trackDepth,
      length: trackDepth,
      side,
      indexInSide,
    };
  } else {
    // Street tile rectangle: streetWidth x trackDepth
    const pStart = apexes[side];
    const pEnd = apexes[(side + 1) % 4];
    const u_edge = new THREE.Vector2().subVectors(pEnd, pStart).normalize();

    // Perpendicular inward unit vector
    const mid = new THREE.Vector2().addVectors(pStart, pEnd).multiplyScalar(0.5);
    let u_in = new THREE.Vector2(-u_edge.y, u_edge.x);
    if (u_in.dot(mid) > 0) u_in.negate();

    const s = trackDepth + (indexInSide - 0.5) * streetWidth;
    const p_outer = pStart.clone().add(u_edge.clone().multiplyScalar(s));
    const p_center = p_outer.clone().add(u_in.clone().multiplyScalar(trackDepth / 2));

    return {
      x: p_center.x,
      z: p_center.y,
      rotationY: sideRotations[side],
      canvasAngle: 0,
      isCorner: false,
      width: streetWidth,
      length: trackDepth,
      side,
      indexInSide,
    };
  }
}

// Compute accurate 3D position for player pawns along the outer street zone
// Compute accurate 3D position for player pawns inside the off-board PRISON FIELD
export function getPrisonField3DPos(playerIndex = 0, totalPlayers = 4) {
  const PRISON_CENTER = new THREE.Vector3(-58, 0.95, 14);
  const padOffsets = [
    [-1.0, -0.6],
    [1.0, -0.6],
    [-1.0, 0.6],
    [1.0, 0.6],
  ];
  const [px, pz] = padOffsets[playerIndex % padOffsets.length];
  const cos = Math.cos(Math.PI / 4);
  const sin = Math.sin(Math.PI / 4);
  const rx = px * cos - pz * sin;
  const rz = px * sin + pz * cos;
  return new THREE.Vector3(PRISON_CENTER.x + rx, PRISON_CENTER.y, PRISON_CENTER.z + rz);
}

export function getPawnTile3DPos(id, totalTiles = 32, subOffset = null) {
  const p = getTile3DPos(id, totalTiles);
  const pos = new THREE.Vector3(p.x, 0.35, p.z);
  if (!p.isCorner) {
    const streetOffset = new THREE.Vector3(0, 0, -4.0);
    streetOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
    pos.add(streetOffset);
  }
  if (subOffset) {
    pos.add(subOffset);
  }
  return pos;
}


// ============================================================================
// DYNAMIC 2D CANVAS TEXTURE RENDERER (Business Tour High-Contrast Style)
// Automatically renders dynamic rent badges on the inner rim of street tiles
// that update in real-time when houses are built or festivals are hosted.
// ============================================================================

// ============================================================================
// DISTRICT PAVING RENDERER (Distinct Ground Textures Per Color Group)
// Cobblestone vs Stone vs Bricks vs Terracotta vs Granite vs Marble vs Slate
// ============================================================================
function drawDistrictEstateLot(ctx, colorGroup, x, y, w, h) {
  ctx.save();

  // Outer estate lot background clip / fill
  if (colorGroup === 'brown') {
    // ----------------------------------------------------
    // 1. BROWN: Polished Rich Timber Plank Decking (Matches South street in reference screenshot!)
    // ----------------------------------------------------
    ctx.fillStyle = '#2d1a0f'; // Deep timber foundation
    ctx.fillRect(x, y, w, h);

    // Patio boundary
    ctx.fillStyle = '#4a2e18'; // Rich mahogany wood base
    ctx.beginPath();
    ctx.roundRect(x + 18, y + 22, w - 36, h - 40, 16);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#6d4c41';
    ctx.stroke();

    // Procedural Polished Wooden Planks with Grain Lines & Brass Nails
    const plankH = 46;
    const woodColors = ['#5d4037', '#4e342e', '#6d4c41', '#3e2723'];
    let pIdx = 0;
    for (let py = y + 28; py < y + h - 25; py += plankH) {
      ctx.fillStyle = woodColors[pIdx % woodColors.length];
      ctx.fillRect(x + 22, py, w - 44, plankH - 4);

      // Wood grain fine highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x + 22, py + 2, w - 44, 3);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x + 22, py + plankH - 6, w - 44, 2);

      // Plank dividing line
      ctx.strokeStyle = '#2d1a0f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 20, py + plankH - 2);
      ctx.lineTo(x + w - 20, py + plankH - 2);
      ctx.stroke();

      // Brass nail studs on ends of planks
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(x + 36, py + (plankH / 2) - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(x + w - 36, py + (plankH / 2) - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      pIdx++;
    }

  } else if (colorGroup === 'light_blue') {
    // ----------------------------------------------------
    // 2. LIGHT BLUE: Bohemian Flagstone & Cut Ashlar Stone (Prague, Vienna)
    // ----------------------------------------------------
    ctx.fillStyle = '#e0f2fe'; // Cool sky limestone base
    ctx.fillRect(x, y, w, h);

    // Patio boundary
    ctx.fillStyle = '#f0f9ff';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 25, w - 40, h - 45, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();

    // Large interlocking rectangular ashlar flagstones
    const stoneColors = ['#e0f2fe', '#f8fafc', '#bae6fd', '#f1f5f9'];
    const rowH = 44;
    let rowIndex = 0;
    for (let ry = y + 35; ry < y + h - 35; ry += rowH) {
      const offsets = [0, 28, 56, 14][rowIndex % 4];
      for (let rx = x + 25 + offsets; rx < x + w - 35; rx += 68) {
        const stoneW = 62;
        const stoneH = 38;
        ctx.fillStyle = stoneColors[(rx + ry) % stoneColors.length];
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(rx, ry, stoneW, stoneH, 6);
        ctx.fill();
        ctx.stroke();

        // Fine stone texture bevel
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx + 3, ry + 3, stoneW - 6, stoneH - 6);
      }
      rowIndex++;
    }

  } else if (colorGroup === 'pink') {
    // ----------------------------------------------------
    // 3. PINK: Mediterranean Terracotta Clay Tiles (Madrid, Rome)
    // ----------------------------------------------------
    ctx.fillStyle = '#fce7f3'; // Soft rose mortar
    ctx.fillRect(x, y, w, h);

    // Patio boundary
    ctx.fillStyle = '#ffedd5'; // Sun-baked terracotta base
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 25, w - 40, h - 45, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ec4899';
    ctx.stroke();

    // Warm Spanish & Italian square terracotta tiles
    const tileColors = ['#fed7aa', '#ffedd5', '#fdba74', '#fbcfe8'];
    const tileSize = 38;
    for (let ty = y + 36; ty < y + h - 35; ty += tileSize + 6) {
      for (let tx = x + 30; tx < x + w - 35; tx += tileSize + 6) {
        const seed = (tx * 13 + ty * 29) % tileColors.length;
        ctx.fillStyle = tileColors[seed];
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tileSize, tileSize, 5);
        ctx.fill();
        ctx.stroke();

        // Terracotta sun warmth radial gradient
        const radial = ctx.createRadialGradient(tx + 12, ty + 12, 2, tx + 19, ty + 19, 22);
        radial.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        radial.addColorStop(1, 'rgba(236, 72, 153, 0.15)');
        ctx.fillStyle = radial;
        ctx.fill();
      }
    }

  } else if (colorGroup === 'orange') {
    // ----------------------------------------------------
    // 4. ORANGE: Dutch Clinker Brick Pavers (Berlin, Amsterdam)
    // ----------------------------------------------------
    ctx.fillStyle = '#ffedd5'; // Sand mortar base
    ctx.fillRect(x, y, w, h);

    // Patio boundary
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 25, w - 40, h - 45, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f97316';
    ctx.stroke();

    // Classic Dutch running-bond red/orange brick paving
    const brickHues = ['#fb923c', '#ea580c', '#fdba74', '#c2410c', '#f97316'];
    const bHeight = 24;
    const bWidth = 50;
    let bRow = 0;
    for (let by = y + 34; by < y + h - 35; by += bHeight + 4) {
      const isStaggered = bRow % 2 === 1;
      const startX = x + 26 + (isStaggered ? (bWidth / 2) : 0);
      for (let bx = startX; bx < x + w - 30; bx += bWidth + 5) {
        const seed = (bx * 7 + by * 23) % brickHues.length;
        ctx.fillStyle = brickHues[seed];
        ctx.strokeStyle = '#9a3412';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, bWidth, bHeight, 4);
        ctx.fill();
        ctx.stroke();

        // Brick top edge bevel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(bx + 2, by + 2, bWidth - 4, 3);
      }
      bRow++;
    }

  } else if (colorGroup === 'red') {
    // ----------------------------------------------------
    // 5. RED: Victorian & Parisian Herringbone Brick (London, Paris)
    // ----------------------------------------------------
    ctx.fillStyle = '#fee2e2'; // Pale stone base
    ctx.fillRect(x, y, w, h);

    // Patio boundary
    ctx.fillStyle = '#fef2f2';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 25, w - 40, h - 45, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();

    // Elegant 45-degree herringbone interlocking brick paving
    const redHues = ['#ef4444', '#dc2626', '#b91c1c', '#f87171', '#991b1b'];
    const pStep = 32;
    for (let py = y + 36; py < y + h - 35; py += pStep) {
      for (let px = x + 30; px < x + w - 35; px += pStep) {
        const seed = (px * 11 + py * 19) % redHues.length;
        ctx.fillStyle = redHues[seed];
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2;

        // Diagonal brick pair
        ctx.beginPath();
        ctx.roundRect(px, py, 26, 12, 3);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(px + 14, py + 14, 12, 26, 3);
        ctx.fill();
        ctx.stroke();
      }
    }

  } else if (colorGroup === 'yellow') {
    // ----------------------------------------------------
    // 6. YELLOW: Tokyo / Seoul Modern Granite Plaza (Tokyo, Seoul)
    // ----------------------------------------------------
    ctx.fillStyle = '#fef9c3'; // Golden granite base
    ctx.fillRect(x, y, w, h);

    // Patio boundary
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 25, w - 40, h - 45, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#eab308';
    ctx.stroke();

    // Polished square Japanese granite slabs with precision expansion joints
    const gSize = 54;
    const gHues = ['#fefce8', '#fef08a', '#fef9c3', '#ffffff'];
    for (let gy = y + 36; gy < y + h - 35; gy += gSize + 6) {
      for (let gx = x + 30; gx < x + w - 35; gx += gSize + 6) {
        const seed = (gx + gy) % gHues.length;
        ctx.fillStyle = gHues[seed];
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(gx, gy, gSize, gSize, 6);
        ctx.fill();
        ctx.stroke();

        // High gloss polished granite reflection
        const gloss = ctx.createLinearGradient(gx, gy, gx + gSize, gy + gSize);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        gloss.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gloss;
        ctx.fill();
      }
    }

  } else if (colorGroup === 'green') {
    // ----------------------------------------------------
    // 7. GREEN: Singapore / Abu Dhabi Luxury Garden Marble (Singapore, Abu Dhabi)
    // ----------------------------------------------------
    // Lush manicured lawn base with stripes
    ctx.fillStyle = '#86efac';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#4ade80';
    for (let gy = y + 10; gy < y + h; gy += 32) {
      ctx.fillRect(x, gy, w, 16);
    }

    // Polished Italian white marble patio slabs
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 25, w - 40, h - 45, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    // Luxurious marble paver blocks with emerald/gold mortar
    for (let my = y + 38; my < y + h - 35; my += 50) {
      ctx.beginPath();
      ctx.moveTo(x + 30, my);
      ctx.lineTo(x + w - 30, my);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.stroke();

      for (let mx = x + 30; mx < x + w - 30; mx += 100) {
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx, my + 50);
        ctx.stroke();
      }
    }

  } else if (colorGroup === 'dark_blue') {
    // ----------------------------------------------------
    // 8. DARK BLUE: New York / Sydney Modern Bluestone Slate (Sydney, New York)
    // ----------------------------------------------------
    ctx.fillStyle = '#e0e7ff'; // Indigo bluestone base
    ctx.fillRect(x, y, w, h);

    // Patio boundary
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 25, w - 40, h - 45, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#4f46e5';
    ctx.stroke();

    // Modern urban diagonal cross-cut bluestone slate pavers
    const slateColors = ['#e0e7ff', '#c7d2fe', '#ede9fe', '#f1f5f9'];
    const sWidth = 64;
    const sHeight = 36;
    for (let sy = y + 36; sy < y + h - 35; sy += sHeight + 6) {
      const isAlt = Math.floor((sy - y) / (sHeight + 6)) % 2 === 1;
      const startX = x + 28 + (isAlt ? 32 : 0);
      for (let sx = startX; sx < x + w - 32; sx += sWidth + 6) {
        const seed = (sx + sy) % slateColors.length;
        ctx.fillStyle = slateColors[seed];
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sWidth, sHeight, 5);
        ctx.fill();
        ctx.stroke();

        // Polished slate surface texture
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 3, sy + 3, sWidth - 6, sHeight - 6);
      }
    }

  } else {
    // Default manicured paver lawn
    ctx.fillStyle = '#86efac';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 25, w - 40, h - 45, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();
  }

  // Golden architectural lot brackets at the four corners of construction zone
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.85)';
  ctx.lineWidth = 4;
  // Top-Left bracket
  ctx.beginPath();
  ctx.moveTo(x + 40, y + 65); ctx.lineTo(x + 40, y + 45); ctx.lineTo(x + 60, y + 45);
  ctx.stroke();
  // Top-Right bracket
  ctx.beginPath();
  ctx.moveTo(x + w - 40, y + 65); ctx.lineTo(x + w - 40, y + 45); ctx.lineTo(x + w - 60, y + 45);
  ctx.stroke();
  // Bottom-Left bracket
  ctx.beginPath();
  ctx.moveTo(x + 40, y + h - 65); ctx.lineTo(x + 40, y + h - 45); ctx.lineTo(x + 60, y + h - 45);
  ctx.stroke();
  // Bottom-Right bracket
  ctx.beginPath();
  ctx.moveTo(x + w - 40, y + h - 65); ctx.lineTo(x + w - 40, y + h - 45); ctx.lineTo(x + w - 60, y + h - 45);
  ctx.stroke();

  ctx.restore();
}

function drawStreetTileContent(ctx, tile, p, prop, properties = {}, players = [], cW = 512, cH = 896) {
  ctx.clearRect(0, 0, cW, cH);

  // Base background: Crisp clean bright white slab with dark border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cW, cH);

  // High contrast outer dark border
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#0f172a';
  ctx.strokeRect(7, 7, cW - 14, cH - 14);

  // Inner boundary
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(16, 16, cW - 32, cH - 32);

  // Helper function to draw outward text rotated 180 deg
  const drawOutwardText = (text, cx, cy, font, fillStyle, maxW = null) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI);
    ctx.fillStyle = fillStyle;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (maxW) {
      ctx.fillText(text, 0, 0, maxW);
    } else {
      ctx.fillText(text, 0, 0);
    }
    ctx.restore();
  };

  if (tile.type === 'city') {
    // 1. TOP / OUTER ZONE: District Header & City Name (y = 16 to 140)
    ctx.fillStyle = tile.color || '#3b82f6';
    ctx.fillRect(16, 16, 480, 56);

    // Glossy highlight
    const gloss = ctx.createLinearGradient(0, 16, 0, 45);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(16, 16, 480, 30);

    // Dark divider
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16, 72, 480, 4);

    // Country Flag + City Name
    const name = tile.name.toUpperCase();
    if (tile.country) {
      ctx.save();
      ctx.translate(256, 44);
      ctx.rotate(Math.PI);
      drawVectorFlag(ctx, tile.country, -32, -18, 64, 36, 6);
      ctx.restore();
    }

    const fontSize = name.length > 15 ? 28 : name.length > 11 ? 32 : 36;
    drawOutwardText(name, 256, 114, '900 ' + fontSize + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0f172a', 450);

    // 2. DEDICATED ARCHITECTURAL ESTATE BUILDING LOT (y = 150 to 745)
    // Distinct textured materials per color group: cobblestone vs stone vs bricks vs terracotta vs granite vs marble vs slate!
    drawDistrictEstateLot(ctx, tile.colorGroup, 16, 150, 480, 595);

    // 3. INNER RIM DYNAMIC RENT / PRICE BADGE (y = 756 to 854)
    // Matches Business Tour screenshot: huge white badge with bold price/rent facing center
    let badgeText = '';
    let isOwned = false;
    let ownerColor = '#3b82f6';
    let isFestival = false;
    let isMortgaged = false;

    if (prop && prop.ownerId) {
      isOwned = true;
      const owner = players.find((u) => u.id === prop.ownerId);
      if (owner?.avatarColor) ownerColor = owner.avatarColor;

      if (prop.mortgaged) {
        isMortgaged = true;
        badgeText = 'MORTGAGED';
      } else {
        const level = prop.level || 1;
        let rent = tile.rent?.[Math.min(level - 1, 4)] || tile.rent?.[0] || tile.price;

        // Monopoly bonus (2x rent if full color group owned by same player)
        if (tile.colorGroup) {
          const groupTiles = TILES.filter((t) => t.colorGroup === tile.colorGroup);
          if (groupTiles.length > 0 && groupTiles.every((t) => properties?.[t.id]?.ownerId === prop.ownerId)) {
            rent *= 2;
          }
        }

        // Festival bonus (2x rent)
        if (prop.festival) {
          rent *= 2;
          isFestival = true;
        }

        const formatted = formatCash(rent, true);
        if (isFestival) {
          badgeText = '🔥 ' + formatted;
        } else if (level >= 5) {
          badgeText = '👑 ' + formatted;
        } else {
          badgeText = formatted;
        }
      }
    } else {
      // Unowned city: show purchase price in bold (e.g. 120K)
      badgeText = formatCash(tile.price || 0, true);
    }

    const badgeX = 42;
    const badgeY = 756;
    const badgeW = 428;
    const badgeH = 98;
    const badgeR = 18;

    // Subtle drop shadow underneath badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.beginPath();
    ctx.roundRect(badgeX + 2, badgeY + 4, badgeW, badgeH, badgeR);
    ctx.fill();

    // Clean white badge background (or festive gold tint if festival active)
    ctx.fillStyle = isFestival ? '#fef9c3' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
    ctx.fill();

    // Sharp outer border
    ctx.lineWidth = 5;
    ctx.strokeStyle = isFestival ? '#eab308' : '#0f172a';
    ctx.stroke();

    // Top owner-color accent bar if owned
    if (isOwned && !isMortgaged) {
      ctx.fillStyle = ownerColor;
      ctx.beginPath();
      ctx.roundRect(badgeX + 3, badgeY + 3, badgeW - 6, 12, [badgeR - 2, badgeR - 2, 0, 0]);
      ctx.fill();
    }

    // High contrast big bold rent / price text
    const textY = isOwned && !isMortgaged ? badgeY + 54 : badgeY + 50;
    const badgeFont = isMortgaged
      ? '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : (badgeText.length > 7
        ? '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');

    const textColor = isMortgaged ? '#ef4444' : (isFestival ? '#b45309' : '#0f172a');
    drawOutwardText(badgeText, 256, textY, badgeFont, textColor, 400);

  } else if (tile.type === 'resort') {
    // 1. TOP / OUTER ZONE: Tropical Cyan Header Band (y = 16 to 140)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(16, 16, 480, 56);

    const gloss = ctx.createLinearGradient(0, 16, 0, 45);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(16, 16, 480, 30);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16, 72, 480, 4);

    const rName = tile.name.toUpperCase();
    if (tile.country) {
      ctx.save();
      ctx.translate(256, 44);
      ctx.rotate(Math.PI);
      drawVectorFlag(ctx, tile.country, -32, -18, 64, 36, 6);
      ctx.restore();
    }

    drawOutwardText(rName, 256, 114, '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0891b2', 450);

    // 2. DEDICATED GOLDEN BEACH SAND RESORT LOT (y = 150 to 745)
    ctx.fillStyle = '#fde047'; // Golden sand
    ctx.fillRect(16, 150, 480, 595);

    // Granular sand stippling grain
    const sandColors = ['#fef08a', '#fbbf24', '#f59e0b', '#fef9c3', '#d97706'];
    for (let s = 0; s < 350; s++) {
      const sx = 24 + ((s * 47) % 464);
      const sy = 160 + ((s * 83) % 480);
      const sr = 1 + (s % 3);
      ctx.fillStyle = sandColors[s % sandColors.length];
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gentle curved sand dune ripples
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.22)';
    ctx.lineWidth = 5;
    for (let ry = 190; ry < 620; ry += 65) {
      ctx.beginPath();
      ctx.moveTo(30, ry);
      ctx.bezierCurveTo(160, ry - 18, 320, ry + 18, 480, ry);
      ctx.stroke();
    }

    // Turquoise Ocean Shoreline with White Foam Waves at lower lot edge
    const waterGrad = ctx.createLinearGradient(0, 620, 0, 745);
    waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
    waterGrad.addColorStop(0.3, 'rgba(14, 165, 233, 0.6)');
    waterGrad.addColorStop(0.7, '#0284c7');
    waterGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(16, 620, 480, 125);

    // White Foamy Wave Surf Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(20, 645);
    ctx.bezierCurveTo(150, 625, 310, 665, 492, 640);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 680);
    ctx.bezierCurveTo(170, 665, 330, 695, 492, 675);
    ctx.stroke();

    // 2D Beach details: Beach towel graphic
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(80, 320, 65, 100);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, 340, 65, 20);
    ctx.fillRect(80, 380, 65, 20);

    // Starfish in the sand
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(380, 420, 14, 0, Math.PI * 2);
    ctx.fill();

    // Resort boundary frame
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.strokeRect(30, 165, 452, 565);

    // 3. INNER RIM RESORT RENT / PRICE BADGE (y = 756 to 854)
    let rBadgeText = '';
    let rIsOwned = false;
    let rOwnerColor = '#06b6d4';
    let rIsFestival = false;

    if (prop && prop.ownerId) {
      rIsOwned = true;
      const owner = players.find((u) => u.id === prop.ownerId);
      if (owner?.avatarColor) rOwnerColor = owner.avatarColor;

      const resortTiles = TILES.filter((t) => t.type === 'resort');
      const ownedCount = resortTiles.filter((t) => properties?.[t.id]?.ownerId === prop.ownerId).length;
      let rent = (tile.baseRent || tile.price || 50000) * Math.pow(2, Math.max(1, ownedCount) - 1);
      if (prop.festival) {
        rent *= 2;
        rIsFestival = true;
      }
      const formatted = formatCash(rent, true);
      rBadgeText = rIsFestival ? '🔥 ' + formatted : formatted;
    } else {
      rBadgeText = formatCash(tile.price || 0, true);
    }

    const badgeX = 42;
    const badgeY = 756;
    const badgeW = 428;
    const badgeH = 98;
    const badgeR = 18;

    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.beginPath();
    ctx.roundRect(badgeX + 2, badgeY + 4, badgeW, badgeH, badgeR);
    ctx.fill();

    ctx.fillStyle = rIsFestival ? '#fef9c3' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.strokeStyle = rIsFestival ? '#eab308' : '#0891b2';
    ctx.stroke();

    if (rIsOwned) {
      ctx.fillStyle = rOwnerColor;
      ctx.beginPath();
      ctx.roundRect(badgeX + 3, badgeY + 3, badgeW - 6, 12, [badgeR - 2, badgeR - 2, 0, 0]);
      ctx.fill();
    }

    const textY = rIsOwned ? badgeY + 54 : badgeY + 50;
    const rFont = rBadgeText.length > 7
      ? '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const rTextColor = rIsFestival ? '#b45309' : '#0891b2';
    drawOutwardText(rBadgeText, 256, textY, rFont, rTextColor, 400);

  } else {
    // SPECIAL EVENT TILES (Chance, Tax, Mystery, Armory, Festival)
    const taxSub = tile.amount ? ('PAY ' + formatCash(tile.amount, true)) : 'PAY TAX';
    const eventConfig = {
      chance: { color: '#ec4899', icon: '❓', title: 'CHANCE', sub: 'LUCKY DRAW', subColor: '#be185d', bg: '#312e81' },
      championship: { color: '#f59e0b', icon: '🏆', title: 'CHAMPIONSHIP', sub: '2X RENT HOST', subColor: '#b45309', bg: '#451a03' },
      armory: { color: '#ef4444', icon: '🍅', title: 'ARMORY', sub: '+2 TOMATOES', subColor: '#b91c1c', bg: '#1e293b' },
      tax: { color: '#475569', icon: '💸', title: tile.name.toUpperCase(), sub: taxSub, subColor: '#b91c1c', bg: '#0f172a' },
      festival: { color: '#7c3aed', icon: '🎪', title: 'WORLD FAIR', sub: '2X RENT HOST', subColor: '#6d28d9', bg: '#2e1065' },
    };
    const cfg = eventConfig[tile.type] || {
      color: '#0284c7',
      icon: tile.icon || '🎯',
      title: tile.name.toUpperCase(),
      sub: tile.amount ? ('PAY ' + formatCash(tile.amount, true)) : (tile.type || '').toUpperCase(),
      subColor: '#0369a1',
      bg: '#0f172a',
    };

    ctx.fillStyle = cfg.color;
    ctx.fillRect(16, 16, 480, 56);

    const gloss = ctx.createLinearGradient(0, 16, 0, 45);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(16, 16, 480, 30);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16, 72, 480, 4);

    drawOutwardText(cfg.icon + ' ' + cfg.title, 256, 114, '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0f172a', 450);

    // Dedicated Themed Lot Texture (y = 150 to 745)
    ctx.fillStyle = cfg.bg;
    ctx.fillRect(16, 150, 480, 595);

    // Authentic Chance Wheel or Themed Event Lot Graphic
    if (tile.type === 'chance' || tile.type === 'mystery') {
      // ----------------------------------------------------
      // AUTHENTIC 8-SLICE RAINBOW PIE WHEEL (Wheel of Fortune from reference screenshot)
      // ----------------------------------------------------
      ctx.save();
      ctx.translate(256, 440);
      ctx.rotate(Math.PI);

      const wheelR = 175;
      const wheelColors = [
        '#ec4899', // Pink
        '#8b5cf6', // Violet
        '#3b82f6', // Blue
        '#06b6d4', // Cyan
        '#10b981', // Green
        '#facc15', // Yellow
        '#f97316', // Orange
        '#ef4444', // Red
      ];

      // Outer gold rim ring with dropshadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, wheelR + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark rim edge
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // 8 Slices
      const sliceAngle = (Math.PI * 2) / 8;
      for (let s = 0; s < 8; s++) {
        const start = s * sliceAngle;
        const end = start + sliceAngle;
        ctx.fillStyle = wheelColors[s];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wheelR, start, end);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Center gold hub cap with star
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();

      // Star in center
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 2);

      // Top indicator pointer arrow pointing to winning slice
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -wheelR + 14);
      ctx.lineTo(-14, -wheelR - 22);
      ctx.lineTo(14, -wheelR - 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

    } else if (tile.type === 'tax') {
      // ----------------------------------------------------
      // AUTHENTIC TAX INVOICE WITH RED AUDIT STAMP
      // ----------------------------------------------------
      ctx.save();
      ctx.translate(256, 435);
      ctx.rotate(Math.PI);

      // Angled white paper invoice document
      ctx.save();
      ctx.rotate(-0.06);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(-126, -164, 252, 332); // drop shadow

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-130, -170, 260, 340);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(-130, -170, 260, 340);

      // Document title header bar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-120, -155, 240, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TAX ASSESSMENT', 0, -135);

      // Horizontal receipt/invoice lines
      ctx.fillStyle = '#94a3b8';
      for (let ly = -105; ly < 80; ly += 24) {
        ctx.fillRect(-110, ly, 220, 6);
      }

      // Red circular TAX AUDIT rubber stamp
      ctx.save();
      ctx.rotate(-0.25);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(20, 50, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(20, 50, 42, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.font = '900 20px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AUDIT', 20, 42);
      ctx.font = '900 14px -apple-system, sans-serif';
      ctx.fillText('PAID', 20, 60);
      ctx.restore();

      ctx.restore();
      ctx.restore();

    } else {
      // Themed Center Icon Embellishment for Championship / Armory / Festival
      ctx.font = '110px sans-serif';
      drawOutwardText(cfg.icon, 256, 440, '110px sans-serif', '#ffffff');

      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeRect(36, 165, 440, 565);
    }

    // Inner Rim Badge for Event Tiles (y = 756 to 854)
    const badgeX = 42;
    const badgeY = 756;
    const badgeW = 428;
    const badgeH = 98;
    const badgeR = 18;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    const subFont = cfg.sub.length > 10
      ? '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    drawOutwardText(cfg.sub, 256, badgeY + 50, subFont, cfg.subColor, 400);
  }
}

export default function Board3D({
  properties = {},
  players = [],
  activeTileId = 0,
  lastDiceResult = null,
  diceSkin = 'classic_red',
  centerContent = null,
  communityJackpot = 100000,
  lastPayment = null,
  onRollDice,
  onBuyCity,
  onBuyoutCity,
  onUpgradeCity,
  onSetFestival,
  onThrowTomato,
  onEndTurn,
  onTileClick,
  onInspectTile,
  onPawnMovementStart,
  onPawnMovementComplete,
  targetingMode = null,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  // Mesh & Model Refs
  const tileMeshesRef = useRef([]);
  const tileCanvasesRef = useRef([]);
  const hoveredMeshRef = useRef(null);
  const pawnMeshesRef = useRef(new Map());
  const buildingsGroupRef = useRef(null);
  const curbMeshesRef = useRef([]);
  const diceGroupRef = useRef(null);
  const diceMeshesRef = useRef([]);
  const diceSimRef = useRef({ active: false, progress: 1.0, targetRotation1: null, targetRotation2: null });
  const monumentsRef = useRef([]);
  const prisonMonumentRef = useRef(null);
  const banknoteStacksRef = useRef([]);
  const cashGroupRef = useRef(null);
  const cashTransfersRef = useRef([]);
  const lastPaymentIdRef = useRef(null);
  const lastRollIdRef = useRef(null);

  const targetingModeRef = useRef(targetingMode);
  const lastHoveredTargetTileRef = useRef(null);
  const targetingGroupRef = useRef(null);

  useEffect(() => {
    targetingModeRef.current = targetingMode;
  }, [targetingMode]);

  const onTileClickRef = useRef(onTileClick);
  const onInspectTileRef = useRef(onInspectTile);
  const propertiesRef = useRef(properties);
  useEffect(() => {
    onTileClickRef.current = onTileClick;
  }, [onTileClick]);
  useEffect(() => {
    onInspectTileRef.current = onInspectTile;
  }, [onInspectTile]);
  useEffect(() => {
    propertiesRef.current = properties;
  }, [properties]);

  const [sceneReady, setSceneReady] = useState(false);

  // Initialize Three.js Scene with Business Tour Diamond Table & Striped Lawn
  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const width = mountNode.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const height = mountNode.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800);

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera (Steady tabletop isometric angle - captures full diamond)
    const camera = new THREE.PerspectiveCamera(36, width / height, 1, 1000);
    cameraRef.current = camera;

    const updateCameraFraming = (cam, w, h) => {
      const aspect = w / h;
      cam.aspect = aspect;

      // Check camera mode setting: 'topdown' (2D normal square) vs 'follow' / 'isometric' (3D angled diamond)
      const camMode = typeof window !== 'undefined' ? (localStorage.getItem('ngg_camera_mode') || 'follow') : 'follow';

      if (camMode === 'topdown') {
        // ========================================================
        // 1. 2D TOP-DOWN NORMAL SQUARE VIEW
        // ========================================================
        // The diamond board has corners at (0, 0, ±56) and (±56, 0, 0).
        // By aligning the camera's up-vector along the diagonal (-45°),
        // the board appears as a standard horizontal/vertical SQUARE (like classic Monopoly),
        // fitting widescreen monitors with maximum clarity and zero distortion.
        const pitchRad = (89.5 * Math.PI) / 180;
        
        let dist = 126;
        if (aspect < 1.55) {
          dist = 126 * (1.55 / Math.max(aspect, 0.65));
        }

        const posY = dist * Math.sin(pitchRad);
        const posZ = dist * Math.cos(pitchRad);

        cam.position.set(0, posY, posZ);
        cam.up.set(Math.SQRT1_2, 0, -Math.SQRT1_2); // Rotates diamond by 45° into a perfect normal square!
        cam.lookAt(0, 0, 0);
      } else {
        // ========================================================
        // 2. 3D ANGLED DIAMOND VIEW (REFRAMED SO SOUTH TIP IS NEVER CUT OFF)
        // ========================================================
        // Pitch: 41° gives a dramatic 3D perspective of 3D houses & monuments.
        // Target: Shifted south to (0, 0, 13.5) so the near South corner (Corner 0 / Start)
        // is elevated above the bottom Roll Button and Action Card dock.
        // Distance: 172 units guarantees the entire diamond (North, South, East, West)
        // is 100% inside the viewport on all resolutions.
        const pitchDeg = 41;
        const pitchRad = (pitchDeg * Math.PI) / 180;
        const targetZ = 11.5;
        let dist = 136;
        if (aspect < 1.55) {
          dist = 136 * (1.55 / Math.max(aspect, 0.65));
        }

        const posY = dist * Math.sin(pitchRad);
        const posZ = targetZ + dist * Math.cos(pitchRad);

        cam.position.set(0, posY, posZ);
        cam.up.set(0, 1, 0); // Standard upright camera
        cam.lookAt(0, 0, targetZ);
      }

      cam.updateProjectionMatrix();
    };

    updateCameraFraming(camera, width, height);

    // 3. Renderer with transparent alpha and contact shadow support
    const initialQuality = typeof window !== 'undefined' ? (localStorage.getItem('ngg_graphics_quality') || 'high') : 'high';
    const renderer = new THREE.WebGLRenderer({
      antialias: initialQuality !== 'low',
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0); // 100% transparent canvas so sky gradient shines through
    renderer.setSize(width, height);
    renderer.setPixelRatio(initialQuality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, initialQuality === 'medium' ? 1.5 : 2));
    renderer.shadowMap.enabled = initialQuality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Smooth soft contact shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting Rig (Rich Warm Cinematic Tabletop Sunlight & Sky Fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfff7ed, 1.45);
    mainSun.position.set(65, 140, 75);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.camera.near = 20;
    mainSun.shadow.camera.far = 320;
    mainSun.shadow.camera.left = -70;
    mainSun.shadow.camera.right = 70;
    mainSun.shadow.camera.top = 70;
    mainSun.shadow.camera.bottom = -70;
    mainSun.shadow.bias = -0.0005;
    mainSun.shadow.normalBias = 0.02;
    scene.add(mainSun);

    const blueSkyFill = new THREE.DirectionalLight(0xbae6fd, 0.62);
    blueSkyFill.position.set(-75, 95, -75);
    scene.add(blueSkyFill);

    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x14532d, 0.38);
    scene.add(hemiLight);

    // 5. Contact Shadow Ground Plane
    const groundGeom = new THREE.PlaneGeometry(260, 260);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 6. Center Striped Lawn Pitch & Encircling Asphalt Road (Business Tour Stadium Field)
    const lawnCanvas = document.createElement('canvas');
    lawnCanvas.width = 2048;
    lawnCanvas.height = 2048;
    const lCtx = lawnCanvas.getContext('2d');
    lCtx.imageSmoothingEnabled = true;
    lCtx.imageSmoothingQuality = 'high';

    // 6a. Pure Emerald Stadium Lawn Pitch (Clean grass pitch directly meeting board tiles - no second road!)
    lCtx.fillStyle = '#16a34a'; // Lush stadium turf base
    lCtx.fillRect(0, 0, 2048, 2048);

    

    // Elegant Stone Curb / Perimeter Frame directly abutting inner tile edges
    lCtx.strokeStyle = '#334155';
    lCtx.lineWidth = 24;
    lCtx.strokeRect(12, 12, 2048 - 24, 2048 - 24);

    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    lCtx.lineWidth = 10;
    lCtx.strokeRect(36, 36, 2048 - 72, 2048 - 72);

    // 6b. Center Field Graphics
    lCtx.save();
    lCtx.beginPath();
    lCtx.rect(40, 40, 2048 - 80, 2048 - 80);
    lCtx.clip();

    // Diagonal alternating mowed grass stripes (Vibrant emerald light grass vs rich medium turf)
    const stripeWidth = 56;
    for (let x = -2048; x < 4096; x += stripeWidth) {
      const isEven = Math.floor(x / stripeWidth) % 2 === 0;
      lCtx.fillStyle = isEven ? '#22c55e' : '#16a34a';
      lCtx.beginPath();
      lCtx.moveTo(x, 0);
      lCtx.lineTo(x + stripeWidth, 0);
      lCtx.lineTo(x + stripeWidth + 2048, 2048);
      lCtx.lineTo(x + 2048, 2048);
      lCtx.closePath();
      lCtx.fill();
    }

    // Subtle field perimeter chalk boundary
    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    lCtx.lineWidth = 6;
    lCtx.strokeRect(180, 180, 1688, 1688);

    // Glowing Cyan / Neon Inner Rail separating tiles from green field (matching reference image)
    lCtx.shadowColor = '#00f0ff';
    lCtx.shadowBlur = 28;
    lCtx.strokeStyle = '#00f0ff';
    lCtx.lineWidth = 14;
    lCtx.strokeRect(48, 48, 1952, 1952);

    lCtx.strokeStyle = '#ffffff';
    lCtx.lineWidth = 6;
    lCtx.strokeRect(52, 52, 1944, 1944);
    lCtx.shadowBlur = 0;

    // Floating 300 000 Center Pot / Jackpot Amount directly on the lawn (matching reference image)
    lCtx.save();
    lCtx.translate(1024, 760);
    lCtx.font = '900 110px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    lCtx.textAlign = 'center';
    lCtx.textBaseline = 'middle';
    lCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    lCtx.shadowBlur = 20;
    lCtx.shadowOffsetY = 10;
    lCtx.fillStyle = '#ffffff';
    lCtx.fillText('300 000', 0, 0);
    lCtx.restore();

    // Subtle scattered flower / confetti celebration petals (Business Tour festive feel)
    const petalColors = ['#f43f5e', '#fbbf24', '#38bdf8', '#ffffff', '#ec4899'];
    for (let i = 0; i < 65; i++) {
      const px = 250 + Math.random() * 1548;
      const py = 250 + Math.random() * 1548;
      // Keep center dice rolling circle clear
      if (Math.hypot(px - 1024, py - 1024) < 240) continue;
      lCtx.fillStyle = petalColors[i % petalColors.length];
      lCtx.beginPath();
      lCtx.arc(px, py, 5 + Math.random() * 4, 0, Math.PI * 2);
      lCtx.fill();
    }

    lCtx.restore();

    const lawnTexture = new THREE.CanvasTexture(lawnCanvas);
    lawnTexture.anisotropy = renderer.capabilities?.getMaxAnisotropy?.() || 16;
    lawnTexture.minFilter = THREE.LinearMipmapLinearFilter;
    lawnTexture.magFilter = THREE.LinearFilter;
    lawnTexture.generateMipmaps = true;
    lawnTexture.needsUpdate = true;

    const lawnMat = new THREE.MeshStandardMaterial({
      map: lawnTexture,
      roughness: 0.85,
      metalness: 0.05,
    });

    const woodSideMat = new THREE.MeshStandardMaterial({
      color: 0x3d2415,
      roughness: 0.45,
      metalness: 0.1,
    });

    // 7. Middle Board Center Pitch (Business Tour Stadium Field)
    // Sized to 53.0 x 53.0 to perfectly abut the inner perimeter of the tiles.
    // The board under the tiles on the outer edges is removed so the tiles themselves form the clean outer edge.
    const tableGroup = new THREE.Group();
    const tableGeom = new THREE.BoxGeometry(53.0, 0.6, 53.0);
    const tableMaterials = [
      woodSideMat, // +X
      woodSideMat, // -X
      lawnMat,     // +Y (TOP IS LAWN PITCH)
      woodSideMat, // -Y
      woodSideMat, // +Z
      woodSideMat, // -Z
    ];
    const tableMesh = new THREE.Mesh(tableGeom, tableMaterials);
    tableMesh.rotation.y = Math.PI / 4; // 45-degree diamond
    tableMesh.position.y = -0.3;
    tableMesh.receiveShadow = true;
    tableGroup.add(tableMesh);

    // Center Striped Lawn Pitch with Inner Perimeter Road (Business Tour Green Field)
    const lawnGeom = new THREE.PlaneGeometry(53.0, 53.0);
    const lawnMesh = new THREE.Mesh(lawnGeom, lawnMat);
    lawnMesh.rotation.x = -Math.PI / 2;
    lawnMesh.rotation.z = Math.PI / 4;
    lawnMesh.position.y = 0.08;
    lawnMesh.receiveShadow = true;
    tableGroup.add(lawnMesh);

    scene.add(tableGroup);

    // 7b. Elevated Outer Curb / Terrace Strip (Width ~4.0, Height ~0.45, Soft Stone & Lawn Trim)
    // Placed behind each of the 4 diamond street sides outside the track
    // 7b. Inner board layout (no clumsy external terrace)
    curbMeshesRef.current = [];

    // 7. 48 Perimeter 3D Tiles (Monopoly Flush Square Corners & Outward-Facing Slabs)
    const tileGroup = new THREE.Group();
    const tileMeshes = [];
    const tileCanvases = [];

    TILES.forEach((tile) => {
      const p = getTile3DPos(tile.id, TILES.length);

      // Elongated canvas for street tiles (512x896, aspect ratio matches 7.6 x 13.0)
      // Square canvas for corners (512x512)
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = p.isCorner ? 512 : 896;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const cW = canvas.width;
      const cH = canvas.height;

      // Base background: Crisp clean bright white slab with dark border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cW, cH);

      // High contrast outer dark border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(7, 7, cW - 14, cH - 14);

      // Inner boundary
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(16, 16, cW - 32, cH - 32);

      if (p.isCorner) {
        // Corner Field (Square slab with centered artwork)
        ctx.save();
        ctx.translate(256, 256);
        ctx.rotate(p.canvasAngle);

        const cornerType = tile.type || (p.side === 0 ? 'start' : p.side === 1 ? 'jail' : p.side === 2 ? 'festival' : 'airport');

        if (cornerType === 'start' || p.side === 0) {
          // CORNER 0: START (South)
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.roundRect(-165, -220, 330, 74, 18);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('START', 0, -168);

          // Center Rocket Launchpad Emblem
          ctx.beginPath();
          ctx.arc(0, -10, 72, 0, Math.PI * 2);
          ctx.fillStyle = '#ecfdf5';
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#059669';
          ctx.stroke();

          ctx.font = '76px sans-serif';
          ctx.fillText('🚀', 0, 16);

          // Directional arrow
          ctx.fillStyle = '#047857';
          ctx.beginPath();
          ctx.moveTo(60, 75);
          ctx.lineTo(-40, 75);
          ctx.lineTo(-40, 60);
          ctx.lineTo(-80, 85);
          ctx.lineTo(-40, 110);
          ctx.lineTo(-40, 95);
          ctx.lineTo(60, 95);
          ctx.closePath();
          ctx.fill();

          // Salary pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(-160, 135, 320, 68, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#047857';
          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('COLLECT 200K', 0, 180);

        } else if (cornerType === 'jail' || cornerType === 'go_to_jail' || p.side === 1) {
          // CORNER 1: POLICE PRECINCT & EXTRADITION GATEWAY
          // Deep Cyber-Police Tarmac with Radar Grid
          ctx.fillStyle = '#070c18';
          ctx.fillRect(-240, -240, 480, 480);

          // Radar grid lines
          ctx.strokeStyle = 'rgba(30, 58, 138, 0.35)';
          ctx.lineWidth = 2;
          for (let r = 40; r <= 200; r += 40) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(-240, 0); ctx.lineTo(240, 0);
          ctx.moveTo(0, -240); ctx.lineTo(0, 240);
          ctx.stroke();

          // Outer Warning Hazard Rim
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 6;
          ctx.strokeRect(-230, -230, 460, 460);

          // Top Header: POLICE PRECINCT Badge
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.roundRect(-175, -220, 350, 72, 16);
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#38bdf8';
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚓 POLICE PRECINCT', 0, -172);

          // Center Police Star Shield Badge
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(-90, -85, 180, 170, 24);
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#eab308';
          ctx.stroke();

          // Gold Star in Badge
          ctx.fillStyle = '#facc15';
          ctx.font = '72px -apple-system, sans-serif';
          ctx.fillText('★', 0, -15);

          // Dual Flashing Police Lights (Blue & Red)
          ctx.fillStyle = '#2563eb';
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.roundRect(-60, 24, 50, 22, 6);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#f87171';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.roundRect(10, 24, 50, 22, 6);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Subtitle text: EXTRADITION GATE
          ctx.fillStyle = '#94a3b8';
          ctx.font = '800 20px -apple-system, sans-serif';
          ctx.fillText('EXTRADITION GATE', 0, 72);

          // Arrow pointing off-board to Prison Field
          ctx.fillStyle = '#ef4444';
          ctx.font = '900 24px -apple-system, sans-serif';
          ctx.fillText('➔ OFF-BOARD PRISON', 0, 102);

          // Bottom Warning Pill
          ctx.fillStyle = '#fef2f2';
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(-165, 135, 330, 68, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#991b1b';
          ctx.font = '900 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('ARREST ➔ PRISON', 0, 178);

        } else if (cornerType === 'world_tour' || p.side === 2) {
          // CORNER 2: AIRPORT RUNWAY ("3d plane for the airport, you know the drill")
          // Dark Runway Tarmac Base
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-240, -240, 480, 480);

          // Asphalt texture stipple
          ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
          for (let ty = -240; ty < 240; ty += 8) {
            ctx.fillRect(-240, ty, 480, 4);
          }

          // Runway White Threshold Piano Keys (||||||||)
          ctx.fillStyle = '#ffffff';
          for (let k = -180; k <= 180; k += 28) {
            ctx.fillRect(k, -110, 14, 55);
          }

          // Dashed Runway Centerline Stripes
          ctx.fillStyle = '#ffffff';
          for (let cl = -40; cl <= 100; cl += 45) {
            ctx.fillRect(-8, cl, 16, 28);
          }

          // Runway Painted Designation Number
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('09L', 0, 8);

          // Yellow Taxiway Curved Turnoff Markings
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(100, 100, 80, Math.PI, 1.5 * Math.PI);
          ctx.stroke();

          // Green Runway Threshold Light Markers
          ctx.fillStyle = '#22c55e';
          [-190, -130, -70, 70, 130, 190].forEach((lx) => {
            ctx.beginPath();
            ctx.arc(lx, -125, 7, 0, Math.PI * 2);
            ctx.fill();
          });

          // Top Header: WORLD TOUR AIRPORT
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.roundRect(-175, -220, 350, 74, 18);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✈️ AIRPORT', 0, -168);

          // Bottom Flight Ticket Pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(-160, 135, 320, 68, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0369a1';
          ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('TICKET: 50K', 0, 178);

        } else {
          // CORNER 3: CHAMPIONSHIPS / FESTIVAL (East)
          ctx.fillStyle = '#7c3aed';
          ctx.beginPath();
          ctx.roundRect(-175, -220, 350, 74, 18);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CHAMPIONSHIPS', 0, -168);

          // Center Gold Trophy Emblem
          ctx.beginPath();
          ctx.arc(0, -10, 72, 0, Math.PI * 2);
          ctx.fillStyle = '#f5f3ff';
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#7c3aed';
          ctx.stroke();

          ctx.font = '78px sans-serif';
          ctx.fillText('🏆', 0, 16);

          // 2X Rent Host pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(-160, 135, 320, 68, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#6d28d9';
          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('2X RENT HOST', 0, 178);
        }

        ctx.restore();
      } else {
        // Render dynamic street tile canvas with inner rent badge
        drawStreetTileContent(ctx, tile, p, properties?.[tile.id], properties, players, cW, cH);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = renderer.capabilities?.getMaxAnisotropy?.() || 16;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;

      // Box Geometry: Corner is exact square (width == length == trackDepth),
      // Street is rectangle (width == streetWidth, length == trackDepth)
      const tileGeom = new THREE.BoxGeometry(p.width, 0.35, p.length);
      const sideMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.5,
        metalness: 0.1,
      });
      const topMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.25,
        metalness: 0.08,
      });

      // Box materials: +X, -X, +Y (TOP), -Y, +Z, -Z
      const tileMaterials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
      const tileMesh = new THREE.Mesh(tileGeom, tileMaterials);
      tileMesh.position.set(p.x, 0.17, p.z);
      tileMesh.rotation.y = p.rotationY;
      tileMesh.receiveShadow = true;
      tileMesh.userData = { tileId: tile.id, isTile: true };

      tileGroup.add(tileMesh);
      tileMeshes.push(tileMesh);
      tileCanvases.push({ canvas, ctx, tile, p, texture });
    });

    tileMeshesRef.current = tileMeshes;
    tileCanvasesRef.current = tileCanvases;
    scene.add(tileGroup);

    // 8. Dynamic 3D Buildings Group
    const buildingsGroup = new THREE.Group();
    buildingsGroupRef.current = buildingsGroup;
    scene.add(buildingsGroup);

    // 8c. 3D Target Beacons Group
    const targetingGroup = new THREE.Group();
    targetingGroupRef.current = targetingGroup;
    scene.add(targetingGroup);

    // 8b. Physical 3D Corner Monuments (Start Archway, Resort Island, Championship Colosseum, World Tour Pier)
    const monumentsGroup = new THREE.Group();
    const cornerMonuments = [];

    // Corner 0: South (START)
    const pStart = getTile3DPos(0, TILES.length);
    const startMonument = create3DStartMonument();
    startMonument.position.set(pStart.x, 0.35, pStart.z + 1.2);
    startMonument.rotation.y = 0;
    monumentsGroup.add(startMonument);
    cornerMonuments.push(startMonument);

    // Corner 1: West (Off-board PRISON FIELD)
    // The user requested: "actually can we make the prison a non tile field, add it seperatly from the board so people get sent off the board in a prison field"
    const prisonField = create3DPrisonMonument();
    prisonField.position.set(-58, 0.1, 14); // Positioned off the board!
    prisonField.rotation.y = Math.PI / 4;   // Angled nicely towards main camera
    monumentsGroup.add(prisonField);
    cornerMonuments.push(prisonField);
    prisonMonumentRef.current = prisonField;
    scene.userData.prisonMonument = prisonField;

    // Corner 2: North (WORLD TOUR / AIRPORT)
    const pTour = getTile3DPos(16, TILES.length);
    const tourMonument = create3DWorldTourMonument();
    tourMonument.position.set(pTour.x, 0.35, pTour.z - 1.2);
    tourMonument.rotation.y = 0;
    monumentsGroup.add(tourMonument);
    cornerMonuments.push(tourMonument);

    // Corner 3: East (WORLD CHAMPIONSHIP / ARMORY)
    const pChamp = getTile3DPos(24, TILES.length);
    const champMonument = create3DChampionshipMonument();
    champMonument.position.set(pChamp.x + 1.2, 0.35, pChamp.z);
    champMonument.rotation.y = -Math.PI / 4;
    monumentsGroup.add(champMonument);
    cornerMonuments.push(champMonument);

    monumentsRef.current = cornerMonuments;
    scene.add(monumentsGroup);

    // 8c. 3D Cash Transfer Group
    const cashGroup = new THREE.Group();
    scene.add(cashGroup);
    cashGroupRef.current = cashGroup;

    // 8d. Grounded Real-Time Player Cash Stacks (4 Quadrants outside diamond board)
    // Sits flat on the floor plane (y = -2.18) with zero floating / bobbing
    const banknoteStacksGroup = new THREE.Group();
    const banknoteStacks = [];
    const stackCoords = [
      { x: -44, z: 38, rotY: Math.PI / 4 },        // P0 (South-West)
      { x: 44, z: -38, rotY: (-3 * Math.PI) / 4 }, // P1 (North-East)
      { x: -44, z: -38, rotY: (3 * Math.PI) / 4 },  // P2 (North-West)
      { x: 44, z: 38, rotY: -Math.PI / 4 },        // P3 (South-East)
    ];

    stackCoords.forEach((coord, idx) => {
      const pData = players[idx];
      const stackHolder = new THREE.Group();
      stackHolder.position.set(coord.x, -2.18, coord.z);
      stackHolder.rotation.y = coord.rotY;

      if (pData) {
        const stack = create3DBanknoteStack(pData.cash, pData.avatarColor || pData.color, pData.name);
        stack.scale.set(1.25, 1.25, 1.25);
        stackHolder.add(stack);
        stackHolder.visible = true;
      } else {
        stackHolder.visible = false;
      }

      stackHolder.userData = {
        coord,
        playerIdx: idx,
      };

      banknoteStacksGroup.add(stackHolder);
      banknoteStacks.push(stackHolder);
    });

    banknoteStacksRef.current = banknoteStacks;
    scene.add(banknoteStacksGroup);

    // 9. 3D Dice Group (Physical Ruby Red Dice Rolling on the Grass)
    const diceGroup = new THREE.Group();
    diceGroup.position.set(0, 0, 0);
    diceGroup.visible = false;
    diceGroupRef.current = diceGroup;

    const createDiceFaceMat = (dots) => {
      const dCanvas = document.createElement('canvas');
      dCanvas.width = 256;
      dCanvas.height = 256;
      const dCtx = dCanvas.getContext('2d');

      // Ruby Red Dice body
      dCtx.fillStyle = '#dc2626';
      dCtx.fillRect(0, 0, 256, 256);
      dCtx.lineWidth = 14;
      dCtx.strokeStyle = '#b91c1c';
      dCtx.strokeRect(7, 7, 242, 242);

      // White Dots
      dCtx.fillStyle = '#ffffff';
      const drawDot = (dx, dy) => {
        dCtx.beginPath();
        dCtx.arc(dx, dy, 24, 0, Math.PI * 2);
        dCtx.fill();
        dCtx.shadowColor = 'rgba(0,0,0,0.3)';
        dCtx.shadowBlur = 4;
      };

      if (dots === 1) drawDot(128, 128);
      if (dots === 2) { drawDot(72, 72); drawDot(184, 184); }
      if (dots === 3) { drawDot(72, 72); drawDot(128, 128); drawDot(184, 184); }
      if (dots === 4) { drawDot(72, 72); drawDot(184, 72); drawDot(72, 184); drawDot(184, 184); }
      if (dots === 5) { drawDot(72, 72); drawDot(184, 72); drawDot(128, 128); drawDot(72, 184); drawDot(184, 184); }
      if (dots === 6) {
        drawDot(72, 60); drawDot(184, 60);
        drawDot(72, 128); drawDot(184, 128);
        drawDot(72, 196); drawDot(184, 196);
      }

      const dTex = new THREE.CanvasTexture(dCanvas);
      return new THREE.MeshStandardMaterial({
        map: dTex,
        roughness: 0.15,
        metalness: 0.1,
      });
    };

    const dMaterials = generateDiceMaterials(diceSkin);

    const dGeom = new THREE.BoxGeometry(3.2, 3.2, 3.2);
    const d1 = new THREE.Mesh(dGeom, dMaterials);
    d1.position.set(-2.8, 1.6, 0);
    d1.castShadow = true;
    diceGroup.add(d1);

    const d2 = new THREE.Mesh(dGeom, dMaterials);
    d2.position.set(2.8, 1.6, 0);
    d2.castShadow = true;
    diceGroup.add(d2);

    diceMeshesRef.current = [d1, d2];
    scene.add(diceGroup);

    // Resize Handler with Live ResizeObserver
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
      const h = mountRef.current.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800);
      updateCameraFraming(camera, w, h);
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && mountRef.current) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(mountRef.current);
    }

    // Listen for live setting changes
    const handleSettingsUpdate = () => {
      const q = typeof window !== 'undefined' ? (localStorage.getItem('ngg_graphics_quality') || 'high') : 'high';
      if (renderer) {
        renderer.setPixelRatio(q === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, q === 'medium' ? 1.5 : 2));
        renderer.shadowMap.enabled = q !== 'low';
        renderer.shadowMap.type = q === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
      }
      if (camera && mountRef.current) {
        const w = mountRef.current.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
        const h = mountRef.current.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800);
        updateCameraFraming(camera, w, h);
      }
    };
    window.addEventListener('ngg_settings_changed', handleSettingsUpdate);

    // 10. Interactive Raycaster for Tile Hover & Click Inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const getRaycastIntersects = (clientX, clientY) => {
      if (!mountNode || !cameraRef.current) return [];
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);

      const targets = [...tileMeshesRef.current];
      if (buildingsGroupRef.current) {
        targets.push(...buildingsGroupRef.current.children);
      }
      if (targetingGroupRef.current) {
        targets.push(...targetingGroupRef.current.children);
      }
      return raycaster.intersectObjects(targets, true);
    };

    const resolveHitTile = (intersects) => {
      for (const hit of intersects) {
        let cur = hit.object;
        while (cur && cur !== scene) {
          if (cur.userData?.tileId !== undefined && cur.userData?.tileId !== null) {
            const tileId = cur.userData.tileId;
            const tileMesh = tileMeshesRef.current[tileId];
            return { tileId, tileMesh };
          }
          cur = cur.parent;
        }
      }
      return null;
    };

    const handlePointerMove = (e) => {
      const intersects = getRaycastIntersects(e.clientX, e.clientY);
      const hit = resolveHitTile(intersects);

      // Check if Map Targeting Mode is Active
      if (targetingModeRef.current?.active) {
        const eligibleList = targetingModeRef.current.eligibleTileIds || [];
        const isEligible = hit && hit.tileId !== undefined && eligibleList.includes(hit.tileId);

        if (isEligible) {
          renderer.domElement.style.cursor = 'pointer';
          if (lastHoveredTargetTileRef.current !== hit.tileId) {
            lastHoveredTargetTileRef.current = hit.tileId;
            try { sounds.playTargetHover?.(); } catch (err) {}
          }
          if (hit.tileMesh) {
            const topMat = hit.tileMesh.material?.[2];
            if (topMat?.emissive) {
              topMat.emissiveIntensity = 0.65;
            }
          }
          return;
        } else {
          lastHoveredTargetTileRef.current = null;
          renderer.domElement.style.cursor = 'default';
          return;
        }
      }

      if (hit && hit.tileMesh) {
        const hitMesh = hit.tileMesh;
        if (hoveredMeshRef.current !== hitMesh) {
          if (hoveredMeshRef.current) {
            const prevMat = hoveredMeshRef.current.material?.[2];
            if (prevMat?.emissive) {
              prevMat.emissive.setHex(0x000000);
              prevMat.emissiveIntensity = 0;
            }
            hoveredMeshRef.current.position.y = 0.17;
          }

          hoveredMeshRef.current = hitMesh;
          const topMat = hitMesh.material?.[2];
          if (topMat?.emissive) {
            topMat.emissive.setHex(0x38bdf8);
            topMat.emissiveIntensity = 0.35;
          }
          hitMesh.position.y = 0.30;
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        if (hoveredMeshRef.current) {
          const prevMat = hoveredMeshRef.current.material?.[2];
          if (prevMat?.emissive) {
            prevMat.emissive.setHex(0x000000);
            prevMat.emissiveIntensity = 0;
          }
          hoveredMeshRef.current.position.y = 0.17;
          hoveredMeshRef.current = null;
          renderer.domElement.style.cursor = 'default';
        }
      }
    };

    const handlePointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 8) return; // Ignore drag/swipe moves

      const intersects = getRaycastIntersects(e.clientX, e.clientY);
      const hit = resolveHitTile(intersects);

      // Direct 3D Board Map Targeting Click Interception
      if (targetingModeRef.current?.active) {
        if (hit && hit.tileId !== undefined && hit.tileId !== null) {
          const tileId = hit.tileId;
          const eligibleList = targetingModeRef.current.eligibleTileIds || [];
          if (eligibleList.includes(tileId)) {
            try { sounds.playTargetLock?.(); } catch (err) {}
            targetingModeRef.current.onSelectTarget?.(tileId);
            return;
          }
        }
        return;
      }

      if (hit && hit.tileId !== undefined && hit.tileId !== null) {
        const tileId = hit.tileId;
        const tileData = TILES.find((t) => t.id === tileId) || TILES[tileId];
        const propData = propertiesRef.current?.[tileId];
        sounds.playClick?.();
        onTileClickRef.current?.(tileId, tileData, propData);
        onInspectTileRef.current?.(tileId, tileData, propData);
      }
    };

    const handlePointerLeave = () => {
      if (hoveredMeshRef.current) {
        const prevMat = hoveredMeshRef.current.material?.[2];
        if (prevMat?.emissive) {
          prevMat.emissive.setHex(0x000000);
          prevMat.emissiveIntensity = 0;
        }
        hoveredMeshRef.current.position.y = 0.17;
        hoveredMeshRef.current = null;
        renderer.domElement.style.cursor = 'default';
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', handlePointerMove);
    domEl.addEventListener('pointerdown', handlePointerDown);
    domEl.addEventListener('pointerup', handlePointerUp);
    domEl.addEventListener('pointerleave', handlePointerLeave);

    // Render Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Buildings are 100% static (no size pulsing)

      // Animate 3D Targeting Beacons (Spinning downward waypoints, breathing ground halo rings)
      if (targetingGroupRef.current && targetingGroupRef.current.children.length > 0) {
        targetingGroupRef.current.children.forEach((beacon) => {
          const { ring, marker, baseY, phase } = beacon.userData || {};
          if (marker) {
            marker.rotation.y += delta * 2.4;
            marker.rotation.x = Math.sin(elapsed * 2.2 + phase) * 0.12;
            marker.position.y = baseY + Math.sin(elapsed * 3.5 + phase) * 0.35;
          }
          if (ring && ring.material) {
            ring.material.opacity = 0.5 + Math.sin(elapsed * 4.0 + phase) * 0.25;
          }
        });
      }

      // Idle Hover & Real-time Avatar Animations for Pawns (Heroic scale foot contact y = 0.35)
      pawnMeshesRef.current.forEach(({ group, isMoving }) => {
        if (!isMoving && group) {
          group.position.y = 0.35 + Math.sin(elapsed * 3.5) * 0.12;
        }
        if (group && typeof group.userData?.update === 'function') {
          group.userData.update(delta, elapsed, isMoving);
        }
        if (group && typeof group.userData?.updateDistress === 'function') {
          group.userData.updateDistress(delta, elapsed);
        }
      });

      // Update 3D Corner Monuments (fluttering pennants, colosseum searchlights, lighthouse rotating beacon)
      monumentsRef.current.forEach((m) => {
        if (m && typeof m.userData?.update === 'function') {
          m.userData.update(delta, elapsed);
        }
      });

      // Update Flying Cash Transfers (Parabolic flight arc from payer to receiver/bank)
      if (cashTransfersRef.current.length > 0) {
        const activeNotes = [];
        cashTransfersRef.current.forEach((note) => {
          note.elapsed += delta;
          if (note.elapsed < note.delay) {
            note.mesh.visible = false;
            activeNotes.push(note);
            return;
          }
          note.mesh.visible = true;
          const p = Math.min(1.0, (note.elapsed - note.delay) / note.duration);
          const x = THREE.MathUtils.lerp(note.start.x, note.end.x, p) + Math.sin(p * Math.PI) * note.drift;
          const z = THREE.MathUtils.lerp(note.start.z, note.end.z, p) + Math.cos(p * Math.PI) * note.drift;
          const y = THREE.MathUtils.lerp(note.start.y, note.end.y, p) + Math.sin(p * Math.PI) * note.apexY;
          note.mesh.position.set(x, y, z);
          note.mesh.rotation.x += note.rotSpeed.x * delta;
          note.mesh.rotation.y += note.rotSpeed.y * delta;
          note.mesh.rotation.z += note.rotSpeed.z * delta;

          if (p >= 1.0) {
            if (!note.landingPlayed) {
              note.landingPlayed = true;
              try { sounds.playCash?.(); } catch (e) {}
            }
            if (cashGroupRef.current) {
              cashGroupRef.current.remove(note.mesh);
            }
            if (note.mesh.geometry) note.mesh.geometry.dispose();
            if (note.mesh.material) note.mesh.material.dispose();
          } else {
            activeNotes.push(note);
          }
        });
        cashTransfersRef.current = activeNotes;
      }

      // Grounded High-Roller Banknote Stacks (firmly grounded on floor - no floating)

      // 3D Physics Dice Simulation (Finishes cleanly after ~0.75s and STOPS)
      const sim = diceSimRef.current;
      if (sim.active && diceGroupRef.current) {
        sim.progress += delta * 1.6;
        const p = Math.min(sim.progress, 1.0);

        // Vertical bounce curve
        const bounce = Math.sin(p * Math.PI) * 11.0 * (1.0 - p * 0.5);
        diceGroupRef.current.position.y = bounce;

        if (p >= 1.0) {
          sim.active = false;
          diceGroupRef.current.position.y = 0;
          if (sim.targetRotation1 && diceMeshesRef.current[0]) {
            diceMeshesRef.current[0].rotation.copy(sim.targetRotation1);
          }
          if (sim.targetRotation2 && diceMeshesRef.current[1]) {
            diceMeshesRef.current[1].rotation.copy(sim.targetRotation2);
          }
        } else {
          // Tumble spin rapidly during flight
          diceMeshesRef.current.forEach((d) => {
            d.rotation.x += delta * 22.0;
            d.rotation.y += delta * 18.0;
            d.rotation.z += delta * 14.0;
          });
        }
      }

      renderer.render(scene, camera);
    };
    animate();
    setSceneReady(true);

    return () => {
      domEl.removeEventListener('pointermove', handlePointerMove);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      domEl.removeEventListener('pointerup', handlePointerUp);
      domEl.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('ngg_settings_changed', handleSettingsUpdate);
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (mountNode) mountNode.innerHTML = '';
    };
  }, []);

  // Update Dynamic 3D Buildings & Tile Rent Textures (Business Tour Progression)
  useEffect(() => {
    if (!sceneReady) return;

    // Dynamically update the 2D canvas texture for all street tiles so rent reflects house levels & festivals!
    if (tileCanvasesRef.current) {
      tileCanvasesRef.current.forEach((entry) => {
        if (!entry.p.isCorner) {
          drawStreetTileContent(
            entry.ctx,
            entry.tile,
            entry.p,
            properties?.[entry.tile.id],
            properties,
            players,
            entry.canvas.width,
            entry.canvas.height
          );
          entry.texture.needsUpdate = true;
        }
      });
    }

    if (!buildingsGroupRef.current) return;
    const group = buildingsGroupRef.current;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m?.dispose?.());
          } else {
            obj.material?.dispose?.();
          }
        }
      });
    }

    Object.entries(properties).forEach(([tileIdStr, prop]) => {
      const tileId = parseInt(tileIdStr, 10);
      if (!prop || !prop.ownerId) return;

      const p = getTile3DPos(tileId, TILES.length);
      const owner = players.find((u) => u.id === prop.ownerId);
      const ownerColor = owner?.avatarColor || '#00f0ff';

      // 1. Subtle Flat Glowing Owner Crest & Border Ring on the Street Tile
      // Sits flat on the card surface at y = 0.35, keeping 100% of flag, city name & price pill clean
      const crest = createOwnerCrest(ownerColor, p.width, p.length);
      crest.position.set(p.x, 0.35, p.z);
      crest.rotation.y = p.rotationY;
      crest.traverse((obj) => {
        obj.userData = { tileId, isTile: true };
      });
      group.add(crest);

      // 2. 3D Miniature Tropical Beach Resort Accent on Inner Lawn Plot for Resorts
      const tile = TILES.find((t) => t.id === tileId) || TILES[tileId];
      if (tile?.type === 'resort') {
        const resort = create3DResortAccent(ownerColor);
        const localOffset = new THREE.Vector3(0, 0, 1.8);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
        resort.position.set(p.x + localOffset.x, 0.35, p.z + localOffset.z);
        resort.rotation.y = p.rotationY;

        resort.traverse((obj) => {
          obj.userData = { tileId, isTile: true };
        });
        resort.userData = {
          tileId,
          isTile: true,
          // static
          baseScale: resort.scale.x,
        };
        resort.scale.set(1.0, 1.0, 1.0);
        group.add(resort);
        return; // Skip house/hotel logic for resorts
      }

      // 3. Stylized Low-Poly 3D Buildings on Inner Lawn Plot (Business Tour Progression)
      if (prop.level === 2) {
        // Level 2: 1 Cottage centered on the lawn plot
        const house = create3DHouse(ownerColor);
        const localOffset = new THREE.Vector3(0, 0, 1.8);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
        house.position.set(p.x + localOffset.x, 0.35, p.z + localOffset.z);
        house.rotation.y = p.rotationY;

        house.traverse((obj) => {
          obj.userData = { tileId, isTile: true };
        });
        house.userData = {
          tileId,
          isTile: true,
          // static
          baseScale: house.scale.x,
        };
        house.scale.set(1.0, 1.0, 1.0);
        group.add(house);
      } else if (prop.level === 3) {
        // Level 3: 2 Cottages side-by-side neatly on the lawn plot!
        const offsets = [-1.75, 1.75];
        offsets.forEach((offsetX) => {
          const house = create3DHouse(ownerColor);
          house.scale.set(1.02, 1.02, 1.02);
          const localOffset = new THREE.Vector3(offsetX, 0, 1.8);
          localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
          house.position.set(p.x + localOffset.x, 0.35, p.z + localOffset.z);
          house.rotation.y = p.rotationY;

          house.traverse((obj) => {
            obj.userData = { tileId, isTile: true };
          });
          house.userData = {
            tileId,
            isTile: true,
            // static
            baseScale: 1.02,
          };
          house.scale.set(1.0, 1.0, 1.0);
          group.add(house);
        });
      } else if (prop.level === 4) {
        // Level 4: 1 Hotel / Skyscraper centered on the lawn plot
        const hotel = create3DHotel(ownerColor);
        const localOffset = new THREE.Vector3(0, 0, 1.8);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
        hotel.position.set(p.x + localOffset.x, 0.35, p.z + localOffset.z);
        hotel.rotation.y = p.rotationY;

        hotel.traverse((obj) => {
          obj.userData = { tileId, isTile: true };
        });
        hotel.userData = {
          tileId,
          isTile: true,
          // static
          baseScale: hotel.scale.x,
        };
        hotel.scale.set(1.0, 1.0, 1.0);
        group.add(hotel);
      } else if (prop.level >= 5) {
        // Level 5: 1 Golden Landmark centered on the lawn plot (Immune to Buyouts)
        const landmark = create3DLandmark(ownerColor);
        const localOffset = new THREE.Vector3(0, 0, 1.8);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
        landmark.position.set(p.x + localOffset.x, 0.35, p.z + localOffset.z);
        landmark.rotation.y = p.rotationY;

        landmark.traverse((obj) => {
          obj.userData = { tileId, isTile: true };
        });
        landmark.userData = {
          tileId,
          isTile: true,
          // static
          baseScale: landmark.scale.x,
        };
        landmark.scale.set(1.0, 1.0, 1.0);
        group.add(landmark);
      }
    });
  }, [properties, players, sceneReady]);

  // Synchronize Grounded Player Cash Stacks with real player cash balances
  useEffect(() => {
    if (!sceneReady || !banknoteStacksRef.current || !banknoteStacksRef.current.length) return;

    banknoteStacksRef.current.forEach((stackHolder, idx) => {
      const pData = players[idx];
      if (!pData) {
        stackHolder.visible = false;
        return;
      }
      stackHolder.visible = true;

      // Clear existing children
      while (stackHolder.children.length > 0) {
        const obj = stackHolder.children[0];
        stackHolder.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
      }

      // Rebuild with updated live cash amount, player color & name
      const newStack = create3DBanknoteStack(pData.cash, pData.avatarColor || pData.color, pData.name);
      newStack.scale.set(1.25, 1.25, 1.25);
      stackHolder.add(newStack);
    });
  }, [players, sceneReady]);

  // Synchronize Player Pawns with Diamond Hop Animations
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    const scene = sceneRef.current;
    const pawnMap = pawnMeshesRef.current;

    players.forEach((player, idx) => {
      let entry = pawnMap.get(player.id);
      const playerColor = player.avatarColor || '#00f0ff';
      const playerToken = player.avatarToken || 'tophat';

      // Update or Recreate Pawn if token or distinct color changes
      if (!entry || entry.color !== playerColor || entry.token !== playerToken) {
        if (entry?.group) {
          scene.remove(entry.group);
          entry.group.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach((m) => m?.dispose?.());
              } else {
                obj.material?.dispose?.();
              }
            }
          });
        }

        const pawnGroup = createProceduralPawn(playerToken, playerColor);
        const subAngle = (idx * Math.PI * 2) / Math.max(1, players.length);
        const subOffset = new THREE.Vector3(Math.cos(subAngle) * 0.9, 0, Math.sin(subAngle) * 0.9);
        const isImprisoned = (player.islandTurns || 0) > 0 || !!player.inJail;
        const startPos = isImprisoned
          ? getPrisonField3DPos(idx, players.length)
          : getPawnTile3DPos(player.position || 0, TILES.length, subOffset);

        pawnGroup.position.copy(startPos);
        scene.add(pawnGroup);

        entry = {
          group: pawnGroup,
          currentTile: player.position || 0,
          targetTile: player.position || 0,
          isMoving: false,
          subOffset,
          color: playerColor,
          token: playerToken,
          isImprisoned,
        };
        pawnMap.set(player.id, entry);
      }

      const currentlyImprisoned = (player.islandTurns || 0) > 0 || !!player.inJail;

      // 1. Arrest Extradition: Player was free, now imprisoned!
      if (currentlyImprisoned && !entry.isImprisoned && !entry.isMoving) {
        entry.isMoving = true;
        entry.isImprisoned = true;
        entry.currentTile = player.position || 8;
        entry.targetTile = player.position || 8;

        try { sounds.playDistress?.(playerToken); } catch (e) {}
        try {
          prisonMonumentRef.current?.userData?.openDoor?.();
          sounds.playPrisonDoorOpen?.();
        } catch (e) {}

        const startCoords = entry.group.position.clone();
        const prisonTarget = getPrisonField3DPos(idx, players.length);
        const arrestDuration = 1200;
        const startTime = performance.now();

        const arrestAnim = () => {
          const now = performance.now();
          const p = Math.min(1.0, (now - startTime) / arrestDuration);
          const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          entry.group.position.lerpVectors(startCoords, prisonTarget, ease);
          entry.group.position.y = 0.95 + Math.sin(p * Math.PI) * 7.5;
          entry.group.rotation.y += 0.08;

          if (p < 1.0) {
            requestAnimationFrame(arrestAnim);
          } else {
            entry.group.position.copy(prisonTarget);
            entry.group.rotation.y = 0;
            entry.isMoving = false;
            try {
              prisonMonumentRef.current?.userData?.closeDoor?.(true);
              sounds.playPrisonDoorSlam?.();
            } catch (e) {}
            try { sounds.playCardPlay?.(); } catch (e) {}
          }
        };
        requestAnimationFrame(arrestAnim);
        return;
      }

      // 2. Prison Escape / Bail: Player was imprisoned, now free!
      if (!currentlyImprisoned && entry.isImprisoned && !entry.isMoving) {
        entry.isImprisoned = false;
        if (entry.targetTile === player.position) {
          entry.isMoving = true;
          try {
            prisonMonumentRef.current?.userData?.openDoor?.();
            sounds.playPrisonDoorOpen?.();
          } catch (e) {}
          const startCoords = entry.group.position.clone();
          const boardExit = getPawnTile3DPos(8, TILES.length, entry.subOffset);
          const escapeDuration = 800;
          const startTime = performance.now();

          const escapeAnim = () => {
            const now = performance.now();
            const p = Math.min(1.0, (now - startTime) / escapeDuration);
            const ease = p * (2 - p);
            entry.group.position.lerpVectors(startCoords, boardExit, ease);
            entry.group.position.y = 0.35 + Math.sin(p * Math.PI) * 4.0;

            if (p < 1.0) {
              requestAnimationFrame(escapeAnim);
            } else {
              entry.group.position.copy(boardExit);
              entry.currentTile = 8;
              entry.targetTile = 8;
              entry.isMoving = false;
              try {
                prisonMonumentRef.current?.userData?.closeDoor?.(false);
              } catch (e) {}
            }
          };
          requestAnimationFrame(escapeAnim);
          return;
        }
      }

      // Hop Animation when Position Changes
      if (entry.targetTile !== player.position && !entry.isMoving) {
        entry.isMoving = true;
        const fromTile = entry.currentTile;
        const toTile = player.position;

        onPawnMovementStart?.(player.id, toTile);

        const path = [];
        let curr = fromTile;
        const totalTileCount = TILES.length || 48;
        while (curr !== toTile) {
          curr = (curr + 1) % totalTileCount;
          path.push(curr);
        }

        if (path.length === 0) {
          entry.currentTile = toTile;
          entry.targetTile = toTile;
          entry.isMoving = false;
          onPawnMovementComplete?.(player.id, toTile);
          return;
        }

        // Direct High-Altitude Soaring Flight along Board Perimeter for World Tour
        const isWorldTourFlight = fromTile === 16 || path.length > 12;
        if (isWorldTourFlight) {
          try { sounds.playFlightTakeoff?.(); } catch (err) {}
          const startCoords = entry.group.position.clone();
          const totalTileCount = TILES.length || 32;

          // Build continuous perimeter waypoint spline so pawn visibly flies along board route
          const waypoints = [startCoords.clone()];
          path.forEach((t) => {
            waypoints.push(getPawnTile3DPos(t, totalTileCount, entry.subOffset));
          });

          // Catmull-Rom 3D Curve along the perimeter track
          const flightCurve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.15);

          // Flight duration scales with distance (1900ms - 2800ms)
          const flightDuration = Math.min(2800, Math.max(1900, path.length * 95));
          const flightStartTime = performance.now();
          let hasClaimedStartInFlight = false;

          const flightAnim = () => {
            const now = performance.now();
            const fp = Math.min(1.0, (now - flightStartTime) / flightDuration);

            // Smooth cubic ease-in-out curve
            const ease = fp < 0.5 ? 4 * fp * fp * fp : 1 - Math.pow(-2 * fp + 2, 3) / 2;
            const curvePos = flightCurve.getPointAt(ease);

            // Parabolic soaring flight arc (up to y = 5.2 cruising altitude)
            const arcY = Math.sin(fp * Math.PI) * 5.2;
            entry.group.position.set(curvePos.x, 0.35 + arcY, curvePos.z);

            // Heading & Banking alignment along curve
            const tangent = flightCurve.getTangentAt(Math.min(0.999, ease + 0.005));
            entry.group.rotation.y = Math.atan2(tangent.x, tangent.z);
            entry.group.rotation.z = Math.sin(fp * Math.PI) * 0.22;

            // Check if flight crosses over START (Tile 0) and trigger salary celebration
            if (!hasClaimedStartInFlight && path.includes(0)) {
              const startIdx = path.indexOf(0);
              const startRatio = (startIdx + 0.5) / path.length;
              if (ease >= startRatio) {
                hasClaimedStartInFlight = true;
                try {
                  sounds.playCash?.();
                  sounds.playDoublesSurge?.();
                } catch (err) {}

                // Spawn flying cash notes from START monument into the soaring pawn
                const pStart = getPawnTile3DPos(0, totalTileCount);
                spawnFlyingCash(pStart, entry.group.position, 200000);
              }
            }

            if (fp < 1.0) {
              requestAnimationFrame(flightAnim);
            } else {
              entry.group.rotation.z = 0;
              try { sounds.playPawnLand?.(); } catch (err) {}

              // Landing impact squash-and-stretch
              const origScaleY = entry.group.scale.y;
              const origScaleXZ = entry.group.scale.x;
              const landStartTime = performance.now();
              const landDuration = 350;

              const landAnim = () => {
                const lNow = performance.now();
                const lp = Math.min(1.0, (lNow - landStartTime) / landDuration);
                const squash = Math.sin(lp * Math.PI) * 0.25;
                entry.group.scale.y = origScaleY * (1.0 - squash);
                entry.group.scale.x = origScaleXZ * (1.0 + squash * 0.5);
                entry.group.scale.z = origScaleXZ * (1.0 + squash * 0.5);
                entry.group.position.y = 0.35 - squash * 0.12;

                if (lp < 1.0) {
                  requestAnimationFrame(landAnim);
                } else {
                  entry.group.scale.set(origScaleXZ, origScaleY, origScaleXZ);
                  entry.group.position.y = 0.35;
                  entry.currentTile = toTile;
                  entry.targetTile = toTile;
                  entry.isMoving = false;
                  onPawnMovementComplete?.(player.id, toTile);
                }
              };
              landAnim();
            }
          };
          requestAnimationFrame(flightAnim);
          return;
        }

        let stepIndex = 0;
        const hopToNext = () => {
          if (stepIndex >= path.length) {
            // Landing thump sound and visual squash-and-stretch landing impact (350ms)
            sounds.playPawnLand?.();

            const origScaleY = entry.group.scale.y;
            const origScaleXZ = entry.group.scale.x;
            const landStartTime = performance.now();
            const landDuration = 350;

            const landAnim = () => {
              const now = performance.now();
              const lp = Math.min(1.0, (now - landStartTime) / landDuration);
              const squash = Math.sin(lp * Math.PI) * 0.22;
              entry.group.scale.y = origScaleY * (1.0 - squash);
              entry.group.scale.x = origScaleXZ * (1.0 + squash * 0.45);
              entry.group.scale.z = origScaleXZ * (1.0 + squash * 0.45);
              entry.group.position.y = 0.35 - squash * 0.12;

              if (lp < 1.0) {
                requestAnimationFrame(landAnim);
              } else {
                entry.group.scale.set(origScaleXZ, origScaleY, origScaleXZ);
                entry.group.position.y = 0.35;
                entry.currentTile = toTile;
                entry.targetTile = toTile;
                entry.isMoving = false;
                onPawnMovementComplete?.(player.id, toTile);
              }
            };
            landAnim();
            return;
          }

          const nextTileId = path[stepIndex];
          const targetPos = getPawnTile3DPos(nextTileId, TILES.length, entry.subOffset);
          const startCoords = entry.group.position.clone();

          sounds.playPawnStep?.();

          // If step lands on or passes START (Tile 0), trigger cash animation
          if (nextTileId === 0) {
            try {
              sounds.playCash?.();
            } catch (e) {}
            const pStart = getPawnTile3DPos(0, TILES.length);
            spawnFlyingCash(pStart, targetPos, 200000);
          }

          let t = 0;
          const hopDuration = 180;
          const hopStartTime = performance.now();

          const stepAnim = () => {
            const now = performance.now();
            t = Math.min(1.0, (now - hopStartTime) / hopDuration);

            entry.group.position.lerpVectors(startCoords, targetPos, t);
            entry.group.position.y = 0.35 + Math.sin(t * Math.PI) * 4.5;

            if (t < 1.0) {
              requestAnimationFrame(stepAnim);
            } else {
              stepIndex++;
              setTimeout(hopToNext, 40);
            }
          };
          stepAnim();
        };

        // Smooth Cadence: Dice settles (600ms) -> Pawn hops tile-by-tile
        const diceDelay = diceSimRef.current?.active ? 600 : 80;
        setTimeout(hopToNext, diceDelay);
      }
    });

    // Cleanup disconnected players
    const activeIds = new Set(players.map((p) => p.id));
    pawnMap.forEach((entry, id) => {
      if (!activeIds.has(id)) {
        scene.remove(entry.group);
        pawnMap.delete(id);
      }
    });
  }, [players, sceneReady, onPawnMovementStart, onPawnMovementComplete]);

  // Trigger 3D Dice Simulation on NEW Roll ID
    // 3D Flying Cash Transfer Spawner
  const spawnFlyingCash = useCallback((startPos, endPos, amount = 100000) => {
    if (!cashGroupRef.current) return;
    const noteCount = Math.min(12, Math.max(8, Math.floor((amount || 100000) / 100000)));

    for (let i = 0; i < noteCount; i++) {
      const cCanvas = document.createElement('canvas');
      cCanvas.width = 128;
      cCanvas.height = 64;
      const cCtx = cCanvas.getContext('2d');
      cCtx.fillStyle = '#10b981';
      cCtx.fillRect(0, 0, 128, 64);
      cCtx.strokeStyle = '#34d399';
      cCtx.lineWidth = 4;
      cCtx.strokeRect(4, 4, 120, 56);
      cCtx.fillStyle = '#064e3b';
      cCtx.font = 'bold 24px monospace';
      cCtx.textAlign = 'center';
      cCtx.textBaseline = 'middle';
      cCtx.fillText('CR', 64, 32);

      const cTex = new THREE.CanvasTexture(cCanvas);
      const cMat = new THREE.MeshBasicMaterial({
        map: cTex,
        side: THREE.DoubleSide,
        transparent: true,
      });
      const cGeom = new THREE.PlaneGeometry(0.75, 0.42);
      const noteMesh = new THREE.Mesh(cGeom, cMat);
      noteMesh.position.copy(startPos);
      noteMesh.visible = false;
      cashGroupRef.current.add(noteMesh);

      cashTransfersRef.current.push({
        mesh: noteMesh,
        start: startPos.clone(),
        end: endPos.clone(),
        delay: i * 0.055,
        duration: 0.72 + Math.random() * 0.16,
        elapsed: 0,
        apexY: 3.2 + Math.random() * 1.2,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 12
        ),
        drift: (Math.random() - 0.5) * 1.2,
        landingPlayed: false,
      });
    }
  }, []);

  // Listen to incoming lastPayment and trigger avatar distress & cash parabolic flight
  useEffect(() => {
    if (!lastPayment || !lastPayment.timestamp || lastPayment.timestamp === lastPaymentIdRef.current) return;
    lastPaymentIdRef.current = lastPayment.timestamp;

    const pawnMap = pawnMeshesRef.current;
    const payerEntry = pawnMap.get(lastPayment.payerId);
    const receiverEntry = lastPayment.receiverId ? pawnMap.get(lastPayment.receiverId) : null;

    const startPos = payerEntry ? payerEntry.group.position.clone() : new THREE.Vector3(0, 0.5, 0);
    const endPos = receiverEntry ? receiverEntry.group.position.clone() : new THREE.Vector3(0, 0.5, 0);

    if (payerEntry?.group?.userData?.triggerDistress) {
      payerEntry.group.userData.triggerDistress(1.2);
    }
    if (payerEntry?.token) {
      try { sounds.playDistress?.(payerEntry.token); } catch (e) {}
    }

    spawnFlyingCash(startPos, endPos, lastPayment.amount);
  }, [lastPayment, spawnFlyingCash]);

  // Trigger 3D Dice Simulation on NEW Roll ID
  const triggerDiceRoll = useCallback((val1, val2, skinId = 'classic_red') => {
    if (!diceGroupRef.current) return;
    diceGroupRef.current.visible = true;
    sounds.playDiceRoll();

    const isBlinded = (val2 === 0 || val2 === null || val2 === undefined);

    // Dynamically update 3D dice materials to match the player's equipped dice skin
    if (diceMeshesRef.current[0]) {
      const mats = generateDiceMaterials(skinId);
      diceMeshesRef.current[0].material = mats;

      if (isBlinded) {
        diceMeshesRef.current[0].position.set(0, 1.6, 0);
        if (diceMeshesRef.current[1]) {
          diceMeshesRef.current[1].visible = false;
        }
      } else {
        diceMeshesRef.current[0].position.set(-2.8, 1.6, 0);
        if (diceMeshesRef.current[1]) {
          diceMeshesRef.current[1].visible = true;
          diceMeshesRef.current[1].material = mats;
          diceMeshesRef.current[1].position.set(2.8, 1.6, 0);
        }
      }
    }

    const getRot = (val) => {
      switch (val) {
        case 1: return new THREE.Euler(0, 0, 0);
        case 2: return new THREE.Euler(-Math.PI / 2, 0, 0);
        case 3: return new THREE.Euler(0, 0, Math.PI / 2);
        case 4: return new THREE.Euler(0, 0, -Math.PI / 2);
        case 5: return new THREE.Euler(Math.PI / 2, 0, 0);
        case 6: return new THREE.Euler(Math.PI, 0, 0);
        default: return new THREE.Euler(0, 0, 0);
      }
    };

    diceSimRef.current = {
      active: true,
      progress: 0,
      targetRotation1: getRot(val1),
      targetRotation2: isBlinded ? null : getRot(val2),
    };
  }, []);

  useEffect(() => {
    if (lastDiceResult && lastDiceResult.id && lastDiceResult.id !== lastRollIdRef.current) {
      lastRollIdRef.current = lastDiceResult.id;
      const rollingPlayer = players.find(p => p.id === lastDiceResult.playerId);
      const skin = rollingPlayer?.diceSkin || diceSkin || 'classic_red';
      const d2Val = lastDiceResult.d2 !== undefined ? lastDiceResult.d2 : 1;
      triggerDiceRoll(lastDiceResult.d1 || 1, d2Val, skin);
    }
  }, [lastDiceResult, triggerDiceRoll, players, diceSkin]);

  // Synchronize 3D Direct Map Targeting Beacons & Valid Target Highlighting
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;

    // Reset all tile emissive styles
    tileMeshesRef.current.forEach((tMesh) => {
      if (tMesh) {
        const topMat = tMesh.material?.[2];
        if (topMat?.emissive) {
          topMat.emissive.setHex(0x000000);
          topMat.emissiveIntensity = 0;
        }
        tMesh.position.y = 0.17;
      }
    });

    // Clear existing beacons
    if (targetingGroupRef.current) {
      while (targetingGroupRef.current.children.length > 0) {
        const child = targetingGroupRef.current.children[0];
        targetingGroupRef.current.remove(child);
        child.traverse?.((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m?.dispose?.());
            else obj.material?.dispose?.();
          }
        });
      }
    }

    if (targetingMode?.active && Array.isArray(targetingMode.eligibleTileIds) && targetingMode.eligibleTileIds.length > 0) {
      const beaconColor = targetingMode.color || 0x38bdf8;

      targetingMode.eligibleTileIds.forEach((tileId, idx) => {
        // Highlight tile surface with glowing emissive
        const tMesh = tileMeshesRef.current[tileId];
        if (tMesh) {
          const topMat = tMesh.material?.[2];
          if (topMat?.emissive) {
            topMat.emissive.setHex(beaconColor);
            topMat.emissiveIntensity = 0.55;
          }
        }

        // Add 3D Floating Holographic Beacon Marker above tile
        if (targetingGroupRef.current) {
          const p = getTile3DPos(tileId, TILES.length);
          const beaconGroup = new THREE.Group();
          beaconGroup.position.set(p.x, 0, p.z);
          beaconGroup.userData = { tileId, isTile: true, isTargetBeacon: true };

          // Ground Pulsing Halo Ring
          const ringGeom = new THREE.RingGeometry(1.4, 2.1, 32);
          ringGeom.rotateX(-Math.PI / 2);
          const ringMat = new THREE.MeshBasicMaterial({
            color: beaconColor,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide,
          });
          const ringMesh = new THREE.Mesh(ringGeom, ringMat);
          ringMesh.position.y = 0.28;
          ringMesh.userData = { tileId, isTile: true };
          beaconGroup.add(ringMesh);

          // Translucent Light Column
          const beamGeom = new THREE.CylinderGeometry(0.3, 1.2, 3.2, 16, 1, true);
          const beamMat = new THREE.MeshBasicMaterial({
            color: beaconColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const beamMesh = new THREE.Mesh(beamGeom, beamMat);
          beamMesh.position.y = 1.9;
          beamMesh.userData = { tileId, isTile: true };
          beaconGroup.add(beamMesh);

          // Floating 3D Octahedral Waypoint Crystal
          const markerGeom = new THREE.OctahedronGeometry(0.75, 0);
          const markerMat = new THREE.MeshStandardMaterial({
            color: beaconColor,
            emissive: beaconColor,
            emissiveIntensity: 0.85,
            roughness: 0.2,
            metalness: 0.8,
          });
          const markerMesh = new THREE.Mesh(markerGeom, markerMat);
          markerMesh.position.y = 3.6;
          markerMesh.userData = { tileId, isTile: true };
          beaconGroup.add(markerMesh);

          beaconGroup.userData = {
            tileId,
            isTile: true,
            ring: ringMesh,
            beam: beamMesh,
            marker: markerMesh,
            baseY: 3.6,
            phase: (idx * 0.7) % (Math.PI * 2),
          };

          targetingGroupRef.current.add(beaconGroup);
        }
      });
    }
  }, [targetingMode, sceneReady]);


  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      userSelect: 'none',
      pointerEvents: 'auto',
    }}>
      {/* 3D WebGL Canvas taking 100% of the screen */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'default' }} />

      

      {/* Floating Total Dice Roll Indicator Pill (Above Pitch Center) */}
      {lastDiceResult && (
        <div
          key={lastDiceResult.id || `${lastDiceResult.d1}_${lastDiceResult.d2}`}
          style={{
            position: 'absolute',
            top: '36%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
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
          }}
        >
          {lastDiceResult.d2 === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🍅</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#f87171', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                BLINDED ROLL:
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '17px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                  border: '1px solid #ef4444',
                }}
              >
                {lastDiceResult.d1}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '17px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                  border: '1px solid #ef4444',
                }}
              >
                {lastDiceResult.d1}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '15px', fontWeight: 800 }}>+</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '17px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                  border: '1px solid #ef4444',
                }}
              >
                {lastDiceResult.d2}
              </span>
            </div>
          )}

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
              {lastDiceResult.d1 + lastDiceResult.d2}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Roll
            </span>
          </div>

          {/* Doubles Callout */}
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
              <Sparkles size={12} /> DOUBLES!
            </div>
          )}
        </div>
      )}

      {/* Interactive Center HTML Stage (Lobby & Turn Action Modals) */}
      {centerContent && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '460px',
          maxWidth: '88%',
          zIndex: 8,
          pointerEvents: 'auto',
        }}>
          {centerContent}
        </div>
      )}
    </div>
  );
}

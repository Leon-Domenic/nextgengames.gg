'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { Sparkles } from 'lucide-react';
import {
  create3DHouse,
  create3DHotel,
  createOwnerCrest,
  createProceduralPawn,
  generateDiceMaterials,
} from '@/lib/board-brawl/pawnModels3D';

// Authentic Monopoly 45-Degree Diamond Perimeter Math
// 4 Sides with Square Corner Fields and Outward-Facing Cards
export function getTile3DPos(id, totalTiles = 48) {
  const R_outer = 56;
  const trackDepth = 8.5; // Depth of the track from outer board edge to inner lawn
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

export default function Board3D({
  properties = {},
  players = [],
  activeTileId = 0,
  lastDiceResult = null,
  diceSkin = 'classic_red',
  centerContent = null,
  onRollDice,
  onBuyCity,
  onBuyoutCity,
  onUpgradeCity,
  onSetFestival,
  onThrowTomato,
  onEndTurn,
  onTileClick,
  onPawnMovementStart,
  onPawnMovementComplete,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  // Mesh & Model Refs
  const tileMeshesRef = useRef([]);
  const hoveredMeshRef = useRef(null);
  const pawnMeshesRef = useRef(new Map());
  const buildingsGroupRef = useRef(null);
  const diceGroupRef = useRef(null);
  const diceMeshesRef = useRef([]);
  const diceSimRef = useRef({ active: false, progress: 1.0, targetRotation1: null, targetRotation2: null });
  const lastRollIdRef = useRef(null);

  const onTileClickRef = useRef(onTileClick);
  useEffect(() => {
    onTileClickRef.current = onTileClick;
  }, [onTileClick]);

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

      // Check camera mode setting: 'topdown' (76 deg) vs 'isometric'/'follow' (43 deg)
      const camMode = typeof window !== 'undefined' ? (localStorage.getItem('ngg_camera_mode') || 'follow') : 'follow';
      const pitchDeg = camMode === 'topdown' ? 76 : 43;
      const pitchRad = (pitchDeg * Math.PI) / 180;

      // Distance dynamically tuned:
      // On widescreen (aspect >= 1.55), fills ~82% of height leaving room for HUD.
      // On narrower screens, zooms out so width fits cleanly.
      let dist = camMode === 'topdown' ? 120 : 140;
      if (aspect < 1.55) {
        dist = (camMode === 'topdown' ? 120 : 140) * (1.55 / Math.max(aspect, 0.7));
      }

      const posY = dist * Math.sin(pitchRad);
      const posZ = dist * Math.cos(pitchRad);

      cam.position.set(0, posY, posZ);
      cam.lookAt(0, -3, 0);
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
    renderer.shadowMap.type = initialQuality === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting Rig (Rich Cinematic Tabletop Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfffbeb, 1.35);
    mainSun.position.set(60, 130, 70);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0004;
    scene.add(mainSun);

    const blueSkyFill = new THREE.DirectionalLight(0xbae6fd, 0.55);
    blueSkyFill.position.set(-70, 90, -70);
    scene.add(blueSkyFill);

    // 5. Contact Shadow Ground Plane
    const groundGeom = new THREE.PlaneGeometry(260, 260);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 6. Center Striped Lawn Pitch Texture (Business Tour Mowed Grass)
    const lawnCanvas = document.createElement('canvas');
    lawnCanvas.width = 512;
    lawnCanvas.height = 512;
    const lCtx = lawnCanvas.getContext('2d');

    // Diagonal alternating grass mowing stripes
    const stripeWidth = 32;
    for (let x = -512; x < 1024; x += stripeWidth) {
      const isEven = Math.floor(x / stripeWidth) % 2 === 0;
      lCtx.fillStyle = isEven ? '#48bb78' : '#38a169';
      lCtx.beginPath();
      lCtx.moveTo(x, 0);
      lCtx.lineTo(x + stripeWidth, 0);
      lCtx.lineTo(x + stripeWidth + 512, 512);
      lCtx.lineTo(x + 512, 512);
      lCtx.closePath();
      lCtx.fill();
    }

    // Soft white chalk center circle & pitch markings
    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    lCtx.lineWidth = 6;
    lCtx.beginPath();
    lCtx.arc(256, 256, 85, 0, Math.PI * 2);
    lCtx.stroke();

    lCtx.beginPath();
    lCtx.arc(256, 256, 12, 0, Math.PI * 2);
    lCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    lCtx.fill();

    // Subtle scattered flower/confetti petals
    const petalColors = ['#f43f5e', '#fbbf24', '#38bdf8', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      lCtx.fillStyle = petalColors[i % petalColors.length];
      lCtx.beginPath();
      lCtx.arc(px, py, 3 + Math.random() * 2, 0, Math.PI * 2);
      lCtx.fill();
    }

    const lawnTexture = new THREE.CanvasTexture(lawnCanvas);
    lawnTexture.anisotropy = 4;

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

    // 7. Luxury Diamond Table Base (Warm Wood Table with Striped Lawn Pitch on Top)
    const tableGroup = new THREE.Group();
    const tableGeom = new THREE.BoxGeometry(82, 3.2, 82);
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
    tableMesh.position.y = -1.6;
    tableMesh.receiveShadow = true;
    tableGroup.add(tableMesh);

    // Golden Rim Trim
    const trimGeom = new THREE.BoxGeometry(84, 0.4, 84);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.85,
    });
    const trimMesh = new THREE.Mesh(trimGeom, trimMat);
    trimMesh.rotation.y = Math.PI / 4;
    trimMesh.position.y = -0.35;
    tableGroup.add(trimMesh);

    // Center Striped Lawn Pitch (Business Tour Green Field)
    const lawnGeom = new THREE.PlaneGeometry(76, 76);
    const lawnMesh = new THREE.Mesh(lawnGeom, lawnMat);
    lawnMesh.rotation.x = -Math.PI / 2;
    lawnMesh.rotation.z = Math.PI / 4;
    lawnMesh.position.y = 0.08;
    lawnMesh.receiveShadow = true;
    tableGroup.add(lawnMesh);

    scene.add(tableGroup);

    // 7. 48 Perimeter 3D Tiles (Monopoly Flush Square Corners & Outward-Facing Slabs)
    const tileGroup = new THREE.Group();
    const tileMeshes = [];

    TILES.forEach((tile) => {
      const p = getTile3DPos(tile.id, TILES.length);

      // Dynamic High-Res Ultra Crisp Tile Texture (512x512)
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Base background: Crisp clean bright white slab
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);

      // High contrast outer dark border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(7, 7, 498, 498);

      // Inner boundary
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(16, 16, 480, 480);

      if (p.isCorner) {
        // Authentic Monopoly Corner Field (Pristine square slab, centered emblem & outward-facing header)
        ctx.save();
        ctx.translate(256, 256);
        ctx.rotate(p.canvasAngle);

        const cornerType = tile.type || (p.side === 0 ? 'start' : p.side === 1 ? 'jail' : p.side === 2 ? 'festival' : 'airport');

        if (cornerType === 'start' || p.side === 0) {
          // START / GO (South Corner): Emerald ribbon, forward chevron arrow, salary pill
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.roundRect(-165, -220, 330, 74, 18);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('START', 0, -168);

          // Center circular emblem with 🏁
          ctx.beginPath();
          ctx.arc(0, -10, 72, 0, Math.PI * 2);
          ctx.fillStyle = '#ecfdf5';
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#059669';
          ctx.stroke();

          ctx.font = '76px sans-serif';
          ctx.fillText('🏁', 0, 16);

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

          // Salary pill (facing center lawn)
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(-160, 135, 320, 68, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#047857';
          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('COLLECT ₩200K', 0, 180);

          // Inner track asphalt curve
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(-90, 222, 180, 28, 14);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-35, 234, 70, 4);
        } else if (cornerType === 'jail' || p.side === 1) {
          // LOST ISLAND / PRISON (West Corner): Tropical island cell & bail
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.roundRect(-170, -220, 340, 74, 18);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('LOST ISLAND', 0, -168);

          // Center circular emblem
          ctx.beginPath();
          ctx.arc(0, -10, 72, 0, Math.PI * 2);
          ctx.fillStyle = '#fffbeb';
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#d97706';
          ctx.stroke();

          ctx.font = '78px sans-serif';
          ctx.fillText('🌴', 0, 16);

          // Bail pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(-155, 135, 310, 68, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#b45309';
          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('BAIL: ₩100K', 0, 180);

          // Inner track asphalt curve
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(-90, 222, 180, 28, 14);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-35, 234, 70, 4);
        } else if (cornerType === 'festival' || p.side === 2) {
          // CHAMPIONSHIPS / FESTIVAL (North Corner): Trophy & 2X Rent Host
          ctx.fillStyle = '#7c3aed';
          ctx.beginPath();
          ctx.roundRect(-175, -220, 350, 74, 18);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CHAMPIONSHIPS', 0, -168);

          // Center circular emblem
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
          ctx.fillText('2X RENT HOST', 0, 180);

          // Inner track asphalt curve
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(-90, 222, 180, 28, 14);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-35, 234, 70, 4);
        } else {
          // WORLD TOUR / AIRPORT (East Corner): Supersonic airliner & fly anywhere
          ctx.fillStyle = '#0891b2';
          ctx.beginPath();
          ctx.roundRect(-170, -220, 340, 74, 18);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('WORLD TOUR', 0, -168);

          // Center circular emblem
          ctx.beginPath();
          ctx.arc(0, -10, 72, 0, Math.PI * 2);
          ctx.fillStyle = '#ecfeff';
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#0891b2';
          ctx.stroke();

          ctx.font = '78px sans-serif';
          ctx.fillText('✈️', 0, 16);

          // Fly Anywhere pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(-160, 135, 320, 68, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0e7490';
          ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('FLY ANYWHERE', 0, 180);

          // Inner track asphalt curve
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(-90, 222, 180, 28, 14);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-35, 234, 70, 4);
        }

        ctx.restore();
      } else if (tile.type === 'city') {
        // District color ribbon (top 132px) - FACES OUTSIDE OF BOARD
        ctx.fillStyle = tile.color || '#3b82f6';
        ctx.fillRect(18, 18, 476, 126);

        // Subtle gloss gradient
        const gloss = ctx.createLinearGradient(0, 18, 0, 80);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gloss;
        ctx.fillRect(18, 18, 476, 62);

        // Divider line below header
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(18, 142, 476, 4);

        // Country flag and district name in bold white
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${tile.flag || ''} ${tile.country || ''}`, 256, 88);

        // City name in ultra-bold dark slate
        ctx.fillStyle = '#0f172a';
        const name = tile.name.toUpperCase();
        const fontSize = name.length > 9 ? 48 : name.length > 7 ? 54 : 64;
        ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(name, 256, 246);

        // Ultra high-contrast bold price pill
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(50, 325, 412, 94, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const displayPrice = tile.price >= 1000000
          ? `₩${(tile.price / 1000000).toFixed(1)}M`
          : `₩${Math.round(tile.price / 1000)}K`;
        ctx.fillText(displayPrice, 256, 392);

        // Asphalt track stripe at inner edge
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(18, 444, 476, 50);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(150, 466, 212, 6);
      } else {
        // Perimeter Event Squares (Chance, Armory, Tax) - FACES OUTSIDE OF BOARD
        const taxSub = tile.amount ? `PAY ₩${Math.round(tile.amount / 1000)}K` : 'PAY TAX';
        const eventConfig = {
          chance: { color: '#ec4899', icon: '❓', title: 'CHANCE', sub: 'LUCKY DRAW', subColor: '#be185d' },
          armory: { color: '#ef4444', icon: '🍅', title: 'ARMORY', sub: '+2 TOMATOES', subColor: '#b91c1c' },
          tax: { color: '#475569', icon: '💸', title: tile.name.toUpperCase(), sub: taxSub, subColor: '#b91c1c' },
        };
        const cfg = eventConfig[tile.type] || {
          color: '#0284c7',
          icon: tile.icon || '🎯',
          title: tile.name.toUpperCase(),
          sub: tile.amount ? `PAY ₩${Math.round(tile.amount / 1000)}K` : (tile.type || '').toUpperCase(),
          subColor: '#0369a1',
        };

        ctx.fillStyle = cfg.color;
        ctx.fillRect(18, 18, 476, 126);

        // Subtle gloss gradient
        const gloss = ctx.createLinearGradient(0, 18, 0, 80);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gloss;
        ctx.fillRect(18, 18, 476, 62);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(18, 142, 476, 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cfg.title, 256, 90);

        ctx.font = '96px sans-serif';
        ctx.fillText(cfg.icon, 256, 256);

        // Pill box
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(50, 325, 412, 94, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = cfg.subColor;
        ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(cfg.sub, 256, 390);

        // Asphalt track stripe at inner edge
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(18, 444, 476, 50);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(150, 466, 212, 6);
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
    });

    tileMeshesRef.current = tileMeshes;
    scene.add(tileGroup);

    // 8. Dynamic 3D Buildings Group
    const buildingsGroup = new THREE.Group();
    buildingsGroupRef.current = buildingsGroup;
    scene.add(buildingsGroup);

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
      return raycaster.intersectObjects(tileMeshesRef.current, false);
    };

    const handlePointerMove = (e) => {
      const intersects = getRaycastIntersects(e.clientX, e.clientY);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
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
          hitMesh.position.y = 0.32;
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
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const tileId = hitMesh.userData?.tileId;
        if (tileId !== undefined && tileId !== null) {
          sounds.playClick?.();
          onTileClickRef.current?.(tileId);
        }
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

      // Idle Hover & Real-time Avatar Animations for Pawns
      pawnMeshesRef.current.forEach(({ group, isMoving }) => {
        if (!isMoving && group) {
          group.position.y = 0.2 + Math.sin(elapsed * 3.5) * 0.12;
        }
        if (group && typeof group.userData?.update === 'function') {
          group.userData.update(delta, elapsed, isMoving);
        }
      });

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

  // Update Dynamic 3D Buildings (Green Houses, Red Hotels, Owner Crests)
  useEffect(() => {
    if (!sceneReady || !buildingsGroupRef.current) return;
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

      // 1. Owner Crest on the Ground in Player's Custom Color
      const crest = createOwnerCrest(ownerColor);
      crest.position.set(p.x, 0.28, p.z);
      crest.rotation.y = p.rotationY;
      group.add(crest);

      // 2. 3D Miniature Houses (Levels 2-4) in Player's Custom Color
      if (prop.level >= 2 && prop.level <= 4) {
        const houseCount = prop.level - 1;
        const offsets = houseCount === 1 ? [0] : houseCount === 2 ? [-1.1, 1.1] : [-1.8, 0, 1.8];

        offsets.forEach((offsetX) => {
          const house = create3DHouse(ownerColor);
          const localOffset = new THREE.Vector3(offsetX, 0.26, -2.0);
          localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
          house.position.set(p.x + localOffset.x, 0.26, p.z + localOffset.z);
          house.rotation.y = p.rotationY;
          group.add(house);
        });
      }

      // 3. 3D Luxury Hotel / Skyscraper (Level 5) in Player's Custom Color
      if (prop.level >= 5) {
        const hotel = create3DHotel(ownerColor);
        const localOffset = new THREE.Vector3(0, 0.26, -1.8);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
        hotel.position.set(p.x + localOffset.x, 0.26, p.z + localOffset.z);
        hotel.rotation.y = p.rotationY;
        group.add(hotel);
      }
    });
  }, [properties, players, sceneReady]);

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
        const startPos = getTile3DPos(player.position || 0, TILES.length);

        const subAngle = (idx * Math.PI * 2) / Math.max(1, players.length);
        const subOffset = new THREE.Vector3(Math.cos(subAngle) * 1.3, 0, Math.sin(subAngle) * 1.3);

        pawnGroup.position.set(startPos.x + subOffset.x, 0.25, startPos.z + subOffset.z);
        scene.add(pawnGroup);

        entry = {
          group: pawnGroup,
          currentTile: player.position || 0,
          targetTile: player.position || 0,
          isMoving: false,
          subOffset,
          color: playerColor,
          token: playerToken,
        };
        pawnMap.set(player.id, entry);
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
              entry.group.position.y = 0.25 - squash * 0.12;

              if (lp < 1.0) {
                requestAnimationFrame(landAnim);
              } else {
                entry.group.scale.set(origScaleXZ, origScaleY, origScaleXZ);
                entry.group.position.y = 0.25;
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
          const targetCoords = getTile3DPos(nextTileId, TILES.length);
          const startCoords = entry.group.position.clone();
          const targetPos = new THREE.Vector3(
            targetCoords.x + entry.subOffset.x,
            0.25,
            targetCoords.z + entry.subOffset.z
          );

          sounds.playPawnStep?.();

          let t = 0;
          const hopDuration = 180;
          const hopStartTime = performance.now();

          const stepAnim = () => {
            const now = performance.now();
            t = Math.min(1.0, (now - hopStartTime) / hopDuration);

            entry.group.position.lerpVectors(startCoords, targetPos, t);
            entry.group.position.y = 0.25 + Math.sin(t * Math.PI) * 2.4;

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
  const triggerDiceRoll = useCallback((val1, val2, skinId = 'classic_red') => {
    if (!diceGroupRef.current) return;
    diceGroupRef.current.visible = true;
    sounds.playDiceRoll();

    // Dynamically update 3D dice materials to match the player's equipped dice skin
    if (diceMeshesRef.current[0] && diceMeshesRef.current[1]) {
      const mats = generateDiceMaterials(skinId);
      diceMeshesRef.current[0].material = mats;
      diceMeshesRef.current[1].material = mats;
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
      targetRotation2: getRot(val2),
    };
  }, []);

  useEffect(() => {
    if (lastDiceResult && lastDiceResult.id && lastDiceResult.id !== lastRollIdRef.current) {
      lastRollIdRef.current = lastDiceResult.id;
      const rollingPlayer = players.find(p => p.id === lastDiceResult.playerId);
      const skin = rollingPlayer?.diceSkin || diceSkin || 'classic_red';
      triggerDiceRoll(lastDiceResult.d1 || 1, lastDiceResult.d2 || 1, skin);
    }
  }, [lastDiceResult, triggerDiceRoll, players, diceSkin]);

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

      {/* Floating Dice Result Square Badge (Above Grass Center) */}
      {lastDiceResult && (
        <div style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          padding: '10px 18px',
          borderRadius: '16px',
          background: '#ffffff',
          border: '2px solid #38bdf8',
          color: '#0f172a',
          fontSize: '20px',
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
          pointerEvents: 'none',
        }}>
          <span>🎲 {lastDiceResult.d1 + lastDiceResult.d2}</span>
          {lastDiceResult.isDoubles && (
            <span style={{ fontSize: '13px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Sparkles size={14} /> 2X!
            </span>
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

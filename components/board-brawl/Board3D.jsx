'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import { Sparkles } from 'lucide-react';
import {
  create3DHouse,
  create3DHotel,
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
  create3DJackpotCoinPile,
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
  communityJackpot = 100000,
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
  const curbMeshesRef = useRef([]);
  const diceGroupRef = useRef(null);
  const diceMeshesRef = useRef([]);
  const diceSimRef = useRef({ active: false, progress: 1.0, targetRotation1: null, targetRotation2: null });
  const monumentsRef = useRef([]);
  const banknoteStacksRef = useRef([]);
  const jackpotPileRef = useRef(null);
  const lastRollIdRef = useRef(null);

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

    // 6a. Dark Asphalt Road Perimeter (Encircles the center pitch between lawn and street tiles)
    lCtx.fillStyle = '#1e293b'; // Charcoal asphalt base
    lCtx.fillRect(0, 0, 2048, 2048);

    // Subtle asphalt road grain / noise
    lCtx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    for (let r = 0; r < 2048; r += 8) {
      lCtx.fillRect(0, r, 2048, 4);
    }

    // Dashed road lane divider markings encircling the perimeter
    lCtx.save();
    lCtx.strokeStyle = 'rgba(254, 240, 138, 0.9)'; // Luminous road yellow
    lCtx.lineWidth = 10;
    lCtx.setLineDash([44, 28]);
    lCtx.strokeRect(96, 96, 2048 - 192, 2048 - 192);
    lCtx.restore();

    // Road curb / stone border separating asphalt road from green lawn pitch
    lCtx.lineWidth = 12;
    lCtx.strokeStyle = '#475569';
    lCtx.strokeRect(184, 184, 2048 - 368, 2048 - 368);

    // 6b. Center Green Field (Vibrant Mowed Lawn Stadium Pitch)
    // Clipped neatly inside the inner perimeter road
    lCtx.save();
    lCtx.beginPath();
    lCtx.rect(190, 190, 1668, 1668);
    lCtx.clip();

    // Diagonal alternating mowed grass stripes (Vibrant emerald light grass vs rich medium turf)
    const stripeWidth = 56;
    for (let x = -2048; x < 4096; x += stripeWidth) {
      const isEven = Math.floor(x / stripeWidth) % 2 === 0;
      lCtx.fillStyle = isEven ? '#4ade80' : '#22c55e';
      lCtx.beginPath();
      lCtx.moveTo(x, 0);
      lCtx.lineTo(x + stripeWidth, 0);
      lCtx.lineTo(x + stripeWidth + 2048, 2048);
      lCtx.lineTo(x + 2048, 2048);
      lCtx.closePath();
      lCtx.fill();
    }

    // Crisp white field boundary lines
    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    lCtx.lineWidth = 10;
    lCtx.strokeRect(216, 216, 1616, 1616);

    // Pitch Corner Arcs in crisp white chalk
    const arcRadius = 130;
    // Top-Left
    lCtx.beginPath();
    lCtx.arc(216, 216, arcRadius, 0, Math.PI / 2);
    lCtx.stroke();
    // Top-Right
    lCtx.beginPath();
    lCtx.arc(1832, 216, arcRadius, Math.PI / 2, Math.PI);
    lCtx.stroke();
    // Bottom-Right
    lCtx.beginPath();
    lCtx.arc(1832, 1832, arcRadius, Math.PI, (3 * Math.PI) / 2);
    lCtx.stroke();
    // Bottom-Left
    lCtx.beginPath();
    lCtx.arc(216, 1832, arcRadius, (3 * Math.PI) / 2, Math.PI * 2);
    lCtx.stroke();

    // Center Halfway Line
    lCtx.beginPath();
    lCtx.moveTo(216, 1024);
    lCtx.lineTo(1832, 1024);
    lCtx.stroke();

    // Center Circle (Radius ~290)
    lCtx.beginPath();
    lCtx.arc(1024, 1024, 290, 0, Math.PI * 2);
    lCtx.stroke();

    // Center Kickoff / Penalty Spot
    lCtx.beginPath();
    lCtx.arc(1024, 1024, 28, 0, Math.PI * 2);
    lCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    lCtx.fill();

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

    // 7. Luxury Diamond Table Base (Warm Wood Table with Striped Lawn Pitch on Top)
    const tableGroup = new THREE.Group();
    const tableGeom = new THREE.BoxGeometry(92, 3.2, 92);
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
    const trimGeom = new THREE.BoxGeometry(94, 0.4, 94);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.85,
    });
    const trimMesh = new THREE.Mesh(trimGeom, trimMat);
    trimMesh.rotation.y = Math.PI / 4;
    trimMesh.position.y = -0.35;
    tableGroup.add(trimMesh);

    // Center Striped Lawn Pitch with Inner Perimeter Road (Business Tour Green Field)
    const lawnGeom = new THREE.PlaneGeometry(63.5, 63.5);
    const lawnMesh = new THREE.Mesh(lawnGeom, lawnMat);
    lawnMesh.rotation.x = -Math.PI / 2;
    lawnMesh.rotation.z = Math.PI / 4;
    lawnMesh.position.y = 0.08;
    lawnMesh.receiveShadow = true;
    tableGroup.add(lawnMesh);

    scene.add(tableGroup);

    // 7b. Elevated Outer Curb / Terrace Strip (Width ~4.0, Height ~0.45, Soft Stone & Lawn Trim)
    // Placed behind each of the 4 diamond street sides outside the track
    const curbGroup = new THREE.Group();
    const curbMeshes = [];
    const R_outer = 56;
    const trackDepth = 8.5;
    const sideLength = R_outer * Math.SQRT2; // ~79.2
    const streetSpan = sideLength - 2 * trackDepth; // ~62.2 units
    const curbWidth = 4.0;
    const curbHeight = 0.45;

    const apexes = [
      new THREE.Vector2(0, R_outer),      // Corner 0: South (START)
      new THREE.Vector2(-R_outer, 0),     // Corner 1: West (PRISON)
      new THREE.Vector2(0, -R_outer),     // Corner 2: North (CHAMPIONSHIPS)
      new THREE.Vector2(R_outer, 0),      // Corner 3: East (WORLD TOUR)
    ];

    const sideRotations = [
      (3 * Math.PI) / 4,   // Side 0
      Math.PI / 4,         // Side 1
      -Math.PI / 4,        // Side 2
      (-3 * Math.PI) / 4,  // Side 3
    ];

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate soft stone curb
      roughness: 0.65,
      metalness: 0.15,
    });

    const terraceLawnMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a, // Manicured terrace lawn top
      roughness: 0.82,
      metalness: 0.05,
    });

    const curbTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Polished brass / golden curb edge trim
      roughness: 0.35,
      metalness: 0.75,
    });

    for (let side = 0; side < 4; side++) {
      const pStart = apexes[side];
      const pEnd = apexes[(side + 1) % 4];
      const u_edge = new THREE.Vector2().subVectors(pEnd, pStart).normalize();
      const mid = new THREE.Vector2().addVectors(pStart, pEnd).multiplyScalar(0.5);
      let u_in = new THREE.Vector2(-u_edge.y, u_edge.x);
      if (u_in.dot(mid) > 0) u_in.negate();
      const u_out = u_in.clone().negate();

      // Outer edge of the street lies along mid. Center of curb is curbWidth / 2 outward.
      const curbCenter = mid.clone().add(u_out.clone().multiplyScalar(curbWidth / 2));

      const sideCurbGroup = new THREE.Group();
      sideCurbGroup.position.set(curbCenter.x, curbHeight / 2, curbCenter.y);
      sideCurbGroup.rotation.y = sideRotations[side];

      // Base stone curb with lawn top (+Y face is terraceLawnMat)
      const curbGeom = new THREE.BoxGeometry(streetSpan, curbHeight, curbWidth);
      const curbMesh = new THREE.Mesh(curbGeom, [stoneMat, stoneMat, terraceLawnMat, stoneMat, stoneMat, stoneMat]);
      curbMesh.castShadow = true;
      curbMesh.receiveShadow = true;
      sideCurbGroup.add(curbMesh);

      // Inner street-side golden bevel trim (faces street tiles at local Z = +curbWidth / 2)
      const innerTrimGeom = new THREE.BoxGeometry(streetSpan + 0.1, 0.08, 0.28);
      const innerTrim = new THREE.Mesh(innerTrimGeom, curbTrimMat);
      innerTrim.position.set(0, curbHeight / 2 + 0.02, curbWidth / 2 - 0.14);
      sideCurbGroup.add(innerTrim);

      // Outer stone terrace railing edge (at local Z = -curbWidth / 2)
      const outerTrimGeom = new THREE.BoxGeometry(streetSpan + 0.1, 0.06, 0.22);
      const outerTrim = new THREE.Mesh(outerTrimGeom, stoneMat);
      outerTrim.position.set(0, curbHeight / 2 + 0.02, -curbWidth / 2 + 0.11);
      sideCurbGroup.add(outerTrim);

      curbGroup.add(sideCurbGroup);
      curbMeshes.push(curbMesh);
    }

    curbMeshesRef.current = curbMeshes;
    scene.add(curbGroup);

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
      } else {
        // Helper function to draw text rotated by Math.PI (180 deg) so it points outwards
        // away from the center of the board, allowing players viewing from outside to read cleanly!
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

        if (tile.type === 'resort') {
          // Vibrant Cyan / Tropical Resort Field (Outward-facing header, beach icon, and price pill)
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(18, 18, 476, 126);

          // Subtle gloss gradient
          const gloss = ctx.createLinearGradient(0, 18, 0, 80);
          gloss.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gloss;
          ctx.fillRect(18, 18, 476, 62);

          // Dark divider line below header
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(18, 142, 476, 4);

          // Country flag and district name in bold white pointing outwards
          drawOutwardText(`${tile.flag || '🏖️'} ${tile.country || 'RESORT'}`, 256, 81, '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#ffffff');

          // Resort palm tree icon
          drawOutwardText('🏖️', 256, 205, '76px sans-serif', '#0891b2');

          // Resort name in bold dark slate pointing outwards
          const rName = tile.name.toUpperCase();
          const rFontSize = rName.length > 13 ? 38 : rName.length > 10 ? 44 : 50;
          drawOutwardText(rName, 256, 275, `900 ${rFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`, '#0f172a', 440);

          // Ultra high-contrast bold price pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(50, 325, 412, 94, 24);
          ctx.fill();
          ctx.stroke();

          const rPrice = tile.price >= 1000000
            ? `₩${(tile.price / 1000000).toFixed(1)}M`
            : `₩${Math.round(tile.price / 1000)}K`;
          drawOutwardText(`${rPrice} • RESORT`, 256, 372, '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0891b2');

          // Asphalt track stripe at inner edge
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(18, 444, 476, 50);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(150, 466, 212, 6);
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

          // Country flag and district name in bold white pointing outwards
          drawOutwardText(`${tile.flag || ''} ${tile.country || ''}`, 256, 81, '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#ffffff');

          // City name in ultra-bold dark slate pointing outwards
          const name = tile.name.toUpperCase();
          const fontSize = name.length > 9 ? 46 : name.length > 7 ? 52 : 62;
          drawOutwardText(name, 256, 246, `900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`, '#0f172a', 440);

          // Ultra high-contrast bold price pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(50, 325, 412, 94, 24);
          ctx.fill();
          ctx.stroke();

          const displayPrice = tile.price >= 1000000
            ? `₩${(tile.price / 1000000).toFixed(1)}M`
            : `₩${Math.round(tile.price / 1000)}K`;
          drawOutwardText(displayPrice, 256, 372, '900 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0f172a');

          // Asphalt track stripe at inner edge
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(18, 444, 476, 50);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(150, 466, 212, 6);
        } else {
          // Perimeter Event Squares (Chance, Armory, Tax, Festival) - FACES OUTSIDE OF BOARD
          const taxSub = tile.amount ? `PAY ₩${Math.round(tile.amount / 1000)}K` : 'PAY TAX';
          const eventConfig = {
            chance: { color: '#ec4899', icon: '❓', title: 'CHANCE', sub: 'LUCKY DRAW', subColor: '#be185d' },
            armory: { color: '#ef4444', icon: '🍅', title: 'ARMORY', sub: '+2 TOMATOES', subColor: '#b91c1c' },
            tax: { color: '#475569', icon: '💸', title: tile.name.toUpperCase(), sub: taxSub, subColor: '#b91c1c' },
            festival: { color: '#7c3aed', icon: '🎪', title: 'WORLD FAIR', sub: '2X RENT HOST', subColor: '#6d28d9' },
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

          drawOutwardText(cfg.title, 256, 81, '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#ffffff');
          drawOutwardText(cfg.icon, 256, 246, '92px sans-serif', '#0f172a');

          // Pill box
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(50, 325, 412, 94, 24);
          ctx.fill();
          ctx.stroke();

          drawOutwardText(cfg.sub, 256, 372, '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', cfg.subColor);

          // Asphalt track stripe at inner edge
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(18, 444, 476, 50);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(150, 466, 212, 6);
        }
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

    // Corner 1: West (RESORT ISLAND)
    const pIsland = getTile3DPos(12, TILES.length);
    const islandMonument = create3DIslandMonument();
    islandMonument.position.set(pIsland.x - 1.2, 0.35, pIsland.z);
    islandMonument.rotation.y = Math.PI / 4;
    monumentsGroup.add(islandMonument);
    cornerMonuments.push(islandMonument);

    // Corner 2: North (WORLD CHAMPIONSHIP)
    const pChamp = getTile3DPos(24, TILES.length);
    const champMonument = create3DChampionshipMonument();
    champMonument.position.set(pChamp.x, 0.35, pChamp.z - 1.2);
    champMonument.rotation.y = 0;
    monumentsGroup.add(champMonument);
    cornerMonuments.push(champMonument);

    // Corner 3: East (WORLD TOUR)
    const pTour = getTile3DPos(36, TILES.length);
    const tourMonument = create3DWorldTourMonument();
    tourMonument.position.set(pTour.x + 1.2, 0.35, pTour.z);
    tourMonument.rotation.y = -Math.PI / 4;
    monumentsGroup.add(tourMonument);
    cornerMonuments.push(tourMonument);

    monumentsRef.current = cornerMonuments;
    scene.add(monumentsGroup);

    // 8c. Central Physical 3D Jackpot Gold Coin Pile (Center Stadium Pitch)
    const jackpotPile = create3DJackpotCoinPile();
    jackpotPile.position.set(0, 0.12, -4.2);
    jackpotPile.scale.set(1.15, 1.15, 1.15);
    jackpotPileRef.current = jackpotPile;
    scene.add(jackpotPile);

    // 8d. Floating High-Roller Banknote Stacks (4 Quadrants outside outer board curb)
    const banknoteStacksGroup = new THREE.Group();
    const banknoteStacks = [];
    const stackCoords = [
      { x: -46, z: 46, rotY: Math.PI / 4 },
      { x: -46, z: -46, rotY: (3 * Math.PI) / 4 },
      { x: 46, z: -46, rotY: (-3 * Math.PI) / 4 },
      { x: 46, z: 46, rotY: -Math.PI / 4 },
    ];

    stackCoords.forEach((coord, idx) => {
      const stack = create3DBanknoteStack();
      stack.scale.set(1.4, 1.4, 1.4);
      stack.position.set(coord.x, 2.6, coord.z);
      stack.rotation.y = coord.rotY;
      stack.userData = {
        baseY: 2.6,
        phase: idx * (Math.PI / 2),
        baseRotY: coord.rotY,
      };
      banknoteStacksGroup.add(stack);
      banknoteStacks.push(stack);
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

      // Idle Hover & Real-time Avatar Animations for Pawns (Heroic scale foot contact y = 0.35)
      pawnMeshesRef.current.forEach(({ group, isMoving }) => {
        if (!isMoving && group) {
          group.position.y = 0.35 + Math.sin(elapsed * 3.5) * 0.12;
        }
        if (group && typeof group.userData?.update === 'function') {
          group.userData.update(delta, elapsed, isMoving);
        }
      });

      // Update 3D Corner Monuments (fluttering pennants, colosseum searchlights, lighthouse rotating beacon)
      monumentsRef.current.forEach((m) => {
        if (m && typeof m.userData?.update === 'function') {
          m.userData.update(delta, elapsed);
        }
      });

      // Update Central Jackpot Gold Coin Pile (spinning 3D stars & crown coin)
      if (jackpotPileRef.current && typeof jackpotPileRef.current.userData?.update === 'function') {
        jackpotPileRef.current.userData.update(delta, elapsed);
      }

      // Update Floating High-Roller Banknote Stacks (gentle atmospheric bobbing & sway)
      banknoteStacksRef.current.forEach((stack) => {
        if (stack && stack.userData) {
          stack.position.y = stack.userData.baseY + Math.sin(elapsed * 1.6 + stack.userData.phase) * 0.42;
          stack.rotation.y = stack.userData.baseRotY + Math.sin(elapsed * 0.8 + stack.userData.phase) * 0.1;
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

      // 1. Subtle Flat Glowing Owner Crest & Border Ring on the Street Tile
      // Sits flat on the card surface at y = 0.35, keeping 100% of flag, city name & price pill clean
      const crest = createOwnerCrest(ownerColor, p.width, p.length);
      crest.position.set(p.x, 0.35, p.z);
      crest.rotation.y = p.rotationY;
      crest.traverse((obj) => {
        obj.userData = { tileId, isTile: true };
      });
      group.add(crest);

      // 2. 3D Miniature Tropical Beach Resort Accent on the Elevated Outer Terrace Curb for Resorts
      const tile = TILES.find((t) => t.id === tileId) || TILES[tileId];
      if (tile?.type === 'resort') {
        const resort = create3DResortAccent(ownerColor);
        const localOffset = new THREE.Vector3(0, 0, -5.1);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
        resort.position.set(p.x + localOffset.x, 0.45, p.z + localOffset.z);
        resort.rotation.y = p.rotationY;

        resort.traverse((obj) => {
          obj.userData = { tileId, isTile: true };
        });
        group.add(resort);
        return; // Skip house/hotel logic for resorts
      }

      // 3. 3D Miniature Houses (Levels 2-4) on the Elevated Outer Terrace Curb
      // Relocated to outer perimeter terrace behind the color header (localOffset.z = -5.1)
      if (prop.level >= 2 && prop.level <= 4) {
        const houseCount = prop.level - 1;
        const offsets = houseCount === 1 ? [0] : houseCount === 2 ? [-1.2, 1.2] : [-1.7, 0, 1.7];

        offsets.forEach((offsetX) => {
          const house = create3DHouse(ownerColor);
          const localOffset = new THREE.Vector3(offsetX, 0, -5.1);
          localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
          house.position.set(p.x + localOffset.x, 0.45, p.z + localOffset.z);

          // Rotate slightly inward toward the street
          const inwardAngle = offsetX < -0.1 ? 0.12 : offsetX > 0.1 ? -0.12 : 0;
          house.rotation.y = p.rotationY + inwardAngle;

          house.traverse((obj) => {
            obj.userData = { tileId, isTile: true };
          });
          group.add(house);
        });
      }

      // 3. 3D Luxury Hotel / Skyscraper (Level 5) on the Elevated Outer Terrace Curb
      if (prop.level >= 5) {
        const hotel = create3DHotel(ownerColor);
        const localOffset = new THREE.Vector3(0, 0, -5.1);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
        hotel.position.set(p.x + localOffset.x, 0.45, p.z + localOffset.z);
        hotel.rotation.y = p.rotationY;

        hotel.traverse((obj) => {
          obj.userData = { tileId, isTile: true };
        });
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

        pawnGroup.position.set(startPos.x + subOffset.x, 0.35, startPos.z + subOffset.z);
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

        // Direct High-Altitude Parabolic Soaring Flight for World Tour
        const isWorldTourFlight = fromTile === 16 || path.length > 12;
        if (isWorldTourFlight) {
          try { sounds.playFlightTakeoff?.(); } catch (err) {}
          const targetCoords = getTile3DPos(toTile, TILES.length);
          const startCoords = entry.group.position.clone();
          const targetPos = new THREE.Vector3(
            targetCoords.x + entry.subOffset.x,
            0.35,
            targetCoords.z + entry.subOffset.z
          );

          const flightDuration = 1800; // 1.8 seconds cinematic flight
          const flightStartTime = performance.now();

          const flightAnim = () => {
            const now = performance.now();
            const fp = Math.min(1.0, (now - flightStartTime) / flightDuration);

            // Smooth cubic ease-in-out curve
            const ease = fp < 0.5 ? 4 * fp * fp * fp : 1 - Math.pow(-2 * fp + 2, 3) / 2;
            entry.group.position.lerpVectors(startCoords, targetPos, ease);

            // Soaring vertical parabolic arc up to y = 8.5
            const arcY = Math.sin(fp * Math.PI) * 8.5;
            entry.group.position.y = 0.35 + arcY;

            // Heading & Banking alignment
            const dx = targetPos.x - startCoords.x;
            const dz = targetPos.z - startCoords.z;
            entry.group.rotation.y = Math.atan2(dx, dz);
            entry.group.rotation.z = Math.sin(fp * Math.PI) * 0.25;

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
          const targetCoords = getTile3DPos(nextTileId, TILES.length);
          const startCoords = entry.group.position.clone();
          const targetPos = new THREE.Vector3(
            targetCoords.x + entry.subOffset.x,
            0.35,
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

      {/* Floating Central Tax Jackpot Pool Badge (Center Grass Field) */}
      <div style={{
        position: 'absolute',
        top: '28%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        padding: '7px 18px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(20, 24, 39, 0.96) 100%)',
        border: '1.5px solid #fbbf24',
        boxShadow: '0 0 20px rgba(251, 191, 36, 0.4), 0 8px 25px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: '18px', filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.8))' }}>💰</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{
            fontSize: '9px',
            fontWeight: 900,
            color: '#fde68a',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            COMMUNITY POT
          </span>
          <span style={{
            fontSize: '15px',
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'monospace',
            textShadow: '0 0 10px rgba(251, 191, 36, 0.7)',
          }}>
            💰 JACKPOT: {(communityJackpot || 100000).toLocaleString()} CR
          </span>
        </div>
      </div>

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
          {/* Individual dice face chips */}
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

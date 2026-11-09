'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TILES } from '@/lib/board-brawl/types';
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
  const hoveredMeshRef = useRef(null);
  const pawnMeshesRef = useRef(new Map());
  const buildingsGroupRef = useRef(null);
  const curbMeshesRef = useRef([]);
  const diceGroupRef = useRef(null);
  const diceMeshesRef = useRef([]);
  const diceSimRef = useRef({ active: false, progress: 1.0, targetRotation1: null, targetRotation2: null });
  const monumentsRef = useRef([]);
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
        
        let dist = 162;
        if (aspect < 1.55) {
          dist = 162 * (1.55 / Math.max(aspect, 0.65));
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
        const targetZ = 13.5;

        let dist = 172;
        if (aspect < 1.55) {
          dist = 172 * (1.55 / Math.max(aspect, 0.65));
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
          ctx.fillText('COLLECT 200K CR', 0, 180);

        } else if (cornerType === 'jail' || p.side === 1) {
          // CORNER 1: PRISON FIELD ("2d pic of the prison for the prison field")
          // Weathered Penitentiary Stone Brick Background
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-240, -240, 480, 480);

          // Brick masonry mortar seams
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          for (let by = -240; by < 240; by += 40) {
            ctx.beginPath();
            ctx.moveTo(-240, by);
            ctx.lineTo(240, by);
            ctx.stroke();
            const stagger = Math.floor(by / 40) % 2 === 0 ? 0 : 40;
            for (let bx = -240 + stagger; bx < 240; bx += 80) {
              ctx.beginPath();
              ctx.moveTo(bx, by);
              ctx.lineTo(bx, by + 40);
              ctx.stroke();
            }
          }

          // Arched Prison Cell Alcove (Deep Black/Navy Interior)
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.roundRect(-140, -110, 280, 220, [30, 30, 8, 8]);
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#334155';
          ctx.stroke();

          // Inmate silhouette with orange/striped jumpsuit inside the cell!
          ctx.fillStyle = '#f97316'; // Orange jumpsuit inmate
          ctx.beginPath();
          ctx.arc(0, -35, 32, 0, Math.PI * 2); // Inmate head
          ctx.fill();
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.roundRect(-42, 2, 84, 90, [16, 16, 0, 0]); // Shoulders/torso
          ctx.fill();

          // Horizontal prison stripes on torso
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-42, 16, 84, 10);
          ctx.fillRect(-42, 38, 84, 10);
          ctx.fillRect(-42, 60, 84, 10);

          // Hands gripping the bars
          ctx.fillStyle = '#fed7aa'; // Skin tone hands
          ctx.beginPath();
          ctx.arc(-42, 10, 12, 0, Math.PI * 2);
          ctx.arc(42, 10, 12, 0, Math.PI * 2);
          ctx.fill();

          // Heavy 3D Metallic Steel Cell Bars
          const barCount = 7;
          const barSpacing = 240 / (barCount + 1);
          for (let b = 1; b <= barCount; b++) {
            const barX = -120 + b * barSpacing;
            // Bar drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX + 2, -106, 10, 212);

            // 3D Metallic Bar gradient
            const bGrad = ctx.createLinearGradient(barX - 5, 0, barX + 5, 0);
            bGrad.addColorStop(0, '#334155');
            bGrad.addColorStop(0.3, '#cbd5e1'); // Bright metallic highlight
            bGrad.addColorStop(0.7, '#64748b');
            bGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = bGrad;
            ctx.fillRect(barX - 5, -106, 10, 212);
          }

          // Horizontal Reinforced Steel Crossbars
          [-60, 40].forEach((crossY) => {
            const cGrad = ctx.createLinearGradient(0, crossY - 6, 0, crossY + 6);
            cGrad.addColorStop(0, '#64748b');
            cGrad.addColorStop(0.5, '#cbd5e1');
            cGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = cGrad;
            ctx.fillRect(-138, crossY - 6, 276, 12);

            // Chrome Rivets
            for (let rx = -115; rx <= 115; rx += 46) {
              ctx.beginPath();
              ctx.arc(rx, crossY, 3.5, 0, Math.PI * 2);
              ctx.fillStyle = '#f8fafc';
              ctx.fill();
            }
          });

          // Heavy Hanging Brass Padlock & Steel Chain
          ctx.fillStyle = '#eab308'; // Padlock body
          ctx.beginPath();
          ctx.roundRect(-16, 25, 32, 28, 6);
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#94a3b8'; // Shackle
          ctx.beginPath();
          ctx.arc(0, 25, 12, Math.PI, 0);
          ctx.stroke();

          // Top Header: Hazard Warning Tape + PRISON Banner
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(-180, -225, 360, 74, 16);
          ctx.clip();
          // Diagonal hazard stripes
          for (let hx = -300; hx < 300; hx += 32) {
            ctx.fillStyle = Math.floor(hx / 32) % 2 === 0 ? '#f59e0b' : '#0f172a';
            ctx.fillRect(hx, -225, 32, 74);
          }
          ctx.restore();

          // PRISON Badge Plate
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(-160, -215, 320, 54, 12);
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#f59e0b';
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⛓️ MAX PRISON', 0, -178);

          // Bottom Bail Pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(-160, 135, 320, 68, 20);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#b91c1c';
          ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('BAIL: 100K CR', 0, 178);

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
          ctx.fillText('TICKET: 50K CR', 0, 178);

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
        // STREET TILE (Elongated 512 x 896 property slab)
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

        // --- 1. TOP / OUTER ZONE: District Header & Property Pill (y = 16 to 220) ---
        if (tile.type === 'city') {
          // District Color Band
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

          const fontSize = name.length > 15 ? 34 : name.length > 11 ? 40 : 46;
          drawOutwardText(name, 256, 118, '900 ' + fontSize + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0f172a', 450);

          // Price Tag Pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(56, 160, 400, 60, 18);
          ctx.fill();
          ctx.stroke();

          const priceNum = tile.price || 0;
          const displayPrice = priceNum >= 1000000
            ? (priceNum / 1000000).toFixed(1) + 'M'
            : Math.round(priceNum / 1000) + 'K';
          drawOutwardText(displayPrice + ' CR', 256, 190, '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0f172a');

          // --- 2. DEDICATED SPACIOUS ARCHITECTURAL ESTATE BUILDING LOT (y = 236 to 880) ---
          // Manicured estate turf base
          ctx.fillStyle = '#86efac';
          ctx.fillRect(16, 236, 480, 644);

          // Subtle grass turf stripes
          ctx.fillStyle = '#4ade80';
          for (let gy = 246; gy < 870; gy += 32) {
            ctx.fillRect(16, gy, 480, 16);
          }

          // Polished Interlocking Paver Foundation Patio where 3D buildings stand flush!
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.roundRect(36, 260, 440, 590, 20);
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();

          // Subtle herringbone / paver grid lines on patio
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)';
          ctx.lineWidth = 2;
          for (let py = 290; py < 830; py += 36) {
            ctx.beginPath();
            ctx.moveTo(46, py);
            ctx.lineTo(466, py);
            ctx.stroke();
          }

          // Golden architectural lot brackets at the four corners of construction zone
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
          ctx.lineWidth = 4;
          // Top-Left bracket
          ctx.beginPath();
          ctx.moveTo(56, 300); ctx.lineTo(56, 280); ctx.lineTo(76, 280);
          ctx.stroke();
          // Top-Right bracket
          ctx.beginPath();
          ctx.moveTo(456, 300); ctx.lineTo(456, 280); ctx.lineTo(436, 280);
          ctx.stroke();
          // Bottom-Left bracket
          ctx.beginPath();
          ctx.moveTo(56, 810); ctx.lineTo(56, 830); ctx.lineTo(76, 830);
          ctx.stroke();
          // Bottom-Right bracket
          ctx.beginPath();
          ctx.moveTo(456, 810); ctx.lineTo(456, 830); ctx.lineTo(436, 830);
          ctx.stroke();

        } else if (tile.type === 'resort') {
          // RESORT TILE: "sand for the beach resorts"
          // Tropical Cyan Header Band
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

          drawOutwardText(rName, 256, 118, '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0891b2', 450);

          // Resort Price Pill
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(56, 160, 400, 60, 18);
          ctx.fill();
          ctx.stroke();

          const priceNum = tile.price || 0;
          const displayPrice = priceNum >= 1000000
            ? (priceNum / 1000000).toFixed(1) + 'M'
            : Math.round(priceNum / 1000) + 'K';
          drawOutwardText(displayPrice + ' CR • RESORT', 256, 190, '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0891b2');

          // --- 2. DEDICATED GOLDEN BEACH SAND RESORT LOT (y = 236 to 880) ---
          // Warm Tropical Beach Sand Base
          ctx.fillStyle = '#fde047'; // Golden sand
          ctx.fillRect(16, 236, 480, 644);

          // Granular sand stippling grain
          const sandColors = ['#fef08a', '#fbbf24', '#f59e0b', '#fef9c3', '#d97706'];
          for (let s = 0; s < 450; s++) {
            const sx = 24 + ((s * 47) % 464);
            const sy = 246 + ((s * 83) % 550);
            const sr = 1 + (s % 3);
            ctx.fillStyle = sandColors[s % sandColors.length];
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
          }

          // Gentle curved sand dune ripples
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.22)';
          ctx.lineWidth = 5;
          for (let ry = 280; ry < 750; ry += 70) {
            ctx.beginPath();
            ctx.moveTo(30, ry);
            ctx.bezierCurveTo(160, ry - 18, 320, ry + 18, 480, ry);
            ctx.stroke();
          }

          // Turquoise Ocean Shoreline with White Foam Waves at lower lot edge!
          const waterGrad = ctx.createLinearGradient(0, 750, 0, 880);
          waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
          waterGrad.addColorStop(0.3, 'rgba(14, 165, 233, 0.6)');
          waterGrad.addColorStop(0.7, '#0284c7');
          waterGrad.addColorStop(1, '#0369a1');
          ctx.fillStyle = waterGrad;
          ctx.fillRect(16, 750, 480, 130);

          // White Foamy Wave Surf Lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(20, 770);
          ctx.bezierCurveTo(150, 750, 310, 790, 492, 765);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(20, 810);
          ctx.bezierCurveTo(170, 795, 330, 825, 492, 805);
          ctx.stroke();

          // 2D Beach details: Beach umbrella & towel graphic on the sand!
          ctx.fillStyle = '#ef4444'; // Red & white beach towel
          ctx.fillRect(80, 400, 65, 100);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(80, 420, 65, 20);
          ctx.fillRect(80, 460, 65, 20);

          // Starfish in the sand
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(380, 520, 14, 0, Math.PI * 2);
          ctx.fill();

          // Resort boundary frame
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
          ctx.strokeRect(30, 250, 452, 610);

        } else {
          // SPECIAL EVENT TILES (Chance, Tax, Mystery, Armory, Festival)
          const taxSub = tile.amount ? ('PAY ' + Math.round(tile.amount / 1000) + 'K CR') : 'PAY TAX';
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
            sub: tile.amount ? ('PAY ' + Math.round(tile.amount / 1000) + 'K CR') : (tile.type || '').toUpperCase(),
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

          drawOutwardText(cfg.icon + ' ' + cfg.title, 256, 122, '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', '#0f172a', 450);

          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(56, 160, 400, 60, 18);
          ctx.fill();
          ctx.stroke();

          drawOutwardText(cfg.sub, 256, 190, '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', cfg.subColor);

          // Dedicated Themed Lot Texture
          ctx.fillStyle = cfg.bg;
          ctx.fillRect(16, 236, 480, 644);

          // Themed Center Icon Embellishment
          ctx.font = '110px sans-serif';
          drawOutwardText(cfg.icon, 256, 520, '110px sans-serif', '#ffffff');

          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.strokeRect(36, 260, 440, 590);
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

    // Corner 1: West (PRISON FIELD)
    // The user requested: "2d pic of the prison for the prison field"
    // We leave Corner 1 open and unobstructed so the high-resolution 2D prison illustration is prominent!
    const pIsland = getTile3DPos(8, TILES.length);

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
        const startPos = getPawnTile3DPos(player.position || 0, TILES.length, subOffset);

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
          const targetPos = getPawnTile3DPos(toTile, TILES.length, entry.subOffset);
          const startCoords = entry.group.position.clone();

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
          const targetPos = getPawnTile3DPos(nextTileId, TILES.length, entry.subOffset);
          const startCoords = entry.group.position.clone();

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
      cCtx.fillText('₩', 64, 32);

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

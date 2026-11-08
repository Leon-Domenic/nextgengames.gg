'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import {
  createProceduralPawn,
  generateDiceMaterials,
  create3DHouse,
  create3DHotel,
  createOwnerCrest,
} from '@/lib/board-brawl/pawnModels3D';
import { Sparkles } from 'lucide-react';

const BOARD_HALF = 54; // 108 x 108 Tabletop footprint for 48 tiles
const TILES_PER_SIDE = 12;
const TILE_STEP = (BOARD_HALF * 2) / TILES_PER_SIDE; // 9.0 units per tile

// Maps 0..47 tile index to world coordinates around the 48-tile tabletop perimeter
export function getTile3DPos(index) {
  const S = BOARD_HALF;
  const step = TILE_STEP;
  const half = step / 2;

  if (index >= 0 && index < 12) {
    // Bottom side: 0 to 11 (left to right)
    return {
      x: -S + index * step + half,
      y: 0.1,
      z: S,
      rotationY: 0,
    };
  } else if (index >= 12 && index < 24) {
    // Left side: 12 to 23 (bottom to top)
    const k = index - 12;
    return {
      x: -S,
      y: 0.1,
      z: S - k * step - half,
      rotationY: Math.PI / 2,
    };
  } else if (index >= 24 && index < 36) {
    // Top side: 24 to 35 (left to right)
    const k = index - 24;
    return {
      x: -S + k * step + half,
      y: 0.1,
      z: -S,
      rotationY: Math.PI,
    };
  } else {
    // Right side: 36 to 47 (top to bottom)
    const k = index - 36;
    return {
      x: S,
      y: 0.1,
      z: -S + k * step + half,
      rotationY: -Math.PI / 2,
    };
  }
}

export default function Board3D({
  roomId,
  game,
  players = [],
  currentTileId = 0,
  properties = {},
  isMyTurn = false,
  onRollDice,
  onBuyCity,
  onBuyoutCity,
  onUpgradeCity,
  onSetFestival,
  onThrowTomato,
  onEndTurn,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  // Mesh & Model Refs
  const pawnMeshesRef = useRef(new Map());
  const buildingsGroupRef = useRef(null);
  const diceGroupRef = useRef(null);
  const diceMeshesRef = useRef([]);
  const diceSimRef = useRef({ active: false, progress: 0, fromPos: null, targetRotation1: null, targetRotation2: null });

  const [sceneReady, setSceneReady] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);

  // Initialize Three.js Scene with Steady Tabletop Perspective
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.0035);

    // 2. Camera (Fixed steady tabletop isometric angle - Zero drag / orbit)
    const camera = new THREE.PerspectiveCamera(26, width / height, 1, 1000);
    camera.position.set(0, 138, 148);
    camera.lookAt(0, -3, 0);
    cameraRef.current = camera;

    // 3. Renderer with contact shadow support
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfff7ed, 2.0);
    mainSun.position.set(55, 120, 65);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0004;
    scene.add(mainSun);

    const blueRim = new THREE.DirectionalLight(0x38bdf8, 1.2);
    blueRim.position.set(-60, 80, -60);
    scene.add(blueRim);

    // 5. Ground Plane Shadow
    const groundGeom = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x05070c,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 6. Luxury Beveled Table Base (Dark Mahogany / Titanium Composite)
    const tableGroup = new THREE.Group();
    const tableGeom = new THREE.BoxGeometry(118, 3.2, 118);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x0d121f,
      roughness: 0.35,
      metalness: 0.5,
    });
    const tableMesh = new THREE.Mesh(tableGeom, tableMat);
    tableMesh.position.y = -1.6;
    tableMesh.receiveShadow = true;
    tableGroup.add(tableMesh);

    // Golden Brass Rim Trim
    const trimGeom = new THREE.BoxGeometry(120.5, 0.5, 120.5);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.85,
    });
    const trimMesh = new THREE.Mesh(trimGeom, trimMat);
    trimMesh.position.y = -0.15;
    tableGroup.add(trimMesh);

    // Center Felt Playfield Surface
    const feltGeom = new THREE.PlaneGeometry(88, 88);
    const feltMat = new THREE.MeshStandardMaterial({
      color: 0x080c16,
      roughness: 0.75,
      metalness: 0.1,
    });
    const feltMesh = new THREE.Mesh(feltGeom, feltMat);
    feltMesh.rotation.x = -Math.PI / 2;
    feltMesh.position.y = 0.02;
    feltMesh.receiveShadow = true;
    tableGroup.add(feltMesh);

    scene.add(tableGroup);

    // 7. 48 Perimeter 3D Tiles
    const tileGroup = new THREE.Group();
    TILES.forEach((tile) => {
      const p = getTile3DPos(tile.id);
      const isCorner = [0, 12, 24, 36].includes(tile.id);
      const tileWidth = isCorner ? 8.8 : 8.5;
      const tileLength = isCorner ? 8.8 : 8.5;

      // Dynamic High-Res Tile Texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 512, 512);

      // Card border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(7, 7, 498, 498);

      if (tile.type === 'city') {
        // District color bar
        ctx.fillStyle = tile.color || '#3b82f6';
        ctx.fillRect(14, 14, 484, 120);

        // Country flag and district group
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${tile.flag || ''} ${tile.country || ''}`, 256, 75);

        // City name
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 48px sans-serif';
        ctx.fillText(tile.name.toUpperCase(), 256, 260);

        // Price tag pill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.roundRect(100, 360, 312, 90, 20);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 44px monospace';
        ctx.fillText(`$${tile.price}`, 256, 422);
      } else {
        // Special Corners / Tactical squares
        const cornerColors = {
          start: '#10b981',
          jail: '#f59e0b',
          casino: '#a855f7',
          go_to_jail: '#ef4444',
          chance: '#38bdf8',
          armory: '#ef4444',
          airport: '#06b6d4',
          festival: '#f59e0b',
          tax: '#64748b',
        };
        const bannerColor = cornerColors[tile.type] || '#38bdf8';
        ctx.fillStyle = bannerColor;
        ctx.fillRect(14, 14, 484, 90);

        // Large tactical icon
        ctx.font = '90px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tile.icon || '🎯', 256, 240);

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 44px sans-serif';
        ctx.fillText(tile.name.toUpperCase(), 256, 360);

        // Subtitle
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 28px sans-serif';
        if (tile.amount) {
          ctx.fillText(`PAY $${tile.amount}`, 256, 430);
        } else if (tile.type === 'start') {
          ctx.fillText('COLLECT $250', 256, 430);
        } else {
          ctx.fillText(tile.type.toUpperCase(), 256, 430);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;

      const tileGeom = new THREE.BoxGeometry(tileWidth, 0.25, tileLength);
      const tileMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.4,
        metalness: 0.1,
      });
      const tileMesh = new THREE.Mesh(tileGeom, tileMat);
      tileMesh.position.set(p.x, 0.12, p.z);
      tileMesh.rotation.y = p.rotationY;
      tileMesh.receiveShadow = true;
      tileMesh.userData = { tileId: tile.id };
      tileGroup.add(tileMesh);
    });
    scene.add(tileGroup);

    // 8. Buildings Group (3D Houses, Skyscraper Hotels, Owner Crests)
    const buildingsGroup = new THREE.Group();
    buildingsGroupRef.current = buildingsGroup;
    scene.add(buildingsGroup);

    // 9. 3D Tumbling Physics Dice Pair
    const diceGroup = new THREE.Group();
    diceGroupRef.current = diceGroup;
    const dGeom = new THREE.BoxGeometry(3.2, 3.2, 3.2);
    const dMats = generateDiceMaterials();

    const d1 = new THREE.Mesh(dGeom, dMats);
    d1.position.set(-2.6, 1.6, 0);
    d1.castShadow = true;
    diceGroup.add(d1);

    const d2 = new THREE.Mesh(dGeom, dMats);
    d2.position.set(2.6, 1.6, 0);
    d2.castShadow = true;
    diceGroup.add(d2);

    diceMeshesRef.current = [d1, d2];
    scene.add(diceGroup);

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Render Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Idle Hover for Pawns
      pawnMeshesRef.current.forEach(({ group, isMoving }) => {
        if (!isMoving && group) {
          group.position.y = 0.2 + Math.sin(elapsed * 3.5) * 0.12;
        }
      });

      // 3D Physics Dice Simulation
      const sim = diceSimRef.current;
      if (sim.active && diceGroupRef.current) {
        sim.progress += delta * 1.35;
        const p = Math.min(sim.progress, 1.0);

        // Vertical bounce
        const bounce = Math.sin(p * Math.PI) * 12.0 * (1.0 - p * 0.6);
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
          // Tumble spin
          diceMeshesRef.current.forEach((d) => {
            d.rotation.x += delta * 18.0;
            d.rotation.y += delta * 14.0;
            d.rotation.z += delta * 12.0;
          });
        }
      }

      renderer.render(scene, camera);
    };
    animate();
    setSceneReady(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, []);

  // Update Dynamic 3D Buildings (Green Houses, Red Hotels, Owner Crests)
  useEffect(() => {
    if (!sceneReady || !buildingsGroupRef.current) return;
    const group = buildingsGroupRef.current;

    // Clear previous buildings
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // Populate for every owned property
    Object.entries(properties).forEach(([tileIdStr, prop]) => {
      const tileId = parseInt(tileIdStr, 10);
      if (!prop || !prop.ownerId) return;

      const p = getTile3DPos(tileId);
      const owner = players.find((u) => u.id === prop.ownerId);
      const ownerColor = owner?.avatarColor || '#00f0ff';

      // 1. Owner Crest on the Ground
      const crest = createOwnerCrest(ownerColor);
      crest.position.set(p.x, 0.28, p.z);
      crest.rotation.y = p.rotationY;
      group.add(crest);

      // 2. 3D Miniature Green Houses (Levels 2, 3, 4 = 1, 2, 3 Houses)
      if (prop.level >= 2 && prop.level <= 4) {
        const houseCount = prop.level - 1;
        const offsets = houseCount === 1 ? [0] : houseCount === 2 ? [-1.3, 1.3] : [-2.2, 0, 2.2];

        offsets.forEach((offsetX) => {
          const house = create3DHouse();
          // Orient along tile frontage
          const localOffset = new THREE.Vector3(offsetX, 0.26, -1.8);
          localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
          house.position.set(p.x + localOffset.x, 0.26, p.z + localOffset.z);
          house.rotation.y = p.rotationY;
          group.add(house);
        });
      }

      // 3. 3D Red Luxury Hotel / Skyscraper (Level 5)
      if (prop.level >= 5) {
        const hotel = create3DHotel();
        const localOffset = new THREE.Vector3(0, 0.26, -1.6);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rotationY);
        hotel.position.set(p.x + localOffset.x, 0.26, p.z + localOffset.z);
        hotel.rotation.y = p.rotationY;
        group.add(hotel);
      }
    });
  }, [properties, players, sceneReady]);

  // Synchronize Player Pawns with Tile-by-Tile Hop Animations
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    const scene = sceneRef.current;
    const pawnMap = pawnMeshesRef.current;

    players.forEach((player, idx) => {
      let entry = pawnMap.get(player.id);
      if (!entry) {
        const meshGroup = createProceduralPawn(player.avatarToken || 'hat', player.avatarColor || '#00f0ff');
        const pos = getTile3DPos(player.position || 0);
        // Stagger pawns on same tile
        const angle = (idx / 6) * Math.PI * 2;
        meshGroup.position.set(pos.x + Math.cos(angle) * 1.8, 0.3, pos.z + Math.sin(angle) * 1.8);
        scene.add(meshGroup);
        entry = { group: meshGroup, currentPos: player.position || 0, isMoving: false };
        pawnMap.set(player.id, entry);
      }

      // If position changed, animate tile-by-tile hop
      if (entry.currentPos !== player.position && !entry.isMoving) {
        entry.isMoving = true;
        const startPos = entry.currentPos;
        const targetPos = player.position;
        const totalSteps = (targetPos - startPos + 48) % 48;

        let currentStep = 0;
        const stepInterval = setInterval(() => {
          currentStep += 1;
          const intermediateTile = (startPos + currentStep) % 48;
          const p = getTile3DPos(intermediateTile);
          const angle = (idx / 6) * Math.PI * 2;

          entry.group.position.x = p.x + Math.cos(angle) * 1.8;
          entry.group.position.z = p.z + Math.sin(angle) * 1.8;
          sounds.playPawnStep();

          if (currentStep >= totalSteps) {
            clearInterval(stepInterval);
            entry.currentPos = targetPos;
            entry.isMoving = false;
          }
        }, 120); // crisp 120ms hop per square
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
  }, [players, sceneReady]);

  // Trigger 3D Dice Simulation on Roll
  const triggerDiceRoll = useCallback((val1, val2) => {
    if (!diceGroupRef.current) return;
    sounds.playDiceRoll();

    const getRot = (val) => {
      switch (val) {
        case 1: return new THREE.Euler(0, 0, 0);
        case 6: return new THREE.Euler(Math.PI, 0, 0);
        case 2: return new THREE.Euler(-Math.PI / 2, 0, 0);
        case 5: return new THREE.Euler(Math.PI / 2, 0, 0);
        case 3: return new THREE.Euler(0, 0, -Math.PI / 2);
        case 4: return new THREE.Euler(0, 0, Math.PI / 2);
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
    if (game?.lastDiceResult) {
      triggerDiceRoll(game.lastDiceResult[0], game.lastDiceResult[1]);
    }
  }, [game?.lastDiceResult, triggerDiceRoll]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
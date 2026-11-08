'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TILES } from '@/lib/board-brawl/types';
import { sounds } from '@/lib/audio';
import {
  parseLegacyJsonToBufferObject,
  createProceduralPawn,
  generateDiceMaterials,
} from '@/lib/board-brawl/pawnModels3D';
import { Sparkles } from 'lucide-react';

const BOARD_HALF = 35; // Extents from -35 to +35
const TILE_STEP = (BOARD_HALF * 2) / 8; // 8.75 units per tile

// Maps 0..31 tile index to world coordinates around the 80x80 board perimeter
export function getTile3DPos(index) {
  const S = BOARD_HALF;
  const step = TILE_STEP;
  const half = step / 2;

  if (index >= 0 && index < 8) {
    // Bottom side: 0 to 7 (left to right)
    return {
      x: -S + index * step + half,
      y: 0.1,
      z: S,
      rotationY: 0,
    };
  } else if (index >= 8 && index < 16) {
    // Right side: 8 to 15 (bottom to top)
    const k = index - 8;
    return {
      x: S,
      y: 0.1,
      z: S - k * step - half,
      rotationY: -Math.PI / 2,
    };
  } else if (index >= 16 && index < 24) {
    // Top side: 16 to 23 (right to left)
    const k = index - 16;
    return {
      x: S - k * step - half,
      y: 0.1,
      z: -S,
      rotationY: Math.PI,
    };
  } else {
    // Left side: 24 to 31 (top to bottom)
    const k = index - 24;
    return {
      x: -S,
      y: 0.1,
      z: -S + k * step + half,
      rotationY: Math.PI / 2,
    };
  }
}

// Maps die value 1-6 to Euler rotation so face points straight UP (+Y)
function getDieTargetRotation(val, randomAngleY = 0) {
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  switch (val) {
    case 1: euler.set(0, randomAngleY, Math.PI / 2, 'YXZ'); break;
    case 2: euler.set(0, randomAngleY, -Math.PI / 2, 'YXZ'); break;
    case 3: euler.set(0, randomAngleY, 0, 'YXZ'); break;
    case 4: euler.set(Math.PI, randomAngleY, 0, 'YXZ'); break;
    case 5: euler.set(-Math.PI / 2, randomAngleY, 0, 'YXZ'); break;
    case 6: euler.set(Math.PI / 2, randomAngleY, 0, 'YXZ'); break;
    default: euler.set(0, randomAngleY, 0, 'YXZ'); break;
  }
  return euler;
}

export default function Board3D({
  properties = {},
  players = [],
  activeTileId,
  onTileClick,
  centerContent,
  lastDiceResult,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // Model caches
  const houseModelJsonRef = useRef(null);
  const hotelModelJsonRef = useRef(null);
  const propertyMeshesRef = useRef(new Map()); // tileId -> Mesh
  const pawnMeshesRef = useRef(new Map()); // playerId -> { group, targetPos, currentPos, isMoving }
  const diceGroupRef = useRef(null);
  const diceSimRef = useRef({ active: false, d1: 1, d2: 1, progress: 1, startRot1: null, startRot2: null });
  const shockwaveMeshRef = useRef(null);

  const [diceRolling, setDiceRolling] = useState(false);

  // 1. Preload 3D Model JSONs (house, hotel)
  useEffect(() => {
    fetch('/3d_assets/house/model.json')
      .then(res => res.json())
      .then(json => { houseModelJsonRef.current = json; })
      .catch(() => {});

    fetch('/3d_assets/hotel/model.json')
      .then(res => res.json())
      .then(json => { hotelModelJsonRef.current = json; })
      .catch(() => {});
  }, []);

  // 2. Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 840;
    const height = container.clientHeight || 840;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera: Rock-Steady Tabletop Isometric Angle (Fixed perspective, no OrbitControls rotation)
    const camera = new THREE.PerspectiveCamera(28, width / height, 1, 1000);
    camera.position.set(0, 105, 115);
    camera.lookAt(0, -2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls: Locked down (no user dragging/rotating/panning the board)
    controlsRef.current = null;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    dirLight.position.set(45, 95, 55);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 1.0, 100);
    pointLight.position.set(0, 15, 0);
    scene.add(pointLight);

    // Ground Plane & Shadow
    const groundGeom = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x07090e,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.6;
    ground.receiveShadow = true;
    scene.add(ground);

    // Elevated Board Base (Beveled luxury table)
    const boardGroup = new THREE.Group();
    const tableGeom = new THREE.BoxGeometry(78, 2.5, 78);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      roughness: 0.35,
      metalness: 0.65,
    });
    const tableMesh = new THREE.Mesh(tableGeom, tableMat);
    tableMesh.position.y = -1.25;
    tableMesh.receiveShadow = true;
    boardGroup.add(tableMesh);

    // Golden Board Rim Trim
    const trimGeom = new THREE.BoxGeometry(80.5, 0.4, 80.5);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.85,
    });
    const trimMesh = new THREE.Mesh(trimGeom, trimMat);
    trimMesh.position.y = -0.15;
    boardGroup.add(trimMesh);

    // Center Felt Playfield Surface
    const centerGeom = new THREE.PlaneGeometry(59, 59);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.7,
      metalness: 0.1,
    });
    const centerMesh = new THREE.Mesh(centerGeom, centerMat);
    centerMesh.rotation.x = -Math.PI / 2;
    centerMesh.position.y = 0.02;
    centerMesh.receiveShadow = true;
    boardGroup.add(centerMesh);

    scene.add(boardGroup);

    // 32 Perimeter 3D Tiles
    const tileGroup = new THREE.Group();
    TILES.forEach((tile) => {
      const p = getTile3DPos(tile.id);
      const isCorner = [0, 8, 16, 24].includes(tile.id);
      const tileWidth = isCorner ? 8.5 : 8.2;
      const tileLength = isCorner ? 8.5 : 8.2;

      // Dynamic High-Res Tile Texture via Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Surface
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      // Inset Bevel Frame
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, 500, 500);

      // City Color Banner at Top
      if (tile.type === 'city') {
        ctx.fillStyle = tile.color || '#3b82f6';
        ctx.fillRect(12, 12, 488, 110);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tile.country?.toUpperCase() || 'CITY', 256, 80);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(12, 12, 488, 110);
      }

      // Icon / Flag
      ctx.font = isCorner ? '90px sans-serif' : '72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tile.flag || tile.icon || '📍', 256, 260);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tile.name, 256, 350);

      // Price / Rent
      if (tile.price) {
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(`$${tile.price}`, 256, 440);
      } else if (tile.amount) {
        ctx.fillStyle = '#ff3344';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(`-$${tile.amount}`, 256, 440);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;

      const tileMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.4,
        metalness: 0.1,
      });

      const tileMesh = new THREE.Mesh(new THREE.PlaneGeometry(tileWidth, tileLength), tileMat);
      tileMesh.rotation.x = -Math.PI / 2;
      tileMesh.position.set(p.x, 0.05, p.z);
      tileMesh.receiveShadow = true;
      tileMesh.userData = { tileId: tile.id };
      tileGroup.add(tileMesh);
    });
    scene.add(tileGroup);

    // 3D Physics Dice Group
    const diceGroup = new THREE.Group();
    const diceMaterials = generateDiceMaterials();
    const dieGeom = new THREE.BoxGeometry(2.8, 2.8, 2.8);

    const die1 = new THREE.Mesh(dieGeom, diceMaterials);
    die1.castShadow = true;
    die1.position.set(-2.5, 1.4, 0);

    const die2 = new THREE.Mesh(dieGeom, diceMaterials);
    die2.castShadow = true;
    die2.position.set(2.5, 1.4, 0);

    diceGroup.add(die1, die2);
    diceGroup.position.set(0, 0, 0);
    scene.add(diceGroup);
    diceGroupRef.current = diceGroup;

    // Doubles Shockwave Particle Mesh
    const shockGeom = new THREE.RingGeometry(0.5, 1.5, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shockMesh = new THREE.Mesh(shockGeom, shockMat);
    shockMesh.rotation.x = -Math.PI / 2;
    shockMesh.position.y = 0.15;
    scene.add(shockMesh);
    shockwaveMeshRef.current = shockMesh;

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Render & Animation Loop
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
        sim.progress += delta * 1.35; // ~0.75 second total tumble
        const t = Math.min(sim.progress, 1);

        // Toss & Bounce Arc
        const bounceHeight = Math.max(0, Math.sin(t * Math.PI) * 16 * (1 - t * 0.7));
        const currentY = 1.4 + bounceHeight;

        const dMesh1 = diceGroupRef.current.children[0];
        const dMesh2 = diceGroupRef.current.children[1];

        dMesh1.position.y = currentY;
        dMesh2.position.y = currentY;

        // Spread apart slightly as they bounce
        dMesh1.position.x = -2.5 - (1 - t) * Math.sin(t * 10) * 1.5;
        dMesh2.position.x = 2.5 + (1 - t) * Math.sin(t * 10) * 1.5;

        // Rapid Angular Tumble smoothly settling to Target Quaternions
        const targetQ1 = new THREE.Quaternion().setFromEuler(getDieTargetRotation(sim.d1, 0.4));
        const targetQ2 = new THREE.Quaternion().setFromEuler(getDieTargetRotation(sim.d2, -0.6));

        if (t < 0.65) {
          dMesh1.rotation.x += delta * 24;
          dMesh1.rotation.y += delta * 18;
          dMesh1.rotation.z += delta * 20;

          dMesh2.rotation.x -= delta * 22;
          dMesh2.rotation.y += delta * 26;
          dMesh2.rotation.z -= delta * 19;
        } else {
          // Slerp into exact authoritative face orientation
          const settleT = (t - 0.65) / 0.35;
          dMesh1.quaternion.slerp(targetQ1, settleT);
          dMesh2.quaternion.slerp(targetQ2, settleT);
        }

        // Settled
        if (t >= 1) {
          sim.active = false;
          dMesh1.quaternion.copy(targetQ1);
          dMesh2.quaternion.copy(targetQ2);
          dMesh1.position.y = 1.4;
          dMesh2.position.y = 1.4;

          setDiceRolling(false);
          sounds.playCash();

          // If doubles, trigger shockwave pulse
          if (sim.d1 === sim.d2 && shockwaveMeshRef.current) {
            sounds.playDoublesSurge();
            shockwaveMeshRef.current.position.set(0, 0.15, 0);
            shockwaveMeshRef.current.scale.set(1, 1, 1);
            shockwaveMeshRef.current.material.opacity = 0.9;
          }
        }
      }

      // Expand Shockwave Aura
      if (shockwaveMeshRef.current && shockwaveMeshRef.current.material.opacity > 0.01) {
        shockwaveMeshRef.current.scale.addScalar(delta * 22);
        shockwaveMeshRef.current.material.opacity = Math.max(0, shockwaveMeshRef.current.material.opacity - delta * 1.8);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 3. Sync Players & Animate Stepping Pawns
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    players.forEach((p, idx) => {
      let entry = pawnMeshesRef.current.get(p.id);

      // Create 3D Pawn if not yet exists
      if (!entry) {
        const pawnGroup = createProceduralPawn(p.avatarToken, p.avatarColor);
        scene.add(pawnGroup);

        const initialPos = getTile3DPos(p.position || 0);
        pawnGroup.position.set(initialPos.x, 0.2, initialPos.z);

        entry = {
          group: pawnGroup,
          currentTile: p.position || 0,
          isMoving: false,
        };
        pawnMeshesRef.current.set(p.id, entry);
      }

      // If position advanced, trigger tile-by-tile hopping animation
      if (entry.currentTile !== p.position && !entry.isMoving) {
        const startTile = entry.currentTile;
        const targetTile = p.position;
        entry.isMoving = true;

        let cur = startTile;
        const stepInterval = setInterval(() => {
          cur = (cur + 1) % 32;
          const pos = getTile3DPos(cur);

          // Smooth hop arc
          if (entry.group) {
            entry.group.position.set(pos.x, 1.8, pos.z);
            setTimeout(() => {
              if (entry.group) entry.group.position.y = 0.2;
            }, 120);
          }

          if (cur === targetTile) {
            clearInterval(stepInterval);
            entry.currentTile = targetTile;
            entry.isMoving = false;
          }
        }, 160);
      }
    });

    // Clean up removed players
    pawnMeshesRef.current.forEach((val, pId) => {
      if (!players.some(p => p.id === pId)) {
        scene.remove(val.group);
        pawnMeshesRef.current.delete(pId);
      }
    });
  }, [players]);

  // 4. Sync 3D Buildings (Houses & Landmarks)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    Object.entries(properties).forEach(([tileIdStr, prop]) => {
      const tileId = parseInt(tileIdStr, 10);
      const existing = propertyMeshesRef.current.get(tileId);

      if (prop.isLandmark) {
        // Landmark skyscraper
        if (!existing || existing.userData.type !== 'landmark') {
          if (existing) scene.remove(existing);

          let landmarkMesh;
          if (hotelModelJsonRef.current) {
            landmarkMesh = parseLegacyJsonToBufferObject(hotelModelJsonRef.current, 0xf59e0b);
            landmarkMesh.scale.set(0.0035, 0.0035, 0.0035);
          } else {
            // High-finish golden procedural skyscraper
            const towerGeom = new THREE.BoxGeometry(2.5, 9.0, 2.5);
            const towerMat = new THREE.MeshStandardMaterial({
              color: 0xf59e0b,
              roughness: 0.15,
              metalness: 0.85,
            });
            landmarkMesh = new THREE.Mesh(towerGeom, towerMat);
            landmarkMesh.position.y = 4.5;
          }

          const pos = getTile3DPos(tileId);
          landmarkMesh.position.set(pos.x, 0.2, pos.z);
          landmarkMesh.userData = { type: 'landmark' };
          scene.add(landmarkMesh);
          propertyMeshesRef.current.set(tileId, landmarkMesh);
        }
      } else if (prop.houses > 0) {
        // 1-3 Houses
        if (!existing || existing.userData.houses !== prop.houses) {
          if (existing) scene.remove(existing);

          const houseGroup = new THREE.Group();
          for (let h = 0; h < prop.houses; h++) {
            let houseMesh;
            if (houseModelJsonRef.current) {
              houseMesh = parseLegacyJsonToBufferObject(houseModelJsonRef.current, 0xffffff);
              houseMesh.scale.set(0.016, 0.016, 0.016);
            } else {
              const bGeom = new THREE.BoxGeometry(1.4, 1.4, 1.4);
              const bMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
              houseMesh = new THREE.Mesh(bGeom, bMat);
              houseMesh.position.y = 0.7;
            }
            houseMesh.position.x = (h - (prop.houses - 1) / 2) * 1.8;
            houseGroup.add(houseMesh);
          }

          const pos = getTile3DPos(tileId);
          houseGroup.position.set(pos.x, 0.1, pos.z);
          houseGroup.userData = { type: 'houses', houses: prop.houses };
          scene.add(houseGroup);
          propertyMeshesRef.current.set(tileId, houseGroup);
        }
      } else if (existing) {
        scene.remove(existing);
        propertyMeshesRef.current.delete(tileId);
      }
    });
  }, [properties]);

  // 5. Trigger Real 3D Dice Tumble on dice result
  useEffect(() => {
    if (!lastDiceResult || !diceGroupRef.current) return;

    setDiceRolling(true);
    diceSimRef.current = {
      active: true,
      d1: lastDiceResult.d1 || 1,
      d2: lastDiceResult.d2 || 1,
      progress: 0,
    };
  }, [lastDiceResult]);

  return (
    <div style={{
      position: 'relative',
      width: '840px',
      height: '840px',
      maxWidth: '96vw',
      maxHeight: '96vw',
      borderRadius: '20px',
      overflow: 'hidden',
      background: 'radial-gradient(circle at center, #101624 0%, #07090e 100%)',
      border: '3px solid var(--border-medium)',
      boxShadow: '0 0 60px rgba(0, 0, 0, 0.6), inset 0 0 50px rgba(0, 240, 255, 0.05)',
      userSelect: 'none',
    }}>
      {/* Three.js Canvas Container (Fixed Tabletop View) */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'default' }} />

      {/* Active Dice Floating Badge */}
      {lastDiceResult && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          padding: '8px 20px',
          borderRadius: '24px',
          background: lastDiceResult.isDoubles
            ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.9), rgba(168, 85, 247, 0.9))'
            : 'rgba(16, 22, 34, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: lastDiceResult.isDoubles ? '#060709' : '#fff',
          fontSize: '13px',
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
        }}>
          <span>🎲 {lastDiceResult.d1} + {lastDiceResult.d2} = {lastDiceResult.sum}</span>
          {lastDiceResult.isDoubles && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> DOUBLES!
            </span>
          )}
        </div>
      )}

      {/* Interactive Center HTML Stage (Lobby controls & Turn Action Prompts) */}
      {centerContent && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '460px',
          maxWidth: '85%',
          zIndex: 8,
          pointerEvents: 'auto',
        }}>
          {centerContent}
        </div>
      )}
    </div>
  );
}

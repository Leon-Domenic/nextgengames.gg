/**
 * Board Brawl - Standalone 3D Design Catalog & Procedural Asset Generator
 * 
 * NOTE: This is a standalone design module isolated from live game files.
 * It provides high-fidelity procedural generation for:
 * 1. The 45-degree diamond board with wood trim, turf center, jackpot stacks & timer.
 * 2. The 4 Corner Monuments (Start Hub, Lost Island Ruins, Stadium Arena, Airport).
 * 3. Resort-Specific Landmark Buildings (Cyprus, Ibiza, Dubai, Maldives).
 * 4. Country-Specific Housing Progression (Tiers 1-3 + Regional Hotel Landmarks).
 * 5. National Flag Lots & Badges.
 * 6. The 4 Pawn Tokens extracted from the match (Witch, Trader, Executive, Analyst).
 */

import * as THREE from 'three';

// ============================================================================
// 1. BOARD ENVIRONMENT & CENTER TURF GENERATOR
// ============================================================================

export function create3DBoardEnvironment(options = {}) {
  const group = new THREE.Group();
  group.name = 'BoardEnvironment';

  const boardRadius = options.radius || 58;
  const boardThickness = 3.5;

  // 1.1 Outer Polished Mahogany Beveled Frame
  const frameGeo = new THREE.BoxGeometry(boardRadius * 2 + 6, boardThickness, boardRadius * 2 + 6);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x24140e,
    roughness: 0.35,
    metalness: 0.15,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.y = -boardThickness / 2;
  frameMesh.rotation.y = Math.PI / 4;
  frameMesh.receiveShadow = true;
  group.add(frameMesh);

  // Gold Trim Accent Line around the perimeter
  const rimGeo = new THREE.BoxGeometry(boardRadius * 2 + 6.4, 0.4, boardRadius * 2 + 6.4);
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.2,
    metalness: 0.85,
  });
  const rimMesh = new THREE.Mesh(rimGeo, goldTrimMat);
  rimMesh.position.y = 0.1;
  rimMesh.rotation.y = Math.PI / 4;
  group.add(rimMesh);

  // 1.2 Center Sports Turf (Green Lawn with Striping)
  const lawnSize = boardRadius * 1.05;
  const lawnGeo = new THREE.BoxGeometry(lawnSize, 0.6, lawnSize);
  
  // Procedural canvas texture for turf stripes and stadium pitch lines
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base green grass
  ctx.fillStyle = '#2f7532';
  ctx.fillRect(0, 0, 512, 512);

  // Alternating lawn mowing stripes
  const numStripes = 10;
  const stripeH = 512 / numStripes;
  for (let i = 0; i < numStripes; i += 2) {
    ctx.fillStyle = '#39883d';
    ctx.fillRect(0, i * stripeH, 512, stripeH);
  }

  // Pitch white line markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 452, 452);
  ctx.beginPath();
  ctx.moveTo(30, 256);
  ctx.lineTo(482, 256);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 256, 60, 0, Math.PI * 2);
  ctx.stroke();

  const lawnTexture = new THREE.CanvasTexture(canvas);
  lawnTexture.wrapS = THREE.ClampToEdgeWrapping;
  lawnTexture.wrapT = THREE.ClampToEdgeWrapping;

  const lawnMat = new THREE.MeshStandardMaterial({
    map: lawnTexture,
    roughness: 0.8,
    metalness: 0.05,
  });
  const lawnMesh = new THREE.Mesh(lawnGeo, lawnMat);
  lawnMesh.position.y = 0.1;
  lawnMesh.rotation.y = Math.PI / 4;
  lawnMesh.receiveShadow = true;
  group.add(lawnMesh);

  // 1.3 Center Banknote Cash Jackpot Stacks (Can be hidden for pristine empty field)
  if (!options.hideCash) {
    const cashStackGroup = createJackpotCashPile(options.jackpotAmount || '300 000');
    cashStackGroup.position.set(0, 0.5, 0);
    group.add(cashStackGroup);
  }

  // 1.4 Match Timer Plaque Display ("08:38")
  if (!options.hideTimer) {
    const timerPlaque = createMatchTimerPlaque('08:38');
    timerPlaque.position.set(0, 3.2, -18);
    group.add(timerPlaque);
  }

  return group;
}

/**
 * Creates the central pile of currency banknotes bundled with gold bands
 */
export function createJackpotCashPile(amountLabel = '300 000') {
  const group = new THREE.Group();
  group.name = 'JackpotCashPile';

  const billMat = new THREE.MeshStandardMaterial({
    color: 0x85bb65,
    roughness: 0.7,
    metalness: 0.05,
  });
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xf3e882,
    roughness: 0.4,
    metalness: 0.3,
  });

  // Stack of 3 rows x 2 columns of banknote bundles
  const bundleW = 3.2;
  const bundleH = 1.0;
  const bundleD = 2.0;

  for (let layer = 0; layer < 3; layer++) {
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const bundle = new THREE.Group();
        const mainBundle = new THREE.Mesh(new THREE.BoxGeometry(bundleW, bundleH, bundleD), billMat);
        const goldBand = new THREE.Mesh(new THREE.BoxGeometry(bundleW * 0.25, bundleH * 1.02, bundleD * 1.02), bandMat);
        bundle.add(mainBundle);
        bundle.add(goldBand);

        const x = (c - 1) * (bundleW + 0.15) + (layer % 2 === 1 ? 0.3 : 0);
        const y = layer * bundleH + bundleH / 2;
        const z = (r - 0.5) * (bundleD + 0.15);
        bundle.position.set(x, y, z);
        bundle.castShadow = true;
        group.add(bundle);
      }
    }
  }

  // Floating Currency Prize Label ("300 000")
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 256;
  labelCanvas.height = 64;
  const lctx = labelCanvas.getContext('2d');
  lctx.fillStyle = '#ffffff';
  lctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.shadowColor = 'rgba(0,0,0,0.8)';
  lctx.shadowBlur = 8;
  lctx.fillText(amountLabel, 128, 32);

  const spriteMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(labelCanvas),
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(8, 2, 1);
  sprite.position.set(0, 4.8, 0);
  group.add(sprite);

  return group;
}

/**
 * Creates match timer floating digital bezel
 */
export function createMatchTimerPlaque(timeString = '08:38') {
  const group = new THREE.Group();

  const plaqueGeo = new THREE.BoxGeometry(7, 2.2, 0.6);
  const plaqueMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.3,
    metalness: 0.8,
  });
  const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
  group.add(plaqueMesh);

  // Bezel glow border
  const borderGeo = new THREE.BoxGeometry(7.2, 2.4, 0.4);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const borderMesh = new THREE.Mesh(borderGeo, borderMat);
  borderMesh.position.z = -0.15;
  group.add(borderMesh);

  // Digital clock face
  const tCanvas = document.createElement('canvas');
  tCanvas.width = 256;
  tCanvas.height = 96;
  const tctx = tCanvas.getContext('2d');
  tctx.fillStyle = '#0f172a';
  tctx.fillRect(0, 0, 256, 96);
  tctx.fillStyle = '#ffffff';
  tctx.font = 'bold 54px monospace';
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  tctx.fillText(timeString, 128, 48);

  const tMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(tCanvas),
  });
  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.9), tMat);
  faceMesh.position.z = 0.32;
  group.add(faceMesh);

  return group;
}

// ============================================================================
// 2. THE 4 CORNER MONUMENT GENERATORS
// ============================================================================

/**
 * Generates one of the 4 iconic corner landmark monuments
 * @param {'start' | 'lost_island' | 'world_championship' | 'world_tour'} type 
 */
export function create3DCornerMonument(type) {
  const group = new THREE.Group();
  group.name = `CornerMonument_${type}`;

  switch (type) {
    case 'world_championship':
      // 2.1 Stadium Bowl with Grandstands & Floodlight Pylons
      return buildWorldChampionshipStadium();

    case 'lost_island':
      // 2.2 Ancient Jungle Ruins & Overgrown Stone Ziggurat
      return buildLostIslandRuins();

    case 'world_tour':
      // 2.3 Airport Runway, Flight Control Tower & Passenger Jetliners
      return buildWorldTourAirport();

    case 'start':
    default:
      // 2.4 Metropole Skyline Towers (Petronas / Big Ben / Spire)
      return buildStartHubTowers();
  }
}

function buildWorldChampionshipStadium() {
  const g = new THREE.Group();

  // Tiered stadium arena bowl
  const bowlGeo = new THREE.CylinderGeometry(5.2, 4.4, 2.2, 24, 1, true);
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat);
  bowl.position.y = 1.1;
  g.add(bowl);

  // Stadium seating bleachers (Purple/Burgundy as in screenshot)
  const bleachersGeo = new THREE.RingGeometry(3.2, 5.0, 24);
  const bleachersMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const bleachers = new THREE.Mesh(bleachersGeo, bleachersMat);
  bleachers.rotation.x = -Math.PI / 2;
  bleachers.position.y = 1.8;
  g.add(bleachers);

  // Center stadium pitch
  const pitchGeo = new THREE.CircleGeometry(3.0, 24);
  const pitchMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = 0.8;
  g.add(pitch);

  // Stadium Floodlight Towers (4 pylons)
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const px = Math.cos(angle) * 5.6;
    const pz = Math.sin(angle) * 5.6;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.0), pylonMat);
    pole.position.set(px, 2.5, pz);
    g.add(pole);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.5), lightMat);
    lamp.position.set(px, 5.1, pz);
    lamp.lookAt(0, 2.0, 0);
    g.add(lamp);
  }

  // "WORLD CHAMPIONSHIPS" Billboard Header
  const bbCanvas = document.createElement('canvas');
  bbCanvas.width = 256;
  bbCanvas.height = 64;
  const bbctx = bbCanvas.getContext('2d');
  bbctx.fillStyle = '#ffffff';
  bbctx.font = 'bold 24px Arial, sans-serif';
  bbctx.textAlign = 'center';
  bbctx.textBaseline = 'middle';
  bbctx.fillText('WORLD CHAMPIONSHIPS', 128, 32);

  const bbSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(bbCanvas),
  }));
  bbSprite.scale.set(6, 1.5, 1);
  bbSprite.position.set(0, 4.6, 0);
  g.add(bbSprite);

  return g;
}

function buildLostIslandRuins() {
  const g = new THREE.Group();

  // Island base rock surrounded by turquoise water ring
  const waterGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.4, 24);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 0.2;
  g.add(water);

  // Mossy stepped ziggurat base (stone slabs)
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.95 });

  const base1 = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.8, 6.0), stoneMat);
  base1.position.y = 0.6;
  g.add(base1);

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 4.6), stoneMat);
  base2.position.y = 1.3;
  g.add(base2);

  const templeTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 3.2), mossMat);
  templeTop.position.y = 2.2;
  g.add(templeTop);

  // Ancient Temple Gate Pillars
  for (let x = -1.1; x <= 1.1; x += 2.2) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), stoneMat);
    pillar.position.set(x, 2.2, 1.7);
    g.add(pillar);
  }
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.4, 0.8), stoneMat);
  architrave.position.set(0, 3.4, 1.7);
  g.add(architrave);

  // Palm Trees & Tropical Foliage
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

  [[-2.2, -2.0], [2.2, -1.8], [-2.3, 1.8]].forEach(([tx, tz]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.8, 6), trunkMat);
    trunk.position.set(tx, 1.8, tz);
    trunk.rotation.z = (Math.random() - 0.5) * 0.25;
    g.add(trunk);

    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.0, 7), leafMat);
    canopy.position.set(tx, 3.4, tz);
    g.add(canopy);
  });

  // Pirate Treasure Chest with gold trim
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
  chest.position.set(1.4, 1.8, 1.4);
  g.add(chest);

  return g;
}

function buildWorldTourAirport() {
  const g = new THREE.Group();

  // Airport tarmac & runway
  const tarmacGeo = new THREE.BoxGeometry(8.5, 0.4, 8.5);
  const tarmacMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.7 });
  const tarmac = new THREE.Mesh(tarmacGeo, tarmacMat);
  tarmac.position.y = 0.2;
  g.add(tarmac);

  // Runway stripes
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (let i = -3; i <= 3; i += 1.5) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.9), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(i, 0.42, 0);
    g.add(line);
  }

  // Flight Control Tower (Cylinder shaft + glass observation cabin + radar dome)
  const towerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 4.0, 12),
    new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.3 })
  );
  towerShaft.position.set(-2.8, 2.2, -2.8);
  g.add(towerShaft);

  const cabin = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 0.8, 0.8, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.1 })
  );
  cabin.position.set(-2.8, 4.4, -2.8);
  g.add(cabin);

  const radar = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xd97706 })
  );
  radar.position.set(-2.8, 5.0, -2.8);
  g.add(radar);

  // Commercial Twin-Jet Airplanes (White & Blue)
  const plane = createMiniJetPlane();
  plane.position.set(1.2, 0.8, 1.5);
  plane.rotation.y = -Math.PI / 4;
  g.add(plane);

  const plane2 = createMiniJetPlane();
  plane2.position.set(-1.0, 0.8, 2.2);
  plane2.rotation.y = Math.PI / 3;
  plane2.scale.set(0.75, 0.75, 0.75);
  g.add(plane2);

  return g;
}

function createMiniJetPlane() {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });

  // Fuselage
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.8, 10), whiteMat);
  fuselage.rotation.z = Math.PI / 2;
  g.add(fuselage);

  // Nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 10), whiteMat);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 1.7;
  g.add(nose);

  // Main wings
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 3.2), whiteMat);
  wing.position.x = 0.2;
  g.add(wing);

  // Tail fin
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.06), blueMat);
  tail.position.set(-1.2, 0.35, 0);
  g.add(tail);

  return g;
}

function buildStartHubTowers() {
  const g = new THREE.Group();

  // Marble Plinth Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(4.8, 5.0, 0.6, 24),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 })
  );
  base.position.y = 0.3;
  g.add(base);

  // Center Skyscraper / Petronas style spire
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, metalness: 0.85, roughness: 0.15 });
  const tower1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.5, 1.2), towerMat);
  tower1.position.set(-0.7, 3.0, 0);
  g.add(tower1);

  const spire1 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 8), towerMat);
  spire1.position.set(-0.7, 6.4, 0);
  g.add(spire1);

  // Twin Tower
  const tower2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.5, 1.2), towerMat);
  tower2.position.set(0.7, 3.0, 0);
  g.add(tower2);

  const spire2 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 8), towerMat);
  spire2.position.set(0.7, 6.4, 0);
  g.add(spire2);

  // Skybridge connecting twin towers
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.5), towerMat);
  bridge.position.set(0, 3.8, 0);
  g.add(bridge);

  // Big Ben / Historic Tower accent
  const brickTower = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 4.2, 1.0),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  brickTower.position.set(1.8, 2.4, 1.6);
  g.add(brickTower);

  const clockRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a })
  );
  clockRoof.position.set(1.8, 4.9, 1.6);
  clockRoof.rotation.y = Math.PI / 4;
  g.add(clockRoof);

  return g;
}

// ============================================================================
// 3. RESORT-SPECIFIC 3D BUILDINGS
// ============================================================================

/**
 * Creates custom destination architecture for the 4 dedicated resorts
 * @param {'cyprus' | 'ibiza' | 'dubai' | 'maldives'} resortId 
 */
export function create3DResortBuilding(resortId) {
  const group = new THREE.Group();
  group.name = `Resort_${resortId}`;

  switch (resortId.toLowerCase()) {
    case 'dubai':
      return buildBurjAlArabResort();

    case 'maldives':
      return buildMaldivesOverwaterResort();

    case 'ibiza':
      return buildIbizaBeachClubResort();

    case 'cyprus':
    default:
      return buildCyprusRivieraResort();
  }
}

function buildBurjAlArabResort() {
  const g = new THREE.Group();

  // Island foundation surrounded by sea
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.6, 0.4, 18),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2 })
  );
  island.position.y = 0.2;
  g.add(island);

  // White Curved Sail Facade (Iconic curved structure)
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.quadraticCurveTo(2.4, 2.0, 0, 5.8);
  sailShape.lineTo(-0.6, 5.8);
  sailShape.lineTo(-0.6, 0);
  sailShape.closePath();

  const extrudeSettings = { depth: 1.6, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1 };
  const sailGeo = new THREE.ExtrudeGeometry(sailShape, extrudeSettings);
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const sailMesh = new THREE.Mesh(sailGeo, sailMat);
  sailMesh.position.set(0, 0.4, -0.8);
  g.add(sailMesh);

  // Blue glass atrium facade
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });
  const glassBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.2, 1.4), glassMat);
  glassBack.position.set(-0.3, 3.0, 0);
  g.add(glassBack);

  // Cantilevered Helipad Platform
  const helipad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.1, 14),
    new THREE.MeshStandardMaterial({ color: 0x10b981 })
  );
  helipad.position.set(0.6, 4.4, 0.7);
  g.add(helipad);

  // Top mast spire
  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.08, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
  );
  spire.position.set(0, 6.4, 0);
  g.add(spire);

  return g;
}

function buildMaldivesOverwaterResort() {
  const g = new THREE.Group();

  // Water Reflection Disc
  const lagoon = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 20),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.15, transparent: true, opacity: 0.88 })
  );
  lagoon.rotation.x = -Math.PI / 2;
  lagoon.position.y = 0.05;
  g.add(lagoon);

  // Wooden Boardwalk Pier
  const pierMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
  const pier = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 3.2), pierMat);
  pier.position.set(0, 0.4, -0.8);
  g.add(pier);

  // Wooden Stilts supporting the bungalow
  const stiltMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
  for (let x of [-0.9, 0.9]) {
    for (let z of [-0.9, 0.9]) {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9), stiltMat);
      stilt.position.set(x, 0.45, z + 0.8);
      g.add(stilt);
    }
  }

  // Bungalow Deck Platform
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 2.2), pierMat);
  deck.position.set(0, 0.9, 0.8);
  g.add(deck);

  // Wooden Wall Cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.2, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  cabin.position.set(0, 1.55, 0.8);
  g.add(cabin);

  // Woven Thatched Palm Canopy (Conical / High Pitch Roof)
  const thatchMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.95 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.2, 6), thatchMat);
  roof.position.set(0, 2.7, 0.8);
  g.add(roof);

  return g;
}

function buildIbizaBeachClubResort() {
  const g = new THREE.Group();

  // Terraced Sand Deck
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.3, 3.6),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 })
  );
  deck.position.y = 0.15;
  g.add(deck);

  // Neon-Lit Swimming Pool
  const pool = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.1, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.05 })
  );
  pool.position.set(-0.7, 0.31, 0.6);
  g.add(pool);

  // Whitewashed Cubic Modern Villa Blocks
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const block1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), whiteMat);
  block1.position.set(0.8, 0.95, -0.6);
  g.add(block1);

  const block2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), whiteMat);
  block2.position.set(-0.7, 0.7, -0.8);
  g.add(block2);

  // Wooden Pergola / Cabana Lounge
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
  const pergolaRoof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.4), woodMat);
  pergolaRoof.position.set(-0.7, 1.5, 0.8);
  g.add(pergolaRoof);

  return g;
}

function buildCyprusRivieraResort() {
  const g = new THREE.Group();

  // Terracotta sun terrace
  const terrace = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.3, 3.4),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 })
  );
  terrace.position.y = 0.15;
  g.add(terrace);

  // Mediterranean whitewashed house with terracotta tiles
  const mainHouse = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 1.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
  );
  mainHouse.position.set(-0.5, 0.95, -0.5);
  g.add(mainHouse);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.7 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.set(-0.5, 2.1, -0.5);
  g.add(roof);

  // Striped Beach Umbrella
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  pole.position.set(1.0, 0.7, 0.6);
  g.add(pole);

  const umbrella = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x0284c7 })
  );
  umbrella.position.set(1.0, 1.4, 0.6);
  g.add(umbrella);

  return g;
}

// ============================================================================
// 4. COUNTRY-SPECIFIC HOUSING PROGRESSION (TIER 1 - 3 & HOTELS)
// ============================================================================

/**
 * Builds the 3D model for a specific country, tier, and color group
 * @param {string} country Name of the country (e.g. 'Poland', 'Germany', 'Japan', 'USA')
 * @param {1 | 2 | 3 | 4} tier Housing level (1: Small, 2: Medium, 3: Estate, 4: Hotel/Landmark)
 * @param {string} colorGroup Hex color string for theme accents
 */
export function createCountryHouseModel(country, tier, colorGroup = '#3b82f6') {
  const group = new THREE.Group();
  group.name = `Building_${country}_Tier${tier}`;

  const c = country.toLowerCase();

  if (c.includes('poland') || c.includes('czech') || c.includes('austria')) {
    return buildCentralEuropeanTier(tier, colorGroup);
  } else if (c.includes('germany') || c.includes('netherland')) {
    return buildGermanDutchTier(tier, colorGroup);
  } else if (c.includes('spain') || c.includes('italy')) {
    return buildMediterraneanTier(tier, colorGroup);
  } else if (c.includes('uk') || c.includes('france')) {
    return buildWesternEuropeanTier(tier, colorGroup);
  } else if (c.includes('japan') || c.includes('korea')) {
    return buildEastAsianTier(tier, colorGroup);
  } else if (c.includes('singapore') || c.includes('uae')) {
    return buildModernGulfTropicalTier(tier, colorGroup);
  } else {
    // USA, Australia, Default
    return buildModernWesternTier(tier, colorGroup);
  }
}

// 4.1 Central European (Poland / Czechia / Austria)
function buildCentralEuropeanTier(tier, colorGroup) {
  const g = new THREE.Group();
  const accentMat = new THREE.MeshStandardMaterial({ color: colorGroup, roughness: 0.3 });
  const brickMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });

  if (tier === 1) {
    // Small pitched-roof brick cottage
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), brickMat);
    body.position.y = 0.45;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.7, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.25;
    g.add(roof);
  } else if (tier === 2) {
    // Dual-pitched manor
    const body1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 1.1), brickMat);
    body1.position.set(-0.5, 0.6, 0);
    g.add(body1);
    const body2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.0), brickMat);
    body2.position.set(0.6, 0.45, 0);
    g.add(body2);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.8, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(-0.5, 1.6, 0);
    g.add(roof);
  } else if (tier === 3) {
    // Grand country estate with courtyard & columns
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 1.6), new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
    body.position.y = 0.75;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.0, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.0;
    g.add(roof);
    const pediment = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.4), accentMat);
    pediment.position.set(0, 1.5, 0.9);
    g.add(pediment);
  } else {
    // Hotel / Landmark: Historic Town Hall & Clock Bell Tower
    const hall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 1.8), brickMat);
    hall.position.y = 1.0;
    g.add(hall);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.0, 4.4, 1.0), brickMat);
    tower.position.set(0, 2.2, 0.3);
    g.add(tower);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 8), accentMat);
    spire.position.set(0, 5.2, 0.3);
    g.add(spire);
  }

  return g;
}

// 4.2 German & Dutch (Fachwerk / Canal Stepped Gables / Brandenburg Gate)
function buildGermanDutchTier(tier, colorGroup) {
  const g = new THREE.Group();
  const plasterMat = new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.5 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.7 });

  if (tier === 1) {
    // Half-timbered cottage
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), plasterMat);
    body.position.y = 0.5;
    g.add(body);
    const timber = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 1.25), woodMat);
    timber.position.y = 0.5;
    g.add(timber);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.9, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.45;
    g.add(roof);
  } else if (tier === 2) {
    // Amsterdam Stepped-Gable Townhouse
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.0, 1.3), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
    body.position.y = 1.0;
    g.add(body);
    // Stepped gable steps on top
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.4), woodMat);
    step1.position.set(0, 2.15, 0.5);
    g.add(step1);
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), woodMat);
    step2.position.set(0, 2.45, 0.5);
    g.add(step2);
  } else if (tier === 3) {
    // Merchant Guild Grand Residence
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.6), plasterMat);
    body.position.y = 1.1;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.2, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.8;
    g.add(roof);
  } else {
    // Hotel: Brandenburg Gate Classical Colonnade
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 1.6), plasterMat);
    base.position.y = 0.2;
    g.add(base);
    // 6 Doric Pillars
    for (let i = -1.4; i <= 1.4; i += 0.56) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8), plasterMat);
      col.position.set(i, 1.5, 0);
      g.add(col);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 1.4), plasterMat);
    lintel.position.y = 3.1;
    g.add(lintel);
    // Quadriga chariot topper
    const chariot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 }));
    chariot.position.set(0, 3.8, 0);
    g.add(chariot);
  }

  return g;
}

// 4.3 Mediterranean (Spain & Italy: Terracotta Casita / Colosseum Palazzo)
function buildMediterraneanTier(tier, colorGroup) {
  const g = new THREE.Group();
  const stuccoMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 });
  const tileMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.7 });

  if (tier === 1) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), stuccoMat);
    body.position.y = 0.45;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.5, 4), tileMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.15;
    g.add(roof);
  } else if (tier === 2) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.2), stuccoMat);
    body.position.y = 0.6;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 4), tileMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.5;
    g.add(roof);
  } else if (tier === 3) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.8), stuccoMat);
    body.position.y = 0.8;
    g.add(body);
    const courtyardArch = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 8, 12, Math.PI), tileMat);
    courtyardArch.position.set(0, 0.8, 0.92);
    g.add(courtyardArch);
  } else {
    // Hotel: Roman Colosseum Amphitheatre
    const outerGeo = new THREE.CylinderGeometry(2.0, 2.0, 2.8, 16, 1, true);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8, side: THREE.DoubleSide });
    const colosseum = new THREE.Mesh(outerGeo, stoneMat);
    colosseum.position.y = 1.4;
    g.add(colosseum);
  }

  return g;
}

// 4.4 Western European (UK & France: Victorian / Haussmannian / Big Ben)
function buildWesternEuropeanTier(tier, colorGroup) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
  const mansardMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });

  if (tier === 1) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), stoneMat);
    body.position.y = 0.5;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.7, 4), mansardMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.35;
    g.add(roof);
  } else if (tier === 2) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.3), stoneMat);
    body.position.y = 0.9;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.8, 4), mansardMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.2;
    g.add(roof);
  } else if (tier === 3) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.6), stoneMat);
    body.position.y = 1.1;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.0, 4), mansardMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.7;
    g.add(roof);
  } else {
    // Hotel: Big Ben Elizabeth Clock Tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.6, 1.4), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }));
    tower.position.y = 2.3;
    g.add(tower);
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.4, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dial.position.set(0, 3.8, 0.72);
    g.add(dial);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 4), mansardMat);
    spire.rotation.y = Math.PI / 4;
    spire.position.y = 5.7;
    g.add(spire);
  }

  return g;
}

// 4.5 East Asian (Japan & Korea: Minka / Pagoda / Red Lacquer Shrine)
function buildEastAsianTier(tier, colorGroup) {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const kawaraRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.3 });

  if (tier === 1) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), woodMat);
    body.position.y = 0.4;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 4), kawaraRoofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.05;
    g.add(roof);
  } else if (tier === 2) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), woodMat);
    body.position.y = 0.6;
    g.add(body);
    // Double sweeping eaves
    const eave1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 1.8), kawaraRoofMat);
    eave1.position.y = 1.2;
    g.add(eave1);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.7, 4), kawaraRoofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.65;
    g.add(roof);
  } else if (tier === 3) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 1.8), redMat);
    body.position.y = 0.8;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.9, 4), kawaraRoofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.05;
    g.add(roof);
  } else {
    // Hotel: Multi-Tiered Pagoda Tower
    for (let layer = 0; layer < 4; layer++) {
      const w = 1.8 - layer * 0.3;
      const h = 0.8;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), redMat);
      b.position.y = layer * 1.1 + h / 2;
      g.add(b);

      const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.12, w + 0.8), kawaraRoofMat);
      eave.position.y = layer * 1.1 + h;
      g.add(eave);
    }
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 }));
    spire.position.y = 5.2;
    g.add(spire);
  }

  return g;
}

// 4.6 Modern Gulf & Tropical (Singapore / UAE: Glass, Skylines, SkyParks)
function buildModernGulfTropicalTier(tier, colorGroup) {
  const g = new THREE.Group();
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });

  if (tier === 1) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), whiteMat);
    b.position.y = 0.55;
    g.add(b);
    const gP = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.1), glassMat);
    gP.position.set(0, 0.55, 0.62);
    g.add(gP);
  } else if (tier === 2) {
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.2), whiteMat);
    b1.position.y = 0.9;
    g.add(b1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 1.0), glassMat);
    b2.position.set(0.6, 0.6, 0.3);
    g.add(b2);
  } else if (tier === 3) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 1.6), glassMat);
    tower.position.y = 1.5;
    g.add(tower);
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.0), whiteMat);
    terrace.position.y = 3.0;
    g.add(terrace);
  } else {
    // Hotel: Triple Tower with SkyPark Surfboard Roof (Marina Bay Sands style)
    for (let i of [-0.9, 0, 0.9]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.65, 4.2, 1.0), glassMat);
      t.position.set(i, 2.1, 0);
      g.add(t);
    }
    const skypark = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 1.4), whiteMat);
    skypark.position.set(0, 4.35, 0);
    g.add(skypark);
  }

  return g;
}

// 4.7 Modern Western (USA & Australia: Craftsman / High-Rise Skyscraper)
function buildModernWesternTier(tier, colorGroup) {
  const g = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.15 });

  if (tier === 1) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), concreteMat);
    body.position.y = 0.45;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 1.3), darkGlassMat);
    roof.position.y = 0.95;
    g.add(roof);
  } else if (tier === 2) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 1.4), concreteMat);
    body.position.y = 0.8;
    g.add(body);
  } else if (tier === 3) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 1.6), darkGlassMat);
    body.position.y = 1.4;
    g.add(body);
  } else {
    // Hotel: Art Deco Tiered Skyscraper (Empire State style)
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.0), concreteMat);
    base.position.y = 1.2;
    g.add(base);
    const mid = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.4), concreteMat);
    mid.position.y = 3.5;
    g.add(mid);
    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 }));
    needle.position.y = 5.4;
    g.add(needle);
  }

  return g;
}

// ============================================================================
// 5. PAWN TOKEN FIGURINES (MATCHING SCREENSHOT)
// ============================================================================

/**
 * Creates 3D character pawns matching the screenshot
 * @param {'witch' | 'trader' | 'executive' | 'analyst'} pawnType 
 * @param {string} playerColor Accent ring color
 */
export function create3DPawnToken(pawnType, playerColor = '#8b5cf6') {
  const group = new THREE.Group();
  group.name = `Pawn_${pawnType}`;

  // Standard Pedestal Token Plinth
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.4, 0.4, 20),
    new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.5, roughness: 0.3 })
  );
  plinth.position.y = 0.2;
  group.add(plinth);

  // Colored Player Identification Ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.1, 8, 24),
    new THREE.MeshStandardMaterial({ color: playerColor, metalness: 0.8, roughness: 0.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.38;
  group.add(ring);

  switch (pawnType) {
    case 'trader':
      // Young Businessman with orange blazer & briefcase
      return attachTraderFigure(group);

    case 'executive':
      // Businesswoman in charcoal suit with red tie & folio
      return attachExecutiveFigure(group);

    case 'analyst':
      // Senior Analyst in grey suit with spectacles
      return attachAnalystFigure(group);

    case 'witch':
    default:
      // Witch / Sorceress with pointed hat, staff & orb
      return attachWitchFigure(group);
  }
}

function attachWitchFigure(group) {
  const robeMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.6 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.4 });
  const staffMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const orbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Flowing Robe Skirt (Bell shape)
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.0, 14), robeMat);
  skirt.position.y = 1.4;
  group.add(skirt);

  // Torso & Shoulders
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.1, 10), robeMat);
  torso.position.y = 2.8;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), skinMat);
  head.position.y = 3.65;
  group.add(head);

  // Pointed Witch Hat (Wide brim + tall twisted cone)
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.1, 18), hatMat);
  brim.position.y = 3.85;
  group.add(brim);

  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 12), hatMat);
  crown.position.set(0, 4.65, -0.15);
  crown.rotation.x = -0.15;
  group.add(crown);

  // Wizard Staff in Right Hand
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.4), staffMat);
  shaft.position.set(0.7, 2.1, 0.3);
  group.add(shaft);

  const staffHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
  staffHead.position.set(0.7, 3.8, 0.3);
  group.add(staffHead);

  // Floating Magic Crystal Orb in Left Hand
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), orbMat);
  orb.position.set(-0.7, 2.6, 0.4);
  group.add(orb);

  return group;
}

function attachTraderFigure(group) {
  const blazerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }); // Orange-amber
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pantMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x9a3412 });

  // Trousers / Legs
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.6, 0.4), pantMat);
  legs.position.y = 1.2;
  group.add(legs);

  // Orange Blazer Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.3, 0.5), blazerMat);
  torso.position.y = 2.45;
  group.add(torso);

  // Head & Swept Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
  head.position.y = 3.35;
  group.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.7), hairMat);
  hair.position.set(0, 3.65, 0.05);
  group.add(hair);

  // Briefcase
  const briefcase = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.6, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
  );
  briefcase.position.set(0.65, 1.7, 0.1);
  group.add(briefcase);

  return group;
}

function attachExecutiveFigure(group) {
  const suitMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
  const redTieMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

  // Skirt / Trousers
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.5, 0.4), suitMat);
  skirt.position.y = 1.15;
  group.add(skirt);

  // Tailored Suit Jacket
  const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.45), suitMat);
  jacket.position.y = 2.4;
  group.add(jacket);

  // Red Power Tie
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.05), redTieMat);
  tie.position.set(0, 2.5, 0.25);
  group.add(tie);

  // Head & Bob Haircut
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
  head.position.y = 3.25;
  group.add(head);

  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), hairMat);
  bob.position.set(0, 3.35, -0.05);
  group.add(bob);

  // Executive Document Folio
  const folio = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.6, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x991b1b })
  );
  folio.position.set(-0.6, 2.2, 0.2);
  group.add(folio);

  return group;
}

function attachAnalystFigure(group) {
  const suitMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });

  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.6, 0.4), suitMat);
  legs.position.y = 1.2;
  group.add(legs);

  const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.3, 0.5), suitMat);
  jacket.position.y = 2.45;
  group.add(jacket);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
  head.position.y = 3.35;
  group.add(head);

  // Spectacles
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  glasses.position.set(0, 3.4, 0.32);
  group.add(glasses);

  // Briefcase
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  bag.position.set(0.65, 1.7, 0.1);
  group.add(bag);

  return group;
}

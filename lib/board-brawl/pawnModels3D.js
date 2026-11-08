import * as THREE from 'three';
import { DICE_SKIN_MAP, DICE_SKINS } from './diceSkins.js';

/**
 * Parses legacy Three.js JSON 4.4 / Geometry models (from zhongyi-tong repo)
 * into modern Three.js BufferGeometry groups compatible with Three r125+.
 */
export function parseLegacyJsonToBufferObject(json, defaultColor = 0xffffff) {
  if (!json) return new THREE.Group();

  const geometries = json.geometries || [];
  const geoMap = new Map();

  for (const g of geometries) {
    if (g.type === 'Geometry' && g.data) {
      const data = g.data;
      const vertices = data.vertices || [];
      const faces = data.faces || [];
      const uvs = data.uvs && data.uvs[0] ? data.uvs[0] : [];
      const normals = data.normals || [];

      const positions = [];
      const outNormals = [];
      const outUvs = [];

      let offset = 0;
      const zLength = faces.length;

      while (offset < zLength) {
        const type = faces[offset++];
        const isQuad = (type & 1);
        const hasMaterial = (type & 2);
        const hasFaceVertexUv = (type & 8);
        const hasFaceNormal = (type & 16);
        const hasFaceVertexNormal = (type & 32);
        const hasFaceColor = (type & 64);
        const hasFaceVertexColor = (type & 128);

        const vIndices = isQuad
          ? [faces[offset++], faces[offset++], faces[offset++], faces[offset++]]
          : [faces[offset++], faces[offset++], faces[offset++]];

        if (hasMaterial) offset++;
        if (type & 4) offset++; // face uv

        let uvIndices = null;
        if (hasFaceVertexUv) {
          uvIndices = isQuad
            ? [faces[offset++], faces[offset++], faces[offset++], faces[offset++]]
            : [faces[offset++], faces[offset++], faces[offset++]];
        }
        if (hasFaceNormal) offset++;
        let normIndices = null;
        if (hasFaceVertexNormal) {
          normIndices = isQuad
            ? [faces[offset++], faces[offset++], faces[offset++], faces[offset++]]
            : [faces[offset++], faces[offset++], faces[offset++]];
        }
        if (hasFaceColor) offset++;
        if (hasFaceVertexColor) offset += isQuad ? 4 : 3;

        // Triangulate
        const triangles = isQuad
          ? [[0, 1, 3], [1, 2, 3]]
          : [[0, 1, 2]];

        for (const [a, b, c] of triangles) {
          for (const idx of [a, b, c]) {
            const vIdx = vIndices[idx];
            positions.push(vertices[vIdx * 3], vertices[vIdx * 3 + 1], vertices[vIdx * 3 + 2]);

            if (normIndices && normals.length > 0) {
              const nIdx = normIndices[idx];
              outNormals.push(normals[nIdx * 3], normals[nIdx * 3 + 1], normals[nIdx * 3 + 2]);
            }

            if (uvIndices && uvs.length > 0) {
              const uvIdx = uvIndices[idx];
              outUvs.push(uvs[uvIdx * 2], uvs[uvIdx * 2 + 1]);
            }
          }
        }
      }

      const bufGeo = new THREE.BufferGeometry();
      bufGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      if (outNormals.length > 0) {
        bufGeo.setAttribute('normal', new THREE.Float32BufferAttribute(outNormals, 3));
      } else {
        bufGeo.computeVertexNormals();
      }
      if (outUvs.length > 0) {
        bufGeo.setAttribute('uv', new THREE.Float32BufferAttribute(outUvs, 2));
      }

      geoMap.set(g.uuid, bufGeo);
    }
  }

  // Build hierarchy
  function buildNode(nodeData) {
    let obj;
    if (nodeData.type === 'Mesh' && geoMap.has(nodeData.geometry)) {
      const mat = new THREE.MeshStandardMaterial({
        color: defaultColor,
        roughness: 0.35,
        metalness: 0.5,
      });
      obj = new THREE.Mesh(geoMap.get(nodeData.geometry), mat);
    } else {
      obj = new THREE.Group();
    }

    if (nodeData.name) obj.name = nodeData.name;
    if (nodeData.matrix) {
      const m = new THREE.Matrix4().fromArray(nodeData.matrix);
      obj.applyMatrix4(m);
    }

    if (nodeData.children) {
      for (const child of nodeData.children) {
        obj.add(buildNode(child));
      }
    }
    return obj;
  }

  const rootGroup = new THREE.Group();
  if (json.object) {
    rootGroup.add(buildNode(json.object));
  }
  return rootGroup;
}

/**
 * High-Quality Procedural 3D Pawns for Board Brawl
 * 14 Unique Character Sculptures
 */
export function createProceduralPawn(tokenId, playerColor = '#00f0ff') {
  const pawnGroup = new THREE.Group();
  const colorNum = new THREE.Color(playerColor);

  // Pedestal base disk with player's color and metallic rim
  const baseGeom = new THREE.CylinderGeometry(1.6, 1.9, 0.45, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: colorNum,
    roughness: 0.3,
    metalness: 0.6,
  });
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.position.y = 0.225;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  pawnGroup.add(baseMesh);

  // Pedestal glowing ring
  const ringGeom = new THREE.TorusGeometry(1.7, 0.1, 16, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: colorNum });
  const ringMesh = new THREE.Mesh(ringGeom, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.45;
  pawnGroup.add(ringMesh);

  // Token Sculpt Geometry
  const tokenGroup = new THREE.Group();
  tokenGroup.position.y = 0.5;

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.85,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.15,
    metalness: 0.9,
  });
  const playerMat = new THREE.MeshStandardMaterial({
    color: colorNum,
    roughness: 0.3,
    metalness: 0.7,
  });

  switch (tokenId) {
    case 'hat': {
      // Top Hat
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.15, 32), chromeMat);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.3, 32), playerMat);
      band.position.y = 0.2;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.85, 1.8, 32), chromeMat);
      crown.position.y = 1.05;
      tokenGroup.add(brim, band, crown);
      break;
    }

    case 'witch': {
      // Pointed Witch Hat with Curved Tip
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 32), chromeMat);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.25, 32), playerMat);
      band.position.y = 0.18;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.9, 32), chromeMat);
      cone.position.set(0, 1.05, -0.1);
      cone.rotation.x = -0.15;
      tokenGroup.add(brim, band, cone);
      break;
    }

    case 'traveler': {
      // Safari Hat & Adventurer Backpack
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 32), goldMat);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), goldMat);
      crown.position.y = 0.05;
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.6), playerMat);
      pack.position.set(0, 0.8, -0.6);
      tokenGroup.add(brim, crown, pack);
      break;
    }

    case 'dragon': {
      // Golden Wyrm Drake Sculpt
      const drakeBody = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.0, 16), goldMat);
      drakeBody.position.y = 1.0;
      const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 8), playerMat);
      horn1.position.set(-0.4, 1.9, -0.2);
      horn1.rotation.z = 0.4;
      const horn2 = horn1.clone();
      horn2.position.x = 0.4;
      horn2.rotation.z = -0.4;
      const wing1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.1), playerMat);
      wing1.position.set(-0.9, 1.2, 0);
      wing1.rotation.y = 0.4;
      const wing2 = wing1.clone();
      wing2.position.x = 0.9;
      wing2.rotation.y = -0.4;
      tokenGroup.add(drakeBody, horn1, horn2, wing1, wing2);
      break;
    }

    case 'samurai': {
      // Cyber Kabuto Helmet with Crescent Crest
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 24), chromeMat);
      helm.position.y = 1.1;
      const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.1, 16, 32, Math.PI), goldMat);
      crescent.position.set(0, 1.7, 0.4);
      crescent.rotation.x = Math.PI / 2;
      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), goldMat);
      blade1.position.set(-0.5, 0.9, -0.4);
      blade1.rotation.z = 0.35;
      const blade2 = blade1.clone();
      blade2.position.x = 0.5;
      blade2.rotation.z = -0.35;
      tokenGroup.add(helm, crescent, blade1, blade2);
      break;
    }

    case 'robot': {
      // Robot Body & Head
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.4, 1.1), playerMat);
      body.position.y = 0.9;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), chromeMat);
      head.position.y = 2.05;
      const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      eye1.position.set(-0.25, 2.1, 0.46);
      const eye2 = eye1.clone();
      eye2.position.x = 0.25;
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16), goldMat);
      antenna.position.set(0, 2.65, 0);
      tokenGroup.add(body, head, eye1, eye2, antenna);
      break;
    }

    case 'car': {
      // Streamlined Sports Car
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.2), playerMat);
      chassis.position.y = 0.4;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 1.1), chromeMat);
      cabin.position.set(0, 0.8, -0.15);
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.35), goldMat);
      spoiler.position.set(0, 0.85, 0.9);
      tokenGroup.add(chassis, cabin, spoiler);
      break;
    }

    case 'yacht': {
      // Superyacht Hull & Decks
      const hullGeom = new THREE.ConeGeometry(0.9, 2.4, 16);
      const hull = new THREE.Mesh(hullGeom, chromeMat);
      hull.rotation.x = Math.PI / 2;
      hull.scale.set(1.1, 1.0, 0.6);
      hull.position.y = 0.5;
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 1.0), playerMat);
      bridge.position.set(0, 0.9, 0.1);
      tokenGroup.add(hull, bridge);
      break;
    }

    case 'rocket': {
      // Space Rocket
      const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 1.8, 32), chromeMat);
      fuselage.position.y = 1.1;
      const nosecone = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.0, 32), playerMat);
      nosecone.position.y = 2.45;
      const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.6), goldMat);
      fin1.position.set(0.7, 0.6, 0);
      const fin2 = fin1.clone();
      fin2.position.set(-0.7, 0.6, 0);
      tokenGroup.add(fuselage, nosecone, fin1, fin2);
      break;
    }

    case 'duck': {
      // Golden Duck
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 16), goldMat);
      body.scale.set(1, 0.8, 1.2);
      body.position.y = 0.8;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16), goldMat);
      head.position.set(0, 1.45, -0.6);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 1.45, -1.05);
      tokenGroup.add(body, head, beak);
      break;
    }

    case 'diamond': {
      // Huge Cut Diamond Gem
      const gemGeom = new THREE.OctahedronGeometry(1.2, 0);
      const gemMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.05,
        transmission: 0.85,
        thickness: 1.2,
      });
      const gem = new THREE.Mesh(gemGeom, gemMat);
      gem.position.y = 1.3;
      tokenGroup.add(gem);
      break;
    }

    case 'crown': {
      // Royal Sovereign Crown
      const circlet = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.45, 32), goldMat);
      circlet.position.y = 0.5;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 16), goldMat);
        spike.position.set(Math.cos(angle) * 0.95, 1.1, Math.sin(angle) * 0.95);
        tokenGroup.add(spike);
      }
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), playerMat);
      jewel.position.y = 1.0;
      tokenGroup.add(circlet, jewel);
      break;
    }

    case 'brawler': {
      // Boxing Glove
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 16), playerMat);
      glove.scale.set(1.1, 1.3, 1.0);
      glove.position.y = 1.3;
      const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), playerMat);
      thumb.position.set(0.65, 1.2, 0.2);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.5, 32), chromeMat);
      cuff.position.y = 0.5;
      tokenGroup.add(glove, thumb, cuff);
      break;
    }

    case 'mystic':
    default: {
      // Oracle Crystal Orb & Tripod
      const orbGeom = new THREE.SphereGeometry(0.85, 32, 32);
      const orbMat = new THREE.MeshPhysicalMaterial({
        color: 0xa855f7,
        roughness: 0.1,
        transmission: 0.7,
        thickness: 0.9,
      });
      const orb = new THREE.Mesh(orbGeom, orbMat);
      orb.position.y = 1.4;
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 0.7, 32), goldMat);
      stand.position.y = 0.45;
      tokenGroup.add(orb, stand);
      break;
    }
  }

  pawnGroup.add(tokenGroup);
  pawnGroup.scale.set(0.9, 0.9, 0.9);
  return pawnGroup;
}

/**
 * Generates crisp 256x256 custom dice face textures (1-6) using HTML5 Canvas
 * based on selected dice skin palette.
 */
export function generateDiceMaterials(skinId = 'classic_red') {
  const skin = DICE_SKIN_MAP[skinId] || DICE_SKINS[0];
  const p = skin.palette;
  const materials = [];

  const pipLayouts = {
    1: [[0.5, 0.5]],
    2: [[0.28, 0.28], [0.72, 0.72]],
    3: [[0.26, 0.26], [0.5, 0.5], [0.74, 0.74]],
    4: [[0.28, 0.28], [0.28, 0.72], [0.72, 0.28], [0.72, 0.72]],
    5: [[0.26, 0.26], [0.26, 0.74], [0.5, 0.5], [0.74, 0.26], [0.74, 0.74]],
    6: [[0.28, 0.25], [0.28, 0.5], [0.28, 0.75], [0.72, 0.25], [0.72, 0.5], [0.72, 0.75]],
  };

  // Three.js BoxGeometry material face index order:
  // 0: +X (Face 3), 1: -X (Face 4), 2: +Y (Face 1), 3: -Y (Face 6), 4: +Z (Face 2), 5: -Z (Face 5)
  // Standard casino die face mapping where opposite sides sum to 7
  const faceOrder = [3, 4, 1, 6, 2, 5];
  for (const faceNum of faceOrder) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Custom body color
    ctx.fillStyle = p.body;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle edge shading / bevel
    const grad = ctx.createRadialGradient(128, 128, 80, 128, 128, 140);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Custom border stroke
    ctx.strokeStyle = p.border;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 248);

    // Render pips
    const pips = pipLayouts[faceNum] || pipLayouts[1];
    const pipColor = faceNum === 1 ? p.pipAlt : p.pip;
    const radius = faceNum === 1 ? 28 : 19;

    for (const [px, py] of pips) {
      const cx = px * 256;
      const cy = py * 256;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = pipColor;
      ctx.fill();

      // Specular shine on pip
      ctx.beginPath();
      ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;

    materials.push(
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: p.roughness,
        metalness: p.metalness,
      })
    );
  }

  return materials;
}

/**
 * Procedural 3D Miniature House for Board Brawl property developments
 * Styled with the owner's distinct custom player color
 */
export function create3DHouse(ownerColor = '#22c55e') {
  const houseGroup = new THREE.Group();
  const baseColor = new THREE.Color(ownerColor);
  const darkRoofColor = baseColor.clone().multiplyScalar(0.72);

  // Base walls (clean stylized walls tinted with player color)
  const wallGeom = new THREE.BoxGeometry(1.1, 0.85, 0.9);
  const wallMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.35,
    metalness: 0.25,
  });
  const walls = new THREE.Mesh(wallGeom, wallMat);
  walls.position.y = 0.425;
  walls.castShadow = true;
  houseGroup.add(walls);

  // Gable roof (richer tone of owner's color)
  const roofGeom = new THREE.ConeGeometry(0.85, 0.6, 4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: darkRoofColor,
    roughness: 0.3,
    metalness: 0.35,
  });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 1, 0.95);
  roof.position.y = 1.15;
  roof.castShadow = true;
  houseGroup.add(roof);

  // Miniature Chimney with golden trim
  const chimneyGeom = new THREE.BoxGeometry(0.2, 0.4, 0.2);
  const chimneyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.6,
  });
  const chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
  chimney.position.set(0.3, 1.25, -0.15);
  houseGroup.add(chimney);

  houseGroup.scale.set(1.4, 1.4, 1.4);
  return houseGroup;
}

/**
 * Procedural 3D Miniature Hotel / Skyscraper for Board Brawl
 * Styled with the owner's distinct custom player color and illuminated penthouse
 */
export function create3DHotel(ownerColor = '#ef4444') {
  const hotelGroup = new THREE.Group();
  const baseColor = new THREE.Color(ownerColor);
  const darkColor = baseColor.clone().multiplyScalar(0.7);

  // Multi-tier luxury skyscraper tower in owner's distinct color
  const towerGeom = new THREE.BoxGeometry(1.3, 1.9, 1.0);
  const towerMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.25,
    metalness: 0.4,
  });
  const tower = new THREE.Mesh(towerGeom, towerMat);
  tower.position.y = 0.95;
  tower.castShadow = true;
  hotelGroup.add(tower);

  // Roof Helipad / Penthouse in deeper owner hue
  const roofGeom = new THREE.BoxGeometry(0.9, 0.3, 0.7);
  const roofMat = new THREE.MeshStandardMaterial({
    color: darkColor,
    roughness: 0.25,
    metalness: 0.5,
  });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.y = 2.05;
  hotelGroup.add(roof);

  // Illuminated Penthouse Glow Band
  const glowBandGeom = new THREE.BoxGeometry(1.32, 0.12, 1.02);
  const glowBandMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  const glowBand = new THREE.Mesh(glowBandGeom, glowBandMat);
  glowBand.position.y = 1.7;
  hotelGroup.add(glowBand);

  // Golden Spire Pinnacle
  const spireGeom = new THREE.ConeGeometry(0.12, 0.8, 16);
  const spireMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.2,
  });
  const spire = new THREE.Mesh(spireGeom, spireMat);
  spire.position.y = 2.6;
  hotelGroup.add(spire);

  hotelGroup.scale.set(1.3, 1.3, 1.3);
  return hotelGroup;
}

/**
 * Procedural 3D City Owner Crest Ring / Banner
 */
export function createOwnerCrest(colorHex = '#00f0ff') {
  const crestGroup = new THREE.Group();
  const color = new THREE.Color(colorHex);

  const ringGeom = new THREE.TorusGeometry(1.2, 0.12, 16, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.2,
    metalness: 0.7,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.15;
  crestGroup.add(ring);

  // Floating colored flag gem
  const gemGeom = new THREE.OctahedronGeometry(0.35, 0);
  const gemMat = new THREE.MeshBasicMaterial({ color });
  const gem = new THREE.Mesh(gemGeom, gemMat);
  gem.position.set(0, 0.7, 0);
  crestGroup.add(gem);

  return crestGroup;
}

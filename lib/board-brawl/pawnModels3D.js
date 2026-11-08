import * as THREE from 'three';

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

        // Triangulate quads or triangles
        const tris = isQuad ? [[0, 1, 3], [1, 2, 3]] : [[0, 1, 2]];
        for (const tri of tris) {
          for (const idx of tri) {
            const vi = vIndices[idx];
            positions.push(vertices[vi * 3], vertices[vi * 3 + 1], vertices[vi * 3 + 2]);
            if (uvIndices && uvs.length) {
              const uvi = uvIndices[idx];
              outUvs.push(uvs[uvi * 2], uvs[uvi * 2 + 1]);
            }
            if (normIndices && normals.length) {
              const ni = normIndices[idx];
              outNormals.push(normals[ni * 3], normals[ni * 3 + 1], normals[ni * 3 + 2]);
            }
          }
        }
      }

      const bufferGeo = new THREE.BufferGeometry();
      bufferGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      if (outUvs.length) bufferGeo.setAttribute('uv', new THREE.Float32BufferAttribute(outUvs, 2));
      if (outNormals.length) bufferGeo.setAttribute('normal', new THREE.Float32BufferAttribute(outNormals, 3));
      else bufferGeo.computeVertexNormals();

      geoMap.set(g.uuid, bufferGeo);
    }
  }

  function buildObject(objDef) {
    if (!objDef) return new THREE.Group();
    let obj;
    if (objDef.geometry && geoMap.has(objDef.geometry)) {
      const mat = new THREE.MeshStandardMaterial({
        color: defaultColor,
        roughness: 0.35,
        metalness: 0.25,
      });
      obj = new THREE.Mesh(geoMap.get(objDef.geometry), mat);
      obj.castShadow = true;
      obj.receiveShadow = true;
    } else {
      obj = new THREE.Group();
    }
    if (objDef.name) obj.name = objDef.name;
    if (objDef.matrix) {
      obj.matrix.fromArray(objDef.matrix);
      obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
    }
    if (objDef.children) {
      for (const child of objDef.children) {
        obj.add(buildObject(child));
      }
    }
    return obj;
  }

  return buildObject(json.object);
}

/**
 * Creates sculpted 3D procedural pawns for the 10 tycoon tokens:
 * hat, robot, car, yacht, rocket, duck, diamond, crown, brawler, mystic
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
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16), goldMat);
      antenna.position.y = 2.7;
      tokenGroup.add(body, head, eye1, eye2, antenna);
      break;
    }

    case 'car': {
      // Race Car
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.6), playerMat);
      chassis.position.y = 0.4;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 1.2), chromeMat);
      cabin.position.set(0, 0.85, -0.1);
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 0.4), goldMat);
      spoiler.position.set(0, 0.9, 1.1);
      // Wheels
      const wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
      for (const [wx, wz] of [[-0.75, 0.75], [0.75, 0.75], [-0.75, -0.75], [0.75, -0.75]]) {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.3, wz);
        tokenGroup.add(wheel);
      }
      tokenGroup.add(chassis, cabin, spoiler);
      break;
    }

    case 'yacht': {
      // Luxury Superyacht
      const hullGeom = new THREE.ConeGeometry(1.1, 2.8, 4);
      hullGeom.rotateX(Math.PI / 2);
      hullGeom.scale(1, 0.5, 1);
      const hull = new THREE.Mesh(hullGeom, chromeMat);
      hull.position.y = 0.35;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 1.5), playerMat);
      deck.position.set(0, 0.7, 0.1);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 16), goldMat);
      mast.position.set(0, 1.5, -0.2);
      tokenGroup.add(hull, deck, mast);
      break;
    }

    case 'rocket': {
      // Retro-Future Space Rocket
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 2.0, 32), chromeMat);
      body.position.y = 1.2;
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 32), playerMat);
      nose.position.y = 2.65;
      // 4 stabilizing fins
      const finGeom = new THREE.BoxGeometry(0.1, 0.6, 0.5);
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
        const fin = new THREE.Mesh(finGeom, goldMat);
        fin.position.set(Math.cos(angle) * 0.65, 0.5, Math.sin(angle) * 0.65);
        fin.rotation.y = angle;
        tokenGroup.add(fin);
      }
      tokenGroup.add(body, nose);
      break;
    }

    case 'duck': {
      // Golden Duck
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 16), goldMat);
      body.position.y = 0.85;
      body.scale.set(1, 0.8, 1.2);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16), goldMat);
      head.position.set(0, 1.6, -0.4);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 }));
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 1.5, -0.9);
      tokenGroup.add(body, head, beak);
      break;
    }

    case 'diamond': {
      // Sparkling Octahedral Gemstone
      const gemGeom = new THREE.OctahedronGeometry(1.2, 0);
      const gemMat = new THREE.MeshPhysicalMaterial({
        color: colorNum,
        roughness: 0.05,
        transmission: 0.6,
        thickness: 1.2,
        metalness: 0.1,
        reflectivity: 0.9,
      });
      const gem = new THREE.Mesh(gemGeom, gemMat);
      gem.position.y = 1.3;
      tokenGroup.add(gem);
      break;
    }

    case 'crown': {
      // Royal Sovereign Crown
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.4, 32), goldMat);
      ring.position.y = 0.3;
      // 5 Crown Points
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 16), goldMat);
        spike.position.set(Math.sin(angle) * 0.9, 0.85, Math.cos(angle) * 0.9);
        const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), playerMat);
        jewel.position.set(Math.sin(angle) * 0.9, 1.35, Math.cos(angle) * 0.9);
        tokenGroup.add(spike, jewel);
      }
      tokenGroup.add(ring);
      break;
    }

    case 'brawler': {
      // Boxing Glove / Heavy Punch
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
 * Generates crisp 256x256 casino dice face textures (1-6) using HTML5 Canvas.
 */
export function generateDiceMaterials() {
  const materials = [];

  const pipLayouts = {
    1: [[0.5, 0.5]],
    2: [[0.28, 0.28], [0.72, 0.72]],
    3: [[0.26, 0.26], [0.5, 0.5], [0.74, 0.74]],
    4: [[0.28, 0.28], [0.28, 0.72], [0.72, 0.28], [0.72, 0.72]],
    5: [[0.26, 0.26], [0.26, 0.74], [0.5, 0.5], [0.74, 0.26], [0.74, 0.74]],
    6: [[0.28, 0.25], [0.28, 0.5], [0.28, 0.75], [0.72, 0.25], [0.72, 0.5], [0.72, 0.75]],
  };

  // Cube sides index order: 0: +X (1), 1: -X (2), 2: +Y (3), 3: -Y (4), 4: +Z (5), 5: -Z (6)
  for (let faceNum = 1; faceNum <= 6; faceNum++) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Ivory/white dice body with soft inset bevel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle edge shading
    const grad = ctx.createRadialGradient(128, 128, 90, 128, 128, 140);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.14)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Border stroke
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 250, 250);

    // Render pips
    const pips = pipLayouts[faceNum] || pipLayouts[1];
    const pipColor = faceNum === 1 ? '#ef4444' : '#111827';
    const radius = faceNum === 1 ? 26 : 18;

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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;

    materials.push(
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.18,
        metalness: 0.08,
      })
    );
  }

  return materials;
}

/**
 * Procedural 3D Miniature Green House for Board Brawl property developments
 */
export function create3DHouse() {
  const houseGroup = new THREE.Group();
  
  // Base walls
  const wallGeom = new THREE.BoxGeometry(1.1, 0.85, 0.9);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e, // vibrant emerald green
    roughness: 0.35,
    metalness: 0.15,
  });
  const walls = new THREE.Mesh(wallGeom, wallMat);
  walls.position.y = 0.425;
  walls.castShadow = true;
  walls.receiveShadow = true;
  houseGroup.add(walls);

  // Pitched gable roof
  const roofGeom = new THREE.ConeGeometry(0.85, 0.5, 4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // dark forest green
    roughness: 0.3,
    metalness: 0.2,
  });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.85 + 0.22;
  roof.castShadow = true;
  houseGroup.add(roof);

  // Chimney
  const chimneyGeom = new THREE.BoxGeometry(0.18, 0.35, 0.18);
  const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });
  const chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
  chimney.position.set(0.25, 1.05, 0.15);
  chimney.castShadow = true;
  houseGroup.add(chimney);

  houseGroup.scale.set(0.85, 0.85, 0.85);
  return houseGroup;
}

/**
 * Procedural 3D Red Luxury Hotel / Skyscraper
 */
export function create3DHotel() {
  const hotelGroup = new THREE.Group();

  // Tier 1 Base Tower
  const tier1Geom = new THREE.BoxGeometry(1.8, 1.5, 1.3);
  const hotelMat = new THREE.MeshStandardMaterial({
    color: 0xef4444, // bold crimson red
    roughness: 0.3,
    metalness: 0.25,
  });
  const tier1 = new THREE.Mesh(tier1Geom, hotelMat);
  tier1.position.y = 0.75;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  hotelGroup.add(tier1);

  // Tier 2 Penthouse
  const tier2Geom = new THREE.BoxGeometry(1.3, 0.8, 0.95);
  const tier2Mat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // dark ruby
    roughness: 0.25,
    metalness: 0.4,
  });
  const tier2 = new THREE.Mesh(tier2Geom, tier2Mat);
  tier2.position.y = 1.5 + 0.4;
  tier2.castShadow = true;
  hotelGroup.add(tier2);

  // Golden Crown Spire
  const spireGeom = new THREE.CylinderGeometry(0.08, 0.25, 0.7, 16);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // gold
    roughness: 0.2,
    metalness: 0.9,
  });
  const spire = new THREE.Mesh(spireGeom, goldMat);
  spire.position.y = 2.3 + 0.35;
  spire.castShadow = true;
  hotelGroup.add(spire);

  hotelGroup.scale.set(0.9, 0.9, 0.9);
  return hotelGroup;
}

/**
 * Circular 3D Owner Crest Badge on Property Tiles
 */
export function createOwnerCrest(colorHex = '#00f0ff') {
  const crestGroup = new THREE.Group();
  const discGeom = new THREE.CylinderGeometry(0.9, 0.9, 0.08, 24);
  const discMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.3,
    metalness: 0.6,
  });
  const disc = new THREE.Mesh(discGeom, discMat);
  disc.position.y = 0.04;
  disc.receiveShadow = true;
  crestGroup.add(disc);

  const ringGeom = new THREE.TorusGeometry(0.95, 0.06, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  crestGroup.add(ring);

  return crestGroup;
}
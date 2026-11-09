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
 * 3D Humanoid Avatar: Lord Quackers (The Golden Duck)
 * Sculpted based on the generated character portrait:
 * - Flamboyant golden humanoid aristocrat in an opulent gold baroque tuxedo
 * - Tailored dark pinstripe trousers & polished buckle shoes
 * - Double-breasted gold jacket with velvet contrast lapels & tailcoat
 * - Ruffled white/gold silk cravat with a faceted ruby broach
 * - Sculpted aristocratic avian head with slicked-back golden feather plumage
 * - Arrogant smirk beak, piercing amber eyes, and a dangling gold monocle
 * - Left hand leaning on an ebony cane with golden duck-head ruby pommel
 * - Right hand gesturing upward with TWO TUMBLING 3D GOLDEN DICE hovering in mid-air
 * - Orbiting golden sparkles & animated breathing/head tilt/hop mechanics
 */
export function buildLordQuackersAvatar(colorNum, goldMat, chromeMat, playerMat, pawnGroup) {
  const avatarGroup = new THREE.Group();

  // Materials
  const goldSuitMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.22,
    metalness: 0.88,
  });
  const velvetTuxMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.75,
    metalness: 0.15,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
  });
  const cravatMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.3,
    metalness: 0.6,
  });
  const rubyMat = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    roughness: 0.1,
    metalness: 0.2,
    transmission: 0.7,
    thickness: 0.5,
  });
  const duckSkinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.35,
    metalness: 0.5,
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.25,
    metalness: 0.45,
  });
  const amberEyeMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.1,
    emissive: 0xd97706,
    emissiveIntensity: 0.7,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  const goldDiceMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.12,
    metalness: 0.95,
  });
  const pipMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });

  // 1. Lower Body (Legs & Shoes)
  const legsGroup = new THREE.Group();

  const shoeGeom = new THREE.BoxGeometry(0.24, 0.18, 0.52);
  const buckleGeom = new THREE.BoxGeometry(0.12, 0.08, 0.06);

  const leftShoe = new THREE.Mesh(shoeGeom, velvetTuxMat);
  leftShoe.position.set(-0.32, 0.09, 0.06);
  const leftBuckle = new THREE.Mesh(buckleGeom, goldSuitMat);
  leftBuckle.position.set(-0.32, 0.18, 0.22);

  const rightShoe = new THREE.Mesh(shoeGeom, velvetTuxMat);
  rightShoe.position.set(0.32, 0.09, 0.06);
  const rightBuckle = new THREE.Mesh(buckleGeom, goldSuitMat);
  rightBuckle.position.set(0.32, 0.18, 0.22);

  const legGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.85, 16);
  const stripeGeom = new THREE.BoxGeometry(0.04, 0.85, 0.04);

  const leftLeg = new THREE.Mesh(legGeom, velvetTuxMat);
  leftLeg.position.set(-0.32, 0.58, 0);
  const leftStripe = new THREE.Mesh(stripeGeom, goldSuitMat);
  leftStripe.position.set(-0.46, 0.58, 0);

  const rightLeg = new THREE.Mesh(legGeom, velvetTuxMat);
  rightLeg.position.set(0.32, 0.58, 0);
  const rightStripe = new THREE.Mesh(stripeGeom, goldSuitMat);
  rightStripe.position.set(0.46, 0.58, 0);

  legsGroup.add(leftShoe, leftBuckle, rightShoe, rightBuckle, leftLeg, leftStripe, rightLeg, rightStripe);
  avatarGroup.add(legsGroup);

  // 2. Torso & Upper Body
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.0;

  // Waistcoat / Belt
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.40, 0.25, 20), goldSuitMat);
  waist.position.y = 0.12;

  // Gold Baroque Tuxedo Jacket Core
  const jacketCore = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.44, 0.85, 20), goldSuitMat);
  jacketCore.position.y = 0.62;
  jacketCore.scale.set(1.15, 1.0, 0.85);

  // Black Velvet Contrast Peaked Lapels
  const lapelGeom = new THREE.BoxGeometry(0.16, 0.65, 0.08);
  const leftLapel = new THREE.Mesh(lapelGeom, velvetTuxMat);
  leftLapel.position.set(-0.24, 0.65, 0.36);
  leftLapel.rotation.set(0.08, 0.2, -0.22);

  const rightLapel = new THREE.Mesh(lapelGeom, velvetTuxMat);
  rightLapel.position.set(0.24, 0.65, 0.36);
  rightLapel.rotation.set(0.08, -0.2, 0.22);

  // Inner White Shirt & Ruffled Cravat (Ascot)
  const shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.06), shirtMat);
  shirtV.position.set(0, 0.72, 0.33);

  // Layered Silk Cravat ruffles
  const cravat1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), cravatMat);
  cravat1.scale.set(1.4, 0.6, 0.8);
  cravat1.position.set(0, 0.78, 0.37);

  const cravat2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), cravatMat);
  cravat2.scale.set(1.2, 0.5, 0.7);
  cravat2.position.set(0, 0.65, 0.38);

  // Ruby Gem Tie Broach
  const rubyBroach = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), rubyMat);
  rubyBroach.position.set(0, 0.86, 0.39);

  // Double-breasted Gold Buttons
  for (let b = 0; b < 3; b++) {
    const btnL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), goldSuitMat);
    btnL.position.set(-0.14, 0.32 + b * 0.14, 0.38);
    const btnR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), goldSuitMat);
    btnR.position.set(0.14, 0.32 + b * 0.14, 0.38);
    torsoGroup.add(btnL, btnR);
  }

  // Tailcoat tails draping behind
  const tailGeom = new THREE.BoxGeometry(0.22, 0.7, 0.05);
  const coatTailLeft = new THREE.Mesh(tailGeom, goldSuitMat);
  coatTailLeft.position.set(-0.16, -0.15, -0.34);
  coatTailLeft.rotation.set(0.15, 0, 0.08);

  const coatTailRight = new THREE.Mesh(tailGeom, goldSuitMat);
  coatTailRight.position.set(0.16, -0.15, -0.34);
  coatTailRight.rotation.set(0.15, 0, -0.08);

  // 3D Medallion on Chest displaying the generated avatar portrait
  const cameoFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24), goldSuitMat);
  cameoFrame.rotation.x = Math.PI / 2;
  cameoFrame.position.set(0, 0.46, 0.40);

  const cameoMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.15, 24),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.7 })
  );
  cameoMesh.position.set(0, 0, 0.018);
  cameoFrame.add(cameoMesh);

  if (typeof window !== 'undefined') {
    const loader = new THREE.TextureLoader();
    loader.load('/avatars/duck.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace || 'srgb';
      cameoMesh.material = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.25,
        metalness: 0.1,
      });
    });
  }

  torsoGroup.add(
    waist,
    jacketCore,
    leftLapel,
    rightLapel,
    shirtV,
    cravat1,
    cravat2,
    rubyBroach,
    coatTailLeft,
    coatTailRight,
    cameoFrame
  );

  // 3. Left Arm & Aristocratic Ebony Walking Cane
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.55, 0.95, 0);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), goldSuitMat);
  const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.5, 16), goldSuitMat);
  upperArmL.position.set(-0.1, -0.22, 0);
  upperArmL.rotation.z = -0.25;

  const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.45, 16), goldSuitMat);
  forearmL.position.set(-0.16, -0.55, 0.12);
  forearmL.rotation.x = 0.45;

  const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), shirtMat);
  cuffL.position.set(-0.16, -0.74, 0.22);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), duckSkinMat);
  handL.position.set(-0.16, -0.82, 0.26);

  // Ebony & Gold Walking Cane with Ruby Duck Head Handle
  const caneGroup = new THREE.Group();
  caneGroup.position.set(-0.18, -0.80, 0.26);

  const caneShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.025, 1.35, 16),
    velvetTuxMat
  );
  caneShaft.position.y = -0.62;

  const caneFerrule = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.03, 0.12, 16),
    goldSuitMat
  );
  caneFerrule.position.y = -1.25;

  const canePommel = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    goldSuitMat
  );
  canePommel.position.y = 0.05;

  const caneRuby = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 16, 16),
    rubyMat
  );
  caneRuby.position.y = 0.11;

  caneGroup.add(caneShaft, caneFerrule, canePommel, caneRuby);
  leftArmGroup.add(shoulderL, upperArmL, forearmL, cuffL, handL, caneGroup);
  torsoGroup.add(leftArmGroup);

  // 4. Right Arm & Levitating Tumbling Golden Dice
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.55, 0.95, 0);

  const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), goldSuitMat);
  const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.45, 16), goldSuitMat);
  upperArmR.position.set(0.12, -0.18, 0.1);
  upperArmR.rotation.set(0.4, 0, 0.35);

  const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.48, 16), goldSuitMat);
  forearmR.position.set(0.24, -0.15, 0.38);
  forearmR.rotation.set(1.3, 0, -0.2);

  const cuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), shirtMat);
  cuffR.position.set(0.26, -0.05, 0.62);

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), duckSkinMat);
  handR.position.set(0.28, 0.02, 0.72);
  handR.scale.set(1.2, 0.6, 1.1); // Open palm facing up

  // Helper function to build a 3D Die with inset ruby pips
  function createMiniDie(size) {
    const die = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), goldDiceMat);
    box.castShadow = true;
    die.add(box);

    const half = size * 0.5 + 0.005;
    const pipRadius = size * 0.09;
    const pipGeom = new THREE.SphereGeometry(pipRadius, 8, 8);

    const addPip = (x, y, z) => {
      const p = new THREE.Mesh(pipGeom, pipMat);
      p.position.set(x, y, z);
      die.add(p);
    };

    // 1 Pip on +Z face
    addPip(0, 0, half);

    // 6 Pips on -Z face
    const d = size * 0.28;
    addPip(-d, d, -half); addPip(-d, 0, -half); addPip(-d, -d, -half);
    addPip(d, d, -half);  addPip(d, 0, -half);  addPip(d, -d, -half);

    // 2 Pips on +X face
    addPip(half, d, d);   addPip(half, -d, -d);

    // 5 Pips on -X face
    addPip(-half, d, d);  addPip(-half, -d, d);
    addPip(-half, d, -d); addPip(-half, -d, -d);
    addPip(-half, 0, 0);

    // 3 Pips on +Y face
    addPip(d, half, d);   addPip(0, half, 0);   addPip(-d, half, -d);

    // 4 Pips on -Y face
    addPip(d, -half, d);  addPip(d, -half, -d);
    addPip(-d, -half, d); addPip(-d, -half, -d);

    return die;
  }

  // Floating Dice Group hovering in mid-air above right palm!
  const floatingDiceGroup = new THREE.Group();
  floatingDiceGroup.position.set(0.28, 0.25, 0.72);

  const die1 = createMiniDie(0.22);
  die1.position.set(-0.06, 0.05, -0.04);

  const die2 = createMiniDie(0.20);
  die2.position.set(0.12, 0.22, 0.06);

  // Subtle magical gold halo/light above palm
  const diceGlow = new THREE.PointLight(0xfbbf24, 1.2, 3.5);
  diceGlow.position.set(0, 0.15, 0);

  floatingDiceGroup.add(die1, die2, diceGlow);
  rightArmGroup.add(shoulderR, upperArmR, forearmR, cuffR, handR, floatingDiceGroup);
  torsoGroup.add(rightArmGroup);

  // 5. Aristocratic Avian-Humanoid Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.15, 0.05);

  // High Stiff Collar
  const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.22), shirtMat);
  collarL.position.set(-0.24, 0.06, 0.24);
  collarL.rotation.set(-0.15, 0.3, -0.2);

  const collarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.22), shirtMat);
  collarR.position.set(0.24, 0.06, 0.24);
  collarR.rotation.set(-0.15, -0.3, 0.2);

  // Head Skull (Gold skin tone hybrid)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), duckSkinMat);
  skull.position.set(0, 0.22, 0);
  skull.scale.set(0.92, 1.05, 0.95);

  // Sharp Avian Jawline & Golden Smirk Beak
  const upperBeakGeom = new THREE.ConeGeometry(0.18, 0.46, 16);
  const upperBeak = new THREE.Mesh(upperBeakGeom, beakMat);
  upperBeak.scale.set(1.45, 0.55, 1.0);
  upperBeak.rotation.set(-1.45, 0, 0.1);
  upperBeak.position.set(0.02, 0.12, 0.42);

  const lowerBeakGeom = new THREE.ConeGeometry(0.14, 0.38, 16);
  const lowerBeak = new THREE.Mesh(lowerBeakGeom, beakMat);
  lowerBeak.scale.set(1.3, 0.45, 0.9);
  lowerBeak.rotation.set(-1.3, 0, 0.05);
  lowerBeak.position.set(0.01, 0.02, 0.36);

  // Piercing Glowing Amber Duck Eyes
  const eyeGeom = new THREE.SphereGeometry(0.09, 16, 16);
  const pupilGeom = new THREE.SphereGeometry(0.045, 12, 12);

  const leftEye = new THREE.Mesh(eyeGeom, amberEyeMat);
  leftEye.position.set(-0.18, 0.26, 0.30);
  const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
  leftPupil.position.set(-0.19, 0.26, 0.37);

  const rightEye = new THREE.Mesh(eyeGeom, amberEyeMat);
  rightEye.position.set(0.18, 0.26, 0.30);
  const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
  rightPupil.position.set(0.19, 0.26, 0.37);

  // Smug Arched Brows
  const browGeom = new THREE.BoxGeometry(0.15, 0.04, 0.05);
  const leftBrow = new THREE.Mesh(browGeom, goldSuitMat);
  leftBrow.position.set(-0.18, 0.36, 0.32);
  leftBrow.rotation.z = -0.22;

  const rightBrow = new THREE.Mesh(browGeom, goldSuitMat);
  rightBrow.position.set(0.18, 0.38, 0.32);
  rightBrow.rotation.z = 0.35;

  // Slicked-back Golden Plumage Crest
  const plumageGroup = new THREE.Group();
  plumageGroup.position.set(0, 0.42, -0.05);

  const featherSpikes = [
    { scale: [0.12, 0.75, 0.16], rot: [-0.95, 0, 0], pos: [0, 0.08, -0.1] },
    { scale: [0.10, 0.68, 0.14], rot: [-1.15, -0.18, 0], pos: [-0.14, 0.04, -0.08] },
    { scale: [0.10, 0.68, 0.14], rot: [-1.15, 0.18, 0], pos: [0.14, 0.04, -0.08] },
    { scale: [0.08, 0.55, 0.12], rot: [-1.35, -0.25, 0], pos: [-0.22, -0.04, -0.04] },
    { scale: [0.08, 0.55, 0.12], rot: [-1.35, 0.25, 0], pos: [0.22, -0.04, -0.04] },
  ];

  featherSpikes.forEach(({ scale, rot, pos }) => {
    const fMesh = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 8), goldSuitMat);
    fMesh.scale.set(scale[0], scale[1], scale[2]);
    fMesh.rotation.set(rot[0], rot[1], rot[2]);
    fMesh.position.set(pos[0], pos[1], pos[2]);
    plumageGroup.add(fMesh);
  });

  // Dapper Gold Monocle over Right Eye
  const monocleRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.02, 16, 24),
    goldSuitMat
  );
  monocleRing.position.set(0.18, 0.26, 0.36);

  const monocleLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 24),
    new THREE.MeshPhysicalMaterial({
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.2,
      color: 0xffffff,
    })
  );
  monocleLens.position.set(0.18, 0.26, 0.365);

  const monocleChain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.35, 8),
    goldSuitMat
  );
  monocleChain.position.set(0.24, 0.12, 0.34);
  monocleChain.rotation.z = -0.35;

  headGroup.add(
    collarL,
    collarR,
    skull,
    upperBeak,
    lowerBeak,
    leftEye,
    leftPupil,
    rightEye,
    rightPupil,
    leftBrow,
    rightBrow,
    plumageGroup,
    monocleRing,
    monocleLens,
    monocleChain
  );
  torsoGroup.add(headGroup);

  // 6. Floating Golden Sparkles Orbiting Around Avatar
  const sparklesGroup = new THREE.Group();
  const sparkles = [];
  const sparkleGeom = new THREE.OctahedronGeometry(0.065, 0);

  for (let s = 0; s < 6; s++) {
    const angle = (s / 6) * Math.PI * 2;
    const radius = 0.9 + (s % 2) * 0.25;
    const spMesh = new THREE.Mesh(sparkleGeom, goldSuitMat);
    const baseY = 0.8 + (s % 3) * 0.45;
    spMesh.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
    spMesh.userData = { baseY, angle, radius };
    sparklesGroup.add(spMesh);
    sparkles.push(spMesh);
  }
  avatarGroup.add(sparklesGroup);

  avatarGroup.add(torsoGroup);

  // Attach dynamic animation loop update hook to pawnGroup!
  if (pawnGroup) {
    pawnGroup.userData.update = (delta, elapsed, isMoving) => {
      // 1. Idle Torso Breathing & Sway
      torsoGroup.position.y = 1.0 + Math.sin(elapsed * 2.8) * 0.025;
      torsoGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.07;

      // 2. Avian Head Tilts & Bird Inquisitiveness
      headGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.12;
      headGroup.rotation.z = Math.sin(elapsed * 1.8) * 0.08;
      headGroup.rotation.x = -0.05 + Math.cos(elapsed * 0.9) * 0.04;

      // 3. Levitating Golden Dice Tumbling in Mid-Air!
      const diceSpeed = isMoving ? 2.4 : 1.0;
      die1.position.y = 0.05 + Math.sin(elapsed * 4.5) * 0.06;
      die1.rotation.x += delta * 3.8 * diceSpeed;
      die1.rotation.y += delta * 4.6 * diceSpeed;
      die1.rotation.z += delta * 2.5 * diceSpeed;

      die2.position.y = 0.22 + Math.cos(elapsed * 3.8) * 0.07;
      die2.rotation.x -= delta * 3.2 * diceSpeed;
      die2.rotation.y += delta * 5.2 * diceSpeed;
      die2.rotation.z += delta * 4.1 * diceSpeed;

      // 4. Orbiting Golden Sparkles
      sparklesGroup.rotation.y += delta * (isMoving ? 2.8 : 1.1);
      sparkles.forEach((sp, i) => {
        sp.position.y = sp.userData.baseY + Math.sin(elapsed * 3.2 + i * 1.2) * 0.08;
        sp.rotation.x += delta * 2.5;
        sp.rotation.y += delta * 3.5;
      });

      // 5. Hop / Sprint Dynamics
      if (isMoving) {
        avatarGroup.rotation.x = THREE.MathUtils.lerp(avatarGroup.rotation.x, 0.22, 0.18);
        coatTailLeft.rotation.x = THREE.MathUtils.lerp(coatTailLeft.rotation.x, -0.42, 0.2);
        coatTailRight.rotation.x = THREE.MathUtils.lerp(coatTailRight.rotation.x, -0.42, 0.2);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, -0.3, 0.18);
      } else {
        avatarGroup.rotation.x = THREE.MathUtils.lerp(avatarGroup.rotation.x, 0, 0.15);
        coatTailLeft.rotation.x = THREE.MathUtils.lerp(coatTailLeft.rotation.x, 0.15, 0.15);
        coatTailRight.rotation.x = THREE.MathUtils.lerp(coatTailRight.rotation.x, 0.15, 0.15);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0, 0.15);
      }
    };
  }

  // Feathers flurry particle group (Lord Quackers cash payment distress reaction)
  const feathersGroup = new THREE.Group();
  feathersGroup.position.set(0, 1.2, 0);
  feathersGroup.visible = false;
  const feathers = [];
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.35,
    metalness: 0.4,
  });
  for (let i = 0; i < 12; i++) {
    const fMesh = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 4), featherMat);
    const ang = (i / 12) * Math.PI * 2;
    fMesh.userData = {
      baseOffset: new THREE.Vector3(Math.cos(ang) * 0.4, (Math.random() - 0.5) * 0.3, Math.sin(ang) * 0.4),
      dir: new THREE.Vector3(Math.cos(ang) * 1.5, 0.8 + Math.random() * 1.2, Math.sin(ang) * 1.5),
    };
    feathersGroup.add(fMesh);
    feathers.push(fMesh);
  }
  avatarGroup.add(feathersGroup);

  if (pawnGroup) {
    pawnGroup.userData.parts = {
      rightArmGroup,
      leftArmGroup,
      torsoGroup,
      headGroup,
      feathersGroup,
      feathers,
    };
  }

  avatarGroup.scale.set(1.88, 1.88, 1.88);
  return avatarGroup;
}

/**
 * 3D Procedural Sculpt for Rudolf - The Smirking Kitten
 */
export function buildRudolfAvatar(colorNum, goldMat, chromeMat, playerMat, pawnGroup) {
  const avatarGroup = new THREE.Group();

  // Kitten Materials
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Warm ginger fur
    roughness: 0.65,
    metalness: 0.1,
  });
  const creamFurMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7, // Warm cream cheeks & chest
    roughness: 0.6,
    metalness: 0.05,
  });
  const innerEarMat = new THREE.MeshStandardMaterial({
    color: 0xfca5a5, // Rose pink inner ear
    roughness: 0.5,
    metalness: 0.05,
  });
  const emeraldEyeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Glowing emerald green cat eyes
    roughness: 0.1,
    metalness: 0.5,
    emissive: 0x059669,
    emissiveIntensity: 0.6,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.4,
    metalness: 0.1,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.4,
    metalness: 0.3,
  });

  // 1. Kitten Lower Body & Sitting Paws
  const bodyGroup = new THREE.Group();
  
  // Chunky pear-shaped body
  const bodyGeom = new THREE.SphereGeometry(0.75, 24, 20);
  const body = new THREE.Mesh(bodyGeom, furMat);
  body.scale.set(0.95, 1.25, 0.9);
  body.position.y = 0.85;

  // Cream fur chest bib
  const chestBib = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 16), creamFurMat);
  chestBib.scale.set(0.85, 1.1, 0.4);
  chestBib.position.set(0, 0.85, 0.5);

  // Front Paws
  const pawGeom = new THREE.SphereGeometry(0.2, 16, 12);
  pawGeom.scale(1.0, 0.7, 1.4);
  const leftPaw = new THREE.Mesh(pawGeom, creamFurMat);
  leftPaw.position.set(-0.28, 0.14, 0.48);
  const rightPaw = new THREE.Mesh(pawGeom, creamFurMat);
  rightPaw.position.set(0.28, 0.14, 0.48);

  // Curled Kitten Tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.35, -0.6),
    new THREE.Vector3(0.25, 0.6, -0.85),
    new THREE.Vector3(0.45, 1.1, -0.75),
    new THREE.Vector3(0.35, 1.45, -0.55),
  ]);
  const tailGeom = new THREE.TubeGeometry(tailCurve, 20, 0.11, 12, false);
  const tail = new THREE.Mesh(tailGeom, furMat);

  bodyGroup.add(body, chestBib, leftPaw, rightPaw, tail);
  avatarGroup.add(bodyGroup);

  // 2. Collar & Gold Coin Medallion
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.08, 12, 32), collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.48;

  const bellRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 12, 16), goldMat);
  bellRing.position.set(0, 1.4, 0.54);

  const coinMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24), goldMat);
  coinMedallion.rotation.x = Math.PI / 2;
  coinMedallion.position.set(0, 1.25, 0.56);
  avatarGroup.add(collar, bellRing, coinMedallion);

  // 3. Head & Distinctive Smirking Face
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.95, 0.05);

  // Round head with cute fluffy cheeks
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 24), furMat);
  head.scale.set(1.15, 1.0, 1.05);

  const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), creamFurMat);
  leftCheek.position.set(-0.35, -0.15, 0.38);
  const rightCheek = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), creamFurMat);
  rightCheek.position.set(0.35, -0.15, 0.38);

  // Pointed Kitten Ears
  const earGeom = new THREE.ConeGeometry(0.32, 0.65, 16);
  const leftEar = new THREE.Mesh(earGeom, furMat);
  leftEar.position.set(-0.46, 0.62, 0);
  leftEar.rotation.set(-0.1, 0, 0.45);

  const leftInnerEar = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 16), innerEarMat);
  leftInnerEar.position.set(-0.45, 0.6, 0.08);
  leftInnerEar.rotation.set(-0.1, 0, 0.45);

  // Golden Piercing/Ear-ring on left ear
  const earRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 12, 24), goldMat);
  earRing.position.set(-0.62, 0.76, 0.05);
  earRing.rotation.y = Math.PI / 2;

  const rightEar = new THREE.Mesh(earGeom, furMat);
  rightEar.position.set(0.46, 0.62, 0);
  rightEar.rotation.set(-0.1, 0, -0.45);

  const rightInnerEar = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 16), innerEarMat);
  rightInnerEar.position.set(0.45, 0.6, 0.08);
  rightInnerEar.rotation.set(-0.1, 0, -0.45);

  // Emerald Eyes with Cat Slit Pupils
  const eyeGeom = new THREE.SphereGeometry(0.18, 16, 16);
  const pupilGeom = new THREE.BoxGeometry(0.05, 0.24, 0.08);

  const leftEye = new THREE.Mesh(eyeGeom, emeraldEyeMat);
  leftEye.position.set(-0.28, 0.08, 0.62);
  const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
  leftPupil.position.set(-0.28, 0.08, 0.72);

  const rightEye = new THREE.Mesh(eyeGeom, emeraldEyeMat);
  rightEye.position.set(0.28, 0.08, 0.62);
  const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
  rightPupil.position.set(0.28, 0.08, 0.72);

  // Tiny Cute Pink Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), noseMat);
  nose.scale.set(1.2, 0.8, 0.9);
  nose.position.set(0, -0.05, 0.76);

  // THE SIGNATURE SMIRK
  // Asymmetric tilted curve curling upward on the right
  const smirkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, -0.22, 0.68),
    new THREE.Vector3(-0.05, -0.18, 0.73),
    new THREE.Vector3(0.08, -0.15, 0.72),
    new THREE.Vector3(0.24, -0.08, 0.65), // Curled smirk corner!
  ]);
  const smirkGeom = new THREE.TubeGeometry(smirkCurve, 16, 0.03, 8, false);
  const smirkMesh = new THREE.Mesh(smirkGeom, new THREE.MeshBasicMaterial({ color: 0x451a03 }));

  // Whiskers (thin white/cream lines)
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), whiskerMat);
  w1.rotation.z = Math.PI / 2 + 0.15;
  w1.position.set(-0.55, -0.12, 0.6);

  const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), whiskerMat);
  w2.rotation.z = Math.PI / 2 - 0.1;
  w2.position.set(-0.55, -0.2, 0.58);

  const w3 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), whiskerMat);
  w3.rotation.z = Math.PI / 2 - 0.18;
  w3.position.set(0.55, -0.08, 0.6);

  const w4 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), whiskerMat);
  w4.rotation.z = Math.PI / 2 + 0.08;
  w4.position.set(0.55, -0.18, 0.58);

  headGroup.add(
    head, leftCheek, rightCheek,
    leftEar, leftInnerEar, earRing,
    rightEar, rightInnerEar,
    leftEye, leftPupil, rightEye, rightPupil,
    nose, smirkMesh, w1, w2, w3, w4
  );
  avatarGroup.add(headGroup);

  // Angry claw swipe motion group (Rudolf cash payment distress reaction)
  const clawsGroup = new THREE.Group();
  clawsGroup.position.set(0, 0.8, 0.5);
  clawsGroup.visible = false;
  const clawMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 3; i++) {
    const slash = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.08), clawMat);
    slash.position.set((i - 1) * 0.16, (i - 1) * 0.08, 0);
    slash.rotation.z = -0.35;
    clawsGroup.add(slash);
  }
  avatarGroup.add(clawsGroup);

  if (pawnGroup) {
    pawnGroup.userData.parts = {
      headGroup,
      leftEar,
      rightEar,
      tail,
      bodyGroup,
      clawsGroup,
    };
  }

  avatarGroup.scale.set(1.88, 1.88, 1.88);
  return avatarGroup;
}

/**
 * 3D Procedural Sculpt for Sir Coo-Coo - The Pouty Lips Pigeon
 * Faithfully inspired by the iconic meme photograph
 */
export function buildPigeonAvatar(colorNum, goldMat, chromeMat, playerMat, pawnGroup) {
  const avatarGroup = new THREE.Group();

  // Pigeon Palette Materials (inspired directly by user photo)
  const slatePigeonMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate blue-gray feather body
    roughness: 0.65,
    metalness: 0.15,
  });
  const darkCollarMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Deep indigo/black collar ring
    roughness: 0.5,
    metalness: 0.3,
  });
  const iridescentSheenMat = new THREE.MeshStandardMaterial({
    color: 0x0d9488, // Emerald/petrol iridescent sheen
    roughness: 0.25,
    metalness: 0.75,
  });
  const cereMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Light gray nostril bridge
    roughness: 0.45,
    metalness: 0.1,
  });
  const eyeScleraMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.1,
  });
  const eyeIrisMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // Orange/amber pigeon iris
    roughness: 0.1,
    metalness: 0.4,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  
  // THE ICONIC LIPS MATERIAL (Plump flesh/coral pink with gentle gloss)
  const lipsMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // Lush rose/coral pink
    roughness: 0.18, // Glossy pout!
    metalness: 0.08,
  });
  const lipCreaseMat = new THREE.MeshBasicMaterial({ color: 0xbe185d });
  const feetMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185, // Coral pigeon feet
    roughness: 0.5,
    metalness: 0.1,
  });

  // 1. Lower Body & Pigeon Feet
  const bodyGroup = new THREE.Group();

  // Coral Pink Pigeon Feet
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12), feetMat);
    leg.position.set(side * 0.32, 0.2, 0);
    const footBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.45), feetMat);
    footBase.position.set(side * 0.32, 0.04, 0.1);
    bodyGroup.add(leg, footBase);
  }

  // Plump Rotund Pigeon Torso
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 24), slatePigeonMat);
  torso.scale.set(1.05, 1.25, 1.15);
  torso.position.set(0, 0.95, -0.05);

  // Iridescent Neck Plumage Ring
  const neckRing = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.45, 24), iridescentSheenMat);
  neckRing.position.set(0, 1.6, 0);

  const darkGorget = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.25, 24), darkCollarMat);
  darkGorget.position.set(0, 1.8, 0);

  // Folded Wings on sides
  const wingGeom = new THREE.BoxGeometry(0.2, 1.1, 0.8);
  const leftWing = new THREE.Mesh(wingGeom, slatePigeonMat);
  leftWing.position.set(-0.85, 1.0, -0.1);
  leftWing.rotation.set(0.1, 0, 0.2);

  const rightWing = new THREE.Mesh(wingGeom, slatePigeonMat);
  rightWing.position.set(0.85, 1.0, -0.1);
  rightWing.rotation.set(0.1, 0, -0.2);

  // Short tail feathers
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.7), darkCollarMat);
  tail.position.set(0, 0.65, -0.85);
  tail.rotation.x = -0.35;

  bodyGroup.add(torso, neckRing, darkGorget, leftWing, rightWing, tail);
  avatarGroup.add(bodyGroup);

  // 2. The Iconic Pigeon Head & Human Lips
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.15, 0.08);

  // Smooth Pigeon Head (oval slate blue dome)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 24), slatePigeonMat);
  head.scale.set(0.95, 1.05, 1.0);

  // Wide Forward-Side Unblinking Eyes
  for (const side of [-1, 1]) {
    const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), slatePigeonMat);
    eyeSocket.position.set(side * 0.48, 0.18, 0.25);
    
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), eyeScleraMat);
    sclera.position.set(side * 0.52, 0.18, 0.28);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeIrisMat);
    iris.position.set(side * 0.58, 0.18, 0.32);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), pupilMat);
    pupil.position.set(side * 0.62, 0.18, 0.34);

    headGroup.add(eyeSocket, sclera, iris, pupil);
  }

  // Cere / Pigeon Beak Base (the soft grey nose bridge above the lips)
  const cere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), cereMat);
  cere.scale.set(1.0, 1.2, 0.9);
  cere.position.set(0, 0.14, 0.62);

  // Twin nostril indents
  const n1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), darkCollarMat);
  n1.position.set(-0.08, 0.12, 0.78);
  const n2 = n1.clone();
  n2.position.x = 0.08;
  headGroup.add(cere, n1, n2);

  // ==============================================================
  // THE LUSCIOUS HUMAN LIPS (EXACT PHOTO RECREATION)
  // ==============================================================
  const lipsGroup = new THREE.Group();
  lipsGroup.position.set(0, -0.16, 0.62);

  // Upper Lip - Cupid's Bow Double Arch
  const upperLeftPillow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), lipsMat);
  upperLeftPillow.scale.set(1.3, 0.6, 0.8);
  upperLeftPillow.position.set(-0.11, 0.04, 0.08);

  const upperRightPillow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), lipsMat);
  upperRightPillow.scale.set(1.3, 0.6, 0.8);
  upperRightPillow.position.set(0.11, 0.04, 0.08);

  const upperLipCenter = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), lipsMat);
  upperLipCenter.scale.set(1.0, 0.65, 0.9);
  upperLipCenter.position.set(0, 0.02, 0.14);

  // Plump Full Bottom Lip Pillow
  const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 16), lipsMat);
  lowerLip.scale.set(1.4, 0.65, 0.95);
  lowerLip.position.set(0, -0.12, 0.12);

  // Central Lip Part / Crease
  const lipCrease = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.12), lipCreaseMat);
  lipCrease.position.set(0, -0.02, 0.15);

  lipsGroup.add(upperLeftPillow, upperRightPillow, upperLipCenter, lowerLip, lipCrease);
  headGroup.add(head, lipsGroup);

  avatarGroup.add(headGroup);

  // Crumbs & coins flurry group (Cantino cash payment distress reaction)
  const crumbsGroup = new THREE.Group();
  crumbsGroup.position.set(0, 1.0, 0);
  crumbsGroup.visible = false;
  const crumbs = [];
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });
  const crumbMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  for (let i = 0; i < 8; i++) {
    const isCoin = i % 2 === 0;
    const mesh = isCoin
      ? new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12), coinMat)
      : new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), crumbMat);
    const ang = (i / 8) * Math.PI * 2;
    mesh.userData = {
      offset: new THREE.Vector3(Math.cos(ang) * 0.35, 0.5 + Math.random() * 0.4, Math.sin(ang) * 0.35),
      speed: 1.2 + Math.random() * 0.8,
    };
    crumbsGroup.add(mesh);
    crumbs.push(mesh);
  }
  avatarGroup.add(crumbsGroup);

  if (pawnGroup) {
    pawnGroup.userData.parts = {
      lipsGroup,
      headGroup,
      leftWing,
      rightWing,
      torso,
      crumbsGroup,
      crumbs,
    };
  }

  avatarGroup.scale.set(1.88, 1.88, 1.88);
  return avatarGroup;
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

  let parts = {};

  switch (tokenId) {
    case 'hat': {
      // Baron Von Cash: Top Hat & Signature Monocle
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.15, 32), chromeMat);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.3, 32), playerMat);
      band.position.y = 0.2;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.85, 1.8, 32), chromeMat);
      crown.position.y = 1.05;

      const monocleGroup = new THREE.Group();
      const monocleRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 16, 24), goldMat);
      const monocleGlass = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshPhysicalMaterial({ color: 0xa5f3fc, transmission: 0.9, roughness: 0.1 }));
      const monocleCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 8), goldMat);
      monocleCord.position.set(0.22, -0.35, 0);
      monocleGroup.add(monocleRing, monocleGlass, monocleCord);
      monocleGroup.position.set(0.5, 0.95, 0.82);
      monocleGroup.rotation.y = 0.25;

      tokenGroup.add(brim, band, crown, monocleGroup);
      parts = { brim, band, crown, monocle: monocleGroup };
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
      parts = { brim, band, cone };
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
      parts = { brim, crown, pack };
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
      parts = { drakeBody, horn1, horn2, wing1, wing2 };
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
      parts = { helm, crescent, blade1, blade2 };
      break;
    }

    case 'robot': {
      // Apex-9: Robot Body & Head with Antenna Electric Spark Particles
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

      const sparkGroup = new THREE.Group();
      sparkGroup.position.set(0, 2.9, 0);
      sparkGroup.visible = false;
      const sparkMeshes = [];
      for (let i = 0; i < 8; i++) {
        const sp = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.09, 0),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00f0ff : 0xff0055 })
        );
        sp.userData = {
          velocity: new THREE.Vector3((Math.random() - 0.5) * 2.2, 0.8 + Math.random() * 1.6, (Math.random() - 0.5) * 2.2)
        };
        sparkGroup.add(sp);
        sparkMeshes.push(sp);
      }

      tokenGroup.add(body, head, eye1, eye2, antenna, sparkGroup);
      parts = { body, head, eye1, eye2, antenna, sparkGroup, sparkMeshes };
      break;
    }

    case 'car': {
      // Axel Nitro: Sports Car with Tire Smoke Puffs
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.2), playerMat);
      chassis.position.y = 0.4;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 1.1), chromeMat);
      cabin.position.set(0, 0.8, -0.15);
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.35), goldMat);
      spoiler.position.set(0, 0.85, 0.9);

      const smokeGroup = new THREE.Group();
      smokeGroup.position.set(0, 0.2, 0.9);
      smokeGroup.visible = false;
      const smokePuffs = [];
      const smokeMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.65,
        roughness: 0.9,
      });
      for (let i = 0; i < 12; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.12, 8, 8), smokeMat.clone());
        puff.userData = {
          baseOffset: new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 0.3, Math.random() * 0.4),
          speed: 0.6 + Math.random() * 0.8
        };
        smokeGroup.add(puff);
        smokePuffs.push(puff);
      }

      tokenGroup.add(chassis, cabin, spoiler, smokeGroup);
      parts = { chassis, cabin, spoiler, smokeGroup, smokePuffs };
      break;
    }

    case 'yacht': {
      // Captain Monaco: Superyacht Hull & Decks with Water Splash Particles
      const hullGeom = new THREE.ConeGeometry(0.9, 2.4, 16);
      const hull = new THREE.Mesh(hullGeom, chromeMat);
      hull.rotation.x = Math.PI / 2;
      hull.scale.set(1.1, 1.0, 0.6);
      hull.position.y = 0.5;
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 1.0), playerMat);
      bridge.position.set(0, 0.9, 0.1);

      const splashGroup = new THREE.Group();
      splashGroup.position.set(0, 0.2, 0);
      splashGroup.visible = false;
      const splashes = [];
      const splashMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        roughness: 0.2,
      });
      for (let i = 0; i < 14; i++) {
        const sp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), splashMat);
        const ang = (i / 14) * Math.PI * 2;
        sp.userData = {
          dir: new THREE.Vector3(Math.cos(ang) * 1.2, 0.8 + Math.random() * 0.8, Math.sin(ang) * 1.6),
        };
        splashGroup.add(sp);
        splashes.push(sp);
      }

      tokenGroup.add(hull, bridge, splashGroup);
      parts = { hull, bridge, splashGroup, splashes };
      break;
    }

    case 'rocket': {
      // Astro Vance: Space Rocket with Sputtering Exhaust Puffs
      const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 1.8, 32), chromeMat);
      fuselage.position.y = 1.1;
      const nosecone = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.0, 32), playerMat);
      nosecone.position.y = 2.45;
      const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.6), goldMat);
      fin1.position.set(0.7, 0.6, 0);
      const fin2 = fin1.clone();
      fin2.position.set(-0.7, 0.6, 0);

      const exhaustGroup = new THREE.Group();
      exhaustGroup.position.set(0, 0.1, 0);
      exhaustGroup.visible = false;
      const exhaustPuffs = [];
      for (let i = 0; i < 10; i++) {
        const isFlame = i % 2 === 0;
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 8, 8),
          new THREE.MeshStandardMaterial({
            color: isFlame ? 0xf97316 : 0x334155,
            emissive: isFlame ? 0xea580c : 0x000000,
            emissiveIntensity: isFlame ? 0.9 : 0,
            transparent: true,
            opacity: 0.8,
          })
        );
        mesh.userData = {
          offset: new THREE.Vector3((Math.random() - 0.5) * 0.6, -Math.random() * 0.8, (Math.random() - 0.5) * 0.6)
        };
        exhaustGroup.add(mesh);
        exhaustPuffs.push(mesh);
      }

      tokenGroup.add(fuselage, nosecone, fin1, fin2, exhaustGroup);
      parts = { fuselage, nosecone, fin1, fin2, exhaustGroup, exhaustPuffs };
      break;
    }

    case 'duck': {
      // Lord Quackers - 3D Humanoid Golden Duck
      const lordQuackers = buildLordQuackersAvatar(colorNum, goldMat, chromeMat, playerMat, pawnGroup);
      tokenGroup.add(lordQuackers);
      break;
    }

    case 'rudolf':
    case 'kitten': {
      // Rudolf - The Smirking Kitten
      const rudolf = buildRudolfAvatar(colorNum, goldMat, chromeMat, playerMat, pawnGroup);
      tokenGroup.add(rudolf);
      break;
    }

    case 'pigeon': {
      // Cantino - The Pouty Lips Pigeon
      const pigeon = buildPigeonAvatar(colorNum, goldMat, chromeMat, playerMat, pawnGroup);
      tokenGroup.add(pigeon);
      break;
    }

    case 'diamond': {
      // Hodl King: Huge Cut Diamond Gem with Shatter Shards
      const gemGeom = new THREE.OctahedronGeometry(1.2, 0);
      const gemMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.05,
        transmission: 0.85,
        thickness: 1.2,
      });
      const gem = new THREE.Mesh(gemGeom, gemMat);
      gem.position.y = 1.3;

      const shardGroup = new THREE.Group();
      shardGroup.position.set(0, 1.3, 0);
      shardGroup.visible = false;
      const shards = [];
      for (let i = 0; i < 12; i++) {
        const shard = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.35, 4),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, roughness: 0.2 })
        );
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        shard.userData = {
          dir: new THREE.Vector3(Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta))
        };
        shardGroup.add(shard);
        shards.push(shard);
      }

      tokenGroup.add(gem, shardGroup);
      parts = { gem, shardGroup, shards };
      break;
    }

    case 'crown': {
      // Queen Victoria: Royal Sovereign Crown with Golden Teardrops
      const circlet = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.45, 32), goldMat);
      circlet.position.y = 0.5;
      const spikes = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 16), goldMat);
        spike.position.set(Math.cos(angle) * 0.95, 1.1, Math.sin(angle) * 0.95);
        tokenGroup.add(spike);
        spikes.push(spike);
      }
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), playerMat);
      jewel.position.y = 1.0;

      const teardropGroup = new THREE.Group();
      teardropGroup.position.set(0, 0.8, 0);
      teardropGroup.visible = false;
      const teardrops = [];
      const tearMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.15 });
      for (let i = 0; i < 10; i++) {
        const tear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 8), tearMat);
        tear.rotation.x = Math.PI; // Inverted point
        const ang = (i / 10) * Math.PI * 2;
        tear.userData = {
          basePos: new THREE.Vector3(Math.cos(ang) * 0.85, 0.2, Math.sin(ang) * 0.85),
          speed: 0.8 + Math.random() * 0.6
        };
        teardropGroup.add(tear);
        teardrops.push(tear);
      }

      tokenGroup.add(circlet, jewel, teardropGroup);
      parts = { circlet, jewel, spikes, teardropGroup, teardrops };
      break;
    }

    case 'brawler': {
      // Knuckles O'Malley: Boxing Glove with Overhead Dizzy Stars
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 16), playerMat);
      glove.scale.set(1.1, 1.3, 1.0);
      glove.position.y = 1.3;
      const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), playerMat);
      thumb.position.set(0.65, 1.2, 0.2);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.5, 32), chromeMat);
      cuff.position.y = 0.5;

      const dizzyStars = new THREE.Group();
      dizzyStars.position.set(0, 2.5, 0);
      dizzyStars.visible = false;
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.9,
        metalness: 0.5,
      });
      for (let i = 0; i < 4; i++) {
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), starMat);
        const ang = (i / 4) * Math.PI * 2;
        star.position.set(Math.cos(ang) * 0.95, 0, Math.sin(ang) * 0.95);
        dizzyStars.add(star);
      }

      tokenGroup.add(glove, thumb, cuff, dizzyStars);
      parts = { glove, thumb, cuff, dizzyStars };
      break;
    }

    case 'mystic':
    default: {
      // Madame Solana: Oracle Crystal Orb & Tripod with Shadowy Wisps
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

      const shadowWisps = new THREE.Group();
      shadowWisps.position.set(0, 1.4, 0);
      shadowWisps.visible = false;
      const wisps = [];
      const wispMat = new THREE.MeshStandardMaterial({
        color: 0x3b0764,
        emissive: 0x581c87,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.65,
      });
      for (let i = 0; i < 10; i++) {
        const w = new THREE.Mesh(new THREE.SphereGeometry(0.16 + Math.random() * 0.08, 8, 8), wispMat);
        const ang = (i / 10) * Math.PI * 2;
        w.userData = {
          offset: new THREE.Vector3(Math.cos(ang) * 0.4, 0, Math.sin(ang) * 0.4),
          speed: 0.7 + Math.random() * 0.5
        };
        shadowWisps.add(w);
        wisps.push(w);
      }

      tokenGroup.add(orb, stand, shadowWisps);
      parts = { orb, stand, shadowWisps, wisps, baseOrbColor: 0xa855f7 };
      break;
    }
  }

  pawnGroup.add(tokenGroup);
  pawnGroup.scale.set(1.85, 1.85, 1.85);

  // Attach 12 Avatar Custom Distress Reaction System
  attachAvatarDistressSystem(pawnGroup, tokenId, tokenGroup, parts);

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
 * Procedural 3D Miniature Villa / Cottage House for Board Brawl
 * Faithfully redesigned to match Business Tour visual reference:
 * - Cute, vibrant, stylized European suburban cottage villa
 * - Clean white/cream stucco walls (#f8fafc) with subtle dark recessed windows and front door geometry
 * - Pitched triangular gable roof in owner's vibrant player color with white overhanging eaves/fascia
 * - Miniature white brick chimney with gold or dark trim on the roof ridge
 * - Mini front sun-awning and entrance stoop facing inward (+Z) toward the street
 * - Clean, miniature architectural toy model look with soft shadows
 */
export function create3DHouse(ownerColor = '#22c55e') {
  const houseGroup = new THREE.Group();
  const baseColor = new THREE.Color(ownerColor);
  const darkRoofColor = baseColor.clone().multiplyScalar(0.92);

  // Material definitions
  const stuccoMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.08,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.15,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: darkRoofColor,
    roughness: 0.3,
    metalness: 0.2,
  });
  // Warm glowing cozy windowpanes
  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.1,
  });
  const doorWoodMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Dark chestnut wood door
    roughness: 0.6,
    metalness: 0.05,
  });
  const awningMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.3,
    metalness: 0.2,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.85,
  });
  // Red brick chimney material
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // Rich red brick
    roughness: 0.8,
    metalness: 0.05,
  });
  // Green plinth foundation so it sits flush on the lawn plot
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.7,
    metalness: 0.05,
  });
  const stoopMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.5,
    metalness: 0.1,
  });

  // Dimensions
  const w = 1.15;
  const h = 0.82;
  const d = 1.05;

  // 1. Lawn Plinth Foundation & Front Stoop
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.06, d + 0.14), plinthMat);
  plinth.position.y = 0.03;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  houseGroup.add(plinth);

  // Front stoop facing inward (+Z) toward the street
  const stoop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.22), stoopMat);
  stoop.position.set(0, 0.025, d / 2 + 0.12);
  stoop.castShadow = true;
  houseGroup.add(stoop);

  // 2. White / Cream Stucco Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stuccoMat);
  walls.position.y = 0.06 + h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  houseGroup.add(walls);

  // 3. Front Door (+Z)
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.54, 0.04), trimMat);
  doorFrame.position.set(0, 0.06 + 0.54 / 2, d / 2 + 0.01);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.48, 0.04), doorWoodMat);
  door.position.set(0, 0.06 + 0.48 / 2, d / 2 + 0.02);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), goldTrimMat);
  knob.position.set(0.09, 0.30, d / 2 + 0.05);
  houseGroup.add(doorFrame, door, knob);

  // 4. Mini Front Sun-Awning facing inward (+Z)
  const awning = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.22), awningMat);
  awning.position.set(0, 0.66, d / 2 + 0.12);
  awning.rotation.x = 0.22;
  awning.castShadow = true;
  const awningTrim = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.025, 0.03), trimMat);
  awningTrim.position.set(0, 0.64, d / 2 + 0.22);
  houseGroup.add(awning, awningTrim);

  // Front window above awning
  const fWin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.03), windowGlassMat);
  fWin.position.set(0, 0.06 + h - 0.16, d / 2 + 0.01);
  const fWinFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.02), trimMat);
  fWinFrame.position.set(0, 0.06 + h - 0.16, d / 2 + 0.005);
  houseGroup.add(fWin, fWinFrame);

  // 5. Side Windows with player-tinted shutters & white sills
  [-1, 1].forEach((side) => {
    const sWin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.32), windowGlassMat);
    sWin.position.set(side * (w / 2 + 0.01), 0.50, 0);
    const sFrame = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.34, 0.36), trimMat);
    sFrame.position.set(side * (w / 2 + 0.005), 0.50, 0);
    const shutterL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.1), awningMat);
    shutterL.position.set(side * (w / 2 + 0.02), 0.50, 0.22);
    const shutterR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.1), awningMat);
    shutterR.position.set(side * (w / 2 + 0.02), 0.50, -0.22);
    houseGroup.add(sWin, sFrame, shutterL, shutterR);
  });

  // 6. Pitched Triangular Gable Roof with White Overhanging Eaves
  const roofW = w + 0.22;
  const roofD = d + 0.22;
  const roofH = 0.58;

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-roofW / 2, 0);
  roofShape.lineTo(0, roofH);
  roofShape.lineTo(roofW / 2, 0);
  roofShape.closePath();

  const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
    depth: roofD,
    bevelEnabled: false,
  });
  roofGeom.translate(0, 0, -roofD / 2);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.y = 0.06 + h;
  roof.castShadow = true;
  roof.receiveShadow = true;
  houseGroup.add(roof);

  // White Gable Fascia Trim on Front (+Z) and Back (-Z)
  const eaveLen = Math.hypot(roofW / 2, roofH);
  const eaveAng = Math.atan2(roofH, roofW / 2);
  [-1, 1].forEach((dir) => {
    const zPos = dir * (roofD / 2 + 0.01);
    const leftFascia = new THREE.Mesh(new THREE.BoxGeometry(eaveLen + 0.02, 0.05, 0.05), trimMat);
    leftFascia.position.set(-roofW / 4, 0.06 + h + roofH / 2, zPos);
    leftFascia.rotation.z = eaveAng;

    const rightFascia = new THREE.Mesh(new THREE.BoxGeometry(eaveLen + 0.02, 0.05, 0.05), trimMat);
    rightFascia.position.set(roofW / 4, 0.06 + h + roofH / 2, zPos);
    rightFascia.rotation.z = -eaveAng;

    houseGroup.add(leftFascia, rightFascia);
  });

  // White Overhanging Ridge Eaves along bottom of roof slopes
  [-1, 1].forEach((side) => {
    const bottomEave = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, roofD + 0.02), trimMat);
    bottomEave.position.set(side * (roofW / 2), 0.06 + h, 0);
    houseGroup.add(bottomEave);
  });

  // 7. Miniature Red Brick Chimney with Stone Cap on Roof Ridge
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.18), brickMat);
  chimney.position.set(0.24, 0.06 + h + 0.32, -0.15);
  chimney.castShadow = true;
  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.24), trimMat);
  chimneyCap.position.set(0.24, 0.06 + h + 0.54, -0.15);
  houseGroup.add(chimney, chimneyCap);

  // Normalized scale for clean lawn plot layout
  houseGroup.scale.set(1.22, 1.22, 1.22);
  return houseGroup;
}

/**
 * Procedural 3D Miniature Luxury Grand Hotel / Skyscraper for Board Brawl
 * Faithfully redesigned to match Business Tour visual reference:
 * - Grand multi-tiered luxury skyscraper / grand hotel (~1.8x height of house)
 * - White/cream corner structural pillars (#f8fafc) and dark glass ribbon window rows with subtle emissive reflection
 * - Prominent tiered penthouse / rooftop crown in owner's vibrant player color (ownerColor) with gold metallic trim
 * - Illuminated rooftop dome / architectural beacon / golden spire
 * - Ground-level entrance featuring a player-colored canopy/awning facing the street (+Z)
 * - Stands significantly taller and more prestigious than houses
 */
export function create3DHotel(ownerColor = '#ef4444') {
  const hotelGroup = new THREE.Group();
  const baseColor = new THREE.Color(ownerColor);
  const darkCrownColor = baseColor.clone().multiplyScalar(0.9);

  // Material definitions
  const whitePillarMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.15,
  });
  const ribbonGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0f2b46,
    emissive: 0x0369a1,
    emissiveIntensity: 0.25,
    roughness: 0.1,
    metalness: 0.9,
  });
  const crownMat = new THREE.MeshStandardMaterial({
    color: darkCrownColor,
    roughness: 0.25,
    metalness: 0.4,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.85,
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.3,
    metalness: 0.25,
  });
  const beaconGlowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Cyan prestige crystal glow
  });
  const beaconCoreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, // Pure white brilliant core
  });
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a, // Green lawn foundation plinth
    roughness: 0.7,
    metalness: 0.05,
  });
  const lobbySlateMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Polished dark slate lobby base
    roughness: 0.4,
    metalness: 0.3,
  });

  // Base dimensions
  const baseW = 1.5;
  const baseD = 1.25;

  // 1. Foundation Plinth (Green lawn base sitting flush on lawn plot)
  const lawnPlinth = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.16, 0.06, baseD + 0.16), plinthMat);
  lawnPlinth.position.y = 0.03;
  lawnPlinth.castShadow = true;
  lawnPlinth.receiveShadow = true;
  hotelGroup.add(lawnPlinth);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.08, 0.08, baseD + 0.08), lobbySlateMat);
  plinth.position.y = 0.06 + 0.04;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  hotelGroup.add(plinth);

  // 2. Ground Floor Entrance & Lobby (Height ~0.65)
  // Grand Glass Entrance on +Z face
  const lobbyCore = new THREE.Mesh(new THREE.BoxGeometry(baseW - 0.04, 0.65, baseD - 0.04), ribbonGlassMat);
  lobbyCore.position.y = 0.14 + 0.65 / 2;
  hotelGroup.add(lobbyCore);

  // White Corner Pillars for Lobby
  const lobbyH = 0.65;
  [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ].forEach(([sx, sz]) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, lobbyH, 0.18), whitePillarMat);
    col.position.set(sx * (baseW / 2 - 0.09), 0.14 + lobbyH / 2, sz * (baseD / 2 - 0.09));
    col.castShadow = true;
    hotelGroup.add(col);
  });

  // Grand Entrance Canopy / Awning facing the street (+Z)
  const canopyW = 0.85;
  const canopyD = 0.38;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(canopyW, 0.06, canopyD), canopyMat);
  canopy.position.set(0, 0.56, baseD / 2 + canopyD / 2 - 0.02);
  canopy.castShadow = true;
  // Golden canopy edge trim
  const canopyGold = new THREE.Mesh(new THREE.BoxGeometry(canopyW + 0.04, 0.025, canopyD + 0.02), goldTrimMat);
  canopyGold.position.set(0, 0.58, baseD / 2 + canopyD / 2 - 0.02);
  // Canopy twin golden support posts
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.48, 12), goldTrimMat);
    post.position.set(side * (canopyW / 2 - 0.06), 0.28, baseD / 2 + canopyD - 0.06);
    hotelGroup.add(post);
  });
  hotelGroup.add(canopy, canopyGold);

  // Gold Cornice separating Ground Floor & Tier 1
  const band1 = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.06, 0.07, baseD + 0.06), goldTrimMat);
  band1.position.y = 0.14 + lobbyH + 0.035;
  hotelGroup.add(band1);

  // 3. Main Tower Body (Floors 2-5, Height ~1.3)
  const towerW = 1.38;
  const towerD = 1.15;
  const towerH = 1.3;
  const towerBaseY = 0.14 + lobbyH + 0.07;

  // Dark glass ribbon core
  const towerCore = new THREE.Mesh(new THREE.BoxGeometry(towerW - 0.06, towerH, towerD - 0.06), ribbonGlassMat);
  towerCore.position.y = towerBaseY + towerH / 2;
  towerCore.castShadow = true;
  hotelGroup.add(towerCore);

  // 4 White Corner Structural Pillars
  [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ].forEach(([sx, sz]) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, towerH, 0.16), whitePillarMat);
    pillar.position.set(sx * (towerW / 2 - 0.08), towerBaseY + towerH / 2, sz * (towerD / 2 - 0.08));
    pillar.castShadow = true;
    hotelGroup.add(pillar);
  });

  // Horizontal floor dividing ribbon bands (3 bands across the tower height)
  for (let f = 1; f <= 3; f++) {
    const fy = towerBaseY + (f / 4) * towerH;
    const band = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.02, 0.04, towerD + 0.02), whitePillarMat);
    band.position.y = fy;
    hotelGroup.add(band);
  }

  // Intermediate Cornice Trim with Gold Accent
  const band2 = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.08, 0.06, towerD + 0.08), goldTrimMat);
  band2.position.y = towerBaseY + towerH + 0.03;
  hotelGroup.add(band2);

  // 4. Prominent Tiered Penthouse / Rooftop Crown in Vibrant Player Color (Height ~0.55)
  const crownW = 1.12;
  const crownD = 0.92;
  const crownH = 0.55;
  const crownBaseY = towerBaseY + towerH + 0.06;

  // Player colored penthouse body
  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(crownW, crownH, crownD), crownMat);
  penthouse.position.y = crownBaseY + crownH / 2;
  penthouse.castShadow = true;
  hotelGroup.add(penthouse);

  // Penthouse panorama ribbon window
  const panoWin = new THREE.Mesh(new THREE.BoxGeometry(crownW + 0.02, 0.22, crownD + 0.02), ribbonGlassMat);
  panoWin.position.y = crownBaseY + crownH / 2;
  hotelGroup.add(panoWin);

  // Gold Top Cornice / Parapet
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(crownW + 0.06, 0.06, crownD + 0.06), goldTrimMat);
  parapet.position.y = crownBaseY + crownH + 0.03;
  hotelGroup.add(parapet);

  // 5. Grand Illuminated Rooftop Dome & Beacon Spire
  const domeBaseY = crownBaseY + crownH + 0.06;

  // Stepped golden beacon base plinth
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.1, 16), goldTrimMat);
  beaconBase.position.y = domeBaseY + 0.05;
  hotelGroup.add(beaconBase);

  // Glowing architectural observation dome / crystal beacon
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), beaconGlowMat);
  dome.position.y = domeBaseY + 0.1;
  hotelGroup.add(dome);

  // Inner brilliant core
  const domeCore = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), beaconCoreMat);
  domeCore.position.y = domeBaseY + 0.18;
  hotelGroup.add(domeCore);

  // Golden Architectural Spire / Needle
  const spireH = 0.75;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.08, spireH, 16), goldTrimMat);
  spire.position.y = domeBaseY + 0.1 + spireH / 2;
  spire.castShadow = true;
  hotelGroup.add(spire);

  // Pinnacle crown gem at apex of spire
  const apexGem = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), beaconGlowMat);
  apexGem.position.y = domeBaseY + 0.1 + spireH + 0.04;
  hotelGroup.add(apexGem);

  // Stands significantly taller and more prestigious than houses (~1.8x height)
  hotelGroup.scale.set(1.15, 1.15, 1.15);
  return hotelGroup;
}

/**
 * Procedural 3D Golden Landmark Monument for Board Brawl (Level 5)
 * Redesigned to match Business Tour visual reference:
 * - Majestic golden landmark monument with gleaming gold columns (#facc15), archways, and a golden spire.
 * - A waving pennant banner/flag displaying the owner's vibrant color (immune to buyouts).
 * - Green lawn plinth base sitting flush on the inner lawn plot.
 */
export function create3DLandmark(ownerColor = '#facc15') {
  const landmarkGroup = new THREE.Group();
  const playerColor = new THREE.Color(ownerColor);

  // Materials
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.18,
    metalness: 0.88,
  });
  const paleGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.22,
    metalness: 0.75,
  });
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a, // Green lawn foundation
    roughness: 0.7,
    metalness: 0.05,
  });
  const whiteMarbleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.1,
  });
  const flagMat = new THREE.MeshStandardMaterial({
    color: playerColor,
    roughness: 0.35,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  const baseW = 1.6;
  const baseD = 1.35;

  // 1. Lawn Plinth Base
  const lawnBase = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.18, 0.06, baseD + 0.18), plinthMat);
  lawnBase.position.y = 0.03;
  lawnBase.receiveShadow = true;
  landmarkGroup.add(lawnBase);

  // 2. Stepped Golden Pedestal Base
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.06, 0.08, baseD + 0.06), goldMat);
  step1.position.y = 0.06 + 0.04;
  step1.castShadow = true;
  step1.receiveShadow = true;
  landmarkGroup.add(step1);

  const step2 = new THREE.Mesh(new THREE.BoxGeometry(baseW - 0.12, 0.08, baseD - 0.12), paleGoldMat);
  step2.position.y = 0.14 + 0.04;
  step2.castShadow = true;
  landmarkGroup.add(step2);

  const colBaseY = 0.22;
  const colH = 1.15;
  const colRadius = 0.09;

  // 3. Classical Golden Columns (4 at corners + 2 along sides)
  const colPositions = [
    [-0.56, -0.45],
    [0.56, -0.45],
    [-0.56, 0.45],
    [0.56, 0.45],
    [0, -0.45],
    [0, 0.45],
  ];

  colPositions.forEach(([cx, cz]) => {
    // Column Base
    const cBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.24), goldMat);
    cBase.position.set(cx, colBaseY + 0.03, cz);
    landmarkGroup.add(cBase);

    // Fluted Column Shaft
    const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(colRadius, colRadius * 1.1, colH, 12), paleGoldMat);
    colShaft.position.set(cx, colBaseY + 0.06 + colH / 2, cz);
    colShaft.castShadow = true;
    landmarkGroup.add(colShaft);

    // Ornate Capital
    const cCap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), goldMat);
    cCap.position.set(cx, colBaseY + 0.06 + colH + 0.03, cz);
    landmarkGroup.add(cCap);
  });

  // Center Inner Golden Obelisk / Triumphal Altar Core
  const coreW = 0.62;
  const coreD = 0.52;
  const coreH = colH;
  const core = new THREE.Mesh(new THREE.BoxGeometry(coreW, coreH, coreD), whiteMarbleMat);
  core.position.set(0, colBaseY + 0.06 + coreH / 2, 0);
  core.castShadow = true;
  landmarkGroup.add(core);

  // Golden Medallion on Front (+Z) of Altar Core
  const medal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), goldMat);
  medal.position.set(0, colBaseY + 0.06 + coreH / 2, coreD / 2 + 0.02);
  medal.rotation.x = Math.PI / 2;
  landmarkGroup.add(medal);

  // 4. Grand Golden Architrave & Entablature
  const entY = colBaseY + 0.06 + colH + 0.06;
  const entW = baseW + 0.04;
  const entD = baseD + 0.04;
  const ent = new THREE.Mesh(new THREE.BoxGeometry(entW, 0.12, entD), goldMat);
  ent.position.y = entY + 0.06;
  ent.castShadow = true;
  landmarkGroup.add(ent);

  // Molded Cornice
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(entW + 0.08, 0.08, entD + 0.08), paleGoldMat);
  cornice.position.y = entY + 0.12 + 0.04;
  cornice.castShadow = true;
  landmarkGroup.add(cornice);

  // 5. Golden Pavilion Cupola & Dome
  const domeBaseY = entY + 0.20;
  const domeStep = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.12, 16), goldMat);
  domeStep.position.y = domeBaseY + 0.06;
  domeStep.castShadow = true;
  landmarkGroup.add(domeStep);

  const domeH = 0.55;
  const domeGeom = new THREE.SphereGeometry(0.55, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeom, goldMat);
  dome.position.y = domeBaseY + 0.12;
  dome.castShadow = true;
  landmarkGroup.add(dome);

  // 6. High Golden Spire & Finial
  const spireBaseY = domeBaseY + 0.12 + 0.52;
  const spireH = 1.05;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.08, spireH, 12), goldMat);
  spire.position.y = spireBaseY + spireH / 2;
  spire.castShadow = true;
  landmarkGroup.add(spire);

  const finialBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), paleGoldMat);
  finialBall.position.y = spireBaseY + spireH + 0.06;
  landmarkGroup.add(finialBall);

  // 7. Dynamic Waving Pennant Banner / Flag in Owner's Vibrant Color
  const flagW = 0.85;
  const flagH = 0.42;
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(flagW, flagH * 0.18);
  flagShape.lineTo(flagW * 0.72, -flagH * 0.12);
  flagShape.lineTo(flagW, -flagH * 0.42);
  flagShape.lineTo(0, -flagH * 0.28);
  flagShape.closePath();

  const flagGeom = new THREE.ShapeGeometry(flagShape, 12);
  const posAttr = flagGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const wave = Math.sin((vx / flagW) * Math.PI * 1.5) * 0.08;
    posAttr.setZ(i, wave);
  }
  flagGeom.computeVertexNormals();

  const flagMesh = new THREE.Mesh(flagGeom, flagMat);
  flagMesh.position.set(0.04, spireBaseY + spireH - 0.14, 0);
  flagMesh.castShadow = true;
  landmarkGroup.add(flagMesh);

  // Golden Flagpole Clip
  const clip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.38, 8), goldMat);
  clip.position.set(0, spireBaseY + spireH - 0.22, 0);
  landmarkGroup.add(clip);

  // Scaled for prominent prestige on the lawn plot
  landmarkGroup.scale.set(1.15, 1.15, 1.15);
  return landmarkGroup;
}

/**
 * Procedural 3D City Owner Crest Ring / Border Frame
 * Features a flat glowing owner border ring and sleek bottom asphalt badge,
 * keeping 100% of the city name, flag, and price pill completely unobstructed.
 */
export function createOwnerCrest(colorHex = '#00f0ff', width = 5.4, length = 8.2) {
  const crestGroup = new THREE.Group();
  const color = new THREE.Color(colorHex);

  const halfW = (width - 0.28) / 2;
  const halfL = (length - 0.28) / 2;

  // 1. Sleek Flat Glowing Perimeter Border Bars in Owner's Color
  const borderMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.85,
  });

  const hBarGeom = new THREE.BoxGeometry(width - 0.28, 0.025, 0.14);
  const vBarGeom = new THREE.BoxGeometry(0.14, 0.025, length - 0.28);

  // Top border bar (just below outer edge)
  const topBar = new THREE.Mesh(hBarGeom, borderMat);
  topBar.position.set(0, 0.015, -halfL);
  crestGroup.add(topBar);

  // Bottom border bar (along asphalt inner edge)
  const botBar = new THREE.Mesh(hBarGeom, borderMat);
  botBar.position.set(0, 0.015, halfL);
  crestGroup.add(botBar);

  // Left & right border bars
  const leftBar = new THREE.Mesh(vBarGeom, borderMat);
  leftBar.position.set(-halfW, 0.015, 0);
  crestGroup.add(leftBar);

  const rightBar = new THREE.Mesh(vBarGeom, borderMat);
  rightBar.position.set(halfW, 0.015, 0);
  crestGroup.add(rightBar);

  // 2. Subtle Flat Owner Crest Emblem on the asphalt stripe at the bottom (local Z ~ +3.65)
  // Perfectly positioned away from the city name and price pill!
  const badgeZ = halfL - 0.45;
  const crestDiskGeom = new THREE.CylinderGeometry(0.55, 0.6, 0.03, 24);
  const crestDiskMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.75,
  });
  const crestDisk = new THREE.Mesh(crestDiskGeom, crestDiskMat);
  crestDisk.position.set(0, 0.02, badgeZ);
  crestGroup.add(crestDisk);

  // Inner metallic coin/gem core
  const coreGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.9,
  });
  const core = new THREE.Mesh(coreGeom, coreMat);
  core.position.set(0, 0.025, badgeZ);
  crestGroup.add(core);

  return crestGroup;
}

/**
 * Procedural 3D Miniature Tropical Beach Resort Accent for Board Brawl
 * Renders on the elevated outer terrace curb for owned Resort tiles (Line 0-3 Resorts):
 * - Golden sandy deck / shore base
 * - Tall stylized curved coconut palm tree with arching emerald fronds & coconuts
 * - Luxury beach sun-lounger with cushion in owner's player color
 * - Miniature beach parasol / umbrella
 */
export function create3DResortAccent(ownerColor = '#06b6d4') {
  const resortGroup = new THREE.Group();
  const playerColor = new THREE.Color(ownerColor);

  // 1. Sandy shore / teak deck base
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.85,
    metalness: 0.05,
  });
  const sandGeom = new THREE.CylinderGeometry(1.6, 1.8, 0.22, 18);
  const sandMesh = new THREE.Mesh(sandGeom, sandMat);
  sandMesh.position.set(0, 0.11, 0);
  sandMesh.receiveShadow = true;
  resortGroup.add(sandMesh);

  // 2. Palm Tree Trunk (segmented curved coconut tree)
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.75,
    metalness: 0.1,
  });
  const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.9, 10), barkMat);
  trunkBase.position.set(-0.55, 0.55, 0);
  trunkBase.rotation.z = -0.08;
  resortGroup.add(trunkBase);

  const trunkMid = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.9, 10), barkMat);
  trunkMid.position.set(-0.68, 1.35, 0);
  trunkMid.rotation.z = -0.15;
  resortGroup.add(trunkMid);

  const trunkTop = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.9, 10), barkMat);
  trunkTop.position.set(-0.85, 2.1, 0);
  trunkTop.rotation.z = -0.1;
  resortGroup.add(trunkTop);

  // 3. Palm Fronds Crown (6 lush green arching leaves)
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.4,
    metalness: 0.1,
  });
  const crownGroup = new THREE.Group();
  crownGroup.position.set(-0.95, 2.5, 0);

  const leafGeom = new THREE.BoxGeometry(0.28, 0.04, 1.3);
  leafGeom.translate(0, 0, 0.65); // Pivot at leaf base

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const leaf = new THREE.Mesh(leafGeom, leafMat);
    leaf.rotation.y = angle;
    leaf.rotation.x = 0.52; // Droop downward
    leaf.castShadow = true;
    crownGroup.add(leaf);
  }

  // Coconuts
  const coconutMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const cocoGeom = new THREE.SphereGeometry(0.1, 8, 8);
  for (let c = 0; c < 3; c++) {
    const coco = new THREE.Mesh(cocoGeom, coconutMat);
    const cAng = (c * Math.PI * 2) / 3;
    coco.position.set(Math.cos(cAng) * 0.15, -0.05, Math.sin(cAng) * 0.15);
    crownGroup.add(coco);
  }
  resortGroup.add(crownGroup);

  // 4. Sun Lounger (in owner's player color)
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 });
  const loungerMat = new THREE.MeshStandardMaterial({
    color: playerColor,
    roughness: 0.35,
    metalness: 0.15,
  });

  const loungerGroup = new THREE.Group();
  loungerGroup.position.set(0.4, 0.22, 0.1);
  loungerGroup.rotation.y = 0.2;

  // Frame legs & base
  const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 1.45), frameMat);
  frameMesh.position.set(0, 0.04, 0);
  loungerGroup.add(frameMesh);

  // Lounger Cushion / Towel
  const cushionMesh = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.1, 1.38), loungerMat);
  cushionMesh.position.set(0, 0.11, 0);
  cushionMesh.castShadow = true;
  loungerGroup.add(cushionMesh);

  // Incline headrest
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.45), loungerMat);
  headrest.position.set(0, 0.2, -0.42);
  headrest.rotation.x = -0.38;
  loungerGroup.add(headrest);

  resortGroup.add(loungerGroup);

  // 5. Miniature Beach Parasol
  const umbrellaPoleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });
  const umbrellaCanopyMat = new THREE.MeshStandardMaterial({
    color: playerColor,
    roughness: 0.3,
    metalness: 0.2,
  });

  const parasolGroup = new THREE.Group();
  parasolGroup.position.set(0.9, 0.22, -0.45);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.85, 10), umbrellaPoleMat);
  pole.position.set(0, 0.92, 0);
  parasolGroup.add(pole);

  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.35, 18), umbrellaCanopyMat);
  canopy.position.set(0, 1.75, 0);
  canopy.castShadow = true;
  parasolGroup.add(canopy);

  // Small golden finial on umbrella top
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 }));
  finial.position.set(0, 1.95, 0);
  parasolGroup.add(finial);

  resortGroup.add(parasolGroup);

  return resortGroup;
}

/**
 * 3D Physical Finish Line Archway Monument for Corner 0 (South - START)
 * Features:
 * - Twin emerald & gold structural pillars with decorative rings and capitals.
 * - Overhead checkered green/white "START" banner.
 * - Twin flag poles with colorful fluttering pennant bunting flags.
 * - Checkered race threshold running cleanly through the archway.
 */
export function create3DStartMonument() {
  const group = new THREE.Group();
  group.name = 'StartMonument';

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.2,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.25,
    metalness: 0.85,
  });
  const emeraldMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.35,
    metalness: 0.2,
  });
  const darkEmeraldMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b,
    roughness: 0.5,
    metalness: 0.1,
  });

  // Base slab
  const baseGeom = new THREE.BoxGeometry(7.8, 0.28, 4.4);
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.position.set(0, 0.14, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Gold curb trim around base
  const trimGeom = new THREE.BoxGeometry(8.0, 0.08, 4.6);
  const trimMesh = new THREE.Mesh(trimGeom, goldTrimMat);
  trimMesh.position.set(0, 0.28, 0);
  group.add(trimMesh);

  // Checkered start/finish threshold pattern
  const laneCanvas = document.createElement('canvas');
  laneCanvas.width = 256;
  laneCanvas.height = 128;
  const lCtx = laneCanvas.getContext('2d');
  lCtx.fillStyle = '#1e293b';
  lCtx.fillRect(0, 0, 256, 128);
  const sq = 16;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 16; col++) {
      if ((row + col) % 2 === 0) {
        lCtx.fillStyle = '#ffffff';
        lCtx.fillRect(col * sq, row * sq, sq, sq);
      } else {
        lCtx.fillStyle = '#059669';
        lCtx.fillRect(col * sq, row * sq, sq, sq);
      }
    }
  }
  const laneTex = new THREE.CanvasTexture(laneCanvas);
  const laneMat = new THREE.MeshStandardMaterial({
    map: laneTex,
    roughness: 0.3,
  });
  const laneMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.0), laneMat);
  laneMesh.rotation.x = -Math.PI / 2;
  laneMesh.position.set(0, 0.3, 0);
  laneMesh.receiveShadow = true;
  group.add(laneMesh);

  // Twin Gold/Green Structural Pillars flanking the track
  const pillarSpacing = 3.2;

  const createPillar = (xPos) => {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(xPos, 0, 0);

    // Pillar pedestal
    const pedGeom = new THREE.CylinderGeometry(0.55, 0.65, 0.5, 16);
    const pedMesh = new THREE.Mesh(pedGeom, darkEmeraldMat);
    pedMesh.position.set(0, 0.45, 0);
    pedMesh.castShadow = true;
    pedMesh.receiveShadow = true;
    pillarGroup.add(pedMesh);

    // Gold pedestal collar
    const collarGeom = new THREE.TorusGeometry(0.58, 0.08, 8, 16);
    const collarMesh = new THREE.Mesh(collarGeom, goldTrimMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, 0.7, 0);
    pillarGroup.add(collarMesh);

    // Pillar column (emerald shaft)
    const shaftGeom = new THREE.CylinderGeometry(0.34, 0.4, 4.2, 16);
    const shaftMesh = new THREE.Mesh(shaftGeom, emeraldMat);
    shaftMesh.position.set(0, 2.8, 0);
    shaftMesh.castShadow = true;
    pillarGroup.add(shaftMesh);

    // Gold middle decorative rings
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.06, 8, 16), goldTrimMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0, 2.1, 0);
    pillarGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 8, 16), goldTrimMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(0, 3.5, 0);
    pillarGroup.add(ring2);

    // Pillar Capital
    const capGeom = new THREE.BoxGeometry(0.95, 0.35, 0.95);
    const capMesh = new THREE.Mesh(capGeom, goldTrimMat);
    capMesh.position.set(0, 4.95, 0);
    capMesh.castShadow = true;
    pillarGroup.add(capMesh);

    // Flagpole extending upwards
    const poleGeom = new THREE.CylinderGeometry(0.06, 0.08, 2.8, 10);
    const poleMesh = new THREE.Mesh(poleGeom, goldTrimMat);
    poleMesh.position.set(0, 6.4, 0);
    poleMesh.castShadow = true;
    pillarGroup.add(poleMesh);

    // Finial sphere on top of flagpole
    const finialGeom = new THREE.SphereGeometry(0.2, 12, 12);
    const finialMesh = new THREE.Mesh(finialGeom, goldTrimMat);
    finialMesh.position.set(0, 7.8, 0);
    pillarGroup.add(finialMesh);

    return pillarGroup;
  };

  group.add(createPillar(-pillarSpacing));
  group.add(createPillar(pillarSpacing));

  // Overhead Arch Bridge connecting twin pillars
  const archGeom = new THREE.BoxGeometry(6.6, 0.45, 0.7);
  const archMesh = new THREE.Mesh(archGeom, goldTrimMat);
  archMesh.position.set(0, 4.95, 0);
  archMesh.castShadow = true;
  group.add(archMesh);

  // Emerald lower arch soffit
  const archSoffit = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.15, 0.65), darkEmeraldMat);
  archSoffit.position.set(0, 4.7, 0);
  group.add(archSoffit);

  // Overhead Checkered Green/White "START" Banner
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 160;
  const bCtx = bannerCanvas.getContext('2d');

  bCtx.fillStyle = '#065f46';
  bCtx.fillRect(0, 0, 512, 160);

  const bGrad = bCtx.createLinearGradient(0, 0, 0, 160);
  bGrad.addColorStop(0, '#059669');
  bGrad.addColorStop(0.5, '#10b981');
  bGrad.addColorStop(1, '#047857');
  bCtx.fillStyle = bGrad;
  bCtx.fillRect(8, 8, 496, 144);

  const cSize = 16;
  for (let c = 0; c < 512; c += cSize) {
    const isEven = Math.floor(c / cSize) % 2 === 0;
    bCtx.fillStyle = isEven ? '#ffffff' : '#047857';
    bCtx.fillRect(c, 0, cSize, 14);
    bCtx.fillStyle = isEven ? '#047857' : '#ffffff';
    bCtx.fillRect(c, 146, cSize, 14);
  }

  bCtx.strokeStyle = '#facc15';
  bCtx.lineWidth = 6;
  bCtx.strokeRect(12, 14, 488, 132);

  bCtx.fillStyle = '#ffffff';
  bCtx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  bCtx.shadowBlur = 10;
  bCtx.shadowOffsetX = 3;
  bCtx.shadowOffsetY = 3;
  bCtx.fillText('★ START ★', 256, 82);

  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  bannerTex.anisotropy = 16;
  const bannerMat = new THREE.MeshStandardMaterial({
    map: bannerTex,
    roughness: 0.3,
    metalness: 0.1,
  });

  const bannerGeom = new THREE.BoxGeometry(5.4, 1.5, 0.18);
  const bannerMesh = new THREE.Mesh(bannerGeom, [
    goldTrimMat,
    goldTrimMat,
    goldTrimMat,
    goldTrimMat,
    bannerMat,
    bannerMat,
  ]);
  bannerMesh.position.set(0, 5.75, 0);
  bannerMesh.castShadow = true;
  group.add(bannerMesh);

  // Gold decorative spheres atop banner corners
  const starGeom = new THREE.SphereGeometry(0.24, 8, 8);
  const starLeft = new THREE.Mesh(starGeom, goldTrimMat);
  starLeft.position.set(-2.6, 6.55, 0);
  group.add(starLeft);
  const starRight = new THREE.Mesh(starGeom, goldTrimMat);
  starRight.position.set(2.6, 6.55, 0);
  group.add(starRight);

  // Fluttering Pennant Bunting Flags between flagpoles
  const buntingGroup = new THREE.Group();
  const flagColors = [0xf43f5e, 0xfbbf24, 0x06b6d4, 0x22c55e, 0xa855f7, 0xf97316];
  const numFlags = 7;
  const flagGeom = new THREE.ConeGeometry(0.24, 0.55, 3);
  flagGeom.rotateZ(Math.PI);

  for (let i = 0; i < numFlags; i++) {
    const t = (i + 0.5) / numFlags;
    const fx = -pillarSpacing + t * (pillarSpacing * 2);
    const sag = Math.sin(t * Math.PI) * 0.45;
    const fy = 7.3 - sag;

    const fMat = new THREE.MeshStandardMaterial({
      color: flagColors[i % flagColors.length],
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const flagMesh = new THREE.Mesh(flagGeom, fMat);
    flagMesh.position.set(fx, fy, 0);
    flagMesh.rotation.y = (i % 2 === 0 ? 0.25 : -0.25);
    flagMesh.rotation.z = Math.sin(t * Math.PI) * 0.15;
    flagMesh.castShadow = true;
    buntingGroup.add(flagMesh);
  }

  const cableGeom = new THREE.CylinderGeometry(0.015, 0.015, pillarSpacing * 2.05, 6);
  const cableMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const cableMesh = new THREE.Mesh(cableGeom, cableMat);
  cableMesh.rotation.z = Math.PI / 2;
  cableMesh.position.set(0, 7.3, 0);
  buntingGroup.add(cableMesh);

  group.add(buntingGroup);

  group.userData.update = (delta, elapsed) => {
    buntingGroup.children.forEach((child, idx) => {
      if (child.isMesh && child !== cableMesh) {
        child.rotation.y = Math.sin(elapsed * 4.0 + idx * 0.8) * 0.35;
      }
    });
  };

  return group;
}

/**
 * 3D Physical Prison Fortress / Watchtower Monument for Corner 1 (West - PRISON)
 * Features:
 * - Heavy dark concrete fortress platform with caution hazard warning stripes.
 * - Fortified prison cell block with steel cell bars and iron gate.
 * - Elevated high-security guard watchtower with searchlight beam.
 * - Rotating searchlight beam illuminating the prison perimeter.
 */
export function create3DPrisonMonument() {
  const group = new THREE.Group();
  group.name = 'PrisonMonument';

  // 1. Heavy Dark Concrete Fortress Base
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.2,
  });
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.1, 0.45, 8), baseMat);
  baseMesh.position.set(0, 0.22, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Caution Hazard Stripe Ring around base
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
    metalness: 0.1,
  });
  const stripeRing = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.08, 8, 32), stripeMat);
  stripeRing.rotation.x = Math.PI / 2;
  stripeRing.position.set(0, 0.42, 0);
  group.add(stripeRing);

  // 2. Fortified Prison Cell Block
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.3,
  });
  const cellBlock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 2.2), wallMat);
  cellBlock.position.set(-0.6, 1.25, -0.3);
  cellBlock.castShadow = true;
  cellBlock.receiveShadow = true;
  group.add(cellBlock);

  // Cell Roof
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 2.4), roofMat);
  roof.position.set(-0.6, 2.14, -0.3);
  roof.castShadow = true;
  group.add(roof);

  // Steel Cell Bars (Iron Gate)
  const barMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.2,
  });
  const barGeom = new THREE.CylinderGeometry(0.045, 0.045, 1.4, 8);
  for (let b = -4; b <= 4; b++) {
    const bar = new THREE.Mesh(barGeom, barMat);
    bar.position.set(-0.6 + b * 0.26, 1.25, 0.82);
    bar.castShadow = true;
    group.add(bar);
  }
  // Horizontal crossbars
  const crossGeom = new THREE.BoxGeometry(2.5, 0.06, 0.06);
  const cross1 = new THREE.Mesh(crossGeom, barMat);
  cross1.position.set(-0.6, 0.85, 0.82);
  group.add(cross1);
  const cross2 = new THREE.Mesh(crossGeom, barMat);
  cross2.position.set(-0.6, 1.65, 0.82);
  group.add(cross2);

  // Glowing Red Prison Siren
  const sirenMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.8,
  });
  const siren = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.22, 12), sirenMat);
  siren.position.set(-0.6, 2.3, 0.6);
  group.add(siren);

  // Animated siren pulse on security post (watchtowers and light cones removed)
  group.userData = {
    update: (delta, elapsed) => {
      siren.material.emissiveIntensity = 0.5 + Math.sin(elapsed * 6) * 0.4;
    },
  };

  return group;
}

export const create3DIslandMonument = create3DPrisonMonument;

/**
 * 3D Physical Colosseum Monument for Corner 2 (North - WORLD CHAMPIONSHIP)
 * Features:
 * - Grand circular tiered sports stadium / colosseum arena with white architectural arches.
 * - Stadium floodlight towers at the perimeter.
 * - Translucent twin vertical volumetric light beams soaring high into the sky!
 * - Center championship gold trophy cup with 3D faceted star.
 */
export function create3DChampionshipMonument() {
  const group = new THREE.Group();
  group.name = 'ChampionshipMonument';

  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.12,
  });
  const colosseumStoneMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.5,
    metalness: 0.1,
  });
  const goldMetalMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.9,
  });
  const tournamentPurpleMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    roughness: 0.5,
    metalness: 0.15,
  });

  // Base tier 1
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.45, 32), colosseumStoneMat);
  base1.position.set(0, 0.22, 0);
  base1.receiveShadow = true;
  group.add(base1);

  // Outer ring of 12 Colosseum Arch Piers
  const archRadius = 3.3;
  const numPillars = 12;
  const pillarGeom = new THREE.BoxGeometry(0.35, 1.2, 0.5);
  for (let i = 0; i < numPillars; i++) {
    const angle = (i * Math.PI * 2) / numPillars;
    const px = Math.cos(angle) * archRadius;
    const pz = Math.sin(angle) * archRadius;
    const p = new THREE.Mesh(pillarGeom, marbleMat);
    p.position.set(px, 1.0, pz);
    p.rotation.y = -angle;
    p.castShadow = true;
    group.add(p);
  }

  // Colosseum upper ring cornice
  const cornice = new THREE.Mesh(new THREE.TorusGeometry(archRadius, 0.18, 8, 32), marbleMat);
  cornice.rotation.x = Math.PI / 2;
  cornice.position.set(0, 1.6, 0);
  cornice.castShadow = true;
  group.add(cornice);

  // Gold trim ring along the rim
  const goldRim = new THREE.Mesh(new THREE.TorusGeometry(archRadius, 0.08, 8, 32), goldMetalMat);
  goldRim.rotation.x = Math.PI / 2;
  goldRim.position.set(0, 1.78, 0);
  group.add(goldRim);

  // Tiered spectator seating bowl
  const bowlTier = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.1, 0.7, 24), tournamentPurpleMat);
  bowlTier.position.set(0, 0.75, 0);
  group.add(bowlTier);

  // Center stadium emerald field
  const centerPitchMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.7,
  });
  const centerPitch = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 24), centerPitchMat);
  centerPitch.position.set(0, 1.15, 0);
  group.add(centerPitch);

  // Central Championship Gold Trophy & Star
  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(0, 1.2, 0);

  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.45, 16), marbleMat);
  ped.position.set(0, 0.22, 0);
  ped.castShadow = true;
  trophyGroup.add(ped);

  const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.2, 16), goldMetalMat);
  tBase.position.set(0, 0.52, 0);
  trophyGroup.add(tBase);

  const tStem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.4, 12), goldMetalMat);
  tStem.position.set(0, 0.8, 0);
  trophyGroup.add(tStem);

  const tCup = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.2, 0.65, 16), goldMetalMat);
  tCup.position.set(0, 1.25, 0);
  tCup.castShadow = true;
  trophyGroup.add(tCup);

  const handleGeom = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
  const handleL = new THREE.Mesh(handleGeom, goldMetalMat);
  handleL.position.set(-0.48, 1.28, 0);
  handleL.rotation.z = Math.PI / 2;
  trophyGroup.add(handleL);

  const handleR = new THREE.Mesh(handleGeom, goldMetalMat);
  handleR.position.set(0.48, 1.28, 0);
  handleR.rotation.z = -Math.PI / 2;
  trophyGroup.add(handleR);

  // Faceted 3D Golden Star atop Trophy
  const starGroup = new THREE.Group();
  starGroup.position.set(0, 1.9, 0);

  const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), goldMetalMat);
  starCore.castShadow = true;
  starGroup.add(starCore);

  for (let s = 0; s < 5; s++) {
    const sAng = (s * Math.PI * 2) / 5;
    const pt = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.48, 4), goldMetalMat);
    pt.position.set(Math.cos(sAng) * 0.38, Math.sin(sAng) * 0.38, 0);
    pt.rotation.z = sAng - Math.PI / 2;
    pt.castShadow = true;
    starGroup.add(pt);
  }

  trophyGroup.add(starGroup);
  group.add(trophyGroup);

  // Perimeter Stadium Floodlight Pylons
  const createFloodlight = (fx, fz, rotY) => {
    const fPylon = new THREE.Group();
    fPylon.position.set(fx, 0, fz);
    fPylon.rotation.y = rotY;

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 }));
    mast.position.set(0, 1.6, 0);
    mast.castShadow = true;
    fPylon.add(mast);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.15), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
    head.position.set(0, 3.2, 0);
    head.rotation.x = 0.35;
    head.castShadow = true;
    fPylon.add(head);

    const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.28), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    bulb.position.set(0, 3.2, 0.08);
    bulb.rotation.x = 0.35;
    fPylon.add(bulb);

    return fPylon;
  };

  group.add(createFloodlight(-2.6, 2.4, 0.7));
  group.add(createFloodlight(2.6, 2.4, -0.7));
  group.add(createFloodlight(-2.6, -2.4, 2.4));
  group.add(createFloodlight(2.6, -2.4, -2.4));

  group.userData.update = (delta, elapsed) => {
    starGroup.rotation.y += delta * 1.2;
    starGroup.rotation.z = Math.sin(elapsed * 2.0) * 0.1;
  };

  return group;
}

/**
 * 3D Physical World Tour Monument for Corner 3 (East - WORLD TOUR / AIRPORT)
 * Features:
 * - Harbor stone pier base with dark bollards and surrounding azure water.
 * - Red-and-white striped maritime lighthouse tower with illuminated golden lamp beacon and rotating beam.
 * - Miniature white & blue luxury passenger cruise ship with twin steam funnels.
 */
export function create3DWorldTourMonument() {
  const group = new THREE.Group();
  group.name = 'WorldTourMonument';

  const pierStoneMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.75,
    metalness: 0.1,
  });
  const pierDeckMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.65,
    metalness: 0.15,
  });
  const oceanLapMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.85,
    roughness: 0.15,
    metalness: 0.2,
  });

  const water = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.2, 0.25, 32), oceanLapMat);
  water.position.set(0, 0.12, 0);
  water.receiveShadow = true;
  group.add(water);

  const dockGeom = new THREE.BoxGeometry(6.4, 0.45, 4.4);
  const dockMesh = new THREE.Mesh(dockGeom, [
    pierStoneMat,
    pierStoneMat,
    pierDeckMat,
    pierStoneMat,
    pierStoneMat,
    pierStoneMat,
  ]);
  dockMesh.position.set(0, 0.35, 0);
  dockMesh.receiveShadow = true;
  dockMesh.castShadow = true;
  group.add(dockMesh);

  const bollardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
  const bollardGeom = new THREE.CylinderGeometry(0.1, 0.12, 0.25, 8);
  const bollardPositions = [
    [-2.8, 0.65, 1.8],
    [-1.0, 0.65, 1.8],
    [1.0, 0.65, 1.8],
    [2.8, 0.65, 1.8],
  ];
  bollardPositions.forEach(([bx, by, bz]) => {
    const b = new THREE.Mesh(bollardGeom, bollardMat);
    b.position.set(bx, by, bz);
    b.castShadow = true;
    group.add(b);
  });

  // Lighthouse removed

  // Miniature White & Blue Luxury Passenger Cruise Ship
  const shipGroup = new THREE.Group();
  shipGroup.position.set(0, 0.48, 0);
  shipGroup.rotation.y = 0;

  const hullBlueMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3, metalness: 0.2 });
  const superstructureWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
  const funnelRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
  const funnelBlackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

  const hullGeom = new THREE.BoxGeometry(3.6, 0.45, 1.2);
  const hullMesh = new THREE.Mesh(hullGeom, hullBlueMat);
  hullMesh.position.set(0, 0.2, 0);
  hullMesh.castShadow = true;
  shipGroup.add(hullMesh);

  const bowGeom = new THREE.ConeGeometry(0.65, 1.1, 4);
  bowGeom.rotateX(Math.PI / 2);
  bowGeom.rotateZ(Math.PI / 4);
  const bowMesh = new THREE.Mesh(bowGeom, hullBlueMat);
  bowMesh.position.set(-2.0, 0.2, 0);
  bowMesh.scale.set(0.9, 0.45, 1.2);
  bowMesh.castShadow = true;
  shipGroup.add(bowMesh);

  const deck1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.35, 1.0), superstructureWhiteMat);
  deck1.position.set(-0.15, 0.58, 0);
  deck1.castShadow = true;
  shipGroup.add(deck1);

  const windows = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.04), glassMat);
  windows.position.set(-0.15, 0.58, 0);
  shipGroup.add(windows);

  const deck2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.82), superstructureWhiteMat);
  deck2.position.set(-0.35, 0.9, 0);
  deck2.castShadow = true;
  shipGroup.add(deck2);

  const createFunnel = (fx) => {
    const fGroup = new THREE.Group();
    fGroup.position.set(fx, 1.05, 0);
    fGroup.rotation.z = -0.15;

    const fBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.42, 10), funnelRedMat);
    fBody.position.set(0, 0.21, 0);
    fBody.castShadow = true;
    fGroup.add(fBody);

    const fTop = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10), funnelBlackMat);
    fTop.position.set(0, 0.44, 0);
    fGroup.add(fTop);

    return fGroup;
  };

  shipGroup.add(createFunnel(-0.1));
  shipGroup.add(createFunnel(0.45));

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.6, 6), superstructureWhiteMat);
  mast.position.set(-0.9, 1.32, 0);
  shipGroup.add(mast);

  group.add(shipGroup);

  group.userData.update = (delta, elapsed) => {
    // lhBeam removed
    shipGroup.position.y = 0.48 + Math.sin(elapsed * 2.2) * 0.04;
    shipGroup.rotation.z = Math.sin(elapsed * 1.8) * 0.03;
  };

  return group;
}

/**
 * 3D Atmospheric Floating Banknote Stack Pyramid
 * Features:
 * - Crisp green banknote currency bundles wrapped in golden paper bands.
 * - Staggered multi-layer pyramid with gold coin accent.
 * - Gentle floating bob and sway animation.
 */
export function create3DBanknoteStack() {
  const stackGroup = new THREE.Group();
  stackGroup.name = 'BanknoteStack';

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 256;
  bCanvas.height = 128;
  const bCtx = bCanvas.getContext('2d');

  bCtx.fillStyle = '#15803d';
  bCtx.fillRect(0, 0, 256, 128);

  bCtx.strokeStyle = '#86efac';
  bCtx.lineWidth = 4;
  bCtx.strokeRect(6, 6, 244, 116);
  bCtx.strokeStyle = '#14532d';
  bCtx.lineWidth = 2;
  bCtx.strokeRect(12, 12, 232, 104);

  bCtx.beginPath();
  bCtx.arc(128, 64, 34, 0, Math.PI * 2);
  bCtx.fillStyle = '#166534';
  bCtx.fill();
  bCtx.strokeStyle = '#facc15';
  bCtx.lineWidth = 3;
  bCtx.stroke();

  bCtx.fillStyle = '#ffffff';
  bCtx.font = '900 32px sans-serif';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText('₩1M', 128, 64);

  bCtx.font = '900 20px sans-serif';
  bCtx.fillText('1M', 28, 28);
  bCtx.fillText('1M', 228, 100);

  const noteTex = new THREE.CanvasTexture(bCanvas);
  noteTex.anisotropy = 8;

  const noteTopMat = new THREE.MeshStandardMaterial({
    map: noteTex,
    roughness: 0.45,
    metalness: 0.05,
  });

  const noteEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xdcfce7,
    roughness: 0.65,
    metalness: 0.02,
  });

  const goldBandMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.25,
    metalness: 0.85,
  });

  const createBundle = () => {
    const bundle = new THREE.Group();
    const geom = new THREE.BoxGeometry(2.5, 0.46, 1.35);
    const mats = [noteEdgeMat, noteEdgeMat, noteTopMat, noteEdgeMat, noteEdgeMat, noteEdgeMat];
    const mesh = new THREE.Mesh(geom, mats);
    mesh.castShadow = true;
    bundle.add(mesh);

    const band = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.49, 1.38), goldBandMat);
    band.castShadow = true;
    bundle.add(band);

    return bundle;
  };

  const b1 = createBundle();
  b1.position.set(-0.85, 0.23, -0.6);
  stackGroup.add(b1);

  const b2 = createBundle();
  b2.position.set(0.85, 0.23, -0.6);
  stackGroup.add(b2);

  const b3 = createBundle();
  b3.position.set(0, 0.23, 0.65);
  stackGroup.add(b3);

  const b4 = createBundle();
  b4.rotation.y = Math.PI / 2;
  b4.position.set(-0.6, 0.69, 0);
  stackGroup.add(b4);

  const b5 = createBundle();
  b5.rotation.y = Math.PI / 2;
  b5.position.set(0.6, 0.69, 0);
  stackGroup.add(b5);

  const b6 = createBundle();
  b6.rotation.y = 0.2;
  b6.position.set(0, 1.15, 0);
  stackGroup.add(b6);

  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16),
    goldBandMat
  );
  coin.rotation.x = 0.3;
  coin.rotation.z = -0.2;
  coin.position.set(0.4, 1.44, 0.2);
  coin.castShadow = true;
  stackGroup.add(coin);

  return stackGroup;
}

/**
 * 3D Physical Jackpot Gold Coin Pile for the Central Stadium Pitch
 * Features:
 * - Gleaming tiered mountain of embossed golden coins.
 * - Upright giant golden coin centerpiece.
 * - Rotating suspended 3D golden stars.
 */
export function create3DJackpotCoinPile() {
  const group = new THREE.Group();
  group.name = 'JackpotCoinPile';

  const goldCoinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.18,
    metalness: 0.92,
  });
  const darkGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.85,
  });

  const baseMound = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.8, 0.35, 20),
    darkGoldMat
  );
  baseMound.position.set(0, 0.17, 0);
  baseMound.receiveShadow = true;
  group.add(baseMound);

  const coinGeom = new THREE.CylinderGeometry(0.62, 0.62, 0.14, 16);
  const numCoins = 22;

  for (let i = 0; i < numCoins; i++) {
    const cMesh = new THREE.Mesh(coinGeom, goldCoinMat);
    const rad = 0.4 + (i / numCoins) * 1.6;
    const ang = i * 1.35;
    const yTier = 0.35 + (1 - i / numCoins) * 0.75;
    cMesh.position.set(Math.cos(ang) * rad, yTier, Math.sin(ang) * rad);
    cMesh.rotation.x = 0.15 * Math.sin(i);
    cMesh.rotation.z = 0.15 * Math.cos(i);
    cMesh.castShadow = true;
    group.add(cMesh);
  }

  const crownCoin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.18, 20),
    goldCoinMat
  );
  crownCoin.rotation.z = Math.PI / 2;
  crownCoin.rotation.y = 0.4;
  crownCoin.position.set(0, 1.45, 0);
  crownCoin.castShadow = true;
  group.add(crownCoin);

  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.9,
  });
  const starGeom = new THREE.OctahedronGeometry(0.28, 0);

  const starGroup = new THREE.Group();
  starGroup.position.set(0, 2.4, 0);

  const s1 = new THREE.Mesh(starGeom, starMat);
  s1.position.set(0, 0.4, 0);
  starGroup.add(s1);

  const s2 = new THREE.Mesh(starGeom, starMat);
  s2.position.set(-0.7, 0, 0.3);
  s2.scale.set(0.7, 0.7, 0.7);
  starGroup.add(s2);

  const s3 = new THREE.Mesh(starGeom, starMat);
  s3.position.set(0.7, 0, -0.3);
  s3.scale.set(0.7, 0.7, 0.7);
  starGroup.add(s3);

  group.add(starGroup);

  group.userData.update = (delta, elapsed) => {
    starGroup.rotation.y += delta * 1.5;
    starGroup.position.y = 2.4 + Math.sin(elapsed * 2.5) * 0.15;
    crownCoin.rotation.y += delta * 0.6;
  };

  return group;
}

/**
 * =========================================================================
 * 12 AVATAR CUSTOM CASH PAYMENT DISTRESS ANIMATION SUITE
 * =========================================================================
 * Tailored 1.2s reactions for all 12 characters when paying rent, fees, or taxes:
 * 1.  hat (Baron Von Cash): Monocle drops / top hat hops in shock, backward stumble.
 * 2.  robot (Apex-9): Violent circuit overload jitter with red/blue electric sparks from antenna.
 * 3.  car (Axel Nitro): Hard braking nose-dive tilt with tire smoke puff particles.
 * 4.  yacht (Captain Monaco): Dramatic 30° roll/listing like taking on water with splash particles.
 * 5.  rocket (Astro Vance): Engine sputter stall, wobbly tilt with sputtering exhaust puffs.
 * 6.  duck (Lord Quackers): Feathers flurry frenzy, flapping wings spinning 360° with yellow feathers.
 * 7.  diamond (Hodl King): Shatter stress fracture, glowing red pulse with trembling vibration.
 * 8.  crown (Queen Victoria): Indignant crown tip sideways with golden teardrop sparkle particles.
 * 9.  brawler (Knuckles O'Malley): Dazed knockout wobble, reeling backward as if taking a punch.
 * 10. mystic (Madame Solana): Crystal ball dark purple blackout with shadowy distress wisps.
 * 11. kitten (Rudolf): Arched back shock, ears flattened, angry claw swipe motion.
 * 12. pigeon (Cantino): Luscious lips quiver in agony, fluttering wings as crumbs/coins fall out.
 */

export function attachAvatarDistressSystem(pawnGroup, tokenId, tokenGroup, parts = {}) {
  pawnGroup.userData.parts = { ...(pawnGroup.userData.parts || {}), ...parts };
  pawnGroup.userData.tokenId = tokenId;
  pawnGroup.userData.tokenGroup = tokenGroup;
  pawnGroup.userData.distressTimer = 0;
  pawnGroup.userData.distressDuration = 1.2;
  pawnGroup.userData.isDistressed = false;

  pawnGroup.userData.triggerDistress = (duration = 1.2) => {
    pawnGroup.userData.distressDuration = duration;
    pawnGroup.userData.distressTimer = duration;
    pawnGroup.userData.isDistressed = true;
  };

  const originalUpdate = pawnGroup.userData.update;

  pawnGroup.userData.update = (delta, elapsed, isMoving) => {
    if (typeof originalUpdate === 'function') {
      originalUpdate(delta, elapsed, isMoving);
    }

    if (pawnGroup.userData.distressTimer > 0) {
      pawnGroup.userData.distressTimer -= delta;
      const progress = Math.min(1.0, Math.max(0, 1.0 - (pawnGroup.userData.distressTimer / pawnGroup.userData.distressDuration)));
      runDistressAnimation(tokenId, progress, delta, elapsed, tokenGroup, pawnGroup, pawnGroup.userData.parts);

      if (pawnGroup.userData.distressTimer <= 0) {
        pawnGroup.userData.isDistressed = false;
        resetDistressAnimation(tokenId, tokenGroup, pawnGroup, pawnGroup.userData.parts);
      }
    }
  };
}

export function runDistressAnimation(tokenId, progress, delta, elapsed, tokenGroup, pawnGroup, parts = {}) {
  if (!tokenGroup || !parts) return;

  switch (tokenId) {
    case 'hat': {
      if (parts.monocle) {
        parts.monocle.position.y = 0.95 - Math.min(0.65, progress * 1.8);
        parts.monocle.rotation.z = Math.sin(progress * 26) * 0.75 * (1 - progress * 0.4);
      }
      if (parts.crown) {
        parts.crown.position.y = 1.05 + Math.sin(progress * Math.PI * 2.2) * 0.55;
        parts.crown.rotation.z = Math.sin(progress * 16) * 0.22;
      }
      if (parts.band) {
        parts.band.position.y = 0.2 + Math.sin(progress * 24) * 0.08;
      }
      tokenGroup.rotation.x = -0.42 * Math.sin(progress * Math.PI);
      tokenGroup.position.z = -0.35 * Math.sin(progress * Math.PI);
      break;
    }

    case 'robot': {
      tokenGroup.position.x = (Math.random() - 0.5) * 0.22;
      tokenGroup.position.z = (Math.random() - 0.5) * 0.22;
      if (parts.head) {
        parts.head.rotation.y = (Math.random() - 0.5) * 0.35;
        parts.head.rotation.z = (Math.random() - 0.5) * 0.25;
      }
      const isRed = Math.sin(progress * 45) > 0;
      if (parts.eye1?.material) parts.eye1.material.color.setHex(isRed ? 0xff0044 : 0x00f0ff);
      if (parts.eye2?.material) parts.eye2.material.color.setHex(isRed ? 0xff0044 : 0x00f0ff);

      if (parts.sparkGroup) {
        parts.sparkGroup.visible = true;
        (parts.sparkMeshes || []).forEach((sp, idx) => {
          const t = (progress * 6 + idx * 0.3) % 1.0;
          sp.position.x = (sp.userData.velocity?.x || 0) * t;
          sp.position.y = (sp.userData.velocity?.y || 1) * t;
          sp.position.z = (sp.userData.velocity?.z || 0) * t;
          sp.scale.setScalar(Math.max(0.01, (1.0 - t) * 1.3));
          sp.rotation.x += delta * 15;
          sp.rotation.y += delta * 20;
        });
      }
      break;
    }

    case 'car': {
      tokenGroup.rotation.x = -0.44 * Math.sin(Math.min(1.0, progress * 1.4) * Math.PI);
      tokenGroup.position.y = 0.5 - 0.22 * Math.sin(Math.min(1.0, progress * 1.4) * Math.PI);
      tokenGroup.rotation.y = Math.sin(progress * 25) * 0.22 * (1 - progress);

      if (parts.smokeGroup) {
        parts.smokeGroup.visible = true;
        (parts.smokePuffs || []).forEach((puff, idx) => {
          const t = (progress * 2.2 + idx * 0.15) % 1.0;
          const base = puff.userData.baseOffset || new THREE.Vector3();
          puff.position.x = base.x + Math.sin(t * 6) * 0.15;
          puff.position.y = base.y + t * 0.8;
          puff.position.z = base.z + t * 1.4;
          const sc = 0.3 + t * 1.4;
          puff.scale.setScalar(sc);
          if (puff.material) puff.material.opacity = Math.max(0, 0.7 * (1.0 - t));
        });
      }
      break;
    }

    case 'yacht': {
      tokenGroup.rotation.z = Math.sin(progress * Math.PI * 3.5) * 0.55 * (1 - progress * 0.2);
      tokenGroup.rotation.x = 0.24 * Math.sin(progress * Math.PI * 2.2);

      if (parts.splashGroup) {
        parts.splashGroup.visible = true;
        (parts.splashes || []).forEach((sp, idx) => {
          const t = (progress * 3.0 + idx * 0.12) % 1.0;
          const dir = sp.userData.dir || new THREE.Vector3(1, 1, 1);
          sp.position.x = dir.x * t;
          sp.position.y = 0.2 + dir.y * t - 1.2 * t * t;
          sp.position.z = dir.z * t;
          sp.scale.setScalar(Math.max(0.01, (1.0 - t) * 1.2));
        });
      }
      break;
    }

    case 'rocket': {
      tokenGroup.rotation.z = Math.sin(progress * 16) * 0.32;
      tokenGroup.rotation.x = -0.25 + Math.cos(progress * 20) * 0.18;
      tokenGroup.position.y = 0.5 - 0.35 * Math.sin(progress * Math.PI) + (Math.random() - 0.5) * 0.08;

      if (parts.exhaustGroup) {
        parts.exhaustGroup.visible = true;
        (parts.exhaustPuffs || []).forEach((p, idx) => {
          const t = (progress * 4.0 + idx * 0.2) % 1.0;
          const off = p.userData.offset || new THREE.Vector3();
          p.position.x = off.x + (Math.random() - 0.5) * 0.15;
          p.position.y = off.y - t * 0.9;
          p.position.z = off.z + (Math.random() - 0.5) * 0.15;
          p.scale.setScalar(Math.max(0.01, (1.0 - t) * 1.3));
        });
      }
      break;
    }

    case 'duck': {
      if (parts.rightArmGroup) parts.rightArmGroup.rotation.z = Math.sin(progress * 38) * 0.8;
      if (parts.leftArmGroup) parts.leftArmGroup.rotation.z = -Math.sin(progress * 38) * 0.8;
      if (parts.headGroup) parts.headGroup.rotation.x = -0.15 + Math.sin(progress * 28) * 0.25;

      pawnGroup.rotation.y += delta * 18.0;

      if (parts.feathersGroup) {
        parts.feathersGroup.visible = true;
        (parts.feathers || []).forEach((f, idx) => {
          const t = (progress * 2.5 + idx * 0.15) % 1.0;
          const dir = f.userData.dir || new THREE.Vector3(1, 1, 1);
          const base = f.userData.baseOffset || new THREE.Vector3();
          f.position.x = base.x + dir.x * t;
          f.position.y = base.y + dir.y * t - 1.5 * t * t;
          f.position.z = base.z + dir.z * t;
          f.rotation.x += delta * 12;
          f.rotation.z += delta * 8;
          f.scale.setScalar(Math.max(0.01, (1.0 - t) * 1.3));
        });
      }
      break;
    }

    case 'diamond': {
      const redT = 0.5 + 0.5 * Math.sin(progress * 26);
      if (parts.gem?.material) {
        parts.gem.material.color.setRGB(
          THREE.MathUtils.lerp(0.02, 1.0, redT),
          THREE.MathUtils.lerp(0.74, 0.07, redT),
          THREE.MathUtils.lerp(0.97, 0.2, redT)
        );
      }
      tokenGroup.position.x = (Math.random() - 0.5) * 0.18;
      tokenGroup.position.z = (Math.random() - 0.5) * 0.18;

      if (parts.shardGroup) {
        parts.shardGroup.visible = true;
        (parts.shards || []).forEach((sh, idx) => {
          const t = (progress * 3.0 + idx * 0.14) % 1.0;
          const dir = sh.userData.dir || new THREE.Vector3(1, 1, 1);
          sh.position.x = dir.x * t * 1.6;
          sh.position.y = dir.y * t * 1.6;
          sh.position.z = dir.z * t * 1.6;
          sh.scale.setScalar(Math.max(0.01, (1.0 - t) * 1.2));
        });
      }
      break;
    }

    case 'crown': {
      tokenGroup.rotation.z = -0.5 * Math.sin(progress * Math.PI);
      tokenGroup.rotation.x = 0.22 * Math.sin(progress * 22) * (1 - progress);

      if (parts.teardropGroup) {
        parts.teardropGroup.visible = true;
        (parts.teardrops || []).forEach((td, idx) => {
          const t = (progress * 2.8 + idx * 0.18) % 1.0;
          const base = td.userData.basePos || new THREE.Vector3();
          td.position.x = base.x;
          td.position.y = base.y - t * 0.85;
          td.position.z = base.z;
          td.scale.setScalar(Math.max(0.01, (1.0 - t) * 1.2));
        });
      }
      break;
    }

    case 'brawler': {
      tokenGroup.rotation.x = -0.55 * Math.sin(progress * Math.PI);
      tokenGroup.rotation.z = Math.sin(progress * 14) * 0.4;
      tokenGroup.position.z = -0.3 * Math.sin(progress * Math.PI);

      if (parts.dizzyStars) {
        parts.dizzyStars.visible = true;
        parts.dizzyStars.rotation.y += delta * 12.0;
        parts.dizzyStars.children.forEach((st, idx) => {
          st.position.y = Math.sin(elapsed * 6 + idx * 1.5) * 0.1;
        });
      }
      break;
    }

    case 'mystic': {
      if (parts.orb?.material) {
        parts.orb.material.color.setHex(0x130026);
        parts.orb.material.transmission = 0.2;
      }
      parts.orb.position.y = 1.4 + (Math.random() - 0.5) * 0.12;
      parts.orb.position.x = (Math.random() - 0.5) * 0.08;

      if (parts.shadowWisps) {
        parts.shadowWisps.visible = true;
        parts.shadowWisps.rotation.y += delta * 4.5;
        (parts.wisps || []).forEach((w, idx) => {
          const t = (progress * 2.4 + idx * 0.16) % 1.0;
          const off = w.userData.offset || new THREE.Vector3();
          w.position.x = off.x * (1 + t * 0.8);
          w.position.y = off.y + t * 1.1;
          w.position.z = off.z * (1 + t * 0.8);
          w.scale.setScalar(0.4 + t * 1.1);
        });
      }
      break;
    }

    case 'kitten':
    case 'rudolf': {
      if (parts.headGroup) {
        parts.headGroup.position.y = 1.95 + Math.sin(progress * 24) * 0.1;
        parts.headGroup.rotation.x = 0.32;
      }
      if (parts.leftEar) parts.leftEar.rotation.z = 0.7;
      if (parts.rightEar) parts.rightEar.rotation.z = -0.7;
      if (parts.tail) parts.tail.rotation.z = Math.sin(progress * 30) * 0.5;

      if (parts.clawsGroup) {
        parts.clawsGroup.visible = true;
        parts.clawsGroup.position.z = 0.4 + Math.sin(progress * Math.PI * 4) * 0.45;
        parts.clawsGroup.rotation.z = Math.sin(progress * 18) * 0.35;
      }
      break;
    }

    case 'pigeon': {
      if (parts.lipsGroup) {
        parts.lipsGroup.scale.x = 1.0 + Math.sin(progress * 46) * 0.4;
        parts.lipsGroup.scale.y = 1.0 + Math.cos(progress * 42) * 0.3;
        parts.lipsGroup.position.y = -0.16 + Math.sin(progress * 55) * 0.05;
      }
      if (parts.leftWing) parts.leftWing.rotation.z = 0.2 + Math.sin(progress * 42) * 0.7;
      if (parts.rightWing) parts.rightWing.rotation.z = -0.2 - Math.sin(progress * 42) * 0.7;

      if (parts.crumbsGroup) {
        parts.crumbsGroup.visible = true;
        (parts.crumbs || []).forEach((c, idx) => {
          const t = (progress * 2.2 + idx * 0.16) % 1.0;
          const off = c.userData.offset || new THREE.Vector3();
          c.position.x = off.x;
          c.position.y = off.y - t * 1.3;
          c.position.z = off.z;
          c.rotation.x += delta * 14;
          c.rotation.y += delta * 18;
          c.scale.setScalar(Math.max(0.01, (1.0 - t) * 1.2));
        });
      }
      break;
    }

    default: {
      tokenGroup.rotation.x = -0.35 * Math.sin(progress * Math.PI);
      tokenGroup.position.y = 0.5 + Math.sin(progress * 25) * 0.1;
      break;
    }
  }
}

export function resetDistressAnimation(tokenId, tokenGroup, pawnGroup, parts = {}) {
  if (!tokenGroup) return;

  tokenGroup.rotation.set(0, 0, 0);
  tokenGroup.position.set(0, 0.5, 0);

  if (parts.monocle) {
    parts.monocle.position.set(0.5, 0.95, 0.82);
    parts.monocle.rotation.set(0, 0.25, 0);
  }
  if (parts.crown) {
    parts.crown.position.set(0, 1.05, 0);
    parts.crown.rotation.set(0, 0, 0);
  }
  if (parts.band) {
    parts.band.position.set(0, 0.2, 0);
  }
  if (parts.head) {
    parts.head.rotation.set(0, 0, 0);
  }
  if (parts.eye1?.material) parts.eye1.material.color.setHex(0x00f0ff);
  if (parts.eye2?.material) parts.eye2.material.color.setHex(0x00f0ff);
  if (parts.sparkGroup) parts.sparkGroup.visible = false;
  if (parts.smokeGroup) parts.smokeGroup.visible = false;
  if (parts.splashGroup) parts.splashGroup.visible = false;
  if (parts.exhaustGroup) parts.exhaustGroup.visible = false;

  if (parts.rightArmGroup) parts.rightArmGroup.rotation.set(0, 0, 0);
  if (parts.leftArmGroup) parts.leftArmGroup.rotation.set(0, 0, 0);
  if (parts.headGroup) {
    parts.headGroup.position.set(0, parts.headGroup.position.y, 0);
    parts.headGroup.rotation.set(0, 0, 0);
  }
  if (parts.feathersGroup) parts.feathersGroup.visible = false;

  if (parts.gem?.material) {
    parts.gem.material.color.setHex(0x38bdf8);
  }
  if (parts.shardGroup) parts.shardGroup.visible = false;
  if (parts.teardropGroup) parts.teardropGroup.visible = false;
  if (parts.dizzyStars) parts.dizzyStars.visible = false;

  if (parts.orb?.material) {
    parts.orb.material.color.setHex(parts.baseOrbColor || 0xa855f7);
    parts.orb.material.transmission = 0.7;
    parts.orb.position.set(0, 1.4, 0);
  }
  if (parts.shadowWisps) parts.shadowWisps.visible = false;

  if (parts.leftEar) parts.leftEar.rotation.set(-0.1, 0, 0.45);
  if (parts.rightEar) parts.rightEar.rotation.set(-0.1, 0, -0.45);
  if (parts.clawsGroup) parts.clawsGroup.visible = false;

  if (parts.lipsGroup) {
    parts.lipsGroup.scale.set(1, 1, 1);
    parts.lipsGroup.position.set(0, -0.16, 0.62);
  }
  if (parts.leftWing) parts.leftWing.rotation.set(0.1, 0, 0.2);
  if (parts.rightWing) parts.rightWing.rotation.set(0.1, 0, -0.2);
  if (parts.crumbsGroup) parts.crumbsGroup.visible = false;
}

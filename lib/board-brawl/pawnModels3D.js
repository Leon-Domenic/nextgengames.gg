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
      // Golden Duck - 3D Humanoid Avatar (Lord Quackers)
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
      // Sir Coo-Coo - The Pouty Lips Pigeon
      const pigeon = buildPigeonAvatar(colorNum, goldMat, chromeMat, playerMat, pawnGroup);
      tokenGroup.add(pigeon);
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
  pawnGroup.scale.set(1.85, 1.85, 1.85);
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
  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x1e293b,
    emissiveIntensity: 0.2,
    roughness: 0.1,
    metalness: 0.9,
  });
  const doorWoodMat = new THREE.MeshStandardMaterial({
    color: 0x7c2d12, // Warm chestnut wood door
    roughness: 0.5,
    metalness: 0.1,
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
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Dimensions
  const w = 1.15;
  const h = 0.82;
  const d = 1.05;

  // 1. Plinth / Foundation & Front Stoop
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.08, d + 0.1), plinthMat);
  plinth.position.y = 0.04;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  houseGroup.add(plinth);

  // Front stoop facing inward (+Z) toward the street
  const stoop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.22), plinthMat);
  stoop.position.set(0, 0.025, d / 2 + 0.12);
  stoop.castShadow = true;
  houseGroup.add(stoop);

  // 2. White / Cream Stucco Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stuccoMat);
  walls.position.y = 0.08 + h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  houseGroup.add(walls);

  // 3. Front Door (+Z)
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.54, 0.04), trimMat);
  doorFrame.position.set(0, 0.08 + 0.54 / 2, d / 2 + 0.01);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.48, 0.04), doorWoodMat);
  door.position.set(0, 0.08 + 0.48 / 2, d / 2 + 0.02);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), goldTrimMat);
  knob.position.set(0.09, 0.32, d / 2 + 0.05);
  houseGroup.add(doorFrame, door, knob);

  // 4. Mini Front Sun-Awning facing inward (+Z)
  const awning = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.22), awningMat);
  awning.position.set(0, 0.68, d / 2 + 0.12);
  awning.rotation.x = 0.22;
  awning.castShadow = true;
  const awningTrim = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.025, 0.03), trimMat);
  awningTrim.position.set(0, 0.66, d / 2 + 0.22);
  houseGroup.add(awning, awningTrim);

  // Front window above awning
  const fWin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.03), windowGlassMat);
  fWin.position.set(0, 0.08 + h - 0.16, d / 2 + 0.01);
  const fWinFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.02), trimMat);
  fWinFrame.position.set(0, 0.08 + h - 0.16, d / 2 + 0.005);
  houseGroup.add(fWin, fWinFrame);

  // 5. Side Windows with player-tinted shutters & white sills
  [-1, 1].forEach((side) => {
    const sWin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.32), windowGlassMat);
    sWin.position.set(side * (w / 2 + 0.01), 0.52, 0);
    const sFrame = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.34, 0.36), trimMat);
    sFrame.position.set(side * (w / 2 + 0.005), 0.52, 0);
    const shutterL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.1), awningMat);
    shutterL.position.set(side * (w / 2 + 0.02), 0.52, 0.22);
    const shutterR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.1), awningMat);
    shutterR.position.set(side * (w / 2 + 0.02), 0.52, -0.22);
    houseGroup.add(sWin, sFrame, shutterL, shutterR);
  });

  // 6. Pitched Triangular Gable Roof with White Overhanging Eaves
  const roofW = w + 0.22;
  const roofD = d + 0.22;
  const roofH = 0.56;

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
  roof.position.y = 0.08 + h;
  roof.castShadow = true;
  roof.receiveShadow = true;
  houseGroup.add(roof);

  // White Gable Fascia Trim on Front (+Z) and Back (-Z)
  const eaveLen = Math.hypot(roofW / 2, roofH);
  const eaveAng = Math.atan2(roofH, roofW / 2);
  [-1, 1].forEach((dir) => {
    const zPos = dir * (roofD / 2 + 0.01);
    const leftFascia = new THREE.Mesh(new THREE.BoxGeometry(eaveLen + 0.02, 0.05, 0.05), trimMat);
    leftFascia.position.set(-roofW / 4, 0.08 + h + roofH / 2, zPos);
    leftFascia.rotation.z = eaveAng;

    const rightFascia = new THREE.Mesh(new THREE.BoxGeometry(eaveLen + 0.02, 0.05, 0.05), trimMat);
    rightFascia.position.set(roofW / 4, 0.08 + h + roofH / 2, zPos);
    rightFascia.rotation.z = -eaveAng;

    houseGroup.add(leftFascia, rightFascia);
  });

  // White Overhanging Ridge Eaves along bottom of roof slopes
  [-1, 1].forEach((side) => {
    const bottomEave = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, roofD + 0.02), trimMat);
    bottomEave.position.set(side * (roofW / 2), 0.08 + h, 0);
    houseGroup.add(bottomEave);
  });

  // 7. Miniature White Brick Chimney with Gold Trim on Roof Ridge
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.18), stuccoMat);
  chimney.position.set(0.24, 0.08 + h + 0.32, -0.15);
  chimney.castShadow = true;
  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.24), goldTrimMat);
  chimneyCap.position.set(0.24, 0.08 + h + 0.54, -0.15);
  houseGroup.add(chimney, chimneyCap);

  // Normalized scale for terrace layout
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
    color: 0x334155, // Polished dark slate plinth
    roughness: 0.4,
    metalness: 0.3,
  });

  // Base dimensions
  const baseW = 1.5;
  const baseD = 1.25;

  // 1. Foundation Plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.12, 0.1, baseD + 0.12), plinthMat);
  plinth.position.y = 0.05;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  hotelGroup.add(plinth);

  // 2. Ground Floor Entrance & Lobby (Height ~0.65)
  // Grand Glass Entrance on +Z face
  const lobbyCore = new THREE.Mesh(new THREE.BoxGeometry(baseW - 0.04, 0.65, baseD - 0.04), ribbonGlassMat);
  lobbyCore.position.y = 0.1 + 0.65 / 2;
  hotelGroup.add(lobbyCore);

  // White Corner Pillars for Lobby
  const lobbyH = 0.65;
  [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ].forEach(([sx, sz]) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, lobbyH, 0.18), whitePillarMat);
    col.position.set(sx * (baseW / 2 - 0.09), 0.1 + lobbyH / 2, sz * (baseD / 2 - 0.09));
    col.castShadow = true;
    hotelGroup.add(col);
  });

  // Grand Entrance Canopy / Awning facing the street (+Z)
  const canopyW = 0.85;
  const canopyD = 0.38;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(canopyW, 0.06, canopyD), canopyMat);
  canopy.position.set(0, 0.52, baseD / 2 + canopyD / 2 - 0.02);
  canopy.castShadow = true;
  // Golden canopy edge trim
  const canopyGold = new THREE.Mesh(new THREE.BoxGeometry(canopyW + 0.04, 0.025, canopyD + 0.02), goldTrimMat);
  canopyGold.position.set(0, 0.54, baseD / 2 + canopyD / 2 - 0.02);
  // Canopy twin golden support posts
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.48, 12), goldTrimMat);
    post.position.set(side * (canopyW / 2 - 0.06), 0.24, baseD / 2 + canopyD - 0.06);
    hotelGroup.add(post);
  });
  hotelGroup.add(canopy, canopyGold);

  // Gold Cornice separating Ground Floor & Tier 1
  const band1 = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.06, 0.07, baseD + 0.06), goldTrimMat);
  band1.position.y = 0.1 + lobbyH + 0.035;
  hotelGroup.add(band1);

  // 3. Main Tower Body (Floors 2-5, Height ~1.3)
  const towerW = 1.38;
  const towerD = 1.15;
  const towerH = 1.3;
  const towerBaseY = 0.1 + lobbyH + 0.07;

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
 * 3D Physical Tropical Island Monument for Corner 1 (West - RESORT ISLAND)
 * Features:
 * - Translucent turquoise ocean water reef base with white foam trim ring.
 * - Raised golden sand tropical dune plateau.
 * - Twin curved coconut palm trees with emerald palm fronds and coconuts.
 * - Miniature striped beach deckchair and parasol with gold finial.
 */
export function create3DIslandMonument() {
  const group = new THREE.Group();
  group.name = 'IslandMonument';

  // 1. Translucent Turquoise Ocean Water Reef Base
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.82,
    roughness: 0.1,
    metalness: 0.2,
  });
  const waterMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 4.1, 0.3, 32), waterMat);
  waterMesh.position.set(0, 0.15, 0);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // White foam surf ring
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.05,
  });
  const foamRing = new THREE.Mesh(new THREE.TorusGeometry(3.95, 0.09, 8, 32), foamMat);
  foamRing.rotation.x = Math.PI / 2;
  foamRing.position.set(0, 0.28, 0);
  group.add(foamRing);

  // Secondary inner wave ripple
  const innerRipple = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.05, 8, 28), foamMat);
  innerRipple.rotation.x = Math.PI / 2;
  innerRipple.position.set(0, 0.29, 0);
  group.add(innerRipple);

  // 2. Raised Golden Sand Tropical Dune Plateau
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.9,
    metalness: 0.04,
  });
  const sandDune = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.2, 0.55, 24), sandMat);
  sandDune.position.set(0, 0.45, 0);
  sandDune.receiveShadow = true;
  sandDune.castShadow = true;
  group.add(sandDune);

  // Secondary undulating raised knoll
  const knoll = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), sandMat);
  knoll.scale.set(1.4, 0.35, 1.2);
  knoll.position.set(-0.6, 0.65, -0.4);
  knoll.castShadow = true;
  group.add(knoll);

  // 3. Twin Curved Coconut Palm Trees
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.8,
    metalness: 0.1,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const coconutMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.9,
  });

  const createPalmTree = (scale = 1.0, curveAngle = 0.2, xOff = 0, zOff = 0) => {
    const palm = new THREE.Group();
    palm.position.set(xOff, 0.65, zOff);
    palm.scale.set(scale, scale, scale);

    const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.0, 10), barkMat);
    seg1.position.set(0, 0.5, 0);
    seg1.rotation.z = curveAngle * 0.4;
    seg1.castShadow = true;
    palm.add(seg1);

    const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 1.0, 10), barkMat);
    seg2.position.set(curveAngle * 0.35, 1.4, 0);
    seg2.rotation.z = curveAngle * 0.9;
    seg2.castShadow = true;
    palm.add(seg2);

    const seg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 1.0, 10), barkMat);
    seg3.position.set(curveAngle * 0.9, 2.25, 0);
    seg3.rotation.z = curveAngle * 1.3;
    seg3.castShadow = true;
    palm.add(seg3);

    const crown = new THREE.Group();
    crown.position.set(curveAngle * 1.25, 2.7, 0);

    const leafGeom = new THREE.BoxGeometry(0.3, 0.035, 1.5);
    leafGeom.translate(0, 0, 0.75);
    const numLeaves = 6;
    for (let l = 0; l < numLeaves; l++) {
      const angle = (l * Math.PI * 2) / numLeaves;
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.55;
      leaf.castShadow = true;
      crown.add(leaf);
    }

    const cocoGeom = new THREE.SphereGeometry(0.12, 8, 8);
    for (let c = 0; c < 3; c++) {
      const coco = new THREE.Mesh(cocoGeom, coconutMat);
      const cAng = (c * Math.PI * 2) / 3;
      coco.position.set(Math.cos(cAng) * 0.16, -0.08, Math.sin(cAng) * 0.16);
      crown.add(coco);
    }

    palm.add(crown);
    return palm;
  };

  const palm1 = createPalmTree(1.15, -0.22, -0.7, -0.5);
  group.add(palm1);

  const palm2 = createPalmTree(0.85, 0.28, -0.1, -1.0);
  group.add(palm2);

  // 4. Miniature Striped Beach Deckchair & Parasol
  const loungerGroup = new THREE.Group();
  loungerGroup.position.set(0.85, 0.65, 0.4);
  loungerGroup.rotation.y = -0.5;

  const whiteFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const stripedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 1.4), whiteFrameMat);
  frame.position.set(0, 0.04, 0);
  loungerGroup.add(frame);

  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 1.3), stripedMat);
  cushion.position.set(0, 0.1, 0);
  cushion.castShadow = true;
  loungerGroup.add(cushion);

  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.42), stripedMat);
  headrest.position.set(0, 0.22, -0.4);
  headrest.rotation.x = -0.4;
  loungerGroup.add(headrest);

  group.add(loungerGroup);

  // Miniature Beach Parasol
  const parasolGroup = new THREE.Group();
  parasolGroup.position.set(1.4, 0.65, -0.4);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 10), whiteFrameMat);
  pole.position.set(0, 1.1, 0);
  pole.rotation.z = -0.12;
  pole.castShadow = true;
  parasolGroup.add(pole);

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.35,
    metalness: 0.1,
  });
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.45, 18), canopyMat);
  canopy.position.set(-0.15, 2.15, 0);
  canopy.rotation.z = -0.12;
  canopy.castShadow = true;
  parasolGroup.add(canopy);

  const pFinial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 }));
  pFinial.position.set(-0.18, 2.42, 0);
  parasolGroup.add(pFinial);

  group.add(parasolGroup);

  const surfMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.06), surfMat);
  board.position.set(1.65, 1.0, 0.85);
  board.rotation.z = 0.25;
  board.rotation.y = 0.4;
  board.castShadow = true;
  group.add(board);

  return group;
}

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

  // Translucent Twin Vertical Volumetric Light Beams
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const beamGeom = new THREE.CylinderGeometry(0.18, 0.85, 14, 16);
  beamGeom.translate(0, 7.0, 0);

  const beamLeft = new THREE.Mesh(beamGeom, beamMat);
  beamLeft.position.set(-0.95, 1.2, 0);
  group.add(beamLeft);

  const beamRight = new THREE.Mesh(beamGeom, beamMat);
  beamRight.position.set(0.95, 1.2, 0);
  group.add(beamRight);

  group.userData.update = (delta, elapsed) => {
    starGroup.rotation.y += delta * 1.2;
    starGroup.rotation.z = Math.sin(elapsed * 2.0) * 0.1;
    beamLeft.material.opacity = 0.28 + Math.sin(elapsed * 3.5) * 0.08;
    beamRight.material.opacity = 0.28 + Math.cos(elapsed * 3.5) * 0.08;
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

  // Red-and-White Striped Maritime Lighthouse Tower
  const lighthouseGroup = new THREE.Group();
  lighthouseGroup.position.set(2.0, 0.55, -0.8);

  const lhRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const lhWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const lhIronMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });

  const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.4, 16), pierStoneMat);
  lhBase.position.set(0, 0.2, 0);
  lhBase.castShadow = true;
  lighthouseGroup.add(lhBase);

  const stripeH = 0.8;
  const drums = [
    { y: 0.7, botR: 0.75, topR: 0.66, mat: lhWhiteMat },
    { y: 1.4, botR: 0.66, topR: 0.57, mat: lhRedMat },
    { y: 2.1, botR: 0.57, topR: 0.48, mat: lhWhiteMat },
    { y: 2.8, botR: 0.48, topR: 0.40, mat: lhRedMat },
  ];
  drums.forEach((d) => {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(d.topR, d.botR, stripeH, 16), d.mat);
    drum.position.set(0, d.y, 0);
    drum.castShadow = true;
    lighthouseGroup.add(drum);
  });

  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 16), lhIronMat);
  gallery.position.set(0, 3.25, 0);
  lighthouseGroup.add(gallery);

  const railing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 6, 16), lhIronMat);
  railing.rotation.x = Math.PI / 2;
  railing.position.set(0, 3.42, 0);
  lighthouseGroup.add(railing);

  const lanternGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.5, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.1 })
  );
  lanternGlass.position.set(0, 3.55, 0);
  lighthouseGroup.add(lanternGlass);

  const beaconLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.6,
      roughness: 0.1,
    })
  );
  beaconLamp.position.set(0, 3.55, 0);
  lighthouseGroup.add(beaconLamp);

  const lhRoof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.5, 16), lhIronMat);
  lhRoof.position.set(0, 4.05, 0);
  lhRoof.castShadow = true;
  lighthouseGroup.add(lhRoof);

  const lhSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 }));
  lhSpire.position.set(0, 4.45, 0);
  lighthouseGroup.add(lhSpire);

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const lhBeamGeom = new THREE.ConeGeometry(1.6, 7.5, 16, 1, true);
  lhBeamGeom.rotateX(Math.PI / 2);
  lhBeamGeom.translate(0, 0, 3.8);
  const lhBeam = new THREE.Mesh(lhBeamGeom, beamMat);
  lhBeam.position.set(0, 3.55, 0);
  lighthouseGroup.add(lhBeam);

  group.add(lighthouseGroup);

  // Miniature White & Blue Luxury Passenger Cruise Ship
  const shipGroup = new THREE.Group();
  shipGroup.position.set(-1.0, 0.48, 0.6);
  shipGroup.rotation.y = 0.1;

  const hullBlueMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3, metalness: 0.2 });
  const superstructureWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
  const funnelRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

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

    const fTop = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10), lhIronMat);
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
    lhBeam.rotation.y += delta * 1.8;
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

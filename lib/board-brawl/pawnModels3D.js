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

  avatarGroup.scale.set(0.9, 0.9, 0.9);
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

  avatarGroup.scale.set(0.9, 0.9, 0.9);
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

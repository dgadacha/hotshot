import * as THREE from 'three';
import { MAP } from '../shared/config.js';
const COLORS = {
  metal: 0x313d43,
  concrete: 0x8b8d86,
  yellow: 0xffc445,
  dark: 0x19272d,
  blue: 0x39b8e5,
  red: 0xf05a43,
};
export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9aafb1);
  scene.fog = new THREE.Fog(0x9aafb1, 38, 110);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(83, 1, 0.06, 160);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  // A separate depth pass keeps the view weapon out of walls while preserving
  // depth between its own textured surfaces (the GLB is double-sided).
  const viewScene = new THREE.Scene();
  const viewCamera = new THREE.PerspectiveCamera(65, 1, 0.02, 5);
  viewScene.add(new THREE.HemisphereLight(0xc8e6ef, 0x66604e, 2.6));
  const weaponLight = new THREE.DirectionalLight(0xffe2aa, 3.4);
  weaponLight.position.set(-2, 4, 2);
  viewScene.add(weaponLight);
  scene.add(new THREE.HemisphereLight(0xc8e6ef, 0x66604e, 2.6));
  const sun = new THREE.DirectionalLight(0xffe2aa, 3.4);
  sun.position.set(-16, 38, 14);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, {
    left: -34,
    right: 34,
    top: 34,
    bottom: -34,
    near: 1,
    far: 100,
  });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  const materials = new Map();
  const mat = (c, emissive = false) => {
    const key = `${c}-${emissive}`;
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.84,
          metalness: 0.12,
          ...(emissive ? { emissive: c, emissiveIntensity: 1.2 } : {}),
        }),
      );
    return materials.get(key);
  };
  const unit = new THREE.BoxGeometry(1, 1, 1);
  function box(x, y, z, w, h, d, color, parent = scene) {
    const m = new THREE.Mesh(unit, mat(color));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.castShadow = h > 0.15;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  for (const b of MAP.boxes) {
    const color =
      b.color ??
      {
        floor: 0x777c77,
        wall: 0x8e938c,
        crate: 0xbba576,
        walkway: 0x414e50,
        machine: 0x535f60,
        support: 0x283b42,
      }[b.kind];
    box(b.x, b.y, b.z, b.w, b.h, b.d, color);
    if (b.kind === 'container') {
      for (let x = -b.w / 2 + 0.3; x < b.w / 2; x += 0.45)
        for (const sign of [-1, 1])
          box(
            b.x + x,
            b.y,
            b.z + sign * (b.d / 2 + 0.035),
            0.075,
            b.h - 0.18,
            0.07,
            COLORS.metal,
          );
      box(
        b.x,
        b.y + b.h / 2 + 0.04,
        b.z,
        b.w + 0.12,
        0.1,
        b.d + 0.1,
        COLORS.dark,
      );
    }
    if (b.kind === 'machine') {
      box(b.x, b.y + 0.6, b.z, b.w + 0.15, 0.18, b.d + 0.1, COLORS.yellow);
      for (let z = -1.8; z <= 1.8; z += 0.6)
        box(b.x - 1.12, b.y + 0.3, b.z + z, 0.1, 0.8, 0.22, COLORS.dark);
    }
    if (b.kind === 'walkway') {
      for (let x = -14; x <= 14; x += 2)
        box(x, 4.28, b.z, 0.08, 0.02, 3.9, 0x75898a);
      box(0, 4.31, b.z + Math.sign(b.z) * 1.85, 30, 0.07, 0.16, COLORS.yellow);
    }
  }
  for (const r of MAP.ramps) {
    const zLow = (-r.direction * r.d) / 2,
      zHigh = (r.direction * r.d) / 2;
    const v = new Float32Array([
      -r.w / 2,
      0,
      zLow,
      r.w / 2,
      0,
      zLow,
      -r.w / 2,
      r.top,
      zHigh,
      r.w / 2,
      0,
      zLow,
      r.w / 2,
      r.top,
      zHigh,
      -r.w / 2,
      r.top,
      zHigh,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    geo.computeVertexNormals();
    const material = mat(0x77817c).clone();
    material.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(r.x, 0, r.z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    for (let i = 1; i < 16; i++)
      box(
        r.x,
        (r.top * i) / 16 + 0.012,
        r.z + zLow + ((zHigh - zLow) * i) / 16,
        r.w,
        0.03,
        0.1,
        i % 4 === 0 ? COLORS.yellow : 0x4c5a59,
      );
  }
  // Readable ground markings, industrial structures and scale references.
  for (const z of [-12, 12])
    for (let x = -20; x <= 20; x += 2)
      box(x, 0.012, z, 0.8, 0.022, 0.09, 0xc7c9b6);
  for (const s of [-1, 1]) {
    box(
      s * 16,
      0.018,
      s * -17,
      3.5,
      0.035,
      2.5,
      s < 0 ? COLORS.red : COLORS.blue,
    );
    for (let z = -20; z <= 20; z += 8) {
      box(s * 23.85, 2.6, z, 0.2, 0.2, 4, 0x64797b);
      box(s * 23.8, 2, z, 0.25, 2, 0.3, COLORS.dark);
    }
    box(s * 21, 10, -21, 1.4, 20, 1.4, 0xb68432);
    box(0, 16, -21, 43, 1.1, 1.1, 0xb68432);
    for (let x = -20; x <= 20; x += 2)
      box(x, 15.9, -20.4, 0.65, 0.7, 0.04, 0x665437).rotation.z = 0.5;
    box(s * 30, 5, s * 18, 8, 10, 10, 0x63797b);
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.7, 20, 10),
      mat(0x58696a),
    );
    stack.position.set(s * 29, 10, -25);
    scene.add(stack);
  }
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.2, 5.3, 64),
    mat(COLORS.yellow),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.025;
  scene.add(ring);
  const textCanvas = document.createElement('canvas');
  textCanvas.width = 1024;
  textCanvas.height = 256;
  const ctx = textCanvas.getContext('2d');
  ctx.fillStyle = '#24373a';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = '#ffc445';
  ctx.font = '900 136px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCRAPYARD', 512, 169);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 3),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(textCanvas) }),
  );
  sign.position.set(0, 7.4, -23.9);
  scene.add(sign);
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    viewCamera.aspect = camera.aspect;
    viewCamera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  return {
    scene,
    camera,
    viewScene,
    renderer,
    box,
    mat,
    renderGame() {
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(viewScene, viewCamera);
      renderer.autoClear = true;
    },
    lobby(t) {
      camera.position.set(14 + Math.sin(t * 0.07) * 3, 9.5, 17);
      camera.lookAt(-3, 2, -6);
      renderer.render(scene, camera);
    },
    dispose() {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      const disposeObject = (o) => {
        o.geometry?.dispose();
        if (o.material) {
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            m.map?.dispose();
            m.dispose();
          }
        }
      };
      scene.traverse(disposeObject);
      viewScene.traverse(disposeObject);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

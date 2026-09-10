import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createWeaponAssets, normalizeRifle } from '../client/weapon-assets.js';
import { makeGunner, makeViewWeapon } from '../client/models.js';

async function deliveredRifle() {
  const bytes = await readFile(
    new URL(
      '../public/assets/weapons/weapon_assault_rifle_comic.glb',
      import.meta.url,
    ),
  );
  // The comic GLB is portable without browser image decoding or PBR textures.
  const loader = new GLTFLoader();
  return loader.parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
}

function fixture() {
  const scene = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ map: new THREE.Texture() });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 0.2), material);
  scene.add(mesh);
  return { scene, mesh, material };
}

function world() {
  const scene = new THREE.Scene();
  return {
    scene,
    viewScene: new THREE.Scene(),
    mat: (color) => new THREE.MeshStandardMaterial({ color }),
    box(x, y, z, w, h, d, color, parent = scene) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color }),
      );
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    },
  };
}

void test('the comic GLB preserves the delivered silhouette, triangle count and 1.05 m muzzle alignment', async () => {
  const { scene } = await deliveredRifle();
  const rifle = normalizeRifle(scene);
  const bounds = new THREE.Box3().setFromObject(rifle);
  assert.ok(Math.abs(bounds.min.z + 1.05) < 1e-6);
  assert.ok(Math.abs(bounds.max.z) < 1e-6);
  assert.ok(bounds.getSize(new THREE.Vector3()).x < 0.13);
  let triangles = 0;
  rifle.traverse((object) => {
    if (object.isMesh) triangles += object.geometry.index.count / 3;
  });
  assert.equal(triangles, 29829);
});

void test('FPS and opponent share one load, replace fallbacks, and switch the opponent weapon', async () => {
  const input = fixture();
  let resolve;
  let calls = 0;
  const assets = createWeaponAssets({
    loader: {
      loadAsync: () => {
        calls++;
        return new Promise((done) => {
          resolve = done;
        });
      },
    },
  });
  const stage = world();
  const view = makeViewWeapon(stage, assets);
  const opponent = makeGunner(stage, 1, assets);
  opponent.updateWeapon('grenade');
  resolve(input);
  await assets.ready;
  const firstPerson = view.rifle.children.find(
    (child) => child.name === 'weapon_assault_rifle',
  );
  const thirdPerson = opponent.group.getObjectByName('weapon_assault_rifle');
  assert.equal(calls, 1);
  assert.ok(firstPerson && thirdPerson);
  assert.equal(view.rifle.children[0].visible, false);
  assert.equal(thirdPerson.parent.visible, false);
  opponent.updateWeapon('rifle');
  assert.equal(thirdPerson.parent.visible, true);
  const firstMesh = firstPerson.getObjectByProperty('isMesh', true);
  const thirdMesh = thirdPerson.getObjectByProperty('isMesh', true);
  assert.equal(firstMesh.geometry, thirdMesh.geometry);
  assert.equal(firstMesh.material.map, thirdMesh.material.map);
  assert.ok(firstMesh.material.isMeshToonMaterial);
  assert.equal(firstMesh.material.map, null);
  assert.equal(firstMesh.material.gradientMap, thirdMesh.material.gradientMap);
  assert.deepEqual(
    [...firstMesh.material.gradientMap.image.data],
    [55, 145, 255],
  );
  assert.notEqual(firstMesh.material, thirdMesh.material);
  assert.equal(
    firstMesh.material.depthTest,
    true,
    'self-occlusion must remain enabled',
  );
  assert.equal(firstMesh.material.fog, false);
  assert.equal(thirdMesh.material.fog, true);
  assert.equal(view.group.parent, stage.viewScene);
  opponent.dispose();
  assets.dispose();
});

void test('a failed download keeps the procedural weapon usable', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const assets = createWeaponAssets({
    loader: { loadAsync: () => Promise.reject(new Error('offline')) },
  });
  const view = makeViewWeapon(world(), assets);
  await assets.ready;
  assert.equal(assets.status, 'fallback');
  assert.equal(view.rifle.children[0].visible, true);
  assert.equal(view.rifle.children.length, 2);
  assert.equal(
    view.rifle.children[1].visible,
    true,
    'hands remain available with the fallback',
  );
  assets.dispose();
});

void test('a late load after teardown releases source resources without attaching an orphan', async () => {
  const input = fixture();
  let resolve;
  const disposed = { geometry: 0, material: 0, texture: 0 };
  input.mesh.geometry.addEventListener('dispose', () => disposed.geometry++);
  input.material.addEventListener('dispose', () => disposed.material++);
  input.material.map.addEventListener('dispose', () => disposed.texture++);
  const assets = createWeaponAssets({
    loader: {
      loadAsync: () =>
        new Promise((done) => {
          resolve = done;
        }),
    },
  });
  const parent = new THREE.Group();
  assets.mountRifle(parent);
  assets.dispose();
  resolve(input);
  await assets.ready;
  assert.equal(parent.children.length, 0);
  assert.deepEqual(disposed, { geometry: 1, material: 1, texture: 1 });
  assert.equal(assets.status, 'disposed');
});

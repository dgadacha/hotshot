import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RIFLE_ASSET_URL } from './asset-paths.js';

// This delivery points down -X. The game uses -Z; the stock ends at Z=0.
export function normalizeRifle(scene) {
  const model = new THREE.Group();
  model.name = 'weapon_assault_rifle';
  const oriented = new THREE.Group();
  oriented.add(scene);
  oriented.rotation.y = -Math.PI / 2;
  const bounds = new THREE.Box3().setFromObject(oriented);
  const length = bounds.getSize(new THREE.Vector3()).z;
  if (!Number.isFinite(length) || length <= 0)
    throw new Error('The assault rifle has no usable geometry.');
  const scale = 1.05 / length;
  oriented.scale.setScalar(scale);
  oriented.position
    .copy(bounds.getCenter(new THREE.Vector3()))
    .multiplyScalar(-scale);
  oriented.position.z -= 1.05 / 2;
  model.add(oriented);
  return model;
}

function disposeSource(root) {
  const resources = new Set();
  root.traverse((object) => {
    if (object.geometry) resources.add(object.geometry);
    for (const material of object.material
      ? Array.isArray(object.material)
        ? object.material
        : [object.material]
      : []) {
      resources.add(material);
      for (const value of Object.values(material))
        if (value?.isTexture) resources.add(value);
    }
  });
  for (const resource of resources) resource.dispose();
}

// One download per game. Instances share geometry/textures and own materials.
export function createWeaponAssets({ loader = new GLTFLoader() } = {}) {
  let disposed = false;
  let source = null;
  const mounts = new Set();
  const assets = {
    status: 'loading',
    ready: Promise.resolve(/** @type {THREE.Group | null} */ (null)),
    mountRifle(parent, { firstPerson = false, onReady = () => {} } = {}) {
      let active = true;
      let instance = null;
      const release = () => {
        active = false;
        if (instance) {
          instance.removeFromParent();
          instance.traverse((object) => {
            if (object.material)
              for (const material of Array.isArray(object.material)
                ? object.material
                : [object.material])
                material.dispose();
          });
          instance = null;
        }
        mounts.delete(release);
      };
      if (disposed) return release;
      mounts.add(release);
      void assets.ready.then((model) => {
        if (!active || disposed || !model) return;
        instance = model.clone(true);
        instance.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = !firstPerson;
          object.receiveShadow = !firstPerson;
          const clone = (material) => {
            const copy = material.clone();
            copy.fog = !firstPerson;
            return copy;
          };
          object.material = Array.isArray(object.material)
            ? object.material.map(clone)
            : clone(object.material);
        });
        parent.add(instance);
        onReady(instance);
      });
      return release;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const release of mounts) release();
      if (source) disposeSource(source);
      assets.status = 'disposed';
    },
  };
  assets.ready = loader
    .loadAsync(RIFLE_ASSET_URL)
    .then(({ scene }) => {
      if (disposed) {
        disposeSource(scene);
        return null;
      }
      try {
        source = normalizeRifle(scene);
      } catch (error) {
        disposeSource(scene);
        throw error;
      }
      assets.status = 'ready';
      return source;
    })
    .catch((error) => {
      if (!disposed) {
        assets.status = 'fallback';
        console.warn('HOTSHOT: assault rifle asset could not load.', error);
      }
      return null;
    });
  return assets;
}

import * as THREE from 'three';

export const COMIC = Object.freeze({
  ink: 0x15122b,
  cyan: 0x13c9ff,
  yellow: 0xffe234,
  pink: 0xff3c91,
  violet: 0x7135ff,
  white: 0xfffdf5,
  lime: 0x7aff4c,
  sky: 0x91eeff,
  floor: 0xbca6ff,
});

const legacyColors = new Map([
  [0x416d79, COMIC.cyan],
  [0xb54f37, COMIC.pink],
  [0x777c77, COMIC.floor],
  [0x8e938c, COMIC.violet],
  [0xbba576, COMIC.yellow],
  [0x414e50, COMIC.pink],
  [0x535f60, COMIC.cyan],
  [0x283b42, COMIC.ink],
  [0x75898a, COMIC.white],
  [0x77817c, COMIC.yellow],
  [0x4c5a59, COMIC.ink],
  [0xc7c9b6, COMIC.white],
  [0x64797b, COMIC.yellow],
  [0xb68432, COMIC.yellow],
  [0x665437, COMIC.ink],
  [0x63797b, COMIC.pink],
  [0x58696a, COMIC.violet],
  [0x359eca, COMIC.cyan],
  [0xe0523f, COMIC.pink],
  [0x2a3436, COMIC.violet],
  [0x4b5148, COMIC.yellow],
  [0xd2b393, 0xffb47b],
  [0xc3a580, 0xffb47b],
  [0xc6a37e, 0xffb47b],
  [0x303b3f, COMIC.violet],
  [0xffca4d, COMIC.yellow],
  [0x253b42, COMIC.violet],
  [0x1c272b, COMIC.ink],
  [0x263538, COMIC.violet],
  [0xc6ae63, COMIC.yellow],
  [0x344850, COMIC.cyan],
  [0xca9e45, COMIC.yellow],
  [0x304048, COMIC.violet],
  [0x746c4a, COMIC.pink],
  [0x233a42, COMIC.violet],
  [0x45575a, COMIC.yellow],
  [0x1b3037, COMIC.ink],
  [0x141f25, COMIC.ink],
  [0xc8c4a9, COMIC.white],
  [0x2b809d, COMIC.cyan],
  [0x566047, COMIC.pink],
  [0xcb9e44, COMIC.yellow],
  [0x25383f, COMIC.violet],
  [0x293f47, COMIC.violet],
  [0x26373e, COMIC.cyan],
  [0x80724c, COMIC.yellow],
]);

export function comicColor(color) {
  return legacyColors.get(color) ?? color;
}

export function createToonRamp() {
  const ramp = new THREE.DataTexture(
    new Uint8Array([55, 145, 255]),
    3,
    1,
    THREE.RedFormat,
  );
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  return ramp;
}

export function toonMaterial(color, ramp, options = {}) {
  const material = new THREE.MeshToonMaterial({
    color: comicColor(color),
    gradientMap: ramp,
    ...options,
  });
  material.userData.outlineParameters = {
    thickness: 0.0035,
    color: new THREE.Color(COMIC.ink).toArray(),
    alpha: 1,
  };
  return material;
}

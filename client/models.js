import * as THREE from 'three';
export function makeGunner(world, slot) {
  const group = new THREE.Group(),
    color = slot === 0 ? 0x359eca : 0xe0523f;
  const b = (x, y, z, w, h, d, c) => world.box(x, y, z, w, h, d, c, group);
  b(0, 0.98, 0, 0.86, 0.83, 0.48, color);
  b(0, 1.12, -0.255, 0.56, 0.25, 0.1, 0x2a3436);
  b(0, 1.05, 0.255, 0.58, 0.65, 0.12, 0x4b5148);
  b(0, 1.61, 0, 0.47, 0.43, 0.43, 0xd2b393);
  b(0, 1.84, 0.025, 0.58, 0.17, 0.53, 0x303b3f);
  b(0, 1.64, -0.23, 0.41, 0.14, 0.055, 0xffca4d);
  const legs = [];
  for (const s of [-1, 1]) {
    b(s * 0.53, 1.18, 0, 0.28, 0.45, 0.38, color);
    b(s * 0.58, 0.88, -0.06, 0.23, 0.4, 0.27, 0xc3a580);
    const leg = b(s * 0.24, 0.38, 0, 0.28, 0.62, 0.32, 0x253b42);
    legs.push(leg);
    b(s * 0.24, 0.1, -0.09, 0.39, 0.2, 0.58, 0x1c272b);
  }
  b(0.3, 1.02, -0.5, 0.25, 0.24, 0.78, 0x263538);
  b(0.3, 1.05, -0.95, 0.12, 0.12, 0.32, 0xc6ae63);
  const shield = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 16, 10),
    new THREE.MeshBasicMaterial({
      color: 0x70d9ef,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    }),
  );
  shield.position.y = 0.95;
  group.add(shield);
  world.scene.add(group);
  return { group, legs, shield };
}
export function makeViewWeapon(world) {
  const group = new THREE.Group(),
    rifle = new THREE.Group(),
    grenade = new THREE.Group();
  group.add(rifle, grenade);
  world.camera.add(group);
  const b = (parent, x, y, z, w, h, d, c) => {
    const m = world.box(x, y, z, w, h, d, c, parent);
    m.castShadow = false;
    m.receiveShadow = false;
    m.renderOrder = 10;
    return m;
  };
  // Oversized improvised receiver, magazine, cooling shroud, bolts and sight.
  b(rifle, 0, 0, -0.38, 0.19, 0.19, 0.66, 0x344850);
  b(rifle, 0, 0.09, -0.42, 0.23, 0.07, 0.45, 0xca9e45);
  b(rifle, 0, -0.13, -0.22, 0.12, 0.23, 0.18, 0x304048).rotation.x = -0.2;
  b(rifle, 0, -0.18, -0.45, 0.13, 0.27, 0.2, 0x746c4a);
  b(rifle, 0, 0, -0.83, 0.12, 0.12, 0.38, 0x233a42);
  b(rifle, 0, 0, -1.03, 0.17, 0.17, 0.16, 0x45575a);
  b(rifle, 0, 0.14, -0.57, 0.04, 0.08, 0.08, 0x1b3037);
  b(rifle, 0, 0.14, -0.2, 0.09, 0.1, 0.06, 0x1b3037);
  for (const s of [-1, 1]) {
    for (let z = -0.7; z < -0.38; z += 0.06)
      b(rifle, s * 0.102, 0.04, z, 0.025, 0.13, 0.025, 0x141f25);
    b(rifle, s * 0.11, -0.025, -0.29, 0.025, 0.055, 0.055, 0xc8c4a9);
  }
  b(rifle, 0.03, -0.25, 0.04, 0.16, 0.3, 0.18, 0x2b809d).rotation.x = -0.5;
  b(rifle, -0.17, -0.16, -0.58, 0.17, 0.19, 0.24, 0xc6a37e).rotation.z = -0.55;
  b(grenade, 0, 0, -0.38, 0.28, 0.28, 0.6, 0x566047);
  b(grenade, 0, 0.15, -0.43, 0.32, 0.08, 0.36, 0xcb9e44);
  b(grenade, 0, -0.2, -0.18, 0.14, 0.27, 0.19, 0x25383f);
  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.28, 10),
    world.mat(0x293f47),
  );
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0, -0.06, -0.46);
  grenade.add(drum);
  b(grenade, 0, 0, -0.86, 0.24, 0.24, 0.35, 0x26373e);
  b(grenade, 0, 0, -1.05, 0.3, 0.3, 0.13, 0x80724c);
  b(grenade, 0.06, -0.29, 0.02, 0.19, 0.31, 0.2, 0x2b809d).rotation.x = -0.5;
  b(grenade, -0.2, -0.18, -0.61, 0.19, 0.19, 0.25, 0xc6a37e);
  const flash = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.48, 5),
    new THREE.MeshBasicMaterial({
      color: 0xffd85d,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    }),
  );
  flash.rotation.x = -Math.PI / 2;
  flash.position.set(0, 0, -1.23);
  group.add(flash);
  flash.visible = false;
  group.position.set(0.32, -0.3, -0.18);
  return { group, rifle, grenade, drum, flash };
}

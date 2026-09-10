// Preserve the delivered silhouette, replacing baked PBR textures with flat
// material regions. Regenerate until a new artist-authored comic GLB is delivered.
import { readFile, writeFile } from 'node:fs/promises';
import { COMIC } from '../client/toon.js';
const directory = new URL('../public/assets/weapons/', import.meta.url);
const file = await readFile(new URL('weapon_assault_rifle.glb', directory));
const jsonLength = file.readUInt32LE(12);
const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
const binary = file.subarray(28 + jsonLength);
const chunks = [],
  views = [],
  accessors = [];
let offset = 0;
function append(data, target) {
  const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4);
  data.copy(padded);
  const id = views.length;
  views.push({
    buffer: 0,
    byteOffset: offset,
    byteLength: data.length,
    target,
  });
  chunks.push(padded);
  offset += padded.length;
  return id;
}
function readAccessor(id) {
  const accessor = gltf.accessors[id],
    view = gltf.bufferViews[accessor.bufferView];
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type];
  const size = { 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType];
  if (!components || !size || accessor.sparse)
    throw new Error('Unsupported source accessor');
  const values = [];
  for (let i = 0; i < accessor.count; i++)
    for (let j = 0; j < components; j++) {
      const at =
        (view.byteOffset || 0) +
        (accessor.byteOffset || 0) +
        i * (view.byteStride || size * components) +
        j * size;
      values.push(
        accessor.componentType === 5126
          ? binary.readFloatLE(at)
          : accessor.componentType === 5125
            ? binary.readUInt32LE(at)
            : binary.readUInt16LE(at),
      );
    }
  return { accessor, values };
}
const primitive = gltf.meshes[0].primitives[0];
const attributes = {};
for (const name of ['POSITION', 'NORMAL']) {
  const { accessor, values } = readAccessor(primitive.attributes[name]);
  attributes[name] = accessors.length;
  const floats = new Float32Array(values);
  accessors.push({
    ...accessor,
    byteOffset: 0,
    bufferView: append(Buffer.from(floats.buffer), 34962),
  });
}
const points = readAccessor(primitive.attributes.POSITION).values;
const indices = readAccessor(primitive.indices).values;
const palette = ['cyan', 'yellow', 'pink', 'violet', 'ink', 'white'];
const buckets = palette.map(() => []);
function region(x, y, z) {
  if (x < -0.77 || x > 0.52) return 2; // muzzle and stock
  if (y > 0.205) return 4; // sights and top rail
  if (y < -0.07) return x < 0.13 ? 1 : 3; // magazine and grip
  if (x < -0.28) return Math.abs(z) > 0.055 ? 1 : 0;
  if (Math.abs(z) > 0.095 && y > 0.025) return 5; // side gauge
  return 0;
}
for (let i = 0; i < indices.length; i += 3) {
  const triangle = indices.slice(i, i + 3);
  const center = [0, 1, 2].map((axis) =>
    triangle.reduce((sum, id) => sum + points[id * 3 + axis] / 3, 0),
  );
  buckets[region(...center)].push(...triangle);
}
const primitives = buckets.flatMap((bucket, material) => {
  if (!bucket.length) return [];
  const values = new Uint32Array(bucket),
    indices = accessors.length;
  accessors.push({
    bufferView: append(Buffer.from(values.buffer), 34963),
    componentType: 5125,
    count: values.length,
    type: 'SCALAR',
  });
  return [{ attributes, indices, material }];
});
const linear = (value) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const materials = palette.map((name) => {
  const hex = COMIC[name];
  return {
    name: `COMIC_${name}`,
    doubleSided: true,
    pbrMetallicRoughness: {
      baseColorFactor: [16, 8, 0]
        .map((shift) => linear(((hex >> shift) & 255) / 255))
        .concat(1),
      metallicFactor: 0,
      roughnessFactor: 1,
    },
  };
});
const output = {
  asset: { version: '2.0', generator: 'HOTSHOT comic material conversion' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'weapon_assault_rifle_comic' }],
  meshes: [{ primitives }],
  buffers: [{ byteLength: offset }],
  bufferViews: views,
  accessors,
  materials,
  extras: {
    artDirection: 'COMIC v2',
    source: 'Delivered weapon_assault_rifle.glb; original geometry preserved',
    runtimeMaterial:
      'MeshToonMaterial with three-step gradient and ink outlines',
  },
};
const json = Buffer.from(JSON.stringify(output));
const paddedJson = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32);
json.copy(paddedJson);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + paddedJson.length + offset, 8);
header.writeUInt32LE(paddedJson.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(offset, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
await writeFile(
  new URL('weapon_assault_rifle_comic.glb', directory),
  Buffer.concat([header, paddedJson, binHeader, ...chunks]),
);
console.log(
  `Comic rifle: ${indices.length / 3} triangles, ${primitives.length} flat materials, ${28 + paddedJson.length + offset} bytes.`,
);

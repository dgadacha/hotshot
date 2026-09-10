import { GUNNER as C, MAP } from './config.js';
export const DT = 1 / 60;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const length = (v) => Math.hypot(v.x, v.y, v.z);
export const normalize = (v) => {
  const l = length(v) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
export const direction = (yaw, pitch) => ({
  x: -Math.sin(yaw) * Math.cos(pitch),
  y: Math.sin(pitch),
  z: -Math.cos(yaw) * Math.cos(pitch),
});
export const neutralInput = (seq = 0) => ({
  seq,
  x: 0,
  z: 0,
  yaw: 0,
  pitch: 0,
  jump: false,
  roll: false,
  crouch: false,
  fire: false,
  alt: false,
  reload: false,
  weapon: 0,
});
export function sanitizeInput(raw) {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !Number.isSafeInteger(raw.seq) ||
    raw.seq < 0 ||
    raw.seq > 1e10
  )
    return null;
  if (
    !['x', 'z', 'yaw', 'pitch'].every(
      (k) => typeof raw[k] === 'number' && Number.isFinite(raw[k]),
    )
  )
    return null;
  return {
    seq: raw.seq,
    x: clamp(raw.x, -1, 1),
    z: clamp(raw.z, -1, 1),
    yaw: raw.yaw % (Math.PI * 2),
    pitch: clamp(raw.pitch, -1.5, 1.5),
    jump: raw.jump === true,
    roll: raw.roll === true,
    crouch: raw.crouch === true,
    fire: raw.fire === true,
    alt: raw.alt === true,
    reload: raw.reload === true,
    weapon: raw.weapon === 1 ? 1 : raw.weapon === 2 ? 2 : 0,
  };
}
export function boxBounds(b, padding = 0) {
  return {
    min: {
      x: b.x - b.w / 2 - padding,
      y: b.y - b.h / 2 - padding,
      z: b.z - b.d / 2 - padding,
    },
    max: {
      x: b.x + b.w / 2 + padding,
      y: b.y + b.h / 2 + padding,
      z: b.z + b.d / 2 + padding,
    },
  };
}
export function rayBox(origin, dir, bounds, max = Infinity) {
  let enter = 0,
    exit = max;
  for (const axis of ['x', 'y', 'z']) {
    if (Math.abs(dir[axis]) < 1e-9) {
      if (origin[axis] < bounds.min[axis] || origin[axis] > bounds.max[axis])
        return Infinity;
      continue;
    }
    let a = (bounds.min[axis] - origin[axis]) / dir[axis],
      b = (bounds.max[axis] - origin[axis]) / dir[axis];
    if (a > b) [a, b] = [b, a];
    enter = Math.max(enter, a);
    exit = Math.min(exit, b);
    if (enter > exit) return Infinity;
  }
  return enter;
}
export function rampHeight(r, x, z) {
  if (Math.abs(x - r.x) > r.w / 2 || Math.abs(z - r.z) > r.d / 2)
    return -Infinity;
  return (((z - r.z) * r.direction) / r.d + 0.5) * r.top;
}
export function worldRay(o, d, max = 100) {
  let distance = max;
  for (const b of MAP.boxes)
    distance = Math.min(distance, rayBox(o, d, boxBounds(b), max));
  for (const r of MAP.ramps) {
    const slope = (r.direction * r.top) / r.d;
    const denominator = d.y - slope * d.z;
    if (Math.abs(denominator) < 1e-8) continue;
    const t = (r.top * 0.5 + slope * (o.z - r.z) - o.y) / denominator;
    if (
      t >= 0 &&
      t < distance &&
      rampHeight(r, o.x + d.x * t, o.z + d.z * t) > -Infinity
    )
      distance = t;
  }
  return distance;
}
function overlap(p, b, height) {
  const a = boxBounds(b);
  return (
    p.x + C.radius > a.min.x &&
    p.x - C.radius < a.max.x &&
    p.z + C.radius > a.min.z &&
    p.z - C.radius < a.max.z &&
    p.y + height > a.min.y + 0.001 &&
    p.y < a.max.y - 0.001
  );
}
export function movePlayer(p, input, dt = DT) {
  p.yaw = input.yaw;
  p.pitch = input.pitch;
  p.rollCooldown = Math.max(0, p.rollCooldown - dt);
  p.rollTime = Math.max(0, p.rollTime - dt);
  p.slideTime = Math.max(0, p.slideTime - dt);
  const wantsCrouch = input.crouch;
  // Keep the shorter body while an obstacle prevents standing.
  p.crouching =
    wantsCrouch ||
    MAP.boxes.some(
      (b) => overlap(p, b, C.height) && !overlap(p, b, C.crouchHeight),
    );
  const height = p.crouching ? C.crouchHeight : C.height;
  let mx = input.x,
    mz = input.z;
  const norm = Math.hypot(mx, mz);
  if (norm > 1) {
    mx /= norm;
    mz /= norm;
  }
  const wx = Math.cos(p.yaw) * mx + Math.sin(p.yaw) * mz,
    wz = -Math.sin(p.yaw) * mx + Math.cos(p.yaw) * mz;
  if (input.roll && p.rollCooldown <= 0) {
    const v = normalize(
      norm > 0.01 ? { x: wx, y: 0, z: wz } : direction(p.yaw, 0),
    );
    p.rollX = v.x;
    p.rollZ = v.z;
    p.rollTime = C.rollDuration;
    p.rollCooldown = C.rollCooldown;
  }
  if (
    wantsCrouch &&
    !p.wasCrouching &&
    p.grounded &&
    Math.hypot(p.vx, p.vz) > 5
  ) {
    p.slideTime = C.slideDuration;
    p.vx *= 1.2;
    p.vz *= 1.2;
  }
  p.wasCrouching = wantsCrouch;
  if (input.jump && p.grounded) {
    p.vy = C.jump;
    p.grounded = false;
    p.slideTime = 0;
  }
  if (p.rollTime > 0) {
    p.vx = p.rollX * C.rollSpeed;
    p.vz = p.rollZ * C.rollSpeed;
  } else if (p.slideTime > 0) {
    p.vx *= Math.exp(-dt * 1.7);
    p.vz *= Math.exp(-dt * 1.7);
  } else {
    const speed = C.speed * (p.crouching ? 0.46 : 1),
      accel = p.grounded ? C.acceleration : C.airAcceleration;
    const tx = wx * speed,
      tz = wz * speed,
      step = accel * dt;
    p.vx += clamp(tx - p.vx, -step, step);
    p.vz += clamp(tz - p.vz, -step, step);
    if (p.grounded && norm < 0.01) {
      p.vx *= Math.exp(-dt * C.friction);
      p.vz *= Math.exp(-dt * C.friction);
    }
  }
  p.vy -= C.gravity * dt;
  const steps = Math.max(
    1,
    Math.ceil(
      (Math.max(Math.abs(p.vx), Math.abs(p.vy), Math.abs(p.vz)) * dt) / 0.18,
    ),
  );
  let ground = false;
  for (let s = 0; s < steps; s++) {
    const delta = dt / steps,
      oldY = p.y;
    for (const axis of ['x', 'z']) {
      const v = axis === 'x' ? 'vx' : 'vz';
      p[axis] += p[v] * delta;
      for (const b of MAP.boxes) {
        if (!overlap(p, b, height)) continue;
        const bounds = boxBounds(b);
        if (p[v] > 0) p[axis] = bounds.min[axis] - C.radius;
        else if (p[v] < 0) p[axis] = bounds.max[axis] + C.radius;
        p[v] = 0;
      }
    }
    p.y += p.vy * delta;
    for (const b of MAP.boxes) {
      if (!overlap(p, b, height)) continue;
      const a = boxBounds(b);
      if (p.vy <= 0 && oldY >= a.max.y - 0.07) {
        p.y = a.max.y;
        p.vy = 0;
        ground = true;
      } else if (p.vy > 0 && oldY + height <= a.min.y + 0.07) {
        p.y = a.min.y - height;
        p.vy = 0;
      }
    }
    for (const r of MAP.ramps) {
      const floor = rampHeight(r, p.x, p.z);
      if (
        floor > -Infinity &&
        p.vy <= 0 &&
        p.y <= floor + 0.08 &&
        oldY >= floor - 0.35
      ) {
        p.y = floor;
        p.vy = 0;
        ground = true;
      }
    }
  }
  p.grounded = ground;
  return p;
}
export function cloneMovement(p) {
  return { ...p, ammo: p.ammo ? { ...p.ammo } : undefined };
}
export function integrateGrenade(g, dt = DT) {
  g.fuse -= dt;
  g.vy -= C.gravity * dt;
  const steps = Math.max(
    1,
    Math.ceil((Math.hypot(g.vx, g.vy, g.vz) * dt) / 0.12),
  );
  for (let s = 0; s < steps; s++) {
    const d = dt / steps;
    for (const axis of ['x', 'y', 'z']) {
      const v = `v${axis}`;
      g[axis] += g[v] * d;
      for (const b of MAP.boxes) {
        const a = boxBounds(b, 0.14);
        if (
          g.x > a.min.x &&
          g.x < a.max.x &&
          g.y > a.min.y &&
          g.y < a.max.y &&
          g.z > a.min.z &&
          g.z < a.max.z
        ) {
          g[axis] = g[v] > 0 ? a.min[axis] : a.max[axis];
          g[v] *= -0.58;
          if (axis === 'y') {
            g.vx *= 0.84;
            g.vz *= 0.84;
          }
          break;
        }
      }
    }
    for (const r of MAP.ramps) {
      const h = rampHeight(r, g.x, g.z);
      if (h > -Infinity && g.y < h + 0.14 && g.y > h - 0.3 && g.vy < 0) {
        g.y = h + 0.14;
        g.vy = Math.abs(g.vy) * 0.58;
      }
    }
  }
}

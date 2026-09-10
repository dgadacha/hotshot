import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, createPlayer } from '../shared/simulation.js';
import {
  neutralInput,
  movePlayer,
  DT,
  sanitizeInput,
  worldRay,
  integrateGrenade,
} from '../shared/physics.js';
const ticks = (m, n, inputs) => {
  for (let i = 0; i < n; i++) m.step(inputs);
};
function match() {
  const m = new Match({ random: () => 0.5 });
  m.addPlayer('a', 'Alpha');
  m.addPlayer('b', 'Bravo');
  ticks(m, 181);
  for (const p of m.players.values()) p.protected = 0;
  return m;
}
function faceOff(m) {
  const a = m.players.get('a'),
    b = m.players.get('b');
  Object.assign(a, { x: 0, y: 0, z: 8, yaw: 0, pitch: 0, protected: 0 });
  Object.assign(b, { x: 0, y: 0, z: -8, yaw: Math.PI, pitch: 0, protected: 0 });
  m.history = [];
  return { a, b };
}
void test('input validation rejects invalid and untrusted values', () => {
  assert.equal(sanitizeInput({ ...neutralInput(), yaw: NaN }), null);
  assert.equal(sanitizeInput({ ...neutralInput(), seq: -1 }), null);
  const safe = sanitizeInput({
    ...neutralInput(4),
    x: 999,
    yaw: 100,
    pitch: 99,
    hp: 999,
    fire: 'true',
  });
  assert.equal(safe.x, 1);
  assert.equal(safe.pitch, 1.5);
  assert.equal(safe.fire, false);
  assert.equal(safe.hp, undefined);
});
void test('movement is normalized, grounded and blocked by arena boundaries', () => {
  const a = createPlayer('a', 'a', 0),
    b = createPlayer('b', 'b', 0);
  Object.assign(a, { x: 0, z: 10 });
  Object.assign(b, { x: 0, z: 10 });
  for (let n = 0; n < 60; n++) {
    movePlayer(a, { ...neutralInput(), x: 1 });
    movePlayer(b, { ...neutralInput(), x: 1, z: 1 });
  }
  assert.ok(Math.hypot(b.vx, b.vz) <= 9.001);
  assert.ok(Math.abs(a.y) < 0.001);
  for (let n = 0; n < 300; n++) movePlayer(a, { ...neutralInput(), x: 1 });
  assert.ok(a.x <= 23.581);
  assert.ok(a.x > 23);
});
void test('jump returns to ground and roll respects cooldown', () => {
  const p = createPlayer('a', 'a', 0);
  Object.assign(p, { x: 0, z: 10 });
  movePlayer(p, { ...neutralInput(), jump: true, roll: true });
  assert.ok(p.y > 0);
  assert.ok(p.rollCooldown > 4.9);
  const y = p.y;
  for (let n = 0; n < 15; n++) movePlayer(p, { ...neutralInput(), roll: true });
  assert.ok(p.y > y);
  assert.ok(p.rollCooldown < 4.9);
  for (let n = 0; n < 120; n++) movePlayer(p, neutralInput());
  assert.ok(Math.abs(p.y) < 0.001);
});
void test('ramp carries a grounded player up to the upper walkway', () => {
  const p = createPlayer('a', 'a', 0);
  Object.assign(p, { x: -17, z: -4.1, y: 0 });
  for (let n = 0; n < 104; n++) movePlayer(p, { ...neutralInput(), z: -1 });
  assert.ok(p.y > 3.7, `ramp height ${p.y}`);
  assert.ok(p.grounded);
});
void test('countdown prevents combat, match uses eight minutes and no regeneration', () => {
  const m = new Match();
  m.addPlayer('a', 'Alpha');
  m.addPlayer('b', 'Bravo');
  assert.equal(m.phase, 'countdown');
  assert.equal(m.timer, 480);
  const a = m.players.get('a');
  assert.equal(m.damage(a, 999, 'b', 'rifle'), 0);
  ticks(m, 181);
  a.protected = 0;
  a.hp = 70;
  ticks(m, 60);
  assert.equal(a.hp, 70);
  assert.ok(m.timer < 480);
});
void test('rifle hitscan uses authority, world occlusion and headshot damage', () => {
  const m = match(),
    { a, b } = faceOff(m);
  m.step(new Map([['a', { ...neutralInput(1), fire: true }]]));
  assert.equal(b.hp, 123);
  assert.equal(a.ammo.rifle, 29);
  assert.ok(m.events.some((e) => e.type === 'hit' && e.headshot));
  Object.assign(a, { x: -3.6, z: 6, fireCooldown: 0 });
  Object.assign(b, { x: -3.6, z: -6, hp: 150 });
  m.history = [];
  m.step(new Map([['a', { ...neutralInput(2), fire: true }]]));
  assert.equal(b.hp, 150, 'central machine must block bullets');
});
void test('automatic fire follows 600 RPM and reload refills the magazine', () => {
  const m = match(),
    { a } = faceOff(m);
  m.players.get('b').protected = 99;
  for (let n = 0; n < 60; n++)
    m.step(new Map([['a', { ...neutralInput(n + 1), fire: true }]]));
  assert.equal(30 - a.ammo.rifle, 10);
  a.ammo.rifle = 2;
  a.fireCooldown = 0;
  m.step(new Map([['a', { ...neutralInput(61), reload: true }]]));
  assert.ok(a.reload > 1.7);
  ticks(m, 109);
  assert.equal(a.ammo.rifle, 30);
});
void test('alternate fire emits three bullets after button release', () => {
  const m = match(),
    { a, b } = faceOff(m);
  b.protected = 10;
  m.step(new Map([['a', { ...neutralInput(1), alt: true }]]));
  ticks(m, 15);
  assert.equal(a.ammo.rifle, 27);
  assert.equal(a.burst, 0);
});
void test('a kill scores once, restores ammo, respawns in two seconds and grants protection', () => {
  const m = match(),
    { a, b } = faceOff(m);
  a.ammo.rifle = 1;
  m.damage(b, 999, 'a', 'Assault Rifle');
  m.damage(b, 999, 'a', 'Assault Rifle');
  assert.equal(a.score, 1);
  assert.equal(a.ammo.rifle, 16);
  assert.equal(b.respawn, 2);
  ticks(m, 121);
  assert.equal(b.hp, 150);
  assert.ok(b.protected > 0.95);
  assert.equal(m.damage(b, 20, 'a', 'Assault Rifle'), 0);
  m.step(new Map([['b', { ...neutralInput(10), fire: true }]]));
  assert.equal(b.protected, 0, 'firing cancels spawn protection');
});
void test('suicides award no point and cannot win overtime', () => {
  const m = match(),
    { a } = faceOff(m);
  m.phase = 'overtime';
  m.damage(a, 999, 'a', 'Grenade Launcher');
  assert.equal(a.score, 0);
  assert.equal(m.phase, 'overtime');
});
void test('first to ten and a non-tied timeout end the game', () => {
  const m = match(),
    { a, b } = faceOff(m);
  a.score = 9;
  m.damage(b, 999, 'a', 'Assault Rifle');
  assert.equal(m.phase, 'finished');
  assert.equal(m.winner, 'a');
  const snapshot = m.snapshot();
  ticks(m, 100);
  assert.equal(
    m.players.get('b').respawn,
    snapshot.players.find((p) => p.id === 'b').respawn,
  );
  const n = match();
  n.players.get('a').score = 2;
  n.timer = DT / 2;
  n.step();
  assert.equal(n.phase, 'finished');
  assert.equal(n.winner, 'a');
});
void test('tied timeout enters overtime and next opponent kill wins', () => {
  const m = match(),
    { b } = faceOff(m);
  m.timer = DT / 2;
  m.step();
  assert.equal(m.phase, 'overtime');
  m.damage(b, 999, 'a', 'Assault Rifle');
  assert.equal(m.phase, 'finished');
});
void test('rematch requires both players and restores match state', () => {
  const m = match();
  m.finish(m.players.get('a'));
  m.voteRematch('a');
  assert.equal(m.phase, 'finished');
  m.voteRematch('b');
  assert.equal(m.phase, 'countdown');
  assert.equal(m.timer, 480);
  assert.equal(m.players.get('a').score, 0);
  assert.equal(m.players.get('a').hp, 150);
});
void test('grenades bounce, expire and remote detonation is limited to the owner', () => {
  const g = { x: 0, y: 0.2, z: 8, vx: 2, vy: -5, vz: 0, fuse: 2 };
  integrateGrenade(g);
  integrateGrenade(g);
  assert.ok(g.vy > 0, 'floor bounce');
  assert.ok(g.y >= 0.14);
  const m = match(),
    { a, b } = faceOff(m);
  a.weapon = 'grenade';
  m.step(new Map([['a', { ...neutralInput(1), fire: true }]]));
  assert.equal(m.grenades.length, 1);
  assert.equal(a.ammo.grenade, 3);
  b.weapon = 'grenade';
  m.step(new Map([['b', { ...neutralInput(1), alt: true }]]));
  assert.equal(m.grenades.length, 1);
  a.fireCooldown = 0;
  m.step(new Map([['a', { ...neutralInput(2), alt: true }]]));
  assert.equal(m.grenades.length, 0);
  assert.ok(m.events.some((e) => e.type === 'explosion'));
});
void test('blast respects walls and has self-damage and knockback', () => {
  const m = match(),
    { a, b } = faceOff(m);
  Object.assign(a, { x: 0, y: 0, z: 10 });
  Object.assign(b, { x: 0, y: 0, z: 12 });
  const g = { id: 1, owner: 'a', x: 0, y: 0.4, z: 10.8, fuse: 0 };
  m.grenades.push(g);
  m.explode(g);
  assert.ok(a.hp < 150 && b.hp < 150);
  assert.ok(a.vy > 0 && b.vy > 0);
  assert.ok(a.hp > b.hp, 'self damage multiplier');
});
void test('lag compensation uses recent server history but never an old life', () => {
  const m = match(),
    { a, b } = faceOff(m);
  m.history = [{ time: m.time - 0.1, players: [{ ...b }] }];
  b.x = 2;
  m.step(
    new Map([['a', { ...neutralInput(1), fire: true }]]),
    new Map([['a', 0.2]]),
  );
  assert.ok(b.hp < 150, 'shot should hit historical location');
  b.hp = 150;
  b.life++;
  a.fireCooldown = 0;
  m.step(
    new Map([['a', { ...neutralInput(2), fire: true }]]),
    new Map([['a', 0.2]]),
  );
  assert.equal(b.hp, 150, 'old life must not be hittable');
});
void test('ray geometry handles parallel rays without false collisions', () => {
  assert.ok(worldRay({ x: 0, y: 1.6, z: 10 }, { x: 0, y: 0, z: -1 }, 30) > 20);
  assert.ok(
    worldRay({ x: -3.6, y: 1.6, z: 10 }, { x: 0, y: 0, z: -1 }, 30) < 8,
  );
});

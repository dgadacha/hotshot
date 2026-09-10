import { RULES, GUNNER, WEAPONS, MAP } from './config.js';
import {
  DT,
  clamp,
  direction,
  normalize,
  neutralInput,
  movePlayer,
  worldRay,
  rayBox,
  integrateGrenade,
} from './physics.js';
export function createPlayer(id, name, slot) {
  const spawn = MAP.spawns[slot];
  return {
    id,
    name: name.slice(0, 16),
    slot,
    ...spawn,
    pitch: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: GUNNER.health,
    score: 0,
    deaths: 0,
    streak: 0,
    weapon: 'rifle',
    ammo: { rifle: WEAPONS.rifle.magazine, grenade: WEAPONS.grenade.magazine },
    reload: 0,
    fireCooldown: 0,
    burst: 0,
    rollCooldown: 0,
    rollTime: 0,
    rollX: 0,
    rollZ: 0,
    slideTime: 0,
    grounded: true,
    crouching: false,
    wasCrouching: false,
    respawn: 0,
    protected: RULES.protection,
    seq: 0,
    life: 0,
    lastAttacker: null,
  };
}
export class Match {
  constructor({ random = Math.random, bot = false } = {}) {
    this.players = new Map();
    this.phase = 'waiting';
    this.timer = RULES.matchSeconds;
    this.countdown = RULES.countdown;
    this.time = 0;
    this.events = [];
    this.eventId = 0;
    this.grenades = [];
    this.grenadeId = 0;
    this.history = [];
    this.random = random;
    this.bot = bot;
    this.winner = null;
    this.round = 0;
    this.rematchVotes = new Set();
  }
  addPlayer(id, name) {
    if (this.players.size >= 2 || this.players.has(id)) return null;
    const p = createPlayer(id, name, this.players.size);
    this.players.set(id, p);
    if (this.players.size === 2) this.reset();
    return p;
  }
  reset() {
    this.round++;
    this.phase = 'countdown';
    this.countdown = RULES.countdown;
    this.timer = RULES.matchSeconds;
    this.winner = null;
    this.grenades = [];
    this.history = [];
    this.rematchVotes.clear();
    for (const [id, p] of this.players)
      this.players.set(id, {
        ...createPlayer(id, p.name, p.slot),
        seq: p.seq,
        life: p.life + 1,
      });
    this.emit('round', {});
  }
  voteRematch(id) {
    if (this.phase !== 'finished' || !this.players.has(id)) return;
    this.rematchVotes.add(id);
    if (this.bot || this.rematchVotes.size === 2) this.reset();
    else this.emit('message', { text: 'REVANCHE DEMANDÉE' });
  }
  removePlayer(id) {
    this.players.delete(id);
    this.phase = 'waiting';
    this.grenades = [];
    this.history = [];
    this.rematchVotes.clear();
    for (const p of this.players.values()) p.slot = 0;
    this.emit('message', { text: 'ADVERSAIRE DÉCONNECTÉ' });
  }
  emit(type, data) {
    this.events.push({ id: ++this.eventId, type, ...data });
    if (this.events.length > 128) this.events.shift();
  }
  step(inputs = new Map(), latencies = new Map()) {
    this.time += DT;
    if (this.phase === 'waiting' || this.phase === 'finished') return;
    if (this.phase === 'countdown') {
      this.countdown -= DT;
      if (this.countdown <= 1e-6) {
        this.phase = 'playing';
        this.emit('message', { text: 'FIGHT!' });
      }
      return;
    }
    if (this.phase === 'playing') {
      this.timer = Math.max(0, this.timer - DT);
      if (this.timer <= 0) {
        const ps = [...this.players.values()];
        if (ps[0].score === ps[1].score) {
          this.phase = 'overtime';
          this.emit('message', { text: 'OVERTIME! NEXT KILL WINS.' });
        } else this.finish(ps[0].score > ps[1].score ? ps[0] : ps[1]);
      }
    }
    if (this.phase === 'finished') return;
    for (const p of this.players.values()) {
      const input = inputs.get(p.id) || {
        ...neutralInput(p.seq),
        yaw: p.yaw,
        pitch: p.pitch,
      };
      p.seq = Math.max(p.seq, input.seq);
      if (p.hp <= 0) {
        p.respawn -= DT;
        if (p.respawn <= 1e-6) this.respawn(p);
        continue;
      }
      p.protected = Math.max(0, p.protected - DT);
      movePlayer(p, input);
      if (p.y < -10) {
        this.damage(p, 999, null, 'Void');
        continue;
      }
      this.updateWeapon(p, input, latencies.get(p.id) || 0);
      if (this.phase === 'finished') break;
    }
    if (this.phase !== 'finished') {
      // oxlint-disable-next-line unicorn/no-useless-spread -- Explosions remove entries from the live array.
      for (const g of [...this.grenades]) {
        integrateGrenade(g);
        if (g.fuse <= 0) this.explode(g);
        if (this.phase === 'finished') break;
      }
    }
    this.history.push({
      time: this.time,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        z: p.z,
        hp: p.hp,
        life: p.life,
        crouching: p.crouching,
      })),
    });
    while (
      this.history.length >
      Math.ceil(RULES.maxRewind * RULES.tickRate) + 3
    )
      this.history.shift();
  }
  updateWeapon(p, i, latency) {
    p.fireCooldown = p.fireCooldown <= DT + 1e-6 ? 0 : p.fireCooldown - DT;
    if (i.weapon && p.weapon !== (i.weapon === 1 ? 'rifle' : 'grenade')) {
      p.weapon = i.weapon === 1 ? 'rifle' : 'grenade';
      p.reload = 0;
      p.burst = 0;
      p.fireCooldown = Math.max(p.fireCooldown, 0.2);
    }
    const w = WEAPONS[p.weapon];
    if (p.reload > 0) {
      p.reload = p.reload <= DT + 1e-6 ? 0 : p.reload - DT;
      if (p.reload <= 0) {
        p.ammo[p.weapon] = w.magazine;
        this.emit('reload_done', { player: p.id });
      }
      return;
    }
    if (i.reload && p.ammo[p.weapon] < w.magazine) {
      p.reload = w.reload;
      p.burst = 0;
      this.emit('reload', { player: p.id, weapon: p.weapon });
      return;
    }
    if (p.weapon === 'grenade' && i.alt && p.fireCooldown <= 0) {
      const owned = this.grenades.filter((g) => g.owner === p.id);
      if (owned.length) {
        for (const g of owned) {
          this.explode(g);
          if (this.phase === 'finished') break;
        }
        p.fireCooldown = 0.25;
      }
      return;
    }
    if (p.fireCooldown > 0) return;
    if (p.weapon === 'rifle' && i.alt && p.burst === 0)
      p.burst = Math.min(3, p.ammo.rifle);
    const burst = p.burst > 0;
    if (!i.fire && !burst) return;
    if (p.ammo[p.weapon] <= 0) {
      p.reload = w.reload;
      p.burst = 0;
      this.emit('reload', { player: p.id, weapon: p.weapon });
      return;
    }
    p.ammo[p.weapon]--;
    p.protected = 0;
    if (p.weapon === 'rifle') {
      const spread = burst ? w.spread * 0.2 : w.spread;
      const dir = direction(
        p.yaw + (this.random() - 0.5) * spread,
        p.pitch + (this.random() - 0.5) * spread,
      );
      const origin = {
        x: p.x,
        y: p.y + (p.crouching ? 1 : GUNNER.eye),
        z: p.z,
      };
      const wall = worldRay(origin, dir, w.range);
      let distance = wall,
        target = null,
        headshot = false;
      const rewind = this.time - clamp(latency / 2, 0, RULES.maxRewind);
      let sample = this.history.at(-1);
      for (const frame of this.history) {
        if (frame.time >= rewind) {
          sample = frame;
          break;
        }
      }
      for (const enemy of this.players.values()) {
        if (enemy.id === p.id || enemy.hp <= 0) continue;
        const old =
          sample?.players.find(
            (a) => a.id === enemy.id && a.life === enemy.life && a.hp > 0,
          ) || enemy;
        const height = old.crouching ? GUNNER.crouchHeight : GUNNER.height;
        const bounds = {
          min: { x: old.x - 0.45, y: old.y, z: old.z - 0.45 },
          max: { x: old.x + 0.45, y: old.y + height, z: old.z + 0.45 },
        };
        const t = rayBox(origin, dir, bounds, w.range);
        if (t < distance) {
          distance = t;
          target = enemy;
          headshot = origin.y + dir.y * t > old.y + height - 0.36;
        }
      }
      const end = {
        x: origin.x + dir.x * distance,
        y: origin.y + dir.y * distance,
        z: origin.z + dir.z * distance,
      };
      this.emit('shot', { player: p.id, weapon: p.weapon, origin, end });
      if (target) {
        const amount = Math.round(
          w.damage *
            (headshot ? w.headMultiplier : 1) *
            (burst ? w.burstBonus : 1),
        );
        this.damage(target, amount, p.id, w.name, headshot);
      }
      if (burst) {
        p.burst--;
        p.fireCooldown = p.burst > 0 ? w.burstInterval : w.burstDelay;
      } else p.fireCooldown = w.interval;
    } else {
      const d = direction(p.yaw, p.pitch),
        origin = { x: p.x, y: p.y + (p.crouching ? 1 : GUNNER.eye), z: p.z };
      const distance = Math.min(
        0.8,
        Math.max(0.01, worldRay(origin, d, 1) - 0.18),
      );
      this.grenades.push({
        id: ++this.grenadeId,
        owner: p.id,
        x: origin.x + d.x * distance,
        y: origin.y + d.y * distance,
        z: origin.z + d.z * distance,
        vx: d.x * w.speed + p.vx * 0.25,
        vy: d.y * w.speed + 2.2,
        vz: d.z * w.speed + p.vz * 0.25,
        fuse: w.fuse,
      });
      this.emit('shot', {
        player: p.id,
        weapon: p.weapon,
        origin,
        end: {
          x: origin.x + d.x * 6,
          y: origin.y + d.y * 6,
          z: origin.z + d.z * 6,
        },
      });
      p.fireCooldown = w.interval;
    }
  }
  explode(g) {
    if (!this.grenades.includes(g)) return;
    this.grenades.splice(this.grenades.indexOf(g), 1);
    this.emit('explosion', { x: g.x, y: g.y, z: g.z, player: g.owner });
    const w = WEAPONS.grenade;
    for (const p of this.players.values()) {
      if (p.hp <= 0) continue;
      const center = { x: p.x, y: p.y + 0.9, z: p.z },
        vector = { x: center.x - g.x, y: center.y - g.y, z: center.z - g.z },
        dist = Math.hypot(vector.x, vector.y, vector.z);
      if (dist > w.radius) continue;
      const d = normalize(vector);
      if (worldRay(g, d, dist) < dist - 0.2) continue;
      const damage = Math.round(
        w.damage * (1 - dist / w.radius) * (p.id === g.owner ? 0.65 : 1),
      );
      const applied = this.damage(p, damage, g.owner, w.name, false);
      if (applied > 0 && p.hp > 0) {
        const force = (1 - dist / w.radius) * 14;
        p.vx += d.x * force;
        p.vy += Math.max(3, d.y * force + 4);
        p.vz += d.z * force;
        p.grounded = false;
      }
      if (this.phase === 'finished') break;
    }
  }
  damage(p, amount, attacker, weapon, headshot = false) {
    if (
      !['playing', 'overtime'].includes(this.phase) ||
      p.hp <= 0 ||
      p.protected > 0
    )
      return 0;
    amount = clamp(Math.round(amount), 0, 999);
    const dealt = Math.min(p.hp, amount);
    p.hp -= dealt;
    if (attacker && attacker !== p.id) p.lastAttacker = attacker;
    this.emit('hit', {
      victim: p.id,
      player: attacker,
      amount: dealt,
      headshot,
      x: p.x,
      y: p.y + 1.8,
      z: p.z,
    });
    if (p.hp > 0) return dealt;
    p.deaths++;
    p.streak = 0;
    p.respawn = RULES.respawn;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.burst = 0;
    p.reload = 0;
    const killer = this.players.get(attacker);
    if (killer && killer.id !== p.id) {
      killer.score++;
      killer.streak++;
      killer.ammo.rifle = Math.min(
        WEAPONS.rifle.magazine,
        killer.ammo.rifle + Math.ceil(WEAPONS.rifle.magazine / 2),
      );
    }
    this.emit('kill', {
      player: killer?.id ?? null,
      victim: p.id,
      killer: killer?.name ?? 'ARENA',
      victimName: p.name,
      weapon,
    });
    if (killer && killer.id !== p.id) {
      if (killer.score >= RULES.scoreLimit || this.phase === 'overtime')
        this.finish(killer);
      else if (killer.score === RULES.scoreLimit - 1)
        this.emit('message', { text: 'ONE KILL LEFT!' });
    }
    return dealt;
  }
  respawn(p) {
    const enemy = [...this.players.values()].find((o) => o.id !== p.id);
    const spawns = [...MAP.spawns].sort(
      (a, b) =>
        Math.hypot(b.x - (enemy?.x || 0), b.z - (enemy?.z || 0)) -
        Math.hypot(a.x - (enemy?.x || 0), a.z - (enemy?.z || 0)),
    );
    Object.assign(p, {
      ...spawns[0],
      pitch: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      hp: GUNNER.health,
      protected: RULES.protection,
      respawn: 0,
      rollCooldown: 0,
      rollTime: 0,
      slideTime: 0,
      grounded: true,
      weapon: 'rifle',
      ammo: {
        rifle: WEAPONS.rifle.magazine,
        grenade: WEAPONS.grenade.magazine,
      },
      reload: 0,
      fireCooldown: 0,
      burst: 0,
      crouching: false,
      wasCrouching: false,
      life: p.life + 1,
      lastAttacker: null,
    });
    this.emit('respawn', { player: p.id });
  }
  finish(p) {
    this.phase = 'finished';
    this.winner = p.id;
    this.grenades = [];
    this.emit('finished', { player: p.id, name: p.name });
  }
  snapshot(after = 0) {
    return {
      time: this.time,
      round: this.round,
      phase: this.phase,
      countdown: this.countdown,
      timer: this.timer,
      winner: this.winner,
      players: [...this.players.values()].map((p) => ({
        ...p,
        ammo: { ...p.ammo },
      })),
      grenades: this.grenades.map((g) => ({ ...g })),
      events: this.events.filter((e) => e.id > after),
    };
  }
}
// A practice-only sparring bot. Same movement, weapons, cooldowns and damage rules.
export function botInput(match, id) {
  const p = match.players.get(id),
    target = [...match.players.values()].find((q) => q.id !== id);
  if (!p || !target) return neutralInput();
  const dx = target.x - p.x,
    dz = target.z - p.z,
    dist = Math.hypot(dx, dz);
  const aimYaw = Math.atan2(-dx, -dz),
    aimPitch = Math.atan2(target.y - p.y - 0.12, dist);
  const yaw = aimYaw + Math.sin(match.time * 2.1) * 0.065;
  const dir = direction(yaw, aimPitch),
    origin = { x: p.x, y: p.y + GUNNER.eye, z: p.z };
  const sees = worldRay(origin, dir, dist) >= dist - 0.5;
  let x = Math.sin(match.time * 0.8) > 0.1 ? 0.8 : -0.8,
    z = dist > 13 ? -1 : dist < 7 ? 0.7 : 0;
  if (!sees) {
    x = Math.sin(match.time * 0.4) > 0 ? 1 : -1;
    z = -1;
  }
  const active = target.hp > 0;
  return {
    seq: p.seq + 1,
    x,
    z,
    yaw,
    pitch: clamp(aimPitch, -1.4, 1.4),
    jump: !sees && Math.floor(match.time * 60) % 80 === 0,
    roll: dist < 12 && Math.floor(match.time * 60) % 320 === 0,
    crouch: false,
    fire: active && sees && Math.sin(match.time * 1.6) > 0.05,
    alt: false,
    reload: p.ammo.rifle === 0,
    weapon: 1,
  };
}

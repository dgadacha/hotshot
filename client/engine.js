import * as THREE from 'three';
import { createScene } from './scene.js';
import { makeGunner, makeViewWeapon } from './models.js';
import { createWeaponAssets } from './weapon-assets.js';
import { AudioEngine } from './audio.js';
import { Effects } from './effects.js';
import { GUNNER, WEAPONS } from '../shared/config.js';
import {
  DT,
  clamp,
  neutralInput,
  movePlayer,
  cloneMovement,
} from '../shared/physics.js';
import { Match, botInput } from '../shared/simulation.js';
export class Game {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.world = createScene(container);
    this.audio = new AudioEngine();
    this.effects = new Effects(this.world);
    this.weaponAssets = createWeaponAssets();
    this.gun = makeViewWeapon(this.world, this.weaponAssets);
    this.gun.group.visible = false;
    this.mode = 'menu';
    this.keys = new Set();
    this.edges = {};
    this.mouse = { fire: false, alt: false };
    this.yaw = 0;
    this.pitch = 0;
    this.seq = 0;
    this.pending = [];
    this.remote = new Map();
    this.projectiles = new Map();
    this.frames = [];
    this.local = null;
    this.snapshot = null;
    this.socket = null;
    this.match = null;
    this.eventId = 0;
    this.accumulator = 0;
    this.lastTime = 0;
    this.hudTime = 0;
    this.kick = 0;
    this.hit = 0;
    this.hurt = 0;
    this.flash = 0;
    this.message = '';
    this.messageTimer = 0;
    this.feed = '';
    this.feedTimer = 0;
    this.comic = { text: '', tone: 'shot', id: 0 };
    this.comicTimer = 0;
    this.comicCooldown = 0;
    this.comicPriority = 0;
    this.wasRolling = false;
    this.paused = false;
    this.correction = new THREE.Vector3();
    this.previewCooldown = 0;
    this.previewBurst = 0;
    this.abort = new AbortController();
    this.damageNumbers = true;
    this.ignoreClose = false;
    const on = (target, type, handler, options = {}) =>
      target.addEventListener(type, handler, {
        ...options,
        signal: this.abort.signal,
      });
    on(document, 'keydown', (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (!this.locked()) return;
      if (
        [
          'Space',
          'Tab',
          'ControlLeft',
          'ControlRight',
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'KeyZ',
          'KeyQ',
          'Digit1',
          'Digit2',
        ].includes(e.code)
      )
        e.preventDefault();
      if (!this.keys.has(e.code)) {
        if (e.code === 'Space') this.edges.jump = true;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight')
          this.edges.roll = true;
        if (e.code === 'KeyR') this.edges.reload = true;
        if (e.code === 'Digit1') this.edges.weapon = 1;
        if (e.code === 'Digit2') this.edges.weapon = 2;
      }
      this.keys.add(e.code);
    });
    on(document, 'keyup', (e) => this.keys.delete(e.code));
    on(document, 'mousemove', (e) => {
      if (this.locked() && this.local?.hp > 0) {
        this.yaw -= e.movementX * 0.0021;
        this.pitch = clamp(this.pitch - e.movementY * 0.0021, -1.48, 1.48);
      }
    });
    on(document, 'mousedown', (e) => {
      if (!this.locked()) return;
      if (e.button === 0) this.mouse.fire = true;
      if (e.button === 2) this.mouse.alt = true;
    });
    on(document, 'mouseup', (e) => {
      if (e.button === 0) this.mouse.fire = false;
      if (e.button === 2) this.mouse.alt = false;
    });
    on(container, 'contextmenu', (e) => e.preventDefault());
    on(document, 'contextmenu', (e) => {
      if (this.mode !== 'menu') e.preventDefault();
    });
    on(
      document,
      'wheel',
      (e) => {
        if (this.locked()) {
          e.preventDefault();
          this.edges.weapon = this.local?.weapon === 'rifle' ? 2 : 1;
        }
      },
      { passive: false },
    );
    on(document, 'pointerlockchange', () => {
      if (this.mode === 'menu') return;
      this.paused = !this.locked();
      this.clearInput();
      this.callbacks.onPause(this.paused);
    });
    on(document, 'pointerlockerror', () => {
      this.paused = true;
      this.callbacks.onPause(true);
      this.callbacks.onError(
        'Clique sur Reprendre pour capturer la souris. Si nécessaire, ouvre le jeu dans Chrome.',
      );
    });
    on(window, 'blur', () => {
      this.clearInput();
      if (this.mode !== 'menu') {
        this.paused = true;
        this.callbacks.onPause(true);
      }
    });
    on(document, 'visibilitychange', () => {
      this.lastTime = 0;
      this.accumulator = 0;
      if (document.hidden) this.clearInput();
    });
    this.world.renderer.setAnimationLoop((t) => this.frame(t / 1000));
  }
  defaultServer() {
    const local =
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(location.hostname);
    return local
      ? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:3001`
      : '';
  }
  locked() {
    return document.pointerLockElement === this.world.renderer.domElement;
  }
  clearInput() {
    this.keys.clear();
    this.edges = {};
    this.mouse = { fire: false, alt: false };
  }
  resume() {
    if (this.mode === 'menu') return;
    this.audio.unlock();
    const request = this.world.renderer.domElement.requestPointerLock();
    request?.catch?.(() => {
      this.paused = true;
      this.callbacks.onPause(true);
    });
  }
  async start(kind, { name, code, server }) {
    this.leave();
    this.mode = kind;
    this.seq = 0;
    this.eventId = 0;
    this.frames = [];
    this.pending = [];
    this.correction.set(0, 0, 0);
    this.clearInput();
    this.audio.unlock();
    this.paused = false;
    this.ignoreClose = false;
    if (kind === 'practice') {
      this.id = 'local';
      this.match = new Match({ bot: true });
      this.match.addPlayer(this.id, name);
      this.match.addPlayer('bot', 'SCRAP BOT');
      this.accept(this.match.snapshot());
      this.resume();
      return;
    }
    let address;
    try {
      address = new URL(server);
      if (!['ws:', 'wss:'].includes(address.protocol)) throw new Error();
    } catch {
      this.mode = 'menu';
      throw new Error(
        'Indique une adresse de serveur ws:// ou wss://. L’entraînement fonctionne sans serveur.',
      );
    }
    if (location.protocol === 'https:' && address.protocol !== 'wss:') {
      this.mode = 'menu';
      throw new Error(
        'Cette page HTTPS nécessite un serveur wss://. En local, ouvre http://localhost:5173.',
      );
    }
    this.resume();
    try {
      await new Promise((resolve, reject) => {
        const socket = new WebSocket(address.href);
        this.socket = socket;
        let joined = false;
        let settled = false;
        const fail = (message) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(new Error(message));
          socket.close();
        };
        const timer = setTimeout(
          () =>
            fail(
              'Le serveur ne répond pas. Vérifie son adresse et qu’il est lancé.',
            ),
          8000,
        );
        socket.onopen = () =>
          socket.send(JSON.stringify({ type: kind, name, code }));
        socket.onerror = () => {
          if (!joined)
            fail(
              'Connexion impossible. Lance le serveur de duel ou utilise Entraînement.',
            );
        };
        socket.onmessage = (event) => {
          let d;
          try {
            d = JSON.parse(event.data);
          } catch {
            return;
          }
          if (d.type === 'ping') {
            this.send({ type: 'pong', nonce: d.nonce });
            return;
          }
          if (d.type === 'joined') {
            this.id = d.id;
            this.room = d.code;
            joined = true;
            settled = true;
            clearTimeout(timer);
            resolve();
            return;
          }
          if (d.type === 'error') {
            if (!joined) fail(d.message);
            else this.callbacks.onError(d.message);
            return;
          }
          if (d.type === 'snapshot') {
            this.accept(d);
            return;
          }
        };
        socket.onclose = () => {
          clearTimeout(timer);
          if (this.socket !== socket) return;
          if (!joined) {
            fail('Connexion au serveur interrompue.');
            return;
          }
          if (!this.ignoreClose && this.mode !== 'menu') {
            this.paused = true;
            document.exitPointerLock?.();
            this.callbacks.onPause(true);
            this.callbacks.onError(
              'Connexion perdue. Retourne au menu pour rejoindre un duel.',
            );
          }
        };
      });
    } catch (e) {
      this.leave();
      throw e;
    }
  }
  send(data) {
    if (this.socket?.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify(data));
  }
  leave() {
    this.ignoreClose = true;
    this.send({ type: 'leave' });
    this.socket?.close();
    this.socket = null;
    this.mode = 'menu';
    this.match = null;
    this.local = null;
    this.snapshot = null;
    this.pending = [];
    this.frames = [];
    this.message = '';
    this.feed = '';
    this.hit = 0;
    this.hurt = 0;
    this.comicTimer = 0;
    this.comicCooldown = 0;
    this.wasRolling = false;
    this.paused = false;
    this.clearInput();
    this.room = '';
    this.gun.group.visible = false;
    for (const object of this.remote.values()) {
      object.dispose();
    }
    this.remote.clear();
    for (const mesh of this.projectiles.values()) {
      this.world.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.projectiles.clear();
    this.effects.update(10);
    if (this.locked()) document.exitPointerLock();
  }
  rematch() {
    if (this.match) {
      this.match.voteRematch(this.id);
      this.accept(this.match.snapshot(this.eventId));
      this.resume();
    } else {
      this.send({ type: 'rematch' });
      this.message = 'EN ATTENTE DE LA REVANCHE';
      this.messageTimer = 5;
      this.resume();
    }
  }
  status() {
    return {
      mode: this.mode,
      phase: this.snapshot?.phase ?? 'menu',
      health: this.local?.hp ?? null,
      score:
        this.snapshot?.players.map((p) => ({
          score: p.score,
          self: p.id === this.id,
        })) ?? [],
      weapon: this.local?.weapon ?? null,
      rifleAsset: this.weaponAssets.status,
    };
  }
  setMuted(muted) {
    this.audio.setMuted(muted);
  }
  input() {
    const input = neutralInput(++this.seq);
    input.yaw = this.yaw;
    input.pitch = this.pitch;
    if (this.locked() && !this.paused) {
      input.x =
        Number(this.keys.has('KeyD')) -
        Number(this.keys.has('KeyA') || this.keys.has('KeyQ'));
      input.z =
        Number(this.keys.has('KeyS')) -
        Number(this.keys.has('KeyW') || this.keys.has('KeyZ'));
      input.crouch =
        this.keys.has('ControlLeft') ||
        this.keys.has('ControlRight') ||
        this.keys.has('KeyC');
      Object.assign(input, this.edges, this.mouse);
    }
    this.edges = {};
    return input;
  }
  tick() {
    if (this.mode === 'menu' || !this.local) return;
    if (this.mode === 'practice' && this.paused) return;
    const i = this.input();
    if (this.mode === 'practice') {
      this.match.step(
        new Map([
          [this.id, i],
          ['bot', botInput(this.match, 'bot')],
        ]),
      );
      this.accept(this.match.snapshot(this.eventId));
    } else {
      this.send({ type: 'input', input: i });
      if (
        ['playing', 'overtime'].includes(this.snapshot?.phase) &&
        this.local.hp > 0
      ) {
        this.pending.push(i);
        if (this.pending.length > 120) this.pending.shift();
        movePlayer(this.local, i);
      }
      this.predictedFeedback(i);
    }
  }
  predictedFeedback(i) {
    this.previewCooldown =
      this.previewCooldown <= DT + 1e-6 ? 0 : this.previewCooldown - DT;
    if (
      !this.local ||
      this.local.hp <= 0 ||
      !['playing', 'overtime'].includes(this.snapshot?.phase)
    )
      return;
    if (i.roll && this.local.rollTime > 0) this.audio.roll();
    if (this.local.reload > 0 || i.reload || i.weapon) {
      this.previewBurst = 0;
      return;
    }
    const weapon = this.local.weapon,
      w = WEAPONS[weapon];
    if (this.previewCooldown > 0 || this.local.ammo[weapon] <= 0) return;
    if (weapon === 'rifle' && i.alt && this.previewBurst === 0)
      this.previewBurst = 3;
    if (i.fire || this.previewBurst > 0) {
      this.fireFeedback(weapon);
      if (this.previewBurst) {
        this.previewBurst--;
        this.previewCooldown = this.previewBurst
          ? w.burstInterval
          : w.burstDelay;
      } else this.previewCooldown = w.interval;
    }
  }
  fireFeedback(weapon) {
    this.kick = Math.min(1.6, this.kick + (weapon === 'grenade' ? 0.9 : 0.5));
    this.flash = 0.055;
    this.audio.shot(weapon === 'grenade');
    this.comicBeat(weapon === 'grenade' ? 'THOOM!' : 'BAM!', 'shot', 0);
  }
  comicBeat(text, tone, priority = 1) {
    if (this.comicCooldown > 0 && priority <= this.comicPriority) return;
    this.comic = { text, tone, id: this.comic.id + 1 };
    this.comicPriority = priority;
    this.comicTimer = priority > 1 ? 0.85 : 0.5;
    this.comicCooldown = priority > 1 ? 1 : 0.7;
  }
  accept(snapshot) {
    const before = this.local,
      authoritative = snapshot.players.find((p) => p.id === this.id);
    if (!authoritative) return;
    const newLife = !before || before.life !== authoritative.life;
    const changedPhase = this.snapshot?.phase !== snapshot.phase;
    this.snapshot = snapshot;
    this.frames.push({ at: performance.now() / 1000, snapshot });
    while (this.frames.length > 12) this.frames.shift();
    this.local = cloneMovement(authoritative);
    if (newLife) {
      this.pending = [];
      this.yaw = this.local.yaw;
      this.pitch = this.local.pitch;
      this.correction.set(0, 0, 0);
      this.previewCooldown = 0;
      this.previewBurst = 0;
      this.hit = 0;
      this.hurt = 0;
    } else if (this.mode !== 'practice') {
      this.pending = this.pending.filter((i) => i.seq > authoritative.seq);
      if (
        authoritative.hp > 0 &&
        ['playing', 'overtime'].includes(snapshot.phase)
      )
        for (const i of this.pending) movePlayer(this.local, i);
      if (before && authoritative.hp > 0) {
        const difference = new THREE.Vector3(
          before.x - this.local.x,
          before.y - this.local.y,
          before.z - this.local.z,
        );
        if (difference.length() < 3) this.correction.add(difference);
        else this.correction.set(0, 0, 0);
      }
    }
    for (const e of snapshot.events || []) {
      if (e.id <= this.eventId) continue;
      this.eventId = e.id;
      this.event(e);
    }
    if (changedPhase) {
      if (snapshot.phase === 'finished' && this.locked())
        document.exitPointerLock();
      if (
        snapshot.phase === 'countdown' &&
        this.mode !== 'practice' &&
        !this.locked()
      ) {
        this.paused = true;
        this.callbacks.onPause(true);
      }
      if (snapshot.phase === 'waiting' && this.locked())
        document.exitPointerLock();
    }
    if (snapshot.phase === 'waiting') {
      this.paused = false;
      this.callbacks.onPause(false);
    }
  }
  event(e) {
    if (e.type === 'shot') {
      if (e.player === this.id) {
        if (this.mode === 'practice') this.fireFeedback(e.weapon);
      } else this.audio.shot(e.weapon === 'grenade', true);
      if (e.weapon === 'rifle') {
        this.effects.trace(e.origin, e.end);
        this.effects.burst(e.end, 6);
      }
    }
    if (e.type === 'explosion') {
      this.effects.burst(e, 40, true);
      this.audio.explosion();
      if (
        this.local &&
        Math.hypot(this.local.x - e.x, this.local.z - e.z) < 8
      ) {
        this.kick = Math.min(1.5, this.kick + 0.7);
        this.comicBeat('BOOM!', 'boom', 2);
      }
    }
    if (e.type === 'hit') {
      if (e.player === this.id && e.victim !== this.id) {
        this.hit = 0.14;
        this.audio.hit(e.headshot);
        if (this.damageNumbers) this.effects.label(e);
        if (e.headshot) this.comicBeat('HEADSHOT!', 'hit', 2);
      }
      if (e.victim === this.id) {
        this.hurt = 0.5;
        this.kick += 0.2;
      }
    }
    if (e.type === 'reload' && e.player === this.id) {
      this.audio.reload();
      this.comicBeat('CLACK!', 'reload');
    }
    if (e.type === 'reload_done' && e.player === this.id)
      this.audio.tone(270, 0.08, 'triangle', 0.15);
    if (e.type === 'kill') {
      this.feed = `${e.killer}  /  ${e.weapon}  /  ${e.victimName}`;
      this.feedTimer = 4;
      if (e.player === this.id && e.victim !== this.id) {
        this.audio.kill();
        this.message =
          this.local.score === 1 ? 'PREMIER K.O. !' : 'BIEN JOUÉ !';
        this.messageTimer = 1.5;
        this.comicBeat('K.O.!', 'hit', 3);
      }
    }
    if (e.type === 'message') {
      this.message = e.text;
      this.messageTimer = 2;
    }
  }
  frame(now) {
    const dt = this.lastTime ? Math.min(0.05, now - this.lastTime) : 0;
    this.lastTime = now;
    this.accumulator += dt;
    while (this.accumulator >= DT) {
      this.accumulator -= DT;
      this.tick();
    }
    if (this.mode === 'menu') {
      this.world.lobby(now);
      return;
    }
    if (!this.local || !this.snapshot) return;
    this.kick *= Math.exp(-dt * 18);
    this.hit = Math.max(0, this.hit - dt);
    this.hurt = Math.max(0, this.hurt - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.comicTimer = Math.max(0, this.comicTimer - dt);
    this.comicCooldown = Math.max(0, this.comicCooldown - dt);
    this.messageTimer -= dt;
    this.feedTimer -= dt;
    this.correction.multiplyScalar(Math.exp(-dt * 14));
    this.effects.update(dt);
    const p = this.local,
      camera = this.world.camera;
    const rolling = p.hp > 0 && p.rollTime > 0;
    if (rolling && !this.wasRolling) this.comicBeat('WHOOSH!', 'roll', 2);
    this.wasRolling = rolling;
    const speed = Math.hypot(p.vx, p.vz),
      bob = p.grounded
        ? Math.sin(now * speed * 1.15) * Math.min(speed * 0.0025, 0.03)
        : 0;
    const eye = p.crouching ? 1 : GUNNER.eye;
    camera.position.set(
      p.x + this.correction.x,
      p.y + eye + this.correction.y + bob,
      p.z + this.correction.z,
    );
    camera.rotation.set(
      this.pitch + this.kick * 0.016,
      this.yaw,
      p.rollTime > 0
        ? Math.sin((p.rollTime / GUNNER.rollDuration) * Math.PI) * 0.1
        : 0,
      'YXZ',
    );
    camera.fov = THREE.MathUtils.lerp(
      camera.fov,
      83 + (p.rollTime > 0 ? 9 : p.slideTime > 0 ? 5 : 0),
      1 - Math.exp(-dt * 8),
    );
    camera.updateProjectionMatrix();
    if (p.hp <= 0) {
      const enemy = this.snapshot.players.find((q) => q.id !== this.id);
      if (enemy) camera.lookAt(enemy.x, enemy.y + 1.2, enemy.z);
    }
    this.renderOpponents(now);
    this.renderGrenades(dt);
    this.gun.group.visible =
      p.hp > 0 &&
      this.snapshot.phase !== 'waiting' &&
      this.snapshot.phase !== 'finished';
    const reloadRatio =
      p.reload > 0
        ? Math.sin((p.reload / WEAPONS[p.weapon].reload) * Math.PI)
        : 0;
    this.gun.group.position.set(
      0.32 + Math.cos(now * speed * 0.55) * 0.006,
      -0.3 - bob * 0.6 - reloadRatio * 0.22,
      -0.18 + this.kick * 0.08,
    );
    this.gun.group.rotation.set(
      this.kick * 0.08 - reloadRatio * 0.25,
      0,
      -reloadRatio * 0.8,
    );
    this.gun.rifle.visible = p.weapon === 'rifle';
    this.gun.grenade.visible = p.weapon === 'grenade';
    this.gun.flash.visible = this.flash > 0;
    this.gun.flash.position.set(
      p.weapon === 'rifle' ? -0.012 : 0,
      p.weapon === 'rifle' ? 0.064 : 0,
      p.weapon === 'rifle' ? -1.21 : -1.23,
    );
    this.gun.flash.rotation.z = now * 40;
    this.gun.flash.scale.setScalar(0.8 + Math.random() * 0.3);
    this.gun.drum.rotation.x += this.kick * dt * 3;
    this.world.renderGame();
    this.hudTime += dt;
    if (this.hudTime > 0.05) {
      this.hudTime = 0;
      this.updateHUD();
    }
  }
  renderOpponents(now) {
    let a = this.frames[0],
      b = this.frames.at(-1);
    const target = now - 0.1;
    for (let i = 0; i < this.frames.length - 1; i++)
      if (this.frames[i].at <= target && this.frames[i + 1].at >= target) {
        a = this.frames[i];
        b = this.frames[i + 1];
        break;
      }
    const blend =
      a && b ? clamp((target - a.at) / Math.max(0.001, b.at - a.at), 0, 1) : 1;
    const ids = new Set();
    for (const p of this.snapshot.players) {
      if (p.id === this.id) continue;
      ids.add(p.id);
      let model = this.remote.get(p.id);
      if (!model) {
        model = makeGunner(this.world, 1, this.weaponAssets);
        this.remote.set(p.id, model);
      }
      const old =
          a?.snapshot.players.find((q) => q.id === p.id && q.life === p.life) ||
          p,
        next =
          b?.snapshot.players.find((q) => q.id === p.id && q.life === p.life) ||
          p;
      model.group.position.set(
        THREE.MathUtils.lerp(old.x, next.x, blend),
        THREE.MathUtils.lerp(old.y, next.y, blend),
        THREE.MathUtils.lerp(old.z, next.z, blend),
      );
      model.group.rotation.y = p.yaw;
      model.group.visible = p.hp > 0;
      model.group.scale.y = p.crouching ? 0.63 : 1;
      model.shield.visible = p.protected > 0;
      model.updateWeapon(p.weapon);
      const speed = Math.hypot(p.vx, p.vz);
      model.legs.forEach(
        (leg, i) =>
          (leg.rotation.x =
            Math.sin(now * 12 + i * Math.PI) * Math.min(0.5, speed * 0.06)),
      );
    }
    for (const [id, m] of this.remote)
      if (!ids.has(id)) {
        m.dispose();
        this.remote.delete(id);
      }
  }
  renderGrenades(dt) {
    const ids = new Set();
    for (const g of this.snapshot.grenades) {
      ids.add(g.id);
      let mesh = this.projectiles.get(g.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.16, 0),
          this.world.mat(0xffe234),
        );
        mesh.position.set(g.x, g.y, g.z);
        this.world.scene.add(mesh);
        this.projectiles.set(g.id, mesh);
      }
      mesh.position.lerp(
        new THREE.Vector3(g.x, g.y, g.z),
        Math.min(1, dt * 30),
      );
      mesh.rotation.x += dt * 7;
      mesh.scale.setScalar(1 + Math.sin(g.fuse * 20) * 0.15);
    }
    for (const [id, m] of this.projectiles)
      if (!ids.has(id)) {
        this.world.scene.remove(m);
        m.geometry.dispose();
        this.projectiles.delete(id);
      }
  }
  updateHUD() {
    const p = this.local,
      s = this.snapshot;
    if (!p || !s) return;
    const enemy = s.players.find((q) => q.id !== this.id),
      w = WEAPONS[p.weapon];
    this.callbacks.onHUD({
      hp: p.hp,
      ammo: p.ammo[p.weapon],
      reserve: w.magazine,
      weapon: w.name,
      weaponKey: p.weapon,
      score: [p.score, enemy?.score || 0],
      timer: s.timer,
      phase: s.phase,
      countdown: s.countdown,
      roll: p.rollCooldown,
      reload: p.reload,
      respawn: p.respawn,
      message: this.messageTimer > 0 ? this.message : '',
      feed: this.feedTimer > 0 ? this.feed : '',
      hit: this.hit,
      hurt: this.hurt,
      comic: this.comicTimer > 0 ? this.comic : null,
      speedLines: p.hp > 0 && (p.rollTime > 0 || p.slideTime > 0),
      kills: p.score,
      room: this.room || '',
      ping: s.ping || 0,
      connected:
        this.mode === 'practice' || this.socket?.readyState === WebSocket.OPEN,
    });
  }
  dispose() {
    this.leave();
    this.abort.abort();
    this.audio.dispose();
    this.effects.dispose();
    this.weaponAssets.dispose();
    this.world.dispose();
  }
}

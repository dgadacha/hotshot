import * as THREE from 'three';
import { COMIC } from './toon.js';
export class Effects {
  constructor(world) {
    this.world = world;
    this.particles = [];
    this.traces = [];
    this.labels = [];
    this.rings = [];
    this.ringGeometry = new THREE.RingGeometry(0.84, 1, 24);
    this.geometry = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    this.materials = [COMIC.yellow, COMIC.pink, COMIC.cyan, COMIC.violet].map(
      (color) => new THREE.MeshBasicMaterial({ color }),
    );
  }
  burst(pos, count = 12, explosion = false) {
    if (explosion) {
      this.word('BOOM!', pos, '#ffe234', 2.8, 0.75, true);
      const ring = new THREE.Mesh(
        this.ringGeometry,
        new THREE.MeshBasicMaterial({
          color: COMIC.pink,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
        }),
      );
      ring.position.set(pos.x, pos.y + 0.1, pos.z);
      ring.rotation.x = -Math.PI / 2;
      this.world.scene.add(ring);
      this.rings.push({ mesh: ring, life: 0.4 });
    }
    for (let i = 0; i < count && this.particles.length < 160; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.materials[i % 4]);
      mesh.position.set(pos.x, pos.y, pos.z);
      const speed = explosion ? 10 : 3;
      mesh.scale.setScalar(explosion ? 1 + Math.random() * 3 : 1);
      this.world.scene.add(mesh);
      this.particles.push({
        mesh,
        v: new THREE.Vector3(
          (Math.random() - 0.5) * speed,
          Math.random() * speed * 0.7,
          (Math.random() - 0.5) * speed,
        ),
        life: explosion
          ? 0.5 + Math.random() * 0.3
          : 0.18 + Math.random() * 0.2,
      });
    }
  }
  trace(a, b, color = COMIC.yellow) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x, a.y, a.z),
      new THREE.Vector3(b.x, b.y, b.z),
    ]);
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }),
    );
    this.world.scene.add(line);
    this.traces.push({ line, life: 0.07 });
  }
  label(e) {
    this.word(
      `${e.amount}${e.headshot ? '!' : ''}`,
      e,
      e.headshot ? '#ffe234' : '#fffdf5',
      1.15,
      0.65,
    );
  }
  word(text, pos, color, width, life, burst = false) {
    if (this.labels.length >= 16) return;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (burst) {
      ctx.beginPath();
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI) / 12,
          r = i % 2 ? 0.67 : 1;
        const x = 256 + Math.cos(angle) * 248 * r;
        const y = 128 + Math.sin(angle) * 118 * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#ff3c91';
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#15122b';
      ctx.stroke();
    }
    ctx.font = `italic 900 ${burst ? 112 : 152}px Impact, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#15122b';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 14;
    ctx.strokeText(text, 256, 136);
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 136);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: burst,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(pos.x, pos.y + (burst ? 0.8 : 0.3), pos.z);
    sprite.scale.set(width, width / 2, 1);
    this.world.scene.add(sprite);
    this.labels.push({ sprite, life });
  }
  update(dt) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.life -= dt;
      ring.mesh.scale.setScalar(0.4 + (0.4 - ring.life) * 12);
      ring.mesh.material.opacity = Math.max(0, ring.life / 0.4);
      if (ring.life <= 0) {
        ring.mesh.removeFromParent();
        ring.mesh.material.dispose();
        this.rings.splice(i, 1);
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.v.y -= 12 * dt;
      p.mesh.position.addScaledVector(p.v, dt);
      p.mesh.rotation.x += dt * 9;
      if (p.life <= 0) {
        this.world.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
    for (let i = this.traces.length - 1; i >= 0; i--) {
      const p = this.traces[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.world.scene.remove(p.line);
        p.line.geometry.dispose();
        p.line.material.dispose();
        this.traces.splice(i, 1);
      }
    }
    for (let i = this.labels.length - 1; i >= 0; i--) {
      const p = this.labels[i];
      p.life -= dt;
      p.sprite.position.y += dt;
      p.sprite.material.opacity = Math.min(1, p.life * 3);
      if (p.life <= 0) {
        this.world.scene.remove(p.sprite);
        p.sprite.material.map.dispose();
        p.sprite.material.dispose();
        this.labels.splice(i, 1);
      }
    }
  }
  dispose() {
    this.update(10);
    this.geometry.dispose();
    this.ringGeometry.dispose();
    this.materials.forEach((m) => m.dispose());
  }
}

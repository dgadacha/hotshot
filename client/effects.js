import * as THREE from 'three';
export class Effects {
  constructor(world) {
    this.world = world;
    this.particles = [];
    this.traces = [];
    this.labels = [];
    this.geometry = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    this.materials = [0xffca45, 0xff7c34, 0xd1d3b5, 0x8faaa3].map(
      (color) => new THREE.MeshBasicMaterial({ color }),
    );
  }
  burst(pos, count = 12, explosion = false) {
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
  trace(a, b, color = 0xffd472) {
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
    if (this.labels.length > 15) return;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#17323b';
    ctx.lineWidth = 7;
    ctx.strokeText(`${e.amount}${e.headshot ? '!' : ''}`, 64, 47);
    ctx.fillStyle = e.headshot ? '#ffc342' : '#f5f3d8';
    ctx.fillText(`${e.amount}${e.headshot ? '!' : ''}`, 64, 47);
    const material = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(e.x + (Math.random() - 0.5) * 0.5, e.y + 0.3, e.z);
    sprite.scale.set(1.15, 0.58, 1);
    this.world.scene.add(sprite);
    this.labels.push({ sprite, life: 0.65 });
  }
  update(dt) {
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
    this.materials.forEach((m) => m.dispose());
  }
}

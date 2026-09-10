export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  unlock() {
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context) {
        this.ctx = new Context();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
    }
    this.ctx?.resume().catch(() => {});
  }
  setMuted(value) {
    this.muted = value;
    if (this.master) this.master.gain.value = value ? 0 : 0.3;
  }
  tone(frequency, duration = 0.12, type = 'square', gain = 0.2, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(frequency, t);
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(20, slide),
        t + duration,
      );
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  noise(duration, gain = 0.4, cutoff = 2000) {
    if (!this.ctx || this.muted) return;
    const count = Math.ceil(this.ctx.sampleRate * duration),
      buffer = this.ctx.createBuffer(1, count, this.ctx.sampleRate),
      data = buffer.getChannelData(0);
    for (let i = 0; i < count; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / count, 2);
    const source = this.ctx.createBufferSource(),
      filter = this.ctx.createBiquadFilter(),
      volume = this.ctx.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    volume.gain.value = gain;
    source.connect(filter);
    filter.connect(volume);
    volume.connect(this.master);
    source.start();
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      volume.disconnect();
    };
  }
  shot(grenade = false, distant = false) {
    const gain = distant ? 0.13 : 0.45;
    this.noise(grenade ? 0.23 : 0.105, gain, grenade ? 700 : 2800);
    this.tone(grenade ? 150 : 220, grenade ? 0.22 : 0.09, 'sawtooth', gain, 50);
  }
  explosion() {
    this.noise(0.55, 0.75, 1100);
    this.tone(100, 0.5, 'sine', 0.8, 25);
  }
  hit(head = false) {
    this.tone(head ? 1300 : 880, 0.07, 'sine', 0.25);
  }
  kill() {
    this.tone(590, 0.18, 'triangle', 0.5);
    setTimeout(() => this.tone(990, 0.16, 'triangle', 0.4), 75);
  }
  reload() {
    this.noise(0.07, 0.2, 4000);
    setTimeout(() => this.tone(150, 0.1, 'square', 0.06), 120);
  }
  roll() {
    this.noise(0.3, 0.17, 900);
  }
  dispose() {
    void this.ctx?.close().catch(() => {});
  }
}

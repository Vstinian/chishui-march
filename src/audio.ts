import { opening } from './data/narrative';

// 正式音轨在 opening.bgm 接入；缺省为缓慢包络的合成和弦。
export class Atmosphere {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private track: HTMLAudioElement | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private count = 0;
  muted = false;
  private active = false;
  async start(): Promise<void> {
    this.active = true;
    try {
      if (opening.bgm) {
        this.track ??= new Audio(opening.bgm);
        this.track.loop = true; this.track.volume = 0.24; this.track.muted = this.muted;
        await this.track.play(); return;
      }
    } catch { this.track = null; }
    try {
      this.context ??= new AudioContext(); await this.context.resume();
      if (!this.gain) { this.gain = this.context.createGain(); this.gain.connect(this.context.destination); }
      this.setVolume();
      if (!this.timer) { this.chord(); this.timer = setInterval(() => this.chord(), 3600); }
    } catch { this.muted = true; }
  }
  private chord(): void {
    if (!this.context || !this.gain || !this.active) return;
    const now = this.context.currentTime;
    const notes = [[130.81, 155.56, 196], [116.54, 146.83, 174.61], [103.83, 130.81, 155.56], [98, 130.81, 146.83]][this.count++ % 4];
    for (const frequency of notes) {
      const osc = this.context.createOscillator(); const envelope = this.context.createGain();
      osc.type = 'sine'; osc.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, now); envelope.gain.linearRampToValueAtTime(0.13, now + 1.2); envelope.gain.linearRampToValueAtTime(0, now + 4.4);
      osc.connect(envelope); envelope.connect(this.gain); osc.start(now); osc.stop(now + 4.5);
      osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
    }
  }
  private setVolume(): void { if (this.context && this.gain) this.gain.gain.setTargetAtTime(this.muted || !this.active ? 0 : 0.35, this.context.currentTime, 0.15); }
  toggle(): void { this.muted = !this.muted; if (this.track) this.track.muted = this.muted; this.setVolume(); }
  pause(): void { this.active = false; this.track?.pause(); this.setVolume(); if (this.timer) clearInterval(this.timer); this.timer = null; }
}

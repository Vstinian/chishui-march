import { opening } from './data/narrative';
import { ambientTracks } from './data/transitions';

// 报纸开场音乐独立于章节编排；章节未接入配乐时使用合成和弦。
export class Atmosphere {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private track: HTMLAudioElement | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private count = 0;
  muted = false;
  private active = false;
  private externalMusic = false;
  private openingActive = false;
  private openingEnvelope = 0;
  private openingExit: { delay: number; elapsed: number; from: number | null } | null = null;
  private openingTimer: ReturnType<typeof setInterval> | null = null;
  private musicLevel = 1;
  private ambience: HTMLAudioElement | null = null;
  private ambientLayers = new Map<HTMLAudioElement, number>();
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  startOpening(): Promise<void> {
    if (this.openingTimer) clearInterval(this.openingTimer);
    this.openingActive = true;
    this.openingEnvelope = opening.bgmFadeIn > 0 ? 0 : 1;
    this.openingExit = null;
    if (this.track) this.track.currentTime = 0;
    let clock = Date.now();
    this.openingTimer = setInterval(() => {
      const now = Date.now(), delta = Math.min(.2, (now - clock) / 1000); clock = now;
      if (!this.active || !this.track || this.track.paused || this.track.readyState < 3 || this.track.currentTime <= 0) return;
      const exit = this.openingExit;
      if (exit && exit.delay <= 0) {
        exit.from ??= this.openingEnvelope;
        exit.elapsed += delta;
        this.openingEnvelope = exit.from * Math.max(0, 1 - exit.elapsed / opening.bgmFadeOut);
        if (exit.elapsed >= opening.bgmFadeOut) { this.stopOpening(); return; }
      } else {
        if (exit) exit.delay = Math.max(0, exit.delay - delta);
        this.openingEnvelope = opening.bgmFadeIn > 0 ? Math.min(1, this.openingEnvelope + delta / opening.bgmFadeIn) : 1;
      }
      this.applyOpeningVolume();
    }, 40);
    this.setVolume();
    return this.start();
  }
  fadeOpeningOut(delayMs = 0): void {
    if (!this.openingActive) return;
    if (opening.bgmFadeOut <= 0) { this.stopOpening(); return; }
    this.openingExit = { delay: delayMs / 1000, elapsed: 0, from: null };
  }
  private applyOpeningVolume(): void { if (this.track) this.track.volume = opening.bgmVolume * this.musicLevel * this.openingEnvelope; }
  stopOpening(): void {
    if (!this.openingActive) return;
    this.openingActive = false;
    if (this.openingTimer) clearInterval(this.openingTimer);
    this.openingTimer = null; this.openingExit = null; this.openingEnvelope = 0;
    this.applyOpeningVolume();
    this.track?.pause();
    if (this.track) this.track.currentTime = 0;
    this.setVolume();
  }
  async start(): Promise<void> {
    this.active = true;
    if (this.ambience) { this.ambience.muted = this.muted; void this.ambience.play().catch(() => {}); }
    try {
      if (this.openingActive && opening.bgm) {
        this.track ??= new Audio(opening.bgm);
        this.track.loop = true; this.applyOpeningVolume(); this.track.muted = this.muted;
        await this.track.play(); return;
      }
    } catch (error) { console.warn('开场音乐播放失败', error); return; }
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
  transitionTo(scene: string, level: number, duration: number): void {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const before = this.musicLevel;
    const initial = new Map(this.ambientLayers);
    const url = ambientTracks[scene];
    this.ambience = url ? new Audio(url) : null;
    const incoming = this.ambience;
    if (incoming) {
      incoming.loop = true; incoming.volume = 0; incoming.muted = this.muted;
      this.ambientLayers.set(incoming, 0);
      if (this.active) void incoming.play().catch(() => {});
    }
    const start = Date.now();
    const tick = () => {
      const fraction = duration > 0 ? Math.min(1, (Date.now() - start) / duration) : 1;
      this.musicLevel = before + (level - before) * fraction;
      this.applyOpeningVolume();
      this.setVolume();
      for (const [track, volume] of initial) {
        track.volume = volume * (1 - fraction); this.ambientLayers.set(track, track.volume);
        if (fraction === 1) { track.pause(); this.ambientLayers.delete(track); }
      }
      if (incoming) { incoming.volume = .3 * fraction; this.ambientLayers.set(incoming, incoming.volume); }
      if (fraction === 1 && this.fadeTimer) { clearInterval(this.fadeTimer); this.fadeTimer = null; }
    };
    this.fadeTimer = setInterval(tick, 40); tick();
  }
  setExternalMusic(enabled: boolean): void { this.externalMusic = enabled; if (this.track) this.track.muted = this.muted || (!this.openingActive && enabled); this.setVolume(); }
  private setVolume(): void { if (this.context && this.gain) this.gain.gain.setTargetAtTime(this.muted || !this.active || this.externalMusic || (this.openingActive && opening.bgm) ? 0 : 0.35 * this.musicLevel, this.context.currentTime, 0.15); }
  toggle(): void { this.muted = !this.muted; if (this.track) this.track.muted = this.muted || (!this.openingActive && this.externalMusic); for (const track of this.ambientLayers.keys()) track.muted = this.muted; this.setVolume(); }
  pause(): void { this.active = false; this.track?.pause(); for (const track of this.ambientLayers.keys()) track.pause(); this.setVolume(); if (this.timer) clearInterval(this.timer); this.timer = null; }
}

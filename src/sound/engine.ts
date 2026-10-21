import { defaultSoundConfig, keywordEnd, normalizeSoundText } from './schema';
import type { SoundConfig, SoundCue } from './schema';
interface SoundPosition { actId: string; lineId: string; frame: number; frames: string[]; shown: string }
interface PlayingSound { cue: SoundCue; audio: HTMLAudioElement; delay: number; envelope: number; stopping: number | null; origin: SoundPosition; started: boolean; finished: boolean }
export class CuePlayer {
  config: SoundConfig = defaultSoundConfig();
  private tracks: PlayingSound[] = [];
  private fired = new Set<string>();
  private position: SoundPosition | null = null;
  private paused = false;
  private muted = false;
  private timer: ReturnType<typeof setInterval> | undefined;
  private clock = 0;
  private preloaded = new Map<string, HTMLAudioElement>();
  private lineOrder: Map<string, number>;
  constructor(lineIds: string[] = []) { this.lineOrder = new Map(lineIds.map((id, index) => [id, index])); }
  onActivity: (items: { id: string; bus: string; name: string; time: number; volume: number }[]) => void = () => {};
  onError: (message: string) => void = () => {};
  preloadVoice(lineId: string): void {
    if (typeof Audio === 'undefined') return;
    const paths = this.config.cues.filter(c => c.enabled && c.bus === 'voice' && c.lineId === lineId).slice(0, 2).map(c => c.asset);
    for (const [path, audio] of this.preloaded) if (!paths.includes(path)) { audio.removeAttribute('src'); audio.load(); this.preloaded.delete(path); }
    for (const path of paths) if (!this.preloaded.has(path)) { const audio = new Audio(); audio.preload = 'auto'; audio.src = path; this.preloaded.set(path, audio); }
  }
  configure(config: SoundConfig): void {
    const previousMusic = new Set(this.config.cues.filter(c => c.enabled && c.bus === 'music').map(c => `${c.id}:${c.asset}`));
    this.config = config;
    for (const track of [...this.tracks]) {
      const update = config.cues.find(c => c.id === track.cue.id && c.enabled && c.asset === track.cue.asset);
      if (!update) this.stop(track, true); else { track.cue = { ...update }; track.audio.playbackRate = update.rate; }
    }
    this.applyVolumes();
    // 配置可能晚于首段到达，也可能由编排器在故事中途更新。
    if (this.position) {
      if (config.cues.some(c => c.enabled && c.bus === 'music' && !previousMusic.has(`${c.id}:${c.asset}`))) this.restoreMusic(this.position);
      this.update(this.position);
    }
  }
  update(position: SoundPosition): void {
    const previous = this.position;
    if (previous?.lineId !== position.lineId || previous?.actId !== position.actId) this.fired.clear();
    for (const track of [...this.tracks]) {
      if (track.origin.actId !== position.actId || this.rangeEnded(track.cue, position) || (track.cue.scope === 'line' && track.origin.lineId !== position.lineId) || (track.cue.scope === 'frame' && (track.origin.lineId !== position.lineId || track.origin.frame !== position.frame))) this.stop(track);
    }
    this.position = position;
    const previousIndex = this.lineOrder.get(previous?.lineId ?? '');
    const currentIndex = this.lineOrder.get(position.lineId);
    if (!previous || previous.actId !== position.actId || (previousIndex !== undefined && currentIndex !== undefined && Math.abs(currentIndex - previousIndex) > 1)) this.restoreMusic(position);
    const before = normalizeSoundText(position.frames.slice(0, position.frame).join('')).length;
    const visible = before + normalizeSoundText(position.shown).length;
    for (const cue of this.config.cues) {
      if (!cue.enabled || cue.lineId !== position.lineId || this.fired.has(cue.id) || this.rangeEnded(cue, position)) continue;
      const end = cue.trigger === 'keyword' ? keywordEnd(position.frames.join(''), cue.keyword, cue.occurrence) : -1;
      const ready = cue.trigger === 'line' ? position.frame === 0 : cue.trigger === 'frame' ? position.frame === cue.frame : end > before && end <= visible;
      if (ready) { this.fired.add(cue.id); this.play(cue, position); }
    }
  }
  private restoreMusic(position: SoundPosition): void {
    const current = this.lineOrder.get(position.lineId);
    if (current === undefined) return;
    const visible = normalizeSoundText(position.frames.slice(0, position.frame).join('') + position.shown).length;
    // 只恢复已触发的最后一条音乐，避免重播配音、枪声，或复活被后续音乐替换的旧曲。
    const passed = this.config.cues.filter(cue => {
      const start = this.lineOrder.get(cue.lineId);
      if (!cue.enabled || cue.bus !== 'music' || cue.lineId.split('-')[0] !== position.lineId.split('-')[0] || start === undefined || start > current) return false;
      if (start < current) return true;
      if (cue.trigger === 'line') return true;
      if (cue.trigger === 'frame') return position.frame >= cue.frame;
      const end = keywordEnd(position.frames.join(''), cue.keyword, cue.occurrence);
      return end >= 0 && visible >= end;
    }).sort((a, b) => this.lineOrder.get(a.lineId)! - this.lineOrder.get(b.lineId)!);
    const cue = passed.at(-1);
    if (!cue || (cue.scope !== 'act' && cue.scope !== 'range') || this.rangeEnded(cue, position) || this.fired.has(cue.id)) return;
    if (this.tracks.some(track => track.cue.bus === 'music' && track.stopping === null && !track.finished)) return;
    this.fired.add(cue.id);
    this.play(cue, position);
  }
  private rangeEnded(cue: SoundCue, position: SoundPosition): boolean {
    if (cue.scope !== 'range') return false;
    const current = this.lineOrder.get(position.lineId), start = this.lineOrder.get(cue.lineId), end = this.lineOrder.get(cue.endLineId ?? '');
    // 使用剧本数组的实际顺序；补充稿的段落 ID 不一定递增。
    if (current === undefined || start === undefined || end === undefined || current < start || current > end) return true;
    if (position.lineId !== cue.endLineId || cue.endTrigger !== 'keyword') return false;
    const stopAt = keywordEnd(position.frames.join(''), cue.endKeyword ?? '', cue.endOccurrence ?? 1);
    const visible = normalizeSoundText(position.frames.slice(0, position.frame).join('') + position.shown).length;
    return stopAt >= 0 && visible >= stopAt;
  }
  private play(cue: SoundCue, position: SoundPosition): void {
    if (typeof Audio === 'undefined') return;
    if (cue.bus !== 'sfx') for (const old of [...this.tracks]) if (old.cue.bus === cue.bus) this.stop(old, cue.bus === 'voice');
    if (this.tracks.length >= 24) this.stop(this.tracks[0], true);
    const audio = new Audio(cue.asset);
    audio.preload = 'metadata'; audio.playbackRate = cue.rate; audio.muted = this.muted; audio.volume = 0;
    const track: PlayingSound = { cue: { ...cue }, audio, delay: cue.delay, envelope: cue.fadeIn ? 0 : 1, stopping: null, origin: position, started: false, finished: false };
    audio.addEventListener('error', () => { this.onError(`音频加载失败：${cue.asset}`); this.stop(track, true); });
    audio.addEventListener('ended', () => { if (track.cue.loop && track.stopping === null) { audio.currentTime = track.cue.trimStart; this.resumeAudio(track); } else this.stop(track, true); });
    audio.addEventListener('loadedmetadata', () => {
      if (track.finished) return;
      if (cue.trimStart >= audio.duration) { this.onError(`截取起点超出音频长度：${cue.asset}`); this.stop(track, true); return; }
      audio.currentTime = cue.trimStart;
    });
    this.tracks.push(track);
    if (!this.paused && cue.delay === 0) this.start(track);
    this.ensureTick(); this.applyVolumes();
  }
  private resumeAudio(track: PlayingSound): void {
    if (this.paused || track.finished) return;
    void track.audio.play().catch(error => { if (!track.finished && !this.paused && error?.name !== 'AbortError') { this.onError('浏览器未允许播放，请点击游戏画面或重新试听。'); this.stop(track, true); } });
  }
  private start(track: PlayingSound): void { if (track.finished) return; track.started = true; track.audio.currentTime = track.cue.trimStart; this.resumeAudio(track); }
  private stop(track: PlayingSound, immediately = false): void {
    if (track.finished) return;
    if (!immediately && track.started && track.cue.fadeOut > 0 && track.stopping === null) { track.stopping = track.cue.fadeOut; return; }
    if (!immediately && track.stopping !== null) return;
    track.finished = true; track.audio.pause(); track.audio.removeAttribute('src'); track.audio.load();
    this.tracks = this.tracks.filter(t => t !== track);
  }
  private ensureTick(): void {
    if (this.timer) return;
    this.clock = Date.now();
    this.timer = setInterval(() => {
      const now = Date.now(), delta = Math.min(.2, (now - this.clock) / 1000); this.clock = now;
      if (!this.paused) for (const track of [...this.tracks]) {
        if (track.stopping !== null) {
          track.stopping -= delta;
          track.envelope = Math.min(track.envelope, Math.max(0, track.stopping / track.cue.fadeOut));
          if (track.stopping <= 0) { this.stop(track, true); continue; }
        }
        if (!track.started) { track.delay -= delta; if (track.delay <= 0) this.start(track); continue; }
        if (!track.audio.paused && track.stopping === null) {
          if (track.cue.fadeIn > 0) track.envelope = Math.min(1, track.envelope + delta / track.cue.fadeIn);
          const end = track.cue.trimEnd > 0 ? Math.min(track.cue.trimEnd, track.audio.duration || Infinity) : track.audio.duration;
          if (end && track.audio.currentTime >= end) {
            if (track.cue.loop) { track.audio.currentTime = track.cue.trimStart; }
            else { this.stop(track, true); continue; }
          } else if (!track.cue.loop && end && track.cue.fadeOut) track.envelope = Math.min(track.envelope, Math.max(0, (end - track.audio.currentTime) / (track.cue.fadeOut * track.cue.rate)));
        }
      }
      this.applyVolumes();
      this.onActivity(this.tracks.map(t => ({ id: t.cue.id, bus: t.cue.bus, name: t.cue.asset.split('/').pop()!, time: t.audio.currentTime, volume: t.audio.volume })));
      if (!this.tracks.length) { clearInterval(this.timer); this.timer = undefined; }
    }, 50);
  }
  private applyVolumes(): void {
    const speaking = this.tracks.some(t => t.cue.bus === 'voice' && t.started && !t.audio.paused && !t.finished);
    for (const track of this.tracks) {
      const duck = track.cue.bus === 'music' && speaking ? this.config.mix.ducking : 1;
      track.audio.volume = Math.max(0, Math.min(1, this.config.mix.master * this.config.mix[track.cue.bus] * track.cue.volume * track.envelope * duck));
      track.audio.muted = this.muted;
    }
  }
  setMuted(muted: boolean): void { this.muted = muted; this.applyVolumes(); }
  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    for (const track of this.tracks) if (paused) track.audio.pause(); else if (track.started) this.resumeAudio(track);
  }
  reset(): void { for (const track of [...this.tracks]) this.stop(track, true); this.fired.clear(); this.position = null; for (const audio of this.preloaded.values()) { audio.removeAttribute('src'); audio.load(); } this.preloaded.clear(); clearInterval(this.timer); this.timer = undefined; this.onActivity([]); }
}

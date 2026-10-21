import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { opening } from '../src/data/narrative.ts';

let now = 0;
const timers = new Set(), media = [];
class MockAudio {
  constructor(src) { this.src = src; this.currentTime = 0; this.paused = true; this.readyState = 4; media.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}
const context = { opening, ambientTracks: {}, Audio: MockAudio, console, Date: { now: () => now }, setInterval: fn => { timers.add(fn); return fn; }, clearInterval: fn => timers.delete(fn) };
const source = readFileSync(new URL('../src/audio.ts', import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '');
runInNewContext(stripTypeScriptTypes(source, { mode: 'strip' }) + '\nglobalThis.Player = Atmosphere;', context);
const tick = seconds => { for (let i = 0; i < Math.round(seconds * 25); i++) { now += 40; for (const audio of media) if (!audio.paused && audio.readyState >= 3) audio.currentTime += .04; for (const fn of [...timers]) fn(); } };
const music = new context.Player();
music.setExternalMusic(true);
await music.startOpening();
const track = media[0];
assert.equal(track.volume, 0);
track.readyState = 0; tick(1); assert.equal(track.volume, 0, '缓冲期间不消耗渐强时长');
track.readyState = 4; tick(1); assert.ok(track.volume > .25 && track.volume < .30, '渐强一秒约为一半音量');
tick(1); assert.ok(Math.abs(track.volume - opening.bgmVolume) < .001, '两秒达到开场音量');
assert.equal(track.muted, false, '章节配置不静音开场');
music.fadeOpeningOut(1800); tick(1.8); assert.ok(Math.abs(track.volume - opening.bgmVolume) < .001, '标题末两秒前保持音量');
tick(1); assert.ok(track.volume > .25 && track.volume < .31, '渐弱一秒约为一半音量');
const pausedVolume = track.volume; music.pause(); tick(1); assert.equal(track.volume, pausedVolume, '后台暂停渐变进度');
await music.start(); assert.equal(track.volume, pausedVolume, '恢复不重置包络');
tick(1.1); assert.equal(track.volume, 0); assert.equal(track.paused, true); assert.equal(timers.size, 0, '两秒渐弱后停止并清理计时器');
await music.startOpening(); assert.equal(media.length, 1); assert.equal(track.volume, 0); assert.equal(track.currentTime, 0);
tick(1); assert.ok(track.volume > .25 && track.volume < .30, '重新开始重新渐强');
music.stopOpening(); assert.equal(track.volume, 0); assert.equal(track.paused, true); assert.equal(timers.size, 0);
console.log('通过：开场两秒渐强、缓冲等待、标题末两秒渐弱、后台暂停恢复、重新开始、音量及计时器清理。');

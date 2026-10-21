import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { scanSounds, readJson, atomicJson } from './audio-library.mjs';
import { measureLoudness, ffmpegPath } from './voice-level.mjs';
import { replaceSoundAssets } from '../src/sound/assets.ts';
import { validateSoundConfig } from '../src/sound/schema.ts';
import { script } from '../src/data/script.ts';
import { characters } from '../src/data/narrative.ts';

const root = process.cwd(), configFile = path.join(root, 'public/audio/cues.json');
const referenceSource = 'audio/voice/配音录制/老雷/A01-D007.wav';
const originalLibrary = await readJson(path.join(root, 'public/audio/library.json'), []);
const reference = originalLibrary.find(a => a.source === referenceSource);
if (!reference) throw new Error('请先扫描导入老雷 A01-D007 作为音量基准');
const referenceCue = (await readJson(configFile)).cues.find(c => c.lineId === 'A01-D007' && c.bus === 'voice' && c.enabled);
if (!referenceCue || referenceCue.volume <= 0) throw new Error('A01-D007 缺少有效的人物配音绑定');
const measured = await measureLoudness(path.join(root, 'public', reference.path), await ffmpegPath(root));
const profile = {
  version: 1, referenceSource,
  referenceHash: createHash('sha256').update(await readFile(path.join(root, referenceSource))).digest('hex').slice(0, 20),
  targetLUFS: Number(measured.input_i), referenceVolume: referenceCue.volume,
};
await atomicJson(path.join(root, 'art-source/audio/voice-levels.json'), profile);
console.log(`配音响度基准：老雷 A01-D007，${profile.targetLUFS} LUFS；保留原始录音，正在生成网页配音…`);
await scanSounds(root);
const library = await readJson(path.join(root, 'public/audio/library.json'), []);
const voices = library.filter(a => a.source?.startsWith('audio/voice/'));
const byId = new Map();
for (const asset of voices) {
  const id = path.basename(asset.name, path.extname(asset.name));
  const line = script.find(l => l.id === id);
  if (!line || line.narration || path.posix.basename(path.posix.dirname(asset.source)) !== characters[line.speaker].name) throw new Error(`配音编号或角色不匹配：${asset.source}`);
  if (byId.has(id)) throw new Error(`同一段有多份人物录音，请先确认：${id}`);
  if (asset.voiceNormalization && (Math.abs(asset.voiceNormalization.outputLUFS - profile.targetLUFS) > .75 || asset.voiceNormalization.truePeak > 0)) throw new Error(`配音响度或峰值需要复查：${id}`);
  byId.set(id, asset);
}
// 转换完成后读取最新编排，避免覆盖扫描期间已经保存的其他设置。
const before = await readFile(configFile, 'utf8'), config = JSON.parse(before);
replaceSoundAssets(config, library);
const removed = [], added = [], previous = new Map();
for (const cue of config.cues) {
  const asset = byId.get(cue.lineId);
  if (asset && cue.asset === asset.path) {
    if (cue.bus !== 'voice') { removed.push(cue.id); continue; }
    if (previous.has(cue.lineId)) { removed.push(cue.id); continue; }
    previous.set(cue.lineId, cue);
  }
}
config.cues = config.cues.filter(c => !removed.includes(c.id));
for (const [lineId, asset] of byId) {
  let cue = config.cues.find(c => c.lineId === lineId && c.bus === 'voice');
  if (!cue) {
    const id = `voice-${lineId}`;
    if (config.cues.some(c => c.id === id)) throw new Error(`自动绑定 ID 已被占用：${id}`);
    cue = { id, lineId, bus: 'voice', asset: asset.path, enabled: true, trigger: 'line', frame: 0, keyword: '', occurrence: 1, delay: 0, volume: profile.referenceVolume, fadeIn: 0, fadeOut: 0, trimStart: 0, trimEnd: 0, rate: 1, loop: false, scope: 'line' };
    config.cues.push(cue); added.push(lineId);
  }
  cue.asset = asset.path; cue.volume = profile.referenceVolume; cue.enabled = true; cue.loop = false;
}
const errors = validateSoundConfig(config, script);
if (errors.length) throw new Error(errors.join('；'));
for (const cue of config.cues) await access(path.join(root, 'public', cue.asset));
await atomicJson(path.join(root, 'art-source/audio/cues.previous.json'), JSON.parse(before));
if (await readFile(configFile, 'utf8') !== before) throw new Error('处理期间编排已被其他窗口修改，请重试以保留最新设置。');
await atomicJson(configFile, config);
const report = {
  reference: profile, sources: voices.length, totalVoiceBindings: config.cues.filter(c => c.bus === 'voice').length,
  removedDuplicateBindings: removed, addedBindings: added,
  missingRecordings: script.filter(l => !l.narration && !byId.has(l.id)).map(l => ({ id: l.id, character: characters[l.speaker].name })),
  levels: voices.map(a => ({ source: a.source, asset: a.path, ...(a.voiceNormalization ?? { outputLUFS: profile.targetLUFS, truePeak: Number(measured.input_tp), reference: true }) })),
};
await atomicJson(path.join(root, 'art-source/audio/voice-level-report.json'), report);
console.log(JSON.stringify({ sources: report.sources, voiceBindings: report.totalVoiceBindings, removedDuplicates: removed.length, addedBindings: added.length, missingRecordings: report.missingRecordings, targetLUFS: profile.targetLUFS }, null, 2));

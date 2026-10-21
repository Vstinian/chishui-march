import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { scanSounds, importSound, readJson } from '../tools/audio-library.mjs';
import { replaceSoundAssets } from '../src/sound/assets.ts';
import { spawnSync } from 'node:child_process';

const root = await mkdtemp(path.join(tmpdir(), 'chishui-audio-replacement-'));
function wave(amplitude, frequency = 440, seconds = .1) {
  const count = Math.round(44100 * seconds), bytes = Buffer.alloc(44 + count * 2);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(44100, 24); bytes.writeUInt32LE(88200, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) bytes.writeInt16LE(Math.round(Math.sin(i * frequency * Math.PI * 2 / 44100) * amplitude * 32767), 44 + i * 2);
  return bytes;
}
try {
  // 本机使用真实 FFmpeg；无 FFmpeg 的环境也须支持保留 WAV 的扫描路径。
  const localTools = await readJson(new URL('../audio-tools.local', import.meta.url), null);
  if (localTools) await writeFile(path.join(root, 'audio-tools.local'), JSON.stringify(localTools));
  const source = 'audio/voice/老雷/A01-D007.wav', other = 'audio/voice/小满/A01-D007.wav';
  for (const file of [source, other]) await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, source), wave(.02)); await writeFile(path.join(root, other), wave(.3, 880));
  const first = await scanSounds(root), original = first.find(a => a.source === source), unrelated = first.find(a => a.source === other);
  const uploaded = await importSound(root, 'manual.wav', wave(.1, 220));
  const config = { cues: [
    { id: 'voice-a', asset: original.path, volume: .6, trimStart: .04, trigger: 'line' },
    { id: 'voice-b', asset: original.path, volume: 1, trimStart: .02, trigger: 'frame', frame: 1 },
    { id: 'other', asset: unrelated.path, volume: .3 }, { id: 'manual', asset: uploaded.path, volume: .5 },
  ] };
  const before = structuredClone(config);
  await writeFile(path.join(root, source), wave(.8));
  const second = await scanSounds(root), replacement = second.find(a => a.source === source);
  assert.notEqual(replacement.path, original.path, '修改内容生成新 URL，避免浏览器沿用旧缓存');
  assert.ok(replacement.previousPaths.includes(original.path));
  assert.equal(second.find(a => a.source === other).path, unrelated.path, '相同文件名的其他角色不受影响');
  assert.notDeepEqual(await readFile(path.join(root, 'public', replacement.path)), await readFile(path.join(root, 'public', original.path)));
  assert.equal(replaceSoundAssets(config, second), 2, '同一素材的全部绑定都迁移到新版');
  assert.deepEqual(config.cues, before.cues.map(c => c.asset === original.path ? { ...c, asset: replacement.path } : c), '仅更换素材，保留触发、音量、裁切与其他素材');
  const library = await readJson(path.join(root, 'public/audio/library.json'), []);
  assert.equal(library.length, 3); assert.equal(library.filter(a => a.source === source).length, 1);
  await access(path.join(root, 'public', original.path));
  const third = await scanSounds(root);
  assert.equal(replaceSoundAssets(config, third), 0, '重复扫描不重复迁移');
  const oldDraft = structuredClone(before);
  assert.equal(replaceSoundAssets(oldDraft, third), 2, '后续扫描仍能修复旧草稿中的素材引用');
  assert.equal((await readJson(path.join(root, 'public/audio/library.json'), [])).length, 3);
  console.log('通过：同路径素材替换、全部绑定迁移、参数保留、同名角色隔离、素材库去重、手动导入保留、旧文件保留、重复扫描及旧草稿修复。');
  const executable = localTools?.ffmpeg || process.env.FFMPEG_PATH || 'ffmpeg';
  if (spawnSync(executable, ['-version'], { windowsHide: true }).status === 0) {
    const levelRoot = path.join(root, 'levels'), levelSource = 'audio/voice/老雷/A01-D007.wav';
    await mkdir(path.dirname(path.join(levelRoot, levelSource)), { recursive: true });
    await mkdir(path.join(levelRoot, 'art-source/audio'), { recursive: true });
    const sourceBytes = wave(.03, 440, 3);
    await writeFile(path.join(levelRoot, levelSource), sourceBytes);
    await writeFile(path.join(levelRoot, 'audio-tools.local'), JSON.stringify({ ffmpeg: executable }));
    await writeFile(path.join(levelRoot, 'art-source/audio/voice-levels.json'), JSON.stringify({ version: 1, targetLUFS: -20.5, referenceSource: 'reference.wav', referenceHash: 'reference' }));
    const [normalized] = await scanSounds(levelRoot);
    assert.ok(Math.abs(normalized.voiceNormalization.outputLUFS + 20.5) < .5, '实际解码响度对齐目标');
    assert.ok(normalized.voiceNormalization.truePeak < 0, '归一化后不削波');
    assert.equal(normalized.webEncoding.bitrateKbps, 64);
    assert.equal(normalized.webEncoding.channels, 1, '网页人物配音使用单声道');
    assert.deepEqual(await readFile(path.join(levelRoot, levelSource)), sourceBytes, '原始录音不被加工覆盖');
    const modified = (await stat(path.join(levelRoot, 'public', normalized.path))).mtimeMs;
    const [again] = await scanSounds(levelRoot);
    assert.equal(again.path, normalized.path);
    assert.equal((await stat(path.join(levelRoot, 'public', normalized.path))).mtimeMs, modified, '重复扫描复用处理结果，不反复增益或转码');
    const fullSize = path.join(levelRoot, 'fixture.mp3');
    assert.equal(spawnSync(executable, ['-y', '-i', path.join(levelRoot, levelSource), '-c:a', 'libmp3lame', '-b:a', '320k', fullSize], { windowsHide: true }).status, 0);
    const fullBytes = await readFile(fullSize);
    const compact = await importSound(levelRoot, 'fixture.mp3', fullBytes);
    assert.equal(compact.webEncoding.bitrateKbps, 96);
    assert.ok(compact.bytes < fullBytes.length * .4, '导入已有 MP3 也会压缩，不能直接复制大文件');
    const compactMtime = (await stat(path.join(levelRoot, 'public', compact.path))).mtimeMs;
    const compactAgain = await importSound(levelRoot, 'fixture.mp3', fullBytes);
    assert.equal(compactAgain.path, compact.path);
    assert.equal((await stat(path.join(levelRoot, 'public', compact.path))).mtimeMs, compactMtime, '重复导入不再编码网页 MP3');
    assert.deepEqual(await readFile(path.join(levelRoot, 'art-source/audio', path.basename(fullSize).replace('fixture', compact.webEncoding.sourceHash))), fullBytes, '上传原始 MP3 完整保留');
    console.log('通过：真实配音响度归一化、峰值检查、原始录音保留、重复扫描缓存与稳定引用。');
  } else console.log('跳过真实响度转换测试：未安装 FFmpeg。');
} finally {
  assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()));
  assert.ok(path.basename(root).startsWith('chishui-audio-replacement-'));
  await rm(root, { recursive: true, force: true });
}

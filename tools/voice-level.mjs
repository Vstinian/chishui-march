import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

async function jsonOrNull(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export async function ffmpegPath(root) {
  return process.env.FFMPEG_PATH || (await jsonOrNull(path.join(root, 'audio-tools.local')))?.ffmpeg || 'ffmpeg';
}
function run(executable, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, ['-hide_banner', '-nostdin', '-nostats', ...args], { windowsHide: true, timeout: 120000 });
    let detail = '';
    child.stderr.on('data', chunk => { detail = (detail + chunk).slice(-12000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(detail) : reject(new Error(`音频处理失败：${detail.slice(-2000)}`)));
  });
}
export async function measureLoudness(file, executable, target = -20.5) {
  const detail = await run(executable, ['-i', file, '-af', `loudnorm=I=${target}:TP=-1:LRA=50:print_format=json`, '-f', 'null', '-']);
  const match = detail.match(/\{\s*"input_i"[\s\S]*?\}/);
  if (!match) throw new Error(`无法测量配音响度：${file}`);
  const data = JSON.parse(match[0]);
  if (!Number.isFinite(Number(data.input_i))) throw new Error(`配音过短或没有可测量的人声：${file}`);
  return data;
}
export async function normalizeVoice(root, source, original, sourceHash, directory, existing) {
  if (!source.startsWith('audio/voice/')) return null;
  const profile = await jsonOrNull(path.join(root, 'art-source/audio/voice-levels.json'));
  if (!profile) return null;
  if (profile.version !== 1 || !Number.isFinite(profile.targetLUFS) || profile.targetLUFS < -70 || profile.targetLUFS > -5) throw new Error('人物配音响度配置无效');
  if (source === profile.referenceSource && sourceHash === profile.referenceHash) return null;
  const recipe = { version: 2, sourceHash, target: profile.targetLUFS, peak: -1, method: 'gain-limiter-verified' };
  const hash = createHash('sha256').update(JSON.stringify(recipe)).digest('hex').slice(0, 20);
  const fileName = `${hash}.mp3`, output = path.join(directory, fileName);
  if (existing?.path === `assets/audio/${fileName}` && existing.voiceNormalization?.sourceHash === sourceHash) {
    try { await access(output); return { fileName, voiceNormalization: existing.voiceNormalization }; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const executable = await ffmpegPath(root), measured = await measureLoudness(original, executable, profile.targetLUFS);
  let gain = profile.targetLUFS - Number(measured.input_i), checked;
  for (let attempt = 0; attempt < 5; attempt++) {
    // 从原始录音处理，保留时间轴；限制瞬态峰值，并按最终 MP3 的实测值校正增益。
    const filter = `volume=${gain}dB,alimiter=limit=0.891250938:level=false:latency=true`;
    await run(executable, ['-y', '-i', original, '-vn', '-af', filter, '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', output]);
    checked = await measureLoudness(output, executable, profile.targetLUFS);
    const correction = profile.targetLUFS - Number(checked.input_i);
    if (Math.abs(correction) <= .25) break;
    gain += correction;
  }
  if (Math.abs(Number(checked.input_i) - profile.targetLUFS) > .5 || Number(checked.input_tp) > 0) throw new Error(`配音响度或峰值需要复查：${source}`);
  return { fileName, voiceNormalization: { sourceHash, targetLUFS: profile.targetLUFS, inputLUFS: Number(measured.input_i), outputLUFS: Number(checked.input_i), truePeak: Number(checked.input_tp) } };
}

import { readFile, writeFile, mkdir, readdir, rename, access, rm } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { normalizeVoice, ffmpegPath } from './voice-level.mjs';
import { audioEncoding, audioEncodingArgs } from './audio-encoding.mjs';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n');
  await rename(temp, file);
}
export async function readJson(file, fallback) { try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; } }
function transcode(input, output, executable, source) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, ['-hide_banner','-nostdin','-y','-i',input,...audioEncodingArgs(source),output], { windowsHide: true, timeout: 120000 });
    let detail = '';
    child.stderr.on('data', chunk => { detail = (detail + chunk).slice(-2000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(detail)));
  });
}
export async function importSound(root, name, bytes, source = name) {
  const ext = path.extname(name).toLowerCase();
  if (!['.mp3','.wav','.ogg','.m4a'].includes(ext)) throw new Error('仅支持 MP3、WAV、OGG、M4A');
  if (bytes.length < 12 || bytes.length > 64 * 1024 * 1024) throw new Error('音频须小于64MB且非空');
  const header = bytes.subarray(0, 12).toString('ascii');
  const valid = ext === '.wav' ? header.startsWith('RIFF') && header.endsWith('WAVE') : ext === '.ogg' ? header.startsWith('OggS') : ext === '.m4a' ? header.slice(4, 8) === 'ftyp' : header.startsWith('ID3') || (bytes[0] === 255 && (bytes[1] & 224) === 224);
  if (!valid) throw new Error('文件内容与音频扩展名不匹配');
  const hash = digest(bytes).slice(0, 20);
  const directory = path.join(root, 'public/assets/audio');
  const originalDir = path.join(root, 'art-source/audio');
  await mkdir(directory, { recursive: true }); await mkdir(originalDir, { recursive: true });
  const original = source.startsWith('audio/') ? path.join(root, source) : path.join(originalDir, hash + ext);
  if (!source.startsWith('audio/')) await writeFile(original, bytes);
  const libraryFile = path.join(root, 'public/audio/library.json');
  let library = await readJson(libraryFile, []);
  const normalized = await normalizeVoice(root, source, original, hash, directory, library.find(a => a.source === source));
  const encoding = audioEncoding(source);
  let fileName = normalized?.fileName;
  let encoded = Boolean(normalized);
  if (!fileName) {
    const webHash = digest(JSON.stringify({ sourceHash: hash, encoding })).slice(0, 20);
    fileName = `${webHash}.mp3`;
    const output = path.join(directory, fileName), temp = path.join(directory, `.${webHash}.${randomUUID()}.mp3`);
    try {
      try { await access(output); }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        await transcode(original, temp, await ffmpegPath(root), source);
        await rename(temp, output);
      }
      encoded = true;
    } catch (error) {
      // 未安装 FFmpeg 的电脑仍可扫描原格式；正式压缩须在有 FFmpeg 的电脑执行。
      if (error.code !== 'ENOENT') throw error;
      fileName = hash + ext;
      await writeFile(path.join(directory, fileName), bytes);
    } finally { await rm(temp, { force: true }); }
  }
  const web = await readFile(path.join(directory, fileName));
  const item = { path: `assets/audio/${fileName}`, name, bytes: web.length, source, sourceBytes: bytes.length };
  if (encoded) item.webEncoding = { ...encoding, sourceHash: hash };
  if (normalized) item.voiceNormalization = normalized.voiceNormalization;
  if (source.startsWith('audio/')) {
    const versions = library.filter(a => a.source === source);
    const previousPaths = [...new Set(versions.flatMap(a => [a.path, ...(a.previousPaths ?? [])]))].filter(p => p !== item.path);
    if (previousPaths.length) item.previousPaths = previousPaths;
    library = library.filter(a => a.source !== source);
  }
  const previous = library.findIndex(a => a.path === item.path);
  if (previous >= 0) library[previous] = item; else library.push(item);
  await atomicJson(libraryFile, library);
  return item;
}
export async function scanSounds(root) {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true }).catch(e => e.code === 'ENOENT' ? [] : Promise.reject(e))) {
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file); else if (/\.(wav|mp3|ogg|m4a)$/i.test(entry.name)) files.push(file);
    }
  }
  await walk(path.join(root, 'audio'));
  const items = [];
  for (const file of files) items.push(await importSound(root, path.basename(file), await readFile(file), path.relative(root, file).replaceAll('\\', '/')));
  return items;
}

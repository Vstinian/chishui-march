import { readFile } from 'node:fs/promises';
import { scanSounds, atomicJson } from './audio-library.mjs';
import { replaceSoundAssets } from '../src/sound/assets.ts';
const items = await scanSounds(process.cwd());
for (const item of items) console.log(`${item.name} -> ${item.path} (${Math.round(item.bytes/1024)} KB)`);
const configFile = 'public/audio/cues.json';
const before = await readFile(configFile, 'utf8');
const config = JSON.parse(before);
const updated = replaceSoundAssets(config, items);
if (updated) {
  await atomicJson('art-source/audio/cues.previous.json', JSON.parse(before));
  if (await readFile(configFile, 'utf8') !== before) throw new Error('扫描期间编排已被其他窗口修改，请重新扫描以保留最新设置。');
  await atomicJson(configFile, config);
}
console.log(`Updated ${updated} existing cue references; timing, volume and trim settings are preserved.`);
console.log(`Prepared ${items.length} files. Original audio files are preserved.`);

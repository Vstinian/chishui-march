import { scanSounds } from './audio-library.mjs';
const items = await scanSounds(process.cwd());
for (const item of items) console.log(`${item.name} -> ${item.path} (${Math.round(item.bytes/1024)} KB)`);
console.log(`Prepared ${items.length} files. Original audio files are preserved.`);

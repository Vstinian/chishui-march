import { readFile, readdir, realpath, unlink, access, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// 只清理构建生成的 dist；本地原素材和旧草稿引用的网页文件继续保留。
export async function prunePublishedAudio(root, extraAssets = []) {
  const project = await realpath(root), expected = path.join(project, 'dist/assets/audio');
  const directory = await realpath(expected);
  if (path.relative(expected, directory) !== '') throw new Error('发布音频目录不能指向 dist 之外。');
  const library = JSON.parse(await readFile(path.join(project, 'dist/audio/library.json'), 'utf8'));
  const config = JSON.parse(await readFile(path.join(project, 'dist/audio/cues.json'), 'utf8'));
  const used = new Set([...library.map(item => item.path), ...config.cues.map(cue => cue.asset), ...extraAssets].filter(Boolean));
  for (const asset of used) {
    if (!/^assets\/audio\/[a-zA-Z0-9_-]+\.(mp3|wav|ogg|m4a)$/i.test(asset)) throw new Error(`发布音频路径无效：${asset}`);
    await access(path.join(project, 'dist', asset));
  }
  let removedFiles = 0, removedBytes = 0, publishedBytes = 0;
  for (const file of await readdir(directory, { withFileTypes: true })) {
    if (!file.isFile() || !/^[a-zA-Z0-9_-]+\.(mp3|wav|ogg|m4a)$/i.test(file.name)) continue;
    const absolute = path.join(directory, file.name), bytes = (await stat(absolute)).size;
    if (used.has(`assets/audio/${file.name}`)) { publishedBytes += bytes; continue; }
    await unlink(absolute); removedFiles++; removedBytes += bytes;
  }
  return { files: used.size, publishedBytes, removedFiles, removedBytes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { opening } = await import('../src/data/narrative.ts');
  const { ambientTracks } = await import('../src/data/transitions.ts');
  const result = await prunePublishedAudio(process.cwd(), [opening.bgm, ...Object.values(ambientTracks)]);
  console.log(`Published audio: ${result.files} files, ${(result.publishedBytes / 1024 / 1024).toFixed(1)} MiB; excluded ${result.removedFiles} historical files from dist.`);
}

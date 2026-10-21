import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prunePublishedAudio } from '../tools/publish-audio.mjs';

const root = await mkdtemp(path.join(tmpdir(), 'chishui-audio-publish-'));
try {
  for (const dir of ['public/assets/audio', 'dist/assets/audio', 'dist/audio']) await mkdir(path.join(root, dir), { recursive: true });
  for (const name of ['current.mp3', 'unbound.mp3', 'opening.mp3', 'historical.wav']) {
    for (const dir of ['public/assets/audio', 'dist/assets/audio']) await writeFile(path.join(root, dir, name), name);
  }
  await writeFile(path.join(root, 'dist/audio/library.json'), JSON.stringify([{ path: 'assets/audio/current.mp3' }, { path: 'assets/audio/unbound.mp3' }]));
  await writeFile(path.join(root, 'dist/audio/cues.json'), JSON.stringify({ cues: [{ asset: 'assets/audio/current.mp3' }] }));
  const result = await prunePublishedAudio(root, ['assets/audio/opening.mp3']);
  assert.equal(result.files, 3); assert.equal(result.removedFiles, 1);
  assert.equal(await readFile(path.join(root, 'public/assets/audio/historical.wav'), 'utf8'), 'historical.wav', '原目录保留历史版本');
  await access(path.join(root, 'dist/assets/audio/unbound.mp3'));
  assert.equal((await readdir(path.join(root, 'dist/assets/audio'))).length, 3);
  const repeated = await prunePublishedAudio(root, ['assets/audio/opening.mp3']);
  assert.equal(repeated.removedFiles, 0, '重复发布清理无额外改动');
  await assert.rejects(prunePublishedAudio(root, ['../outside.mp3']), /路径无效/);
  await assert.rejects(prunePublishedAudio(root, ['assets/audio/missing.mp3']), /ENOENT/);
  console.log('通过：发布保留当前及未绑定素材和独立开场曲，排除历史文件，保留原件，校验资源路径和缺失文件。');
} finally {
  assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()));
  assert.ok(path.basename(root).startsWith('chishui-audio-publish-'));
  await rm(root, { recursive: true, force: true });
}

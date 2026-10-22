import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const read = file => stripTypeScriptTypes(readFileSync(new URL(`../src/${file}.ts`, import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, ''), { mode: 'strip' });
const ctx = {};
runInNewContext([read('data/script'), read('subtitles'), 'globalThis.api = { script, subtitleFrames, subtitlePresentation, subtitleSourceShown };'].join('\n'), ctx);
const { script, subtitleFrames, subtitlePresentation, subtitleSourceShown } = ctx.api;
const original = JSON.stringify(script);
const frame = text => ({ id: 'test/a', text, delays: Array.from(text, () => 36) });
for (const note of ['内心', '带哭腔', '气声', '沙哑', '虚弱', '等不及', '在前头，低声']) {
  const raw = frame(`（${note}）青山，继续走。`), display = subtitlePresentation(raw);
  assert.equal(display.text, '青山，继续走。');
  assert.equal(subtitleSourceShown(raw, display.sourceEnds, ''), '');
  assert.equal(subtitleSourceShown(raw, display.sourceEnds, '青'), `（${note}）青`);
}
for (const action of ['回过头', '在前头回头', '边走边问', '喘息', '沉默一会儿', '上前一步', '传口令', '凑过来看水缸', '看了一眼天上的飞机']) {
  assert.equal(subtitlePresentation(frame(`（${action}）青山。`)).text, `（${action}）青山。`);
}
const mixed = frame('（内心）青山（回过头），走吧。（虚弱）');
assert.equal(subtitlePresentation(mixed).text, '青山（回过头），走吧。');
const unicode = frame('（内心）𠮷，走。');
assert.equal(subtitleSourceShown(unicode, subtitlePresentation(unicode).sourceEnds, '𠮷'), '（内心）𠮷');
const reflowExamples = {
  'A01-D008': ['青山哥，你听，是不是炮？隔一会儿响一声，闷闷的。我……我有点怕，', '我一怕，这两条腿就不听使唤。'],
  'A01-D014': ['雾里全是人影。我不知道哪个是敌人，哪个是自己人。', '我趴在射手旁，死死按着机枪弹匣。老雷喊：听号声！号声在哪儿，敌人在哪儿。'],
};
for (const [id, expected] of Object.entries(reflowExamples)) {
  const rawFrames = subtitleFrames(script.find(line => line.id === id));
  assert.deepEqual(Array.from(rawFrames, item => item.id), [`${id}/a`, `${id}/b`]);
  assert.deepEqual(Array.from(rawFrames, item => subtitlePresentation(item).text), expected, `${id} 两框内部各自一段式，切换点不动`);
}
const broken = frame('甲。\n乙，\n丙。'), brokenDisplay = subtitlePresentation(broken);
assert.equal(brokenDisplay.text, '甲。乙，丙。');
assert.equal(subtitleSourceShown(broken, brokenDisplay.sourceEnds, '甲。乙'), '甲。\n乙', '换行合并后关键词仍定位到原文');
let frames = 0, cleaned = 0;
for (const line of script) for (const raw of subtitleFrames(line)) {
  frames++;
  const display = subtitlePresentation(raw);
  assert.doesNotMatch(display.text, /[\r\n]/u, `${line.id} 框内使用自然换行`);
  if (display.text !== raw.text) cleaned++;
  assert.ok(display.text.length > 0, `${line.id} 不能变为空框`);
  assert.equal(display.delays.length, Array.from(display.text).length);
  assert.equal(subtitleSourceShown(raw, display.sourceEnds, display.text), raw.text, `${line.id} 完整显示仍定位到原文末尾`);
  let previous = 0;
  for (const end of display.sourceEnds) { assert.ok(end > previous); previous = end; }
  // 一字一字显示时只会推进原文位置，不会把动作之外的括号片段闪出来。
  for (let i = 1; i <= Array.from(display.text).length; i++) {
    const shown = Array.from(display.text).slice(0, i).join('');
    assert.ok(raw.text.startsWith(subtitleSourceShown(raw, display.sourceEnds, shown)));
  }
}
assert.equal(JSON.stringify(script), original, '不改原剧本、音轨定位或受保护的第二框');
assert.equal(frames, 135);
console.log(`subtitle presentation: ${frames} frames, ${cleaned} cleaned, action cues and raw audio offsets preserved`);

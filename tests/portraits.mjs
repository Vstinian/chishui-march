import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const sources = ['data/narrative', 'data/script', 'data/acts', 'subtitles', 'data/portraitCues', 'portraits'];
const source = sources.map(path => stripTypeScriptTypes(readFileSync(new URL(`../src/${path}.ts`, import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, ''), { mode: 'strip' })).join('\n');
const api = runInNewContext(`${source}\n({characters, acts, portraitDirections, portraitDefaults, expressionAt, portraitCast, portraitPreloads, subtitleFrames, syncPortraits})`);
const { characters, acts, portraitDirections, portraitDefaults, expressionAt, portraitCast, portraitPreloads, subtitleFrames, syncPortraits } = api;
const allLines = acts.flatMap(act => act.dialogue);
const lineById = id => allLines.find(line => line.id === id);
const webAssets = new Set(Object.values(characters).flatMap(character => Object.values(character.expressions)).filter(Boolean));
assert.equal(webAssets.size, 15, '五位人物各三张立绘');
for (const path of webAssets) assert.ok(existsSync(new URL(`../public/${path}`, import.meta.url)), `缺失立绘：${path}`);
assert.equal(characters.wounded.portrait, null, '未交付的伤员保留占位');

let beats = 0;
for (const [id, direction] of Object.entries(portraitDirections)) {
  const line = lineById(id);
  assert.ok(line && !line.narration, `${id} 必须指向有人物的对白`);
  if (direction.start) assert.ok(characters[line.speaker].expressions[direction.start], `${id} 起始表情存在`);
  let offset = -1;
  const act = acts.find(act => act.dialogue.includes(line));
  const cast = portraitCast(act, act.dialogue.indexOf(line));
  for (const beat of direction.beats ?? []) {
    const index = line.text.indexOf(beat.at), character = beat.character ?? line.speaker;
    assert.ok(beat.at.length && index >= 0 && index === line.text.lastIndexOf(beat.at), `${id} 触发短语必须存在且唯一：${beat.at}`);
    assert.ok(index >= offset, `${id} 表情顺序与原文一致`); offset = index;
    assert.ok(characters[character].expressions[beat.expression], `${id} 表情已交付`);
    assert.ok(cast.some(item => item.id === character), `${id} 反应人物须在画面中`);
    assert.equal(expressionAt(line, character, 0, line.text.slice(0, index + 1)), beat.expression, `${id} 从触发短语首字开始切换`);
    beats++;
  }
}

for (const act of acts) for (const [cursor, line] of act.dialogue.entries()) {
  const cast = portraitCast(act, cursor);
  assert.equal(cast.length === 0, line.narration, `${line.id} 旁白保持全景`);
  for (const { id, fallback } of cast) {
    const frames = subtitleFrames(line);
    let earlier = '';
    for (const [index, frame] of frames.entries()) {
      assert.equal(expressionAt(line, id, index, '', fallback), expressionAt(line, id, 0, earlier, fallback), `${line.id} 读档从第二框起时继承前文表情`);
      earlier += frame.text;
      assert.equal(expressionAt(line, id, index, frame.text, fallback), expressionAt(line, id, 0, earlier, fallback), `${line.id} 保留分框中的换行不影响位置`);
    }
    const expression = expressionAt(line, id, 0, line.text, fallback);
    assert.ok(Object.hasOwn(characters[id].expressions, expression), `${line.id} ${id} 有有效的终态表情`);
  }
  for (const path of portraitPreloads(act, cursor)) assert.ok(webAssets.has(path), `${line.id} 预载素材有效`);
}

// 一段内两次转折；点击补全直接取终态；倾听者的反应传递到下一段。
const rest = lineById('A03-D020');
assert.equal(expressionAt(rest, 'instructor', 0, ''), 'soft');
assert.equal(expressionAt(rest, 'instructor', 0, rest.text.slice(0, rest.text.indexOf('明天'))), 'soft');
assert.equal(expressionAt(rest, 'instructor', 0, rest.text.slice(0, rest.text.indexOf('明天') + 1)), 'serious');
assert.equal(expressionAt(rest, 'instructor', 0, rest.text), 'soft');
const act4 = acts[3], next = act4.dialogue.findIndex(line => line.id === 'A04-D012');
assert.equal(portraitCast(act4, next).find(item => item.id === 'qingshan').fallback, 'tired');
assert.equal(portraitCast(acts[0], acts[0].dialogue.findIndex(line => line.id === 'A01-D007')).length, 2);
assert.equal(portraitCast(acts[0], 0).length, 0, '开篇独白不提前出现角色');

// 图片解码延迟、快速补全和离开当前场景时，不允许旧请求盖过最新表情。
const pending = [];
const layers = [0, 1].map(() => ({ src: '', style: {}, decode() { return new Promise((resolve, reject) => pending.push({ resolve, reject })); } }));
const target = { isConnected: true, dataset: { activeLayer: '0', expression: 'soft' }, querySelector: selector => layers[selector.includes('"1"') ? 1 : 0] };
const root = { querySelector: selector => selector.includes('instructor') ? target : null };
const act3 = acts[2], cursor = act3.dialogue.indexOf(rest);
syncPortraits(root, act3, cursor, 0, rest.text.slice(0, rest.text.indexOf('明天') + 1));
syncPortraits(root, act3, cursor, 0, rest.text);
assert.equal(pending.length, 2);
pending[0].resolve(); await Promise.resolve();
assert.equal(target.dataset.expression, 'soft', '过期的严肃表情不能覆盖补全后的宽慰表情');
pending[1].resolve(); await Promise.resolve();
assert.equal(target.dataset.expression, 'soft');
assert.equal(target.dataset.activeLayer, '1');
syncPortraits(root, act3, cursor, 0, rest.text.slice(0, rest.text.indexOf('明天') + 1));
target.isConnected = false; pending[2].resolve(); await Promise.resolve();
assert.equal(target.dataset.expression, 'soft', '离场后停止修改旧立绘');

console.log(`Portraits passed: ${webAssets.size} assets, ${allLines.length} paragraphs, ${beats} expression beats, protected frames and stale decode guards.`);

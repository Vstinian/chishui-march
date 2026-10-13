import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const readSource = path => stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, ''), { mode: 'strip' });
let clickListener;
let dialogOpened = false;
let stored = null;
const timers = new Map();
let timerId = 0;
const app = {
  innerHTML: '',
  addEventListener(_type, listener) { clickListener = listener; },
  querySelector(selector) {
    if (selector === '#source-dialog') return { showModal() { dialogOpened = true; }, close() { dialogOpened = false; }, addEventListener() {} };
    return { focus() {}, disabled: false };
  },
};
const context = {
  document: { querySelector: () => app, addEventListener() {} },
  window: { scrollTo() {}, matchMedia: () => ({ matches: false }) },
  localStorage: { getItem: () => stored, setItem(_key, value) { stored = value; } },
  setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
  clearTimeout(id) { timers.delete(id); },
  setInterval() { return 1; }, clearInterval() {}, console,
};
const sources = ['data/narrative', 'data/acts', 'data/recap', 'game', 'audio', 'utils/html', 'components/Interaction', 'components/ActView', 'components/SourceCard', 'components/RecapView', 'main'];
runInNewContext(`${sources.map(path => readSource(`../src/${path}.ts`)).join('\n')}\nglobalThis.testState = state; globalThis.testActs = acts;`, context);
const state = context.testState;
const click = (action, dataset = {}) => clickListener({ target: { closest: () => ({ dataset: { action, ...dataset }, setAttribute() {}, textContent: '' }) } });

assert.match(app.innerHTML, /展开报纸/);
for (const action of ['recap', 'ending', 'advance', 'game-continue']) click(action);
click('jump', { act: 'act05' });
assert.equal(state.screen, 'home', '不能从首页绕过序章或章节锁');
click('start');
assert.equal(state.screen, 'intro');
assert.equal(timers.size, 1);
click('sound');
assert.equal(timers.size, 1, '切换声音不重启动画计时');
click('skip-intro');
assert.equal(timers.size, 0);
assert.equal(state.screen, 'act');
click('source', { source: 'source-act01' });
assert.equal(dialogOpened, true);
click('advance');
assert.equal(state.cursors.act01 ?? 0, 0, '弹窗打开时不推进故事');
click('close-source');
assert.equal(dialogOpened, false);

const solutions = [
  ['plank', 'slot-0', 'plank', 'slot-1', 'plank', 'slot-2'],
  ['1', '5', '6', '10', '11', '15'],
  ['cover', 'climb', 'duck', 'climb', 'duck', 'follow'],
  ['soldier', 'shelter', 'soldier', 'shelter', 'soldier', 'shelter'],
  Array(8).fill('step'),
];
for (const [index, act] of context.testActs.entries()) {
  assert.equal(state.actId, act.id);
  assert.ok(act.dialogue.length >= 20, '每幕需要完整叙事段落');
  click('game', { value: solutions[index][0] });
  assert.equal(state.games[act.id], undefined, '不能在对白阶段预先完成小游戏');
  click('jump', { act: context.testActs[index + 1]?.id ?? 'invalid' });
  assert.equal(state.actId, act.id, '前一幕没完成不能跳下一幕');
  click('recap');
  assert.equal(state.screen, 'act');
  for (let i = 0; i < act.interaction.afterLine; i++) click('advance');
  assert.match(app.innerHTML, /class="minigame/);
  click('advance'); click('game-continue');
  assert.equal(state.cursors[act.id], act.interaction.afterLine, '未完成游戏不能推进对白');
  click('game', { value: 'wrong-input' });
  assert.equal(state.games[act.id].steps, 0, '无效操作不能增加进度');
  for (const value of solutions[index]) click('game', { value });
  click('game-continue');
  const restored = context.loadGame();
  assert.equal(restored.cursors[act.id], act.interaction.afterLine);
  assert.ok(restored.acknowledged.includes(act.id), '刷新可继续游戏后的对白');
  assert.equal(state.completed.length, index, '小游戏结束后还需要读完收束对白');
  for (let i = act.interaction.afterLine; i < act.dialogue.length; i++) click('advance');
  assert.equal(state.completed.length, index + 1);
}
assert.equal(state.screen, 'recap');
click('recap-step', { step: '2' });
assert.match(app.innerHTML, /三渡 · 再西进/);
click('ending'); assert.equal(state.screen, 'ending');
click('jump', { act: 'act02' }); assert.equal(state.actId, 'act02', '已解锁章节可回看');
click('recap'); click('ending'); click('restart');
assert.equal(state.screen, 'intro'); assert.equal(state.completed.length, 0);
click('skip-intro'); click('jump', { act: 'act05' });
assert.equal(state.actId, 'act01', '重开后重新锁定后续章节');
stored = '{broken'; assert.equal(context.loadGame().introSeen, false);
stored = JSON.stringify({ introSeen: true, completed: ['act05'], cursors: { act01: 10000 }, games: { act01: { steps: -9 } } });
const repaired = context.loadGame();
assert.equal(repaired.completed.length, 0, '损坏存档不能跳过前置章节');
assert.equal(repaired.cursors.act01, context.testActs[0].interaction.afterLine);
assert.equal(repaired.games.act01.steps, 0);
console.log('通过：开场、章节锁、五种小游戏、完整通关、复盘、弹窗、存档恢复和重开。');

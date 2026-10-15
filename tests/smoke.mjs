import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const readSource = path => stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, ''), { mode: 'strip' });
let clickListener;
let keyListener;
let reducedMotion = false;
let dialogOpened = false;
let stored = null;
const timers = new Map();
const delays = new Map();
let timerId = 0;
const app = {
  innerHTML: '',
  addEventListener(_type, listener) { clickListener = listener; },
  querySelector(selector) {
    if (selector === '#source-dialog') return { showModal() { dialogOpened = true; }, close() { dialogOpened = false; }, addEventListener() {} };
    return { focus() {}, disabled: false, hidden: false, classList: { add() {} }, pause() {}, click() { click('advance'); } };
  },
};
const context = {
  document: { querySelector: () => app, addEventListener(type, listener) { if (type === 'keydown') keyListener = listener; } },
  window: { scrollTo() {}, matchMedia: () => ({ matches: reducedMotion }) },
  localStorage: { getItem: () => stored, setItem(_key, value) { stored = value; } },
  setTimeout(callback, delay) { timers.set(++timerId, callback); delays.set(timerId, delay); return timerId; },
  clearTimeout(id) { timers.delete(id); },
  setInterval() { return 1; }, clearInterval() {}, console,
};
const sources = ['data/script', 'data/narrative', 'data/acts', 'data/recap', 'game', 'audio', 'utils/html', 'components/Interaction', 'components/ActView', 'components/SourceCard', 'components/RecapView', 'main'];
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
assert.equal(delays.get(timerId), 20000);
click('intro-continue');
assert.equal(state.screen, 'intro', '动画结束前不能直接继续');
click('sound');
assert.equal(timers.size, 1, '切换声音不重启动画计时');
timers.get(timerId)();
assert.equal(timers.size, 0);
assert.equal(state.screen, 'intro', '20 秒结束停在末帧，不能自动跳入第一幕');
click('intro-continue');
assert.equal(state.screen, 'act');
click('source', { source: 'source-act01' });
assert.equal(dialogOpened, true);
click('advance');
assert.equal(state.cursors.act01 ?? 0, 0, '弹窗打开时不推进故事');
click('close-source');
assert.equal(dialogOpened, false);

// 全量核对编号、场景、表情配置与左右站位，包含原稿的伤员对白。
const expectedCounts = [28, 24, 23, 23, 19];
const allIds = new Set();
for (const [index, act] of context.testActs.entries()) {
  assert.equal(act.dialogue.length, expectedCounts[index]);
  for (const [cursor, line] of act.dialogue.entries()) {
    assert.ok(!allIds.has(line.id)); allIds.add(line.id);
    const rendered = context.renderAct(act, index, { ...state, cursors: { [act.id]: cursor }, acknowledged: [act.id] });
    if (line.narration) assert.ok(!rendered.includes('class="portrait-stage"'));
    else {
      assert.match(rendered, /data-character="qingshan" data-side="left"/);
      if (line.speaker !== 'qingshan') assert.ok(rendered.includes(`data-character="${line.speaker}" data-side="right"`));
      assert.match(rendered, new RegExp(`portrait-${line.speaker} portrait-(left|right) is-speaking`));
    }
  }
}
assert.equal(allIds.size, 117);
assert.ok(!allIds.has('A01-D009'), '保留原稿缺号，不凭空补写');
keyListener({ key: ' ', repeat: false, target: { closest: () => null }, preventDefault() {} });
assert.equal(state.cursors.act01, 1, '空格推进一段');
keyListener({ key: 'Enter', repeat: false, target: { closest: () => ({}) }, preventDefault() {} });
assert.equal(state.cursors.act01, 1, '原生按钮键盘事件不重复推进');
state.cursors.act01 = 0;

const solutions = [
  ['plank', 'slot-0', 'plank', 'slot-1', 'plank', 'slot-2'],
  ['1', '5', '6', '10', '11', '15'],
  ['cover', 'climb', 'duck', 'climb', 'duck', 'follow'],
  ['soldier', 'shelter', 'soldier', 'shelter', 'soldier', 'shelter'],
  Array(8).fill('step'),
];
for (const [index, act] of context.testActs.entries()) {
  assert.equal(state.actId, act.id);
  assert.equal(act.dialogue.length, expectedCounts[index], '每幕段落数与集合版一致');
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
assert.match(app.innerHTML, /娄山关 · 遵义/);
assert.equal((app.innerHTML.match(/recap-map-route is-active/g) ?? []).length, 1);
click('recap-step', { step: '3' });
assert.equal((app.innerHTML.match(/recap-map-route is-active/g) ?? []).length, 2, '末节点同时覆盖三渡和四渡');
click('ending'); assert.equal(state.screen, 'ending');
assert.match(app.innerHTML, /连队指导员的信/);
assert.match(app.innerHTML, /替那些没走到的人，多看一眼/);
click('jump', { act: 'act02' }); assert.equal(state.actId, 'act02', '已解锁章节可回看');
click('recap'); click('ending'); reducedMotion = true; click('restart');
assert.equal(state.screen, 'intro'); assert.equal(state.completed.length, 0);
assert.equal(delays.get(timerId), 6000, '减少动态模式停留六秒');
click('skip-intro'); assert.equal(state.screen, 'intro'); click('intro-continue'); click('jump', { act: 'act05' });
assert.equal(state.actId, 'act01', '重开后重新锁定后续章节');
stored = '{broken'; assert.equal(context.loadGame().introSeen, false);
stored = JSON.stringify({ introSeen: true, completed: ['act05'], cursors: { act01: 10000 }, games: { act01: { steps: -9 } } });
const repaired = context.loadGame();
assert.equal(repaired.completed.length, 0, '损坏存档不能跳过前置章节');
assert.equal(repaired.cursors.act01, context.testActs[0].interaction.afterLine);
assert.equal(repaired.games.act01.steps, 0);
const climb = context.testActs[2];
assert.equal(context.playGame(climb, { steps: 2, selected: null, feedback: '' }, 'cover').steps, 1, '听错口令退一段');
console.log('通过：117 段正文、左右站位、20 秒末帧等待、6 秒减弱动态、键盘、章节锁、五种小游戏、完整通关、复盘与信件、弹窗、存档恢复和重开。');

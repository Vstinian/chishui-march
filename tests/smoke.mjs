import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';

const readSource = path => stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, ''), { mode: 'strip' });
let clickListener;
let keyListener;
let reducedMotion = false;
let stored = null;
const timers = new Map();
const delays = new Map();
let timerId = 0;
const app = {
  innerHTML: '',
  addEventListener(_type, listener) { clickListener = listener; },
  querySelector(_selector) {
    return { focus() {}, disabled: false, hidden: false, dataset: {}, textContent: '', setAttribute() {}, classList: { add() {} }, pause() {} };
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
const sources = ['typewriter', 'components/Icons', 'data/script', 'data/narrative', 'data/transitions', 'data/legacyScript', 'subtitles', 'data/acts', 'data/recap', 'game', 'audio', 'utils/html', 'components/Interaction', 'components/ActView', 'components/ActEndView', 'components/TransitionView', 'components/RecapView', 'main'];
runInNewContext(`${sources.map(path => readSource(`../src/${path}.ts`)).join('\n')}\nglobalThis.testState = state; globalThis.testActs = acts; globalThis.testWriter = writer; globalThis.TestTypewriter = Typewriter; globalThis.testGameTarget = gameTarget; globalThis.testLegacyIds = legacyDialogueIds; globalThis.testTransitions = storyTransitions;`, context);
const state = context.testState;
const click = (action, dataset = {}) => clickListener({ target: { closest: () => ({ dataset: { action, ...dataset }, matches: () => false, setAttribute() {}, innerHTML: '' }) } });

const fireDelay = delay => {
  const timer = [...timers.keys()].find(id => delays.get(id) === delay);
  assert.ok(timer !== undefined, `预期存在 ${delay}ms 计时器`);
  const callback = timers.get(timer); timers.delete(timer); callback();
};
const readLine = () => {
  const before = state.cursors[state.actId] ?? 0;
  let clicks = 0;
  while ((state.cursors[state.actId] ?? 0) === before) {
    assert.ok(clicks++ < 12, '一段字幕不能卡住');
    if (context.testWriter.typing) click('dialogue');
    click('dialogue');
  }
};
const finishStory = () => {
  assert.match(app.innerHTML, /class="story-transition tone-/);
  click('transition-continue');
  assert.match(app.innerHTML, /class="story-transition tone-/, '动画就绪前不会推进');
  fireDelay(reducedMotion ? 0 : 2500);
  click('transition-continue');
};
const finishOpening = () => {
  click('intro-continue');
  if (app.innerHTML.includes('class="story-transition tone-')) finishStory();
};

assert.match(app.innerHTML, /展开报纸/);
for (const action of ['recap', 'ending', 'dialogue', 'game-continue', 'act-next']) click(action);
click('jump', { act: 'act05' });
assert.equal(state.screen, 'home', '不能从首页绕过序章或章节锁');
click('start');
assert.equal(state.screen, 'intro');
assert.equal(timers.size, 1);
assert.equal(delays.get(timerId), 14000);
assert.match(app.innerHTML, /我不知道為什麼要一次次渡過同一條河。/);
assert.match(app.innerHTML, /我只是千千萬萬紅軍裡的一名普通士兵。/);
assert.match(app.innerHTML, /跟著隊伍，一步一步往前走。/);
finishOpening();
assert.equal(state.screen, 'intro', '动画结束前不能直接继续');
click('sound');
assert.equal(timers.size, 1, '切换声音不重启动画计时');
fireDelay(14000);
click('intro-continue');
keyListener({ key: ' ', repeat: false, target: { closest: () => null }, preventDefault() {} });
assert.equal(state.introSeen, false, '文字依次渐显期间，点击和空格均不能提前继续');
click('skip-intro');
assert.equal(timers.size, 1, '重复跳过影像不会重启文字动画');
fireDelay(5000);
click('intro-continue');
assert.equal(state.introSeen, false, '按钮渐显完成前不能继续');
fireDelay(900);
assert.equal(timers.size, 0);
assert.equal(state.screen, 'intro', '文字和按钮全部浮现后等待点击，不自动跳入第一幕');
finishOpening();
assert.equal(state.screen, 'act');
assert.match(app.innerHTML, /class="act-transition"/);
click('dialogue'); click('menu'); click('game-continue');
assert.equal(state.cursors.act01 ?? 0, 0, '幕间动画期间不能操作正文');
fireDelay(3800);
assert.ok(!app.innerHTML.includes('class="act-transition"'));
assert.equal(context.testWriter.typing, true);
fireDelay(36);
click('sound');
assert.equal(state.cursors.act01 ?? 0, 0, '声音按钮不推进正文');
click('menu'); assert.equal(timers.size, 0, '目录打开时暂停打字');
click('dialogue'); assert.equal(state.cursors.act01 ?? 0, 0);
click('menu'); assert.equal(timers.size, 1, '关闭目录恢复打字');
click('dialogue');
assert.equal(state.cursors.act01 ?? 0, 0, '第一次点击只补全当前句');
assert.equal(context.testWriter.typing, false);
click('dialogue'); assert.equal(state.frames.act01, 1, '第二次点击进入本段下一框');
assert.equal(state.cursors.act01 ?? 0, 0, '分框未读完不能跳过段落');
readLine(); assert.equal(state.cursors.act01, 1);

// 全量核对编号、场景、表情配置与左右站位，包含原稿的伤员对白。
const expectedCounts = [28, 30, 23, 23, 24];
const allIds = new Set();
for (const [index, act] of context.testActs.entries()) {
  assert.equal(act.dialogue.length, expectedCounts[index]);
  for (const [cursor, line] of act.dialogue.entries()) {
    assert.ok(!allIds.has(line.id)); allIds.add(line.id);
    const rendered = context.renderAct(act, { ...state, cursors: { [act.id]: cursor }, frames: {}, acknowledged: [act.id] });
    assert.ok(!rendered.includes('dialogue-count') && !rendered.includes('dialogue-actions'));
    assert.ok(!rendered.includes('scene-heading') && !rendered.includes('data-action="source"'));
    if (line.narration) assert.ok(!rendered.includes('class="portrait-stage"'));
    else {
      assert.match(rendered, /data-character="qingshan" data-side="left"/);
      if (line.speaker !== 'qingshan') assert.ok(rendered.includes(`data-character="${line.speaker}" data-side="right"`));
      assert.match(rendered, new RegExp(`portrait-${line.speaker} portrait-(left|right) is-speaking`));
    }
  }
}
assert.equal(allIds.size, 128);
const orderedLines = context.testActs.flatMap(act => act.dialogue);
for (let index = 0; index < orderedLines.length; index++) assert.equal(orderedLines[index].nextId, orderedLines[index + 1]?.id ?? 'RECAP', '后继 ID 与最终阅读顺序一致');
let totalFrames = 0;
for (const act of context.testActs) {
  for (const line of act.dialogue) {
    const frames = context.subtitleFrames(line);
    totalFrames += frames.length;
    assert.equal(frames.map(frame => frame.text.replaceAll('\n', '')).join(''), line.text, `${line.id} 分框不漏字`);
    for (const frame of frames) {
      assert.ok(frame.text.split('\n').length <= 3);
      assert.ok(frame.text.split('\n').every(row => Array.from(row).length <= 16));
      assert.equal(frame.delays.length, Array.from(frame.text).length);
    }
    if (line.inner) {
      assert.ok(line.text.startsWith('（内心）'));
      assert.match(context.renderAct(act, { ...state, cursors: { [act.id]: act.dialogue.indexOf(line) }, frames: {}, acknowledged: [act.id] }), /subtitle--inner/);
    }
  }
}
assert.equal(totalFrames, 249);
for (const transition of Object.values(context.testTransitions)) {
  assert.ok(transition.lines.length <= 3);
  assert.ok(transition.lines.every(row => Array.from(row).length <= 16));
  assert.ok(transition.duration >= 1200 && transition.duration <= 1800);
}
const restoredOriginal = Object.values(context.testLegacyIds).flat().map(id => context.testActs.flatMap(act => act.dialogue).find(line => line.id === id).text.replace('（内心）', '（心里）')).join('\n');
// 与修订前已发布的 117 条原文比较；仅统一内心标识，重排与分框不能改词。
assert.equal(createHash('sha256').update(restoredOriginal).digest('hex'), 'c99c8e009406c627bbe604f82a9af2bd5e04d611c89097464d7dea9404a64a80');
assert.ok(!allIds.has('A01-D009'), '保留原稿缺号，不凭空补写');
keyListener({ key: ' ', repeat: false, target: { closest: () => null }, preventDefault() {} });
assert.equal(state.cursors.act01, 1, '空格先补全当前句');
keyListener({ key: ' ', repeat: false, target: { closest: () => null }, preventDefault() {} });
assert.equal(state.frames.act01, 1, '完整显示后空格推进一框');
keyListener({ key: 'Enter', repeat: false, target: { closest: () => ({}) }, preventDefault() {} });
assert.equal(state.cursors.act01, 1, '原生按钮键盘事件不重复推进');
state.cursors.act01 = 0; state.frames.act01 = 0; context.render();

const solutions = [
  ['plank', 'slot-0', 'plank', 'slot-1', 'plank', 'slot-2'],
  ['1', '5', '6', '10', '11', '15'],
  Array.from({ length: 6 }, () => ['cover', 'climb', 'duck', 'follow']).flat(),
  ['soldier', 'shelter', 'soldier', 'shelter', 'soldier', 'shelter'],
  Array(8).fill('step'),
];
for (const [index, act] of context.testActs.entries()) {
  if (index > 0) fireDelay(3800);
  assert.equal(state.actId, act.id);
  assert.equal(act.dialogue.length, expectedCounts[index], '每幕段落数与集合版一致');
  click('game', { value: solutions[index][0] });
  assert.equal(state.games[act.id], undefined, '不能在对白阶段预先完成小游戏');
  click('jump', { act: context.testActs[index + 1]?.id ?? 'invalid' });
  assert.equal(state.actId, act.id, '前一幕没完成不能跳下一幕');
  click('recap');
  assert.equal(state.screen, 'act');
  for (let i = 0; i < act.interaction.afterLine; i++) readLine();
  assert.match(app.innerHTML, /class="minigame/);
  click('dialogue'); click('game-continue');
  assert.equal(state.cursors[act.id], act.interaction.afterLine, '未完成游戏不能推进对白');
  click('game', { value: 'wrong-input' });
  assert.equal(state.games[act.id].steps, 0, '无效操作不能增加进度');
  for (const value of solutions[index]) click('game', { value });
  click('game-continue');
  const restored = context.loadGame();
  assert.equal(restored.cursors[act.id], act.interaction.afterLine);
  assert.ok(restored.acknowledged.includes(act.id), '刷新可继续游戏后的对白');
  assert.equal(state.completed.length, index, '小游戏结束后还需要读完收束对白');
  for (let i = act.interaction.afterLine; i < act.dialogue.length; i++) readLine();
  assert.match(app.innerHTML, /本幕结束 · 史料札记/);
  assert.match(app.innerHTML, /网页出处/);
  assert.match(app.innerHTML, /红军长征史/);
  assert.match(app.innerHTML, /target="_blank" rel="noopener noreferrer"/);
  assert.equal(state.completed.length, index, '札记后确认继续才解锁下一幕');
  assert.equal(context.loadGame().cursors[act.id], act.dialogue.length, '幕末刷新可以恢复札记页');
  click('dialogue');
  assert.equal(state.cursors[act.id], act.dialogue.length, '札记页不接受对话推进');
  click('act-next');
  assert.equal(state.completed.length, index + 1);
  finishStory();
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
assert.equal(state.cursors.act02, 0, '回看从第一句开始');
fireDelay(3800);
click('recap'); click('ending'); reducedMotion = true; click('restart');
assert.equal(state.screen, 'intro'); assert.equal(state.completed.length, 0);
assert.equal(delays.get(timerId), 6000, '减少动态模式停留六秒');
click('skip-intro'); assert.equal(state.screen, 'intro'); finishOpening(); click('jump', { act: 'act05' });
assert.equal(state.actId, 'act01', '重开后重新锁定后续章节');
fireDelay(1200);
assert.equal(context.testWriter.typing, false, '减少动态模式直接显示完整对白');
context.navigate('home');
assert.equal(timers.size, 0, '离开正文清理打字和转场计时器');

// 复现旧版所有已读章节停在最后一句的存档，覆盖重看、下一幕和刷新续读。
const legacy = {
  introSeen: true, screen: 'act', actId: 'act02',
  completed: context.testActs.map(act => act.id),
  acknowledged: context.testActs.map(act => act.id),
  cursors: Object.fromEntries(context.testActs.map(act => [act.id, context.testLegacyIds[act.id].length - 1])),
  games: Object.fromEntries(context.testActs.map(act => [act.id, { steps: act.id === 'act03' ? 6 : context.testGameTarget(act) }])),
};
stored = JSON.stringify(legacy);
Object.assign(state, context.loadGame()); context.render();
assert.equal(state.games.act03.steps, 24, '旧版已通关攀登迁移为新规则已完成');
assert.ok(state.acknowledged.includes('act03'));
assert.equal(state.actId, 'act02', '续读保存的章节，不强行改成第五幕');
click('resume');
assert.equal(state.screen, 'act', '已通关后仍能续读正在回看的章节');
assert.equal(context.testActs[1].dialogue[state.cursors.act02].id, 'A02-D024', '主动续读按段落 ID 保留最后一句');
click('jump', { act: 'act02' }); fireDelay(1200);
assert.equal(state.cursors.act02, 0);
assert.equal(state.games.act02, undefined);
assert.ok(!state.acknowledged.includes('act02'));
readLine(); readLine();
click('home'); Object.assign(state, context.loadGame()); context.render(); click('resume');
assert.equal(state.actId, 'act02');
assert.equal(state.cursors.act02, 2, '回看中刷新再继续保留实际对白位置');
const replay = context.testActs[1];
for (let cursor = 2; cursor < replay.interaction.afterLine; cursor++) readLine();
for (const value of solutions[1]) click('game', { value });
click('game-continue');
for (let cursor = replay.interaction.afterLine; cursor < replay.dialogue.length; cursor++) readLine();
assert.match(app.innerHTML, /本幕结束 · 史料札记/);
click('act-next'); finishStory(); fireDelay(1200);
assert.equal(state.actId, 'act03'); assert.equal(state.cursors.act03, 0, '进入下一幕清除旧的最后一句位置');
assert.equal(state.games.act03, undefined, '下一幕重新体验互动');
readLine(); readLine(); assert.equal(state.cursors.act03, 2);
click('home'); click('start'); click('skip-intro'); finishOpening(); fireDelay(1200);
assert.equal(state.actId, 'act01'); assert.equal(state.cursors.act01 ?? 0, 0);
assert.equal(state.completed.length, 0, '从头重走清除旧解锁与进度');
assert.equal(Object.keys(state.games).length, 0);
readLine(); readLine(); assert.equal(state.cursors.act01, 2);
context.navigate('home');

stored = JSON.stringify({ ...legacy, games: { ...legacy.games, act03: { steps: 3 } } });
assert.equal(context.loadGame().games.act03.steps, 0, '旧版未完成攀登从新口令序列起点开始');
stored = JSON.stringify({ ...legacy, version: 4, games: { ...legacy.games, act03: { steps: 11 } } });
assert.equal(context.loadGame().games.act03.steps, 11, '新版二十四步进度刷新不丢失');
stored = JSON.stringify({ ...legacy, version: 4, cursors: { ...legacy.cursors, act05: 5 } });
assert.equal(context.testActs[4].dialogue[context.loadGame().cursors.act05].id, 'A05-D006', '第五幕重排后按旧 ID 找回原段落');
stored = JSON.stringify({ ...legacy, version: 5, bookmarks: { act02: 'A02-D011b', act05: '@notes' }, frames: { act02: 1 } });
assert.equal(context.testActs[1].dialogue[context.loadGame().cursors.act02].id, 'A02-D011b');
assert.equal(context.loadGame().frames.act02, 1, '新增段落的第二框可恢复');
assert.equal(context.loadGame().cursors.act05, context.testActs[4].dialogue.length, '新版幕末书签可恢复');
stored = '{broken'; assert.equal(context.loadGame().introSeen, false);
stored = JSON.stringify({ introSeen: true, completed: ['act05'], cursors: { act01: 10000 }, games: { act01: { steps: -9 } } });
const repaired = context.loadGame();
assert.equal(repaired.completed.length, 0, '损坏存档不能跳过前置章节');
assert.equal(repaired.cursors.act01, context.testActs[0].interaction.afterLine);
assert.equal(repaired.games.act01.steps, 0);
const climb = context.testActs[2];
assert.equal(context.testGameTarget(climb), 24);
for (const [steps, wrong, expected] of [[0, 'follow', 0], [2, 'cover', 0], [4, 'duck', 0], [7, 'cover', 0], [8, 'follow', 4], [11, 'cover', 4], [23, 'cover', 16]]) {
  const result = context.playGame(climb, { steps, selected: null, feedback: '' }, wrong);
  assert.equal(result.steps, expected, `第 ${steps} 步点错，回到上一段起点`);
  assert.match(result.feedback, /掩护/);
}
assert.equal(context.playGame(climb, { steps: 11, selected: null, feedback: '' }, 'invalid').steps, 11, '无效输入不算听错有效口令');
assert.match(context.playGame(climb, { steps: 3, selected: null, feedback: '' }, 'follow').feedback, /第 1 道口令走完/);
const climbUI = context.renderInteraction(climb, { steps: 11, selected: null, feedback: '' });
assert.match(climbUI, /已完成 2 段，共 6 段/);
assert.match(climbUI, /第 3 段/);
assert.equal((climbUI.match(/class="is-done"/g) ?? []).length, 3);
assert.match(climbUI, /aria-current="step">跟进/);
// 打字器按字符而非 UTF-16 半个字符输出，重绑 DOM 保留进度，离开后停止。
const standalone = new context.TestTypewriter();
let displayed = '';
standalone.bind('test', '甲😀乙', visible => { displayed = visible; });
fireDelay(36); assert.equal(displayed, '甲');
standalone.pause(); assert.equal(timers.size, 0);
standalone.bind('test', '甲😀乙', visible => { displayed = visible; });
assert.equal(displayed, '甲', '重新绑定 DOM 不重播');
fireDelay(36); assert.equal(displayed, '甲😀');
fireDelay(36); assert.equal(displayed, '甲😀乙');
assert.equal(standalone.typing, false); assert.equal(timers.size, 0);
standalone.bind('pauses', '甲，乙。丙', visible => { displayed = visible; }, false, [36, 250, 36, 750, 36]);
fireDelay(36); fireDelay(36); assert.equal(displayed, '甲，');
fireDelay(250); assert.equal(displayed, '甲，乙', '逗号停顿 250ms');
fireDelay(36); assert.equal(displayed, '甲，乙。');
fireDelay(750); assert.equal(displayed, '甲，乙。丙', '句末停顿 750ms');
console.log('通过：128 段正文与分框、左右站位、幕间动画与操作锁、点击补全/推进、键盘、目录暂停、五种小游戏、幕末札记与续读、完整通关、复盘与信件、存档和减少动态模式。');

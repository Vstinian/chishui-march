import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const readSource = (path) => stripTypeScriptTypes(
  readFileSync(new URL(path, import.meta.url), 'utf8')
    .replace(/^import .*;\s*$/gm, '')
    .replace(/^export /gm, ''),
  { mode: 'strip' },
);

let clickListener;
let dialogOpened = false;
const app = {
  innerHTML: '',
  addEventListener(_type, listener) { clickListener = listener; },
  querySelector(selector) {
    if (selector === '#main-content') return { focus() {} };
    if (selector === '#source-dialog') return {
      showModal() { dialogOpened = true; },
      close() { dialogOpened = false; },
      addEventListener() {},
    };
    return null;
  },
};

const context = { document: { querySelector: () => app }, window: { scrollTo() {} }, console };
const sources = [
  '../src/data/acts.ts',
  '../src/utils/html.ts',
  '../src/components/Interaction.ts',
  '../src/components/ActView.ts',
  '../src/components/SourceCard.ts',
  '../src/main.ts',
];
runInNewContext(`${sources.map(readSource).join('\n')}\nglobalThis.testState = state;`, context);

const click = (action, dataset = {}) => clickListener({ target: { closest: () => ({ dataset: { action, ...dataset } }) } });

assert.match(app.innerHTML, /开始行军/);
click('start');
assert.equal(context.testState.actId, 'act01');
click('next');
assert.equal(context.testState.actId, 'act01', '未完成互动不能进入下一幕');
click('source', { source: 'source-act01' });
assert.equal(dialogOpened, true, '史料卡应打开');
click('close-source');
assert.equal(dialogOpened, false, '史料卡应关闭');

click('option', { option: 'shoes' });
click('next');
assert.equal(context.testState.actId, 'act02');
for (const option of ['sign-1', 'sign-2', 'sign-3']) click('option', { option });
assert.match(app.innerHTML, /路标三/);
click('next');
assert.equal(context.testState.actId, 'act03');
click('option', { option: 'listen' });
click('next');
assert.equal(context.testState.actId, 'act04');
click('option', { option: 'witness' });
click('next');
assert.equal(context.testState.actId, 'act05');
for (const option of ['crossing-1', 'crossing-2', 'crossing-3', 'crossing-4']) click('option', { option });
click('next');
assert.equal(context.testState.screen, 'ending', '五幕应连续通关');
click('restart');
assert.equal(context.testState.actId, 'act01');
assert.equal(Object.keys(context.testState.selections).length, 0, '重看应清空局部选择');
click('jump', { act: 'act05' });
assert.equal(context.testState.actId, 'act05', '章节目录应能直达第五幕');

console.log('五幕流程、史料卡、章节跳转与重看：通过');

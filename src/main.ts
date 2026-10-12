import './style.css';
import { acts, sourceCards } from './data/acts';
import type { Act, ActId } from './types';
import { escapeHtml } from './utils/html';
import { renderAct } from './components/ActView';
import { renderSourceDialog } from './components/SourceCard';

type Screen = 'home' | 'act' | 'ending';

interface GameState {
  screen: Screen;
  actId: ActId;
  selections: Partial<Record<ActId, string[]>>;
  menuOpen: boolean;
  activeSource: string | null;
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount point');

const state: GameState = {
  screen: 'home',
  actId: 'act01',
  selections: {},
  menuOpen: false,
  activeSource: null,
};

for (const act of acts) {
  if (act.nextAct && !acts.some((entry) => entry.id === act.nextAct)) {
    throw new Error(`Unknown nextAct: ${act.nextAct}`);
  }
  for (const sourceId of act.sourceIds) {
    if (!sourceCards[sourceId]) throw new Error(`Unknown sourceId: ${sourceId}`);
  }
}

const currentAct = (): Act => acts.find((act) => act.id === state.actId) ?? acts[0];

function isComplete(act: Act): boolean {
  const chosen = state.selections[act.id] ?? [];
  return act.interaction.kind === 'choice'
    ? chosen.length === 1
    : act.interaction.options.every((option) => chosen.includes(option.id));
}

function renderHeader(): string {
  const progress = state.screen === 'home' ? 0 : state.screen === 'ending' ? 5 : acts.findIndex((act) => act.id === state.actId) + 1;
  return `<header class="site-header">
    <button class="brand" data-action="home" aria-label="返回首页"><span class="brand-mark">赤</span><span>赤水行军图</span></button>
    <div class="header-actions">
      <span class="progress-label">${progress === 0 ? '序章' : progress === 5 && state.screen === 'ending' ? '尾声' : `第 ${progress} / 5 幕`}</span>
      <button class="icon-button" data-action="menu" aria-expanded="${state.menuOpen}" aria-controls="chapter-menu">章节目录</button>
    </div>
  </header>
  <nav id="chapter-menu" class="chapter-menu" aria-label="章节目录" ${state.menuOpen ? '' : 'hidden'}>
    <button data-action="home">首页<span>序章</span></button>
    ${acts.map((act, index) => `<button data-action="jump" data-act="${act.id}" ${state.screen === 'act' && state.actId === act.id ? 'aria-current="page"' : ''}>${escapeHtml(act.title)}<span>${String(index + 1).padStart(2, '0')}</span></button>`).join('')}
    <button data-action="ending">结尾<span>回顾</span></button>
  </nav>`;
}

function renderHome(): string {
  return `<main id="main-content" class="home-screen" tabindex="-1">
    <div class="home-art" aria-hidden="true"><span class="ridge ridge-back"></span><span class="ridge ridge-front"></span><span class="river"></span></div>
    <div class="home-content">
      <p class="eyebrow">五幕网页叙事 · 可通关占位版</p>
      <h1>赤水<br />行军图</h1>
      <p class="lead">跟随一名普通士兵，走过五段行程。先看见眼前的路，再回望全局。</p>
      <p class="review-note">本版场景文字与路线均为制作占位内容，史实卡待逐条审核。</p>
      <button class="primary-button" data-action="start">开始行军 <span aria-hidden="true">→</span></button>
      <p class="home-footnote">约 8–12 分钟为最终内容目标；当前占位版可快速通关。</p>
    </div>
  </main>`;
}

function renderEnding(): string {
  return `<main id="main-content" class="ending-screen" tabindex="-1">
    <div class="ending-card"><p class="eyebrow">五幕结束 · 回看全局</p><h1>路在身后<br />渐渐清晰</h1>
      <p>你所选择的回应与物件留在个人记忆里；五幕叙事的历史事件和结尾保持一致。</p>
      <p class="review-note">正式版结论与四渡路线说明，等待史实组提供可定位的出处后接入。</p>
      <div class="ending-actions"><button class="primary-button" data-action="restart">从头重看 <span aria-hidden="true">↺</span></button><button class="secondary-button" data-action="menu">选择章节</button></div>
    </div>
  </main>`;
}

function render(): void {
  const act = currentAct();
  app!.innerHTML = `${renderHeader()}${state.screen === 'home' ? renderHome() : state.screen === 'ending' ? renderEnding() : renderAct(act, acts.indexOf(act), state.selections[act.id] ?? [], isComplete(act))}${renderSourceDialog(state.activeSource ? sourceCards[state.activeSource] : undefined)}<footer class="site-footer">赤水行军图 · 五幕交互框架 <span>内容审核中</span></footer>`;
  if (state.activeSource) {
    const dialog = app!.querySelector<HTMLDialogElement>('#source-dialog');
    dialog?.showModal();
    dialog?.addEventListener('close', () => { state.activeSource = null; });
  }
}

function navigate(screen: Screen, actId?: ActId): void {
  state.screen = screen;
  if (actId) state.actId = actId;
  state.menuOpen = false;
  state.activeSource = null;
  render();
  app!.querySelector<HTMLElement>('#main-content')?.focus();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

app.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'home') navigate('home');
  if (action === 'start') navigate('act', 'act01');
  if (action === 'ending') navigate('ending');
  if (action === 'restart') { state.selections = {}; navigate('act', 'act01'); }
  if (action === 'jump') navigate('act', button.dataset.act as ActId);
  if (action === 'menu') { state.menuOpen = !state.menuOpen; render(); }
  if (action === 'option') {
    const act = currentAct();
    const optionId = button.dataset.option;
    if (!optionId || !act.interaction.options.some((option) => option.id === optionId)) return;
    const selected = state.selections[act.id] ?? [];
    state.selections[act.id] = act.interaction.kind === 'choice'
      ? [optionId]
      : selected.includes(optionId) ? selected : [...selected, optionId];
    render();
  }
  if (action === 'next' && isComplete(currentAct())) {
    const nextAct = currentAct().nextAct;
    if (nextAct) navigate('act', nextAct);
    else navigate('ending');
  }
  if (action === 'source') { state.activeSource = button.dataset.source ?? null; render(); }
  if (action === 'close-source') {
    app!.querySelector<HTMLDialogElement>('#source-dialog')?.close();
    state.activeSource = null;
    render();
  }
});

render();

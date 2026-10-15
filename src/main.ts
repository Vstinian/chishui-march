import './style.css';
import './immersive.css';
import { acts, sourceCards } from './data/acts';
import { opening, ending } from './data/narrative';
import { recapSteps } from './data/recap';
import type { ActId } from './types';
import type { Screen } from './game';
import { loadGame, saveGame, newGame, canOpen, inGame, atActEnd, gameTarget, freshProgress, playGame, restartAct } from './game';
import { Atmosphere } from './audio';
import { escapeHtml } from './utils/html';
import { renderAct } from './components/ActView';
import { renderActEnd } from './components/ActEndView';
import { bugleIcon, menuIcon } from './components/Icons';
import { Typewriter } from './typewriter';
import { renderRecap } from './components/RecapView';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount point');
const state = loadGame();
const music = new Atmosphere();
let menuOpen = false;
const writer = new Typewriter();
let transitioning = false;
let transitionTimer: ReturnType<typeof setTimeout> | undefined;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let recapStep = 0;
let introReady = false;
let introTimer: ReturnType<typeof setTimeout> | undefined;
const currentAct = () => acts.find(act => act.id === state.actId) ?? acts[0];
const allComplete = () => acts.every(act => state.completed.includes(act.id));

function renderSoundButton(): string {
  const label = music.muted ? '开启声音' : '关闭声音';
  return `<button class="icon-button symbol-button" data-action="sound" aria-pressed="${!music.muted}" aria-label="${label}" title="${label}">${bugleIcon(music.muted)}</button>`;
}
function renderHeader(): string {
  return `<header class="site-header ${state.screen === 'act' ? 'header-immersive' : ''}"><button class="brand" data-action="home" aria-label="返回首页"><span class="brand-mark">赤</span><span>赤水行军图</span></button><div class="header-actions">${renderSoundButton()}<button class="icon-button symbol-button" data-action="menu" aria-label="行军目录" title="行军目录" aria-expanded="${menuOpen}" aria-controls="chapter-menu">${menuIcon}</button></div></header>
  <nav id="chapter-menu" class="chapter-menu" aria-label="章节解锁进度" ${menuOpen ? '' : 'hidden'}><p>完成本幕故事与互动，开启下一幕</p>${acts.map((act, i) => `<button data-action="jump" data-act="${act.id}" ${canOpen(state, act.id) ? '' : 'disabled'} ${state.screen === 'act' && act.id === state.actId ? 'aria-current="page"' : ''}><span>${String(i + 1).padStart(2, '0')}　${escapeHtml(act.title)}</span><small>${state.completed.includes(act.id) ? '从头重看' : canOpen(state, act.id) ? (act.id === state.actId ? '继续' : '进入') : '未解锁'}</small></button>`).join('')}<button data-action="recap" ${allComplete() ? '' : 'disabled'}>全局复盘与尾声 <small>${allComplete() ? '已解锁' : '未解锁'}</small></button></nav>`;
}
function renderActTransition(): string {
  const act = currentAct();
  const number = ['一', '二', '三', '四', '五'][acts.indexOf(act)];
  return `<section class="act-transition" role="dialog" aria-modal="true" aria-labelledby="act-transition-title"><div class="act-transition-copy"><p>第${number}幕</p><h1 id="act-transition-title" tabindex="-1">${escapeHtml(act.title)}</h1><span class="transition-rule" aria-hidden="true"></span></div></section>`;
}

function newspaper(): string {
  return `<article class="newspaper"><div class="newspaper-top"><span>一九三五 · 行军记忆</span><span>川 · 滇 · 黔</span></div><div class="newspaper-masthead"><span>赤水行军图</span><small>CHISHUI / A SOLDIER'S JOURNAL</small></div><div class="newspaper-rule">一名普通战士的眼睛　一段尚未看清的路</div><div class="newspaper-columns"><div class="paper-side"><h3>雾中行</h3><p>河流穿过群山。脚步穿过长夜。纸上的一条线，是我们走过的一天又一天。</p><div class="print-lines"></div></div><div class="paper-center"><p class="paper-kicker">五幕沉浸叙事</p><h1>赤水<br>行军图</h1><div class="paper-landscape"><i></i><span>渡口 · 山路 · 无名的背影</span></div><p>把地图暂时收起<br>先走进一个人的记忆</p></div><div class="paper-side"><h3>四次渡河</h3><p>我不知道前方还有多远，只记得回头时，同行的人仍在身后。</p><div class="print-lines"></div></div></div><div class="newspaper-bottom">艺术化叙事样报 · 非历史报纸原件 <span>壹 · 贰 · 叁 · 肆</span></div></article>`;
}
function renderHome(): string {
  return `<main id="main-content" class="home-screen" tabindex="-1"><div class="home-dateline">交互叙事 / CHISHUI MARCH</div><div class="home-paper">${newspaper()}</div><div class="home-entry"><button class="primary-button" data-action="start">${state.introSeen ? '从头重走' : '展开报纸 · 开始行军'} <span>↗</span></button>${state.introSeen ? '<button class="secondary-button" data-action="resume">继续上次行程 →</button>' : ''}<p>点击开启声音　·　建议佩戴耳机</p><small>人物与对白为文学虚构 · 场景、立绘及音乐为制作占位</small></div></main>`;
}
function renderIntro(): string {
  return `<main id="main-content" class="intro-screen ${introReady ? 'is-ready' : ''}" style="--intro-duration: ${opening.duration}ms" tabindex="-1"><div class="intro-paper">${newspaper()}</div>${opening.video ? `<video class="intro-video" autoplay muted playsinline src="${escapeHtml(opening.video)}"></video>` : '<div class="intro-shot"><div class="mountain far"></div><div class="mountain near"></div></div>'}<div class="intro-darkness"></div><p class="intro-caption intro-caption-first">${escapeHtml(opening.captions[0])}</p><p class="intro-caption intro-caption-second">${escapeHtml(opening.captions[1])}</p><div class="intro-words"><span>一九三五 · 赤水河畔</span><div class="intro-monologue">${opening.monologue.map(text => `<p>${escapeHtml(text)}</p>`).join('')}</div><button class="primary-button" data-action="intro-continue" ${introReady ? '' : 'hidden'}>点击继续 →</button></div><div class="intro-controls">${renderSoundButton()}<button class="icon-button" data-action="skip-intro" ${introReady ? 'hidden' : ''}>跳过动画 →</button></div></main>`;
}
function renderEnding(): string {
  return `<main id="main-content" class="ending-screen" tabindex="-1"><div class="ending-card paper-panel"><span class="eyebrow">五幕终 · 记忆仍在</span><h1>纸上的线<br>脚下的路</h1>${ending.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('')}<section class="ending-letter" aria-labelledby="letter-title"><h2 id="letter-title">${escapeHtml(ending.letterTitle)}</h2><small>文学虚构 · 非史料原件</small>${ending.letter.map(text => `<p>${escapeHtml(text)}</p>`).join('')}</section><p class="review-note">人物与对白为文学虚构；历史事件与数字待史实组逐项复核。</p><div class="ending-actions"><button class="primary-button" data-action="recap">再看全图</button><button class="secondary-button" data-action="restart">重新开始</button></div></div></main>`;
}
function syncDialogue(): void {
  writer.pause();
  const act = currentAct();
  if (state.screen !== 'act' || transitioning || menuOpen || document.hidden || inGame(state, act) || atActEnd(state, act)) return;
  const line = act.dialogue[state.cursors[act.id] ?? 0];
  const visible = app!.querySelector<HTMLElement>('.dialogue-revealed');
  const remaining = app!.querySelector<HTMLElement>('.dialogue-pending');
  const box = app!.querySelector<HTMLElement>('.dialogue-box');
  if (!visible || !remaining || !box) return;
  writer.bind(line.id, line.text, (shown, hidden) => {
    visible.textContent = shown;
    remaining.textContent = hidden;
    box.dataset.typing = String(hidden.length > 0);
    box.setAttribute('aria-label', hidden ? '显示完整对白' : '下一段对白');
  }, reducedMotion());
}
function render(): void {
  writer.pause();
  const act = currentAct();
  const content = state.screen === 'home' ? renderHome() : state.screen === 'intro' ? renderIntro() : state.screen === 'act' ? atActEnd(state, act) ? renderActEnd(act, act.sourceIds.map(id => sourceCards[id])) : renderAct(act, state) : state.screen === 'recap' ? renderRecap(recapStep) : renderEnding();
  app!.innerHTML = `<div class="page-shell" ${transitioning ? 'inert aria-hidden="true"' : ''}>${state.screen === 'intro' ? '' : renderHeader()}${content}</div>${transitioning ? renderActTransition() : ''}`;
  syncDialogue();
  saveGame(state);
}
function navigate(screen: Screen, id?: ActId, showTitle = false): void {
  if (screen === 'act' && !canOpen(state, id ?? state.actId)) return;
  if ((screen === 'recap' || screen === 'ending') && !allComplete()) return;
  clearTimeout(introTimer); clearTimeout(transitionTimer); writer.reset();
  state.screen = screen; if (id) state.actId = id;
  if (screen === 'act' || screen === 'recap' || screen === 'ending') state.resumeScreen = screen;
  if (screen === 'recap') recapStep = 0;
  menuOpen = false;
  transitioning = screen === 'act' && showTitle && !atActEnd(state, currentAct());
  if (screen === 'home') music.pause();
  render();
  app!.querySelector<HTMLElement>(transitioning ? '#act-transition-title' : '#main-content')?.focus();
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (transitioning) transitionTimer = setTimeout(() => {
    transitioning = false;
    render(); app!.querySelector<HTMLElement>('.dialogue-box, #main-content')?.focus();
  }, reducedMotion() ? 1200 : 3800);
}
function advanceDialogue(): void {
  const act = currentAct();
  if (state.screen !== 'act' || menuOpen || transitioning || inGame(state, act) || atActEnd(state, act)) return;
  if (writer.reveal()) return;
  const cursor = state.cursors[act.id] ?? 0;
  if (cursor === act.dialogue.length - 1 && (!state.acknowledged.includes(act.id) || (state.games[act.id]?.steps ?? 0) < gameTarget(act))) return;
  state.cursors[act.id] = cursor + 1;
  render();
  app!.querySelector<HTMLElement>('.dialogue-box, #main-content')?.focus();
}
function finishIntro(): void { if (state.screen !== 'intro' || !introReady) return; state.introSeen = true; navigate('act', 'act01', true); }
function revealIntroEnd(): void {
  if (state.screen !== 'intro') return;
  clearTimeout(introTimer);
  introReady = true;
  // 只更新末帧状态，不重建 DOM，避免视频和 CSS 动画重新开始。
  app!.querySelector('.intro-screen')?.classList.add('is-ready');
  const next = app!.querySelector<HTMLButtonElement>('[data-action="intro-continue"]');
  if (next) next.hidden = false;
  const skip = app!.querySelector<HTMLButtonElement>('[data-action="skip-intro"]');
  if (skip) skip.hidden = true;
  app!.querySelector<HTMLVideoElement>('.intro-video')?.pause();
  next?.focus();
}
function startIntro(): void {
  Object.assign(state, newGame());
  introReady = false;
  navigate('intro'); void music.start();
  introTimer = setTimeout(revealIntroEnd, reducedMotion() ? opening.reducedDuration : opening.duration);
}
function focusAfterRender(action: string, value?: string): void {
  render();
  const selector = value === undefined ? `[data-action="${action}"]` : `[data-action="${action}"][data-value="${value}"]`;
  const button = app!.querySelector<HTMLButtonElement>(selector);
  if (button && !button.disabled) button.focus();
  else app!.querySelector<HTMLElement>('[data-action="game-continue"], .game-control:not(:disabled), .dialogue-box')?.focus();
}
app.addEventListener('click', event => {
  const control = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!control || control.matches(':disabled') || transitioning) return;
  const action = control.dataset.action;
  if (action === 'sound') {
    music.toggle(); if (!music.muted && state.screen !== 'home') void music.start();
    const label = music.muted ? '开启声音' : '关闭声音';
    control.innerHTML = bugleIcon(music.muted);
    control.setAttribute('aria-pressed', String(!music.muted)); control.setAttribute('aria-label', label); control.setAttribute('title', label); return;
  }
  if (action === 'home') navigate('home');
  if (action === 'start') startIntro();
  if (action === 'skip-intro') revealIntroEnd();
  if (action === 'intro-continue') finishIntro();
  if (action === 'resume' && state.introSeen) { void music.start(); navigate(state.resumeScreen, state.actId, (state.cursors[state.actId] ?? 0) === 0); }
  if (action === 'restart' && allComplete()) startIntro();
  if (action === 'jump' && canOpen(state, control.dataset.act ?? '')) {
    const id = control.dataset.act as ActId;
    // 当前章节只关闭目录；已完成或切换到其他章节时从第一句重看。
    if (id !== state.actId || state.completed.includes(id)) restartAct(state, id);
    void music.start(); navigate('act', id, (state.cursors[id] ?? 0) === 0);
  }
  if (action === 'menu' && state.screen !== 'intro') {
    menuOpen = !menuOpen;
    // 目录浮层只改自身可见性，保持当前对白及打字位置。
    const menu = app!.querySelector<HTMLElement>('#chapter-menu'); if (menu) menu.hidden = !menuOpen;
    control.setAttribute('aria-expanded', String(menuOpen));
    if (menuOpen) writer.pause(); else syncDialogue();
  }
  if (action === 'recap') navigate('recap');
  if (action === 'ending' && state.screen === 'recap') navigate('ending');
  if (action === 'recap-step' && state.screen === 'recap') { const step = Number(control.dataset.step); if (Number.isInteger(step) && step >= 0 && step < recapSteps.length) { recapStep = step; render(); } }
  const act = currentAct();
  if (state.screen === 'act' && !menuOpen) {
    if (action === 'dialogue') advanceDialogue();
    if (action === 'game' && inGame(state, act)) { state.games[act.id] = playGame(act, state.games[act.id] ?? freshProgress(), control.dataset.value ?? ''); focusAfterRender('game', control.dataset.value); }
    if (action === 'game-continue' && inGame(state, act) && (state.games[act.id]?.steps ?? 0) >= gameTarget(act)) { state.acknowledged.push(act.id); focusAfterRender('dialogue'); }
    if (action === 'act-next' && atActEnd(state, act) && state.acknowledged.includes(act.id) && (state.games[act.id]?.steps ?? 0) >= gameTarget(act)) {
      if (!state.completed.includes(act.id)) state.completed.push(act.id);
      if (act.nextAct) restartAct(state, act.nextAct);
      navigate(act.nextAct ? 'act' : 'recap', act.nextAct ?? undefined, true);
    }
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { music.pause(); writer.pause(); }
  else { if (state.screen !== 'home') void music.start(); syncDialogue(); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuOpen) {
    menuOpen = false;
    const menu = app!.querySelector<HTMLElement>('#chapter-menu'); if (menu) menu.hidden = true;
    const trigger = app!.querySelector<HTMLElement>('[data-action="menu"]'); trigger?.setAttribute('aria-expanded', 'false'); trigger?.focus(); syncDialogue(); return;
  }
  if (event.repeat || (event.key !== ' ' && event.key !== 'Enter') || transitioning || menuOpen) return;
  if ((event.target as HTMLElement).closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
  if (state.screen === 'intro' && introReady) { event.preventDefault(); finishIntro(); }
  else if (state.screen === 'act' && !inGame(state, currentAct()) && !atActEnd(state, currentAct())) { event.preventDefault(); advanceDialogue(); }
});
render();

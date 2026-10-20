import './style.css';
import './immersive.css';
import { acts, sourceCards } from './data/acts';
import { opening, ending, scenes } from './data/narrative';
import { script } from './data/script';
import { CuePlayer } from './sound/engine';
import { validateSoundConfig, soundFingerprint } from './sound/schema';
import type { SoundConfig } from './sound/schema';
import { warmImages } from './sound/preload';
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
import { subtitleFrames } from './subtitles';
import { renderRecap } from './components/RecapView';
import { storyTransitions } from './data/transitions';
import { renderStoryTransition } from './components/TransitionView';
import { renderOpeningNewspaper, renderOpeningLandscape } from './components/OpeningArt';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount point');
const studioMode = typeof window.location !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) && new URLSearchParams(window.location.search).has('audioStudioPreview');
const state = studioMode ? newGame() : loadGame();
const music = new Atmosphere();
const soundPlayer = new CuePlayer(script.map(line => line.id));
let studioPaused = false;
let studioAudioEnabled = !studioMode;
function studioMessage(data: object): void { if (studioMode) window.parent.postMessage({ source: 'chishui-preview', ...data }, window.location.origin); }
soundPlayer.onActivity = items => studioMessage({ type: 'activity', items });
soundPlayer.onError = message => studioMessage({ type: 'audio-error', message });
function configureSound(config: SoundConfig): void {
  if (!config.scriptFingerprint && config.cues?.length === 0) config.scriptFingerprint = soundFingerprint(script);
  const errors = validateSoundConfig(config, script);
  if (errors.length) { studioMessage({ type: 'audio-error', message: errors.join('；') }); console.warn('音频配置未加载', errors); return; }
  soundPlayer.configure(config); music.setExternalMusic(config.cues.some(c => c.enabled && c.bus === 'music'));
}
if (typeof fetch !== 'undefined') void fetch('audio/cues.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('audio config unavailable'); return r.json(); }).then(configureSound).catch(() => {});
let menuOpen = false;
const writer = new Typewriter();
let transitioning = false;
let transitionTimer: ReturnType<typeof setTimeout> | undefined;
let storyTransition: { id: string; ready: boolean; finish: () => void } | null = null;
let storyTransitionTimer: ReturnType<typeof setTimeout> | undefined;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let recapStep = 0;
let introReady = false;
let introWordsStarted = false;
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
  return renderOpeningNewspaper();
}
function renderHome(): string {
  return `<main id="main-content" class="home-screen" tabindex="-1"><div class="home-dateline">交互叙事 / CHISHUI MARCH</div><div class="home-paper">${newspaper()}</div><div class="home-entry"><button class="primary-button" data-action="start">${state.introSeen ? '从头重走' : '展开报纸 · 开始行军'} <span>↗</span></button>${state.introSeen ? '<button class="secondary-button" data-action="resume">继续上次行程 →</button>' : ''}<p>点击开启声音　·　建议佩戴耳机</p><small>艺术化叙事样报 · 非历史报纸原件 · 人物与对白为文学虚构</small></div></main>`;
}
function renderIntro(): string {
  return `<main id="main-content" class="intro-screen intro-with-art ${introWordsStarted ? 'is-reading' : ''}" lang="zh-Hant" style="--intro-duration: ${opening.duration}ms; --line-fade: ${opening.lineFade}ms; --button-fade: ${opening.buttonFade}ms" tabindex="-1"><div class="intro-paper">${newspaper()}</div>${opening.video ? `<video class="intro-video" autoplay muted playsinline src="${escapeHtml(opening.video)}"></video>` : renderOpeningLandscape()}<div class="intro-darkness"></div><p class="intro-caption intro-caption-first">${escapeHtml(opening.captions[0])}</p><p class="intro-caption intro-caption-second">${escapeHtml(opening.captions[1])}</p><div class="intro-words"><span>一九三五 · 赤水河畔</span><div class="intro-monologue">${renderIntroWords()}</div><button class="primary-button" data-action="intro-continue" ${introReady ? '' : 'hidden disabled'}>點擊繼續 →</button></div><div class="intro-controls">${renderSoundButton()}<button class="icon-button" data-action="skip-intro" ${introWordsStarted ? 'hidden' : ''}>跳過影像 →</button></div></main>`;
}
function renderEnding(): string {
  return `<main id="main-content" class="ending-screen" tabindex="-1"><div class="ending-card paper-panel"><span class="eyebrow">五幕终 · 记忆仍在</span><h1>纸上的线<br>脚下的路</h1>${ending.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('')}<section class="ending-letter" aria-labelledby="letter-title"><h2 id="letter-title">${escapeHtml(ending.letterTitle)}</h2><small>文学虚构 · 非史料原件</small>${ending.letter.map(text => `<p>${escapeHtml(text)}</p>`).join('')}</section><p class="review-note">人物与对白为文学虚构；历史事件与数字待史实组逐项复核。</p><div class="ending-actions"><button class="primary-button" data-action="recap">再看全图</button><button class="secondary-button" data-action="restart">重新开始</button></div></div></main>`;
}
function syncDialogue(): void {
  writer.pause();
  const act = currentAct();
  if (state.screen !== 'act' || transitioning || storyTransition || inGame(state, act) || atActEnd(state, act)) { soundPlayer.reset(); return; }
  soundPlayer.setPaused(menuOpen || document.hidden || studioPaused);
  if (menuOpen || document.hidden || studioPaused) return;
  const line = act.dialogue[state.cursors[act.id] ?? 0];
  const frame = subtitleFrames(line)[state.frames[act.id] ?? 0];
  const visible = app!.querySelector<HTMLElement>('.dialogue-revealed');
  const remaining = app!.querySelector<HTMLElement>('.dialogue-pending');
  const box = app!.querySelector<HTMLElement>('.dialogue-box');
  if (!visible || !remaining || !box) return;
  writer.bind(frame.id, frame.text, (shown, hidden) => {
    visible.textContent = shown;
    remaining.textContent = hidden;
    box.dataset.typing = String(hidden.length > 0);
    box.setAttribute('aria-label', hidden ? '显示完整对白' : '下一段对白');
    if (studioAudioEnabled) soundPlayer.update({ actId: act.id, lineId: line.id, frame: state.frames[act.id] ?? 0, frames: subtitleFrames(line).map(f => f.text), shown });
  }, reducedMotion(), frame.delays);
  studioMessage({ type: 'position', lineId: line.id, frame: state.frames[act.id] ?? 0 });
  const nextScene = act.dialogue.slice((state.cursors[act.id] ?? 0) + 1).find(next => next.sceneId !== line.sceneId)?.sceneId;
  warmImages([scenes[line.sceneId], nextScene ? scenes[nextScene] : null]);
  const nextLine = act.dialogue[(state.cursors[act.id] ?? 0) + 1];
  if (nextLine) soundPlayer.preloadVoice(nextLine.id);
}
function render(): void {
  writer.pause();
  const act = currentAct();
  const content = state.screen === 'home' ? renderHome() : state.screen === 'intro' ? renderIntro() : state.screen === 'act' ? atActEnd(state, act) ? renderActEnd(act, act.sourceIds.map(id => sourceCards[id])) : renderAct(act, state) : state.screen === 'recap' ? renderRecap(recapStep) : renderEnding();
  app!.innerHTML = `<div class="page-shell" ${transitioning || storyTransition ? 'inert aria-hidden="true"' : ''}>${state.screen === 'intro' ? '' : renderHeader()}${content}</div>${transitioning ? renderActTransition() : ''}${storyTransition ? renderStoryTransition(storyTransitions[storyTransition.id], storyTransition.ready) : ''}`;
  syncDialogue();
  if (!studioMode) saveGame(state);
}
function beginStoryTransition(id: string, finish: () => void): void {
  clearTimeout(storyTransitionTimer); writer.pause();
  storyTransition = { id, ready: false, finish };
  menuOpen = false;
  music.transitionTo(storyTransitions[id].to, storyTransitions[id].musicLevel, storyTransitions[id].duration);
  render(); app!.querySelector<HTMLElement>('#story-transition-text')?.focus();
  storyTransitionTimer = setTimeout(() => {
    if (!storyTransition || storyTransition.id !== id) return;
    storyTransition.ready = true;
    const button = app!.querySelector<HTMLButtonElement>('[data-action="transition-continue"]');
    if (button) button.hidden = false;
  }, reducedMotion() ? 0 : 2500);
}
function finishStoryTransition(): void {
  if (!storyTransition?.ready) return;
  const finish = storyTransition.finish;
  storyTransition = null; clearTimeout(storyTransitionTimer); finish();
}
function navigate(screen: Screen, id?: ActId, showTitle = false): void {
  if (screen === 'act' && !canOpen(state, id ?? state.actId)) return;
  if ((screen === 'recap' || screen === 'ending') && !allComplete()) return;
  clearTimeout(introTimer); clearTimeout(transitionTimer); writer.reset();
  clearTimeout(storyTransitionTimer); storyTransition = null;
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
  if (state.screen !== 'act' || menuOpen || transitioning || storyTransition || studioPaused || inGame(state, act) || atActEnd(state, act)) return;
  if (writer.reveal()) return;
  const cursor = state.cursors[act.id] ?? 0;
  const frame = state.frames[act.id] ?? 0;
  if (frame + 1 < subtitleFrames(act.dialogue[cursor]).length) {
    state.frames[act.id] = frame + 1;
    render(); app!.querySelector<HTMLElement>('.dialogue-box')?.focus(); return;
  }
  if (cursor === act.dialogue.length - 1 && (!state.acknowledged.includes(act.id) || (state.games[act.id]?.steps ?? 0) < gameTarget(act))) return;
  state.cursors[act.id] = cursor + 1;
  state.frames[act.id] = 0;
  render();
  app!.querySelector<HTMLElement>('.dialogue-box, #main-content')?.focus();
}
function finishIntro(): void {
  if (state.screen !== 'intro' || !introReady) return;
  state.introSeen = true;
  beginStoryTransition('TR-00', () => navigate('act', 'act01', true));
}
function renderIntroWords(): string { return opening.monologue.map((text, index) => `<p style="--line-delay: ${index * opening.lineStagger}ms">${escapeHtml(text)}</p>`).join(''); }
function revealIntroEnd(): void {
  if (state.screen !== 'intro' || introWordsStarted) return;
  clearTimeout(introTimer);
  introWordsStarted = true;
  // 保留 DOM：三句独白依次浮现，全部显示后才播放按钮的渐显。
  app!.querySelector('.intro-screen')?.classList.add('is-reading');
  const skip = app!.querySelector<HTMLButtonElement>('[data-action="skip-intro"]');
  if (skip) skip.hidden = true;
  app!.querySelector<HTMLVideoElement>('.intro-video')?.pause();
  const showContinue = () => {
    if (state.screen !== 'intro') return;
    const next = app!.querySelector<HTMLButtonElement>('[data-action="intro-continue"]');
    if (next) next.hidden = false;
    const enableContinue = () => {
      if (state.screen !== 'intro') return;
      introReady = true;
      if (next) { next.disabled = false; next.focus(); }
    };
    if (reducedMotion()) enableContinue();
    else introTimer = setTimeout(enableContinue, opening.buttonFade);
  };
  if (reducedMotion()) showContinue();
  else introTimer = setTimeout(showContinue, (opening.monologue.length - 1) * opening.lineStagger + opening.lineFade);
}
function startIntro(): void {
  warmImages(Object.values(opening.artwork));
  Object.assign(state, newGame());
  introReady = false;
  introWordsStarted = false;
  music.transitionTo('opening', 1, 0);
  navigate('intro'); void music.start();
  introTimer = setTimeout(revealIntroEnd, reducedMotion() ? opening.reducedDuration : opening.textStart);
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
  if (storyTransition) { if (action === 'transition-continue') finishStoryTransition(); return; }
  if (action === 'sound') {
    music.toggle(); if (!music.muted && state.screen !== 'home') void music.start();
    soundPlayer.setMuted(music.muted);
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
    if (menuOpen) { writer.pause(); soundPlayer.setPaused(true); } else syncDialogue();
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
      const transitionId = ['TR-12', 'TR-23', 'TR-34', 'TR-45', 'TR-5E'][acts.indexOf(act)];
      beginStoryTransition(transitionId, () => navigate(act.nextAct ? 'act' : 'recap', act.nextAct ?? undefined, true));
    }
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { music.pause(); writer.pause(); soundPlayer.setPaused(true); }
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
  if (storyTransition) { event.preventDefault(); finishStoryTransition(); return; }
  if (state.screen === 'intro' && introReady) { event.preventDefault(); finishIntro(); }
  else if (state.screen === 'act' && !inGame(state, currentAct()) && !atActEnd(state, currentAct())) { event.preventDefault(); advanceDialogue(); }
});
if (studioMode) {
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.source !== 'chishui-studio') return;
    const data = event.data;
    if (data.type === 'config') configureSound(data.config);
    if (data.type === 'seek') {
      const act = acts.find(a => a.dialogue.some(line => line.id === data.lineId));
      if (!act) return;
      const cursor = act.dialogue.findIndex(line => line.id === data.lineId);
      const frame = Math.max(0, Math.min(Number(data.frame) || 0, subtitleFrames(act.dialogue[cursor]).length - 1));
      state.introSeen = true; state.completed = acts.map(a => a.id); state.acknowledged = acts.map(a => a.id);
      for (const a of acts) state.games[a.id] = { ...freshProgress(), steps: gameTarget(a) };
      state.cursors[act.id] = cursor; state.frames[act.id] = frame;
      studioAudioEnabled = data.play !== false;
      studioPaused = false; soundPlayer.reset(); soundPlayer.setPaused(false);
      navigate('act', act.id, false);
    }
    if (data.type === 'pause') { studioPaused = Boolean(data.paused); if (!studioPaused) studioAudioEnabled = true; syncDialogue(); }
    if (data.type === 'advance') advanceDialogue();
    if (data.type === 'stop') { studioPaused = true; writer.pause(); soundPlayer.reset(); }
  });
  studioMessage({ type: 'ready' });
} else if (typeof window.addEventListener === 'function') {
  window.addEventListener('pointerdown', () => warmImages([opening.artwork.mist, opening.artwork.ink]), { once: true });
}
render();

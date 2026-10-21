import type { Act, CharacterId } from '../types';
import type { GameState } from '../game';
import { freshProgress, inGame } from '../game';
import { characters, scenes, sceneFraming } from '../data/narrative';
import { escapeHtml } from '../utils/html';
import { renderInteraction } from './Interaction';
import type { GameMotion } from './GameArt';
import { subtitleFrames } from '../subtitles';
import { portraitCast, expressionAt } from '../portraits';

function renderPortrait(id: CharacterId, active: boolean, expression: string): string {
  const character = characters[id];
  const portrait = character.expressions[expression] ?? character.portrait;
  const side = id === 'qingshan' ? 'left' : 'right';
  return `<div class="portrait portrait-${id} portrait-${side} ${portrait ? 'has-art' : 'is-placeholder'} ${active ? 'is-speaking' : 'is-listening'}" data-character="${id}" data-side="${side}" data-expression="${escapeHtml(expression)}" data-active-layer="0" aria-label="${character.name}${active ? '正在说话' : '倾听中'}${portrait ? '' : '，立绘占位'}"><div class="portrait-halo"></div>${portrait ? `<img class="portrait-image" data-portrait-layer="0" src="${escapeHtml(portrait)}" alt="${character.name}立绘" decoding="async" style="opacity:1" /><img class="portrait-image" data-portrait-layer="1" alt="" aria-hidden="true" style="opacity:0" />` : '<div class="figure"><i class="figure-cap"></i><i class="figure-head"></i><i class="figure-body"></i><i class="figure-strap"></i></div>'}${portrait ? '' : `<span class="portrait-caption">${character.name} · 立绘占位</span>`}</div>`;
}

function renderCast(act: Act, cursor: number, frame: number): string {
  const cast = portraitCast(act, cursor);
  if (!cast.length) return '';
  const line = act.dialogue[cursor];
  return `<div class="portrait-stage">${cast.map(({ id, fallback }) => renderPortrait(id, line.speaker === id, expressionAt(line, id, frame, '', fallback))).join('')}</div>`;
}

export function renderAct(act: Act, state: GameState, motion?: GameMotion): string {
  const cursor = state.cursors[act.id] ?? 0;
  const game = inGame(state, act);
  const line = act.dialogue[game ? Math.max(0, cursor - 1) : cursor]; const character = characters[line.speaker];
  const background = scenes[line.sceneId] ?? act.assets.scene;
  const frame = subtitleFrames(line)[game ? 0 : state.frames[act.id] ?? 0];
  return `<main id="main-content" class="stage act-${act.id} ${game ? 'is-game' : ''} ${line.narration ? 'is-narration' : ''}" data-line-id="${line.id}" data-frame-id="${frame.id}" data-scene-id="${line.sceneId}" tabindex="-1">
    <div class="scene-background" aria-hidden="true" style="--scene-position: ${escapeHtml(sceneFraming[line.sceneId] ?? '50% 50%')}">${background ? `<img src="${escapeHtml(background)}" alt="" decoding="async" />` : '<div class="mountain far"></div><div class="mountain near"></div><div class="scene-river"></div>'}</div>
    <h1 class="sr-only">${escapeHtml(act.title)} · ${escapeHtml(line.scene)}</h1>
    ${game ? renderInteraction(act, state.games[act.id] ?? freshProgress(), motion) : `<div class="story-stage">${renderCast(act, cursor, state.frames[act.id] ?? 0)}
    <section class="dialogue-box ${line.inner ? 'subtitle--inner' : ''}" role="button" tabindex="0" data-action="dialogue" aria-keyshortcuts="Space Enter" aria-label="显示完整对白" aria-describedby="dialogue-accessible dialogue-help"><div class="dialogue-heading"><div><strong>${character.name}${line.inner ? ' · 内心' : line.narration ? ' · 独白' : ''}</strong><span>${character.role}</span></div></div><p class="dialogue-text" aria-hidden="true"><span class="dialogue-revealed"></span><span class="dialogue-pending">${escapeHtml(frame.text)}</span></p><span id="dialogue-accessible" class="sr-only">${escapeHtml(frame.text)}</span><span id="dialogue-help" class="sr-only">点击或按空格、回车：文字出现时补全，文字完整时进入下一框。</span></section></div>`}
  </main>`;
}

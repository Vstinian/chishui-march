import type { Act } from '../types';
import type { GameState } from '../game';
import { freshProgress, inGame } from '../game';
import { characters } from '../data/narrative';
import { escapeHtml } from '../utils/html';
import { renderInteraction } from './Interaction';

export function renderAct(act: Act, index: number, state: GameState): string {
  const cursor = state.cursors[act.id] ?? 0;
  const game = inGame(state, act);
  const line = act.dialogue[game ? Math.max(0, cursor - 1) : cursor]; const character = characters[line.speaker];
  const portrait = character.portrait ?? act.assets.character;
  return `<main id="main-content" class="stage act-${act.id} ${game ? 'is-game' : ''}" tabindex="-1">
    <div class="scene-background" aria-hidden="true">${act.assets.scene ? `<img src="${escapeHtml(act.assets.scene)}" alt="" />` : '<div class="mountain far"></div><div class="mountain near"></div><div class="scene-river"></div>'}</div>
    <div class="scene-heading"><span class="eyebrow">第 ${index + 1} 幕 / 五幕行军</span><h1>${escapeHtml(act.title)}</h1><p>${escapeHtml(line.scene)}</p></div>
    <span class="scene-placeholder">场景动态影像 · 待替换</span>
    ${game ? renderInteraction(act, state.games[act.id] ?? freshProgress()) : `<div class="portrait portrait-${line.speaker}" aria-label="${character.name}的立绘占位"><div class="portrait-halo"></div>${portrait ? `<img src="${escapeHtml(portrait)}" alt="${character.name}立绘" />` : '<div class="figure"><i class="figure-cap"></i><i class="figure-head"></i><i class="figure-body"></i><i class="figure-strap"></i></div>'}<span class="portrait-caption">${character.name} · 2D 立绘占位</span></div>
    <section class="dialogue-box" aria-label="人物对话"><div class="dialogue-heading"><div><strong>${character.name}</strong><span>${character.role}</span></div><span class="dialogue-count">${String(cursor + 1).padStart(2, '0')} / ${act.dialogue.length}</span></div><p class="dialogue-text" aria-live="polite">${escapeHtml(line.text)}</p><div class="dialogue-actions"><button class="text-button" data-action="source" data-source="${act.sourceIds[0]}">史料札记 ↗</button><button class="text-button next-line" data-action="advance">${cursor === act.dialogue.length - 1 ? act.nextAct ? '完成本幕 · 继续行军' : '完成五幕 · 回望全局' : '继续'} <span aria-hidden="true">▸</span></button></div></section>`}
  </main>`;
}

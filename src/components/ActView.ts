import type { Act, CharacterId, DialogueLine } from '../types';
import type { GameState } from '../game';
import { freshProgress, inGame } from '../game';
import { characters, scenes } from '../data/narrative';
import { escapeHtml } from '../utils/html';
import { renderInteraction } from './Interaction';

function renderPortrait(id: CharacterId, active: boolean, expression: string): string {
  const character = characters[id];
  const portrait = character.expressions[expression] ?? character.portrait;
  const side = id === 'qingshan' ? 'left' : 'right';
  return `<div class="portrait portrait-${id} portrait-${side} ${active ? 'is-speaking' : 'is-listening'}" data-character="${id}" data-side="${side}" data-expression="${escapeHtml(expression)}" aria-label="${character.name}${active ? '正在说话' : '倾听中'}${portrait ? '' : '，立绘占位'}"><div class="portrait-halo"></div>${portrait ? `<img src="${escapeHtml(portrait)}" alt="${character.name}立绘" />` : '<div class="figure"><i class="figure-cap"></i><i class="figure-head"></i><i class="figure-body"></i><i class="figure-strap"></i></div>'}<span class="portrait-caption">${character.name}${portrait ? '' : ' · 立绘占位'}</span></div>`;
}

function renderCast(act: Act, cursor: number, line: DialogueLine): string {
  if (line.narration) return '';
  // 只从同场景已出现的对白找对话者，防止人物提前出现或跨场景滞留。
  let partner: DialogueLine | undefined;
  for (let i = cursor; i >= 0 && act.dialogue[i].sceneId === line.sceneId; i--) {
    const candidate = act.dialogue[i];
    if (!candidate.narration && candidate.speaker !== 'qingshan') { partner = candidate; break; }
  }
  return `<div class="portrait-stage">${renderPortrait('qingshan', line.speaker === 'qingshan', line.speaker === 'qingshan' ? line.expression : 'neutral')}${partner ? renderPortrait(partner.speaker, line.speaker === partner.speaker, partner.expression) : ''}</div>`;
}

export function renderAct(act: Act, index: number, state: GameState): string {
  const cursor = state.cursors[act.id] ?? 0;
  const game = inGame(state, act);
  const line = act.dialogue[game ? Math.max(0, cursor - 1) : cursor]; const character = characters[line.speaker];
  const background = scenes[line.sceneId] ?? act.assets.scene;
  return `<main id="main-content" class="stage act-${act.id} ${game ? 'is-game' : ''} ${line.narration ? 'is-narration' : ''}" data-line-id="${line.id}" data-scene-id="${line.sceneId}" tabindex="-1">
    <div class="scene-background" aria-hidden="true">${background ? `<img src="${escapeHtml(background)}" alt="" />` : '<div class="mountain far"></div><div class="mountain near"></div><div class="scene-river"></div>'}</div>
    <div class="scene-heading"><span class="eyebrow">第 ${index + 1} 幕 / 五幕行军</span><h1>${escapeHtml(act.title)}</h1><p>${escapeHtml(line.scene)}</p></div>
    ${background ? '' : '<span class="scene-placeholder">场景动态影像 · 待替换</span>'}
    ${game ? renderInteraction(act, state.games[act.id] ?? freshProgress()) : `<div class="story-stage">${renderCast(act, cursor, line)}
    <section class="dialogue-box" aria-label="${line.narration ? '内心独白' : '人物对话'}"><div class="dialogue-heading"><div><strong>${character.name}${line.narration ? ' · 独白' : ''}</strong><span>${character.role}</span></div><span class="dialogue-count">${String(cursor + 1).padStart(2, '0')} / ${act.dialogue.length}</span></div><p class="dialogue-text" aria-live="polite">${escapeHtml(line.text)}</p><div class="dialogue-actions"><button class="text-button" data-action="source" data-source="${act.sourceIds[0]}">史料札记 ↗</button><button class="text-button next-line" data-action="advance" aria-keyshortcuts="Space Enter">${cursor === act.dialogue.length - 1 ? act.nextAct ? '完成本幕 · 继续行军' : '完成五幕 · 回望全局' : '继续'} <span aria-hidden="true">▸</span></button></div></section></div>`}
  </main>`;
}

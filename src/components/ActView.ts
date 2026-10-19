import type { Act, CharacterId, DialogueLine } from '../types';
import type { GameState } from '../game';
import { freshProgress, inGame } from '../game';
import { characters, scenes, sceneFraming } from '../data/narrative';
import { escapeHtml } from '../utils/html';
import { renderInteraction } from './Interaction';
import { subtitleFrames } from '../subtitles';

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

export function renderAct(act: Act, state: GameState): string {
  const cursor = state.cursors[act.id] ?? 0;
  const game = inGame(state, act);
  const line = act.dialogue[game ? Math.max(0, cursor - 1) : cursor]; const character = characters[line.speaker];
  const background = scenes[line.sceneId] ?? act.assets.scene;
  const frame = subtitleFrames(line)[game ? 0 : state.frames[act.id] ?? 0];
  return `<main id="main-content" class="stage act-${act.id} ${game ? 'is-game' : ''} ${line.narration ? 'is-narration' : ''}" data-line-id="${line.id}" data-frame-id="${frame.id}" data-scene-id="${line.sceneId}" tabindex="-1">
    <div class="scene-background" aria-hidden="true" style="--scene-position: ${escapeHtml(sceneFraming[line.sceneId] ?? '50% 50%')}">${background ? `<img src="${escapeHtml(background)}" alt="" decoding="async" />` : '<div class="mountain far"></div><div class="mountain near"></div><div class="scene-river"></div>'}</div>
    <h1 class="sr-only">${escapeHtml(act.title)} · ${escapeHtml(line.scene)}</h1>
    ${game ? renderInteraction(act, state.games[act.id] ?? freshProgress()) : `<div class="story-stage">${renderCast(act, cursor, line)}
    <section class="dialogue-box ${line.inner ? 'subtitle--inner' : ''}" role="button" tabindex="0" data-action="dialogue" aria-keyshortcuts="Space Enter" aria-label="显示完整对白" aria-describedby="dialogue-accessible dialogue-help"><div class="dialogue-heading"><div><strong>${character.name}${line.inner ? ' · 内心' : line.narration ? ' · 独白' : ''}</strong><span>${character.role}</span></div></div><p class="dialogue-text" aria-hidden="true"><span class="dialogue-revealed"></span><span class="dialogue-pending">${escapeHtml(frame.text)}</span></p><span id="dialogue-accessible" class="sr-only">${escapeHtml(frame.text)}</span><span id="dialogue-help" class="sr-only">点击或按空格、回车：文字出现时补全，文字完整时进入下一框。</span></section></div>`}
  </main>`;
}

import type { Act, GameProgress } from '../types';
import { escapeHtml } from '../utils/html';
import { gameTarget, fogPath, climbCues, cueLabels } from '../game';

export function renderInteraction(act: Act, p: GameProgress): string {
  const done = p.steps >= gameTarget(act);
  const control = (value: string, text: string, css = '', disabled = false) => `<button class="game-control ${css}" data-action="game" data-value="${value}" ${done || disabled ? 'disabled' : ''}>${text}</button>`;
  let board = '';
  if (act.interaction.kind === 'bridge') board = `<div class="bridge-water"><span>彼岸</span><div class="bridge-slots">${[0, 1, 2].map(i => control(`slot-${i}`, p.steps > i ? '已铺稳' : `桥位 ${i + 1}`, p.steps === i ? 'is-current' : '', i !== p.steps)).join('')}</div><span>此岸</span></div>${control('plank', p.selected ? '门板已抬起 · 点击桥位' : '抬起一块门板', p.selected ? 'is-current' : '')}`;
  if (act.interaction.kind === 'fog') board = `<div class="fog-grid" aria-label="四乘四迷雾地图">${Array.from({ length: 16 }, (_, i) => control(String(i), fogPath[p.steps] === i ? '我' : fogPath.slice(0, p.steps).includes(i) ? '足迹' : i === 15 ? '队伍' : '探路', fogPath[p.steps] === i ? 'is-current' : '', fogPath.slice(0, p.steps + 1).includes(i))).join('')}</div>`;
  if (act.interaction.kind === 'climb') board = `<div class="climb-ridge" aria-hidden="true">${Array.from({ length: 6 }, (_, i) => `<i class="${i < p.steps ? 'filled' : ''}"></i>`).join('')}</div><p class="current-cue">当前口令：<strong>${done ? '抵达' : cueLabels[climbCues[p.steps]]}</strong></p><div class="game-choices">${Object.entries(cueLabels).map(([id, label]) => control(id, label)).join('')}</div>`;
  if (act.interaction.kind === 'rescue') board = `<div class="rescue-track"><span>低地</span>${[0, 1, 2].map(i => `<i class="${i < p.steps ? 'filled' : ''}">第 ${i + 1} 段</i>`).join('')}<span>归队</span></div><div class="game-choices">${control('soldier', p.selected ? '已扶稳战友' : '扶起战友', p.selected ? 'is-current' : '')}${control('shelter', '移到下一处掩体')}</div>`;
  if (act.interaction.kind === 'crossing') board = `<div class="crossing-boards" aria-label="已走 ${p.steps} 步，共八步">${Array.from({ length: 8 }, (_, i) => `<i class="${i < p.steps ? 'filled' : ''}">${i < p.steps ? '·' : ''}</i>`).join('')}</div>${control('step', '向前一步 →')}<p class="quiet-note">不必着急。每一步，都算数。</p>`;
  return `<section class="minigame paper-panel" aria-labelledby="game-title"><div class="game-heading"><span class="eyebrow">此刻 · 亲历</span><span>${p.steps} / ${gameTarget(act)}</span></div><h2 id="game-title">${escapeHtml(act.interaction.title)}</h2><p class="game-instruction">${escapeHtml(act.interaction.instruction)}</p><div class="game-board">${board}</div><p class="game-feedback" role="status">${escapeHtml(p.feedback || act.interaction.objective)}</p>${done ? '<button class="primary-button" data-action="game-continue">回到故事 →</button>' : ''}</section>`;
}

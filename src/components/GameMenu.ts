import { acts } from '../data/acts';
import type { GameState } from '../game';
import { canOpen } from '../game';
import { readSave, describeSave } from '../saves';
import { escapeHtml } from '../utils/html';

export type MenuTab = 'main' | 'save' | 'load' | 'chapters';
export function renderMenu(state: GameState, tab: MenuTab, message: string, confirmation: { action: string; slot: number } | null, disabled = false): string {
  const button = (action: string, label: string) => `<button class="menu-nav-button" data-action="${action}">${label}<span>→</span></button>`;
  let body = '';
  if (tab === 'main') body = `<p class="menu-location">${state.introSeen ? escapeHtml(describeSave(state)) : '一九三五 · 赤水河畔'}</p>${button('menu-close', state.screen === 'home' ? '关闭菜单' : '继续游戏')}${button('menu-save', '保存行程')}${button('menu-load', '读取行程')}${button('menu-chapters', '章节目录')}${button('home', '返回首页')}<p class="menu-note">对白与音频已暂停。关闭菜单后继续。</p>`;
  if (tab === 'chapters') body = `<p class="menu-note">完成本幕故事与互动，开启下一幕。</p><div class="menu-chapters">${acts.map((act, i) => `<button data-action="jump" data-act="${act.id}" ${canOpen(state, act.id) ? '' : 'disabled'}><span>${String(i + 1).padStart(2, '0')}　${escapeHtml(act.title)}</span><small>${state.completed.includes(act.id) ? '从头重看' : canOpen(state, act.id) ? '继续行军' : '未解锁'}</small></button>`).join('')}<button data-action="recap" ${state.completed.length === 5 ? '' : 'disabled'}>全局复盘与尾声</button></div>`;
  if (tab === 'save' || tab === 'load') {
    body = `<p class="menu-note">${tab === 'save' ? '保存当前对白和小游戏进度。已有存档需确认覆盖。' : '读取后从所存段落／字幕框开始，配音重新播放。'}存档保存在当前浏览器，清理网站数据会删除存档。</p><div class="save-list">${(tab === 'load' ? [0, 1, 2, 3] : [1, 2, 3]).map(slot => {
      const entry = readSave(slot);
      const date = entry?.savedAt ? new Date(entry.savedAt) : null;
      const dateText = date && Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN', { hour12: false }) : '—';
      return `<article class="save-card"><div><span class="eyebrow">${slot ? `手动存档 0${slot}` : '自动存档'}</span><h3>${entry?.corrupt ? '存档暂不可读' : entry?.state ? escapeHtml(describeSave(entry.state)) : '空白行程'}</h3><small>${dateText}</small></div><button data-action="${tab === 'save' ? 'save-slot' : 'load-slot'}" data-slot="${slot}" ${disabled || (tab === 'save' ? !state.introSeen : !entry?.state) ? 'disabled' : ''}>${tab === 'save' ? entry ? '覆盖' : '保存' : '读取'}</button></article>`;
    }).join('')}</div>`;
  }
  return `<div class="menu-shade" data-action="menu-close"></div><section class="game-menu paper-panel" role="dialog" aria-modal="true" aria-labelledby="menu-title" tabindex="-1"><div class="menu-heading"><span class="eyebrow">赤水行军图 / 行程簿</span><button data-action="menu-close" aria-label="关闭菜单">×</button></div><h2 id="menu-title">${({ main: '行军间歇', save: '保存行程', load: '读取行程', chapters: '行军目录' })[tab]}</h2>${confirmation ? `<div class="save-confirm" role="alert"><p>${confirmation.action === 'save-slot' ? '覆盖此存档？原来的手动记录将被替换。' : '读取此存档？当前行程将切换到所选记录。'}</p><div><button data-action="confirm-slot">确认${confirmation.action === 'save-slot' ? '覆盖' : '读取'}</button><button data-action="cancel-slot">取消</button></div></div>` : body}<p class="save-message" role="status">${escapeHtml(message)}</p>${tab !== 'main' ? '<button class="menu-back" data-action="menu-main">← 返回菜单</button>' : ''}</section>`;
}

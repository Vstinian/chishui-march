import type { SourceCard } from '../types';
import { escapeHtml } from '../utils/html';

export function renderSourceDialog(source: SourceCard | undefined): string {
  if (!source) return '';
  return `<dialog id="source-dialog" class="source-dialog" aria-labelledby="source-title">
    <div class="source-head"><span class="tiny-label">史料卡 · ${source.status === 'verified' ? '已核' : '待核'}</span><button class="dialog-close" data-action="close-source" aria-label="关闭史料卡">×</button></div>
    <h2 id="source-title">${escapeHtml(source.title)}</h2>
    <p>${escapeHtml(source.summary)}</p>
    <div class="citation"><span>出处</span><p>${source.citation ? escapeHtml(source.citation) : '待补充：正式出版物页码或可定位网页链接。'}</p></div>
    <p class="source-warning">未核实内容不可作为最终历史说明。</p>
  </dialog>`;
}


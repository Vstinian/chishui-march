import { recapSource, recapSteps } from '../data/recap';
import { escapeHtml } from '../utils/html';
import { renderRecapMap } from './RecapMap';

export function renderRecap(active: number): string {
  active = Number.isInteger(active) && active >= 0 && active < recapSteps.length ? active : 0;
  const step = recapSteps[active];
  return `<main id="main-content" class="recap-screen" tabindex="-1">
    <div class="recap-shell">
      <div class="recap-intro"><span class="tiny-label">五幕之后 · 展开全图</span><h1>回望走过的路</h1>
        <p>把五幕里的行军记忆，放回历史的时间线。从士兵眼前的一段路，回望四次渡河的全局。</p></div>
      <div class="recap-layout">
        ${renderRecapMap(active)}
        <section class="recap-notes" aria-label="四次渡河复盘">
          <div class="recap-notes-head"><span class="tiny-label">战役脉络</span><span>${step.number} / 04</span></div>
          <div class="recap-step-list" aria-label="选择叙事节点">
            ${recapSteps.map((item, index) => `<button type="button" class="recap-step ${index === active ? 'is-active' : ''}" data-action="recap-step" data-step="${index}" aria-pressed="${index === active}"><span>${item.number}</span><strong>${escapeHtml(item.title)}</strong></button>`).join('')}
          </div>
          <div class="recap-detail" aria-live="polite">
            <div class="recap-detail-meta"><span>${escapeHtml(step.date)}</span><span>${escapeHtml(step.direction)}</span></div>
            <h2>${escapeHtml(step.title)}</h2>
            <div class="recap-perspective"><span>当时 · 局部视角</span><p>${escapeHtml(step.closeView)}</p></div>
            <div class="recap-perspective full"><span>回望 · 全局视角</span><p>${escapeHtml(step.fullView)}</p></div>
          </div>
        </section>
      </div>
      <div class="recap-bottom"><p>四个叙事节点对应五幕故事；图上“一渡”至“四渡”单独标记渡河次数。娄山关与遵义属于二渡后的行动。路线仅作方向示意，不表示真实坐标。</p>
        <div class="recap-actions"><button type="button" class="secondary-button" data-action="recap-step" data-step="${Math.max(active - 1, 0)}" ${active === 0 ? 'disabled' : ''}>上一个节点</button><button type="button" class="secondary-button" data-action="recap-step" data-step="${Math.min(active + 1, recapSteps.length - 1)}" ${active === recapSteps.length - 1 ? 'disabled' : ''}>下一个节点</button><button type="button" class="primary-button" data-action="ending">走向尾声 <span aria-hidden="true">→</span></button></div></div>
      <p class="recap-source">复盘正文据集合版剧本；日期、数字与历史表述待史实组复核。延伸阅读：<a href="${recapSource.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(recapSource.title)}</a>。</p>
    </div>
  </main>`;
}

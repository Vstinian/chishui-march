import type { Act } from '../types';
import { escapeHtml } from '../utils/html';
import { renderInteraction } from './Interaction';

function renderRoute(act: Act, selected: string[]): string {
  const labels = act.id === 'act05' ? ['一渡', '二渡', '三渡', '四渡'] : act.id === 'act02' ? ['路标一', '路标二', '路标三'] : ['起点', '眼前的路', '下一幕'];
  const isRevealed = (index: number): boolean => act.id === 'act05'
    ? selected.includes(`crossing-${index + 1}`)
    : act.id === 'act02' && selected.includes(`sign-${index + 1}`);
  return `<div class="route-panel" aria-label="${act.id === 'act05' ? '四次渡河节点示意，非地理地图' : '局部行程示意'}">
    <div class="route-watermark">${act.id === 'act05' ? '全局路线 · 待核示意' : '局部视角 · 示意'}</div>
    <div class="route-line">${labels.map((label, index) => `<div class="route-stop ${isRevealed(index) ? 'is-revealed' : ''}"><span class="route-dot">${index + 1}</span><span>${act.id === 'act02' && !isRevealed(index) ? '？' : label}</span></div>`).join('')}</div>
    <p>地图坐标与渡口位置待史实组核定。本图只展示交互结构。</p>
  </div>`;
}

export function renderAct(act: Act, index: number, selected: string[], canContinue: boolean): string {
  const scene = act.assets.scene ? `<img class="scene-image" src="${escapeHtml(act.assets.scene)}" alt="${escapeHtml(act.title)}场景" />` : '';
  const character = act.assets.character ? `<img class="character-image" src="${escapeHtml(act.assets.character)}" alt="本幕人物" />` : '';
  return `<main id="main-content" class="act-screen act-${act.id}" tabindex="-1">
    <div class="act-topline"><span>行军记录 <strong>${String(index + 1).padStart(2, '0')}</strong> / 05</span><span>场景占位版</span></div>
    <div class="act-layout">
      <section class="scene-panel" aria-label="本幕场景">
        ${scene}${character}
        <div class="scene-copy"><span class="tiny-label">${escapeHtml(act.subtitle)}</span><h1>${escapeHtml(act.title)}</h1><p>在局部经历中前行</p></div>
      </section>
      <div class="story-column">
        <section class="story-panel" aria-label="本幕叙事">
          <span class="tiny-label">行军笔记</span>
          ${act.story.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        </section>
        ${renderRoute(act, selected)}
        ${renderInteraction(act, selected)}
        <div class="act-actions">
          <button class="secondary-button" data-action="source" data-source="${escapeHtml(act.sourceIds[0])}">查看史料卡 <span aria-hidden="true">↗</span></button>
          <button class="primary-button" data-action="next" ${canContinue ? '' : 'disabled'}>${act.nextAct ? '进入下一幕' : '查看结尾'} <span aria-hidden="true">→</span></button>
        </div>
        <p class="assistive-note">完成本幕互动后可继续，也可以从章节目录直接跳转。</p>
      </div>
    </div>
  </main>`;
}


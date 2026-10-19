import type { StoryTransition } from '../data/transitions';
import { scenes, sceneFraming } from '../data/narrative';
import { escapeHtml } from '../utils/html';

export function renderStoryTransition(transition: StoryTransition, ready: boolean): string {
  const layer = (scene: string, side: string) => {
    const asset = scenes[scene];
    return `<div class="story-transition-layer ${side}" aria-hidden="true" style="--scene-position: ${escapeHtml(sceneFraming[scene] ?? '50% 50%')}">${asset ? `<img src="${escapeHtml(asset)}" alt="" decoding="async">` : scene === 'opening' ? '<div class="transition-newspaper">赤水行军图<span>一九三五 · 行军记忆</span></div>' : scene === 'recap' ? '<div class="transition-archive"></div>' : '<div class="mountain far"></div><div class="mountain near"></div><div class="scene-river"></div>'}</div>`;
  };
  return `<section class="story-transition tone-${transition.tone}" role="dialog" aria-modal="true" aria-label="行军途中" data-transition-id="${transition.id}" style="--dissolve-duration: ${transition.duration}ms">${layer(transition.from, 'is-outgoing')}${layer(transition.to, 'is-incoming')}<div class="transition-atmosphere" aria-hidden="true"></div><div class="story-transition-words"><p tabindex="-1" id="story-transition-text">${transition.lines.map(escapeHtml).join('<br>')}</p><button class="secondary-button" data-action="transition-continue" ${ready ? '' : 'hidden'}>继续行军 <span aria-hidden="true">→</span></button></div></section>`;
}

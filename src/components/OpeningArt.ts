import { opening } from '../data/narrative';
import { escapeHtml } from '../utils/html';

export function renderOpeningNewspaper(): string {
  return `<figure class="newspaper-art"><img src="${escapeHtml(opening.artwork.newspaper)}" width="2730" height="1536" alt="赤水行军图：木桌上摊开的旧报纸，报头为赤水行軍圖，下方为藝術化敘事樣報，中央印有赤水河水墨山水。" decoding="async" fetchpriority="high"><figcaption class="sr-only">艺术化叙事样报，非历史报纸原件。素材内含 AI 生成标识。</figcaption></figure>`;
}

export function renderOpeningLandscape(): string {
  const frames = ['ink', 'mist', 'color', 'dark'] as const;
  return `<div class="intro-shot intro-art-sequence" aria-hidden="true">${frames.map(frame => `<img class="intro-art-frame intro-art-${frame}" src="${escapeHtml(opening.artwork[frame])}" alt="" width="2730" height="1536" decoding="async">`).join('')}</div>`;
}

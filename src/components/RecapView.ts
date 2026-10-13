import { recapSource, recapSteps } from '../data/recap';
import { escapeHtml } from '../utils/html';

function renderMap(active: number): string {
  return `<div class="recap-map-frame">
    <span class="recap-map-scroll-hint">← 左右滑动查看全图 →</span>
    <svg class="recap-map" viewBox="0 0 920 560" role="img" aria-label="四次渡河的方向示意，非真实地理地图">
      <defs>
        <pattern id="map-grain" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 3 18 l 9 -3 M 24 5 l 6 2 M 21 30 l 8 -2" stroke="#776b52" stroke-opacity=".14" stroke-width="1" />
        </pattern>
      </defs>
      <rect width="920" height="560" fill="#d8cfb6" />
      <rect width="920" height="560" fill="url(#map-grain)" />
      <g class="recap-terrain" aria-hidden="true">
        <path d="M 20 112 Q 90 48 170 103 T 322 83 M 26 142 Q 114 77 176 130 T 323 112 M 50 480 Q 122 422 206 474 T 348 441 M 58 511 Q 148 451 217 505 T 349 472" />
        <path d="M 576 113 Q 646 52 738 93 T 898 68 M 576 143 Q 654 81 745 123 T 890 103 M 568 419 Q 648 362 740 411 T 903 377 M 570 449 Q 652 391 748 442 T 903 409" />
      </g>
      <path class="recap-river-bank" d="M 430 -20 C 398 70 490 120 438 210 C 405 272 481 335 438 410 C 406 472 489 508 451 580" />
      <path class="recap-river" d="M 430 -20 C 398 70 490 120 438 210 C 405 272 481 335 438 410 C 406 472 489 508 451 580" />
      <text x="190" y="55" class="recap-map-region">川南 · 河西</text>
      <text x="612" y="55" class="recap-map-region">黔北 · 河东</text>
      <text x="482" y="310" class="recap-map-river-label">赤水河</text>
      ${recapSteps.map((step, index) => `<path class="recap-map-route ${index === active ? 'is-active' : ''}" d="${step.route}" />`).join('')}
      ${recapSteps.map((step, index) => `<g class="recap-map-marker ${index === active ? 'is-active' : ''}" transform="translate(460 ${step.markerY})"><circle r="22" /><text text-anchor="middle" dominant-baseline="central">${step.number}</text></g>`).join('')}
      <text x="38" y="539" class="recap-map-caption">行动脉络示意 · 路线与地形不按真实坐标绘制</text>
    </svg>
  </div>`;
}

export function renderRecap(active: number): string {
  const step = recapSteps[active] ?? recapSteps[0];
  return `<main id="main-content" class="recap-screen" tabindex="-1">
    <div class="recap-shell">
      <div class="recap-intro"><span class="tiny-label">五幕之后 · 展开全图</span><h1>回望走过的路</h1>
        <p>在行军途中，你只能看见下一段命令。现在沿四次渡河重新看一遍：脚下的路，怎样连接成战场上的转向。</p></div>
      <div class="recap-layout">
        ${renderMap(active)}
        <section class="recap-notes" aria-label="四次渡河复盘">
          <div class="recap-notes-head"><span class="tiny-label">战役脉络</span><span>01 / 04　→　04 / 04</span></div>
          <div class="recap-step-list" aria-label="选择渡河节点">
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
      <div class="recap-bottom"><p>四渡之后，队伍继续南渡乌江。这里呈现的是战役逻辑示意，不是精确行军地图或逐日兵力推演。</p>
        <div class="recap-actions"><button type="button" class="secondary-button" data-action="recap-step" data-step="${Math.min(active + 1, recapSteps.length - 1)}" ${active === recapSteps.length - 1 ? 'disabled' : ''}>下一次转向</button><button type="button" class="primary-button" data-action="ending">走向尾声 <span aria-hidden="true">→</span></button></div></div>
      <p class="recap-source">节点日期与行动方向据 <a href="${recapSource.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(recapSource.title)}</a> 整理；文字及示意图由本项目独立制作，提交前由史实组逐项复核。</p>
    </div>
  </main>`;
}

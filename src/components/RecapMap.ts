import { recapSteps, crossingRoutes, recapPlaces } from '../data/recap';
import { escapeHtml } from '../utils/html';

export function renderRecapMap(active: number): string {
  const step = recapSteps[active];
  const ridge = (x: number, y: number, count: number) => Array.from({ length: count }, (_, i) => `<path d="M ${x + i * 30} ${y + (i % 3) * 9} l 14 -22 l 18 22 m -18 -22 l 2 16 l 9 6"/>`).join('');
  return `<figure class="campaign-map">
    <figcaption class="campaign-map-heading"><span>行军全图</span><span>1935 / 01 — 03</span></figcaption>
    <div class="recap-map-frame">
      <svg class="recap-map" viewBox="0 0 640 650" role="img" aria-labelledby="campaign-title campaign-desc">
        <title id="campaign-title">四渡赤水行军示意 · ${escapeHtml(step.title)}</title>
        <desc id="campaign-desc">${escapeHtml(step.direction)}。深红实线为当前行动，褐色实线为此前行程，虚线为后续行程。四个渡河标记分别指向渡口；地形和路线经过示意化排布。</desc>
        <defs>
          <pattern id="campaign-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 H 0 V 40" fill="none" stroke="#80694b" stroke-opacity=".12"/></pattern>
          <pattern id="campaign-grain" width="17" height="23" patternUnits="userSpaceOnUse"><path d="M 2 7 l 3 -1 M 12 19 l 2 1" stroke="#80694b" stroke-opacity=".16"/></pattern>
          <radialGradient id="campaign-paper"><stop stop-color="#f1e4c8"/><stop offset="1" stop-color="#dbc5a0"/></radialGradient>
          <marker id="campaign-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#852d32"/></marker>
        </defs>
        <rect width="640" height="650" fill="url(#campaign-paper)"/><rect width="640" height="650" fill="url(#campaign-grid)"/><rect width="640" height="650" fill="url(#campaign-grain)"/>
        <rect x="14" y="14" width="612" height="622" fill="none" stroke="#a28a65"/>
        <g class="campaign-contours" aria-hidden="true"><path d="M -20 115 Q 110 40 240 100 T 650 70 M -10 133 Q 110 58 237 118 T 650 88 M -10 151 Q 105 78 233 136 T 650 106 M -20 480 Q 160 450 210 530 T 620 570 M -20 500 Q 150 470 200 550 T 620 590 M -20 520 Q 145 490 190 570 T 620 610"/></g>
        <g class="campaign-ridges" aria-hidden="true">${ridge(58, 140, 5)}${ridge(400, 170, 6)}${ridge(455, 365, 4)}${ridge(74, 510, 5)}</g>
        <g class="campaign-regions"><text x="100" y="83">川 南</text><text x="74" y="467">滇 东 北</text><text x="475" y="535">黔 北</text></g>
        <g class="campaign-rivers"><path d="M 185 -10 Q 220 75 272 122 Q 315 165 303 203 Q 300 251 340 292 Q 364 333 331 367 Q 310 400 352 438 Q 388 489 352 552 Q 335 598 345 665"/><path class="campaign-wujiang" d="M 363 662 Q 395 584 475 575 Q 551 575 650 541"/></g>
        <g class="campaign-water-labels"><text x="246" y="60" transform="rotate(42 246 60)">赤水河</text><text x="548" y="599">乌江</text></g>
        ${crossingRoutes.map((route, index) => {
          const selected = step.routeIndices.includes(index);
          return `<path class="recap-map-route ${selected ? 'is-active' : route.step < active ? 'is-past' : 'is-future'}" d="${route.route}" pathLength="1" ${selected ? 'marker-end="url(#campaign-arrow)"' : ''}/>`;
        }).join('')}
        <path class="campaign-battle-route ${active === 2 ? 'is-active' : active > 2 ? 'is-past' : ''}" d="M 490 310 Q 469 345 490 391 Q 508 419 510 461" pathLength="1" ${active === 2 ? 'marker-end="url(#campaign-arrow)"' : ''}/>
        <g class="campaign-towns">${recapPlaces.map(place => `<g><circle cx="${place.x}" cy="${place.y}" r="4"/><text x="${place.x + place.dx}" y="${place.y + place.dy}">${place.name}</text></g>`).join('')}</g>
        ${crossingRoutes.map((route, index) => `<g class="campaign-crossing ${step.routeIndices.includes(index) ? 'is-active' : ''}"><path d="M ${route.markerX} ${route.markerY} L ${route.labelX} ${route.labelY}"/><circle cx="${route.markerX}" cy="${route.markerY}" r="7"/><rect x="${route.labelX - 32}" y="${route.labelY - 17}" width="64" height="34" rx="2"/><text x="${route.labelX}" y="${route.labelY + 7}" text-anchor="middle">${route.number}</text></g>`).join('')}
        ${active === 2 ? '<g class="campaign-battle"><circle cx="490" cy="391" r="13"/><circle cx="510" cy="461" r="13"/></g>' : ''}
        <g class="campaign-compass" transform="translate(579 65)" aria-hidden="true"><path d="M 0 -21 L -8 12 L 0 6 L 8 12 Z"/><path d="M -18 0 H 18 M 0 6 V 24"/><text y="-29" text-anchor="middle">北</text></g>
        <text x="38" y="610" class="campaign-scale-note">行军脉络示意</text><text x="38" y="630" class="campaign-scale-note">地形与距离非等比例</text>
      </svg>
    </div>
    <div class="campaign-legend"><span><i class="current"></i>当前行动</span><span><i class="past"></i>此前行程</span><span><i class="future"></i>后续行程</span></div>
    <div class="campaign-crossing-controls" aria-label="按渡河次数查看">${crossingRoutes.map((route, index) => `<button type="button" data-action="recap-step" data-step="${route.step}" aria-pressed="${step.routeIndices.includes(index)}"><b>${route.number}</b><span>${route.label}</span></button>`).join('')}</div>
  </figure>`;
}

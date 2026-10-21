import type { Act, GameProgress } from '../types';
import { escapeHtml } from '../utils/html';
import { gameTarget, fogPath, climbCues, climbSegments, cueLabels, bridgeLengths, bridgeTurns, rescueCover, crossingWind } from '../game';
import { renderGameArt, bridgePoints, fogPoint, shelterPoints, crossingPoint } from './GameArt';
import type { GameMotion } from './GameArt';

export function renderInteraction(act: Act, p: GameProgress, motion?: GameMotion): string {
  const done = p.steps >= gameTarget(act), kind = act.interaction.kind;
  const control = (value: string, text: string, css = '', disabled = false, extra = '') => `<button class="game-control ${css}" data-action="game" data-value="${value}" ${done || disabled ? 'disabled' : ''} ${extra}>${text}</button>`;
  const spot = (value: string, text: string, point: number[], css = '', disabled = false) => control(value, text, `field-hotspot ${css}`, disabled, `style="left:${point[0] / 10}%;top:${point[1] / 5.6}%"`);
  const instructions = {
    bridge: '选取岸边门板，对照桥位的长度和方向，必要时旋转后点击桥位。也可将门板拖到桥位。',
    fog: '点击身边亮起的落脚点前进。先用探杖探查，可辨认脚印与泥地。',
    climb: '记住口令卡后合上行动。每段依次完成掩护、攀登、伏低、跟进，共六段；点错退一段。',
    rescue: '先观察地形，再扶稳战友。直接点击场景中可容纳两人的安全掩体，分三段归队。',
    crossing: '用左右按钮调整重心，中央安全区亮起后迈步。河风每步都会改变重心，共八步。',
  };
  const location = { bridge: '一渡 · 雨夜河岸', fog: '二渡 · 雾中行军道', climb: '娄山关 · 陡坡', rescue: '三渡前 · 战地低坡', crossing: '四渡 · 无声的河面' }[kind];
  let hotspots = '', dock = '', sceneNote = '';
  if (kind === 'bridge') {
    hotspots = bridgePoints.map((point, i) => spot(`slot-${i}`, `<span class="target-ring">${i < p.steps ? '✓' : i + 1}</span><b>${i < p.steps ? '已铺稳' : `${bridgeLengths[i]} 格 · ${bridgeTurns[i] ? '横向' : '纵向'}`}</b>`, [point[0], point[1] - 4], i === p.steps ? 'is-target' : 'is-built', i !== p.steps)).join('');
    dock = `<div class="field-supplies"><span class="dock-label">岸边材料<span>选择或拖动门板</span></span><div class="field-planks">${[1, 2, 3].map(n => control(`plank-${n}`, `<span class="timber" style="--timber-size:${n}"><i></i><i></i></span><b>${n} 格门板</b>`, p.selected === `plank-${n}` ? 'is-current' : '', false, `data-draggable-plank="${n}" aria-pressed="${p.selected === `plank-${n}`}"`)).join('')}</div>${control('rotate', '<span class="action-symbol">↻</span>旋转门板', 'field-rotate', !p.selected)}</div>`;
    sceneNote = p.selected ? `门板已抬起 · ${p.rotation ? '横向' : '纵向'} · 点击桥位铺设` : '桥桩在河面亮起 · 从岸边取一块门板';
  }
  if (kind === 'fog') {
    const current = fogPath[p.steps];
    hotspots = Array.from({ length: 16 }, (_, i) => {
      const visited = fogPath.slice(0, p.steps + 1).includes(i), known = p.explored?.includes(i);
      const adjacent = Math.abs(Math.floor(i / 4) - Math.floor(current / 4)) + Math.abs(i % 4 - current % 4) === 1;
      const label = visited ? i === current ? '当前位置' : '走过的路' : known ? fogPath.includes(i) ? '脚印 · 实地' : '泥地' : i === 15 ? '队伍' : '探路';
      return spot(String(i), `<span class="target-ring">${visited ? '·' : known && !fogPath.includes(i) ? '×' : i === 15 ? '旗' : '?'}</span><b>${label}</b>`, fogPoint(i), `${adjacent && !visited ? 'is-target' : 'fog-distant'} ${visited ? 'is-visited' : ''}`, !adjacent || visited);
    }).join('');
    dock = `<div class="field-tool-row">${control('scout', `<span class="action-symbol">⌖</span>${p.scouting ? '收起探杖' : '用探杖探查'}`, p.scouting ? 'is-current' : '')}<div><b>${p.scouting ? '探杖在手，先探后走' : '循着脚印，跟上队伍'}</b><span>亮圈可移动 · × 为泥地 · 虚线为足迹</span></div></div>`;
    sceneNote = p.scouting ? '点击相邻落脚点探查 · 探查不移动人物' : '点击亮起的落脚点 · 人物随路线前进';
  }
  if (kind === 'climb') {
    const completed = Math.floor(p.steps / climbCues.length), cue = p.steps % climbCues.length;
    const order = completed % 2 ? ['duck', 'cover', 'follow', 'climb'] : ['cover', 'climb', 'duck', 'follow'];
    const glyphs: Record<string, string> = { cover: '◈', climb: '↗', duck: '⌄', follow: '⇉' };
    sceneNote = done ? '已登上山口' : `第 ${completed + 1} 段 · ${p.recalling ? `已完成 ${cue} / 4 道口令` : '观察口令，准备登高'}`;
    hotspots = `<div class="ridge-caption" role="img" aria-label="已完成 ${completed} 段，共 ${climbSegments} 段"><span>登高路线</span><b>${completed} / ${climbSegments}</b></div>`;
    dock = `<div class="field-orders"><ol class="climb-cue-strip" aria-label="本段口令进度">${climbCues.map((id, i) => `<li class="${done || i < cue ? 'is-done' : i === cue ? 'is-current' : ''}" ${!done && i === cue ? 'aria-current="step"' : ''}>${p.recalling && i >= cue ? '· · ·' : cueLabels[id]}<small>${done || i < cue ? '已完成' : `口令 ${i + 1}`}</small></li>`).join('')}</ol>${!done && !p.recalling ? control('memorize', '合上口令卡 · 开始行动 →', 'field-start-order') : `<div class="field-action-keys">${order.map(id => control(id, `<span class="action-symbol">${glyphs[id]}</span>${cueLabels[id]}`)).join('')}</div>${!done ? control('review', '重新查看口令卡', 'field-review') : ''}`}</div>`;
  }
  if (kind === 'rescue') {
    const safe = rescueCover[Math.min(p.steps, 2)];
    hotspots = ['水沟', '断墙', '土坡'].map((name, i) => spot(`shelter-${i}`, `<span class="target-ring">${i + 1}</span><b>${name}</b><small>${p.observed || done ? i === safe ? '干燥 · 可容两人' : i === (safe + 1) % 3 ? '积水很深' : '遮挡太窄' : '观察后辨认'}</small>`, [shelterPoints[i][0], shelterPoints[i][1] + 8], p.observed && i === safe ? 'is-safe' : '', !p.selected)).join('');
    dock = `<div class="field-tool-row rescue-actions">${control('observe', '<span class="action-symbol">⌖</span>观察地形', p.observed ? 'is-current' : '')}${control('soldier', `<span class="action-symbol">↟</span>${p.selected ? '战友已扶稳' : '扶稳战友'}`, p.selected ? 'is-current' : '')}<div><b>第 ${Math.min(p.steps + 1, 3)} 段 / 3</b><span>观察 → 扶稳 → 点击场景中的掩体</span></div></div>`;
    sceneNote = p.selected ? '战友已扶稳 · 点击场景中的掩体一起移动' : '先查看掩体状况 · 再扶起战友';
  }
  if (kind === 'crossing') {
    const balance = p.balance ?? crossingWind[Math.min(p.steps, 7)];
    hotspots = spot('step', `<span class="target-ring">${done ? '✓' : '↑'}</span><b>${done ? '抵达对岸' : '落脚点'}</b>`, [crossingPoint(Math.min(8, p.steps + 1))[0], crossingPoint(Math.min(8, p.steps + 1))[1] + 24], Math.abs(balance) <= 1 ? 'is-target' : '');
    dock = `<div class="field-balance"><div class="balance-label"><span>左倾</span><b>${Math.abs(balance) <= 1 ? '重心已稳 · 可以迈步' : '桥板摇晃 · 先稳住重心'}</b><span>右倾</span></div><div class="balance-meter" role="meter" aria-label="重心，负一至一安全" aria-valuemin="-4" aria-valuemax="4" aria-valuenow="${balance}"><span class="balance-safe"></span><i style="left:${(balance + 4) / 8 * 100}%"></i></div><div class="crossing-controls">${control('left', '← 重心向左')}${control('step', '稳步向前 ↑', Math.abs(balance) <= 1 ? 'is-current' : '')}${control('right', '重心向右 →')}</div></div>`;
    sceneNote = done ? '八步走完 · 已经上岸' : `第 ${p.steps + 1} 步 / 8 · 河风向${crossingWind[p.steps] > 0 ? '右' : '左'} · 留意人物重心`;
  }
  const failure = motion && (p.mistakes ?? 0) > (motion.previous.mistakes ?? 0);
  const advanced = motion && p.steps > motion.previous.steps;
  return `<section class="minigame field-game game-${kind} ${failure ? 'field-misstep' : ''} ${advanced ? 'field-advanced' : ''}" aria-labelledby="game-title"><header class="field-hud"><div><span class="eyebrow">${location}</span><h2 id="game-title">${escapeHtml(act.interaction.title)}</h2></div><div class="field-progress"><strong>${String(p.steps).padStart(2, '0')}</strong><span>/ ${gameTarget(act)}<small>行军进度</small></span></div><details class="field-help"><summary>操作说明</summary><p>${instructions[kind]}</p></details></header><div class="field-scene"><div class="field-world">${renderGameArt(kind, p, motion)}<div class="field-targets">${hotspots}</div></div><div class="field-scene-caption"><i></i>${done ? '任务完成 · 可以继续行军' : sceneNote}</div>${done ? '<div class="field-complete-seal" aria-hidden="true">行<br>军<br>告<br>捷</div>' : ''}</div><div class="field-dock">${done ? `<div class="field-done"><span>这一程，走过来了。</span><button class="primary-button" data-action="game-continue">回到故事 →</button></div>` : dock}</div><footer class="field-footer"><p class="game-feedback" role="status">${escapeHtml(p.feedback || act.interaction.objective)}</p><div><span>调整 ${p.mistakes ?? 0} · 提示 ${p.hints ?? 0}</span>${!done ? control('hint', '行军提示', 'field-hint') : ''}</div></footer></section>`;
}

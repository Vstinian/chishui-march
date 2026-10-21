import type { Act, GameProgress } from '../types';
import { escapeHtml } from '../utils/html';
import { gameTarget, fogPath, climbCues, climbSegments, cueLabels, bridgeLengths, bridgeTurns, rescueCover, crossingWind } from '../game';

export function renderInteraction(act: Act, p: GameProgress): string {
  const done = p.steps >= gameTarget(act), kind = act.interaction.kind;
  const control = (value: string, text: string, css = '', disabled = false) => `<button class="game-control ${css}" data-action="game" data-value="${value}" ${done || disabled ? 'disabled' : ''}>${text}</button>`;
  const instructions = {
    bridge: '观察桥桩跨度，选对应长度的门板，旋转到要求方向，再放上桥位。',
    fog: '每次只走相邻的一格。用探杖辨认实地和泥地，沿脚印找到队伍。',
    climb: '先记住四道口令，再合上口令卡按顺序行动。共六段，点错退回上一段起点。',
    rescue: '观察三处掩体，扶稳战友，再选择能容纳两个人的安全位置，分三段归队。',
    crossing: '河风会推偏重心。向左或向右调整到中央安全区，再迈出一步，共八步。',
  };
  let board = '';
  if (kind === 'bridge') board = `<div class="field-caption"><span>渡口工程图</span><span>门板 · 三段接通</span></div><div class="bridge-water"><span>对岸</span><div class="bridge-slots">${[0, 1, 2].map(i => control(`slot-${i}`, `<b>${p.steps > i ? '已铺稳' : `桥位 ${i + 1}`}</b><small>${bridgeLengths[i]} 格跨度 · ${bridgeTurns[i] ? '横向' : '纵向'}</small>`, p.steps === i ? 'is-current' : '', i !== p.steps)).join('')}</div><span>此岸</span></div><div class="plank-rack">${[1, 2, 3].map(n => control(`plank-${n}`, `<span class="plank-drawing" style="--plank-length:${n}">${'┃'.repeat(n)}</span><small>${n} 格门板</small>`, p.selected === `plank-${n}` ? 'is-current' : '')).join('')}</div><div class="field-toolbar"><span>${p.selected ? `已选 ${p.selected.at(-1)} 格 · ${p.rotation ? '横向' : '纵向'}` : '从岸边材料中选板'}</span>${control('rotate', '旋转门板 ↻', '', !p.selected)}</div>`;
  if (kind === 'fog') {
    const current = fogPath[p.steps];
    board = `<div class="field-caption"><span>行军草图 / 北 ↑</span><span>□ 未探　× 泥地　· 脚印</span></div><div class="fog-grid" aria-label="四乘四迷雾地图">${Array.from({ length: 16 }, (_, i) => {
      const visited = fogPath.slice(0, p.steps).includes(i), known = p.explored?.includes(i);
      const adjacent = Math.abs(Math.floor(i / 4) - Math.floor(current / 4)) + Math.abs(i % 4 - current % 4) === 1;
      return control(String(i), `<b>${current === i ? '我' : visited ? '·' : i === 15 ? '队伍' : known ? fogPath.includes(i) ? '脚印' : '× 泥地' : '雾'}</b><small>${String.fromCharCode(65 + Math.floor(i / 4))}${i % 4 + 1}${adjacent && !visited ? ' · 可探' : ''}</small>`, current === i ? 'is-current' : adjacent && !visited ? 'is-adjacent' : '', done || !adjacent || visited);
    }).join('')}</div><div class="field-toolbar">${control('scout', p.scouting ? '收起探杖' : '用探杖探查', p.scouting ? 'is-current' : '')}<span>${p.scouting ? '点击相邻格进行探查' : '点击相邻格迈步'}</span></div>`;
  }
  if (kind === 'climb') {
    const completed = Math.floor(p.steps / climbCues.length), cue = p.steps % climbCues.length;
    const order = completed % 2 ? ['duck', 'cover', 'follow', 'climb'] : ['cover', 'climb', 'duck', 'follow'];
    board = `<div class="field-caption"><span>山口纵剖图</span><span>记令 → 行动 → 登高</span></div><div class="climb-ridge" role="img" aria-label="已完成 ${completed} 段，共 ${climbSegments} 段">${Array.from({ length: climbSegments }, (_, i) => `<i class="${i < completed ? 'filled' : i === completed ? 'is-current' : ''}" aria-hidden="true">${i < completed ? '✓' : i + 1}</i>`).join('')}</div><p class="current-cue">${done ? '六段攀登完成' : `第 ${completed + 1} 段 · ${p.recalling ? `已完成 ${cue} / 4 道口令` : '查看口令卡，准备行动'}`}</p><ol class="climb-cue-strip" aria-label="本段口令进度">${climbCues.map((id, i) => `<li class="${done || i < cue ? 'is-done' : i === cue ? 'is-current' : ''}" ${!done && i === cue ? 'aria-current="step"' : ''}>${p.recalling && i >= cue ? '· · ·' : cueLabels[id]}<small>${done || i < cue ? '已完成' : `口令 ${i + 1}`}</small></li>`).join('')}</ol>${!done && !p.recalling ? control('memorize', '记住了，开始行动 →', 'wide-control') : `<div class="game-choices">${order.map(id => control(id, cueLabels[id])).join('')}</div>${!done ? control('review', '重新查看口令卡', 'review-control') : ''}`}`;
  }
  if (kind === 'rescue') {
    const safe = rescueCover[Math.min(p.steps, 2)];
    const covers = ['水沟', '断墙', '土坡'];
    board = `<div class="field-caption"><span>救援路线图</span><span>第 ${Math.min(p.steps + 1, 3)} 段 / 3</span></div><div class="rescue-track"><span>低地</span>${[0, 1, 2].map(i => `<i class="${i < p.steps ? 'filled' : ''}">${i < p.steps ? '✓ 已通过' : `第 ${i + 1} 段`}</i>`).join('')}<span>归队</span></div><div class="game-choices">${control('observe', p.observed ? '地形已查明' : '观察前方地形', p.observed ? 'is-current' : '')}${control('soldier', p.selected ? '战友已扶稳' : '扶稳战友', p.selected ? 'is-current' : '')}</div><div class="cover-options">${covers.map((name, i) => control(`shelter-${i}`, `<span class="cover-symbol" aria-hidden="true">${['≋', '▥', '▰'][i]}</span><b>${i + 1} · ${name}</b><small>${p.observed || done ? i === safe ? '低矮干燥 · 可容两人' : i === (safe + 1) % 3 ? '积水很深 · 难以站稳' : '遮挡太窄 · 容不下两人' : '地形未明 · 先观察'}</small>`, '', !p.selected)).join('')}</div>`;
  }
  if (kind === 'crossing') {
    const balance = p.balance ?? crossingWind[Math.min(p.steps, 7)];
    board = `<div class="field-caption"><span>夜渡浮桥</span><span>${done ? '已抵达对岸' : `河风向${crossingWind[p.steps] > 0 ? '右' : '左'}`}</span></div><div class="crossing-boards" aria-label="已走 ${p.steps} 步，共八步">${Array.from({ length: 8 }, (_, i) => `<i class="${i < p.steps ? 'filled' : i === p.steps ? 'next-board' : ''}">${i < p.steps ? '·' : i + 1}</i>`).join('')}</div><div class="balance-label"><span>左倾</span><b>${Math.abs(balance) <= 1 ? '站稳了，可以迈步' : '重心偏移，先调整'}</b><span>右倾</span></div><div class="balance-meter" role="meter" aria-label="重心，负数偏左，正数偏右，负一至一安全" aria-valuemin="-4" aria-valuemax="4" aria-valuenow="${balance}"><span class="balance-safe"></span><i style="left:${(balance + 4) / 8 * 100}%"></i></div><div class="crossing-controls">${control('left', '← 重心向左')}${control('step', '稳步向前 →', 'is-current')}${control('right', '重心向右 →')}</div><p class="quiet-note">不必抢时间。站稳一步，再走下一步。</p>`;
  }
  return `<section class="minigame paper-panel game-${kind}" aria-labelledby="game-title"><div class="game-heading"><span class="eyebrow">行军手记 / ${String(Number(act.id.slice(-2))).padStart(2, '0')}</span><span>${p.steps} / ${gameTarget(act)}</span></div><h2 id="game-title">${escapeHtml(act.interaction.title)}</h2><div class="game-progress" aria-label="任务进度"><i style="width:${p.steps / gameTarget(act) * 100}%"></i></div><p class="game-instruction">${instructions[kind]}</p><div class="game-board">${board}</div><p class="game-feedback" role="status">${escapeHtml(p.feedback || act.interaction.objective)}</p><div class="game-footer"><span>尝试 ${p.moves ?? 0}　调整 ${p.mistakes ?? 0}　提示 ${p.hints ?? 0}</span>${!done ? control('hint', '行军提示') : '<span class="completion-stamp">任务完成</span>'}</div>${done ? '<button class="primary-button" data-action="game-continue">回到故事 →</button>' : ''}</section>`;
}

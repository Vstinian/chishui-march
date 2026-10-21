import { acts } from './data/acts';
import { legacyDialogueIds } from './data/legacyScript';
import { subtitleFrames } from './subtitles';
import type { Act, ActId, GameProgress } from './types';

export type Screen = 'home' | 'intro' | 'act' | 'recap' | 'ending';
export interface GameState {
  screen: Screen; actId: ActId; completed: ActId[];
  resumeScreen: 'act' | 'recap' | 'ending';
  recapStep: number;
  cursors: Partial<Record<ActId, number>>;
  frames: Partial<Record<ActId, number>>;
  games: Partial<Record<ActId, GameProgress>>;
  acknowledged: ActId[]; introSeen: boolean;
}
export const newGame = (): GameState => ({ screen: 'home', resumeScreen: 'act', recapStep: 0, actId: 'act01', completed: [], cursors: {}, frames: {}, games: {}, acknowledged: [], introSeen: false });
export const freshProgress = (): GameProgress => ({ steps: 0, selected: null, feedback: '' });
export const climbCues = ['cover', 'climb', 'duck', 'follow'];
export const climbSegments = 6;
export const gameTarget = (act: Act): number => ({ bridge: 3, fog: 6, climb: climbSegments * climbCues.length, rescue: 3, crossing: 8 })[act.interaction.kind];
export const canOpen = (state: GameState, id: string): boolean => {
  const index = acts.findIndex(act => act.id === id);
  return state.introSeen && index >= 0 && acts.slice(0, index).every(act => state.completed.includes(act.id));
};
export const inGame = (state: GameState, act: Act): boolean => (state.cursors[act.id] ?? 0) === act.interaction.afterLine && !state.acknowledged.includes(act.id);
// 末尾额外下标表示幕末札记，沿用 v3 存档，刷新后也能回到札记页。
export const atActEnd = (state: GameState, act: Act): boolean => (state.cursors[act.id] ?? 0) >= act.dialogue.length;
export const fogPath = [0, 1, 5, 6, 10, 11, 15];
export const cueLabels: Record<string, string> = { cover: '掩护', climb: '攀登', duck: '伏低', follow: '跟进' };

// 明确重看章节时重置本幕；解锁记录保留。普通续读不调用此函数。
export function restartAct(state: GameState, id: ActId): void {
  state.cursors[id] = 0;
  state.frames[id] = 0;
  delete state.games[id];
  state.acknowledged = state.acknowledged.filter(done => done !== id);
}

// 固定关卡参数让存档与重试可复现，不依赖计时器或音轨。
export const bridgeLengths = [2, 3, 1];
export const bridgeTurns = [0, 1, 0];
export const rescueCover = [1, 0, 2];
export const crossingWind = [2, -3, 2, 3, -2, -3, 2, -2];
export function playGame(act: Act, previous: GameProgress, value: string): GameProgress {
  const p = { ...previous, explored: [...(previous.explored ?? [])] };
  if (p.steps >= gameTarget(act)) return p;
  const miss = (message: string) => { p.mistakes = (p.mistakes ?? 0) + 1; p.feedback = message; };
  p.moves = (p.moves ?? 0) + 1;
  if (value === 'hint') {
    p.hints = (p.hints ?? 0) + 1;
    p.feedback = ({ bridge: `本桥位需 ${bridgeLengths[p.steps]} 格长门板，${bridgeTurns[p.steps] ? '横向' : '纵向'}铺设。`, fog: '沿脚印探路：右、下、右、下、右、下。先探查能标记泥地。', climb: '依次掩护、攀登、伏低、跟进。可随时重新看口令，不限时。', rescue: `本段选第 ${rescueCover[p.steps] + 1} 处掩体，先扶住战友再移动。`, crossing: '先把重心调到中间的安全区，再迈步。每步后河风会改变重心。' })[act.interaction.kind];
    return p;
  }
  if (act.interaction.kind === 'bridge') {
    if (/^plank-[123]$/.test(value)) { p.selected = value; p.rotation = 0; p.feedback = '门板已抬稳。对照桥桩跨度与铺设方向，必要时旋转门板。'; }
    else if (value === 'rotate' && p.selected) { p.rotation = p.rotation ? 0 : 1; p.feedback = `门板转为${p.rotation ? '横向' : '纵向'}。`; }
    else if (value === `slot-${p.steps}` && p.selected) {
      if (p.selected !== `plank-${bridgeLengths[p.steps]}` || (p.rotation ?? 0) !== bridgeTurns[p.steps]) miss('没有卡进桥桩：检查门板长度和方向，可重新选板再试。');
      else { p.steps++; p.selected = null; p.rotation = 0; p.feedback = act.interaction.success[p.steps - 1]; }
    } else p.feedback = '先选合适的门板，再点标亮的桥位。';
  } else if (act.interaction.kind === 'fog') {
    if (value === 'scout') { p.scouting = !p.scouting; p.feedback = p.scouting ? '探查中：点一个相邻格，确认脚下后再走。' : '收起探杖，可以移动了。'; return p; }
    const cell = Number(value), current = fogPath[p.steps];
    const adjacent = value.trim() !== '' && Number.isInteger(cell) && cell >= 0 && cell < 16 && Math.abs(Math.floor(cell / 4) - Math.floor(current / 4)) + Math.abs(cell % 4 - current % 4) === 1;
    if (!adjacent) p.feedback = '看不清那么远，先探身边相邻的一格。';
    else if (p.scouting) { if (!p.explored.includes(cell)) p.explored.push(cell); p.scouting = false; p.feedback = fogPath.includes(cell) ? '探杖触到实地，泥面还有脚印。' : '探杖陷进泥里，已在地图上标记；换条路。'; }
    else if (cell === fogPath[p.steps + 1]) { p.steps++; p.feedback = act.interaction.success[(p.steps - 1) % 3]; }
    else { if (!p.explored.includes(cell)) p.explored.push(cell); miss('鞋陷进泥里，退回实地。泥地已标记，先探查再迈步。'); }
  } else if (act.interaction.kind === 'climb') {
    if (value === 'memorize') { p.recalling = true; p.feedback = '口令已记下。依次完成四个动作；每段结束可重新看口令。'; }
    else if (value === 'review') { p.recalling = false; p.hints = (p.hints ?? 0) + 1; p.feedback = '稳住，再看一遍口令。'; }
    else if (!p.recalling) p.feedback = '先看口令，准备好后点击「记住了，开始行动」。';
    else if (value === climbCues[p.steps % climbCues.length]) {
      p.steps++;
      p.feedback = p.steps % climbCues.length === 0 ? `第 ${p.steps / climbCues.length} 道口令走完，往上挪了一段。` : '动作到位，接下一道口令。';
      if (p.steps % climbCues.length === 0) p.recalling = false;
    } else if (Object.hasOwn(cueLabels, value)) {
      const segment = Math.floor(p.steps / climbCues.length);
      p.steps = Math.max(0, segment - 1) * climbCues.length; p.recalling = false;
      miss('口令听岔了，退回上一段起点；第一段仍留在原处。从「掩护」重新记令。');
    }
  } else if (act.interaction.kind === 'rescue') {
    if (value === 'observe') { p.observed = true; p.feedback = '已看清前路：选能遮住两个人、没有积水的低矮掩体。'; }
    else if (value === 'soldier') { p.selected = 'soldier'; p.feedback = '已经扶稳战友，对照地形选择下一处掩体。'; }
    else if (/^shelter-[012]$/.test(value) && p.selected === 'soldier') {
      if (Number(value.at(-1)) !== rescueCover[p.steps]) miss('这里遮不住两个人，先留在原地。观察掩体后再选。');
      else { p.steps++; p.selected = null; p.observed = false; p.feedback = act.interaction.success[p.steps - 1]; }
    } else p.feedback = '先扶稳战友，再选择下一处掩体。';
  } else {
    const balance = p.balance ?? crossingWind[p.steps];
    if (value === 'left' || value === 'right') { p.balance = Math.max(-4, Math.min(4, balance + (value === 'left' ? -1 : 1))); p.feedback = '慢慢调整重心，回到中央安全区再迈步。'; }
    else if (value === 'step') {
      if (Math.abs(balance) > 1) miss('桥板晃了，先停住调整重心。这一步尚未迈出。');
      else { p.steps++; p.balance = crossingWind[p.steps] ?? 0; p.feedback = `第 ${p.steps} 步踩稳了。留意下一阵河风。`; }
    }
  }
  if (p.steps === gameTarget(act)) p.feedback = act.interaction.completion;
  return p;
}
const saveKey = 'chishui-march-story-v3';
export function serializeGame(state: GameState): string {
  const bookmarks = Object.fromEntries(acts.map(act => [act.id, atActEnd(state, act) ? '@notes' : act.dialogue[state.cursors[act.id] ?? 0]?.id]));
  return JSON.stringify({ ...state, version: 6, bookmarks, savedAt: new Date().toISOString() });
}
export function saveGame(state: GameState): boolean {
  try { localStorage.setItem(saveKey, serializeGame(state)); return true; } catch { return false; }
}
export function loadGame(raw?: string | null): GameState {
  const state = newGame();
  try {
    const data = JSON.parse((raw === undefined ? localStorage.getItem(saveKey) : raw) ?? 'null');
    if (!data || data.introSeen !== true) return state;
    state.introSeen = true;
    state.recapStep = Number.isInteger(data.recapStep) ? Math.max(0, Math.min(3, data.recapStep)) : 0;
    for (const act of acts) { if (!Array.isArray(data.completed) || !data.completed.includes(act.id)) break; state.completed.push(act.id); }
    for (const act of acts.filter(act => canOpen(state, act.id))) {
      const cursor = data.cursors?.[act.id];
      const legacyIds = legacyDialogueIds[act.id];
      const bookmark = data.version >= 5 ? data.bookmarks?.[act.id] : Number.isInteger(cursor) && cursor >= legacyIds.length ? '@notes' : legacyIds[Math.max(0, cursor ?? 0)];
      state.cursors[act.id] = bookmark === '@notes' ? act.dialogue.length : Math.max(0, act.dialogue.findIndex(line => line.id === bookmark));
      const p = data.games?.[act.id];
      // 旧版攀登只有六步。已完成的保留通关资格，未完成的从新规则起点继续。
      const steps = act.interaction.kind === 'climb' && !(data.version >= 4) ? (p?.steps === 6 ? gameTarget(act) : 0) : p?.steps;
      state.games[act.id] = { steps: Number.isInteger(steps) ? Math.max(0, Math.min(steps, gameTarget(act))) : 0, selected: null, feedback: '' };
      if (data.version >= 6 && p && typeof p === 'object') {
        const progress = state.games[act.id]!;
        progress.feedback = typeof p.feedback === 'string' ? p.feedback.slice(0, 500) : '';
        progress.selected = ['plank-1', 'plank-2', 'plank-3', 'soldier'].includes(p.selected) ? p.selected : null;
        for (const key of ['moves', 'mistakes', 'hints'] as const) progress[key] = Number.isInteger(p[key]) ? Math.max(0, Math.min(99999, p[key])) : 0;
        progress.rotation = p.rotation === 1 ? 1 : 0;
        progress.explored = Array.isArray(p.explored) ? [...new Set<number>(p.explored.filter((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < 16))] : [];
        progress.scouting = p.scouting === true; progress.recalling = p.recalling === true; progress.observed = p.observed === true;
        if (Number.isInteger(p.balance)) progress.balance = Math.max(-4, Math.min(4, p.balance));
      }
      if (state.games[act.id]!.steps === gameTarget(act)) state.games[act.id]!.feedback = act.interaction.completion;
      if (state.games[act.id]!.steps === gameTarget(act) && Array.isArray(data.acknowledged) && data.acknowledged.includes(act.id)) state.acknowledged.push(act.id);
      if (!state.acknowledged.includes(act.id)) state.cursors[act.id] = Math.min(state.cursors[act.id]!, act.interaction.afterLine);
      const line = act.dialogue[state.cursors[act.id]!];
      state.frames[act.id] = data.version >= 5 && line && Number.isInteger(data.frames?.[act.id])
        ? Math.max(0, Math.min(data.frames[act.id], subtitleFrames(line).length - 1)) : 0;
    }
    state.actId = canOpen(state, data.actId) ? data.actId : acts.find(act => !state.completed.includes(act.id))?.id ?? 'act05';
    const resume = data.resumeScreen ?? data.screen;
    if (acts.every(act => state.completed.includes(act.id)) && (resume === 'recap' || resume === 'ending')) state.resumeScreen = resume;
  } catch { return newGame(); }
  return state;
}

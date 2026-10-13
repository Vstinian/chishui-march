import { acts } from './data/acts';
import type { Act, ActId, GameProgress } from './types';

export type Screen = 'home' | 'intro' | 'act' | 'recap' | 'ending';
export interface GameState {
  screen: Screen; actId: ActId; completed: ActId[];
  cursors: Partial<Record<ActId, number>>;
  games: Partial<Record<ActId, GameProgress>>;
  acknowledged: ActId[]; introSeen: boolean;
}
export const newGame = (): GameState => ({ screen: 'home', actId: 'act01', completed: [], cursors: {}, games: {}, acknowledged: [], introSeen: false });
export const freshProgress = (): GameProgress => ({ steps: 0, selected: null, feedback: '' });
export const gameTarget = (act: Act): number => ({ bridge: 3, fog: 6, climb: 6, rescue: 3, crossing: 8 })[act.interaction.kind];
export const canOpen = (state: GameState, id: string): boolean => {
  const index = acts.findIndex(act => act.id === id);
  return state.introSeen && index >= 0 && acts.slice(0, index).every(act => state.completed.includes(act.id));
};
export const inGame = (state: GameState, act: Act): boolean => (state.cursors[act.id] ?? 0) === act.interaction.afterLine && !state.acknowledged.includes(act.id);
export const fogPath = [0, 1, 5, 6, 10, 11, 15];
export const climbCues = ['cover', 'climb', 'duck', 'climb', 'duck', 'follow'];
export const cueLabels: Record<string, string> = { cover: '掩护', climb: '攀登', duck: '伏低', follow: '跟进' };

export function playGame(act: Act, previous: GameProgress, value: string): GameProgress {
  const p = { ...previous };
  if (p.steps >= gameTarget(act)) return p;
  if (act.interaction.kind === 'bridge') {
    if (value === 'plank') { p.selected = 'plank'; p.feedback = '门板抬稳了。点击标亮的桥位，把它放下。'; }
    else if (value === `slot-${p.steps}` && p.selected === 'plank') { p.steps++; p.selected = null; p.feedback = '门板落稳了，下一处缺口就在前面。'; }
    else p.feedback = '先取门板，再依次铺到标亮的桥位。';
  } else if (act.interaction.kind === 'fog') {
    const cell = Number(value); const current = fogPath[p.steps];
    const adjacent = Number.isInteger(cell) && cell >= 0 && cell < 16 && Math.abs(Math.floor(cell / 4) - Math.floor(current / 4)) + Math.abs(cell % 4 - current % 4) === 1;
    if (adjacent && cell === fogPath[p.steps + 1]) { p.steps++; p.feedback = '脚下是实地，前方的脚步更近了一点。'; }
    else p.feedback = adjacent ? '这边泥深。退回刚才的实地，再试另一个方向。' : '看不清那么远，先探身边相邻的一格。';
  } else if (act.interaction.kind === 'climb') {
    if (value === climbCues[p.steps]) { p.steps++; p.feedback = '稳住了。看清下一道口令，再行动。'; }
    else p.feedback = '先停在掩体后，按当前口令再试一次。';
  } else if (act.interaction.kind === 'rescue') {
    if (value === 'soldier') { p.selected = 'soldier'; p.feedback = '已经扶稳战友，点下一处掩体一起移动。'; }
    else if (value === 'shelter' && p.selected === 'soldier') { p.steps++; p.selected = null; p.feedback = '在掩体后停稳了。重新扶好战友，准备下一段。'; }
    else p.feedback = '先点战友扶住他，再点掩体移动。';
  } else if (value === 'step') { p.steps++; p.feedback = `第 ${p.steps} 步。脚下站稳了，再向前一步。`; }
  if (p.steps === gameTarget(act)) p.feedback = { bridge: '浮桥接起来了。身后的队伍开始通过。', fog: '找到了队伍，老雷正在转弯处等你。', climb: '你越过了山口，也给身后的战友留出了位置。', rescue: '战友已经回到掩体。你们跟随队伍撤离。', crossing: '脚下是东岸的实地。天快亮了。' }[act.interaction.kind];
  return p;
}
const saveKey = 'chishui-march-story-v2';
export function saveGame(state: GameState): void { try { localStorage.setItem(saveKey, JSON.stringify(state)); } catch { /* 私密模式仍可继续。 */ } }
export function loadGame(): GameState {
  const state = newGame();
  try {
    const data = JSON.parse(localStorage.getItem(saveKey) ?? 'null');
    if (!data || data.introSeen !== true) return state;
    state.introSeen = true;
    for (const act of acts) { if (!Array.isArray(data.completed) || !data.completed.includes(act.id)) break; state.completed.push(act.id); }
    for (const act of acts.filter(act => canOpen(state, act.id))) {
      const cursor = data.cursors?.[act.id];
      state.cursors[act.id] = Number.isInteger(cursor) ? Math.max(0, Math.min(cursor, act.dialogue.length - 1)) : 0;
      const p = data.games?.[act.id];
      state.games[act.id] = { steps: Number.isInteger(p?.steps) ? Math.max(0, Math.min(p.steps, gameTarget(act))) : 0, selected: null, feedback: '' };
      if (state.games[act.id]!.steps === gameTarget(act) && Array.isArray(data.acknowledged) && data.acknowledged.includes(act.id)) state.acknowledged.push(act.id);
      if (!state.acknowledged.includes(act.id)) state.cursors[act.id] = Math.min(state.cursors[act.id]!, act.interaction.afterLine);
    }
    state.actId = acts.find(act => !state.completed.includes(act.id))?.id ?? 'act05';
  } catch { return newGame(); }
  return state;
}

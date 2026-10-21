import { acts } from './data/acts';
import { loadGame, serializeGame, atActEnd, inGame } from './game';
import type { GameState } from './game';

export interface SaveEntry { slot: number; savedAt: string; state: GameState | null; corrupt: boolean; }
const slotKey = (slot: number) => slot === 0 ? 'chishui-march-story-v3' : `chishui-march-manual-v1-${slot}`;
export function readSave(slot: number): SaveEntry | null {
  if (!Number.isInteger(slot) || slot < 0 || slot > 3) return null;
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.introSeen !== true) return null;
    if (!data.cursors || !data.games || !acts.some(act => act.id === data.actId) || ![undefined, 4, 5, 6].includes(data.version)) throw new Error('Invalid save');
    const restored = loadGame(raw);
    if (!restored.introSeen) throw new Error('Unreadable save');
    return { slot, savedAt: typeof data.savedAt === 'string' ? data.savedAt : '', state: restored, corrupt: false };
  } catch { return { slot, savedAt: '', state: null, corrupt: true }; }
}
export function writeSave(slot: number, state: GameState): boolean {
  if (!Number.isInteger(slot) || slot < 1 || slot > 3 || !state.introSeen || state.screen === 'intro') return false;
  try {
    localStorage.setItem(slotKey(slot), serializeGame(state));
    return true;
  } catch { return false; }
}
export function describeSave(state: GameState): string {
  const act = acts.find(a => a.id === state.actId)!;
  if (state.resumeScreen === 'ending') return '五幕终 · 尾声';
  if (state.resumeScreen === 'recap') return '五幕终 · 全局复盘';
  if (atActEnd(state, act)) return `${act.title} · 史料札记`;
  if (inGame(state, act)) return `${act.interaction.title} · 第 ${state.games[act.id]?.steps ?? 0} 步`;
  return `${act.title} · ${act.dialogue[state.cursors[act.id] ?? 0]?.id ?? '幕首'}`;
}

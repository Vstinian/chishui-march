import type { Character, CharacterId, DialogueLine } from '../types';

// 虚构人物试写稿，供节奏与立绘联调；不是人物史料或正式参赛文案。
export const characters: Record<CharacterId, Character> = {
  qingshan: { name: '邓青山', role: '我 · 十七岁的普通战士', portrait: null },
  laolei: { name: '老雷', role: '班长 · 沉默的同行者', portrait: null },
  xiaoman: { name: '小满', role: '年轻战友 · 同乡', portrait: null },
  ahu: { name: '阿虎', role: '向导 · 山路的熟人', portrait: null },
  instructor: { name: '指导员', role: '连队指导员', portrait: null },
};

export function lines(scene: string, entries: [CharacterId, string][]): DialogueLine[] {
  return entries.map(([speaker, text]) => ({ speaker, text, scene }));
}

export const opening = {
  video: null as string | null,
  bgm: null as string | null,
  duration: 18000,
  title: '我不知道，这条路会通向哪里。',
  subtitle: '那时，我只看得见前面人的背影。',
};

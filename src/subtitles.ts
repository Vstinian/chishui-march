import type { DialogueLine } from './types';

export interface SubtitleFrame { id: string; text: string; delays: number[]; }

// 只处理呈现层；原始分框、配音关键词及表情触发位置保持原样。
const subtitleActions = new Set(['上前一步', '传口令', '凑过来看水缸', '喘息', '回过头', '在前头回头', '沉默一会儿', '看了一眼天上的飞机', '边走边问']);
export function subtitlePresentation(frame: SubtitleFrame): { text: string; delays: number[]; sourceEnds: number[] } {
  const omitted = new Set<number>();
  for (const match of frame.text.matchAll(/（([^（）]*)）|\(([^()]*)\)/gu)) {
    if (subtitleActions.has((match[1] ?? match[2]).trim())) continue;
    for (let i = match.index; i < match.index + match[0].length; i++) omitted.add(i);
  }
  const text: string[] = [], delays: number[] = [], sourceEnds: number[] = [];
  let offset = 0;
  Array.from(frame.text).forEach((char, index) => {
    // 每框内部连续排版；原文换行仍留在位置映射中，/a、/b 切换点和声音定位不变。
    if (!omitted.has(offset) && char !== '\n' && char !== '\r') { text.push(char); delays.push(frame.delays[index] ?? 36); sourceEnds.push(offset + char.length); }
    offset += char.length;
  });
  // 尾部被隐藏的提示也应算作原文已读，避免末尾音效永远不触发。
  if (sourceEnds.length) sourceEnds[sourceEnds.length - 1] = frame.text.length;
  return { text: text.join(''), delays, sourceEnds };
}

export function subtitleSourceShown(frame: SubtitleFrame, sourceEnds: number[], shown: string): string {
  return frame.text.slice(0, sourceEnds[Array.from(shown).length - 1] ?? 0);
}

// 逻辑段落 ID 不变，分框使用 /a、/b，避免与新增段落 D011a 等重名。
export function subtitleFrames(line: DialogueLine): SubtitleFrame[] {
  let offset = 0;
  const frames: SubtitleFrame[] = [];
  for (let row = 0; row < line.subtitleLines.length; row += 3) {
    const rows = line.subtitleLines.slice(row, row + 3);
    const text = rows.join('\n');
    const chars = Array.from(text);
    const delays = chars.map((char, index) => {
      if (char === '\n') return 0;
      offset++;
      if (line.longPauses.includes(offset) || /[。！？；]/u.test(char)) return 750;
      if (char === '—' && chars[index + 1] !== '—') return 750;
      if (char === '…' && chars[index + 1] !== '…') return 750;
      if (/[，、：]/u.test(char)) return 250;
      return 36;
    });
    frames.push({ id: `${line.id}/${String.fromCharCode(97 + frames.length)}`, text, delays });
  }
  return frames;
}

import type { DialogueLine } from './types';

export interface SubtitleFrame { id: string; text: string; delays: number[]; }

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

export type AudioBus = 'voice' | 'sfx' | 'music';
export interface SoundCue {
  id: string; lineId: string; bus: AudioBus; asset: string; enabled: boolean;
  trigger: 'line' | 'frame' | 'keyword'; frame: number; keyword: string; occurrence: number;
  delay: number; volume: number; fadeIn: number; fadeOut: number;
  trimStart: number; trimEnd: number; rate: number; loop: boolean; scope: 'frame' | 'line' | 'act' | 'range';
  endLineId?: string; endTrigger?: 'leave' | 'keyword'; endKeyword?: string; endOccurrence?: number;
}
export interface SoundConfig {
  version: 1; scriptFingerprint: string;
  mix: { master: number; voice: number; sfx: number; music: number; ducking: number };
  cues: SoundCue[];
}
export interface SoundAsset { path: string; name: string; bytes: number; duration?: number; source?: string }
export const defaultSoundConfig = (): SoundConfig => ({ version: 1, scriptFingerprint: '', mix: { master: .8, voice: 1, sfx: .7, music: .45, ducking: .35 }, cues: [] });
export const normalizeSoundText = (text: string): string => text.replace(/\s/gu, '');
export function soundFingerprint(lines: { id: string; text: string; subtitleLines: string[] }[]): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(lines.map(l => [l.id, l.text, l.subtitleLines]))) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}
export function keywordEnd(text: string, keyword: string, occurrence: number): number {
  const haystack = normalizeSoundText(text), needle = normalizeSoundText(keyword);
  if (!needle) return -1;
  let position = -1;
  for (let i = 0; i < occurrence; i++) { position = haystack.indexOf(needle, position + 1); if (position < 0) return -1; }
  return position + needle.length;
}
export function validateSoundConfig(value: unknown, lines: { id: string; text: string; subtitleLines: string[] }[]): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return ['配置必须是 JSON 对象'];
  const data = value as SoundConfig;
  if (data.version !== 1 || !Array.isArray(data.cues) || !data.mix) return ['配置结构或版本不正确'];
  if (data.cues.length > 3000) return ['绑定数量超过上限'];
  for (const bus of ['master', 'voice', 'sfx', 'music', 'ducking'] as const) if (!Number.isFinite(data.mix[bus]) || data.mix[bus] < 0 || data.mix[bus] > 1) errors.push(`混音 ${bus} 必须为 0 至 1`);
  if (data.scriptFingerprint !== soundFingerprint(lines)) errors.push('剧本版本已变化，请核对绑定后重新确认当前剧本');
  const ids = new Set<string>();
  for (const cue of data.cues) {
    if (!cue || typeof cue !== 'object') { errors.push('绑定必须是对象'); continue; }
    const name = typeof cue.id === 'string' ? cue.id : '未命名绑定';
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(name) || ids.has(name)) errors.push(`${name}：绑定 ID 无效或重复`);
    ids.add(name);
    const line = lines.find(l => l.id === cue.lineId);
    if (!line) errors.push(`${name}：段落不存在`);
    if (typeof cue.asset !== 'string' || !/^assets\/audio\/[a-zA-Z0-9_.-]+\.(mp3|wav|ogg|m4a)$/i.test(cue.asset) || cue.asset.includes('..')) errors.push(`${name}：请选择素材库中的音频`);
    if (!['voice', 'sfx', 'music'].includes(cue.bus) || !['line', 'frame', 'keyword'].includes(cue.trigger) || !['frame', 'line', 'act', 'range'].includes(cue.scope)) errors.push(`${name}：轨道、触发方式或停止范围无效`);
    if (typeof cue.enabled !== 'boolean' || typeof cue.loop !== 'boolean') errors.push(`${name}：启用和循环状态无效`);
    if (!Number.isInteger(cue.frame) || cue.frame < 0 || (line && cue.frame >= Math.ceil(line.subtitleLines.length / 3))) errors.push(`${name}：字幕框不存在`);
    if (!Number.isInteger(cue.occurrence) || cue.occurrence < 1 || cue.occurrence > 100) errors.push(`${name}：关键词次数无效`);
    if (typeof cue.keyword !== 'string' || cue.keyword.length > 300) errors.push(`${name}：关键词无效`);
    else if (cue.trigger === 'keyword' && line && keywordEnd(line.subtitleLines.join(''), cue.keyword, cue.occurrence) < 0) errors.push(`${name}：该段不存在指定次数的关键词`);
    if (cue.scope === 'range') {
      const endLine = lines.find(l => l.id === cue.endLineId);
      if (!endLine) errors.push(`${name}：请选择结束段落`);
      else if (line && (lines.indexOf(endLine) < lines.indexOf(line) || endLine.id.split('-')[0] !== line.id.split('-')[0])) errors.push(`${name}：结束段落必须在同一幕，且不能早于起始段落`);
      if (!['leave', 'keyword'].includes(cue.endTrigger!)) errors.push(`${name}：结束方式无效`);
      if (cue.endTrigger === 'keyword') {
        if (!Number.isInteger(cue.endOccurrence) || cue.endOccurrence! < 1 || cue.endOccurrence! > 100) errors.push(`${name}：结束关键词次数无效`);
        if (typeof cue.endKeyword !== 'string' || cue.endKeyword.length > 300) errors.push(`${name}：结束关键词无效`);
        else if (endLine) {
          const end = keywordEnd(endLine.subtitleLines.join(''), cue.endKeyword, cue.endOccurrence ?? 1);
          if (end < 0) errors.push(`${name}：结束段落不存在指定次数的关键词`);
          else if (line === endLine) {
            const start = cue.trigger === 'keyword' && typeof cue.keyword === 'string' ? keywordEnd(line.subtitleLines.join(''), cue.keyword, cue.occurrence) : cue.trigger === 'frame' ? normalizeSoundText(line.subtitleLines.slice(0, cue.frame * 3).join('')).length : 0;
            if (end <= start) errors.push(`${name}：结束关键词必须晚于开始播放的位置`);
          }
        }
      }
    }
    for (const key of ['delay', 'volume', 'fadeIn', 'fadeOut', 'trimStart', 'trimEnd', 'rate'] as const) {
      const max = key === 'volume' ? 1 : key === 'rate' ? 2 : 3600;
      const min = key === 'rate' ? .5 : 0;
      if (!Number.isFinite(cue[key]) || cue[key] < min || cue[key] > max) errors.push(`${name}：${key} 数值超出范围`);
    }
    if (cue.trimEnd > 0 && cue.trimEnd <= cue.trimStart) errors.push(`${name}：截取终点必须晚于起点`);
  }
  return errors;
}

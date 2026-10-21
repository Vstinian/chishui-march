import type { Act, CharacterId, DialogueLine } from './types';
import { characters } from './data/narrative';
import { portraitDirections } from './data/portraitCues';
import { subtitleFrames } from './subtitles';

export const portraitDefaults: Record<CharacterId, string> = { qingshan: 'neutral', laolei: 'neutral', xiaoman: 'anxious', ahu: 'focus', instructor: 'neutral', wounded: 'tired' };
export function portraitExpression(id: CharacterId, expression: string): string {
  if (id === 'qingshan' && expression === 'tense') return 'angry';
  return Object.hasOwn(characters[id].expressions, expression) ? expression : portraitDefaults[id];
}
export function expressionAt(line: DialogueLine, id: CharacterId, frame: number, shown: string, fallback = portraitDefaults[id]): string {
  const direction = portraitDirections[line.id];
  let expression = portraitExpression(id, id === line.speaker ? direction?.start ?? line.expression : fallback);
  const visible = (subtitleFrames(line).slice(0, frame).map(f => f.text).join('') + shown).replaceAll('\n', '');
  for (const beat of direction?.beats ?? []) {
    if ((beat.character ?? line.speaker) !== id) continue;
    const index = line.text.indexOf(beat.at);
    if (index >= 0 && visible.length > index) expression = beat.expression;
  }
  return expression;
}
export function portraitCast(act: Act, cursor: number): { id: CharacterId; fallback: string }[] {
  const line = act.dialogue[cursor];
  if (!line || line.narration) return [];
  let partner: CharacterId | undefined;
  const lastExpressions: Partial<Record<CharacterId, string>> = {};
  for (let i = cursor; i >= 0 && act.dialogue[i].sceneId === line.sceneId; i--) {
    const candidate = act.dialogue[i];
    if (candidate.narration) continue;
    if (!partner && candidate.speaker !== 'qingshan') partner = candidate.speaker;
    if (i < cursor) {
      // 倾听者的反应也延续到下一段，直到他再次开口或出现新的反应。
      for (const beat of [...(portraitDirections[candidate.id]?.beats ?? [])].reverse()) {
        const id = beat.character ?? candidate.speaker;
        if (!lastExpressions[id]) lastExpressions[id] = beat.expression;
      }
      if (!lastExpressions[candidate.speaker]) lastExpressions[candidate.speaker] = expressionAt(candidate, candidate.speaker, 0, candidate.text);
    }
  }
  const ids: CharacterId[] = partner ? ['qingshan', partner] : ['qingshan'];
  return ids.map(id => ({ id, fallback: lastExpressions[id] ?? portraitDefaults[id] }));
}
export function portraitPreloads(act: Act, cursor: number): string[] {
  const line = act.dialogue[cursor];
  return portraitCast(act, cursor).flatMap(({ id, fallback }) => {
    const expressions = [expressionAt(line, id, 0, '', fallback), ...(portraitDirections[line.id]?.beats ?? []).filter(beat => (beat.character ?? line.speaker) === id).map(beat => beat.expression)];
    return expressions.map(expression => characters[id].expressions[expression] ?? characters[id].portrait).filter((url): url is string => Boolean(url));
  });
}
// 只替换立绘图层，不重绘对白，也不重新调用声音触发。
export function syncPortraits(root: HTMLElement, act: Act, cursor: number, frame: number, shown: string): void {
  const line = act.dialogue[cursor];
  for (const { id, fallback } of portraitCast(act, cursor)) {
    const target = root.querySelector<HTMLElement>(`.portrait[data-character="${id}"]`);
    if (!target || typeof target.querySelector !== 'function') continue;
    const expression = expressionAt(line, id, frame, shown, fallback);
    if ((target.dataset.requestedExpression ?? target.dataset.expression) === expression) continue;
    const url = characters[id].expressions[expression] ?? characters[id].portrait;
    if (!url) { target.dataset.expression = expression; continue; }
    const active = Number(target.dataset.activeLayer ?? 0), next = 1 - active;
    const incoming = target.querySelector<HTMLImageElement>(`[data-portrait-layer="${next}"]`);
    const outgoing = target.querySelector<HTMLImageElement>(`[data-portrait-layer="${active}"]`);
    if (!incoming || !outgoing) continue;
    target.dataset.requestedExpression = expression;
    incoming.src = url;
    void incoming.decode().then(() => {
      if (!target.isConnected || target.dataset.requestedExpression !== expression) return;
      incoming.style.opacity = '1'; outgoing.style.opacity = '0';
      target.dataset.activeLayer = String(next); target.dataset.expression = expression;
    }).catch(() => { if (target.dataset.requestedExpression === expression) delete target.dataset.requestedExpression; });
  }
}

import type { Act } from '../types';
import { escapeHtml } from '../utils/html';

export function renderInteraction(act: Act, selected: string[]): string {
  const options = act.interaction.options.map((option, index) => {
    const active = selected.includes(option.id);
    return `<button class="option-button ${active ? 'is-selected' : ''}" data-action="option" data-option="${escapeHtml(option.id)}" aria-pressed="${active}">
      <span class="option-number">${String(index + 1).padStart(2, '0')}</span>
      <span>${escapeHtml(option.label)}</span>
      <span class="option-check" aria-hidden="true">${active ? '✓' : '＋'}</span>
    </button>`;
  }).join('');

  const feedback = act.interaction.kind === 'choice'
    ? act.interaction.options.find((option) => selected.includes(option.id))?.feedback
    : act.interaction.options.filter((option) => selected.includes(option.id)).map((option) => option.feedback).join(' ');

  return `<section class="interaction-panel" aria-labelledby="interaction-title">
    <div class="panel-heading"><span class="tiny-label">互动 ${act.interaction.kind === 'choice' ? '选择' : '探索'}</span><h3 id="interaction-title">${escapeHtml(act.interaction.prompt)}</h3></div>
    <div class="option-list">${options}</div>
    <p class="interaction-feedback" aria-live="polite">${feedback ? escapeHtml(feedback) : '选择后，这里会显示本幕反馈。'}</p>
  </section>`;
}


export function bugleIcon(muted: boolean): string {
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12h4l13-5v15L7 17H3M3 10v9M20 7l5-3v21l-5-3M8 18v5a4 4 0 0 0 8 0v-2"/>${muted ? '<path d="m4 28 24-24" class="sound-muted-mark"/>' : '<path d="M28 10q3 4 0 8"/>'}</svg>`;
}

export const menuIcon = '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M5 7h18M5 14h18M5 21h18"/></svg>';

const htmlEntities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);


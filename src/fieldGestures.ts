// 拖动只是「选择门板 → 放到桥位」的另一种输入，不改变任务规则。
export function installFieldGestures(root: HTMLElement, place: (value: string, plank: string) => void, enabled: () => boolean): void {
  let drag: { pointer: number; startX: number; startY: number; plank: string; ghost: HTMLElement | null } | null = null;
  let suppressClickUntil = 0;
  function clearDrag(): void {
    if (!drag) return;
    drag.ghost?.remove();
    root.querySelectorAll('.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
    if (root.hasPointerCapture(drag.pointer)) root.releasePointerCapture(drag.pointer);
    drag = null;
  }
  root.addEventListener('pointerdown', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-draggable-plank]');
    if (!enabled() || !button || button.disabled || event.button !== 0 || !event.isPrimary) return;
    drag = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, plank: button.dataset.value!, ghost: null };
  });
  root.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!enabled()) { clearDrag(); return; }
    if (!drag.ghost && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    event.preventDefault();
    if (!drag.ghost) {
      root.setPointerCapture(event.pointerId);
      drag.ghost = document.createElement('div'); drag.ghost.className = 'field-drag-ghost';
      drag.ghost.textContent = `${drag.plank.at(-1)} 格门板`; drag.ghost.setAttribute('aria-hidden', 'true');
      document.body.append(drag.ghost);
    }
    drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
    root.querySelectorAll('.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>('.field-hotspot[data-value^="slot-"]');
    if (target && !target.disabled) target.classList.add('is-drop-target');
  });
  root.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const moved = Boolean(drag.ghost), plank = drag.plank;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>('.field-hotspot[data-value^="slot-"]');
    clearDrag();
    if (!moved) return;
    suppressClickUntil = Date.now() + 350;
    if (enabled() && target && !target.disabled) place(target.dataset.value!, plank);
  });
  root.addEventListener('pointercancel', event => { if (drag?.pointer === event.pointerId) clearDrag(); });
  // 触屏会先由按钮隐式捕获；转交给根节点时不能把拖动误判为取消。
  root.addEventListener('lostpointercapture', event => { if (event.target === root && drag?.pointer === event.pointerId) clearDrag(); });
  root.addEventListener('click', event => { if (Date.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') clearDrag(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearDrag(); });
}

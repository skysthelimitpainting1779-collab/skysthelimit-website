/**
 * Focus-trap primitives for custom modal dialogs.
 *
 * Used by dialogs that cannot use the shared dialog primitive directly (e.g.
 * the voice widget, whose panel hosts a cross-origin iframe and needs custom
 * open/close wiring). Keeps the Tab cycle inside the dialog and lets the
 * caller restore focus to the trigger on close.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Visible, keyboard-focusable descendants of the dialog, in tab order. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return candidates.filter((el) => el.getClientRects().length > 0);
}

/**
 * Where focus should move for a Tab keydown inside the dialog, or null when
 * the browser default already keeps focus inside the dialog.
 *
 * Tabbing from a focused iframe element into the iframe's own document is
 * allowed (the iframe is part of the dialog); pair this with a focusin guard
 * so that tabbing back OUT of a cross-origin iframe past its last stop —
 * which lands on the page behind the overlay — returns focus to the dialog.
 */
export function getTrapTarget(
  container: HTMLElement,
  activeElement: Element | null,
  shiftKey: boolean,
): HTMLElement | null {
  const items = getFocusableElements(container);
  if (items.length === 0) return null;
  const first = items[0];
  const last = items[items.length - 1];
  const outside = !activeElement || !container.contains(activeElement);

  if (shiftKey) {
    if (activeElement === first || outside) return last;
    return null;
  }
  if (activeElement === last) {
    // Let the browser move focus into the iframe's document; it is still
    // inside the dialog. Wrapping here would make the embedded voice orb
    // unreachable by keyboard.
    if (last.tagName === 'IFRAME') return null;
    return first;
  }
  if (outside) return first;
  return null;
}

/** True when the focus target is not inside the dialog. */
export function isFocusOutside(container: HTMLElement, target: Element | null): boolean {
  return !!target && !container.contains(target);
}

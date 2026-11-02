import type { MouseEvent } from 'react';

/**
 * onMouseDown for custom controls (pins, switches, truth-table rows). A mouse click leaves keyboard
 * focus off the control, so Space keeps meaning play/pause instead of re-activating it. Tab still
 * reaches the control for keyboard users.
 */
export function noPointerFocus(e: MouseEvent) {
  e.preventDefault();
  if (document.activeElement instanceof HTMLElement || document.activeElement instanceof SVGElement) {
    document.activeElement.blur();
  }
}

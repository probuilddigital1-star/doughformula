// State machine for the header's Calculators dropdown (a disclosure menu: a button that
// shows a list of links). SiteNav's script feeds it DOM events and applies the result; the
// rules live here so they can be unit tested without a browser.

export interface MenuState {
  open: boolean;
  /** Index of the link that should have focus, or null to leave focus alone. */
  focus: number | null;
  /** True when focus should go back to the button (after Escape). */
  focusButton: boolean;
}

export type MenuEvent =
  | { type: 'button-click' }
  | { type: 'button-key'; key: string }
  | { type: 'list-key'; key: string; index: number; count: number }
  | { type: 'escape' }
  | { type: 'outside-click' }
  | { type: 'focus-left' }
  | { type: 'link-click' };

export const CLOSED: MenuState = { open: false, focus: null, focusButton: false };

export function menuReducer(state: MenuState, event: MenuEvent): MenuState {
  const still = { ...state, focus: null, focusButton: false };
  switch (event.type) {
    case 'button-click':
      return state.open ? CLOSED : { open: true, focus: null, focusButton: false };
    case 'button-key':
      if (event.key === 'ArrowDown') return { open: true, focus: 0, focusButton: false };
      return still;
    case 'list-key': {
      if (!state.open || event.count === 0) return still;
      const last = event.count - 1;
      if (event.key === 'ArrowDown') return { ...still, focus: event.index >= last ? 0 : event.index + 1 };
      if (event.key === 'ArrowUp') return { ...still, focus: event.index <= 0 ? last : event.index - 1 };
      if (event.key === 'Home') return { ...still, focus: 0 };
      if (event.key === 'End') return { ...still, focus: last };
      return still;
    }
    case 'escape':
      return state.open ? { open: false, focus: null, focusButton: true } : still;
    case 'outside-click':
    case 'focus-left':
    case 'link-click':
      return CLOSED;
  }
}

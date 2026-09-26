import { describe, it, expect } from 'vitest';
import { CLOSED, menuReducer, type MenuEvent, type MenuState } from '../../src/lib/calc-menu';

const run = (events: MenuEvent[], from: MenuState = CLOSED) => events.reduce(menuReducer, from);
const OPEN: MenuState = { open: true, focus: null, focusButton: false };

describe('Calculators dropdown', () => {
  it('opens and closes on button click without moving focus', () => {
    expect(run([{ type: 'button-click' }])).toEqual(OPEN);
    expect(run([{ type: 'button-click' }, { type: 'button-click' }])).toEqual(CLOSED);
  });

  it('ArrowDown on the button opens the menu and focuses the first link', () => {
    expect(run([{ type: 'button-key', key: 'ArrowDown' }])).toEqual({ open: true, focus: 0, focusButton: false });
    expect(run([{ type: 'button-key', key: 'a' }])).toEqual(CLOSED);
  });

  it('arrow keys move through the links and wrap; Home and End jump', () => {
    const key = (k: string, index: number): MenuEvent => ({ type: 'list-key', key: k, index, count: 3 });
    expect(menuReducer(OPEN, key('ArrowDown', 0)).focus).toBe(1);
    expect(menuReducer(OPEN, key('ArrowDown', 2)).focus).toBe(0);
    expect(menuReducer(OPEN, key('ArrowUp', 0)).focus).toBe(2);
    expect(menuReducer(OPEN, key('ArrowUp', 2)).focus).toBe(1);
    expect(menuReducer(OPEN, key('Home', 2)).focus).toBe(0);
    expect(menuReducer(OPEN, key('End', 0)).focus).toBe(2);
    expect(menuReducer(OPEN, key('ArrowDown', 0)).open).toBe(true);
  });

  it('Escape closes the menu and sends focus back to the button', () => {
    expect(menuReducer(OPEN, { type: 'escape' })).toEqual({ open: false, focus: null, focusButton: true });
    expect(menuReducer(CLOSED, { type: 'escape' })).toEqual(CLOSED);
  });

  it('closes on an outside click, when focus leaves the menu, and after a link is chosen', () => {
    for (const type of ['outside-click', 'focus-left', 'link-click'] as const) {
      expect(menuReducer(OPEN, { type }), type).toEqual(CLOSED);
    }
  });
});

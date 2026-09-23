/**
 * Keyboard behavior tests for the voice-widget focus trap
 * (src/lib/focus-trap.ts). Simulates Tab / Shift+Tab keydown decisions and
 * asserts focus actually moves where the trap says it should.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import {
  getFocusableElements,
  getTrapTarget,
  isFocusOutside,
} from '../src/lib/focus-trap.ts';

function setup() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="dialog" role="dialog" aria-modal="true">
      <button id="close">Close</button>
      <button id="ghost" disabled>Ghost</button>
      <button id="hidden-btn">Hidden</button>
      <iframe id="orb" title="Sky voice assistant"></iframe>
    </div>
    <div id="plain-dialog" role="dialog" aria-modal="true">
      <button id="a">A</button>
      <button id="b">B</button>
    </div>
    <button id="outside">Outside</button>
  </body></html>`);
  const { document } = dom.window;
  // jsdom has no layout engine, so every element reports zero rects. Treat
  // every element as rendered except the explicitly hidden one.
  dom.window.HTMLElement.prototype.getClientRects = function () {
    return this.id === 'hidden-btn' ? [] : [{ width: 8, height: 8 }];
  };
  return document;
}

/** Simulate one Tab (or Shift+Tab) keydown and move focus per the trap. */
function pressTab(document, dialog, active, shiftKey) {
  active.focus();
  const target = getTrapTarget(dialog, document.activeElement, shiftKey);
  if (target) target.focus();
  return target;
}

describe('getFocusableElements', () => {
  it('collects visible focusables in tab order, skipping disabled and hidden', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    const ids = getFocusableElements(dialog).map((el) => el.id);
    assert.deepEqual(ids, ['close', 'orb']);
  });

  it('excludes elements with negative tabindex outside sequential tab order', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    const neg = document.createElement('button');
    neg.id = 'neg';
    neg.setAttribute('tabindex', '-2');
    dialog.appendChild(neg);
    const ids = getFocusableElements(dialog).map((el) => el.id);
    assert.ok(!ids.includes('neg'), 'tabindex=-2 element must not be a trap target');
  });
});

describe('getTrapTarget with the voice-widget dialog (close + iframe)', () => {
  it('Tab from the Close button: trap returns null, declining to intercept', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    const close = document.getElementById('close');
    assert.equal(getTrapTarget(dialog, close, false), null);
  });

  it('Tab from the focused iframe lets focus enter the iframe document', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    const orb = document.getElementById('orb');
    // Wrapping here would strand keyboard users outside the voice orb.
    assert.equal(getTrapTarget(dialog, orb, false), null);
  });

  it('Shift+Tab from the Close button wraps to the iframe', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    const close = document.getElementById('close');
    const orb = document.getElementById('orb');
    assert.equal(getTrapTarget(dialog, close, true), orb);
  });

  it('Shift+Tab from the iframe: trap returns null, declining to intercept', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    const orb = document.getElementById('orb');
    assert.equal(getTrapTarget(dialog, orb, true), null);
  });

  it('Tab with focus outside the dialog pulls focus to the first control', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    const outside = document.getElementById('outside');
    const close = document.getElementById('close');
    assert.equal(getTrapTarget(dialog, outside, false), close);
  });
});

describe('getTrapTarget with a plain two-button dialog', () => {
  it('Tab on the last button wraps to the first', () => {
    const document = setup();
    const dialog = document.getElementById('plain-dialog');
    const a = document.getElementById('a');
    const b = document.getElementById('b');
    assert.equal(getTrapTarget(dialog, b, false), a);
  });

  it('Shift+Tab on the first button wraps to the last', () => {
    const document = setup();
    const dialog = document.getElementById('plain-dialog');
    const a = document.getElementById('a');
    const b = document.getElementById('b');
    assert.equal(getTrapTarget(dialog, a, true), b);
  });
});

describe('full tab cycle', () => {
  it('Tab cycles Close -> iframe -> (into iframe) and Shift+Tab returns', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    const close = document.getElementById('close');
    const orb = document.getElementById('orb');

    // Tab from Close: trap says "let the browser handle it" (moves to iframe).
    assert.equal(pressTab(document, dialog, close, false), null);
    orb.focus();
    assert.equal(document.activeElement, orb);

    // Shift+Tab from the iframe element: default moves back to Close.
    assert.equal(pressTab(document, dialog, orb, true), null);
    close.focus();
    assert.equal(document.activeElement, close);

    // Shift+Tab from Close wraps to the iframe.
    const wrapped = pressTab(document, dialog, close, true);
    assert.equal(wrapped, orb);
    assert.equal(document.activeElement, orb);
  });
});

describe('isFocusOutside', () => {
  it('detects focus on the page behind the overlay', () => {
    const document = setup();
    const dialog = document.getElementById('dialog');
    assert.equal(isFocusOutside(dialog, document.getElementById('outside')), true);
    assert.equal(isFocusOutside(dialog, document.getElementById('close')), false);
    assert.equal(isFocusOutside(dialog, null), false);
  });
});

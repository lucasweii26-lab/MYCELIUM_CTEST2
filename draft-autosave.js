/* ==========================================================================
   draft-autosave.js — keeps what visitors typed in the site's modals and chat box.
   Saves to localStorage while typing, restores on load / reopen, and forgets the
   draft when the form is reset after a successful submit (or after 24 hours).
   Classic script, no dependencies. Passwords and file inputs are never saved.
   ========================================================================== */
(() => {
  'use strict';

  const PREFIX = 'mycelium-draft:v1:';
  const TTL_MS = 24 * 60 * 60 * 1000;   // drafts older than this are discarded
  const SAVE_DELAY_MS = 250;
  // One entry per place a visitor can type. `root` is the form or container holding the fields.
  const SCOPES = [
    { id: 'volunteer', root: '#volunteerFormEl' },
    { id: 'report', root: '#reportForm' },
    { id: 'chat', root: '.chat-input' },
    { id: 'newsletter', root: '#newsletterForm' }
  ];
  const FIELDS = 'input:not([type=hidden]):not([type=password]):not([type=file]):not([type=submit]):not([type=button]), textarea, select';

  let store = null;
  try {
    store = window.localStorage;
    store.setItem(PREFIX + 'probe', '1');
    store.removeItem(PREFIX + 'probe');
  } catch (error) {
    return; // storage blocked (private mode etc.): the site works as before, just without drafts
  }

  // Not per-site on purpose: the active site is only known after other scripts run, so a site-based key could change between save and clear.
  const keyFor = (scope, el, index) => `${PREFIX}${scope.id}:${el.name || el.id || index}`;
  const isToggle = (el) => el.type === 'checkbox' || el.type === 'radio';
  const readValue = (el) => (isToggle(el) ? (el.checked ? '1' : '') : el.value);

  const remember = (key, value) => {
    try {
      if (value) store.setItem(key, JSON.stringify({ v: value, t: Date.now() }));
      else store.removeItem(key);
    } catch (error) { /* quota full or blocked: ignore */ }
  };

  const recall = (key) => {
    try {
      const raw = store.getItem(key);
      if (!raw) return '';
      const entry = JSON.parse(raw);
      if (!entry || typeof entry.v !== 'string' || Date.now() - entry.t > TTL_MS) {
        store.removeItem(key);
        return '';
      }
      return entry.v;
    } catch (error) {
      return '';
    }
  };

  const pending = new Map(); // key -> { el, timer }

  const flush = () => {
    pending.forEach(({ el, timer }, key) => {
      clearTimeout(timer);
      remember(key, readValue(el));
    });
    pending.clear();
  };

  const schedule = (key, el) => {
    const current = pending.get(key);
    if (current) clearTimeout(current.timer);
    pending.set(key, {
      el,
      timer: setTimeout(() => {
        pending.delete(key);
        remember(key, readValue(el));
      }, SAVE_DELAY_MS)
    });
  };

  const attach = (scope) => {
    const root = document.querySelector(scope.root);
    if (!root) return;
    const fields = Array.from(root.matches(FIELDS) ? [root] : root.querySelectorAll(FIELDS));

    fields.forEach((el, index) => {
      const key = keyFor(scope, el, index);
      const saved = recall(key);
      if (saved && !readValue(el)) {
        if (isToggle(el)) el.checked = true;
        else el.value = saved;
        // Let the page react as if the visitor typed it (chat box auto-resize, counters, etc.)
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const onEdit = () => schedule(key, el);
      el.addEventListener('input', onEdit);
      el.addEventListener('change', onEdit);
    });

    // form.reset() is only called after a successful submit, so that is when the draft is dropped.
    const form = root.tagName === 'FORM' ? root : root.closest('form');
    if (form) {
      form.addEventListener('reset', () => {
        fields.forEach((el, index) => {
          const key = keyFor(scope, el, index);
          const waiting = pending.get(key);
          if (waiting) clearTimeout(waiting.timer);
          pending.delete(key);
          remember(key, '');
        });
      });
    }
  };

  const start = () => SCOPES.forEach(attach);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

  // Manual hook, e.g. window.MYCELIUM_DRAFTS.clear() after a custom submit.
  window.MYCELIUM_DRAFTS = {
    clear(scopeId) {
      try {
        Object.keys(store).forEach((key) => {
          if (key.indexOf(PREFIX) === 0 && (!scopeId || key.indexOf(`:${scopeId}:`) > -1)) store.removeItem(key);
        });
      } catch (error) { /* ignore */ }
    }
  };
})();

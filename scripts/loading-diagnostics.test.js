import test from 'node:test';
import assert from 'node:assert/strict';
import { isLoadingDiagnosticsEnabled } from '../loading-diagnostics.js';

test('native static-server modules initialize without Vite env and keep diagnostics opt-in', () => {
  assert.doesNotThrow(() => import.meta.env?.DEV);
  assert.equal(isLoadingDiagnosticsEnabled({ hostname: 'localhost', search: '' }), false);
  assert.equal(isLoadingDiagnosticsEnabled({ hostname: 'localhost', search: '?heroLoadingDebug=1' }), true);
  assert.equal(isLoadingDiagnosticsEnabled({ hostname: 'example.com', search: '?heroLoadingDebug=1' }), false);
});

test('Vite diagnostics require the explicit query flag', () => {
  assert.equal(isLoadingDiagnosticsEnabled({ viteDevelopment: true, hostname: 'example.com' }), false);
  assert.equal(isLoadingDiagnosticsEnabled({ viteDevelopment: true, search: '?heroLoadingDebug=1' }), true);
});

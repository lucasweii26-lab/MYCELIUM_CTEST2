import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeroPreviewState } from '../hero-preview-state.js';

test('broad scan travels through the full Hero while fading within its configured duration', () => {
  const preview = createHeroPreviewState({ scanMs: 1000, finishFadeMs: 200, opacity: 0.28 });
  assert.equal(preview.start(0), true);
  assert.equal(preview.start(1), false);
  assert.deepEqual(preview.update(500), { phase: 'scanning', progress: 0.5, opacity: 0.28 });
  assert.deepEqual(preview.update(900), { phase: 'fading', progress: 0.9, opacity: 0.14 });
  const nearComplete = preview.update(999);
  assert.equal(nearComplete.phase, 'fading');
  assert.equal(nearComplete.progress, 0.999);
  assert.ok(nearComplete.opacity > 0 && nearComplete.opacity < 0.00003);
  assert.deepEqual(preview.update(1000), { phase: 'hidden', progress: 1, opacity: 0, completed: true });
});

test('scroll interruption cancels the current preview and permits a clean restart', () => {
  const preview = createHeroPreviewState();
  preview.start(0);
  preview.update(500);
  preview.cancel();
  assert.deepEqual(preview.update(600), { phase: 'hidden', progress: 0, opacity: 0 });
  assert.equal(preview.start(700), true);
  assert.equal(preview.phase, 'scanning');
});

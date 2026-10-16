import test from 'node:test';
import assert from 'node:assert/strict';
import { LoadingManager } from 'three';
import { createHeroLoadingPlan, replayCompletedHeroItems } from '../hero-loading-plan.js';

test('replays frames that completed before the plan was registered', () => {
  const manager = new LoadingManager();
  let completedPlans = 0;
  manager.onLoad = () => completedPlans++;
  const plan = createHeroLoadingPlan({
    onStart: url => manager.itemStart(url),
    onEnd: url => manager.itemEnd(url),
    onError: url => manager.itemError(url),
  });
  const items = [{ id: '12', url: '/frame_0012.webp' }];
  const results = new Map([['12', { ok: true }]]);

  // The real completion event arrives before itemStart and is therefore ignored.
  assert.equal(plan.settle('12', true), false);
  plan.register(items);
  replayCompletedHeroItems(items, results, (id, ok) => plan.settle(id, ok));

  assert.equal(completedPlans, 1);
  assert.deepEqual(plan.pendingIds(), []);
});

test('same aliased URL is balanced by logical frame ID and duplicate ends are ignored', () => {
  const manager = new LoadingManager();
  let starts = 0;
  let ends = 0;
  let errors = 0;
  let completedPlans = 0;
  manager.onLoad = () => completedPlans++;
  const plan = createHeroLoadingPlan({
    onStart: url => { starts++; manager.itemStart(url); },
    onEnd: url => { ends++; manager.itemEnd(url); },
    onError: url => { errors++; manager.itemError(url); },
  });
  const items = [
    { id: '11', url: '/frame_0012.webp' },
    { id: '12', url: '/frame_0012.webp' },
  ];
  plan.register(items);

  assert.equal(plan.settle('11', true), true);
  assert.equal(plan.settle('11', false), false);
  assert.equal(plan.settle('12', false), true);
  assert.deepEqual({ starts, ends, errors }, { starts: 2, ends: 2, errors: 1 });
  assert.equal(completedPlans, 1);
  assert.deepEqual(plan.pendingIds(), []);
});

test('timeout fails and ends every pending item exactly once', () => {
  let starts = 0;
  let ends = 0;
  let errors = 0;
  const plan = createHeroLoadingPlan({
    onStart: () => starts++,
    onEnd: () => ends++,
    onError: () => errors++,
  });
  plan.register([{ id: 'a', url: '/a' }, { id: 'b', url: '/b' }]);
  plan.settle('a', true);
  plan.failPending();
  plan.failPending();
  assert.deepEqual({ starts, ends, errors }, { starts: 2, ends: 2, errors: 1 });
  assert.deepEqual(plan.pendingIds(), []);
});

test('a timed-out or already-settled item ignores a late completion', () => {
  let ends = 0;
  const plan = createHeroLoadingPlan({ onEnd: () => ends++ });
  plan.register([{ id: 'frame', url: '/frame.webp' }]);
  plan.failPending();
  assert.equal(plan.settle('frame', true), false);
  assert.equal(ends, 1);
});

test('optional WebGL first render does not hold the core loading manager open', () => {
  const manager = new LoadingManager();
  let completed = false;
  manager.onLoad = () => { completed = true; };
  manager.itemStart('mycelium:loader-setup');
  // The optional shader's first-render lifecycle is deliberately not tracked
  // as a required page-loading item.
  manager.itemEnd('mycelium:loader-setup');
  assert.equal(completed, true);
});

/**
 * Per-item loading accounting for the Hero preload plan.
 * A URL may appear more than once for timeline aliases, so identity is the
 * logical item id rather than the URL string.
 */
export function createHeroLoadingPlan({ onStart, onEnd, onError } = {}) {
  const tasks = new Map();

  function register(items) {
    for (const item of items) {
      if (!item || item.id == null || !item.url || tasks.has(item.id)) continue;
      tasks.set(item.id, { id: item.id, url: item.url, settled: false });
      onStart?.(item.url, item.id);
    }
  }

  function settle(id, ok = true) {
    const task = tasks.get(id);
    if (!task || task.settled) return false;
    task.settled = true;
    if (!ok) onError?.(task.url, task.id);
    onEnd?.(task.url, task.id);
    return true;
  }

  function failPending() {
    for (const task of tasks.values()) {
      if (!task.settled) settle(task.id, false);
    }
  }

  function pendingIds() {
    return [...tasks.values()].filter(task => !task.settled).map(task => task.id);
  }

  return { register, settle, failPending, pendingIds };
}

/** Settle plan items whose images completed before the plan was registered. */
export function replayCompletedHeroItems(items, results, settle) {
  for (const item of items) {
    const result = results instanceof Map
      ? results.get(item.id)
      : results?.find(candidate => candidate.id === item.id);
    if (result) settle(item.id, result.ok);
  }
}

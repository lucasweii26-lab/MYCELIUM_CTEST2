export function createHeroPreviewState({ scanMs = 4000, finishFadeMs = 280, opacity = 0.42 } = {}) {
  let phase = 'hidden';
  let startedAt = 0;

  function start(now) {
    if (phase !== 'hidden') return false;
    phase = 'scanning';
    startedAt = now;
    return true;
  }

  function cancel() {
    phase = 'hidden';
    startedAt = 0;
  }

  function update(now) {
    if (phase === 'hidden') return { phase, progress: 0, opacity: 0 };
    const elapsed = Math.max(0, now - startedAt);
    const progress = Math.min(1, elapsed / scanMs);
    if (progress >= 1) {
      cancel();
      return { phase, progress: 1, opacity: 0, completed: true };
    }

    // Fade inside the configured travel time, keeping the front moving until
    // the trailing edge has cleared the top of the Hero.
    const fadeStart = Math.max(0, 1 - finishFadeMs / scanMs);
    const fadeProgress = Math.max(0, Math.min(1, (progress - fadeStart) / (1 - fadeStart)));
    const easedFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
    phase = fadeProgress > 0 ? 'fading' : 'scanning';
    return { phase, progress, opacity: opacity * (1 - easedFade) };
  }

  return {
    start,
    cancel,
    update,
    get phase() { return phase; },
  };
}

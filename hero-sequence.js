/* ==========================================================================
   MYCELIUM — pinned hero → next-scene handoff (landonorris.com-style)

   What makes that transition work is NOT a sheet sliding over a picture. It is:
     (1) colour continuity   — the stage melts into the colour of the next scene,
                               so there is no visible section edge;
     (2) layers at their own speeds — old content exits upward, new content
                               enters from below, each at a different rate;
     (3) a short "landing"   — the last frame rests before anything moves;
     (4) a reveal on arrival — the next headline is wiped in, not just faded.

   DOM (static in index.html, nothing is created or moved at runtime):
     #heroSequence            tall scroll track
       └─ #introHero          sticky, 100svh, PINNED the whole time
            ├─ #heroCanvas    PNG sequence painted on a <canvas>
            ├─ ::after        "paper veil" (CSS) — same background as .slider
            └─ .intro-hero-inner   kicker / title / desc / button
     nav#nav + .slider        next scene, pulled UP over the end of the track by
                              a negative margin (style.css), so plain browser
                              scrolling slides it in. No scroll hijacking.

   One eased scroll value `scrollPosition` (vh from the top of the track) drives:

     1 FRAMES   0 → frameVh            frame_001 → frame_100
     2 LANDING  → +holdVh              frame_100 rests (veil / copy begin just after it lands)
     3 HANDOFF  → +HANDOFF_VH          the next scene rises (native scroll). Meanwhile:
          · veil      the film melts into the page colour (finishes ~45% in,
                      so the rising sheet meets an already-cream hero: no edge)
          · film      pushes in very slightly while it dissolves
          · hero copy exits upward, each line at its own speed, and fades
          · --enter   (0→1 on .slider) drives the next scene's own parallax:
                      images ride lowest, copy next, meta line least, titles wipe in
     4 RELEASE  track ends: nav + slider already fill the viewport, so the sticky
                hero un-pins invisibly underneath.

   Only transform / opacity / custom properties are written per frame. No layout
   is read on scroll (metrics are cached; see refreshMetrics).
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------ TUNABLES ------------------------------ */
  const TOTAL_FRAMES = 251;           // 251 timeline positions; identical adjacent frames share one file

  // Scroll budget in vh: [desktop, mobile]. Mobile is shorter to limit scroll fatigue.
  const FRAME_VH = [300, 240];        // beat 1: frame sequence (desktop = original distance)
  const HOLD_VH = [40, 30];           // beat 2: landing on frame_100
  const HANDOFF_VH = 100;             // beat 3: next scene travels one full viewport (geometry, not taste)

  // Hero → page-colour melt ("veil"), in vh relative to the end of the frames / the handoff
  const VEIL_START_AFTER_FRAMES = 14; // veil starts this many vh after frame_100 lands
  const VEIL_END_HANDOFF = 0.45;      // veil completes at this share of the handoff
  const FILM_PUSH = 0.05;             // film scales 1 → 1.05 while it dissolves (0 disables)

  // Hero copy exit: lines leave upward at different speeds, staggered
  const COPY_SPEED = [0.45, 1, 0.7, 0.55];       // kicker, title, desc, button
  const COPY_TRAVEL_VH = [22, 16];               // max upward travel of the fastest line: [desktop, mobile]
  const COPY_STAGGER_VH = 6;                     // each following line starts this much later
  const COPY_END_HANDOFF = 0.35;                 // first line fully gone at this share of the handoff
  const MOBILE_QUERY = '(max-width: 700px)';

  const GLIDE_MIN_MS = 1800;          // "Explore the community" glide duration bounds
  const GLIDE_MAX_MS = 3600;
  const EASE = 0.20;                  // smoothing per 60fps frame (lower = silkier)
  const CONCURRENCY = 6;              // parallel frame downloads
  const DPR_CAP = 2;                  // cap backing-store cost on high-DPR displays
  const FRAME_LOAD_TIMEOUT_MS = 12000;
  const FRAME_CACHE_LIMIT = 36;        // bound decoded-image memory; evicted frames reload on demand

  // Keep every viewport on the same canonical sequence so the base, depth,
  // and wireframe layers always resolve the same frame index and dimensions.
  const PATHS = ['./hero-frames/'];
  const BG = '#0b0905';               // canvas / hero base colour

  /* ------------------------------ ELEMENTS ------------------------------ */
  const heroSequence = document.getElementById('heroSequence');
  const introHero = document.getElementById('introHero');
  const heroCanvas = document.getElementById('heroCanvas');
  if (!heroSequence || !introHero || !heroCanvas) {
    console.error('[hero-sequence] #heroSequence / #introHero / #heroCanvas not found');
    return;
  }
  const heroInner = introHero.querySelector('.intro-hero-inner');
  const nextSection = document.querySelector('.slider');   // the scene that takes over from the hero
  const heroCopy = heroInner ? Array.from(heroInner.children) : [];   // lines that exit one by one
  const ctx = heroCanvas.getContext('2d', { alpha: false });

  function reportLoadingState(stage, detail = {}) {
    window.MYCELIUM_REPORT_HERO_LOADING_STATE?.('sequence', stage, detail);
  }

  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = matchMedia(MOBILE_QUERY);
  let reduced = reducedMotionQuery.matches;

  /* ------------------------------ HELPERS ------------------------------- */
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a || 1e-6)); return t * t * (3 - 2 * t); };
  const easeInOutSine = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const pick = pair => (mobileQuery.matches ? pair[1] : pair[0]);

  /* ----------------------- STATE (declared before use) -------------------- */
  let frameVh = FRAME_VH[0], holdVh = HOLD_VH[0];     // active scroll budget (desktop/mobile)
  let totalVh = frameVh + holdVh + HANDOFF_VH;        // pinned scroll distance of the track
  let vhPx = innerHeight / 100;                       // 1vh in px (from the svh-sized pinned hero)
  let trackTop = 0;                                   // document-Y of the track's top edge
  let canvasW = 0, canvasH = 0, dpr = 1, lastDrawKey = '';
  let targetPos = 0, scrollPosition = 0, rafId = 0, lastTs = 0;
  let currentIndex = 0, requestedIndex = -1, displayedIndex = -1, frameRequestId = 0;
  let lastStageKey = '', copyHidden = false, entering = false;

  /* --------------------------- FRAME LOADING ---------------------------- */
  const frames = new Array(TOTAL_FRAMES).fill(null);
  const frameResults = new Array(TOTAL_FRAMES).fill(null);
  const frameLoads = new Map();
  const frameFailures = new Array(TOTAL_FRAMES).fill(0);
  let loadPlanTimedOut = false;
  let loadedCount = 0;
  let framePath = PATHS[0];
  function reportFrameEnd(i, ok) {
    document.dispatchEvent(new CustomEvent('mycelium:loading-item-end', {
      detail: { id: String(i), url: frameSrc(i), ok }
    }));
  }
    // ---- Loading strategy ----
  // The loading screen only waits for "critical" frames. The rest stream in
  // the background around the scroll position, inside a bounded window.
  const CRITICAL_STEP = 6;                         // ~43 critical frames
  const IS_MOBILE = mobileQuery.matches;
  const CACHE_LIMIT = IS_MOBILE ? 90 : 150;
  const WINDOW_RADIUS = IS_MOBILE ? 20 : 45;
  const BG_CONCURRENCY = IS_MOBILE ? 2 : 3;
  const isCritical = i => i === 0 || i === TOTAL_FRAMES - 1 || i % CRITICAL_STEP === 0;
  let planDone = false;
  let bgPaused = false; // true while the first-visit reveal and wave play
  let bgWorkers = 0;

  function touchFrame() { /* kept as a no-op: eviction is now distance-based */ }

  // Evict the frames farthest from the current scroll position first.
  // Critical frames (coarse coverage), current and displayed frames are protected.
  function trimFrameCache() {
    let cached = 0;
    const evictable = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      if (!frames[i]) continue;
      cached++;
      if (!isCritical(i) && i !== currentIndex && i !== displayedIndex) evictable.push(i);
    }
    if (cached <= CACHE_LIMIT) return;
    evictable.sort((a, b) => Math.abs(b - currentIndex) - Math.abs(a - currentIndex));
    for (const i of evictable) {
      if (cached <= CACHE_LIMIT) break;
      frames[i] = null;
      cached--;
    }
  }

  function nearestLoaded(index) {
    for (let d = 0; d < TOTAL_FRAMES; d++) {
      if (frames[index - d]) return index - d;
      if (frames[index + d]) return index + d;
    }
    return -1;
  }

  function pickNextMissing() {
    for (let d = 0; d <= WINDOW_RADIUS; d++) {
      const candidates = d === 0 ? [currentIndex] : [currentIndex + d, currentIndex - d];
      for (const i of candidates) {
        if (i < 0 || i >= TOTAL_FRAMES) continue;
        if (frames[i] || frameLoads.has(i) || frameFailures[i] >= 2) continue;
        return i;
      }
    }
    return -1;
  }

  // Background streaming: nearest-to-current first, only after the loading plan.
  function kickBackground() {
    if (!planDone || document.hidden || bgPaused) return;
    while (bgWorkers < BG_CONCURRENCY) {
      const next = pickNextMissing();
      if (next < 0) return;
      bgWorkers++;
      loadFrame(next).finally(() => { bgWorkers--; kickBackground(); });
    }
  }
  // These adjacent timeline frames have identical image bytes; alias them to the earlier file.
  const duplicateFrameSource = new Map([
    [12, 11], [37, 36], [62, 61], [87, 86], [112, 111],
    [137, 136], [162, 161], [187, 186], [212, 211], [237, 236]
  ]);
  const frameSrc = i => {
    const sourceIndex = duplicateFrameSource.get(i) ?? i;
    return `${framePath}frame_${String(sourceIndex + 1).padStart(4, '0')}.webp`;
  };

  function loadFrame(i) {
    if (frames[i]) { touchFrame(i); return Promise.resolve(true); }
    if (frameLoads.has(i)) return frameLoads.get(i);
    if (frameFailures[i] >= 2) return Promise.resolve(false);
    const load = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (!ok) image.src = '';
        frameResults[i] = { ok };
        reportFrameEnd(i, ok);
        if (!ok) { frameFailures[i]++; if (frameFailures[i] < 2) frameLoads.delete(i); }
        if (ok) {
          frames[i] = image;
          loadedCount++;
          touchFrame(i);
          frameLoads.delete(i);
          trimFrameCache();
          schedule();
        }
        resolve(ok);
      };
      const timeoutId = setTimeout(() => {
        console.warn('[hero-sequence] timed out loading', frameSrc(i));
        finish(false);
      }, FRAME_LOAD_TIMEOUT_MS);
      image.onload = () => {
        image.decode ? image.decode().then(() => finish(true), () => finish(true)) : finish(true);
      };
      image.onerror = () => {
        console.warn('[hero-sequence] missing', frameSrc(i));
        finish(false);
      };
      image.src = frameSrc(i);
    });
    frameLoads.set(i, load);
    return load;
  }

  // Loading screen waits only for these: first, last, then every CRITICAL_STEP-th.
  function criticalOrder() {
    const out = [0, TOTAL_FRAMES - 1];
    for (let i = CRITICAL_STEP; i < TOTAL_FRAMES - 1; i += CRITICAL_STEP) out.push(i);
    return out;
  }
  function probe(path) {
    return new Promise(resolve => {
      const image = new Image();
      let settled = false;
      const done = ok => { if (settled) return; settled = true; clearTimeout(timeoutId); image.src = ''; resolve(ok); };
      const timeoutId = setTimeout(() => done(false), FRAME_LOAD_TIMEOUT_MS);
      image.onload = () => done(true); image.onerror = () => done(false);
      image.src = `${path}frame_0001.webp`;
    });
  }

  (async () => {
    reportLoadingState('waiting-for-loader');
    if (document.documentElement.dataset.loadingManagerReady !== 'true') {
      await new Promise(resolve => document.addEventListener('mycelium:loading-manager-ready', resolve, { once: true }));
    }
    reportLoadingState('probing-frame-path');
    let found = false;
    for (const path of PATHS) { if (await probe(path)) { framePath = path; found = true; break; } }
    if (!found) {
      console.error('[hero-sequence] Optimized hero frames were not found in:', PATHS,
        '\nEnsure the hero-frames directory is copied into the published site.');
      document.dispatchEvent(new CustomEvent('mycelium:loading-plan', { detail: { urls: [] } }));
      document.dispatchEvent(new CustomEvent('mycelium:loading-plan-complete'));
      return;
    }
    const queue = criticalOrder();
    const firstFrameIndex = queue.shift();
    const planIndexes = [firstFrameIndex, ...queue];
    const planItems = planIndexes.map(i => ({ id: String(i), url: frameSrc(i) }));
    reportLoadingState('loading-plan-start', { itemCount: planItems.length });
    document.dispatchEvent(new CustomEvent('mycelium:loading-plan', {
      detail: {
        urls: planItems.map(item => item.url),
        items: planItems,
        results: new Map(planIndexes.filter(i => frameResults[i]).map(i => [String(i), frameResults[i]])),
      }
    }));
    const loadPlanTimeout = setTimeout(() => {
      loadPlanTimedOut = true;
      reportLoadingState('loading-plan-timeout', { pendingFrameLoads: [...frameLoads.keys()] });
      console.warn('[hero-sequence] Frame preload deadline reached; continuing with available frames.');
      document.dispatchEvent(new CustomEvent('mycelium:loading-plan-timeout'));
      document.dispatchEvent(new CustomEvent('mycelium:loading-plan-complete'));
    }, 45000);

    await loadFrame(firstFrameIndex);                                   // show something immediately
    if (!frames[firstFrameIndex]) await loadFrame(firstFrameIndex);     // one retry for the first frame
    const worker = async () => { while (queue.length && !loadPlanTimedOut) await loadFrame(queue.shift()); };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    clearTimeout(loadPlanTimeout);
    planDone = true;
    // First-visit smoothness: downloading and decoding ~200 more 1080p frames at the very moment the
    // loading reveal and the first wave play is what made the wave stutter. Stay quiet until the wave has
    // finished (or 8 s have passed, or the visitor scrolls: then frames are needed immediately).
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bgPaused = true;
      const resumeEvents = ['wheel', 'touchstart', 'keydown', 'scroll'];
      const resumeBackground = () => {
        if (!bgPaused) return;
        bgPaused = false;
        resumeEvents.forEach(type => window.removeEventListener(type, resumeBackground));
        document.removeEventListener('mycelium:wire-preview-complete', resumeBackground);
        kickBackground();
      };
      document.addEventListener('mycelium:wire-preview-complete', resumeBackground, { once: true });
      resumeEvents.forEach(type => window.addEventListener(type, resumeBackground, { passive: true }));
      setTimeout(resumeBackground, 8000);
    }
    reportLoadingState('loading-plan-complete', { loadedFrameObjects: loadedCount });
    document.dispatchEvent(new CustomEvent('mycelium:loading-plan-complete'));
    kickBackground();                                                    // stream the remaining frames
  })().catch(error => {
    reportLoadingState('initialization-error', { message: String(error?.message ?? error) });
    console.error('[hero-sequence] Frame sequence initialization failed:', error);
    document.dispatchEvent(new CustomEvent('mycelium:loading-plan-timeout'));
    document.dispatchEvent(new CustomEvent('mycelium:loading-plan', { detail: { urls: [] } }));
    document.dispatchEvent(new CustomEvent('mycelium:loading-plan-complete'));
  });
  /* ------------------------------ METRICS -------------------------------- */
  // Applies the (desktop|mobile) scroll budget to CSS, which sizes the track and
  // pulls the next scene up by the handoff distance. Single source of truth.
  function applyScrollBudget() {
    frameVh = pick(FRAME_VH);
    holdVh = pick(HOLD_VH);
    totalVh = frameVh + holdVh + HANDOFF_VH;
    heroSequence.style.setProperty('--hero-scroll-vh', String(totalVh));
    // custom properties inherit, but the nav sits OUTSIDE #heroSequence, so set on <html>
    document.documentElement.style.setProperty('--hero-scroll-vh', String(totalVh));
    document.documentElement.style.setProperty('--hero-handoff-vh', String(HANDOFF_VH));
  }

  // Cached geometry. Refreshed on resize / orientation / load / track resize — never per scroll.
  function refreshMetrics() {
    vhPx = (introHero.offsetHeight || innerHeight) / 100;
    trackTop = heroSequence.getBoundingClientRect().top + window.scrollY;

    // canvas backing store (clientWidth/Height ignore CSS transforms: always the un-scaled size)
    const nextDpr = Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1.5 : DPR_CAP);
    const nextW = heroCanvas.clientWidth || introHero.clientWidth || innerWidth;
    const nextH = heroCanvas.clientHeight || introHero.clientHeight || innerHeight;
    reportLoadingState('metrics-refresh', {
      innerWidth,
      innerHeight,
      heroWidth: nextW,
      heroHeight: nextH,
      devicePixelRatio: nextDpr,
      trackTop,
      vhPx,
    });
    if (nextW !== canvasW || nextH !== canvasH || nextDpr !== dpr) {   // e.g. mobile URL-bar resize: no realloc
      canvasW = nextW; canvasH = nextH; dpr = nextDpr;
      heroCanvas.width = Math.round(canvasW * dpr);
      heroCanvas.height = Math.round(canvasH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      lastDrawKey = '';
      if (displayedIndex >= 0 && frames[displayedIndex]) drawFrame(displayedIndex);
    }
    lastDrawKey = ''; lastStageKey = '';
  }

  /* ------------------------------ CANVAS -------------------------------- */
  function drawCover(image, alpha) {
    const scale = Math.max(canvasW / image.naturalWidth, canvasH / image.naturalHeight);
    const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, (canvasW - dw) / 2, (canvasH - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
  }

  function drawFrame(index) {
    if (!Number.isInteger(index) || index < 0 || index >= TOTAL_FRAMES || !frames[index]) return false;
    const key = index + ':' + canvasW + 'x' + canvasH;
    if (key !== lastDrawKey) {
      lastDrawKey = key;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, canvasW, canvasH);
      drawCover(frames[index], 1);

      // dark-gold grade + vignette: edges melt into the background
      ctx.fillStyle = 'rgba(40,26,4,0.42)'; ctx.fillRect(0, 0, canvasW, canvasH);
      const g = ctx.createRadialGradient(canvasW / 2, canvasH / 2, Math.min(canvasW, canvasH) * 0.3,
                                         canvasW / 2, canvasH / 2, Math.max(canvasW, canvasH) * 0.75);
      g.addColorStop(0, 'rgba(11,9,5,0)');
      g.addColorStop(1, 'rgba(11,9,5,0.85)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvasW, canvasH);
    }

    const sourceIndex = duplicateFrameSource.get(index) ?? index;
    const assetIndex = sourceIndex + 1;
    displayedIndex = index;
    touchFrame(index);
    trimFrameCache();
    heroCanvas.dataset.heroFrame = String(assetIndex);
    heroCanvas.dataset.heroTimelineFrame = String(index + 1);
    document.dispatchEvent(new CustomEvent('mycelium:hero-frame', {
      detail: { currentIndex: index, assetIndex, index: assetIndex }
    }));
    return true;
  }

  function requestMasterFrame(index) {
    currentIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(index)));
    if (currentIndex === requestedIndex) return;

    requestedIndex = currentIndex;
    const requestId = ++frameRequestId;
    const requestedIndexSnapshot = currentIndex;

    // Never leave the hero empty: show the nearest decoded frame while the exact one loads.
    if (!frames[requestedIndexSnapshot]) {
      const near = nearestLoaded(requestedIndexSnapshot);
      if (near !== -1 && near !== displayedIndex) drawFrame(near);
    }

    loadFrame(requestedIndexSnapshot).then(() => {
      if (requestId !== frameRequestId) return;
      if (!frames[requestedIndexSnapshot]) {
        // Failed load: allow a retry instead of staying stuck on this index.
        if (frameFailures[requestedIndexSnapshot] < 2 && requestedIndex === requestedIndexSnapshot) {
          requestedIndex = -1;
          setTimeout(schedule, 600);
        }
        return;
      }

      let committed = false;
      const commit = () => {
        if (committed || requestId !== frameRequestId || currentIndex !== requestedIndexSnapshot) return;
        committed = drawFrame(requestedIndexSnapshot);
      };
      const requestEvent = new CustomEvent('mycelium:hero-frame-request', {
        cancelable: true,
        detail: {
          currentIndex: requestedIndexSnapshot,
          assetIndex: (duplicateFrameSource.get(requestedIndexSnapshot) ?? requestedIndexSnapshot) + 1,
          commit
        }
      });
      document.dispatchEvent(requestEvent);
      if (!requestEvent.defaultPrevented) commit();
    });
  }
  document.addEventListener('mycelium:hero-frame-sync-ready', () => {
    requestedIndex = -1;
    requestMasterFrame(currentIndex);
  });

  /* ----------------------------- SCROLL MODEL ---------------------------- */
  // Scroll position inside the track in vh, clamped to the pinned range.
  // Uses cached trackTop / vhPx: reading scrollY does not force layout.
  function readScrollPosition() {
    return Math.min(totalVh, Math.max(0, (window.scrollY - trackTop) / vhPx));
  }

  /* ----------------------------- STAGE STYLING --------------------------- */
  function resetStage() {
    introHero.style.removeProperty('--veil');
    heroCanvas.style.transform = '';
    heroCopy.forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
    if (heroInner) heroInner.removeAttribute('inert');
    if (nextSection) { nextSection.style.removeProperty('--enter'); nextSection.classList.remove('is-entering'); }
    copyHidden = false; entering = false;
    lastStageKey = '';
  }

  // Beats 2–3 styling. `position` is the eased scroll position in vh.
  function applyStage(position) {
    const handoffStart = frameVh + holdVh;                       // the next scene starts to rise here
    const handoff = clamp01((position - handoffStart) / HANDOFF_VH);   // 0 → 1 while it covers the viewport

    // --- veil: the film melts into the page colour so the rising scene meets no edge ---
    const veilStart = frameVh + VEIL_START_AFTER_FRAMES;
    const veilEnd = handoffStart + VEIL_END_HANDOFF * HANDOFF_VH;
    const veil = easeInOutSine(clamp01((position - veilStart) / (veilEnd - veilStart)));

    // --- hero copy: each line exits upward at its own speed, staggered, and fades ---
    const travelPx = pick(COPY_TRAVEL_VH) * vhPx;
    const copyEnd = handoffStart + COPY_END_HANDOFF * HANDOFF_VH;
    const copyState = heroCopy.map((_, i) => {
      const start = veilStart + i * COPY_STAGGER_VH;
      const progress = smoothstep(start, copyEnd + i * COPY_STAGGER_VH, position);
      return { progress, y: -travelPx * (COPY_SPEED[i] ?? 0.6) * progress };
    });

    // --- next scene: its own parallax is driven by --enter (0 → 1) ---
    const enter = Math.round(smoothstep(0, 1, handoff) * 1000) / 1000;   // rounded so 0 / 1 are exact (class toggles cleanly)

    const key = veil.toFixed(3) + '|' + enter.toFixed(3) + '|' + copyState.map(c => c.progress.toFixed(3)).join(',');
    if (key === lastStageKey) return;                    // nothing visibly changed
    lastStageKey = key;

    introHero.style.setProperty('--veil', veil.toFixed(3));
    heroCanvas.style.transform = FILM_PUSH && veil > 0 ? `scale(${(1 + FILM_PUSH * veil).toFixed(4)})` : '';

    copyState.forEach((c, i) => {
      const el = heroCopy[i];
      el.style.opacity = c.progress > 0 ? (1 - c.progress).toFixed(3) : '';
      el.style.transform = c.progress > 0 ? `translate3d(0,${c.y.toFixed(1)}px,0)` : '';
    });
    // gone lines leave the tab order (the button must not stay focusable while invisible)
    const hide = copyState.every(c => c.progress > 0.98);
    if (heroInner && hide !== copyHidden) { copyHidden = hide; heroInner.toggleAttribute('inert', hide); }

    if (nextSection) {
      nextSection.style.setProperty('--enter', enter.toFixed(3));
      const isEntering = enter > 0 && enter < 1;         // title wipe (clip-path) only while arriving
      if (isEntering !== entering) { entering = isEntering; nextSection.classList.toggle('is-entering', isEntering); }
    }
  }

  /* ------------------------------ RENDER LOOP ---------------------------- */
  // Runs only while something is changing (scroll, resize, easing, a frame
  // finishing loading) and never while the tab is hidden.
  function schedule() {
    if (!rafId && !document.hidden) rafId = requestAnimationFrame(tick);
  }

  function tick(timestamp) {
    rafId = 0;
    if (document.hidden) return;

    if (reduced) { drawFrame(TOTAL_FRAMES - 1); return; }   // reduced motion: static final frame

        targetPos = readScrollPosition();
    if (window.MYCELIUM_LENIS) {
      // Lenis 已经负责平滑，这里不能再叠第二层指数缓动，否则尾段会拖出长尾
      scrollPosition = targetPos;
    } else {
      // 没有 Lenis（降级为原生滚动）时才保留原来的缓动
      const dt = Math.min(50, lastTs ? timestamp - lastTs : 16.67);
      lastTs = timestamp;
      const k = 1 - Math.pow(1 - EASE, dt / 16.67);
      const delta = targetPos - scrollPosition;
      scrollPosition = Math.abs(delta) < 0.15 ? targetPos : scrollPosition + delta * k;
    }
    // 1 FRAMES: frame_001 → frame_100
    const scrollProgress = clamp01(scrollPosition / frameVh);
    currentIndex = Math.round(scrollProgress * (TOTAL_FRAMES - 1));
    requestMasterFrame(currentIndex);
    kickBackground();
    // 3 HANDOFF: pinned hero recedes while the next scene is scrolled over it.
    applyStage(scrollPosition);

    if (scrollPosition !== targetPos) schedule(); else lastTs = 0;
  }

  addEventListener('scroll', schedule, { passive: true });
  let layoutRefreshRaf = 0;
  const onLayoutChange = () => {
    if (layoutRefreshRaf) return;
    layoutRefreshRaf = requestAnimationFrame(() => {
      layoutRefreshRaf = 0;
      refreshMetrics();
      // Re-sample scroll after viewport height/track geometry changes, including F11.
      targetPos = readScrollPosition();
      scrollPosition = targetPos;
      schedule();
    });
  };
  addEventListener('resize', onLayoutChange, { passive: true });
  addEventListener('orientationchange', onLayoutChange, { passive: true });
  if ('ResizeObserver' in window) {
    const heroResizeObserver = new ResizeObserver(onLayoutChange);
    heroResizeObserver.observe(heroSequence);
    heroResizeObserver.observe(introHero);
  }
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onLayoutChange, { passive: true });
  document.addEventListener('visibilitychange', () => { lastTs = 0; if (!document.hidden) schedule(); });
  // Snap (no easing) once layout and scroll restoration have settled.
  addEventListener('load', () => {
    refreshMetrics();
    if (!reduced) scrollPosition = targetPos = readScrollPosition();
    schedule();
  });

  const onReducedChange = event => {
    reduced = event.matches;
    if (reduced) resetStage(); else { refreshMetrics(); scrollPosition = targetPos = readScrollPosition(); }
    lastDrawKey = '';
    schedule();
  };
  reducedMotionQuery.addEventListener ? reducedMotionQuery.addEventListener('change', onReducedChange)
                                      : reducedMotionQuery.addListener(onReducedChange);
  const onBreakpointChange = () => { applyScrollBudget(); refreshMetrics(); scrollPosition = targetPos = readScrollPosition(); schedule(); };
  mobileQuery.addEventListener ? mobileQuery.addEventListener('change', onBreakpointChange)
                               : mobileQuery.addListener(onBreakpointChange);

  /* ------------------------------ PUBLIC HOOK ---------------------------- */
  // "Explore the community": one eased glide through the film and the handoff,
  // landing where the nav meets the top of the viewport. Any user input cancels it.
  let glideRaf = 0, gliding = false;
  const GLIDE_CANCEL_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  const stopGlide = () => {
    if (!gliding) return;
    gliding = false;
    cancelAnimationFrame(glideRaf);
    glideRaf = 0;
    document.documentElement.style.scrollBehavior = '';
    GLIDE_CANCEL_EVENTS.forEach(name => removeEventListener(name, stopGlide));
  };

window.scrollToNav = () => {
    const navEl = document.getElementById('nav');
    if (!navEl) return;

    const from = window.scrollY;
    // 🎯 直接拿nav的页面Y坐标，滚动到nav贴视口顶部（menuItem就在nav内部）
    const to = Math.max(0, navEl.getBoundingClientRect().top + window.scrollY);

    const distance = to - from;
    if (distance <= 0) return;
    if (reduced) { window.scrollTo(0, to); return; }

    stopGlide();
    gliding = true;
    const duration = Math.min(GLIDE_MAX_MS, Math.max(GLIDE_MIN_MS, 700 + (distance / vhPx) * 4));
    const startTime = performance.now();

    document.documentElement.style.scrollBehavior = 'auto';
    GLIDE_CANCEL_EVENTS.forEach(name => addEventListener(name, stopGlide, { passive: true }));

    const step = now => {
      const k = clamp01((now - startTime) / duration);
      window.scrollTo(0, from + distance * easeInOutCubic(k));
      if (k < 1) glideRaf = requestAnimationFrame(step); else stopGlide();
    };
    glideRaf = requestAnimationFrame(step);
};

  /* -------------------------------- START -------------------------------- */
  applyScrollBudget();
  refreshMetrics();
  if (reduced) resetStage(); else scrollPosition = targetPos = readScrollPosition();
  schedule();
})();
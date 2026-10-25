import { LoadingManager } from "./node_modules/three/build/three.module.js";
import { createHeroLoadingPlan, replayCompletedHeroItems } from "./hero-loading-plan.js";
import { isLoadingDiagnosticsEnabled } from "./loading-diagnostics.js";
const revealSfxUrl = new URL("./audio/reveal-sfx.mp3", import.meta.url).href;

// Bridge classic hero-sequence image loads into Three.js' real asset manager.
// The hero itself remains the existing 2D canvas sequence; no extra WebGL scene
// or GPU workload is introduced by the preloader.
const screen = document.querySelector('.loading-screen');
const progressBar = screen?.querySelector('.loading-bar');
const progressText = screen?.querySelector('.loading-progress-value');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const manager = new LoadingManager();
const minimumVisibleMs = 2400;
const startedAt = performance.now();
// Native ES modules have no import.meta.env (for example, when served by Live
// Server). The optional chaining is intentional: diagnostics must never stop
// the loader from booting outside Vite.
const diagnosticsEnabled = isLoadingDiagnosticsEnabled({
  viteDevelopment: import.meta.env?.DEV === true,
  hostname: window.location.hostname,
  search: window.location.search,
});
const pendingManagerItems = new Map();
const heroStages = {};
let planComplete = false;
let dismissed = false;
let revealSound;
let displayedProgress = 0;
let logoCycleTimeline = null;

function logLoadingDiagnostic(action, detail = {}) {
  if (!diagnosticsEnabled) return;
  console.debug('[hero-loading]', {
    elapsedMs: Math.round(performance.now() - startedAt),
    action,
    detail,
    pendingManagerItems: [...pendingManagerItems].map(([name, count]) => ({ name, count })),
    pendingHeroFrames: heroPlan?.pendingIds() ?? [],
    stages: { ...heroStages },
  });
}

if (diagnosticsEnabled) {
  const originalItemStart = manager.itemStart.bind(manager);
  manager.itemStart = (url, ...args) => {
    pendingManagerItems.set(url, (pendingManagerItems.get(url) ?? 0) + 1);
    logLoadingDiagnostic('itemStart', { url });
    return originalItemStart(url, ...args);
  };
  const originalItemEnd = manager.itemEnd.bind(manager);
  manager.itemEnd = (url, ...args) => {
    const count = pendingManagerItems.get(url) ?? 0;
    if (count <= 1) pendingManagerItems.delete(url);
    else pendingManagerItems.set(url, count - 1);
    logLoadingDiagnostic('itemEnd', { url });
    return originalItemEnd(url, ...args);
  };
  const originalItemError = manager.itemError.bind(manager);
  manager.itemError = (url, ...args) => {
    logLoadingDiagnostic('itemError', { url });
    return originalItemError(url, ...args);
  };
}

const heroPlan = createHeroLoadingPlan({
  onStart: url => manager.itemStart(url),
  onEnd: url => manager.itemEnd(url),
  onError: url => manager.itemError(url),
});
if (diagnosticsEnabled) {
  window.__MYCELIUM_LOADING_DIAGNOSTICS__ = () => ({
    elapsedMs: Math.round(performance.now() - startedAt),
    planComplete,
    dismissed,
    pendingManagerItems: [...pendingManagerItems].map(([name, count]) => ({ name, count })),
    pendingHeroFrames: heroPlan.pendingIds(),
    stages: { ...heroStages },
  });
  window.MYCELIUM_REPORT_HERO_LOADING_STATE = (source, stage, detail = {}) => {
    heroStages[source] = { stage, ...detail, elapsedMs: Math.round(performance.now() - startedAt) };
    logLoadingDiagnostic('stage', { source, stage, ...detail });
  };
}

manager.itemStart('mycelium:loader-setup');
window.MYCELIUM_LOADING_MANAGER = manager;
document.documentElement.dataset.loadingManagerReady = 'true';

function animateLogoDraw() {
  const path = screen?.querySelector('.logo-path');
  const mark = screen?.querySelector('.loading-brand-mark-wrap');
  if (!path) return;

  const pathLength = path.getTotalLength();
  if (!Number.isFinite(pathLength) || pathLength <= 0) return;
  path.style.strokeDasharray = `${pathLength}`;
  path.style.strokeDashoffset = `${pathLength}`;
  path.style.stroke = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
  path.style.fill = 'transparent';

  const fillColor = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
  if (reducedMotion.matches || !window.gsap) {
    path.style.strokeDashoffset = '0';
    path.style.fill = fillColor;
    return;
  }

  const gsap = window.gsap;
  logoCycleTimeline = gsap.timeline({
    repeat: -1,
    defaults: { overwrite: 'auto' },
    onRepeat: () => {
      // Keep every loop pixel-identical after GSAP's repeat boundary.
      gsap.set(path, { strokeDashoffset: pathLength, fill: 'transparent' });
    },
  });
  logoCycleTimeline
    .set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength, fill: 'transparent' })
    .fromTo(path,
      { strokeDashoffset: pathLength },
      { strokeDashoffset: 0, duration: 1.48, ease: 'power2.inOut' })
    .to(path, { fill: fillColor, duration: 0.22, ease: 'power1.out' }, '-=0.2');
  if (mark) logoCycleTimeline.fromTo(mark, { scale: 1.025 }, { scale: 1, duration: 0.5, ease: 'power3.out' }, '-=0.42');
  logoCycleTimeline
    .to({}, { duration: 3 })
    .to(path, {
      strokeDashoffset: pathLength,
      fill: 'transparent',
      duration: 0.9,
      ease: 'power2.inOut',
    });
  if (mark) logoCycleTimeline.to(mark, { scale: 1.025, duration: 0.35, ease: 'power2.inOut' }, '<');
  logoCycleTimeline.to({}, { duration: 0.5 });
}

// ---------------------------------------------------------------------------
// Browser-tab feedback while loading: the favicon pulses (logo shrinks and grows inside a
// progress ring) and the tab title shows the real percentage. Both are restored on reveal.
// ---------------------------------------------------------------------------
const faviconLink = document.querySelector('link[rel~="icon"]');
const originalFaviconHref = faviconLink?.getAttribute('href') ?? '';
const originalTitle = document.title;
let faviconTimer = 0;

function startTabLoader() {
  if (!faviconLink || !originalFaviconHref || reducedMotion.matches) return;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const tint = document.createElement('canvas');
  tint.width = tint.height = size;
  const tintCtx = tint.getContext('2d');
  const logo = new Image();
  let logoReady = false;
  logo.onload = () => {
    // Recolour the dark line-art logo to paper white so it reads on the dark tile.
    tintCtx.clearRect(0, 0, size, size);
    tintCtx.drawImage(logo, 0, 0, size, size);
    tintCtx.globalCompositeOperation = 'source-in';
    tintCtx.fillStyle = '#f4f1e7';
    tintCtx.fillRect(0, 0, size, size);
    logoReady = true;
  };
  logo.src = new URL(originalFaviconHref, document.baseURI).href;

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  const t0 = performance.now();

  const draw = () => {
    const t = (performance.now() - t0) / 1000;
    const breathe = 0.5 + 0.5 * Math.cos((t * Math.PI * 2) / 1.6);   // 1 -> 0 -> 1 every 1.6 s
    const scale = 0.56 + 0.34 * breathe;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#21343e';
    ctx.beginPath();
    ctx.roundRect?.(0, 0, size, size, 16) ?? ctx.rect(0, 0, size, size);
    ctx.fill();
    if (logoReady) {
      const d = size * scale;
      ctx.drawImage(tint, (size - d) / 2, (size - d) / 2, d, d);
    }
    // progress ring (real loader progress)
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(244,241,231,0.18)';
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#91a98a';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 5, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.max(0.04, displayedProgress / 100)));
    ctx.stroke();
    link.href = canvas.toDataURL('image/png');
    // Replacing the node is what makes Chrome/Firefox repaint the tab icon.
    document.head.querySelectorAll('link[rel~="icon"]').forEach((el) => { if (el !== link) el.remove(); });
    document.head.appendChild(link);
    document.title = `${displayedProgress}% · Mycelium`;
  };
  draw();
  faviconTimer = window.setInterval(draw, 90);
}

function stopTabLoader() {
  if (faviconTimer) window.clearInterval(faviconTimer);
  faviconTimer = 0;
  if (!originalFaviconHref) return;
  document.head.querySelectorAll('link[rel~="icon"]').forEach((el) => el.remove());
  const restored = document.createElement('link');
  restored.rel = 'icon';
  restored.type = 'image/png';
  restored.href = originalFaviconHref;
  document.head.appendChild(restored);
  document.title = originalTitle;
}

try { startTabLoader(); } catch (error) { console.warn('[loading-screen] Tab loader unavailable.', error); }

function updateProgress(_url, loaded, total) {
  const measuredPercent = total ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
  displayedProgress = Math.max(displayedProgress, measuredPercent);
  const percent = displayedProgress;
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${percent}%`;
}

manager.onProgress = updateProgress;
manager.onError = (url) => console.warn('[loading-screen] Asset failed to load:', url);
manager.onLoad = () => {
  logLoadingDiagnostic('manager-onLoad', { planComplete, dismissed });
  if (!planComplete || dismissed) return;
  dismissed = true;
  // onProgress intentionally caps at 99 while any tracked resource is still
  // outstanding. The manager's onLoad callback is the authoritative 100% edge.
  displayedProgress = 100;
  if (progressBar) progressBar.style.width = '100%';
  if (progressText) progressText.textContent = '100%';
  const remaining = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
  window.setTimeout(revealSite, remaining);
};

function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function prepareLogoForOutro(mark) {
  const path = screen?.querySelector('.logo-path');
  const imageLogo = screen?.querySelector('.loading-logo');
  const gsap = window.gsap;
  logoCycleTimeline?.pause();

  // The SVG is inline, but force its path geometry and the companion wordmark
  // to decode before the scale punch starts. The preloader's manager also waits
  // for the wordmark request; this is a final paint/upload handoff guard.
  await Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    imageLogo?.decode?.().catch(() => undefined) ?? Promise.resolve(),
  ]);

  if (path) {
    const pathLength = path.getTotalLength();
    if (Number.isFinite(pathLength) && pathLength > 0) {
      path.style.strokeDasharray = `${pathLength}`;
      path.style.stroke = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
      if (gsap) {
        gsap.killTweensOf(path);
        gsap.set(path, { strokeDashoffset: 0, fill: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() });
      } else {
        path.style.strokeDashoffset = '0';
        path.style.fill = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
      }
      // Force layout so getBBox confirms that the full vector is present.
      path.getBBox();
    }
  }
  if (mark && gsap) {
    gsap.killTweensOf(mark);
    gsap.set(mark, { scale: 1, opacity: 1 });
  }
  await nextPaint();
}

async function triggerOutro() {
  if (!screen) return;
  if (progressBar) progressBar.style.width = '100%';
  if (progressText) progressText.textContent = '100%';

  const mark = screen.querySelector('.loading-brand-mark-wrap');
  await prepareLogoForOutro(mark);

  const gsap = window.gsap;
  const counter = screen.querySelector('.counter-text, .loading-progress-value');
  if (revealSound) {
    revealSound.currentTime = 0;
    revealSound.play().catch(() => {});
  }

  // Keep a reliable fallback for reduced motion or environments without GSAP.
  // In the normal path, loading-reveal.js turns the actual SVG logo silhouette
  // into a transparent window and scales that window until the hero fills view.
  const finish = () => {
    screen.classList.add('hidden');
    document.dispatchEvent(new CustomEvent('mycelium:loading-revealed'));
  };
  if (reducedMotion.matches || !gsap || !mark) {
    finish();
    return;
  }

  const timeline = gsap.timeline({ onComplete: finish });
  if (counter) {
    timeline.to(counter, { opacity: 0, y: -8, duration: 0.16, ease: 'power2.in' }, 0);
  } else {
    timeline.to({}, { duration: 0.16 });
  }
}

function revealSite() {
  stopTabLoader();
  void triggerOutro().catch((error) => {
    console.warn('[loading-screen] Branded outro failed; revealing the page directly.', error);
    screen?.classList.add('hidden');
    const mainSite = document.querySelector('#main-site, .hero-sequence');
    mainSite?.style.removeProperty('opacity');
    mainSite?.style.removeProperty('visibility');
    mainSite?.style.removeProperty('transform');
  });
}

function trackPromise(url, promise) {
  manager.itemStart(url);
  let timeoutId;
  const bounded = Promise.race([promise, new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`Timed out waiting for ${url}`)), 20000);
  })]);
  bounded.then(
    () => manager.itemEnd(url),
    (error) => {
      console.warn('[loading-screen] Non-blocking asset failed:', url, error);
      manager.itemError(url);
      manager.itemEnd(url);
    },
  ).finally(() => clearTimeout(timeoutId));
}

if (screen) {
  const logo = screen.querySelector('.loading-logo');
  if (logo) {
    const logoUrl = new URL(logo.getAttribute('src'), document.baseURI).href;
    trackPromise(logoUrl, new Promise((resolve) => {
      if (logo.complete) resolve();
      else {
        logo.addEventListener('load', resolve, { once: true });
        logo.addEventListener('error', resolve, { once: true });
      }
    }));
  }

  trackPromise('mycelium:fonts', document.fonts?.ready ?? Promise.resolve());
  manager.itemStart(revealSfxUrl);
  const revealSoundController = new AbortController();
  const revealSoundTimeout = window.setTimeout(() => revealSoundController.abort(), 20000);
  fetch(revealSfxUrl, { signal: revealSoundController.signal }).then(async (response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const soundBlob = await response.blob();
    revealSound = new Audio(URL.createObjectURL(soundBlob));
    revealSound.preload = 'auto';
    revealSound.volume = 0.32;
    manager.itemEnd(revealSfxUrl);
  }).catch((error) => {
    console.warn('[loading-screen] Reveal sound unavailable:', error);
    manager.itemError(revealSfxUrl);
    manager.itemEnd(revealSfxUrl);
  }).finally(() => clearTimeout(revealSoundTimeout));
}

document.addEventListener('mycelium:loading-plan', (event) => {
  const detail = event.detail ?? {};
  const items = detail.items ?? (detail.urls ?? []).map((url, index) => ({ id: `legacy-${index}`, url }));
  heroPlan.register(items);
  replayCompletedHeroItems(items, detail.results ?? new Map(), (id, ok) => heroPlan.settle(id, ok));
  logLoadingDiagnostic('loading-plan', { itemCount: items.length, replayedCount: [...(detail.results?.keys?.() ?? [])].length });
});

document.addEventListener('mycelium:loading-item-end', (event) => {
  const { id, ok } = event.detail ?? {};
  if (id == null) return;
  heroPlan.settle(String(id), ok);
});

document.addEventListener('mycelium:loading-plan-timeout', () => {
  logLoadingDiagnostic('loading-plan-timeout');
  heroPlan.failPending();
});

document.addEventListener('mycelium:loading-plan-complete', () => {
  if (planComplete) return;
  planComplete = true;
  document.documentElement.dataset.heroPlanComplete = 'true';
  logLoadingDiagnostic('loading-plan-complete');
  manager.itemEnd('mycelium:loader-setup');
});

// Install all readiness and settlement handlers before starting decorative UI
// animation. A bad SVG/GSAP runtime must never abort loader initialization.
function showStaticLogoFallback(error) {
  console.warn('[loading-screen] Animated logo unavailable; showing the static mark.', error);
  const path = screen?.querySelector('.logo-path');
  if (!path) return;
  path.style.strokeDasharray = 'none';
  path.style.strokeDashoffset = '0';
  path.style.stroke = '#f4f1e7';
  path.style.fill = '#f4f1e7';
}

try {
  animateLogoDraw();
} catch (error) {
  showStaticLogoFallback(error);
}

// Prevent an unavailable image host from trapping the visitor behind the overlay.
window.setTimeout(() => {
  if (!planComplete) {
    document.dispatchEvent(new CustomEvent('mycelium:loading-plan-complete'));
  }
}, 20000);

document.dispatchEvent(new CustomEvent('mycelium:loading-manager-ready'));

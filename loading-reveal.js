// Loading screen -> hero reveal.
// When the page has finished loading (loading-manager.js adds .hidden to .loading-screen), the brand mark
// turns into a window onto the hero and the view dives into the biggest solid part of the mark until that
// window fills the screen. Everything is vector, so it stays sharp at any zoom.
//
// Safe by design: if anything is missing (reduced motion, no Path2D, no mark) this script does nothing and
// the original fade-out runs. It never blocks loading and always cleans up after itself.
(() => {
  const screen = document.querySelector(".loading-screen");
  const mark = screen?.querySelector(".loading-brand-mark");
  const markPath = mark?.querySelector("path");
  if (!screen || !mark || !markPath) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof Path2D === "undefined") return;
  const D = (markPath.getAttribute("d") || "").trim();
  if (!D) return;

  const BOX = 182;                          // viewBox size of the mark
  const FALLBACK = { x: 120, y: 118, r: 20 }; // measured offline for the current mark; used if measuring fails
  const DELAY_MS = 220;                     // lets the loading text fade first
  const DURATION_MS = 1500;
  const MAX_ZOOM = 700;                     // px per mark unit; the final fade covers anything beyond this
  let focus = null;
  let started = false;

  // Largest circle that fits inside the filled part of the mark (centre x/y and radius in mark units).
  // `isInside(x, y)` answers whether a point is filled; coarse 2-unit grid is plenty and takes ~10 ms.
  function measureFocus(isInside) {
    const step = 2;
    const n = Math.round(BOX / step);
    const filled = new Uint8Array((n + 1) * (n + 1));
    const outside = [];
    for (let j = 0; j <= n; j += 1) {
      for (let i = 0; i <= n; i += 1) {
        const inside = isInside(i * step, j * step);
        filled[j * (n + 1) + i] = inside ? 1 : 0;
        if (!inside) outside.push(i, j);
      }
    }
    let best = { d2: -1, i: 0, j: 0 };
    for (let j = 0; j <= n; j += 1) {
      for (let i = 0; i <= n; i += 1) {
        if (!filled[j * (n + 1) + i]) continue;
        let nearest = Infinity;
        for (let k = 0; k < outside.length; k += 2) {
          const dx = outside[k] - i;
          const dy = outside[k + 1] - j;
          const d2 = dx * dx + dy * dy;
          if (d2 < nearest) nearest = d2;
          if (nearest <= best.d2) break; // cannot beat the current best
        }
        if (nearest > best.d2) best = { d2: nearest, i, j };
      }
    }
    if (best.d2 < 0) return null;
    return { x: best.i * step, y: best.j * step, r: Math.max(0, Math.sqrt(best.d2) * step - step) };
  }

  function measureWithCanvas() {
    const context = document.createElement("canvas").getContext("2d");
    const path = new Path2D(D);
    return measureFocus((x, y) => context.isPointInPath(path, x, y));
  }

  const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 300));
  idle(() => { try { focus = measureWithCanvas(); } catch { focus = null; } });

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function reveal() {
    const box = mark.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!box.width || !box.height || !vw || !vh) return false;

    let g = focus;
    if (!g) { try { g = measureWithCanvas(); } catch { g = null; } }
    g = g && g.r >= 1 ? g : FALLBACK;

    // Where the mark sits on screen right now (it may be mid-animation, so measure, don't assume)
    const s0 = Math.min(box.width, box.height) / BOX;
    const left = box.left + (box.width - BOX * s0) / 2;
    const top = box.top + (box.height - BOX * s0) / 2;
    const from = { x: left + s0 * g.x, y: top + s0 * g.y };
    const to = { x: vw / 2, y: vh / 2 };
    const needed = Math.hypot(vw, vh) / 2 * 1.04;
    const zoom = Math.min(needed / Math.max(g.r, 1.5), MAX_ZOOM);

    const NS = "http://www.w3.org/2000/svg";
    const wrap = document.createElement("div");
    wrap.className = "loading-reveal";
    wrap.setAttribute("aria-hidden", "true");
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    svg.setAttribute("preserveAspectRatio", "none");
    const shape = document.createElementNS(NS, "path");
    // One path = big rectangle + the mark; even-odd turns the mark into a hole. The mark's own inner
    // shapes wind the opposite way, so even-odd and the original non-zero fill look identical.
    shape.setAttribute("fill-rule", "evenodd");
    shape.setAttribute("fill", getComputedStyle(screen).backgroundColor || "#21343e");
    shape.setAttribute("d", `M-12000 -12000H12000V12000H-12000Z ${D.replace(/^m/, "M")}`);
    const place = (s, px, py) => shape.setAttribute("transform", `matrix(${s} 0 0 ${s} ${px - s * g.x} ${py - s * g.y})`);
    place(s0, from.x, from.y); // starts exactly where the mark is, so nothing jumps
    svg.append(shape);
    wrap.append(svg);
    screen.prepend(wrap);
    screen.classList.add("is-revealing");

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      wrap.remove();
      screen.classList.add("is-revealed");
      screen.classList.remove("is-revealing");
      document.dispatchEvent(new CustomEvent("mycelium:loading-revealed"));
    };
    setTimeout(finish, DELAY_MS + DURATION_MS + 2500); // hard stop, whatever happens

    const startedAt = performance.now();
    const frame = (now) => {
      if (done) return;
      if (!screen.isConnected || document.hidden) { finish(); return; }
      const t = Math.min(1, Math.max(0, (now - startedAt - DELAY_MS) / DURATION_MS));
      const e = easeInOut(t);
      const s = s0 * Math.pow(zoom / s0, e);        // exponential zoom feels like a constant-speed dive
      const k = Math.min(1, e * 1.6);                // glide toward the centre a little ahead of the zoom
      place(s, from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k);
      wrap.style.opacity = t > 0.9 ? String(1 - (t - 0.9) / 0.1) : "";
      if (t < 1) requestAnimationFrame(frame);
      else finish();
    };
    requestAnimationFrame(frame);
    return true;
  }

  function begin() {
    if (started) return;
    started = true;
    if (document.hidden) return; // nothing to show; the normal fade is fine
    try { reveal(); } catch (error) { console.warn("[loading-reveal] skipped", error); }
  }

  if (screen.classList.contains("hidden")) return; // already dismissed before this script ran
  const observer = new MutationObserver(() => {
    if (!screen.classList.contains("hidden")) return;
    observer.disconnect();
    begin(); // runs in a microtask, before the browser paints the original fade
  });
  observer.observe(screen, { attributes: true, attributeFilter: ["class"] });
})();
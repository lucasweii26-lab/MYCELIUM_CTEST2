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

  const BOX = 182;                          // SVG viewBox is the square 0 0 182 182
  // Manual zoom anchor: 15 SVG units left and 15 down from square centre (91, 91).
  // Adjust ANCHOR_X / ANCHOR_Y here if you want to fine-tune the focal point.
  const ANCHOR_X = BOX / 2 - 6.5;             // 76: move centre left by 15 SVG units
  const ANCHOR_Y = BOX / 2 + 9;             // 106: move centre down by 15 SVG units
  const DELAY_MS = 220;                     // lets the loading text fade first
  const DURATION_MS = 650;
  const ENDING_LEAD_MS = 300;               // `mycelium:loading-reveal-ending` fires this long before the cover is gone
  const ZOOM_MULTIPLIER = 27;              // increase reveal reach; previous value was 1.35 (~6.5x larger)
  const MAX_ZOOM = 700;                     // safety cap in px per SVG unit
  const GREEN_SHIFT_START = 0;             // start changing colour at 50% reveal progress
  const LOADING_GREEN = "#132f26";          // MYCELIUM website deep green (style.css)
  let started = false;

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function reveal() {
    const box = mark.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const initialLoadingColor = getComputedStyle(screen).backgroundColor;
    if (!box.width || !box.height || !vw || !vh) return false;

    // The zoom anchor is manually offset from the square centre: 15 units left,
    // 15 units down. That exact source point stays fixed at the viewport centre
    // throughout the transition on every viewport size.
    const s0 = Math.min(box.width, box.height) / BOX;
    const left = box.left + (box.width - BOX * s0) / 2;
    const top = box.top + (box.height - BOX * s0) / 2;
    const from = { x: left + s0 * ANCHOR_X, y: top + s0 * ANCHOR_Y };
    const to = { x: vw / 2, y: vh / 2 };
    // Scale the logo silhouette past the viewport bounds around the adjusted anchor.
    const zoom = Math.min((Math.max(vw, vh) / BOX) * ZOOM_MULTIPLIER, MAX_ZOOM);

    const NS = "http://www.w3.org/2000/svg";
    const wrap = document.createElement("div");
    wrap.className = "loading-reveal";
    wrap.setAttribute("aria-hidden", "true");
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    svg.setAttribute("preserveAspectRatio", "none");

    // Use an actual SVG mask rather than an even-odd compound path. The latter
    // can invert extra islands/overlap regions in this complex multi-subpath logo.
    // White keeps the loading background; black cuts out only the logo's own
    // non-zero-filled silhouette, using the same fill rule as the source SVG.
    const defs = document.createElementNS(NS, "defs");
    const mask = document.createElementNS(NS, "mask");
    const maskId = `loading-logo-mask-${Math.random().toString(36).slice(2)}`;
    const patternId = `loading-logo-grid-${Math.random().toString(36).slice(2)}`;
    const clipId = `loading-logo-grid-clip-${Math.random().toString(36).slice(2)}`;
    mask.setAttribute("id", maskId);
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    mask.setAttribute("maskContentUnits", "userSpaceOnUse");
    mask.setAttribute("x", "-12000");
    mask.setAttribute("y", "-12000");
    mask.setAttribute("width", "24000");
    mask.setAttribute("height", "24000");
    const maskBg = document.createElementNS(NS, "rect");
    maskBg.setAttribute("x", "-12000");
    maskBg.setAttribute("y", "-12000");
    maskBg.setAttribute("width", "24000");
    maskBg.setAttribute("height", "24000");
    maskBg.setAttribute("fill", "white");
    const hole = document.createElementNS(NS, "path");
    hole.setAttribute("d", D);
    hole.setAttribute("fill", "black");
    hole.setAttribute("fill-rule", "nonzero");
    const place = (s, px, py) => hole.setAttribute("transform", `matrix(${s} 0 0 ${s} ${px - s * ANCHOR_X} ${py - s * ANCHOR_Y})`);
    place(s0, from.x, from.y); // starts aligned to the adjusted zoom anchor
    mask.append(maskBg, hole);

    // Subtle technical grid, clipped to the same moving logo silhouette.
    // Define every referenced SVG resource before painting the grid; missing
    // pattern/clip IDs would throw and cancel the entire reveal animation.
    const pattern = document.createElementNS(NS, "pattern");
    pattern.setAttribute("id", patternId);
    pattern.setAttribute("width", "34");
    pattern.setAttribute("height", "34");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    const gridPath = document.createElementNS(NS, "path");
    gridPath.setAttribute("d", "M 34 0 L 0 0 0 34");
    gridPath.setAttribute("fill", "none");
    gridPath.setAttribute("stroke", "#b9e4d0");
    gridPath.setAttribute("stroke-width", "0.7");
    pattern.append(gridPath);

    const clipPath = document.createElementNS(NS, "clipPath");
    clipPath.setAttribute("id", clipId);
    clipPath.setAttribute("clipPathUnits", "userSpaceOnUse");
    const clipShape = document.createElementNS(NS, "path");
    clipShape.setAttribute("d", D);
    clipShape.setAttribute("fill-rule", "nonzero");
    clipShape.setAttribute("transform", hole.getAttribute("transform"));
    clipPath.append(clipShape);
    defs.append(mask, pattern, clipPath);
    svg.append(defs);
    const shape = document.createElementNS(NS, "rect");
    shape.setAttribute("x", "0");
    shape.setAttribute("y", "0");
    shape.setAttribute("width", String(vw));
    shape.setAttribute("height", String(vh));
    shape.setAttribute("fill", initialLoadingColor && initialLoadingColor !== "rgba(0, 0, 0, 0)" ? initialLoadingColor : "#21343e");
    shape.setAttribute("mask", `url(#${maskId})`);
    // Critical: append the masked background rectangle to the SVG. Without this,
    // the mask and animated path exist in the DOM but nothing is painted, so the
    // logo-zoom reveal appears to vanish completely.
    svg.append(shape);
    const grid = document.createElementNS(NS, "rect");
    grid.setAttribute("x", "0");
    grid.setAttribute("y", "0");
    grid.setAttribute("width", String(vw));
    grid.setAttribute("height", String(vh));
    grid.setAttribute("fill", `url(#${patternId})`);
    grid.setAttribute("clip-path", `url(#${clipId})`);
    grid.setAttribute("opacity", "0.16");
    svg.append(grid);
    wrap.append(svg);
    screen.prepend(wrap);

    // Brief logo pulse at the moment the cut begins: 1 -> 1.05 -> 1, then fade.
    const logoElement = screen.querySelector(".loading-brand-mark-wrap");
    if (logoElement?.animate) {
      logoElement.animate([
        { transform: "scale(1)", opacity: 1, offset: 0 },
        { transform: "scale(1.05)", opacity: 1, offset: 0.35 },
        { transform: "scale(1)", opacity: 0.92, offset: 0.68 },
        { transform: "scale(1)", opacity: 0, offset: 1 }
      ], { duration: 430, easing: "cubic-bezier(0.22, 0.8, 0.25, 1)", fill: "forwards" });
    }
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
    // Tell the hero it can start its intro: 0.3 s before the loading cover is completely gone.
    setTimeout(() => document.dispatchEvent(new CustomEvent("mycelium:loading-reveal-ending")),
      Math.max(0, DELAY_MS + DURATION_MS - ENDING_LEAD_MS));

    const startedAt = performance.now();
    const parseColor = (value) => {
      const match = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (match) return [Number(match[1]), Number(match[2]), Number(match[3])];
      const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hex) {
        const raw = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
        return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
      }
      return [33, 52, 62];
    };
    const fromColor = parseColor(initialLoadingColor || "#21343e");
    const toColor = parseColor(LOADING_GREEN);
    const frame = (now) => {
      if (done) return;
      if (!screen.isConnected || document.hidden) { finish(); return; }
      const t = Math.min(1, Math.max(0, (now - startedAt - DELAY_MS) / DURATION_MS));
      const e = easeInOut(t);
      const s = s0 * Math.pow(zoom / s0, e);        // exponential zoom feels like a constant-speed dive
      const k = Math.min(1, e * 1.6);                // glide toward the centre a little ahead of the zoom
      const px = from.x + (to.x - from.x) * k;
      const py = from.y + (to.y - from.y) * k;
      place(s, px, py);
      clipShape.setAttribute("transform", `matrix(${s} 0 0 ${s} ${px - s * ANCHOR_X} ${py - s * ANCHOR_Y})`);
      // The grid follows the cut direction, then quietly disappears near the end.
      grid.setAttribute("opacity", String(0.16 * Math.max(0, 1 - Math.max(0, (t - 0.72) / 0.2))));
      // From 50% progress onward, smoothly transition the remaining loading layer to MYCELIUM green.
      const colorT = Math.max(0, Math.min(1, (t - GREEN_SHIFT_START) / (1 - GREEN_SHIFT_START)));
      const rgb = fromColor.map((start, i) => Math.round(start + (toColor[i] - start) * colorT));
      shape.setAttribute("fill", `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
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
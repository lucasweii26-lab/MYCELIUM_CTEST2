// Swipe / drag / horizontal-trackpad navigation for the Menu slider (Announcement … FAQ).
// It never moves slides itself: after a gesture it clicks the matching .menuItem, so app.js's existing
// logic (transform, active menu state, hero dots, the "mycelium:slidechange" fade-in via .is-current)
// runs exactly as it does for a normal click.
(() => {
  const slider = document.querySelector(".slider");
  const wrapper = document.querySelector(".sliderWrapper");
  const items = [...document.querySelectorAll(".menuItem")];
  if (!slider || !wrapper || items.length < 2) return;

  const bottomWrapper = document.querySelector(".bottomSliderWrapper");
  const wrappers = [wrapper, bottomWrapper].filter(Boolean);
  const INTERACTIVE = "button, a, input, textarea, select, label, [role='button']";
  const AXIS_LOCK_PX = 8;
  const DISTANCE_PX = 56;
  const FLICK_PX = 24;
  const FLICK_SPEED = 0.45; // px per ms

  const activeIndex = () => {
    const i = items.findIndex((item) => item.classList.contains("active"));
    return i < 0 ? 0 : i;
  };
  const go = (index) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    items[next].click();
  };
  const setTransform = (index, dx = 0) => {
    wrappers.forEach((el) => { el.style.transform = `translateX(calc(${-100 * index}vw + ${dx}px))`; });
  };
  const setDragging = (on) => {
    wrappers.forEach((el) => { el.style.transition = on ? "none" : ""; });
    slider.classList.toggle("is-dragging", on);
  };

  // Let the browser keep vertical scrolling; we only claim horizontal gestures.
  wrapper.style.touchAction = "pan-y";

  let start = null;
  let axis = ""; // "" | "x" | "y"
  let base = 0;

  slider.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    // A mouse press on a button/link must stay a click; touch swipes may start anywhere.
    if (event.pointerType === "mouse" && event.target.closest(INTERACTIVE)) return;
    start = { x: event.clientX, y: event.clientY, t: performance.now(), id: event.pointerId };
    axis = "";
    base = activeIndex();
  });

  slider.addEventListener("pointermove", (event) => {
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!axis) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (axis === "x") {
        setDragging(true);
        try { slider.setPointerCapture(event.pointerId); } catch { /* not capturable: ignore */ }
      }
    }
    if (axis !== "x") return;
    // Rubber-band resistance at the first and last slide
    const atEdge = (base === 0 && dx > 0) || (base === items.length - 1 && dx < 0);
    setTransform(base, atEdge ? dx * 0.3 : dx);
  });

  const finish = (event) => {
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const speed = Math.abs(dx) / Math.max(1, performance.now() - start.t);
    const wasDragging = axis === "x";
    start = null;
    axis = "";
    if (!wasDragging) return;
    setDragging(false);
    const commit = Math.abs(dx) > DISTANCE_PX || (Math.abs(dx) > FLICK_PX && speed > FLICK_SPEED);
    if (commit && event.type !== "pointercancel") go(base + (dx < 0 ? 1 : -1));
    else setTransform(base); // spring back
    // A drag must not also fire a click on whatever was under the pointer
    const swallow = (e) => { e.stopPropagation(); e.preventDefault(); };
    slider.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => slider.removeEventListener("click", swallow, { capture: true }), 0);
  };
  slider.addEventListener("pointerup", finish);
  slider.addEventListener("pointercancel", finish);

  // Two-finger horizontal trackpad swipe / shift+wheel on desktop
  let wheelLock = 0;
  slider.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.5 || Math.abs(event.deltaX) < 18) return;
    event.preventDefault(); // stops the browser's back/forward swipe while over the slider
    const now = performance.now();
    if (now < wheelLock) return;
    wheelLock = now + 750;
    go(activeIndex() + (event.deltaX > 0 ? 1 : -1));
  }, { passive: false });

  // Keyboard: left/right arrows when the focus is on the menu itself
  items.forEach((item, index) => {
    item.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const next = Math.max(0, Math.min(items.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)));
      if (next === index) return;
      event.preventDefault();
      items[next].focus();
      items[next].click();
    });
  });
})();
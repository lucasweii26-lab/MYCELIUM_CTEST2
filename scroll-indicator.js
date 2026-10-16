// Read-only scroll progress thumb for desktop pointer devices.
// It has no track and never captures pointer input; normal page scrolling stays native.
(() => {
  const fineDesktop = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!fineDesktop.matches || reducedMotion.matches) return;

  const thumb = document.createElement("div");
  thumb.className = "mycelium-scroll-thumb";
  thumb.setAttribute("aria-hidden", "true");
  thumb.setAttribute("role", "presentation");
  document.body.appendChild(thumb);
  document.documentElement.classList.add("has-mycelium-scroll-thumb");

  let raf = 0;
  let idleTimer = 0;
  let visible = false;

  function update() {
    raf = 0;
    const viewportHeight = window.innerHeight;
    const scrollable = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    if (!scrollable) {
      visible = false;
      thumb.classList.remove("is-visible");
      thumb.style.height = "0px";
      thumb.style.transform = "translate3d(0, 0, 0)";
      return;
    }
    const thumbHeight = Math.min(96, Math.max(42, viewportHeight * viewportHeight / document.documentElement.scrollHeight));
    const maxTop = Math.max(0, viewportHeight - thumbHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translate3d(0, ${Math.round(maxTop * progress)}px, 0)`;
  }

  function requestUpdate() {
    if (!raf) raf = requestAnimationFrame(update);
  }

  function onScroll() {
    if (!visible) {
      visible = true;
      thumb.classList.add("is-visible");
    }
    requestUpdate();
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      visible = false;
      thumb.classList.remove("is-visible");
    }, 1200);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  window.addEventListener("load", requestUpdate, { once: true });
  requestUpdate();

  function restoreNativeScrollbar() {
    window.clearTimeout(idleTimer);
    if (raf) cancelAnimationFrame(raf);
    document.documentElement.classList.remove("has-mycelium-scroll-thumb");
    thumb.remove();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", requestUpdate);
  }
  reducedMotion.addEventListener?.("change", (event) => { if (event.matches) restoreNativeScrollbar(); });
  fineDesktop.addEventListener?.("change", (event) => { if (!event.matches) restoreNativeScrollbar(); });
})();

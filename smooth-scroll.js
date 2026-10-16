// Smooth vertical page scroll with GSAP synchronization. If CDN scripts are unavailable,
// the website keeps native browser scrolling and its existing CSS/IntersectionObserver fallbacks.
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    window.MYCELIUM_GSAP = gsap;
    window.MYCELIUM_SCROLL_TRIGGER = ScrollTrigger;
  }
  if (reducedMotion || !window.Lenis || !gsap || !ScrollTrigger) return;

  const lenis = new window.Lenis({
    autoRaf: false,
    smoothWheel: true,
    duration: 0.9,                            // 总滑行时间，越小停得越干脆
    easing: (t) => 1 - Math.pow(1 - t, 2),    // easeOutQuad：线性降速，没有长尾
    wheelMultiplier: 1,
    anchors: false,
    allowNestedScroll: true,
  });
  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.MYCELIUM_LENIS = lenis;
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

  let refreshRaf = 0;
  const scheduleRefresh = () => {
    if (refreshRaf) return;
    refreshRaf = requestAnimationFrame(() => {
      refreshRaf = 0;
      ScrollTrigger.refresh();
    });
  };
  window.addEventListener("resize", scheduleRefresh, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", scheduleRefresh, { passive: true });
})();
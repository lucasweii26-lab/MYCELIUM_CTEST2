// One-time, staggered scene entrances for the main community page.
// Content remains visible if the browser lacks IntersectionObserver or motion is reduced.
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slides = [...document.querySelectorAll(".sliderItem, .sliderItem2, .sliderItem3, .sliderItem4, .sliderItem5, .sliderItem6")];
  const activateSlide = (index) => {
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle("is-current", active);
      const content = slide.querySelector(".announcementSlideContent, .sliderContent");
      content?.querySelectorAll(":scope > *").forEach((element, childIndex) => {
        element.style.setProperty("--slide-stagger", `${Math.min(childIndex * 75, 300)}ms`);
      });
    });
  };
  activateSlide(0);
  document.querySelectorAll(".menuItem").forEach((item, index) => {
    item.addEventListener("click", () => activateSlide(index));
  });
  window.addEventListener("mycelium:slidechange", (event) => activateSlide(event.detail?.index ?? 0));

  if (reducedMotion) return;

  const selectors = [
    ".features-intro",
    ".features > .feature",
    ".announcementHeader",
    ".announcementContent",
    ".map-modal-header",
    ".map-image-wrap",
    ".map-info-box",
    ".calendar-titlebar",
    ".calendar-month-bar",
    ".calendar-table",
    ".calendar-info-box",
    ".service-section-header",
    ".service-section-body",
    ".faq-section-header",
    ".faq-section-body",
    ".volunteerHeader",
    ".volunteerCard",
    ".report-form-card",
    ".footer-col",
    ".footer-bottom",
  ];
  const targets = document.querySelectorAll(selectors.join(","));

  const grouped = new Map();
  const observerTargets = [];
  const gsap = window.MYCELIUM_GSAP;
  const ScrollTrigger = window.MYCELIUM_SCROLL_TRIGGER;
  targets.forEach((element) => {
    const key = `${element.parentElement?.className || "root"}:${element.tagName}`;
        if (element.closest(".announcement-overlay, .map-overlay, .calendar-overlay, .service-section, .faq-section, .volunteer")) return;
    const index = grouped.get(key) || 0;
    grouped.set(key, index + 1);
    const delay = Math.min(index * 90, 360);
    if (gsap && ScrollTrigger && element.getClientRects().length) {
      gsap.fromTo(element,
        { autoAlpha: 0, y: 34, filter: "blur(7px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          delay: delay / 1000,
          ease: "power3.out",
          clearProps: "filter",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        },
      );
    } else if ("IntersectionObserver" in window) {
      element.classList.add("motion-reveal");
      element.style.setProperty("--motion-delay", `${delay}ms`);
      observerTargets.push(element);
    } else {
      element.classList.add("motion-reveal", "motion-reveal-visible");
    }
  });

  if (observerTargets.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("motion-reveal-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -7% 0px" });

    observerTargets.forEach((element) => observer.observe(element));
  }
})();
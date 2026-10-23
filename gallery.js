// Gallery: horizontal event timeline (newest -> oldest, left -> right) + news-style story layer.
// Classic script. Needs GSAP/ScrollTrigger globals from smooth-scroll.js (falls back to native scroll).
(() => {
  const section = document.getElementById("gallery");
  const list = document.getElementById("galleryList");
  const viewport = document.getElementById("galleryViewport");
  const article = document.getElementById("galleryArticle");
  if (!section || !list || !viewport || !article) return;

  const LOCALES = { en: "en-GB", ms: "ms-MY", ta: "ta-MY", "zh-CN": "zh-CN", es: "es-US" };
  const LABELS = {
    en: { kicker: "Gallery", title: "Moments worth remembering", sub: "Scroll to travel back in time — newest on the left.", close: "Close story", newer: "Newer", older: "Older", when: "When", where: "Where", host: "Organised by", people: "Joined by", photo: "Photo slot", by: "MYCELIUM Community Desk" },
    ms: { kicker: "Galeri", title: "Detik yang patut dikenang", sub: "Tatal untuk kembali ke masa lalu — terkini di sebelah kiri.", close: "Tutup", newer: "Lebih baharu", older: "Lebih lama", when: "Bila", where: "Di mana", host: "Dianjurkan oleh", people: "Penyertaan", photo: "Ruang foto", by: "Meja Komuniti MYCELIUM" },
    "zh-CN": { kicker: "图库", title: "值得铭记的时刻", sub: "向下滚动，回到过去 —— 最新的在左边。", close: "关闭", newer: "更新", older: "更早", when: "时间", where: "地点", host: "主办", people: "参与", photo: "照片位", by: "MYCELIUM 社区编辑部" },
  };

  // ---------- STARTER DATA ----------
  // Starter events live in gallery-seed.js (shared with the admin "Import starter events" button).
  // They are shown only while Firestore has no published gallery events for this region.
  // Dates/text in the starter pack are placeholders: edit them in Admin -> Gallery.
  let seedFor = () => [];
  let events = [];

  // ---------- helpers ----------
  const lang = () => (typeof currentLang === "string" && currentLang) || document.documentElement.lang || "en";
  const L = () => LABELS[lang()] || LABELS.en;
  const pick = (o, f) => o[`${f}_${lang()}`] || o[`${f}_en`] || o[f] || "";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (iso, opts) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(+d) ? String(iso) : d.toLocaleDateString(LOCALES[lang()] || "en-GB", opts);
  };
  const sortDesc = (rows) => [...rows].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const photo = (src, alt) => src
    ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`
    : `<span class="photo-slot"><span>${esc(L().photo)}</span></span>`;

  // ---------- labels + timeline ----------
  function applyLabels() {
    const l = L();
    section.querySelectorAll("[data-g]").forEach((el) => { el.textContent = l[el.dataset.g] || el.textContent; });
  }

  function renderTimeline() {
    list.innerHTML = events.map((ev) => {
      const label = pick(ev, "short") || pick(ev, "title");
      return `<li class="gallery-item">
        <a class="gallery-card" href="#gallery/${encodeURIComponent(ev.slug)}" data-slug="${esc(ev.slug)}">
          <span class="gallery-photo">${photo(ev.cover, label)}</span>
          <span class="gallery-node" aria-hidden="true"><i class="gallery-dot"></i></span>
          <time class="gallery-date" datetime="${esc(ev.date)}">${esc(fmt(ev.date, { day: "numeric", month: "short", year: "numeric" }))}</time>
          <span class="gallery-name">${esc(label)}</span>
        </a>
      </li>`;
    }).join("");
  }

  // ---------- horizontal scroll (pin + scrub), native fallback ----------
  let tween = null;
  function setupScroll() {
    if (tween) { tween.scrollTrigger?.kill(true); tween.kill(); tween = null; }
    section.classList.remove("is-native");
    const gsap = window.MYCELIUM_GSAP;
    const ST = window.MYCELIUM_SCROLL_TRIGGER;
    const wide = window.matchMedia("(min-width: 900px)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!gsap || !ST || !wide || calm) {
      gsap?.set(list, { clearProps: "transform" });
      section.classList.add("is-native");
      return;
    }
    const dist = () => Math.max(0, list.offsetWidth - viewport.clientWidth);
    const bar = section.querySelector(".gallery-progress i");
    tween = gsap.to(list, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress})`; },
      },
    });
  }

  // ---------- drag + trackpad on the pinned timeline (desktop / large tablets) ----------
  // While pinned, the timeline is driven by page scroll (1px of scroll = 1px sideways), so a sideways
  // drag simply scrolls the page by the opposite amount. Below 900px the strip is native
  // overflow-x with snap, which already swipes on its own.
  const scrollPage = (delta) => {
    const lenis = window.MYCELIUM_LENIS;
    if (lenis) lenis.scrollTo(lenis.scroll + delta, { immediate: true, force: true });
    else window.scrollBy(0, delta);
  };
  let drag = null;
  viewport.style.touchAction = "pan-y"; // vertical page scroll stays native on touch screens
  viewport.addEventListener("dragstart", (event) => event.preventDefault()); // no ghost image when dragging a card
  viewport.addEventListener("pointerdown", (event) => {
    if (!tween) return; // native mode: let the browser scroll
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag = { id: event.pointerId, last: event.clientX, moved: 0, captured: false };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.last;
    drag.last = event.clientX;
    drag.moved += Math.abs(dx);
    if (!drag.captured && drag.moved > 6) {
      drag.captured = true;
      try { viewport.setPointerCapture(event.pointerId); } catch { /* ignore */ }
      viewport.classList.add("is-dragging");
    }
    if (drag.captured) scrollPage(-dx);
  });
  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const wasDrag = drag.captured;
    drag = null;
    viewport.classList.remove("is-dragging");
    if (!wasDrag) return;
    const swallow = (e) => { e.preventDefault(); e.stopPropagation(); }; // a drag must not open a story
    viewport.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => viewport.removeEventListener("click", swallow, { capture: true }), 0);
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  // Two-finger sideways swipe on a trackpad moves the timeline too
  viewport.addEventListener("wheel", (event) => {
    if (!tween || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    scrollPage(event.deltaX);
  }, { passive: false });

  // The six expandable sections now sit ABOVE the gallery. When they open/close or finish loading
  // their content, the page height changes, so the pin has to be recalculated.
  let refreshTimer = 0;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => window.MYCELIUM_SCROLL_TRIGGER?.refresh(), 250);
  };
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(scheduleRefresh);
    ["announcementOverlay", "mapOverlay", "calendarOverlay", "serviceSection", "faqSection", "volunteer"]
      .map((id) => document.getElementById(id)).filter(Boolean).forEach((el) => ro.observe(el));
  }

  // ---------- story layer ----------
  let lastFocus = null;
  const lockPage = (on) => {
    document.documentElement.classList.toggle("ga-lock", on);
    if (on) window.MYCELIUM_LENIS?.stop(); else window.MYCELIUM_LENIS?.start();
  };

function renderArticle(i) {
    const ev = events[i];
    const l = L();
    const newer = events[i - 1];
    const older = events[i + 1];
    const title = pick(ev, "title");
    const body = pick(ev, "body");
    const paras = Array.isArray(body) ? body : [body];
    const quote = pick(ev, "quote");
    const quoteBy = pick(ev, "quoteBy");
    const caption = pick(ev, "caption");
    
    // 正文内部插图（如果 photos 数组有内容，则渲染；否则不显示多余空框）
    const figs = Array.isArray(ev.photos) ? ev.photos.filter(Boolean) : [];
    const figsHtml = figs.length > 0 ? `<div class="ga-figs">
      ${figs.slice(0, 2).map((figSrc) => `<figure><span class="ga-photo">${photo(figSrc, title)}</span></figure>`).join("")}
    </div>` : "";

    const quoteHtml = quote
      ? `<blockquote class="ga-quote"><p>${esc(quote)}</p>${quoteBy ? `<cite>${esc(quoteBy)}</cite>` : ""}</blockquote>` : "";

    const parts = [];
    paras.forEach((p, idx) => {
      parts.push(`<p>${esc(p)}</p>`);
      // 在第 1 段或第 2 段之间自然插入配图与名言
      if (idx === 1) {
        if (figsHtml) parts.push(figsHtml);
        if (quoteHtml) parts.push(quoteHtml);
      }
    });
    if (paras.length < 2) {
      if (figsHtml) parts.push(figsHtml);
      if (quoteHtml) parts.push(quoteHtml);
    }

    const fact = (k, v) => (v ? `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>` : "");
    const pager = (ev2, cls, label) => ev2
      ? `<a class="${cls}" href="#gallery/${encodeURIComponent(ev2.slug)}"><small>${esc(label)}</small><span>${esc(pick(ev2, "short") || pick(ev2, "title"))}</span></a>`
      : "";

    article.innerHTML = `<div class="ga-wrap">
      <button class="ga-close" type="button" aria-label="${esc(l.close)}">&times;</button>
      <header class="ga-head">
        <p class="ga-kicker">${esc(pick(ev, "tag"))} · ${esc(fmt(ev.date, { day: "numeric", month: "long", year: "numeric" }))}</p>
        <h1 class="ga-title">${esc(title)}</h1>
        <p class="ga-lede">${esc(pick(ev, "lede"))}</p>
        <p class="ga-byline">${esc(l.by)}</p>
      </header>
      <figure class="ga-hero">
        <span class="ga-photo">${photo(ev.cover, title)}</span>
        ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}
      </figure>
      <div class="ga-body">
        <dl class="ga-facts">
          ${fact(l.when, fmt(ev.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}
          ${fact(l.where, pick(ev, "place"))}
          ${fact(l.host, pick(ev, "host"))}
          ${fact(l.people, ev.people)}
        </dl>
        <div class="ga-text">${parts.join("")}</div>
      </div>
      <nav class="ga-pager" aria-label="Stories">
        ${pager(newer, "is-newer", l.newer)}${pager(older, "is-older", l.older)}
      </nav>
    </div>`;
  }
  function openArticle(slug) {
    const i = events.findIndex((e) => e.slug === slug);
    if (i < 0) { closeArticle(); return; }
    const wasOpen = article.classList.contains("is-open");
    if (!wasOpen) lastFocus = document.activeElement;
    renderArticle(i);
    article.scrollTop = 0;
    article.classList.add("is-open");
    article.setAttribute("aria-hidden", "false");
    lockPage(true);
    article.querySelector(".ga-close")?.focus({ preventScroll: true });
  }

  function closeArticle() {
    if (!article.classList.contains("is-open")) return;
    article.classList.remove("is-open");
    article.setAttribute("aria-hidden", "true");
    lockPage(false);
    lastFocus?.focus?.({ preventScroll: true });
    lastFocus = null;
  }

  function requestClose() {
    if (/^#gallery\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    closeArticle();
  }

  function route() {
    const m = location.hash.match(/^#gallery\/(.+)$/);
    if (m) openArticle(decodeURIComponent(m[1])); else closeArticle();
  }

  article.addEventListener("click", (e) => { if (e.target.closest(".ga-close")) requestClose(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && article.classList.contains("is-open")) requestClose(); });
  window.addEventListener("hashchange", route);

  // ---------- data: Firestore (optional) ----------
  // Collection: gallery_events (MY) or locations/{CC}/gallery_events (other countries) — same pattern as events/faqs.
  async function loadRemote() {
    try {
      const db = window.db;
      if (!db) return null;
      const cc = window.MYCELIUM_COUNTRY || "MY";
      const col = cc === "MY"
        ? db.collection("gallery_events")
        : db.collection("locations").doc(cc).collection("gallery_events");
      const snap = await col.get();
      const rows = snap.docs.map((d) => ({ slug: d.id, ...d.data() })).filter((r) => r.date && r.isPublished !== false);
      return rows.length ? rows : null;
    } catch (err) {
      console.warn("[gallery] Firestore unavailable, using starter data.", err);
      return null;
    }
  }

  async function refreshData() {
    const rows = await loadRemote();
    events = sortDesc(rows || seedFor(window.MYCELIUM_COUNTRY || "MY"));
    renderTimeline();
    window.MYCELIUM_SCROLL_TRIGGER?.refresh();
    route();
  }

  async function init() {
    try {
      // Dynamic import() works from a classic script; path is relative to this file.
      seedFor = (await import("./gallery-seed.js")).getGallerySeed;
    } catch (err) {
      console.warn("[gallery] Starter data module not found.", err);
    }
    events = sortDesc(seedFor(window.MYCELIUM_COUNTRY || "MY"));
    applyLabels();
    renderTimeline();
    setupScroll();
    route();
    refreshData();

    window.matchMedia("(min-width: 900px)").addEventListener("change", setupScroll);
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", setupScroll);
    window.addEventListener("mycelium:languagechange", () => {
      applyLabels();
      renderTimeline();
      if (article.classList.contains("is-open")) route();
      scheduleRefresh();
    });
    window.addEventListener("mycelium:countrychange", refreshData);
  }

  // Run after app.js's DOMContentLoaded handler so window.db and MYCELIUM_COUNTRY exist.
  if (document.readyState === "complete") init();
  else document.addEventListener("DOMContentLoaded", init, { once: true });
})();
// Gallery: Siena-style vertical full-screen filmstrip
(() => {
  const section = document.getElementById("gallery");
  const enterBtn = document.getElementById("galleryEnter");
  const immersive = document.getElementById("galleryImmersive");
  const viewport = document.getElementById("galleryViewport");
  const list = document.getElementById("galleryList");
  const article = document.getElementById("galleryArticle");
  const backBtn = document.getElementById("galleryBack");
  const hint = document.getElementById("galleryHint");
  const ticketTitle = document.getElementById("giTicketTitle");
  const ticketMeta = document.getElementById("giTicketMeta");

  if (!section || !immersive || !viewport || !list || !article) {
    console.warn("[gallery] missing DOM nodes");
    return;
  }

  const LOCALES = { en: "en-GB", ms: "ms-MY", ta: "ta-MY", "zh-CN": "zh-CN", es: "es-US" };
  const LABELS = {
    en: {
      kicker: "Gallery", title: "Moments worth remembering",
      sub: "A filmstrip of community moments — scroll through every frame.",
      enter: "Enter Gallery", close: "Close story",
      newer: "Newer", older: "Older", when: "When", where: "Where",
      host: "Organised by", people: "Joined by", photo: "Photo slot",
      by: "MYCELIUM Community Desk", explore: "Explore", back: "Back"
    },
    ms: {
      kicker: "Galeri", title: "Detik yang patut dikenang",
      sub: "Jalur filem detikan komuniti — tatal setiap bingkai.",
      enter: "Masuk Galeri", close: "Tutup",
      newer: "Lebih baharu", older: "Lebih lama", when: "Bila", where: "Di mana",
      host: "Dianjurkan oleh", people: "Penyertaan", photo: "Ruang foto",
      by: "Meja Komuniti MYCELIUM", explore: "Terokai", back: "Kembali"
    },
    "zh-CN": {
      kicker: "图库", title: "值得铭记的时刻",
      sub: "社区时刻的胶片条 —— 上下滚动浏览每一帧。",
      enter: "进入图库", close: "关闭",
      newer: "更新", older: "更早", when: "时间", where: "地点",
      host: "主办", people: "参与", photo: "照片位",
      by: "MYCELIUM 社区编辑部", explore: "探索", back: "返回"
    },
  };

  let seedFor = () => [];
  let events = [];
  let activeIndex = 0;

  const lang = () => (typeof currentLang === "string" && currentLang) || document.documentElement.lang || "en";
  const L = () => LABELS[lang()] || LABELS.en;
  const pick = (o, f) => o[`${f}_${lang()}`] || o[`${f}_en`] || o[f] || "";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (iso, opts) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(+d) ? String(iso) : d.toLocaleDateString(LOCALES[lang()] || "en-GB", opts);
  };
  const sortDesc = (rows) => [...rows].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const photo = (src, alt, focus) => {
    if (!src) return `<span class="photo-slot"><span>${esc(L().photo)}</span></span>`;
    const pos = focus ? ` style="object-position:${esc(focus)}"` : "";
    return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" draggable="false"${pos}>`;
  };

  function applyLabels() {
    const l = L();
    section.querySelectorAll("[data-g]").forEach((el) => {
      if (el.children.length === 0) el.textContent = l[el.dataset.g] || el.textContent;
      else {
        const span = el.querySelector(`[data-g="${el.dataset.g}"]`);
        if (span && span.children.length === 0) span.textContent = l[el.dataset.g] || span.textContent;
      }
    });
  }

  function renderImmersive() {
    if (!events.length) {
      list.innerHTML = `<li class="gi-item"><article class="gi-card"><div class="gi-frame"><div class="gi-meta"><h2 class="gi-title">No moments yet</h2></div></div></article></li>`;
      return;
    }
    list.innerHTML = events.map((ev, i) => {
      const label = pick(ev, "short") || pick(ev, "title");
      const tag = pick(ev, "tag") || "";
      return `<li class="gi-item" data-index="${i}">
        <article class="gi-card" data-slug="${esc(ev.slug)}">
          <div class="gi-frame">
            <span class="gi-photo">${photo(ev.cover, label, ev.focus)}</span>
            <div class="gi-shade"></div>
            <div class="gi-meta">
              <p class="gi-tag gi-text">${esc(tag)}</p>
              <h2 class="gi-title gi-text">${esc(label)}</h2>
              <dl class="gi-facts-inline gi-text">
                <div><dt>DATE</dt><dd>${esc(fmt(ev.date, { day: "numeric", month: "short", year: "numeric" }))}</dd></div>
                ${pick(ev, "place") ? `<div><dt>PLACE</dt><dd>${esc(pick(ev, "place"))}</dd></div>` : ""}
              </dl>
            </div>
            <button type="button" class="gi-explore gi-text" data-slug="${esc(ev.slug)}">${esc(L().explore)} →</button>
          </div>
        </article>
      </li>`;
    }).join("");
  }

  // ---- motion ----
  // itemH = center-to-center step (px)
  // card is ~72% of viewport tall → large like Siena; step slightly larger for thin gap
  let y = 0;
  let targetY = 0;
  let velocity = 0;
  let isDragging = false;
  let lastPointerY = 0;
  let lastTime = performance.now();
  let itemH = 0;
  let cardH = 0;
  let rafId = 0;
  let isOpen = false;
  let prefersReduced = false;
  let hintTimer = 0;
  let scrollDir = 1;
  let snapping = false;
  let pendingOpenSlug = null;
  // spring state for snap (overshoot + settle)
  let springV = 0;

  // drag resistance: mouse must travel more to move the strip the same amount
  const DRAG_SCALE = 0.55;
  // wheel: one notch moves a fraction of a slide (need ~2–3 notches or a long drag)
  const WHEEL_SCALE = 0.22;

  function measure() {
    const items = list.querySelectorAll(".gi-item");
    if (!items.length) { itemH = 0; return; }

    const vh = window.innerHeight;
    // larger card (~78vh), tighter gap (~6vh) between card edges
    cardH = Math.round(Math.min(vh * 0.78, vh - 80));
    itemH = Math.round(cardH + vh * 0.06);

    items.forEach((item) => {
      item.style.height = itemH + "px";
      item.style.minHeight = itemH + "px";
      item.style.maxHeight = itemH + "px";
      item.style.boxSizing = "border-box";
      item.style.margin = "0";
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.justifyContent = "center";
      const card = item.querySelector(".gi-card");
      if (card) {
        // wider: less black left/right (~ half the previous side margin)
        card.style.width = "min(1280px, 96vw)";
        card.style.maxHeight = cardH + "px";
      }
      const frame = item.querySelector(".gi-frame");
      if (frame) {
        frame.style.maxHeight = cardH + "px";
        frame.style.height = cardH + "px";
        frame.style.width = "100%";
        frame.style.aspectRatio = "auto";
      }
    });

    // pad so first/last card centers in the viewport
    const pad = Math.round((vh - itemH) / 2 + (itemH - cardH) / 2);
    list.style.paddingTop = Math.max(0, pad) + "px";
    list.style.paddingBottom = Math.max(0, pad) + "px";
  }

  function maxIndex() {
    return Math.max(0, events.length - 1);
  }
  function clampIndex(i) {
    return Math.max(0, Math.min(maxIndex(), i));
  }
  function yForIndex(i) {
    return -clampIndex(i) * itemH;
  }
  function nearestIndex() {
    if (!itemH) return 0;
    return clampIndex(Math.round(-y / itemH));
  }

  function updateTicket() {
    const i = nearestIndex();
    activeIndex = i;
    const ev = events[i];
    if (!ev) {
      if (ticketTitle) ticketTitle.textContent = "";
      if (ticketMeta) ticketMeta.textContent = "";
      return;
    }
    if (ticketTitle) ticketTitle.textContent = pick(ev, "short") || pick(ev, "title");
    if (ticketMeta) {
      const tag = pick(ev, "tag") || "";
      ticketMeta.textContent = [tag, fmt(ev.date, { year: "numeric" })].filter(Boolean).join(" · ");
    }
  }

  function applyVisuals() {
    const items = list.querySelectorAll(".gi-item");
    if (!items.length) return;
    const vpRect = viewport.getBoundingClientRect();
    const centerY = vpRect.top + vpRect.height / 2;
    const half = vpRect.height * 0.5;
    const speed = Math.min(1, Math.abs(velocity) / 18);

    items.forEach((item) => {
      const r = item.getBoundingClientRect();
      const itemCenter = r.top + r.height / 2;
      const signed = (itemCenter - centerY) / half; // -1 above, +1 below
      const dist = Math.abs(signed);
      const t = Math.min(1, dist);

      // gentle scale / fade — Siena keeps neighbors almost full size, just cropped by viewport
      const scale = 1 - t * 0.04;
      const opacity = 1 - t * 0.22;
      const blur = t * 1.1 + speed * 2.8;
      const sat = 1 - (t * 0.12 + speed * 0.22);

      const card = item.querySelector(".gi-card");
      if (card) {
        card.style.transform = `scale(${scale.toFixed(4)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = `blur(${blur.toFixed(2)}px) saturate(${sat.toFixed(2)})`;
      }

      // image parallax inside frame (Siena: photo lags the frame)
      const img = item.querySelector(".gi-photo img");
      if (img) {
        const parallax = signed * -14; // %
        img.style.transform = `translate3d(0, ${parallax.toFixed(2)}%, 0) scale(1.22)`;
      }

      // text motion — rises when approaching from below, sinks when from above
      const texts = item.querySelectorAll(".gi-text");
      texts.forEach((el, ti) => {
        const delay = ti * 6;
        const yShift = signed * (36 + delay);
        const textOp = Math.max(0, 1 - t * 1.4);
        el.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0)`;
        el.style.opacity = textOp.toFixed(3);
      });
    });
  }

  function tick(now) {
    const dt = Math.min(32, now - lastTime);
    lastTime = now;

    if (!isDragging) {
      if (snapping || Math.abs(velocity) < 0.25) {
        // spring toward targetY — slower + slight overshoot feel
        const dy = targetY - y;
        // critically-damped-ish spring
        const stiffness = 0.045;
        const damping = 0.78;
        springV = (springV + dy * stiffness) * damping;
        y += springV;
        velocity = springV;
        if (Math.abs(dy) < 0.5 && Math.abs(springV) < 0.5) {
          y = targetY;
          velocity = 0;
          springV = 0;
          snapping = false;
          if (pendingOpenSlug) {
            const slug = pendingOpenSlug;
            pendingOpenSlug = null;
            openArticleFromGallery(slug);
          }
        }
      } else {
        // free momentum then settle into snap
        velocity *= 0.92;
        y += velocity * (dt / 16);
        if (Math.abs(velocity) < 0.55) {
          targetY = yForIndex(nearestIndex());
          springV = velocity;
          snapping = true;
        }
      }
    }

    if (itemH && events.length) {
      const min = yForIndex(maxIndex());
      if (y > 24) { y = 24; velocity = 0; springV = 0; } // soft rubber-band top
      if (y < min - 24) { y = min - 24; velocity = 0; springV = 0; }
      // pull back if past soft bounds
      if (!isDragging && y > 0) { targetY = 0; snapping = true; }
      if (!isDragging && y < min) { targetY = min; snapping = true; }
    }

    list.style.transform = `translate3d(0, ${y}px, 0)`;
    applyVisuals();
    updateTicket();
    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function goToIndex(i, openSlugAfter) {
    const idx = clampIndex(i);
    const prev = activeIndex;
    scrollDir = idx > prev ? 1 : idx < prev ? -1 : scrollDir;
    activeIndex = idx;
    targetY = yForIndex(idx);
    snapping = true;
    // seed spring with a bit of velocity for rebound feel
    springV = (targetY - y) * 0.08;
    velocity = springV;
    if (openSlugAfter) pendingOpenSlug = openSlugAfter;
  }

  let pointerMoved = 0;
  let pointerStartY = 0;
  const CLICK_THRESH = 10; // px — below this counts as click, not drag

  function onPointerDown(e) {
    if (prefersReduced || !isOpen) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("button.gi-back")) return;
    // don't start drag on explore button — let click open article
    if (e.target.closest("button.gi-explore")) return;
    isDragging = true;
    pointerMoved = 0;
    pointerStartY = e.clientY;
    snapping = false;
    springV = 0;
    lastPointerY = e.clientY;
    velocity = 0;
    viewport.classList.add("is-dragging");
    try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* */ }
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dy = e.clientY - lastPointerY;
    lastPointerY = e.clientY;
    pointerMoved += Math.abs(dy);
    // resistance: need longer drag to move same distance
    const moved = dy * DRAG_SCALE;
    y += moved;
    velocity = moved;
    if (moved < -0.4) scrollDir = 1;
    if (moved > 0.4) scrollDir = -1;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove("is-dragging");
    try { viewport.releasePointerCapture(e.pointerId); } catch (err) { /* */ }

    // pure click (almost no movement) → open article on that card
    if (pointerMoved < CLICK_THRESH) {
      const card = e.target && e.target.closest ? e.target.closest(".gi-card") : null;
      if (card) {
        const slug = card.getAttribute("data-slug");
        const item = card.closest(".gi-item");
        const idx = item ? Number(item.getAttribute("data-index")) : -1;
        if (slug && idx >= 0) {
          // restore position (tiny jitter from micro-moves)
          y = yForIndex(nearestIndex());
          velocity = 0;
          springV = 0;
          if (idx === nearestIndex() || Math.abs(y - yForIndex(idx)) < itemH * 0.25) {
            openArticleFromGallery(slug);
          } else {
            goToIndex(idx, slug);
          }
          return;
        }
      }
    }

    targetY = yForIndex(nearestIndex());
    springV = velocity;
    snapping = true;
  }

  function onWheel(e) {
    if (prefersReduced || !isOpen) return;
    e.preventDefault();
    // accumulate wheel — need longer scroll to change slide
    const delta = e.deltaY * WHEEL_SCALE;
    if (snapping && Math.abs(targetY - y) > itemH * 0.35) {
      // allow interrupting a snap if user scrolls hard
      snapping = false;
    }
    y -= delta;
    velocity = -delta;
    if (delta > 0.3) scrollDir = 1;
    if (delta < -0.3) scrollDir = -1;
    // don't instantly snap; let momentum settle in tick()
    if (Math.abs(velocity) > 0.3) snapping = false;
  }

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", onPointerUp);
  viewport.addEventListener("pointercancel", onPointerUp);
  viewport.addEventListener("wheel", onWheel, { passive: false });
  viewport.addEventListener("dragstart", (e) => e.preventDefault());

  function openArticleFromGallery(slug) {
    if (!slug) return;
    // set hash for shareable URL; always open even if hash unchanged
    const next = `#gallery/${encodeURIComponent(slug)}`;
    if (location.hash === next) {
      openArticle(slug);
    } else {
      location.hash = next; // hashchange → route → openArticle
    }
  }

  list.addEventListener("click", (e) => {
    const card = e.target.closest(".gi-card");
    if (!card) return;
    const slug = card.getAttribute("data-slug");
    if (!slug) return;
    const item = card.closest(".gi-item");
    const idx = item ? Number(item.getAttribute("data-index")) : -1;
    if (idx < 0) return;
    e.preventDefault();
    e.stopPropagation();
    // if pointer handler already opened / queued, skip double-fire
    if (pointerMoved >= CLICK_THRESH) return;
    if (idx === nearestIndex() || Math.abs(y - yForIndex(idx)) < itemH * 0.25) {
      openArticleFromGallery(slug);
    } else {
      goToIndex(idx, slug);
    }
  });

  function onMouseMove(e) {
    if (!isOpen || !hint) return;
    const ring = hint.querySelector(".gi-hint-ring");
    if (!ring) return;
    ring.style.left = e.clientX + "px";
    ring.style.top = e.clientY + "px";
  }
  window.addEventListener("mousemove", onMouseMove);

  function openImmersive() {
    try {
      if (isOpen) return;
      isOpen = true;
      prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      immersive.classList.add("is-open");
      immersive.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("gi-lock");
      if (window.MYCELIUM_LENIS) window.MYCELIUM_LENIS.stop();

      renderImmersive();
      requestAnimationFrame(() => {
        measure();
        y = yForIndex(activeIndex);
        targetY = y;
        springV = 0;
        list.style.transform = `translate3d(0, ${y}px, 0)`;
        if (!prefersReduced) startLoop();
        else applyVisuals();
        updateTicket();
      });

      if (hint) {
        hint.classList.add("is-visible");
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => hint.classList.remove("is-visible"), 2800);
      }
    } catch (err) {
      console.error("[gallery] openImmersive failed", err);
    }
  }

  function closeImmersive() {
    if (!isOpen) return;
    isOpen = false;
    immersive.classList.remove("is-open");
    immersive.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("gi-lock");
    if (!article.classList.contains("is-open") && window.MYCELIUM_LENIS) {
      window.MYCELIUM_LENIS.start();
    }
    stopLoop();
  }

  function onEnterClick(e) {
    e.preventDefault();
    e.stopPropagation();
    openImmersive();
  }
  if (enterBtn) enterBtn.addEventListener("click", onEnterClick);
  section.addEventListener("click", (e) => {
    if (e.target.closest("#galleryEnter")) onEnterClick(e);
  });

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (article.classList.contains("is-open")) requestClose();
      else closeImmersive();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") {
      if (article.classList.contains("is-open")) requestClose();
      else closeImmersive();
      return;
    }
    if (article.classList.contains("is-open")) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") {
      e.preventDefault();
      goToIndex(nearestIndex() + 1);
    }
    if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
      e.preventDefault();
      goToIndex(nearestIndex() - 1);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const ev = events[nearestIndex()];
      if (ev) location.hash = `#gallery/${encodeURIComponent(ev.slug)}`;
    }
  });

  window.addEventListener("resize", () => {
    if (!isOpen) return;
    const idx = nearestIndex();
    measure();
    y = yForIndex(idx);
    targetY = y;
    springV = 0;
    list.style.transform = `translate3d(0, ${y}px, 0)`;
  });

  // ---- story layer ----
  let lastFocus = null;
  const lockPage = (on) => {
    document.documentElement.classList.toggle("ga-lock", on);
    if (on) {
      if (window.MYCELIUM_LENIS) window.MYCELIUM_LENIS.stop();
    } else if (!isOpen && window.MYCELIUM_LENIS) {
      window.MYCELIUM_LENIS.start();
    }
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

    const figs = Array.isArray(ev.photos) ? ev.photos.filter(Boolean) : [];
    const figsHtml = figs.length > 0 ? `<div class="ga-figs">
      ${figs.slice(0, 2).map((figSrc) => `<figure><span class="ga-photo">${photo(figSrc, title)}</span></figure>`).join("")}
    </div>` : "";

    const quoteHtml = quote
      ? `<blockquote class="ga-quote"><p>${esc(quote)}</p>${quoteBy ? `<cite>${esc(quoteBy)}</cite>` : ""}</blockquote>` : "";

    const parts = [];
    paras.forEach((p, idx) => {
      parts.push(`<p>${esc(p)}</p>`);
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
        <span class="ga-photo">${photo(ev.cover, title, ev.focus)}</span>
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
    if (!isOpen) openImmersive();
    const wasOpen = article.classList.contains("is-open");
    if (!wasOpen) lastFocus = document.activeElement;
    activeIndex = i;
    y = yForIndex(i);
    targetY = y;
    springV = 0;
    renderArticle(i);
    article.scrollTop = 0;
    article.classList.add("is-open");
    article.setAttribute("aria-hidden", "false");
    lockPage(true);
    const closeEl = article.querySelector(".ga-close");
    if (closeEl) closeEl.focus({ preventScroll: true });
  }

  function closeArticle() {
    if (!article.classList.contains("is-open")) return;
    article.classList.remove("is-open");
    article.setAttribute("aria-hidden", "true");
    lockPage(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }

  function requestClose() {
    if (/^#gallery\//.test(location.hash)) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    closeArticle();
  }

  function route() {
    const m = location.hash.match(/^#gallery\/(.+)$/);
    if (m) openArticle(decodeURIComponent(m[1]));
    else closeArticle();
  }

  article.addEventListener("click", (e) => {
    if (e.target.closest(".ga-close")) requestClose();
  });
  window.addEventListener("hashchange", route);

  async function loadRemote() {
    try {
      const db = window.db;
      if (!db) return null;
      const cc = window.MYCELIUM_COUNTRY || "MY";
      const col = cc === "MY"
        ? db.collection("gallery_events")
        : db.collection("locations").doc(cc).collection("gallery_events");
      const snap = await col.get();
      const rows = snap.docs.map((d) => Object.assign({ slug: d.id }, d.data()))
        .filter((r) => r.date && r.isPublished !== false);
      return rows.length ? rows : null;
    } catch (err) {
      console.warn("[gallery] Firestore unavailable, using starter data.", err);
      return null;
    }
  }

  async function refreshData() {
    const rows = await loadRemote();
    events = sortDesc(rows || seedFor(window.MYCELIUM_COUNTRY || "MY"));
    applyLabels();
    if (isOpen) {
      renderImmersive();
      requestAnimationFrame(() => {
        measure();
        y = yForIndex(Math.min(activeIndex, maxIndex()));
        targetY = y;
        springV = 0;
        list.style.transform = `translate3d(0, ${y}px, 0)`;
        updateTicket();
      });
    }
    route();
  }

  async function init() {
    try {
      const mod = await import("./gallery-seed.js");
      seedFor = mod.getGallerySeed;
    } catch (err) {
      console.warn("[gallery] Starter data module not found.", err);
    }
    events = sortDesc(seedFor(window.MYCELIUM_COUNTRY || "MY"));
    applyLabels();
    route();
    refreshData();

    window.addEventListener("mycelium:languagechange", () => {
      applyLabels();
      if (isOpen) renderImmersive();
      if (article.classList.contains("is-open")) route();
    });
    window.addEventListener("mycelium:countrychange", refreshData);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
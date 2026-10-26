// gallery.js — Minimalist Living Gallery with Memory Wash Portal & Siena Filmstrip
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

  // Portal 阶段组件节点
  const portal = document.getElementById("galleryFilmPortal");
  const portalFrames = document.getElementById("gfpFrames");
  const enterBtnLabel = document.getElementById("gfpBtnLabel");
  const enterBtnArrow = enterBtn ? enterBtn.querySelector(".gfp-btn-arrow") : null;
  const bloomCurtain = document.getElementById("gfpBloomCurtain");

  if (!section || !immersive || !viewport || !list || !article) {
    console.warn("[gallery] missing DOM nodes");
    return;
  }

  const LOCALES = { en: "en-GB", ms: "ms-MY", ta: "ta-MY", "zh-CN": "zh-CN", es: "es-US" };
  const LABELS = {
    en: {
      kicker: "Gallery", title: "Moments worth remembering",
      sub: "A filmstrip of community moments — scroll through every frame.",
      enter: "Enter Gallery", entering: "Entering…", close: "Close story",
      newer: "Newer", older: "Older", when: "When", where: "Where",
      host: "Organised by", people: "Joined by", photo: "Photo slot",
      by: "MYCELIUM Community Desk", explore: "Explore", back: "Back"
    },
    ms: {
      kicker: "Galeri", title: "Detik yang patut dikenang",
      sub: "Jalur filem detikan komuniti — tatal setiap bingkai.",
      enter: "Masuk Galeri", entering: "Memasuki…", close: "Tutup",
      newer: "Lebih baharu", older: "Lebih lama", when: "Bila", where: "Di mana",
      host: "Dianjurkan oleh", people: "Penyertaan", photo: "Ruang foto",
      by: "Meja Komuniti MYCELIUM", explore: "Terokai", back: "Kembali"
    },
    "zh-CN": {
      kicker: "图库", title: "值得铭记的时刻",
      sub: "社区时刻的胶片条 —— 上下滚动浏览每一帧。",
      enter: "进入图库", entering: "正在进入…", close: "关闭",
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

    if (enterBtnLabel && !isPortalAnimating) {
      enterBtnLabel.textContent = l.enter || "ENTER GALLERY";
    }
  }

  // ==========================================================================
  // 1. Gallery Portal: 极简照片印样队列与记忆擦拭动效
  // ==========================================================================
  let entryAnimation = null;
  let isPortalAnimating = false;

  // 格式化轻盈日期 (例如 "06 Sep 2026")
  function formatLightDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(`${isoStr}T00:00:00`);
    if (Number.isNaN(+d)) return String(isoStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // 渲染 4 帧真实色彩照片（最左为最新，无基线包裹）
  function renderCleanFilmFrames(items) {
    if (!portalFrames) return;
    if (!items || !items.length) {
      if (portal) portal.style.display = "none";
      return;
    }
    if (portal) portal.style.display = "";

    // 严格按日期降序排列
    const sorted = sortDesc(items).slice(0, 4);

    portalFrames.innerHTML = sorted.map((ev, i) => {
      const label = pick(ev, "short") || pick(ev, "title") || "Moment";
      const coverUrl = ev.cover || "./img/gallery/meditation.png";
      const dateText = formatLightDate(ev.date);

      return `
        <article class="gfp-frame" data-slug="${esc(ev.slug)}" data-index="${i}">
          <div class="gfp-photo-box">
            <img src="${esc(coverUrl)}" alt="${esc(label)}" loading="lazy" decoding="async">
          </div>
          <time class="gfp-date">${dateText}</time>
        </article>
      `;
    }).join("");

    // 单击单个照片卡片也能触发动画并跳转
    portalFrames.querySelectorAll(".gfp-frame").forEach((frame) => {
      frame.addEventListener("click", () => {
        if (!isPortalAnimating) triggerMemoryWashLaunch(frame.dataset.slug);
      });
    });
  }

  // 中止复原机制：平滑还原初始清晰态
function abortMemoryWashLaunch(silent = false) {
    if (!isPortalAnimating && !silent) return;
    if (entryAnimation) {
      entryAnimation.kill();
      entryAnimation = null;
    }
    isPortalAnimating = false;

    if (bloomCurtain) bloomCurtain.classList.remove("is-active");

    const anchor = document.getElementById("gfpButtonAnchor");
    if (anchor) {
      anchor.style.width = "";
      anchor.style.height = "";
      anchor.style.flex = "";
    }

    if (enterBtn) {
      enterBtn.style.position = "";
      enterBtn.style.left = "";
      enterBtn.style.top = "";
      enterBtn.style.zIndex = "";

      if (window.gsap) {
        gsap.to(enterBtn, {
          x: 0,
          width: "auto",
          backgroundColor: "var(--paper, #f4f1e7)",
          color: "var(--pine, #183d32)",
          duration: silent ? 0.05 : 0.35,
          ease: "power2.out"
        });
      }
    }

    if (enterBtnLabel) {
      enterBtnLabel.textContent = L().enter || "ENTER GALLERY";
      if (window.gsap) {
        gsap.to(enterBtnLabel, { opacity: 1, duration: silent ? 0.05 : 0.25 });
      }
    }
    if (enterBtnArrow && window.gsap) {
      gsap.to(enterBtnArrow, { opacity: 1, duration: silent ? 0.05 : 0.25 });
    }

    // 照片卡片瞬间柔和还原清晰全彩
    const imgs = portalFrames?.querySelectorAll("img");
    if (imgs && window.gsap) {
      const naturalOpacities = [1, 0.94, 0.88, 0.82];
      gsap.to(imgs, {
        filter: "none",
        opacity: (i) => naturalOpacities[i] || 0.85,
        scale: 1,
        duration: silent ? 0.05 : 0.35,
        ease: "power2.out"
      });
    }
  }
  // 触发三阶段连贯过渡动效
function triggerMemoryWashLaunch(targetSlug) {
    if (isPortalAnimating) {
      abortMemoryWashLaunch();
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 减少动态模式：直接无缝跳转
    if (prefersReducedMotion || !window.gsap) {
      openImmersive();
      if (targetSlug) openArticleFromGallery(targetSlug);
      return;
    }

    isPortalAnimating = true;

    // 核心锁定：记录当前按钮初始尺寸并冻结父级 anchor 占位，照片绝不被推挤移动
    const anchor = document.getElementById("gfpButtonAnchor");
    const initW = enterBtn.offsetWidth;
    const initH = enterBtn.offsetHeight;
    if (anchor) {
      anchor.style.width = `${initW}px`;
      anchor.style.height = `${initH}px`;
      anchor.style.flex = `0 0 ${initW}px`;
    }
    enterBtn.style.position = "absolute";
    enterBtn.style.left = "0";
    enterBtn.style.top = "0";
    enterBtn.style.zIndex = "10";

    const frameEls = Array.from(portalFrames?.querySelectorAll(".gfp-frame") || []);
    const portalRect = portal ? portal.getBoundingClientRect() : { width: window.innerWidth, left: 0 };
    const btnRect = enterBtn.getBoundingClientRect();
    const framesRect = portalFrames ? portalFrames.getBoundingClientRect() : null;

    // 推进距离：从按钮起点平滑滑过整组照片
    const travelDistance = framesRect
      ? Math.max(120, framesRect.right - btnRect.left - initW)
      : Math.max(120, (portalRect.width - (btnRect.left - portalRect.left)) - 60);

    const tl = gsap.timeline({
      onComplete: () => {
        // 阶段 3：米白晨光绽放，进入全屏画廊
        if (bloomCurtain) bloomCurtain.classList.add("is-active");

        setTimeout(() => {
          openImmersive();
          if (targetSlug) openArticleFromGallery(targetSlug);

          // 开门完成后，在光幕后静默恢复按钮与照片状态
          setTimeout(() => {
            if (bloomCurtain) bloomCurtain.classList.remove("is-active");
            abortMemoryWashLaunch(true);
          }, 350);
        }, 320);
      }
    });
    entryAnimation = tl;

    // 阶段 1：按钮文字渐隐变为 ENTERING...
    if (enterBtnArrow) {
      tl.to(enterBtnArrow, { opacity: 0, duration: 0.15, ease: "power1.out" }, 0);
    }
    if (enterBtnLabel) {
      tl.to(enterBtnLabel, {
        opacity: 0,
        duration: 0.15,
        ease: "power1.out",
        onComplete: () => {
          enterBtnLabel.textContent = L().entering || "ENTERING…";
        }
      }, 0);
      tl.to(enterBtnLabel, { opacity: 0.95, duration: 0.2 }, 0.15);
    }

    // 按钮自身变长并向右推行（在原位占位盒上方滑动，不影响照片排版）
    tl.to(enterBtn, {
      x: travelDistance,
      width: initW + 56,
      backgroundColor: "var(--pine, #183d32)",
      color: "var(--paper, #f4f1e7)",
      duration: 1.45,
      ease: "power2.in"
    }, 0.1);

    // 阶段 2：当按钮经过各照片时，照片在各自位置上依次擦拭成残影
    frameEls.forEach((frame, idx) => {
      const img = frame.querySelector("img");
      if (!img) return;

      const startTime = 0.22 + idx * 0.26;

      tl.to(img, {
        filter: "brightness(1.22) contrast(0.72) blur(3px) saturate(0.5)",
        opacity: 0.12,
        scale: 0.985,
        duration: 0.42,
        ease: "power2.out"
      }, startTime);
    });
  }
  function handleEnterAction(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    triggerMemoryWashLaunch();
  }

  if (enterBtn) enterBtn.addEventListener("click", handleEnterAction);
  section.addEventListener("click", (e) => {
    if (e.target.closest("#galleryEnter")) handleEnterAction(e);
  });

  // 键盘支持：Esc 随时取消复原
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isPortalAnimating) {
      e.preventDefault();
      abortMemoryWashLaunch();
    }
  });

  // ==========================================================================
  // 2. Siena 沉浸式垂直胶片展厅核心渲染
  // ==========================================================================
  const LOOP_COPIES = 3;
  function realCount() {
    return Math.max(0, events.length);
  }
  function virtualCount() {
    const n = realCount();
    return n ? n * LOOP_COPIES : 0;
  }
  function realFromVirtual(v) {
    const n = realCount();
    if (!n) return 0;
    return ((v % n) + n) % n;
  }

  function renderImmersive() {
    if (!events.length) {
      list.innerHTML = `<li class="gi-item"><article class="gi-card"><div class="gi-frame"><div class="gi-meta"><h2 class="gi-title">No moments yet</h2></div></div></article></li>`;
      return;
    }
    const parts = [];
    for (let copy = 0; copy < LOOP_COPIES; copy++) {
      events.forEach((ev, i) => {
        const vIdx = copy * events.length + i;
        const label = pick(ev, "short") || pick(ev, "title");
        const tag = pick(ev, "tag") || "";
        parts.push(`<li class="gi-item" data-index="${vIdx}" data-real="${i}">
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
      </li>`);
      });
    }
    list.innerHTML = parts.join("");
  }

  // ---- motion & spring physics ----
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
  let scrollDir = 1;
  let snapping = false;
  let pendingOpenSlug = null;
  let springV = 0;

  const DRAG_SCALE = 0.55;
  const WHEEL_SCALE = 0.22;

  function measure() {
    const items = list.querySelectorAll(".gi-item");
    if (!items.length) { itemH = 0; return; }

    const vh = window.innerHeight;
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

    const centerBias = Math.round(vh * 0.10);
    const pad = Math.round((vh - itemH) / 2 + (itemH - cardH) / 2);
    list.style.paddingTop = Math.max(0, pad - centerBias) + "px";
    list.style.paddingBottom = Math.max(0, pad + centerBias) + "px";
  }

  function yForIndex(i) {
    return -i * itemH;
  }
  function nearestVirtualIndex() {
    if (!itemH) return 0;
    return Math.round(-y / itemH);
  }
  function nearestIndex() {
    return realFromVirtual(nearestVirtualIndex());
  }

  function wrapInfinite() {
    const n = realCount();
    if (!n || !itemH || LOOP_COPIES < 2) return;
    const total = n * itemH;
    const midStart = n;
    const midEnd = n * 2;
    let vi = nearestVirtualIndex();
    while (vi < midStart) {
      y -= total;
      targetY -= total;
      vi += n;
    }
    while (vi >= midEnd) {
      y += total;
      targetY += total;
      vi -= n;
    }
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
      const signed = (itemCenter - centerY) / half;
      const dist = Math.abs(signed);
      const t = Math.min(1, dist);

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

      const img = item.querySelector(".gi-photo img");
      if (img) {
        const parallax = signed * -14;
        img.style.transform = `translate3d(0, ${parallax.toFixed(2)}%, 0) scale(1.22)`;
      }

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
        const dy = targetY - y;
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
        velocity *= 0.92;
        y += velocity * (dt / 16);
        if (Math.abs(velocity) < 0.55) {
          targetY = yForIndex(nearestVirtualIndex());
          springV = velocity;
          snapping = true;
        }
      }
    }

    if (itemH && events.length > 1) {
      wrapInfinite();
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
    const n = realCount();
    if (!n) return;
    const curV = nearestVirtualIndex();
    let vTarget;
    if (Math.abs(i - curV) <= n) {
      vTarget = i;
    } else {
      vTarget = n + realFromVirtual(i);
    }
    const nextReal = realFromVirtual(vTarget);
    scrollDir = vTarget > curV ? 1 : vTarget < curV ? -1 : scrollDir;
    activeIndex = nextReal;
    targetY = yForIndex(vTarget);
    snapping = true;
    springV = (targetY - y) * 0.08;
    velocity = springV;
    if (openSlugAfter) pendingOpenSlug = openSlugAfter;
  }

  // ---- Cursor & Gesture (Siena-style) ----
  const ZONE_EDGE = 0.18;
  let cursorMode = "scroll";
  let scrubbing = false;
  let cursorOverUI = false;
  let edgeClickTimer = 0;
  let pendingEdgeDir = 0;

  let tapReady = false;
  let tapReadyAt = 0;
  let pressStartedAt = 0;
  let longPressTimer = 0;
  let awaitingHold = false;
  let didCapture = false;
  let pointerMoved = 0;
  const TAP_WINDOW = 1400;
  const HOLD_MS = 110;
  const TAP_MOVE_MAX = 72;
  const SHORT_UP_MS = 360;
  const SCRUB_SCALE = 2.5;

  function getRing() {
    return hint ? hint.querySelector(".gi-hint-ring") : null;
  }
  function zoneFromY(clientY) {
    const h = window.innerHeight || 1;
    const t = clientY / h;
    if (t < ZONE_EDGE) return "up";
    if (t > 1 - ZONE_EDGE) return "down";
    return "scroll";
  }
  function isOverChrome(el) {
    if (!el || !el.closest) return false;
    return !!(
      el.closest(".gi-back") ||
      el.closest(".gi-explore") ||
      el.closest(".gi-ticket") ||
      el.closest(".gi-top")
    );
  }
  function setCursorMode(mode) {
    if (cursorOverUI && mode !== "scrub") return;
    const ring = getRing();
    if (!ring) { cursorMode = mode; return; }
    if (mode === "scrub" && cursorMode !== "scrub") {
      ring.classList.remove("gi-scrub-in");
      ring.setAttribute("data-mode", "scrub");
      void ring.offsetWidth;
      ring.classList.add("gi-scrub-in");
    } else {
      ring.setAttribute("data-mode", mode);
      if (mode !== "scrub") ring.classList.remove("gi-scrub-in");
    }
    cursorMode = mode;
  }
  function setCursorHidden(hidden) {
    cursorOverUI = hidden;
    if (hint) hint.classList.toggle("is-over-ui", hidden);
    if (immersive) immersive.classList.toggle("gi-show-system-cursor", hidden);
  }
  function updateCursorPos(x, yPos, targetEl) {
    const ring = getRing();
    if (!ring) return;
    ring.style.left = x + "px";
    ring.style.top = yPos + "px";
    if (targetEl !== undefined) setCursorHidden(isOverChrome(targetEl));
    if (scrubbing || awaitingHold) {
      if (scrubbing) setCursorMode("scrub");
      return;
    }
    if (!cursorOverUI) setCursorMode(zoneFromY(yPos));
  }
  function stepCard(dir) {
    goToIndex(nearestVirtualIndex() + dir);
  }
  function clearHoldWatch() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = 0;
    }
    awaitingHold = false;
  }
  function cancelPendingActions() {
    clearTimeout(edgeClickTimer);
    edgeClickTimer = 0;
    pendingEdgeDir = 0;
  }
  function ensureCapture(e) {
    if (didCapture || !e) return;
    try {
      viewport.setPointerCapture(e.pointerId);
      didCapture = true;
    } catch (err) {}
  }
  function releaseCapture(e) {
    if (!didCapture) return;
    try {
      if (e) viewport.releasePointerCapture(e.pointerId);
    } catch (err) {}
    didCapture = false;
  }
  function enterScrub(e) {
    clearHoldWatch();
    cancelPendingActions();
    tapReady = false;
    scrubbing = true;
    setCursorMode("scrub");
    isDragging = true;
    if (e) {
      lastPointerY = e.clientY;
      ensureCapture(e);
    }
    velocity = 0;
    springV = 0;
    snapping = false;
    viewport.classList.add("is-dragging");
  }
  function exitScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    clearHoldWatch();
    setCursorMode(zoneFromY(lastPointerY));
    targetY = yForIndex(nearestVirtualIndex());
    springV = 0;
    velocity = 0;
    snapping = true;
  }

  function onPointerDown(e) {
    if (prefersReduced || !isOpen) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("button.gi-back")) return;
    if (e.target.closest("button.gi-explore")) return;
    if (article && article.classList.contains("is-open")) return;
    if (isOverChrome(e.target)) return;

    updateCursorPos(e.clientX, e.clientY, e.target);
    const now = performance.now();
    pressStartedAt = now;
    isDragging = true;
    pointerMoved = 0;
    lastPointerY = e.clientY;
    snapping = false;
    springV = 0;
    velocity = 0;
    didCapture = false;
    viewport.classList.add("is-dragging");

    if (tapReady && now - tapReadyAt < TAP_WINDOW) {
      awaitingHold = true;
      cancelPendingActions();
      setCursorMode("scrub");
      clearHoldWatch();
      awaitingHold = true;
      longPressTimer = setTimeout(() => {
        if (isDragging && awaitingHold) enterScrub(e);
      }, HOLD_MS);
      ensureCapture(e);
      return;
    }
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    updateCursorPos(e.clientX, e.clientY, e.target);

    const dy = e.clientY - lastPointerY;
    lastPointerY = e.clientY;
    pointerMoved += Math.abs(dy);

    if (awaitingHold && !scrubbing && pointerMoved > 4) {
      enterScrub(e);
    }

    if (!scrubbing && !awaitingHold && pointerMoved > TAP_MOVE_MAX) {
      ensureCapture(e);
      tapReady = false;
    }

    if (scrubbing) {
      const moved = dy * SCRUB_SCALE;
      y += moved;
      velocity = moved;
      targetY = y;
      springV = 0;
      snapping = false;
      if (moved < -0.4) scrollDir = 1;
      if (moved > 0.4) scrollDir = -1;
      activeIndex = nearestIndex();
      return;
    }

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
    releaseCapture(e);

    const heldFor = performance.now() - pressStartedAt;
    const wasAwaiting = awaitingHold;
    clearHoldWatch();

    if (scrubbing) {
      exitScrub();
      return;
    }

    if (wasAwaiting) {
      setCursorMode(zoneFromY(e.clientY));
      return;
    }

    const zone = zoneFromY(e.clientY);
    const isLightTap =
      (pointerMoved < TAP_MOVE_MAX && heldFor < SHORT_UP_MS) ||
      (pointerMoved < 24 && heldFor < 450);

    if (isLightTap) {
      tapReady = true;
      tapReadyAt = performance.now();

      if (zone === "up" || zone === "down") {
        pendingEdgeDir = zone === "up" ? -1 : 1;
        clearTimeout(edgeClickTimer);
        edgeClickTimer = setTimeout(() => {
          if (!scrubbing && !awaitingHold && pendingEdgeDir) stepCard(pendingEdgeDir);
          pendingEdgeDir = 0;
          edgeClickTimer = 0;
        }, 320);
        return;
      }
      return;
    }

    tapReady = false;
    targetY = yForIndex(nearestVirtualIndex());
    springV = velocity;
    snapping = true;
  }

  function onWheel(e) {
    if (prefersReduced || !isOpen) return;
    e.preventDefault();
    const delta = e.deltaY * WHEEL_SCALE;
    if (snapping && Math.abs(targetY - y) > itemH * 0.35) {
      snapping = false;
    }
    y -= delta;
    velocity = -delta;
    if (delta > 0.3) scrollDir = 1;
    if (delta < -0.3) scrollDir = -1;
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
    const next = `#gallery/${encodeURIComponent(slug)}`;
    if (location.hash === next) {
      openArticle(slug);
    } else {
      location.hash = next;
    }
  }

  list.addEventListener("click", (e) => {
    const explore = e.target.closest("button.gi-explore");
    if (!explore || !list.contains(explore)) return;
    const slug = explore.dataset.slug || explore.closest(".gi-card")?.dataset.slug;
    if (!slug) return;
    e.preventDefault();
    e.stopPropagation();
    openArticleFromGallery(slug);
  });

  function onMouseMove(e) {
    if (!isOpen || !hint) return;
    updateCursorPos(e.clientX, e.clientY, e.target);
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
        const n = realCount();
        const startV = n ? n + realFromVirtual(activeIndex) : 0;
        y = yForIndex(startV);
        targetY = y;
        springV = 0;
        list.style.transform = `translate3d(0, ${y}px, 0)`;
        if (!prefersReduced) startLoop();
        else applyVisuals();
        updateTicket();
      });

      if (hint) {
        hint.classList.add("is-visible");
        hint.setAttribute("aria-hidden", "false");
      }
    } catch (err) {
      console.error("[gallery] openImmersive failed", err);
    }
  }

  function closeImmersive() {
    if (!isOpen) return;
    isOpen = false;
    scrubbing = false;
    immersive.classList.remove("is-open");
    immersive.setAttribute("aria-hidden", "true");
    if (hint) {
      hint.classList.remove("is-visible");
      hint.setAttribute("aria-hidden", "true");
    }
    document.documentElement.classList.remove("gi-lock");
    if (!article.classList.contains("is-open") && window.MYCELIUM_LENIS) {
      window.MYCELIUM_LENIS.start();
    }
    stopLoop();
  }

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
      goToIndex(nearestVirtualIndex() + 1);
    }
    if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
      e.preventDefault();
      goToIndex(nearestVirtualIndex() - 1);
    }
  });

  window.addEventListener("resize", () => {
    if (!isOpen) return;
    const real = nearestIndex();
    measure();
    const n = realCount();
    const v = n ? n + real : 0;
    y = yForIndex(v);
    targetY = y;
    springV = 0;
    list.style.transform = `translate3d(0, ${y}px, 0)`;
  });

  // ==========================================================================
  // 3. Story Layer (Article Details Modal)
  // ==========================================================================
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
    {
      const n = realCount();
      const v = n ? n + i : 0;
      y = yForIndex(v);
      targetY = y;
    }
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

  // ==========================================================================
  // 4. 数据拉取与自检装配
  // ==========================================================================
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
    renderCleanFilmFrames(events);

    if (isOpen) {
      renderImmersive();
      requestAnimationFrame(() => {
        measure();
        const n = realCount();
        const real = Math.min(activeIndex, Math.max(0, n - 1));
        const v = n ? n + real : 0;
        y = yForIndex(v);
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
    renderCleanFilmFrames(events);
    route();
    refreshData();

    window.addEventListener("mycelium:languagechange", () => {
      applyLabels();
      renderCleanFilmFrames(events);
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
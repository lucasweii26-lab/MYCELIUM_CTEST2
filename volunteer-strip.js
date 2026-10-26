/* Volunteer strip: gallery-like internal spring scroll while in-zone;
   seamless handoff to homepage (Lenis) outside the strip. */
(function () {
  "use strict";

  const section = document.getElementById("volunteer");
  const track = document.getElementById("volunteerTrack");
  const dimEl = document.getElementById("viBgDim");
  if (!section || !track) return;

  section.classList.add("vi-noselect");

  // wrap items in inner list for translate3d (gallery pattern)
  let list = track.querySelector(".vi-list-inner");
  if (!list) {
    list = document.createElement("div");
    list.className = "vi-list-inner";
    while (track.firstChild) list.appendChild(track.firstChild);
    track.appendChild(list);
  }

  let hint = section.querySelector(".vi-hint");
  if (!hint) {
    hint = document.createElement("div");
    hint.className = "vi-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML =
      '<div class="vi-hint-ring" data-mode="scroll">' +
      '<span class="vi-hint-chev vi-hint-up" aria-hidden="true"></span>' +
      '<span class="vi-hint-label">SCROLL</span>' +
      '<span class="vi-hint-chev vi-hint-down" aria-hidden="true"></span>' +
      "</div>";
    section.appendChild(hint);
  }

  let isOpen = false;
  let ownsScroll = false; // strip controls motion (Lenis stopped)
  let itemH = 0;
  let cardH = 0;
  let y = 0;
  let targetY = 0;
  let velocity = 0;
  let springV = 0;
  let snapping = false;
  let isDragging = false;
  let lastPointerY = 0;
  let pointerMoved = 0;
  let pressStartedAt = 0;
  let lastTime = 0;
  let rafId = 0;
  let activeIndex = 0;

  let scrubbing = false;
  let awaitingHold = false;
  let tapReady = false;
  let tapReadyAt = 0;
  let longPressTimer = 0;
  let didCapture = false;
  let cursorMode = "scroll";
  let cursorOverUI = false;
  let pointerInside = false;

  const ZONE_EDGE = 0.18;
  const TAP_WINDOW = 1400;
  const HOLD_MS = 100;
  const TAP_MOVE_MAX = 72;
  const SHORT_UP_MS = 360;
  const DRAG_SCALE = 1.15;
  const SCRUB_SCALE = 2.4;
  const STIFFNESS = 0.045;
  const DAMPING = 0.78;

  function items() {
    return Array.from(list.querySelectorAll(".vi-item"));
  }
  function maxIndex() {
    return Math.max(0, items().length - 1);
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
  function minY() {
    return yForIndex(maxIndex());
  }

  function lenisStop() {
    if (window.MYCELIUM_LENIS && typeof window.MYCELIUM_LENIS.stop === "function") {
      try { window.MYCELIUM_LENIS.stop(); } catch (e) {}
    }
  }
  function lenisStart() {
    if (window.MYCELIUM_LENIS && typeof window.MYCELIUM_LENIS.start === "function") {
      try { window.MYCELIUM_LENIS.start(); } catch (e) {}
    }
  }

  function measure() {
    const nodes = items();
    if (!nodes.length) {
      itemH = 0;
      return;
    }
    const vh = window.innerHeight || 800;
    cardH = Math.round(Math.min(vh * 0.78, vh - 80));
    itemH = Math.round(cardH + vh * 0.06); // tighter gap

    nodes.forEach((item) => {
      item.style.height = itemH + "px";
      item.style.minHeight = itemH + "px";
      item.style.maxHeight = itemH + "px";
      item.style.boxSizing = "border-box";
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.justifyContent = "center";
      const frame = item.querySelector(".vi-frame");
      if (frame) {
        frame.style.height = cardH + "px";
        frame.style.maxHeight = cardH + "px";
      }
    });

    const pad = Math.round((vh - itemH) / 2 + (itemH - cardH) / 2);
    list.style.paddingTop = Math.max(0, pad) + "px";
    list.style.paddingBottom = Math.max(0, pad) + "px";
  }

  function applyVisuals() {
    const nodes = items();
    if (!nodes.length) return;
    const vp = track.getBoundingClientRect();
    const centerY = vp.top + vp.height / 2;
    const half = vp.height * 0.5 || 1;
    const speed = Math.min(1, Math.abs(velocity) / 18);

    nodes.forEach((item) => {
      const r = item.getBoundingClientRect();
      const itemCenter = r.top + r.height / 2;
      const signed = (itemCenter - centerY) / half;
      const dist = Math.abs(signed);
      const t = Math.min(1, dist);

      const card = item.querySelector(".vi-card");
      const img = item.querySelector(".vi-frame img, .volunteerImg");
      const texts = item.querySelectorAll(".vi-text");

      if (card) {
        const scale = 1 - t * 0.04;
        const opacity = 1 - t * 0.18;
        const blur = t * 1.1 + speed * 2.0;
        card.style.transform = `scale(${scale.toFixed(4)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = blur > 0.08 ? `blur(${blur.toFixed(2)}px)` : "none";
      }
      if (img) {
        // keep base scale >= 1.14 so edges never show frame fill (hairline fix)
        img.style.transform = `translate3d(0, ${(signed * -12).toFixed(2)}%, 0) scale(1.14)`;
      }
      texts.forEach((el, ti) => {
        const yShift = signed * (28 + ti * 5);
        el.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0)`;
        el.style.opacity = Math.max(0, 1 - t * 1.3).toFixed(3);
      });
    });

    if (dimEl && isOpen) {
      // dim peaks while owning scroll / section engaged
      const n = maxIndex() + 1;
      const progress = n > 1 ? nearestIndex() / Math.max(1, n - 1) : 1;
      const dim = ownsScroll ? 0.55 + progress * 0.15 : 0.25;
      dimEl.style.opacity = dim.toFixed(3);
    }
    activeIndex = nearestIndex();
  }

  // overscroll intent — sustained push past first/last before leaving strip
  let edgePush = 0;
  const EDGE_RELEASE = 4;

  function takeControl() {
    if (ownsScroll) return;
    ownsScroll = true;
    edgePush = 0;
    track.classList.add("is-locked");
    // stop Lenis only — do NOT lock body overflow (that caused stuck scroll + jump bugs)
    lenisStop();
    measure();
    // keep current index; do not jump page scroll position here
    y = yForIndex(activeIndex);
    targetY = y;
    springV = 0;
    velocity = 0;
    list.style.transform = `translate3d(0, ${y}px, 0)`;
  }

  function releaseControl(dir) {
    if (!ownsScroll) return;
    ownsScroll = false;
    edgePush = 0;
    track.classList.remove("is-locked");
    document.documentElement.classList.remove("vi-lock");
    document.body.classList.remove("vi-lock");
    list.style.transform = "translate3d(0, 0, 0)";
    velocity = 0;
    springV = 0;
    snapping = false;
    if (dimEl) dimEl.style.opacity = "0";
    lenisStart();
    // optional gentle nudge — only if dir set and section still in DOM
    if (dir && section) {
      const r = section.getBoundingClientRect();
      if (dir < 0 && r.top > 8) {
        // leave above section
        const yTarget = (window.scrollY || 0) + r.top - window.innerHeight * 0.15;
        if (window.MYCELIUM_LENIS && window.MYCELIUM_LENIS.scrollTo) {
          window.MYCELIUM_LENIS.scrollTo(Math.max(0, yTarget), { duration: 0.8 });
        } else {
          window.scrollTo({ top: Math.max(0, yTarget), behavior: "smooth" });
        }
      } else if (dir > 0) {
        const yTarget = (window.scrollY || 0) + r.bottom - window.innerHeight * 0.2;
        if (window.MYCELIUM_LENIS && window.MYCELIUM_LENIS.scrollTo) {
          window.MYCELIUM_LENIS.scrollTo(Math.max(0, yTarget), { duration: 0.8 });
        } else {
          window.scrollTo({ top: Math.max(0, yTarget), behavior: "smooth" });
        }
      }
    }
  }

  function tick(now) {
    const dt = Math.min(32, now - lastTime);
    lastTime = now;

    if (ownsScroll && !isDragging) {
      if (snapping || Math.abs(velocity) < 0.25) {
        const dy = targetY - y;
        springV = (springV + dy * STIFFNESS) * DAMPING;
        y += springV;
        velocity = springV;
        if (Math.abs(dy) < 0.5 && Math.abs(springV) < 0.5) {
          y = targetY;
          velocity = 0;
          springV = 0;
          snapping = false;
        }
      } else {
        velocity *= 0.92;
        y += velocity * (dt / 16);
        if (Math.abs(velocity) < 0.55) {
          targetY = yForIndex(nearestIndex());
          springV = velocity;
          snapping = true;
        }
      }

      // soft finite bounds (small rubber, then hard clamp) — no page fight
      const top = 0;
      const bottom = minY();
      if (y > top + 36) {
        y = top + 36;
        velocity *= 0.5;
      }
      if (y < bottom - 36) {
        y = bottom - 36;
        velocity *= 0.5;
      }
      // while snapping, never leave true range
      if (snapping) {
        if (y > top) y = top;
        if (y < bottom) y = bottom;
      }

      list.style.transform = `translate3d(0, ${y}px, 0)`;
    }

    if (isOpen) applyVisuals();
    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function goToIndex(i) {
    if (!ownsScroll) takeControl();
    const idx = clampIndex(i);
    activeIndex = idx;
    targetY = yForIndex(idx);
    snapping = true;
    springV = (targetY - y) * 0.08;
    velocity = springV;
  }
  function stepCard(dir) {
    goToIndex(nearestIndex() + dir);
  }

  function onWheel(e) {
    if (!isOpen) return;

    const overSection = section.contains(e.target) || pointerInside;

    if (ownsScroll) {
      // Only intercept when pointer is over the volunteer block — avoids trapping the whole page
      if (!overSection && !track.matches(":hover") && !section.matches(":hover")) {
        // allow page to work if cursor left the strip
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      velocity += e.deltaY * 0.05;
      snapping = false;

      const atTop = nearestIndex() <= 0 && y >= -12;
      const atBottom = nearestIndex() >= maxIndex() && y <= minY() + 12;

      if (atTop && e.deltaY < -8) {
        edgePush += 1;
        y = Math.min(24, y + 6);
        if (edgePush >= EDGE_RELEASE) releaseControl(-1);
        return;
      }
      if (atBottom && e.deltaY > 8) {
        edgePush += 1;
        y = Math.max(minY() - 24, y - 6);
        if (edgePush >= EDGE_RELEASE) releaseControl(1);
        return;
      }
      if (!atTop && !atBottom) edgePush = 0;
      return;
    }

    if (overSection) {
      e.preventDefault();
      e.stopPropagation();
      takeControl();
      velocity += e.deltaY * 0.05;
      snapping = false;
    }
  }

  /* cursor / scrub */
  function getRing() {
    return hint.querySelector(".vi-hint-ring");
  }
  function zoneFromY(clientY) {
    const h = window.innerHeight || 1;
    const t = clientY / h;
    if (t < ZONE_EDGE) return "up";
    if (t > 1 - ZONE_EDGE) return "down";
    return "scroll";
  }
  function isOverChrome(el) {
    return !!(el && el.closest && (
      el.closest(".vi-register") ||
      el.closest(".volunteerRegisterBtn") ||
      el.closest(".volunteerCloseBtn") ||
      el.closest(".volunteerHeader") ||
      el.closest("button") ||
      el.closest("a")
    ));
  }
  function setCursorMode(mode) {
    if (cursorOverUI && mode !== "scrub") return;
    if (mode === "up" && activeIndex <= 0) mode = "scroll";
    if (mode === "down" && activeIndex >= maxIndex()) mode = "scroll";
    const ring = getRing();
    if (mode === "scrub" && cursorMode !== "scrub" && ring) {
      ring.classList.remove("vi-scrub-in");
      ring.setAttribute("data-mode", "scrub");
      void ring.offsetWidth;
      ring.classList.add("vi-scrub-in");
    } else if (ring) {
      ring.setAttribute("data-mode", mode);
      if (mode !== "scrub") ring.classList.remove("vi-scrub-in");
    }
    cursorMode = mode;
  }
  function updateCursorPos(x, yPos, targetEl) {
    const ring = getRing();
    if (!ring) return;
    ring.style.left = x + "px";
    ring.style.top = yPos + "px";
    const hide = isOverChrome(targetEl);
    cursorOverUI = hide;
    hint.classList.toggle("is-over-ui", hide);
    section.classList.toggle("vi-show-system-cursor", hide);
    if (scrubbing || awaitingHold) {
      setCursorMode("scrub");
      return;
    }
    if (!hide) setCursorMode(zoneFromY(yPos));
  }
  function clearHold() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = 0;
    }
    awaitingHold = false;
  }
  function ensureCapture(e) {
    if (didCapture || !e) return;
    try {
      track.setPointerCapture(e.pointerId);
      didCapture = true;
    } catch (err) {}
  }
  function releaseCapture(e) {
    if (!didCapture) return;
    try {
      if (e) track.releasePointerCapture(e.pointerId);
    } catch (err) {}
    didCapture = false;
  }
  function enterScrub(e) {
    clearHold();
    tapReady = false;
    scrubbing = true;
    isDragging = true;
    if (!ownsScroll) takeControl();
    setCursorMode("scrub");
    if (e) {
      lastPointerY = e.clientY;
      ensureCapture(e);
    }
    velocity = 0;
    springV = 0;
    snapping = false;
  }
  function exitScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    clearHold();
    setCursorMode(zoneFromY(lastPointerY));
    targetY = yForIndex(nearestIndex());
    springV = 0;
    velocity = 0;
    snapping = true;
  }

  function onPointerDown(e) {
    if (!isOpen) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isOverChrome(e.target)) return;
    if (!section.contains(e.target)) return;

    if (!ownsScroll) takeControl();
    try { e.preventDefault(); } catch (err) {}
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

    if (tapReady && now - tapReadyAt < TAP_WINDOW) {
      awaitingHold = true;
      setCursorMode("scrub");
      clearHold();
      awaitingHold = true;
      longPressTimer = setTimeout(() => {
        if (isDragging && awaitingHold) enterScrub(e);
      }, HOLD_MS);
      ensureCapture(e);
    }
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    updateCursorPos(e.clientX, e.clientY, e.target);
    const dy = e.clientY - lastPointerY;
    lastPointerY = e.clientY;
    pointerMoved += Math.abs(dy);

    if (awaitingHold && !scrubbing && pointerMoved > 4) enterScrub(e);
    if (!scrubbing && !awaitingHold && pointerMoved > TAP_MOVE_MAX) {
      ensureCapture(e);
      tapReady = false;
    }

    if (scrubbing) {
      y += dy * SCRUB_SCALE;
      velocity = dy * SCRUB_SCALE;
      targetY = y;
      springV = 0;
      snapping = false;
      return;
    }
    if (ownsScroll && pointerMoved > 6) {
      y += dy * DRAG_SCALE;
      velocity = dy * DRAG_SCALE;
    }
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    releaseCapture(e);

    const heldFor = performance.now() - pressStartedAt;
    const wasAwaiting = awaitingHold;
    clearHold();

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
      const idx = nearestIndex();
      if (zone === "up" && idx > 0) stepCard(-1);
      else if (zone === "down" && idx < maxIndex()) stepCard(1);
      else if (zone === "up" && idx <= 0) releaseControl(-1);
      else if (zone === "down" && idx >= maxIndex()) releaseControl(1);
      return;
    }

    tapReady = false;
    if (ownsScroll) {
      targetY = yForIndex(nearestIndex());
      springV = velocity;
      snapping = true;
    }
  }

  function onMouseMove(e) {
    if (!isOpen) return;
    const over = section.contains(e.target);
    pointerInside = over;
    if (over) {
      hint.classList.add("is-visible");
      section.classList.add("vi-cursor-on");
      updateCursorPos(e.clientX, e.clientY, e.target);
    } else {
      hint.classList.remove("is-visible");
      section.classList.remove("vi-cursor-on");
    }
  }

  function onKey(e) {
    if (!isOpen || !ownsScroll) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      if (nearestIndex() < maxIndex()) stepCard(1);
      else releaseControl(1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      if (nearestIndex() > 0) stepCard(-1);
      else releaseControl(-1);
    }
  }

  function activate() {
    isOpen = true;
    document.documentElement.classList.remove("vi-lock");
    document.body.classList.remove("vi-lock");
    measure();
    startLoop();
    // Page scroll is handled by app.js; only take strip control after a short settle
    setTimeout(() => {
      if (!isOpen) return;
      activeIndex = 0;
      takeControl();
      applyVisuals();
    }, 500);
  }

  function deactivate() {
    isOpen = false;
    ownsScroll = false;
    edgePush = 0;
    track.classList.remove("is-locked");
    document.documentElement.classList.remove("vi-lock");
    document.body.classList.remove("vi-lock");
    list.style.transform = "translate3d(0, 0, 0)";
    velocity = 0;
    springV = 0;
    snapping = false;
    lenisStart();
    if (dimEl) dimEl.style.opacity = "0";
    hint.classList.remove("is-visible");
    section.classList.remove("vi-cursor-on");
  }

  function refresh() {
    if (document.body.classList.contains("show-volunteer")) activate();
    else deactivate();
  }

  // window wheel while open → full-viewport capture zone (avoids tiny track-only hit area)
  window.addEventListener("wheel", onWheel, { passive: false, capture: true });
  section.addEventListener("pointerdown", onPointerDown, { passive: false });
  track.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => {
    if (!isOpen) return;
    const idx = nearestIndex();
    measure();
    if (ownsScroll) {
      y = yForIndex(idx);
      targetY = y;
      springV = 0;
      list.style.transform = `translate3d(0, ${y}px, 0)`;
    }
  });

  const mo = new MutationObserver(refresh);
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  window.MYCELIUM_VOLUNTEER_STRIP = {
    refresh,
    open: activate,
    close: deactivate,
  };

  if (document.body.classList.contains("show-volunteer")) activate();
})();
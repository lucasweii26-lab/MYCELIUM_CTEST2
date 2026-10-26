// volunteer-strip.js — In-page Seamless Volunteer Section with Lenis Spring-Snap & Dynamic Cursor
(() => {
  "use strict";

  const section = document.getElementById("volunteer");
  const track = document.getElementById("volunteerTrack");
  const closeBtn = document.getElementById("volunteerCloseBtn");
  if (!section || !track) return;

  // 1. 光标挂载到 document.body 顶层，彻底解决随滚动滑出屏幕的问题
  let hint = document.getElementById("viGlobalHint");
  if (!hint) {
    hint = document.createElement("div");
    hint.id = "viGlobalHint";
    hint.className = "vi-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML =
      '<div class="vi-hint-ring" data-mode="scroll">' +
      '<span class="vi-hint-chev vi-hint-up" aria-hidden="true"></span>' +
      '<span class="vi-hint-label">SCROLL</span>' +
      '<span class="vi-hint-chev vi-hint-down" aria-hidden="true"></span>' +
      "</div>";
    document.body.appendChild(hint);
  }

  let isSectionActive = false;
  let rafVisualId = 0;
  let activeIndex = 0;

  // 2. 纠偏与防抖状态锁（绝对 0 打架）
  let idleSnapTimer = 0;
  let isSnapping = false; // 当正在吸附纠正时加锁，避免重复调用

  // 3. 拖拽与双箭头 Scrub 状态
  let isDragging = false;
  let isScrubbing = false;
  let lastPointerY = 0;
  let pointerMoved = 0;
  let tapReady = false;
  let tapReadyAt = 0;
  let longPressTimer = 0;
  const TAP_WINDOW = 1200;
  const HOLD_MS = 100;

  let cursorMode = "scroll";
  let cursorOverInteractive = false;

  function getCards() {
    return Array.from(track.querySelectorAll(".volunteerCard"));
  }

  function isSectionInView() {
    if (!isSectionActive) return false;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    return rect.bottom > 60 && rect.top < vh - 60;
  }

  // 获取最靠近视口中心的卡片索引
  function getNearestIndex() {
    const cards = getCards();
    if (!cards.length) return 0;
    const vCenter = window.innerHeight / 2;
    let nearest = 0;
    let minDiff = Infinity;

    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const diff = Math.abs(cardCenter - vCenter);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = i;
      }
    });
    return nearest;
  }

  // 单向被动渲染视差（缩放、模糊与透明度）
  function renderVisuals() {
    rafVisualId = 0;
    if (!isSectionInView()) return;

    const cards = getCards();
    const vh = window.innerHeight || 1;
    const centerY = vh * 0.5;
    const halfH = vh * 0.5;

    cards.forEach((item) => {
      const r = item.getBoundingClientRect();
      const itemCenter = r.top + r.height / 2;
      const signed = (itemCenter - centerY) / halfH;
      const dist = Math.abs(signed);
      const t = Math.min(1, dist);

      const scale = 1 - t * 0.04;
      const opacity = Math.max(0.42, 1 - t * 0.35);
      const blur = t * 1.3;

      const card = item.querySelector(".vi-card");
      if (card) {
        card.style.transform = `scale(${scale.toFixed(4)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = blur > 0.08 ? `blur(${blur.toFixed(2)}px)` : "none";
      }

      const img = item.querySelector(".vi-frame img, .volunteerImg");
      if (img) {
        const parallaxY = signed * -12;
        img.style.transform = `translate3d(0, ${parallaxY.toFixed(2)}%, 0) scale(1.15)`;
      }

      const texts = item.querySelectorAll(".vi-text");
      texts.forEach((el, ti) => {
        const yShift = signed * (20 + ti * 4);
        el.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0)`;
        el.style.opacity = Math.max(0, 1 - t * 1.2).toFixed(3);
      });
    });

    activeIndex = getNearestIndex();
  }

  // 纯正弹簧阻尼过冲函数 (Gallery 同款 Spring Overshoot & Settle)
  function springSettleEasing(t) {
    return 1 - Math.pow(Math.E, -5.5 * t) * Math.cos(3.5 * t);
  }

  // 4. 精准弹簧纠偏吸附执行器（对齐到屏幕正中心）
  function snapToCard(targetIndex) {
    const cards = getCards();
    const targetCard = cards[targetIndex];
    if (!targetCard) return;

    isSnapping = true;

    // 让卡片在视口正中居中对齐
    const offset = -(window.innerHeight - targetCard.offsetHeight) / 2;

    if (window.MYCELIUM_LENIS && typeof window.MYCELIUM_LENIS.scrollTo === "function") {
      window.MYCELIUM_LENIS.scrollTo(targetCard, {
        offset: offset,
        duration: 0.85,
        easing: springSettleEasing,
        onComplete: () => {
          setTimeout(() => { isSnapping = false; }, 60);
        }
      });
    } else {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => { isSnapping = false; }, 850);
    }
  }

  // 5. 防抖停稳吸附检测（仅当完全停手 180ms 且人在看 Volunteer 时吸附）
  function scheduleVisualUpdate() {
    if (!rafVisualId && isSectionActive) {
      rafVisualId = requestAnimationFrame(renderVisuals);
    }

    if (!isSectionActive || isDragging || isSnapping) return;

    // 只有视口处于 Volunteer 核心区域时才进行自动对齐吸附
    if (isSectionInView()) {
      clearTimeout(idleSnapTimer);
      idleSnapTimer = setTimeout(() => {
        if (!isSectionActive || isDragging || isSnapping) return;
        const nearestIdx = getNearestIndex();
        const cards = getCards();
        const card = cards[nearestIdx];
        if (!card) return;

        const vCenter = window.innerHeight / 2;
        const r = card.getBoundingClientRect();
        const cardCenter = r.top + r.height / 2;
        const diff = Math.abs(cardCenter - vCenter);

        // 如果偏移大于 16px，触发纯正弹簧居中纠偏
        if (diff > 16) {
          snapToCard(nearestIdx);
        }
      }, 100);
    }
  }

  // 用户重新滚轮滑动时，立即瞬间让渡控制权，打断任何吸附，绝不粘手
  window.addEventListener("wheel", () => {
    clearTimeout(idleSnapTimer);
    if (isSnapping) {
      isSnapping = false;
    }
  }, { passive: true });

  // 6. 光标指示更新
  function updateCursor(clientX, clientY, targetEl) {
    const ring = hint.querySelector(".vi-hint-ring");
    if (!ring) return;
    ring.style.left = clientX + "px";
    ring.style.top = clientY + "px";

    const isInteractive = !!(targetEl && targetEl.closest && (
      targetEl.closest("button") ||
      targetEl.closest("a") ||
      targetEl.closest("input") ||
      targetEl.closest("textarea") ||
      targetEl.closest(".volunteerRegisterBtn") ||
      targetEl.closest(".volunteerCloseBtn")
    ));

    cursorOverInteractive = isInteractive;
    hint.classList.toggle("is-over-ui", isInteractive);
    section.classList.toggle("vi-show-system-cursor", isInteractive);

    if (isScrubbing) {
      setCursorMode("scrub");
      return;
    }

    if (!isInteractive) {
      const cards = getCards();
      const currentCard = cards[activeIndex] || cards[0];
      if (currentCard) {
        const rect = currentCard.getBoundingClientRect();
        const relY = (clientY - rect.top) / rect.height;
        // 上半部 24% 提示向上，下半部 24% 提示向下
        if (relY < 0.24 && activeIndex > 0) {
          setCursorMode("up");
        } else if (relY > 0.76 && activeIndex < cards.length - 1) {
          setCursorMode("down");
        } else {
          setCursorMode("scroll");
        }
      }
    }
  }

  function setCursorMode(mode) {
    const ring = hint.querySelector(".vi-hint-ring");
    if (!ring) return;

    if (mode === "scrub") {
      if (cursorMode !== "scrub") {
        ring.classList.remove("vi-scrub-in");
        ring.setAttribute("data-mode", "scrub");
        void ring.offsetWidth;
        ring.classList.add("vi-scrub-in");
      }
    } else {
      ring.setAttribute("data-mode", mode);
      ring.classList.remove("vi-scrub-in");
    }
    cursorMode = mode;
  }

  // 7. 拖拽与双箭头手势
  function onPointerDown(e) {
    if (!isSectionActive || e.button !== 0 || cursorOverInteractive) return;
    const cardEl = e.target.closest(".volunteerCard");
    if (!cardEl) return;

    isDragging = true;
    lastPointerY = e.clientY;
    pointerMoved = 0;

    const now = performance.now();
    if (tapReady && now - tapReadyAt < TAP_WINDOW) {
      longPressTimer = setTimeout(() => {
        if (isDragging) {
          isScrubbing = true;
          setCursorMode("scrub");
        }
      }, HOLD_MS);
    }

    updateCursor(e.clientX, e.clientY, e.target);
  }

  function onPointerMove(e) {
    if (isSectionActive) {
      updateCursor(e.clientX, e.clientY, e.target);
    }

    if (!isDragging) return;

    const currentY = e.clientY;
    const dy = currentY - lastPointerY;
    lastPointerY = currentY;
    pointerMoved += Math.abs(dy);

    if (pointerMoved > 6 && !isScrubbing) {
      isScrubbing = true;
      setCursorMode("scrub");
    }

    // 手指/鼠标拖拽平滑推动页面
    window.scrollBy(0, -dy * 1.2);
    scheduleVisualUpdate();
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    clearTimeout(longPressTimer);

    const wasScrub = isScrubbing;
    isScrubbing = false;

    // 单击边缘箭头跳转
    if (pointerMoved < 15 && !wasScrub) {
      const cards = getCards();
      const currentCard = cards[activeIndex];
      if (currentCard) {
        const rect = currentCard.getBoundingClientRect();
        const relY = (e.clientY - rect.top) / rect.height;
        if (relY < 0.24 && activeIndex > 0) {
          snapToCard(activeIndex - 1);
          return;
        } else if (relY > 0.76 && activeIndex < cards.length - 1) {
          snapToCard(activeIndex + 1);
          return;
        }
      }
      tapReady = true;
      tapReadyAt = performance.now();
      return;
    }

    tapReady = false;

    // 拖拽松开：对齐居中
    snapToCard(getNearestIndex());
  }

  function onMouseMove(e) {
    if (!isSectionActive) return;
    const overSection = section.contains(e.target);
    if (overSection && isSectionInView()) {
      hint.classList.add("is-visible");
      section.classList.add("vi-cursor-on");
      updateCursor(e.clientX, e.clientY, e.target);
    } else {
      hint.classList.remove("is-visible");
      section.classList.remove("vi-cursor-on");
    }
  }

  function onKeyDown(e) {
    if (!isSectionActive || !isSectionInView()) return;
    const cards = getCards();
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      if (activeIndex < cards.length - 1) {
        e.preventDefault();
        snapToCard(activeIndex + 1);
      }
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      if (activeIndex > 0) {
        e.preventDefault();
        snapToCard(activeIndex - 1);
      }
    }
  }

  function activate() {
    isSectionActive = true;
    section.setAttribute("aria-hidden", "false");
    scheduleVisualUpdate();
  }

  function deactivate() {
    isSectionActive = false;
    isSnapping = false;
    clearTimeout(idleSnapTimer);
    section.setAttribute("aria-hidden", "true");
    hint.classList.remove("is-visible");
    section.classList.remove("vi-cursor-on");

    getCards().forEach((item) => {
      const card = item.querySelector(".vi-card");
      if (card) {
        card.style.transform = "";
        card.style.opacity = "";
        card.style.filter = "";
      }
    });
  }

  // 绑定全局事件
  window.addEventListener("scroll", scheduleVisualUpdate, { passive: true });
  window.addEventListener("resize", scheduleVisualUpdate, { passive: true });
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);

  function hookLenis() {
    if (window.MYCELIUM_LENIS && typeof window.MYCELIUM_LENIS.on === "function") {
      window.MYCELIUM_LENIS.on("scroll", scheduleVisualUpdate);
      return true;
    }
    return false;
  }
  if (!hookLenis()) {
    let retries = 0;
    const timer = setInterval(() => {
      if (hookLenis() || ++retries > 30) clearInterval(timer);
    }, 150);
  }

  const mo = new MutationObserver(() => {
    if (document.body.classList.contains("show-volunteer")) activate();
    else deactivate();
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.remove("show-volunteer");
      deactivate();
      if (typeof window.scrollToNav === "function") {
        window.scrollToNav();
      }
    });
  }

  window.MYCELIUM_VOLUNTEER_STRIP = {
    open: activate,
    close: deactivate,
    refresh: scheduleVisualUpdate
  };

  if (document.body.classList.contains("show-volunteer")) activate();
})();
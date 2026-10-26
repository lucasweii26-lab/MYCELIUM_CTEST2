// volunteer-strip.js — In-Page Seamless Volunteer Section (High-Response Scrub & Assistive Snap)
(() => {
  "use strict";

  const section = document.getElementById("volunteer");
  const track = document.getElementById("volunteerTrack");
  const closeBtn = document.getElementById("volunteerCloseBtn");
  if (!section || !track) return;

  // 1. 光标挂载到 document.body 顶层
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

  // 2. 弹簧吸附状态锁（绝对 0 打架）
  let idleSnapTimer = 0;
  let isSnapping = false;

  // 3. 拖拽与高灵敏度 Scrub 状态
  let isDragging = false;
  let isScrubbing = false;
  let dragStartCardIdx = 0;
  let totalDragDeltaY = 0;   // 单次拖拽累计位移
  let lastPointerY = 0;
  let lastPointerTime = 0;
  let pointerVelocityY = 0;  // 实时拖拽滑动速度 (px/ms)
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

  // 区块在当前视口内可见性判定
  function isSectionInView() {
    if (!isSectionActive) return false;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    return rect.bottom > 40 && rect.top < vh - 40;
  }

  // 获取离视口中线最近的卡片索引
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

  // 视频自动播放控制（靠近屏幕中央自动播放，离开归零第 1 帧）
  function updateVideos() {
    const cards = getCards();
    if (!cards.length) return;
    const vCenter = window.innerHeight / 2;
    const nearestIdx = getNearestIndex();

    cards.forEach((card, i) => {
      const video = card.querySelector("video");
      if (!video) return;

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      const r = card.getBoundingClientRect();
      const cardCenter = r.top + r.height / 2;
      const diff = Math.abs(cardCenter - vCenter);

      // 卡片占据视野中央大半时平滑播放
      const isCentered = isSectionActive && (i === nearestIdx) && (diff < window.innerHeight * 0.48);

      if (isCentered) {
        if (video.paused) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
        if (video.currentTime > 0) {
          try { video.currentTime = 0; } catch (e) {}
        }
      }
    });
  }

  // 纯被动视差渲染（缩放、模糊、透明度、内部视频反向微位移）
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

      const media = item.querySelector(".vi-frame img, .vi-frame video, .volunteerImg, .volunteerVideo");
      if (media) {
        const parallaxY = signed * -12;
        media.style.transform = `translate3d(0, ${parallaxY.toFixed(2)}%, 0) scale(1.15)`;
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

  // 弹簧阻尼过冲回弹曲线
  function springSettleEasing(t) {
    return 1 - Math.pow(Math.E, -6 * t) * Math.cos(3.8 * t);
  }

  // 平滑弹簧对齐居中
  function snapToCard(targetIndex) {
    const cards = getCards();
    const targetCard = cards[targetIndex];
    if (!targetCard) return;

    isSnapping = true;
    const offset = -(window.innerHeight - targetCard.offsetHeight) / 2;

    if (window.MYCELIUM_LENIS && typeof window.MYCELIUM_LENIS.scrollTo === "function") {
      window.MYCELIUM_LENIS.scrollTo(targetCard, {
        offset: offset,
        duration: 0.65, // 更加干脆敏捷
        easing: springSettleEasing,
        onComplete: () => {
          setTimeout(() => {
            isSnapping = false;
            updateVideos();
          }, 60);
        }
      });
    } else {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        isSnapping = false;
        updateVideos();
      }, 700);
    }
  }

  // 调度被动刷新与防抖停稳纠偏
  function scheduleVisualUpdate() {
    if (!rafVisualId && isSectionActive) {
      rafVisualId = requestAnimationFrame(() => {
        renderVisuals();
        updateVideos();
      });
    }

    if (!isSectionActive || isDragging || isSnapping) return;

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

        // 偏离中线大于 24px 时平稳纠偏
        if (diff > 24 && diff < window.innerHeight * 0.45) {
          snapToCard(nearestIdx);
        }
      }, 190);
    }
  }

  // 滚轮介入打断吸附
  window.addEventListener("wheel", () => {
    clearTimeout(idleSnapTimer);
    if (isSnapping) isSnapping = false;
  }, { passive: true });

  // 光标动态感知
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
      const hoveredCard = targetEl?.closest(".volunteerCard") || cards.find(card => {
        const r = card.getBoundingClientRect();
        return clientY >= r.top && clientY <= r.bottom && clientX >= r.left && clientX <= r.right;
      });

      if (hoveredCard) {
        const cardIndex = cards.indexOf(hoveredCard);
        const rect = hoveredCard.getBoundingClientRect();
        const relY = (clientY - rect.top) / rect.height;

        if (relY < 0.22 && cardIndex > 0) {
          setCursorMode("up");
        } else if (relY > 0.78 && cardIndex < cards.length - 1) {
          setCursorMode("down");
        } else {
          setCursorMode("scroll");
        }
      } else {
        setCursorMode("scroll");
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

  // =========================================================================
  // 核心优化：高响应度双箭头 Scrub 拖拽与意图助推切卡
  // =========================================================================
  function onPointerDown(e) {
    if (!isSectionActive || e.button !== 0 || cursorOverInteractive) return;
    const cardEl = e.target.closest(".volunteerCard");
    if (!cardEl) return;

    isDragging = true;
    dragStartCardIdx = getNearestIndex(); // 记录起始卡片
    totalDragDeltaY = 0;
    pointerVelocityY = 0;
    lastPointerY = e.clientY;
    lastPointerTime = performance.now();
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
    const now = performance.now();
    const dt = Math.max(1, now - lastPointerTime);

    // 计算瞬时甩动速度 (px/ms)
    pointerVelocityY = -dy / dt;
    lastPointerY = currentY;
    lastPointerTime = now;
    pointerMoved += Math.abs(dy);
    totalDragDeltaY += dy;

    // 只要移动超过 6px 立即激活双箭头 Scrub 状态
    if (pointerMoved > 6 && !isScrubbing) {
      isScrubbing = true;
      setCursorMode("scrub");
    }

    // 核心提速：在 Scrub 状态下使用 2.5 倍高灵敏度响应，轻移即可大范围推移卡片
    const scrubGain = isScrubbing ? 2.5 : 1.3;
    window.scrollBy(0, -dy * scrubGain);
    scheduleVisualUpdate();
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    clearTimeout(longPressTimer);

    const wasScrub = isScrubbing;
    isScrubbing = false;
    const cards = getCards();

    // 1. 如果只是单纯轻击边缘箭头
    if (pointerMoved < 15 && !wasScrub) {
      const hoveredCard = e.target.closest(".volunteerCard") || cards.find(card => {
        const r = card.getBoundingClientRect();
        return e.clientY >= r.top && e.clientY <= r.bottom;
      });

      if (hoveredCard) {
        const cardIndex = cards.indexOf(hoveredCard);
        const rect = hoveredCard.getBoundingClientRect();
        const relY = (e.clientY - rect.top) / rect.height;

        if (relY < 0.22 && cardIndex > 0) {
          snapToCard(cardIndex - 1);
          return;
        } else if (relY > 0.78 && cardIndex < cards.length - 1) {
          snapToCard(cardIndex + 1);
          return;
        }
      }
      tapReady = true;
      tapReadyAt = performance.now();
      return;
    }

    tapReady = false;

    // 2. 核心助推判定：解决“容易弹回原地、难滑过去”的问题
    let targetIndex = getNearestIndex();

    // 如果当前计算出的最近卡片仍然是“起始卡片”（即处于过渡中段），感知用户的位移倾向或手势轻甩速度
    if (targetIndex === dragStartCardIdx) {
      // 向上拖动（鼠标上推 dy < 0，对应 totalDragDeltaY < 0，代表想要看下一张卡片）
      if ((totalDragDeltaY < -42 || pointerVelocityY > 0.3) && dragStartCardIdx < cards.length - 1) {
        targetIndex = dragStartCardIdx + 1;
      }
      // 向下拖动（鼠标下拉 dy > 0，对应 totalDragDeltaY > 0，代表想要看上一张卡片）
      else if ((totalDragDeltaY > 42 || pointerVelocityY < -0.3) && dragStartCardIdx > 0) {
        targetIndex = dragStartCardIdx - 1;
      }
    }

    // 带着意图顺势吸附到目标卡片
    snapToCard(targetIndex);
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
    const nearest = getNearestIndex();
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      if (nearest < cards.length - 1) {
        e.preventDefault();
        snapToCard(nearest + 1);
      }
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      if (nearest > 0) {
        e.preventDefault();
        snapToCard(nearest - 1);
      }
    }
  }

  function activate() {
    isSectionActive = true;
    section.setAttribute("aria-hidden", "false");

    const videos = section.querySelectorAll("video");
    videos.forEach(v => {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
    });

    scheduleVisualUpdate();
    setTimeout(scheduleVisualUpdate, 250);
  }

  function deactivate() {
    isSectionActive = false;
    isSnapping = false;
    clearTimeout(idleSnapTimer);
    section.setAttribute("aria-hidden", "true");
    hint.classList.remove("is-visible");
    section.classList.remove("vi-cursor-on");

    getCards().forEach((item) => {
      const video = item.querySelector("video");
      if (video) {
        video.pause();
        try { video.currentTime = 0; } catch (e) {}
      }

      const card = item.querySelector(".vi-card");
      if (card) {
        card.style.transform = "";
        card.style.opacity = "";
        card.style.filter = "";
      }
    });
  }

  // 事件监听
  window.addEventListener("scroll", scheduleVisualUpdate, { passive: true });
  window.addEventListener("resize", scheduleVisualUpdate, { passive: true });
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);

  window.addEventListener("click", () => { if (isSectionActive) updateVideos(); }, { passive: true });
  window.addEventListener("touchstart", () => { if (isSectionActive) updateVideos(); }, { passive: true });

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
// volunteer-strip.js — Flawless Momentum Scroll Snapping (Respects fast flicks)
(() => {
  "use strict";

  const section = document.getElementById("volunteer");
  const track = document.getElementById("volunteerTrack");
  const closeBtn = document.getElementById("volunteerCloseBtn");
  if (!section || !track) return;

  let isSectionActive = false;
  let rafVisualId = 0;
  
  // 物理动量侦测变量
  let isSnapping = false;
  let isUserTouching = false;
  let scrollEndRaf = 0;
  let stationaryFrames = 0;
  let lastCheckedScrollY = 0;

  // 监听用户是否正在触控屏幕
  window.addEventListener("touchstart", () => { isUserTouching = true; }, { passive: true });
  window.addEventListener("touchend", () => { isUserTouching = false; }, { passive: true });

  function getCards() {
    return Array.from(track.querySelectorAll(".volunteerCard"));
  }

  function isSectionInView() {
    if (!isSectionActive) return false;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    return rect.bottom > 40 && rect.top < vh - 40;
  }

  function getNearestIndex() {
    const cards = getCards();
    if (!cards.length) return 0;
    const vCenter = window.innerHeight / 2;
    let nearest = 0;
    let minDiff = Infinity;

    cards.forEach((card, i) => {
      const visualCard = card.querySelector('.vi-card') || card;
      const rect = visualCard.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const diff = Math.abs(cardCenter - vCenter);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = i;
      }
    });
    return nearest;
  }

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

      const visualCard = card.querySelector('.vi-card') || card;
      const r = visualCard.getBoundingClientRect();
      const cardCenter = r.top + r.height / 2;
      const diff = Math.abs(cardCenter - vCenter);

      const isCentered = isSectionActive && (i === nearestIdx) && (diff < window.innerHeight * 0.48);

      if (isCentered) {
        if (video.paused) {
          const playPromise = video.play();
          if (playPromise !== undefined) playPromise.catch(() => {});
        }
      } else {
        if (!video.paused) video.pause();
        if (video.currentTime > 0) {
          try { video.currentTime = 0; } catch (e) {}
        }
      }
    });
  }

  // 视差效果：卡片整体的缩放与模糊
  function renderVisuals() {
    rafVisualId = 0;
    if (!isSectionInView()) return;

    const cards = getCards();
    const vh = window.innerHeight || 1;
    const centerY = vh * 0.5;
    const halfH = vh * 0.5;

    cards.forEach((item) => {
      const visualCard = item.querySelector('.vi-card') || item;
      const r = visualCard.getBoundingClientRect();
      const itemCenter = r.top + r.height / 2;
      const signed = (itemCenter - centerY) / halfH;
      const dist = Math.abs(signed);
      const t = Math.min(1, dist);

      const scale = 1 - t * 0.04;
      const opacity = Math.max(0.42, 1 - t * 0.35);
      const blur = t * 1.3;

      if (visualCard) {
        visualCard.style.transform = `scale(${scale.toFixed(4)})`;
        visualCard.style.opacity = opacity.toFixed(3);
        visualCard.style.filter = blur > 0.08 ? `blur(${blur.toFixed(2)}px)` : "none";
      }

      const media = item.querySelector(".vi-frame img, .vi-frame video, .volunteerImg, .volunteerVideo");
      if (media) {
        const parallaxY = signed * -12;
        media.style.transform = `translate3d(0, ${parallaxY.toFixed(2)}%, 0) scale(1.15)`;
      }
    });
  }

  // 平滑吸附到离视口中心最近的卡片
  function snapToNearestCard() {
    if (isSnapping) return;
    const cards = getCards();
    const nearestIdx = getNearestIndex();
    const targetCard = cards[nearestIdx];
    if (!targetCard) return;

    const visualCard = targetCard.querySelector('.vi-card') || targetCard;
    const offset = -(window.innerHeight - visualCard.offsetHeight) / 2;
    
    // 如果已经在屏幕中央（容差3px），就不用再滚动了
    const r = visualCard.getBoundingClientRect();
    const cardCenter = r.top + r.height / 2;
    if (Math.abs(cardCenter - (window.innerHeight / 2)) < 3) return;

    isSnapping = true;

    if (window.MYCELIUM_LENIS && typeof window.MYCELIUM_LENIS.scrollTo === "function") {
      window.MYCELIUM_LENIS.scrollTo(visualCard, {
        offset: offset,
        duration: 0.6,
        easing: (t) => 1 - Math.pow(1 - t, 3), 
        onComplete: () => {
          isSnapping = false;
          updateVideos();
        }
      });
    } else {
      const targetY = window.scrollY + visualCard.getBoundingClientRect().top + offset;
      const startY = window.scrollY;
      const distance = targetY - startY;
      const startTime = performance.now();
      const duration = 400;

      function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, startY + distance * ease);
        if (progress < 1) requestAnimationFrame(step);
        else {
          isSnapping = false;
          updateVideos();
        }
      }
      requestAnimationFrame(step);
    }
  }

  // 核心修复：侦测系统惯性物理滑动的终点
  function monitorScrollEnd() {
    if (!isSectionActive || isSnapping) {
      scrollEndRaf = 0;
      return;
    }

    const currentY = window.scrollY;
    // 只有当滑动速度极慢（小于1.5像素），才算“停住了”一帧
    if (Math.abs(currentY - lastCheckedScrollY) < 1.5) {
      stationaryFrames++;
    } else {
      stationaryFrames = 0;
    }
    lastCheckedScrollY = currentY;

    // 当用户放开手，且屏幕物理惯性停稳超过 6 帧（约100ms），才执行居中
    if (!isUserTouching && stationaryFrames > 6) {
      scrollEndRaf = 0;
      stationaryFrames = 0;
      if (isSectionInView()) {
        snapToNearestCard();
      }
    } else {
      scrollEndRaf = requestAnimationFrame(monitorScrollEnd);
    }
  }

  function handleScroll() {
    if (!isSectionActive) return;

    if (!rafVisualId) {
      rafVisualId = requestAnimationFrame(() => {
        renderVisuals();
        updateVideos();
      });
    }

    // 每次发生滚动，启动/维持动量侦测器
    if (!scrollEndRaf && !isSnapping) {
      stationaryFrames = 0;
      lastCheckedScrollY = window.scrollY;
      scrollEndRaf = requestAnimationFrame(monitorScrollEnd);
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  
  // 鼠标滚轮打断居中吸附
  window.addEventListener("wheel", () => {
    isSnapping = false;
  }, { passive: true });

  function activate() {
    isSectionActive = true;
    section.setAttribute("aria-hidden", "false");

    const videos = section.querySelectorAll("video");
    videos.forEach(v => {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
    });

    handleScroll();
  }

  function deactivate() {
    isSectionActive = false;
    isSnapping = false;
    if (scrollEndRaf) cancelAnimationFrame(scrollEndRaf);
    scrollEndRaf = 0;
    section.setAttribute("aria-hidden", "true");

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

  // 兼容 Lenis
  function hookLenis() {
    if (window.MYCELIUM_LENIS && typeof window.MYCELIUM_LENIS.on === "function") {
      window.MYCELIUM_LENIS.on("scroll", handleScroll);
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
    refresh: handleScroll
  };

  if (document.body.classList.contains("show-volunteer")) activate();
})();
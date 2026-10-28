// Live news v2 — plays the selected region's news channels from YouTube.
// Classic script. Channels come from `liveNews` in country-config.js (window.MYCELIUM_COUNTRY_CONFIG).
//
// What it does
//  - Tabs are ordered: channels that are LIVE first, then the ones this visitor watches most
//    (remembered in localStorage on this device only), then the order in country-config.js.
//  - "Is it live?" needs a tiny status endpoint (workers/live-status.js). Without `liveStatusUrl` in
//    country-config.js no channel shows a badge and each one is simply attempted on Play.
//  - Pressing Play on a channel known to be offline asks whether to open its latest-news page instead.
//  - The player loads only on Play and is removed when hidden / off-screen / idle (saves data).
//  - The section and the player fade in and out so nothing pops in or vanishes abruptly.
(() => {
  const SECTION_ID = "liveNews";
  const UNLOAD_AFTER_HIDDEN_MS = 60 * 1000;
  const UNLOAD_AFTER_OFFSCREEN_MS = 60 * 1000;
  const UNLOAD_AFTER_IDLE_MS = 5 * 60 * 1000;
  const STATUS_REFRESH_MS = 5 * 60 * 1000;
  const FADE_MS = 380;
  const PREF_KEY = "mycelium-news-plays";

  const LABELS = {
    en: {
      kicker: "Live news", title: "Local news, live",
      sub: "Watch news channels for your region without leaving the community site.",
      play: "Play live", resume: "Resume live", loadsOnPlay: "The video loads only when you press play.",
      paused: "Paused to save data while you were away.",
      note: "If the video shows as unavailable, the channel is between broadcasts or has disabled embedding.",
      open: "Open on YouTube", channels: "News channels", credit: "Video is provided by YouTube and the channel owner.",
      live: "Live", offline: "Not live", readNews: "Not playing? Read the latest news",
      notLiveTitle: "Not live right now", notLiveBody: "{name} is not streaming at the moment. Open its latest news page instead?",
      openNews: "Open latest news", tryAnyway: "Try the player anyway", stay: "Stay here",
    },
    ms: {
      kicker: "Berita langsung", title: "Berita tempatan, secara langsung",
      sub: "Tonton saluran berita rantau anda tanpa meninggalkan laman komuniti.",
      play: "Main siaran langsung", resume: "Sambung siaran langsung", loadsOnPlay: "Video dimuatkan hanya apabila anda menekan main.",
      paused: "Dijeda untuk menjimatkan data semasa anda tiada.",
      note: "Jika video tidak tersedia, saluran sedang di antara siaran atau tidak membenarkan pembenaman.",
      open: "Buka di YouTube", channels: "Saluran berita", credit: "Video disediakan oleh YouTube dan pemilik saluran.",
      live: "Langsung", offline: "Tidak siaran", readNews: "Tidak dimainkan? Baca berita terkini",
      notLiveTitle: "Tiada siaran langsung sekarang", notLiveBody: "{name} tidak bersiaran buat masa ini. Buka halaman berita terkininya?",
      openNews: "Buka berita terkini", tryAnyway: "Cuba pemain juga", stay: "Kekal di sini",
    },
    "zh-CN": {
      kicker: "新闻直播", title: "本地新闻，实时收看",
      sub: "无需离开社区网站，即可收看所在地区的新闻频道。",
      play: "播放直播", resume: "继续观看直播", loadsOnPlay: "仅在您点击播放后才会加载视频。",
      paused: "您离开期间已暂停以节省流量。",
      note: "如果视频显示不可用，说明该频道当前不在直播时段，或不允许嵌入播放。",
      open: "在 YouTube 打开", channels: "新闻频道", credit: "视频由 YouTube 及频道所有者提供。",
      live: "直播中", offline: "未直播", readNews: "无法播放？阅读最新新闻",
      notLiveTitle: "当前没有直播", notLiveBody: "{name} 目前没有直播。是否改为打开它的最新新闻页面？",
      openNews: "打开最新新闻", tryAnyway: "仍然尝试播放", stay: "留在此页",
    },
  };

  const lang = () => (typeof currentLang === "string" && currentLang) || document.documentElement.lang || "en";
  const L = () => LABELS[lang()] || LABELS.en;
  const CHANNEL_ID = /^UC[\w-]{22}$/;
  const VIDEO_ID = /^[\w-]{11}$/;
  const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, calm() ? 0 : ms));

  let section = null;
  let all = [];              // validated channels in config order
  let order = [];            // channel ids in display order
  let status = {};           // id -> { live: boolean, videoId?: string }
  let activeId = "";
  let userPicked = false;
  let playing = false;
  let suspended = false;
  let hiddenTimer = 0;
  let offscreenTimer = 0;
  let idleTimer = 0;
  let statusTimer = 0;
  let lastActivity = Date.now();
  let frameToken = 0;

  // ---------- preference memory (this device only) ----------
  const readPlays = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}") || {}; } catch { return {}; } };
  const bumpPlays = (id) => {
    try { const plays = readPlays(); plays[id] = (plays[id] || 0) + 1; localStorage.setItem(PREF_KEY, JSON.stringify(plays)); } catch { /* storage unavailable */ }
  };

  function injectStyle() {
    if (document.getElementById("live-news-style")) return;
    const style = document.createElement("style");
    style.id = "live-news-style";
    style.textContent = `
      .live-news { padding: clamp(56px, 9vh, 104px) 5%; background: var(--paper, #f4f1e7); color: var(--ink, #1c2b25); }
      .live-news[hidden] { display: none; }
      .ln-inner { max-width: 1200px; margin: 0 auto; }
      .ln-js .ln-inner { opacity: 0; transform: translateY(40px); transition: opacity 1.1s var(--ease, ease), transform 1.1s var(--ease, ease); }
      .ln-scrub .ln-inner { transition: none; }
      .ln-js.is-visible .ln-inner { opacity: 1; transform: none; }
      .ln-sub { margin: 0 0 32px; color: var(--ink-soft, #526258); font-size: .95rem; max-width: 40rem; text-wrap: pretty; }
      .ln-layout { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); gap: clamp(24px, 4vw, 56px); align-items: start; }
      .ln-frame { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--pine, #183d32); border: 1px solid var(--line, rgba(24,61,50,.18)); border-radius: var(--cr-lg, 20px); corner-shape: var(--corner-shape, round); transition: opacity ${FADE_MS}ms var(--ease, ease); }
      .ln-frame.is-swapping { opacity: 0; }
      .ln-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; opacity: 0; transition: opacity .7s var(--ease, ease); }
      .ln-frame iframe.is-ready { opacity: 1; }
      .ln-poster { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 14px; width: 100%; padding: 24px; border: 0; background: var(--pine, #183d32); color: var(--paper, #f4f1e7); font: inherit; text-align: center; cursor: pointer; }
      .ln-poster:focus-visible { outline: 3px solid var(--copper-soft, #91a98a); outline-offset: -6px; }
      .ln-play { display: grid; place-items: center; width: 72px; height: 72px; border: 1.5px solid currentColor; border-radius: 50%; transition: transform .35s var(--ease, ease), background .3s ease; }
      .ln-poster:hover .ln-play, .ln-poster:focus-visible .ln-play { transform: scale(1.06); background: rgba(244,241,231,.12); }
      .ln-play svg { width: 28px; height: 28px; margin-left: 4px; fill: currentColor; }
      .ln-poster-title { font: 500 1.5rem/1.2 var(--serif, Georgia, serif); text-wrap: balance; }
      .ln-poster-hint { font-size: .8rem; opacity: .8; max-width: 26rem; text-wrap: pretty; }
      .ln-live-dot { display: inline-flex; align-items: center; gap: 8px; font: 700 .7rem var(--sans, sans-serif); letter-spacing: .18em; text-transform: uppercase; }
      .ln-live-dot::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #e0503a; box-shadow: 0 0 0 0 rgba(224,80,58,.6); animation: ln-pulse 1.8s infinite; }
      .ln-live-dot.is-off::before { background: rgba(244,241,231,.45); animation: none; }
      @keyframes ln-pulse { 70% { box-shadow: 0 0 0 9px rgba(224,80,58,0); } 100% { box-shadow: 0 0 0 0 rgba(224,80,58,0); } }
      .ln-dialog { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 14px; padding: 24px; background: var(--pine, #183d32); color: var(--paper, #f4f1e7); text-align: center; }
      .ln-dialog h3 { margin: 0; font: 500 1.5rem/1.2 var(--serif, Georgia, serif); }
      .ln-dialog p { margin: 0; max-width: 28rem; font-size: .9rem; line-height: 1.6; opacity: .88; text-wrap: pretty; }
      .ln-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 6px; }
      .ln-btn { padding: 12px 22px; border: 1px solid currentColor; border-radius: var(--corner-pill, 999px); background: transparent; color: inherit; font: 600 .78rem var(--sans, sans-serif); letter-spacing: .06em; text-decoration: none; cursor: pointer; transition: background-color .3s ease, color .3s ease, transform .35s var(--ease, ease); }
      .ln-btn:hover { transform: translateY(-1px); }
      .ln-btn.is-primary { background: var(--paper, #f4f1e7); border-color: var(--paper, #f4f1e7); color: var(--pine, #183d32); }
      .ln-side { display: grid; gap: 18px; }
      .ln-tabs { display: grid; gap: 8px; }
      .ln-tab { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 4px 12px; width: 100%; padding: 14px 16px; border: 1px solid var(--line, rgba(24,61,50,.18)); border-radius: var(--cr-sm, 12px); corner-shape: var(--corner-shape, round); background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; transition: background .25s ease, border-color .25s ease, color .25s ease; }
      .ln-tab:hover { background: rgba(24,61,50,.05); }
      .ln-tab:focus-visible { outline: 2px solid var(--copper, #75503d); outline-offset: 2px; }
      .ln-tab[aria-selected="true"] { border-color: var(--pine, #183d32); background: var(--pine, #183d32); color: var(--paper, #f4f1e7); }
      .ln-tab strong { font: 500 1.1rem/1.25 var(--serif, Georgia, serif); }
      .ln-tab small { grid-column: 1; font-size: .78rem; opacity: .78; }
      .ln-chip { grid-row: 1; grid-column: 2; display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: var(--corner-pill, 999px); font: 700 .62rem var(--sans, sans-serif); letter-spacing: .12em; text-transform: uppercase; background: rgba(224,80,58,.12); color: #b3392a; }
      .ln-tab[aria-selected="true"] .ln-chip { background: rgba(244,241,231,.16); color: var(--paper, #f4f1e7); }
      .ln-chip::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      .ln-chip.is-off { background: transparent; color: var(--ink-soft, #526258); opacity: .8; }
      .ln-chip.is-off::before { background: transparent; border: 1px solid currentColor; }
      .ln-note, .ln-credit { margin: 0; color: var(--ink-soft, #526258); font-size: .82rem; line-height: 1.6; text-wrap: pretty; }
      .ln-credit { font-size: .74rem; }
      .ln-links { display: flex; flex-wrap: wrap; gap: 8px 20px; }
      .ln-links a { color: var(--copper, #75503d); font-weight: 600; font-size: .85rem; text-underline-offset: 3px; }
      @media (max-width: 899px) { .ln-layout { grid-template-columns: 1fr; } .ln-frame { border-radius: var(--cr-md, 16px); } }
      @media (prefers-reduced-motion: reduce) {
        .ln-js .ln-inner, .ln-frame, .ln-frame iframe { transition: none; transform: none; }
        .ln-live-dot::before { animation: none; } .ln-play, .ln-btn { transition: none; }
      }
    `;
    document.head.append(style);
  }

  // ---------- config ----------
  const activeConfig = () => window.MYCELIUM_COUNTRY_CONFIG || {};
  const byId = (id) => all.find((c) => c.id === id);
  const current = () => byId(activeId);

  function readChannels(config = activeConfig()) {
    const list = Array.isArray(config.liveNews) ? config.liveNews : [];
    // Only well-formed IDs are accepted, so a typo in config can never produce an odd URL.
    return list.filter((c) => c && c.id && c.name && (CHANNEL_ID.test(c.youtubeChannelId || "") || VIDEO_ID.test(c.youtubeVideoId || "")));
  }

  function embedSrc(channel) {
    const base = "https://www.youtube-nocookie.com/embed/";
    const params = "autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1";
    const liveVideo = status[channel.id]?.videoId;
    if (liveVideo && VIDEO_ID.test(liveVideo)) return `${base}${encodeURIComponent(liveVideo)}?${params}`;
    return CHANNEL_ID.test(channel.youtubeChannelId || "")
      ? `${base}live_stream?channel=${encodeURIComponent(channel.youtubeChannelId)}&${params}`
      : `${base}${encodeURIComponent(channel.youtubeVideoId)}?${params}`;
  }
  const watchUrl = (channel) => CHANNEL_ID.test(channel.youtubeChannelId || "")
    ? `https://www.youtube.com/channel/${encodeURIComponent(channel.youtubeChannelId)}/live`
    : `https://www.youtube.com/watch?v=${encodeURIComponent(channel.youtubeVideoId)}`;
  const newsUrl = (channel) => (/^https:\/\//.test(channel.newsUrl || "") ? channel.newsUrl : watchUrl(channel));

  // ---------- ordering: live first, then most-watched, then config order ----------
  function computeOrder() {
    const plays = readPlays();
    order = all
      .map((channel, index) => ({ id: channel.id, index, live: status[channel.id]?.live === true ? 1 : 0, plays: plays[channel.id] || 0 }))
      .sort((a, b) => b.live - a.live || b.plays - a.plays || a.index - b.index)
      .map((entry) => entry.id);
    if (!activeId || !byId(activeId)) activeId = order[0] || "";
  }

  // ---------- DOM ----------
  function build() {
    section = document.createElement("section");
    section.id = SECTION_ID;
    section.className = "live-news";
    section.setAttribute("aria-labelledby", "liveNewsTitle");
    section.innerHTML = `<div class="ln-inner">
      <p class="section-kicker" data-ln="kicker"></p>
      <h2 class="section-title" id="liveNewsTitle" data-ln="title"></h2>
      <p class="ln-sub" data-ln="sub"></p>
      <div class="ln-layout">
        <div class="ln-frame" id="lnFrame"></div>
        <div class="ln-side">
          <div class="ln-tabs" id="lnTabs" role="tablist" aria-label=""></div>
          <p class="ln-note" data-ln="note"></p>
          <div class="ln-links"><a id="lnExternal" target="_blank" rel="noopener noreferrer"></a><a id="lnNews" target="_blank" rel="noopener noreferrer"></a></div>
          <p class="ln-credit" data-ln="credit"></p>
        </div>
      </div>
    </div>`;
    const airQuality = document.getElementById("airQuality");
    const footer = document.querySelector(".footer");
    if (airQuality) airQuality.before(section);
    else if (footer) footer.before(section);
    else document.body.append(section);
  }

  function applyLabels() {
    const l = L();
    section.querySelectorAll("[data-ln]").forEach((el) => { el.textContent = l[el.dataset.ln] || ""; });
    section.querySelector("#lnTabs").setAttribute("aria-label", l.channels);
    section.querySelector("#lnExternal").textContent = `${l.open} ↗`;
    section.querySelector("#lnNews").textContent = `${l.readNews} ↗`;
  }

  function renderTabs() {
    const tabs = section.querySelector("#lnTabs");
    const l = L();
    tabs.replaceChildren();
    tabs.hidden = all.length < 2;
    order.forEach((id) => {
      const channel = byId(id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ln-tab";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(id === activeId));
      const name = document.createElement("strong");
      name.textContent = channel.name;
      button.append(name);
      const known = status[id];
      if (known) {
        const chip = document.createElement("span");
        chip.className = `ln-chip${known.live ? "" : " is-off"}`;
        chip.textContent = known.live ? l.live : l.offline;
        button.append(chip);
      }
      if (channel.description) {
        const description = document.createElement("small");
        description.textContent = channel.description;
        button.append(description);
      }
      button.addEventListener("click", () => selectChannel(id));
      tabs.append(button);
    });
  }

  function refreshLinks() {
    const channel = current();
    if (!channel) return;
    section.querySelector("#lnExternal").href = watchUrl(channel);
    section.querySelector("#lnNews").href = newsUrl(channel);
  }

  // Cross-fade the frame contents so nothing pops in or out
  async function swapFrame(node) {
    const token = ++frameToken;
    const frame = section.querySelector("#lnFrame");
    frame.classList.add("is-swapping");
    await wait(FADE_MS);
    if (token !== frameToken) return;
    frame.replaceChildren(node);
    refreshLinks();
    requestAnimationFrame(() => frame.classList.remove("is-swapping"));
  }

  function posterNode() {
    const channel = current();
    const l = L();
    const known = status[channel.id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ln-poster";
    button.innerHTML = `<span class="ln-live-dot"></span>
      <span class="ln-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
      <span class="ln-poster-title"></span><span class="ln-poster-hint"></span>`;
    const dot = button.querySelector(".ln-live-dot");
    dot.textContent = known && !known.live ? l.offline : "LIVE";
    dot.classList.toggle("is-off", Boolean(known && !known.live));
    button.querySelector(".ln-poster-title").textContent = `${suspended ? l.resume : l.play} · ${channel.name}`;
    button.querySelector(".ln-poster-hint").textContent = suspended ? l.paused : l.loadsOnPlay;
    button.addEventListener("click", onPlayClicked);
    return button;
  }

  function dialogNode() {
    const channel = current();
    const l = L();
    const box = document.createElement("div");
    box.className = "ln-dialog";
    box.setAttribute("role", "alertdialog");
    box.setAttribute("aria-label", l.notLiveTitle);
    const title = document.createElement("h3");
    title.textContent = l.notLiveTitle;
    const body = document.createElement("p");
    body.textContent = l.notLiveBody.replace("{name}", channel.name);
    const actions = document.createElement("div");
    actions.className = "ln-actions";
    const open = document.createElement("a");
    open.className = "ln-btn is-primary";
    open.href = newsUrl(channel);
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    open.textContent = `${l.openNews} ↗`;
    const tryButton = document.createElement("button");
    tryButton.type = "button";
    tryButton.className = "ln-btn";
    tryButton.textContent = l.tryAnyway;
    tryButton.addEventListener("click", play);
    const stay = document.createElement("button");
    stay.type = "button";
    stay.className = "ln-btn";
    stay.textContent = l.stay;
    stay.addEventListener("click", () => swapFrame(posterNode()));
    actions.append(open, tryButton, stay);
    box.append(title, body, actions);
    return box;
  }

  const showPoster = () => swapFrame(posterNode());

  // ---------- playing ----------
  function onPlayClicked() {
    const known = status[activeId];
    if (known && known.live === false) { swapFrame(dialogNode()); return; } // known offline: ask first
    play();
  }

  function play() {
    const channel = current();
    if (!channel) return;
    const iframe = document.createElement("iframe");
    iframe.src = embedSrc(channel);
    iframe.title = `${channel.name} — ${L().kicker}`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    const reveal = () => iframe.classList.add("is-ready");
    iframe.addEventListener("load", reveal, { once: true });
    setTimeout(reveal, 4000); // never leave the frame blank if load never fires
    playing = true;
    suspended = false;
    lastActivity = Date.now();
    bumpPlays(channel.id);
    startIdleWatch();
    swapFrame(iframe);
  }

  function unload(automatic) {
    if (!playing) return;
    playing = false;
    suspended = Boolean(automatic);
    clearTimeout(hiddenTimer);
    clearTimeout(offscreenTimer);
    clearInterval(idleTimer);
    showPoster();
  }

  function selectChannel(id) {
    userPicked = true;
    const wasPlaying = playing;
    if (id === activeId && !wasPlaying) { onPlayClicked(); return; }
    activeId = id;
    playing = false;
    suspended = false;
    renderTabs();
    refreshLinks();
    if (wasPlaying) {
      const known = status[id];
      if (known && known.live === false) swapFrame(dialogNode()); else play();
    } else showPoster();
  }

  // ---------- save bandwidth: hidden tab, scrolled away, idle ----------
  function startIdleWatch() {
    clearInterval(idleTimer);
    idleTimer = setInterval(() => { if (playing && Date.now() - lastActivity > UNLOAD_AFTER_IDLE_MS) unload(true); }, 30 * 1000);
  }
  ["pointermove", "keydown", "touchstart", "wheel"].forEach((type) => {
    window.addEventListener(type, () => { lastActivity = Date.now(); }, { passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    clearTimeout(hiddenTimer);
    if (document.hidden && playing) hiddenTimer = setTimeout(() => unload(true), UNLOAD_AFTER_HIDDEN_MS);
  });

  // Scroll-linked fade: the whole section fades IN as it rises into view and fades OUT as it leaves,
  // tied to the scroll position (so it is clearly visible and reverses when you scroll back).
  // Uses the site's GSAP + ScrollTrigger (shared with Lenis); falls back to class-based fades without them.
  // Opacity and a small lift only: no blur/filter, which would force the video layer to re-composite.
function watchVisibility() {
    if (!("IntersectionObserver" in window) || calm()) { section.classList.add("is-visible"); return; }
    new IntersectionObserver(([entry]) => {
      section.classList.toggle("is-visible", entry.isIntersecting && entry.intersectionRatio > 0.12);
      if (!entry.isIntersecting) {
        clearTimeout(offscreenTimer);
        if (playing) offscreenTimer = setTimeout(() => unload(true), UNLOAD_AFTER_OFFSCREEN_MS);
      } else {
        clearTimeout(offscreenTimer);
      }
    }, { threshold: [0, 0.12, 0.3] }).observe(section);
    
    // Safety fallback: if it's already in viewport but hasn't triggered
    setTimeout(() => {
      if (!section.classList.contains("is-visible") && section.getBoundingClientRect().top < innerHeight) section.classList.add("is-visible");
    }, 1000);
  }
  // ---------- live status (optional endpoint) ----------
  async function refreshStatus() {
    const url = activeConfig().liveStatusUrl;
    if (!/^https:\/\//.test(url || "") || !all.length) return;
    const ids = all.map((c) => c.youtubeChannelId).filter(Boolean).join(",");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}ids=${encodeURIComponent(ids)}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = await response.json();
      status = {};
      all.forEach((c) => {
        const entry = data?.[c.youtubeChannelId];
        if (entry && typeof entry.live === "boolean") status[c.id] = { live: entry.live, videoId: VIDEO_ID.test(entry.videoId || "") ? entry.videoId : "" };
      });
      if (!playing) {
        computeOrder();
        if (!userPicked) activeId = order[0] || activeId; // follow the live channel until the visitor chooses
        renderTabs();
        showPoster();
      } else renderTabs();
    } catch (error) {
      console.warn("[live-news] status endpoint unavailable; badges hidden", error);
    } finally {
      clearTimeout(timer);
    }
  }

  function refresh(config) {
    all = readChannels(config);
    status = {};
    playing = false;
    suspended = false;
    userPicked = false;
    activeId = "";
    clearInterval(idleTimer);
    clearInterval(statusTimer);
    section.hidden = all.length === 0; // a region with no channels simply has no news section
    if (!all.length) return;
    computeOrder();
    applyLabels();
    renderTabs();
    section.querySelector("#lnFrame").replaceChildren(posterNode());
    refreshLinks();
    refreshStatus();
    if (/^https:\/\//.test(activeConfig().liveStatusUrl || "")) {
      statusTimer = setInterval(() => { if (!document.hidden) refreshStatus(); }, STATUS_REFRESH_MS);
    }
    window.MYCELIUM_SCROLL_TRIGGER?.refresh();
  }

  function init() {
    if (document.getElementById(SECTION_ID)) return;
    injectStyle();
    build();
    section.classList.add("ln-js");
    watchVisibility();
    refresh();
    window.addEventListener("mycelium:countrychange", (event) => refresh(event.detail));
    window.addEventListener("mycelium:languagechange", () => {
      if (section.hidden) return;
      applyLabels();
      renderTabs();
      if (!playing) section.querySelector("#lnFrame").replaceChildren(posterNode());
    });
    requestAnimationFrame(() => window.MYCELIUM_SCROLL_TRIGGER?.refresh());
  }

  // Run after the module scripts (country-selector.js) have set window.MYCELIUM_COUNTRY_CONFIG.
  if (document.readyState === "complete") init();
  else document.addEventListener("DOMContentLoaded", init, { once: true });
  // Safety net: if the region config was not ready at DOMContentLoaded, try once more after load.
  window.addEventListener("load", () => { if (section && section.hidden) refresh(); }, { once: true });
})();

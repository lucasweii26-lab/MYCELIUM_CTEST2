// Air quality: current US AQI, main pollutants and a 36-hour trend for the selected region.
// Classic script. Location comes from `airQuality` (or `coordinates`) in country-config.js.
//
// Data: Open-Meteo Air Quality API (free, no key; CAMS model data). These are modelled estimates, not
// readings from a government monitoring station, and the scale is the US AQI (not Malaysia's API scale),
// so the section says so and links to the official source configured for the region.
// Open-Meteo's free tier is for non-commercial use and requires attribution (included below).
(() => {
  const SECTION_ID = "airQuality";
  const ENDPOINT = "https://air-quality-api.open-meteo.com/v1/air-quality";
  const CACHE_MS = 15 * 60 * 1000;
  const REFRESH_MS = 15 * 60 * 1000;
  const TIMEOUT_MS = 10 * 1000;

  // US AQI bands. `bg`/`fg` are chosen for readable contrast on both light and dark chips.
  const BANDS = [
    { max: 50, key: "good", bg: "#3f7a4e", fg: "#ffffff" },
    { max: 100, key: "moderate", bg: "#d8b343", fg: "#1c2b25" },
    { max: 150, key: "sensitive", bg: "#e08e3a", fg: "#1c2b25" },
    { max: 200, key: "unhealthy", bg: "#c0392b", fg: "#ffffff" },
    { max: 300, key: "veryUnhealthy", bg: "#8e44ad", fg: "#ffffff" },
    { max: Infinity, key: "hazardous", bg: "#7e2a3a", fg: "#ffffff" },
  ];

  const POLLUTANTS = [
    ["pm2_5", "PM2.5", "µg/m³"], ["pm10", "PM10", "µg/m³"],
    ["ozone", "O₃", "µg/m³"], ["nitrogen_dioxide", "NO₂", "µg/m³"],
  ];

  const LABELS = {
    en: {
      kicker: "Air quality", title: "Air quality today", sub: "Estimated US AQI for your community's area, updated through the day.",
      loading: "Loading air quality…", error: "Air quality data is unavailable right now.", retry: "Try again",
      aqi: "US AQI", updated: "Updated", trend: "Last 24 hours and next 12 hours", now: "Now",
      pollutants: "Main pollutants", official: "Official readings",
      source: "Modelled estimate from Copernicus Atmosphere Monitoring Service data via Open-Meteo. It is not an official monitoring-station reading.",
      good: "Good", moderate: "Moderate", sensitive: "Unhealthy for sensitive groups", unhealthy: "Unhealthy", veryUnhealthy: "Very unhealthy", hazardous: "Hazardous",
      adviceGood: "Air quality is satisfactory. It is a good time to be outdoors.",
      adviceModerate: "Acceptable for most people. Unusually sensitive people may want to take it easier outdoors.",
      adviceSensitive: "Children, older adults and people with heart or lung conditions should limit long outdoor exertion.",
      adviceUnhealthy: "Everyone should reduce prolonged outdoor exertion. Sensitive groups should stay indoors where possible.",
      adviceVeryUnhealthy: "Avoid outdoor activity where you can. Keep windows closed.",
      adviceHazardous: "Stay indoors with windows closed and follow guidance from local authorities.",
    },
    ms: {
      kicker: "Kualiti udara", title: "Kualiti udara hari ini", sub: "Anggaran AQI AS untuk kawasan komuniti anda, dikemas kini sepanjang hari.",
      loading: "Memuatkan kualiti udara…", error: "Data kualiti udara tidak tersedia buat masa ini.", retry: "Cuba lagi",
      aqi: "AQI AS", updated: "Dikemas kini", trend: "24 jam lalu dan 12 jam akan datang", now: "Kini",
      pollutants: "Bahan pencemar utama", official: "Bacaan rasmi",
      source: "Anggaran model daripada data Copernicus Atmosphere Monitoring Service melalui Open-Meteo. Ia bukan bacaan stesen pemantauan rasmi.",
      good: "Baik", moderate: "Sederhana", sensitive: "Tidak sihat untuk kumpulan sensitif", unhealthy: "Tidak sihat", veryUnhealthy: "Sangat tidak sihat", hazardous: "Berbahaya",
      adviceGood: "Kualiti udara memuaskan. Waktu yang sesuai untuk berada di luar.",
      adviceModerate: "Boleh diterima oleh kebanyakan orang. Mereka yang sangat sensitif perlu mengurangkan aktiviti luar.",
      adviceSensitive: "Kanak-kanak, warga emas dan mereka yang mempunyai masalah jantung atau paru-paru perlu mengehadkan aktiviti lasak di luar.",
      adviceUnhealthy: "Semua orang perlu mengurangkan aktiviti lasak yang lama di luar. Kumpulan sensitif sebaiknya kekal di dalam rumah.",
      adviceVeryUnhealthy: "Elakkan aktiviti luar jika boleh. Tutup tingkap.",
      adviceHazardous: "Kekal di dalam rumah dengan tingkap tertutup dan ikut panduan pihak berkuasa tempatan.",
    },
    "zh-CN": {
      kicker: "空气质量", title: "今日空气质量", sub: "社区所在区域的美国 AQI 估算值，全天更新。",
      loading: "正在加载空气质量…", error: "暂时无法获取空气质量数据。", retry: "重试",
      aqi: "美国 AQI", updated: "更新于", trend: "过去 24 小时与未来 12 小时", now: "现在",
      pollutants: "主要污染物", official: "官方实测数据",
      source: "数据为经 Open-Meteo 提供的哥白尼大气监测服务（CAMS）模型估算，并非监测站官方实测值。",
      good: "优", moderate: "良", sensitive: "对敏感人群不健康", unhealthy: "不健康", veryUnhealthy: "非常不健康", hazardous: "危险",
      adviceGood: "空气质量令人满意，适合户外活动。",
      adviceModerate: "多数人可接受。特别敏感的人群应适当减少户外活动。",
      adviceSensitive: "儿童、老年人以及心肺疾病患者应减少长时间户外剧烈活动。",
      adviceUnhealthy: "所有人应减少长时间户外剧烈活动，敏感人群尽量留在室内。",
      adviceVeryUnhealthy: "尽量避免户外活动，并关闭门窗。",
      adviceHazardous: "请留在室内并关闭门窗，遵循当地部门的指引。",
    },
  };

  const lang = () => (typeof currentLang === "string" && currentLang) || document.documentElement.lang || "en";
  const L = () => LABELS[lang()] || LABELS.en;
  const bandFor = (aqi) => BANDS.find((band) => aqi <= band.max);
  const num = (value, digits = 0) => (Number.isFinite(value) ? Number(value).toFixed(digits) : "—");
  const adviceKey = (band) => `advice${band.key[0].toUpperCase()}${band.key.slice(1)}`;

  let section = null;
  let state = { status: "idle", data: null };
  let refreshTimer = 0;
  let loaded = false;
  let inFlight = null;

  function injectStyle() {
    if (document.getElementById("air-quality-style")) return;
    const style = document.createElement("style");
    style.id = "air-quality-style";
    style.textContent = `
      .air-quality { padding: clamp(56px, 9vh, 104px) 5%; background: var(--linen, #e5e9dc); color: var(--ink, #1c2b25); }
      .air-quality[hidden] { display: none; }
      .aq-inner { max-width: 1200px; margin: 0 auto; }
      .aq-sub { margin: 0 0 32px; color: var(--ink-soft, #526258); font-size: .95rem; max-width: 40rem; }
      .aq-card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: clamp(24px, 4vw, 56px); padding: clamp(24px, 4vw, 44px); background: var(--paper, #f4f1e7); border: 1px solid var(--line, rgba(24,61,50,.18)); }
      .aq-status { padding: 28px 0; color: var(--ink-soft, #526258); }
      .aq-status button { margin-left: 12px; padding: 8px 14px; border: 1px solid var(--pine, #183d32); background: transparent; color: var(--pine, #183d32); font: 600 .78rem var(--sans, sans-serif); cursor: pointer; }
      .aq-place { margin: 0 0 6px; font: 600 .72rem var(--sans, sans-serif); letter-spacing: .16em; text-transform: uppercase; color: var(--copper, #75503d); }
      .aq-value { display: flex; align-items: baseline; gap: 12px; }
      .aq-number { font: 500 clamp(4rem, 9vw, 6.5rem)/1 var(--serif, Georgia, serif); color: var(--pine, #183d32); }
      .aq-unit { font: 600 .8rem var(--sans, sans-serif); letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft, #526258); }
      .aq-chip { display: inline-block; margin: 12px 0 14px; padding: 7px 14px; font: 700 .8rem var(--sans, sans-serif); letter-spacing: .04em; }
      .aq-advice { margin: 0 0 14px; max-width: 28rem; line-height: 1.65; }
      .aq-meta { margin: 0; color: var(--ink-soft, #526258); font-size: .78rem; }
      .aq-scale { display: flex; height: 6px; margin: 4px 0 22px; overflow: hidden; }
      .aq-scale i { flex: 1; }
      .aq-h { margin: 0 0 10px; font: 600 .72rem var(--sans, sans-serif); letter-spacing: .16em; text-transform: uppercase; color: var(--copper, #75503d); }
      .aq-pollutants { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 0 0 26px; padding: 0; list-style: none; }
      .aq-pollutants li { padding: 12px; border: 1px solid var(--line, rgba(24,61,50,.18)); }
      .aq-pollutants b { display: block; font: 500 1.4rem/1.1 var(--serif, Georgia, serif); color: var(--pine, #183d32); }
      .aq-pollutants span { display: block; margin-top: 4px; font-size: .72rem; color: var(--ink-soft, #526258); }
      .aq-chart { display: block; width: 100%; height: auto; }
      .aq-links { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 10px 24px; margin-top: 20px; }
      .aq-source { margin: 0; max-width: 46rem; font-size: .74rem; line-height: 1.6; color: var(--ink-soft, #526258); }
      .aq-source a, .aq-official { color: var(--copper, #75503d); font-weight: 600; text-underline-offset: 3px; }
      .aq-official { font-size: .85rem; }
      @media (max-width: 899px) { .aq-card { grid-template-columns: 1fr; } .aq-pollutants { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    `;
    document.head.append(style);
  }

  function build() {
    section = document.createElement("section");
    section.id = SECTION_ID;
    section.className = "air-quality";
    section.setAttribute("aria-labelledby", "airQualityTitle");
    section.innerHTML = `<div class="aq-inner">
      <p class="section-kicker" data-aq="kicker"></p>
      <h2 class="section-title" id="airQualityTitle" data-aq="title"></h2>
      <p class="aq-sub" data-aq="sub"></p>
      <div id="aqBody" aria-live="polite"></div>
      <div class="aq-links"><p class="aq-source"><span data-aq="source"></span> <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · <a href="https://atmosphere.copernicus.eu/" target="_blank" rel="noopener noreferrer">CAMS</a></p><a class="aq-official" id="aqOfficial" target="_blank" rel="noopener noreferrer" hidden></a></div>
    </div>`;
    const liveNews = document.getElementById("liveNews");
    const footer = document.querySelector(".footer");
    if (liveNews) liveNews.after(section);
    else if (footer) footer.before(section);
    else document.body.append(section);
  }

  function config() {
    const site = window.MYCELIUM_COUNTRY_CONFIG || {};
    const aq = site.airQuality || {};
    const latitude = Number(aq.latitude ?? site.coordinates?.latitude);
    const longitude = Number(aq.longitude ?? site.coordinates?.longitude);
    return {
      code: site.code || window.MYCELIUM_COUNTRY || "MY",
      place: aq.place || site.name || "",
      latitude, longitude,
      valid: Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180,
      officialUrl: /^https:\/\//.test(aq.officialUrl || "") ? aq.officialUrl : "",
      officialLabel: aq.officialLabel || "",
    };
  }

  // ---- data ----
  function cacheKey(cfg) { return `mycelium-aqi:${cfg.latitude.toFixed(2)},${cfg.longitude.toFixed(2)}`; }

  async function fetchData(cfg, force) {
    if (!force) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey(cfg)) || "null");
        if (cached && Date.now() - cached.t < CACHE_MS) return cached.data;
      } catch { /* storage unavailable or corrupt: ignore */ }
    }
    const params = new URLSearchParams({
      latitude: cfg.latitude.toFixed(4), longitude: cfg.longitude.toFixed(4),
      current: "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide",
      hourly: "us_aqi", past_days: "1", forecast_days: "2", timezone: "auto",
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${ENDPOINT}?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Open-Meteo responded ${response.status}`);
      const data = await response.json();
      if (!data?.current || !Number.isFinite(data.current.us_aqi)) throw new Error("No AQI value for this location");
      try { sessionStorage.setItem(cacheKey(cfg), JSON.stringify({ t: Date.now(), data })); } catch { /* ignore */ }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function load(force = false) {
    const cfg = config();
    if (!cfg.valid) { section.hidden = true; return; }
    section.hidden = false;
    if (inFlight) return inFlight;
    if (state.status !== "ok") { state = { status: "loading", data: null }; render(); }
    inFlight = fetchData(cfg, force)
      .then((data) => { state = { status: "ok", data }; })
      .catch((error) => {
        console.warn("[air-quality] could not load data", error);
        if (state.status !== "ok") state = { status: "error", data: null }; // keep showing older data if we have it
      })
      .finally(() => { inFlight = null; render(); });
    return inFlight;
  }

  // ---- rendering ----
  function trendWindow(data) {
    const times = data.hourly?.time || [];
    const values = data.hourly?.us_aqi || [];
    let nowIndex = -1;
    times.forEach((t, i) => { if (t <= data.current.time) nowIndex = i; }); // ISO strings compare chronologically
    if (nowIndex < 0) return null;
    const from = Math.max(0, nowIndex - 24);
    const to = Math.min(times.length - 1, nowIndex + 12);
    const points = [];
    for (let i = from; i <= to; i += 1) if (Number.isFinite(values[i])) points.push({ i, t: times[i], v: values[i] });
    return points.length > 2 ? { points, nowIndex } : null;
  }

  function chartSvg(data, band) {
    const win = trendWindow(data);
    if (!win) return "";
    const W = 600; const H = 150; const padL = 30; const padR = 8; const padT = 10; const padB = 22;
    const { points, nowIndex } = win;
    const maxV = Math.max(100, Math.ceil(Math.max(...points.map((p) => p.v)) / 50) * 50);
    const x = (k) => padL + (k / (points.length - 1)) * (W - padL - padR);
    const y = (v) => padT + (1 - v / maxV) * (H - padT - padB);
    const line = points.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const area = `${line} L${x(points.length - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
    const nowK = points.findIndex((p) => p.i === nowIndex);
    const guides = [50, 100, 150, 200, 300].filter((g) => g < maxV).map((g) =>
      `<line x1="${padL}" x2="${W - padR}" y1="${y(g).toFixed(1)}" y2="${y(g).toFixed(1)}" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="3 4"/><text x="${padL - 6}" y="${(y(g) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".6">${g}</text>`).join("");
    const label = (k, text, anchor) => `<text x="${x(k).toFixed(1)}" y="${H - 6}" text-anchor="${anchor}" font-size="10" fill="currentColor" fill-opacity=".6">${text}</text>`;
    const hhmm = (p) => p.t.slice(11, 16);
    const summary = `${L().trend}: ${L().aqi} ${num(points[0].v)} → ${num(points[nowK >= 0 ? nowK : points.length - 1].v)} → ${num(points[points.length - 1].v)}`;
    return `<svg class="aq-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${summary}" style="color:var(--ink,#1c2b25)">
      ${guides}
      <path d="${area}" fill="${band.bg}" fill-opacity=".18"/>
      <path d="${line}" fill="none" stroke="${band.bg}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${nowK >= 0 ? `<line x1="${x(nowK).toFixed(1)}" x2="${x(nowK).toFixed(1)}" y1="${padT}" y2="${H - padB}" stroke="currentColor" stroke-opacity=".35"/><circle cx="${x(nowK).toFixed(1)}" cy="${y(points[nowK].v).toFixed(1)}" r="5" fill="${band.bg}" stroke="#fff" stroke-width="2"/>${label(nowK, L().now, "middle")}` : ""}
      ${label(0, hhmm(points[0]), "start")}${label(points.length - 1, hhmm(points[points.length - 1]), "end")}
    </svg>`;
  }

  function render() {
    if (!section) return;
    const l = L();
    section.querySelectorAll("[data-aq]").forEach((el) => { el.textContent = l[el.dataset.aq] || ""; });
    const cfg = config();
    const official = section.querySelector("#aqOfficial");
    official.hidden = !cfg.officialUrl;
    if (cfg.officialUrl) {
      official.href = cfg.officialUrl;
      official.textContent = `${cfg.officialLabel || l.official} ↗`;
    }
    const body = section.querySelector("#aqBody");

    if (state.status === "loading" || state.status === "idle") {
      body.innerHTML = `<div class="aq-card"><p class="aq-status">${l.loading}</p></div>`;
      return;
    }
    if (state.status === "error") {
      body.innerHTML = `<div class="aq-card"><p class="aq-status">${l.error}<button type="button" id="aqRetry">${l.retry}</button></p></div>`;
      body.querySelector("#aqRetry").addEventListener("click", () => load(true));
      return;
    }
    const data = state.data;
    const aqi = Math.round(data.current.us_aqi);
    const band = bandFor(aqi);
    const tiles = POLLUTANTS.map(([key, name, unit]) => `<li><b>${num(data.current[key], key === "pm2_5" || key === "pm10" ? 1 : 0)}</b><span>${name} · ${unit}</span></li>`).join("");
    body.innerHTML = `<div class="aq-card">
      <div>
        <p class="aq-place"></p>
        <div class="aq-value"><span class="aq-number">${aqi}</span><span class="aq-unit">${l.aqi}</span></div>
        <span class="aq-chip" style="background:${band.bg};color:${band.fg}">${l[band.key]}</span>
        <div class="aq-scale" aria-hidden="true">${BANDS.map((b) => `<i style="background:${b.bg}"></i>`).join("")}</div>
        <p class="aq-advice">${l[adviceKey(band)]}</p>
        <p class="aq-meta">${l.updated} ${String(data.current.time).slice(11, 16)}</p>
      </div>
      <div>
        <h3 class="aq-h">${l.pollutants}</h3>
        <ul class="aq-pollutants">${tiles}</ul>
        <h3 class="aq-h">${l.trend}</h3>
        ${chartSvg(data, band)}
      </div>
    </div>`;
    body.querySelector(".aq-place").textContent = cfg.place; // config text: set as text, never as HTML
  }

  // ---- lifecycle ----
  function startWhenNear() {
    const begin = () => {
      if (loaded) return;
      loaded = true;
      load();
      clearInterval(refreshTimer);
      refreshTimer = setInterval(() => { if (!document.hidden) load(true); }, REFRESH_MS);
    };
    if (!("IntersectionObserver" in window)) { begin(); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); begin(); }
    }, { rootMargin: "400px 0px" });
    observer.observe(section);
  }

  function init() {
    if (document.getElementById(SECTION_ID)) return;
    injectStyle();
    build();
    render();
    startWhenNear();
    window.addEventListener("mycelium:languagechange", render);
    window.addEventListener("mycelium:countrychange", () => {
      state = { status: "idle", data: null };
      if (loaded) load(true); else render();
    });
    requestAnimationFrame(() => window.MYCELIUM_SCROLL_TRIGGER?.refresh());
  }

  if (document.readyState === "complete") init();
  else document.addEventListener("DOMContentLoaded", init, { once: true });
})();
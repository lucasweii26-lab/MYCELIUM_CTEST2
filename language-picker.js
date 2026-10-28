/* ==========================================================================
   MYCELIUM - language registry, locale loader and language dialog

   Loaded as a classic script BEFORE app.js, so app.js can use window.MYCELIUM_LANGS.

   How languages work
   - en, es, zh-CN, ms, ta are built into app.js (the `i18n` object).
   - Every other language is a JSON pack at locales/<code>.json. A pack may be partial: any key it
     does not have falls back to English. locales/manifest.json lists the packs that exist; only those
     languages appear in the dialog. Generate packs with scripts/translate-locales.mjs.
   - Content that comes from Firestore keeps its own fallback chain (selected language -> _en -> legacy
     field), so a language without Firestore fields simply shows the English content.
   ========================================================================== */
(() => {
  "use strict";

  const BUILT_IN = ["en", "es", "zh-CN", "ms", "ta"];

  // code, native name, English name, optional dir / Google font family for non-Latin scripts
  const LANGUAGES = [
    ["en", "English", "English"],
    ["es", "Español", "Spanish"],
    ["zh-CN", "简体中文", "Chinese (Simplified)"],
    ["ms", "Bahasa Melayu", "Malay"],
    ["ta", "தமிழ்", "Tamil"],

    ["ar", "العربية", "Arabic", { dir: "rtl", font: "Noto Sans Arabic" }],
    ["bg", "Български", "Bulgarian"],
    ["bn", "বাংলা", "Bengali", { font: "Noto Sans Bengali" }],
    ["cs", "Čeština", "Czech"],
    ["da", "Dansk", "Danish"],
    ["de", "Deutsch", "German"],
    ["el", "Ελληνικά", "Greek"],
    ["fa", "فارسی", "Persian", { dir: "rtl", font: "Noto Sans Arabic" }],
    ["fi", "Suomi", "Finnish"],
    ["fil", "Filipino", "Filipino"],
    ["fr", "Français", "French"],
    ["gu", "ગુજરાતી", "Gujarati", { font: "Noto Sans Gujarati" }],
    ["he", "עברית", "Hebrew", { dir: "rtl", font: "Noto Sans Hebrew" }],
    ["hi", "हिन्दी", "Hindi", { font: "Noto Sans Devanagari" }],
    ["hr", "Hrvatski", "Croatian"],
    ["hu", "Magyar", "Hungarian"],
    ["id", "Bahasa Indonesia", "Indonesian"],
    ["it", "Italiano", "Italian"],
    ["ja", "日本語", "Japanese", { font: "Noto Sans JP" }],
    ["kn", "ಕನ್ನಡ", "Kannada", { font: "Noto Sans Kannada" }],
    ["ko", "한국어", "Korean", { font: "Noto Sans KR" }],
    ["ml", "മലയാളം", "Malayalam", { font: "Noto Sans Malayalam" }],
    ["mr", "मराठी", "Marathi", { font: "Noto Sans Devanagari" }],
    ["nb", "Norsk", "Norwegian"],
    ["nl", "Nederlands", "Dutch"],
    ["pa", "ਪੰਜਾਬੀ", "Punjabi", { font: "Noto Sans Gurmukhi" }],
    ["pl", "Polski", "Polish"],
    ["pt-BR", "Português (Brasil)", "Portuguese (Brazil)"],
    ["pt-PT", "Português (Portugal)", "Portuguese (Portugal)"],
    ["ro", "Română", "Romanian"],
    ["ru", "Русский", "Russian"],
    ["sk", "Slovenčina", "Slovak"],
    ["sv", "Svenska", "Swedish"],
    ["sw", "Kiswahili", "Swahili"],
    ["te", "తెలుగు", "Telugu", { font: "Noto Sans Telugu" }],
    ["th", "ไทย", "Thai", { font: "Noto Sans Thai" }],
    ["tr", "Türkçe", "Turkish"],
    ["uk", "Українська", "Ukrainian"],
    ["ur", "اردو", "Urdu", { dir: "rtl", font: "Noto Sans Arabic" }],
    ["vi", "Tiếng Việt", "Vietnamese"],
    ["zh-TW", "繁體中文", "Chinese (Traditional)", { font: "Noto Sans TC" }],
  ];

  const registry = new Map(LANGUAGES.map(([code, native, english, extra = {}]) => [code, { code, native, english, ...extra }]));
  const LOCALE_OVERRIDES = { en: "en-US", es: "es-US", "zh-CN": "zh-CN" };

  // Languages that can be chosen right now: the built-in five plus every pack listed in locales/manifest.json.
  const available = new Set(BUILT_IN);

  const DIALOG_COPY = {
    en: { title: "Choose your language", search: "Search languages", close: "Close", empty: "No language found" },
    es: { title: "Elige tu idioma", search: "Buscar idiomas", close: "Cerrar", empty: "No se encontraron idiomas" },
    "zh-CN": { title: "选择语言", search: "搜索语言", close: "关闭", empty: "没有找到语言" },
    ms: { title: "Pilih bahasa anda", search: "Cari bahasa", close: "Tutup", empty: "Tiada bahasa dijumpai" },
    ta: { title: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்", search: "மொழிகளைத் தேடுங்கள்", close: "மூடு", empty: "மொழி கிடைக்கவில்லை" },
  };
  const dialogCopy = () => DIALOG_COPY[window.currentLang] || DIALOG_COPY.en;
  const activeCode = () => window.currentLang || "en";

  /* ------------------------------ locale packs ------------------------------ */

  const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);
  function deepMerge(base, pack) {
    for (const key of Object.keys(pack)) {
      const value = pack[key];
      if (isPlainObject(value) && isPlainObject(base[key])) deepMerge(base[key], value);
      else if (typeof value === "string" ? value.trim() !== "" : value != null) base[key] = value;
    }
    return base;
  }

  const loading = new Map();
  function ensureLoaded(code, store) {
    if (store[code]) return Promise.resolve(true);
    if (!registry.has(code)) return Promise.resolve(false);
    if (loading.has(code)) return loading.get(code);
    const task = fetch(`./locales/${encodeURIComponent(code)}.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((pack) => {
        if (!isPlainObject(pack)) return false;
        // Start from a copy of English so a missing key never shows its raw key name.
        store[code] = deepMerge(JSON.parse(JSON.stringify(store.en)), pack);
        return true;
      })
      .catch(() => false)
      .finally(() => loading.delete(code));
    loading.set(code, task);
    return task;
  }

  /* ------------------------------ fonts for other scripts ------------------------------ */

  let fontStyle = null;
  function applyFont(code) {
    const entry = registry.get(code);
    if (!fontStyle) {
      fontStyle = document.createElement("style");
      fontStyle.id = "language-font";
      document.head.appendChild(fontStyle);
    }
    if (!entry?.font) { fontStyle.textContent = ""; return; }
    const id = `language-font-${entry.font.replace(/\s+/g, "-").toLowerCase()}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(entry.font).replace(/%20/g, "+")}:wght@400;500;600&display=swap`;
      document.head.appendChild(link);
    }
    // The site reads its typefaces from --sans / --serif, so one override covers headings and body.
    fontStyle.textContent = `html[lang="${code}"] { --sans: "${entry.font}", "DM Sans", system-ui, sans-serif; --serif: "${entry.font}", "Playfair Display", Georgia, serif; }`;
  }

  /* ------------------------------ public API ------------------------------ */

  window.MYCELIUM_LANGS = {
    has: (code) => registry.has(code),
    list: () => [...registry.values()].filter((entry) => available.has(entry.code)),
    label: (code) => registry.get(code)?.native || "",
    short: (code) => (registry.has(code) ? code.split("-")[0].toUpperCase() : ""),
    dir: (code) => registry.get(code)?.dir || "ltr",
    locale: (code) => LOCALE_OVERRIDES[code] || (registry.has(code) ? code : "en-US"),
    ensureLoaded,
    applyFont,
    open: () => openDialog(),
    close: () => closeDialog(),
  };

  /* ------------------------------ dialog ------------------------------ */

  let overlay, dialog, searchInput, listEl, emptyEl, titleEl, closeBtn, trigger, lastFocus;
  let query = "";

  function node(tag, className, attrs = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    return element;
  }

  function checkIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "lp-check");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3.5 8.5l3 3 6-7");
    svg.appendChild(path);
    return svg;
  }

  function build() {
    if (overlay) return;
    overlay = node("div", "lp-overlay");
    overlay.hidden = true;
    dialog = node("div", "lp-dialog", { role: "dialog", "aria-modal": "true", "aria-labelledby": "lpTitle" });

    const head = node("div", "lp-head");
    titleEl = node("h2", "lp-title", { id: "lpTitle" });
    closeBtn = node("button", "lp-close", { type: "button" });
    closeBtn.textContent = "×";
    head.append(titleEl, closeBtn);

    searchInput = node("input", "lp-search", { type: "search", autocomplete: "off", spellcheck: "false" });
    listEl = node("div", "lp-list", { "data-lenis-prevent": "" });
    emptyEl = node("p", "lp-empty");
    emptyEl.hidden = true;

    dialog.append(head, searchInput, listEl, emptyEl);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    closeBtn.addEventListener("click", closeDialog);
    overlay.addEventListener("pointerdown", (event) => { if (event.target === overlay) closeDialog(); });
    searchInput.addEventListener("input", () => { query = searchInput.value.trim().toLowerCase(); renderList(); });
    listEl.addEventListener("click", onPick);
    dialog.addEventListener("keydown", onKeydown);
  }

  function applyCopy() {
    const copy = dialogCopy();
    titleEl.textContent = copy.title;
    searchInput.placeholder = copy.search;
    searchInput.setAttribute("aria-label", copy.search);
    closeBtn.setAttribute("aria-label", copy.close);
    emptyEl.textContent = copy.empty;
  }

  function renderList() {
    if (!listEl) return;
    const current = activeCode();
    const items = window.MYCELIUM_LANGS.list()
      .filter((entry) => !query || `${entry.native} ${entry.english} ${entry.code}`.toLowerCase().includes(query))
      .sort((a, b) => a.english.localeCompare(b.english));
    const fragment = document.createDocumentFragment();
    for (const entry of items) {
      const button = node("button", "lp-item", { type: "button", "data-code": entry.code, lang: entry.code });
      if (entry.code === current) { button.classList.add("is-active"); button.setAttribute("aria-current", "true"); }
      const native = node("span", "lp-native", entry.dir ? { dir: entry.dir } : {}); native.textContent = entry.native;
      const english = node("span", "lp-english", { lang: "en", dir: "ltr" }); english.textContent = entry.english;
      const text = node("span", "lp-text"); text.append(native, english);
      button.append(text, checkIcon());
      fragment.appendChild(button);
    }
    listEl.replaceChildren(fragment);
    emptyEl.hidden = items.length > 0;
    // Search only helps once the list is long.
    searchInput.hidden = window.MYCELIUM_LANGS.list().length <= 8;
  }

  async function onPick(event) {
    const button = event.target.closest(".lp-item");
    if (!button) return;
    const code = button.dataset.code;
    button.classList.add("is-loading");
    try { if (typeof window.setLanguage === "function") await window.setLanguage(code); }
    finally { button.classList.remove("is-loading"); }
    closeDialog();
  }

  function focusables() {
    return [...dialog.querySelectorAll("button, input")].filter((element) => !element.hidden && !element.disabled && element.offsetParent !== null);
  }

  function onKeydown(event) {
    if (event.key === "Escape") { event.preventDefault(); closeDialog(); return; }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function openDialog() {
    build();
    if (!overlay.hidden) return;
    lastFocus = document.activeElement;
    query = ""; searchInput.value = "";
    applyCopy();
    renderList();
    overlay.hidden = false;
    document.documentElement.classList.add("lp-open");
    window.MYCELIUM_LENIS?.stop();
    trigger?.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      (searchInput.hidden ? listEl.querySelector(".is-active") || listEl.querySelector(".lp-item") : searchInput)?.focus({ preventScroll: true });
      listEl.querySelector(".is-active")?.scrollIntoView({ block: "center" });
    });
  }

  function closeDialog() {
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove("is-open");
    document.documentElement.classList.remove("lp-open");
    window.MYCELIUM_LENIS?.start();
    trigger?.setAttribute("aria-expanded", "false");
    const done = () => { overlay.hidden = true; };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) done();
    else setTimeout(done, 240);
    (lastFocus && document.contains(lastFocus) ? lastFocus : trigger)?.focus?.({ preventScroll: true });
  }

  /* ------------------------------ start-up ------------------------------ */

  function init() {
    trigger = document.getElementById("langToggleBtn");
    trigger?.addEventListener("click", openDialog);
    window.addEventListener("mycelium:languagechange", () => {
      if (overlay && !overlay.hidden) { applyCopy(); renderList(); }
    });
    fetch("./locales/manifest.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((manifest) => {
        for (const code of manifest?.languages || []) if (registry.has(code)) available.add(code);
        if (overlay && !overlay.hidden) renderList();
      })
      .catch(() => {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

// [MYCELIUM UPGRADE] Optional country selector and low-cost Three.js Earth experience.
import { COUNTRY_SITES, DEFAULT_COUNTRY_CODE, getCountrySite } from "./country-config.js";
import { getInitialCountryHint, IS_LOCAL_DEVELOPMENT } from "./env-config.js";

const STORE_KEY = "myceliumCountry";
const isMobileGlobeViewport = window.matchMedia("(max-width: 767px)").matches;
const globeTextureUrls = {
  day: [new URL("./img/globe/earth-day.webp", import.meta.url).href, new URL("./img/globe/earth-day-mobile.webp", import.meta.url).href],
  night: [new URL("./img/globe/earth-night.webp", import.meta.url).href, new URL("./img/globe/earth-night-mobile.webp", import.meta.url).href],
  clouds: [new URL("./img/globe/earth-clouds.webp", import.meta.url).href, new URL("./img/globe/earth-clouds-mobile.webp", import.meta.url).href],
  normal: [new URL("./img/globe/earth-normal.webp", import.meta.url).href, new URL("./img/globe/earth-normal-mobile.webp", import.meta.url).href],
  specular: [new URL("./img/globe/earth-specular.webp", import.meta.url).href, new URL("./img/globe/earth-specular-mobile.webp", import.meta.url).href],
};
const currentUrl = new URL(window.location.href);
const routeCode = currentUrl.pathname.match(/^\/([a-z]{2})\/?$/i)?.[1]?.toUpperCase();
const queryCode = currentUrl.searchParams.get("region")?.toUpperCase();
// Local development uses a mock country; production reads only the Netlify
// country-code hint. Browser-side IP lookup is never used.
const countryHint = getInitialCountryHint();
const rememberedCode = localStorage.getItem(STORE_KEY)?.toUpperCase();
const requestedCode = routeCode || queryCode
  || (IS_LOCAL_DEVELOPMENT ? countryHint : rememberedCode || countryHint)
  || DEFAULT_COUNTRY_CODE;
const initialCountry = getCountrySite(requestedCode) || getCountrySite(DEFAULT_COUNTRY_CODE);
const unsupportedRoute = Boolean(routeCode && !getCountrySite(routeCode));
const unavailableHint = Boolean(!routeCode && !rememberedCode && countryHint && !getCountrySite(countryHint));

window.MYCELIUM_COUNTRY = initialCountry.code;
window.MYCELIUM_COUNTRY_CONFIG = initialCountry;
document.documentElement.dataset.countryCode = initialCountry.code;
document.querySelectorAll("[data-current-country]").forEach((el) => { el.textContent = initialCountry.locality ? `${initialCountry.locality}, ${initialCountry.name}` : initialCountry.name; });
// Carry the actual region into the admin login, including IP-selected visits
// where the user has not yet saved a location preference on this device.
document.querySelectorAll(".admin-access").forEach((link) => {
  link.href = `/admin/login?region=${encodeURIComponent(initialCountry.code)}`;
});
const countryMapImage = document.querySelector("#mapOverlay .map-image");
if (countryMapImage && initialCountry.facilityMap) countryMapImage.src = initialCountry.facilityMap;
function updateRegionalSocialLinks(country = initialCountry) {
  // WhatsApp is Malaysia-specific; the US demo uses its configured email contact instead.
  const whatsapp = document.querySelector('.social-icon[aria-label="WhatsApp"]');
  const email = document.querySelector("[data-region-email]");
  if (whatsapp) whatsapp.style.display = country.code === "US" ? "none" : "flex";
  if (email) {
    email.style.display = country.code === "US" ? "flex" : "none";
    const address = country.contact?.generalEmail || "john.smith@company.com";
    email.href = `mailto:${address}`;
    email.setAttribute("aria-label", `Email ${country.name} Mycelium`);
  }
}
updateRegionalSocialLinks();
window.addEventListener("mycelium:countrychange", (event) => updateRegionalSocialLinks(event.detail));

// The URL is the durable source of truth; no reload is required to normalize the first visit.
if (!routeCode || unsupportedRoute) {
  window.history.replaceState({}, "", `${initialCountry.route}${currentUrl.search}${currentUrl.hash}`);
}

const copyByLanguage = {
  en: { kicker: "MYCELIUM LOCATIONS", title: "Choose your community.", body: "Explore Mycelium locations around the world. Select a country to see whether its community site is available.", selected: "Selected location", active: "Community site available", coming: "More locations will appear here as Mycelium communities launch.", button: "Continue to Mycelium", help: "Your country choice is saved on this device. You can change it any time.", close: "Close location selector", list: "Available Mycelium locations", status: "Only countries with a live Mycelium community appear here.", heroLabel: "CHOOSE YOUR LOCATION", navLabel: "MYCELIUM LOCATION" },
  es: { kicker: "UBICACIONES MYCELIUM", title: "Elige tu comunidad.", body: "Explora las ubicaciones de Mycelium en todo el mundo. Selecciona un país para consultar su sitio comunitario.", selected: "Ubicación seleccionada", active: "Sitio comunitario disponible", coming: "Aquí aparecerán más ubicaciones cuando se abran nuevas comunidades Mycelium.", button: "Continuar a Mycelium", help: "Tu elección de país se guarda en este dispositivo. Puedes cambiarla cuando quieras.", close: "Cerrar selector de ubicación", list: "Ubicaciones Mycelium disponibles", status: "Aquí solo aparecen los países con una comunidad Mycelium activa.", heroLabel: "ELIGE TU UBICACIÓN", navLabel: "UBICACIÓN MYCELIUM" },
  "zh-CN": { kicker: "MYCELIUM 地区", title: "选择您的社区。", body: "探索世界各地的 Mycelium 地区。选择一个国家，查看当地社区网站是否已开放。", selected: "已选择地区", active: "社区网站已开放", coming: "随着 Mycelium 社区陆续开放，更多地区将在此显示。", button: "进入 Mycelium", help: "您的国家选择会保存在此设备上，之后可随时更改。", close: "关闭地区选择器", list: "已开放的 Mycelium 地区", status: "此处仅显示已开放 Mycelium 社区网站的国家。", heroLabel: "选择所在地区", navLabel: "MYCELIUM 地区" },
  ms: { kicker: "LOKASI MYCELIUM", title: "Pilih komuniti anda.", body: "Terokai lokasi Mycelium di seluruh dunia. Pilih negara untuk melihat sama ada laman komuniti tersedia.", selected: "Lokasi dipilih", active: "Laman komuniti tersedia", coming: "Lebih banyak lokasi akan dipaparkan apabila komuniti Mycelium dilancarkan.", button: "Teruskan ke Mycelium", help: "Pilihan negara disimpan pada peranti ini. Anda boleh menukarnya pada bila-bila masa.", close: "Tutup pemilih lokasi", list: "Lokasi Mycelium tersedia", status: "Hanya negara dengan laman komuniti Mycelium yang aktif dipaparkan di sini.", heroLabel: "PILIH LOKASI ANDA", navLabel: "LOKASI MYCELIUM" },
  ta: { kicker: "MYCELIUM இடங்கள்", title: "உங்கள் சமூகத்தைத் தேர்ந்தெடுக்கவும்.", body: "உலகம் முழுவதும் உள்ள Mycelium இடங்களைப் பாருங்கள். சமூக இணையதளம் கிடைக்கிறதா என்பதை அறிய ஒரு நாட்டைத் தேர்ந்தெடுக்கவும்.", selected: "தேர்ந்தெடுத்த இடம்", active: "சமூக இணையதளம் கிடைக்கிறது", coming: "Mycelium சமூகங்கள் தொடங்கும்போது மேலும் இடங்கள் இங்கே தோன்றும்.", button: "Mycelium-க்கு தொடரவும்", help: "உங்கள் நாட்டுத் தேர்வு இந்தச் சாதனத்தில் சேமிக்கப்படும். எப்போது வேண்டுமானாலும் மாற்றலாம்.", close: "இடத் தேர்வியை மூடு", list: "கிடைக்கும் Mycelium இடங்கள்", status: "செயலில் உள்ள Mycelium சமூகத் தளம் கொண்ட நாடுகள் மட்டுமே இங்கே காட்டப்படும்.", heroLabel: "உங்கள் இடத்தைத் தேர்வுசெய்க", navLabel: "MYCELIUM இடம்" },
};

function getCopy() {
  const language = localStorage.getItem("preferredLang") || "en";
  return copyByLanguage[language] || copyByLanguage.en;
}

const picker = document.createElement("section");
picker.className = "country-picker";
picker.id = "countryPicker";
picker.setAttribute("role", "dialog");
picker.setAttribute("aria-modal", "true");
picker.setAttribute("aria-labelledby", "countryPickerTitle");
picker.setAttribute("aria-hidden", "true");
picker.innerHTML = `
  <div class="country-picker-scene" aria-label="Interactive globe">
    <canvas class="country-globe-canvas" aria-label="Drag to rotate the globe. Select the highlighted location to focus it." tabindex="0"></canvas>
    <div class="country-globe-fallback" hidden>Interactive globe unavailable. Use the location details to continue.</div>
  </div>
  <div class="country-picker-panel">
    <button class="country-picker-close" type="button" aria-label="Close location selector">×</button>
    <header>
      <p class="country-picker-kicker" data-copy="kicker"></p>
      <h2 class="country-picker-title" id="countryPickerTitle" data-copy="title"></h2>
      <p class="country-picker-copy" data-copy="body"></p>
    </header>
  <div class="country-picker-options" role="group" data-country-list></div>
  <div class="country-picker-selection" aria-live="polite">
      <p class="country-picker-kicker" data-copy="selected"></p>
    <div class="country-picker-country">
      <span class="country-picker-marker" aria-hidden="true"></span>
      <div><p class="country-picker-country-name" data-selected-name></p><p class="country-picker-country-meta" data-selected-status></p></div>
    </div>
      <p class="country-picker-note" data-copy="coming"></p>
    </div>
    <button class="country-picker-continue" type="button"><span data-copy="button"></span><span aria-hidden="true">→</span></button>
    <p class="country-picker-help" data-copy="help"></p>
    <p class="country-picker-help" data-copy="status"></p>
  </div>`;
document.body.appendChild(picker);

const closeButton = picker.querySelector(".country-picker-close");
const continueButton = picker.querySelector(".country-picker-continue");
const selectedName = picker.querySelector("[data-selected-name]");
const selectedStatus = picker.querySelector("[data-selected-status]");
const countryList = picker.querySelector("[data-country-list]");
const canvas = picker.querySelector(".country-globe-canvas");
const fallback = picker.querySelector(".country-globe-fallback");
let selectedCountry = initialCountry;
let returnFocus = null;
let renderer = null;
let animationFrame = 0;
let sceneState = null;
let toastTimer = 0;
let countryPreviewTimer = 0;
let THREE = null;
let globeLoadPromise = null;
let solarClockTimer = 0;
let earthShader = null;

// ---- Globe loading experience -------------------------------------------------------------
// The globe needs the Three.js library plus five Earth textures. To make "Choose your location" feel
// instant we (1) warm those downloads when the visitor shows intent (hover / focus / touch) and in
// idle time after the page has loaded, (2) open the panel immediately with a placeholder, and
// (3) render the globe from the daytime map alone, adding the other maps as they arrive.
const GLOBE_LOADING_TEXT = {
  en: ["Loading the globe\u2026", "Still loading \u2014 you can already pick a location below."],
  "zh-CN": ["\u6b63\u5728\u52a0\u8f7d\u5730\u7403\u2026", "\u4ecd\u5728\u52a0\u8f7d\uff0c\u60a8\u4e5f\u53ef\u4ee5\u76f4\u63a5\u5728\u4e0b\u65b9\u9009\u62e9\u5730\u533a\u3002"],
  ms: ["Memuatkan glob\u2026", "Masih memuatkan \u2014 anda boleh terus memilih lokasi di bawah."],
  es: ["Cargando el globo\u2026", "Sigue cargando: ya puedes elegir una ubicaci\u00f3n abajo."],
};
const pickerScene = picker.querySelector(".country-picker-scene");
if (getComputedStyle(pickerScene).position === "static") pickerScene.style.position = "relative";
const globeSkeleton = document.createElement("div");
globeSkeleton.className = "country-globe-skeleton";
globeSkeleton.innerHTML = '<span class="country-globe-skeleton-disc" aria-hidden="true"></span><span class="country-globe-skeleton-text" role="status"></span>';
pickerScene.append(globeSkeleton);
let globeSlowTimer = 0;

function beginGlobeLoadingUi() {
  const text = GLOBE_LOADING_TEXT[localStorage.getItem("preferredLang") || "en"] || GLOBE_LOADING_TEXT.en;
  const label = globeSkeleton.querySelector(".country-globe-skeleton-text");
  label.textContent = text[0];
  picker.classList.add("is-globe-loading");
  window.clearTimeout(globeSlowTimer);
  globeSlowTimer = window.setTimeout(() => { label.textContent = text[1]; }, 5000);
}
function endGlobeLoadingUi() {
  window.clearTimeout(globeSlowTimer);
  requestAnimationFrame(() => picker.classList.remove("is-globe-loading"));
}

let globeWarmPromise = null;
function preloadImage(url, priority) {
  const image = new Image();
  image.decoding = "async";
  if (priority) image.fetchPriority = priority;
  image.src = url;
}
function warmGlobe() {
  if (globeWarmPromise) return globeWarmPromise;
  const textureIndex = isMobileGlobeViewport ? 1 : 0;
  preloadImage(globeTextureUrls.day[textureIndex], "high"); // needed for the first frame
  globeWarmPromise = (IS_LOCAL_DEVELOPMENT
    ? import("./node_modules/three/build/three.module.js")
    : import("three"))
    .then(() => {
      ["night", "clouds", "normal", "specular"].forEach((key) => preloadImage(globeTextureUrls[key][textureIndex], "low"));
    })
    .catch(() => { globeWarmPromise = null; });
  return globeWarmPromise;
}

function applyCopy() {
  const copy = getCopy();
  picker.querySelectorAll("[data-copy]").forEach((node) => {
    const key = node.dataset.copy;
    node.textContent = copy[key] || copyByLanguage.en[key] || "";
  });
  closeButton.setAttribute("aria-label", copy.close);
  const heroLabel = document.querySelector("[data-country-hero-label]");
  const navLabel = document.querySelector("[data-country-nav-label]");
  if (heroLabel) heroLabel.textContent = copy.heroLabel;
  if (navLabel) navLabel.textContent = copy.navLabel;
  const status = picker.querySelector("[data-copy='status']");
  if (status) status.textContent = copy.status;
  picker.querySelector(".country-picker-scene").setAttribute("aria-label", copy.list);
  countryList.setAttribute("aria-label", copy.list);
  renderSelection();
}

function renderSelection() {
  const copy = getCopy();
  selectedName.textContent = selectedCountry.name;
  selectedStatus.textContent = copy.active;
  countryList.querySelectorAll("[data-select-country]").forEach((button) => {
    const active = button.dataset.selectCountry === selectedCountry.code;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-selected", active);
  });
  continueButton.disabled = selectedCountry.status !== "active";
  continueButton.setAttribute("aria-label", `${copy.button} ${selectedCountry.name}`);
}

countryList.innerHTML = Object.values(COUNTRY_SITES)
  .filter((country) => country.status === "active")
  .map((country) => `<button class="country-option" type="button" data-select-country="${country.code}" aria-pressed="false"><span class="country-option-marker" aria-hidden="true"></span><span class="country-option-name">${country.name}</span><span class="country-option-code">${country.code}</span></button>`)
  .join("");

function showToast(message) {
  let toast = document.querySelector(".country-location-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "country-location-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 4600);
}

if (unsupportedRoute || unavailableHint) {
  const unavailableCode = unsupportedRoute ? routeCode : countryHint;
  showToast(`${unavailableCode} does not have a Mycelium community site yet. Showing ${initialCountry.name}.`);
}

function markerPosition(latitude, longitude, radius = 1.018) {
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

// Approximate the subsolar point from UTC and the equation of time. This keeps
// the day/night terminator tied to real Earth time rather than visitor IP.
function updateSolarLighting() {
  if (!THREE || !earthShader || !sceneState) return;
  const now = new Date();
  const yearStart = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - yearStart) / 86400000);
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (utcHour - 12) / 24);
  const equationOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const sunLatitude = THREE.MathUtils.radToDeg(declination);
  const sunLongitude = THREE.MathUtils.euclideanModulo((720 - utcHour * 60 - equationOfTime) / 4 + 180, 360) - 180;
  earthShader.uniforms.uSunDirection.value.copy(markerPosition(sunLatitude, sunLongitude, 1).normalize());
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

// Build a complete 3D rotation that brings the selected point to the camera
// axis. This centers both longitude and latitude (the old partial X rotation
// left high and low latitude markers visibly off-center).
function countryFocusRotation(country) {
  const point = markerPosition(country.coordinates.latitude, country.coordinates.longitude, 1).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(point, new THREE.Vector3(0, 0, 1));
  const euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");
  return { x: euler.x, y: euler.y, z: euler.z };
}

async function createGlobe() {
  if (renderer) return;
  if (globeLoadPromise) return globeLoadPromise;
  globeLoadPromise = (async () => {
  // [MYCELIUM UPGRADE] Defer Three.js and Earth textures until a visitor opens the globe.
  // Live Server does not process bare package imports; use the installed package
  // directly there. Vite continues to bundle the normal production import for Netlify.
  THREE = IS_LOCAL_DEVELOPMENT
    ? await import("./node_modules/three/build/three.module.js")
    : await import("three");
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  } catch (error) {
    console.warn("[country-selector] WebGL is unavailable; showing the accessible location controls.", error);
    fallback.hidden = false;
    canvas.hidden = true;
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camera.position.set(0, 0, 3.35);
  const group = new THREE.Group();
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  const keyLight = new THREE.DirectionalLight(0xdbe9ff, 2.2);
  keyLight.position.set(-3, 2, 4);
  scene.add(keyLight);

  const textureLoader = new THREE.TextureLoader();
  const textureIndex = isMobileGlobeViewport ? 1 : 0;
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  // Only the daytime map is needed for the first frame; the rest is applied progressively below.
  const earthTexture = await textureLoader.loadAsync(globeTextureUrls.day[textureIndex]);
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthTexture.anisotropy = maxAnisotropy;
  const nightPlaceholder = new THREE.DataTexture(new Uint8Array([10, 16, 26, 255]), 1, 1);
  nightPlaceholder.colorSpace = THREE.SRGBColorSpace;
  nightPlaceholder.needsUpdate = true;
  const nightUniform = { value: nightPlaceholder }; // shared by reference: swapping .value needs no recompile
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    specular: 0x505050,
    shininess: 18,
  });
  earthMaterial.onBeforeCompile = (shader) => {
    earthShader = shader;
    shader.uniforms.uNightMap = nightUniform;
    shader.uniforms.uSunDirection = { value: new THREE.Vector3(1, 0, 0) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMyceliumLocalNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMyceliumLocalNormal = normalize(position);");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D uNightMap;\nuniform vec3 uSunDirection;\nvarying vec3 vMyceliumLocalNormal;")
      .replace("#include <map_fragment>", `#include <map_fragment>
        float solarDot = dot(normalize(vMyceliumLocalNormal), normalize(uSunDirection));
        float daylight = smoothstep(-0.12, 0.10, solarDot);
        float dusk = (1.0 - smoothstep(0.025, 0.30, abs(solarDot))) * (1.0 - daylight * 0.35);
        vec3 nightColor = texture2D(uNightMap, vMapUv).rgb;
        diffuseColor.rgb = mix(nightColor, diffuseColor.rgb, daylight);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.42, 0.20), dusk * 0.24);
      `);
  };
  earthMaterial.customProgramCacheKey = () => "mycelium-solar-earth-v1";
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 56, 56),
    earthMaterial,
  );
  group.add(earth);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.008, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false }),
  );
  clouds.visible = false; // shown once its texture has arrived
  group.add(clouds);

  const markerMeshes = [];
  Object.values(COUNTRY_SITES).filter((country) => country.status === "active").forEach((country) => {
    const point = markerPosition(country.coordinates.latitude, country.coordinates.longitude);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 16, 16),
      new THREE.MeshBasicMaterial({ color: "#d9b18d" }),
    );
    marker.position.copy(point);
    marker.userData.countryCode = country.code;
    group.add(marker);

    const markerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.03, 0.037, 36),
      new THREE.MeshBasicMaterial({ color: "#e8c8a8", side: THREE.DoubleSide, transparent: true, opacity: 0.58 }),
    );
    markerRing.position.copy(point.clone().multiplyScalar(1.018));
    markerRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), point.clone().normalize());
    markerRing.userData.countryCode = country.code;
    group.add(markerRing);
    markerMeshes.push(marker, markerRing);
  });

  const initialRotation = countryFocusRotation(initialCountry);
  group.rotation.set(initialRotation.x, initialRotation.y, initialRotation.z);
  sceneState = {
    scene, camera, group, earth, clouds, markerMeshes, drag: null, isDragging: false,
    zoom: 3.35, focusTarget: null, baseRotation: { ...initialRotation },
    previewing: false,
  };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  canvas.addEventListener("pointerdown", (event) => {
    sceneState.drag = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
    sceneState.isDragging = false;
    sceneState.focusTarget = null;
    sceneState.previewing = false;
    sceneState.baseRotation = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!sceneState?.drag) return;
    const dx = event.clientX - sceneState.drag.x;
    const dy = event.clientY - sceneState.drag.y;
    if (Math.abs(event.clientX - sceneState.drag.startX) + Math.abs(event.clientY - sceneState.drag.startY) > 5) sceneState.isDragging = true;
    group.rotation.y += dx * 0.005;
    group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + dy * 0.003, -1.1, 1.1);
    sceneState.baseRotation = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
    sceneState.drag.x = event.clientX;
    sceneState.drag.y = event.clientY;
    renderer.render(sceneState.scene, sceneState.camera);
  });
  canvas.addEventListener("pointerup", (event) => {
    if (sceneState?.drag && !sceneState.isDragging) {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const markerHit = raycaster.intersectObjects(sceneState.markerMeshes)[0];
      const globeHit = raycaster.intersectObject(sceneState.earth)[0];
      if (markerHit && (!globeHit || markerHit.distance < globeHit.distance)) {
        selectCountry(markerHit.object.userData.countryCode);
      }
    }
    if (sceneState) {
      sceneState.drag = null;
      sceneState.baseRotation = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
      startRendering();
    }
  });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    sceneState.zoom = THREE.MathUtils.clamp(sceneState.zoom + event.deltaY * 0.002, 2.2, 5.2);
    camera.position.z = sceneState.zoom;
    renderer.render(sceneState.scene, sceneState.camera);
  }, { passive: false });
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCountry(selectedCountry.code);
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") group.rotation.y += event.key === "ArrowLeft" ? -0.18 : 0.18;
      else group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + (event.key === "ArrowUp" ? -0.18 : 0.18), -1.1, 1.1);
      sceneState.baseRotation = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
      renderer.render(sceneState.scene, sceneState.camera);
    }
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(picker.querySelector(".country-picker-scene"));
  sceneState.resizeObserver = resizeObserver;

  function resize() {
    if (!renderer || !sceneState) return;
    const rect = picker.querySelector(".country-picker-scene").getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    if (sceneState && picker.classList.contains("is-open")) renderer.render(sceneState.scene, camera);
  }
  sceneState.resize = resize;
  resize();
  try {
    // Compile shaders and upload the first texture now, so the first visible frame does not stutter.
    renderer.compile(scene, camera);
    renderer.initTexture?.(earthTexture);
  } catch (error) {
    console.warn("[country-selector] Pre-compile skipped.", error);
  }
  updateSolarLighting();

  // Remaining maps arrive in the background and are swapped in without blocking the first frame.
  const refreshIfOpen = () => {
    if (renderer && sceneState && picker.classList.contains("is-open")) renderer.render(sceneState.scene, sceneState.camera);
  };
  const prepare = (texture, srgb) => {
    texture.anisotropy = maxAnisotropy;
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    renderer.initTexture?.(texture);
    return texture;
  };
  textureLoader.loadAsync(globeTextureUrls.night[textureIndex]).then((texture) => {
    nightUniform.value = prepare(texture, true);
    refreshIfOpen();
  }).catch((error) => console.warn("[country-selector] Night map unavailable.", error));
  textureLoader.loadAsync(globeTextureUrls.clouds[textureIndex]).then((texture) => {
    clouds.material.alphaMap = prepare(texture, false);
    clouds.material.needsUpdate = true;
    clouds.visible = true;
    refreshIfOpen();
  }).catch((error) => console.warn("[country-selector] Cloud map unavailable.", error));
  Promise.all([
    textureLoader.loadAsync(globeTextureUrls.normal[textureIndex]),
    textureLoader.loadAsync(globeTextureUrls.specular[textureIndex]),
  ]).then(([normalTexture, specularTexture]) => {
    earthMaterial.normalMap = prepare(normalTexture, false);
    earthMaterial.specularMap = prepare(specularTexture, false);
    earthMaterial.needsUpdate = true; // one recompile for the relief/specular maps
    refreshIfOpen();
  }).catch((error) => console.warn("[country-selector] Relief maps unavailable.", error));
  })().catch((error) => {
    console.error("[country-selector] Globe could not be loaded.", error);
    fallback.hidden = false;
    canvas.hidden = true;
  });
  return globeLoadPromise;
}

function startRendering() {
  if (!renderer || !sceneState) return;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    if (sceneState.focusTarget) {
      const target = sceneState.previewing ? sceneState.baseRotation : sceneState.focusTarget;
      if (!sceneState.previewing) sceneState.baseRotation = { ...target };
      sceneState.group.rotation.set(target.x, target.y, target.z);
      sceneState.focusTarget = null;
    }
    sceneState.previewing = false;
    renderer.render(sceneState.scene, sceneState.camera);
    return;
  }
  if (animationFrame) return;
  const render = () => {
    if (!picker.classList.contains("is-open")) { animationFrame = 0; return; }
    if (sceneState.focusTarget) {
      sceneState.group.rotation.y += normalizeAngle(sceneState.focusTarget.y - sceneState.group.rotation.y) * 0.035;
      sceneState.group.rotation.x += (sceneState.focusTarget.x - sceneState.group.rotation.x) * 0.035;
      sceneState.group.rotation.z += normalizeAngle(sceneState.focusTarget.z - sceneState.group.rotation.z) * 0.035;
      const settled = Math.abs(normalizeAngle(sceneState.focusTarget.y - sceneState.group.rotation.y)) < 0.001
        && Math.abs(sceneState.focusTarget.x - sceneState.group.rotation.x) < 0.001
        && Math.abs(normalizeAngle(sceneState.focusTarget.z - sceneState.group.rotation.z)) < 0.001;
      if (settled) {
        const target = { ...sceneState.focusTarget };
        if (!sceneState.previewing) sceneState.baseRotation = target;
        sceneState.group.rotation.set(target.x, target.y, target.z);
        sceneState.focusTarget = null;
      }
    }
    renderer.render(sceneState.scene, sceneState.camera);
    animationFrame = sceneState.focusTarget ? requestAnimationFrame(render) : 0;
  };
  animationFrame = requestAnimationFrame(render);
}

function selectCountry(code) {
  const country = getCountrySite(code);
  if (!country) return;
  selectedCountry = country;
  if (sceneState) {
    const target = countryFocusRotation(country);
    sceneState.previewing = false;
    // Commit the selected country immediately so a pointer/focus-out event
    // during the focus animation restores to this country, not the old view.
    sceneState.baseRotation = { ...target };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sceneState.group.rotation.set(target.x, target.y, 0);
      sceneState.group.rotation.z = target.z;
      sceneState.baseRotation = { ...target };
      sceneState.focusTarget = null;
      renderer.render(sceneState.scene, sceneState.camera);
    } else {
      sceneState.focusTarget = target;
      startRendering();
    }
  }
  renderSelection();
  window.dispatchEvent(new CustomEvent("mycelium:country-selected", { detail: country }));
}

function previewCountry(code) {
  const country = getCountrySite(code);
  if (!country || !sceneState) return;
  sceneState.previewing = true;
  sceneState.focusTarget = countryFocusRotation(country);
  startRendering();
}

function restoreGlobePosition() {
  window.clearTimeout(countryPreviewTimer);
  countryPreviewTimer = 0;
  if (!sceneState || sceneState.drag) return;
  sceneState.previewing = false;
  sceneState.focusTarget = { ...sceneState.baseRotation };
  startRendering();
}

async function openPicker(event) {
  returnFocus = event?.currentTarget || document.activeElement;
  selectedCountry = initialCountry;
  renderSelection();
  picker.classList.add("is-open");
  picker.setAttribute("aria-hidden", "false");
  document.body.classList.add("country-picker-open");
  closeButton.focus(); // keyboard and screen-reader users are never kept waiting for the globe
  if (!sceneState) beginGlobeLoadingUi();
  await createGlobe();
  endGlobeLoadingUi();
  if (!picker.classList.contains("is-open")) return; // closed while the globe was still loading
  if (sceneState?.resize) sceneState.resize();
  updateSolarLighting();
  window.clearInterval(solarClockTimer);
  solarClockTimer = window.setInterval(() => {
    updateSolarLighting();
    if (renderer && sceneState && picker.classList.contains("is-open")) renderer.render(sceneState.scene, sceneState.camera);
  }, 60000);
  startRendering();
}

function closePicker() {
  picker.classList.remove("is-open");
  picker.setAttribute("aria-hidden", "true");
  document.body.classList.remove("country-picker-open");
  window.clearInterval(solarClockTimer);
  solarClockTimer = 0;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  if (returnFocus?.focus) returnFocus.focus();
}

document.querySelectorAll("[data-open-country-picker]").forEach((button) => {
  button.addEventListener("click", openPicker);
  // Intent signals arrive hundreds of milliseconds before the click: start downloading now.
  ["pointerenter", "focus", "touchstart"].forEach((type) => button.addEventListener(type, warmGlobe, { passive: true, once: true }));
});

// Idle prebuild: a few seconds after the page has loaded and the browser is quiet, fetch the globe
// assets and (on desktop) build the scene off-screen. Skipped on Save-Data and slow connections.
function scheduleGlobePrebuild() {
  const connection = navigator.connection;
  if (connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType || "")) return;
  const run = () => {
    if (document.hidden) { document.addEventListener("visibilitychange", run, { once: true }); return; }
    warmGlobe().then(() => (isMobileGlobeViewport ? null : createGlobe()));
  };
  // Building the globe (WebGL context, shaders, 5 textures) is heavy. Never do it while the hero wave plays:
  // wait for the wave to finish (or give up after 14 s if it never runs), then a further 3 s of quiet.
  const afterLoad = () => {
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      window.setTimeout(() => {
        if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 4000 });
        else run();
      }, 3000);
    };
    document.addEventListener("mycelium:wire-preview-complete", go, { once: true });
    window.setTimeout(go, 14000);
  };
  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
}
scheduleGlobePrebuild();
countryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-select-country]");
  if (button) selectCountry(button.dataset.selectCountry);
});
countryList.addEventListener("pointerover", (event) => {
  const button = event.target.closest("[data-select-country]");
  if (!button || event.relatedTarget?.closest?.("[data-select-country]") === button) return;
  window.clearTimeout(countryPreviewTimer);
  countryPreviewTimer = window.setTimeout(() => {
    if (button.matches(":hover")) previewCountry(button.dataset.selectCountry);
  }, 650);
});
countryList.addEventListener("pointerout", (event) => {
  const fromButton = event.target.closest("[data-select-country]");
  const toButton = event.relatedTarget?.closest?.("[data-select-country]");
  if (!fromButton || fromButton === toButton) return;
  window.clearTimeout(countryPreviewTimer);
  if (!toButton) restoreGlobePosition();
});
countryList.addEventListener("focusin", (event) => {
  const button = event.target.closest("[data-select-country]");
  if (button) previewCountry(button.dataset.selectCountry);
});
countryList.addEventListener("focusout", (event) => {
  if (event.target.closest("[data-select-country]") && !event.relatedTarget?.closest?.("[data-select-country]")) restoreGlobePosition();
});
closeButton.addEventListener("click", closePicker);
picker.addEventListener("click", (event) => { if (event.target === picker) closePicker(); });
document.addEventListener("keydown", (event) => {
  if (!picker.classList.contains("is-open")) return;
  if (event.key === "Escape") { closePicker(); return; }
  if (event.key !== "Tab") return;
  const focusable = [...picker.querySelectorAll("button:not(:disabled), canvas[tabindex]")];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
continueButton.addEventListener("click", () => {
  if (selectedCountry.status !== "active") return;
  localStorage.setItem(STORE_KEY, selectedCountry.code);
  const secureCookie = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `myceliumCountry=${selectedCountry.code}; Path=/; Max-Age=31536000; SameSite=Lax${secureCookie}`;
  window.dispatchEvent(new CustomEvent("mycelium:countrychange", { detail: selectedCountry }));
  if (window.location.pathname === selectedCountry.route) {
    closePicker();
    return;
  }
  window.location.assign(selectedCountry.route);
});
window.addEventListener("mycelium:languagechange", applyCopy);
window.addEventListener("resize", () => sceneState?.resize?.());
applyCopy();
if (IS_LOCAL_DEVELOPMENT && currentUrl.searchParams.get("openCountryPicker") === "1") {
  requestAnimationFrame(() => openPicker());
}
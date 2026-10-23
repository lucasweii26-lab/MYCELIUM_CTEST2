// country-selector.js
import { COUNTRY_SITES, DEFAULT_COUNTRY_CODE, getCountrySite } from "./country-config.js";

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

// 1. 优先读取跳板传入的参数（例如 ?region=MY_PP, ?region=MY_JB, ?region=US_PL）
const queryCode = currentUrl.searchParams.get("region")?.toUpperCase();

// 2. 识别路径（支持 /my/pp/, /my/jb/, /us/pl/ 以及旧版 /my/, /us/）
const pathSegments = currentUrl.pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
let routeCode = "";
if (pathSegments.length >= 2) {
  routeCode = `${pathSegments[0]}_${pathSegments[1]}`.toUpperCase();
} else if (pathSegments.length === 1 && !pathSegments[0].includes(".")) {
  routeCode = pathSegments[0].toUpperCase();
}

// 3. 读取本地持久化记忆
const rememberedCode = localStorage.getItem(STORE_KEY)?.toUpperCase();

// 4. 计算请求地区（Query 参数 > 路径代号 > 本地记忆 > 默认 MY_PP）
const requestedCode = queryCode || routeCode || rememberedCode || DEFAULT_COUNTRY_CODE;

const initialCountry = getCountrySite(requestedCode) || getCountrySite(DEFAULT_COUNTRY_CODE);
const unsupportedRoute = Boolean(routeCode && !getCountrySite(routeCode));

window.MYCELIUM_COUNTRY = initialCountry.code;
window.MYCELIUM_COUNTRY_CONFIG = initialCountry;
document.documentElement.dataset.countryCode = initialCountry.code;

// 顶部栏显示城市名与国家（如 Pulau Tikus, Penang）
document.querySelectorAll("[data-current-country]").forEach((el) => { 
  el.textContent = initialCountry.displayName || initialCountry.name; 
});

// 管理端入口带上城市参数
document.querySelectorAll(".admin-access").forEach((link) => {
  link.href = `/admin/login?region=${encodeURIComponent(initialCountry.code)}`;
});

const countryMapImage = document.querySelector("#mapOverlay .map-image");
if (countryMapImage && initialCountry.facilityMap) countryMapImage.src = initialCountry.facilityMap;

function updateRegionalSocialLinks(country = initialCountry) {
  const isUS = country.countryCode === "US" || country.code.startsWith("US");
  const whatsapp = document.querySelector('.social-icon[aria-label="WhatsApp"]');
  const email = document.querySelector("[data-region-email]");
  if (whatsapp) whatsapp.style.display = isUS ? "none" : "flex";
  if (email) {
    email.style.display = isUS ? "flex" : "none";
    const address = country.contact?.generalEmail || "john.smith@company.com";
    email.href = `mailto:${address}`;
    email.setAttribute("aria-label", `Email ${country.displayName || country.name} Mycelium`);
  }
}
updateRegionalSocialLinks();
window.addEventListener("mycelium:countrychange", (event) => updateRegionalSocialLinks(event.detail));

if (!routeCode || unsupportedRoute) {
  window.history.replaceState({}, "", `${initialCountry.route}${currentUrl.search}${currentUrl.hash}`);
}

const copyByLanguage = {
  en: { kicker: "MYCELIUM LOCATIONS", title: "Choose your community.", body: "Explore Mycelium locations around the world. Select a community to see whether its site is available.", selected: "Selected location", active: "Community site available", coming: "More locations will appear here as Mycelium communities launch.", button: "Continue to Mycelium", help: "Your location choice is saved on this device. You can change it any time.", close: "Close location selector", list: "Available Mycelium locations", status: "Only cities with a live Mycelium community appear here.", heroLabel: "CHOOSE YOUR LOCATION", navLabel: "MYCELIUM LOCATION" },
  es: { kicker: "UBICACIONES MYCELIUM", title: "Elige tu comunidad.", body: "Explora las ubicaciones de Mycelium en todo el mundo. Selecciona un país para consultar su sitio comunitario.", selected: "Ubicación seleccionada", active: "Sitio comunitario disponible", coming: "Aquí aparecerán más ubicaciones cuando se abran nuevas comunidades Mycelium.", button: "Continuar a Mycelium", help: "Tu elección de país se guarda en este dispositivo. Puedes cambiarla cuando quieras.", close: "Cerrar selector de ubicación", list: "Ubicaciones Mycelium disponibles", status: "Aquí solo aparecen los países con una comunidad Mycelium activa.", heroLabel: "ELIGE TU UBICACIÓN", navLabel: "UBICACIÓN MYCELIUM" },
  "zh-CN": { kicker: "MYCELIUM 地区", title: "选择您的社区。", body: "探索世界各地的 Mycelium 社区。选择一个城市地区，查看当地社区网站是否已开放。", selected: "已选择地区", active: "社区网站已开放", coming: "随着 Mycelium 社区陆续开放，更多地区将在此显示。", button: "进入 Mycelium", help: "您的地点选择会保存在此设备上，之后可随时更改。", close: "关闭地区选择器", list: "已开放的 Mycelium 地区", status: "此处仅显示已开放 Mycelium 社区网站的地区。", heroLabel: "选择所在地区", navLabel: "MYCELIUM 地区" },
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

const GLOBE_LOADING_TEXT = {
  en: ["Loading the globe…", "Still loading — you can already pick a location below."],
  "zh-CN": ["正在加载地球…", "仍在加载，您也可以直接在下方选择地区。"],
  ms: ["Memuatkan glob…", "Masih memuatkan — anda boleh terus memilih lokasi di bawah."],
  es: ["Cargando el globo…", "Sigue cargando: ya puedes elegir una ubicación abajo."],
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
  preloadImage(globeTextureUrls.day[textureIndex], "high");
  globeWarmPromise = import("three")
    .catch(() => import("./node_modules/three/build/three.module.js"))
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
  selectedName.textContent = selectedCountry.displayName || selectedCountry.name;
  selectedStatus.textContent = copy.active;
  countryList.querySelectorAll("[data-select-country]").forEach((button) => {
    const active = button.dataset.selectCountry === selectedCountry.code;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-selected", active);
  });
  continueButton.disabled = selectedCountry.status !== "active";
  continueButton.setAttribute("aria-label", `${copy.button} ${selectedCountry.displayName || selectedCountry.name}`);
}

countryList.innerHTML = Object.values(COUNTRY_SITES)
  .filter((country) => country.status === "active")
  .map((country) => `<button class="country-option" type="button" data-select-country="${country.code}" aria-pressed="false"><span class="country-option-marker" aria-hidden="true"></span><span class="country-option-name">${country.displayName || country.name}</span><span class="country-option-code">${country.city || country.code}</span></button>`)
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

if (unsupportedRoute) {
  showToast(`${routeCode} is not available yet. Showing ${initialCountry.displayName || initialCountry.name}.`);
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
    // 自动适配加载 Three.js，无需环境判断脚本
    THREE = await import("three").catch(() => import("./node_modules/three/build/three.module.js"));
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch (error) {
      console.warn("[country-selector] WebGL is unavailable.", error);
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
    const earthTexture = await textureLoader.loadAsync(globeTextureUrls.day[textureIndex]);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = maxAnisotropy;
    const nightPlaceholder = new THREE.DataTexture(new Uint8Array([10, 16, 26, 255]), 1, 1);
    nightPlaceholder.colorSpace = THREE.SRGBColorSpace;
    nightPlaceholder.needsUpdate = true;
    const nightUniform = { value: nightPlaceholder };
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
    clouds.visible = false;
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
      const sceneContainer = picker.querySelector(".country-picker-scene");
      const rect = sceneContainer.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(rect.width, rect.height, false);
      
      const aspect = rect.width / rect.height;
      camera.aspect = aspect;
      
      const vh = window.innerHeight;
      const targetDistance = vh < 750 ? 3.7 : (aspect < 1 ? 3.8 : 3.35);
      camera.position.z = targetDistance;
      camera.updateProjectionMatrix();

      if (sceneState && picker.classList.contains("is-open")) {
        renderer.render(sceneState.scene, camera);
      }
    }
    sceneState.resize = resize;
    resize();

    try {
      renderer.compile(scene, camera);
      renderer.initTexture?.(earthTexture);
    } catch (error) {
      console.warn("[country-selector] Pre-compile skipped.", error);
    }
    updateSolarLighting();

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
      earthMaterial.needsUpdate = true;
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
  closeButton.focus();
  if (!sceneState) beginGlobeLoadingUi();
  await createGlobe();
  endGlobeLoadingUi();
  if (!picker.classList.contains("is-open")) return;
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
  ["pointerenter", "focus", "touchstart"].forEach((type) => button.addEventListener(type, warmGlobe, { passive: true, once: true }));
});

function scheduleGlobePrebuild() {
  const connection = navigator.connection;
  if (connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType || "")) return;
  const run = () => {
    if (document.hidden) { document.addEventListener("visibilitychange", run, { once: true }); return; }
    warmGlobe().then(() => (isMobileGlobeViewport ? null : createGlobe()));
  };
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

if (currentUrl.searchParams.get("openCountryPicker") === "1") {
  requestAnimationFrame(() => openPicker());
}
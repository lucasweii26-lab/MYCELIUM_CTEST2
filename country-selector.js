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

// Resident portal entry carries the selected community too
document.querySelectorAll(".resident-portal-link").forEach((link) => {
  link.href = `/portal/?region=${encodeURIComponent(initialCountry.code)}`;
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
  en: { kicker: "MYCELIUM LOCATIONS", title: "Choose your community.", selected: "SELECTED", active: "Community site available", button: "Continue to Mycelium", help: "Your location choice is saved on this device. You can change it any time.", close: "Close location selector", heroLabel: "CHOOSE YOUR LOCATION", navLabel: "MYCELIUM LOCATION" },
  es: { kicker: "UBICACIONES MYCELIUM", title: "Elige tu comunidad.", selected: "SELECCIONADO", active: "Sitio comunitario disponible", button: "Continuar a Mycelium", help: "Tu elección de país se guarda en este dispositivo. Puedes cambiarla cuando quieras.", close: "Cerrar selector de ubicación", heroLabel: "ELIGE TU UBICACIÓN", navLabel: "UBICACIÓN MYCELIUM" },
  "zh-CN": { kicker: "MYCELIUM 地区", title: "选择您的社区。", selected: "已选择", active: "社区网站已开放", button: "进入 Mycelium", help: "您的地点选择会保存在此设备上，之后可随时更改。", close: "关闭地区选择器", heroLabel: "选择所在地区", navLabel: "MYCELIUM 地区" },
  ms: { kicker: "LOKASI MYCELIUM", title: "Pilih komuniti anda.", selected: "DIPILIH", active: "Laman komuniti tersedia", button: "Teruskan ke Mycelium", help: "Pilihan negara disimpan pada peranti ini. Anda boleh menukarnya pada bila-bila masa.", close: "Tutup pemilih lokasi", heroLabel: "PILIH LOKASI ANDA", navLabel: "LOKASI MYCELIUM" },
  ta: { kicker: "MYCELIUM இடங்கள்", title: "உங்கள் சமூகத்தைத் தேர்ந்தெடுக்கவும்.", selected: "தேர்ந்தெடுக்கப்பட்டது", active: "சமூக இணையதளம் கிடைக்கிறது", button: "Mycelium-க்கு தொடரவும்", help: "உங்கள் நாட்டுத் தேர்வு இந்தச் சாதனத்தில் சேமிக்கப்படும். எப்போது வேண்டுமானாலும் மாற்றலாம்.", close: "இடத் தேர்வியை மூடு", heroLabel: "உங்கள் இடத்தைத் தேர்வுசெய்க", navLabel: "MYCELIUM இடம்" },
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
    <header class="country-picker-header">
      <p class="country-picker-kicker" data-copy="kicker">MYCELIUM LOCATIONS</p>
      <h2 class="country-picker-title" id="countryPickerTitle" data-copy="title">Choose your community.</h2>
    </header>

    <div class="country-picker-options-wrap">
      <div class="country-picker-options" role="group" data-country-list></div>
    </div>

    <div class="country-picker-selection" aria-live="polite">
      <p class="country-picker-kicker" data-copy="selected">SELECTED</p>
      <div class="country-picker-country">
        <span class="country-picker-marker" aria-hidden="true"></span>
        <div>
          <p class="country-picker-country-name" data-selected-name></p>
          <p class="country-picker-country-meta" data-selected-status>Community site available</p>
        </div>
      </div>
    </div>

    <button class="country-picker-continue" type="button">
      <span data-copy="button">Continue to Mycelium</span>
      <span aria-hidden="true">→</span>
    </button>
    
    <p class="country-picker-help" data-copy="help"></p>
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
  if (label) label.textContent = text[0];
  picker.classList.add("is-globe-loading");
  window.clearTimeout(globeSlowTimer);
  globeSlowTimer = window.setTimeout(() => { if (label) label.textContent = text[1]; }, 5000);
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
  if (closeButton) closeButton.setAttribute("aria-label", copy.close);
  const heroLabel = document.querySelector("[data-country-hero-label]");
  const navLabel = document.querySelector("[data-country-nav-label]");
  if (heroLabel) heroLabel.textContent = copy.heroLabel;
  if (navLabel) navLabel.textContent = copy.navLabel;
  renderSelection();
}

function renderSelection() {
  const copy = getCopy();
  // 安全赋值，绝不报 null 错误
  if (selectedName) {
    selectedName.textContent = selectedCountry.displayName || selectedCountry.name;
  }
  if (selectedStatus) {
    selectedStatus.textContent = copy.active || "Community site available";
  }
  countryList.querySelectorAll("[data-select-country]").forEach((button) => {
    const active = button.dataset.selectCountry === selectedCountry.code;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-selected", active);
  });
  if (continueButton) {
    continueButton.disabled = selectedCountry.status !== "active";
    continueButton.setAttribute("aria-label", `${copy.button} ${selectedCountry.displayName || selectedCountry.name}`);
  }
}

countryList.innerHTML = Object.values(COUNTRY_SITES)
  .filter((country) => country.status === "active")
  .map((country) => `
    <button class="country-option" type="button" data-select-country="${country.code}" aria-pressed="false">
      <span class="country-option-marker" aria-hidden="true"></span>
      <span class="country-option-name">${country.displayName || country.name}</span>
    </button>
  `).join("");

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

// Real-time direction of the sun (unit vector in globe space). Pure function of the clock, so it can be
// used the moment the shader is created instead of waiting for the next lighting tick.
function currentSunDirection() {
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
  return markerPosition(sunLatitude, sunLongitude, 1).normalize();
}

function updateSolarLighting() {
  if (!THREE || !earthShader || !sceneState) return;

  const sunDir = currentSunDirection();

  // 地球材质
  if (earthShader.uniforms?.uSunDirection) {
    earthShader.uniforms.uSunDirection.value.copy(sunDir);
  }

  // 大气材质
  if (sceneState.atmosphereMaterial?.uniforms?.uSunDirection) {
    sceneState.atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDir);
  }

  const key = sceneState.keyLight;
  const ambient = sceneState.ambientLight;

  if (key) {
    key.position.copy(sunDir.clone().multiplyScalar(6));
    key.target.position.set(0, 0, 0);
    key.target.updateMatrixWorld?.();
  }

  const utcHour = new Date().getUTCHours() + new Date().getUTCMinutes() / 60 + new Date().getUTCSeconds() / 3600;
  const phase = ((utcHour % 24) + 24) % 24;
  const elev = sunDir.y;

  let ambientI = 0.42;
  let keyI = 1.75;
  let keyColor = 0xdbe9ff;
  let ambColor = 0xb8c4d4;

  if (phase >= 5 && phase < 8) {          // 清晨
    ambientI = 0.48; keyI = 1.95;
    keyColor = 0xffc9a0; ambColor = 0xc9d4e8;
  } else if (phase >= 8 && phase < 16) {  // 白天
    ambientI = 0.62; keyI = 2.35;
    keyColor = 0xf2f6ff; ambColor = 0xffffff;
  } else if (phase >= 16 && phase < 19) { // 黄昏
    ambientI = 0.40; keyI = 1.80;
    keyColor = 0xff8a4a; ambColor = 0x6a7a9a;
  } else {                                // 夜晚
    ambientI = 0.18; keyI = 0.65;
    keyColor = 0x6a8cff; ambColor = 0x1a2438;
  }

  const elevBoost = THREE.MathUtils.clamp(elev * 0.22, -0.10, 0.18);
  ambientI = THREE.MathUtils.clamp(ambientI + elevBoost * 0.45, 0.14, 0.72);
  keyI     = THREE.MathUtils.clamp(keyI + elevBoost, 0.45, 2.55);

  if (ambient) {
    ambient.intensity = ambientI;
    ambient.color.setHex(ambColor);
  }
  if (key) {
    key.intensity = keyI;
    key.color.setHex(keyColor);
  }

  if (earthShader.uniforms?.uTwilightBoost) {
    const twilight = (phase >= 5 && phase < 8) || (phase >= 16 && phase < 19) ? 0.95 : 0.55;
    earthShader.uniforms.uTwilightBoost.value = twilight;
  }
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

// 地球自转轴视觉倾角（约 23.5°，按你要求用 24°），自动飞向城市时保持北极朝上
const EARTH_AXIAL_TILT = (24 * Math.PI) / 180;

function countryFocusRotation(country) {
  // content 有 24° 轴倾：用四元数把「倾角后的地点」对准相机(+Z)，再绕视线拧到北极朝上
  if (!THREE) return { x: 0, y: 0, z: 0 };
  const geo = markerPosition(country.coordinates.latitude, country.coordinates.longitude, 1).normalize();
  const p = geo.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), EARTH_AXIAL_TILT);
  const q = new THREE.Quaternion().setFromUnitVectors(p, new THREE.Vector3(0, 0, 1));
  // 倾角后的「地理北极」投影到屏幕平面，拧到朝上
  const north = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), EARTH_AXIAL_TILT).applyQuaternion(q);
  const northXY = new THREE.Vector3(north.x, north.y, 0);
  if (northXY.lengthSq() > 1e-8) {
    northXY.normalize();
    const twist = Math.atan2(northXY.x, northXY.y);
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), twist));
  }
  const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
  return { x: e.x, y: e.y, z: e.z };
}

function createAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uSunDirection: { value: new THREE.Vector3(0, 0, 1) },
      uIntensity: { value: 0.28 },   // 整体强度再降
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDirection;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // 物体空间法线（与太阳方向一致）
        vec3 normal = normalize(vPosition);

        // 更高次幂 → 更薄的边缘，向外快速 fade
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 4.8);

        float sunDot = dot(normal, normalize(uSunDirection));
        // 白天一侧稍微亮一点，夜晚几乎消失
        float dayFactor = smoothstep(-0.25, 0.45, sunDot);

        // 极低饱和度的冷白（接近苹果）
        vec3 color = mix(
          vec3(0.70, 0.78, 0.92),   // 夜晚更暗淡
          vec3(0.88, 0.93, 1.00),   // 白天接近纯白
          dayFactor
        );

        // 核心：alpha 用更高次幂再压一次，让边缘真正淡入黑色
        float alpha = fresnel * uIntensity * (0.25 + dayFactor * 0.45);
        alpha = pow(alpha, 1.35);           // 额外让边缘更柔
        alpha = clamp(alpha, 0.0, 0.38);    // 硬上限，防止出现实心环

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createEarthMaterial(dayMap, nightMap, normalMap, specularMap) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uDayMap:       { value: dayMap },
      uNightMap:     { value: nightMap },
      uNormalMap:    { value: normalMap },
      uSpecularMap:  { value: specularMap },
      uSunDirection: { value: new THREE.Vector3(0, 0, 1) },
      uTwilightBoost:{ value: 0.65 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vLocalNormal;   // 物体局部空间，与 markerPosition / currentSunDirection 一致
      varying vec3 vViewPosition;
      void main() {
        vUv = uv;
        vLocalNormal = normalize(position);   // 关键：用 position 作为局部法线
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uDayMap;
      uniform sampler2D uNightMap;
      uniform sampler2D uNormalMap;
      uniform sampler2D uSpecularMap;
      uniform vec3 uSunDirection;
      uniform float uTwilightBoost;

      varying vec2 vUv;
      varying vec3 vLocalNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 dayColor   = texture2D(uDayMap, vUv).rgb;
        vec3 nightColor = texture2D(uNightMap, vUv).rgb;
        float specularMask = texture2D(uSpecularMap, vUv).r;

        // 轻微法线扰动
        vec3 normalTex = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
        vec3 N = normalize(vLocalNormal + normalTex * 0.28);

        float solarDot = dot(N, normalize(uSunDirection));

        // 更柔和的 terminator（接近 Apple）
        float daylight = smoothstep(-0.25, 0.18, solarDot);
        float twilight = (1.0 - smoothstep(0.0, 0.40, abs(solarDot))) * (1.0 - daylight * 0.7);

        // 夜景灯光轻微增强，避免发灰
        nightColor = nightColor * 1.22 + vec3(0.012, 0.018, 0.035);

        vec3 color = mix(nightColor, dayColor, daylight);

        // 极淡的暖色晨昏线
        vec3 twilightColor = mix(
          vec3(1.0, 0.45, 0.25),
          vec3(1.0, 0.70, 0.40),
          clamp(solarDot * 1.6 + 0.4, 0.0, 1.0)
        );
        color = mix(color, twilightColor, twilight * 0.18 * uTwilightBoost);

        // 水面高光
        vec3 viewDir = normalize(vViewPosition);
        vec3 halfDir = normalize(normalize(uSunDirection) + viewDir);
        float spec = pow(max(dot(N, halfDir), 0.0), 52.0) * specularMask * daylight;
        color += vec3(0.50, 0.62, 0.85) * spec * 0.48;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}
async function createGlobe() {
  if (renderer) return;
  if (globeLoadPromise) return globeLoadPromise;

  globeLoadPromise = (async () => {
    THREE = await import("three").catch(() => import("./node_modules/three/build/three.module.js"));

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
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
    group.rotation.order = "YXZ";
    scene.add(group);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xdbe9ff, 2.0);
    keyLight.position.set(-3, 2, 4);
    scene.add(keyLight);
    scene.add(keyLight.target);

    const textureLoader = new THREE.TextureLoader();
    const textureIndex = isMobileGlobeViewport ? 1 : 0;
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    // --- Load day texture first (most important) ---
    const earthTexture = await textureLoader.loadAsync(globeTextureUrls.day[textureIndex]);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = maxAnisotropy;

    // Temporary night placeholder so shader can start immediately
    const nightPlaceholder = new THREE.DataTexture(
      new Uint8Array([8, 10, 18, 255]),
      1, 1
    );
    nightPlaceholder.needsUpdate = true;

    // Temporary normal / specular placeholders
    const normalPlaceholder = new THREE.DataTexture(
      new Uint8Array([128, 128, 255, 255]),
      1, 1
    );
    normalPlaceholder.needsUpdate = true;

    const specularPlaceholder = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 255]),
      1, 1
    );
    specularPlaceholder.needsUpdate = true;

    // Create the improved earth material
    const earthMaterial = createEarthMaterial(
      earthTexture,
      nightPlaceholder,
      normalPlaceholder,
      specularPlaceholder
    );
    earthShader = earthMaterial; // so updateSolarLighting can find the uniforms

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      earthMaterial
    );

    // content group holds earth + clouds + markers and carries the axial tilt
    const content = new THREE.Group();
    content.rotation.z = EARTH_AXIAL_TILT;
    group.add(content);
    content.add(earth);

    // --- Clouds ---
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.009, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      })
    );
    clouds.visible = false;
    content.add(clouds);

    // --- Atmosphere (subtle Apple-style limb) ---
    const atmosphereMaterial = createAtmosphereMaterial();
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.048, 48, 48),
      atmosphereMaterial
    );
    content.add(atmosphere);

    // --- Markers ---
    const markerMeshes = [];
    Object.values(COUNTRY_SITES)
      .filter((country) => country.status === "active")
      .forEach((country) => {
        const point = markerPosition(
          country.coordinates.latitude,
          country.coordinates.longitude
        );

        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 16, 16),
          new THREE.MeshBasicMaterial({ color: "#d9b18d" })
        );
        marker.position.copy(point);
        marker.userData.countryCode = country.code;
        content.add(marker);

        const markerRing = new THREE.Mesh(
          new THREE.RingGeometry(0.03, 0.037, 36),
          new THREE.MeshBasicMaterial({
            color: "#e8c8a8",
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.58,
          })
        );
        markerRing.position.copy(point.clone().multiplyScalar(1.018));
        markerRing.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          point.clone().normalize()
        );
        markerRing.userData.countryCode = country.code;
        content.add(markerRing);

        markerMeshes.push(marker, markerRing);
      });

    const initialRotation = countryFocusRotation(initialCountry);
    group.rotation.set(initialRotation.x, initialRotation.y, initialRotation.z);

    sceneState = {
      scene,
      camera,
      group,
      earth,
      clouds,
      atmosphere,
      atmosphereMaterial,
      markerMeshes,
      ambientLight,
      keyLight,
      drag: null,
      isDragging: false,
      zoom: 3.35,
      focusTarget: null,
      baseRotation: { ...initialRotation },
      previewing: false,
      cloudRotationSpeed: 0.00012, // very slow
    };

    // --- Interaction (pointer / keyboard) – kept almost identical ---
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    canvas.addEventListener("pointerdown", (event) => {
      sceneState.drag = {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
      };
      sceneState.isDragging = false;
      sceneState.focusTarget = null;
      sceneState.previewing = false;
      sceneState.baseRotation = {
        x: group.rotation.x,
        y: group.rotation.y,
        z: group.rotation.z,
      };
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!sceneState?.drag) return;
      const dx = event.clientX - sceneState.drag.x;
      const dy = event.clientY - sceneState.drag.y;
      if (
        Math.abs(event.clientX - sceneState.drag.startX) +
          Math.abs(event.clientY - sceneState.drag.startY) >
        5
      ) {
        sceneState.isDragging = true;
      }
      if (dx) group.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), dx * 0.005);
      if (dy) group.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), dy * 0.0035);
      const e = new THREE.Euler().setFromQuaternion(group.quaternion, "YXZ");
      sceneState.baseRotation = { x: e.x, y: e.y, z: e.z };
      sceneState.drag.x = event.clientX;
      sceneState.drag.y = event.clientY;
      renderer.render(sceneState.scene, sceneState.camera);
    });

    canvas.addEventListener("pointerup", (event) => {
      if (sceneState?.drag && !sceneState.isDragging) {
        const rect = canvas.getBoundingClientRect();
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointer, camera);
        const markerHit = raycaster.intersectObjects(sceneState.markerMeshes)[0];
        const globeHit = raycaster.intersectObject(sceneState.earth)[0];
        if (
          markerHit &&
          (!globeHit || markerHit.distance < globeHit.distance)
        ) {
          selectCountry(markerHit.object.userData.countryCode);
        }
      }
      if (sceneState) {
        sceneState.drag = null;
        const e = new THREE.Euler().setFromQuaternion(group.quaternion, "YXZ");
        sceneState.baseRotation = { x: e.x, y: e.y, z: e.z };
        startRendering();
      }
    });

    canvas.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        sceneState.zoom = THREE.MathUtils.clamp(
          sceneState.zoom + event.deltaY * 0.002,
          2.2,
          5.2
        );
        camera.position.z = sceneState.zoom;
        renderer.render(sceneState.scene, sceneState.camera);
      },
      { passive: false }
    );

    canvas.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCountry(selectedCountry.code);
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          group.rotateOnWorldAxis(
            new THREE.Vector3(0, 1, 0),
            event.key === "ArrowLeft" ? -0.18 : 0.18
          );
        } else {
          group.rotateOnWorldAxis(
            new THREE.Vector3(1, 0, 0),
            event.key === "ArrowUp" ? -0.18 : 0.18
          );
        }
        const e = new THREE.Euler().setFromQuaternion(group.quaternion, "YXZ");
        sceneState.baseRotation = { x: e.x, y: e.y, z: e.z };
        renderer.render(sceneState.scene, sceneState.camera);
      }
    });

    // --- Resize ---
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
      const targetDistance = vh < 750 ? 3.7 : aspect < 1 ? 3.8 : 3.35;
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

    // --- Progressive texture loading ---
    const prepare = (texture, srgb) => {
      texture.anisotropy = maxAnisotropy;
      if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
      renderer.initTexture?.(texture);
      return texture;
    };

    textureLoader
      .loadAsync(globeTextureUrls.night[textureIndex])
      .then((texture) => {
        earthMaterial.uniforms.uNightMap.value = prepare(texture, true);
        updateSolarLighting();
        if (picker.classList.contains("is-open")) {
          renderer.render(sceneState.scene, sceneState.camera);
        }
      })
      .catch((error) =>
        console.warn("[country-selector] Night map unavailable.", error)
      );

    textureLoader
      .loadAsync(globeTextureUrls.clouds[textureIndex])
      .then((texture) => {
        clouds.material.alphaMap = prepare(texture, false);
        clouds.material.needsUpdate = true;
        clouds.visible = true;
        if (picker.classList.contains("is-open")) {
          renderer.render(sceneState.scene, sceneState.camera);
        }
      })
      .catch((error) =>
        console.warn("[country-selector] Cloud map unavailable.", error)
      );

    Promise.all([
      textureLoader.loadAsync(globeTextureUrls.normal[textureIndex]),
      textureLoader.loadAsync(globeTextureUrls.specular[textureIndex]),
    ])
      .then(([normalTexture, specularTexture]) => {
        earthMaterial.uniforms.uNormalMap.value = prepare(normalTexture, false);
        earthMaterial.uniforms.uSpecularMap.value = prepare(
          specularTexture,
          false
        );
        if (picker.classList.contains("is-open")) {
          renderer.render(sceneState.scene, sceneState.camera);
        }
      })
      .catch((error) =>
        console.warn("[country-selector] Relief maps unavailable.", error)
      );
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
  if (!picker.classList.contains("is-open")) {
    animationFrame = 0;
    return;
  }

  // 云层极慢旋转
  if (sceneState.clouds?.visible) {
    sceneState.clouds.rotation.y += sceneState.cloudRotationSpeed || 0.00012;
  }

  if (sceneState.focusTarget) {
    const g = sceneState.group;
    const t = sceneState.focusTarget;
    g.rotation.y += normalizeAngle(t.y - g.rotation.y) * 0.06;
    g.rotation.x += normalizeAngle(t.x - g.rotation.x) * 0.06;
    g.rotation.z += normalizeAngle(t.z - g.rotation.z) * 0.06;

    const settled =
      Math.abs(normalizeAngle(t.y - g.rotation.y)) < 0.002 &&
      Math.abs(normalizeAngle(t.x - g.rotation.x)) < 0.002 &&
      Math.abs(normalizeAngle(t.z - g.rotation.z)) < 0.002;

    if (settled) {
      const target = { ...t };
      if (!sceneState.previewing) sceneState.baseRotation = target;
      g.rotation.set(target.x, target.y, target.z, "YXZ");
      sceneState.focusTarget = null;
    }
  }

  renderer.render(sceneState.scene, sceneState.camera);

  // 只要选择器开着就继续渲染（云层 + 太阳方向都能实时）
  animationFrame = requestAnimationFrame(render);
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
      sceneState.group.rotation.set(target.x, target.y, target.z, "YXZ");
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
  if (closeButton) closeButton.focus();
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
  }, 30000);
  startRendering();
  updateSolarLighting(); // earthShader exists after the first compile; do not wait for the 30 s tick
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

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && picker.classList.contains("is-open")) {
    updateSolarLighting();
    if (renderer && sceneState) renderer.render(sceneState.scene, sceneState.camera);
  }
});

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

if (closeButton) closeButton.addEventListener("click", closePicker);
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

if (continueButton) {
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
}

window.addEventListener("mycelium:languagechange", applyCopy);
window.addEventListener("resize", () => sceneState?.resize?.());
applyCopy();

if (currentUrl.searchParams.get("openCountryPicker") === "1") {
  requestAnimationFrame(() => openPicker());
}
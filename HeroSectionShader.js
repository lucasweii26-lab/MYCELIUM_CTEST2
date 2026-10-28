import { createHeroPreviewState } from "./hero-preview-state.js";

const FRAME_COUNT = 251;
const MAX_DPR = 1.25;
// Quiet pre-roll between the page being ready and the wave starting. The shader runs invisibly for this long so
// quality is chosen BEFORE anything is visible; keep it short (the wave then starts < 3 s after the loading reveal).
const WAVE_PREROLL_MS = 900;
// Add ?heroPerf=1 to the page URL to log frame rate and quality changes while the wave plays.
const HERO_PERF_LOG = new URLSearchParams(window.location.search).get("heroPerf") === "1";
const TEXTURE_CACHE_LIMIT = 6;
const PAIR_SETTLE_MS = 140; // load the wire texture only after scrolling settles
const TEXTURE_LOAD_TIMEOUT_MS = 10000;
const SOURCE_ASPECT = 16 / 9;
const HERO_WAVE_DEBUG_ENABLED = new URLSearchParams(window.location.search).get("heroWaveDebug") === "1";
if (HERO_WAVE_DEBUG_ENABLED) {
  window.MYCELIUM_HERO_WAVE_DEBUG = { snapshot: { enabled: true, state: "module-loaded" } };
}
// Scan controls use normalized Hero coordinates; viewport changes need no
// pixel recalculation. Keep all visual tuning together here.
const HERO_WIRE_PREVIEW = Object.freeze({
  mainHeight: 0.30,      // no longer used by the shader; kept so the uniform still exists
  totalHeight: 0.50,     // the wave is half the Hero tall: crest plus a long fading wake
  scanDurationMs: 4000,
  finishFadeMs: 280,
  intensity: 0.85,       // peak wire opacity at the crest (base stays dominant in the wake)
  edgeSoftness: 0.02,    // softer crest edge
  waveAmplitude: 0.02,   // more organic crest line
  scrollIdleMs: 320,
});
// Resolve copied public sequences from the document base. This works in
// Live Server routes and in Vite's production bundle under /assets/ alike.
const ASSET_BASE_URL = document.baseURI;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function reportLoadingState(stage, detail = {}) {
  window.MYCELIUM_REPORT_HERO_LOADING_STATE?.("shader", stage, detail);
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uBaseMap;
  uniform sampler2D uWireMap;
  uniform vec2 uPointer;
  uniform vec2 uTrail;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  uniform vec2 uSourceUvScale;
  uniform vec3 uWireTint;
  uniform float uTime;
  uniform float uActive;
  uniform float uMotion;
  uniform float uFeather;
  uniform float uUserPresence;
  uniform float uPreviewProgress;
  uniform float uPreviewMainHeight;
  uniform float uPreviewTotalHeight;
  uniform float uPreviewEdgeSoftness;
  uniform float uPreviewWaveAmplitude;
  uniform float uPreviewOpacity;
  uniform float uPreviewDebug;

  varying vec2 vUv;

  float organicReveal(vec2 uv, vec2 center, float aspect, float radius, float phase, float stretch) {
    vec2 delta = uv - center;
    delta.x *= aspect;

    vec2 travel = uVelocity * vec2(aspect, 1.0);
    vec2 axis = length(travel) > 0.0005 ? normalize(travel) : vec2(1.0, 0.0);
    vec2 normal = vec2(-axis.y, axis.x);
    float angle = atan(delta.y, delta.x);
    float drift = sin(angle * 3.0 + phase) * 0.035
      + cos(angle * 5.0 - phase * 0.72) * 0.022
      + sin(uv.x * 17.0 + uv.y * 13.0 + phase * 0.4) * 0.018;
    vec2 local = vec2(dot(delta, axis) / max(radius * stretch, 0.001), dot(delta, normal) / max(radius * 0.78, 0.001));
    float distanceFromCenter = length(local) + drift;
    return 1.0 - smoothstep(1.0 - uFeather, 1.0 + uFeather, distanceFromCenter);
  }

  float hashValue(vec2 point) {
    point = fract(point * vec2(0.1031, 0.1030));
    point += dot(point, point.yx + 33.33);
    return fract((point.x + point.y) * point.x);
  }

  float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    vec2 blend = local * local * (3.0 - 2.0 * local);
    float a = hashValue(cell);
    float b = hashValue(cell + vec2(1.0, 0.0));
    float c = hashValue(cell + vec2(0.0, 1.0));
    float d = hashValue(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
  }

  float fluidFbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotation = mat2(0.8, -0.6, 0.6, 0.8);
    for (int octave = 0; octave < 4; octave++) {
      value += valueNoise(point) * amplitude;
      point = rotation * point * 2.03 + vec2(13.7, 7.1);
      amplitude *= 0.5;
    }
    return value;
  }

  float ambientFluid(vec2 uv, float aspect, float time) {
    vec2 field = (uv - 0.5) * vec2(aspect * 2.4, 2.2);
    vec2 drift = vec2(time * 0.06, -time * 0.045);
    vec2 warp = vec2(
      valueNoise(field * 0.72 + drift + vec2(2.1, 8.4)),
      valueNoise(field * 0.72 - drift + vec2(7.3, 1.6))
    );
    float cells = fluidFbm(field * 1.2 + (warp - 0.5) * 1.25 + drift * 1.5);
    float satellites = fluidFbm(field * 1.9 - (warp - 0.5) * 0.7 - drift * 1.05);
    float organicField = cells * 0.8 + satellites * 0.2;
    return smoothstep(0.56, 0.73, organicField);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 sourceUv = (vUv - 0.5) * uSourceUvScale + 0.5;
    // No depth displacement: the base frame and the wire layer are sampled 1:1.
    vec3 baseColor = texture2D(uBaseMap, vUv).rgb;

    vec2 wireUv = clamp(sourceUv, vec2(0.001), vec2(0.999));
    vec4 wireSample = texture2D(uWireMap, wireUv);
    float wireLuma = max(wireSample.r, max(wireSample.g, wireSample.b));
    float wireInk = smoothstep(0.085, 0.42, wireLuma) * smoothstep(0.025, 0.18, wireLuma);

    float directionalStretch = 1.0 + min(length(uVelocity) * 0.13, 0.62);
    float pointerReveal = organicReveal(vUv, uPointer, aspect, 0.155 + uMotion * 0.025, uTime, directionalStretch);
    float trailReveal = organicReveal(vUv, uTrail, aspect, 0.112, uTime - 0.7, 1.0 + (directionalStretch - 1.0) * 0.58);
    float userReveal = max(pointerReveal, trailReveal * 0.34) * uUserPresence;
    float ambientReveal = ambientFluid(vUv, aspect, uTime);
    float userAlpha = userReveal * uActive * mix(0.42, 0.68, clamp(uMotion, 0.0, 1.0)) * 0.54;
    float ambientAlpha = ambientReveal * (0.19 + 0.025 * sin(uTime * 0.8));

    // ---- Sea-wave sweep: dense wire at the crest, fading to base in the wake ----
    float waveOffset = sin(vUv.x * 5.4 + uTime * 0.24) * uPreviewWaveAmplitude * 0.68
      + cos(vUv.x * 9.1 - uTime * 0.18) * uPreviewWaveAmplitude * 0.32
      + (valueNoise(vec2(vUv.x * 7.0, uTime * 0.35)) - 0.5) * uPreviewWaveAmplitude * 1.6;
    float leadingEdge = uPreviewProgress * (1.0 + uPreviewTotalHeight) + waveOffset;
    float behind = leadingEdge - vUv.y;
    float bandPos = clamp(behind / max(uPreviewTotalHeight, 0.001), 0.0, 1.0);
    float frontMask = smoothstep(0.0, max(uPreviewEdgeSoftness, 0.001) * 2.0, behind);
    float tailFalloff = pow(1.0 - smoothstep(0.0, 1.0, bandPos), 1.7);
    float crest = exp(-bandPos * bandPos * 60.0);
    float foam = 0.75 + 0.25 * valueNoise(vec2(vUv.x * 18.0, vUv.y * 9.0 - uTime * 0.6));
    float previewProfile = clamp((tailFalloff * 0.85 + crest * 0.35) * frontMask * foam, 0.0, 1.0);
    float previewAlpha = previewProfile * uPreviewOpacity;

    float wireAlpha = wireInk * max(max(userAlpha, ambientAlpha), previewAlpha);

    vec3 tintedWire = mix(wireSample.rgb, uWireTint, 0.42);
    vec3 finalColor = mix(baseColor, tintedWire, wireAlpha);

    float userRimField = max(pointerReveal, trailReveal * 0.58) * uUserPresence;
    float rim = smoothstep(0.66, 0.94, userRimField)
      * (1.0 - smoothstep(0.94, 1.18, userRimField));
    finalColor += uWireTint * rim * uActive * (0.035 + uMotion * 0.025);
    finalColor += uWireTint * ambientReveal * 0.025;

    vec3 debugBandColor = mix(vec3(1.0, 0.035, 0.82), vec3(0.05, 1.0, 0.12), smoothstep(0.04, 0.2, wireInk));
    finalColor = mix(finalColor, debugBandColor, previewProfile * 0.98 * uPreviewDebug);

    gl_FragColor = vec4(finalColor, 1.0);
    #include <colorspace_fragment>
  }
`;
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readCssRgb(property, fallback = [0.32, 0.41, 0.35]) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  if (!value) return fallback;

  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.append(probe);
  const color = getComputedStyle(probe).color.match(/[\d.]+/g)?.map(Number);
  probe.remove();
  return color?.length >= 3
    ? [color[0] / 255, color[1] / 255, color[2] / 255]
    : fallback;
}

function probeImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const done = value => { if (settled) return; settled = true; clearTimeout(timeoutId); resolve(value); };
    const timeoutId = setTimeout(() => done(false), TEXTURE_LOAD_TIMEOUT_MS);
    image.onload = () => done(true);
    image.onerror = () => done(false);
    image.src = url;
  });
}

function frameUrl(directory, index, pattern, extension = "webp") {
  const frameNumber = String(index).padStart(4, "0");
  const filename = pattern === "frame" ? `frame_${frameNumber}.${extension}` : `${frameNumber}.${extension}`;
  return `${directory}${filename}`;
}

// Auto-detect the wire naming: 0001.webp, frame_0001.webp (or .png).
const WIRE_DIRECTORY = new URL("./hero-wire/", ASSET_BASE_URL).href;
async function findWireSequence() {
  for (const extension of ["webp", "png"]) {
    for (const pattern of ["plain", "frame"]) {
      if (await probeImage(frameUrl(WIRE_DIRECTORY, 1, pattern, extension))) {
        return { directory: WIRE_DIRECTORY, pattern, extension };
      }
    }
  }
  return null;
}

// Don't compete with the critical preload for bandwidth.
function waitForHeroPlan(timeoutMs = 30000) {
  if (document.documentElement.dataset.heroPlanComplete === "true") return Promise.resolve();
  return new Promise((resolve) => {
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      document.removeEventListener("mycelium:loading-plan-complete", done);
      resolve();
    };
    timer = setTimeout(done, timeoutMs);
    document.addEventListener("mycelium:loading-plan-complete", done);
  });
}

let settleFailedMount = null;

async function mountFrameInteraction() {
  reportLoadingState("initializing");
  const hero = document.getElementById("introHero");
  const baseCanvas = document.getElementById("heroCanvas");
  if (!hero || !baseCanvas) { reportLoadingState("skipped", { reason: "hero-elements-missing" }); return; }
  if (matchMedia(REDUCED_MOTION_QUERY).matches || navigator.connection?.saveData) {
    reportLoadingState("skipped", { reason: "reduced-motion-or-save-data" });
    return;
  }

  const THREE = await import("./node_modules/three/build/three.module.js");
  reportLoadingState("three-module-ready");

  let overlayCanvas = null;
  let firstRenderItemSettled = false;
  let firstRenderTimeout;
  const settleFirstRenderItem = (failed = false) => {
    if (firstRenderItemSettled) return;
    firstRenderItemSettled = true;
    clearTimeout(firstRenderTimeout);
    // WebGL is decorative. Record its outcome, but never make the page loader
    // wait for visibility, context creation, or a first GPU render.
    reportLoadingState(failed ? "first-render-failed" : "first-render-complete");
    settleFailedMount = null;
  };
  firstRenderTimeout = window.setTimeout(() => {
    console.warn("[hero-interaction] First overlay render timed out; continuing with the base sequence.");
    settleFirstRenderItem(true);
  }, TEXTURE_LOAD_TIMEOUT_MS * 2);

  overlayCanvas = document.createElement("canvas");
  overlayCanvas.className = "hero-fluid-canvas hero-sequence-overlay";
  overlayCanvas.setAttribute("aria-hidden", "true");
  overlayCanvas.style.opacity = "0";
  hero.append(overlayCanvas);
  settleFailedMount = () => {
    overlayCanvas.style.opacity = "0";
    baseCanvas.style.opacity = "1";
    settleFirstRenderItem(true);
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: overlayCanvas,
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });
    if (HERO_WAVE_DEBUG_ENABLED && renderer.debug) {
      renderer.debug.onShaderError = (gl, _program, vertexShader, fragmentShader) => {
        console.error("[hero-wave-debug] Shader compile/link failure", {
          vertexLog: gl.getShaderInfoLog(vertexShader),
          fragmentLog: gl.getShaderInfoLog(fragmentShader),
        });
      };
    }
  } catch (error) {
    console.warn("[hero-interaction] WebGL unavailable; keeping the base frame sequence.", error);
    overlayCanvas.remove();
    reportLoadingState("webgl-unavailable", { message: String(error?.message ?? error) });
    settleFirstRenderItem(true);
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  let baseTexture;
  let baseTexW = 0;
  let baseTexH = 0;
  function createBaseTexture() {
    const texture = new THREE.CanvasTexture(baseCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    baseTexW = baseCanvas.width;
    baseTexH = baseCanvas.height;
    return texture;
  }
  baseTexture = createBaseTexture();
  // If the 2D canvas was resized, the old GPU allocation is the wrong size.
  // Recreate the texture instead of uploading into it.
  function syncBaseTexture() {
    if (baseCanvas.width === baseTexW && baseCanvas.height === baseTexH) return;
    baseTexture.dispose();
    baseTexture = createBaseTexture();
    uniforms.uBaseMap.value = baseTexture;
  }

  const neutralCanvas = document.createElement("canvas");
  neutralCanvas.width = 1;
  neutralCanvas.height = 1;
  const neutralContext = neutralCanvas.getContext("2d");
  neutralContext.fillStyle = "rgb(128,128,128)";
  neutralContext.fillRect(0, 0, 1, 1);
  const neutralTexture = new THREE.CanvasTexture(neutralCanvas);
  neutralTexture.minFilter = THREE.LinearFilter;
  neutralTexture.magFilter = THREE.LinearFilter;
  neutralTexture.generateMipmaps = false;

  const uniforms = {
    uBaseMap: { value: baseTexture },
    uWireMap: { value: neutralTexture },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uTrail: { value: new THREE.Vector2(0.5, 0.5) },
    uVelocity: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uSourceUvScale: { value: new THREE.Vector2(1, 1) },
    uWireTint: { value: new THREE.Vector3(...readCssRgb("--moss")) },
    uTime: { value: 0 },
    uActive: { value: 0 },
    uMotion: { value: 0 },
    uFeather: { value: 0.48 },
    uUserPresence: { value: 0 },
    uPreviewProgress: { value: 0 },
    uPreviewMainHeight: { value: HERO_WIRE_PREVIEW.mainHeight },
    uPreviewTotalHeight: { value: HERO_WIRE_PREVIEW.totalHeight },
    uPreviewEdgeSoftness: { value: HERO_WIRE_PREVIEW.edgeSoftness },
    uPreviewWaveAmplitude: { value: HERO_WIRE_PREVIEW.waveAmplitude },
    uPreviewOpacity: { value: 0 },
    uPreviewDebug: { value: HERO_WAVE_DEBUG_ENABLED ? 1 : 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  // Optional overlay loads must not participate in the core page's progress counter.
  const loader = new THREE.TextureLoader(new THREE.LoadingManager());
  loader.setCrossOrigin("anonymous");
  const textureCache = new Map();
  const pendingFrames = new Map();
  await waitForHeroPlan();
  const wireSequence = await findWireSequence();
  reportLoadingState("wire-probe-complete", { wire: Boolean(wireSequence) });
  if (!wireSequence) {
    console.warn("[hero-interaction] Wire sequence not found in hero-wire/. The wave effect is disabled until it is.");
  }
  const pointer = new THREE.Vector2(0.5, 0.5);
  const current = new THREE.Vector2(0.5, 0.5);
  const trail = new THREE.Vector2(0.5, 0.5);
  const targetVelocity = new THREE.Vector2();
  const velocity = new THREE.Vector2();
  let pointerInside = false;
  let activeTarget = 0;
  let active = 0;
  let userPresence = 0;
  let energy = 0;
  let targetEnergy = 0;
  let currentFrame = 1;
  let hasBaseFrame = Boolean(baseCanvas.dataset.heroFrame);
  let latestFrameRequest = 0;
  let desiredFrameRequest = null;
  let processingFrameRequest = false;
  let activePairAvailable = false;
  let overlayDisabled = false;
  let rafId = 0;
  let lastTime = 0;
  let lastRenderTime = 0;
  let width = 0;
  let height = 0;
  let pixelRatio = 0;
  // Adaptive quality: weak GPUs (integrated graphics) shed resolution while the wave plays instead of stuttering.
  let qualityScale = 1;
  let slowFrames = 0;
  let lastQualityChange = 0;
  let perfFrames = 0;
  let perfSince = 0;
  let probeState = "idle"; // idle -> running -> done: invisible pre-roll before the first wave
  let probeSettle = 0;
  let inViewport = false;
  let disposed = false;
  let didFirstRender = false;
  let resizeRaf = 0;
  let resizeObserver;
  let previewPending = false;
  let initialPreviewStarted = false;
  let hasUserScrolled = false;
  let lastScrollAt = 0;
  let previewIdleTimer = 0;
  let debugForcePending = HERO_WAVE_DEBUG_ENABLED;
  let debugAutoAttempted = false;
  let debugTriggerCount = 0;
  let debugRenderCount = 0;
  let debugMaskSample = null;
  let debugLastBlock = null;
  let debugLastSampleAt = 0;
  let debugStartAt = 0;
  const wirePreview = createHeroPreviewState({
    scanMs: HERO_WIRE_PREVIEW.scanDurationMs,
    finishFadeMs: HERO_WIRE_PREVIEW.finishFadeMs,
    opacity: HERO_WIRE_PREVIEW.intensity,
  });
  const reducedMotionQuery = matchMedia(REDUCED_MOTION_QUERY);

  function getWaveDebugSnapshot() {
    const elapsedMs = wirePreview.phase === "hidden" ? 0 : Math.max(0, performance.now() - debugStartAt);
    const loadingScreen = document.querySelector(".loading-screen");
    const veilOpacity = Number.parseFloat(getComputedStyle(hero, "::after").opacity || "0");
    return {
      enabled: HERO_WAVE_DEBUG_ENABLED,
      previewTriggerFired: debugTriggerCount > 0,
      triggerCount: debugTriggerCount,
      lastBlock: debugLastBlock,
      heroIntersecting: inViewport,
      pageVisible: !document.hidden,
      reducedMotion: reducedMotionQuery.matches,
      hasBaseFrame,
      matchingWirePairReady: activePairAvailable,
      loadingScreenVisible: Boolean(loadingScreen && !loadingScreen.classList.contains("hidden")),
      heroVeilOpacity: veilOpacity,
      state: wirePreview.phase,
      elapsedMs: Math.round(elapsedMs),
      normalizedProgress: uniforms.uPreviewProgress.value,
      wireTextureLoaded: Boolean(currentFrame && uniforms.uWireMap.value !== neutralTexture),
      currentFrame,
      rendererReady: Boolean(renderer && renderer.getContext()),
      renderCount: debugRenderCount,
      previewDrawPathExecuted: debugRenderCount > 0 && uniforms.uPreviewProgress.value > 0,
      maskProducesNonZeroVisiblePixels: Boolean(debugMaskSample?.diagnosticBandPixel),
      uniforms: {
        progress: uniforms.uPreviewProgress.value,
        opacity: uniforms.uPreviewOpacity.value,
        mainHeight: uniforms.uPreviewMainHeight.value,
        totalHeight: uniforms.uPreviewTotalHeight.value,
        edgeSoftness: uniforms.uPreviewEdgeSoftness.value,
        waveAmplitude: uniforms.uPreviewWaveAmplitude.value,
        debugMask: uniforms.uPreviewDebug.value,
      },
      debugMaskPixel: debugMaskSample,
      overlayCanvasVisible: Boolean(overlayCanvas?.isConnected && Number.parseFloat(overlayCanvas.style.opacity || "0") > 0),
      overlayCanvasOpacity: overlayCanvas ? getComputedStyle(overlayCanvas).opacity : "unavailable",
      overlayCanvasZIndex: overlayCanvas ? getComputedStyle(overlayCanvas).zIndex : "unavailable",
      overlayBounds: overlayCanvas ? (() => {
        const rect = overlayCanvas.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      })() : null,
    };
  }

  function publishWaveDebug(eventName) {
    if (!HERO_WAVE_DEBUG_ENABLED) return;
    const snapshot = getWaveDebugSnapshot();
    window.MYCELIUM_HERO_WAVE_DEBUG.snapshot = snapshot;
    if (eventName) console.info(`[hero-wave-debug] ${eventName}`, snapshot);
  }

  if (HERO_WAVE_DEBUG_ENABLED) {
    window.MYCELIUM_HERO_WAVE_DEBUG = {
      snapshot: { enabled: true, state: "initializing" },
      force() {
        debugForcePending = true;
        debugAutoAttempted = false;
        previewPending = true;
        if (wirePreview.phase !== "hidden") cancelWirePreview();
        previewPending = true;
        if (activePairAvailable && hasBaseFrame) {
          debugForcePending = false;
          const started = tryStartWirePreview("manual-force");
          publishWaveDebug(started ? "manual-force-started" : "manual-force-pending");
          return started;
        }
        publishWaveDebug("manual-force-waiting-for-frame-pair");
        return false;
      },
      getSnapshot: getWaveDebugSnapshot,
    };
  }

  function resize() {
    if (disposed) return;
    const rect = hero.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const nextWidth = rect.width;
    const nextHeight = rect.height;
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DPR) * qualityScale;
    const dimensionsChanged = nextWidth !== width || nextHeight !== height;
    if (dimensionsChanged && wirePreview.phase !== "hidden") cancelWirePreview();
    if (dimensionsChanged || nextPixelRatio !== pixelRatio) {
      width = nextWidth;
      height = nextHeight;
      pixelRatio = nextPixelRatio;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
    }
    if (dimensionsChanged) uniforms.uResolution.value.set(width, height);
    const aspect = width / height;
    uniforms.uSourceUvScale.value.set(
      aspect < SOURCE_ASPECT ? aspect / SOURCE_ASPECT : 1,
      aspect > SOURCE_ASPECT ? SOURCE_ASPECT / aspect : 1,
    );
    reportLoadingState("webgl-size", {
      width,
      height,
      pixelRatio,
      bufferWidth: overlayCanvas.width,
      bufferHeight: overlayCanvas.height,
      intersecting: inViewport,
    });
    requestRender();
  }

  function disposeTexturePair(pair) {
    pair.wire?.dispose();
  }

  function cancelWirePreview() {
    wirePreview.cancel();
    previewPending = false;
    uniforms.uPreviewProgress.value = 0;
    uniforms.uPreviewOpacity.value = 0;
    requestRender();
    publishWaveDebug("cancelled");
  }

  function tryStartWirePreview(trigger = "automatic") {
    if (disposed || overlayDisabled || reducedMotionQuery.matches || !inViewport || document.hidden) return false;
    if (!activePairAvailable || !hasBaseFrame || wirePreview.phase !== "hidden") {
      previewPending = true;
      debugLastBlock = !activePairAvailable ? "matching-wire-frame-not-ready" : !hasBaseFrame ? "base-frame-not-ready" : "preview-already-running";
      return false;
    }
        // Only start once scrolling has genuinely settled (Lenis keeps a short tail).
    if (hasUserScrolled && performance.now() - lastScrollAt < HERO_WIRE_PREVIEW.scrollIdleMs - 30) {
      previewPending = true;
      debugLastBlock = "user-still-scrolling";
      return false;
    }
    // The wave waits until the hero intro (auto-scroll + copy reveal) has finished.
    const introState = document.documentElement.dataset.heroIntro;
    if (introState && introState !== "done") {
      previewPending = true;
      debugLastBlock = "hero-intro-playing";
      return false;
    }
    const loadingScreen = document.querySelector(".loading-screen");
    if (loadingScreen && (!loadingScreen.classList.contains("hidden") || loadingScreen.classList.contains("is-revealing"))) {
      previewPending = true;
      debugLastBlock = "loading-screen-covers-hero";
      publishWaveDebug("start-deferred-loading-screen");
      return false;
    }
    const veilOpacity = Number.parseFloat(getComputedStyle(hero, "::after").opacity || "0");
    if (veilOpacity > 0.12) {
      previewPending = true;
      debugLastBlock = `hero-transition-veil:${veilOpacity.toFixed(2)}`;
      publishWaveDebug("start-deferred-hero-veil");
      return false;
    }
    if (document.documentElement.dataset.heroPlanComplete !== "true") {
      previewPending = true; // hero frames still arriving: wait for mycelium:loading-plan-complete
      debugLastBlock = "hero-plan-not-complete";
      return false;
    }
    if (probeState !== "done") {
      previewPending = true;
      debugLastBlock = "pre-roll";
      if (probeState === "idle") beginQualityProbe();
      return false;
    }
    const startedAt = performance.now();
    if (!wirePreview.start(startedAt)) return false;
    debugStartAt = startedAt;
    debugMaskSample = null;
    debugTriggerCount += 1;
    debugLastBlock = null;
    previewPending = false;
    debugForcePending = false;
    reportLoadingState("wire-preview-start", { frame: currentFrame, trigger });
    publishWaveDebug(`trigger:${trigger}`);
    requestRender();
    return true;
  }

  function updateWirePreview(timestamp) {
    if (wirePreview.phase === "hidden") return;
    const state = wirePreview.update(timestamp);
    uniforms.uPreviewProgress.value = state.progress;
    uniforms.uPreviewOpacity.value = state.opacity;
    publishWaveDebug(state.completed ? "scan-complete" : null);
    if (state.completed) {
      reportLoadingState("wire-preview-complete", { frame: currentFrame });
      document.dispatchEvent(new CustomEvent("mycelium:wire-preview-complete"));
    }
  }

  // Called once per rendered frame with the time since the previous one.
  // Resolution is only ever lowered during the INVISIBLE pre-roll (probe), never while the wave is on screen:
  // resizing the canvas mid-wave is itself a visible hitch. Capable machines never trigger it.
  function adaptQuality(timestamp, interval) {
    const probing = probeState === "running";
    const waving = wirePreview.phase !== "hidden";
    if (!lastRenderTime || (!probing && !waving)) { perfSince = 0; return; }
    const ms = Math.min(interval, 200);
    if (HERO_PERF_LOG) {
      perfFrames += 1;
      if (!perfSince) perfSince = timestamp;
      if (timestamp - perfSince >= 1000) {
        console.info(`[hero-perf] ${perfFrames} fps · render scale ${qualityScale.toFixed(2)} · ${Math.round(width * pixelRatio)}x${Math.round(height * pixelRatio)}px · ${probing ? "pre-roll" : "wave"}`);
        perfFrames = 0;
        perfSince = timestamp;
      }
    }
    if (!probing) return;
    if (probeSettle > 0) { probeSettle -= 1; return; } // the frame after a resize is not representative
    slowFrames = ms > 46 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames >= 4 && qualityScale > 0.55 && timestamp - lastQualityChange > 250) {
      qualityScale = Math.max(0.55, qualityScale - 0.15);
      slowFrames = 0;
      probeSettle = 2;
      lastQualityChange = timestamp;
      if (HERO_PERF_LOG) console.info(`[hero-perf] pre-roll: render scale lowered to ${qualityScale.toFixed(2)}`);
      resize();
    }
  }

  // Invisible pre-roll: run the same shader path as the wave (progress mid-way, opacity ~0) for a moment, let
  // adaptQuality pick a resolution this GPU can hold, then start the real wave.
  function beginQualityProbe() {
    probeState = "running";
    slowFrames = 0;
    probeSettle = 2;
    uniforms.uPreviewProgress.value = 0.5;
    uniforms.uPreviewOpacity.value = 0.001;
    requestRender();
    window.setTimeout(() => {
      probeState = "done";
      uniforms.uPreviewProgress.value = 0;
      uniforms.uPreviewOpacity.value = 0;
      if (previewPending) tryStartWirePreview("pre-roll-complete");
    }, WAVE_PREROLL_MS);
  }

  function sampleDiagnosticMaskPixel(timestamp) {
    if (!HERO_WAVE_DEBUG_ENABLED || wirePreview.phase === "hidden" || timestamp - debugLastSampleAt < 500) return;
    debugLastSampleAt = timestamp;
    try {
      const gl = renderer.getContext();
      const widthPx = renderer.domElement.width;
      const heightPx = renderer.domElement.height;
      const scanFront = uniforms.uPreviewProgress.value * (1 + uniforms.uPreviewTotalHeight.value);
      const sampleV = clamp(scanFront - uniforms.uPreviewMainHeight.value * 0.5, 0.02, 0.98);
      const rgba = new Uint8Array(4);
      gl.readPixels(Math.floor(widthPx / 2), Math.floor(sampleV * heightPx), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      debugMaskSample = {
        x: Math.floor(widthPx / 2),
        y: Math.floor(sampleV * heightPx),
        rgba: [...rgba],
        diagnosticBandPixel: (rgba[0] > 175 && rgba[2] > 145 && rgba[1] < 145)
          || (rgba[1] > 175 && rgba[0] < 145 && rgba[2] < 145),
        sampledWireInkPixel: rgba[1] > 175 && rgba[0] < 145 && rgba[2] < 145,
      };
      publishWaveDebug();
    } catch (error) {
      debugMaskSample = { error: String(error?.message ?? error) };
      publishWaveDebug("mask-pixel-read-failed");
    }
  }

  function onLoadingScreenMutation() {
    if (previewPending && document.querySelector(".loading-screen")?.classList.contains("hidden")) {
      tryStartWirePreview(debugForcePending ? "debug-auto-force" : "loading-screen-dismissed");
    }
  }

  const loadingScreen = document.querySelector(".loading-screen");
  const loadingScreenObserver = loadingScreen && typeof MutationObserver !== "undefined"
    ? new MutationObserver(onLoadingScreenMutation)
    : null;
  loadingScreenObserver?.observe(loadingScreen, { attributes: true, attributeFilter: ["class"] });
  // loading-reveal.js plays its zoom first; the wave starts a moment after it ends so the two never compete.
  document.addEventListener("mycelium:loading-revealed", () => {
    window.setTimeout(() => { if (previewPending) tryStartWirePreview("loading-revealed"); }, 150);
  }, { once: true });
  document.addEventListener("mycelium:loading-plan-complete", () => { if (previewPending) tryStartWirePreview("plan-complete"); }, { once: true });
  document.addEventListener("mycelium:hero-intro-complete", () => {
    window.setTimeout(() => { if (previewPending) tryStartWirePreview("hero-intro-complete"); }, 700);
  }, { once: true });

  let lastScrollY = window.scrollY;
  function onWindowScroll() {
    const y = window.scrollY;
    if (Math.abs(y - lastScrollY) < 2) return;   // ignore sub-pixel smooth-scroll tail
    lastScrollY = y;
    hasUserScrolled = true;
    lastScrollAt = performance.now();
    cancelWirePreview();
    previewPending = true;
    window.clearTimeout(previewIdleTimer);
    previewIdleTimer = window.setTimeout(() => {
      if (performance.now() - lastScrollAt >= HERO_WIRE_PREVIEW.scrollIdleMs) tryStartWirePreview("scroll-idle");
    }, HERO_WIRE_PREVIEW.scrollIdleMs);
  }

  function trimTextureCache(protectedFrame) {
    if (textureCache.size <= TEXTURE_CACHE_LIMIT) return;
    for (const [index, pair] of textureCache) {
      if (index === protectedFrame || index === currentFrame) continue;
      textureCache.delete(index);
      disposeTexturePair(pair);
      if (textureCache.size <= TEXTURE_CACHE_LIMIT) break;
    }
  }

  function loadTexture(url) {
    let timedOut = false;
    let timeoutId;
    const loading = loader.loadAsync(url).then((texture) => {
      if (timedOut || disposed) { texture.dispose(); throw new Error(`Late texture result: ${url}`); }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    });
    const timeout = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        timedOut = true;
        reject(new Error(`Texture request timed out after ${TEXTURE_LOAD_TIMEOUT_MS} ms: ${url}`));
      }, TEXTURE_LOAD_TIMEOUT_MS);
    });
    return Promise.race([loading, timeout]).finally(() => clearTimeout(timeoutId));
  }

  async function requestFrameTextures(index) {
    if (textureCache.has(index)) {
      const cached = textureCache.get(index);
      textureCache.delete(index);
      textureCache.set(index, cached);
      return cached;
    }
    if (pendingFrames.has(index)) return pendingFrames.get(index);

    const wireUrl = wireSequence
      ? frameUrl(wireSequence.directory, index, wireSequence.pattern, wireSequence.extension)
      : null;

    const loadWithRetry = async (url) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try { return await loadTexture(url); }
        catch (error) {
          if (attempt === 1) console.warn(`[hero-interaction] Texture failed twice: ${url}`, error);
        }
      }
      return null;
    };

    const loadPromise = (wireUrl ? loadWithRetry(wireUrl) : Promise.resolve(null)).then((wire) => {
      pendingFrames.delete(index);
      const pair = { wire };
      // Never cache a failed wire texture: that made the wave impossible for this frame forever.
      if (wire) {
        textureCache.set(index, pair);
        trimTextureCache(index);
      }
      return pair;
    }).catch((error) => {
      pendingFrames.delete(index);
      throw error;
    });
    pendingFrames.set(index, loadPromise);
    return loadPromise;
  }

  async function processDesiredFrame() {
    if (processingFrameRequest || disposed) return;
    processingFrameRequest = true;
    while (desiredFrameRequest && !disposed) {
      const request = desiredFrameRequest;
      desiredFrameRequest = null;
      const oneBasedIndex = request.assetIndex;
      try {
        const pair = await requestFrameTextures(oneBasedIndex);
        if (disposed || request.requestId !== latestFrameRequest) continue;

        if (!pair.wire) {
          activePairAvailable = false;
          overlayCanvas.style.opacity = "0";
          baseCanvas.style.opacity = "1";
          request.commit();
          settleFirstRenderItem(true);
          if ((request.retries ?? 0) < 3) {
            window.setTimeout(() => {
              if (disposed || request.requestId !== latestFrameRequest || desiredFrameRequest) return;
              desiredFrameRequest = { ...request, retries: (request.retries ?? 0) + 1 };
              processDesiredFrame();
            }, 2500);
          }
          continue;
        }

        renderer.initTexture?.(pair.wire);
        currentFrame = oneBasedIndex;
        uniforms.uWireMap.value = pair.wire;
        overlayCanvas.dataset.frameIndex = String(oneBasedIndex);
        overlayCanvas.dataset.wireFrame = String(oneBasedIndex);
        activePairAvailable = true;
        trimTextureCache(oneBasedIndex);
        request.commit();
        if (previewPending) tryStartWirePreview("matching-pair-ready");
        requestRender();
      } catch (error) {
        console.warn(`[hero-interaction] Synchronized frame ${oneBasedIndex} failed.`, error);
        if (request.requestId === latestFrameRequest) {
          activePairAvailable = false;
          overlayCanvas.style.opacity = "0";
          baseCanvas.style.opacity = "1";
          request.commit();
          settleFirstRenderItem(true);
        }
      }
    }
    processingFrameRequest = false;
    if (desiredFrameRequest && !disposed) processDesiredFrame();
  }

  let pairTimer = 0;
  function onHeroFrameRequest(event) {
    const index = Number(event.detail?.currentIndex);
    const assetIndex = Number(event.detail?.assetIndex);
    if (!Number.isInteger(index) || index < 0 || index >= FRAME_COUNT
      || !Number.isInteger(assetIndex) || assetIndex < 1 || assetIndex > FRAME_COUNT
      || typeof event.detail?.commit !== "function") return;
    event.preventDefault();
    if (overlayDisabled) { event.detail.commit(); return; }
    activePairAvailable = false;
    overlayCanvas.style.opacity = "0";
    baseCanvas.style.opacity = "1";
    latestFrameRequest += 1;
    desiredFrameRequest = {
      currentIndex: index,
      assetIndex,
      requestId: latestFrameRequest,
      commit: event.detail.commit,
    };
    event.detail.commit();
    requestRender();
    // While the user is scrubbing, only the 2D base canvas is drawn.
    // The heavy wire textures load once scrolling settles.
    window.clearTimeout(pairTimer);
    pairTimer = window.setTimeout(processDesiredFrame, PAIR_SETTLE_MS);
  }

  function onHeroFrameCommit(event) {
    const assetIndex = Number(event.detail?.assetIndex);
    if (!Number.isInteger(assetIndex) || assetIndex < 1 || assetIndex > FRAME_COUNT) return;
    if (activePairAvailable && currentFrame !== assetIndex) {
      activePairAvailable = false;
      overlayCanvas.style.opacity = "0";
      baseCanvas.style.opacity = "1";
      return;
    }
    baseCanvas.dataset.syncFrame = String(assetIndex);
    hasBaseFrame = true;
    syncBaseTexture();
    baseTexture.needsUpdate = true;
    requestRender();
    if (previewPending && performance.now() - lastScrollAt >= HERO_WIRE_PREVIEW.scrollIdleMs) tryStartWirePreview();
  }

  function onPointerMove(event) {
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      pointerInside = false;
      activeTarget = 0;
      targetEnergy = 0;
      targetVelocity.set(0, 0);
      requestRender();
      return;
    }

    const now = performance.now();
    const nextX = x / rect.width;
    const nextY = 1 - y / rect.height;
    if (pointerInside && lastPointerTime > 0) {
      const elapsed = Math.max(now - lastPointerTime, 1);
      const seconds = elapsed * 0.001;
      targetVelocity.set((nextX - pointer.x) / seconds, (nextY - pointer.y) / seconds);
      if (targetVelocity.length() > 3.5) targetVelocity.setLength(3.5);
      targetEnergy = clamp(targetVelocity.length() / 2.2, 0, 1);
    } else {
      current.set(nextX, nextY);
      trail.set(nextX, nextY);
      targetVelocity.set(0, 0);
      velocity.set(0, 0);
      targetEnergy = 0;
    }
    pointer.set(nextX, nextY);
    lastPointerTime = now;
    pointerInside = true;
    activeTarget = 1;
    requestRender();
  }

  let lastPointerTime = 0;
  function onPointerLeave() {
    pointerInside = false;
    activeTarget = 0;
    targetEnergy = 0;
    targetVelocity.set(0, 0);
    lastPointerTime = 0;
    requestRender();
  }

  function render(timestamp) {
    rafId = 0;
    if (disposed || !inViewport || document.hidden || !width || !height) return;

    if (timestamp - lastRenderTime < 1000 / 30 - 3) { // -3 ms tolerance: otherwise a 33.3 ms vsync slot can be skipped, halving the frame rate
      rafId = requestAnimationFrame(render);
      return;
    }

    const delta = lastTime ? Math.min(timestamp - lastTime, 50) : 16.67;
    adaptQuality(timestamp, timestamp - lastRenderTime);
    lastTime = timestamp;
    lastRenderTime = timestamp;
    const frameScale = delta / 16.67;
    const pointerEase = 1 - Math.pow(0.9, frameScale);
    current.lerp(pointer, pointerEase);
    trail.lerp(current, 1 - Math.pow(0.955, frameScale));
    velocity.lerp(targetVelocity, pointerEase);
    targetVelocity.multiplyScalar(Math.pow(0.82, frameScale));
    const idleFor = lastPointerTime ? performance.now() - lastPointerTime : Infinity;
    const userPresenceTarget = pointerInside && idleFor < 1500 ? 1 : 0;
    userPresence += (userPresenceTarget - userPresence) * (1 - Math.pow(userPresenceTarget ? 0.88 : 0.975, frameScale));
    active += (activeTarget - active) * (1 - Math.pow(activeTarget ? 0.84 : 0.972, frameScale));
    energy += (targetEnergy - energy) * pointerEase;
    targetEnergy *= Math.pow(0.96, frameScale);

    uniforms.uPointer.value.copy(current);
    uniforms.uTrail.value.copy(trail);
    uniforms.uVelocity.value.copy(velocity);
    uniforms.uTime.value = timestamp * 0.001;
    uniforms.uActive.value = active;
    uniforms.uMotion.value = clamp(energy, 0, 1);
    uniforms.uUserPresence.value = userPresence;
    updateWirePreview(timestamp);
        // No matching wire frame (e.g. while scrolling): skip the expensive shader.
    // The loop is restarted by requestRender() when a pair becomes ready.
    if (!(hasBaseFrame && activePairAvailable)) {
      overlayCanvas.style.opacity = "0";
      baseCanvas.style.opacity = "1";
      return;
    }
    syncBaseTexture();
    try {
      renderer.render(scene, camera);
      debugRenderCount += 1;
    } catch (error) {
      console.warn("[hero-interaction] WebGL render failed; using the base sequence.", error);
      overlayDisabled = true;
      activePairAvailable = false;
      overlayCanvas.style.opacity = "0";
      baseCanvas.style.opacity = "1";
      settleFirstRenderItem(true);
      reportLoadingState("render-failed", { message: String(error?.message ?? error) });
      debugLastBlock = `renderer-error:${String(error?.message ?? error)}`;
      publishWaveDebug("renderer-failed");
      return;
    }

    if (hasBaseFrame && activePairAvailable) {
      overlayCanvas.style.opacity = "1";
      baseCanvas.style.opacity = "0";
      if (!didFirstRender) didFirstRender = true;
      settleFirstRenderItem(false);
      if (debugForcePending && !debugAutoAttempted) {
        debugAutoAttempted = true;
        const started = tryStartWirePreview("debug-auto-force");
        if (started) debugForcePending = false;
      } else if (!initialPreviewStarted && !hasUserScrolled) {
        initialPreviewStarted = true;
        tryStartWirePreview("initial-entry");
      }
    } else {
      overlayCanvas.style.opacity = "0";
      baseCanvas.style.opacity = "1";
    }

    sampleDiagnosticMaskPixel(timestamp);
    publishWaveDebug();

    rafId = requestAnimationFrame(render);
  }

  function requestRender() {
    if (!overlayDisabled && !rafId && inViewport && !document.hidden) rafId = requestAnimationFrame(render);
  }

  function scheduleResize() {
    if (resizeRaf || disposed) return;
    resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; resize(); });
  }

  const observer = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
    reportLoadingState("intersection-change", { intersecting: inViewport });
    if (inViewport) requestRender();
    else {
      cancelWirePreview();
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastTime = 0;
      }
    }
  }, { threshold: 0.01 });

  function onVisibilityChange() {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastTime = 0;
      cancelWirePreview();
    } else if (!document.hidden) requestRender();
  }

  function onReducedMotionChange(event) {
    if (event.matches) cancelWirePreview();
  }

  function onContextLost(event) {
    event.preventDefault();
    overlayDisabled = true;
    activePairAvailable = false;
    overlayCanvas.style.opacity = "0";
    baseCanvas.style.opacity = "1";
    settleFirstRenderItem(true);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    observer.disconnect();
    loadingScreenObserver?.disconnect();
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeObserver?.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("resize", scheduleResize);
    window.removeEventListener("scroll", onWindowScroll);
    window.clearTimeout(previewIdleTimer);
    reducedMotionQuery.removeEventListener?.("change", onReducedMotionChange);
    if (window.visualViewport) window.visualViewport.removeEventListener("resize", scheduleResize);
    document.removeEventListener("mycelium:hero-frame-request", onHeroFrameRequest);
    document.removeEventListener("mycelium:hero-frame", onHeroFrameCommit);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    overlayCanvas.removeEventListener("webglcontextlost", onContextLost);
    window.removeEventListener("pagehide", dispose);
    baseCanvas.style.opacity = "1";
    for (const pair of textureCache.values()) disposeTexturePair(pair);
    textureCache.clear();
    pendingFrames.clear();
    baseTexture.dispose();
    neutralTexture.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    overlayCanvas.remove();
  }

  overlayCanvas.addEventListener("webglcontextlost", onContextLost, { passive: false });
  observer.observe(hero);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  window.addEventListener("resize", scheduleResize, { passive: true });
  window.addEventListener("scroll", onWindowScroll, { passive: true });
  reducedMotionQuery.addEventListener?.("change", onReducedMotionChange);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", scheduleResize, { passive: true });
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(hero);
  }
  document.addEventListener("mycelium:hero-frame", onHeroFrameCommit);
  document.addEventListener("mycelium:hero-frame-request", onHeroFrameRequest);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", dispose, { once: true });
  resize();

  requestRender();
  document.dispatchEvent(new Event("mycelium:hero-frame-sync-ready"));
}

mountFrameInteraction().catch((error) => {
  console.error("[hero-interaction] Unable to initialize the frame interaction.", error);
  settleFailedMount?.();
  reportLoadingState("initialization-error", { message: String(error?.message ?? error) });
});
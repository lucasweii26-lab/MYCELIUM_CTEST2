# MYCELIUM - Project Rules for Codex

## Owner instructions come first
The owner's explicit instruction in chat always wins. These rules are defaults, not blockers: never refuse or stop to ask because of a rule or a missing file. Do what the owner asked and mention any conflict in one line afterwards. Pause only for irreversible or destructive actions (deleting data, force-push, overwriting uncommitted work) and anything that would expose secrets. Never commit or push unless the owner asks.

## Mission
Bring MYCELIUM to the craft level of landonorris.com (benchmark for polish, interactivity, motion and modular storytelling) while keeping MYCELIUM's own identity: premium, natural, technological, humanist smart community. The benchmark is a QUALITY BAR, not a visual clone. Never copy code, text, images, fonts or exact layouts from any other site.
When designing a NEW visual or motion effect, check `docs/reference-effects.md` if it exists. If it is missing, continue using the Mission and Brand sections and mention it in one line at the end. Never block or refuse a task because this file is missing. Asset swaps (textures, images, fonts, copy), bug fixes and small tweaks never need it.

## Architecture (Hybrid)
- Bottom layer: one full-screen WebGL canvas (Three.js) for 2.5D depth parallax, fluid/cursor-reactive masks, and later a 3D community model.
- Top layer: transparent HTML DOM for ALL text, navigation, forms and buttons. Never bake page text into WebGL textures (SEO, selectable text, accessibility).
- Mouse/touch events are listened on `window`/DOM (the DOM layer sits above the canvas) and mapped to WebGL with normalized device coordinates: x = (clientX / innerWidth) * 2 - 1, y = -(clientY / innerHeight) * 2 + 1.
- WebGL is PROGRESSIVE ENHANCEMENT: if WebGL is unavailable, the device is low-power, `prefers-reduced-motion` is on, or `Save-Data` is set, fall back to the existing hero (hero-frames / static image). The site must always work without WebGL.
- WebGL, GSAP, ScrollTrigger and Lenis load ONLY on the public site, never in `/admin`.

## Stack facts (do not break)
- Vite build (`npm run build` -> `dist`). Classic scripts `app.js`, `script.js`, `hero-sequence.js` and the `hero-frames/` folder are copied to `dist` by a plugin in `vite.config.js`. New WebGL/GSAP code goes in a separate ES module entry (e.g. `webgl/main.js`) referenced by `<script type="module">`; do not convert the classic scripts.
- `vite.config.js` has `publicDir: false` and `assetsInlineLimit: 0`. Any new static asset (GLB models, Draco decoder files, textures) must be imported through Vite (`?url`) or added to the copy plugin; verify it exists in `dist` after build.
- Netlify via GitHub. `netlify.toml` has the `mycelium-country` edge function (path `/`) and SPA rewrites per location (`/my/*`; add `/us/*` only when launching the US site).
- Firestore content is multilingual with suffix fields (`_en`, `_ms`, `_ta`, `_zh-CN`, `_es`). Fallback: selected language -> `_en` -> legacy field.
- AI chat runs in a Netlify function; keys only in Netlify environment variables.
- `reports` (AI chat reports) and `volunteers` (with GIFs) are GLOBAL. Everything else location-owned lives under `locations/{code}/...`.
- Announcement dates use the display string `DD MON YYYY`; event dates are ISO. Do not change formats.

## Dependencies
- Allowed for the WebGL/motion work: `three`, `gsap` (with ScrollTrigger), `lenis`.
- If `three`, `gsap` or `lenis` is missing from `package.json`, install it with `npm install` (pinned version) and state the size afterwards. For any other dependency, give one line of reasoning and proceed, unless it is larger than about 100 KB gzipped.
- Use Draco-compressed GLB; no uncompressed models.

## Brand (Identity Override)
- Tone: premium, natural, technological, humanist. Whitespace and breathing room; modern elegant sans/serif pairing; no childish or cartoon illustration; "digital twin + lifestyle aesthetics".
- Colours and fonts: use ONLY the CSS variables already defined in `style.css` / `country-selector.css` / `admin/admin.css`. Do not invent hex values. If a needed token is missing, ask the owner. (Current direction: forest green, leaf grey-green, warm paper, bark brown; Playfair Display + DM Sans.)
- Animation must feel restrained, fluid and expensive - conveying safety and comfort, never flashy.

## Loading screen
- Keep the "older" loading feel: minimum display about 2.4 s, 0.7 s fade-out.
- Progress must be REAL: driven by `THREE.LoadingManager` (and fonts/images/data that matter), never a fake `setTimeout` counter. Display = max(real loading finished, 2.4 s minimum). Trigger the exit animation only after textures/geometries are loaded AND uploaded to the GPU.

## Non-negotiable rules
1. Do not change business logic, Firestore field names or data formats unless asked.
2. Homepage structure and hero content stay the same for every location; only data-driven content and the facility map differ.
3. Never hardcode Malaysia-specific facts in shared code. The browser may send only a `countryCode`; the server validates it and loads the location context itself.
4. Migrations are additive: copy, verify counts, switch reads, delete nothing unless asked.
5. Never commit, push or deploy unless explicitly asked. Never expose secrets.

## Quality bar
- 60 fps target on a mid-range phone; cap `devicePixelRatio` (about 2 desktop, 1.5 mobile); pause the render loop when the tab is hidden or the canvas is off-screen; handle `webglcontextlost`; dispose geometries, materials and textures on teardown.
- Accessibility: focus states, semantic HTML, AA contrast, keyboard use, `prefers-reduced-motion`, touch fallback for every cursor effect.
- Responsive at 375 / 768 / 1440 px; layouts must survive long Tamil/Spanish text and CJK; refresh ScrollTrigger after language change and after Firestore content renders.

## Workflow
1. State a 3-6 line plan and the files to change before coding. Large visual work: one section at a time.
2. After coding, run the build, check the console, and report what was verified and what was not.
3. Reply in the language the user writes in. Code, identifiers and comments in English.

## Skills
- `mycelium-webgl-loading` - Three.js loading, Draco, loader-to-WebGL handoff.
- `mycelium-gsap-motion` - GSAP, ScrollTrigger, Lenis choreography.
- `mycelium-location-engineering` - Firestore, locations, routes, i18n, AI context.
- `mycelium-qa-release` - checks before finishing.

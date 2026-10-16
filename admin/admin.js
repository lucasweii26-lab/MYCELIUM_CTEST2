import { getGallerySeed } from "../gallery-seed.js";

// Admin-only browser UI. Firestore Rules, not this client check, enforce access.
// Firebase's web config is public project metadata; no service-account secret belongs here.
const firebaseConfig = {
  apiKey: "AIzaSyCenfhVQjmGSVOflXL0wOqK9GqUCAzfL34",
  authDomain: "mycelium-residence.firebaseapp.com",
  projectId: "mycelium-residence",
  storageBucket: "mycelium-residence.firebasestorage.app",
  messagingSenderId: "982178911104",
  appId: "1:982178911104:web:948912553056b2ea162765"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// Storage SDK is optional: without it the gallery form still works with pasted image URLs.
const storage = typeof firebase.storage === "function" ? firebase.storage() : null;
const app = document.getElementById("app");
const dialog = document.getElementById("recordDialog");
const details = document.getElementById("recordDetails");
const routeTitles = {
  "/admin/dashboard": "Dashboard",
  "/admin/newsletter": "Newsletter subscribers",
  "/admin/volunteer": "Volunteer applications",
  "/admin/announcements": "Announcements",
  "/admin/events": "Events calendar",
  "/admin/gallery": "Gallery"
};
const initialRegion = new URLSearchParams(location.search).get("region");
const rememberedRegion = localStorage.getItem("myceliumCountry");
const cookieRegion = document.cookie.match(/(?:^|;\s*)myceliumCountry=([A-Z]{2})(?:;|$)/i)?.[1];
const hintedRegion = document.cookie.match(/(?:^|;\s*)myceliumCountryHint=([A-Z]{2})(?:;|$)/i)?.[1];
const rememberedAdminRegion = localStorage.getItem("myceliumAdminRegion");
let adminCountryCode = [initialRegion, rememberedAdminRegion, rememberedRegion, cookieRegion, hintedRegion].find((code) => code === "MY" || code === "US") || "MY";
let adminCountryScopes = ["MY"];

// MY stays on the legacy collections; other regions read only their own namespace.
function adminCollection(name) {
  return adminCountryCode === "MY"
    ? db.collection(name)
    : db.collection("locations").doc(adminCountryCode).collection(name);
}

function collectionPath(name) {
  return adminCountryCode === "MY" ? name : `locations/${adminCountryCode}/${name}`;
}

// Force-refresh the ID token before private reads so newly assigned admin claims
// are not held back by a stale browser session. Include only non-secret auth
// metadata in diagnostics to make Firebase Rules mismatches easier to identify.
async function refreshAdminTokenForRead(user, collectionNames) {
  const token = await user.getIdTokenResult(true);
  const claims = token.claims || {};
  const scopes = Array.isArray(claims.adminLocations) ? claims.adminLocations : [];
  console.info("[Mycelium admin] Firestore read context", {
    projectId: firebaseConfig.projectId,
    region: adminCountryCode,
    paths: collectionNames.map(collectionPath),
    authenticated: Boolean(user.uid),
    emailVerified: claims.email_verified === true,
    admin: claims.admin === true,
    adminLocations: scopes,
    myAdmin: claims.myAdmin === true,
    usAdmin: claims.usAdmin === true
  });
  return token;
}

// Escape database values before inserting them into the admin DOM.
function escapeHtml(value) {
  return String(value ?? "—").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "Pending timestamp";
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function sortableDate(value) {
  if (!value) return 0;
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12).getTime();
  const dayFirst = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (dayFirst) return new Date(`${dayFirst[2]} ${dayFirst[1]}, ${dayFirst[3]}`).getTime() || 0;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function currentRoute() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (routeTitles[path] || path === "/admin/login") return path;
  const localRoute = new URLSearchParams(location.search).get("route");
  if (window.MYCELIUM_LOCAL_PREVIEW && path === "/admin/index.html" && localRoute?.startsWith("/admin/")) return localRoute;
  if (path === "/admin" || path === "/admin/") return "/admin/login";
  return path;
}

function navigate(path) {
  history.pushState({}, "", path);
  renderRoute();
}

// Render the email/password form and verify the signed-in account's claim.
function renderLogin(message = "") {
  app.innerHTML = `
    <section class="login-wrap"><form class="login-card" id="loginForm">
      <span class="eyebrow">MYCELIUM RESIDENCES · ADMIN</span>
      <h1 class="brand">Welcome back</h1>
      <p class="muted">Sign in with an administrator account to manage community submissions.</p>
      <label class="field"><span>Email address</span><input name="email" type="email" autocomplete="username" required></label>
      <label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>
      <p class="error" id="loginError" role="alert">${escapeHtml(message)}</p>
      <button class="button" type="submit">Sign in securely</button>
      <p class="muted"><a href="/" style="color:inherit">Return to community website</a></p>
    </form></section>`;
  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    const error = document.getElementById("loginError");
    button.disabled = true;
    error.textContent = "";
    try {
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      await auth.signInWithEmailAndPassword(email, password);
      await ensureAdmin(auth.currentUser, true);
      navigate("/admin/dashboard");
    } catch (err) {
      error.textContent = err.code === "auth/invalid-credential"
        ? "Email or password is incorrect."
        : err.message || "Sign-in failed.";
      button.disabled = false;
    }
  });
}

// Refresh/inspect the Firebase ID token for the admin Custom Claim.
async function ensureAdmin(user, forceRefresh = false) {
  if (!user) return false;
  const token = await user.getIdTokenResult(forceRefresh);
  const scopes = new Set(Array.isArray(token.claims.adminLocations) ? token.claims.adminLocations : []);
  if (token.claims.myAdmin === true) scopes.add("MY");
  if (token.claims.usAdmin === true && token.claims.email_verified === true) scopes.add("US");
  if (!scopes.size && token.claims.admin === true) scopes.add("MY");
  adminCountryScopes = [...scopes].filter((code) => code === "MY" || code === "US");
  if (!adminCountryScopes.includes(adminCountryCode)) adminCountryCode = adminCountryScopes[0] || "";
  if (adminCountryCode) localStorage.setItem("myceliumAdminRegion", adminCountryCode);
  return (token.claims.admin === true || token.claims.myAdmin === true || token.claims.usAdmin === true)
    && adminCountryScopes.length > 0;
}

// Shared authenticated frame, route navigation and sign-out control.
function shell(content, active, user) {
  const links = [
    ["/admin/dashboard", "Overview"],
    ["/admin/announcements", "Announcements"],
    ["/admin/events", "Events"],
    ["/admin/gallery", "Gallery"],
    ["/admin/newsletter", "Newsletter"],
    ["/admin/volunteer", "Volunteers"]
  ];
  app.innerHTML = `<div class="shell">
    <aside class="sidebar"><div class="sidebar-top"><div><span class="eyebrow">MYCELIUM RESIDENCES</span><p class="side-brand">Admin desk</p><label class="region-switch">Data region<select id="adminRegionSelect" aria-label="Choose admin data region">${adminCountryScopes.map((code) => `<option value="${code}" ${code === adminCountryCode ? "selected" : ""}>${code === "MY" ? "Malaysia" : "United States"}</option>`).join("")}</select></label></div></div>
      <nav class="nav" aria-label="Admin navigation">${links.map(([href, text]) => `<a href="${href}" data-route="${href}" ${active === href ? 'aria-current="page"' : ""}>${text}</a>`).join("")}</nav>
      <div class="sidebar-bottom"><a class="site-return" href="${adminCountryCode === "US" ? "/us/" : "/my/"}">← Return to ${adminCountryCode === "US" ? "US" : "Malaysia"} site</a><span class="user-email">${escapeHtml(user.email)}</span><button class="button secondary" id="signOut">Sign out</button></div>
    </aside><section class="main"><header class="topbar"><div><span class="eyebrow">COMMUNITY MANAGEMENT</span><h1>${escapeHtml(routeTitles[active])}</h1></div><span class="user-email">Signed in as administrator</span></header>${content}</section>
  </div>`;
  app.querySelectorAll("[data-route]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault(); navigate(link.getAttribute("href"));
  }));
  document.getElementById("adminRegionSelect").addEventListener("change", (event) => {
    if (!adminCountryScopes.includes(event.target.value)) return;
    adminCountryCode = event.target.value;
    localStorage.setItem("myceliumAdminRegion", adminCountryCode);
    renderRoute();
  });
  document.getElementById("signOut").addEventListener("click", async () => {
    await auth.signOut();
    navigate("/admin/login");
  });
}

function collectionForRoute(route) {
  return adminCollection(route === "/admin/newsletter" ? "newsletter_subscribers" : "volunteers");
}

// Read the selected Firestore collection, show searchable rows and detail dialogs.
async function loadRows(route, user) {
  const recordsCollection = route === "/admin/newsletter" ? "newsletter_subscribers" : "volunteers";
  shell(`<div class="toolbar"><p class="muted">Private records stored in <code>${escapeHtml(collectionPath(recordsCollection))}</code>.</p><div class="toolbar-actions"><input class="search-input" id="searchRows" type="search" placeholder="Search records" aria-label="Search records"><button class="button secondary" id="exportCsv" type="button">Export CSV</button></div></div><div id="rows" class="status" aria-busy="true">Loading records…</div>`, route, user);
  const mount = document.getElementById("rows");
  try {
    await refreshAdminTokenForRead(user, [recordsCollection]);
    const collection = collectionForRoute(route);
    const snapshot = await collection.get();
    mount.setAttribute("aria-busy", "false");
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const fields = route === "/admin/newsletter"
      ? [["Name", (row) => row.fullName || row.name || "Not provided"], ["Email", (row) => row.email || "—"], ["Submitted", (row) => formatDate(row.subscribedAt || row.createdAt)]]
      : [["Name", (row) => row.fullName], ["Activity", (row) => row.activity], ["Phone", (row) => row.phone], ["Submitted", (row) => formatDate(row.createdAt)]];
    let shown = records;
    const render = (query = "") => {
      const filtered = records.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
      shown = filtered;
      if (!filtered.length) { mount.innerHTML = `<div class="empty">No matching submissions found.</div>`; return; }
      mount.innerHTML = `<div class="table-wrap"><table><thead><tr>${fields.map(([label]) => `<th>${escapeHtml(label)}</th>`).join("")}<th>Record</th></tr></thead><tbody>${filtered.map((row) => `<tr>${fields.map(([, get]) => `<td>${escapeHtml(get(row))}</td>`).join("")}<td><button class="table-action" type="button" data-record="${escapeHtml(row.id)}">View details</button></td></tr>`).join("")}</tbody></table></div>`;
      mount.querySelectorAll("[data-record]").forEach((button) => button.addEventListener("click", () => showRecord(records.find((row) => row.id === button.dataset.record))));
    };
    render();
    document.getElementById("exportCsv").addEventListener("click", () => {
      if (!shown.length) return;
      downloadCsv(`${route === "/admin/newsletter" ? "newsletter" : "volunteers"}-${adminCountryCode}-${new Date().toISOString().slice(0, 10)}.csv`, shown);
    });
    document.getElementById("searchRows").addEventListener("input", (event) => render(event.target.value));
  } catch (err) {
    console.error("Admin Firestore read failed:", err);
    mount.setAttribute("aria-busy", "false");
    mount.innerHTML = `<div class="empty">Could not load records. Confirm this account has the admin custom claim and that Firestore Rules are deployed.</div>`;
  }
}

// Display every stored field for one selected document.
function showRecord(record) {
  if (!record) return;
  document.getElementById("recordTitle").textContent = record.fullName || record.email || "Submission";
  details.innerHTML = Object.entries(record).map(([key, value]) => {
    const display = value?.toDate ? formatDate(value) : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "—");
    return `<dt>${escapeHtml(key.replace(/([A-Z])/g, " $1"))}</dt><dd>${escapeHtml(display)}</dd>`;
  }).join("");
  dialog.showModal();
}

// Count the two private collections for the dashboard summary cards.
async function loadDashboard(user) {
  shell(`<div id="dashboardStatus" class="status" aria-busy="true">Loading totals…</div><div class="stats" id="stats" hidden></div><section class="panel"><h2>Manage submissions</h2><p class="muted">Review recent community newsletter sign-ups and volunteer applications.</p><div class="toolbar"><a class="button" href="/admin/newsletter" data-route="/admin/newsletter">Open newsletter</a><a class="button secondary" href="/admin/volunteer" data-route="/admin/volunteer">Open volunteers</a></div><h2>Manage community updates</h2><p class="muted">Announcements are resident notices. Events are scheduled calendar entries. The gallery holds stories from past events.</p><div class="toolbar"><a class="button" href="/admin/announcements" data-route="/admin/announcements">Manage announcements</a><a class="button secondary" href="/admin/events" data-route="/admin/events">Manage events</a><a class="button secondary" href="/admin/gallery" data-route="/admin/gallery">Manage gallery</a></div><p class="muted">Current data region: <strong>${adminCountryCode === "US" ? "United States" : "Malaysia"}</strong>. Newsletter records are stored in <code>${escapeHtml(collectionPath("newsletter_subscribers"))}</code>.</p></section>`, "/admin/dashboard", user);
  try {
    await refreshAdminTokenForRead(user, ["newsletter_subscribers", "volunteers"]);
    const count = (name, filter) => adminCollection(name).get()
      .then((snap) => (filter ? snap.docs.filter((doc) => filter(doc.data())) : snap.docs).length)
      .catch(() => "—");
    // Submissions must load (they gate the page); content counts degrade to "—" if a rule is missing.
    const [newsletter, volunteers] = await Promise.all([
      adminCollection("newsletter_subscribers").get(), adminCollection("volunteers").get()
    ]);
    const [announcements, events, gallery] = await Promise.all([
      count("announcements", inAdminRegion), count("events", inAdminRegion), count("gallery_events")
    ]);
    document.getElementById("dashboardStatus").remove();
    const stats = document.getElementById("stats");
    stats.hidden = false;
    stats.innerHTML = [
      ["Total subscribers", newsletter.size], ["Volunteer applications", volunteers.size],
      ["Announcements", announcements], ["Calendar events", events], ["Gallery events", gallery]
    ].map(([label, total]) => `<article class="stat"><span class="stat-label">${label}</span><div class="stat-number">${total}</div></article>`).join("");
  } catch (err) {
    console.error("Admin dashboard read failed:", err);
    const status = document.getElementById("dashboardStatus");
    status.setAttribute("aria-busy", "false");
    status.textContent = "Could not load totals. Confirm Firestore Rules and admin claim are deployed.";
  }
}

const LOCALES = [
  ["en", "English"], ["es", "Español"], ["zh-CN", "简体中文"],
  ["ms", "Bahasa Melayu"], ["ta", "தமிழ்"]
];

function localizedFields(prefix, label, type = "text", multiline = false) {
  return `<div class="localized-grid">${LOCALES.map(([code, name]) => `
    <label class="field"><span>${escapeHtml(label)} — ${escapeHtml(name)}${code === "en" ? " (required)" : " (optional)"}</span>
      ${multiline
        ? `<textarea name="${prefix}_${code}" ${code === "en" ? "required" : ""}></textarea>`
        : `<input name="${prefix}_${code}" type="${type}" ${code === "en" ? "required" : ""}>`}
    </label>`).join("")}</div>`;
}

function loadAnnouncementEditor(user) {
  const content = `
    <section class="panel update-panel"><h2 id="announcementFormHeading">Create an announcement</h2>
      <p class="muted">This saves to <code>${escapeHtml(collectionPath("announcements"))}</code>. English is required; other language fields can be added now or later.</p>
      <form id="createAnnouncementForm" class="admin-form">
        <input name="recordId" type="hidden">
        <div class="form-row"><label class="field"><span>Date</span><input name="date" type="date" required></label>
        <label class="field"><span>Category</span><select name="category" required><option value="community">Community</option><option value="emergency">Emergency</option><option value="maintenance">Maintenance</option><option value="events">Events</option></select></label></div>
        <label class="field"><span>Publication status</span><select name="isPublished"><option value="true" selected>Published — visible to residents</option><option value="false">Unpublished — hidden from residents</option></select></label>
        <h3>Title by language</h3>${localizedFields("title", "Title")}
        <h3>Short announcement by language</h3>${localizedFields("shortText", "Short text", "text", true)}
        <h3>Full details by language</h3>${localizedFields("fullContent", "Full details", "text", true)}
        <div class="form-actions"><p class="form-feedback" id="announcementFeedback" role="status"></p><button class="button" type="submit">Save announcement</button><button class="button secondary" id="cancelAnnouncementEdit" type="button" hidden>Cancel edit</button></div>
      </form>
    </section>
    <section class="panel update-panel"><h2>Current announcements</h2><p class="muted">Newest dates appear first. Unpublish older notices to remove them from the public list without deleting their records.</p><div id="currentAnnouncements" class="status" aria-busy="true">Loading announcements…</div></section>
    `;
  shell(content, "/admin/announcements", user);

  document.getElementById("createAnnouncementForm").addEventListener("submit", (event) => saveContentRecord(event, "announcements", "announcementFeedback"));
  document.getElementById("cancelAnnouncementEdit").addEventListener("click", resetAnnouncementEditor);
  loadCurrentAnnouncements();
}

function loadEventEditor(user) {
  const content = `
    <section class="panel update-panel"><h2 id="eventFormHeading">Add a calendar event</h2>
      <p class="muted">Events are dated calendar items, saved to <code>${escapeHtml(collectionPath("events"))}</code>. The public calendar reads this collection for the selected region.</p>
      <form id="createEventForm" class="admin-form">
        <input name="recordId" type="hidden">
        <label class="field"><span>Event date</span><input name="date" type="date" required></label>
        <h3>Event title by language</h3>${localizedFields("title", "Title")}
        <h3>Calendar description by language</h3>${localizedFields("description", "Description", "text", true)}
        <div class="form-actions"><p class="form-feedback" id="eventFeedback" role="status"></p><button class="button" type="submit">Add event to calendar</button><button class="button secondary" id="cancelEventEdit" type="button" hidden>Cancel edit</button></div>
      </form>
    </section>
    <section class="panel update-panel"><h2>Current calendar events</h2><p class="muted">Events are listed by date so you can confirm what residents will see in the calendar.</p><div id="currentEvents" class="status" aria-busy="true">Loading events…</div></section>`;
  shell(content, "/admin/events", user);
  document.getElementById("createEventForm").addEventListener("submit", (event) => saveContentRecord(event, "events", "eventFeedback"));
  document.getElementById("cancelEventEdit").addEventListener("click", resetEventEditor);
  loadCurrentEvents();
}

function resetEventEditor() {
  const form = document.getElementById("createEventForm");
  if (!form) return;
  form.reset();
  form.elements.recordId.value = "";
  document.getElementById("eventFormHeading").textContent = "Add a calendar event";
  form.querySelector("button[type=submit]").textContent = "Add event to calendar";
  document.getElementById("cancelEventEdit").hidden = true;
  document.getElementById("eventFeedback").textContent = "";
}

/* ------------------------------------------------------------------ */
/* Gallery: past community stories shown on the public timeline        */
/* Collection: gallery_events (MY) or locations/{CC}/gallery_events    */
/* ------------------------------------------------------------------ */

// [field key, label, control]. Every field is stored per language as `${key}_${code}`.
const GALLERY_TEXT_FIELDS = [
  ["tag", "Tag (e.g. Family, Festival)", "input"],
  ["short", "Short label on the timeline", "input"],
  ["title", "Story headline", "input"],
  ["lede", "Opening line (lede)", "textarea"],
  ["body", "Story text — separate paragraphs with a blank line", "textarea-lg"],
  ["quote", "Pull quote (optional)", "textarea"],
  ["quoteBy", "Quote attribution (optional)", "input"],
  ["caption", "Cover photo caption (optional)", "input"],
  ["place", "Where", "input"],
  ["host", "Organised by", "input"],
];
const GALLERY_REQUIRED_EN = new Set(["tag", "short", "title", "lede", "body"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(text) {
  return String(text || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function galleryLangTabs() {
  const tabs = LOCALES.map(([code, name], index) => `<button type="button" role="tab" class="lang-tab" id="gtab-${code}" data-lang-tab="${code}" aria-selected="${index === 0}" aria-controls="gpanel-${code}" tabindex="${index === 0 ? 0 : -1}">${escapeHtml(name)}${code === "en" ? " *" : ""}</button>`).join("");
  const panels = LOCALES.map(([code], index) => `<div class="lang-panel" role="tabpanel" id="gpanel-${code}" data-lang-panel="${code}" aria-labelledby="gtab-${code}" ${index ? "hidden" : ""}>
    ${GALLERY_TEXT_FIELDS.map(([key, label, kind]) => {
      const required = code === "en" && GALLERY_REQUIRED_EN.has(key) ? "required" : "";
      const control = kind === "input"
        ? `<input name="${key}_${code}" type="text" ${required}>`
        : `<textarea name="${key}_${code}" rows="${kind === "textarea-lg" ? 8 : 3}" ${required}></textarea>`;
      return `<label class="field"><span>${escapeHtml(label)}${required ? " *" : ""}</span>${control}</label>`;
    }).join("")}</div>`).join("");
  return `<div class="lang-tabs" role="tablist" aria-label="Text language">${tabs}</div>${panels}<p class="muted">* English is required. Other languages fall back to English when left empty.</p>`;
}

function activateGalleryLang(code) {
  document.querySelectorAll("[data-lang-tab]").forEach((tab) => {
    const on = tab.dataset.langTab === code;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll("[data-lang-panel]").forEach((panel) => { panel.hidden = panel.dataset.langPanel !== code; });
}

function galleryImageField(name, label, hint) {
  return `<div class="field image-field"><label for="img-${name}">${escapeHtml(label)}</label>
    <div class="image-row"><input id="img-${name}" name="${name}" type="text" inputmode="url" placeholder="/img/gallery/photo.webp or https://…" autocomplete="off">
    <button class="button secondary" type="button" data-upload-for="${name}">Upload</button></div>
    <div class="image-preview" data-preview-for="${name}" hidden><img alt=""><button class="table-action" type="button" data-clear-image="${name}">Remove</button></div>
    <small class="muted">${escapeHtml(hint)}</small></div>`;
}

function refreshImagePreview(form, name) {
  const preview = form.querySelector(`[data-preview-for="${name}"]`);
  const value = String(form.elements[name]?.value || "").trim();
  if (!preview) return;
  preview.hidden = !value;
  if (value) preview.querySelector("img").src = value;
}

// Downscale and convert to WebP in the browser so admins can upload camera/PNG originals directly.
async function prepareImageForUpload(file, maxEdge = 1600) {
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error("Choose a PNG, JPG or WebP image.");
  if (file.size > 25 * 1024 * 1024) throw new Error("This image is larger than 25 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("This browser could not process the image.");
  return blob;
}

async function uploadGalleryImage(file, slugHint) {
  if (!storage) throw new Error("Firebase Storage is not available on this page.");
  const blob = await prepareImageForUpload(file);
  const name = slugify(slugHint) || "photo";
  const ref = storage.ref(`gallery/${adminCountryCode}/${name}-${Date.now()}.webp`);
  await ref.put(blob, { contentType: "image/webp", cacheControl: "public,max-age=31536000" });
  return ref.getDownloadURL();
}

function loadGalleryEditor(user) {
  const content = `
    <section class="panel update-panel"><h2 id="galleryFormHeading">Add a gallery event</h2>
      <p class="muted">Past community moments, shown on the public timeline (newest on the left) and as a news-style story page. Saved to <code>${escapeHtml(collectionPath("gallery_events"))}</code>.</p>
      <form id="galleryForm" class="admin-form">
        <input name="originalSlug" type="hidden">
        <div class="form-row">
          <label class="field"><span>Event date</span><input name="date" type="date" required></label>
          <label class="field"><span>Publication status</span><select name="isPublished"><option value="true" selected>Published — visible to residents</option><option value="false">Unpublished — hidden from residents</option></select></label>
        </div>
        <div class="form-row">
          <label class="field"><span>Story link ID</span><input name="slug" type="text" required maxlength="60" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="auto-filled from the English headline" autocomplete="off"><small class="muted">Lowercase letters, numbers and hyphens. Used in the story link and cannot be changed after saving.</small></label>
          <label class="field"><span>People joined (optional)</span><input name="people" type="text" placeholder="e.g. 120+"></label>
        </div>
        <h3>Photos</h3>
        ${galleryImageField("cover", "Cover photo", "Shown on the timeline card and at the top of the story. Portrait or landscape both work.")}
        <div class="form-row">${galleryImageField("photo1", "Story photo 1 (optional)", "Appears inside the story text.")}${galleryImageField("photo2", "Story photo 2 (optional)", "Appears beside photo 1.")}</div>
        <input id="galleryFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>
        <h3>Text by language</h3>${galleryLangTabs()}
        <div class="form-actions"><p class="form-feedback" id="galleryFeedback" role="status"></p><button class="button" type="submit">Save gallery event</button><button class="button secondary" id="cancelGalleryEdit" type="button" hidden>Cancel edit</button></div>
      </form>
    </section>
    <section class="panel update-panel"><h2>Current gallery events</h2><p class="muted">Newest first, matching the public timeline from left to right.</p><div id="currentGallery" class="status" aria-busy="true">Loading gallery…</div></section>`;
  shell(content, "/admin/gallery", user);

  const form = document.getElementById("galleryForm");
  const fileInput = document.getElementById("galleryFile");
  let slugTouched = false;
  let uploadTarget = "";

  form.addEventListener("submit", saveGalleryRecord);
  document.getElementById("cancelGalleryEdit").addEventListener("click", resetGalleryEditor);
  form.elements.slug.addEventListener("input", () => { slugTouched = true; });
  form.elements["title_en"].addEventListener("input", () => {
    if (slugTouched || form.elements.originalSlug.value) return;
    const year = String(form.elements.date.value || "").slice(0, 4);
    form.elements.slug.value = [slugify(form.elements["title_en"].value), year].filter(Boolean).join("-");
  });

  // Language tabs: click and arrow-key navigation.
  const tabs = [...form.querySelectorAll("[data-lang-tab]")];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateGalleryLang(tab.dataset.langTab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const next = tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      activateGalleryLang(next.dataset.langTab);
      next.focus();
    });
  });
  // A hidden required field cannot show its own validation bubble, so reveal its tab first.
  form.addEventListener("invalid", (event) => {
    const panel = event.target.closest?.("[data-lang-panel]");
    if (panel) activateGalleryLang(panel.dataset.langPanel);
  }, true);

  // Image fields: live preview, remove, and upload to Firebase Storage.
  ["cover", "photo1", "photo2"].forEach((name) => form.elements[name].addEventListener("input", () => refreshImagePreview(form, name)));
  form.querySelectorAll("[data-clear-image]").forEach((button) => button.addEventListener("click", () => {
    form.elements[button.dataset.clearImage].value = "";
    refreshImagePreview(form, button.dataset.clearImage);
  }));
  form.querySelectorAll("[data-upload-for]").forEach((button) => button.addEventListener("click", () => {
    uploadTarget = button.dataset.uploadFor;
    fileInput.value = "";
    fileInput.click();
  }));
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    const feedback = document.getElementById("galleryFeedback");
    if (!file || !uploadTarget) return;
    const button = form.querySelector(`[data-upload-for="${uploadTarget}"]`);
    button.disabled = true;
    feedback.textContent = "Uploading image…";
    try {
      const url = await uploadGalleryImage(file, form.elements.slug.value || form.elements["title_en"].value);
      form.elements[uploadTarget].value = url;
      refreshImagePreview(form, uploadTarget);
      feedback.textContent = "Image uploaded. Remember to save the event.";
    } catch (error) {
      console.error("Gallery image upload failed:", error);
      feedback.textContent = error.message?.startsWith("Choose") || error.message?.includes("larger") || error.message?.includes("browser")
        ? error.message
        : "Upload failed. Check that Firebase Storage rules allow this admin to write to gallery/.";
    } finally {
      button.disabled = false;
    }
  });

  loadCurrentGallery();
}

function resetGalleryEditor() {
  const form = document.getElementById("galleryForm");
  if (!form) return;
  form.reset();
  form.elements.originalSlug.value = "";
  form.elements.slug.readOnly = false;
  ["cover", "photo1", "photo2"].forEach((name) => refreshImagePreview(form, name));
  activateGalleryLang("en");
  document.getElementById("galleryFormHeading").textContent = "Add a gallery event";
  form.querySelector("button[type=submit]").textContent = "Save gallery event";
  document.getElementById("cancelGalleryEdit").hidden = true;
  document.getElementById("galleryFeedback").textContent = "";
}

function editGalleryRecord(record) {
  if (!record) return;
  const form = document.getElementById("galleryForm");
  form.reset();
  form.elements.originalSlug.value = record.id;
  form.elements.slug.value = record.id;
  form.elements.slug.readOnly = true;
  form.elements.date.value = toIsoDate(record.date);
  form.elements.isPublished.value = record.isPublished === false ? "false" : "true";
  form.elements.people.value = record.people || "";
  form.elements.cover.value = record.cover || "";
  form.elements.photo1.value = record.photos?.[0] || "";
  form.elements.photo2.value = record.photos?.[1] || "";
  ["cover", "photo1", "photo2"].forEach((name) => refreshImagePreview(form, name));
  for (const [code] of LOCALES) {
    for (const [key] of GALLERY_TEXT_FIELDS) {
      const value = record[`${key}_${code}`];
      form.elements.namedItem(`${key}_${code}`).value = Array.isArray(value) ? value.join("\n\n") : (value || "");
    }
  }
  activateGalleryLang("en");
  document.getElementById("galleryFormHeading").textContent = "Edit gallery event";
  form.querySelector("button[type=submit]").textContent = "Save changes";
  document.getElementById("cancelGalleryEdit").hidden = false;
  document.getElementById("galleryFeedback").textContent = "";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveGalleryRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById("galleryFeedback");
  const button = form.querySelector("button[type=submit]");
  const values = new FormData(form);
  const read = (key) => String(values.get(key) || "").trim();
  const editing = read("originalSlug");
  const slug = editing || read("slug");
  if (!SLUG_PATTERN.test(slug)) { feedback.textContent = "Story link ID may only use lowercase letters, numbers and hyphens."; return; }

  const FieldValue = firebase.firestore.FieldValue;
  const ref = adminCollection("gallery_events").doc(slug);
  const photos = [read("photo1"), read("photo2")];
  const record = {
    countryCode: adminCountryCode,
    date: read("date"),
    isPublished: read("isPublished") !== "false",
    cover: read("cover") || FieldValue.delete(),
    photos: photos.some(Boolean) ? photos : [],
    people: read("people") || FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (const [code] of LOCALES) {
    for (const [key] of GALLERY_TEXT_FIELDS) {
      const text = read(`${key}_${code}`);
      if (key === "body") {
        const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
        record[`body_${code}`] = paragraphs.length ? paragraphs : FieldValue.delete();
      } else {
        record[`${key}_${code}`] = text || FieldValue.delete();
      }
    }
  }

  button.disabled = true;
  feedback.textContent = "Saving…";
  try {
    if (!editing) {
      if ((await ref.get()).exists) {
        feedback.textContent = `An event with the link ID “${slug}” already exists. Choose a different ID or edit the existing event.`;
        return;
      }
      record.createdAt = FieldValue.serverTimestamp();
    }
    await ref.set(record, { merge: true });
    resetGalleryEditor();
    feedback.textContent = `Saved ${collectionPath("gallery_events")}/${slug}.`;
    await loadCurrentGallery();
  } catch (error) {
    console.error("Could not save gallery event:", error);
    feedback.textContent = "Could not save. Check that this account has admin access for this region and that Firestore Rules allow writes to gallery_events.";
  } finally {
    button.disabled = false;
  }
}

async function loadCurrentGallery() {
  const mount = document.getElementById("currentGallery");
  if (!mount) return;
  const feedback = () => document.getElementById("galleryFeedback");
  try {
    const snapshot = await adminCollection("gallery_events").get();
    mount.setAttribute("aria-busy", "false");
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => sortableDate(b.date) - sortableDate(a.date));
    if (!records.length) {
      const starters = getGallerySeed(adminCountryCode);
      mount.innerHTML = `<div class="empty"><p>No gallery events are saved in ${escapeHtml(collectionPath("gallery_events"))} yet, so the public site is showing the built-in starter events.</p><p>Import them to edit the text, dates and photos here (${starters.length} events for this region).</p><button class="button" type="button" id="importGallerySeed">Import ${starters.length} starter events</button></div>`;
      document.getElementById("importGallerySeed").addEventListener("click", async (event) => {
        event.currentTarget.disabled = true;
        try {
          const batch = db.batch();
          for (const { slug, ...rest } of starters) {
            batch.set(adminCollection("gallery_events").doc(slug), {
              ...rest, countryCode: adminCountryCode, isPublished: true,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          }
          await batch.commit();
          await loadCurrentGallery();
        } catch (error) {
          console.error("Could not import starter gallery events:", error);
          event.currentTarget.disabled = false;
          mount.insertAdjacentHTML("beforeend", `<p class="error">Import failed. Check the Firestore Rules for gallery_events and the admin claim.</p>`);
        }
      });
      return;
    }
    mount.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Photo</th><th>Date</th><th>Event</th><th>Status</th><th>Manage</th></tr></thead><tbody>${records.map((record) => `
      <tr><td>${record.cover ? `<img class="thumb" src="${escapeHtml(record.cover)}" alt="" loading="lazy">` : `<span class="thumb thumb-empty">No photo</span>`}</td>
      <td>${escapeHtml(toIsoDate(record.date) || record.date || "—")}</td>
      <td><strong>${escapeHtml(record.short_en || record.title_en || record.id)}</strong><br><span class="muted">${escapeHtml(record.title_en || "")}</span></td>
      <td>${record.isPublished === false ? "Unpublished" : "Published"}</td>
      <td class="content-actions"><button class="table-action" type="button" data-edit-gallery="${escapeHtml(record.id)}">Edit</button><button class="table-action" type="button" data-publish-gallery="${escapeHtml(record.id)}" data-published="${record.isPublished !== false}">${record.isPublished === false ? "Publish" : "Unpublish"}</button><button class="table-action danger" type="button" data-delete-gallery="${escapeHtml(record.id)}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
    mount.querySelectorAll("[data-edit-gallery]").forEach((button) => button.addEventListener("click", () => editGalleryRecord(records.find((record) => record.id === button.dataset.editGallery))));
    mount.querySelectorAll("[data-publish-gallery]").forEach((button) => button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await adminCollection("gallery_events").doc(button.dataset.publishGallery).update({
          isPublished: button.dataset.published !== "true",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await loadCurrentGallery();
      } catch (error) {
        console.error("Could not change gallery publication status:", error);
        button.disabled = false;
        feedback().textContent = "Could not update this event. Check the Firestore Rules and admin claim.";
      }
    }));
    mount.querySelectorAll("[data-delete-gallery]").forEach((button) => button.addEventListener("click", async () => {
      const record = records.find((row) => row.id === button.dataset.deleteGallery);
      if (!window.confirm(`Delete “${record?.short_en || record?.title_en || button.dataset.deleteGallery}” permanently? Unpublish it instead if you may want it back.`)) return;
      button.disabled = true;
      try {
        await adminCollection("gallery_events").doc(button.dataset.deleteGallery).delete();
        if (document.getElementById("galleryForm")?.elements.originalSlug.value === button.dataset.deleteGallery) resetGalleryEditor();
        await loadCurrentGallery();
      } catch (error) {
        console.error("Could not delete gallery event:", error);
        button.disabled = false;
        feedback().textContent = "Could not delete this event. Check the Firestore Rules and admin claim.";
      }
    }));
  } catch (error) {
    console.error("Could not load gallery events for admin:", error);
    mount.setAttribute("aria-busy", "false");
    mount.innerHTML = `<div class="empty">Could not load ${escapeHtml(collectionPath("gallery_events"))}. Check the admin claim and Firestore Rules.</div>`;
  }
}

function resetAnnouncementEditor() {
  const form = document.getElementById("createAnnouncementForm");
  if (!form) return;
  form.reset();
  form.elements.recordId.value = "";
  document.getElementById("announcementFormHeading").textContent = "Create an announcement";
  form.querySelector("button[type=submit]").textContent = "Save announcement";
  document.getElementById("cancelAnnouncementEdit").hidden = true;
  document.getElementById("announcementFeedback").textContent = "";
}

async function loadCurrentAnnouncements() {
  const mount = document.getElementById("currentAnnouncements");
  if (!mount) return;
  try {
    const snapshot = await adminCollection("announcements").get();
    mount.setAttribute("aria-busy", "false");
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(inAdminRegion)
      .sort((a, b) => sortableDate(b.date) - sortableDate(a.date));
    if (!records.length) {
      mount.innerHTML = `<div class="empty">There are no announcements in ${escapeHtml(collectionPath("announcements"))} yet.</div>`;
      return;
    }
    mount.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Announcement</th><th>Status</th><th>Manage</th></tr></thead><tbody>${records.map((record) => `
      <tr><td>${escapeHtml(record.displayDate || record.date || "—")}</td><td>${escapeHtml(record.title_en || record.shortText_en || "Untitled announcement")}</td>
      <td>${record.isPublished === false ? "Unpublished" : "Published"}</td><td class="content-actions"><button class="table-action" type="button" data-edit-announcement="${escapeHtml(record.id)}">Edit</button><button class="table-action" type="button" data-publish-announcement="${escapeHtml(record.id)}" data-published="${record.isPublished !== false}">${record.isPublished === false ? "Publish" : "Unpublish"}</button></td></tr>`).join("")}</tbody></table></div>`;
    mount.querySelectorAll("[data-edit-announcement]").forEach((button) => button.addEventListener("click", () => editAnnouncement(records.find((record) => record.id === button.dataset.editAnnouncement))));
    mount.querySelectorAll("[data-publish-announcement]").forEach((button) => button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await adminCollection("announcements").doc(button.dataset.publishAnnouncement).update({
          isPublished: button.dataset.published !== "true",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await loadCurrentAnnouncements();
      } catch (error) {
        console.error("Could not change announcement publication status:", error);
        button.disabled = false;
        document.getElementById("announcementFeedback").textContent = "Could not update this announcement. Check the Firestore Rules and admin claim.";
      }
    }));
  } catch (error) {
    console.error("Could not load announcements for admin:", error);
    mount.setAttribute("aria-busy", "false");
    mount.innerHTML = `<div class="empty">Could not load ${escapeHtml(collectionPath("announcements"))}. Check the admin claim and Firestore Rules.</div>`;
  }
}

// Normalise legacy date strings ("17 MAY 2026") to the YYYY-MM-DD value a date input needs.
function toIsoDate(value) {
  const raw = String(value || "");
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = sortableDate(raw);
  if (!parsed) return "";
  const d = new Date(parsed);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Legacy MY collections may hold records without countryCode; they belong to MY.
function inAdminRegion(record) {
  return record.countryCode
    ? String(record.countryCode).toUpperCase() === adminCountryCode
    : adminCountryCode === "MY";
}

async function loadCurrentEvents() {
  const mount = document.getElementById("currentEvents");
  if (!mount) return;
  try {
    const snapshot = await adminCollection("events").get();
    mount.setAttribute("aria-busy", "false");
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(inAdminRegion)
      .sort((a, b) => sortableDate(a.date) - sortableDate(b.date));
    if (!records.length) {
      mount.innerHTML = `<div class="empty">There are no calendar events in ${escapeHtml(collectionPath("events"))} yet.</div>`;
      return;
    }
    mount.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Event date</th><th>Calendar entry</th><th>Details</th><th>Manage</th></tr></thead><tbody>${records.map((record) => `
      <tr><td>${escapeHtml(record.displayDate || record.date || "—")}</td><td>${escapeHtml(record.title_en || "Untitled event")}</td><td>${escapeHtml(record.description_en || "—")}</td>
      <td class="content-actions"><button class="table-action" type="button" data-edit-event="${escapeHtml(record.id)}">Edit</button><button class="table-action danger" type="button" data-delete-event="${escapeHtml(record.id)}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
    mount.querySelectorAll("[data-edit-event]").forEach((button) => button.addEventListener("click", () => editEvent(records.find((record) => record.id === button.dataset.editEvent))));
    mount.querySelectorAll("[data-delete-event]").forEach((button) => button.addEventListener("click", async () => {
      const record = records.find((row) => row.id === button.dataset.deleteEvent);
      if (!window.confirm(`Delete “${record?.title_en || "this event"}” from the calendar permanently?`)) return;
      button.disabled = true;
      try {
        await adminCollection("events").doc(button.dataset.deleteEvent).delete();
        if (document.getElementById("createEventForm")?.elements.recordId.value === button.dataset.deleteEvent) resetEventEditor();
        await loadCurrentEvents();
      } catch (error) {
        console.error("Could not delete calendar event:", error);
        button.disabled = false;
        document.getElementById("eventFeedback").textContent = "Could not delete this event. Check the Firestore Rules and admin claim.";
      }
    }));
  } catch (error) {
    console.error("Could not load calendar events for admin:", error);
    mount.setAttribute("aria-busy", "false");
    mount.innerHTML = `<div class="empty">Could not load ${escapeHtml(collectionPath("events"))}. Check the admin claim and Firestore Rules.</div>`;
  }
}

function editEvent(record) {
  if (!record) return;
  const form = document.getElementById("createEventForm");
  form.reset();
  form.elements.recordId.value = record.id;
  form.elements.date.value = toIsoDate(record.date);
  for (const prefix of ["title", "description"]) {
    for (const [code] of LOCALES) form.elements.namedItem(`${prefix}_${code}`).value = record[`${prefix}_${code}`] || "";
  }
  document.getElementById("eventFormHeading").textContent = "Edit calendar event";
  form.querySelector("button[type=submit]").textContent = "Save changes";
  document.getElementById("cancelEventEdit").hidden = false;
  document.getElementById("eventFeedback").textContent = "";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function editAnnouncement(record) {
  if (!record) return;
  const form = document.getElementById("createAnnouncementForm");
  form.elements.recordId.value = record.id;
  const iso = toIsoDate(record.date);
  if (iso) form.elements.date.value = iso;
  form.elements.category.value = record.category || "community";
  form.elements.isPublished.value = record.isPublished === false ? "false" : "true";
  for (const prefix of ["title", "shortText", "fullContent"]) {
    for (const [code] of LOCALES) form.elements.namedItem(`${prefix}_${code}`).value = record[`${prefix}_${code}`] || "";
  }
  document.getElementById("announcementFormHeading").textContent = "Edit announcement";
  form.querySelector("button[type=submit]").textContent = "Save changes";
  document.getElementById("cancelAnnouncementEdit").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Shared save for announcements and events (create or edit).
// When editing, a field the admin emptied is removed from the document; the earlier version
// skipped blank fields, so a cleared translation silently kept its old text.
async function saveContentRecord(event, collectionName, feedbackId) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById(feedbackId);
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  feedback.textContent = "Saving…";
  const values = new FormData(form);
  const date = String(values.get("date") || "");
  const recordId = String(values.get("recordId") || "");
  const FieldValue = firebase.firestore.FieldValue;
  const record = { countryCode: adminCountryCode, date };
  if (!recordId) record.createdAt = FieldValue.serverTimestamp();
  for (const [key, value] of values.entries()) {
    if (["date", "category", "recordId", "isPublished"].includes(key)) continue;
    const text = String(value).trim();
    if (text) record[key] = text;
    else if (recordId) record[key] = FieldValue.delete();
  }
  if (collectionName === "announcements") {
    record.category = String(values.get("category"));
    record.isPublished = values.get("isPublished") === "true";
    const [year, month, day] = date.split("-").map(Number);
    const monthLabel = new Date(year, month - 1, day, 12).toLocaleString("en-US", { month: "short" }).toUpperCase();
    record.displayDate = `${String(day).padStart(2, "0")} ${monthLabel} ${year}`;
  }
  try {
    if (recordId) {
      record.updatedAt = FieldValue.serverTimestamp();
      await adminCollection(collectionName).doc(recordId).update(record);
      if (collectionName === "announcements") resetAnnouncementEditor();
      if (collectionName === "events") resetEventEditor();
      feedback.textContent = `Updated ${collectionPath(collectionName)}/${recordId}.`;
    } else {
      const saved = await adminCollection(collectionName).add(record);
      feedback.textContent = `Saved successfully to ${collectionPath(collectionName)} (${saved.id}).`;
      form.reset();
    }
    if (collectionName === "announcements") await loadCurrentAnnouncements();
    if (collectionName === "events") await loadCurrentEvents();
  } catch (error) {
    console.error(`Could not save ${collectionName} record:`, error);
    feedback.textContent = "Could not save. Check that the current account has admin access for this region and the latest Firestore Rules are published.";
  } finally {
    button.disabled = false;
  }
}

// CSV export for the private submission lists. Cells that start with a formula character are
// prefixed with an apostrophe so a malicious sign-up cannot run a formula when opened in Excel.
function csvCell(value) {
  let text = value?.toDate ? value.toDate().toISOString()
    : typeof value === "object" && value !== null ? JSON.stringify(value)
      : String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, records) {
  const keys = [...new Set(records.flatMap((record) => Object.keys(record)))];
  const lines = [keys.map(csvCell).join(",")].concat(records.map((record) => keys.map((key) => csvCell(record[key])).join(",")));
  const blob = new Blob([`\ufeff${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// UI route guard: sends signed-out/non-admin users to login.
// Firestore Rules remain the actual security boundary.
async function renderRoute() {
  const route = currentRoute();
  const user = auth.currentUser;
  if (!user) {
    if (route !== "/admin/login") history.replaceState({}, "", "/admin/login");
    renderLogin();
    return;
  }
  let admin = false;
  try { admin = await ensureAdmin(user); } catch (err) { console.error("Could not verify admin claim:", err); }
  if (!admin) {
    await auth.signOut();
    history.replaceState({}, "", "/admin/login");
    renderLogin("This account does not have administrator access.");
    return;
  }
  if (route === "/admin/login") { navigate("/admin/dashboard"); return; }
  if (route === "/admin/dashboard") return loadDashboard(user);
  if (route === "/admin/updates") { navigate("/admin/announcements"); return; }
  if (route === "/admin/announcements") return loadAnnouncementEditor(user);
  if (route === "/admin/events") return loadEventEditor(user);
  if (route === "/admin/gallery") return loadGalleryEditor(user);
  if (route === "/admin/newsletter" || route === "/admin/volunteer") return loadRows(route, user);
  history.replaceState({}, "", "/admin/dashboard");
  return loadDashboard(user);
}

document.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
window.addEventListener("popstate", renderRoute);
auth.onAuthStateChanged(renderRoute);
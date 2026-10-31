// MYCELIUM resident portal: login, requests (eForm / procurement / contact), facility booking and sandbox payments.
// Everything lives under countries/{CC}/cities/{CITY}/... (same layout as the public site). No real money is moved.
import {
  REQUEST_TYPES, STATUS_LABEL, currencyFor, formatMoney, buildSlots, newReference,
} from "./forms-config.js";

const firebaseConfig = {
  apiKey: "AIzaSyCenfhVQjmGSVOflXL0wOqK9GqUCAzfL34",
  authDomain: "mycelium-residence.firebaseapp.com",
  projectId: "mycelium-residence",
  storageBucket: "mycelium-residence.firebasestorage.app",
  messagingSenderId: "982178911104",
  appId: "1:982178911104:web:948912553056b2ea162765",
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const FieldValue = firebase.firestore.FieldValue;
const REGION = window.MYCELIUM_REGION_PATHS;
const SITES = REGION.SITES;

const params = new URLSearchParams(location.search);
let siteCode = REGION.normalize(params.get("region")) || REGION.normalize(localStorage.getItem("myceliumCountry")) || "MY_PP";
const siteLabel = () => SITES[siteCode]?.label || siteCode;
const col = (name) => REGION.ref(db, siteCode, name);
const money = (minor) => formatMoney(minor, siteCode);
const root = document.getElementById("portal");
const checkout = document.getElementById("checkoutDialog");

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmtDate = (value) => {
  const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(currencyFor(siteCode).locale, { dateStyle: "medium" }) : "—";
};
const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

const state = { user: null, resident: null, tab: "home", notifications: [], stripe: null, facilities: [], selected: null };
const TABS = [["home", "Home"], ["pay", "Payments"], ["book", "Book a facility"], ["requests", "Requests & forms"], ["procurement", "Procurement"], ["contact", "Contact management"], ["notifications", "Notifications"]];

/* ---------------------------------------------------------------- drafts (same idea as the public site) */
const draftKey = (name) => `mycelium-portal-draft:${siteCode}:${name}`;
function bindDraft(form, name) {
  if (!form) return;
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey(name)) || "null");
    if (saved && Date.now() - saved.t < 86400000) Object.entries(saved.v).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; });
  } catch (error) { /* storage unavailable */ }
  form.addEventListener("input", () => {
    try {
      const values = {};
      [...form.elements].forEach((el) => { if (el.name && el.type !== "password") values[el.name] = el.value; });
      localStorage.setItem(draftKey(name), JSON.stringify({ t: Date.now(), v: values }));
    } catch (error) { /* ignore */ }
  });
}
const clearDraft = (name) => { try { localStorage.removeItem(draftKey(name)); } catch (error) { /* ignore */ } };

/* ---------------------------------------------------------------- shell */
function shell(inner) {
  const unread = state.notifications.filter((n) => !n.read).length;
  root.innerHTML = `<header class="portal-top">
      <div class="portal-brand"><span class="eyebrow">MYCELIUM RESIDENCES</span><strong>Resident portal</strong></div>
      <label class="region-switch" style="display:flex;align-items:center;gap:8px;color:#dce4d5;font-size:.76rem">Community
        <select id="regionSelect" style="padding:6px 8px;border-radius:8px">${Object.keys(SITES).map((code) => `<option value="${code}" ${code === siteCode ? "selected" : ""}>${esc(SITES[code].label)}</option>`).join("")}</select></label>
      <a class="bell" href="#notifications" aria-label="Notifications">Notifications ${unread ? `<b>${unread}</b>` : ""}</a>
      <span class="who">${esc(state.resident?.name || state.user.email)}${state.resident?.unit ? ` · Unit ${esc(state.resident.unit)}` : ""}</span>
      <a href="${esc(SITES[siteCode]?.home || "/")}">Back to site</a>
      <button class="link" id="portalSignOut" type="button">Sign out</button>
    </header>
    <nav class="portal-tabs" aria-label="Portal sections">${TABS.map(([id, label]) => `<a href="#${id}" ${state.tab === id ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
    <div class="portal-main">${inner}</div>`;
  document.getElementById("regionSelect").addEventListener("change", (event) => {
    const next = new URL(location.href); next.searchParams.set("region", event.target.value); location.href = next.toString();
  });
  document.getElementById("portalSignOut").addEventListener("click", () => auth.signOut());
}

/* ---------------------------------------------------------------- auth screens */
let authMode = "signin";
function authView(message = "") {
  const signup = authMode === "signup";
  root.innerHTML = `<div class="auth-wrap"><section class="auth-card">
    <span class="eyebrow">MYCELIUM RESIDENCES · ${esc(siteLabel())}</span>
    <h1>${signup ? "Create your resident account" : "Resident sign in"}</h1>
    <p class="muted">${signup ? "Management approves each account and links it to your unit before you can use the services." : "Pay charges, book facilities and follow your requests."}</p>
    <form id="authForm" class="admin-form">
      ${signup ? `<label class="field"><span>Full name</span><input name="name" required maxlength="120" autocomplete="name"></label>
      <label class="field"><span>Unit number</span><input name="unit" required maxlength="20" placeholder="e.g. B-12-3"></label>` : ""}
      <label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email"></label>
      <label class="field"><span>Password</span><input name="password" type="password" required minlength="6" autocomplete="${signup ? "new-password" : "current-password"}"></label>
      <div class="form-actions"><p class="form-feedback" id="authFeedback" role="status">${esc(message)}</p>
        <button class="button" type="submit">${signup ? "Create account" : "Sign in"}</button>
        <button class="button secondary" id="googleBtn" type="button">Continue with Google</button></div>
    </form>
    <p class="switch">${signup ? "Already registered?" : "New resident?"} <button id="authSwitch" type="button">${signup ? "Sign in" : "Create an account"}</button></p>
  </section></div>`;
  const form = document.getElementById("authForm");
  const feedback = document.getElementById("authFeedback");
  document.getElementById("authSwitch").addEventListener("click", () => { authMode = signup ? "signin" : "signup"; authView(); });
  document.getElementById("googleBtn").addEventListener("click", async () => {
    try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
    catch (error) { feedback.textContent = friendlyAuthError(error); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    feedback.textContent = "Please wait…";
    try {
      if (signup) {
        pendingProfile = { name: data.name.trim(), unit: data.unit.trim() };
        await auth.createUserWithEmailAndPassword(data.email.trim(), data.password);
      } else {
        await auth.signInWithEmailAndPassword(data.email.trim(), data.password);
      }
    } catch (error) { pendingProfile = null; feedback.textContent = friendlyAuthError(error); }
  });
}
let pendingProfile = null;
function friendlyAuthError(error) {
  const code = error?.code || "";
  if (code.includes("email-already-in-use")) return "That email already has an account. Try signing in.";
  if (code.includes("wrong-password") || code.includes("invalid-credential") || code.includes("user-not-found")) return "Email or password is not correct.";
  if (code.includes("weak-password")) return "Use a password of at least 6 characters.";
  if (code.includes("popup-closed")) return "Google sign-in was closed before it finished.";
  if (code.includes("operation-not-allowed")) return "This sign-in method is not switched on in Firebase Authentication yet.";
  if (code.includes("unauthorized-domain")) return "This website address is not listed in Firebase Authentication > Authorized domains.";
  return "Could not sign in. Please try again.";
}

function joinView(message = "") {
  root.innerHTML = `<div class="auth-wrap"><section class="auth-card">
    <span class="eyebrow">${esc(siteLabel())}</span><h1>Join this community</h1>
    <p class="muted">Signed in as ${esc(state.user.email)}. Tell us your unit so management can approve your account.</p>
    <form id="joinForm" class="admin-form">
      <label class="field"><span>Full name</span><input name="name" required maxlength="120" value="${esc(pendingProfile?.name || state.user.displayName || "")}"></label>
      <label class="field"><span>Unit number</span><input name="unit" required maxlength="20" value="${esc(pendingProfile?.unit || "")}"></label>
      <div class="form-actions"><p class="form-feedback" id="joinFeedback" role="status">${esc(message)}</p>
        <button class="button" type="submit">Request access</button><button class="button secondary" id="joinOut" type="button">Sign out</button></div>
    </form></section></div>`;
  document.getElementById("joinOut").addEventListener("click", () => auth.signOut());
  document.getElementById("joinForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await col("residents").doc(state.user.uid).set({
        uid: state.user.uid, email: state.user.email, name: data.name.trim(), unit: data.unit.trim(),
        status: "pending", createdAt: FieldValue.serverTimestamp(),
      });
      pendingProfile = null;
      await loadResident();
    } catch (error) { console.error(error); document.getElementById("joinFeedback").textContent = "Could not send your request. Check that the Firestore rules for residents are published."; }
  });
}

function waitingView(status) {
  const rejected = status === "rejected";
  root.innerHTML = `<div class="auth-wrap"><section class="auth-card">
    <span class="eyebrow">${esc(siteLabel())}</span><h1>${rejected ? "Access not approved" : "Waiting for approval"}</h1>
    <p class="muted">${rejected ? "Management could not link this account to a unit. Please contact the management office." : `Thank you, ${esc(state.resident.name)}. Management will confirm Unit ${esc(state.resident.unit)} shortly. You can close this page and come back.`}</p>
    <div class="form-actions"><button class="button" id="recheck" type="button">Check again</button><button class="button secondary" id="waitOut" type="button">Sign out</button></div>
  </section></div>`;
  document.getElementById("recheck").addEventListener("click", () => loadResident());
  document.getElementById("waitOut").addEventListener("click", () => auth.signOut());
}

/* ---------------------------------------------------------------- data */
async function loadResident() {
  try {
    const snap = await col("residents").doc(state.user.uid).get();
    state.resident = snap.exists ? snap.data() : null;
  } catch (error) {
    console.error("Could not read resident profile:", error);
    state.resident = null;
    root.innerHTML = `<div class="auth-wrap"><section class="auth-card"><h1>Something went wrong</h1><p class="muted">Could not read your profile. If you are the site owner, publish the updated Firestore rules (firestore-rules.txt) and reload.</p><div class="form-actions"><button class="button secondary" id="errOut" type="button">Sign out</button></div></section></div>`;
    document.getElementById("errOut").addEventListener("click", () => auth.signOut());
    return;
  }
  if (!state.resident) return joinView();
  if (state.resident.status !== "approved") return waitingView(state.resident.status);
  await loadNotifications();
  route();
}

async function loadNotifications() {
  try {
    const snap = await col("notifications").where("uid", "==", state.user.uid).get();
    state.notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).slice(0, 50);
  } catch (error) { console.warn("Notifications unavailable:", error); state.notifications = []; }
}

const mine = async (name) => {
  const snap = await col(name).where("uid", "==", state.user.uid).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
const byNewest = (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);

/* ---------------------------------------------------------------- router */
function route() {
  const id = (location.hash || "#home").slice(1);
  state.tab = TABS.some(([key]) => key === id) ? id : "home";
  const views = { home: homeView, pay: payView, book: bookView, requests: () => requestsView("eform"), procurement: () => requestsView("procurement"), contact: () => requestsView("contact"), notifications: notificationsView };
  shell(`<div class="status" aria-busy="true">Loading…</div>`);
  Promise.resolve(views[state.tab]()).catch((error) => {
    console.error(error);
    document.querySelector(".portal-main").innerHTML = `<div class="empty">Could not load this page. Check your connection and the published Firestore rules.</div>`;
  });
}
window.addEventListener("hashchange", () => { if (state.resident?.status === "approved") route(); });
const main = () => document.querySelector(".portal-main");

/* ---------------------------------------------------------------- home */
async function homeView() {
  const [charges, bookings, requests] = await Promise.all([mine("charges"), mine("bookings"), mine("requests")]);
  const due = charges.filter((c) => c.status !== "paid");
  const upcoming = bookings.filter((b) => b.date >= isoToday());
  const open = requests.filter((r) => !["completed", "rejected"].includes(r.status));
  const unread = state.notifications.filter((n) => !n.read).length;
  main().innerHTML = `<h1>Welcome, ${esc(state.resident.name.split(" ")[0])}</h1><p class="lead">${esc(siteLabel())} · Unit ${esc(state.resident.unit)}</p>
    <div class="cards">
      <a class="card-stat" href="#pay"><span>Amount due</span><strong>${money(due.reduce((s, c) => s + (c.amount || 0), 0))}</strong>${due.length} unpaid charge${due.length === 1 ? "" : "s"}</a>
      <a class="card-stat" href="#book"><span>Upcoming bookings</span><strong>${upcoming.length}</strong>Book gym, hall, BBQ or court</a>
      <a class="card-stat" href="#requests"><span>Open requests</span><strong>${open.length}</strong>Maintenance, renovation, more</a>
      <a class="card-stat" href="#notifications"><span>Unread notices</span><strong>${unread}</strong>Status changes and replies</a>
    </div>`;
}

/* ---------------------------------------------------------------- notifications */
async function notificationsView() {
  await loadNotifications();
  shell("");
  main().innerHTML = `<h1>Notifications</h1><p class="lead">Updates from management about your requests, bookings and charges.</p>
    <section class="panel">${state.notifications.length ? state.notifications.map((n) => `<div class="notif ${n.read ? "" : "unread"}"><strong>${esc(n.title)}</strong><span>${esc(n.body || "")}</span><small>${fmtDate(n.createdAt)}</small></div>`).join("") : `<div class="empty">Nothing yet.</div>`}</section>`;
  const unread = state.notifications.filter((n) => !n.read);
  await Promise.all(unread.map((n) => col("notifications").doc(n.id).update({ read: true }).catch(() => {})));
}

/* ---------------------------------------------------------------- payments + sandbox gateway */
async function payView() {
  const charges = (await mine("charges")).sort(byNewest);
  const stripeOn = await stripeEnabled();
  main().innerHTML = `<h1>Payments</h1><p class="lead">Community charges and facility fees for Unit ${esc(state.resident.unit)}.</p>
    <p class="sandbox-banner">Demo mode: payments here are simulated${stripeOn ? " (or run through Stripe Test Mode)" : ""}. No real money is charged and no real card is needed.</p>
    <section class="panel">${charges.length ? `<div class="table-wrap"><table><thead><tr><th>Charge</th><th>Due</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${charges.map((c) => `
      <tr><td>${esc(c.title)}</td><td>${esc(c.due || "—")}</td><td>${money(c.amount)}</td>
      <td>${c.status === "paid" ? `<span class="pill ok">Paid</span><br><small class="muted">Receipt ${esc(c.receiptNo || "")} · ${esc(c.method || "")}</small>` : `<span class="pill warn">Unpaid</span>`}</td>
      <td>${c.status === "paid" ? "" : `<button class="button" type="button" data-pay="${esc(c.id)}" style="min-height:38px">Pay</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">No charges yet.</div>`}</section>`;
  main().querySelectorAll("[data-pay]").forEach((button) => button.addEventListener("click", () => openCheckout(charges.find((c) => c.id === button.dataset.pay), stripeOn)));
  await finishStripeReturn(charges);
}

async function stripeEnabled() {
  if (state.stripe !== null) return state.stripe;
  try {
    const response = await fetch("/.netlify/functions/stripe-checkout");
    state.stripe = response.ok && (await response.json()).enabled === true;
  } catch (error) { state.stripe = false; }
  return state.stripe;
}

async function markPaid(charge, method, gateway) {
  const receiptNo = newReference(siteCode, "RC");
  await col("charges").doc(charge.id).update({ status: "paid", paidAt: FieldValue.serverTimestamp(), method, receiptNo, gateway });
  return receiptNo;
}

function fakeQr(canvas) {
  const n = 29, size = canvas.width / n, ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#183d32";
  let seed = 7;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const finder = (x, y) => { ctx.fillRect(x * size, y * size, 7 * size, 7 * size); ctx.fillStyle = "#fff"; ctx.fillRect((x + 1) * size, (y + 1) * size, 5 * size, 5 * size); ctx.fillStyle = "#183d32"; ctx.fillRect((x + 2) * size, (y + 2) * size, 3 * size, 3 * size); };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    if (!inFinder && rand() > 0.52) ctx.fillRect(x * size, y * size, size, size);
  }
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
}

function openCheckout(charge, stripeOn) {
  const my = siteCode.startsWith("MY");
  const methods = my
    ? [["fpx", "Online banking (FPX demo)"], ["qr", "DuitNow QR (demo)"], ["card", "Card"]]
    : [["card", "Card"], ["ach", "Bank debit (ACH demo)"]];
  if (stripeOn) methods.push(["stripe", "Stripe Test Mode"]);
  let method = methods[0][0];
  const paint = () => {
    checkout.innerHTML = `<div class="dialog-top"><span class="eyebrow">SANDBOX CHECKOUT</span><button class="icon-button" type="button" id="coClose" aria-label="Close">×</button></div>
      <h2 id="checkoutTitle">${esc(charge.title)}</h2>
      <p class="sandbox-banner">DEMO ONLY · no real money moves · ${currencyFor(siteCode).code}</p>
      <p style="font:600 1.8rem 'Playfair Display',serif;margin:6px 0">${money(charge.amount)}</p>
      <div class="method-row" role="group" aria-label="Payment method">${methods.map(([id, label]) => `<button type="button" data-method="${id}" aria-pressed="${id === method}">${label}</button>`).join("")}</div>
      <div id="coBody">${methodBody(method)}</div>
      <p class="form-feedback" id="coFeedback" role="status"></p>
      <div class="form-actions"><button class="button" id="coPay" type="button">${method === "stripe" ? "Continue to Stripe" : "Pay (sandbox)"}</button><button class="button secondary" id="coDecline" type="button" ${method === "stripe" ? "hidden" : ""}>Simulate a declined payment</button></div>`;
    checkout.querySelector("#coClose").addEventListener("click", () => checkout.close());
    checkout.querySelectorAll("[data-method]").forEach((b) => b.addEventListener("click", () => { method = b.dataset.method; paint(); }));
    const qr = checkout.querySelector("canvas"); if (qr) fakeQr(qr);
    const feedback = checkout.querySelector("#coFeedback");
    checkout.querySelector("#coDecline").addEventListener("click", () => { feedback.textContent = "Payment declined (simulated). Nothing was charged. You can try again."; });
    checkout.querySelector("#coPay").addEventListener("click", async (event) => {
      const button = event.currentTarget; button.disabled = true;
      try {
        if (method === "stripe") return await startStripe(charge, feedback);
        feedback.textContent = "Processing…";
        await new Promise((resolve) => setTimeout(resolve, 900));
        const label = methods.find(([id]) => id === method)[1].replace(/ \(.*\)/, "");
        const receipt = await markPaid(charge, `${label} (sandbox)`, "sandbox");
        checkout.innerHTML = `<div class="dialog-top"><span class="eyebrow">PAYMENT SUCCESSFUL</span></div><h2>Thank you</h2><p>${money(charge.amount)} paid for “${esc(charge.title)}”.</p><p class="note-box">Receipt <strong>${esc(receipt)}</strong> (demo)</p><div class="form-actions"><button class="button" id="coDone" type="button">Done</button></div>`;
        checkout.querySelector("#coDone").addEventListener("click", () => { checkout.close(); route(); });
      } catch (error) {
        console.error(error); button.disabled = false;
        feedback.textContent = "Could not record the payment. Check the published Firestore rules.";
      }
    });
  };
  const methodBody = (id) => ({
    fpx: `<label class="field"><span>Choose a demo bank</span><select><option>Demo Bank A</option><option>Demo Bank B</option><option>Demo Bank C</option></select></label><p class="muted">You would normally be sent to your bank to approve. Here the approval is simulated.</p>`,
    qr: `<canvas class="fake-qr" width="203" height="203" aria-label="Demo QR code, not scannable"></canvas><p class="muted" style="text-align:center">Demo QR, not scannable. Press Pay to simulate a scan.</p>`,
    card: `<div class="form-grid"><label class="field"><span>Card number (test)</span><input value="4242 4242 4242 4242" inputmode="numeric" autocomplete="off"></label><div class="form-row"><label class="field"><span>Expiry</span><input value="12 / 34"></label><label class="field"><span>CVC</span><input value="123"></label></div></div><p class="muted">This is a standard test card number. It is never sent anywhere.</p>`,
    ach: `<div class="form-grid"><label class="field"><span>Routing number (test)</span><input value="110000000"></label><label class="field"><span>Account number (test)</span><input value="000123456789"></label></div>`,
    stripe: `<p class="muted">You will be redirected to Stripe's hosted test page. Use card 4242 4242 4242 4242, any future date and any CVC.</p>`,
  })[id];
  paint();
  checkout.showModal();
}

async function startStripe(charge, feedback) {
  feedback.textContent = "Contacting Stripe…";
  const back = new URL(location.href);
  back.search = `?region=${siteCode}&stripe=success&charge=${encodeURIComponent(charge.id)}`;
  back.hash = "#pay";
  const cancel = new URL(back); cancel.search = `?region=${siteCode}`;
  const response = await fetch("/.netlify/functions/stripe-checkout", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: charge.title, amount: charge.amount, currency: currencyFor(siteCode).code, successUrl: `${back.toString().replace("#pay", "")}&session_id={CHECKOUT_SESSION_ID}#pay`, cancelUrl: cancel.toString() }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url) { feedback.textContent = data.error || "Stripe test checkout is not available. Use the sandbox methods instead."; return; }
  location.href = data.url;
}

async function finishStripeReturn(charges) {
  if (params.get("stripe") !== "success" || !params.get("session_id")) return;
  const charge = charges.find((c) => c.id === params.get("charge"));
  const clean = () => history.replaceState({}, "", `${location.pathname}?region=${siteCode}#pay`);
  if (!charge || charge.status === "paid") return clean();
  try {
    const response = await fetch(`/.netlify/functions/stripe-checkout?session_id=${encodeURIComponent(params.get("session_id"))}`);
    const data = await response.json();
    if (data.paid && data.amount === charge.amount && String(data.currency).toUpperCase() === currencyFor(siteCode).code) {
      const receipt = await markPaid(charge, "Stripe Test Mode", "stripe-test");
      clean(); params.delete("stripe");
      alert(`Payment received (Stripe test). Receipt ${receipt}`);
      route();
    } else { clean(); alert("Stripe did not confirm this payment, so the charge stays unpaid."); }
  } catch (error) { console.error(error); clean(); }
}

/* ---------------------------------------------------------------- facility booking */
async function bookView() {
  const facSnap = await col("bookable_facilities").get();
  state.facilities = facSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((f) => f.active !== false);
  const bookings = (await mine("bookings")).sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`));
  main().innerHTML = `<h1>Book a facility</h1><p class="lead">Pick a space, a day and a time. Fees are added to your Payments page.</p>
    <section class="panel"><h2>1. Choose a facility</h2>
      ${state.facilities.length ? `<div class="facility-list">${state.facilities.map((f) => `<button type="button" class="facility-card" data-fac="${esc(f.id)}" aria-pressed="${state.selected === f.id}"><strong>${esc(f.name_en)}</strong><small>${esc(f.openTime)}–${esc(f.closeTime)} · ${f.slotMinutes || 60} min slots · ${f.fee ? money(f.fee) : "Free"}</small><p class="muted" style="margin:6px 0 0">${esc(f.description_en || "")}</p></button>`).join("")}</div>` : `<div class="empty">No facilities are open for booking yet. Management can add them in the admin desk.</div>`}
      <div id="slotArea"></div></section>
    <section class="panel"><h2>My bookings</h2>${bookings.length ? `<div class="table-wrap"><table><thead><tr><th>Facility</th><th>Date</th><th>Time</th><th></th></tr></thead><tbody>${bookings.map((b) => `<tr><td>${esc(b.facilityName)}</td><td>${esc(b.date)}</td><td>${esc(b.start)}–${esc(b.end)}</td><td>${b.date >= isoToday() ? `<button class="table-action danger" data-cancel="${esc(b.id)}">Cancel</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">No bookings yet.</div>`}</section>`;
  main().querySelectorAll("[data-fac]").forEach((b) => b.addEventListener("click", () => { state.selected = b.dataset.fac; main().querySelectorAll("[data-fac]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); slotPicker(); }));
  main().querySelectorAll("[data-cancel]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Cancel this booking?")) return;
    const booking = bookings.find((x) => x.id === b.dataset.cancel);
    const batch = db.batch();
    batch.delete(col("bookings").doc(booking.id));
    batch.delete(col("charges").doc(`bk_${booking.id}`)); // only succeeds while that fee is unpaid (see rules)
    try { await batch.commit(); }
    catch (error) { try { await col("bookings").doc(booking.id).delete(); } catch (inner) { alert("Could not cancel this booking."); } }
    bookView();
  }));
  if (state.selected) slotPicker();
}

async function slotPicker() {
  const facility = state.facilities.find((f) => f.id === state.selected);
  const area = document.getElementById("slotArea");
  if (!facility || !area) return;
  area.innerHTML = `<h2 style="margin-top:22px">2. Choose a day and time</h2>
    <label class="field" style="max-width:240px"><span>Date</span><input type="date" id="bookDate" min="${isoToday()}" value="${isoToday()}"></label>
    <div id="slots" class="status" aria-busy="true">Loading availability…</div><p class="form-feedback" id="bookFeedback" role="status"></p>`;
  const dateInput = document.getElementById("bookDate");
  const load = async () => {
    const slotsBox = document.getElementById("slots");
    slotsBox.setAttribute("aria-busy", "true");
    const taken = new Set();
    try {
      const snap = await col("bookings").where("facilityId", "==", facility.id).where("date", "==", dateInput.value).get();
      snap.docs.forEach((d) => taken.add(d.data().start));
    } catch (error) { console.warn(error); }
    slotsBox.setAttribute("aria-busy", "false");
    const now = new Date(); const today = dateInput.value === isoToday();
    const past = (start) => today && start <= `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    slotsBox.innerHTML = `<div class="slot-grid">${buildSlots(facility).map((s) => `<button type="button" class="slot" data-start="${s.start}" data-end="${s.end}" ${taken.has(s.start) || past(s.start) ? "disabled" : ""}>${s.start}–${s.end}</button>`).join("")}</div>`;
    slotsBox.querySelectorAll(".slot").forEach((b) => b.addEventListener("click", () => confirmBooking(facility, dateInput.value, b.dataset.start, b.dataset.end, b)));
  };
  dateInput.addEventListener("change", load);
  load();
}

async function confirmBooking(facility, date, start, end, button) {
  const feedback = document.getElementById("bookFeedback");
  if (!confirm(`Book ${facility.name_en} on ${date}, ${start}–${end}${facility.fee ? ` for ${money(facility.fee)}` : ""}?`)) return;
  button.disabled = true;
  const id = `${facility.id}_${date}_${start}`; // fixed id: a second booking of the same slot is refused by the rules
  const batch = db.batch();
  batch.set(col("bookings").doc(id), {
    uid: state.user.uid, unit: state.resident.unit, name: state.resident.name,
    facilityId: facility.id, facilityName: facility.name_en, date, start, end, createdAt: FieldValue.serverTimestamp(),
  });
  if (facility.fee > 0) {
    batch.set(col("charges").doc(`bk_${id}`), {
      uid: state.user.uid, unit: state.resident.unit, title: `${facility.name_en} booking ${date} ${start}`,
      amount: facility.fee, currency: currencyFor(siteCode).code, status: "unpaid", source: "booking",
      facilityId: facility.id, bookingId: id, due: date, createdAt: FieldValue.serverTimestamp(),
    });
  }
  try {
    await batch.commit();
    feedback.textContent = facility.fee ? "Booked. The fee is on your Payments page." : "Booked.";
    bookView();
  } catch (error) {
    console.error(error); button.disabled = false;
    feedback.textContent = "That slot was just taken or could not be booked. Pick another time.";
  }
}

/* ---------------------------------------------------------------- requests: eForm / procurement / contact */
async function requestsView(group) {
  const types = Object.entries(REQUEST_TYPES).filter(([, t]) => t.group === group);
  const list = (await mine("requests")).filter((r) => REQUEST_TYPES[r.type]?.group === group).sort(byNewest);
  const heading = { eform: ["Requests & forms", "Maintenance, renovation, vehicle and access cards, moves and feedback."], procurement: ["Procurement", "Request shared supplies or works and follow each step."], contact: ["Contact management", "Message the management office and read the reply here."] }[group];
  main().innerHTML = `<h1>${heading[0]}</h1><p class="lead">${heading[1]}</p>
    <section class="panel"><h2>New request</h2>
      ${types.length > 1 ? `<label class="field" style="max-width:320px"><span>Type</span><select id="reqType">${types.map(([key, t]) => `<option value="${key}">${esc(t.label)}</option>`).join("")}</select></label>` : ""}
      <div id="reqForm"></div></section>
    <section class="panel"><h2>My submissions</h2>${list.length ? list.map(requestCard).join("") : `<div class="empty">Nothing submitted yet.</div>`}</section>`;
  const typeSelect = document.getElementById("reqType");
  const draw = () => renderRequestForm(typeSelect ? typeSelect.value : types[0][0]);
  typeSelect?.addEventListener("change", draw);
  draw();
}

function requestCard(r) {
  const type = REQUEST_TYPES[r.type];
  const steps = type.statuses.filter((s) => s !== "rejected" || r.status === "rejected");
  const reached = steps.indexOf(r.status);
  return `<article style="padding:14px 0;border-bottom:1px solid var(--line)">
    <strong>${esc(r.subject)}</strong> <span class="pill">${esc(STATUS_LABEL(r.status))}</span><br>
    <small class="muted">${esc(type.label)} · Ref ${esc(r.ref)} · ${fmtDate(r.createdAt)}</small>
    <ul class="timeline" aria-label="Progress">${steps.map((s, i) => `<li class="${i <= reached ? "done" : ""}">${esc(STATUS_LABEL(s))}</li>`).join("")}</ul>
    ${r.quoteAmount ? `<p class="note-box">Quote: ${money(r.quoteAmount)}</p>` : ""}
    ${r.adminNote ? `<p class="note-box"><strong>Management:</strong> ${esc(r.adminNote)}</p>` : ""}
  </article>`;
}

function renderRequestForm(typeKey) {
  const type = REQUEST_TYPES[typeKey];
  const box = document.getElementById("reqForm");
  const field = (f) => {
    const req = f.required ? "required" : "";
    const control = f.type === "select" ? `<select name="${f.name}" ${req}><option value="">Choose…</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join("")}</select>`
      : f.type === "textarea" ? `<textarea name="${f.name}" rows="3" ${req}></textarea>`
      : `<input name="${f.name}" type="${f.type === "date" ? "date" : "text"}" ${req} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""} maxlength="200">`;
    return `<label class="field"><span>${esc(f.label)}${f.required ? " *" : ""}</span>${control}</label>`;
  };
  box.innerHTML = `<p class="muted">${esc(type.intro)}</p>
    <form id="requestForm" class="admin-form">
      <label class="field"><span>Subject *</span><input name="subject" required maxlength="140"></label>
      ${type.fields.map(field).join("")}
      <label class="field"><span>Details *</span><textarea name="details" rows="4" required maxlength="2000"></textarea></label>
      <div class="form-actions"><p class="form-feedback" id="reqFeedback" role="status"></p><button class="button" type="submit">Submit</button></div></form>`;
  const form = document.getElementById("requestForm");
  bindDraft(form, `request-${typeKey}`);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedback = document.getElementById("reqFeedback");
    const button = form.querySelector("button[type=submit]"); button.disabled = true; feedback.textContent = "Submitting…";
    const data = Object.fromEntries(new FormData(form));
    const fields = {}; type.fields.forEach((f) => { if (data[f.name]) fields[f.name] = String(data[f.name]); });
    const ref = newReference(siteCode);
    try {
      await col("requests").doc().set({
        uid: state.user.uid, unit: state.resident.unit, name: state.resident.name, type: typeKey, ref,
        subject: data.subject.trim(), details: data.details.trim(), fields, status: "submitted",
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      clearDraft(`request-${typeKey}`);
      alert(`Submitted. Your reference number is ${ref}. You can follow it under “My submissions”.`);
      route();
    } catch (error) { console.error(error); button.disabled = false; feedback.textContent = "Could not submit. Check the published Firestore rules."; }
  });
}

/* ---------------------------------------------------------------- start */
auth.onAuthStateChanged(async (user) => {
  state.user = user; state.resident = null; state.stripe = null;
  if (!user) return authView();
  root.innerHTML = `<section class="loading-card"><span class="eyebrow">MYCELIUM RESIDENCES</span><p>Loading your account…</p></section>`;
  await loadResident();
  // First sign-up: create the pending resident record automatically from the sign-up form.
  if (!state.resident && pendingProfile) {
    try {
      await col("residents").doc(user.uid).set({ uid: user.uid, email: user.email, name: pendingProfile.name, unit: pendingProfile.unit, status: "pending", createdAt: FieldValue.serverTimestamp() });
      pendingProfile = null; await loadResident();
    } catch (error) { console.error(error); joinView("Could not send your request. Check the published Firestore rules."); }
  }
});

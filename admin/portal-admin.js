// Admin screens for the resident portal: residents, requests, charges and facility booking.
// admin.js passes in the shared helpers so this file stays independent of its internals.
import {
  REQUEST_TYPES, STATUS_LABEL, currencyFor, formatMoney, toMinorUnits, BOOKABLE_STARTERS,
} from "../portal/forms-config.js";

export const PORTAL_ROUTE_TITLES = {
  "/admin/residents": "Residents",
  "/admin/requests": "Requests inbox",
  "/admin/charges": "Charges & payments",
  "/admin/bookings": "Facility booking",
};

export const PORTAL_NAV = [
  ["/admin/residents", "Residents", "☺"],
  ["/admin/requests", "Requests", "✎"],
  ["/admin/charges", "Charges", "¤"],
  ["/admin/bookings", "Bookings", "◷"],
];

export function createPortalAdmin(ctx) {
  const { shell, adminCollection, collectionPath, escapeHtml: esc, confirmAction, db, firebase, getSite } = ctx;
  const FieldValue = () => firebase.firestore.FieldValue;
  const money = (minor) => formatMoney(minor, getSite());
  const fmt = (value) => {
    const d = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
    return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "—";
  };
  const read = async (name) => (await adminCollection(name).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
  const newest = (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);

  async function notify(uid, title, body) {
    if (!uid) return;
    await adminCollection("notifications").doc().set({ uid, title, body: body || "", read: false, createdAt: FieldValue().serverTimestamp() });
  }

  const feedbackOf = (id) => document.getElementById(id);

  /* ---------------------------------------------------------- residents */
  async function loadResidents(user) {
    shell(`<section class="panel update-panel"><h2>Residents</h2>
      <p class="muted">Residents sign up on the public Resident Portal. Approve an account after checking the unit. Stored in <code>${esc(collectionPath("residents"))}</code>.</p>
      <p class="form-feedback" id="resFeedback" role="status"></p><div id="residentList" class="status" aria-busy="true">Loading residents…</div></section>`, "/admin/residents", user);
    const mount = document.getElementById("residentList");
    const draw = async () => {
      const rows = (await read("residents")).sort(newest);
      mount.setAttribute("aria-busy", "false");
      if (!rows.length) { mount.innerHTML = `<div class="empty">No resident has signed up for this region yet.</div>`; return; }
      mount.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Unit</th><th>Status</th><th>Manage</th></tr></thead><tbody>${rows.map((r) => `
        <tr><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td><input data-unit="${esc(r.id)}" value="${esc(r.unit)}" maxlength="20" style="width:90px"></td><td>${esc(STATUS_LABEL(r.status))}</td>
        <td class="content-actions">${r.status !== "approved" ? `<button class="table-action" data-act="approved" data-id="${esc(r.id)}">Approve</button>` : ""}${r.status !== "rejected" ? `<button class="table-action danger" data-act="rejected" data-id="${esc(r.id)}">Reject</button>` : ""}<button class="table-action" data-act="unit" data-id="${esc(r.id)}">Save unit</button></td></tr>`).join("")}</tbody></table></div>`;
      mount.querySelectorAll("[data-act]").forEach((button) => button.addEventListener("click", async () => {
        const row = rows.find((r) => r.id === button.dataset.id);
        const unit = mount.querySelector(`[data-unit="${row.id}"]`).value.trim();
        const update = { unit };
        if (button.dataset.act !== "unit") update.status = button.dataset.act;
        button.disabled = true;
        try {
          await adminCollection("residents").doc(row.id).update(update);
          if (update.status === "approved") await notify(row.id, "Account approved", `Welcome! Your account is linked to Unit ${unit}.`);
          feedbackOf("resFeedback").textContent = `Saved ${row.name}.`;
          await draw();
        } catch (error) { console.error(error); button.disabled = false; feedbackOf("resFeedback").textContent = "Could not save. Check the Firestore rules for residents."; }
      }));
    };
    try { await draw(); } catch (error) { console.error(error); mount.innerHTML = `<div class="empty">Could not load residents. Publish the updated firestore-rules.txt and check the admin claim.</div>`; }
  }

  /* ---------------------------------------------------------- requests inbox */
  async function loadRequests(user) {
    shell(`<section class="panel update-panel"><h2>Requests inbox</h2>
      <p class="muted">Maintenance and other forms, procurement requests and messages from residents. Stored in <code>${esc(collectionPath("requests"))}</code>. Changing a status notifies the resident.</p>
      <div class="form-row"><label class="field"><span>Show</span><select id="reqFilterGroup"><option value="">All types</option><option value="eform">Forms (maintenance, renovation…)</option><option value="procurement">Procurement</option><option value="contact">Contact messages</option></select></label>
      <label class="field"><span>Status</span><select id="reqFilterStatus"><option value="">All</option><option value="open">Open (not completed or rejected)</option><option>submitted</option><option>reviewed</option><option>quoted</option><option>approved</option><option>in progress</option><option>completed</option><option>rejected</option></select></label></div>
      <p class="form-feedback" id="reqFeedback" role="status"></p><div id="requestList" class="status" aria-busy="true">Loading…</div></section>`, "/admin/requests", user);
    const mount = document.getElementById("requestList");
    let rows = [];
    const draw = () => {
      const group = document.getElementById("reqFilterGroup").value, status = document.getElementById("reqFilterStatus").value;
      const shown = rows.filter((r) => (!group || REQUEST_TYPES[r.type]?.group === group)
        && (!status || (status === "open" ? !["completed", "rejected"].includes(r.status) : r.status === status)));
      if (!shown.length) { mount.innerHTML = `<div class="empty">No requests match.</div>`; return; }
      mount.innerHTML = shown.map((r) => {
        const type = REQUEST_TYPES[r.type] || { label: r.type, statuses: ["submitted", "completed"] };
        const fields = Object.entries(r.fields || {}).map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join("");
        return `<details class="panel" style="margin-top:10px;padding:14px 18px"><summary><strong>${esc(r.subject)}</strong> · ${esc(type.label)} · Unit ${esc(r.unit)} · <em>${esc(STATUS_LABEL(r.status))}</em> · ${esc(r.ref)}</summary>
          <p>${esc(r.details)}</p><ul>${fields}</ul><p class="muted">From ${esc(r.name)} on ${fmt(r.createdAt)}</p>
          <form data-req="${esc(r.id)}" class="admin-form"><div class="form-row">
            <label class="field"><span>Status</span><select name="status">${type.statuses.map((s) => `<option ${s === r.status ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
            ${r.type === "procurement" ? `<label class="field"><span>Quote amount (${currencyFor(getSite()).code})</span><input name="quote" inputmode="decimal" value="${r.quoteAmount ? (r.quoteAmount / 100).toFixed(2) : ""}"></label>` : ""}</div>
            <label class="field"><span>Reply or note shown to the resident</span><textarea name="note" rows="3" maxlength="1000">${esc(r.adminNote || "")}</textarea></label>
            <div class="form-actions"><button class="button" type="submit">Save and notify resident</button></div></form></details>`;
      }).join("");
      mount.querySelectorAll("form[data-req]").forEach((form) => form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const row = rows.find((r) => r.id === form.dataset.req);
        const data = Object.fromEntries(new FormData(form));
        const update = { status: data.status, adminNote: (data.note || "").trim(), updatedAt: FieldValue().serverTimestamp() };
        if (data.quote !== undefined) update.quoteAmount = toMinorUnits(data.quote) || FieldValue().delete();
        const button = form.querySelector("button"); button.disabled = true;
        try {
          await adminCollection("requests").doc(row.id).update(update);
          await notify(row.uid, `${row.subject}: ${STATUS_LABEL(update.status)}`, update.adminNote || `Reference ${row.ref}`);
          feedbackOf("reqFeedback").textContent = `Updated ${row.ref}.`;
          await load();
        } catch (error) { console.error(error); button.disabled = false; feedbackOf("reqFeedback").textContent = "Could not save. Check the Firestore rules for requests."; }
      }));
    };
    const load = async () => { rows = (await read("requests")).sort(newest); mount.setAttribute("aria-busy", "false"); draw(); };
    document.getElementById("reqFilterGroup").addEventListener("change", draw);
    document.getElementById("reqFilterStatus").addEventListener("change", draw);
    try { await load(); } catch (error) { console.error(error); mount.innerHTML = `<div class="empty">Could not load requests. Publish the updated firestore-rules.txt.</div>`; }
  }

  /* ---------------------------------------------------------- charges */
  async function loadCharges(user) {
    const cur = currencyFor(getSite());
    shell(`<section class="panel update-panel"><h2>Create a charge</h2>
      <p class="muted">Sandbox payments only: residents pay through the demo checkout and no real money moves. Amounts are in ${cur.code}. Stored in <code>${esc(collectionPath("charges"))}</code>.</p>
      <form id="chargeForm" class="admin-form">
        <label class="field"><span>Title</span><input name="title" required maxlength="140" placeholder="e.g. Maintenance fee November"></label>
        <div class="form-row"><label class="field"><span>Amount (${cur.code})</span><input name="amount" required inputmode="decimal" placeholder="150.00"></label>
        <label class="field"><span>Due date</span><input name="due" type="date" required></label></div>
        <label class="field"><span>Charge to</span><select name="target" id="chargeTarget"><option value="all">Every approved resident</option></select></label>
        <div class="form-actions"><p class="form-feedback" id="chargeFeedback" role="status"></p><button class="button" type="submit">Create charge</button></div></form></section>
      <section class="panel update-panel"><h2>All charges</h2><div class="toolbar" style="margin-bottom:12px"><button class="button secondary" id="chargeCsv" type="button">Export CSV</button></div>
      <div id="chargeSummary" class="muted"></div><div id="chargeList" class="status" aria-busy="true">Loading charges…</div></section>`, "/admin/charges", user);
    let residents = [], charges = [];
    const mount = document.getElementById("chargeList");
    const draw = () => {
      const paid = charges.filter((c) => c.status === "paid");
      document.getElementById("chargeSummary").textContent = `${charges.length} charges · paid ${money(paid.reduce((s, c) => s + c.amount, 0))} · outstanding ${money(charges.filter((c) => c.status !== "paid").reduce((s, c) => s + c.amount, 0))}`;
      if (!charges.length) { mount.innerHTML = `<div class="empty">No charges yet.</div>`; return; }
      mount.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Unit</th><th>Charge</th><th>Due</th><th>Amount</th><th>Status</th><th>Manage</th></tr></thead><tbody>${charges.map((c) => `
        <tr><td>${esc(c.unit)}</td><td>${esc(c.title)}</td><td>${esc(c.due || "—")}</td><td>${money(c.amount)}</td>
        <td>${c.status === "paid" ? `Paid · ${esc(c.receiptNo || "")}<br><small class="muted">${esc(c.method || "")}</small>` : "Unpaid"}</td>
        <td class="content-actions">${c.status === "paid" ? "" : `<button class="table-action" data-paid="${esc(c.id)}">Mark paid</button>`}<button class="table-action danger" data-del="${esc(c.id)}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
      mount.querySelectorAll("[data-paid]").forEach((b) => b.addEventListener("click", async () => {
        const c = charges.find((x) => x.id === b.dataset.paid);
        await adminCollection("charges").doc(c.id).update({ status: "paid", paidAt: FieldValue().serverTimestamp(), method: "Marked paid by admin", receiptNo: `RC-ADMIN-${Date.now().toString(36).toUpperCase()}`, gateway: "manual" });
        await notify(c.uid, "Payment recorded", `${c.title} was marked paid by management.`);
        await load();
      }));
      mount.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
        const c = charges.find((x) => x.id === b.dataset.del);
        if (!(await confirmAction({ eyebrow: "DELETE CHARGE", title: `Delete “${c.title}”?`, message: `This removes the charge for Unit ${c.unit}.`, okLabel: "Delete", cancelLabel: "Keep it" }))) return;
        await adminCollection("charges").doc(c.id).delete(); await load();
      }));
    };
    const load = async () => { charges = (await read("charges")).sort(newest); mount.setAttribute("aria-busy", "false"); draw(); };
    try {
      residents = (await read("residents")).filter((r) => r.status === "approved");
      document.getElementById("chargeTarget").insertAdjacentHTML("beforeend", residents.map((r) => `<option value="${esc(r.id)}">Unit ${esc(r.unit)} · ${esc(r.name)}</option>`).join(""));
      await load();
    } catch (error) { console.error(error); mount.innerHTML = `<div class="empty">Could not load charges. Publish the updated firestore-rules.txt.</div>`; }
    document.getElementById("chargeCsv").addEventListener("click", () => {
      const rows = [["Unit", "Title", "Due", "Amount", "Currency", "Status", "Receipt", "Method"], ...charges.map((c) => [c.unit, c.title, c.due, (c.amount / 100).toFixed(2), c.currency, c.status, c.receiptNo || "", c.method || ""])];
      const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = `charges-${getSite()}-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    });
    document.getElementById("chargeForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget, data = Object.fromEntries(new FormData(form));
      const amount = toMinorUnits(data.amount), feedback = feedbackOf("chargeFeedback");
      if (!amount) { feedback.textContent = "Enter an amount greater than zero."; return; }
      const targets = data.target === "all" ? residents : residents.filter((r) => r.id === data.target);
      if (!targets.length) { feedback.textContent = "There is no approved resident to charge yet."; return; }
      feedback.textContent = "Creating…";
      try {
        for (let i = 0; i < targets.length; i += 200) {
          const batch = db.batch();
          targets.slice(i, i + 200).forEach((r) => batch.set(adminCollection("charges").doc(), {
            uid: r.id, unit: r.unit, title: data.title.trim(), amount, currency: currencyFor(getSite()).code,
            status: "unpaid", source: "admin", due: data.due, createdAt: FieldValue().serverTimestamp(),
          }));
          await batch.commit();
        }
        await Promise.all(targets.map((r) => notify(r.id, "New charge", `${data.title.trim()}: ${money(amount)}, due ${data.due}.`)));
        form.reset(); feedback.textContent = `Created ${targets.length} charge${targets.length === 1 ? "" : "s"}.`; await load();
      } catch (error) { console.error(error); feedback.textContent = "Could not create charges. Check the Firestore rules for charges."; }
    });
  }

  /* ---------------------------------------------------------- bookable facilities + bookings */
  async function loadBookings(user) {
    shell(`<section class="panel update-panel"><h2>Bookable facilities</h2>
      <p class="muted">What residents can reserve. Stored in <code>${esc(collectionPath("bookable_facilities"))}</code>. Fees are in ${currencyFor(getSite()).code}; leave blank for free.</p>
      <div id="facilityList" class="status" aria-busy="true">Loading…</div>
      <form id="facilityForm" class="admin-form" style="margin-top:18px"><h3 id="facHeading">Add a facility</h3><input name="id" type="hidden">
        <div class="form-row"><label class="field"><span>Name (English)</span><input name="name" required maxlength="80"></label><label class="field"><span>Fee (optional)</span><input name="fee" inputmode="decimal" placeholder="0.00"></label></div>
        <div class="form-row"><label class="field"><span>Opens</span><input name="openTime" type="time" required value="08:00"></label><label class="field"><span>Closes</span><input name="closeTime" type="time" required value="22:00"></label><label class="field"><span>Slot length (minutes)</span><input name="slotMinutes" type="number" min="15" max="480" step="15" value="60" required></label></div>
        <label class="field"><span>Short description</span><input name="description" maxlength="200"></label>
        <label class="field"><span>Status</span><select name="active"><option value="true">Open for booking</option><option value="false">Hidden</option></select></label>
        <div class="form-actions"><p class="form-feedback" id="facFeedback" role="status"></p><button class="button" type="submit">Save facility</button><button class="button secondary" id="facCancel" type="button" hidden>Cancel edit</button></div></form></section>
      <section class="panel update-panel"><h2>Upcoming bookings</h2><p class="muted">Cancelling notifies the resident.</p><div id="bookingList" class="status" aria-busy="true">Loading…</div></section>`, "/admin/bookings", user);
    const form = document.getElementById("facilityForm"), facMount = document.getElementById("facilityList"), bkMount = document.getElementById("bookingList");
    let facilities = [];
    const resetForm = () => { form.reset(); form.elements.id.value = ""; document.getElementById("facHeading").textContent = "Add a facility"; document.getElementById("facCancel").hidden = true; };
    document.getElementById("facCancel").addEventListener("click", resetForm);
    const drawFacilities = async () => {
      facilities = (await read("bookable_facilities")).sort((a, b) => String(a.name_en).localeCompare(String(b.name_en)));
      facMount.setAttribute("aria-busy", "false");
      if (!facilities.length) {
        facMount.innerHTML = `<div class="empty"><p>No facilities yet. Import four starters (gym, community hall, BBQ pit, court) and edit them.</p><p><button class="button" id="seedFacilities" type="button">Import starter facilities</button></p></div>`;
        document.getElementById("seedFacilities").addEventListener("click", async (e) => {
          e.currentTarget.disabled = true;
          const batch = db.batch();
          BOOKABLE_STARTERS.forEach(({ slug, ...rest }) => batch.set(adminCollection("bookable_facilities").doc(slug), { ...rest, active: true, createdAt: FieldValue().serverTimestamp() }));
          await batch.commit(); await drawFacilities();
        });
        return;
      }
      facMount.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Facility</th><th>Hours</th><th>Slot</th><th>Fee</th><th>Status</th><th>Manage</th></tr></thead><tbody>${facilities.map((f) => `<tr><td>${esc(f.name_en)}</td><td>${esc(f.openTime)}–${esc(f.closeTime)}</td><td>${f.slotMinutes} min</td><td>${f.fee ? money(f.fee) : "Free"}</td><td>${f.active === false ? "Hidden" : "Open"}</td><td class="content-actions"><button class="table-action" data-edit="${esc(f.id)}">Edit</button><button class="table-action danger" data-del="${esc(f.id)}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
      facMount.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
        const f = facilities.find((x) => x.id === b.dataset.edit);
        form.elements.id.value = f.id; form.elements.name.value = f.name_en || ""; form.elements.fee.value = f.fee ? (f.fee / 100).toFixed(2) : "";
        form.elements.openTime.value = f.openTime; form.elements.closeTime.value = f.closeTime; form.elements.slotMinutes.value = f.slotMinutes || 60;
        form.elements.description.value = f.description_en || ""; form.elements.active.value = f.active === false ? "false" : "true";
        document.getElementById("facHeading").textContent = "Edit facility"; document.getElementById("facCancel").hidden = false; form.scrollIntoView({ behavior: "smooth" });
      }));
      facMount.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
        const f = facilities.find((x) => x.id === b.dataset.del);
        if (!(await confirmAction({ eyebrow: "DELETE FACILITY", title: `Delete “${f.name_en}”?`, message: "Existing bookings stay in the list but residents can no longer book it.", okLabel: "Delete", cancelLabel: "Keep it" }))) return;
        await adminCollection("bookable_facilities").doc(f.id).delete(); await drawFacilities();
      }));
    };
    const drawBookings = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const rows = (await read("bookings")).filter((b) => b.date >= today).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
      bkMount.setAttribute("aria-busy", "false");
      if (!rows.length) { bkMount.innerHTML = `<div class="empty">No upcoming bookings.</div>`; return; }
      bkMount.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Facility</th><th>Unit</th><th>Resident</th><th></th></tr></thead><tbody>${rows.map((b) => `<tr><td>${esc(b.date)}</td><td>${esc(b.start)}–${esc(b.end)}</td><td>${esc(b.facilityName)}</td><td>${esc(b.unit)}</td><td>${esc(b.name)}</td><td><button class="table-action danger" data-cancel="${esc(b.id)}">Cancel</button></td></tr>`).join("")}</tbody></table></div>`;
      bkMount.querySelectorAll("[data-cancel]").forEach((b) => b.addEventListener("click", async () => {
        const row = rows.find((x) => x.id === b.dataset.cancel);
        if (!(await confirmAction({ eyebrow: "CANCEL BOOKING", title: `Cancel ${row.facilityName} on ${row.date}?`, message: `Unit ${row.unit} will be notified.`, okLabel: "Cancel booking", cancelLabel: "Keep it" }))) return;
        await adminCollection("bookings").doc(row.id).delete();
        try { await adminCollection("charges").doc(`bk_${row.id}`).delete(); } catch (error) { /* no fee */ }
        await notify(row.uid, "Booking cancelled", `${row.facilityName} on ${row.date} ${row.start} was cancelled by management.`);
        await drawBookings();
      }));
    };
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form)), feedback = feedbackOf("facFeedback");
      const id = data.id || data.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
      if (!id) { feedback.textContent = "Enter a name."; return; }
      if (data.closeTime <= data.openTime) { feedback.textContent = "Closing time must be after opening time."; return; }
      try {
        await adminCollection("bookable_facilities").doc(id).set({
          name_en: data.name.trim(), openTime: data.openTime, closeTime: data.closeTime, slotMinutes: Number(data.slotMinutes) || 60,
          fee: toMinorUnits(data.fee), description_en: data.description.trim(), active: data.active !== "false",
          countryCode: getSite(), updatedAt: FieldValue().serverTimestamp(),
        }, { merge: true });
        resetForm(); feedback.textContent = "Saved."; await drawFacilities();
      } catch (error) { console.error(error); feedback.textContent = "Could not save. Check the Firestore rules for bookable_facilities."; }
    });
    try { await drawFacilities(); await drawBookings(); } catch (error) { console.error(error); bkMount.innerHTML = `<div class="empty">Could not load. Publish the updated firestore-rules.txt.</div>`; }
  }

  return { "/admin/residents": loadResidents, "/admin/requests": loadRequests, "/admin/charges": loadCharges, "/admin/bookings": loadBookings };
}

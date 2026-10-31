// Shared by the resident portal and the admin desk: request types, statuses, currency and demo facilities.
// Nothing here touches Firestore field names that already exist; all collections below are new.

export const SITE_CURRENCY = {
  MY_PP: { code: "MYR", symbol: "RM", locale: "en-MY" },
  MY_JB: { code: "MYR", symbol: "RM", locale: "en-MY" },
  US_PL: { code: "USD", symbol: "$", locale: "en-US" },
};

export function currencyFor(siteCode) {
  return SITE_CURRENCY[siteCode] || SITE_CURRENCY.MY_PP;
}

// Amounts are stored as whole minor units (sen / cents) so there is never a floating-point rounding problem.
export function formatMoney(minor, siteCode) {
  const { code, locale } = currencyFor(siteCode);
  return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format((Number(minor) || 0) / 100);
}

export function toMinorUnits(text) {
  const value = Math.round(Number(String(text).replace(/[^0-9.]/g, "")) * 100);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export const STANDARD_STATUSES = ["submitted", "reviewed", "in progress", "completed", "rejected"];
export const PROCUREMENT_STATUSES = ["submitted", "reviewed", "quoted", "approved", "in progress", "completed", "rejected"];

// field.type: text | textarea | select | date
export const REQUEST_TYPES = {
  maintenance: {
    label: "Maintenance request", group: "eform", statuses: STANDARD_STATUSES,
    intro: "Report a fault in your home or a shared area. We will confirm and update the status here.",
    fields: [
      { name: "category", label: "Category", type: "select", required: true, options: ["Plumbing", "Electrical", "Air conditioning", "Door or lock", "Shared area", "Other"] },
      { name: "location", label: "Where is it?", type: "text", required: true, placeholder: "e.g. Kitchen, Block B corridor" },
      { name: "urgency", label: "Urgency", type: "select", required: true, options: ["Normal", "Urgent", "Emergency (also call the guard desk)"] },
    ],
  },
  renovation: {
    label: "Renovation application", group: "eform", statuses: STANDARD_STATUSES,
    intro: "Apply before starting any works so management can confirm hours and rules.",
    fields: [
      { name: "scope", label: "Type of works", type: "select", required: true, options: ["Painting", "Flooring", "Kitchen or bathroom", "Wiring or plumbing", "Other"] },
      { name: "startDate", label: "Planned start", type: "date", required: true },
      { name: "endDate", label: "Planned finish", type: "date", required: true },
      { name: "contractor", label: "Contractor name and phone", type: "text", required: true },
    ],
  },
  vehicle: {
    label: "Vehicle or access card", group: "eform", statuses: STANDARD_STATUSES,
    intro: "Register a vehicle or ask for a new or replacement access card.",
    fields: [
      { name: "kind", label: "Request", type: "select", required: true, options: ["Register vehicle", "New access card", "Replace lost card"] },
      { name: "plate", label: "Vehicle plate (if any)", type: "text", required: false },
      { name: "model", label: "Vehicle model and colour (if any)", type: "text", required: false },
    ],
  },
  move: {
    label: "Move in or move out", group: "eform", statuses: STANDARD_STATUSES,
    intro: "Book the lift and loading area for a move.",
    fields: [
      { name: "direction", label: "Move", type: "select", required: true, options: ["Move in", "Move out"] },
      { name: "moveDate", label: "Move date", type: "date", required: true },
      { name: "company", label: "Moving company (if any)", type: "text", required: false },
    ],
  },
  feedback: {
    label: "Feedback", group: "eform", statuses: STANDARD_STATUSES,
    intro: "Tell us what is working and what is not.",
    fields: [
      { name: "topic", label: "Topic", type: "select", required: true, options: ["Facilities", "Safety", "Cleanliness", "Events", "Neighbours", "Other"] },
    ],
  },
  procurement: {
    label: "Procurement request", group: "procurement", statuses: PROCUREMENT_STATUSES,
    intro: "Request shared supplies or maintenance work. You can follow each step from submission to completion.",
    fields: [
      { name: "category", label: "Category", type: "select", required: true, options: ["Garden supplies", "Cleaning supplies", "Repairs", "Equipment", "Event supplies", "Other"] },
      { name: "quantity", label: "Quantity or size", type: "text", required: true, placeholder: "e.g. 10 bags, 2 benches" },
      { name: "priority", label: "Priority", type: "select", required: true, options: ["Low", "Normal", "High"] },
      { name: "needBy", label: "Needed by (optional)", type: "date", required: false },
    ],
  },
  contact: {
    label: "Message to management", group: "contact", statuses: STANDARD_STATUSES,
    intro: "Send a message. You will get a reference number and a reply here.",
    fields: [
      { name: "topic", label: "Topic", type: "select", required: true, options: ["General question", "Billing", "Facilities", "Security", "Complaint", "Suggestion"] },
    ],
  },
};

export const STATUS_LABEL = (status) => String(status || "submitted").replace(/^./, (c) => c.toUpperCase());

// Facilities residents can book. Admin can import these and edit them. fee = minor units in the region's currency.
export const BOOKABLE_STARTERS = [
  { slug: "gym", name_en: "Gym", openTime: "06:00", closeTime: "22:00", slotMinutes: 60, fee: 0, description_en: "Cardio and free weights. One booking per household per slot." },
  { slug: "community-hall", name_en: "Community hall", openTime: "09:00", closeTime: "22:00", slotMinutes: 120, fee: 3000, description_en: "Parties and meetings, up to 40 guests. Fee covers cleaning." },
  { slug: "bbq-pit", name_en: "BBQ pit", openTime: "16:00", closeTime: "22:00", slotMinutes: 120, fee: 1500, description_en: "Grill area with seating for 12." },
  { slug: "multi-purpose-court", name_en: "Multi-purpose court", openTime: "07:00", closeTime: "21:00", slotMinutes: 60, fee: 0, description_en: "Badminton, basketball or futsal." },
];

export function buildSlots(facility) {
  const toMinutes = (text) => { const [h, m] = String(text || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
  const step = Math.max(15, Number(facility.slotMinutes) || 60);
  const slots = [];
  for (let start = toMinutes(facility.openTime); start + step <= toMinutes(facility.closeTime); start += step) {
    const label = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    slots.push({ start: label(start), end: label(start + step) });
  }
  return slots;
}

export function newReference(siteCode, prefix = "MYC") {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const random = Array.from(crypto.getRandomValues(new Uint8Array(3))).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `${prefix}-${siteCode.replace("_", "")}-${stamp}-${random}`;
}

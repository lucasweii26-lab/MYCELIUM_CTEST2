// OPTIONAL Stripe TEST MODE checkout for the resident portal demo. No dependencies: it calls Stripe's REST API.
//
// Setup (only if you want the "Stripe Test Mode" payment method; the built-in sandbox works without it):
//   1. Create a free Stripe account and stay in Test Mode.
//   2. Netlify -> Site configuration -> Environment variables -> STRIPE_SECRET_KEY = your sk_test_... key.
//   3. Redeploy. The portal shows the Stripe option automatically when this function reports enabled.
// Safety: a live key (sk_live_...) is refused, so real money can never be charged by this demo.
//
//   GET                    -> { enabled: boolean }
//   POST {title, amount, currency, successUrl, cancelUrl} -> { url }  (Checkout Session, amount in minor units)
//   GET ?session_id=cs_... -> { paid, amount, currency }

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
const key = () => {
  const value = process.env.STRIPE_SECRET_KEY || "";
  return value.startsWith("sk_test_") ? value : "";
};

async function stripe(path, init = {}) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/x-www-form-urlencoded", ...(init.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Stripe request failed");
  return data;
}

export default async (request) => {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) return json(200, { enabled: Boolean(key()) });
    if (!key() || !/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) return json(400, { error: "Invalid session" });
    try {
      const session = await stripe(`checkout/sessions/${sessionId}`);
      return json(200, { paid: session.payment_status === "paid", amount: session.amount_total, currency: session.currency });
    } catch (error) { return json(502, { error: error.message }); }
  }
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!key()) return json(503, { error: "Stripe test mode is not configured." });
  try {
    const body = await request.json();
    const amount = Math.round(Number(body.amount));
    const currency = String(body.currency || "").toLowerCase();
    if (!Number.isInteger(amount) || amount < 200 || amount > 5_000_000) return json(400, { error: "Amount out of range." });
    if (!["myr", "usd"].includes(currency)) return json(400, { error: "Unsupported currency." });
    const origin = new URL(request.url).origin;
    for (const link of [body.successUrl, body.cancelUrl]) {
      if (typeof link !== "string" || !link.startsWith(origin)) return json(400, { error: "Redirect must stay on this site." });
    }
    const form = new URLSearchParams({
      mode: "payment",
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][unit_amount]": String(amount),
      "line_items[0][price_data][product_data][name]": String(body.title || "Community charge").slice(0, 120),
    });
    const session = await stripe("checkout/sessions", { method: "POST", body: form });
    return json(200, { url: session.url });
  } catch (error) {
    return json(502, { error: `Stripe test checkout failed: ${error.message}` });
  }
};

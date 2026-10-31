# Resident portal (phases 1-3, exhibition demo)

Public page `/portal/` (files in `portal/`), admin screens in `admin/portal-admin.js`.
Everything is stored per community under `countries/{CC}/cities/{CITY}/`: `residents`, `bookable_facilities`,
`bookings`, `charges`, `requests`, `notifications`. English only for now. No real money moves.

## One-time setup
1. Firebase console > Authentication > Sign-in method: enable **Email/Password** and **Google**.
2. Authentication > Settings > Authorized domains: add your Netlify domain (and `localhost` for testing).
3. Firestore > Rules: paste `firestore-rules.txt` and publish.
4. `npm run build`, deploy.
5. Optional Stripe Test Mode: Netlify env var `STRIPE_SECRET_KEY=sk_test_...` and redeploy.
   Live keys (`sk_live_`) are refused by the function.

## Demo flow
Resident signs up (name, unit) > admin **Residents** approves > admin **Charges** creates a charge >
resident pays in the sandbox checkout (FPX/DuitNow/card for Malaysia, card/ACH for the US) >
admin sees it paid and can export CSV. Booking, requests, procurement and contact messages follow the same pattern.

## Honest limits
- Charge "paid" is written by the resident's browser (demo rule). A real gateway must use a verified webhook.
- Roles beyond admin (guard, finance, committee) are not built; every portal admin screen needs the existing admin claim.
- Email notifications are not sent; notices appear in the portal bell.
- Community Safety and Green Living items are labelled "Coming soon" on the website.

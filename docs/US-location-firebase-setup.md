# Enable the US demo location

The site keeps US records under `locations/US/...`; Malaysia continues using its existing top-level collections. The sample records are fictional demonstration content. `lucastanzhenwei@gmail.com` is scoped to both `MY` and `US`.

## 1. Firestore rules

In Firebase Console, open **Firestore Database → Rules**. Replace the editor contents with the repository's `firestore.rules`, then select **Publish**. This is the data-security boundary: a signed-out visitor or a user without an admin claim cannot read US newsletter, volunteer, report submissions, or AI settings. Public US announcements/events/facilities/services/FAQs and `locations/US/settings/main` can be read.

## 2. Create/confirm the administrator login

Open **Authentication → Sign-in method** and enable **Email/Password**. Under **Users**, create or confirm `lucastanzhenwei@gmail.com`. Set the password there and give it to the account owner through a private channel; do not put it in this repository or chat. The US rule requires the account's email to be verified before US admin data can be read.

## 3. Import the US sample content

Download a Firebase service-account JSON from **Project settings → Service accounts → Generate new private key**. Store it outside the website folder and never commit or send it. From the project folder, in PowerShell:

```powershell
npm install --no-save firebase-admin
$env:FIREBASE_SERVICE_ACCOUNT_PATH = 'C:\private\mycelium-firebase-service-account.json'
node scripts/seed-us-demo-content.mjs
```

The importer creates missing demo documents under `locations/US`; it skips existing announcements, events, facilities, and FAQ documents. For existing `settings/main`, `settings/ai`, and `rules/community` documents, it fills only missing or blank fields and preserves non-empty values such as `allowedScope`. Re-running the import adds sample Spanish and Chinese community-rule translations if those fields are missing. The eight known `services/01`–`services/08` demo documents are refreshed from `data/us-demo-content.json` on each run; those fictional Portland-area contact details are placeholders and must be replaced with verified providers before real residents use them. This does not touch Malaysia's top-level `services` collection. Review the data file before import if you want to edit the demo wording. The interface offers English, Spanish, Simplified Chinese, Malay and Tamil in both regions; US records without Malay/Tamil fields currently display their English fallback until those translations are added.

## 4. Grant MY and US administrator access

With the same protected service-account path set in the PowerShell session, run:

```powershell
node scripts/set-admin-claim.mjs lucastanzhenwei@gmail.com MY grant
node scripts/set-admin-claim.mjs lucastanzhenwei@gmail.com US grant
```

The claims will include `admin: true`, `adminLocations: ["MY", "US"]`, and the compatibility flags `myAdmin: true`, `usAdmin: true`. In Firestore Rules, Custom Claims are direct properties of `request.auth.token` (for example `request.auth.token.usAdmin`), not nested inside `request.auth.token.customClaims`. Claims are managed with Firebase Admin SDK, not in browser code. After the change, sign out and back in so the browser receives the updated token. The admin page includes a region selector for accounts with both scopes; the root collections remain MY and US forms are stored below `locations/US`.

To revoke this account's US admin scope later:

```powershell
node scripts/set-admin-claim.mjs lucastanzhenwei@gmail.com US revoke
```

## 5. Deploy and verify

Commit and push the changed site files so Netlify deploys them. Open `/us/`, then check the location selector, Portland facility map, US announcements/events, all five language options, newsletter/volunteer submission paths, and AI answers. Sign in from the US site so the admin page opens on the US data region; the dashboard should show only US records. A normal account or signed-out browser must get a Firestore permission error if it attempts to read either US private collection. Admins manage resident notices at `/admin/announcements` and calendar entries at `/admin/events`.

The service account is for trusted local setup only. Delete the downloaded JSON when setup is complete, or store it in a managed secret vault for future maintenance. Never place it in a `VITE_*` variable, website asset folder, or GitHub repository.

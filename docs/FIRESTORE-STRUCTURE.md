# Firestore layout: country > city > collection > document

```
countries/
├─ MY/                                  (Malaysia)
│  └─ cities/
│     ├─ PP/   Pulau Tikus, Penang      site code  MY_PP
│     └─ JB/   Johor Bahru, Johor       site code  MY_JB
└─ US/                                  (United States)
   └─ cities/
      └─ PL/   Portland, Oregon         site code  US_PL

every city contains the same collections:
   announcements/{id}          public read · city admin write
   events/{id}                 public read · city admin write
   faqs/{id}                   public read · city admin write
   facilities/{id}             public read · city admin write   (id e.g. clubhouse, gym; optional photoUrl)
   services/{id}               public read · city admin write
   rules/community             public read · city admin write
   gallery_events/{id}         public read · city admin write
   settings/main               public read · city admin write
   settings/ai                 admin only
   newsletter_subscribers/{id} public CREATE · admin read
   volunteers/{id}             public CREATE · admin read
   reports/{id}                public CREATE · admin read
```

Documents keep `countryCode` = the full **site code** (`MY_PP`, `MY_JB`, `US_PL`). The path itself already decides
which city a record belongs to, so the website no longer filters by `countryCode` inside a city.

## Admin access (custom claims)

`adminLocations` may contain a country (`"MY"` = Pulau Tikus + Johor Bahru, `"US"` = Portland) or a single site
(`"MY_JB"`). The admin page's "Data region" menu lists every city the signed-in account may edit.

```powershell
node scripts/set-admin-claim.mjs you@example.com MY grant      # both Malaysian cities
node scripts/set-admin-claim.mjs you@example.com MY_JB grant   # Johor Bahru only
node scripts/set-admin-claim.mjs you@example.com US grant      # Portland (email must be verified)
```
Sign out and back in afterwards so the browser receives the new token.

## Moving to the new layout (do these in order)

1. **Publish the new rules.** Firebase Console → Firestore → Rules → paste `firestore-rules.txt` → Publish.
   It allows both the new and the old layout, so nothing breaks yet.
2. **Preview the copy.**  `node scripts/migrate-to-city-structure.mjs`  (dry run, writes nothing).
3. **Copy.**  `node scripts/migrate-to-city-structure.mjs --apply`  (copies only; ids are kept; never overwrites;
   prints a count table to verify).
4. **Deploy the website.** The site reads the new path first and falls back to the old one if a collection is empty.
5. Check each city on the site and in `/admin`. Add one test announcement per city: it must appear under
   `countries/<CC>/cities/<CITY>/announcements` and show on that city's site only.
6. When happy, delete the old data in the console (`locations/*` and the root collections) and remove the
   "OLD LAYOUT" block from the rules.

Optional: `node scripts/seed-us-demo-content.mjs` now seeds `countries/US/cities/PL`.

## Photos for facilities

Put images in `img/Facilities/` using the file names listed in `img/Facilities/README.txt`.

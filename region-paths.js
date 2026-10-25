// Single source of truth for WHERE regional data lives in Firestore.
//
//   countries/{COUNTRY}/cities/{CITY}/{collection}/{docId}
//   e.g. countries/MY/cities/PP/announcements/abc123
//        countries/MY/cities/JB/events/xyz
//        countries/US/cities/PL/facilities/clubhouse
//
// Site codes used by the website are COUNTRY_CITY: MY_PP, MY_JB, US_PL.
// Reads fall back to the old layout (root collections for MY_PP, locations/{code} for the others)
// while a collection is still empty in the new place, so nothing goes blank before the migration
// script (scripts/migrate-to-city-structure.mjs) has been run. Writes always use the new layout.
(() => {
  const SITES = {
    MY_PP: { country: "MY", city: "PP", label: "Malaysia · Pulau Tikus", home: "/my/pp/" },
    MY_JB: { country: "MY", city: "JB", label: "Malaysia · Johor Bahru", home: "/my/jb/" },
    US_PL: { country: "US", city: "PL", label: "United States · Portland", home: "/us/pl/" },
  };
  // Older code / claims used only the country.
  const LEGACY_ALIASES = { MY: "MY_PP", US: "US_PL" };
  // Where each site's data lived BEFORE the city structure existed (tried in this order).
  const LEGACY_PATHS = {
    MY_PP: [[]],                                   // root collections
    MY_JB: [["locations", "MY_JB"]],
    US_PL: [["locations", "US_PL"], ["locations", "US"]],
  };

  function normalize(code) {
    const c = String(code || "").trim().toUpperCase().replace(/[-/]/g, "_");
    return SITES[c] ? c : (LEGACY_ALIASES[c] || "");
  }

  function path(code, name, docId) {
    const site = SITES[normalize(code)] || SITES.MY_PP;
    const base = `countries/${site.country}/cities/${site.city}/${name}`;
    return docId ? `${base}/${docId}` : base;
  }

  function ref(db, code, name) {
    const site = SITES[normalize(code)] || SITES.MY_PP;
    return db.collection("countries").doc(site.country)
      .collection("cities").doc(site.city)
      .collection(name);
  }

  function legacyRefs(db, code, name) {
    return (LEGACY_PATHS[normalize(code)] || []).map((segments) => {
      if (!segments.length) return db.collection(name);
      return db.collection(segments[0]).doc(segments[1]).collection(name);
    });
  }

  // Resolves to { docs, legacy }. `legacy` is true when the old location had to be used.
  async function readCollection(db, code, name) {
    const fresh = await ref(db, code, name).get();
    if (!fresh.empty) return { docs: fresh.docs, legacy: false };
    for (const legacyRef of legacyRefs(db, code, name)) {
      try {
        const old = await legacyRef.get();
        if (!old.empty) return { docs: old.docs, legacy: true };
      } catch (error) { /* old location may be unreadable under the new rules; ignore */ }
    }
    return { docs: [], legacy: false };
  }

  async function readDoc(db, code, name, docId) {
    const fresh = await ref(db, code, name).doc(docId).get();
    if (fresh.exists) return fresh;
    for (const legacyRef of legacyRefs(db, code, name)) {
      try {
        const old = await legacyRef.doc(docId).get();
        if (old.exists) return old;
      } catch (error) { /* ignore */ }
    }
    return fresh;
  }

  window.MYCELIUM_REGION_PATHS = { SITES, normalize, path, ref, legacyRefs, readCollection, readDoc };
})();

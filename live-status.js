// Cloudflare Worker: tells the website which YouTube channels are live right now.
// UNTESTED STARTER — deploy it, open <worker-url>?ids=UCNye-wNBqNL5ZzHSJj3l8Bg in a browser and check
// that the JSON makes sense before putting the URL in country-config.js (liveStatusUrl).
//
// How it works: for each channel ID it loads youtube.com/channel/<ID>/live. If the channel is streaming,
// that page redirects to the live video and contains "isLiveNow":true; otherwise it does not.
// Results are cached for 5 minutes so YouTube is not asked on every visitor request.
//
// Response: { "<channelId>": { "live": true, "videoId": "abc123def45" }, ... }
const ID = /^UC[\w-]{22}$/;
const ALLOWED_ORIGINS = ["https://your-domain.example"]; // TODO: your real site origin(s); keep localhost for testing
const CACHE_SECONDS = 300;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allow = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin) ? origin : ALLOWED_ORIGINS[0];
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": allow,
      "Vary": "Origin",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
    };
    const ids = (url.searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter((s) => ID.test(s)).slice(0, 12);
    if (!ids.length) return new Response(JSON.stringify({}), { headers });

    const results = {};
    await Promise.all(ids.map(async (id) => {
      const cacheKey = new Request(`https://live-status.cache/${id}`);
      const cached = await caches.default.match(cacheKey);
      if (cached) { results[id] = await cached.json(); return; }
      let entry = { live: false, videoId: "" };
      try {
        const response = await fetch(`https://www.youtube.com/channel/${id}/live`, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MyceliumLiveStatus/1.0)", "Accept-Language": "en" },
          redirect: "follow",
        });
        const html = await response.text();
        if (html.includes('"isLiveNow":true')) {
          const match = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/);
          entry = { live: true, videoId: match ? match[1] : "" };
        }
      } catch { /* leave as not live; the site then simply shows the channel without a badge change */ }
      results[id] = entry;
      await caches.default.put(cacheKey, new Response(JSON.stringify(entry), { headers: { "Cache-Control": `max-age=${CACHE_SECONDS}` } }));
    }));
    return new Response(JSON.stringify(results), { headers });
  },
};
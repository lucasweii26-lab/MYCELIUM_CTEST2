// [MYCELIUM UPGRADE] Region configuration: add a country only when its content is ready.
// `new URL()` works in both Vite builds and native ES modules served by Live Server.
const facilityMapUrl = new URL("./img/Slide/facility_map.jpg", import.meta.url).href;
const portlandFacilityMapUrl = new URL("./img/Slide/PORTLANDfacility.png", import.meta.url).href;

export const DEFAULT_COUNTRY_CODE = "MY";

export const COUNTRY_SITES = {
  MY: {
    code: "MY",
    name: "Malaysia",
    route: "/my/",
    status: "active",
    locale: "en-MY",
    timeZone: "Asia/Kuala_Lumpur",
    // Pulau Tikus, George Town, Penang (approximate centre of the neighbourhood).
    locality: "Pulau Tikus",
    region: "Penang",
    coordinates: { latitude: 5.4300, longitude: 100.3050 },
    languages: ["en", "es", "zh-CN", "ms", "ta"],
    facilityMap: facilityMapUrl,
    contentNamespace: "MY",
    // Live news (live-news.js). Each entry needs a YouTube channel ID ("UC" + 22 characters).
    // Add more entries to get tabs. Check each channel actually streams live and allows embedding.
    liveNews: [
      {
        id: "bernama",
        name: "Bernama TV",
        description: "Malaysia's national news agency channel.",
        youtubeChannelId: "UCcZg5r9hBqK_VPUT2I7eYVw",
        newsUrl: "https://www.bernama.com/en/",
      },
      {
        id: "aljazeera-en",
        name: "Al Jazeera English",
        description: "International news, live around the clock.",
        youtubeChannelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
        newsUrl: "https://www.aljazeera.com/",
      },
      // To add a channel: copy a block, give it a unique id, and paste the channel's YouTube ID
      // (YouTube channel page -> About -> Share -> Copy channel ID; it starts with "UC").
      // Open https://www.youtube.com/channel/<ID>/live once to confirm it streams and allows embedding.
    ],
    // Optional: URL of the live-status endpoint (see workers/live-status.js). Leave empty to hide Live badges.
    liveStatusUrl: "",
    // Air quality (air-quality.js). Coordinates are approximate for Pulau Tikus; swap in the exact
    // site coordinates when you have them.
    airQuality: {
      latitude: 5.4300,
      longitude: 100.3050,
      place: "Pulau Tikus, Penang",
      officialLabel: "Official Air Pollutant Index (DOE Malaysia)",
      officialUrl: "https://apims.doe.gov.my/",
    },
  },
  // USA profile. Data uses an isolated Firestore namespace; interface language
  // choices are shared across both live regions.
  US: {
    code: "US",
    name: "United States",
    route: "/us/",
    status: "active",
    locale: "en-US",
    timeZone: "America/Los_Angeles",
    coordinates: { latitude: 45.5152, longitude: -122.6784 },
    languages: ["en", "es", "zh-CN", "ms", "ta"],
    facilityMap: portlandFacilityMapUrl,
    contentNamespace: "US",
    liveNews: [
      {
        id: "kgw",
        name: "KGW News (Portland)",
        description: "Portland's NBC affiliate. Newscasts stream on a schedule.",
        youtubeChannelId: "UCKgAB8lqTbqbwXC-e6_9lhQ",
        newsUrl: "https://www.kgw.com/",
      },
      {
        id: "aljazeera-en",
        name: "Al Jazeera English",
        description: "International news, live around the clock.",
        youtubeChannelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
        newsUrl: "https://www.aljazeera.com/",
      },
    ],
    liveStatusUrl: "",
    airQuality: {
      latitude: 45.5152,
      longitude: -122.6784,
      place: "Portland, Oregon",
      officialLabel: "Official AQI readings (AirNow)",
      officialUrl: "https://www.airnow.gov/",
    },
    contact: {
      generalPhone: "+1 (234) 567-8910",
      address: "John Smith, 123 Main Street, 12345",
      generalEmail: "john.smith@company.com",
      // The sample pack has no separate security number, so the demo reuses
      // the management line until a dedicated number is supplied.
      securityDesk24h: "+1 (234) 567-8910",
    },
    // Normalized map positions taken from the annotated Portland site plan.
    // The UI keeps using the shared map component; only these location points change.
    mapPins: {
      communityGarden: { x: 11, y: 76 },
      fitnessCenter: { x: 7.7, y: 69.8 },
      coWorkingLounge: { x: 52.6, y: 42.8 },
      bikeHub: { x: 94, y: 42 },
      evCharging: { x: 58, y: 73 },
      recyclingCompost: { x: 39.7, y: 86.7 },
      walkingTrail: { x: 81, y: 47 },
      clubhouse: { x: 57, y: 51 },
    },
  },
};

export function getCountrySite(code) {
  if (!code) return undefined;
  return COUNTRY_SITES[String(code).toUpperCase()];
}
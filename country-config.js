// country-config.js
const facilityMapUrl = new URL("./img/Slide/facility_map.webp", import.meta.url).href;
const portlandFacilityMapUrl = new URL("./img/Slide/PORTLANDfacility.webp", import.meta.url).href;

export const DEFAULT_COUNTRY_CODE = "MY_PP";

// ==========================================================================
// 1. WORLDWIDE NEWS (Applies to ALL locations globally)
// 均为公共广播国际新闻，100% 开放嵌入且无版权地域限制
// ==========================================================================
const GLOBAL_NEWS = [
  {
    id: "dw-news",
    name: "DW News",
    description: "24/7 live news from the heart of Europe. Global issues and tech focus.",
    youtubeChannelId: "UCknLrEdhRCp1aegoMqRaCZg",
    newsUrl: "https://www.dw.com/",
  },
  {
    id: "al-jazeera",
    name: "Al Jazeera English",
    description: "In-depth global news and award-winning journalism.",
    youtubeChannelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
    newsUrl: "https://www.aljazeera.com/",
  },
  {
    id: "france-24",
    name: "France 24 English",
    description: "Continuous international news broadcast from Paris.",
    youtubeChannelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
    newsUrl: "https://www.france24.com/en/",
  }
];

// ==========================================================================
// 2. NATIONAL NEWS (Applies to all cities within the specific country)
// ==========================================================================
const NATIONAL_NEWS = {
  "MY": [
    {
      id: "bernama-tv",
      name: "Bernama TV",
      description: "Malaysia's official 24-hour national news agency.",
      youtubeChannelId: "UCcZg5r9hBqK_VPUT2I7eYVw", // 马新社官方频道，无版权嵌入限制
      newsUrl: "https://www.bernama.com/",
    }
  ],
  "US": [
    {
      id: "livenow-fox",
      name: "LiveNOW from FOX",
      description: "Raw and unfiltered 24/7 breaking news across the United States.",
      youtubeChannelId: "UCJg9wBPyKMNA5sRDnvzmkdg", // 专为互联网打造的新闻流，开放嵌入
      newsUrl: "https://www.livenowfox.com/",
    },
    {
      id: "abc-news",
      name: "ABC News Live",
      description: "24/7 coverage of breaking news, politics, and weather.",
      youtubeChannelId: "UCBi2mrWuNuyYy4gbM6fU18Q", // 全球无限制，100% 支持嵌入
      newsUrl: "https://abcnews.go.com/Live",
    }
  ]
};

// ==========================================================================
// 3. COMMUNITY SITES CONFIGURATION
// ==========================================================================
export const COUNTRY_SITES = {
  // 1. Malaysia - Penang (Pulau Tikus)
  MY_PP: {
    code: "MY_PP",
    countryCode: "MY",
    cityCode: "PP",
    name: "Malaysia",
    city: "Pulau Tikus",
    displayName: "Pulau Tikus, Penang",
    route: "/my/pp/",
    status: "active",
    locale: "en-MY",
    timeZone: "Asia/Kuala_Lumpur",
    locality: "Pulau Tikus",
    region: "Penang",
    coordinates: { latitude: 5.4300, longitude: 100.3050 },
    languages: ["en", "es", "zh-CN", "ms", "ta"],
    facilityMap: facilityMapUrl,
    contentNamespace: "MY_PP",
    
    // Local News (Penang specific)
    localNews: [
      {
        id: "buletin-mutiara",
        name: "Buletin Mutiara (Penang)",
        description: "Official municipal & local news channel of Penang State.",
        youtubeChannelId: "UCkO4-w4aD3p-g3Z1Yn9xU9A",
        newsUrl: "https://www.buletinmutiara.com/",
      }
    ],
    // TODO: Replace with your actual Cloudflare Worker URL later for the "LIVE" badges
    liveStatusUrl: "https://live-status.mycelium-community.workers.dev",
    airQuality: {
      latitude: 5.4300,
      longitude: 100.3050,
      place: "Pulau Tikus, Penang",
      officialLabel: "Official Air Pollutant Index (DOE Penang)",
      officialUrl: "https://apims.doe.gov.my/",
    },
    contact: {
      generalPhone: "+60 10-557 0900",
      address: "Clubhouse Level 1, Pulau Tikus, 10350 George Town, Penang",
      generalEmail: "myceliumresidence07@gmail.com",
    }
  },

  // 2. Malaysia - Johor Bahru
  MY_JB: {
    code: "MY_JB",
    countryCode: "MY",
    cityCode: "JB",
    name: "Malaysia",
    city: "Johor Bahru",
    displayName: "Johor Bahru, Johor",
    route: "/my/jb/",
    status: "active",
    locale: "en-MY",
    timeZone: "Asia/Kuala_Lumpur",
    locality: "Johor Bahru",
    region: "Johor",
    coordinates: { latitude: 1.4927, longitude: 103.7414 },
    languages: ["en", "es", "zh-CN", "ms", "ta"],
    facilityMap: facilityMapUrl,
    contentNamespace: "MY_JB",
    
    // Local News (Johor specific)
    localNews: [
      {
        id: "berita-rtm",
        name: "Berita RTM",
        description: "Public broadcast news with extensive southern regional bulletins.",
        youtubeChannelId: "UCjUxj4cyy_F0tVCT8WfmdZQ",
        newsUrl: "https://berita.rtm.gov.my/",
      }
    ],
    liveStatusUrl: "https://live-status.mycelium-community.workers.dev",
    airQuality: {
      latitude: 1.4927,
      longitude: 103.7414,
      place: "Johor Bahru, Johor",
      officialLabel: "Official Air Pollutant Index (DOE Johor)",
      officialUrl: "https://apims.doe.gov.my/",
    },
    contact: {
      generalPhone: "+60 7-223 8899",
      address: "Management Office, Jalan Skudai, 80200 Johor Bahru, Johor",
      generalEmail: "jb.management@mycelium-community.com",
    }
  },

  // 3. United States - Portland
  US_PL: {
    code: "US_PL",
    countryCode: "US",
    cityCode: "PL",
    name: "United States",
    city: "Portland",
    displayName: "Portland, United States",
    route: "/us/pl/",
    status: "active",
    locale: "en-US",
    timeZone: "America/Los_Angeles",
    locality: "Portland",
    region: "Oregon",
    coordinates: { latitude: 45.5152, longitude: -122.6784 },
    languages: ["en", "es", "zh-CN", "ms", "ta"],
    facilityMap: portlandFacilityMapUrl,
    contentNamespace: "US_PL",
    
    // Local News (Oregon specific)
    localNews: [
      {
        id: "kgw",
        name: "KGW News (Portland)",
        description: "Portland's leading NBC affiliate for Northwest local coverage.",
        youtubeChannelId: "UCKgAB8lqTbqbwXC-e6_9lhQ",
        newsUrl: "https://www.kgw.com/",
      },
      {
        id: "koin6",
        name: "KOIN 6 News (Portland)",
        description: "CBS affiliate covering Portland metro and Multnomah County.",
        youtubeChannelId: "UC-de9ZOMzlXKcAzDoI8N9gw",
        newsUrl: "https://www.koin.com/",
      },
      {
        id: "kptv-fox12",
        name: "FOX 12 Oregon (KPTV)",
        description: "Top-rated local newscasts and weather across Oregon.",
        youtubeChannelId: "UCF16pvJDEUksGYRbfnXne1A",
        newsUrl: "https://www.kptv.com/",
      }
    ],
    liveStatusUrl: "https://live-status.mycelium-community.workers.dev",
    airQuality: {
      latitude: 45.5152,
      longitude: -122.6784,
      place: "Portland, Oregon",
      officialLabel: "Official AQI readings (AirNow Oregon)",
      officialUrl: "https://www.airnow.gov/",
    },
    contact: {
      generalPhone: "+1 (234) 567-8910",
      address: "John Smith, 123 Main Street, Portland, OR 97201",
      generalEmail: "john.smith@company.com",
      securityDesk24h: "+1 (234) 567-8910",
    },
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

// ==========================================================================
// 4. DYNAMIC MERGER: Assemble Global + National + Local News per site
// ==========================================================================
Object.keys(COUNTRY_SITES).forEach(siteCode => {
  const site = COUNTRY_SITES[siteCode];
  const countryCode = site.countryCode;
  
  // Create the final liveNews array for this specific location
  site.liveNews = [
    ...GLOBAL_NEWS,
    ...(NATIONAL_NEWS[countryCode] || []),
    ...(site.localNews || [])
  ];
  
  // Clean up the temporary localNews array so it doesn't pollute the object
  delete site.localNews;
});

// ==========================================================================
// 5. HELPER FUNCTION
// ==========================================================================
export function getCountrySite(rawCode) {
  if (!rawCode) return undefined;
  const code = String(rawCode).trim().toUpperCase();

  // 1. Exact match
  if (COUNTRY_SITES[code]) return COUNTRY_SITES[code];

  // 2. Legacy fallback for single-country codes
  if (code === "MY") return COUNTRY_SITES.MY_PP;
  if (code === "US") return COUNTRY_SITES.US_PL;

  // 3. Fallback for URL paths like /my/pp
  const normalized = code.replace(/[-/]/g, "_");
  if (COUNTRY_SITES[normalized]) return COUNTRY_SITES[normalized];

  return undefined;
}
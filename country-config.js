// country-config.js
const facilityMapUrl = new URL("./img/Slide/facility_map.jpg", import.meta.url).href;
const portlandFacilityMapUrl = new URL("./img/Slide/PORTLANDfacility.png", import.meta.url).href;

// 默认定位到槟城 Pulau Tikus
export const DEFAULT_COUNTRY_CODE = "MY_PP";

export const COUNTRY_SITES = {
  // 1. 马来西亚 - 槟城 Pulau Tikus
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
    // 槟城现实高收视新闻台（全马第一 Astro AWANI + 第一收视晚间新闻 TV3 + 槟城州官方 Buletin Mutiara）
    liveNews: [
      {
        id: "astro-awani",
        name: "Astro AWANI",
        description: "Malaysia's leading 24-hour news & current affairs channel.",
        youtubeChannelId: "UC5dYmq91eUe8vVbK2xP_kDQ",
        newsUrl: "https://www.astroawani.com/",
      },
      {
        id: "buletin-tv3",
        name: "Buletin TV3",
        description: "Malaysia's most-watched television prime bulletin.",
        youtubeChannelId: "UC2p8wkJVS2eT_PstVp_O07A",
        newsUrl: "https://www.buletintv3.my/",
      },
      {
        id: "buletin-mutiara",
        name: "Buletin Mutiara (Penang)",
        description: "Official municipal & local news channel of Penang State.",
        youtubeChannelId: "UCkO4-w4aD3p-g3Z1Yn9xU9A",
        newsUrl: "https://www.buletinmutiara.com/",
      }
    ],
    liveStatusUrl: "",
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

  // 2. 马来西亚 - 柔佛新山 Johor Bahru
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
    // 柔佛新山现实高收视台（Astro AWANI + TV3 柔佛与南部专区 + 国营 Berita RTM）
    liveNews: [
      {
        id: "astro-awani-jb",
        name: "Astro AWANI",
        description: "National & southern region live breaking news.",
        youtubeChannelId: "UC5dYmq91eUe8vVbK2xP_kDQ",
        newsUrl: "https://www.astroawani.com/",
      },
      {
        id: "buletin-tv3-jb",
        name: "Buletin TV3",
        description: "Premier Malaysian news with regular Johor state reports.",
        youtubeChannelId: "UC2p8wkJVS2eT_PstVp_O07A",
        newsUrl: "https://www.buletintv3.my/",
      },
      {
        id: "berita-rtm",
        name: "Berita RTM",
        description: "Public broadcast news with extensive southern regional bulletins.",
        youtubeChannelId: "UC-Yn4L4c1S-Vl_K_aT_xWyg",
        newsUrl: "https://berita.rtm.gov.my/",
      }
    ],
    liveStatusUrl: "",
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

  // 3. 美国 - 俄勒冈州波特兰 Portland
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
    // 波特兰及西北太平洋最高收视主流电视台
    liveNews: [
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
    liveStatusUrl: "",
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

// 智能查询与兼容旧代码解析函数
export function getCountrySite(rawCode) {
  if (!rawCode) return undefined;
  const code = String(rawCode).trim().toUpperCase();

  // 1. 精确命中代码
  if (COUNTRY_SITES[code]) return COUNTRY_SITES[code];

  // 2. 兼容单一国家旧代码
  if (code === "MY") return COUNTRY_SITES.MY_PP;
  if (code === "US") return COUNTRY_SITES.US_PL;

  // 3. 兼容短路径如 /my/pp -> MY_PP
  const normalized = code.replace(/[-/]/g, "_");
  if (COUNTRY_SITES[normalized]) return COUNTRY_SITES[normalized];

  return undefined;
}
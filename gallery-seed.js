// Starter Gallery events, used (1) by the public site while Firestore has no gallery events
// for the region and (2) by Admin -> Gallery -> "Import starter events".
//
// PLACEHOLDER CONTENT: dates, titles and copy below were written from the photo file names.
// Replace them with the real events in Admin -> Gallery.
//
// `only` limits an event to one region; events without it appear in every region.
// Image paths are root-relative so they stay valid after being saved to Firestore.
// Inline photo slots (`photos`) are left empty on purpose: the story page shows labelled slots.
const IMG = "/img/gallery/";

export const GALLERY_SEED = [
  {
    slug: "sunrise-meditation-2026",
    date: "2026-09-06",
    cover: IMG + "sunrise-meditation-class.webp",
    tag_en: "Wellness",
    short_en: "Sunrise Meditation",
    title_en: "Sunrise meditation on the lawn by the water",
    lede_en: "Residents rolled out mats at first light for a quiet, guided session beside the lake.",
    body_en: [
      "The class began as the mist was still lifting from the water, with mats laid out in loose rows on the grass.",
      "Afterwards neighbours stayed to talk, and several asked for the session to become a regular morning event.",
    ],
    place_en: "Lakeside lawn",
    host_en: "Wellness Committee",
  },
  {
    slug: "botanical-crafts-2026",
    date: "2026-07-12",
    cover: IMG + "botanical-crafts-pergola.webp",
    tag_en: "Family",
    short_en: "Botanical Crafts",
    title_en: "Families press leaves and flowers under the garden pergola",
    lede_en: "Children and parents spent a warm afternoon turning fallen leaves into pressed-botanical art.",
    body_en: [
      "Long wooden tables under the pergola were laid with leaves, paper and brushes, and every age group found something to make.",
      "The finished pieces were collected into a small display for the clubhouse noticeboard.",
    ],
    place_en: "Garden pergola",
    host_en: "Residents' Committee",
  },
  {
    slug: "farmers-market-2026",
    date: "2026-05-17",
    cover: IMG + "courtyard-farmers-market.webp",
    tag_en: "Community",
    short_en: "Courtyard Market",
    title_en: "A courtyard market of produce, plants and handmade goods",
    lede_en: "Stalls lined the courtyard path, with fresh produce, flowers and crafts from neighbours.",
    body_en: [
      "Residents browsed under canvas canopies and string lights, and many came away with plants for their own balconies.",
      "Organisers said the market was a simple way for neighbours to meet the people growing and making things nearby.",
    ],
    place_en: "Central courtyard",
    host_en: "Events Committee",
  },
  {
    slug: "tree-planting-2026",
    date: "2026-03-22",
    cover: IMG + "tree-planting-morning.webp",
    tag_en: "Community",
    short_en: "Tree Planting",
    title_en: "Neighbours plant new trees along the walking path",
    lede_en: "On a bright morning, families dug, planted and watered young trees together.",
    body_en: [
      "Volunteers worked in small teams, with children helping to fill in soil and carry water to each new tree.",
      "Each sapling was staked and tagged so the community can watch it grow over the coming years.",
    ],
    place_en: "Main walking path",
    host_en: "Management Office",
  },
  {
    slug: "garden-morning-2026",
    date: "2026-01-18",
    cover: IMG + "golden-morning-garden.webp",
    tag_en: "Garden",
    short_en: "Garden Morning",
    title_en: "A golden morning in the community garden",
    lede_en: "Residents of all ages gathered at the potting tables to plant seedlings and swap gardening tips.",
    body_en: [
      "The garden tables were stocked with seedlings, small pots and seeds in jars, free for anyone to take part.",
      "Experienced gardeners shared advice with first-timers, and several families signed up for a plot.",
    ],
    place_en: "Community garden",
    host_en: "Green Living Team",
  },
  {
    slug: "lantern-garden-feast-2025",
    only: "MY",
    date: "2025-09-06",
    cover: IMG + "lantern-lit-garden-feast.webp",
    tag_en: "Festival",
    short_en: "Lantern Feast",
    title_en: "A lantern-lit garden feast for the whole community",
    lede_en: "Paper lanterns and string lights glowed over a long shared table as the sun went down.",
    body_en: [
      "Neighbours from many backgrounds brought dishes to share, laid out on banana leaves and in woven baskets.",
      "The evening ended with lanterns lit along the garden path and conversation that lasted well after dark.",
    ],
    place_en: "Clubhouse garden",
    host_en: "Events Committee",
  },
  {
    slug: "autumn-harvest-feast-2025",
    only: "US",
    date: "2025-11-27",
    cover: IMG + "autumn-harvest-feast.webp",
    tag_en: "Festival",
    short_en: "Harvest Feast",
    title_en: "An autumn harvest feast under the string lights",
    lede_en: "Residents shared a Thanksgiving-style meal outdoors as the autumn leaves turned gold.",
    body_en: [
      "Long tables were set beside the clubhouse with pumpkins, lanterns and seasonal dishes brought by neighbours.",
      "As evening came, string lights switched on and the lawn filled with families, friends and new faces.",
    ],
    place_en: "Clubhouse lawn",
    host_en: "Events Committee",
  },
  {
    slug: "golden-hour-run-2025",
    date: "2025-10-12",
    cover: IMG + "golden-hour-jogging-trail.webp",
    tag_en: "Fitness",
    short_en: "Golden Hour Run",
    title_en: "A golden-hour community run along the lakeside trail",
    lede_en: "Families and friends jogged the lakeside loop together as the sun came up over the hills.",
    body_en: [
      "Runners of every pace shared the trail, from children keeping up with parents to regular early-morning joggers.",
      "The route followed the shaded path beside the water, finishing back near the residences.",
    ],
    place_en: "Lakeside trail",
    host_en: "Wellness Committee",
  },
];

/** Starter events for one region ("MY" | "US"), newest first, without the `only` flag. */
export function getGallerySeed(countryCode = "MY") {
  const cc = String(countryCode || "MY").toUpperCase();
  return GALLERY_SEED
    .filter((event) => !event.only || event.only === cc)
    .map(({ only, ...event }) => ({ ...event, photos: [] }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
# Corner system

Source of truth: `corners.css` (loaded first in `index.html`). Geometry notes are in its header.

| Token | Visual radius | Used for |
|---|---|---|
| `--corner-xs` | 8px | list rows, chips, thumbnails (`.lp-item`, `.gfp-photo-box`, `.chat-quick-item`) |
| `--corner-sm` | 12px | inputs, close buttons, small cards, announcement modal, map info box |
| `--corner-md` | 16px | map modal, service/FAQ panels, calendar, dialogs, chat bubbles, bottom sheets |
| `--corner-lg` | 20px | feature cards, media frames (`.vi-frame`, `.gi-frame`), chatbot, dialog card |
| `--corner-xl` | 28px | large modals and forms |
| `--corner-pill` | 999px | pills, buttons |

Use `border-radius: var(--cr-*); corner-shape: var(--corner-shape);`. `--cr-*` = token x `--corner-boost`
(1.6 with native `corner-shape: superellipse(1.8)`, 1 elsewhere).

Deliberately unchanged: `50%` circles and dots, pills, radii of 6px or less (`admin/admin.css`, 1-2px bars),
`.chat-input textarea` (stadium ends), `.gi-ticket` notch polygon and its 4px left corners, inline SVG icon `rx`,
text-wipe / reveal `clip-path` animations, `.feature-modal-item` (0).

Removed as shadowed duplicates: `.chatbot` 16px (style.css), `.vi-frame` 14px, `.gfp-photo-box` 6px,
`.announcement-modal-card` from the xl group plus its `!important`, the redundant `.map-modal-header` radius
(parent clips). `.service-nav-btn` 10px became the pill it already rendered as.

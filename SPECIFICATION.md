# Coffy Lab — Technical & Content Specification

## 1. Project Overview

### 1.1 Purpose

Coffy Lab (Georgian: **ყავის ლაბი**) is a client-side coffee ordering platform where a customer:

1. Builds a fully customized coffee — type, ingredients, volume, sugar, espresso shots, temperature.
2. Customizes the takeaway cup — color, printed text, lid type, straw type — with a live SVG preview.
3. After placing an order, is offered an **optional** registration, which unlocks a **Coffee Passport** (ყავის პასპორტი): a passport-styled profile that collects a unique visa-style stamp for every order.

### 1.2 Goals

| Goal | Mechanism |
|---|---|
| Frictionless ordering | 3-step wizard, no login required, live price feedback |
| Personalization | 8 coffee types × ingredients × 10+ cup colors × free custom text |
| Loyalty / retention | Passport stamps, ranks, and a "collect all 8" mechanic |
| Zero infrastructure | Pure static site; all data lives in the visitor's browser |

### 1.3 Audience & Language

- Primary UI language: **Georgian (ka)** — informal singular register ("შეუკვეთე", "მოირგე").
- Brand name appears bilingually: ყავის ლაბი / COFFY LAB.
- All `<html>` elements declare `lang="ka"`.

### 1.4 Technology Stack

- **HTML5 / CSS3 / vanilla JavaScript (ES2020)** — no frameworks, no build step.
- **SVG** for all graphics (logo, cup preview, stamps, emblems) — generated inline or as static assets.
- **localStorage / sessionStorage** for persistence (see §2.4).
- Google Fonts: *Noto Sans Georgian* (fallbacks: Sylfaen, system-ui).
- Dev server: PowerShell `HttpListener` static server (`.claude/server.ps1`, port 8737). Any static file server works; the site also opens directly from the filesystem.

---

## 2. Site Architecture

### 2.1 Page Map

| Page | File | Purpose |
|---|---|---|
| Order (home) | `index.html` | 3-step order wizard + live cup preview + success/registration modal |
| Passport | `passport.html` | Registration teaser (guest) or passport book with stamps (member) |
| About | `about.html` | Brand story, values, how-the-passport-works, stats |
| Contact | `contact.html` | Location/hours/contacts + demo contact form |

Legacy deep link `index.html#passport` redirects to `passport.html` (handled in `js/app.js` init).

### 2.2 File Structure

```
coffee lab/
├── index.html          # order wizard page
├── passport.html       # coffee passport page
├── about.html          # about page
├── contact.html        # contact page + form
├── logo.svg            # brand mark (coffee bean in a circle)
├── SPECIFICATION.md    # this document
├── styles/
│   └── styles.css      # single shared stylesheet (design system + all pages)
└── js/
    ├── shared.js       # loaded on EVERY page, before page scripts
    ├── app.js          # index.html only (wizard, pricing, modal)
    └── passport.js     # passport.html only (passport rendering, registration)
```

### 2.3 Script Responsibilities & Load Order

Scripts are classic (non-module) scripts sharing the global scope. **`js/shared.js` must always be loaded first.**

| File | Loaded on | Provides |
|---|---|---|
| `js/shared.js` | all pages | DOM helpers (`$`, `$$`, `esc`), formatting (`GEL`, `fmtDate`, `padNo`), catalog config (coffee types, volumes, milks, syrups, extras, lids, straws, colors, ranks), storage wrapper (`store`), validated globals `user` / `orders`, `registerUser()`, stamp SVG generator (`stampSVG`), `toast()`, topbar renderer (`renderTopbarUser`), cross-tab / bfcache resync (`cl:datachanged` event) |
| `js/app.js` | index.html | Wizard state + sessionStorage persistence, pricing engine, chip/card/swatch rendering, live cup preview, order summary, `placeOrder()`, success & registration modal (focus-trapped) |
| `js/passport.js` | passport.html | `renderPassportPage()` — teaser + registration for guests, passport book (photo, fields, rank progress, collection, stamps) for members; re-renders on `cl:datachanged` |

### 2.4 Data Layer (browser storage)

| Key | Store | Shape | Notes |
|---|---|---|---|
| `cl_user` | localStorage | `{ name, email, id, since }` | `id` = passport identity; preserved on re-registration |
| `cl_orders` | localStorage | `Order[]` | one entry per placed order = one stamp |
| `cl_wizard` | sessionStorage | wizard `state` | in-progress order; survives page navigation, dies with the tab |

`Order` shape:

```json
{
  "id": "o<base36-timestamp><random>",
  "no": 4,
  "date": 1787236000000,
  "coffee": { "typeId": "mocha", "volume": "l", "shots": 2, "temp": "hot",
              "milk": "oat", "syrups": ["caramel"], "extras": ["cream"], "sugar": 2 },
  "cup": { "color": "#2b2b2e", "text": "ჩემი ყავა", "lid": "sip", "straw": "paper" },
  "total": 13.3
}
```

Robustness rules (implemented in `shared.js` / `app.js`):

- All reads are validated; malformed JSON or wrong-typed values fall back to `null` / `[]` / defaults.
- If localStorage is unavailable, an in-memory fallback is used and the UI warns the user (index + passport pages).
- `pageshow` (bfcache restore) and `storage` (other tab) events re-read data, re-render the topbar, and emit `cl:datachanged` for page scripts.
- `placeOrder()` re-reads `cl_orders` before appending, so parallel tabs don't drop orders.

### 2.5 Pricing Model

`total = base + volume + extraShots + milk + Σsyrups + Σextras + straw`

- Base prices: espresso 4 ₾ · americano 4.5 · macchiato 5 · cappuccino 6 · latte / flat white 6.5 · mocha / cold brew 7.
- Volume: 250 ml +0 · 350 ml +1 · 450 ml +1.8. Extra espresso shot +1.5 each.
- Plant milks +0.8–1; syrups +0.8 each; extras +0.3–1; paper straw +0.2, bamboo +0.5.
- Cup text personalization is free (marketing decision).
- Prices are display-formatted through `GEL()` (trailing zeros trimmed, `₾` suffix).

### 2.6 Passport Mechanics

- **One order → one stamp.** Stamp artwork is deterministic: shape + ink color come from the coffee type (8 distinct shape/ink pairs: circle, hexagon, rosette, oval, square, shield, diamond, octagon), rotation comes from a seeded hash of the order id, and the stamp face shows type name (curved), bean icon, volume, date, and order №.
- **Ranks** by stamp count: 0 ახალბედა → 1 დამწყები დეგუსტატორი → 3 ყავის მოყვარული → 5 ბარისტას მეგობარი → 10 ყავის მცოდნე → 20 ყავის ლეგენდა. A progress bar shows distance to the next rank.
- **Collection grid**: 8 coffee types; trying a type unlocks its tile.
- Passport № is derived deterministically from the user id (`CL-XXXXXX`); issue date = registration date.
- Guest orders are kept and convert to stamps retroactively upon registration.

---

## 3. Content & UI/UX Layout

### 3.1 Design System

**Colors (CSS custom properties, `:root` in `styles/styles.css`):**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f6f1e7` | page background (warm cream) |
| `--card` | `#fffdf8` | card surfaces |
| `--ink` | `#2f2118` | primary text |
| `--muted` | `#7d6b5c` | secondary text |
| `--accent` / `--accent-dark` | `#8a5a34` / `#6e4526` | brand brown, primary buttons |
| `--accent-2` | `#c98d4b` | hover/focus accents |
| `--line` | `#e7dccb` | borders |
| `--gold` | `#d4af37` | passport/premium accents |
| `--paper` | `#f7f0dd` | passport page paper |

**Typography:** Noto Sans Georgian 400/600/700/800. Headings 800; UI labels 600–700; body 13.5–14 px, line-height ≥ 1.6.

**Shape language:** 12–20 px radii, pill-shaped chips/nav, soft shadows (`--shadow`), dashed dividers for receipts/passport.

### 3.2 Global Layout

- Sticky topbar on every page: logo (`logo.svg`) + bilingual brand → nav pills (შეკვეთა · პასპორტი [+stamp-count badge] · ჩვენს შესახებ · კონტაქტი) → user chip (avatar initials + name; appears on **all** pages when registered; opens the passport).
- Content max-width 1180 px (text pages constrained to 860 px via `.page-narrow`).
- Footer: single centered line.

### 3.3 Page Layouts

**Order page (`index.html`):** step indicator (1 ყავა · 2 ჭიქა · 3 შეჯამება; completed steps clickable) → two-column layout: wizard panel left, sticky sidebar right (live SVG cup preview + itemized price). Step 1: coffee type cards, volume/shots/temperature chips, milk (single-select), syrups & extras (multi-select), sugar slider (0–5, "შაქრის გარეშე" at 0). Step 2: color swatches + free color picker, cup text input (18 chars, live counter), lid & straw chips. Step 3: full order summary tables + price breakdown + place-order button. The cup preview reflects everything live: cup color, contrast-computed text color, lid/dome/sip-hole, straw type, steam (hot & open cup), ice cubes (cold & ice extra & open cup).

**Success modal:** confirmation + order № + ETA; for members an animated stamp "pressed" into view with a link to the passport; for guests a grayscale ghost stamp + inline registration form (name required, email optional) + "გამოტოვება". Modal is focus-trapped; Escape is guarded against discarding a half-filled form.

**Passport page:** guest → closed passport cover + registration card (+ note listing existing guest orders that will convert). Member → open passport spread: left page (emblem, initials "photo", name, №, issue date, rank, stats, rank progress, 8-tile collection), right page (stamps grid, newest first).

**About page:** hero → story → 4 value cards → 3 "how it works" steps → stats row → CTA to order.

**Contact page:** hero → two columns: info card (address, phone, email, hours table, social placeholders) and form card.

### 3.4 Interaction & Accessibility Guidelines

- All selectable options are real `<button>`s with `aria-pressed`; focus is restored after re-render; visible `:focus-visible` outline everywhere (buttons, links, inputs, `[tabindex]`).
- Step indicator items and the user chip are keyboard-operable (`role`, `tabindex`, Enter/Space).
- Modal: `role="dialog"`, `aria-modal`, focus moved in on open, restored to a *visible* element on close, Tab cycles inside.
- Color contrast: AA-checked (chip sub-labels were tuned to ≥ 4.5:1); cup preview text color auto-switches via YIQ.
- Responsive breakpoints: 920 px (sidebar stacks, passport book stacks), 760 px (contact grid stacks), 560 px (compact topbar; nav becomes a single horizontally scrollable row; hidden scrollbar). No horizontal page scroll down to 320 px.
- User-generated text (name, cup text, form fields) is always escaped (`esc()`) or set via `textContent` before reaching the DOM/SVG.

### 3.5 Content Tone

- Friendly, informal, second-person singular Georgian; light emoji use in UI labels.
- Terminology is fixed project-wide: **ჭიქა** (takeaway cup), **საწრუპი** (straw), **ბეჭედი** (stamp), **წოდება** (rank). English is used only for the brand line (COFFY LAB) and passport captions.

---

## 4. Contact Form Specification

### 4.1 Fields

| Field | id | Type | Constraints |
|---|---|---|---|
| სახელი (name) | `cfName` | text | required, ≤ 60 chars |
| ელფოსტა (email) | `cfEmail` | email | required, ≤ 80 chars, native email validation |
| შეტყობინება (message) | `cfMsg` | textarea | required, ≤ 600 chars, vertical resize only |

### 4.2 Behavior (current — demo mode)

1. Native HTML5 validation blocks submission until all required fields are valid.
2. On submit: `preventDefault()` → toast «მადლობა! შეტყობინება მიღებულია 💌 (დემო)» → form reset.
3. **Nothing is transmitted or stored.** A visible note under the form states this explicitly.
4. Labels are programmatically bound (`for`/`id`); the toast has `role="status"` for screen readers.

### 4.3 Future Backend Contract (when a server is added)

- `POST /api/contact` with JSON `{ name, email, message }`; server re-validates lengths/format, rate-limits per IP, and returns `201` or a field-keyed error object.
- On success keep the current toast (drop the "(დემო)" suffix); on failure show an inline error above the submit button without clearing user input.
- Add a honeypot field and/or token-based spam protection before going live.

---

## 5. Technical Guidelines

### 5.1 Coding Conventions

- Vanilla ES2020; `'use strict'` in every file; no external JS dependencies.
- Shared code lives only in `js/shared.js`; page scripts must not duplicate config or helpers.
- CSS: single stylesheet, custom-property tokens, section header comments (`/* ==== */`), mobile handled via `max-width` media queries at 920/760/560 px.
- All user-facing strings in Georgian; keep the informal register consistent.
- Escape **every** interpolated value in HTML/SVG template literals with `esc()`.

### 5.2 Security

- XSS: no `innerHTML` with unescaped user input anywhere; prefer `textContent` for plain text sinks.
- No secrets, no cookies, no network calls with user data (fonts are the only external request).
- SVG `defs` ids are made context-unique to avoid cross-instance reference collisions.

### 5.3 Performance

- No build step; three small JS files and one stylesheet; total page weight dominated by the webfont.
- All imagery is SVG (crisp at any DPI, ~zero bytes).
- Re-renders are scoped (chips/preview/price re-render independently; full-page re-render only on the passport).

### 5.4 Browser Support

- Evergreen Chrome / Edge / Firefox / Safari ≥ 14 (ES2020: optional chaining, nullish coalescing).
- Graceful degradation: blocked localStorage → in-memory session with a visible warning; bfcache and multi-tab drift handled via `pageshow` / `storage` events.

### 5.5 Running & Deploying

- **Local:** double-click any `.html`, or serve the folder (`.claude/server.ps1` → http://localhost:8737).
- **Deploy:** copy the folder to any static host (GitHub Pages, Netlify, nginx). No server code required. Keep the relative layout (`styles/`, `js/`, `logo.svg` beside the HTML files).

### 5.6 Roadmap Candidates (not implemented)

- Order history page; stamp "pressing" sound/animation on the passport itself; passport export to PDF/PNG.
- Real backend: accounts, order API, contact form delivery (see §4.3).
- PWA manifest + offline caching; dark theme; i18n beyond Georgian.

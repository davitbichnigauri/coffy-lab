<p align="center">
  <img src="logo.svg" width="72" alt="Coffy Lab logo">
</p>

<h1 align="center">ყავის ლაბი · Coffy Lab</h1>

<p align="center">
  A coffee-ordering platform with a collectible <b>Coffee Passport</b> — build your perfect coffee,
  customize the cup, and earn a unique visa-style stamp for every order.<br>
  <i>UI language: Georgian (ka)</i>
</p>

---

## ✨ Features

- **3-step order wizard** — pick one of 8 coffee types, then ingredients (milk, syrups, extras), volume, espresso shots, temperature, and sugar, with a live itemized price.
- **Cup customization** — 10 preset colors + free color picker, free printed text (live contrast-aware preview), lid type, and paper/bamboo straw. The SVG cup preview updates live: steam for hot open cups, ice cubes for cold ones.
- **Coffee Passport** — optional registration after checkout unlocks a passport-styled profile. Every order presses a deterministic, per-type stamp (8 shapes × 8 ink colors, with date, volume, and order №). Collect all 8 types, climb 5 ranks from *დამწყები დეგუსტატორი* to *ყავის ლეგენდა*.
- **Zero backend** — everything runs in the browser; data persists in `localStorage`, and an in-progress order survives page navigation via `sessionStorage`.

## 🚀 Getting Started

No build step and no dependencies. Either:

- **Open directly:** double-click `index.html`, or
- **Serve the folder** with any static file server, e.g.:

```bash
python -m http.server 8737
```

then open http://localhost:8737. (A ready-made PowerShell dev server also ships in `.claude/server.ps1`.)

## 📁 Project Structure

```
├── index.html          # order wizard (home)
├── passport.html       # coffee passport
├── about.html          # about the brand
├── contact.html        # contacts + demo form
├── logo.svg            # brand mark
├── styles/
│   └── styles.css      # single shared stylesheet
├── js/
│   ├── shared.js       # config, storage, stamps, topbar — loaded on every page first
│   ├── app.js          # order wizard logic (index only)
│   └── passport.js     # passport rendering (passport only)
└── SPECIFICATION.md    # full technical & content specification
```

## 🛠 Tech Stack

Vanilla **HTML5 / CSS3 / JavaScript (ES2020)** · **SVG** graphics throughout · Google Fonts (*Noto Sans Georgian*) · browser storage for persistence. Supported in all evergreen browsers (Safari ≥ 14).

## 🔒 Privacy

All data (profile, orders, stamps) lives only in the visitor's browser — nothing is sent to any server. The contact form is a demo and transmits nothing.

## 📖 Documentation

See [SPECIFICATION.md](SPECIFICATION.md) for the complete technical and content specification: architecture, storage schema, pricing model, passport mechanics, design system, accessibility guidelines, and the future contact-form backend contract.

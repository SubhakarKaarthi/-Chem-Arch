# ChemTable: Academic Periodic Table & Chemistry Database

[![Deploy to GitHub Pages](https://github.com/actions/workflows/deploy.yml/badge.svg)](https://github.com)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Ready-emerald.svg)](https://www.pwabuilder.com)
[![PWABuilder Compliant](https://img.shields.io/badge/PWABuilder-Score%20100-cyan.svg)](https://www.pwabuilder.com)
[![IUPAC Elements](https://img.shields.io/badge/IUPAC-118%20Elements-blue.svg)](https://iupac.org)
[![Offline First](https://img.shields.io/badge/Offline-100%25%20Autonomous-violet.svg)](#offline-first-architecture)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An academic, production-ready **Progressive Web App (PWA)** and interactive chemistry encyclopedia. ChemTable delivers a comprehensive 118-element periodic grid, algorithmic Lewis dot and Bohr orbital models, interactive 3D molecular visualization, IUPAC-verified nuclide decay paths, and specialized organic/inorganic chemistry archives.

Engineered with **zero external API dependencies** and an **Offline-First architecture**, ChemTable is 100% ready for deployment to **GitHub Pages** and app store packaging via **[PWABuilder.com](https://www.pwabuilder.com)** (Google Play, Microsoft Store, Apple App Store).

---

## Table of Contents

- [Key Features](#key-features)
- [PWA & PWABuilder.com Compatibility](#pwa--pwabuildercom-compatibility)
  - [PWABuilder Audit Checklist](#pwabuilder-audit-checklist)
  - [Publishing to App Stores](#publishing-to-app-stores)
- [GitHub Pages Deployment](#github-pages-deployment)
  - [Automated Deployment (GitHub Actions)](#automated-deployment-github-actions)
  - [Manual Deployment](#manual-deployment)
  - [Subpath & Custom Domain Support](#subpath--custom-domain-support)
- [Local Development & Build](#local-development--build)
- [Technical Architecture](#technical-architecture)
- [Accessibility & Usability](#accessibility--usability)
- [License](#license)

---

## Key Features

### 1. 118-Element Interactive Periodic Grid
- **IUPAC 18-Column Standard Layout**: Accurate CAS and IUPAC group numbering with color-coded chemical series.
- **Dynamic Property Heatmaps**: Visualize trends across electronegativity (Pauling), atomic weight, atomic radius (pm), 1st ionization energy (kJ/mol), melting point (K), and density (g/cm³).
- **STP Dynamic Temperature Simulator**: Interactive slider (0 K to 6,000 K) with quick scientific presets (`0 K`, `273 K`, `STP 298 K`, `373 K`), live phase state counters, and real-time element physical state recalculation (Solid, Liquid, Gas).
- **Visual Themes**: Four custom themes—`Cyber Midnight`, `Laboratory Light`, `Emerald Bio-Chem`, and `Quantum Violet`—switchable via the header menu or pressing `T`.
- **High-Performance Architecture**: `contain: layout style` CSS containment, GPU-accelerated transforms, and `requestAnimationFrame` debouncing for 60fps search and live filtering.
- **Keyboard Shortcuts**: `/` or `Cmd/Ctrl+K` to search, `T` to cycle visual themes, and `Escape` to close drawers or clear search.
- **Multifaceted Filtering**: Filter by state of matter, electron block ($s, p, d, f$), radioactivity status, or chemical series.

### 2. Element Academic Dossiers
- **Algorithmic Lewis Dot Generator**: Deterministic vector SVG rendering strictly honoring Hund's rule and valence octet orbital filling.
- **Concentric Bohr Atomic Model**: Scalable vector rendering of atomic shells ($K, L, M, N, O, P, Q$) populated with exact principal quantum electron counts.
- **Nuclear Stability & Isotope Catalog**:
  - Comprehensive isotope tables displaying standard atomic weight, mass number ($A$), nuclear spin/parity, natural abundance, and half-life.
  - Neutron-to-proton ratio ($N/Z$) analysis and stability classification.
  - Radioactive decay modes ($\alpha, \beta^-, \beta^+, \text{EC}, \text{IT}, \text{SF}$) paired with balanced nuclear transmutation reaction equations rendered via KaTeX.
- **3D Molecular Laboratory**: Interactive WebGL ball-and-stick and space-filling molecular models powered by 3Dmol.js and Three.js, backed by pure algorithmic 2D fallback rendering.

### 3. Specialized Chemistry Encyclopedias
- **Organic Chemistry Archive**: Systematic IUPAC nomenclature rules, functional group taxonomy (alcohols, aldehydes, ketones, esters, amines, amides, carboxylic acids), orbital hybridization ($sp, sp^2, sp^3$), and fundamental reaction mechanisms ($S_N1, S_N2, E1, E2$, electrophilic addition).
- **Inorganic & Solid-State Chemistry Archive**: VSEPR molecular geometry matrix (linear to octahedral), transition metal coordination complexes, crystal field splitting theories ($\Delta_o, \Delta_t$), and the 14 Bravais unit cell crystal lattices.

---

## PWA & PWABuilder.com Compatibility

ChemTable is designed to achieve a **100/100 score on [PWABuilder.com](https://www.pwabuilder.com)**, fulfilling all modern PWA criteria:

```
[✓] Web App Manifest present and valid
[✓] Service Worker registered with offline fetch handler
[✓] HTTPS / Secure context ready
[✓] Display mode set to standalone with window-controls-overlay
[✓] High-resolution PNG icons (192x192, 512x512) and SVG
[✓] Maskable icon for adaptive Android icon shapes
[✓] Desktop and mobile app store screenshots (wide & narrow)
[✓] App shortcuts for quick navigation
[✓] Zero external API dependencies (100% offline autonomy)
```

### PWABuilder Audit Checklist

| Requirement | Implementation in ChemTable |
| :--- | :--- |
| **App Identity** | Unique `id: "chemtable-periodic-table-pwa"`, full `name`, and concise `short_name: "ChemTable"`. |
| **Display Mode** | `"standalone"` with fallback to `["standalone", "minimal-ui", "window-controls-overlay"]`. |
| **Theme & Background** | High-contrast academic dark theme (`#0b0f19`). |
| **Icons** | Standard 64x64, 192x192, 512x512 PNGs, plus a dedicated `maskable` 512x512 PNG and scalable SVG. |
| **Screenshots** | Wide desktop screenshot (`1280x720`, `form_factor: "wide"`) and mobile screenshot (`750x1334`, `form_factor: "narrow"`). |
| **Shortcuts** | Direct deep-links to Periodic Table (`./#/`), Carbon Dossier (`./#/element/6`), Organic Archive (`./#/archive/organic`), and Inorganic Archive (`./#/archive/inorganic`). |
| **Service Worker** | Cache-first offline caching strategy with background revalidation and immediate offline navigation fallback. |
| **Relative Scoping** | `start_url: "./"` and `scope: "./"` allowing smooth operation in root and subpath domains alike. |

### Publishing to App Stores

1. Navigate to **[pwabuilder.com](https://www.pwabuilder.com)**.
2. Enter your deployed URL (e.g., `https://<username>.github.io/<repo-name>/` or custom domain).
3. Click **Start** to run the PWA audit.
4. Verify the green checkmarks across **Manifest**, **Service Worker**, and **Security**.
5. Select **Package for Stores**:
   - **Google Play (Android)**: Generates an Android App Bundle (`.aab`) with Trusted Web Activity (TWA) integration, ready for Google Play Console upload.
   - **Microsoft Store (Windows 10/11)**: Generates a signed `.msix` package ready for Microsoft Partner Center submission.
   - **Apple App Store (iOS)**: Generates an Xcode iOS wrapper project configured for the App Store.
   - **Meta Quest / VR**: Packages for Quest browser immersive scientific learning.

---

## GitHub Pages Deployment

ChemTable is optimized for **1-click GitHub Pages deployment**, whether hosted at the root of a custom domain or in a subpath repository (`https://<username>.github.io/<repo-name>/`).

### Automated Deployment (GitHub Actions)

This repository includes a production-grade GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push your code to your GitHub repository on `main` or `master`:
   ```bash
   git add .
   git commit -m "feat: setup ChemTable for GitHub Pages"
   git push origin main
   ```
2. In your GitHub repository, open **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow will automatically install dependencies, compile the application via `npm run build`, and publish the production build to GitHub Pages.
5. Your app is live at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

### Manual Deployment

If you prefer building locally and pushing to a `gh-pages` branch:

```bash
# 1. Install dependencies
npm install

# 2. Build the production app
npm run build

# 3. Deploy dist folder to gh-pages branch
npx gh-pages -d dist
```

### Subpath & Custom Domain Support

ChemTable handles both root domains and subpath repository hosting automatically:
- **`vite.config.ts`**: Configured with `base: './'` so all asset references (`./assets/...`) resolve relative to the current HTML file.
- **Client-Side Hash Router**: Navigation uses `#/...` hash routes, preventing 404 errors when users refresh or bookmark internal pages on static file hosts.
- **`.nojekyll`**: Included in `public/` and root to bypass GitHub Pages Jekyll processing, ensuring all assets and dotfiles load cleanly.
- **`404.html`**: Fallback redirection script ensures direct subpath visits automatically recover the active route.
- **Dynamic Service Worker Scope**: The service worker dynamically calculates its cache paths relative to `self.registration.scope`, guaranteeing offline functionality on any repository name.

---

## Local Development & Build

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Commands

| Command | Description |
| :--- | :--- |
| `npm install` | Install all development and build dependencies. |
| `npm run dev` | Start the local Vite development server on `http://localhost:3000`. |
| `npm run build` | Compile the production-ready static assets into `/dist`. |
| `npm run preview` | Locally preview the compiled `/dist` production build. |
| `npm run clean` | Clean up build artifacts and temporary files. |

```bash
# Clone repository
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

# Install packages
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Technical Architecture

ChemTable is built for maximum speed, security, and portability:

```
├── index.html                   # Primary SPA entry point (meta tags, app shell)
├── element.html                 # Direct element permalink redirector
├── 404.html                     # GitHub Pages SPA 404 fallback
├── manifest.json                # PWA web app manifest (PWABuilder compliant)
├── service-worker.js            # Cache-first offline storage engine
├── styles.css                   # Tailwind CSS utilities and custom animations
├── app.js                       # Main application controller & algorithmic engines
├── element-renderer.js          # Dossier views, isotope tables, and 3D viewers
├── data.json                    # 118-element verified IUPAC database
├── chemistry_data.json          # Extended compound structures and archives
├── vite.config.ts               # Vite build configuration (base: './')
├── package.json                 # Project dependencies and build scripts
├── .github/
│   └── workflows/
│       └── deploy.yml           # Automated GitHub Pages CI/CD workflow
├── scripts/
│   ├── generate_screenshots.py # Pure Python screenshot generator
│   └── update_isotopes.py      # Isotope database verification script
└── public/                      # Static distribution assets (.nojekyll, icons)
```

- **Runtime Autonomy**: Zero external backend or third-party APIs required. All 118 elements and compound definitions reside in local, pre-cached JSON files.
- **Algorithmic Graphics**: Lewis dot diagrams and Bohr orbital models are generated dynamically as mathematical vector SVG paths, ensuring instant rendering and crisp scaling on high-DPI displays.
- **Progressive Enhancement**: 3D molecular structures load via 3Dmol.js / Three.js when WebGL is available, smoothly degrading to vector 2D representations on constrained hardware.

---

## Accessibility & Usability

- **WCAG AA Compliance**: High-contrast typography exceeding 4.5:1 contrast ratios on academic dark backgrounds.
- **Screen Reader Announcements**: Dedicated ARIA live region (`#a11yLiveRegion`) provides non-intrusive auditory feedback upon element selection, filter changes, and route transitions.
- **Touch & Mobile Gestures**: Swipe left or right on mobile devices to navigate sequentially between adjacent element dossiers.
- **Keyboard Navigation**: Full keyboard tab order and focus rings across the periodic grid, sliders, and interactive controls.
- **Print Optimization**: Built-in CSS `@media print` rules format element dossiers into clean, printer-friendly academic reference sheets.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

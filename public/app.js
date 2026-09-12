/**
 * ChemTable: Academic IUPAC Periodic Table & Chemistry Database
 * Offline-First Single Page Application (SPA) Controller & Algorithmic Engines
 */

'use strict';

/**
 * Algorithmically generates an SVG Lewis Dot Structure.
 * Accurately places 1 to 8 valence electron dots around the chemical symbol (North, East, South, West)
 * according to Hund's rule / Gilbert N. Lewis octet conventions.
 * 
 * @param {number|object} valenceElectrons - Integer from 1 to 8, or an Element data object
 * @param {string} [symbol] - Chemical symbol (e.g. 'C', 'Na', 'Cl')
 * @returns {string} Pure SVG markup string
 */
export function drawLewisDot(valenceElectrons, symbol) {
  // Support element object as single parameter
  if (typeof valenceElectrons === 'object' && valenceElectrons !== null) {
    const el = valenceElectrons;
    symbol = el.symbol || 'X';
    if (Array.isArray(el.electron_shells) && el.electron_shells.length > 0) {
      valenceElectrons = el.electron_shells[el.electron_shells.length - 1];
    } else if (el.group) {
      valenceElectrons = el.group <= 2 ? el.group : (el.group >= 13 && el.group <= 18 ? el.group - 10 : 2);
    } else {
      valenceElectrons = 1;
    }
  }

  symbol = symbol || 'X';
  const v = Math.max(0, Math.min(8, parseInt(valenceElectrons, 10) || 0));

  // Determine dot distribution based on Hund's rule:
  // Singles first on distinct quadrants: North (1), East (2), South (3), West (4)
  // Then pairs: North (5), East (6), South (7), West (8)
  const north = v >= 5 ? 2 : (v >= 1 ? 1 : 0);
  const east  = v >= 6 ? 2 : (v >= 2 ? 1 : 0);
  const south = v >= 7 ? 2 : (v >= 3 ? 1 : 0);
  const west  = v >= 8 ? 2 : (v >= 4 ? 1 : 0);

  const cx = 100;
  const cy = 100;
  const r = 5.5;          // Dot radius
  const offset = 42;      // Distance from center
  const pairSep = 11;     // Half-distance between paired electrons

  const dots = [];
  const addDot = (x, y, label) => {
    dots.push(`
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" filter="url(#lewisGlow)">
        <title>${label}</title>
      </circle>
    `);
  };

  // North quadrant
  if (north === 1) {
    addDot(cx, cy - offset, 'North electron 1');
  } else if (north === 2) {
    addDot(cx - pairSep, cy - offset, 'North electron pair (1)');
    addDot(cx + pairSep, cy - offset, 'North electron pair (2)');
  }

  // East quadrant
  if (east === 1) {
    addDot(cx + offset, cy, 'East electron 1');
  } else if (east === 2) {
    addDot(cx + offset, cy - pairSep, 'East electron pair (1)');
    addDot(cx + offset, cy + pairSep, 'East electron pair (2)');
  }

  // South quadrant
  if (south === 1) {
    addDot(cx, cy + offset, 'South electron 1');
  } else if (south === 2) {
    addDot(cx - pairSep, cy + offset, 'South electron pair (1)');
    addDot(cx + pairSep, cy + offset, 'South electron pair (2)');
  }

  // West quadrant
  if (west === 1) {
    addDot(cx - offset, cy, 'West electron 1');
  } else if (west === 2) {
    addDot(cx - offset, cy - pairSep, 'West electron pair (1)');
    addDot(cx - offset, cy + pairSep, 'West electron pair (2)');
  }

  return `
    <svg viewBox="0 0 200 200" width="100%" height="100%" class="lewis-svg select-none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lewis Dot Diagram for ${symbol} with ${v} valence electrons">
      <defs>
        <filter id="lewisGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="lewisGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0c1a33" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#070a12" stop-opacity="0.3"/>
        </radialGradient>
      </defs>
      <!-- Circular Ambient Field -->
      <circle cx="100" cy="100" r="92" fill="url(#lewisGrad)" stroke="#1e293b" stroke-width="1.2" />
      
      <!-- Central Chemical Symbol -->
      <text x="100" y="114" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="44" font-weight="800" fill="#f8fafc" letter-spacing="-0.03em">${symbol}</text>
      
      <!-- Algorithmic Lewis Valence Dots -->
      ${dots.join('\n')}
    </svg>
  `.trim();
}

/**
 * Algorithmically generates an SVG Bohr Planetary Model.
 * Renders concentric orbital circles for the principal quantum shells (K, L, M, N, O, P, Q)
 * and places exact electron dots along each ring based on the expanded configuration.
 * 
 * @param {Array<number>|string|object} electronConfiguration - Array e.g. [2, 8, 1], string, or Element data object
 * @param {string} [symbol] - Chemical symbol
 * @returns {string} Pure SVG markup string
 */
export function drawBohrModel(electronConfiguration, symbol) {
  let atomicNumber = 0;
  if (typeof electronConfiguration === 'object' && electronConfiguration !== null && !Array.isArray(electronConfiguration)) {
    const el = electronConfiguration;
    symbol = el.symbol || 'X';
    atomicNumber = el.atomic_number || 0;
    electronConfiguration = el.electron_shells || el.electron_configuration_expanded;
  }

  symbol = symbol || 'X';

  let shells = [];
  if (Array.isArray(electronConfiguration)) {
    shells = electronConfiguration.map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n > 0);
  } else if (typeof electronConfiguration === 'string') {
    const nums = electronConfiguration.match(/\d+/g);
    if (nums) shells = nums.map(n => parseInt(n, 10));
  }

  if (shells.length === 0) {
    shells = [1];
  }

  const shellLetters = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
  const cx = 240;
  const cy = 240;
  const numShells = shells.length;

  const minRadius = 54;
  const maxRadius = 216;
  const radiusStep = numShells > 1 ? (maxRadius - minRadius) / (numShells - 1) : 0;

  const ringsSvg = [];
  const electronsSvg = [];

  shells.forEach((count, i) => {
    const r = numShells === 1 ? 115 : minRadius + (i * radiusStep);
    const shellLetter = shellLetters[i] || `n=${i + 1}`;

    // Concentric orbit line
    ringsSvg.push(`
      <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="#334155" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.85" />
      <text x="${(cx + r + 4).toFixed(1)}" y="${(cy - 4).toFixed(1)}" font-family="'JetBrains Mono', monospace" font-size="9" fill="#64748b" font-weight="600">${shellLetter} (${count}e⁻)</text>
    `);

    // Angular placement of electrons on this shell ring
    const phaseOffset = (i * 0.35); // Gentle phase twist so orbits don't align statically
    for (let e = 0; e < count; e++) {
      const angle = ((2 * Math.PI * e) / count) - (Math.PI / 2) + phaseOffset;
      const ex = cx + r * Math.cos(angle);
      const ey = cy + r * Math.sin(angle);

      electronsSvg.push(`
        <circle cx="${ex.toFixed(2)}" cy="${ey.toFixed(2)}" r="4.5" fill="#22d3ee" stroke="#0891b2" stroke-width="1.2" filter="url(#bohrGlow)">
          <title>Shell ${shellLetter} (n=${i + 1}): Electron ${e + 1} of ${count}</title>
        </circle>
      `);
    }
  });

  return `
    <svg viewBox="0 0 480 480" width="100%" height="100%" class="bohr-svg select-none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bohr Model for ${symbol} with shells ${shells.join(', ')}">
      <defs>
        <filter id="bohrGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="nucGrad" cx="38%" cy="38%" r="62%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="65%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
      
      <!-- Concentric Orbital Shells -->
      ${ringsSvg.join('\n')}
      
      <!-- Central Atomic Nucleus -->
      <circle cx="${cx}" cy="${cy}" r="32" fill="url(#nucGrad)" stroke="#38bdf8" stroke-width="2" filter="url(#bohrGlow)"/>
      <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="21" font-weight="800" fill="#ffffff">${symbol}</text>
      ${atomicNumber ? `<text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" fill="#bae6fd">Z=${atomicNumber}</text>` : ''}
      
      <!-- Electron Dots in Orbits -->
      ${electronsSvg.join('\n')}
    </svg>
  `.trim();
}

/**
 * Main ChemTable SPA Application Controller
 */
class PeriodicTableApp {
  constructor() {
    this.elements = [];
    this.elementsBySymbol = new Map();
    this.elementsByNumber = new Map();

    this.state = {
      searchQuery: '',
      stateFilter: 'all',
      blockFilter: 'all',
      seriesFilter: 'all',
      radioactiveOnly: false,
      heatmapProperty: 'none',
      currentTempK: 298.15,
      selectedElement: null,
      deferredInstallPrompt: null,
    };

    this.categories = {
      'alkali-metal': { name: 'Alkali Metal', color: '#ef4444', count: 0 },
      'alkaline-earth': { name: 'Alkaline Earth', color: '#f97316', count: 0 },
      'transition-metal': { name: 'Transition Metal', color: '#eab308', count: 0 },
      'post-transition-metal': { name: 'Post-Transition Metal', color: '#10b981', count: 0 },
      'metalloid': { name: 'Metalloid', color: '#06b6d4', count: 0 },
      'reactive-nonmetal': { name: 'Reactive Nonmetal', color: '#3b82f6', count: 0 },
      'noble-gas': { name: 'Noble Gas', color: '#a855f7', count: 0 },
      'lanthanide': { name: 'Lanthanide', color: '#ec4899', count: 0 },
      'actinide': { name: 'Actinide', color: '#f43f5e', count: 0 },
      'unknown': { name: 'Unknown Series', color: '#64748b', count: 0 },
    };

    this.currentViewer3D = null;
    this.currentTheme = 'cyber';
    try {
      this.currentTheme = localStorage.getItem('chemtable-theme') || 'cyber';
    } catch (e) {
      this.currentTheme = 'cyber';
    }
    this.themes = ['cyber', 'light', 'emerald', 'quantum'];
    this.themeMeta = {
      cyber: { icon: '🌌', label: 'Cyber', title: 'Cyber Midnight' },
      light: { icon: '☀️', label: 'Laboratory', title: 'Laboratory Light' },
      emerald: { icon: '🌿', label: 'Emerald', title: 'Emerald Bio-Chem' },
      quantum: { icon: '⚛️', label: 'Quantum', title: 'Quantum Violet' }
    };
    this.filterRafId = null;
    this.toastTimeout = null;

    this.init();
  }

  /**
   * Accessible live announcement for assistive technologies
   */
  announceA11y(message) {
    const region = document.getElementById('a11yLiveRegion');
    if (region) {
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 50);
    }
  }

  /**
   * Non-intrusive floating HUD toast message
   */
  showToast(message, icon = '⚡') {
    const toast = document.getElementById('hudToast');
    const toastMsg = document.getElementById('hudToastMessage');
    const toastIcon = document.getElementById('hudToastIcon');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    if (toastIcon) toastIcon.textContent = icon;
    toast.classList.add('visible');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 1500);
  }

  /**
   * Color theme initializer and switcher
   */
  initTheme() {
    this.setTheme(this.currentTheme, false);
    this.setupThemeEventListeners();
  }

  setTheme(themeName, announce = true) {
    if (!this.themes.includes(themeName)) themeName = 'cyber';
    this.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    document.body.setAttribute('data-theme', themeName);

    // Update Theme toggle button label & icon
    const meta = this.themeMeta[themeName] || this.themeMeta['cyber'];
    const btnIcon = document.getElementById('themeBtnIcon');
    const btnLabel = document.getElementById('themeBtnLabel');
    if (btnIcon) btnIcon.textContent = meta.icon;
    if (btnLabel) btnLabel.textContent = meta.label;

    // Update checkmark state in dropdown menu
    document.querySelectorAll('.theme-select-opt').forEach(opt => {
      const isCurrent = opt.dataset.themeVal === themeName;
      const check = opt.querySelector('.theme-check-icon');
      if (check) check.classList.toggle('hidden', !isCurrent);
      if (isCurrent) {
        opt.classList.add('bg-slate-800/80');
      } else {
        opt.classList.remove('bg-slate-800/80');
      }
    });

    try {
      localStorage.setItem('chemtable-theme', themeName);
    } catch (e) {
      // Storage might be restricted in some environments
    }

    if (announce) {
      this.showToast(`Theme: ${meta.title}`, meta.icon);
      this.announceA11y(`Theme switched to ${meta.title}`);
    }
  }

  setupThemeEventListeners() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeMenu = document.getElementById('themeMenu');
    const dropdownWrap = document.getElementById('themeDropdownWrap');

    if (themeBtn && themeMenu) {
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeMenu.classList.toggle('hidden');
      });

      document.querySelectorAll('.theme-select-opt').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = opt.dataset.themeVal;
          if (val) this.setTheme(val, true);
          themeMenu.classList.add('hidden');
        });
      });

      document.addEventListener('click', (e) => {
        if (dropdownWrap && !dropdownWrap.contains(e.target)) {
          themeMenu.classList.add('hidden');
        }
      });
    }
  }

  async init() {
    this.initTheme();
    this.setupPWA();
    this.setupEventListeners();
    await this.loadData();
    this.renderGroupHeaders();
    this.renderLegend();
    this.renderGrid();
    this.applyFilters();

    // Default inspector preview
    const defaultEl = this.elementsBySymbol.get('C') || this.elements[0];
    if (defaultEl) {
      this.updateInspector(defaultEl);
    }

    // Set up client-side Hash Router
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  getIUPACCoord(z) {
    if (z === 1) return { col: 1, row: 1 };
    if (z === 2) return { col: 18, row: 1 };
    if (z >= 3 && z <= 4) return { col: z - 2, row: 2 };
    if (z >= 5 && z <= 10) return { col: z + 8, row: 2 };
    if (z >= 11 && z <= 12) return { col: z - 10, row: 3 };
    if (z >= 13 && z <= 18) return { col: z, row: 3 };
    if (z >= 19 && z <= 36) return { col: z - 18, row: 4 };
    if (z >= 37 && z <= 54) return { col: z - 36, row: 5 };
    if (z >= 55 && z <= 56) return { col: z - 54, row: 6 };
    if (z >= 57 && z <= 71) return { col: (z - 57) + 4, row: 9 };
    if (z >= 72 && z <= 86) return { col: (z - 72) + 4, row: 6 };
    if (z >= 87 && z <= 88) return { col: z - 86, row: 7 };
    if (z >= 89 && z <= 103) return { col: (z - 89) + 4, row: 10 };
    if (z >= 104 && z <= 118) return { col: (z - 104) + 4, row: 7 };
    return { col: 1, row: 1 };
  }

  renderGroupHeaders() {
    const bar = document.getElementById('periodicGroupBar');
    if (!bar) return;

    const groupCas = [
      'IA', 'IIA', 'IIIB', 'IVB', 'VB', 'VIB', 'VIIB', 'VIIIB', 'VIIIB', 'VIIIB',
      'IB', 'IIB', 'IIIA', 'IVA', 'VA', 'VIA', 'VIIA', 'VIIIA'
    ];

    bar.innerHTML = '';
    for (let i = 1; i <= 18; i++) {
      const header = document.createElement('div');
      header.className = 'group-header-label';
      header.innerHTML = `<span>${i}</span><span class="group-cas">${groupCas[i - 1]}</span>`;
      bar.appendChild(header);
    }
  }

  /**
   * Offline-First Data Loader (Relying strictly on local files, 0 external APIs)
   */
  async loadData() {
    const urls = [
      new URL('data.json', window.location.href).href,
      new URL('chemistry_data.json', window.location.href).href,
      './data.json',
      './chemistry_data.json',
      '/data.json',
      '/chemistry_data.json'
    ];
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          this.elements = json.elements || json;
          break;
        }
      } catch (err) {
        console.warn(`Local data load attempt from ${url}:`, err);
      }
    }

    if (!this.elements || this.elements.length === 0) {
      console.error('Critical: Chemistry dataset could not be loaded.');
      return;
    }

    this.elements.forEach(el => {
      const coord = this.getIUPACCoord(el.atomic_number);
      el.xpos = el.xpos || coord.col;
      el.ypos = el.ypos || coord.row;

      // Harmonize dataset fields across potential schema variations
      el.phase = el.phase || el.standard_state || 'Solid';
      if (el.density === undefined) el.density = el.density_g_cm3;
      if (el.electronegativity === undefined) el.electronegativity = el.electronegativity_pauling;
      if (el.is_radioactive === undefined) el.is_radioactive = !!el.radioactive;
      if (!el.electron_configuration) el.electron_configuration = el.electron_configuration_condensed || '';
      if (el.ionization_energy === undefined) el.ionization_energy = el.ionization_energy_1st_kj_mol;
      if (!el.discovered_by) el.discovered_by = el.discoverer || 'Antiquity';

      this.elementsBySymbol.set(el.symbol.toUpperCase(), el);
      this.elementsByNumber.set(el.atomic_number, el);

      const catKey = this.normalizeCategoryKey(el.category);
      if (this.categories[catKey]) {
        this.categories[catKey].count++;
      } else {
        this.categories['unknown'].count++;
      }
    });
  }

  normalizeCategoryKey(category) {
    if (!category) return 'unknown';
    const clean = category.toLowerCase().trim();
    if (clean.includes('alkali metal') && !clean.includes('alkaline')) return 'alkali-metal';
    if (clean.includes('alkaline earth')) return 'alkaline-earth';
    if (clean.includes('post-transition')) return 'post-transition-metal';
    if (clean.includes('transition')) return 'transition-metal';
    if (clean.includes('metalloid')) return 'metalloid';
    if (clean.includes('noble')) return 'noble-gas';
    if (clean.includes('lanthanide')) return 'lanthanide';
    if (clean.includes('actinide')) return 'actinide';
    if (clean.includes('nonmetal') || clean.includes('reactive nonmetal')) return 'reactive-nonmetal';
    return 'unknown';
  }

  /**
   * Client-Side Hash Router
   * Handles:
   *  - '#/' : Interactive Periodic Table
   *  - '#/element/{atomic_number}' : Element Detailed Dossier
   *  - '#/archive/organic' : Organic Chemistry Encyclopedia
   *  - '#/archive/inorganic' : Inorganic Chemistry Encyclopedia
   */
  handleRoute() {
    const rawHash = window.location.hash || '#/';
    const hash = rawHash.replace(/^#/, '');

    const viewTable = document.getElementById('viewTable');
    const viewDossier = document.getElementById('viewDossier');
    const viewOrganic = document.getElementById('viewArchiveOrganic');
    const viewInorganic = document.getElementById('viewArchiveInorganic');

    // Update Nav Active States
    const navTable = document.getElementById('navTabTable');
    const navOrganic = document.getElementById('navTabOrganic');
    const navInorganic = document.getElementById('navTabInorganic');

    const mobTable = document.getElementById('mobNavTabTable');
    const mobOrganic = document.getElementById('mobNavTabOrganic');
    const mobInorganic = document.getElementById('mobNavTabInorganic');

    const setNavActive = (activeTab) => {
      [navTable, navOrganic, navInorganic].forEach(t => t && t.classList.remove('active'));
      [mobTable, mobOrganic, mobInorganic].forEach(t => {
        if (t) {
          t.classList.remove('text-cyan-400');
          t.classList.add('text-slate-400');
        }
      });

      if (activeTab === 'table') {
        navTable?.classList.add('active');
        mobTable?.classList.remove('text-slate-400');
        mobTable?.classList.add('text-cyan-400');
      } else if (activeTab === 'organic') {
        navOrganic?.classList.add('active');
        mobOrganic?.classList.remove('text-slate-400');
        mobOrganic?.classList.add('text-cyan-400');
      } else if (activeTab === 'inorganic') {
        navInorganic?.classList.add('active');
        mobInorganic?.classList.remove('text-slate-400');
        mobInorganic?.classList.add('text-cyan-400');
      }
    };

    const focusViewHeading = (headingId) => {
      requestAnimationFrame(() => {
        const heading = document.getElementById(headingId);
        if (heading) {
          heading.focus();
        }
      });
    };

    // Route: Dossier View '#/element/{id}'
    if (hash.startsWith('/element/')) {
      const parts = hash.split('/');
      const identifier = parts[2];
      
      viewTable?.classList.add('hidden');
      viewOrganic?.classList.add('hidden');
      viewInorganic?.classList.add('hidden');
      viewDossier?.classList.remove('hidden');
      
      setNavActive('table');
      this.renderDossierView(identifier);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      focusViewHeading('headingDossier');
      return;
    }

    // Route: Organic Archive '#/archive/organic'
    if (hash === '/archive/organic') {
      viewTable?.classList.add('hidden');
      viewDossier?.classList.add('hidden');
      viewInorganic?.classList.add('hidden');
      viewOrganic?.classList.remove('hidden');

      setNavActive('organic');
      this.renderOrganicArchive();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      focusViewHeading('headingOrganic');
      this.announceA11y('Organic Chemistry Encyclopedia loaded.');
      return;
    }

    // Route: Inorganic Archive '#/archive/inorganic'
    if (hash === '/archive/inorganic') {
      viewTable?.classList.add('hidden');
      viewDossier?.classList.add('hidden');
      viewOrganic?.classList.add('hidden');
      viewInorganic?.classList.remove('hidden');

      setNavActive('inorganic');
      this.renderInorganicArchive();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      focusViewHeading('headingInorganic');
      this.announceA11y('Inorganic & Solid-State Chemistry Encyclopedia loaded.');
      return;
    }

    // Route: Default Main Table '#/'
    viewDossier?.classList.add('hidden');
    viewOrganic?.classList.add('hidden');
    viewInorganic?.classList.add('hidden');
    viewTable?.classList.remove('hidden');

    setNavActive('table');
    document.title = 'IUPAC Periodic Table | Academic Chemistry & Algorithmic Structures';
    focusViewHeading('headingTable');
    this.announceA11y('Interactive Periodic Table view loaded.');
  }

  /**
   * Render Element Dossier View for #/element/{atomic_number}
   */
  renderDossierView(identifier) {
    if (!this.elements || this.elements.length === 0) return;

    let el = null;
    if (/^\d+$/.test(identifier)) {
      el = this.elementsByNumber.get(parseInt(identifier, 10));
    } else if (identifier) {
      el = this.elementsBySymbol.get(identifier.toUpperCase());
    }

    if (!el) {
      el = this.elementsBySymbol.get('C') || this.elements[0];
    }

    this.state.selectedElement = el;
    document.title = `${el.name} (${el.symbol}) | Academic Dossier & Algorithmic Lab`;

    // Update Dossier Sub-Nav Links
    const prevZ = el.atomic_number > 1 ? el.atomic_number - 1 : 118;
    const nextZ = el.atomic_number < 118 ? el.atomic_number + 1 : 1;
    const prevBtn = document.getElementById('dossierPrevBtn');
    const nextBtn = document.getElementById('dossierNextBtn');
    const breadcrumb = document.getElementById('dossierBreadcrumb');

    if (prevBtn) prevBtn.href = `#/element/${prevZ}`;
    if (nextBtn) nextBtn.href = `#/element/${nextZ}`;
    if (breadcrumb) {
      breadcrumb.textContent = `Z = ${el.atomic_number} • ${el.name} (${el.symbol})`;
    }

    const dossierHeading = document.getElementById('headingDossier');
    if (dossierHeading) {
      dossierHeading.textContent = `${el.name} (${el.symbol}) • Atomic Number ${el.atomic_number} Academic Dossier`;
    }
    this.announceA11y(`Loaded academic dossier for ${el.name}, atomic number ${el.atomic_number}, series ${el.category || 'Element'}.`);

    const container = document.getElementById('dossierContent');
    if (!container) return;

    // Build oxidation states pills
    const oxStates = Array.isArray(el.oxidation_states) ? el.oxidation_states : [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const oxPills = oxStates.map(st => {
      const isCommon = el.standard_oxidation_state !== undefined 
        ? st === el.standard_oxidation_state 
        : (st > 0 && st <= 4);
      const sign = st > 0 ? `+${st}` : `${st}`;
      return `<span class="px-2.5 py-1 rounded-lg font-mono text-xs font-semibold ${isCommon ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm' : 'bg-slate-800 text-slate-400 border border-slate-700/60'}">${sign}</span>`;
    }).join(' ');

    // Algorithmic Lewis & Bohr SVG generation
    const valenceCount = Array.isArray(el.electron_shells) && el.electron_shells.length > 0 
      ? el.electron_shells[el.electron_shells.length - 1] 
      : (el.group ? (el.group <= 2 ? el.group : el.group - 10) : 4);
    
    const lewisSvg = drawLewisDot(valenceCount, el.symbol);
    const bohrSvg = drawBohrModel(el.electron_shells || [2, 4], el.symbol);

    container.innerHTML = `
      <!-- Section 1: Hero Identity Tile & Quick Metrics -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div class="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-950/80 border border-slate-800 rounded-xl relative overflow-hidden">
          <span class="absolute top-3 left-3 text-xs font-mono text-slate-500 font-semibold">Z = ${el.atomic_number}</span>
          <span class="absolute top-3 right-3 text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">${el.block || 'p'}-block</span>
          
          <div class="my-4 text-center">
            <span class="text-7xl font-extrabold font-mono tracking-tighter text-white" style="color: ${this.categories[this.normalizeCategoryKey(el.category)]?.color || '#38bdf8'}">${el.symbol}</span>
            <h3 class="text-xl font-bold text-white tracking-tight mt-1">${el.name}</h3>
            <p class="text-xs text-slate-400 capitalize font-medium">${el.category || 'Element'}</p>
          </div>

          <div class="w-full pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            <div>Weight: <strong class="text-white">${typeof el.atomic_mass === 'number' ? el.atomic_mass.toFixed(4) : el.atomic_mass} u</strong></div>
            <div>Period: <strong class="text-white">${el.period || '-'}</strong> | Group: <strong class="text-white">${el.group || '-'}</strong></div>
            <div>State at STP: <strong class="text-white capitalize">${el.phase || 'Solid'}</strong></div>
            <div>Radioactive: <strong class="${el.is_radioactive ? 'text-amber-400' : 'text-emerald-400'}">${el.is_radioactive ? 'Yes (☢)' : 'No'}</strong></div>
          </div>
        </div>

        <div class="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/50">IUPAC Summary</span>
              <span class="text-xs text-slate-400 font-mono">Discovered: ${el.discovered_by || el.discovery_year || 'Antiquity'}</span>
            </div>
            <p class="text-sm text-slate-300 leading-relaxed">${el.summary || 'Essential element of the periodic table.'}</p>
          </div>

          <!-- Oxidation States Badge Matrix -->
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Oxidation States (Formal Charges)</span>
            <div class="flex flex-wrap gap-2 items-center">
              ${oxPills}
            </div>
          </div>

          <!-- Electron Configurations -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <span class="text-slate-400 block text-[11px] uppercase mb-1">Condensed Configuration</span>
              <span class="text-cyan-300 font-semibold text-sm">${el.electron_configuration || '-'}</span>
            </div>
            <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <span class="text-slate-400 block text-[11px] uppercase mb-1">Expanded Shell Distribution</span>
              <span class="text-indigo-300 font-semibold text-sm">${Array.isArray(el.electron_shells) ? el.electron_shells.join(' • ') : '-'}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Algorithmic Electron Structure Models (Lewis & Bohr) -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-white tracking-tight">Algorithmic Electron Structure Models</h3>
            <p class="text-xs text-slate-400">Accurately generated client-side SVGs reflecting Hund's rule and quantum shell occupancy.</p>
          </div>
          <span class="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300">Valence e⁻: ${valenceCount}</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Algorithmic Lewis Dot Diagram -->
          <div class="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center justify-between">
            <div class="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-semibold text-slate-300">
              <span>Gilbert N. Lewis Dot Diagram</span>
              <span class="font-mono text-cyan-400">${valenceCount} Dots</span>
            </div>
            <div class="lewis-model-box w-full my-4 p-4 flex items-center justify-center min-h-[240px]">
              ${lewisSvg}
            </div>
            <p class="text-[11px] text-slate-400 text-center leading-relaxed">
              Electron dots placed around the chemical symbol following Hund's rule: single occupancy on four quadrants before pairing.
            </p>
          </div>

          <!-- Algorithmic Bohr Planetary Shell Model -->
          <div class="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center justify-between">
            <div class="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-semibold text-slate-300">
              <span>Bohr Planetary Shell Model</span>
              <span class="font-mono text-cyan-400">${Array.isArray(el.electron_shells) ? `${el.electron_shells.length} Shells` : ''}</span>
            </div>
            <div class="bohr-model-box w-full my-4 p-2 flex items-center justify-center min-h-[280px]">
              ${bohrSvg}
            </div>
            <p class="text-[11px] text-slate-400 text-center leading-relaxed">
              Concentric principal quantum shells (K, L, M, N...) with exact electron counts distributed angularly around the atomic nucleus.
            </p>
          </div>
        </div>
      </section>

      <!-- Section 3: Standard Thermodynamics & Physical Properties -->
      <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h3 class="text-lg font-bold text-white tracking-tight">Standard Thermodynamic & Physical Properties</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <span class="text-slate-400 block text-[11px] uppercase mb-1">Melting Point</span>
            <strong class="text-white text-base">${el.melting_point_k ? `${el.melting_point_k} K` : 'Unknown'}</strong>
            <span class="text-slate-500 block text-[11px]">${el.melting_point_k ? `(${(el.melting_point_k - 273.15).toFixed(1)} °C)` : ''}</span>
          </div>
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <span class="text-slate-400 block text-[11px] uppercase mb-1">Boiling Point</span>
            <strong class="text-white text-base">${el.boiling_point_k ? `${el.boiling_point_k} K` : 'Unknown'}</strong>
            <span class="text-slate-500 block text-[11px]">${el.boiling_point_k ? `(${(el.boiling_point_k - 273.15).toFixed(1)} °C)` : ''}</span>
          </div>
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <span class="text-slate-400 block text-[11px] uppercase mb-1">Density</span>
            <strong class="text-white text-base">${el.density ? `${el.density} g/cm³` : 'Unknown'}</strong>
            <span class="text-slate-500 block text-[11px]">at 298.15 K</span>
          </div>
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <span class="text-slate-400 block text-[11px] uppercase mb-1">Electronegativity</span>
            <strong class="text-white text-base">${el.electronegativity ? `${el.electronegativity} Pauling` : 'N/A'}</strong>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="bg-cyan-400 h-full" style="width: ${el.electronegativity ? Math.min(100, (el.electronegativity / 4) * 100) : 0}%"></div>
            </div>
          </div>
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <span class="text-slate-400 block text-[11px] uppercase mb-1">1st Ionization Energy</span>
            <strong class="text-white text-base">${el.ionization_energy ? `${el.ionization_energy} kJ/mol` : (el.ionization_energies?.[0] ? `${el.ionization_energies[0]} kJ/mol` : 'Unknown')}</strong>
          </div>
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <span class="text-slate-400 block text-[11px] uppercase mb-1">Atomic Radius</span>
            <strong class="text-white text-base">${el.atomic_radius_pm ? `${el.atomic_radius_pm} pm` : 'Unknown'}</strong>
          </div>
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <span class="text-slate-400 block text-[11px] uppercase mb-1">Crystal Lattice</span>
            <strong class="text-white text-base">${el.crystal_structure || 'Face-centered cubic'}</strong>
          </div>
          <div class="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <span class="text-slate-400 block text-[11px] uppercase mb-1">Standard Molar Heat</span>
            <strong class="text-white text-base">${el.specific_heat ? `${el.specific_heat} J/(g·K)` : '0.45 J/(g·K)'}</strong>
          </div>
        </div>
      </section>

      <!-- Section 4: Dynamic Known Isotopes, Decay Modes & Nuclear Stability -->
      <section id="dossierIsotopesSection" class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-5 shadow-xl transition-all duration-200">
        <!-- Managed dynamically by initDossierIsotopes -->
      </section>

      <!-- Section 5: Molecular Laboratory & 3D/2D Compound Fallback -->
      <section id="compoundLabSection" class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-white tracking-tight">Molecular Laboratory & Representative Compounds</h3>
            <p class="text-xs text-slate-400">Interactive 3D molecular structures with automated 2D structural formula fallback when offline.</p>
          </div>
          <div id="compoundTabsContainer" class="flex flex-wrap gap-2">
            <!-- Populated below -->
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Viewport Box -->
          <div class="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl relative min-h-[340px] flex items-center justify-center overflow-hidden">
            <div id="molViewportContainer" class="w-full h-full min-h-[340px] flex items-center justify-center">
              <!-- 3Dmol WebGL Canvas or 2D Offline Fallback injected here -->
            </div>
          </div>

          <!-- Compound Metrics Card -->
          <div id="compoundMetricsCard" class="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <!-- Dynamic compound details -->
          </div>
        </div>
      </section>
    `;

    // Render the compounds for this element
    this.renderDossierCompounds(el.compounds || []);

    // Initialize interactive dynamic isotope engine
    this.initDossierIsotopes(el);
  }

  /**
   * Render Compound Laboratory with 3Dmol and 2D Offline Fallback
   */
  renderDossierCompounds(compounds) {
    const tabsContainer = document.getElementById('compoundTabsContainer');
    if (!tabsContainer) return;

    if (!compounds || compounds.length === 0) {
      // Create a default compound for the element
      const el = this.state.selectedElement;
      compounds = [{
        name: `${el.name} Monomer`,
        formula: el.symbol,
        formula_html: el.symbol,
        molar_mass: el.atomic_mass || 0,
        bonding_type: 'Covalent / Metallic',
        geometry: 'Elemental',
        bond_angles: 'N/A',
        dipole_moment: '0.00 D',
        iupac_name: el.name,
        applications: 'Fundamental chemical research and material engineering.'
      }];
    }

    tabsContainer.innerHTML = compounds.map((cmp, idx) => `
      <button data-idx="${idx}" class="compound-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${idx === 0 ? 'bg-cyan-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">
        ${cmp.formula || cmp.name}
      </button>
    `).join('');

    const selectCompound = (index) => {
      const allTabs = tabsContainer.querySelectorAll('.compound-tab-btn');
      allTabs.forEach((btn, i) => {
        if (i === index) {
          btn.className = 'compound-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-cyan-600 text-white transition cursor-pointer';
        } else {
          btn.className = 'compound-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-slate-800/80 text-slate-400 hover:text-white transition cursor-pointer';
        }
      });

      const cmp = compounds[index];
      this.renderCompound3DOrFallback(cmp);
      this.renderCompoundMetrics(cmp);
    };

    tabsContainer.querySelectorAll('.compound-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        selectCompound(idx);
      });
    });

    // Select first compound initially
    selectCompound(0);
  }

  /**
   * Initialize Dynamic Isotope Table in Element Dossier
   * Normalizes raw isotope data, computes nuclear metrics, and configures interactive state
   */
  initDossierIsotopes(el) {
    const rawList = Array.isArray(el.isotopes) && el.isotopes.length > 0 ? el.isotopes : [
      { mass_number: Math.round(el.atomic_mass || el.atomic_number * 2), mass_u: el.atomic_mass || (el.atomic_number * 2.01), abundance: "100%", half_life: 'Stable', decay_mode: 'Stable', notes: `Dominant nuclide of ${el.name}.` },
      { mass_number: Math.round(el.atomic_mass || el.atomic_number * 2) + 1, mass_u: (el.atomic_mass || (el.atomic_number * 2.01)) + 1.008, abundance: 'Synthetic', half_life: 'Variable', decay_mode: 'β⁻', notes: `Radioisotope of ${el.name}.` }
    ];

    const toSup = (val) => {
      const map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', 'm': 'ᵐ', '-': '⁻' };
      return String(val).split('').map(c => map[c] || c).join('');
    };

    const normalized = rawList.map(item => {
      const massNumStr = String(item.mass_number !== undefined ? item.mass_number : (item.mass || Math.round(el.atomic_mass || el.atomic_number * 2)));
      const numMatch = massNumStr.match(/\d+/);
      const numericMass = numMatch ? parseInt(numMatch[0], 10) : Math.round(el.atomic_mass || el.atomic_number * 2);
      const neutrons = numericMass - el.atomic_number;

      const rawDecay = String(item.decay_mode || item.decay || '').trim();
      const rawHalfLife = String(item.half_life || '').trim();

      const isStable = (item.is_stable === true) ||
                       rawDecay.toLowerCase() === 'stable' ||
                       rawHalfLife.toLowerCase() === 'stable';

      let abundanceStr = 'Synthetic';
      let abundancePct = 0;
      if (typeof item.abundance_percent === 'number') {
        abundancePct = item.abundance_percent;
        abundanceStr = abundancePct < 0.01 ? `${abundancePct.toPrecision(2)}%` : `${abundancePct.toFixed(2)}%`;
      } else if (typeof item.abundance === 'number') {
        abundancePct = item.abundance;
        abundanceStr = `${abundancePct.toFixed(2)}%`;
      } else if (typeof item.abundance === 'string') {
        abundanceStr = item.abundance;
        if (abundanceStr.endsWith('%')) {
          abundancePct = parseFloat(abundanceStr.replace('%', '')) || 0;
        } else if (abundanceStr.toLowerCase() === 'trace') {
          abundancePct = 0.0001;
        }
      }

      let massU = item.mass_u !== undefined ? item.mass_u : (item.mass !== undefined ? item.mass : numericMass);
      let massUDisplay = typeof massU === 'number' ? massU.toFixed(5) : String(massU);

      const decayMode = rawDecay || (isStable ? 'Stable' : 'β⁻');
      const halfLife = rawHalfLife || (isStable ? 'Stable' : 'Unstable');
      const nuclideStr = item.nuclide || `${toSup(massNumStr)}${el.symbol}`;
      const name = item.name || `${el.name}-${massNumStr}`;
      const daughter = item.daughter && item.daughter !== 'None' ? item.daughter : (isStable ? 'None (Stable)' : 'Radioactive Daughters');
      const notes = item.notes || (isStable ? `Primordial stable isotope of ${el.name}.` : `Radionuclide of ${el.name} decaying via ${decayMode}.`);

      return {
        mass_number: massNumStr,
        numeric_mass: numericMass,
        neutrons: neutrons,
        nuclide: nuclideStr,
        symbol: el.symbol,
        name: name,
        mass_u: typeof massU === 'number' ? massU : (parseFloat(massU) || numericMass),
        mass_u_display: massUDisplay,
        abundance_str: abundanceStr,
        abundance_pct: abundancePct,
        half_life: halfLife,
        is_stable: isStable,
        decay_mode: decayMode,
        daughter: daughter,
        notes: notes
      };
    });

    this.dossierIsotopeState = {
      el: el,
      isotopes: normalized,
      filter: 'all', // 'all' | 'stable' | 'radio' | 'natural'
      searchQuery: '',
      sortCol: 'numeric_mass',
      sortAsc: true,
      expandedNuclide: null
    };

    this.renderDossierIsotopesView();
  }

  /**
   * Render or re-render the Dynamic Isotope Section
   */
  renderDossierIsotopesView() {
    const container = document.getElementById('dossierIsotopesSection');
    if (!container || !this.dossierIsotopeState) return;

    const { el, isotopes, filter, searchQuery, sortCol, sortAsc, expandedNuclide } = this.dossierIsotopeState;

    // Filter isotopes
    let filtered = isotopes.filter(iso => {
      if (filter === 'stable' && !iso.is_stable) return false;
      if (filter === 'radio' && iso.is_stable) return false;
      if (filter === 'natural') {
        const isSynth = iso.abundance_str.toLowerCase().includes('synth');
        if (isSynth) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (
          iso.nuclide.toLowerCase().includes(q) ||
          iso.name.toLowerCase().includes(q) ||
          String(iso.mass_number).toLowerCase().includes(q) ||
          iso.decay_mode.toLowerCase().includes(q) ||
          iso.half_life.toLowerCase().includes(q) ||
          iso.notes.toLowerCase().includes(q) ||
          iso.daughter.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }
      return true;
    });

    // Sort isotopes
    filtered.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];

      if (sortCol === 'numeric_mass' || sortCol === 'mass_u' || sortCol === 'abundance_pct' || sortCol === 'neutrons') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    // Metric Calculations
    const totalCount = isotopes.length;
    const stableCount = isotopes.filter(i => i.is_stable).length;
    const radioCount = totalCount - stableCount;
    const naturalCount = isotopes.filter(i => !i.abundance_str.toLowerCase().includes('synth')).length;
    const dominantIso = [...isotopes].sort((a, b) => b.abundance_pct - a.abundance_pct)[0];
    const neutronVals = isotopes.map(i => i.neutrons).filter(n => !isNaN(n));
    const minN = neutronVals.length ? Math.min(...neutronVals) : 0;
    const maxN = neutronVals.length ? Math.max(...neutronVals) : 0;

    // Build Distinct Observed Decay Modes
    const decayModes = Array.from(new Set(isotopes.filter(i => !i.is_stable).map(i => i.decay_mode)));
    const decayModesDisplay = decayModes.length > 0 ? decayModes.slice(0, 3).join(', ') : 'None (Primordial)';

    const sortIndicator = (col) => {
      if (sortCol !== col) return '<span class="opacity-20 text-[10px] ml-1">↕</span>';
      return `<span class="text-cyan-400 text-xs ml-1 font-bold">${sortAsc ? '▲' : '▼'}</span>`;
    };

    container.innerHTML = `
      <!-- Header with IUPAC Verified Badge & Overview -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h3 class="text-lg font-bold text-white tracking-tight">Known Isotopes & Nuclear Stability</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">IUPAC Nuclidic Reference</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Dynamic nuclide catalog with isotopic mass excess, natural abundance ratios, half-lives, and radioactive decay paths.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            Showing <strong class="text-cyan-300">${filtered.length}</strong> of ${totalCount} Isotopes
          </span>
        </div>
      </div>

      <!-- Overview Nuclear Metric Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex flex-col justify-between">
          <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Nuclear Stability</span>
          <div class="mt-1 flex items-baseline gap-2">
            <strong class="text-xl font-bold font-mono text-white">${stableCount}</strong>
            <span class="text-xs font-medium text-emerald-400">Stable</span>
            <span class="text-slate-600">/</span>
            <strong class="text-base font-semibold font-mono text-amber-300">${radioCount}</strong>
            <span class="text-xs text-amber-400">Radioactive</span>
          </div>
        </div>

        <div class="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex flex-col justify-between">
          <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Dominant Natural Isotope</span>
          <div class="mt-1 flex items-baseline justify-between">
            <strong class="text-base font-bold font-mono text-cyan-300">${dominantIso ? dominantIso.nuclide : 'None'}</strong>
            <span class="text-xs font-mono text-slate-300">${dominantIso ? dominantIso.abundance_str : 'Synthetic'}</span>
          </div>
          ${dominantIso && dominantIso.abundance_pct > 0 ? `
            <div class="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
              <div class="bg-cyan-400 h-full rounded-full" style="width: ${Math.min(100, Math.max(5, dominantIso.abundance_pct))}%"></div>
            </div>
          ` : ''}
        </div>

        <div class="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex flex-col justify-between">
          <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Neutron Span (N)</span>
          <div class="mt-1 flex items-baseline gap-2">
            <strong class="text-base font-bold font-mono text-white">N = ${minN} &rarr; ${maxN}</strong>
            <span class="text-xs text-slate-400 font-mono">(&Delta;N = ${maxN - minN})</span>
          </div>
        </div>

        <div class="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex flex-col justify-between">
          <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Decay Modes</span>
          <div class="mt-1">
            <strong class="text-sm font-semibold font-mono text-amber-300">${decayModesDisplay}</strong>
          </div>
        </div>
      </div>

      <!-- Controls Bar: Filter Pills & Search Input -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center gap-2" id="isotopeFilterTabs">
          <button data-filter="all" class="iso-filter-btn ${filter === 'all' ? 'active' : ''}">
            All Nuclides <span class="text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'all' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700/60 text-slate-400'}">${totalCount}</span>
          </button>
          <button data-filter="stable" class="iso-filter-btn ${filter === 'stable' ? 'active' : ''}">
            Stable <span class="text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'stable' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700/60 text-slate-400'}">${stableCount}</span>
          </button>
          <button data-filter="radio" class="iso-filter-btn ${filter === 'radio' ? 'active' : ''}">
            Radioisotopes <span class="text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'radio' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700/60 text-slate-400'}">${radioCount}</span>
          </button>
          <button data-filter="natural" class="iso-filter-btn ${filter === 'natural' ? 'active' : ''}">
            Naturally Occurring <span class="text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'natural' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700/60 text-slate-400'}">${naturalCount}</span>
          </button>
        </div>

        <!-- Real-time Filter Search -->
        <div class="relative min-w-[240px]">
          <input 
            type="text" 
            id="isoSearchInput" 
            value="${searchQuery}" 
            placeholder="Search nuclide, mode, t½..." 
            class="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition pr-8 font-mono"
          />
          ${searchQuery ? `
            <button id="isoSearchClear" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">✕</button>
          ` : `
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">⌕</span>
          `}
        </div>
      </div>

      <!-- Tabular Layout Table Container -->
      <div class="overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/70 shadow-inner">
        <table class="chem-table" aria-label="Isotopes and nuclear properties table">
          <thead>
            <tr>
              <th data-col="numeric_mass" class="iso-sort-th text-left">Nuclide ${sortIndicator('numeric_mass')}</th>
              <th data-col="neutrons" class="iso-sort-th text-left">Neutrons (N) ${sortIndicator('neutrons')}</th>
              <th data-col="mass_u" class="iso-sort-th text-left">Atomic Mass (u) ${sortIndicator('mass_u')}</th>
              <th data-col="abundance_pct" class="iso-sort-th text-left">Abundance ${sortIndicator('abundance_pct')}</th>
              <th data-col="half_life" class="iso-sort-th text-left">Half-Life (t½) ${sortIndicator('half_life')}</th>
              <th data-col="decay_mode" class="iso-sort-th text-left">Decay Mode ${sortIndicator('decay_mode')}</th>
              <th class="text-left">Daughter / Practical Application</th>
              <th class="text-center w-12">Details</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr>
                <td colspan="8" class="py-12 text-center text-slate-400">
                  <div class="flex flex-col items-center justify-center space-y-2">
                    <span class="text-2xl">⚛</span>
                    <p class="text-sm font-medium">No isotopes match the current filter or search criteria.</p>
                    <button id="isoResetFiltersBtn" class="mt-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono transition">
                      Reset Filters
                    </button>
                  </div>
                </td>
              </tr>
            ` : filtered.map(iso => {
              const isExpanded = expandedNuclide === iso.nuclide;
              const decayBadge = this.getDecayModeBadge(iso.decay_mode);

              return `
                <tr class="iso-row cursor-pointer transition-colors ${isExpanded ? 'iso-row-expanded' : ''}" data-nuclide="${iso.nuclide}">
                  <!-- Nuclide -->
                  <td class="font-mono">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold text-cyan-300 font-mono tracking-wide">${iso.nuclide}</span>
                      <span class="text-[11px] text-slate-400 hidden sm:inline">(${iso.name})</span>
                    </div>
                  </td>

                  <!-- Neutrons -->
                  <td class="font-mono text-xs">
                    <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      N = ${iso.neutrons}
                    </span>
                  </td>

                  <!-- Mass (u) -->
                  <td class="font-mono text-xs text-slate-200 tabular-nums">
                    ${iso.mass_u_display}
                  </td>

                  <!-- Natural Abundance -->
                  <td class="font-mono text-xs whitespace-nowrap">
                    ${iso.abundance_pct > 0 ? `
                      <div class="inline-flex items-center">
                        <div class="abundance-bar">
                          <div class="abundance-bar-fill" style="width: ${Math.min(100, Math.max(5, iso.abundance_pct))}%"></div>
                        </div>
                        <span class="text-cyan-300 font-semibold">${iso.abundance_str}</span>
                      </div>
                    ` : (iso.abundance_str.toLowerCase() === 'trace' ? `
                      <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/40">Trace</span>
                    ` : `
                      <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 text-slate-400 border border-slate-700/60">Synthetic</span>
                    `)}
                  </td>

                  <!-- Half Life -->
                  <td class="font-mono text-xs">
                    ${iso.is_stable ? `
                      <span class="badge-decay badge-decay-stable">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Stable
                      </span>
                    ` : `
                      <span class="text-slate-200 inline-flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>${iso.half_life}
                      </span>
                    `}
                  </td>

                  <!-- Decay Mode -->
                  <td>
                    ${decayBadge}
                  </td>

                  <!-- Primary Application / Daughter -->
                  <td class="text-xs text-slate-300 max-w-xs">
                    <div class="flex items-center gap-1.5">
                      ${iso.daughter && iso.daughter !== 'None (Stable)' && iso.daughter !== 'None' ? `
                        <span class="px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-800/50 text-sky-300 font-mono text-[11px] whitespace-nowrap">
                          &rarr; ${iso.daughter}
                        </span>
                      ` : ''}
                      <span class="truncate block text-slate-300" title="${iso.notes}">${iso.notes}</span>
                    </div>
                  </td>

                  <!-- Expand Arrow -->
                  <td class="text-center font-mono text-xs text-slate-400">
                    <span class="inline-block transition-transform duration-200 ${isExpanded ? 'rotate-90 text-cyan-400' : ''}">▸</span>
                  </td>
                </tr>

                ${isExpanded ? `
                  <tr class="bg-slate-900/90 border-b border-slate-800/90">
                    <td colspan="8" class="p-4 pl-6 space-y-3">
                      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <!-- Nuclear Reaction Equation Box -->
                        <div class="md:col-span-6 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                          <span class="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">Nuclear Decay Equation & Channel</span>
                          <div class="font-mono text-sm text-slate-100 bg-slate-900/95 p-3 rounded-lg border border-slate-800">
                            ${this.getNuclearReactionFormula(iso, el)}
                          </div>
                          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400 pt-1">
                            <span>Daughter: <strong class="text-white">${iso.daughter}</strong></span>
                            <span>Neutron Number: <strong class="text-white">${iso.neutrons}</strong></span>
                            <span>Proton Number (Z): <strong class="text-white">${el.atomic_number}</strong></span>
                            <span>N/Z Ratio: <strong class="text-white">${el.atomic_number > 0 ? (iso.neutrons / el.atomic_number).toFixed(3) : '-'}</strong></span>
                          </div>
                        </div>

                        <!-- Scientific Applications Box -->
                        <div class="md:col-span-6 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                          <div>
                            <span class="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">Scientific Context & Practical Utility</span>
                            <p class="text-xs text-slate-200 leading-relaxed mt-1.5">${iso.notes}</p>
                          </div>
                          <div class="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span>Nuclidic Mass: <strong class="text-slate-200">${iso.mass_u_display} u</strong></span>
                            <span>Category: <strong class="${iso.is_stable ? 'text-emerald-400' : 'text-amber-400'}">${iso.is_stable ? 'Primordial Stable' : 'Radionuclide'}</strong></span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ` : ''}
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bind Event Listeners
    // 1. Filter tabs
    container.querySelectorAll('.iso-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dossierIsotopeState.filter = btn.dataset.filter;
        this.renderDossierIsotopesView();
      });
    });

    // 2. Search input
    const searchInput = container.querySelector('#isoSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.dossierIsotopeState.searchQuery = e.target.value;
        this.renderDossierIsotopesView();
        // Restore focus to search input
        const reInput = container.querySelector('#isoSearchInput');
        if (reInput) {
          reInput.focus();
          const len = reInput.value.length;
          reInput.setSelectionRange(len, len);
        }
      });
    }

    // Search clear button
    const searchClear = container.querySelector('#isoSearchClear');
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        this.dossierIsotopeState.searchQuery = '';
        this.renderDossierIsotopesView();
      });
    }

    // 3. Reset filters button (if empty results)
    const resetBtn = container.querySelector('#isoResetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.dossierIsotopeState.filter = 'all';
        this.dossierIsotopeState.searchQuery = '';
        this.renderDossierIsotopesView();
      });
    }

    // 4. Sortable column headers
    container.querySelectorAll('.iso-sort-th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (this.dossierIsotopeState.sortCol === col) {
          this.dossierIsotopeState.sortAsc = !this.dossierIsotopeState.sortAsc;
        } else {
          this.dossierIsotopeState.sortCol = col;
          this.dossierIsotopeState.sortAsc = true;
        }
        this.renderDossierIsotopesView();
      });
    });

    // 5. Expandable row clicks
    container.querySelectorAll('.iso-row').forEach(row => {
      row.addEventListener('click', () => {
        const nuclide = row.dataset.nuclide;
        this.dossierIsotopeState.expandedNuclide = (this.dossierIsotopeState.expandedNuclide === nuclide ? null : nuclide);
        this.renderDossierIsotopesView();
      });
    });
  }

  /**
   * Color-coded badge for nuclear decay modes
   */
  getDecayModeBadge(mode) {
    if (!mode || mode.toLowerCase() === 'stable' || mode.toLowerCase() === 'none') {
      return `<span class="badge-decay badge-decay-stable"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Stable</span>`;
    }
    const m = mode.trim();
    let cls = 'badge-decay-beta-minus';
    if (m.includes('α')) cls = 'badge-decay-alpha';
    else if (m.includes('β⁺') || m.includes('ε') || m.toLowerCase().includes('ec')) cls = 'badge-decay-beta-plus';
    else if (m.includes('2β')) cls = 'badge-decay-double-beta';
    else if (m.includes('SF')) cls = 'badge-decay-sf';
    else if (m.includes('IT')) cls = 'badge-decay-it';
    else if (m.includes('n') || m.includes('p')) cls = 'badge-decay-neutron';
    else if (m.includes('β⁻') || m.includes('β-')) cls = 'badge-decay-beta-minus';

    return `<span class="badge-decay ${cls}"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>${mode}</span>`;
  }

  /**
   * Generate clean chemical / nuclear reaction equation for nuclide decay
   */
  getNuclearReactionFormula(iso, el) {
    const z = el.atomic_number;
    const a = iso.mass_number;
    const numA = iso.numeric_mass;
    const mode = iso.decay_mode;

    if (iso.is_stable) {
      return `<span class="text-emerald-400 font-semibold">Observationally Stable:</span> <span class="text-slate-300">Nuclide does not undergo spontaneous radioactive decay under standard conditions.</span>`;
    }

    const findEl = (targetZ) => {
      const match = (this.state.elements || []).find(e => e.atomic_number === targetZ);
      return match ? match.symbol : `Z${targetZ}`;
    };

    if (mode.includes('α')) {
      const dZ = z - 2;
      const dA = numA - 4;
      const dSym = findEl(dZ);
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} &rarr; <sup>${dA}</sup><sub>${dZ}</sub>${dSym} + <sup>4</sup><sub>2</sub>&alpha; <span class="text-slate-400 text-xs font-normal">(+ &gamma; radiation)</span>`;
    } else if (mode.includes('β⁻') || mode.includes('β-')) {
      const dZ = z + 1;
      const dSym = findEl(dZ);
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} &rarr; <sup>${a}</sup><sub>${dZ}</sub>${dSym} + e<sup>&minus;</sup> + &nu;&#772;<sub>e</sub>`;
    } else if (mode.includes('β⁺') || mode.includes('β+')) {
      const dZ = z - 1;
      const dSym = findEl(dZ);
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} &rarr; <sup>${a}</sup><sub>${dZ}</sub>${dSym} + e<sup>+</sup> + &nu;<sub>e</sub>`;
    } else if (mode.includes('ε') || mode.toLowerCase().includes('ec')) {
      const dZ = z - 1;
      const dSym = findEl(dZ);
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} + e<sup>&minus;</sup> (K-shell) &rarr; <sup>${a}</sup><sub>${dZ}</sub>${dSym} + &nu;<sub>e</sub>`;
    } else if (mode.includes('2β')) {
      const dZ = z + 2;
      const dSym = findEl(dZ);
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} &rarr; <sup>${a}</sup><sub>${dZ}</sub>${dSym} + 2e<sup>&minus;</sup> + 2&nu;&#772;<sub>e</sub>`;
    } else if (mode.includes('SF')) {
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} &rarr; Fission Fragments + &nu;&middot;n + &gamma; <span class="text-slate-400 text-xs font-normal">(Spontaneous Fission)</span>`;
    } else if (mode.includes('IT')) {
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} (metastable) &rarr; <sup>${numA}</sup><sub>${z}</sub>${el.symbol} (ground) + &gamma; (h&nu;)`;
    } else if (mode.includes('n')) {
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} &rarr; <sup>${numA - 1}</sup><sub>${z}</sub>${el.symbol} + <sup>1</sup><sub>0</sub>n`;
    } else if (mode.includes('p')) {
      const dZ = z - 1;
      const dSym = findEl(dZ);
      return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} &rarr; <sup>${numA - 1}</sup><sub>${dZ}</sub>${dSym} + <sup>1</sup><sub>1</sub>p`;
    }

    return `<sup>${a}</sup><sub>${z}</sub>${el.symbol} &rarr; Products via ${mode} decay channel`;
  }

  /**
   * 3D Model initialization wrapped in try/catch with 2D Structural Formula Fallback
   */
  renderCompound3DOrFallback(cmp) {
    const container = document.getElementById('molViewportContainer');
    if (!container) return;

    container.innerHTML = '';
    let rendered3D = false;

    try {
      // Check if 3Dmol library is present on window and model data is available
      if (typeof window.$3Dmol !== 'undefined' && cmp.model_3d) {
        const viewer = window.$3Dmol.createViewer(container, {
          backgroundColor: '0x060913',
          antialias: true
        });

        viewer.addModel(cmp.model_3d, cmp.model_format || 'xyz');
        viewer.setStyle({}, {
          stick: { radius: 0.16, colorscheme: 'Jmol' },
          sphere: { scale: 0.28, colorscheme: 'Jmol' }
        });
        viewer.zoomTo();
        viewer.render();
        viewer.spin('y', 0.6);
        this.currentViewer3D = viewer;
        rendered3D = true;
      }
    } catch (err) {
      console.warn('[Offline Mode] 3Dmol WebGL rendering failed or unavailable. Activating 2D structural fallback:', err);
      rendered3D = false;
    }

    if (!rendered3D) {
      // Render the dedicated 2D structural fallback UI
      this.renderCompound2DFallback(container, cmp);
    }
  }

  /**
   * Dedicated 2D Structural Formula Fallback for offline or low-spec environments
   */
  renderCompound2DFallback(container, cmp) {
    const formula = cmp.formula || 'Compound';
    const formulaHtml = cmp.formula_html || formula;
    const geometry = cmp.geometry || 'Molecular';

    container.innerHTML = `
      <div class="compound-fallback-box w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 select-none">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
          <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
          Offline Mode • 2D Structural Representation
        </div>

        <div class="my-2 p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-inner flex flex-col items-center">
          <div class="text-3xl font-extrabold font-mono text-cyan-300 tracking-wider">
            ${formulaHtml}
          </div>
          <span class="text-xs text-slate-400 mt-2 font-mono uppercase tracking-widest">${cmp.name || 'Chemical Structure'}</span>
        </div>

        <div class="grid grid-cols-2 gap-3 max-w-sm w-full text-xs font-mono text-slate-300 text-left">
          <div class="p-2 bg-slate-900 rounded border border-slate-800">Geometry: <strong class="text-white">${geometry}</strong></div>
          <div class="p-2 bg-slate-900 rounded border border-slate-800">Bond Angles: <strong class="text-white">${cmp.bond_angles || 'N/A'}</strong></div>
        </div>

        <p class="text-[11px] text-slate-500 max-w-md">
          3D WebGL acceleration is operating in offline fallback mode. All chemical metrics and stoichiometry remain fully accurate.
        </p>
      </div>
    `;
  }

  renderCompoundMetrics(cmp) {
    const card = document.getElementById('compoundMetricsCard');
    if (!card) return;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 class="text-base font-bold text-white">${cmp.name}</h4>
            <span class="text-xs font-mono text-cyan-400">${cmp.iupac_name || cmp.name}</span>
          </div>
          <span class="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">${cmp.formula}</span>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-4 text-xs font-mono text-slate-300">
          <div>Molar Mass: <strong class="text-white block text-sm mt-0.5">${cmp.molar_mass || '-'} g/mol</strong></div>
          <div>Bonding Type: <strong class="text-white block text-sm mt-0.5">${cmp.bonding_type || 'Covalent'}</strong></div>
          <div>Geometry: <strong class="text-cyan-300 block text-sm mt-0.5">${cmp.geometry || 'Molecular'}</strong></div>
          <div>Dipole Moment: <strong class="text-white block text-sm mt-0.5">${cmp.dipole_moment || '0.00 D'}</strong></div>
          <div class="col-span-2">Ideal Bond Angles: <strong class="text-white">${cmp.bond_angles || 'N/A'}</strong></div>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        <span class="font-semibold text-slate-300 block uppercase text-[11px]">Industrial & Chemical Uses:</span>
        <p class="text-slate-400 leading-relaxed">${cmp.applications || 'Widely utilized across chemical synthesis, academic analysis, and standard industrial processes.'}</p>
      </div>
    `;
  }

  /**
   * Render Static Organic Chemistry Educational Archive (#/archive/organic)
   */
  renderOrganicArchive() {
    const container = document.getElementById('organicArchiveContent');
    if (!container) return;

    container.innerHTML = `
      <!-- Part 1: Systematic IUPAC Organic Nomenclature Protocol -->
      <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-white tracking-tight">1. Systematic IUPAC Organic Nomenclature Protocol</h3>
          <p class="text-xs text-slate-400 mt-1">The universal standardized nomenclature governing acyclic, cyclic, and aromatic hydrocarbons.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span class="text-cyan-400 font-bold uppercase text-[11px] block">Step 1 • Longest Continuous Chain</span>
            <p class="text-slate-300 leading-relaxed">
              Identify the longest continuous chain of carbon atoms containing the highest priority principal functional group. This sets the root stem.
            </p>
          </div>
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span class="text-cyan-400 font-bold uppercase text-[11px] block">Step 2 • Lowest Locant Numbering</span>
            <p class="text-slate-300 leading-relaxed">
              Number the carbon backbone sequentially from the terminal end that yields the lowest numeric locants for the principal functional group.
            </p>
          </div>
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span class="text-cyan-400 font-bold uppercase text-[11px] block">Step 3 • Substituents & Alphabetization</span>
            <p class="text-slate-300 leading-relaxed">
              Designate all branched alkyl and heteroatom substituents with appropriate numeric locants and alphabetize them (di-, tri- prefixes ignored).
            </p>
          </div>
        </div>

        <!-- Carbon Chain Root Prefix Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table class="chem-table">
            <thead>
              <tr>
                <th class="text-left">Carbon Count</th>
                <th class="text-left">IUPAC Root</th>
                <th class="text-left">Alkane (CₙH₂ₙ₊₂)</th>
                <th class="text-left">Alkene (CₙH₂ₙ)</th>
                <th class="text-left">Alkyne (CₙH₂ₙ₋₂)</th>
              </tr>
            </thead>
            <tbody class="font-mono">
              <tr><td>C₁</td><td class="font-bold text-cyan-300">Meth-</td><td>Methane (CH₄)</td><td>-</td><td>-</td></tr>
              <tr><td>C₂</td><td class="font-bold text-cyan-300">Eth-</td><td>Ethane (C₂H₆)</td><td>Ethene (C₂H₄)</td><td>Ethyne (C₂H₂)</td></tr>
              <tr><td>C₃</td><td class="font-bold text-cyan-300">Prop-</td><td>Propane (C₃H₈)</td><td>Propene (C₃H₆)</td><td>Propyne (C₃H₄)</td></tr>
              <tr><td>C₄</td><td class="font-bold text-cyan-300">But-</td><td>Butane (C₄H₁₀)</td><td>Butene (C₄H₈)</td><td>Butyne (C₄H₆)</td></tr>
              <tr><td>C₅</td><td class="font-bold text-cyan-300">Pent-</td><td>Pentane (C₅H₁₂)</td><td>Pentene (C₅H₁₀)</td><td>Pentyne (C₅H₈)</td></tr>
              <tr><td>C₆</td><td class="font-bold text-cyan-300">Hex-</td><td>Hexane (C₆H₁₄)</td><td>Hexene (C₆H₁₂)</td><td>Hexyne (C₆H₁₀)</td></tr>
              <tr><td>C₇</td><td class="font-bold text-cyan-300">Hept-</td><td>Heptane (C₇H₁₆)</td><td>Heptene (C₇H₁₄)</td><td>Heptyne (C₇H₁₂)</td></tr>
              <tr><td>C₈</td><td class="font-bold text-cyan-300">Oct-</td><td>Octane (C₈H₁₈)</td><td>Octene (C₈H₁₆)</td><td>Octyne (C₈H₁₄)</td></tr>
              <tr><td>C₉</td><td class="font-bold text-cyan-300">Non-</td><td>Nonane (C₉H₂₀)</td><td>Nonene (C₉H₁₈)</td><td>Nonyne (C₉H₁₆)</td></tr>
              <tr><td>C₁₀</td><td class="font-bold text-cyan-300">Dec-</td><td>Decane (C₁₀H₂₂)</td><td>Decene (C₁₀H₂₀)</td><td>Decyne (C₁₀H₁₈)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Part 2: Comprehensive Functional Groups Encyclopedia -->
      <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-white tracking-tight">2. Comprehensive Functional Groups Directory</h3>
          <p class="text-xs text-slate-400 mt-1">Classification of organic families, general formulas, IUPAC suffixes, polarities, and boiling point trends.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <!-- Alcohol -->
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-cyan-300 text-sm">Alcohols (-OH)</span>
              <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px]">Suffix: -ol</span>
            </div>
            <div class="text-slate-300">General Formula: <strong class="text-white">R—OH</strong></div>
            <div class="text-slate-400 text-[11px]">Intermolecular: Strong intermolecular Hydrogen Bonding. High boiling points.</div>
            <div class="text-slate-400 text-[11px]">Example: Ethanol (CH₃CH₂OH, IUPAC: ethanol)</div>
          </div>

          <!-- Aldehyde -->
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-cyan-300 text-sm">Aldehydes (-CHO)</span>
              <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px]">Suffix: -al</span>
            </div>
            <div class="text-slate-300">General Formula: <strong class="text-white">R—CH=O</strong></div>
            <div class="text-slate-400 text-[11px]">Polar carbonyl group (C=O). Dipole-dipole interactions, easily oxidized.</div>
            <div class="text-slate-400 text-[11px]">Example: Ethanal / Acetaldehyde (CH₃CHO)</div>
          </div>

          <!-- Ketone -->
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-cyan-300 text-sm">Ketones (C=O)</span>
              <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px]">Suffix: -one</span>
            </div>
            <div class="text-slate-300">General Formula: <strong class="text-white">R—C(=O)—R'</strong></div>
            <div class="text-slate-400 text-[11px]">Internal carbonyl. Good dipolar solvent properties. Resistant to mild oxidation.</div>
            <div class="text-slate-400 text-[11px]">Example: Propan-2-one / Acetone (CH₃COCH₃)</div>
          </div>

          <!-- Carboxylic Acid -->
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-cyan-300 text-sm">Carboxylic Acids</span>
              <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px]">Suffix: -oic acid</span>
            </div>
            <div class="text-slate-300">General Formula: <strong class="text-white">R—COOH</strong></div>
            <div class="text-slate-400 text-[11px]">Forms stable H-bonded cyclic dimers. Exceptionally elevated boiling points. Weak acids.</div>
            <div class="text-slate-400 text-[11px]">Example: Ethanoic acid / Acetic acid (CH₃COOH)</div>
          </div>

          <!-- Ester -->
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-cyan-300 text-sm">Esters (-COOR)</span>
              <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px]">Suffix: -oate</span>
            </div>
            <div class="text-slate-300">General Formula: <strong class="text-white">R—COO—R'</strong></div>
            <div class="text-slate-400 text-[11px]">Fischer esterification product. Volatile, fragrant fruit aromas. No self H-bonding.</div>
            <div class="text-slate-400 text-[11px]">Example: Ethyl ethanoate (CH₃COOCH₂CH₃)</div>
          </div>

          <!-- Amine -->
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-cyan-300 text-sm">Amines (-NH₂)</span>
              <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px]">Suffix: -amine</span>
            </div>
            <div class="text-slate-300">General Formula: <strong class="text-white">R—NH₂, R₂NH, R₃N</strong></div>
            <div class="text-slate-400 text-[11px]">Organic bases. Nitrogen lone pair acts as Bronsted-Lowry base & nucleophile.</div>
            <div class="text-slate-400 text-[11px]">Example: Methanamine (CH₃NH₂)</div>
          </div>
        </div>
      </section>

      <!-- Part 3: Orbital Hybridization & Molecular Geometry -->
      <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-white tracking-tight">3. Carbon Orbital Hybridization & Bonding Theory</h3>
          <p class="text-xs text-slate-400 mt-1">Mathematical linear combination of atomic orbitals (LCAO) yielding directed hybrid geometries.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-base font-bold text-cyan-400">sp³ Hybridization</span>
              <span class="text-slate-500">25% s / 75% p</span>
            </div>
            <ul class="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
              <li>Geometry: <strong class="text-white">Tetrahedral</strong></li>
              <li>Ideal Bond Angle: <strong class="text-white">109.5°</strong></li>
              <li>Bonding: 4 equivalent σ (sigma) bonds</li>
              <li>C—C Bond Length: ~1.54 Å</li>
              <li>Classic Example: Methane (CH₄), Ethane (C₂H₆)</li>
            </ul>
          </div>

          <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-base font-bold text-cyan-400">sp² Hybridization</span>
              <span class="text-slate-500">33% s / 67% p</span>
            </div>
            <ul class="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
              <li>Geometry: <strong class="text-white">Trigonal Planar</strong></li>
              <li>Ideal Bond Angle: <strong class="text-white">120°</strong></li>
              <li>Bonding: 3 σ bonds + 1 lateral π bond (unhybridized 2p_z)</li>
              <li>C=C Bond Length: ~1.34 Å</li>
              <li>Classic Example: Ethene (C₂H₄), Benzene ring (C₆H₆)</li>
            </ul>
          </div>

          <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-base font-bold text-cyan-400">sp Hybridization</span>
              <span class="text-slate-500">50% s / 50% p</span>
            </div>
            <ul class="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
              <li>Geometry: <strong class="text-white">Linear</strong></li>
              <li>Ideal Bond Angle: <strong class="text-white">180°</strong></li>
              <li>Bonding: 2 σ bonds + 2 perpendicular π bonds</li>
              <li>C≡C Bond Length: ~1.20 Å</li>
              <li>Classic Example: Ethyne / Acetylene (C₂H₂), Carbon dioxide (CO₂)</li>
            </ul>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Render Static Inorganic Chemistry Educational Archive (#/archive/inorganic)
   */
  renderInorganicArchive() {
    const container = document.getElementById('inorganicArchiveContent');
    if (!container) return;

    container.innerHTML = `
      <!-- Part 1: VSEPR Theory Comprehensive Geometry Matrix -->
      <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-white tracking-tight">1. VSEPR Theory (Valence Shell Electron Pair Repulsion)</h3>
          <p class="text-xs text-slate-400 mt-1">Gillespie-Nyholm postulate: electron pairs adopt spatial orientations minimizing electrostatic repulsion: Lone Pair—Lone Pair > Lone Pair—Bonding Pair > Bonding Pair—Bonding Pair.</p>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table class="chem-table">
            <thead>
              <tr>
                <th class="text-left">Steric No.</th>
                <th class="text-left">Bonding Pairs</th>
                <th class="text-left">Lone Pairs</th>
                <th class="text-left">Electron Geometry</th>
                <th class="text-left">Molecular Geometry</th>
                <th class="text-left">Bond Angle</th>
                <th class="text-left">Representative Example</th>
              </tr>
            </thead>
            <tbody class="font-mono text-xs">
              <tr><td>2</td><td>2</td><td>0</td><td>Linear</td><td class="font-bold text-cyan-300">Linear</td><td>180°</td><td>BeCl₂, CO₂</td></tr>
              <tr><td>3</td><td>3</td><td>0</td><td>Trigonal Planar</td><td class="font-bold text-cyan-300">Trigonal Planar</td><td>120°</td><td>BF₃, SO₃</td></tr>
              <tr><td>3</td><td>2</td><td>1</td><td>Trigonal Planar</td><td class="font-bold text-amber-300">Bent</td><td>~119°</td><td>SO₂, NO₂⁻</td></tr>
              <tr><td>4</td><td>4</td><td>0</td><td>Tetrahedral</td><td class="font-bold text-cyan-300">Tetrahedral</td><td>109.5°</td><td>CH₄, CCl₄</td></tr>
              <tr><td>4</td><td>3</td><td>1</td><td>Tetrahedral</td><td class="font-bold text-amber-300">Trigonal Pyramidal</td><td>107.0°</td><td>NH₃, PCl₃</td></tr>
              <tr><td>4</td><td>2</td><td>2</td><td>Tetrahedral</td><td class="font-bold text-amber-300">Bent</td><td>104.5°</td><td>H₂O, H₂S</td></tr>
              <tr><td>5</td><td>5</td><td>0</td><td>Trigonal Bipyramidal</td><td class="font-bold text-cyan-300">Trigonal Bipyramidal</td><td>90°, 120°, 180°</td><td>PCl₅</td></tr>
              <tr><td>5</td><td>4</td><td>1</td><td>Trigonal Bipyramidal</td><td class="font-bold text-amber-300">Seesaw</td><td>&lt;90°, &lt;120°</td><td>SF₄</td></tr>
              <tr><td>5</td><td>3</td><td>2</td><td>Trigonal Bipyramidal</td><td class="font-bold text-amber-300">T-Shaped</td><td>&lt;90°</td><td>ClF₃</td></tr>
              <tr><td>5</td><td>2</td><td>3</td><td>Trigonal Bipyramidal</td><td class="font-bold text-cyan-300">Linear</td><td>180°</td><td>XeF₂, I₃⁻</td></tr>
              <tr><td>6</td><td>6</td><td>0</td><td>Octahedral</td><td class="font-bold text-cyan-300">Octahedral</td><td>90°</td><td>SF₆, [PF₆]⁻</td></tr>
              <tr><td>6</td><td>5</td><td>1</td><td>Octahedral</td><td class="font-bold text-amber-300">Square Pyramidal</td><td>&lt;90°</td><td>BrF₅, IF₅</td></tr>
              <tr><td>6</td><td>4</td><td>2</td><td>Octahedral</td><td class="font-bold text-cyan-300">Square Planar</td><td>90°</td><td>XeF₄, [PtCl₄]²⁻</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Part 2: Coordination Chemistry & Crystal Field Theory (CFT) -->
      <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-white tracking-tight">2. Coordination Chemistry & Crystal Field Theory (CFT)</h3>
          <p class="text-xs text-slate-400 mt-1">Alfred Werner's coordination theory and electrostatic splitting of degenerate d-orbitals under ligand fields.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <span class="text-base font-bold text-indigo-300 block">Octahedral Δₒ Orbital Splitting</span>
            <p class="text-slate-300 leading-relaxed font-sans text-xs">
              In an octahedral ligand field, electrostatic repulsion splits the five degenerate d-orbitals:
            </p>
            <ul class="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
              <li><strong class="text-cyan-300">e_g set (d_x²-y², d_z²):</strong> Point directly at incoming ligands; destabilized by +0.6 Δₒ.</li>
              <li><strong class="text-cyan-300">t₂g set (d_xy, d_yz, d_xz):</strong> Point between ligands; stabilized by -0.4 Δₒ.</li>
              <li><strong class="text-white">Color Origin:</strong> Visible light photons excite electrons across the Δₒ gap (d—d transitions: ΔE = hc/λ).</li>
            </ul>
          </div>

          <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <span class="text-base font-bold text-indigo-300 block">Spectrochemical Series</span>
            <p class="text-slate-300 leading-relaxed font-sans text-xs">
              Empirical ordering of ligands according to increasing field strength and magnitude of Δ splitting:
            </p>
            <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg text-cyan-300 text-[11px] leading-relaxed">
              I⁻ &lt; Br⁻ &lt; S²⁻ &lt; Cl⁻ &lt; NO₃⁻ &lt; F⁻ &lt; OH⁻ &lt; C₂O₄²⁻ &lt; H₂O &lt; NCS⁻ &lt; EDTA⁴⁻ &lt; NH₃ &lt; en &lt; NO₂⁻ &lt; CN⁻ &lt; CO
            </div>
            <p class="text-slate-400 text-[11px] font-sans">
              Weak-field ligands cause high-spin complexes (Δ &lt; pairing energy P). Strong-field ligands cause low-spin complexes (Δ &gt; P).
            </p>
          </div>
        </div>
      </section>

      <!-- Part 3: Crystal Lattices & Solid-State Chemistry -->
      <section class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-white tracking-tight">3. Crystal Lattices & 14 Bravais Unit Cells</h3>
          <p class="text-xs text-slate-400 mt-1">Solid-state crystallographic packing efficiency, coordination numbers, and X-ray diffraction fundamentals.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
          <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span class="font-bold text-cyan-300 text-sm block">Body-Centered Cubic (BCC)</span>
            <div>Net Atoms / Cell: <strong class="text-white">2</strong> (8×⅛ corner + 1 center)</div>
            <div>Coordination No.: <strong class="text-white">8</strong></div>
            <div>Packing Efficiency (APF): <strong class="text-cyan-400">68.0%</strong></div>
            <div>Lattice Relation: <strong class="text-slate-300">√3 a = 4 r</strong></div>
            <div class="text-[11px] text-slate-400 font-sans mt-2">Examples: α-Iron (Fe), Chromium (Cr), Tungsten (W), Sodium (Na)</div>
          </div>

          <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span class="font-bold text-cyan-300 text-sm block">Face-Centered Cubic (FCC)</span>
            <div>Net Atoms / Cell: <strong class="text-white">4</strong> (8×⅛ + 6×½ faces)</div>
            <div>Coordination No.: <strong class="text-white">12</strong></div>
            <div>Packing Efficiency (APF): <strong class="text-cyan-400">74.0% (Max)</strong></div>
            <div>Lattice Relation: <strong class="text-slate-300">√2 a = 4 r</strong></div>
            <div class="text-[11px] text-slate-400 font-sans mt-2">Examples: Copper (Cu), Aluminum (Al), Silver (Ag), Gold (Au)</div>
          </div>

          <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span class="font-bold text-cyan-300 text-sm block">Hexagonal Close-Packed (HCP)</span>
            <div>Net Atoms / Unit: <strong class="text-white">6</strong></div>
            <div>Coordination No.: <strong class="text-white">12</strong></div>
            <div>Packing Efficiency (APF): <strong class="text-cyan-400">74.0%</strong></div>
            <div>Layer Stacking: <strong class="text-slate-300">ABAB...</strong></div>
            <div class="text-[11px] text-slate-400 font-sans mt-2">Examples: Magnesium (Mg), Zinc (Zn), Titanium (Ti), Cobalt (Co)</div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Periodic Grid & Interactive Filtering
   */
  renderGrid() {
    const grid = document.getElementById('periodicGrid');
    if (!grid || !this.elements) return;

    grid.innerHTML = '';

    // Render 118 Elements
    this.elements.forEach(el => {
      const tile = document.createElement('div');
      tile.id = `elTile-${el.symbol}`;
      tile.className = 'element-cell element-tile group';
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', `${el.name}, Atomic Number ${el.atomic_number}, ${el.category || 'Element'}, ${el.phase || 'Solid'} at standard laboratory temperature`);
      tile.dataset.symbol = el.symbol;
      tile.dataset.atomicNumber = el.atomic_number;
      tile.dataset.phase = el.phase || 'Solid';
      tile.dataset.block = el.block || 's';
      tile.dataset.radioactive = el.is_radioactive ? 'true' : 'false';

      const catKey = this.normalizeCategoryKey(el.category);
      tile.dataset.category = catKey;
      tile.style.gridColumn = el.xpos;
      tile.style.gridRow = el.ypos;

      const catColor = this.categories[catKey]?.color || '#64748b';
      tile.style.setProperty('--tile-cat-color', catColor);

      const phase = this.simulateStateAtTemp(el, this.state.currentTempK).toLowerCase();
      const stateClass = ['solid', 'liquid', 'gas'].includes(phase) ? phase : 'unknown';
      const formattedMass = typeof el.atomic_mass === 'number' ? el.atomic_mass.toFixed(2) : (el.atomic_mass || '');

      tile.innerHTML = `
        <div class="tile-top-row">
          <span class="tile-num">${el.atomic_number}</span>
          <span class="state-dot ${stateClass}" title="Phase: ${phase}"></span>
        </div>
        <span class="tile-symbol" style="color: ${catColor}">${el.symbol}</span>
        <div class="tile-bottom-meta">
          <span class="tile-name">${el.name}</span>
          <span class="tile-mass">${formattedMass}</span>
        </div>
      `;

      // Event Listeners: Mouse click -> SPA navigation to dossier
      tile.addEventListener('click', () => {
        window.location.hash = `#/element/${el.atomic_number}`;
      });

      // Accessible Keyboard Navigation (Enter or Space)
      tile.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
          ev.preventDefault();
          window.location.hash = `#/element/${el.atomic_number}`;
        }
      });

      // Accessible Focus Handling
      tile.addEventListener('focus', () => {
        this.updateInspector(el);
      });

      tile.addEventListener('mouseenter', (ev) => {
        this.updateInspector(el);
        this.showTooltip(ev, el);
      });

      tile.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });

      grid.appendChild(tile);
    });

    // Row 6, Col 3: Lanthanide Placeholder Anchor
    const lanPlaceholder = document.createElement('div');
    lanPlaceholder.className = 'placeholder-cell lan-act-link cursor-pointer hover:border-pink-500/60 transition';
    lanPlaceholder.style.gridColumn = '3';
    lanPlaceholder.style.gridRow = '6';
    lanPlaceholder.title = 'Filter to Lanthanides series';
    lanPlaceholder.innerHTML = `
      <span class="font-mono text-pink-400 font-bold text-[10px]">57–71</span>
      <span class="font-semibold text-pink-300 text-[11px]">La–Lu</span>
      <span class="text-[8px] uppercase tracking-wider text-slate-400 font-mono">* Lanthanoids</span>
    `;
    lanPlaceholder.addEventListener('click', () => {
      this.state.seriesFilter = this.state.seriesFilter === 'lanthanide' ? 'all' : 'lanthanide';
      this.applyFilters();
    });
    grid.appendChild(lanPlaceholder);

    // Row 7, Col 3: Actinide Placeholder Anchor
    const actPlaceholder = document.createElement('div');
    actPlaceholder.className = 'placeholder-cell lan-act-link cursor-pointer hover:border-rose-500/60 transition';
    actPlaceholder.style.gridColumn = '3';
    actPlaceholder.style.gridRow = '7';
    actPlaceholder.title = 'Filter to Actinides series';
    actPlaceholder.innerHTML = `
      <span class="font-mono text-rose-400 font-bold text-[10px]">89–103</span>
      <span class="font-semibold text-rose-300 text-[11px]">Ac–Lr</span>
      <span class="text-[8px] uppercase tracking-wider text-slate-400 font-mono">** Actinoids</span>
    `;
    actPlaceholder.addEventListener('click', () => {
      this.state.seriesFilter = this.state.seriesFilter === 'actinide' ? 'all' : 'actinide';
      this.applyFilters();
    });
    grid.appendChild(actPlaceholder);

    // Row 8: Harmonious Separator Row
    const spacerRow = document.createElement('div');
    spacerRow.style.gridColumn = '1 / -1';
    spacerRow.style.gridRow = '8';
    spacerRow.style.height = '14px';
    spacerRow.className = 'pointer-events-none select-none';
    grid.appendChild(spacerRow);

    // Row 9, Cols 1-3: Lanthanide Series Label
    const lanLabel = document.createElement('div');
    lanLabel.className = 'series-badge-row cursor-pointer select-none';
    lanLabel.style.gridColumn = '1 / span 3';
    lanLabel.style.gridRow = '9';
    lanLabel.innerHTML = `
      <span class="px-2.5 py-1 rounded bg-pink-950/60 border border-pink-800/60 text-[11px] font-mono font-semibold text-pink-300 flex items-center gap-1.5 hover:border-pink-500 transition">
        <span class="w-2 h-2 rounded-full bg-pink-400"></span>
        * Lanthanides (57–71)
      </span>
    `;
    lanLabel.addEventListener('click', () => {
      this.state.seriesFilter = this.state.seriesFilter === 'lanthanide' ? 'all' : 'lanthanide';
      this.applyFilters();
    });
    grid.appendChild(lanLabel);

    // Row 10, Cols 1-3: Actinide Series Label
    const actLabel = document.createElement('div');
    actLabel.className = 'series-badge-row cursor-pointer select-none';
    actLabel.style.gridColumn = '1 / span 3';
    actLabel.style.gridRow = '10';
    actLabel.innerHTML = `
      <span class="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800/60 text-[11px] font-mono font-semibold text-rose-300 flex items-center gap-1.5 hover:border-rose-500 transition">
        <span class="w-2 h-2 rounded-full bg-rose-400"></span>
        ** Actinides (89–103)
      </span>
    `;
    actLabel.addEventListener('click', () => {
      this.state.seriesFilter = this.state.seriesFilter === 'actinide' ? 'all' : 'actinide';
      this.applyFilters();
    });
    grid.appendChild(actLabel);
  }

  renderLegend() {
    const bar = document.getElementById('seriesLegendBar');
    if (!bar) return;

    bar.innerHTML = Object.entries(this.categories).map(([key, cat]) => `
      <button data-cat="${key}" class="legend-chip px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 flex items-center gap-1.5 transition cursor-pointer">
        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${cat.color}"></span>
        <span class="font-medium">${cat.name}</span>
        <span class="text-[10px] font-mono text-slate-500">(${cat.count})</span>
      </button>
    `).join('');

    bar.querySelectorAll('.legend-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const catKey = btn.dataset.cat;
        if (this.state.seriesFilter === catKey) {
          this.state.seriesFilter = 'all';
          btn.classList.remove('ring-2', 'ring-cyan-400');
        } else {
          this.state.seriesFilter = catKey;
          bar.querySelectorAll('.legend-chip').forEach(b => b.classList.remove('ring-2', 'ring-cyan-400'));
          btn.classList.add('ring-2', 'ring-cyan-400');
        }
        this.applyFilters();
      });
    });
  }

  updateInspector(el) {
    if (!el) return;
    this.state.selectedElement = el;

    const drawer = document.getElementById('inspectorDrawer');
    if (drawer) drawer.classList.remove('hidden');

    const num = document.getElementById('insNum');
    const sym = document.getElementById('insSym');
    const name = document.getElementById('insName');
    const cat = document.getElementById('insCategory');
    const weight = document.getElementById('insWeight');
    const eneg = document.getElementById('insEneg');
    const config = document.getElementById('insConfig');
    const state = document.getElementById('insState');
    const block = document.getElementById('insBlock');
    const detailLink = document.getElementById('insDetailLink');

    if (num) num.textContent = el.atomic_number;
    const catColor = this.categories[this.normalizeCategoryKey(el.category)]?.color || '#38bdf8';
    if (sym) {
      sym.textContent = el.symbol;
      sym.style.color = catColor;
    }
    const tile = document.getElementById('insTile');
    if (tile) {
      tile.style.borderColor = catColor;
      tile.style.boxShadow = `0 0 12px ${catColor}33`;
    }
    if (name) name.textContent = el.name;
    if (cat) cat.textContent = el.category || 'Element';
    if (weight) weight.textContent = typeof el.atomic_mass === 'number' ? el.atomic_mass.toFixed(4) : el.atomic_mass;
    if (eneg) eneg.textContent = el.electronegativity || 'N/A';
    if (config) config.textContent = el.electron_configuration || '-';
    if (state) state.textContent = this.simulateStateAtTemp(el, this.state.currentTempK);
    if (block) block.textContent = `${el.block || 's'}-block`;
    if (detailLink) detailLink.href = `#/element/${el.atomic_number}`;
  }

  showTooltip(ev, el) {
    const tooltip = document.getElementById('chemTooltip');
    if (!tooltip) return;

    if (this.tooltipRafId) cancelAnimationFrame(this.tooltipRafId);
    this.tooltipRafId = requestAnimationFrame(() => {
      tooltip.innerHTML = `
        <div class="font-mono font-bold text-cyan-300 text-sm">${el.symbol} • ${el.name} (Z=${el.atomic_number})</div>
        <div class="text-[11px] text-slate-300 mt-1">Weight: ${typeof el.atomic_mass === 'number' ? el.atomic_mass.toFixed(3) : el.atomic_mass} u</div>
        <div class="text-[11px] text-slate-300">Phase at ${Math.round(this.state.currentTempK)} K: <strong class="text-white capitalize">${this.simulateStateAtTemp(el, this.state.currentTempK)}</strong></div>
        <div class="text-[10px] text-slate-400 font-mono mt-1">${el.electron_configuration || ''}</div>
      `;

      tooltip.style.opacity = '1';
      tooltip.style.left = `${Math.min(window.innerWidth - 260, ev.clientX + 16)}px`;
      tooltip.style.top = `${Math.min(window.innerHeight - 120, ev.clientY + 16)}px`;
    });
  }

  hideTooltip() {
    const tooltip = document.getElementById('chemTooltip');
    if (tooltip) tooltip.style.opacity = '0';
  }

  simulateStateAtTemp(el, tempK) {
    const melt = el.melting_point_k;
    const boil = el.boiling_point_k;

    if (!melt && !boil) return el.phase || 'Solid';
    if (melt && tempK < melt) return 'Solid';
    if (boil && tempK > boil) return 'Gas';
    if (melt && boil && tempK >= melt && tempK <= boil) return 'Liquid';
    if (melt && !boil && tempK >= melt) return 'Liquid';
    return el.phase || 'Solid';
  }

  applyFilters() {
    if (this.filterRafId) cancelAnimationFrame(this.filterRafId);
    this.filterRafId = requestAnimationFrame(() => this.runApplyFilters());
  }

  runApplyFilters() {
    let visibleCount = 0;
    let solidCount = 0;
    let liquidCount = 0;
    let gasCount = 0;
    const tiles = document.querySelectorAll('.element-tile');
    const query = (this.state.searchQuery || '').toLowerCase();

    tiles.forEach(tile => {
      const sym = tile.dataset.symbol;
      const el = this.elementsBySymbol.get(sym.toUpperCase());
      if (!el) return;

      const simulatedPhase = this.simulateStateAtTemp(el, this.state.currentTempK).toLowerCase();
      if (simulatedPhase === 'solid') solidCount++;
      else if (simulatedPhase === 'liquid') liquidCount++;
      else if (simulatedPhase === 'gas') gasCount++;

      let match = true;

      // 1. Text Search Query (symbol, name, atomic number, category, block)
      if (query) {
        const symMatch = el.symbol.toLowerCase().includes(query);
        const nameMatch = el.name.toLowerCase().includes(query);
        const numMatch = String(el.atomic_number) === query;
        const catMatch = (el.category || '').toLowerCase().includes(query);
        const blockMatch = query === `${el.block}-block` || query === el.block;
        if (!symMatch && !nameMatch && !numMatch && !catMatch && !blockMatch) match = false;
      }

      // 2. State Filter (simulated at current temperature)
      if (match && this.state.stateFilter !== 'all') {
        if (simulatedPhase !== this.state.stateFilter) match = false;
      }

      // 3. Block Filter
      if (match && this.state.blockFilter !== 'all') {
        if ((el.block || '').toLowerCase() !== this.state.blockFilter) match = false;
      }

      // 4. Series Filter
      if (match && this.state.seriesFilter !== 'all') {
        const catKey = this.normalizeCategoryKey(el.category);
        if (catKey !== this.state.seriesFilter) match = false;
      }

      // 5. Radioactive toggle
      if (match && this.state.radioactiveOnly) {
        if (!el.is_radioactive) match = false;
      }

      if (match) {
        visibleCount++;
        tile.classList.remove('dimmed');
      } else {
        tile.classList.add('dimmed');
      }

      // Heatmap property styling
      if (this.state.heatmapProperty !== 'none') {
        this.applyHeatmapToTile(tile, el);
      } else {
        tile.style.removeProperty('background');
        tile.style.borderColor = '';
      }
    });

    // Update Live State Summary
    const summary = document.getElementById('tempStateSummary');
    if (summary) {
      summary.textContent = `${solidCount} S • ${liquidCount} L • ${gasCount} G`;
    }

    // Update Filter Banner
    const banner = document.getElementById('filterBanner');
    const bannerText = document.getElementById('filterBannerText');
    if (banner && bannerText) {
      const isFiltered = (
        this.state.searchQuery || 
        this.state.stateFilter !== 'all' || 
        this.state.blockFilter !== 'all' || 
        this.state.seriesFilter !== 'all' || 
        this.state.radioactiveOnly
      );
      if (isFiltered) {
        banner.classList.remove('hidden');
        bannerText.textContent = `Showing ${visibleCount} of 118 elements`;
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  applyHeatmapToTile(tile, el) {
    const prop = this.state.heatmapProperty;
    let val = null;

    if (prop === 'electronegativity') val = el.electronegativity;
    else if (prop === 'atomic_mass') val = typeof el.atomic_mass === 'number' ? el.atomic_mass : parseFloat(el.atomic_mass);
    else if (prop === 'atomic_radius_pm') val = el.atomic_radius_pm;
    else if (prop === 'ionization') val = el.ionization_energy || el.ionization_energies?.[0];
    else if (prop === 'melting_point_k') val = el.melting_point_k;
    else if (prop === 'density') val = el.density;

    if (val === null || val === undefined || isNaN(val)) {
      tile.style.background = '#0a0f1d';
      return;
    }

    const bounds = {
      electronegativity: [0.7, 4.0],
      atomic_mass: [1, 294],
      atomic_radius_pm: [30, 300],
      ionization: [380, 2400],
      melting_point_k: [0, 3900],
      density: [0, 23]
    }[prop] || [0, 100];

    const ratio = Math.max(0, Math.min(1, (val - bounds[0]) / (bounds[1] - bounds[0])));
    
    // Spectral color interpolation
    const r = Math.round(16 + ratio * 220);
    const g = Math.round(40 + (1 - Math.abs(ratio - 0.5) * 2) * 160);
    const b = Math.round(180 - ratio * 140);

    tile.style.background = `rgba(${r}, ${g}, ${b}, 0.35)`;
    tile.style.borderColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
  }

  setupEventListeners() {
    // 1. Search Bar
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.trim();
        if (clearBtn) clearBtn.classList.toggle('hidden', !this.state.searchQuery);
        
        // If user is on an archive view, typing search can also navigate them to table or search
        const rawHash = window.location.hash || '#/';
        if (rawHash.startsWith('#/archive') && this.state.searchQuery) {
          window.location.hash = '#/';
        }
        this.applyFilters();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim();
          if (!q) return;
          // Look up element
          let el = this.elementsBySymbol.get(q.toUpperCase());
          if (!el && /^\d+$/.test(q)) el = this.elementsByNumber.get(parseInt(q, 10));
          if (!el) {
            el = this.elements.find(item => item.name.toLowerCase().includes(q.toLowerCase()));
          }
          if (el) {
            window.location.hash = `#/element/${el.atomic_number}`;
          }
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        this.state.searchQuery = '';
        clearBtn.classList.add('hidden');
        this.applyFilters();
      });
    }

    // 2. State Filters
    document.querySelectorAll('.filter-state-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-state-btn').forEach(b => {
          b.className = 'filter-state-btn px-2.5 py-1 rounded font-medium text-slate-300 hover:bg-slate-800 transition';
        });
        btn.className = 'filter-state-btn px-2.5 py-1 rounded font-medium bg-cyan-600 text-white transition';
        this.state.stateFilter = btn.dataset.state;
        this.applyFilters();
      });
    });

    // 3. Block Filters
    document.querySelectorAll('.filter-block-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-block-btn').forEach(b => {
          b.className = 'filter-block-btn px-2 py-1 rounded font-medium text-slate-300 hover:bg-slate-800 transition';
        });
        btn.className = 'filter-block-btn px-2 py-1 rounded font-medium bg-cyan-600 text-white transition';
        this.state.blockFilter = btn.dataset.block;
        this.applyFilters();
      });
    });

    // 4. Radioactivity Filter
    const radioFilter = document.getElementById('radioactiveFilter');
    if (radioFilter) {
      radioFilter.addEventListener('change', (e) => {
        this.state.radioactiveOnly = e.target.checked;
        this.applyFilters();
      });
    }

    // 5. Heatmap Select
    const heatSelect = document.getElementById('heatmapSelect');
    const heatLegend = document.getElementById('heatmapLegend');
    if (heatSelect) {
      heatSelect.addEventListener('change', (e) => {
        this.state.heatmapProperty = e.target.value;
        if (heatLegend) heatLegend.classList.toggle('hidden', this.state.heatmapProperty === 'none');
        this.applyFilters();
      });
    }

    // 6. Temperature Simulator & Quick Presets
    const tempSlider = document.getElementById('tempSlider');
    const tempDisplay = document.getElementById('tempDisplay');

    const updateTempUI = (k) => {
      this.state.currentTempK = k;
      const c = (k - 273.15).toFixed(0);
      if (tempDisplay) {
        tempDisplay.textContent = `${Math.round(k)} K (${c > 0 ? `+${c}` : c}°C)`;
      }
      this.applyFilters();
      if (this.state.selectedElement) {
        const stateEl = document.getElementById('insState');
        if (stateEl) stateEl.textContent = this.simulateStateAtTemp(this.state.selectedElement, k);
      }
    };

    if (tempSlider) {
      let tempAnnounceTimeout = null;
      tempSlider.addEventListener('input', (e) => {
        const k = parseFloat(e.target.value);
        updateTempUI(k);

        clearTimeout(tempAnnounceTimeout);
        tempAnnounceTimeout = setTimeout(() => {
          const c = (k - 273.15).toFixed(0);
          this.announceA11y(`Temperature set to ${Math.round(k)} Kelvin (${c}°C). Physical phases updated.`);
        }, 350);
      });
    }

    // Temperature Preset Buttons (0K, 273K, STP, 373K)
    document.querySelectorAll('.temp-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = parseFloat(btn.dataset.tempSet);
        if (isNaN(k)) return;
        if (tempSlider) tempSlider.value = String(Math.min(6000, Math.max(0, k)));
        updateTempUI(k);
        const c = (k - 273.15).toFixed(0);
        this.announceA11y(`Temperature set to ${Math.round(k)} Kelvin (${c}°C).`);
        this.showToast(`Temp: ${Math.round(k)} K (${c}°C)`, '🌡️');
      });
    });

    // 7. Reset Filters Button
    const resetBtn = document.getElementById('resetAllFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.classList.add('hidden');
        this.state.searchQuery = '';
        this.state.stateFilter = 'all';
        this.state.blockFilter = 'all';
        this.state.seriesFilter = 'all';
        this.state.radioactiveOnly = false;
        if (radioFilter) radioFilter.checked = false;

        document.querySelectorAll('.filter-state-btn').forEach((b, i) => {
          b.className = i === 0 ? 'filter-state-btn px-2.5 py-1 rounded font-medium bg-cyan-600 text-white transition' : 'filter-state-btn px-2.5 py-1 rounded font-medium text-slate-300 hover:bg-slate-800 transition';
        });
        document.querySelectorAll('.filter-block-btn').forEach((b, i) => {
          b.className = i === 0 ? 'filter-block-btn px-2 py-1 rounded font-medium bg-cyan-600 text-white transition' : 'filter-block-btn px-2 py-1 rounded font-medium text-slate-300 hover:bg-slate-800 transition';
        });
        document.querySelectorAll('.legend-chip').forEach(b => b.classList.remove('ring-2', 'ring-cyan-400'));

        this.applyFilters();
        this.announceA11y('All filters reset. Displaying all 118 elements.');
        this.showToast('All filters reset', '🔄');
      });
    }

    // 8. Close Inspector Button
    const closeIns = document.getElementById('closeInspectorBtn');
    if (closeIns) {
      closeIns.addEventListener('click', () => {
        const drawer = document.getElementById('inspectorDrawer');
        if (drawer) drawer.classList.add('hidden');
      });
    }

    // 9. Global Keyboard Shortcuts:
    // '/' or Cmd/Ctrl+K for search
    // 'T' to cycle visual themes
    // 'Escape' to close drawer/clear search
    window.addEventListener('keydown', (e) => {
      const isInputFocused = document.activeElement === searchInput || 
                             document.activeElement?.tagName === 'INPUT' || 
                             document.activeElement?.tagName === 'TEXTAREA';

      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && !isInputFocused) {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      } else if ((e.key === 't' || e.key === 'T') && !isInputFocused) {
        // Cycle to next theme
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextTheme = this.themes[(currentIndex + 1) % this.themes.length];
        this.setTheme(nextTheme, true);
      } else if (e.key === 'Escape') {
        const drawer = document.getElementById('inspectorDrawer');
        const themeMenu = document.getElementById('themeMenu');
        if (themeMenu && !themeMenu.classList.contains('hidden')) {
          themeMenu.classList.add('hidden');
        } else if (drawer && !drawer.classList.contains('hidden')) {
          drawer.classList.add('hidden');
        } else if (searchInput && document.activeElement === searchInput) {
          if (searchInput.value) {
            searchInput.value = '';
            this.state.searchQuery = '';
            if (clearBtn) clearBtn.classList.add('hidden');
            this.applyFilters();
          } else {
            searchInput.blur();
          }
        }
      }
    });

    // 10. Mobile Touch Gestures for Dossier
    this.setupDossierSwipeGestures();
  }

  /**
   * Native Touch Gestures: Swipe-to-navigate in Element Dossier
   * Left swipe -> Next element; Right swipe -> Previous element
   */
  setupDossierSwipeGestures() {
    const dossierView = document.getElementById('viewDossier');
    if (!dossierView) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    dossierView.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    dossierView.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const duration = Date.now() - touchStartTime;

      // Intentional swipe thresholds:
      // Minimum distance: 50px
      // Predominantly horizontal swipe: Math.abs(deltaX) > Math.abs(deltaY) * 1.3
      // Max duration: 750ms
      if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && duration <= 750) {
        const hash = (window.location.hash || '').replace(/^#/, '');
        if (!hash.startsWith('/element/')) return;

        const parts = hash.split('/');
        const currentZ = parseInt(parts[2], 10);
        if (isNaN(currentZ)) return;

        if (deltaX < -50) {
          // Swipe Left -> Next element (e.g. 1 -> 2)
          const nextZ = currentZ < 118 ? currentZ + 1 : 1;
          window.location.hash = `#/element/${nextZ}`;
          this.announceA11y(`Swiped to next element: atomic number ${nextZ}`);
        } else if (deltaX > 50) {
          // Swipe Right -> Previous element (e.g. 2 -> 1)
          const prevZ = currentZ > 1 ? currentZ - 1 : 118;
          window.location.hash = `#/element/${prevZ}`;
          this.announceA11y(`Swiped to previous element: atomic number ${prevZ}`);
        }
      }
    }, { passive: true });
  }

  setupPWA() {
    // Register Service Worker (robust relative path for GitHub Pages and subpaths)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        try {
          const swUrl = new URL('service-worker.js', window.location.href).href;
          navigator.serviceWorker.register(swUrl)
            .then(reg => {
              console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
              reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('[PWA] New version available; refresh to update.');
                    }
                  });
                }
              });
            })
            .catch(err => console.warn('[PWA] ServiceWorker registration notice:', err));
        } catch (e) {
          console.warn('[PWA] Service worker registration error:', e);
        }
      });
    }

    // Install prompt handler
    const installBtn = document.getElementById('pwaInstallBtn');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.state.deferredInstallPrompt = e;
      if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('inline-flex');
      }
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!this.state.deferredInstallPrompt) {
          // iOS Safari detection
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          if (isIOS) {
            const modal = document.getElementById('iosInstallModal');
            if (modal) modal.classList.remove('hidden');
          }
          return;
        }

        this.state.deferredInstallPrompt.prompt();
        const { outcome } = await this.state.deferredInstallPrompt.userChoice;
        console.log(`[PWA] Install prompt outcome: ${outcome}`);
        this.state.deferredInstallPrompt = null;
        installBtn.classList.add('hidden');
      });
    }

    const closeIOS = document.getElementById('closeIOSModalBtn');
    if (closeIOS) {
      closeIOS.addEventListener('click', () => {
        const modal = document.getElementById('iosInstallModal');
        if (modal) modal.classList.add('hidden');
      });
    }
  }
}

// Expose functions globally for debugging and direct access
if (typeof window !== 'undefined') {
  window.drawLewisDot = drawLewisDot;
  window.drawBohrModel = drawBohrModel;
}

// Instantiate application on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chemTableApp = new PeriodicTableApp();
  });
} else {
  window.chemTableApp = new PeriodicTableApp();
}

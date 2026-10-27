import { initAdhan, fetchExternalData, getHijriDateSafe, getDayInfo, fetchClientConfig, applyTheme, loadPrayerTimes } from './services.js';
import { DOM, headerContactsHTML, dstIconHTML } from './utils.js';
import './components.js';

// ==========================================
// CALENDRIER ANNUEL : orchestration des 12 pages
// ==========================================

// État global
let pageTemplate = null;
let clientConfig = null;

/**
 * Met à jour le contenu DOM d'une page spécifique (Header, Contacts)
 * à partir de la configuration client.
 * @param {HTMLElement} container - Le fragment ou l'élément de page cloné
 * @param {Object} config - Les données du client
 */
function updatePageDOM(container, config) {
    if (!config) return;

    DOM.setText('.org-fr', config.identity.name_fr, container);
    DOM.setText('.org-ta', config.identity.name_ta, container);
    DOM.setSrc('.logo-img', config.identity.logo_url, container);

    // Infos essentielles sous les noms
    const contacts = container.querySelector('.header-contacts');
    if (contacts) contacts.innerHTML = headerContactsHTML(config.contact);
}

/**
 * Point d'entrée principal
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialisation du Template
    const templateEl = document.getElementById('page-template');
    if (!templateEl) {
        console.error('Template #page-template introuvable !');
        return;
    }
    pageTemplate = templateEl.content;
    const appContainer = document.getElementById('app');

    // 2. Chargement Config Client & Horaires de prière (en parallèle)
    [clientConfig] = await Promise.all([fetchClientConfig(), loadPrayerTimes()]);

    if (clientConfig) {
        applyTheme(clientConfig);
        if (window.CONFIG && clientConfig.location) {
            Object.assign(window.CONFIG, clientConfig.location);
        }
    }

    // 3. Gestion des paramètres URL (Année / Mois)
    const urlParams = new URLSearchParams(window.location.search);
    let year = parseInt(urlParams.get('year')) || new Date().getFullYear() + 1;
    let monthParam = urlParams.get('month');

    // Redirection legacy (GitHub Pages 404 hack)
    const redirectPath = urlParams.get('redirect');
    if (redirectPath) {
        const match = redirectPath.match(/\/(\d{4})\/(\d{1,2})\/?$/);
        if (match) {
            year = parseInt(match[1]);
            monthParam = match[2];
            window.history.replaceState(null, null, redirectPath);
        }
    }

    const isAllMonths = !monthParam;
    const isCoverOnly = monthParam === 'cover'; // ?month=cover : couverture seule (tirage à part)
    let month = parseInt(monthParam);
    if (!isAllMonths && !isCoverOnly && (!month || month < 1 || month > 12)) month = 1;

    // 4. Fonction de rendu optimisée (DocumentFragment)
    const renderApp = () => {
        initAdhan();
        appContainer.innerHTML = ''; // Reset propre du conteneur
        const fragment = document.createDocumentFragment();

        if (isCoverOnly) {
            fragment.appendChild(createCoverNode(year));
        } else if (isAllMonths) {
            fragment.appendChild(createCoverNode(year));
            for (let m = 1; m <= 12; m++) {
                fragment.appendChild(createPageNode(year, m));
            }
        } else {
            fragment.appendChild(createPageNode(year, month));
        }
        appContainer.appendChild(fragment);
        document.fonts.ready.then(() => {
            fitMonthTitles(appContainer);
            fitMiniHeads(appContainer);
            drawCoverBackdrop(appContainer);
            fitCoverYear(appContainer);
        });
    };

    // Helper : Création d'une page unique
    const createPageNode = (y, m) => {
        const clone = pageTemplate.cloneNode(true);

        // Appliquer les textes du client
        updatePageDOM(clone, clientConfig);

        // Appliquer la logique calendrier
        updateZoneTitles(y, m, clone);
        updateLegend(y, m, clone);

        // Configurer les Web Components
        const calendar = clone.querySelector('ami-calendar-grid');
        const prayerTable = clone.querySelector('ami-prayer-table');
        if (calendar) {
            calendar.setAttribute('year', y);
            calendar.setAttribute('month', m);
        }
        if (prayerTable) {
            prayerTable.setAttribute('year', y);
            prayerTable.setAttribute('month', m);
        }
        return clone;
    };

    // Page de couverture : mise en page propre (template #cover-template)
    const createCoverNode = (y) => {
        const clone = document.getElementById('cover-template').content.cloneNode(true);
        updatePageDOM(clone, clientConfig);
        updateCover(y, clone);
        return clone;
    };

    // 5. Premier rendu
    renderApp();

    // 6. Mise à jour asynchrone (API Vacances/Fériés)
    fetchExternalData(renderApp).then(() => warnMissingData(year));
});

/**
 * Avertissement à l'écran (jamais imprimé) quand les jours fériés ou les vacances scolaires de l'année manquent :
 * page ouverte hors connexion, ou vacances pas encore publiées par l'Éducation nationale.
 * @param {number} year
 */
function warnMissingData(year) {
    document.querySelector('.data-warning')?.remove();
    const holidays = window.CONFIG?.schoolHolidays || [];
    const hasPublic = Object.keys(window.CONFIG?.publicHolidays || {}).some((d) => d.startsWith(`${year}-`));
    const lastEnd = holidays.reduce((max, h) => (h.end > max ? h.end : max), '');
    let message = '';
    if (!hasPublic || !holidays.some((h) => h.end >= `${year}-01-01` && h.start <= `${year}-12-31`)) {
        message = `Jours fériés ou vacances scolaires ${year} non chargés : connectez-vous à internet, puis rechargez la page avant d'imprimer.`;
    } else if (lastEnd < `${year}-12-01`) {
        const until = new Date(lastEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        message = `Vacances scolaires connues jusqu'au ${until} : les suivantes ne sont pas encore publiées par l'Éducation nationale.`;
    }
    if (!message) return;
    const banner = document.createElement('div');
    banner.className = 'data-warning';
    banner.setAttribute('role', 'status');
    banner.textContent = message;
    document.body.prepend(banner);
}

/**
 * Bandeau du mois : si les deux mois hégiriens ne tiennent pas sur la largeur (ex. Jumādā al-ūlā / Jumādā ath-thāniya),
 * le côté hégirien passe en taille réduite (quatre crans au plus : arabe, traductions, année grégorienne, arabe encore) plutôt que d'être coupé.
 * @param {HTMLElement} root
 */
function fitMonthTitles(root) {
    const overflows = (zone) => [zone, ...zone.querySelectorAll('.titles-hijri, .title-main, .title-sub')].some((e) => e.scrollWidth > e.clientWidth);
    root.querySelectorAll('.month-titles-zone').forEach((zone) => {
        const levels = ['is-compact', 'is-compact-2', 'is-compact-3', 'is-compact-4'];
        zone.classList.remove(...levels);
        for (const level of levels) {
            if (!overflows(zone)) break;
            zone.classList.add(level);
        }
    });
}

/**
 * Mois hégiriens d'un mini-mois, un par ligne. L'année hégirienne (plus d'en-tête dédié sur la couverture) est indiquée
 * au premier mois, puis seulement aux mois où elle change (Muharram).
 * @param {Map<string, string>} months - nom arabe → année hégirienne (chiffres arabes)
 * @param {{year: string|null}} state - dernière année hégirienne affichée, partagée entre les mini-mois
 */
const hijriLines = (months, state) =>
    [...months]
        .map(([name, y]) => {
            if (y === state.year) return `<span>${name}</span>`;
            state.year = y;
            return `<span>${name} <span class="mini-hijri-year">${y}</span></span>`;
        })
        .join('');

/**
 * Couverture : années et aperçu des 12 mois sur 5 semaines (vacances scolaires, Aïds et jours fériés repérés),
 * calculés comme dans les pages des mois (getHijriDateSafe, getDayInfo).
 */
function updateCover(year, container) {
    const hStart = getHijriDateSafe(new Date(year, 0, 1));
    const hEnd = getHijriDateSafe(new Date(year, 11, 31));
    // Année en deux parties : le siècle (« 20 ») en bleu clair, l'année du siècle (« 27 ») en bleu foncé
    const yearParts = `<tspan class="cover-year-century">${String(year).slice(0, 2)}</tspan><tspan class="cover-year-short">${String(year).slice(2)}</tspan>`;
    container.querySelectorAll('.cover-year-text').forEach((t) => (t.innerHTML = yearParts));
    container.querySelector('.cover-year')?.setAttribute('aria-label', year);
    // Années hégiriennes de chaque côté de l'année grégorienne, dans l'ordre chronologique (la même des deux côtés si l'année tient dans une seule)
    container.querySelector('.cover-hijri-start').textContent = hStart.yearAr;
    container.querySelector('.cover-hijri-end').textContent = hEnd.yearAr;

    const months = [];
    const hijriState = { year: hStart.yearAr }; // l'année de départ est dans l'en-tête
    for (let m = 0; m < 12; m++) {
        const first = new Date(year, m, 1);
        const days = new Date(year, m + 1, 0).getDate();
        // Grille de 5 semaines (35 cases), comme les pages des mois : les jours au-delà remontent dans les premières cases vides
        const offset = (first.getDay() + 6) % 7;
        const cells = Array.from({ length: 35 }, () => '<span></span>');
        const hijriMonths = new Map(); // nom arabe → année hégirienne
        for (let d = 1; d <= days; d++) {
            const date = new Date(year, m, d);
            const hijri = getHijriDateSafe(date);
            const info = getDayInfo(date, hijri);
            hijriMonths.set(hijri.monthNameAR, hijri.yearAr);
            const cls = [];
            if (info.isHoliday) cls.push('is-holiday');
            if (info.isEid) cls.push('is-eid');
            if (info.isPublicHoliday) cls.push('is-public');
            cells[(offset + d - 1) % 35] = `<span class="${cls.join(' ')}">${d}</span>`;
        }
        months.push(`<div class="mini-month">
            <div class="mini-head"><span class="mini-names"><span class="mini-name">${window.TEXTS?.fr.months[m] ?? ''}</span><span class="mini-name-ta tamil">${window.TEXTS?.ta.months[m] ?? ''}</span></span><span class="mini-hijri arabic">${hijriLines(hijriMonths, hijriState)}</span></div>
            <div class="mini-grid"><b>L</b><b>M</b><b>M</b><b>J</b><b>V</b><b>S</b><b>D</b>${cells.join('')}</div>
        </div>`);
    }
    const monthsBox = container.querySelector('.cover-months');
    if (monthsBox) monthsBox.innerHTML = months.join('');
}

/**
 * Couverture : cadre de l'année (SVG) ajusté aux chiffres une fois la police chargée,
 * pour que le dégradé et le motif couvrent exactement la hauteur des chiffres.
 * @param {HTMLElement} root
 */
function fitCoverYear(root) {
    root.querySelectorAll('svg.cover-year').forEach((svg) => {
        const text = svg.querySelector('.cover-year-text');
        const box = text?.getBBox();
        if (!box?.width) return;
        // Hauteur des chiffres seulement (≈ 0,72 em au-dessus de la ligne de base), sans l'interligne de la police
        const h = parseFloat(getComputedStyle(text).fontSize) * 0.72;
        svg.setAttribute('viewBox', `${box.x} ${-h} ${box.width} ${h}`);
        svg.setAttribute('width', box.width);
        svg.setAttribute('height', h);
        // Dégradés calés sur la hauteur des chiffres (et non sur la boîte de la police, plus haute) : contraste plein
        svg.querySelectorAll('linearGradient').forEach((g) => {
            g.setAttribute('gradientUnits', 'userSpaceOnUse');
            g.setAttribute('x1', 0);
            g.setAttribute('x2', 0);
            g.setAttribute('y1', -h);
            g.setAttribute('y2', 0);
        });
    });
}

/**
 * Couverture : en-têtes des mini-mois trop larges (mois hégiriens aux noms longs, ex. Rabīʿ al-awwal / Rabīʿ ath-thānī)
 * réduits par crans (arabe plus petit, puis nom français resserré) plutôt que de chevaucher le nom du mois.
 * @param {HTMLElement} root
 */
function fitMiniHeads(root) {
    const levels = ['is-compact', 'is-compact-2'];
    root.querySelectorAll('.mini-head').forEach((head) => {
        head.classList.remove(...levels);
        for (const level of levels) {
            if (head.scrollWidth <= head.clientWidth) break;
            head.classList.add(level);
        }
    });
}

/**
 * Couverture : fond des vacances scolaires de chaque mini-mois en SVG vectoriel, derrière les chiffres.
 * Une pastille arrondie par suite de jours consécutifs d'une même semaine, avec un léger retrait autour (les angles
 * arrondis restent visibles, y compris quand les vacances couvrent plusieurs semaines). Les Aïds sont des pastilles CSS
 * par-dessus.
 * @param {HTMLElement} root
 */
function drawCoverBackdrop(root) {
    const NS = 'http://www.w3.org/2000/svg';
    const RADIUS = 4; // px, comme l'arrondi des cases du calendrier des mois
    const INSET_X = 1; // px, retrait horizontal aux extrémités de la pastille
    const INSET_Y = 2; // px, retrait en haut et en bas : l’espace entre deux semaines est le double (à 1 px, il ne se voyait pas)
    root.querySelectorAll('.mini-grid').forEach((grid) => {
        grid.querySelector('.mini-backdrop')?.remove();
        const children = [...grid.children];
        const g = grid.getBoundingClientRect();
        const isHoliday = (i) => children[i]?.classList.contains('is-holiday');
        const rects = [];
        // Les 7 premiers enfants sont les initiales des jours : la grille des dates commence à l'indice 7
        for (let i = 7; i < children.length; i++) {
            if (!isHoliday(i)) continue;
            const col = (i - 7) % 7;
            let j = i;
            while (col + (j - i) < 6 && isHoliday(j + 1)) j++;
            const first = children[i].getBoundingClientRect();
            const last = children[j].getBoundingClientRect();
            const x = first.left - g.left + INSET_X;
            const y = first.top - g.top + INSET_Y;
            const w = last.right - first.left - 2 * INSET_X;
            const h = first.height - 2 * INSET_Y;
            rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS}" />`);
            i = j;
        }
        if (!rects.length) return;
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'mini-backdrop');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = rects.join('');
        grid.append(svg); // en dernier : ne décale pas les :nth-child des vendredis et dimanches
    });
}

/**
 * Légende du bas, propre à chaque mois : vacances scolaires et changement d'heure,
 * dans l'ordre chronologique. La bande reste affichée (même vide) : même composition chaque mois.
 */
function updateLegend(year, month, container) {
    const box = container.querySelector('.legend-box');
    if (!box) return;
    const items = []; // { day, html }, sans date : les jours sont repérables dans la grille
    const seen = new Set();
    const add = (key, day, html) => {
        if (seen.has(key)) return;
        seen.add(key);
        items.push({ day, html });
    };
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const info = getDayInfo(date, getHijriDateSafe(date));
        if (info.isHoliday && info.holidayName) {
            add(info.holidayName, d, `<span class="legend-color box-holiday"></span><span>${info.holidayName}</span>`);
        }
        if (info.isDST) {
            const label = info.dstType === 'summer' ? "Passage à l'heure d'été" : "Passage à l'heure d'hiver";
            add('dst', d, `<span class="legend-icon">${dstIconHTML(info.dstType)}</span><span>${label}</span>`);
        }
    }

    items.sort((x, y) => x.day - y.day);
    box.innerHTML = items.map((i) => `<div class="legend-item">${i.html}</div>`).join('');
}

/**
 * Met à jour les titres (Mois Grégorien, Mois Hégirien, Année).
 */
function updateZoneTitles(year, month, container) {
    if (typeof window.TEXTS === 'undefined') return;

    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    DOM.setText('.greg-month-fr', window.TEXTS.fr.months[jsMonth], container);
    DOM.setText('.greg-month-ta', window.TEXTS.ta.months[jsMonth], container);
    DOM.setText('.year-display', year, container);
    // En-tête de la première colonne du tableau des horaires : mois en trois langues
    DOM.setText('.th-month-fr', window.TEXTS.fr.months[jsMonth], container);
    DOM.setText('.th-month-ar', window.TEXTS.ar.months[jsMonth], container);
    DOM.setText('.th-month-ta', window.TEXTS.ta.months[jsMonth], container);

    const hijriStart = getHijriDateSafe(new Date(year, jsMonth, 1));
    const hijriEnd = getHijriDateSafe(new Date(year, jsMonth, daysInMonth));

    let hijriFrStr = '',
        hijriArMonths = '',
        hijriArYear = '',
        hijriTaStr = '';
    if (hijriStart.monthNameFR && hijriEnd.monthNameFR) {
        if (hijriStart.monthNameFR === hijriEnd.monthNameFR) {
            hijriFrStr = `${hijriStart.monthNameFR} ${hijriStart.year}`;
            hijriArMonths = hijriStart.monthNameAR;
            hijriArYear = hijriStart.yearAr;
            hijriTaStr = hijriStart.monthNameTA;
        } else {
            // Deux mois : formes abrégées des mois jumeaux (Rabīʿ I, Jumādā II…), même taille de texte que les autres mois
            hijriFrStr = `${hijriStart.monthNameShort} / ${hijriEnd.monthNameShort} ${hijriEnd.year}`;
            hijriArMonths = `${hijriStart.monthNameAR} / ${hijriEnd.monthNameAR}`;
            hijriArYear = hijriEnd.yearAr;
            hijriTaStr = `${hijriStart.monthNameTAShort} / ${hijriEnd.monthNameTAShort}`;
        }
    }
    DOM.setText('.hijri-month-fr', hijriFrStr, container);
    // Mois en gras, année plus légère (comme « MAI 2027 »)
    const hijriAr = container.querySelector('.hijri-month-ar');
    if (hijriAr) {
        const months = document.createElement('span');
        months.className = 'hijri-months';
        months.textContent = hijriArMonths;
        const yearEl = document.createElement('span');
        yearEl.className = 'hijri-year';
        yearEl.textContent = hijriArYear;
        hijriAr.replaceChildren(months, ' ', yearEl);
    }
    DOM.setText('.hijri-month-ta', hijriTaStr, container);
}

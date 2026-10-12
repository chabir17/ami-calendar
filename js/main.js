import { initAdhan, fetchExternalData, getHijriDateSafe, getDayInfo, fetchClientConfig, applyTheme, loadPrayerTimes } from './services.js';
import { DOM, contactsHTML } from './utils.js';
import './components.js';

// ==========================================
// 3. ORCHESTRATION & UI (Main)
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

    // Coordonnées en 4 colonnes (BIC sous l'IBAN)
    const contacts = container.querySelector('.header-contacts');
    if (contacts) contacts.innerHTML = contactsHTML(config.contact);
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
    let month = parseInt(monthParam);
    if (!isAllMonths && (!month || month < 1 || month > 12)) month = 1;

    // 4. Fonction de rendu optimisée (DocumentFragment)
    const renderApp = () => {
        initAdhan();
        appContainer.innerHTML = ''; // Reset propre du conteneur
        const fragment = document.createDocumentFragment();

        if (isAllMonths) {
            for (let m = 1; m <= 12; m++) {
                fragment.appendChild(createPageNode(year, m));
            }
        } else {
            fragment.appendChild(createPageNode(year, month));
        }
        appContainer.appendChild(fragment);
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

    // 5. Premier rendu
    renderApp();

    // 6. Mise à jour asynchrone (API Vacances/Fériés)
    fetchExternalData(renderApp);
});

/**
 * Jours vertueux affichés dans la légende (date hégirienne → libellé), d'après des hadiths authentiques :
 * Ramadan et ses 10 dernières nuits (al-Bukhārī 2020), 6 jours de Shawwāl (Muslim 1164),
 * 10 premiers jours de Dhū al-Ḥijja (al-Bukhārī 969), ʿArafa (Muslim 1162), jours de Tashrīq (Muslim 1141),
 * Tāsūʿāʾ et ʿĀshūrāʾ (Muslim 1134, 1162). Dates hégiriennes sous réserve de l'observation du croissant.
 */
const VIRTUOUS_DAYS = [
    { month: 'Ramaḍān', from: 1, to: 1, label: 'Début du Ramadan' },
    { month: 'Ramaḍān', from: 21, to: 21, label: '10 dernières nuits du Ramadan', since: true },
    { month: 'Shawwāl', from: 2, to: 2, label: '6 jours de Shawwāl', since: true },
    { month: 'Dhū al-Ḥijjah', from: 1, to: 1, label: '10 jours de Dhū al-Ḥijja', since: true },
    { month: 'Dhū al-Ḥijjah', from: 9, to: 9, label: 'Jour de ʿArafa' },
    { month: 'Dhū al-Ḥijjah', from: 11, to: 13, label: 'Tashrīq' },
    { month: 'Muḥarram', from: 9, to: 10, label: 'Tāsūʿāʾ et ʿĀshūrāʾ' }
];

/**
 * Légende du bas, propre à chaque mois : jours vertueux, vacances scolaires et changement d'heure,
 * dans l'ordre chronologique. La bande est masquée si le mois n'a aucun événement.
 */
function updateLegend(year, month, container) {
    const box = container.querySelector('.legend-box');
    if (!box) return;
    const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
    const items = []; // { day, html }
    const seenHolidays = new Set();
    const virtuous = new Map(); // libellé → { first, last, since }
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const hijri = getHijriDateSafe(date);
        const info = getDayInfo(date, hijri);
        const hDay = parseInt(hijri.day, 10);

        for (const v of VIRTUOUS_DAYS) {
            if (hijri.monthNameFR === v.month && hDay >= v.from && hDay <= v.to) {
                const r = virtuous.get(v.label) || { first: d, last: d, since: v.since };
                r.last = d;
                virtuous.set(v.label, r);
            }
        }
        if (info.isHoliday && info.holidayName && !seenHolidays.has(info.holidayName)) {
            seenHolidays.add(info.holidayName);
            items.push({ day: d, html: `<span class="legend-color box-holiday"></span><span>${info.holidayName}</span>` });
        }
        if (info.isDST) {
            const summer = info.dstType === 'summer';
            const icon = `<span class="legend-icon"><svg class="icon"><use href="assets/icons/icon-dst-${summer ? 'forward' : 'back'}.svg#icon"></use></svg></span>`;
            items.push({ day: d, html: `${icon}<span>${summer ? "Heure d'été (+1 h)" : "Heure d'hiver (−1 h)"} : ${fmt.format(date)}</span>` });
        }
    }
    for (const [label, { first, last, since }] of virtuous) {
        const a = fmt.format(new Date(year, month - 1, first));
        const when = since ? `dès le ${a}` : first === last ? a : `${first}–${fmt.format(new Date(year, month - 1, last))}`;
        items.push({ day: first, html: `<span class="legend-star"></span><span>${label} : ${when}</span>` });
    }

    items.sort((x, y) => x.day - y.day);
    box.innerHTML = items.map((i) => `<div class="legend-item">${i.html}</div>`).join('');
    DOM.setDisplay('.legend-box', items.length > 0, container);
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
            hijriFrStr = `${hijriStart.monthNameFR} / ${hijriEnd.monthNameFR} ${hijriEnd.year}`;
            hijriArMonths = `${hijriStart.monthNameAR} / ${hijriEnd.monthNameAR}`;
            hijriArYear = hijriEnd.yearAr;
            hijriTaStr = `${hijriStart.monthNameTA} / ${hijriEnd.monthNameTA}`;
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

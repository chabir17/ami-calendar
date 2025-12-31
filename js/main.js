import { initAdhan, fetchExternalData, getHijriDateSafe, getDayInfo } from './services.js';
import { DOM } from './utils.js';
import './components.js';

// ==========================================
// 3. ORCHESTRATION & UI (Main)
// ==========================================

// État global
let pageTemplate = null;
let clientConfig = null;

/**
 * Récupère la configuration client (JSON) sans modifier le DOM.
 */
async function fetchClientConfig() {
    const params = new URLSearchParams(window.location.search);
    const mosqueId = params.get('mosque');
    if (!mosqueId) return null;

    try {
        const response = await fetch(`clients/${mosqueId}.json`);
        if (!response.ok) throw new Error('Client introuvable');
        return await response.json();
    } catch (e) {
        console.error('Erreur chargement config client:', e);
        return null;
    }
}

/**
 * Applique le thème global (Couleurs, Fonts) au document.
 * Ces changements s'appliquent une seule fois à la racine.
 */
async function applyGlobalTheme(config) {
    if (!config) return;
    const root = document.documentElement;

    // Thème couleur
    if (config.theme.color_brand) {
        root.style.setProperty('--brand', config.theme.color_brand);

        // Pattern SVG dynamique
        try {
            const res = await fetch('assets/patterns/background-pattern.svg');
            let svgText = await res.text();
            svgText = svgText.replace(/#d4af37/gi, config.theme.color_brand);
            const dataUri = 'data:image/svg+xml;base64,' + btoa(svgText);
            root.style.setProperty('--bg-pattern-custom', `url('${dataUri}')`);
        } catch (e) {
            console.warn('Erreur chargement pattern:', e);
        }
    }
    if (config.theme.bg_header) {
        root.style.setProperty('--brand-light', config.theme.bg_header);
    }

    // Config Adhan globale
    if (window.CONFIG) {
        window.CONFIG.lat = config.location.lat;
        window.CONFIG.lng = config.location.lng;
    }
}

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

    // Mise à jour des contacts (HTML complexe)
    const headerRight = container.querySelector('.header-right');
    if (headerRight) {
        const iconLoc = `<svg class="icon"><use href="assets/icons/icon-location.svg#icon"></use></svg>`;
        const iconPhone = `<svg class="icon"><use href="assets/icons/icon-phone.svg#icon"></use></svg>`;
        const iconEmail = `<svg class="icon"><use href="assets/icons/icon-email.svg#icon"></use></svg>`;

        headerRight.innerHTML = `
            <div>${iconLoc} ${config.contact.addr1}</div>
            ${config.contact.addr2 ? `<div>${iconLoc} ${config.contact.addr2}</div>` : ''}
            <div class="contact-row">
                <div class="contact-col">${iconPhone} ${config.contact.phone}</div>
                <div class="contact-col">${iconEmail} ${config.contact.email}</div>
            </div>
        `;
    }
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

    // 2. Chargement & Application Config Client
    clientConfig = await fetchClientConfig();
    await applyGlobalTheme(clientConfig);

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
        updateLegends(y, m, clone);
        updateZoneTitles(y, m, clone);

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
    fetchExternalData().then((shouldUpdate) => {
        if (shouldUpdate) renderApp();
    });
});

/**
 * Met à jour l'affichage des légendes (Changement d'heure, Aïd) selon le mois.
 */
function updateLegends(year, month, container) {
    // 1. Changement d'heure (Mars/Octobre)
    const isDstMonth = month === 3 || month === 10;
    const legendDst = DOM.setDisplay('.legend-dst', isDstMonth, container);

    if (legendDst && isDstMonth) {
        const legendText = legendDst.querySelector('span:last-child');
        const isSummer = month === 3;
        if (legendText) legendText.textContent = isSummer ? "Heure d'été (+1h)" : "Heure d'hiver (-1h)";

        // Mise à jour de l'icône si c'est une balise img
        const iconFile = isSummer ? 'clock-plus.svg' : 'clock-minus.svg';
        DOM.setSrc('img', `assets/icons/icon-${iconFile}`, legendDst);
    }

    // 2. Légende Aïd & Vacances
    let hasEid = false;
    let eidName = '';
    let hasPublicHoliday = false;
    let newMoonMonthName = null;
    const holidayNames = new Set();
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, jsMonth, d);
        const hijriDate = getHijriDateSafe(date);
        const info = getDayInfo(date, hijriDate);

        if (info.isEid) {
            hasEid = true;
            eidName = info.label;
        }
        if (info.isPublicHoliday) hasPublicHoliday = true;
        if (info.isHoliday && info.holidayName) holidayNames.add(info.holidayName);
        if (info.isNewMoon) newMoonMonthName = hijriDate.monthNameFR;
    }

    const elEid = DOM.setDisplay('.legend-eid', hasEid, container);
    if (elEid && hasEid) elEid.querySelector('span:last-child').textContent = eidName || 'Aïd';

    const elHoliday = DOM.setDisplay('.legend-holiday', holidayNames.size > 0, container);
    if (elHoliday && holidayNames.size > 0) {
        elHoliday.querySelector('span:last-child').textContent = Array.from(holidayNames).join(' / ');
    }

    DOM.setDisplay('.legend-public', hasPublicHoliday, container);

    const elMoon = DOM.setDisplay('.legend-moon', !!newMoonMonthName, container);
    if (elMoon && newMoonMonthName) {
        elMoon.querySelector('span:last-child').textContent = newMoonMonthName;
    }
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
        hijriArStr = '';
    if (hijriStart.monthNameFR && hijriEnd.monthNameFR) {
        if (hijriStart.monthNameFR === hijriEnd.monthNameFR) {
            hijriFrStr = `${hijriStart.monthNameFR} ${hijriStart.year}`;
            hijriArStr = `${hijriStart.monthNameAR} ${hijriStart.yearAr}`;
        } else {
            hijriFrStr = `${hijriStart.monthNameFR} / ${hijriEnd.monthNameFR} ${hijriEnd.year}`;
            hijriArStr = `${hijriStart.monthNameAR} / ${hijriEnd.monthNameAR} ${hijriEnd.yearAr}`;
        }
    }
    DOM.setText('.hijri-month-fr', hijriFrStr, container);
    DOM.setText('.hijri-month-ar', hijriArStr, container);
}

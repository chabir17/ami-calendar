import { initAdhan, fetchExternalData, getHijriDateSafe, getDayInfo, fetchClientConfig, applyTheme, loadPrayerTimes } from './services.js';
import { DOM } from './utils.js';
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

    // Mise à jour des coordonnées : colonnes (adresses | téléphone, e-mail | site, banque)
    const contacts = container.querySelector('.header-contacts');
    if (contacts) {
        const c = config.contact;
        const line = (icon, text) => `<div class="info-line"><svg class="icon"><use href="assets/icons/icon-${icon}.svg#icon"></use></svg> <span>${text}</span></div>`;
        const group = (lines) => `<div class="contact-group">${lines.filter(Boolean).join('')}</div>`;

        contacts.innerHTML = [
            group([line(c.addr1_icon || 'location', c.addr1), c.addr2 && line(c.addr2_icon || 'location', c.addr2)]),
            group([line('phone', c.phone), line('email', c.email)]),
            group([c.website && line('website', c.website), c.bank && line('bank', `IBAN : ${c.bank.iban} • BIC : ${c.bank.bic}`)])
        ].join('');
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

    // 2. Chargement Config Client & Horaires de prière (en parallèle)
    [clientConfig] = await Promise.all([fetchClientConfig(), loadPrayerTimes()]);

    if (clientConfig) {
        await applyTheme(clientConfig);
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
    fetchExternalData(renderApp);
});

/**
 * Met à jour la bande du bas : vacances scolaires du mois (masquées s'il n'y en a pas)
 * et citation du mois hégirien en cours au 15 du mois (data/citations.js).
 */
function updateLegends(year, month, container) {
    const holidayNames = new Set();
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, jsMonth, d);
        const info = getDayInfo(date, getHijriDateSafe(date));
        if (info.isHoliday && info.holidayName) holidayNames.add(info.holidayName);
    }

    DOM.setDisplay('.legend-item', holidayNames.size > 0, container);
    DOM.setText('.legend-holiday-name', Array.from(holidayNames).join(' / '), container);

    const quote = window.CITATIONS?.[getHijriDateSafe(new Date(year, jsMonth, 15)).monthNameFR];
    DOM.setDisplay('.month-quote', !!quote, container, 'block');
    if (quote) {
        DOM.setText('.quote-text', `« ${quote.text} »`, container);
        DOM.setText('.quote-source', `— ${quote.source}`, container);
    }
    DOM.setDisplay('.legend-box', holidayNames.size > 0 || !!quote, container);
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
    DOM.setText('.greg-month-ar', window.TEXTS.ar.months[jsMonth], container);
    DOM.setText('.year-display', year, container);

    const hijriStart = getHijriDateSafe(new Date(year, jsMonth, 1));
    const hijriEnd = getHijriDateSafe(new Date(year, jsMonth, daysInMonth));

    let hijriFrStr = '',
        hijriArStr = '',
        hijriTaStr = '';
    if (hijriStart.monthNameFR && hijriEnd.monthNameFR) {
        if (hijriStart.monthNameFR === hijriEnd.monthNameFR) {
            hijriFrStr = `${hijriStart.monthNameFR} ${hijriStart.year}`;
            hijriArStr = `${hijriStart.monthNameAR} ${hijriStart.yearAr}`;
            hijriTaStr = hijriStart.monthNameTA;
        } else {
            hijriFrStr = `${hijriStart.monthNameFR} / ${hijriEnd.monthNameFR} ${hijriEnd.year}`;
            hijriArStr = `${hijriStart.monthNameAR} / ${hijriEnd.monthNameAR} ${hijriEnd.yearAr}`;
            hijriTaStr = `${hijriStart.monthNameTA} / ${hijriEnd.monthNameTA}`;
        }
    }
    DOM.setText('.hijri-month-fr', hijriFrStr, container);
    DOM.setText('.hijri-month-ar', hijriArStr, container);
    DOM.setText('.hijri-month-ta', hijriTaStr, container);
}

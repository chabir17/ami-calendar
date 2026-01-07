import { initAdhan, getHijriDateSafe, getPrayerTimesSafe } from './services.js';
import { DOM } from './utils.js';

// --- Configuration & Helpers ---

async function fetchClientConfig() {
    const params = new URLSearchParams(window.location.search);
    const mosqueId = params.get('mosque') || 'ami93120';
    try {
        const response = await fetch(`clients/${mosqueId}.json`);
        if (!response.ok) throw new Error(`Client ${mosqueId} introuvable`);
        return await response.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function fetchOverrides() {
    try {
        const response = await fetch('data/ramadan_overrides.json');
        return response.ok ? await response.json() : {};
    } catch (e) {
        return {};
    }
}

async function applyTheme(config) {
    if (!config.theme.color_brand) return;

    document.documentElement.style.setProperty('--brand', config.theme.color_brand);

    try {
        const res = await fetch('assets/patterns/background-pattern.svg');
        if (res.ok) {
            let svgText = await res.text();
            svgText = svgText.replace(/#d4af37/gi, config.theme.color_brand);
            const dataUri = `data:image/svg+xml;base64,${btoa(svgText)}`;
            document.documentElement.style.setProperty('--bg-pattern-custom', `url('${dataUri}')`);
        }
    } catch (e) {
        console.warn('Erreur chargement pattern:', e);
    }
}

function renderLayout(container, config, year, hijriYearAr) {
    const { identity, contact } = config;

    DOM.setText('.org-fr', identity.name_fr, container);
    DOM.setText('.org-ta', identity.name_ta, container);
    DOM.setSrc('.logo-img', identity.logo_url, container);

    // Titre Principal
    const titleEl = container.querySelector('.ramadan-main-title');
    if (titleEl) {
        DOM.setText('.year-corner.top-left', year, titleEl);
        DOM.setText('.year-corner.top-right', hijriYearAr, titleEl);
    }

    // Footer Contacts
    // Helper pour remplir les champs contacts
    const setContact = (selector, value) => {
        const el = DOM.setDisplay(selector, !!value, container);
        if (el && value) {
            const span = el.querySelector('span');
            if (span) span.textContent = value;
        }
    };

    setContact('.contact-addr1', contact.addr1);
    setContact('.contact-addr2', contact.addr2);
    setContact('.contact-phone', contact.phone);
    setContact('.contact-email', contact.email);
    setContact('.contact-website', contact.website);

    if (contact.bank) {
        setContact('.contact-bank', `IBAN : ${contact.bank.iban} | BIC : ${contact.bank.bic}`);
    } else {
        DOM.setDisplay('.contact-bank', false, container);
    }
}

// --- Main Logic ---

document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const template = document.getElementById('ramadan-template');

    // 1. Chargement Config
    const [config, overrides] = await Promise.all([fetchClientConfig(), fetchOverrides()]);

    if (!config) {
        app.innerHTML = '<div style="padding:2rem; text-align:center;">Configuration introuvable.</div>';
        return;
    }

    // 2. Initialisation
    await applyTheme(config);

    if (window.CONFIG) {
        Object.assign(window.CONFIG, config.location);
    }
    initAdhan();

    // 3. Détermination de la période de Ramadan (Année en cours par défaut)
    const urlParams = new URLSearchParams(window.location.search);
    const year = parseInt(urlParams.get('year')) || new Date().getFullYear();

    const ramadanDays = [];
    let hijriYearAr = '';

    const dateCursor = new Date(year, 0, 1);
    const endScan = new Date(year, 11, 31);

    while (dateCursor <= endScan) {
        const hijri = getHijriDateSafe(dateCursor);

        if (hijri.monthNameAR?.includes('رمضان')) {
            if (!hijriYearAr) hijriYearAr = hijri.yearAr;
            ramadanDays.push({ date: new Date(dateCursor), hijri });
        }
        dateCursor.setDate(dateCursor.getDate() + 1);
    }

    // 4. Rendu
    const clone = template.content.cloneNode(true);
    renderLayout(clone, config, year, hijriYearAr);

    const tbody = clone.querySelector('tbody');
    const fragment = document.createDocumentFragment();

    // Formatteurs pour éviter la réinstanciation dans la boucle
    const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
    const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
    const daysShortList = window.TEXTS?.fr?.daysShort;

    ramadanDays.forEach(({ date, hijri }) => {
        const times = getPrayerTimesSafe(date);
        const dateKey = date.toISOString().split('T')[0];

        if (overrides[dateKey]) Object.assign(times, overrides[dateKey]);

        const tr = document.createElement('tr');
        if (date.getDay() === 5) tr.classList.add('is-friday');

        const dayOfWeekIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const dayShort = daysShortList ? daysShortList[dayOfWeekIdx] : dayFormatter.format(date);
        const dayNum = date.getDate().toString().padStart(2, '0');
        const monthShort = monthFormatter.format(date).replace('.', '');

        tr.innerHTML = `
            <td class="col-day-name">${dayShort}</td>
            <td class="col-day-num">${dayNum}</td>
            <td class="col-month-name">${monthShort}</td>
            <td class="fajr">${times.fajr}</td>
            <td class="sunrise">${times.sunrise}</td>
            <td class="dhuhr">${times.dhuhr}</td>
            <td class="asr">${times.asr}</td>
            <td class="maghrib">${times.maghrib}</td>
            <td class="isha">${times.isha}</td>
            <td class="col-hijri">${hijri.day}</td>
        `;
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    app.appendChild(clone);
});

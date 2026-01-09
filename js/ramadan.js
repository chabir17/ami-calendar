import { initAdhan, getHijriDateSafe, getPrayerTimesSafe, fetchClientConfig, fetchRamadanOverrides, applyTheme } from './services.js';
import { DOM } from './utils.js';

// --- Configuration & Helpers ---

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

/**
 * Génère le QR Code de manière sécurisée
 */
function generateQRCode(container, config) {
    if (typeof QRCode === 'undefined' || !container) return;

    // Priorité : URL de don > Site Web > Fallback
    const url = config.contact?.donation_url || config.contact?.website || 'https://www.helloasso.com/associations/ami93';

    container.innerHTML = ''; // Nettoyage
    new QRCode(container, {
        text: url,
        width: 80,
        height: 80,
        colorDark: config.theme?.color_brand || '#0e1d3e',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// --- Main Logic ---

document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const template = document.getElementById('ramadan-template');

    // 1. Chargement Config
    const [config, overrides] = await Promise.all([fetchClientConfig('ami93120'), fetchRamadanOverrides()]);

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

    // Mise à jour dynamique des mois (ex: Févr. / Mars)
    const uniqueMonths = [...new Set(ramadanDays.map((d) => d.date.getMonth()))].sort((a, b) => a - b);
    if (uniqueMonths.length > 0) {
        const fmtFr = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
        const fmtTa = new Intl.DateTimeFormat('ta-IN', { month: 'long' });
        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

        const labelFr = uniqueMonths.map((m) => capitalize(fmtFr.format(new Date(year, m, 1)))).join(' / ');
        const labelTa = uniqueMonths.map((m) => fmtTa.format(new Date(year, m, 1))).join(' / ');

        const thStack = clone.querySelector('.ramadan-table thead th:first-child .th-stack');
        DOM.setText('.th-fr', labelFr, thStack);
        DOM.setText('.th-ta', labelTa, thStack);
    }

    const tbody = clone.querySelector('tbody');
    const fragment = document.createDocumentFragment();

    // Formatteurs pour éviter la réinstanciation dans la boucle
    const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
    const daysShortList = window.TEXTS?.fr?.daysShort;
    const daysArabicList = window.TEXTS?.ar?.days;
    const daysTamilList = window.TEXTS?.ta?.days;

    ramadanDays.forEach(({ date, hijri }) => {
        const times = getPrayerTimesSafe(date);
        // Génération de la clé de date locale (YYYY-MM-DD) pour correspondre au JSON
        const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');

        if (overrides[dateKey]) {
            Object.entries(overrides[dateKey]).forEach(([key, value]) => {
                if (value) times[key] = value;
            });
        }

        const tr = document.createElement('tr');
        if (date.getDay() === 5) tr.classList.add('is-friday');

        const dayOfWeekIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const dayShort = daysShortList ? daysShortList[dayOfWeekIdx] : dayFormatter.format(date);
        const dayArabic = daysArabicList ? daysArabicList[dayOfWeekIdx] : '';
        const dayTamil = daysTamilList ? daysTamilList[dayOfWeekIdx] : '';
        const dayNum = date.getDate().toString().padStart(2, '0');

        tr.innerHTML = `
            <td class="col-day-name">${dayShort}</td>
            <td class="col-day-name tamil">${dayTamil}</td>
            <td class="col-day-num">${dayNum}</td>
            <td class="fajr">${times.fajr}</td>
            <td class="sunrise">${times.sunrise}</td>
            <td class="dhuhr">${times.dhuhr}</td>
            <td class="asr">${times.asr}</td>
            <td class="maghrib">${times.maghrib}</td>
            <td class="isha">${times.isha}</td>
            <td class="col-hijri">${hijri.day.toString().padStart(2, '0')}</td>
            <td class="col-day-name arabic">${dayArabic}</td>
        `;
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    app.appendChild(clone);

    // Génération du QR Code
    generateQRCode(document.getElementById('qrcode'), config);
});

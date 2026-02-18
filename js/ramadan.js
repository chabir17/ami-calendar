import { initAdhan, getHijriDateSafe, getPrayerTimesSafe, fetchClientConfig, fetchRamadanOverrides, applyTheme } from './services.js';
import { DOM, DATE_UTILS } from './utils.js';

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

    const calendarEvents = [];
    let hijriYearAr = '';

    const dateCursor = new Date(year, 0, 1);
    const endScan = new Date(year, 11, 31);

    while (dateCursor <= endScan) {
        const hijri = getHijriDateSafe(dateCursor);
        const hMonth = hijri.monthNameAR || '';
        const hDay = parseInt(hijri.day);

        let isRamadan = hMonth.includes('رمضان');
        let isNightOfDoubt = hMonth.includes('شعبان') && hDay === 29;
        let isEid = hMonth.includes('شوال') && hDay === 1;

        if (isRamadan) {
            if (!hijriYearAr) hijriYearAr = hijri.yearAr;
        }

        if (isRamadan || isNightOfDoubt || isEid) {
            let eventType = null;
            if (isNightOfDoubt) eventType = 'night-of-doubt';
            else if (isEid) eventType = 'eid';
            else if (isRamadan && hDay === 27) eventType = 'laylat-al-qadr';

            calendarEvents.push({ date: new Date(dateCursor), hijri, eventType });
        }

        dateCursor.setDate(dateCursor.getDate() + 1);
    }

    // 4. Rendu
    const clone = template.content.cloneNode(true);
    renderLayout(clone, config, year, hijriYearAr);

    // Mise à jour dynamique des mois (ex: Févr. / Mars)
    const uniqueMonths = [...new Set(calendarEvents.map((d) => d.date.getMonth()))].sort((a, b) => a - b);
    if (uniqueMonths.length > 0) {
        const fmtFr = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
        const fmtAr = new Intl.DateTimeFormat('ar', { month: 'long' });
        const fmtTa = new Intl.DateTimeFormat('ta-IN', { month: 'long' });
        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

        const labelFr = uniqueMonths.map((m) => capitalize(fmtFr.format(new Date(year, m, 1)))).join(' / ');
        const labelAr = uniqueMonths.map((m) => fmtAr.format(new Date(year, m, 1))).join(' / ');
        const labelTa = uniqueMonths.map((m) => fmtTa.format(new Date(year, m, 1))).join(' / ');

        const thStack = clone.querySelector('.ramadan-table thead th:first-child .th-stack');
        DOM.setText('.th-fr', labelFr, thStack);
        DOM.setText('.th-ar', labelAr, thStack);
        DOM.setText('.th-ta', labelTa, thStack);
    }

    const tbody = clone.querySelector('tbody');
    const fragment = document.createDocumentFragment();

    // Formatteurs pour éviter la réinstanciation dans la boucle
    const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
    const daysShortList = window.TEXTS?.fr?.daysShort;
    const daysArabicList = window.TEXTS?.ar?.days;
    const daysTamilList = window.TEXTS?.ta?.days;

    const ramadanDays = calendarEvents.filter((e) => e.hijri.monthNameRaw.toLowerCase().includes('ramadan'));
    const totalRamadanDays = ramadanDays.length;

    // --- Event Helpers ---
    const EVENT_LABELS = {
        'night-of-doubt': { fr: 'NUIT DU DOUTE', ar: 'ليلة الشك', ta: 'சந்தேக இரவு' },
        eid: { fr: 'EID-UL-FITR', ar: 'عيد الفطر', ta: 'ஈத் அல்-பித்ர்' }
    };

    calendarEvents.forEach(({ date, hijri, eventType }) => {
        const times = getPrayerTimesSafe(date);
        const dateKey = DATE_UTILS.format(date, 'YYYY-MM-DD');

        if (overrides[dateKey]) {
            Object.assign(times, overrides[dateKey]);
        }

        // 27ème Nuit : Insertion ligne intermédiaire
        if (eventType === 'laylat-al-qadr') {
            const separatorTr = document.createElement('tr');
            separatorTr.className = 'row-separator laylat-al-qadr-sep';
            separatorTr.innerHTML = `
                <td colspan="9">
                    <div class="event-stack">
                        <span class="event-fr">27<sup>ÈME</sup> NUIT DU RAMAḌĀN</span>
                        <span class="event-separator">•</span>
                        <span class="event-ta tamil">27-ம் இரவு</span>
                    </div>
                </td>
                <td colspan="2"></td>`;
            fragment.appendChild(separatorTr);
        }

        const tr = document.createElement('tr');
        if (date.getDay() === 5 || eventType === 'eid') tr.classList.add('is-friday');
        if (eventType && eventType !== 'laylat-al-qadr') tr.classList.add(`is-${eventType}`);

        const dayOfWeekIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const dayShort = daysShortList ? daysShortList[dayOfWeekIdx] : dayFormatter.format(date);
        const dayArabic = daysArabicList ? daysArabicList[dayOfWeekIdx] : '';
        const dayTamil = daysTamilList ? daysTamilList[dayOfWeekIdx] : '';
        const dayNum = date.getDate().toString().padStart(2, '0');
        const hijriDayDisplay = hijri.day.toString().padStart(2, '0');

        if (eventType === 'night-of-doubt' || eventType === 'eid') {
            const labels = EVENT_LABELS[eventType];
            tr.innerHTML = `
                <td class="col-day-name">${dayShort}</td>
                <td class="col-day-name tamil">${dayTamil}</td>
                <td class="col-day-num">${dayNum}</td>
                <td colspan="7" class="special-event-label">
                    <div class="event-stack">
                        <span class="event-fr">${labels.fr}</span>
                        <span class="event-separator">•</span>
                        <span class="event-ar arabic">${labels.ar}</span>
                        <span class="event-separator">•</span>
                        <span class="event-ta tamil">${labels.ta}</span>
                    </div>
                </td>
                <td class="col-hijri">${hijriDayDisplay}</td>
                <td class="col-day-name arabic">${dayArabic}</td>
            `;
        } else {
            const hDay = parseInt(hijri.day);
            const isRamadan = hijri.monthNameRaw.toLowerCase().includes('ramadan');
            let amiIshaTd = '';

            if (isRamadan) {
                const isFirstHalf = hDay <= 15;
                const adhanTime = isFirstHalf ? '20:10' : '20:30';

                const labelBox = `
                    <div class="ami-isha-line">
                        <span>Azhan</span>
                        <span class="bullet-brand">•</span>
                        <span class="arabic">أذان</span>
                        <span class="bullet-brand">•</span>
                        <span class="tamil">பாங்கு</span>
                        <span class="time-sep">:</span>
                        <span class="time-val">${adhanTime}</span>
                    </div>`;

                if (hDay === 1 || hDay === 16) {
                    const rowspan = hDay === 1 ? 15 : totalRamadanDays - 15 + 1;
                    amiIshaTd = `
                        <td class="ami-isha" rowspan="${rowspan}">
                            <div class="ami-isha-rotate">${labelBox}</div>
                        </td>`;
                } else {
                    amiIshaTd = null;
                }
            } else {
                amiIshaTd = `<td class="ami-isha">--:--</td>`;
            }

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
                ${amiIshaTd !== null ? amiIshaTd : ''}
                <td class="col-hijri">${hijriDayDisplay}</td>
                <td class="col-day-name arabic">${dayArabic}</td>
            `;
        }
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    app.appendChild(clone);

    // Génération du QR Code
    generateQRCode(document.getElementById('qrcode'), config);
});

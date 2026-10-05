import { initAdhan, getHijriDateSafe, getPrayerTimesSafe, fetchClientConfig, fetchRamadanOverrides, applyTheme, loadPrayerTimes, shiftTime } from './services.js';
import { DOM, DATE_UTILS, contactsHTML } from './utils.js';

// --- Configuration & Helpers ---

// Imsak : début de l'abstinence, quelques minutes avant Fajr (par précaution)
const IMSAK_MINUTES_BEFORE_FAJR = 10;
// Icha AMI (horaire de la mosquée pendant le Ramadan) : 1re et 2e quinzaine
const AMI_ISHA = { firstHalf: '20:00', secondHalf: '20:20' };

function renderLayout(container, config, year, hijriYearAr, isDigital) {
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

    // Coordonnées sur 3 lignes : adresses | téléphones, e-mail, site | IBAN • BIC
    const contacts = container.querySelector('.identity-contacts');
    if (contacts) contacts.innerHTML = contactsHTML(contact, 'rows', isDigital);
}

// --- Main Logic ---

document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const template = document.getElementById('ramadan-template');

    // 1. Chargement Config
    // Horaires officiels (data/prayer_times.csv), comme le calendrier annuel ; les corrections manuelles restent prioritaires
    const [config, overrides] = await Promise.all([fetchClientConfig('ami93120'), fetchRamadanOverrides(), loadPrayerTimes()]);

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

    // 3. Détermination de la période de Ramadan : prochain Ramadan par défaut
    //    (année en cours, ou suivante si l'Aïd el-Fitr de l'année est passé)
    const urlParams = new URLSearchParams(window.location.search);
    const isEidPassed = (y) => {
        const today = new Date();
        for (const d = new Date(y, 0, 1); d <= today && d.getFullYear() === y; d.setDate(d.getDate() + 1)) {
            const h = getHijriDateSafe(d);
            if ((h.monthNameAR || '').includes('شوال') && parseInt(h.day) === 1) return true;
        }
        return false;
    };
    const currentYear = new Date().getFullYear();
    const year = parseInt(urlParams.get('year')) || (isEidPassed(currentYear) ? currentYear + 1 : currentYear);
    // Par défaut : version numérique (couleurs contrastées, liens cliquables).
    // Version papier (pastels, économie d'encre) : ramadan.html?print=true
    const isDigital = urlParams.get('print') !== 'true';

    const calendarEvents = [];
    let hijriYearAr = '';

    const dateCursor = new Date(year, 0, 1);
    const endScan = new Date(year, 11, 31);

    while (dateCursor <= endScan) {
        const hijri = getHijriDateSafe(dateCursor);
        const hMonth = hijri.monthNameAR || '';
        const hDay = parseInt(hijri.day);

        const isRamadan = hMonth.includes('رمضان');
        const isNightOfDoubt = hMonth.includes('شعبان') && hDay === 29;
        const isEid = hMonth.includes('شوال') && hDay === 1;

        if (isRamadan && !hijriYearAr) hijriYearAr = hijri.yearAr;

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
    renderLayout(clone, config, year, hijriYearAr, isDigital);
    document.title = `Ramadan ${year} – horaires de prière – AMI La Courneuve`;
    if (isDigital) clone.querySelector('.page').classList.add('digital');

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

    // --- Event Helpers ---
    const EVENT_LABELS = {
        'night-of-doubt': { fr: 'NUIT DU DOUTE', ar: 'ليلة الشك', ta: 'சந்தேக இரவு' },
        eid: { fr: 'EID-UL-FITR', ar: 'عيد الفطر', ta: 'ஈத் அல்-பித்ர்' }
    };

    calendarEvents.forEach(({ date, hijri, eventType }) => {
        const times = getPrayerTimesSafe(date);
        const dateKey = DATE_UTILS.format(date);

        if (overrides[dateKey]) {
            Object.assign(times, overrides[dateKey]);
        }

        // 27ème Nuit : Insertion ligne intermédiaire
        if (eventType === 'laylat-al-qadr') {
            const separatorTr = document.createElement('tr');
            separatorTr.className = 'row-separator laylat-al-qadr-sep';
            separatorTr.innerHTML = `
                <td colspan="13">
                    <div class="event-stack">
                        <span class="event-fr">27<sup class="ordinal">e</sup> NUIT DU RAMAḌĀN</span>
                        <span class="event-separator">•</span>
                        <span class="event-ta tamil">27-ம் இரவு</span>
                    </div>
                </td>`;
            fragment.appendChild(separatorTr);
        }

        const tr = document.createElement('tr');
        if (date.getDay() === 5) tr.classList.add('is-friday');
        if (date.getDay() === 0) tr.classList.add('week-end'); // filet plus marqué après chaque dimanche
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
                <td colspan="8" class="special-event-label">
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
            // Icha AMI : horaire de la quinzaine ; hors Ramadan, pas d'horaire
            const amiIshaTime = isRamadan ? (hDay <= 15 ? AMI_ISHA.firstHalf : AMI_ISHA.secondHalf) : '--:--';
            const imsak = times.imsak || shiftTime(times.fajr, -IMSAK_MINUTES_BEFORE_FAJR);

            tr.innerHTML = `
                <td class="col-day-name">${dayShort}</td>
                <td class="col-day-name tamil">${dayTamil}</td>
                <td class="col-day-num">${dayNum}</td>
                <td class="imsak">${imsak}</td>
                <td class="fajr">${times.fajr}</td>
                <td class="sunrise">${times.sunrise}</td>
                <td class="dhuhr">${times.dhuhr}</td>
                <td class="asr">${times.asr}</td>
                <td class="maghrib">${times.maghrib}</td>
                <td class="isha">${times.isha}</td>
                <td class="ami-isha-fix">${amiIshaTime}</td>
                <td class="col-hijri">${hijriDayDisplay}</td>
                <td class="col-day-name arabic">${dayArabic}</td>
            `;
        }
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    app.appendChild(clone);
});

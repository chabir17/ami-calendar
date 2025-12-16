// script.js - Version consolidée pour fonctionnement local sans serveur

// ==========================================
// 1. SERVICES & LOGIQUE MÉTIER
// ==========================================

/**
 * Formatteur de date pour le calendrier hégirien (Islamique Civil).
 * @type {Intl.DateTimeFormat}
 */
const HIJRI_FORMATTER = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-civil', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

/**
 * Mapping des noms de mois français (retournés par Intl) vers leur équivalent arabe.
 * @type {Object.<string, string>}
 */
const MONTH_MAP_FR_AR = {
    mouharram: 'محرم',
    safar: 'صفر',
    'rabia al awal': 'ربيع الأول',
    'rabia ath-thani': 'ربيع الآخر',
    'joumada al oula': 'جمادى الأولى',
    'joumada ath-thania': 'جمادى الآخرة',
    rajab: 'رجب',
    chaʻban: 'شعبان',
    chaabane: 'شعبان',
    "cha'ban": 'شعبان',
    ramadan: 'رمضان',
    chawwal: 'شوال',
    'dhou al qi`da': 'ذو القعدة',
    'dhou al-hijja': 'ذو الحجة'
};

let adhanCoords = null;
let adhanParams = null;

/**
 * Cache pour les vacances scolaires parsées (timestamp start/end).
 * @type {Array<{start: number, end: number}>|null}
 */
let parsedHolidaysCache = null;

/**
 * Initialise la librairie Adhan avec la configuration globale définie dans config.js.
 * @returns {void}
 */
function initAdhan() {
    if (typeof adhan === 'undefined') return;
    const CONFIG = window.CONFIG;
    if (!CONFIG) return;

    adhanCoords = new adhan.Coordinates(CONFIG.lat, CONFIG.lng);
    adhanParams = adhan.CalculationMethod.MuslimWorldLeague();
    adhanParams.madhab = CONFIG.asrMethod === 'Hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
    adhanParams.fajrAngle = 18;
    adhanParams.ishaAngle = 18;
    Object.assign(adhanParams.adjustments, CONFIG.adjustments);
}

/**
 * Calcule les horaires de prière pour une date donnée.
 * @param {Date} date - La date pour laquelle calculer les horaires.
 * @returns {{fajr: string, sunrise: string, dhuhr: string, asr: string, maghrib: string, isha: string}|null} Les horaires formatés ou null si non initialisé.
 */
function getPrayerTimesSafe(date) {
    if (!adhanCoords || !adhanParams) return null;

    const pTimes = new adhan.PrayerTimes(adhanCoords, date, adhanParams);
    const format = (t) => {
        if (!t || isNaN(t.getTime())) return '--:--';
        return `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
    };
    return {
        fajr: format(pTimes.fajr),
        sunrise: format(pTimes.sunrise),
        dhuhr: format(pTimes.dhuhr),
        asr: format(pTimes.asr),
        maghrib: format(pTimes.maghrib),
        isha: format(pTimes.isha)
    };
}

/**
 * @typedef {Object} HijriDate
 * @property {string} day - Le jour du mois.
 * @property {string} monthNameFR - Le nom du mois en français.
 * @property {string} monthNameAR - Le nom du mois en arabe.
 * @property {string} year - L'année hégirienne.
 * @property {string} yearAr - L'année hégirienne en chiffres arabes orientaux.
 */

/**
 * Convertit une date grégorienne en date hégirienne avec gestion d'erreurs.
 * @param {Date} date
 * @returns {HijriDate}
 */
function getHijriDateSafe(date) {
    try {
        const parts = HIJRI_FORMATTER.formatToParts(date);
        let day = '',
            monthFr = '',
            year = '';
        parts.forEach((p) => {
            if (p.type === 'day') day = p.value;
            if (p.type === 'month') monthFr = p.value;
            if (p.type === 'year') year = p.value;
        });

        let cleanMonthFr = monthFr.toLowerCase().trim();
        const monthAr = MONTH_MAP_FR_AR[cleanMonthFr] || cleanMonthFr;
        const yearAr = year.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

        return {
            day: day,
            monthNameFR: monthFr,
            monthNameAR: monthAr,
            year: year,
            yearAr: yearAr
        };
    } catch (e) {
        return { day: '?', monthNameFR: '', monthNameAR: '', year: '', yearAr: '' };
    }
}

/**
 * @typedef {Object} DayInfo
 * @property {boolean} isHoliday - Vrai si c'est une vacance scolaire.
 * @property {boolean} isPublicHoliday - Vrai si c'est un jour férié.
 * @property {string} label - Le libellé de l'événement (férié, aïd, etc.).
 * @property {boolean} isNewMoon - Vrai si c'est le 1er jour du mois hégirien.
 * @property {boolean} isEid - Vrai si c'est un jour de l'Aïd.
 * @property {boolean} isDST - Vrai si c'est un jour de changement d'heure.
 */

/**
 * Détermine les événements spéciaux pour une journée donnée.
 * @param {Date} date
 * @param {HijriDate} hijri
 * @returns {DayInfo}
 */
function getDayInfo(date, hijri) {
    let info = {
        isHoliday: false,
        isPublicHoliday: false,
        label: '',
        isNewMoon: false,
        isEid: false,
        isDST: false
    };
    const CONFIG = window.CONFIG;
    if (!CONFIG) return info;

    // Vacances
    // Optimisation : On parse les dates une seule fois si le cache est vide
    if (!parsedHolidaysCache && CONFIG.schoolHolidays) {
        parsedHolidaysCache = CONFIG.schoolHolidays.map((p) => {
            let start = new Date(p.start);
            start.setHours(0, 0, 0, 0);
            let end = new Date(p.end);
            end.setHours(23, 59, 59, 999);
            return { start: start.getTime(), end: end.getTime() };
        });
    }

    const t = date.getTime();
    if (parsedHolidaysCache) {
        for (const p of parsedHolidaysCache) {
            if (t >= p.start && t <= p.end) {
                info.isHoliday = true;
                break;
            }
        }
    }

    // Fériés
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    if (CONFIG.publicHolidays[key]) {
        info.isPublicHoliday = true;
        info.label = CONFIG.publicHolidays[key];
    }

    // Changement d'heure
    const m = date.getMonth();
    const d = date.getDate();
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 && d + 7 > 31) {
        if (m === 2) {
            info.isDST = true;
            info.dstType = 'summer';
            info.label = "Heure d'été (+1h)";
        } else if (m === 9) {
            info.isDST = true;
            info.dstType = 'winter';
            info.label = "Heure d'hiver (-1h)";
        }
    }

    // Lune & Aïd
    if (hijri.day == '1') info.isNewMoon = true;
    const hMonth = hijri.monthNameFR ? hijri.monthNameFR.toLowerCase() : '';
    if (hijri.day == '1' && (hMonth.includes('chawwal') || hMonth.includes('schawwal'))) {
        info.isEid = true;
        info.label = 'Eid-ul-Fitr';
    } else if (hijri.day == '10' && (hMonth.includes('hijja') || hMonth.includes('hija'))) {
        info.isEid = true;
        info.label = 'Eid-ul-Adha';
    }
    return info;
}

// ==========================================
// 2. COMPOSANTS WEB (Custom Elements)
// ==========================================

/**
 * Composant affichant la grille mensuelle du calendrier.
 */
class CalendarGrid extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.render();
    }
    static get observedAttributes() {
        return ['year', 'month'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        const year = parseInt(this.getAttribute('year'));
        const month = parseInt(this.getAttribute('month'));
        if (!year || !month) return;

        const jsMonth = month - 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        let startOffset = (new Date(year, jsMonth, 1).getDay() || 7) - 1;
        const gridCells = new Array(35).fill(null);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, jsMonth, day);
            const hijri = getHijriDateSafe(date);
            const dayInfo = getDayInfo(date, hijri);
            let pos = startOffset + day - 1;
            if (pos >= 35) pos -= 35;
            gridCells[pos] = { day, hijri, dayInfo };
        }

        let html = '';
        for (let i = 0; i < 35; i++) {
            const cell = gridCells[i];
            if (!cell) {
                html += `<div class="day-cell-visual empty"></div>`;
                continue;
            }
            const { day, hijri, dayInfo } = cell;
            let classes = ['day-cell-visual'];
            if (dayInfo.isEid) classes.push('is-friday');
            if (dayInfo.isHoliday && !dayInfo.isEid) classes.push('is-holiday');
            if (dayInfo.isPublicHoliday && !dayInfo.isEid) classes.push('is-public-holiday');

            let content = `<span class="vis-greg">${day}</span><span class="vis-hij">${hijri.day || ''}</span>`;
            if (dayInfo.isNewMoon) content += `<img src="icons/icon-moon.svg" class="new-moon-icon" alt="Nouvelle lune">`;
            if (dayInfo.isDST) {
                const style = dayInfo.isNewMoon ? 'left: 18px;' : '';
                const iconFile = dayInfo.dstType === 'winter' ? 'icons/icon-clock-minus.svg' : 'icons/icon-clock-plus.svg';
                content += `<img src="${iconFile}" class="dst-icon" style="${style}" alt="${dayInfo.label}">`;
            }
            if (dayInfo.label) {
                let labelClass = 'event-label';
                if (dayInfo.isEid) labelClass += ' eid-label';
                if (dayInfo.isDST) labelClass += ' dst-label';
                content += `<div class="${labelClass}">${dayInfo.label}</div>`;
            }
            html += `<div class="${classes.join(' ')}">${content}</div>`;
        }
        this.innerHTML = html;
        this.className = 'days-grid-visual';
    }
}
if (!customElements.get('ami-calendar-grid')) {
    customElements.define('ami-calendar-grid', CalendarGrid);
}

/**
 * Composant affichant le tableau des horaires de prières.
 */
class PrayerTable extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.render();
    }
    static get observedAttributes() {
        return ['year', 'month'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        const year = parseInt(this.getAttribute('year'));
        const month = parseInt(this.getAttribute('month'));
        const TEXTS = window.TEXTS;
        if (!year || !month || !TEXTS) return;

        const tbody = this.querySelector('tbody');
        if (!tbody) return;

        const jsMonth = month - 1;
        const daysInMonth = new Date(year, month, 0).getDate();

        let html = '';

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, jsMonth, day);
            const dayOfWeekIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
            const isFriday = date.getDay() === 5;
            let hijri = getHijriDateSafe(date);
            let times = getPrayerTimesSafe(date);
            const dateStr = `${TEXTS.fr.daysShort[dayOfWeekIdx]} ${day.toString().padStart(2, '0')}`;
            const rowClass = isFriday ? 'class="is-friday"' : '';

            html += `
                <tr ${rowClass}>
                    <td class="col-date-greg">${dateStr}</td>
                    <td>${times.fajr}</td>
                    <td>${times.sunrise}</td>
                    <td>${times.dhuhr}</td>
                    <td>${times.asr}</td>
                    <td>${times.maghrib}</td>
                    <td>${times.isha}</td>
                    <td class="col-hijri">${hijri.day}</td>
                </tr>`;
        }
        tbody.innerHTML = html;
    }
}
if (!customElements.get('ami-prayer-table')) {
    customElements.define('ami-prayer-table', PrayerTable);
}

// ==========================================
// 3. INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    let year = parseInt(urlParams.get('year')) || 2027;
    let month = parseInt(urlParams.get('month'));
    if (!month || month < 1 || month > 12) month = 1;

    updateLegends(year, month);

    initAdhan();
    updateZoneTitles(year, month);

    const calendar = document.querySelector('ami-calendar-grid');
    const prayerTable = document.querySelector('ami-prayer-table');

    if (calendar) {
        calendar.setAttribute('year', year);
        calendar.setAttribute('month', month);
    }
    if (prayerTable) {
        prayerTable.setAttribute('year', year);
        prayerTable.setAttribute('month', month);
    }
});

/**
 * Met à jour l'affichage des légendes (Changement d'heure, Aïd) selon le mois.
 * @param {number} year
 * @param {number} month
 */
function updateLegends(year, month) {
    // 1. Légende Changement d'heure (Mars/Octobre)
    const legendDst = document.getElementById('legend-dst');
    if (legendDst && (month === 3 || month === 10)) {
        legendDst.style.display = 'flex';
        const legendImg = legendDst.querySelector('img');
        const legendText = legendDst.querySelector('span:last-child');
        if (month === 3) {
            // Mars : Été
            if (legendImg) legendImg.src = 'icons/icon-clock-plus.svg';
            if (legendText) legendText.textContent = "Heure d'été (+1h)";
        } else {
            // Octobre : Hiver
            if (legendImg) legendImg.src = 'icons/icon-clock-minus.svg';
            if (legendText) legendText.textContent = "Heure d'hiver (-1h)";
        }
    }

    // 2. Légende Aïd (si présent dans le mois)
    let hasEid = false;
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const info = getDayInfo(new Date(year, jsMonth, d), getHijriDateSafe(new Date(year, jsMonth, d)));
        if (info.isEid) {
            hasEid = true;
            break;
        }
    }
    const legendEid = document.getElementById('legend-eid');
    if (legendEid && hasEid) legendEid.style.display = 'flex';
}

function updateZoneTitles(year, month) {
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const TEXTS = window.TEXTS; // Accès explicite
    if (!TEXTS) return;

    document.getElementById('greg-month-fr').textContent = TEXTS.fr.months[jsMonth];
    document.getElementById('greg-month-ta').textContent = TEXTS.ta.months[jsMonth];
    document.getElementById('year-display').textContent = year;

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
    document.getElementById('hijri-month-fr').textContent = hijriFrStr;
    document.getElementById('hijri-month-ar').textContent = hijriArStr;
}

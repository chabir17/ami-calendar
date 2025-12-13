// script.js - Version consolidée pour fonctionnement local sans serveur

// ==========================================
// 1. SERVICES & LOGIQUE MÉTIER
// ==========================================

/**
 * Formatteur de date pour le calendrier hégirien (Islamique Civil).
 * @type {Intl.DateTimeFormat}
 */
const HIJRI_FORMATTER = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-civil', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Mapping des noms de mois français (retournés par Intl) vers leur équivalent arabe.
 * @type {Object.<string, string>}
 */
const MONTH_MAP_FR_AR = {
    "mouharram": "محرم",
    "safar": "صفر",
    "rabia al awal": "ربيع الأول",
    "rabia ath-thani": "ربيع الآخر",
    "joumada al oula": "جمادى الأولى",
    "joumada ath-thania": "جمادى الآخرة",
    "rajab": "رجب",
    "chaʻban": "شعبان",
    "chaabane": "شعبان",
    "cha'ban": "شعبان",
    "ramadan": "رمضان",
    "chawwal": "شوال",
    "dhou al qi`da": "ذو القعدة",
    "dhou al-hijja": "ذو الحجة"
};

let adhanCoords = null;
let adhanParams = null;

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
    adhanParams.madhab = (CONFIG.asrMethod === 'Hanafi') ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
    adhanParams.fajrAngle = 18; adhanParams.ishaAngle = 18;
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
        if (!t || isNaN(t.getTime())) return "--:--";
        return `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
    };
    return {
        fajr: format(pTimes.fajr), sunrise: format(pTimes.sunrise),
        dhuhr: format(pTimes.dhuhr), asr: format(pTimes.asr),
        maghrib: format(pTimes.maghrib), isha: format(pTimes.isha)
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
        let day = '', monthFr = '', year = '';
        parts.forEach(p => {
            if (p.type === 'day') day = p.value;
            if (p.type === 'month') monthFr = p.value;
            if (p.type === 'year') year = p.value;
        });

        let cleanMonthFr = monthFr.toLowerCase().trim();
        const monthAr = MONTH_MAP_FR_AR[cleanMonthFr] || cleanMonthFr;
        const yearAr = year.replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

        return { day: day, monthNameFR: monthFr, monthNameAR: monthAr, year: year, yearAr: yearAr };
    } catch (e) { return { day: '?', monthNameFR: '', monthNameAR: '', year: '', yearAr: '' }; }
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
    let info = { isHoliday: false, isPublicHoliday: false, label: "", isNewMoon: false, isEid: false, isDST: false };
    const CONFIG = window.CONFIG;
    if (!CONFIG) return info;

    // Vacances
    const t = date.getTime();
    for (const p of CONFIG.schoolHolidays) {
        let start = new Date(p.start); start.setHours(0, 0, 0, 0);
        let end = new Date(p.end); end.setHours(23, 59, 59, 999);
        if (t >= start.getTime() && t <= end.getTime()) info.isHoliday = true;
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
        if (m === 2) { info.isDST = true; info.label = "Heure d'été (+1h)"; }
        else if (m === 9) { info.isDST = true; info.label = "Heure d'hiver (-1h)"; }
    }

    // Lune & Aïd
    if (hijri.day == "1") info.isNewMoon = true;
    const hMonth = hijri.monthNameFR ? hijri.monthNameFR.toLowerCase() : "";
    if (hijri.day == "1" && (hMonth.includes("chawwal") || hMonth.includes("schawwal"))) {
        info.isEid = true; info.label = "Eid-ul-Fitr";
    } else if (hijri.day == "10" && (hMonth.includes("hijja") || hMonth.includes("hija"))) {
        info.isEid = true; info.label = "Eid-ul-Adha";
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
    constructor() { super(); }
    connectedCallback() { this.render(); }
    static get observedAttributes() { return ['year', 'month']; }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this.render(); }

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
            let classes = ["day-cell-visual"];
            if (dayInfo.isEid) classes.push("is-friday");
            if (dayInfo.isHoliday && !dayInfo.isEid) classes.push("is-holiday");
            if (dayInfo.isPublicHoliday && !dayInfo.isEid) classes.push("is-public-holiday");

            let content = `<span class="vis-greg">${day}</span><span class="vis-hij">${hijri.day || ''}</span>`;
            if (dayInfo.isNewMoon) content += `<div class="new-moon-icon">🌙</div>`;
            if (dayInfo.isDST) {
                const style = dayInfo.isNewMoon ? 'left: 18px;' : '';
                content += `<div class="dst-icon" style="${style}">🕑</div>`;
            }
            if (dayInfo.label) {
                let labelClass = "event-label";
                if (dayInfo.isEid) labelClass += " eid-label";
                if (dayInfo.isDST) labelClass += " dst-label";
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
    constructor() { super(); }
    connectedCallback() { this.render(); }
    static get observedAttributes() { return ['year', 'month']; }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this.render(); }

    render() {
        const year = parseInt(this.getAttribute('year'));
        const month = parseInt(this.getAttribute('month'));
        const TEXTS = window.TEXTS;
        if (!year || !month || !TEXTS) return;

        const jsMonth = month - 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        
        let html = `
        <table class="prayer-table" id="prayer-table">
            <thead>
                <tr>
                    <th><div class="th-stack"><p class="th-fr">Date</p><p class="th-ar arabic">التاريخ</p><p class="th-ta tamil">தேதி</p></div></th>
                    <th><div class="th-stack"><p class="th-fr">Fajr</p><p class="th-ar arabic">الفجر</p><p class="th-ta tamil">பஜ்ர்</p></div></th>
                    <th><div class="th-stack"><p class="th-fr">Shuruq</p><p class="th-ar arabic">الشروق</p><p class="th-ta tamil">ஷுரூக்</p></div></th>
                    <th><div class="th-stack"><p class="th-fr">Dhuhr</p><p class="th-ar arabic">الظهر</p><p class="th-ta tamil">லுஹர்</p></div></th>
                    <th><div class="th-stack"><p class="th-fr">Asr</p><p class="th-ar arabic">العصر</p><p class="th-ta tamil">அஸ்ர்</p></div></th>
                    <th><div class="th-stack"><p class="th-fr">Maghrib</p><p class="th-ar arabic">المغرب</p><p class="th-ta tamil">மக்ரிப்</p></div></th>
                    <th><div class="th-stack"><p class="th-fr">Isha</p><p class="th-ar arabic">العشاء</p><p class="th-ta tamil">இஷா</p></div></th>
                    <th><div class="th-header-symbol">☪︎</div></th>
                </tr>
            </thead>
            <tbody>`;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, jsMonth, day);
            const dayOfWeekIdx = (date.getDay() === 0 ? 6 : date.getDay() - 1);
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
                    <td>${hijri.day}</td>
                </tr>`;
        }
        html += `</tbody></table>`;
        this.innerHTML = html;
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

    // Afficher la légende "Changement d'heure" uniquement en Mars (3) et Octobre (10)
    const legendDst = document.getElementById('legend-dst');
    if (legendDst && (month === 3 || month === 10)) {
        legendDst.style.display = 'flex';
    }

    // Afficher la légende "Aïd" uniquement si un jour de l'Aïd est présent dans le mois
    let hasEid = false;
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, jsMonth, d);
        const hijri = getHijriDateSafe(date);
        const info = getDayInfo(date, hijri);
        if (info.isEid) { hasEid = true; break; }
    }
    const legendEid = document.getElementById('legend-eid');
    if (legendEid && hasEid) legendEid.style.display = 'flex';

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

function updateZoneTitles(year, month) {
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const TEXTS = window.TEXTS; // Accès explicite
    if (!TEXTS) return;

    document.getElementById('greg-month-fr').textContent = `${TEXTS.fr.months[jsMonth]} ${year}`;
    document.getElementById('greg-month-ta').textContent = `${TEXTS.ta.months[jsMonth]} ${year}`;

    const hijriStart = getHijriDateSafe(new Date(year, jsMonth, 1));
    const hijriEnd = getHijriDateSafe(new Date(year, jsMonth, daysInMonth));

    let hijriFrStr = "", hijriArStr = "";
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
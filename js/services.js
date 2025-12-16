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
    year: 'numeric',
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
    'dhou al-hijja': 'ذو الحجة',
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
        isha: format(pTimes.isha),
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
            yearAr: yearAr,
        };
    } catch (e) {
        return { day: '?', monthNameFR: '', monthNameAR: '', year: '', yearAr: '' };
    }
}

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
        isDST: false,
    };
    const CONFIG = window.CONFIG;
    if (!CONFIG) return info;

    // Vacances
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
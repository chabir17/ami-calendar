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

/**
 * Constantes pour l'optimisation de la conversion des chiffres
 */
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const RE_DIGITS = /\d/g;
const HIJRI_CACHE = new Map();

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
    if (!CONFIG) return;

    adhanCoords = new adhan.Coordinates(CONFIG.lat, CONFIG.lng);
    adhanParams = adhan.CalculationMethod.MuslimWorldLeague();
    adhanParams.madhab = CONFIG.asrMethod === 'Hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
    adhanParams.fajrAngle = 18;
    adhanParams.ishaAngle = 18;
    // Pour gérer l'été
    adhanParams.highLatitudeRule = adhan.HighLatitudeRule.SeventhOfTheNight;
    Object.assign(adhanParams.adjustments, CONFIG.adjustments);
}

/**
 * Calcule les horaires de prière pour une date donnée.
 * @param {Date} date - La date pour laquelle calculer les horaires.
 * @returns {{fajr: string, sunrise: string, dhuhr: string, asr: string, maghrib: string, isha: string}|null} Les horaires formatés ou null si non initialisé.
 */
function getPrayerTimesSafe(date) {
    if (!adhanCoords || !adhanParams) {
        return { fajr: '--:--', sunrise: '--:--', dhuhr: '--:--', asr: '--:--', maghrib: '--:--', isha: '--:--' };
    }

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
    const timeKey = date.getTime();
    // Optimisation : Utilisation du cache pour éviter de recalculer la date hégirienne (coûteux)
    if (HIJRI_CACHE.has(timeKey)) return HIJRI_CACHE.get(timeKey);

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
        const yearAr = year.replace(RE_DIGITS, (d) => ARABIC_DIGITS[d]);

        const result = {
            day: day,
            monthNameFR: monthFr,
            monthNameAR: monthAr,
            year: year,
            yearAr: yearAr
        };
        HIJRI_CACHE.set(timeKey, result);
        return result;
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
        isDST: false
    };
    if (!CONFIG) return info;

    // Vacances
    if (!parsedHolidaysCache && CONFIG.schoolHolidays) {
        parsedHolidaysCache = CONFIG.schoolHolidays.map((p) => {
            let start = new Date(p.start);
            start.setHours(0, 0, 0, 0);
            let end = new Date(p.end);
            end.setHours(23, 59, 59, 999);
            return { start: start.getTime(), end: end.getTime(), name: p.name };
        });
    }

    const t = date.getTime();
    if (parsedHolidaysCache) {
        for (const p of parsedHolidaysCache) {
            if (t >= p.start && t <= p.end) {
                info.isHoliday = true;
                info.holidayName = p.name;
                break;
            }
        }
    }

    // Fériés
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    if (CONFIG.publicHolidays && CONFIG.publicHolidays[key]) {
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

/**
 * Récupère les données officielles (Jours fériés & Vacances scolaires Zone C).
 * Utilise un cache localStorage pour limiter les appels API (durée : 30 jours).
 */
const CACHE_KEY = 'ami_calendar_cache';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours

async function fetchExternalData() {
    if (typeof window === 'undefined' || !window.CONFIG) return;
    let hasUpdates = false;
    const now = Date.now();

    // 1. Tentative de récupération depuis le cache localStorage
    // Permet d'éviter les appels réseaux inutiles si les données sont récentes (< 30 jours)
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            if (now - data.timestamp < CACHE_DURATION) {
                console.log('📦 Utilisation des données en cache (localStorage)');
                if (data.publicHolidays) {
                    window.CONFIG.publicHolidays = { ...window.CONFIG.publicHolidays, ...data.publicHolidays };
                }
                if (data.schoolHolidays) {
                    window.CONFIG.schoolHolidays = data.schoolHolidays;
                    parsedHolidaysCache = null;
                }
                return true; // Données chargées depuis le cache -> Mise à jour nécessaire
            }
        }
    } catch (e) {
        console.warn('Erreur lecture cache:', e);
    }

    try {
        let updated = false;
        // 1. Jours Fériés (Métropole)
        const resPublic = await fetch('https://calendrier.api.gouv.fr/jours-feries/metropole.json');
        if (resPublic.ok) {
            const publicHolidays = await resPublic.json();
            window.CONFIG.publicHolidays = { ...(window.CONFIG.publicHolidays || {}), ...publicHolidays };
            updated = true;
            console.log("✅ Jours fériés mis à jour depuis l'API");
        }

        // 2. Vacances Scolaires (Zone C - Académie de Créteil)
        const resSchool = await fetch(
            'https://data.education.gouv.fr/api/explore/v2.0/catalog/datasets/fr-en-calendrier-scolaire/records?select=description,start_date,end_date&where=zones=%22Zone%20C%22%20and%20location=%22Cr%C3%A9teil%22%20and%20end_date%3E=%222025-01-01%22&order_by=start_date&limit=100'
        );
        if (resSchool.ok) {
            const data = await resSchool.json();
            const newHolidays = data.records.map((item) => ({
                name: item.record.fields.description || 'Vacances',
                start: item.record.fields.start_date.split('T')[0],
                end: item.record.fields.end_date.split('T')[0]
            }));
            window.CONFIG.schoolHolidays = newHolidays;
            parsedHolidaysCache = null; // Force le re-calcul des vacances
            updated = true;
            console.log("✅ Vacances scolaires mises à jour depuis l'API");
        }

        // 3. Sauvegarde en cache si succès
        if (updated) {
            const cacheData = {
                timestamp: now,
                publicHolidays: window.CONFIG.publicHolidays,
                schoolHolidays: window.CONFIG.schoolHolidays
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            console.log('💾 Données sauvegardées dans le cache pour 30 jours.');
        }
        return updated;
    } catch (e) {
        console.warn('⚠️ Mode hors ligne ou erreur API : Utilisation de la configuration locale.', e);
    }
}

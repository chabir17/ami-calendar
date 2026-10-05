import { DATE_UTILS } from './utils.js';

// ==========================================
// 1. SERVICES & LOGIQUE MÉTIER (Date, Prières, API)
// ==========================================

/**
 * Constantes et Caches
 */
const HIJRI_CACHE = new Map();
const CACHE_KEY = 'ami_calendar_cache_v2'; // v2 : vacances normalisées (doublons, ponts)
// Configuration des décalages Hégiriens par période (YYYY-MM-DD)
const HIJRI_OFFSETS = [
    { start: '2026-02-01', end: '2026-03-19', offset: 0 }, // Ramadan 2026 (Début 18 Fév)
    { start: '2026-03-20', end: '2026-12-31', offset: 0 } // Eid 2026 (20 Mars)
];

// Variables globales pour Adhan
let adhanCoords = null;
let adhanParams = null;
let parsedHolidaysCache = null;

// Horaires de prière officiels (data/prayer_times.csv), indexés par "MM-JJ", en heure d'hiver
let prayerTimesTable = null;
const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Charge le fichier générique des horaires de prière (indépendant de l'année).
 * Format : Mois;Jour;Fajr;Shuruq;Dhuhr;Asr;Maghrib;Isha — heures en heure d'hiver (UTC+1).
 * En cas d'échec, getPrayerTimesSafe se rabat sur le calcul Adhan.
 */
export async function loadPrayerTimes() {
    try {
        const response = await fetch('data/prayer_times.csv');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const table = new Map();
        const toMinutes = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        let prevDhuhr = null;
        let inSummer = false;
        for (const line of (await response.text()).split(/\r?\n/)) {
            const cols = line.split(/[;,\t]/).map((c) => c.trim());
            if (cols.length < 8 || !/^\d{1,2}$/.test(cols[0]) || !/^\d{1,2}$/.test(cols[1])) continue;
            const key = `${cols[0].padStart(2, '0')}-${cols[1].padStart(2, '0')}`;
            let times = cols.slice(2, 8);

            // Si le fichier inclut déjà l'heure d'été (saut d'~1h sur Dhuhr, qui varie de < 1 min/jour),
            // on ramène ces jours en heure d'hiver : le décalage est réappliqué selon l'année affichée.
            const dhuhr = toMinutes(times[2]);
            if (prevDhuhr !== null) {
                if (dhuhr - prevDhuhr >= 45) inSummer = true;
                else if (dhuhr - prevDhuhr <= -45) inSummer = false;
            }
            prevDhuhr = dhuhr;
            if (inSummer) times = times.map((t) => shiftTime(t, -60));

            table.set(key, times);
        }
        // Années bissextiles : à défaut de ligne dédiée, le 29/02 reprend les horaires du 28/02
        if (!table.has('02-29') && table.has('02-28')) table.set('02-29', table.get('02-28'));
        prayerTimesTable = table;
    } catch (e) {
        console.warn('⚠️ Horaires CSV indisponibles, calcul Adhan utilisé :', e);
    }
}

/** Ajoute des minutes à une heure "HH:MM" */
export function shiftTime(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '--:--';
    const total = (h * 60 + m + minutes + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Initialise la librairie Adhan avec la configuration globale définie dans config.js.
 */
export function initAdhan() {
    if (typeof adhan === 'undefined') return;
    if (typeof CONFIG === 'undefined' || !CONFIG) return;

    // Évite de réinitialiser si déjà fait
    if (adhanCoords && adhanParams) return;

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
 */
export function getPrayerTimesSafe(date) {
    const row = prayerTimesTable?.get(DATE_UTILS.format(date).slice(5));
    if (row) {
        const offset = DATE_UTILS.isSummerTime(date) ? 60 : 0;
        return Object.fromEntries(PRAYER_KEYS.map((key, i) => [key, shiftTime(row[i], offset)]));
    }

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
 * Convertit une date grégorienne en date hégirienne avec gestion d'erreurs.
 * Utilise un cache pour les performances.
 * @param {Date} date
 */
export function getHijriDateSafe(date) {
    const timeKey = date.getTime();
    // Optimisation : Utilisation du cache pour éviter de recalculer la date hégirienne (coûteux)
    if (HIJRI_CACHE.has(timeKey)) return HIJRI_CACHE.get(timeKey);

    try {
        let day = '',
            monthFr = '',
            year = '';

        // Calcul de l'offset dynamique
        let offset = 0;
        const dateISO = DATE_UTILS.toParisISO(date);
        const config = HIJRI_OFFSETS.find((c) => dateISO >= c.start && dateISO <= c.end);
        if (config) offset = config.offset;

        // Application de l'ajustement
        const adjustedDate = new Date(date);
        adjustedDate.setDate(adjustedDate.getDate() + offset);

        const parts = DATE_UTILS.HIJRI_FORMATTER.formatToParts(adjustedDate);
        parts.forEach((p) => {
            if (p.type === 'day') day = p.value;
            if (p.type === 'month') monthFr = p.value;
            if (p.type === 'year') year = p.value;
        });

        const { ar: monthAr, std: monthStd, ta: monthTa } = DATE_UTILS.getHijriNames(monthFr);
        const yearAr = DATE_UTILS.toArabicDigits(year);

        const result = {
            day: day,
            monthNameFR: monthStd,
            monthNameRaw: monthFr,
            monthNameAR: monthAr,
            monthNameTA: monthTa,
            year: year,
            yearAr: yearAr
        };
        HIJRI_CACHE.set(timeKey, result);
        return result;
    } catch {
        return { day: '?', monthNameFR: '', monthNameRaw: '', monthNameAR: '', monthNameTA: '', year: '', yearAr: '' };
    }
}

/**
 * Détermine les événements spéciaux pour une journée donnée.
 * @param {Date} date
 * @param {Object} hijri
 */
export function getDayInfo(date, hijri) {
    let info = {
        isHoliday: false,
        isPublicHoliday: false,
        labels: [], // [{ text, type: 'eid' | 'public' | 'dst' }], tous affichés dans la case
        isNewMoon: false,
        isEid: false,
        isDST: false
    };
    if (typeof CONFIG === 'undefined' || !CONFIG) return info;

    // 1. Initialisation lazy du cache des vacances scolaires
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

    // 3. Vérification Jours Fériés
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    if (CONFIG.publicHolidays && CONFIG.publicHolidays[key]) {
        info.isPublicHoliday = true;
        info.labels.push({ text: CONFIG.publicHolidays[key], type: 'public' });
    }

    // 4. Vérification Changement d'heure (Règle simplifiée UE)
    const m = date.getMonth();
    const d = date.getDate();
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 && d + 7 > 31) {
        if (m === 2) {
            info.isDST = true;
            info.dstType = 'summer';
            info.labels.push({ text: "Heure d'été +1 h", type: 'dst' });
        } else if (m === 9) {
            info.isDST = true;
            info.dstType = 'winter';
            info.labels.push({ text: "Heure d'hiver −1 h", type: 'dst' });
        }
    }

    // 5. Vérification Lune & Aïd
    if (hijri.day == '1') info.isNewMoon = true;
    const hMonth = hijri.monthNameRaw ? hijri.monthNameRaw.toLowerCase() : '';
    if (hijri.day == '1' && (hMonth.includes('chawwal') || hMonth.includes('schawwal'))) {
        info.isEid = true;
        info.eidName = 'Eid-ul-Fitr';
    } else if (hijri.day == '10' && (hMonth.includes('hijja') || hMonth.includes('hija'))) {
        info.isEid = true;
        info.eidName = 'Eid-ul-Adha';
    }
    // L'Aïd en premier : c'est l'information prioritaire pour les fidèles
    if (info.isEid) info.labels.unshift({ text: info.eidName, type: 'eid' });
    return info;
}

/**
 * Normalise les périodes de vacances renvoyées par l'API education.gouv.fr.
 * - L'API donne la date de reprise : on recule d'un jour pour obtenir le dernier jour de vacances.
 * - Les doublons Élèves / Enseignants (été) sont réduits à la période des élèves.
 * - Une période d'un seul jour (pont) ou sans fin connue ("Début des Vacances d'Été") reste visible.
 * @param {Array} records - Enregistrements bruts de l'API
 */
function normalizeSchoolHolidays(records) {
    return records
        .map((item) => item.record.fields)
        .filter((f) => f.population !== 'Enseignants')
        .map((f) => {
            const start = DATE_UTILS.toParisISO(f.start_date);
            const endDate = new Date(f.end_date);
            endDate.setDate(endDate.getDate() - 1);
            let end = DATE_UTILS.toParisISO(endDate);
            if (end < start) {
                // Été annoncé sans date de fin : jusqu'au 31 août ; sinon (pont) : le jour même
                end = /été/i.test(f.description || '') ? `${start.slice(0, 4)}-08-31` : start;
            }
            return { name: (f.description || 'Vacances').replace(/^Début des /, ''), start, end };
        });
}

/**
 * Récupère les données officielles (Jours fériés & Vacances scolaires Zone C).
 * Stratégie "stale-while-revalidate" : le cache localStorage est appliqué immédiatement,
 * puis l'API est toujours interrogée ; onUpdate est rappelé si les données ont changé.
 * @param {Function} onUpdate - Appelée à chaque fois que de nouvelles données sont appliquées
 */
export async function fetchExternalData(onUpdate = () => {}) {
    // Sécurité : Vérifie que l'environnement global est prêt avant de lancer les requêtes
    if (typeof window === 'undefined' || !window.CONFIG) return;

    const apply = (data) => {
        window.CONFIG.publicHolidays = { ...(window.CONFIG.publicHolidays || {}), ...data.publicHolidays };
        window.CONFIG.schoolHolidays = data.schoolHolidays || [];
        parsedHolidaysCache = null; // Force le re-calcul des vacances
    };

    // 1. Cache : affichage immédiat des dernières données connues
    let cachedJSON = null;
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            cachedJSON = JSON.stringify({ publicHolidays: data.publicHolidays, schoolHolidays: data.schoolHolidays });
            apply(data);
            console.log('📦 Données appliquées depuis le cache (localStorage)');
            onUpdate();
        }
    } catch (e) {
        console.warn('Erreur lecture cache:', e);
    }

    // 2. API : toujours interrogée pour récupérer les dates les plus récentes
    try {
        // Vacances depuis le 1er janvier de l'année précédente (couvre l'année scolaire en cours)
        const since = `${new Date().getFullYear() - 1}-01-01`;
        const where = encodeURIComponent(`zones="Zone C" and location="Créteil" and end_date>="${since}"`);
        const [resPublic, resSchool] = await Promise.all([
            fetch('https://calendrier.api.gouv.fr/jours-feries/metropole.json'),
            fetch(
                `https://data.education.gouv.fr/api/explore/v2.0/catalog/datasets/fr-en-calendrier-scolaire/records?select=description,start_date,end_date,population&where=${where}&timezone=Europe/Paris&order_by=start_date&limit=100`
            )
        ]);
        if (!resPublic.ok || !resSchool.ok) throw new Error(`HTTP ${resPublic.status} / ${resSchool.status}`);

        const fresh = {
            publicHolidays: await resPublic.json(),
            schoolHolidays: normalizeSchoolHolidays((await resSchool.json()).records)
        };
        const freshJSON = JSON.stringify(fresh);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), ...fresh }));

        if (freshJSON !== cachedJSON) {
            apply(fresh);
            console.log("✅ Jours fériés et vacances scolaires mis à jour depuis l'API");
            onUpdate();
        }
    } catch (e) {
        console.warn('⚠️ Mode hors ligne ou erreur API : conservation des données en cache.', e);
    }
}

/**
 * Récupère la configuration client (JSON).
 * @param {string} [defaultId] - ID par défaut si non présent dans l'URL.
 */
export async function fetchClientConfig(defaultId = null) {
    const params = new URLSearchParams(window.location.search);
    const mosqueId = params.get('mosque') || defaultId;
    if (!mosqueId) return null;

    try {
        const response = await fetch(`clients/${mosqueId}.json`);
        if (!response.ok) throw new Error(`Client ${mosqueId} introuvable`);
        return await response.json();
    } catch (e) {
        console.error('Erreur chargement config client:', e);
        return null;
    }
}

/**
 * Récupère les surcharges spécifiques pour le Ramadan (horaires manuels).
 */
export async function fetchRamadanOverrides() {
    try {
        const response = await fetch('data/ramadan_overrides.json');
        return response.ok ? await response.json() : {};
    } catch {
        return {};
    }
}

/**
 * Applique le thème global (Couleurs, Pattern) au document.
 * @param {Object} config - Configuration client
 */
export async function applyTheme(config) {
    if (!config?.theme?.color_brand) return;

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

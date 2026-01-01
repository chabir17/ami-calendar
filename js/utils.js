// ==========================================
// UTILS - Fonctions utilitaires (DOM, Dates)
// ==========================================

/**
 * Helpers DOM pour simplifier la manipulation des éléments.
 */
export const DOM = {
    /** Sélectionne un élément (raccourci pour querySelector) */
    get: (selector, root = document) => root.querySelector(selector),

    /** Définit le texte d'un élément s'il existe */
    setText: (selector, text, root = document) => {
        const el = root.querySelector(selector);
        if (el) el.textContent = text;
    },

    /** Définit la source d'une image s'il existe */
    setSrc: (selector, src, root = document) => {
        const el = root.querySelector(selector);
        if (el) el.src = src;
    },

    /** Affiche ou masque un élément (display: flex ou none) */
    setDisplay: (selector, show, root = document, displayType = 'flex') => {
        const el = root.querySelector(selector);
        if (el) {
            el.style.display = show ? displayType : 'none';
        }
        return el;
    }
};

/**
 * Données unifiées pour les mois hégiriens.
 * Gère les variations de translittération selon les OS/Navigateurs (CLDR versions).
 * Clé : Nom brut retourné par Intl (minuscule).
 * Valeur : { ar: Arabe, std: Translittération Standard }
 */
const HIJRI_MONTHS_DATA = {
    mouharram: { ar: 'محرم', std: 'Muḥarram' },
    muharram: { ar: 'محرم', std: 'Muḥarram' },
    safar: { ar: 'صفر', std: 'Ṣafar' },
    'rabia al awal': { ar: 'ربيع الأول', std: 'Rabīʿ al-awwal' },
    'rabiʻ al-awwal': { ar: 'ربيع الأول', std: 'Rabīʿ al-awwal' },
    'rabiʻ i': { ar: 'ربيع الأول', std: 'Rabīʿ al-awwal' },
    "rabi' i": { ar: 'ربيع الأول', std: 'Rabīʿ al-awwal' },
    'rabia ath-thani': { ar: 'ربيع الآخر', std: 'Rabīʿ ath-thānī' },
    'rabiʻ ath-thani': { ar: 'ربيع الآخر', std: 'Rabīʿ ath-thānī' },
    'rabiʻ ii': { ar: 'ربيع الآخر', std: 'Rabīʿ ath-thānī' },
    "rabi' ii": { ar: 'ربيع الآخر', std: 'Rabīʿ ath-thānī' },
    'joumada al oula': { ar: 'جمادى الأولى', std: 'Jumādā al-ūlā' },
    'jumada al-ula': { ar: 'جمادى الأولى', std: 'Jumādā al-ūlā' },
    'jumada i': { ar: 'جمادى الأولى', std: 'Jumādā al-ūlā' },
    "jumada' i": { ar: 'جمادى الأولى', std: 'Jumādā al-ūlā' },
    'joumada ath-thania': { ar: 'جمادى الآخرة', std: 'Jumādā ath-thāniya' },
    'jumada al-akhira': { ar: 'جمادى الآخرة', std: 'Jumādā ath-thāniya' },
    'jumada ii': { ar: 'جمادى الآخرة', std: 'Jumādā ath-thāniya' },
    "jumada' ii": { ar: 'جمادى الآخرة', std: 'Jumādā ath-thāniya' },
    rajab: { ar: 'رجب', std: 'Rajab' },
    chaʻban: { ar: 'شعبان', std: 'Shaʿbān' },
    chaabane: { ar: 'شعبان', std: 'Shaʿbān' },
    "cha'ban": { ar: 'شعبان', std: 'Shaʿbān' },
    shaʻban: { ar: 'شعبان', std: 'Shaʿbān' },
    shaban: { ar: 'شعبان', std: 'Shaʿbān' },
    ramadan: { ar: 'رمضان', std: 'Ramaḍān' },
    chawwal: { ar: 'شوال', std: 'Shawwāl' },
    shawwal: { ar: 'شوال', std: 'Shawwāl' },
    'dhou al qi`da': { ar: 'ذو القعدة', std: 'Dhū al-Qaʿdah' },
    'dhou al-qiʻda': { ar: 'ذو القعدة', std: 'Dhū al-Qaʿdah' },
    'dhu al-qaʻdah': { ar: 'ذو القعدة', std: 'Dhū al-Qaʿdah' },
    'dhul qadah': { ar: 'ذو القعدة', std: 'Dhū al-Qaʿdah' },
    'dhuʻl-qiʻdah': { ar: 'ذو القعدة', std: 'Dhū al-Qaʿdah' },
    "dhu'l-qi'dah": { ar: 'ذو القعدة', std: 'Dhū al-Qaʿdah' },
    'dhou al-hijja': { ar: 'ذو الحجة', std: 'Dhū al-Ḥijjah' },
    'dhu al-hijjah': { ar: 'ذو الحجة', std: 'Dhū al-Ḥijjah' },
    'dhul hijjah': { ar: 'ذو الحجة', std: 'Dhū al-Ḥijjah' },
    'dhuʻl-hijjah': { ar: 'ذو الحجة', std: 'Dhū al-Ḥijjah' },
    "dhu'l-hijjah": { ar: 'ذو الحجة', std: 'Dhū al-Ḥijjah' }
};

/**
 * Liste des mois hégiriens en anglais pour le fallback manuel.
 * Utilisé uniquement si Intl échoue sur Android.
 */
const FALLBACK_MONTHS = [
    'Muharram', 'Safar', "Rabi' al-awwal", "Rabi' al-thani",
    'Jumada al-awwal', 'Jumada al-thani', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

/**
 * Algorithme Tabulaire (Kuwaiti) pour convertir une date Grégorienne en Hégirienne.
 * Sert de secours (fallback) quand Intl.DateTimeFormat ne fonctionne pas (ex: Android Pixel).
 */
function getHijriDateFallback(date) {
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();

    let m = month + 1;
    let y = year;
    if (m < 3) { y -= 1; m += 12; }

    let a = Math.floor(y / 100);
    let b = 2 - a + Math.floor(a / 4);
    if (y < 1583) b = 0;
    if (y === 1582) {
        if (m > 10) b = -10;
        if (m === 10) { b = 0; if (day > 4) b = -10; }
    }

    let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
    let b0 = 0;
    if (jd > 2299160) {
        let a = Math.floor((jd - 1867216.25) / 36524.25);
        b0 = 1 + a - Math.floor(a / 4);
    }
    let bb = jd + b0 + 1524;
    let cc = Math.floor((bb - 122.1) / 365.25);
    let dd = Math.floor(365.25 * cc);
    let ee = Math.floor((bb - dd) / 30.6001);
    day = (bb - dd) - Math.floor(30.6001 * ee);
    month = ee - 1;
    if (ee > 13) { cc += 1; month = ee - 13; }
    year = cc - 4716;

    let iyear = 10631.0 / 30.0;
    let epochcivil = 1948085;
    let z = jd - epochcivil;
    let cyc = Math.floor(z / 10631.0);
    z = z - 10631 * cyc;
    let j = Math.floor((z - 0.1335) / iyear); // 0.1335 = 8.01/60
    let iy = 30 * cyc + j;
    z = z - Math.floor(j * iyear + 0.1335);
    let im = Math.floor((z + 28.5001) / 29.5);
    if (im === 13) im = 12;
    let id = z - Math.floor(29.5001 * im - 29);

    return {
        day: id.toString(),
        monthName: FALLBACK_MONTHS[im - 1],
        year: iy.toString()
    };
}

/**
 * Configuration et formatage pour les dates.
 */
export const DATE_UTILS = {
    /** Formatteur Hégirien (Islamique) - Fallback sur 'islamic' (Umalqura) car 'islamic-civil' bug sur certains Android */
    HIJRI_FORMATTER: new Intl.DateTimeFormat('en-US', {
        calendar: 'islamic',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }),

    ARABIC_DIGITS: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],

    /**
     * Vérifie si le navigateur supporte réellement le calendrier islamique.
     * Retourne false si l'année actuelle est > 2000 (donc Grégorien).
     */
    isIntlHijriSupported: () => {
        try {
            const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic', { year: 'numeric' }).formatToParts(new Date());
            const yearPart = parts.find(p => p.type === 'year');
            return yearPart && parseInt(yearPart.value) < 2000;
        } catch (e) {
            return false;
        }
    },

    /** Expose la fonction de fallback pour usage externe */
    getHijriDateFallback,

    /**
     * Convertit une chaîne de date en format ISO (YYYY-MM-DD)
     * en forçant le fuseau horaire Europe/Paris.
     */
    toParisISO: (dateStr) => {
        const dtf = new Intl.DateTimeFormat('fr-FR', {
            timeZone: 'Europe/Paris',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // Extraction sécurisée des parties
        const parts = dtf.formatToParts(new Date(dateStr));
        const getPart = (type) => parts.find((p) => p.type === type).value;

        return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    },

    /** Convertit les chiffres latins en chiffres arabes */
    toArabicDigits: (str) => str.replace(/\d/g, (d) => DATE_UTILS.ARABIC_DIGITS[d]),

    /**
     * Récupère les noms localisés (Arabe & Standard) à partir du nom brut Intl.
     */
    getHijriNames: (rawName) => {
        const key = rawName.toLowerCase().trim();
        const data = HIJRI_MONTHS_DATA[key];
        return {
            ar: data ? data.ar : key,
            std: data ? data.std : rawName
        };
    }
};

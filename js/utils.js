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

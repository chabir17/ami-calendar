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
 * Configuration et formatage pour les dates.
 */
export const DATE_UTILS = {
    /** Formatteur Hégirien (Islamique Civil) */
    HIJRI_FORMATTER: new Intl.DateTimeFormat('fr-FR-u-ca-islamic-civil', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }),

    /** Mapping Mois Français -> Arabe */
    MONTH_MAP_FR_AR: {
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
    },

    ARABIC_DIGITS: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],

    /**
     * Convertit une chaîne de date en format ISO (YYYY-MM-DD)
     * en forçant le fuseau horaire Europe/Paris.
     */
    toParisISO: (dateStr) => {
        const dtf = new Intl.DateTimeFormat('en-US', {
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
    toArabicDigits: (str) => str.replace(/\d/g, (d) => DATE_UTILS.ARABIC_DIGITS[d])
};

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

/** Numéro français « 01.48.36.48.66 » -> format international « 33148364866 » */
const intlPhone = (num) => '33' + String(num).replace(/\D/g, '').replace(/^0/, '');

/**
 * HTML des coordonnées de l'association (lignes avec icône).
 * - 'columns' (calendrier annuel) : 4 colonnes de 2 lignes (adresses | téléphones | en ligne | IBAN, BIC).
 * - 'rows' (page Ramadan) : 3 lignes (adresses | téléphones, e-mail, site | IBAN • BIC), siège en premier.
 * @param {Object} c - config.contact (addr1/addr2 + icônes facultatives, phone, whatsapp, email, website, bank)
 * @param {'columns'|'rows'} layout
 * @param {boolean} links - coordonnées cliquables (appel, WhatsApp, e-mail, plan, site) pour les PDF numériques
 */
export function contactsHTML(c, layout = 'columns', links = false) {
    const line = (icon, text, href) => {
        if (!text) return '';
        const label = links && href ? `<a href="${href}">${text}</a>` : text;
        return `<div class="info-line"><svg class="icon"><use href="assets/icons/icon-${icon}.svg#icon"></use></svg> <span>${label}</span></div>`;
    };
    const group = (lines) => `<div class="contact-group">${lines.filter(Boolean).join('')}</div>`;
    const map = (addr) => addr && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    const addr1 = line(c.addr1_icon || 'location', c.addr1, map(c.addr1));
    const addr2 = line(c.addr2_icon || 'location', c.addr2, map(c.addr2));
    const phone = line('phone', c.phone, c.phone && `tel:+${intlPhone(c.phone)}`);
    const whatsapp = line('whatsapp', c.whatsapp, c.whatsapp && `https://wa.me/${intlPhone(c.whatsapp)}`);
    const email = line('email', c.email, c.email && `mailto:${c.email}`);
    const website = line('website', c.website, c.website && `https://${c.website}`);

    if (layout === 'rows') {
        return [group([addr2, addr1]), group([phone, whatsapp, email, website]), c.bank && group([line('bank', `IBAN\u00a0: ${c.bank.iban} • BIC\u00a0: ${c.bank.bic}`)])].join('');
    }
    return [
        group([addr1, addr2]),
        group([phone, whatsapp]),
        group([email, website]),
        c.bank && group([line('bank', `IBAN\u00a0: ${c.bank.iban}`), `<div class="info-line info-cont"><span>BIC\u00a0: ${c.bank.bic}</span></div>`])
    ].join('');
}

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
 * Noms tamouls des mois hégiriens, indexés par la translittération standard.
 */
const HIJRI_MONTHS_TA = {
    Muḥarram: 'முஹர்ரம்',
    Ṣafar: 'ஸஃபர்',
    'Rabīʿ al-awwal': 'ரபீஉல் அவ்வல்',
    'Rabīʿ ath-thānī': 'ரபீஉல் ஆகிர்',
    'Jumādā al-ūlā': 'ஜுமாதல் ஊலா',
    'Jumādā ath-thāniya': 'ஜுமாதல் ஆகிரா',
    Rajab: 'ரஜப்',
    Shaʿbān: 'ஷஃபான்',
    Ramaḍān: 'ரமளான்',
    Shawwāl: 'ஷவ்வால்',
    'Dhū al-Qaʿdah': 'துல் கஃதா',
    'Dhū al-Ḥijjah': 'துல் ஹஜ்'
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

    ARABIC_DIGITS: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],

    /**
     * Formate une date en YYYY-MM-DD.
     */
    format: (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    /**
     * Convertit une chaîne de date en format ISO (YYYY-MM-DD)
     * en forçant le fuseau horaire Europe/Paris.
     */
    toParisISO: (dateInput) => {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        const dtf = new Intl.DateTimeFormat('fr-FR', {
            timeZone: 'Europe/Paris',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // Extraction sécurisée des parties
        const parts = dtf.formatToParts(date);
        const getPart = (type) => parts.find((p) => p.type === type).value;

        return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    },

    /**
     * Indique si la date est en heure d'été (règle UE) :
     * du dernier dimanche de mars (inclus) au dernier dimanche d'octobre (exclu).
     */
    isSummerTime: (date) => {
        const y = date.getFullYear();
        const lastSunday = (month) => {
            const d = new Date(y, month + 1, 0);
            d.setDate(d.getDate() - d.getDay());
            return d;
        };
        const day = new Date(y, date.getMonth(), date.getDate());
        return day >= lastSunday(2) && day < lastSunday(9);
    },

    /** Convertit les chiffres latins en chiffres arabes */
    toArabicDigits: (str) => str.replace(/\d/g, (d) => DATE_UTILS.ARABIC_DIGITS[d]),

    /**
     * Récupère les noms localisés (Arabe, Standard & Tamoul) à partir du nom brut Intl.
     */
    getHijriNames: (rawName) => {
        const key = rawName.toLowerCase().trim();
        const data = HIJRI_MONTHS_DATA[key];
        const std = data ? data.std : rawName;
        return {
            ar: data ? data.ar : key,
            std,
            ta: HIJRI_MONTHS_TA[std] || ''
        };
    }
};

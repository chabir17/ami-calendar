// ==========================================
// UTILS - Fonctions utilitaires (DOM, Dates)
// ==========================================

/**
 * Helpers DOM pour simplifier la manipulation des éléments.
 */
export const DOM = {
    /** Définit le texte d'un élément s'il existe */
    setText: (selector, text, root = document) => {
        const el = root.querySelector(selector);
        if (el) el.textContent = text;
    },

    /** Définit la source d'une image s'il existe */
    setSrc: (selector, src, root = document) => {
        const el = root.querySelector(selector);
        if (el) el.src = src;
    }
};

/** Icône du changement d'heure : horloge qui avance (été) ou recule (hiver) */
export const dstIconHTML = (dstType) => `<svg class="icon"><use href="assets/icons/icon-dst-${dstType === 'summer' ? 'forward' : 'back'}.svg#icon"></use></svg>`;

/** Formatteur réutilisé (créer un Intl.DateTimeFormat est coûteux) */
const PARIS_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Dernier dimanche d'un mois (month : 0-11) */
const lastSunday = (year, month) => {
    const d = new Date(year, month + 1, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
};

/** Numéro français « 01.48.36.48.66 » -> format international « 33148364866 » */
const intlPhone = (num) => '33' + String(num).replace(/\D/g, '').replace(/^0/, '');

/**
 * HTML des coordonnées de l'association (lignes avec icône).
 * - 'columns' (calendrier annuel) : grille de 3 lignes (adresse | téléphones, adresse | e-mail et site, IBAN • BIC).
 * - 'rows' (page Ramadan) : 3 lignes (adresses | téléphones, e-mail, site | IBAN • BIC), siège en premier.
 * @param {Object} c - config.contact (addr1/addr2 + icônes facultatives, phone, whatsapp, email, website, bank)
 * @param {'columns'|'rows'} layout
 * @param {boolean} links - coordonnées cliquables (appel, WhatsApp, e-mail, plan, site) pour les PDF numériques
 */
export function contactsHTML(c, layout = 'columns', links = false) {
    const item = (icon, text, href) => {
        if (!text) return '';
        const label = links && href ? `<a href="${href}">${text}</a>` : text;
        return `<svg class="icon"><use href="assets/icons/icon-${icon}.svg#icon"></use></svg> <span>${label}</span>`;
    };
    // Une ligne réunit une ou plusieurs coordonnées (chacune avec son icône)
    const line = (...items) => {
        const xs = items.filter(Boolean);
        if (!xs.length) return '';
        return xs.length === 1 ? `<div class="info-line">${xs[0]}</div>` : `<div class="info-line">${xs.map((x) => `<span class="info-item">${x}</span>`).join('')}</div>`;
    };
    const group = (lines) => `<div class="contact-group">${lines.filter(Boolean).join('')}</div>`;
    const map = (addr) => addr && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    const addr1 = item(c.addr1_icon || 'location', c.addr1, map(c.addr1));
    const addr2 = item(c.addr2_icon || 'location', c.addr2, map(c.addr2));
    const phone = item('phone', c.phone, c.phone && `tel:+${intlPhone(c.phone)}`);
    const whatsapp = item('whatsapp', c.whatsapp, c.whatsapp && `https://wa.me/${intlPhone(c.whatsapp)}`);
    const email = item('email', c.email, c.email && `mailto:${c.email}`);
    const website = item('website', c.website, c.website && `https://${c.website}`);
    const bank = c.bank && item('bank', `IBAN\u00a0: ${c.bank.iban} • BIC\u00a0: ${c.bank.bic}`);

    if (layout === 'rows') {
        return [group([line(addr2), line(addr1)]), group([phone, whatsapp, email, website].map((x) => line(x))), group([line(bank)])].join('');
    }
    // Grille de 3 lignes : adresse | téléphones, adresse | e-mail et site, puis IBAN • BIC sur toute la largeur
    return [line(addr1), line(phone, whatsapp), line(addr2), line(email, website), bank && `<div class="info-line info-wide">${bank}</div>`].filter(Boolean).join('');
}

/**
 * Mois hégiriens, dans l'ordre (index 0 = Muḥarram) : translittération standard, arabe, tamoul.
 * Indexés par numéro de mois : aucune dépendance aux noms renvoyés par le navigateur (variables selon l'OS).
 */
const HIJRI_MONTHS = [
    { std: 'Muḥarram', ar: 'محرم', ta: 'முஹர்ரம்' },
    { std: 'Ṣafar', ar: 'صفر', ta: 'ஸஃபர்' },
    { std: 'Rabīʿ al-awwal', ar: 'ربيع الأول', ta: 'ரபீஉல் அவ்வல்' },
    { std: 'Rabīʿ ath-thānī', ar: 'ربيع الآخر', ta: 'ரபீஉல் ஆகிர்' },
    { std: 'Jumādā al-ūlā', ar: 'جمادى الأولى', ta: 'ஜுமாதல் ஊலா' },
    { std: 'Jumādā ath-thāniya', ar: 'جمادى الآخرة', ta: 'ஜுமாதல் ஆகிரா' },
    { std: 'Rajab', ar: 'رجب', ta: 'ரஜப்' },
    { std: 'Shaʿbān', ar: 'شعبان', ta: 'ஷஃபான்' },
    { std: 'Ramaḍān', ar: 'رمضان', ta: 'ரமளான்' },
    { std: 'Shawwāl', ar: 'شوال', ta: 'ஷவ்வால்' },
    { std: 'Dhū al-Qaʿdah', ar: 'ذو القعدة', ta: 'துல் கஃதா' },
    { std: 'Dhū al-Ḥijjah', ar: 'ذو الحجة', ta: 'துல் ஹஜ்' }
];

/** Jour julien du 1er jour d'un mois du calendrier hégirien civil (tabulaire, époque du 16 juillet 622) */
const hijriToJD = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948438.5;

/**
 * Configuration et formatage pour les dates.
 */
export const DATE_UTILS = {
    /**
     * Date hégirienne civile (calendrier tabulaire, identique à Intl « islamic-civil ») calculée sans Intl :
     * même résultat sur tous les navigateurs, y compris mobiles (où le calendrier ou les noms de mois Intl varient).
     * @returns {{ day: number, month: number, year: number }} mois de 1 (Muḥarram) à 12
     */
    toHijriCivil: (date) => {
        const jd = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000 + 2440587.5) + 0.5;
        const year = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631);
        const month = Math.min(12, Math.ceil((jd - (29 + hijriToJD(year, 1, 1))) / 29.5) + 1);
        return { day: jd - hijriToJD(year, month, 1) + 1, month, year };
    },

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
        const parts = Object.fromEntries(PARIS_DATE_FORMATTER.formatToParts(date).map((p) => [p.type, p.value]));
        return `${parts.year}-${parts.month}-${parts.day}`;
    },

    /**
     * Indique si la date est en heure d'été (règle UE) :
     * du dernier dimanche de mars (inclus) au dernier dimanche d'octobre (exclu).
     */
    isSummerTime: (date) => {
        const y = date.getFullYear();
        const day = new Date(y, date.getMonth(), date.getDate());
        return day >= lastSunday(y, 2) && day < lastSunday(y, 9);
    },

    /** Jour du changement d'heure : 'summer' (dernier dimanche de mars), 'winter' (d'octobre) ou null */
    dstChange: (date) => {
        const m = date.getMonth();
        if ((m !== 2 && m !== 9) || date.getDate() !== lastSunday(date.getFullYear(), m).getDate()) return null;
        return m === 2 ? 'summer' : 'winter';
    },

    /** Convertit les chiffres latins en chiffres arabes */
    toArabicDigits: (str) => str.replace(/\d/g, (d) => DATE_UTILS.ARABIC_DIGITS[d]),

    /** Noms du mois hégirien (1 = Muḥarram … 12 = Dhū al-Ḥijjah) : standard, arabe, tamoul */
    getHijriNames: (month) => HIJRI_MONTHS[month - 1]
};

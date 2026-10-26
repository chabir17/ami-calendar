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
 * Feuille du Ramadan : 3 groupes (adresses | téléphones, e-mail, site | IBAN • BIC), siège en premier. Le header du
 * calendrier annuel n'affiche plus de coordonnées (elles sont sur la couverture).
 * @param {Object} c - config.contact (addr1/addr2 + icônes facultatives, phone, whatsapp, email, website, bank)
 * @param {boolean} links - coordonnées cliquables (appel, WhatsApp, e-mail, plan, site) pour les PDF numériques
 */
export function contactsHTML(c, links = false) {
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
    const placeIcon = (icon) => icon || 'location';
    const addr1 = item(placeIcon(c.addr1_icon), c.addr1, map(c.addr1));
    const addr2 = item(placeIcon(c.addr2_icon), c.addr2, map(c.addr2));
    const phone = item('phone', c.phone, c.phone && `tel:+${intlPhone(c.phone)}`);
    const whatsapp = item('whatsapp', c.whatsapp, c.whatsapp && `https://wa.me/${intlPhone(c.whatsapp)}`);
    const email = item('email', c.email, c.email && `mailto:${c.email}`);
    const website = item('website', c.website, c.website && `https://${c.website}`);
    const bank = c.bank && item('bank', `IBAN\u00a0: ${c.bank.iban} • BIC\u00a0: ${c.bank.bic}`);

    return [group([line(addr2), line(addr1)]), group([phone, whatsapp, email, website].map((x) => line(x))), group([line(bank)])].join('');
}

/**
 * Mois hégiriens, dans l'ordre (index 0 = Muḥarram) : translittération standard, arabe, tamoul.
 * short / taShort : formes abrégées (I, II) des mois jumeaux, pour le bandeau quand deux mois se partagent la ligne.
 * Indexés par numéro de mois : aucune dépendance aux noms renvoyés par le navigateur (variables selon l'OS).
 */
const HIJRI_MONTHS = [
    { std: 'Muḥarram', ar: 'محرم', ta: 'முஹர்ரம்' },
    { std: 'Ṣafar', ar: 'صفر', ta: 'ஸஃபர்' },
    { std: 'Rabīʿ al-awwal', short: 'Rabīʿ I', ar: 'ربيع الأول', ta: 'ரபீஉல் அவ்வல்', taShort: 'ரபீஉ I' },
    { std: 'Rabīʿ ath-thānī', short: 'Rabīʿ II', ar: 'ربيع الآخر', ta: 'ரபீஉல் ஆகிர்', taShort: 'ரபீஉ II' },
    { std: 'Jumādā al-ūlā', short: 'Jumādā I', ar: 'جمادى الأولى', ta: 'ஜுமாதல் ஊலா', taShort: 'ஜுமாதா I' },
    { std: 'Jumādā ath-thāniya', short: 'Jumādā II', ar: 'جمادى الآخرة', ta: 'ஜுமாதல் ஆகிரா', taShort: 'ஜுமாதா II' },
    { std: 'Rajab', ar: 'رجب', ta: 'ரஜப்' },
    { std: 'Shaʿbān', ar: 'شعبان', ta: 'ஷஃபான்' },
    { std: 'Ramaḍān', ar: 'رمضان', ta: 'ரமளான்' },
    { std: 'Shawwāl', ar: 'شوال', ta: 'ஷவ்வால்' },
    { std: 'Dhū al-Qaʿdah', ar: 'ذو القعدة', ta: 'துல் கஃதா' },
    { std: 'Dhū al-Ḥijjah', ar: 'ذو الحجة', ta: 'துல் ஹஜ்' }
];

/** Jour julien du 1er jour d'un mois du calendrier hégirien civil (tabulaire, époque du 16 juillet 622) */
/**
 * Calendrier Umm al-Qura (référence de l'AMI) : date grégorienne du 1er de chaque mois hégirien, de Muḥarram à Dhū al-Ḥijja
 * (« MM-JJ », l'année grégorienne se déduit de l'ordre). Table figée, générée avec Intl « islamic-umalqura » (ICU) :
 * même résultat sur tous les navigateurs. À prolonger pour les années suivantes (voir docs/TECHNIQUE.md, 4.2).
 */
const UMM_AL_QURA_STARTS = {
    1445: '07-19 08-17 09-16 10-16 11-15 12-14 01-13 02-11 03-11 04-10 05-09 06-07',
    1446: '07-07 08-05 09-04 10-04 11-03 12-02 01-01 01-31 03-01 03-30 04-29 05-28',
    1447: '06-26 07-26 08-24 09-23 10-23 11-22 12-21 01-20 02-18 03-20 04-18 05-18',
    1448: '06-16 07-15 08-14 09-12 10-12 11-11 12-10 01-09 02-08 03-09 04-08 05-07',
    1449: '06-06 07-05 08-03 09-02 10-01 10-31 11-29 12-29 01-28 02-26 03-27 04-26',
    1450: '05-25 06-24 07-23 08-22 09-20 10-19 11-18 12-17 01-16 02-14 03-16 04-15',
    1451: '05-14 06-13 07-13 08-12 09-10 10-09 11-08 12-07 01-05 02-04 03-06 04-04',
    1452: '05-04 06-03 07-02 08-01 08-31 09-29 10-28 11-27 12-26 01-24 02-23 03-24',
    1453: '04-23 05-23 06-21 07-21 08-20 09-18 10-18 11-16 12-16 01-14 02-12 03-13'
};

/** Débuts de mois Umm al-Qura en jours UTC depuis 1970, triés : [{ year, month, day0 }] */
const UMM_AL_QURA = (() => {
    const out = [];
    let gy = 2023;
    let prev = 0;
    for (const [y, list] of Object.entries(UMM_AL_QURA_STARTS)) {
        list.split(' ').forEach((md, i) => {
            const [m, d] = md.split('-').map(Number);
            if (m < prev) gy++; // passage à l'année grégorienne suivante
            prev = m;
            out.push({ year: Number(y), month: i + 1, day0: Date.UTC(gy, m - 1, d) / 86400000 });
        });
    }
    return out;
})();

const hijriToJD = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948438.5;

/**
 * Configuration et formatage pour les dates.
 */
export const DATE_UTILS = {
    /**
     * Date hégirienne selon le calendrier Umm al-Qura (table UMM_AL_QURA_STARTS), sans Intl : même résultat sur tous
     * les navigateurs, y compris mobiles (où le calendrier ou les noms de mois Intl varient).
     * @returns {{ day: number, month: number, year: number }} mois de 1 (Muḥarram) à 12
     */
    toHijriUmmAlQura: (date) => {
        const day0 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
        const last = UMM_AL_QURA[UMM_AL_QURA.length - 1];
        if (day0 < UMM_AL_QURA[0].day0 || day0 >= last.day0 + 30) return DATE_UTILS.toHijriCivil(date); // hors table : calcul civil
        let i = UMM_AL_QURA.length - 1;
        while (UMM_AL_QURA[i].day0 > day0) i--;
        const { year, month } = UMM_AL_QURA[i];
        return { day: day0 - UMM_AL_QURA[i].day0 + 1, month, year };
    },

    /**
     * Date hégirienne civile (calendrier tabulaire, identique à Intl « islamic-civil »), calculée sans Intl :
     * secours de toHijriUmmAlQura hors de sa table.
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

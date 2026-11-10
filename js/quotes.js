import { getHijriDateSafe } from './services.js';

// ==========================================
// CITATION DU MOIS (encart sous la légende du calendrier des mois)
// ==========================================
// Un hadith par page, choisi pour rappeler une obligation, un pilier ou une Sunna à appliquer.
// Sources : Coran et recueils d'al-Bukhārī et de Muslim uniquement (hadiths authentiques, numérotation usuelle).
// Textes courts (≈ 100 caractères au plus) : la citation tient sur une ligne. Traductions françaises à faire valider par les imams.
// `fr` seul pour l'instant ; `ar` (texte du hadith) et `ta` (après validation par un membre tamoulophone) s'affichent en lignes supplémentaires dès qu'ils sont renseignés.
// `prayers` : colonne(s) du tableau des horaires soulignée(s) (fajr, dhuhr, asr, maghrib, icha).

/** Citations liées à un temps fort du mois hégirien, par ordre de priorité. */
const EVENT_QUOTES = [
    {
        // 1er Ramaḍān
        match: (h) => h.monthNameFR === 'Ramaḍān' && h.day === '1',
        fr: 'Qui jeûne le Ramaḍān avec foi, en espérant la récompense d’Allah, ses péchés passés lui sont pardonnés.',
        source: 'Bukhārī 38, Muslim 760'
    },
    {
        // Aïd al-Fiṭr (1er Shawwāl)
        match: (h) => h.monthNameFR === 'Shawwāl' && h.day === '1',
        fr: 'Jeûner le Ramaḍān puis six jours de Shawwāl, c’est comme jeûner toute l’année.',
        source: 'Muslim 1164'
    },
    {
        // ʿArafa et Aïd al-Aḍḥā (9 et 10 Dhū al-Ḥijjah)
        match: (h) => h.monthNameFR === 'Dhū al-Ḥijjah' && (h.day === '9' || h.day === '10'),
        fr: 'Aucune œuvre ne vaut mieux que celles des dix premiers jours de Dhū l-Ḥijjah.',
        source: 'Bukhārī 969'
    },
    {
        // ʿĀshūrāʾ (10 Muḥarram)
        match: (h) => h.monthNameFR === 'Muḥarram' && h.day === '10',
        fr: 'Le jeûne d’ʿĀshūrāʾ efface, j’espère, les péchés de l’année précédente.',
        source: 'Muslim 1162'
    }
];

/** Citations liées au mois hégirien en cours au 15 du mois grégorien (faute de temps fort sur la page). */
const MONTH_QUOTES = {
    'Dhū al-Qaʿdah': {
        fr: 'Qui fait le pèlerinage sans obscénité ni péché revient comme au jour de sa naissance.',
        source: 'Bukhārī 1521, Muslim 1350'
    },
    Shaʿbān: {
        fr: 'Le Prophète jeûnait plus en Shaʿbān que dans tout autre mois, hors Ramaḍān.',
        source: 'Bukhārī 1969, Muslim 1156'
    }
};

/** Citations de rappel par mois grégorien (1 = janvier), quand la page n'a ni temps fort ni mois dédié. */
const DEFAULT_QUOTES = {
    1: { fr: 'Qui prie le Fajr et l’Asr entrera au Paradis.', source: 'Bukhārī 574, Muslim 635', prayers: ['fajr', 'asr'] },
    2: { fr: 'La meilleure prière après la prière obligatoire est la prière de nuit.', source: 'Muslim 1163' },
    3: { fr: 'Les cinq prières lavent les péchés comme un fleuve où l’on se baigne cinq fois par jour.', source: 'Bukhārī 528, Muslim 667' },
    4: { fr: 'Sans la crainte de vous accabler, je vous aurais ordonné le siwāk à chaque prière.', source: 'Bukhārī 887, Muslim 252' },
    5: { fr: 'Après chaque prière, dire 33 fois Subḥān Allāh, 33 fois Al-ḥamdu li-llāh et 33 fois Allāhu akbar.', source: 'Muslim 597' },
    6: { fr: 'L’aumône ne diminue jamais les biens.', source: 'Muslim 2588' },
    7: { fr: 'Les cinq prières, et d’un vendredi à l’autre, effacent les péchés commis entre elles.', source: 'Muslim 233', prayers: ['dhuhr'] },
    8: { fr: 'Jeûner trois jours par mois, prier deux rakʿa de Ḍuḥā, et le witr avant de dormir.', source: 'Bukhārī 1981, Muslim 721' },
    9: { fr: 'La prière accomplie à son heure est l’œuvre la plus aimée d’Allah.', source: 'Bukhārī 527, Muslim 85' },
    10: { fr: 'Qui prie Icha en groupe est comme s’il avait prié la moitié de la nuit.', source: 'Muslim 656', prayers: ['icha'] },
    11: { fr: 'Les deux rakʿa de l’aube valent mieux que ce bas monde et tout ce qu’il contient.', source: 'Muslim 725', prayers: ['fajr'] },
    12: { fr: 'Celui qui manque la prière de l’Asr, c’est comme s’il avait perdu sa famille et ses biens.', source: 'Bukhārī 552, Muslim 626', prayers: ['asr'] }
};

/**
 * Choisit la citation d'une page : temps fort du mois hégirien d'abord (Ramaḍān, Aïds, dix jours, ʿĀshūrāʾ),
 * puis mois hégirien dédié (pèlerinage, Shaʿbān) au 15 du mois grégorien, enfin le rappel du mois grégorien.
 * @param {number} year
 * @param {number} month - 1 à 12
 */
export function pickQuote(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const hijriDays = Array.from({ length: daysInMonth }, (_, i) => getHijriDateSafe(new Date(year, month - 1, i + 1)));
    for (const quote of EVENT_QUOTES) {
        if (hijriDays.some(quote.match)) return quote;
    }
    return MONTH_QUOTES[hijriDays[14].monthNameFR] ?? DEFAULT_QUOTES[month];
}

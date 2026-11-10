import { getHijriDateSafe } from './services.js';

// ==========================================
// CITATION DU MOIS (encart sous la légende du calendrier des mois)
// ==========================================
// Un hadith par page, choisi pour rappeler une obligation, un pilier ou une Sunna à appliquer.
// Sources : Coran et recueils d'al-Bukhārī et de Muslim uniquement (hadiths authentiques, numérotation usuelle).
// Textes courts (≈ 100 caractères au plus) : la citation tient sur une ligne. Traductions françaises à faire valider par les imams.
// Deux langues : `fr` (traduction) et `ta` (traduction tamoule, À FAIRE VALIDER par un membre tamoulophone ; facultative : sans elle, la ligne n'est pas affichée).
// Pas de texte arabe : le calendrier peut être jeté, ce qui serait irrespectueux pour une parole du Prophète (décision de l'utilisateur, 08/11/2026).
// `prayers` : colonne(s) du tableau des horaires soulignée(s) (fajr, dhuhr, asr, maghrib, icha).

/** Citations liées à un temps fort du mois hégirien, par ordre de priorité. */
const EVENT_QUOTES = [
    {
        // 1er Ramaḍān
        match: (h) => h.monthNameFR === 'Ramaḍān' && h.day === '1',
        fr: 'Qui jeûne le Ramaḍān avec foi, en espérant la récompense d’Allah, ses péchés passés lui sont pardonnés.',
        source: 'Bukhārī 38, Muslim 760',
        ta: 'ஈமானுடனும் நன்மையை எதிர்பார்த்தும் ரமளானில் நோன்பு நோற்பவரின் முந்தைய பாவங்கள் மன்னிக்கப்படும்.'
    },
    {
        // Aïd al-Fiṭr (1er Shawwāl)
        match: (h) => h.monthNameFR === 'Shawwāl' && h.day === '1',
        fr: 'Jeûner le Ramaḍān puis six jours de Shawwāl, c’est comme jeûner toute l’année.',
        source: 'Muslim 1164',
        ta: 'ரமளானையும் ஷவ்வாலின் ஆறு நோன்புகளையும் நோற்பவர், ஆண்டு முழுவதும் நோன்பு நோற்றவர் போன்றவர்.'
    },
    {
        // ʿArafa et Aïd al-Aḍḥā (9 et 10 Dhū al-Ḥijjah)
        match: (h) => h.monthNameFR === 'Dhū al-Ḥijjah' && (h.day === '9' || h.day === '10'),
        fr: 'Aucune œuvre ne vaut mieux que celles des dix premiers jours de Dhū l-Ḥijjah.',
        source: 'Bukhārī 969',
        ta: 'துல் ஹஜ்ஜின் முதல் பத்து நாட்களில் செய்யும் நற்செயலை விடச் சிறந்த செயல் வேறில்லை.'
    },
    {
        // ʿĀshūrāʾ (10 Muḥarram)
        match: (h) => h.monthNameFR === 'Muḥarram' && h.day === '10',
        fr: 'Le jeûne d’ʿĀshūrāʾ efface, j’espère, les péchés de l’année précédente.',
        source: 'Muslim 1162',
        ta: 'ஆஷூரா நோன்பு, கடந்த ஆண்டின் பாவங்களுக்குப் பரிகாரமாகும் என்று அல்லாஹ்விடம் எதிர்பார்க்கிறேன்.'
    }
];

/** Citations liées au mois hégirien en cours au 15 du mois grégorien (faute de temps fort sur la page). */
const MONTH_QUOTES = {
    'Dhū al-Qaʿdah': {
        fr: 'Qui fait le pèlerinage sans obscénité ni péché revient comme au jour de sa naissance.',
        source: 'Bukhārī 1521, Muslim 1350',
        ta: 'ஆபாசமாகவும் பாவமாகவும் நடக்காமல் ஹஜ் செய்பவர், பிறந்த நாளைப் போல (பாவமின்றி) திரும்புவார்.'
    },
    Shaʿbān: {
        fr: 'Le Prophète jeûnait plus en Shaʿbān que dans tout autre mois, hors Ramaḍān.',
        source: 'Bukhārī 1969, Muslim 1156',
        ta: 'ரமளானைத் தவிர, ஷஃபானில் நோன்பு நோற்றது போல் வேறு மாதத்தில் நபி (ஸல்) அதிகம் நோன்பு நோற்றதில்லை.'
    }
};

/** Citations de rappel par mois grégorien (1 = janvier), quand la page n'a ni temps fort ni mois dédié. */
const DEFAULT_QUOTES = {
    1: {
        fr: 'Qui prie le Fajr et l’Asr entrera au Paradis.',
        source: 'Bukhārī 574, Muslim 635',
        ta: 'ஃபஜ்ர், அஸர் ஆகிய இரு தொழுகைகளையும் தொழுபவர் சுவனம் புகுவார்.',
        prayers: ['fajr', 'asr']
    },
    2: {
        fr: 'La meilleure prière après la prière obligatoire est la prière de nuit.',
        source: 'Muslim 1163',
        ta: 'கடமையான தொழுகைக்குப் பின் சிறந்த தொழுகை இரவுத் தொழுகையாகும்.'
    },
    3: {
        fr: 'Les cinq prières lavent les péchés comme un fleuve où l’on se baigne cinq fois par jour.',
        source: 'Bukhārī 528, Muslim 667',
        ta: 'ஐந்து வேளைத் தொழுகைகள், தினமும் ஐந்து முறை நதியில் குளிப்பது போல் பாவங்களைக் கழுவுகின்றன.'
    },
    4: {
        fr: 'Sans la crainte de vous accabler, je vous aurais ordonné le siwāk à chaque prière.',
        source: 'Bukhārī 887, Muslim 252',
        ta: 'சிரமமில்லை என்றிருந்தால், ஒவ்வொரு தொழுகைக்கும் மிஸ்வாக் செய்யக் கட்டளையிட்டிருப்பேன்.'
    },
    5: {
        fr: 'Après chaque prière, dire 33 fois Subḥān Allāh, 33 fois Al-ḥamdu li-llāh et 33 fois Allāhu akbar.',
        source: 'Muslim 597',
        ta: 'ஒவ்வொரு தொழுகைக்குப் பின்னும் 33 முறை ஸுப்ஹானல்லாஹ், 33 முறை அல்ஹம்துலில்லாஹ், 33 முறை அல்லாஹு அக்பர் கூறுங்கள்.'
    },
    6: { fr: 'L’aumône ne diminue jamais les biens.', source: 'Muslim 2588', ar: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ', ta: 'தர்மம் செல்வத்தைக் குறைப்பதில்லை.' },
    7: {
        fr: 'Les cinq prières, et d’un vendredi à l’autre, effacent les péchés commis entre elles.',
        source: 'Muslim 233',
        ta: 'ஐவேளைத் தொழுகைகளும் ஜும்ஆவும், அடுத்த ஜும்ஆ வரையிலான பாவங்களுக்குப் பரிகாரமாகும்.',
        prayers: ['dhuhr']
    },
    8: {
        fr: 'Jeûner trois jours par mois, prier deux rakʿa de Ḍuḥā, et le witr avant de dormir.',
        source: 'Bukhārī 1981, Muslim 721',
        ta: 'ஒவ்வொரு மாதமும் மூன்று நாட்கள் நோன்பு, இரண்டு ரக்அத் ளுஹா, உறங்குவதற்கு முன் வித்ர் தொழுதல்.'
    },
    9: {
        fr: 'La prière accomplie à son heure est l’œuvre la plus aimée d’Allah.',
        source: 'Bukhārī 527, Muslim 85',
        ta: 'அல்லாஹ்வுக்கு மிகவும் விருப்பமான செயல், தொழுகையை அதற்குரிய நேரத்தில் நிறைவேற்றுவதாகும்.'
    },
    10: {
        fr: 'Qui prie Icha en groupe est comme s’il avait prié la moitié de la nuit.',
        source: 'Muslim 656',
        ta: 'இஷாவை ஜமாஅத்துடன் தொழுபவர், இரவில் பாதி நேரம் நின்று வணங்கியவர் போன்றவர்.',
        prayers: ['icha']
    },
    11: {
        fr: 'Les deux rakʿa de l’aube valent mieux que ce bas monde et tout ce qu’il contient.',
        source: 'Muslim 725',
        ta: 'ஃபஜ்ரின் இரண்டு ரக்அத்கள் இவ்வுலகத்தையும் அதிலுள்ளவற்றையும் விடச் சிறந்தவை.',
        prayers: ['fajr']
    },
    12: {
        fr: 'Celui qui manque la prière de l’Asr, c’est comme s’il avait perdu sa famille et ses biens.',
        source: 'Bukhārī 552, Muslim 626',
        ta: 'அஸர் தொழுகையைத் தவறவிடுபவர், தன் குடும்பத்தையும் செல்வத்தையும் இழந்தவர் போன்றவர்.',
        prayers: ['asr']
    }
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

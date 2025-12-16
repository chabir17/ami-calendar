window.CONFIG = {
    lat: 48.9322,
    lng: 2.3967,
    method: 'MuslimWorldLeague',
    asrMethod: 'Shafi',
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },

    // --- VACANCES SCOLAIRES (ZONE C : Créteil/Paris/Versailles) ---
    // Format: YYYY-MM-DD
    schoolHolidays: [
        // 2026-2027
        { name: 'Noël', start: '2026-12-19', end: '2027-01-03' },
        { name: 'Hiver', start: '2027-02-20', end: '2027-03-08' }, // Zone C 2027
        { name: 'Printemps', start: '2027-04-17', end: '2027-05-03' }, // Zone C 2027
        { name: 'Été', start: '2027-07-06', end: '2027-08-31' },
        { name: 'Toussaint', start: '2027-10-23', end: '2027-11-08' },
        { name: 'Noël', start: '2027-12-18', end: '2028-01-03' },

        // 2028 (Estimations Zone C selon rotation probable)
        { name: 'Hiver', start: '2028-02-12', end: '2028-02-28' },
        { name: 'Printemps', start: '2028-04-08', end: '2028-04-24' },
        { name: 'Été', start: '2028-07-07', end: '2028-08-31' },
        { name: 'Toussaint', start: '2028-10-21', end: '2028-11-06' },
        { name: 'Noël', start: '2028-12-23', end: '2029-01-08' },

        // 2029 (Estimations)
        { name: 'Hiver', start: '2029-02-17', end: '2029-03-05' },
        { name: 'Printemps', start: '2029-04-14', end: '2029-04-30' },
        { name: 'Été', start: '2029-07-06', end: '2029-09-01' },
        { name: 'Toussaint', start: '2029-10-20', end: '2029-11-05' },
        { name: 'Noël', start: '2029-12-22', end: '2030-01-07' }
    ],

    // --- JOURS FÉRIÉS FIXES & MOBILES (2027-2029) ---
    publicHolidays: {
        // 2027
        '2027-01-01': "Jour de l'An",
        '2027-03-29': 'Lundi de Pâques',
        '2027-05-01': 'Fête du Travail',
        '2027-05-08': 'Victoire 1945',
        '2027-05-06': 'Ascension',
        '2027-05-17': 'Lundi de Pentecôte',
        '2027-07-14': 'Fête Nationale',
        '2027-08-15': 'Assomption',
        '2027-11-01': 'Toussaint',
        '2027-11-11': 'Armistice',
        '2027-12-25': 'Noël',

        // 2028
        '2028-01-01': "Jour de l'An",
        '2028-04-17': 'Lundi de Pâques',
        '2028-05-01': 'Fête du Travail',
        '2028-05-08': 'Victoire 1945',
        '2028-05-25': 'Ascension',
        '2028-06-05': 'Lundi de Pentecôte',
        '2028-07-14': 'Fête Nationale',
        '2028-08-15': 'Assomption',
        '2028-11-01': 'Toussaint',
        '2028-11-11': 'Armistice',
        '2028-12-25': 'Noël',

        // 2029
        '2029-01-01': "Jour de l'An",
        '2029-04-02': 'Lundi de Pâques',
        '2029-05-01': 'Fête du Travail',
        '2029-05-08': 'Victoire 1945',
        '2029-05-10': 'Ascension',
        '2029-05-21': 'Lundi de Pentecôte',
        '2029-07-14': 'Fête Nationale',
        '2029-08-15': 'Assomption',
        '2029-11-01': 'Toussaint',
        '2029-11-11': 'Armistice',
        '2029-12-25': 'Noël'
    }
};

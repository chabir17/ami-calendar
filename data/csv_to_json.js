const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// Date du premier jour correspondant à la première ligne de données du CSV
const START_DATE = '2026-02-18';

// Noms des fichiers (dans le dossier data/)
const CSV_FILENAME = 'ramadan_raw.csv';
const JSON_FILENAME = 'ramadan_overrides.json';
// ---------------------

const csvPath = path.join(__dirname, '../data', CSV_FILENAME);
const jsonPath = path.join(__dirname, '../data', JSON_FILENAME);

console.log(`🔄 Conversion de ${CSV_FILENAME} vers ${JSON_FILENAME}...`);

try {
    if (!fs.existsSync(csvPath)) {
        throw new Error(`Le fichier source n'existe pas : ${csvPath}`);
    }

    const rawData = fs.readFileSync(csvPath, 'utf8');
    const lines = rawData.trim().split('\n');
    const overrides = {};
    let currentDate = new Date(START_DATE);

    let count = 0;

    lines.forEach((line, index) => {
        // Nettoyage et saut des lignes vides ou en-têtes
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.toLowerCase().startsWith('fajr') || cleanLine.toLowerCase().startsWith('date')) return;

        // Découpage (Tabulation ou Virgule ou Point-virgule)
        const cols = cleanLine.split(/[\t,;]+/).map((c) => c.trim());

        // On attend au moins 6 colonnes : Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha
        if (cols.length < 6) {
            console.warn(`⚠️ Ligne ${index + 1} ignorée (format incorrect) : "${cleanLine}"`);
            return;
        }

        // Génération de la clé YYYY-MM-DD
        const dateKey = currentDate.toISOString().split('T')[0];

        // Mapping des colonnes
        overrides[dateKey] = {
            fajr: cols[0],
            sunrise: cols[1],
            dhuhr: cols[2],
            asr: cols[3],
            maghrib: cols[4],
            isha: cols[5]
        };

        // Incrément du jour
        currentDate.setDate(currentDate.getDate() + 1);
        count++;
    });

    fs.writeFileSync(jsonPath, JSON.stringify(overrides, null, 4));
    console.log(`✅ Succès ! ${count} jours générés.`);
    console.log(`📁 Fichier créé : ${jsonPath}`);
} catch (error) {
    console.error('❌ Erreur :', error.message);
}

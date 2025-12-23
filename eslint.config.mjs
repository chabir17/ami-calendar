import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    // 1. Configuration globale
    {
        languageOptions: {
            // Autorise les variables globales du navigateur (window, document...)
            globals: {
                ...globals.browser,
                CONFIG: 'readonly', // Votre variable globale définie dans data/config.js
                TEXTS: 'readonly', // Votre variable globale définie dans data/lang.js
                adhan: 'readonly' // La librairie externe Adhan
            },
            ecmaVersion: 'latest',
            sourceType: 'module' // Pour supporter les imports/exports modernes si besoin
        },
        // Ignorer les dossiers non pertinents pour le linting
        ignores: ['assets/', 'css/', '.vscode/', '.git/']
    },

    // 2. Règles recommandées par défaut (detecte les erreurs courantes)
    pluginJs.configs.recommended,

    // 3. Règles personnalisées (Optionnel)
    {
        rules: {
            'no-unused-vars': 'warn', // Avertissement plutôt qu'erreur pour les variables inutilisées
            'no-console': 'off' // Autorise les console.log (utile pour votre debug actuel)
        }
    },

    // 4. Désactive les règles de style qui entrent en conflit avec Prettier
    // (Doit toujours être en dernier)
    eslintConfigPrettier
];

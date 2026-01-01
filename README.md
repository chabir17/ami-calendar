# AMI Calendar

Ce projet est une solution de calendrier web personnalisée pour l'association AMI. Il met en avant une identité visuelle multiculturelle (Français, Arabe, Tamoul) et une gestion thématique des couleurs.

## Fonctionnalités

### 🎨 Identité Visuelle et Thèmes

Le design est piloté par des variables CSS (`css/variables.css`) permettant une personnalisation aisée :

- **Palette Symbolique** :
    - Bleu "Tour Eiffel" (`--col-blue`)
    - Vert "Mosquée" (`--col-green`)
    - Orange (`--col-orange`) pour les éléments Tamouls.
- **Thème Annuel** : Une couleur variable (`--brand`) permet d'adapter l'ambiance générale chaque année. Les variantes (sombre/claire) sont générées automatiquement.
- **Indicateurs de Jours** : Arrière-plans spécifiques pour les vendredis (`--bg-friday`) et les jours fériés (`--bg-public-holiday`).

### 🌐 Typographie Multilingue

Le projet utilise des polices hébergées localement (dans `assets/fonts/`) pour éviter les dépendances externes :

- **Français** : `Noto Sans`
- **Arabe** : `Noto Naskh Arabic`
- **Tamoul** : `Noto Serif Tamil`

### 📐 Mise en Page (Header)

L'en-tête (`css/header.css`) est conçu pour être informatif et esthétique :

- Positionnement fixe avec un motif d'arrière-plan (`background-pattern.svg`).
- Affichage du logo dans un cadre stylisé.
- Présentation du nom de l'organisation en plusieurs langues.
- Section de contact alignée.

###  Performance et Optimisations

Le projet intègre plusieurs stratégies pour assurer un chargement rapide et une interface fluide :

- **Chargement CSS Parallèle** : Les feuilles de style sont liées directement dans le HTML pour éviter les blocages liés aux `@import`.
- **Rendu Non-Bloquant** : Les scripts JS (`defer`) et le CSS d'impression (`media="print"`) ne bloquent pas l'affichage initial.
- **Stratégies de Cache** :
    - **Données API** : Cache `localStorage` (30 jours) pour les jours fériés et vacances scolaires.
    - **Calculs** : Mémoïsation des conversions de dates Hégiriennes pour optimiser le rendu de la grille.
- **Pré-chargement** : Utilisation de `preload` pour les polices principales.

## Structure du Projet

### 📂 Organisation des Fichiers

- **assets/** : Ressources statiques du projet.
    - `fonts/` : Fichiers de police (`.ttf`) pour le fonctionnement hors-ligne.
    - `icons/` : Pictogrammes SVG (localisation, téléphone, lune, horloge...).
    - `img/` : Images principales (Logo de l'association).
    - `patterns/` : Motifs d'arrière-plan (SVG).
- **css/** : Feuilles de style modulaires.
    - `variables.css` : Configuration globale (Thème couleur, polices).
    - `fonts.css` : Importation des polices locales via `@font-face`.
    - `header.css`, `table.css`, `calendar.css` : Styles spécifiques aux composants.
    - `print.css` : Optimisations pour l'impression A4 Paysage.
- **js/** : Logique applicative (Vanilla JS).
    - `lib/` : Librairies tierces (Adhan.js minifié) pour fonctionnement hors-ligne.
    - `components.js` : Définition des Web Components (`<ami-calendar-grid>`, `<ami-prayer-table>`).
    - `utils.js` : Fonctions utilitaires partagées (DOM helpers, formatage de dates).
    - `services.js` : Logique métier (Calculs Adhan, Hégire, et appels API).
    - `main.js` : Point d'entrée, orchestration du rendu et gestion du cache.
- **data/** : Fichiers de configuration.
    - `config.js` : Paramètres géographiques (Lat/Lng) et méthodes de calcul.
    - `lang.js` : Textes et traductions (Français, Arabe, Tamoul).

### ⚙️ Logique et Données

- **Horaires de Prière** : Calculés localement via la librairie `Adhan.js` (incluse dans `js/lib/`).
- **Dates Hégiriennes** : Conversion dynamique via `Intl.DateTimeFormat` (Islamic Civil).
- **Jours Fériés & Vacances** : Récupérés automatiquement depuis les APIs gouvernementales (api.gouv.fr / education.gouv.fr) avec un système de **cache local** (30 jours) pour limiter les requêtes.

## Personnalisation

Pour modifier l'apparence du calendrier, éditez le fichier `css/variables.css`.

**Exemple : Changer la couleur du thème de l'année**

Il suffit de modifier la variable `--brand`. Les variantes `--brand-dark` et `--brand-light` sont calculées automatiquement.

```css
:root {
    --brand: #c8b070; /* Remplacez par votre code couleur */
}
```

## Auteur

Développé dans l'espace de travail de Chabir.

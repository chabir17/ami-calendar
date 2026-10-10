# AMI Calendar

Ce projet génère deux documents pour l'association AMI (La Courneuve), en français, arabe et tamoul :

- **Calendrier annuel** (`index.html`) : 12 pages A4 paysage, calendrier civil et hégirien, horaires de prière.
- **Calendrier du Ramadan** (`ramadan.html`) : une page A4 portrait. Par défaut, version numérique (couleurs contrastées, coordonnées cliquables, à partager en PDF) ; `ramadan.html?print=true` pour la version papier (pastels, économie d'encre). Paramètre facultatif `?year=2028`.

## Fonctionnalités

### 🎨 Identité Visuelle et Thèmes

Le design est piloté par des variables CSS (`css/variables.css`) permettant une personnalisation aisée :

- **Palette Symbolique** :
    - Bleu "Tour Eiffel" (`--col-blue`)
    - Vert "Mosquée" (`--col-green`)
- **Thème Annuel** : une couleur variable (`--brand`, calendrier annuel) permet d'adapter l'ambiance générale chaque année ; ses variantes sont calculées automatiquement.
- **Contraste** : les textes utilisent des variantes foncées des couleurs (`--brand-text`, `--col-green-dark`, `--col-saffron-text`) qui respectent le niveau WCAG AA.
- **Indicateurs de Jours** :
    - Numéro du jour en rouge pour les jours fériés, en vert pour l'Aïd (libellé écrit dans la case).
    - Vacances scolaires (Zone C) : fond doré clair (`--bg-holiday`) ; l'Aïd et les jours fériés restent prioritaires.
    - Bande du bas : nom des vacances du mois et hadith du mois hégirien (al-Bukhārī, Muslim), modifiable dans `data/citations.js`.
    - Icônes SVG (`assets/icons/`) : croissant vert pour la nouvelle lune, horloge bleue avec flèche avant/arrière pour le passage à l'heure d'été/hiver.

### 🌐 Typographie Multilingue

Le projet utilise des polices hébergées localement (dans `assets/fonts/`) pour éviter les dépendances externes :

- **Français** : `Noto Sans`
- **Arabe** : `Amiri` (naskh classique, `Noto Naskh Arabic` en secours)
- **Tamoul** : `Noto Serif Tamil` (400, 500, 600, 700)

### 📐 Mise en Page

- **Header** (`css/header.css`) : en-tête de lettre à angles droits, bordures dorées en haut et en bas, motif girih à rosaces à 8 branches sur toute la largeur (`assets/patterns/background-pattern.svg`, recoloré selon `--brand`). Logo de 2 cm, noms français et tamoul côte à côte, coordonnées en 4 colonnes (adresses, téléphones, en ligne, banque). Le header commence sous la zone de reliure (`--binding-zone`).
- **Calendrier** : carte dont l'en-tête porte le titre du mois (grégorien à gauche, hégirien à droite : mois en gras, année plus légère, traductions tamoule et translittérée dessous), puis la ligne des jours.
- **Tableau des horaires** : carte pleine hauteur à droite.
- Espacement unique entre les trois blocs (`--block-gap`).

### 🧩 Design system

Toutes les valeurs visuelles sont des jetons définis dans `css/variables.css`, partagés par les deux documents :

| Famille          | Jetons                                                                                                                                                                                | Règle                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Couleurs de sens | `--col-blue` (structure, grégorien), `--col-green` (hégirien, vendredis, Aïd), `--col-red-event` (jours fériés), `--col-terracotta` (horaires du jeûne), `--brand` (thème de l'année) | Une couleur = un sens ; les textes restent au moins à 4,5:1 (WCAG AA) |
| Fonds            | `--bg-blue-faint`, `--bg-green-faint`, `--bg-terracotta(-soft, -mid)`, `--bg-friday`, `--bg-holiday`                                                                                  | Pastels opaques, fiables sur laser de bureau                          |
| Texte            | `--col-text`, `--col-text-light`, `--col-text-soft`, `--col-ink` (chiffres), `--col-on-dark`                                                                                          |                                                                       |
| Tailles          | `--fs-xs` 10 · `--fs-sm` 12 · `--fs-md` 14 · `--fs-figure` 16 (horaires) · `--fs-xl` 22 (titres) · `--fs-title` 30 · `--fs-display` 42 (numéros des jours)                            | Aucune taille en dur dans les feuilles de style                       |
| Espacements      | `--sp-1` 4 px · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-6` 24                                                                                                                  | Multiples de 4 px                                                     |
| Graisses         | 400 et 600 (français, tamoul) ; 400 pour l'arabe (Amiri)                                                                                                                              |                                                                       |

La page Ramadan utilise des **rôles** (`--rule`, `--surface`, `--surface-fast`, `--surface-fast-head`) déclarés sur `.page` ; la version numérique (`.digital`) ne fait que leur donner des teintes plus soutenues. Chaque version a son image de fond pleine page : `assets/img/ramadan-background-night.jpg` (nuit d'hiver, numérique) et `assets/img/ramadan-background.jpg` (crème clair, papier, éclairci par un voile blanc). Le décor reste dans les coins, le haut du titre et la neige du bas : le tableau couvre tout le reste.

### Performance et Optimisations

Le projet intègre plusieurs stratégies pour assurer un chargement rapide et une interface fluide :

- **Chargement CSS Parallèle** : Les feuilles de style sont liées directement dans le HTML pour éviter les blocages liés aux `@import`.
- **Rendu Non-Bloquant** : Les scripts JS (`defer`) et le CSS d'impression (`media="print"`) ne bloquent pas l'affichage initial.
- **Stratégies de Cache** :
    - **Données API** : cache `localStorage` appliqué immédiatement, puis API toujours interrogée ("stale-while-revalidate") pour récupérer les dates les plus récentes des jours fériés et vacances scolaires.
    - **Calculs** : Mémoïsation des conversions de dates Hégiriennes pour optimiser le rendu de la grille.
- **Pré-chargement** : Utilisation de `preload` pour les polices principales.

## Structure du Projet

### 📂 Organisation des Fichiers

- **assets/** : Ressources statiques du projet.
    - `fonts/` : Fichiers de police (`.ttf`) pour le fonctionnement hors-ligne.
    - `icons/` : Pictogrammes SVG (localisation, téléphone, email, site web...).
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

- **Horaires de Prière** : Lus depuis `data/prayer_times.csv`, un fichier générique réutilisable chaque année (une ligne par jour `Mois;Jour`). Les heures peuvent être fournies en heure d'hiver seule ou avec l'heure d'été d'une année quelconque : le saut d'une heure est détecté et neutralisé, puis l'heure d'été (+1h) est réappliquée du dernier dimanche de mars au dernier dimanche d'octobre de l'année affichée. Sans ligne `2;29`, le 29 février reprend les horaires du 28. À défaut de fichier, les horaires sont calculés via `Adhan.js` (inclus dans `js/lib/`).
- **Dates Hégiriennes** : Conversion dynamique via `Intl.DateTimeFormat` (Islamic Civil).
- **Jours Fériés & Vacances** : récupérés depuis les API gouvernementales (api.gouv.fr / education.gouv.fr), avec cache local appliqué immédiatement puis mis à jour.
- **Page Ramadan** : Imsak = Fajr − 10 min (`IMSAK_MINUTES_BEFORE_FAJR`), Icha AMI par quinzaine (`AMI_ISHA`), en tête de `js/ramadan.js` ; corrections manuelles possibles dans `data/ramadan_overrides.json` (prioritaires).

## Impression

Le calendrier est conçu pour une impression couleur **A4 paysage**, recto seul, reliée sur le bord haut (spirale métallique), sur une imprimante de bureau.

- **Marges** (`css/variables.css`) : `--page-pad` (5 mm, au-delà de la zone non imprimable du copieur) et `--binding-zone` (10 mm en haut, pour les perforations de la reliure).
- **Réglages d'impression** : format A4 paysage, marges « Aucune », échelle 100 % (« Taille réelle »), graphiques d'arrière-plan activés.
- Le tableau des horaires répartit ses lignes sur la hauteur disponible : les mois de 28 à 31 jours tiennent toujours sur la page.

## Préparer une nouvelle année

1. **Dates hégiriennes** : faire valider le début du Ramadan et les Aïds par les imams ; en cas d'écart d'un jour, ajouter une période dans `HIJRI_OFFSETS` (`js/services.js`).
2. **Horaires** : remplacer `data/prayer_times.csv` si la mosquée publie de nouveaux horaires ; vérifier Imsak et Icha AMI en tête de `js/ramadan.js`.
3. **Hadiths du mois** (`data/citations.js`) : ils suivent les mois hégiriens, qui reculent d'environ 11 jours par an ; relire les 12 textes.
4. **Thème** : changer `--brand` (couleur de l'année) si souhaité.
5. **Vérifier** : générer les PDF (`index.html?year=…`, `ramadan.html?year=…` et `?print=true`), contrôler le nombre de pages, puis faire une impression de test.

## Personnalisation

Pour modifier l'apparence du calendrier, éditez le fichier `css/variables.css`.

**Exemple : Changer la couleur du thème de l'année**

Il suffit de modifier la variable `--brand` ; ses variantes (`--brand-text`, motif du header…) en découlent.

```css
:root {
    --brand: #c8b070; /* Remplacez par votre code couleur */
}
```

## Auteur

Développé dans l'espace de travail de Chabir.

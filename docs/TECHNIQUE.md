# Documentation technique

Référence pour faire évoluer le code des deux documents de l'AMI. Pour l'usage courant (générer les PDF, préparer une année), voir le [README](../README.md).

## 1. Principes

- **Site statique, sans build** : HTML, CSS et JavaScript natif (modules ES). Aucune dépendance d'exécution hors `js/lib/adhan.min.js`, embarqué.
- **Hors ligne par défaut** : polices, icônes, librairie et horaires sont locaux. Seuls les jours fériés et les vacances viennent d'API publiques (avec cache local).
- **Pensé pour l'impression** : chaque page est un bloc de dimensions fixes en millimètres (A4), que Chrome imprime en PDF.
- **Design system par jetons** : toutes les couleurs, tailles et espacements sont des variables CSS de `css/variables.css`.
- **Deux documents indépendants** : le calendrier annuel et la feuille du Ramadan partagent les services et les jetons, mais **pas leur mise en page**. La feuille du Ramadan est encore en conception : on ne cherche pas à aligner son design sur celui du calendrier.

## 2. Arborescence

```
index.html            Calendrier annuel : templates (page, case, ligne) + symboles SVG des frises
ramadan.html          Feuille du Ramadan : template unique
css/
  variables.css       Jetons du design system (partagés)
  fonts.css           @font-face des polices locales
  base.css            Reset, page A4 paysage, grille principale, .icon
  header.css          Header de l'identité (calendrier annuel)
  calendar.css        Bandeau du mois, grille des jours, légende
  table.css           Tableau des horaires (calendrier annuel)
  print.css           Règles d'impression du calendrier annuel
  ramadan.css         Feuille du Ramadan (autonome : page A4 portrait, versions numérique / papier)
  planningS1.css      Page indépendante planningS1.html (hors calendriers)
js/
  main.js             Calendrier annuel : orchestration des pages, header, titres, légende
  components.js       Web Components <ami-calendar-grid> et <ami-prayer-table>
  services.js         Logique métier : horaires, dates hégiriennes, jours particuliers, API, config client
  utils.js            Helpers DOM, coordonnées, dates (Paris, heure d'été, mois hégiriens)
  ramadan.js          Feuille du Ramadan : détection de la période, tableau, hauteur des lignes
  lib/adhan.min.js    Calcul astronomique des horaires (secours)
data/
  config.js           window.CONFIG : position, méthode de calcul, jours fériés / vacances (remplis à l'exécution)
  lang.js             window.TEXTS : mois et jours en français, arabe, tamoul
  prayer_times.csv    Horaires officiels, une ligne par jour de l'année
  ramadan_overrides.json   Corrections manuelles des horaires du Ramadan (prioritaires)
  ramadan_raw.csv + csv_to_json.js   Outil Node de conversion vers ramadan_overrides.json
clients/
  ami93120.json       Configuration de l'association (identité, coordonnées, position, thème)
assets/
  fonts/              Noto Sans, Amiri, Noto Naskh Arabic, Noto Serif Tamil (.ttf)
  icons/              Pictogrammes SVG (symbole #icon), dont icon-dst-forward / icon-dst-back
  img/                Logo, calligraphie et fonds de la feuille du Ramadan
  patterns/           background-pattern-neutral.svg (girih gris pâle du header)
```

## 3. Calendrier annuel (`index.html`)

### 3.1 Cycle de rendu

1. `main.js` (`DOMContentLoaded`) charge **en parallèle** la configuration client (`?mosque=…`) et `data/prayer_times.csv`.
2. Si une configuration client existe : `applyTheme` (couleur `--brand`) et fusion de sa position dans `window.CONFIG`.
3. Lecture de `?year` (défaut : année suivante) et `?month` (défaut : les 12 mois). L'ancien paramètre `?redirect=/AAAA/MM` (astuce 404 de GitHub Pages) est encore accepté.
4. `renderApp()` clone le template `#page-template` pour chaque mois, puis :
    - `drawFrises` : torsades du header (voir 3.3) ;
    - `updatePageDOM` : noms, logo et coordonnées depuis la configuration client (sinon, le contenu statique du template reste affiché) ;
    - `updateZoneTitles` : bandeau du mois (grégorien, hégirien, traductions) ;
    - `updateLegend` : légende du bas ;
    - attributs `year` / `month` des deux Web Components, qui se dessinent eux-mêmes.
5. `fetchExternalData(renderApp)` applique le cache local des jours fériés et vacances, interroge les API, et **relance le rendu** si les données ont changé.

### 3.2 Web Components (`components.js`)

Les deux composants héritent de `MonthElement`, qui observe `year` et `month` et regroupe les rendus à la frame suivante (`requestAnimationFrame`).

- **`<ami-calendar-grid>`** : grille fixe de **35 cases** (5 semaines × 7, lundi en premier). Les jours au-delà de la 35e case (mois sur 6 semaines) reviennent dans les premières cases vides. Chaque case est clonée depuis `#calendar-cell-template` et reçoit des classes selon `getDayInfo` :

    | Classe              | Condition              | Effet                           |
    | ------------------- | ---------------------- | ------------------------------- |
    | `is-weekend`        | samedi, dimanche       | numéro gris                     |
    | `is-holiday`        | vacances scolaires     | fond `--bg-holiday`             |
    | `is-public-holiday` | jour férié             | numéro rouge                    |
    | `is-eid`            | Aïd                    | numéro vert                     |
    | `is-islamic-event`  | Aïd ou jour vertueux   | date hégirienne cerclée de vert |
    | `multi-events`      | au moins deux libellés | numéro remonté                  |
    | `empty`             | case hors du mois      | fond `--bg-empty`               |

    Les libellés (`event-line {type}-label`, types `eid`, `virtuous`, `public`, `dst`) sont écrits sous le numéro. Si l'Aïd tombe un jour férié, l'Aïd passe en haut de la case (`event-label-top`).

- **`<ami-prayer-table>`** : une ligne par jour depuis `#prayer-row-template` ; classes `is-friday` et `week-end` (filet après chaque dimanche). Le tableau occupe toute la hauteur : les mois de 28 à 31 jours tiennent sur la page.

### 3.3 Header de l'identité

- Hauteur fixe `--header-h` (24 mm, frises comprises), sous la zone de reliure.
- **Frises** : deux `<svg class="frise">` dont l'attribut `data-maillon` désigne un symbole défini en tête de `index.html` (`torsade-saffron`, `torsade-green`). `drawFrises` y répète le symbole tous les 8 px avec `<use>`.
    - Le motif est en **SVG vectoriel inline** : un `background-image` ou un `<pattern>` SVG est pixellisé par Chrome à l'export PDF.
    - Torsade à deux brins : à chaque croisement, un `clipPath` redessine le brin du dessus (sur un halo blanc), en alternant.
- Noms : tamoul en `--fs-brand` (28 px), français en `--fs-brand-fr` (20 px) pour une largeur équivalente ; ils occupent toute la hauteur du logo.
- Coordonnées : `contactsHTML(c, 'columns')` produit une grille de 3 lignes (adresse | téléphones, adresse | e-mail et site, puis IBAN • BIC sur toute la largeur).
- Motif girih gris pâle (`background-pattern-neutral.svg`, 15 % d'opacité) entre les deux frises.

### 3.4 Légende (`updateLegend`)

Pour chaque jour du mois : nom de la période de vacances (une fois par période) et passage à l'heure d'été / d'hiver, triés par date, **sans date affichée**. La bande garde la même hauteur même vide (`min-height`), pour que la grille ait la même taille chaque mois.

## 4. Logique métier (`services.js`)

### 4.1 Horaires de prière

- **Source principale** : `data/prayer_times.csv`, séparateur `;` (`,` ou tabulation acceptés) :

    ```
    Mois;Jour;Fajr;Shuruq;Dhuhr;Asr;Maghrib;Isha
    1;1;07:05;08:44;12:59;14:48;17:08;18:35
    ```

    - Fichier **indépendant de l'année** (clé `MM-JJ`). Sans ligne `2;29`, le 29 février reprend le 28.
    - Les heures peuvent être en heure d'hiver seule, ou inclure l'heure d'été d'une année quelconque : un saut d'environ une heure du Dhuhr est détecté et neutralisé au chargement.
    - À l'affichage, `+1 h` est réappliqué selon l'année affichée (`DATE_UTILS.isSummerTime` : du dernier dimanche de mars inclus au dernier dimanche d'octobre exclu).

- **Secours** : calcul Adhan (`initAdhan`), avec `CONFIG.method` (défaut MuslimWorldLeague), angles 18°, madhab selon `CONFIG.asrMethod`, règle haute latitude « septième de la nuit ».

### 4.2 Dates hégiriennes (`getHijriDateSafe`)

- Conversion par `Intl.DateTimeFormat('fr-FR-u-ca-islamic-civil')`, mise en cache par date.
- **Décalage manuel** : `HIJRI_OFFSETS` liste des périodes `{ start, end, offset }` (jours) pour suivre les dates annoncées par les imams. Les années sans entrée suivent le calcul.
- Les noms bruts renvoyés par `Intl` varient selon le navigateur et la version ICU : `HIJRI_MONTHS_DATA` (`utils.js`) les ramène à une **translittération standard** (`Ramaḍān`, `Shawwāl`, `Dhū al-Ḥijjah`…), plus l'arabe et le tamoul.
- Retour : `{ day, monthNameFR, monthNameAR, monthNameTA, year, yearAr }`. **Toute comparaison de mois se fait sur `monthNameFR`** (nom standard), jamais sur un nom brut.

### 4.3 Jours particuliers (`getDayInfo`)

| Information           | Règle                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Vacances scolaires    | période de `CONFIG.schoolHolidays` contenant le jour                                             |
| Jour férié            | `CONFIG.publicHolidays['AAAA-MM-JJ']`, libellé raccourci par `HOLIDAY_NAMES`                     |
| Changement d'heure    | `DATE_UTILS.dstChange` : derniers dimanches de mars (`summer`) et d'octobre (`winter`)           |
| Nouveau mois hégirien | jour hégirien = 1                                                                                |
| Aïd                   | `EID_NAMES` : 1er Shawwāl (Eid-ul-Fitr), 10 Dhū al-Ḥijjah (Eid-ul-Adha)                          |
| Jours vertueux        | `VIRTUOUS_DAYS` : 1er Ramaḍān, 9 Dhū al-Ḥijjah (ʿArafa), 11-13 (Tashrīq), 10 Muḥarram (ʿĀshūrāʾ) |

`VIRTUOUS_DAYS` ne retient que des jours dont le mérite repose sur des hadiths authentiques (sources citées dans le code). Ajouter un jour : une entrée `mois standard → { jour: 'libellé' }`.

### 4.4 Jours fériés et vacances (`fetchExternalData`)

- API : `calendrier.api.gouv.fr/jours-feries/metropole.json` et `data.education.gouv.fr` (zone C, académie de Créteil).
- **Stale-while-revalidate** : le cache `localStorage` (`ami_calendar_cache_v2`) est appliqué immédiatement, puis l'API est toujours interrogée ; le rendu est relancé si les données changent.
- `normalizeSchoolHolidays` : date de fin = veille de la reprise ; doublons élèves / enseignants supprimés ; une période sans fin connue (« Début des vacances d'été ») va jusqu'au 31 août.
- Conséquence : **un PDF généré hors ligne, sur un navigateur sans cache, n'a ni jours fériés ni vacances.**

### 4.5 Configuration client (`clients/*.json`)

Chargée par `?mosque=<id>` (la feuille du Ramadan utilise `ami93120` par défaut).

```json
{
    "identity": { "name_fr": "…", "name_ta": "…", "logo_url": "assets/img/AMI.png" },
    "contact": {
        "addr1_icon": "mosque",
        "addr1": "…",
        "addr2_icon": "office",
        "addr2": "…",
        "phone": "…",
        "whatsapp": "…",
        "email": "…",
        "website": "…",
        "bank": { "iban": "…", "bic": "…" }
    },
    "location": { "lat": 48.92, "lng": 2.4 },
    "theme": { "color_brand": "#c8a85a" }
}
```

`location` est fusionné dans `window.CONFIG` (il ne sert qu'au calcul Adhan de secours). Les icônes d'adresse désignent un fichier `assets/icons/icon-<nom>.svg` (`location` par défaut).

## 5. Feuille du Ramadan (`ramadan.html`, `ramadan.js`)

- **Période** : balayage de l'année du 29 Shaʿbān (nuit du doute) au 1er Shawwāl (Aïd). Année par défaut : l'année en cours, ou la suivante si l'Aïd el-Fitr est passé.
- **Colonnes** : Imsak (= Fajr − `IMSAK_MINUTES_BEFORE_FAJR`), 6 horaires, **Icha AMI** (`AMI_ISHA` : 1re et 2e quinzaine), jour hégirien, jours en français, tamoul et arabe.
- **Lignes spéciales** : nuit du doute et Aïd (libellé trilingue sur toute la largeur), séparateur de la 27e nuit.
- **Corrections** : `data/ramadan_overrides.json` (`{ "AAAA-MM-JJ": { "fajr": "06:09", … } }`) remplace les horaires calculés. `node data/csv_to_json.js` le génère depuis `data/ramadan_raw.csv` (régler `START_DATE` en tête du script).
- **Hauteur des lignes** : après chargement des polices, toutes les lignes reçoivent la même hauteur (`--row-h`) = hauteur disponible ÷ nombre de lignes. Le tableau reste l'élément prioritaire de la page.
- **Versions** : numérique par défaut (classe `.digital` : fond de nuit d'hiver, liens cliquables dans les coordonnées) ; papier avec `?print=true` (fond crème, voile blanc). Les rôles de couleur `--rule`, `--surface`, `--surface-fast` sont déclarés sur `.page` et renforcés par `.digital`.

## 6. Design system (`css/variables.css`)

| Famille          | Jetons                                                                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Couleurs de sens | `--col-blue` (structure, grégorien), `--col-green` (hégirien, prières), `--col-green-deep` (en-tête des horaires), `--col-red-event` (fériés), `--col-saffron-text` (nom tamoul), `--col-terracotta` (jeûne), `--col-gold` (ornements), `--brand` (thème client) |
| Fonds            | `--bg-blue-faint`, `--bg-green-faint` (= `--bg-friday`), `--bg-holiday`, `--bg-empty`, `--bg-terracotta(-soft)`                                                                                                                                                  |
| Texte            | `--col-text`, `--col-text-light`, `--col-text-soft`, `--col-ink` (chiffres), `--col-on-blue`, `--col-on-green` (sur fonds foncés)                                                                                                                                |
| Bordures         | `--border-blue`, `--border-green`, `--accent-blue`, `--accent-green`, `--border-on-dark`, `--border-swatch`                                                                                                                                                      |
| Tailles (px)     | `--fs-2xs` 8,5 · `--fs-xs` 10 · `--fs-contact` 11 · `--fs-sm` 12 · `--fs-md` 14 · `--fs-figure` 15 · `--fs-brand-fr` 20 · `--fs-xl` 22 · `--fs-brand` 28 · `--fs-title` 30 · `--fs-display` 42                                                                   |
| Espacements      | `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-6` 24 (px)                                                                                                                                                                                           |
| Mise en page     | `--page-pad` 5 mm · `--binding-zone` 10 mm · `--block-gap` 2,5 mm · `--header-h` 24 mm · `--band-h` 64 px                                                                                                                                                        |
| Polices          | `--font-fr` Noto Sans · `--font-ar` Amiri (Noto Naskh Arabic en secours) · `--font-ta` Noto Serif Tamil                                                                                                                                                          |

Règles :

- **Une couleur = un sens.** Les textes respectent au moins 4,5:1 (WCAG AA) ; les ratios sont notés en commentaire des jetons.
- `--col-green-deep` est réglé en **OKLCH** pour paraître aussi sombre que `--col-blue` (le vert sombre semble plus noir à luminosité égale).
- Aucune couleur ni taille de police en dur dans les feuilles de style du calendrier : ajouter un jeton plutôt qu'une valeur.
- Graisses : 400 et 600 pour le français et le tamoul, 400 à 500 pour l'arabe (Amiri).

## 7. Qualité et vérification

```bash
npm run lint       # ESLint (globals CONFIG, TEXTS, adhan déclarés dans eslint.config.mjs)
npm run prettier   # Prettier (HTML, CSS, JS, JSON, Markdown)
```

Il n'y a pas de tests automatisés. Avant de livrer une modification :

1. Rendu PDF sans débordement : 12 pages pour `index.html?year=…` (tester au moins deux années), 1 page pour chaque version de `ramadan.html`.
2. En cas de refactoring, comparer le contenu rendu avant / après (titres, cases, tableaux, légende) sur plusieurs années.
3. Vérifier un mois avec changement d'heure (mars, octobre), un mois avec Aïd et un mois de 31 jours commençant un samedi ou un dimanche (6 semaines).

## 8. Pièges connus

- **Noms de fichiers construits dynamiquement** : `icon-dst-${…}.svg` et `icon-${addr_icon}.svg`. Une recherche textuelle ne les trouve pas : ne pas les supprimer comme « inutilisés ».
- **Images de fond SVG et PDF** : Chrome pixellise `background-image` et `<pattern>` SVG à l'export. Pour un motif net (frises), utiliser du SVG inline avec `<use>`.
- **Dates hégiriennes** : calcul astronomique civil, pouvant différer d'un jour de l'observation du croissant. À valider chaque année.
- **Jours fériés / vacances** : dépendent du réseau au premier chargement (voir 4.4).
- **Version papier du Ramadan** : les images de fond d'origine font environ 720 × 1024 px ; les agrandir (×4) pour un tirage net.

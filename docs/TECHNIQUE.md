# Documentation technique

Référence pour faire évoluer le code des deux documents de l'AMI. Pour l'usage courant (générer les PDF, imprimer, préparer une année), voir le [README](../README.md).

## 1. Principes

- **Site statique, sans build** : HTML, CSS et JavaScript natif (modules ES). Aucune dépendance d'exécution hors `js/lib/adhan.min.js`, embarqué. Les outils Node (ESLint, Prettier, serve) ne servent qu'au développement.
- **Hors ligne par défaut** : polices, icônes, librairie et horaires sont locaux. Seuls les jours fériés et les vacances scolaires viennent d'API publiques, avec cache local.
- **Pensé pour l'impression** : chaque page est un bloc de dimensions fixes en millimètres (A4), que Chrome imprime en PDF. Rien ne doit déborder : le contrôle se fait au nombre de pages du PDF.
- **Design system par jetons** : couleurs, tailles et espacements sont des variables CSS de `css/variables.css` (voir [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)).
- **Deux documents indépendants** : le calendrier annuel et la feuille du Ramadan partagent les services, les données et les jetons, mais **pas leur mise en page**. La feuille du Ramadan est encore en conception : on ne cherche pas à aligner son design sur celui du calendrier.

## 2. Arborescence

```
index.html            Calendrier annuel : templates (couverture, page, case, ligne du tableau) + définition SVG partagée (chemin girih de la couverture)
ramadan.html          Feuille du Ramadan : template unique
css/
  variables.css       Jetons du design system (partagés)
  fonts.css           @font-face des polices locales
  base.css            Reset, page A4 paysage, grille principale, .icon
  header.css          Header de l'identité (calendrier annuel)
  calendar.css        Bandeau du mois, grille des jours, légende
  cover.css           Page de couverture (calendrier annuel)
  table.css           Tableau des horaires (calendrier annuel)
  print.css           Règles @media print du calendrier annuel
  ramadan.css         Feuille du Ramadan (autonome : A4 portrait, version unique pour l'impression)
js/
  main.js             Calendrier annuel : orchestration des pages, couverture, header, bandeau du mois, légende
  components.js       Web Components <ami-calendar-grid> et <ami-prayer-table>
  services.js         Logique métier : horaires, dates hégiriennes, jours particuliers, API, config client
  utils.js            Helpers DOM, coordonnées, dates (Paris, heure d'été), noms des mois hégiriens
  ramadan.js          Feuille du Ramadan : période, tableau, hauteur des lignes
  lib/adhan.min.js    Calcul astronomique des horaires (secours)
data/
  config.js           window.CONFIG : position, méthode de calcul ; fériés et vacances remplis à l'exécution
  lang.js             window.TEXTS : mois et jours en français, arabe, tamoul
  prayer_times.csv    Horaires officiels, une ligne par jour de l'année
  ramadan_overrides.json           Corrections manuelles des horaires du Ramadan (prioritaires)
  ramadan_raw.csv + csv_to_json.js Outil Node de conversion vers ramadan_overrides.json
clients/
  ami93120.json       Configuration de l'association (identité, coordonnées, position, thème)
assets/
  fonts/              Noto Sans (400, 500, 600, 700, italique 400), Amiri, Noto Naskh Arabic, Noto Serif Tamil (.ttf)
  icons/              Pictogrammes SVG (symbole #icon) : coordonnées, changement d'heure, croissant
  img/                Logo (AMI.png), QR codes Mawaqit (qr-mawaqit-*.svg), icône Mawaqit, fonds de la feuille du Ramadan
docs/
  TECHNIQUE.md        Ce document
```

## 3. Calendrier annuel (`index.html`)

### 3.1 Structure d'une page

Chaque mois est un clone de `#page-template` : une page A4 paysage (`--page-pad` 5 mm de marge, `--binding-zone` 10 mm en haut pour la spirale) composée de trois blocs séparés par `--block-gap` :

1. **Header de l'identité** (`.header-fixed`, pleine largeur, `--header-h` = 20 mm) ;
2. à gauche, **bandeau du mois** + **grille des jours** + **légende** ;
3. à droite, **tableau des horaires**.

Le bandeau du mois (bleu marine plein) et l'en-tête du tableau (vert forêt plein, même luminosité) ont la même hauteur `--band-h` : leurs bas sont alignés.

- **Bandeau du mois** : les deux noms de mois sont les titres de la page, aux deux extrémités (blancs sur le bandeau plein `--bg-head-blue` ; grégorien en `--fs-month` 24 px, arabe en `--fs-xl` 22 px, l'écriture arabe étant plus haute à taille égale) ; années de même taille, en graisse normale ; traductions (tamoul, translittération) en `--col-on-dark-soft`.
- **En-tête des jours, grille et légende** : un seul fond `--bg-grid` pour les trois, sous le bandeau plein du mois ; la ligne des jours a les mêmes marges et espaces (`--grid-gap`) que la grille pour que chaque nom soit centré sur sa colonne de cases ; textes en `--bg-head-blue` (français en capitales espacées, arabe et tamoul en graisse normale) ; les 7 jours dans les mêmes couleurs (le vendredi et le dimanche sont signalés par les numéros des cases) ; ni séparateurs ni filets. Essayés puis écartés : blocs arrondis par jour, blocs ou bande marine (+5 points d'encre), bande plus soutenue (`#cddbed`), bandeau du mois blanc (rompt la symétrie avec le tableau), pastilles de contexte dans les cases (moins de contraste).
- **Numéros des jours** : gris neutre des textes courants `--col-text-light`, identique du lundi au samedi ; vendredis et dimanches en gris légèrement teinté (vert sauge `--col-friday`, terracotta `--col-sunday`) : seuls les jours fériés et l'Aïd sont en couleur pleine.
- **En-tête du tableau** : fond vert forêt plein `--bg-head-green`, texte blanc : noms des prières en titre (`--fs-xs` pour garder des colonnes de même largeur), arabe et tamoul en blanc atténué `--col-on-dark-soft`, séparateurs blancs.
- **Grille des jours** : fond `--bg-grid` visible dans des espaces `--grid-gap` (0,25 rem, 4 px) entre des cases blanches aux coins arrondis `--radius-cell` (8 px), sans filets ; les cases hors du mois sont transparentes. Aucun contour autour des deux blocs : l'en-tête plein dessine le haut, la légende, sur le même fond, ferme le bas.
- **Bandeau trop long** (deux mois hégiriens aux noms longs) : quand deux mois se partagent le bandeau, les mois jumeaux sont abrégés en tamoul et en translittération (`Rabīʿ I / Rabīʿ II`, `Jumādā I / Jumādā II`, champs `short` et `taShort` de `HIJRI_MONTHS`), ce qui garde la même taille de texte chaque mois (vérifié de 2025 à 2030). En dernier recours, `fitMonthTitles` ajoute `is-compact`, puis `is-compact-2` à `is-compact-4` (traductions en 12 px puis 10 px, année grégorienne, arabe), qui réduit le côté hégirien au lieu de le couper.

### 3.2 Cycle de rendu (`main.js`)

1. Au `DOMContentLoaded`, chargement **en parallèle** de la configuration client (`?mosque=…`) et de `data/prayer_times.csv`.
2. Si une configuration client existe : `applyTheme` (couleur `--brand`) et fusion de sa `location` dans `window.CONFIG`.
3. Lecture de `?year` (défaut : année suivante) et `?month` (défaut : couverture + 12 mois ; `?month=cover` : couverture seule). L'ancien paramètre `?redirect=/AAAA/MM` (astuce 404 de GitHub Pages) est encore accepté.
4. `renderApp()` ajoute la couverture (`createCoverNode`, voir 3.6), clone le template pour chaque mois, puis :
    - `updatePageDOM` : noms, logo et coordonnées depuis la configuration client (sans configuration, le contenu statique du template reste affiché : il a la même structure) ;
    - `updateZoneTitles` : bandeau du mois (grégorien, hégirien sur un ou deux mois, traductions) ;
    - `updateLegend` : légende du bas (voir 3.5) ;
    - attributs `year` / `month` des deux Web Components, qui se dessinent eux-mêmes.
5. Après le chargement des polices : `fitMonthTitles` (bandeaux), `fitMiniHeads` et `drawCoverBackdrop` (couverture).
6. `fetchExternalData(renderApp)` applique le cache local des jours fériés et vacances, interroge les API et **relance le rendu** si les données ont changé. Ensuite, `warnMissingData` affiche à l'écran (jamais à l'impression, `.data-warning`) un avertissement si les fériés ou les vacances de l'année manquent (hors connexion), ou si les vacances ne sont publiées que jusqu'à une date de l'année.

### 3.3 Web Components (`components.js`)

Les deux composants héritent de `MonthElement`, qui observe `year` et `month` et regroupe les rendus à la frame suivante (`requestAnimationFrame`).

**`<ami-calendar-grid>`** : grille fixe de **35 cases** (5 semaines × 7, lundi en premier). La grille ne dépasse jamais 5 semaines : les jours au-delà de la 35e case (mois sur 6 semaines) reviennent dans les premières cases vides. Chaque case est clonée depuis `#calendar-cell-template` et reçoit des classes selon `getDayInfo` :

| Classe              | Condition              | Effet                                      |
| ------------------- | ---------------------- | ------------------------------------------ |
| `is-holiday`        | vacances scolaires     | fond `--bg-holiday`                        |
| `is-public-holiday` | jour férié             | numéro terracotta                          |
| `is-eid`            | Aïd                    | numéro vert                                |
| `is-islamic-event`  | Aïd ou jour vertueux   | date hégirienne (en haut à droite) en gras |
| `multi-events`      | au moins deux libellés | numéro remonté                             |
| `empty`             | case hors du mois      | transparente (fond de la grille)           |

Éléments de la case :

- `.vis-greg` (numéro du jour) et `.vis-hij` (jour hégirien, vert, en haut à droite) ;
- `.new-moon-icon` : croissant au 1er jour du mois hégirien ;
- `.dst-icon` : horloge ambre doré (`--col-dst`) du changement d'heure (`dstIconHTML`), décalée si le croissant est aussi présent ;
- `.event-label` : libellés `event-line {type}-label`, types `eid`, `virtuous`, `public`, `dst`, sur une ligne chacun. Si l'Aïd tombe un jour férié, l'Aïd passe en haut de la case (`.event-label-top`).

**`<ami-prayer-table>`** : une ligne par jour depuis `#prayer-row-template` (jour abrégé sur 3 lettres, numéro, 6 horaires, jour hégirien). Classes :

- `is-friday` : fond `--bg-friday-light` (même vert que l'en-tête, texte normal) ; le dimanche est repéré par le filet de fin de semaine ;
- `week-end` : filet de 1,5 px `--border-week` après chaque dimanche, sauf en fin de mois ;
- `is-hijri-new` : 1er jour du mois hégirien, numéro en `--col-green-dark` dans la colonne hégirienne ;
- `is-dst` : jour du changement d'heure, fond doré `--bg-dst` (plus soutenu que les vacances) (le filet de fin de semaine reste celui de `--border-week`), texte normal (les horaires sautent d'une heure).

Le tableau occupe toute la hauteur : les mois de 28 à 31 jours tiennent sur la page.

### 3.4 Header de l'identité (`header.css`)

```
┌────┐  Nom tamoul (29 px) ❁ NOM FRANÇAIS (29 px)
│logo│  ───────────────────────────────────────────  filet fin (1 px, bleu doux)
│    │  🕌 adresse · 🏢 adresse · 📞 téléphone · ✉ e-mail · 🌐 site   (11 px, une ligne)
└────┘  (noms, filet et infos centrés sur la hauteur du logo)
```

- **Hauteur** : `--header-h` (20 mm), sous la zone de reliure. Fond blanc uni, sans frise ni motif, avec pour seul trait un filet fin entre les noms et les infos : le logo commence en haut du header et occupe toute sa hauteur (≈ 2 cm, `--logo-size`). L'espace avant le calendrier et le tableau est `--block-gap` (3 mm), le même qu'entre le calendrier et le tableau (à vérifier dans le PDF : environ 3 mm entre le header et les blocs, et 3 mm entre le calendrier et le tableau). (Essayés puis retirés : filet tricolore en haut, torsades en dégradé, girih gris en filigrane, fond dégradé beige ou halo grège, pastilles d'icônes bleu pâle, coordonnées en 3 puis 2 colonnes, header réduit au logo et aux noms — jugé trop nu pour le bureau.) Au-delà d'un logo de 2,4 cm (header à 24 mm), les 31 lignes du tableau deviennent serrées ; un logo de 2 cm suffit à l'identité. Le chemin girih (`cover-girih-path`) ne sert plus qu'à la couverture.
- **Grille** (`.header-content`) : deux colonnes (logo carré `--logo-size`, puis le reste) et quatre rangées (une rangée vide, noms, infos, une rangée vide : le bloc noms + infos est centré sur la hauteur du logo), zones `logo` / `names` / `contacts`. Aucun encart : tout est sur blanc.
- **Alignements** : pas de marge latérale : le logo s'aligne sur le bord gauche du calendrier, les noms s'étendent jusqu'au bord droit du tableau des horaires (29 px : le nom français finit à environ 11 mm de ce bord ; au-delà il serait rogné). Les noms, le filet et les infos sont centrés sur la hauteur du logo ; le tamoul reste à plus de 3 mm du bord haut du header, donc jamais rogné (une marge négative décalait la ligne d'infos dans le PDF).
- **Noms** (`.org-names`) : sur une seule ligne, tamoul en `--fs-brand` (29 px, graisse 500, safran) puis français en `--fs-brand-fr` (29 px, vert, même corps), séparés par une rosace à 8 pétales pointus (`.org-sep`, 16 px, `--col-blue`, ornement sans sens propre : lotus moghol, huit axes comme le girih de la couverture ; essayés : étoile à 8 ou 12 branches, rosaces à 6 ou 12 pétales, shamsa, khatam creux — les deux derniers ressemblaient à un engrenage à cette taille) : les trois couleurs du logo se retrouvent dans la ligne.
- **Filet** (`.header-contacts::before`) : pseudo-élément de 1 px, `--border-blue` (le bleu doux, séparateur du projet, de la même famille que les icônes et la rosace ; essayé en vert très pâle comme les lignes du tableau, plus voyant : ΔE 21 contre 18 au blanc), sur toute la largeur de la colonne des noms ; il est à égale distance (≈ 1,8 mm, mesuré dans le PDF) du bas des noms (jambages du tamoul compris) et du haut des infos. Il avait été retiré quand les infos étaient plus loin, puis remis quand les deux lignes ont été rapprochées.
- **Infos essentielles** (`.header-contacts`), une seule ligne en `--fs-contact` (11 px) gris doux `--col-text-soft` (5,3:1 sur blanc), alignée à gauche sous le nom tamoul : adresses de la mosquée et de la salle de prière, téléphone fixe, e-mail, site (`headerContactsHTML(c)` dans `js/utils.js`). Les icônes sont en bleu marine `--col-blue`, sans pastille. Les autres coordonnées (WhatsApp), les QR codes Mawaqit et l'IBAN/BIC ne sont que sur la couverture ; `contactsHTML(c, links)` sert à la feuille du Ramadan.

Le contenu statique du header dans `index.html` reprend exactement la structure générée par `headerContactsHTML` : toute modification de l'une doit être reportée dans l'autre.

### 3.5 Légende (`updateLegend`)

Pour chaque jour du mois : nom de la période de vacances (une fois par période, pastille `--bg-holiday` à contour doré) et passage à l'heure d'été / d'hiver (icône), triés par date, **sans date affichée** (les jours se repèrent dans la grille). Libellés en minuscules, `--fs-xs`, couleur `--col-text`. Les jours islamiques et les fériés n'y figurent pas : ils sont écrits dans les cases.

La bande garde la même hauteur même vide (`min-height`), pour que la grille ait la même taille chaque mois.

### 3.6 Page de couverture (`#cover-template`, `cover.css`, `updateCover`)

Première page du PDF, avec une mise en page propre (ni header, ni grille des mois) : page blanche, marges de 5 mm sur les côtés et en bas comme les pages des mois, `--binding-zone` en haut. Un seul espacement, `--cover-gap` (2,5 mm), entre les blocs.

```
┌───────────────────────┬──────────────────────────────────────────────┐
│░░░░ [logo 56 mm] ░░░░░│           2027   ١٤٤٨                        │
│░░░░░░░░░░░░░░░░░░░░░░│                  ١٤٤٩                        │
│░░░░░░░░░░░░░░░░░░░░░░│                                              │
│ ┌ carte blanche ────┐ │ JANVIER  رجب  FÉVRIER …  MARS …   AVRIL …   │
│ │ (◷) Horaires…     │ │ … 12 mini-mois, 4 colonnes × 3 lignes,       │
│ │ [QR]      [QR]    │ │   sans fond (fondus dans la page) …          │
│ │ Mosquée   Salle…  │ │                                              │
│ │ (GMP) Horaires…   │ │                                              │
│ │ contacts 2 × 2    │ │                                              │
│ │ (♡) Soutenez…     │ │ ┌ encart du verset ────────────────────────┐ │
│ │ (LBP) IBAN, BIC   │ │ │  ﴾ français / tamoul ۝ ﴿     Coran 4:103 ×2 │ │
│ └───────────────────┘ │ └─────────────────────────────────────────┘ │
└───────────────────────┴──────────────────────────────────────────────┘
```

- **Colonne d'identité** (76 mm, coins arrondis) : seul aplat de couleur de la page ; logo en haut, carte pratique en bas.
    - **Fond** : SVG inline `.cover-identity-bg` (vectoriel dans le PDF, voir 8) : dégradé vertical `--bg-cover-top` → `--bg-cover-mid` (30 %) → `--bg-cover-low` (turquoise pâle, 65 %) → `--bg-cover-bottom` (vert `--bg-green-friday`), bleu franc éclairci vite (éco-encre) ; motif girih blanc à traits épais (masque `cover-girih-line-bold`, propre à la colonne), à 50 % au bord du logo, fondu radial rapide jusqu'à environ 10 % à 200 px du centre (rayon du masque 210 px), fondu par un masque radial centré sur le logo. Le motif est calé sur le logo : une étoile du motif est au centre du disque (`translate`) et l'échelle 1,175 fait du diamètre du logo exactement 2 pas du motif ; `cx`/`cy` du masque et `translate` du motif sont en px, à recaler ensemble si le logo bouge ou change de taille. Le logo est centré verticalement entre le haut de la colonne et la carte. Couleurs portées par des classes (`.cover-bg-top`…) et des jetons, pas dans le SVG.
    - **Logo** de 56 mm, en haut : il signe la page, l'année restant le point d'entrée.
    - **Carte pratique** (blanche, alignée à gauche comme une fiche), rubriques séparées par des traits fins continus de 0,5 px `--border-blue` (pseudo-éléments, `--info-gap`), pastilles de 7 mm pour les en-têtes et de 5 mm pour les éléments (lieux, contacts), chacune ouverte par une pastille ronde bleu pâle et un titre français (petites capitales) et tamoul :
        - **Horaires de prière et annonces** (pastille Mawaqit) : les deux lieux côte à côte, QR code puis nom (pastille : mosquée, tapis de prière `icon-prayer-room`) et rue centrés dessous, la ville écrite une seule fois ; en dernières lignes, la référence des dates hégiriennes (pastille croissant, « Dates hégiriennes indicatives », « ஹிஜ்ரி தேதிகள் தோராயமானவை » ; la source n'est pas nommée) après la source des horaires imprimés (pastille GMP, deux lignes en 10 px : « Horaires : Grande Mosquée de Paris », « நேரங்கள்: பாரிஸ் பெரிய பள்ளிவாசல் »), complément de Mawaqit (horaires à jour et annonces) ;
        - **contacts** en grille 2 × 2, sans titre, avec pastilles d'icône (téléphone fixe, WhatsApp, courriel, site) ; une icône n'a qu'un seul sens sur la page ;
        - **Soutenez votre mosquée** (pastille « don » : main portant un cœur, `icon-donate`) : IBAN et BIC en 10 px, précédés du symbole de La Banque Postale en pastille.
    - **Logos partenaires** en bleu marine monochrome, dans les mêmes pastilles que les icônes : `mawaqit-icon-mono.png`, `logo-lbp-mono.svg` (oiseau redessiné en vectoriel), `logo-gmp-mono.png`. Les versions en couleur restent dans `assets/img/` (l'icône Mawaqit en couleur est celle du centre des QR codes). Usage des marques à faire autoriser.
- **En-tête des années** (`.cover-years`), épuré, centré sur les mois, sans filet : il occupe la hauteur libre au-dessus des mois, ce qui laisse un grand espace blanc. L'année (`--fs-cover-year`, gras, en SVG ajusté par `fitCoverYear`, qui cale aussi les dégradés sur la hauteur des chiffres : « 20 » (même taille que le « 27 ») en dégradé vertical `--bg-cover-mid` → `--col-year-dark-top` (le bas du « 20 » rejoint le haut du « 27 »), « 27 » en dégradé vertical marqué `--col-year-dark-top` → `--col-year-dark-bottom`, motif girih blanc en filigrane à grande échelle, discret en haut des chiffres (partie claire, environ le tiers de l'intensité) et de plus en plus net vers le bas (partie foncée, 45 % au maximum) grâce à un masque en dégradé `#cover-year-fade-mask`), en grand et centré sur les mois, avec un peu d’air avant eux. De chaque côté, **une aile réduite à une rosace** (`.cover-wings`, SVG vectoriel à la hauteur des chiffres) : un lotus à huit pétales en ogive sur trois tons de **jaune chaud** (demande de l'utilisateur : « l'équivalent en jaune du vert sauge et du bleu ardoise, plutôt chaud afin de contraster avec le froid du bleu et du vert déjà présents ») : pétales extérieurs `--col-orn-sand` (`#f1e6c9`), pétales du milieu `--col-orn-ocre` (`#c4ad64`, jaune terni comme le vert sauge), petits pétales intérieurs `--bg-holiday` (le fond des vacances), avec une étoile à huit branches en `--col-orn-bistre` (`#7a6633`, jaune brun comme l'ardoise est un bleu profond) au cœur. Jetons dédiés, réservés à cet ornement (essayés : bleu ardoise et vert de gris, grège et gris pierre, beige et or, moutarde de Pondichéry `#e5a93c` avec safran ou terracotta, trop vifs, ocre plus verdâtre `#b8a15c`, kaki, dégradé subtil des pétales, trop discret ; le terracotta reste réservé aux fériés), posé à l'extrémité de la ligne, juste avant l'année hégirienne. Le dessin (`#cover-wing-art`) est défini une fois et reflété à droite (`scale(-1 1)`) ; chaque aile est un `<svg>` imbriqué calé sur un bord de la zone des mois, donc symétrique et sans toucher les chiffres. Formes **plates, sans bordure**, à **pleine opacité** (les teintes sont déjà ternies) : la rosace est petite (≈ 2 cm) donc reste en retrait devant « 2027 » et les deux années hégiriennes (demande de l'utilisateur : « les plus légères, minimalistes et épurés possible » ; puis « retirer les feuilles autour des années et ne garder que les rosaces aux deux extrémités »). À vérifier au laser : les pétales extérieurs sont très pâles. Les classes de remplissage (`.w-petal`, `.w-core`…) sont des sélecteurs simples, sans ancêtre : le dessin est instancié par <use> et Chrome n'applique pas les règles qui dépendent de l'arbre d'origine. Historique des essais : girih répété, treillis, arcature, motifs géométriques, tige de fleur, guirlande de fleurs, boteh (retiré : « le truc en forme de mangue »), rinceaux fournis, puis rinceaux d'arabesque à volutes et bourgeons de lotus (trop présents pour l'effet voulu). Écartés : croissants, lanternes, mosquée, tons corail/rose, aquarelle réaliste. Les **années hégiriennes** reviennent, plus petites (`--fs-cover-hijri`, 44 px, `--col-hijri-soft`), **de chaque côté** de l'année grégorienne (la première à gauche, la seconde à droite : ordre chronologique ; la même des deux côtés si l'année tient dans une seule), chacune dans un `<span class="cover-hijri">` de 34 mm centré dans l'espace entre l'année et la rosace d'extrémité. Elles sont posées dans le flux (donc la couleur et la taille sont du CSS). L'année hégirienne de départ n'est donc plus rappelée dans les mini-mois, seulement au changement (Muharram). Cette composition vient d'une inspiration de l'utilisateur (« 2027 » flanqué des années hégiriennes et de rinceaux).
- **QR codes** : SVG statiques `assets/img/qr-mawaqit-pasteur.svg` et `qr-mawaqit-musset.svg`, générés avec la bibliothèque npm `qrcode` (correction d'erreur **H**, couleur `--col-blue`, sans marge), 22 mm, la carte blanche servant de zone de silence ; icône Mawaqit au centre (6,5 mm, environ 27 % de la largeur, compensée par la correction H). Pour changer une URL, regénérer le SVG avec les mêmes options.
- **Mini-mois** (`updateCover`), 4 colonnes × 3 lignes, même écart de 4 mm entre les mois dans les deux sens, lignes de 20 px : sans fond ni cadre, nom français et tamoul à gauche, mois hégiriens en arabe à droite, un par ligne, l'année hégirienne rappelée seulement au mois où elle change (Muharram, une fois dans l'année : `hijriLines`), puisqu'elle figure dans l'en-tête. Un filet `--border-blue` sous l'en-tête. Jours à partir du lundi, sur 5 semaines : un 6ᵉ lundi éventuel revient sur la première ligne.
    - Vendredis et dimanches en gris teinté (`--col-friday`, `--col-sunday`), fériés en terracotta gras.
    - **Vacances** : fond `--bg-holiday` dessiné en SVG derrière les chiffres par `drawCoverBackdrop` : une pastille (`<rect>`, rayon 4 px) par suite de jours consécutifs d'une même semaine, avec un retrait de 1 px sur les côtés et de 2 px en haut et en bas (donc 4 px entre deux semaines : à 2 px, l’espace vertical ne se voyait pas) pour que les quatre angles arrondis restent visibles, même sur plusieurs semaines. Avant : cases jointives et angles droits à l'intérieur de la période, jugés moins lisibles (demande de l'utilisateur, qui acceptait d'y renoncer si le rendu ne convenait pas).
    - **Aïd** : pastille ronde de 19 px (`--bg-eid`) en pseudo-élément, chiffre en gras `--col-friday` ; prioritaire sur un jour férié.
    - Pas de légende : les marques se comprennent d'elles-mêmes (à revoir après les retours de l'impression).
    - `fitMiniHeads` réduit l'arabe puis resserre le nom français si un en-tête est trop large (aucun cas de 2025 à 2030).
- **Verts de la couverture**, réduits à trois : `--col-friday` pour tous les textes et ornements verts (vendredis, chiffres de l'Aïd, ﴾ ﴿, ۝, références du verset), `--bg-eid` (pastille de l'Aïd) et `--bg-friday-light` (encart du verset) pour les fonds.
- **Verset** (An-Nisāʾ, 4:103), en deux lignes, présenté comme dans un Coran imprimé : encart vert très pâle (`--bg-friday-light`) sous les mois, aligné sur leurs grilles, son bas sur celui de la colonne. Centré dans l'encart (grille `1fr auto 1fr`), entre deux grandes parenthèses ornées ﴾ ﴿ : le français en gris foncé italique au-dessus du tamoul en gris moyen, puis le numéro dans le symbole de fin de verset ۝ (U+06DD, chiffres ١٠٣ inscrits dans le cercle par Amiri). Calée à droite, la référence sourate:verset, chacune en face de sa langue : « Coran 4:103 » et « குர்ஆன் 4:103 », en vert discret. **Traductions seulement** : le texte arabe du Coran n'est pas imprimé sur un support destiné à être jeté.

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

- **Secours** : calcul Adhan (`initAdhan`, `getPrayerTimesSafe`), avec `CONFIG.method` (défaut MuslimWorldLeague), angles 18°, madhab selon `CONFIG.asrMethod`, règle haute latitude « septième de la nuit ».
- `shiftTime(time, minutes)` décale un horaire `HH:MM` (Imsak de la feuille du Ramadan).

### 4.2 Dates hégiriennes (`getHijriDateSafe`)

- Référence : calendrier **Umm al-Qura** (choix de l'AMI). `DATE_UTILS.toHijriUmmAlQura` lit une table figée des débuts de mois (`UMM_AL_QURA_STARTS`, 1445 à 1453, soit juillet 2023 à mi-2032), générée avec `Intl` « islamic-umalqura » et vérifiée jour par jour de 2024 à 2031 : même résultat sur tous les navigateurs, sans dépendre de leur `Intl`. Résultat mis en cache par date. Hors de la table, secours sur le calcul civil tabulaire (`DATE_UTILS.toHijriCivil`).
- **Prolonger la table** : générer les débuts de mois des années suivantes avec `Intl.DateTimeFormat('en-u-ca-islamic-umalqura')` (Node ou navigateur récent) et les ajouter à `UMM_AL_QURA_STARTS` au format « MM-JJ ».
- **Décalage manuel** : `HIJRI_OFFSETS` liste des périodes `{ start, end, offset }` (jours) pour suivre les dates annoncées par les imams. Les années sans entrée suivent le calcul.
- Les noms des mois viennent de `HIJRI_MONTHS` (`utils.js`), indexé par numéro de mois : **translittération standard** (`Ramaḍān`, `Shawwāl`, `Dhū al-Ḥijjah`…), arabe et tamoul. Les noms renvoyés par `Intl` ne sont plus utilisés : ils varient selon le navigateur (Chrome sur Android embarque des données de langue allégées : pour le 7ᵉ mois, il renvoyait « juillet » au lieu de « Rajab »).
- Retour : `{ day, monthNameFR, monthNameAR, monthNameTA, year, yearAr }`. **Toute comparaison de mois se fait sur `monthNameFR`** (nom standard), jamais sur un nom brut.

### 4.3 Jours particuliers (`getDayInfo`)

| Information           | Règle                                                                                  | Rendu                                              |
| --------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Vacances scolaires    | période de `CONFIG.schoolHolidays` contenant le jour                                   | fond doré pâle, nom dans la légende                |
| Jour férié            | `CONFIG.publicHolidays['AAAA-MM-JJ']`, libellé raccourci par `HOLIDAY_NAMES`           | numéro terracotta, libellé                         |
| Changement d'heure    | `DATE_UTILS.dstChange` : derniers dimanches de mars (`summer`) et d'octobre (`winter`) | icône et libellé ambre doré (`--col-dst`), légende |
| Nouveau mois hégirien | jour hégirien = 1                                                                      | croissant                                          |
| Aïd                   | `EID_NAMES` : 1er Shawwāl (Eid-ul-Fitr), 10 Dhū al-Ḥijjah (Eid-ul-Adha)                | numéro vert, libellé en premier                    |
| Jours vertueux        | `VIRTUOUS_DAYS` : 1er Ramaḍān, 9 Dhū al-Ḥijjah (ʿArafa), 10 Muḥarram (ʿĀshūrāʾ)        | libellé vert, date hégirienne en gras              |

Retour : `{ isHoliday, holidayName, isPublicHoliday, isDST, dstType, isNewMoon, isEid, eidName, labels: [{ text, type }] }`.

`VIRTUOUS_DAYS` ne retient que des jours dont le mérite repose sur des hadiths authentiques (sources citées dans le code), et seulement des jours précis (pas de périodes). Ajouter un jour : une entrée `mois standard → { jour: 'libellé' }`.

### 4.4 Jours fériés et vacances (`fetchExternalData`)

- API : `calendrier.api.gouv.fr/jours-feries/metropole.json` et `data.education.gouv.fr` (zone C, académie de Créteil).
- **Stale-while-revalidate** : le cache `localStorage` (`ami_calendar_cache_v2`) est appliqué immédiatement, puis l'API est toujours interrogée ; le rendu est relancé si les données changent.
- `normalizeSchoolHolidays` : date de fin = veille de la reprise ; saisons en minuscules (« Vacances d'hiver ») ; doublons élèves / enseignants supprimés ; une période sans fin connue (« Début des vacances d'été ») va jusqu'au 31 août.
- Conséquence : **un PDF généré hors ligne, sur un navigateur sans cache, n'a ni jours fériés ni vacances.**

### 4.5 Configuration client (`clients/*.json`)

Chargée par `?mosque=<id>` (`fetchClientConfig` ; la feuille du Ramadan utilise `ami93120` par défaut).

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
    "location": { "lat": 48.92, "lng": 2.4, "params": { "method": "MuslimWorldLeague", "asr": "Standard" } },
    "theme": { "color_brand": "#c8a85a" }
}
```

- `location` est fusionné dans `window.CONFIG` (il ne sert qu'au calcul Adhan de secours).
- Les icônes d'adresse désignent un fichier `assets/icons/icon-<nom>.svg` (`location` par défaut).
- `theme.color_brand` surcharge `--brand` (`applyTheme`).

### 4.6 Coordonnées (`contactsHTML`, `utils.js`)

`contactsHTML(contact, layout, links)` produit le HTML des coordonnées pour les deux documents :

- `'columns'` (calendrier annuel) : grille de 3 lignes (voir 3.4) ;
- `'rows'` (feuille du Ramadan) : 3 groupes `.contact-group` (adresses | téléphones, e-mail, site | IBAN • BIC), siège en premier ;
- `links = true` : coordonnées cliquables (appel, WhatsApp, e-mail, plan, site), utilisé par la feuille du Ramadan (PDF partagé).

## 5. Feuille du Ramadan (`ramadan.html`, `ramadan.js`)

- **Période** : balayage de l'année du 29 Shaʿbān (nuit du doute) au 1er Shawwāl (Aïd). Année par défaut : l'année en cours, ou la suivante si l'Aïd el-Fitr est passé ; `?year=` pour forcer.
- **Colonnes** : jour (français, tamoul), numéro, Imsak (= Fajr − `IMSAK_MINUTES_BEFORE_FAJR`), 6 horaires, **Icha AMI** (`AMI_ISHA` : 1re et 2e quinzaine), jour hégirien, jour en arabe.
- **Lignes spéciales** : nuit du doute et Aïd (libellé trilingue sur toute la largeur), séparateur avant la 27e nuit (`laylat-al-qadr-sep`).
- **Corrections** : `data/ramadan_overrides.json` (`{ "AAAA-MM-JJ": { "fajr": "06:09", … } }`) remplace les horaires calculés. `node data/csv_to_json.js` le génère depuis `data/ramadan_raw.csv` (régler `START_DATE` en tête du script).
- **Hauteur des lignes** : après chargement des polices, toutes les lignes reçoivent la même hauteur (`--row-h`) = hauteur disponible ÷ nombre de lignes. Le tableau reste l'élément prioritaire de la page.
- **Pied de page** : invocation (`.dua`) sous le tableau, puis bande blanche de l'identité (`--footer-h`, logo, noms, coordonnées en `'rows'`).
- **Version unique**, pensée pour l'impression : fond clair `ramadan-background.jpg` sous un voile blanc (`--bg-veil`), économe en encre ; coordonnées cliquables dans le PDF. Les rôles de couleur `--rule`, `--surface`, `--surface-fast` sont déclarés sur `.page`.

## 6. Design system (`css/variables.css`)

Couleurs et leur sens, typographie, espacements, icônes et composants sont décrits dans **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)**, qui fait référence. À retenir ici :

- **Une couleur = un sens**, une icône = un sens ; textes à 4,5:1 minimum (ratios en commentaire des jetons).
- **Flat design** : aplats et filets de 0,5 px ; seuls dégradés : SVG vectoriels (fond de la colonne d'identité, année et girih de la couverture).
- **Aucune couleur ni taille de police en dur** dans les feuilles de style du calendrier ni dans ses SVG : ajouter un jeton (exceptions : `white`, les valeurs de luminance des masques SVG de la couverture).
- Les petits ajustements de mise en page en millimètres (écart des noms) restent locaux, commentés à côté de la règle.
- Fonds pastel **opaques** (pas de transparence) : rendu fiable sur le copieur laser.
- Graisses : 400 à 600 pour le français et le tamoul, 400 à 500 pour l'arabe (Amiri) ; l'année de la couverture (700) est un élément d'affichage.
- `ramadan.css` est autonome : il réutilise les jetons communs, mais garde ses propres rôles de couleur (voir 5).
- Jetons locaux (déclarés sur le composant qui les utilise) : `--band-motif-h` (header), `--row-h`, `--rule`, `--surface`, `--surface-fast`, `--footer-h`, `--bg-veil` (feuille du Ramadan).

## 7. Qualité et vérification

```bash
npm run lint       # ESLint (globals CONFIG, TEXTS, adhan déclarés dans eslint.config.mjs)
npm run prettier   # Prettier (HTML, CSS, JS, JSON, Markdown)
```

Il n'y a pas de tests unitaires, mais `npm run check` (`scripts/check.mjs`) automatise le point 1 ci-dessous : il lance Chrome en mode headless et compte les pages PDF (13 par année, couverture sur 1 page sans débordement, Ramadan sur 1 page). Années par défaut 2025–2030, ou `npm run check -- 2027`. Avant de livrer une modification :

1. Rendu PDF sans débordement : 13 pages pour `index.html?year=…` (couverture + 12 mois ; tester au moins deux années), 1 page pour `index.html?month=cover` et pour `ramadan.html`.
2. Vérifier le header avec et sans `?mosque=ami93120` (contenu généré et contenu statique).
3. En cas de refactoring, comparer le contenu rendu avant / après (titres, cases, tableaux, légende) sur plusieurs années.
4. Vérifier un mois avec changement d'heure (mars, octobre), un mois avec Aïd et un mois de 31 jours commençant un samedi ou un dimanche (6 semaines).

Rendu PDF en ligne de commande (serveur local lancé) :

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --no-pdf-header-footer \
  --virtual-time-budget=10000 --print-to-pdf=calendrier.pdf "http://localhost:3000/index.html?year=2027&mosque=ami93120"
```

## 8. Pièges connus

- **Noms de fichiers construits dynamiquement** : `icon-dst-${…}.svg` et `icon-${addr_icon}.svg`. Une recherche textuelle ne les trouve pas : ne pas les supprimer comme « inutilisés ».
- **Filets de 0,5 px** : Chrome arrondit une `border` de 0,5 px à 1 px, même à l'impression. Le tableau des horaires utilise donc des `border` de 1 px (et 1,5 px après le dimanche) ; il est en `border-collapse: separate` pour que le filet du bas de la dernière ligne ne soit pas rogné par le conteneur arrondi (en `collapse`, il tombait à moitié hors du tableau). `--hairline` (0,5 px réels dans le PDF) reste utilisé pour les traits de la couverture.
- **Images de fond SVG et PDF** : Chrome pixellise `background-image` et `<pattern>` SVG à l'export, ainsi que les dégradés CSS (`radial-gradient`, `repeating-linear-gradient`). Pour un motif net, utiliser du SVG inline avec `<use>` ; pour une pastille, un pseudo-élément à `border-radius: 50%`.
- **Dégradés et motifs en PDF** : un dégradé CSS est pixellisé, un `linearGradient` SVG inline reste vectoriel. Les motifs masqués (girih de la couverture) sortent en image à 300 ppp, qualité d'impression suffisante.
- **Chiffres arabes et sens d'écriture** : sur une même ligne, « ١٤٤٨ – ١٤٤٩ » s'afficherait inversé (l'algorithme bidi traite le tiret entre deux nombres arabes comme du texte de droite à gauche). La couverture empile donc les deux années, une par élément (`updateCover`).
- **Filets en ombre portée** : un `box-shadow` qui dessine un filet le long d'un bloc isolé (sans voisins) laisse des traces fantômes sur ses bords dans le PDF. Sur la couverture, ces filets sont des pseudo-éléments (`::after` de 0,5 px).
- **Header en double** : le contenu statique de `index.html` et `contactsHTML` doivent garder la même structure (voir 3.4). Dans le calendrier annuel, `contactsHTML` affiche le téléphone fixe (`icon-landline`) et le tapis de prière (`icon-prayer-room`) à la place de l'icône `office`, comme sur la couverture ; la feuille du Ramadan garde ses icônes.
- **Dates hégiriennes** : calendrier Umm al-Qura, pouvant différer d'un jour de l'observation du croissant en France (Hilal France). Indiqué sur la couverture (« Dates hégiriennes indicatives ») ; à valider chaque année avec les imams (`HIJRI_OFFSETS`), table à prolonger au-delà de 1453.
- **Affichage sur smartphone** : la balise `viewport` fixe la largeur d'affichage à celle de la page (1160 px pour l'annuel, 830 px pour le Ramadan) pour que la page entière tienne à l'écran. Avec `width=device-width`, la page centrée débordait des deux côtés et la partie gauche devenait inaccessible. `align-items: safe center` sur `body` garde ce bord gauche visible dans une fenêtre étroite.
- **Jours fériés / vacances** : dépendent du réseau au premier chargement (voir 4.4).
- **Version papier du Ramadan** : les images de fond d'origine font environ 720 × 1024 px ; les agrandir (×4) pour un tirage net.

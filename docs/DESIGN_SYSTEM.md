# Design system

Référence unique des couleurs, de la typographie, des espacements, des icônes et des composants du **calendrier annuel** (`index.html`). Les jetons sont dans `css/variables.css` ; la structure du code est dans [TECHNIQUE.md](TECHNIQUE.md).

`ramadan.html` (`css/ramadan.css`) est un design distinct, encore en conception : il réutilise certains jetons mais garde ses propres rôles de couleur. Ne pas l'aligner sur ce document (voir §9).

## 1. Principes

1. **Une couleur = un sens** (voir §2.2). On n'ajoute pas une couleur pour décorer ; on en réutilise une qui a déjà le bon sens.
2. **Flat design** : aplats, filets fins, aucune ombre à l'impression. Les seuls dégradés sont vectoriels (SVG) : fond de la colonne d'identité, « 20 » et « 27 » de l'année de la couverture, fondu du girih de l'année.
3. **Épuré** : peu de bordures, couleurs douces (pastels), la lisibilité avant l'ornement. Les séparateurs sont des **filets fins continus** (0,5 px sur la couverture, 1 px dans le tableau des horaires).
4. **Une icône = un sens** (voir §5). Jamais la même icône pour deux choses différentes.
5. **Lisible à l'impression laser de bureau** : fonds pastel **opaques** (pas de transparence), textes à 4,5:1 minimum (WCAG AA ; les ratios sont dans les commentaires des jetons), pas de texte sous 8 px.
6. **Aucune couleur ni taille en dur** dans les feuilles de style ni dans les SVG : ajouter un jeton plutôt qu'une valeur. Exceptions : `white` (le papier) et les valeurs de luminance des masques SVG de la couverture.
7. **Trilingue** : français, arabe et tamoul se lisent à égalité ; le français porte l'information, les traductions sont une taille en dessous.

## 2. Couleurs

### 2.1 Palette de marque (logo AMI)

| Jeton                   | Valeur                         | Origine dans le logo / usage                                                 |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `--col-blue`            | `#002e5d`                      | Bleu de la tour Eiffel : noms de mois (titre), pastille et icônes            |
| `--col-green`           | `#2e7d32`                      | Vert de la mosquée : repères islamiques, nom français du header              |
| `--col-green-dark`      | `#1b5e20`                      | Texte sur fond vert pâle (6,9:1)                                             |
| `--col-saffron-text`    | `#b8520f`                      | Safran du minaret : nom tamoul du header (4,9:1)                             |
| `--col-gold`, `--brand` | `#c8a85a`                      | Or des ornements ; `--brand` est surchargeable par client (`clients/*.json`) |
| `--brand-text`          | 40 % plus sombre que `--brand` | Textes dorés du header (4,7:1)                                               |

### 2.2 Couleurs de sens

C'est la table à connaître. Chaque ligne dit **ce que la couleur signifie** ; ne pas l'employer pour autre chose.

| Sens                                | Couleur (jeton)                                                                     | Où                                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Calendrier grégorien, structure     | Bleu : `--col-blue`, `--col-title-blue` (`#46628a`, 5,6:1)                          | Arabe et tamoul de la ligne des jours, jours de la semaine, mini-mois, « 20 » et « 27 » de la couverture    |
| Hégirien, islamique, prière         | Vert : `--col-green`, `--col-friday` (`#41694a`, 6,3:1)                             | Jour hégirien et croissant des cases, Aïd, ʿArafa, vendredis, « 01 » du tableau, verset, années hégiriennes |
| Années hégiriennes de la couverture | Vert pâle : `--col-hijri-soft` (`#5d946a`, 3,6:1, grand texte uniquement)           | Années hégiriennes en 49 px                                                                                 |
| Jour férié (civil)                  | Terracotta : `--col-terracotta` (`#a8461f`, 5,9:1)                                  | Numéro et libellé du jour férié. **Réservé aux fériés** (et au jeûne sur la feuille du Ramadan)             |
| Dimanche                            | Orange brûlé : `--col-sunday` (`#9d592a`, 5,4:1), distinct du terracotta des fériés | Numéro du dimanche (presque neutre, pour ne pas concurrencer les fériés)                                    |
| Vacances scolaires                  | Beige doré pâle : `--bg-holiday` (`#fbf6e7`)                                        | Fond des cases de vacances (zone C), pastille de légende (contour `--col-gold`)                             |
| Changement d'heure                  | Ambre doré : `--col-dst` (`#946700`, 5,0:1 sur blanc)                               | Horloge et libellé de la case, légende ; ligne du tableau en `--bg-dst`                                     |
| Identité tamoule                    | Safran : `--col-saffron-text`                                                       | Nom tamoul, frise du haut                                                                                   |
| Neutre                              | Gris : `--col-text`, `--col-text-light`, `--col-text-soft`                          | Numéros du jour ordinaire, textes courants, cases hors du mois                                              |

Priorité quand plusieurs sens tombent le même jour : **Aïd (vert) > jour férié (terracotta) > vendredi > dimanche > jour ordinaire**.

### 2.3 Fonds pastel (éco-encre)

Tous opaques ; ce sont des aplats, jamais des dégradés.

**Principe des en-têtes pleins** : le niveau d'assombrissement le plus bas qui fait encore ressortir le texte blanc (économie d'encre, moins de risque de traces au laser). Les deux en-têtes ont la même luminosité (L* ≈ 33).

**Seuil de visibilité à l'impression** : un fond doit s'écarter du blanc d'au moins **ΔE ≈ 8** (CIE Lab) pour se voir sur le copieur laser de l'association (essai du 23/10/2026 : le vert `--bg-green-head`, à ΔE 8,5, se voit ; le beige à 6,7 et le bleu à 5,6 ne se voyaient pas). Les fonds sous ce seuil (`--bg-friday-light` à 5,0) sont des repères secondaires : à relever si l'impression les efface.

| Jeton                  | Valeur              | Usage                                                                                                                                                                                    |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bg-blue-head`       | `#e5edf6`           | Pastilles d'icônes, couverture (fonds pâles)                                                                                                                                             |
| `--bg-grid`            | `#e5edf6`           | Fond commun de la ligne des jours, de la grille des jours (visible dans les espaces de 4 px entre les cases) et de la légende : même intensité que `--bg-green-head` (ΔE ≈ 8,5 au blanc) |
| `--bg-head-blue`       | `#364f6f`           | Bandeau du mois et cadre du calendrier : bleu ardoise plein (L* ≈ 33, chroma ≈ 21, blanc dessus 8,4:1)                                                                                   |
| `--bg-head-green`      | `#35553c`           | En-tête et cadre du tableau : vert sapin plein, même assombrissement (L* ≈ 33, chroma ≈ 21, blanc dessus 8,4:1)                                                                          |
| `--col-on-dark-soft`   | `#dbe6f3`           | Traductions et année sur les en-têtes foncés                                                                                                                                             |
| `--bg-blue-faint`      | `#eef3f9`           | Feuille du Ramadan uniquement (indépendant du bandeau du mois)                                                                                                                           |
| `--bg-green-head`      | `#e7f2e8`           | Colonnes de date (grégorien et hégirien) du tableau                                                                                                                                      |
| `--bg-green-faint`     | `#e7f2e8`           | Traits verticaux du tableau, vendredis de la feuille du Ramadan                                                                                                                          |
| `--bg-friday-light`    | `#e7f2e8`           | Vendredis du tableau annuel (ligne entière), encart du verset de la couverture (relevé de #f1f8f2, ΔE 5 → 8,5)                                                                           |
| `--bg-green-friday`    | `#d6e9d9`           | Vendredis dans les colonnes de date : un cran au-dessus de `--bg-green-head`                                                                                                             |
| `--bg-holiday`         | `#fbf6e7`           | Vacances scolaires                                                                                                                                                                       |
| `--bg-dst`             | `#f8edc6`           | Ligne du changement d'heure dans le tableau : plus soutenu que les vacances (ΔE ≈ 21 au blanc)                                                                                           |
| `--bg-eid`             | `#cfe7d2`           | Pastille de l'Aïd sur les mini-mois de la couverture                                                                                                                                     |
| `--bg-cover-top`       | `#6886b2`           | Haut du dégradé de la colonne d'identité de la couverture (bleu franc derrière le logo)                                                                                                  |
| `--bg-cover-mid`       | `#96acca`           | Dégradé à 30 % de la hauteur                                                                                                                                                             |
| `--bg-cover-low`       | `#9cc6ca`           | Aux deux tiers : turquoise pâle, passage bleu → vert (interpolé en LCH, sans gris)                                                                                                       |
| `--bg-cover-bottom`    | `--bg-green-friday` | Bas du dégradé : vert pâle de la palette (`#d6e9d9`)                                                                                                                                     |
| `--bg-terracotta-soft` | `#fbebe4`           | Cellules du jeûne (feuille du Ramadan uniquement)                                                                                                                                        |

### 2.4 Filets et bordures

Filets internes de **0,5 px** (`--hairline`), tracés en `box-shadow: inset` ou en pseudo-élément (une `border` de 0,5 px devient 1 px dans le PDF).

| Jeton            | Valeur    | Usage                                                         |
| ---------------- | --------- | ------------------------------------------------------------- |
| `--border-blue`  | `#c5d3e4` | Séparateurs de la couverture et de la feuille du Ramadan      |
| `--border-green` | `#c3dec6` | Grille du tableau, fin de semaine, cadre du tableau           |
| `--border-week`  | `#6f9a79` | Filet de 1,5 px après chaque dimanche du tableau des horaires |

Pas de cadre autour des blocs : l'en-tête plein dessine le haut, la légende, sur le même fond `--bg-grid`, ferme le bas du calendrier. Dans le calendrier, les cases blanches (coins `--radius-cell`, 8 px) sont séparées par des espaces `--grid-gap` (0,25 rem, 4 px) sur fond `--bg-grid`, sans filets.

### 2.5 Neutres

`--col-ink` `#1f1f1f` (horaires et chiffres), `--col-text` `#333`, `--col-text-light` `#555` (numéros du jour), `--col-text-soft` `#6b6b6b` (5,3:1, texte discret), `--bg-body` (fond autour des pages, écran seulement).

### 2.6 Couverture

| Jeton                    | Valeur    | Usage                                   |
| ------------------------ | --------- | --------------------------------------- |
| `--col-year-dark-top`    | `#2f5283` | « 20 » : bas du dégradé ; « 27 » : haut |
| `--col-year-dark-bottom` | `#001a36` | « 27 » : bas du dégradé (bleu nuit)     |

Le « 20 » va de `--bg-cover-mid` (haut) à `--col-year-dark-top` (bas), puis le « 27 » continue jusqu'à `--col-year-dark-bottom` : un seul dégradé sur toute l'année.

Le girih de l'année est blanc, à 45 % d'intensité maximale, fondu du haut (discret) vers le bas (net) par le masque `#cover-year-fade-mask`.

## 3. Typographie

| Usage                | Police                                    | Jeton       |
| -------------------- | ----------------------------------------- | ----------- |
| Français et chiffres | Noto Sans (auto-hébergée, `assets/fonts`) | `--font-fr` |
| Arabe                | Amiri (Noto Naskh Arabic en secours)      | `--font-ar` |
| Tamoul               | Noto Serif Tamil                          | `--font-ta` |

### 3.1 Échelle de tailles

| Jeton                                  | px       | Usage                                                   |
| -------------------------------------- | -------- | ------------------------------------------------------- |
| `--fs-2xs`                             | 9        | Libellés dans les cases du calendrier                   |
| `--fs-verse`                           | 11       | Verset de la couverture                                 |
| `--fs-xs`                              | 10       | Notes, en-têtes du tableau                              |
| `--fs-contact`                         | 11       | Coordonnées du header                                   |
| `--fs-sm`                              | 12       | Traductions, légende, jour hégirien des cases           |
| `--fs-md`                              | 14       | Courant : jours de la semaine, sous-titres de mois      |
| `--fs-figure`                          | 15       | Horaires de prière, chiffres du tableau                 |
| `--fs-brand-fr` / `--fs-brand`         | 20 / 28  | Nom français / nom tamoul de l'association              |
| `--fs-xl` / `--fs-month`               | 22 / 24  | Mois hégirien en arabe / mois grégorien                 |
| `--fs-display`                         | 36       | Numéros des jours du calendrier                         |
| `--fs-cover-hijri` / `--fs-cover-year` | 49 / 140 | Années hégiriennes / année grégorienne de la couverture |

À la couverture, l'année hégirienne (49 px) a la même hauteur de chiffres que l'année grégorienne (140 px).

### 3.2 Graisses

- **Français et tamoul : 400 à 600 maximum.** 500 pour les jours de la semaine abrégés du tableau, 600 pour les numéros du jour, les titres et les horaires.
- **Arabe (Amiri) : 400 à 500.**
- **Exception : l'année de la couverture est en 700**, c'est un élément d'affichage et non du texte courant.

### 3.3 Conventions

- Jours de la semaine abrégés en 3 lettres majuscules, espacement `0,06em`.
- Noms de mois en majuscules, année de même taille mais en graisse 400.
- Aucun texte coranique en arabe : le verset de la couverture n'est imprimé qu'en traduction (le calendrier peut être jeté).
- Les chiffres des horaires sont tabulaires (`font-variant-numeric: tabular-nums`).

## 4. Espacements, rayons, mise en page

- **Grille de 4 px** : `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-6` 24.
- **Rayon** : `--radius-card` 0,5 rem pour tous les blocs (calendrier, tableau, cartes de la couverture).
- **Page A4 paysage**, dimensions fixes en mm : `--page-pad` 5 mm (marge au-delà de la zone non imprimable du copieur), `--binding-zone` 10 mm (reliure à spirale sur le bord haut), `--block-gap` 2,5 mm (espace entre header, calendrier et tableau), `--header-h` 24 mm, `--band-h` 64 px (hauteur commune du bandeau du mois et de l'en-tête du tableau).
- **Une seule grille de 35 cases** pour le calendrier (5 semaines) : un mois sur 6 semaines voit ses derniers jours revenir dans les cases vides du haut.

## 5. Icônes

Pictogrammes SVG monochromes (`assets/icons`, symbole `#icon`), colorés par `currentColor`. À l'impression, ils sont posés dans une **pastille ronde bleu très pâle** (`--bg-blue-head`) quand ils précèdent une coordonnée ou un titre de section.

| Icône                        | Sens                                          | Couleur       |
| ---------------------------- | --------------------------------------------- | ------------- |
| `icon-mosque`                | Adresse de la mosquée                         | `--col-blue`  |
| `icon-prayer-room`           | Adresse de la salle de prière                 | `--col-blue`  |
| `icon-landline`              | Téléphone fixe                                | `--col-blue`  |
| `icon-whatsapp`              | WhatsApp                                      | `--col-blue`  |
| `icon-email`, `icon-website` | E-mail, site web                              | `--col-blue`  |
| `icon-bank`                  | Coordonnées bancaires (IBAN, BIC) du header   | `--col-blue`  |
| `icon-donate`                | Titre « Soutenez votre mosquée » (couverture) | `--col-blue`  |
| `icon-moon`                  | Début du mois hégirien ; dates hégiriennes    | `--col-green` |
| `icon-dst-forward`, `-back`  | Passage à l'heure d'été / d'hiver             | `--col-dst`   |

Logos tiers en version monochrome bleue (Mawaqit, La Banque Postale, Grande Mosquée de Paris), pour rester dans la palette. Les noms `icon-${…}.svg` sont construits dynamiquement : ne pas supprimer une icône « non utilisée » sans chercher aussi les noms composés.

## 6. Composants

### 6.1 Bandeau du mois et ligne des jours

Fond `--bg-head-blue` (plein), texte blanc, hauteur `--band-h`. Mois grégorien (gauche, 600, année en 400), mois hégirien en arabe (droite, 500) ; traductions en `--col-on-dark-soft`. La ligne des jours affiche français, arabe, tamoul sur le fond `--bg-grid`, alignés sur les colonnes de la grille ; les 7 jours dans les mêmes couleurs.

### 6.2 Cases du calendrier

| État                          | Rendu                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Jour ordinaire                | Numéro en `--col-text-light` 600, 42 px ; jour hégirien vert en haut à droite, 12 px |
| Vendredi / dimanche           | Numéro en `--col-friday` / `--col-sunday` (gris teintés)                             |
| Jour férié                    | Numéro et libellé terracotta                                                         |
| Aïd                           | Numéro vert ; libellé vert ; prioritaire sur le férié (libellé de l'Aïd en haut)     |
| Jour islamique particulier    | Date hégirienne en gras et libellé vert (début du Ramadan, ʿArafa, ʿĀshūrāʾ)         |
| Premier jour du mois hégirien | Croissant vert en haut à gauche (décalé si l'horloge est aussi présente)             |
| Changement d'heure            | Horloge et libellé ambre doré (`--col-dst`)                                          |
| Vacances scolaires            | Fond `--bg-holiday` ; légende avec pastille bordée de `--col-gold`                   |
| Hors du mois                  | Case transparente (fond de la grille), sans numéro                                   |

### 6.3 Tableau des horaires

En-tête `--bg-head-green` (plein), titres en blanc, traductions en `--col-on-dark-soft` 500. Corps : horaires en `--col-ink` 600, 15 px, traits verticaux très légers, filets horizontaux `--border-green` de 1 px ; filet de 1,5 px `--border-week` après chaque dimanche. Les filets sont des `border` (le tableau est en `border-collapse: separate`, le dernier filet n'est pas rogné).

| Élément            | Rendu                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Colonnes de date   | Bandes `--bg-green-head` : jour de la semaine en 14 px / 500, numéro grégorien en 600                                   |
| Jour hégirien      | Noir ; le « 01 » du début de mois en blanc dans une pastille `--bg-head-green` (15 px de haut, ne grandit pas la ligne) |
| Vendredi           | Ligne `--bg-friday-light` ; dans les colonnes de date, `--bg-green-friday`                                              |
| Fin de semaine     | Filet de 1,5 px `--border-week` (vert moyen) après le dimanche                                                          |
| Changement d'heure | Ligne entière (colonnes de date comprises) en `--bg-dst`, texte normal                                                  |

### 6.4 Header

Fond blanc, comme un papier à en-tête, sous un **filet tricolore** de 3 px aux couleurs du logo : safran vif (`--header-line-start`), or des ornements (`--header-line-mid`, `--brand`), vert de la mosquée (`--header-line-end`). Le logo est à gauche ; à droite, les noms sur une seule ligne (tamoul safran, filet vertical fin, français vert), puis, sous un filet de 0,5 px `--border-blue`, les coordonnées sur 2 lignes (adresses ; contact et banque côte à côte). Un girih gris (`--col-text-soft`, 14 %) calé sur le logo (une étoile au centre du disque) est estompé radialement autour de lui. Tous les textes sont sur blanc : contrastes pleins, encre minimale. Détail dans TECHNIQUE §3.4.

### 6.5 Couverture

Colonne d'identité (dégradé bleu → vert pâle, girih à 50 % au bord du logo, fondu radial jusqu'à environ 10 % à 200 px) avec le logo posé directement, puis une **carte blanche unique** d'informations pratiques séparées par des filets fins : Mawaqit (deux QR codes, adresses), sources, contacts, dons, mention légale (8 px). À droite : année grégorienne, années hégiriennes, 12 mini-mois, verset dans un encart `--bg-friday-light`. Détail dans TECHNIQUE §3.6.

## 7. Vérifier un changement

```bash
npm run prettier && npm run lint
npm run check            # 13 pages par année, couverture sur 1 page sans débordement (2025-2030), Ramadan sur 1 page
```

Puis une page test imprimée (`index.html?month=cover`, un mois avec Aïd, un mois avec changement d'heure) : couleurs pastel, textes de 8 à 10 px, QR codes à scanner.

## 8. Faire évoluer le design system

- **Nouvelle couleur** : d'abord vérifier qu'une couleur existante n'a pas déjà ce sens (§2.2). Sinon, ajouter un jeton dans `variables.css` avec son ratio de contraste en commentaire, puis l'inscrire dans ce document.
- **Nouvelle icône** : un seul sens, à noter dans le tableau du §5.
- **Changement d'un jeton** : mettre à jour ce document **et** TECHNIQUE (§3.6 pour la couverture) dans le même commit.
- **Dégradés et motifs** : toujours en SVG inline, jamais en dégradé CSS (pixellisé à l'export PDF).

## 9. Écarts assumés

Choix faits pour des raisons visuelles, à connaître avant de modifier :

1. **Beige doré à deux sens** : vacances (fond de case) et changement d'heure (texte et ligne du tableau). Même famille de teinte, usages différents.
2. **Colonne du jour grégorien en vert** dans le tableau, par cohérence visuelle avec l'en-tête ; le vert signifie sinon « hégirien ». Le texte reste noir.
3. **Année de la couverture en 700** et en dégradé, alors que le texte courant va jusqu'à 600 et reste en aplat.
4. **Feuille du Ramadan** : terracotta pour le jeûne (Imsak, iftār) et fond crème ; hors de ce design system.

# AMI Calendar

Calendriers imprimables de l'**Association Musulmane de l'Inde** (AMI, La Courneuve), en français, arabe et tamoul.

| Document               | Page           | Format              | Contenu                                                                              |
| ---------------------- | -------------- | ------------------- | ------------------------------------------------------------------------------------ |
| **Calendrier annuel**  | `index.html`   | 12 pages A4 paysage | Mois civil et hégirien, jours fériés, vacances (zone C), horaires des 5 prières      |
| **Feuille du Ramadan** | `ramadan.html` | 1 page A4 portrait  | Horaires du mois de Ramadan (Imsak, prières, Icha AMI), nuit du doute, 27e nuit, Aïd |

Site statique en JavaScript natif, sans framework ni étape de compilation. Documentation technique détaillée : [docs/TECHNIQUE.md](docs/TECHNIQUE.md).

## Démarrage

Les pages chargent des fichiers locaux (CSV, JSON) : il faut un petit serveur web, pas une ouverture directe du fichier.

```bash
npm install          # outils de développement (ESLint, Prettier, serve)
npm start            # sert le dossier sur http://localhost:3000
```

Sans Node : `python3 -m http.server 3000` depuis la racine du projet.

### Paramètres d'URL

| Page           | Paramètre          | Effet                                                                 |
| -------------- | ------------------ | --------------------------------------------------------------------- |
| `index.html`   | `?year=2027`       | Année affichée (par défaut : l'année prochaine)                       |
|                | `?month=10`        | Un seul mois au lieu des 12                                           |
|                | `?mosque=ami93120` | Identité, coordonnées et position lues depuis `clients/ami93120.json` |
| `ramadan.html` | `?year=2028`       | Ramadan de l'année donnée (par défaut : le prochain Ramadan)          |

## Générer les PDF

1. Ouvrir la page dans **Chrome**, **connecté à internet** (les jours fériés et les vacances viennent des API officielles).
2. Vérifier qu'un jour férié (ex. 1er mai) et une période de vacances apparaissent.
3. Imprimer en PDF : format **A4** (paysage pour le calendrier, portrait pour le Ramadan), marges **Aucune**, échelle **100 %**, **Graphiques d'arrière-plan** cochés.
4. Contrôler le nombre de pages : 12 pour le calendrier, 1 pour la feuille du Ramadan.

## Impression (copieur laser de l'association)

- Recto seul, reliure à spirale sur le bord haut : une zone de 10 mm est réservée en haut de chaque page (`--binding-zone`).
- Marge de 5 mm sur les bords (`--page-pad`), au-delà de la zone non imprimable du copieur.
- Dans le pilote : qualité **Graphique** ou **Photo**, **économie de toner désactivée** (sinon les aplats foncés deviennent tramés).
- Papier conseillé pour le calendrier mural : **120 g/m²**, blanc, non couché, « laser couleur ».
- Faire une page test (couleurs, frises du header, petits libellés de 9 px, fond pâle des vacances) avant de lancer le tirage complet.

## Préparer une nouvelle année

1. **Dates hégiriennes** : faire valider par les imams le début du Ramadan, les deux Aïds, ʿArafa et ʿĀshūrāʾ. En cas d'écart d'un jour avec le calcul, ajouter une période dans `HIJRI_OFFSETS` (`js/services.js`).
2. **Horaires de prière** : remplacer `data/prayer_times.csv` si la mosquée publie de nouveaux horaires (format dans la documentation technique).
3. **Feuille du Ramadan** : vérifier l'Imsak (`IMSAK_MINUTES_BEFORE_FAJR`) et l'Icha AMI (`AMI_ISHA`) en tête de `js/ramadan.js` ; corrections manuelles possibles dans `data/ramadan_overrides.json`.
4. **Vérifier** les PDF : `index.html?year=…`, et `ramadan.html?year=…`.

## Ce que montre le calendrier annuel

- **Header** : logo, noms tamoul (safran) et français (vert), coordonnées ; encadré par deux fines torsades aux couleurs du logo.
- **Bandeau du mois** (bleu marine) : mois grégorien à gauche, mois hégirien(s) à droite, avec traductions.
- **Cases des jours** :
    - numéro hégirien en petit, en haut à droite ; **en gras** les jours islamiques particuliers ;
    - croissant vert : premier jour du mois hégirien ;
    - numéro **vert** : Aïd ; **rouge** : jour férié (libellé écrit dans la case) ;
    - libellés verts : début du Ramadan, jour de ʿArafa, jours de Tashrīq, ʿĀshūrāʾ ;
    - fond doré pâle : vacances scolaires (zone C) ; fond gris : jours hors du mois ;
    - horloge bleue : passage à l'heure d'été ou d'hiver.
- **Légende** (bas de page) : nom des vacances scolaires du mois et passage à l'heure d'été / d'hiver.
- **Tableau des horaires** (en-tête vert foncé) : Fajr, Shuruq, Dhohr, Asr, Maghrib, Icha et jour hégirien ; vendredis surlignés, filet à chaque fin de semaine, « 01 » en vert au 1er jour du mois hégirien, ligne en bleu le jour du changement d'heure.

## Développement

```bash
npm run lint         # ESLint
npm run prettier     # mise en forme de tout le projet
```

Code, design tokens, données et points d'extension : voir [docs/TECHNIQUE.md](docs/TECHNIQUE.md).

## Auteur

Chabir, pour l'Association Musulmane de l'Inde.

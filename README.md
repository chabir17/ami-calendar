# AMI Calendar

Ce projet est une solution de calendrier web personnalisée pour l'association AMI. Il met en avant une identité visuelle multiculturelle (Français, Arabe, Tamoul) et une gestion thématique des couleurs.

## Fonctionnalités

### 🎨 Identité Visuelle et Thèmes

Le design est piloté par des variables CSS (`css/variables.css`) permettant une personnalisation aisée :

- **Palette Symbolique** :
    - Bleu "Tour Eiffel" (`--col-blue`)
    - Vert "Mosquée" (`--col-green`)
- **Thème Annuel** : Une couleur variable (`--brand`) permet d'adapter l'ambiance générale chaque année. Les variantes (sombre/claire) sont générées automatiquement.
- **Contraste** : les textes utilisent des variantes foncées des couleurs (`--brand-deep`, `--brand-text`, `--col-green-dark`) qui respectent le niveau WCAG AA.
- **Indicateurs de Jours** :
    - Numéro du jour en rouge pour les jours fériés, en vert pour l'Aïd (libellé écrit dans la case).
    - Vacances scolaires (Zone C) : fond doré clair (`--bg-holiday`) ; l'Aïd et les jours fériés restent prioritaires.
    - Bande du bas : nom des vacances du mois et hadith du mois hégirien (al-Bukhārī, Muslim), modifiable dans `data/citations.js`.
    - Icônes SVG (`assets/icons/`) : croissant vert pour la nouvelle lune, horloge bleue avec flèche avant/arrière pour le passage à l'heure d'été/hiver.

### 🌐 Typographie Multilingue

Le projet utilise des polices hébergées localement (dans `assets/fonts/`) pour éviter les dépendances externes :

- **Français** : `Noto Sans`
- **Arabe** : `Amiri` (naskh classique, `Noto Naskh Arabic` en secours)
- **Tamoul** : `Noto Serif Tamil`

### 📐 Mise en Page (Header)

L'en-tête (`css/header.css`) est conçu pour être informatif et esthétique :

- Bandeau sur motif girih à rosaces à 8 branches (`assets/patterns/background-pattern.svg`), recoloré selon `--brand`.
- Logo, puis noms de l'association en français et en tamoul (deux tons de la même famille dorée).
- Coordonnées alignées à droite.
- Sous le bandeau, une ligne compacte : mois et année grégoriens (FR / tamoul) à gauche, mois hégiriens (translittération / arabe) à droite.

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
- **Jours Fériés & Vacances** : Récupérés automatiquement depuis les APIs gouvernementales (api.gouv.fr / education.gouv.fr) avec un système de **cache local** (30 jours) pour limiter les requêtes.

## Impression

Le calendrier est conçu pour une impression couleur **A4 paysage**, recto seul, reliée sur le bord haut (spirale métallique), sur une imprimante de bureau.

- **Marges** (`css/variables.css`) : `--page-pad` (5 mm, au-delà de la zone non imprimable du copieur) et `--binding-zone` (10 mm en haut, pour les perforations de la reliure).
- **Réglages d'impression** : format A4 paysage, marges « Aucune », échelle 100 % (« Taille réelle »), graphiques d'arrière-plan activés.
- Le tableau des horaires répartit ses lignes sur la hauteur disponible : les mois de 28 à 31 jours tiennent toujours sur la page.

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

# AMI Calendar

Ce projet est une solution de calendrier web personnalisée pour l'association AMI. Il met en avant une identité visuelle multiculturelle (Français, Arabe, Tamoul) et une gestion thématique des couleurs.

## Fonctionnalités

### 🎨 Identité Visuelle et Thèmes

Le design est piloté par des variables CSS (`css/variables.css`) permettant une personnalisation aisée :

- **Palette Symbolique** :
    - Bleu "Tour Eiffel" (`--col-blue`)
    - Vert "Mosquée" (`--col-green`)
    - Orange (`--col-orange`) pour les éléments Tamouls.
- **Thème Annuel** : Une couleur variable (`--col-year-theme`) permet d'adapter l'ambiance générale chaque année.
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

## Structure du Projet

- **css/**
    - `fonts.css` : Déclaration des polices locales (`@font-face`).
    - `header.css` : Styles spécifiques pour la barre d'en-tête, le logo et la disposition des textes.
    - `variables.css` : Définition des couleurs racines, des polices et des arrière-plans.
- **assets/** : Contient les images et motifs (ex: `patterns/background-pattern.svg`).
    - **fonts/** : Fichiers de police (`.ttf`).

## Personnalisation

Pour modifier l'apparence du calendrier, éditez le fichier `css/variables.css`.

**Exemple : Changer la couleur du thème de l'année**

```css
:root {
    --col-year-theme: #c8b070; /* Remplacez par votre code couleur */
}
```

## Auteur

Développé dans l'espace de travail de Chabir.

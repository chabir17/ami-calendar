# AMI Calendar

Calendrier imprimable trilingue (FR / AR / TA) de l'association AMI (La Courneuve). L'utilisateur écrit en français : répondre et rédiger les messages de commit en français.

- `index.html` : calendrier annuel, 13 pages A4 paysage (couverture + 12 mois). `?month=cover` = couverture seule.
- `ramadan.html` : feuille du Ramadan, 1 page A4 portrait. **Design distinct et encore en conception : ne pas l'aligner sur le calendrier annuel.**
- JavaScript natif (modules ES), CSS avec jetons dans `css/variables.css`, aucune compilation. Pages à dimensions fixes en mm.
- Documentation détaillée : `docs/TECHNIQUE.md` (§3.6 couverture, §6 design system, §8 pièges). La lire par section, ne pas la recopier ici. La mettre à jour quand on change un jeton, une structure ou un piège.

## Commandes

- `npm start` : serveur local (port 3000).
- `npm run check [-- 2027]` : **à lancer après toute modification visuelle.** Contrôle 13 pages par année, couverture sur 1 page sans débordement (années 2025–2030 par défaut), Ramadan sur 1 page. Nécessite Chrome, `pdfinfo` et internet. Ne pas réécrire de scripts de mesure : étendre `scripts/check.mjs` si besoin.
- `npm run prettier` puis `npm run lint` avant de commiter.

## Règles de contenu (décidées par l'utilisateur)

- Aucun texte coranique en arabe sur la page (le calendrier peut être jeté) ; traductions et ponctuation acceptées.
- Une icône = un seul sens, ne jamais la réutiliser pour autre chose.
- Style épuré : peu de bordures, couleurs douces, lisibilité avant tout ; filets fins continus.
- Dates hégiriennes : référence Umm al-Qura, **sans nommer « Umm al-Qura » sur la page** (« Dates hégiriennes indicatives »). Corrections d'un jour : `HIJRI_OFFSETS` (`js/services.js`). Dates validées chaque année par les imams.
- Le tamoul est à faire valider par un membre tamoulophone ; ne pas inventer de nouvelles traductions sans le signaler.

## Pièges du rendu PDF (détail en §8 de la doc)

- Dégradés et motifs : en SVG inline, jamais en dégradé CSS (pixellisé à l'export).
- Filets de 0,5 px : pseudo-élément ou `box-shadow` avec `--hairline` (une `border` de 0,5 px devient 1 px).
- `serve` redirige `/index.html` vers `/` et perd la requête : utiliser `/?year=2027&month=cover`.
- Chrome : profil `--user-data-dir` neuf à chaque rendu, et arrêter l'instance CDP avant `--print-to-pdf` (sinon PDF blanc).
- Chiffres arabes : empiler les deux années hégiriennes (le tiret entre deux nombres arabes inverse l'ordre).

## Flux de travail

- Pour la couverture et les en-têtes, l'utilisateur itère visuellement : montrer un aperçu (PNG recadré sur la zone concernée via `pdftoppm`) avant de commiter, sauf demande contraire.
- Une fois validé : commit et push directement sur `main`, message `type: description` en français.
- Vérifier le même contenu avec et sans `?mosque=ami93120` quand on touche au header (contenu statique et `contactsHTML` doivent rester alignés).
- Fichiers temporaires dans le scratchpad de la session, jamais dans le dépôt.

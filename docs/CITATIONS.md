# Citations du mois (archive, retirées de la page le 08/11/2026)

Un hadith par page de mois, dans un encart sous la grille du calendrier (alors sous la légende, retirée depuis), avec la colonne de la prière concernée soulignée dans le tableau. **Retiré de la page pour l'instant**, à remettre si nécessaire : le code complet est dans le commit `5748405` (`js/quotes.js`, `updateQuote` dans `js/main.js`, `.month-quote` dans `css/calendar.css`, `th[data-prayer]` et `.is-focus`), restaurable avec `git show 5748405 -- js css index.html scripts`.

## Règles de contenu (décidées par l'utilisateur)

- Sources : **Coran, al-Bukhārī et Muslim uniquement** (hadiths authentiques, numérotation usuelle de Muslim) ; aucun Tirmidhi, Abu Dawud ni Nasa'i. Hadiths préférés aux versets.
- Chaque citation doit servir de **rappel à appliquer** (obligation, pilier, Sunna) : simple, courte (≈ 100 caractères au plus), compréhensible sans explication.
- **Pas d'arabe** (hadith ni verset) : le calendrier peut être jeté. Français, puis tamoul.
- Les traductions françaises sont à valider par les imams ; **le tamoul, rédigé par Claude, est à faire valider par un tamoulophone**.
- Références relues dans une base ouverte des deux Sahih (`hadith-api`, numérotation usuelle de Muslim) : sunnah.com refusait l'accès automatisé.

## Règle de choix par page (`pickQuote`)

1. Temps fort du mois hégirien sur la page, par priorité : 1er Ramaḍān, Aïd al-Fiṭr, 9 ou 10 Dhū al-Ḥijjah, 10 Muḥarram.
2. Sinon le mois hégirien dédié au 15 du mois grégorien : Dhū al-Qaʿdah (pèlerinage), Shaʿbān (jeûne).
3. Sinon le rappel du mois grégorien (douze rappels de prière et de Sunna).

En 2027 : janvier Shaʿbān, février Ramaḍān, mars Shawwāl, avril pèlerinage, mai dix jours, juin ʿĀshūrāʾ, puis juillet à décembre les rappels du mois.

## Citations

| Déclencheur                                     | Français                                                                                                | Tamoul                                                                                                           | Source                    | Colonne soulignée |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------- |
| 1er Ramaḍān                                     | Qui jeûne le Ramaḍān avec foi, en espérant la récompense d’Allah, ses péchés passés lui sont pardonnés. | ஈமானுடனும் நன்மையை எதிர்பார்த்தும் ரமளானில் நோன்பு நோற்பவரின் முந்தைய பாவங்கள் மன்னிக்கப்படும்.                  | Bukhārī 38, Muslim 760    |                   |
| Aïd al-Fiṭr (1er Shawwāl)                       | Jeûner le Ramaḍān puis six jours de Shawwāl, c’est comme jeûner toute l’année.                          | ரமளானையும் ஷவ்வாலின் ஆறு நோன்புகளையும் நோற்பவர், ஆண்டு முழுவதும் நோன்பு நோற்றவர் போன்றவர்.                       | Muslim 1164               |                   |
| 9 ou 10 Dhū al-Ḥijjah                           | Aucune œuvre ne vaut mieux que celles des dix premiers jours de Dhū l-Ḥijjah.                           | துல் ஹஜ்ஜின் முதல் பத்து நாட்களில் செய்யும் நற்செயலை விடச் சிறந்த செயல் வேறில்லை.                                | Bukhārī 969               |                   |
| 10 Muḥarram (ʿĀshūrāʾ)                          | Le jeûne d’ʿĀshūrāʾ efface, j’espère, les péchés de l’année précédente.                                 | ஆஷூரா நோன்பு, கடந்த ஆண்டின் பாவங்களுக்குப் பரிகாரமாகும் என்று அல்லாஹ்விடம் எதிர்பார்க்கிறேன்.                    | Muslim 1162               |                   |
| Mois de Dhū al-Qaʿdah (au 15 du mois grégorien) | Qui fait le pèlerinage sans obscénité ni péché revient comme au jour de sa naissance.                   | ஆபாசமாகவும் பாவமாகவும் நடக்காமல் ஹஜ் செய்பவர், பிறந்த நாளைப் போல (பாவமின்றி) திரும்புவார்.                       | Bukhārī 1521, Muslim 1350 |                   |
| Mois de Shaʿbān (au 15 du mois grégorien)       | Le Prophète jeûnait plus en Shaʿbān que dans tout autre mois, hors Ramaḍān.                             | ரமளானைத் தவிர, ஷஃபானில் நோன்பு நோற்றது போல் வேறு மாதத்தில் நபி (ஸல்) அதிகம் நோன்பு நோற்றதில்லை.                  | Bukhārī 1969, Muslim 1156 |                   |
| Rappel de janvier                               | Qui prie le Fajr et l’Asr entrera au Paradis.                                                           | ஃபஜ்ர், அஸர் ஆகிய இரு தொழுகைகளையும் தொழுபவர் சுவனம் புகுவார்.                                                    | Bukhārī 574, Muslim 635   | fajr, asr         |
| Rappel de février                               | La meilleure prière après la prière obligatoire est la prière de nuit.                                  | கடமையான தொழுகைக்குப் பின் சிறந்த தொழுகை இரவுத் தொழுகையாகும்.                                                     | Muslim 1163               |                   |
| Rappel de mars                                  | Les cinq prières lavent les péchés comme un fleuve où l’on se baigne cinq fois par jour.                | ஐந்து வேளைத் தொழுகைகள், தினமும் ஐந்து முறை நதியில் குளிப்பது போல் பாவங்களைக் கழுவுகின்றன.                        | Bukhārī 528, Muslim 667   |                   |
| Rappel de avril                                 | Sans la crainte de vous accabler, je vous aurais ordonné le siwāk à chaque prière.                      | சிரமமில்லை என்றிருந்தால், ஒவ்வொரு தொழுகைக்கும் மிஸ்வாக் செய்யக் கட்டளையிட்டிருப்பேன்.                            | Bukhārī 887, Muslim 252   |                   |
| Rappel de mai                                   | Après chaque prière, dire 33 fois Subḥān Allāh, 33 fois Al-ḥamdu li-llāh et 33 fois Allāhu akbar.       | ஒவ்வொரு தொழுகைக்குப் பின்னும் 33 முறை ஸுப்ஹானல்லாஹ், 33 முறை அல்ஹம்துலில்லாஹ், 33 முறை அல்லாஹு அக்பர் கூறுங்கள். | Muslim 597                |                   |
| Rappel de juin                                  | L’aumône ne diminue jamais les biens.                                                                   | தர்மம் செல்வத்தைக் குறைப்பதில்லை.                                                                                | Muslim 2588               |                   |
| Rappel de juillet                               | Les cinq prières, et d’un vendredi à l’autre, effacent les péchés commis entre elles.                   | ஐவேளைத் தொழுகைகளும் ஜும்ஆவும், அடுத்த ஜும்ஆ வரையிலான பாவங்களுக்குப் பரிகாரமாகும்.                                | Muslim 233                | dhuhr             |
| Rappel de août                                  | Jeûner trois jours par mois, prier deux rakʿa de Ḍuḥā, et le witr avant de dormir.                      | ஒவ்வொரு மாதமும் மூன்று நாட்கள் நோன்பு, இரண்டு ரக்அத் ளுஹா, உறங்குவதற்கு முன் வித்ர் தொழுதல்.                     | Bukhārī 1981, Muslim 721  |                   |
| Rappel de septembre                             | La prière accomplie à son heure est l’œuvre la plus aimée d’Allah.                                      | அல்லாஹ்வுக்கு மிகவும் விருப்பமான செயல், தொழுகையை அதற்குரிய நேரத்தில் நிறைவேற்றுவதாகும்.                          | Bukhārī 527, Muslim 85    |                   |
| Rappel de octobre                               | Qui prie Icha en groupe est comme s’il avait prié la moitié de la nuit.                                 | இஷாவை ஜமாஅத்துடன் தொழுபவர், இரவில் பாதி நேரம் நின்று வணங்கியவர் போன்றவர்.                                        | Muslim 656                | icha              |
| Rappel de novembre                              | Les deux rakʿa de l’aube valent mieux que ce bas monde et tout ce qu’il contient.                       | ஃபஜ்ரின் இரண்டு ரக்அத்கள் இவ்வுலகத்தையும் அதிலுள்ளவற்றையும் விடச் சிறந்தவை.                                      | Muslim 725                | fajr              |
| Rappel de décembre                              | Celui qui manque la prière de l’Asr, c’est comme s’il avait perdu sa famille et ses biens.              | அஸர் தொழுகையைத் தவறவிடுபவர், தன் குடும்பத்தையும் செல்வத்தையும் இழந்தவர் போன்றவர்.                                | Bukhārī 552, Muslim 626   | asr               |

## Essayé puis écarté

Citation dans la bande de la légende (se disputait la place avec les vacances et le changement d'heure) ; encart sorti du bloc, en bandeau sous les deux colonnes (le tableau perdait 8 % de hauteur de ligne) ; fond coloré (vert ou doré) pour l'encart (le blanc est plus sobre, éco-encre et sans nouveau sens de couleur) ; trois langues avec le hadith en arabe copié des recueils (retiré : irrespectueux si jeté) ; un hadith propre à chaque mois hégirien (n'existe pas pour Rabīʿ, Jumādā et Rajab) ; textes de Tirmidhi, Nasa'i et Abu Dawud.

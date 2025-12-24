// ==========================================
// 3. ORCHESTRATION & UI (Main)
// ==========================================

/**
 * Charge la configuration spécifique d'un client (Mosquée) depuis un fichier JSON.
 * Met à jour le logo, les textes, les contacts et le thème de couleur.
 */
async function loadClientConfig() {
    const params = new URLSearchParams(window.location.search);
    const mosqueId = params.get('mosque');

    // Si aucun paramètre, on reste sur la config par défaut (La Courneuve)
    if (!mosqueId) return;

    try {
        // 1. Charger le fichier JSON du client
        const response = await fetch(`clients/${mosqueId}.json`);
        if (!response.ok) throw new Error('Client introuvable');
        const data = await response.json();

        // 2. Mettre à jour l'Identité (Haut de page)
        document.querySelector('.org-fr').textContent = data.identity.name_fr;
        document.querySelector('.org-ta').textContent = data.identity.name_ta;
        document.querySelector('.logo-img').src = data.identity.logo_url;

        // 3. Mettre à jour les Contacts
        const iconLoc = `<svg class="icon"><use href="assets/icons/icon-location.svg#icon"></use></svg>`;
        const iconPhone = `<svg class="icon"><use href="assets/icons/icon-phone.svg#icon"></use></svg>`;
        const iconEmail = `<svg class="icon"><use href="assets/icons/icon-email.svg#icon"></use></svg>`;

        const headerRight = document.querySelector('.header-right');
        headerRight.innerHTML = `
            <div>${iconLoc} ${data.contact.addr1}</div>
            ${data.contact.addr2 ? `<div>${iconLoc} ${data.contact.addr2}</div>` : ''}
            <div class="contact-row">
                <div class="contact-col">${iconPhone} ${data.contact.phone}</div>
                <div class="contact-col">${iconEmail} ${data.contact.email}</div>
            </div>
        `;

        // 4. Mettre à jour les Couleurs (CSS Variables)
        const root = document.documentElement;
        if (data.theme.color_brand) {
            root.style.setProperty('--brand', data.theme.color_brand);

            // Coloration dynamique du motif de fond (remplace la couleur dorée par défaut #d4af37)
            try {
                const res = await fetch('assets/patterns/background-pattern.svg');
                let svgText = await res.text();
                svgText = svgText.replace(/#d4af37/gi, data.theme.color_brand);
                const dataUri = 'data:image/svg+xml;base64,' + btoa(svgText);
                root.style.setProperty('--bg-pattern-custom', `url('${dataUri}')`);
            } catch (e) {
                console.warn('Erreur chargement pattern:', e);
            }
        }
        if (data.theme.bg_header) root.style.setProperty('--brand-light', data.theme.bg_header);

        // 5. Mettre à jour la config globale pour Adhan (Prière)
        if (window.CONFIG) {
            window.CONFIG.lat = data.location.lat;
            window.CONFIG.lng = data.location.lng;
            // + autres paramètres Adhan si nécessaire
        }
    } catch (e) {
        console.error('Erreur de chargement client:', e);
        alert('Impossible de charger la configuration pour : ' + mosqueId);
    }
}

/**
 * Point d'entrée principal au chargement du DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadClientConfig();

    // Récupération des paramètres d'URL pour déterminer l'année et le mois à afficher
    const urlParams = new URLSearchParams(window.location.search);
    let year = parseInt(urlParams.get('year')) || new Date().getFullYear();

    let monthParam = urlParams.get('month');
    // Gestion de la redirection pour les serveurs statiques (ex: GitHub Pages) via le paramètre 'redirect'
    const redirectPath = urlParams.get('redirect');
    if (redirectPath) {
        const match = redirectPath.match(/\/(\d{4})\/(\d{1,2})\/?$/);
        if (match) {
            year = parseInt(match[1]);
            monthParam = match[2];
            window.history.replaceState(null, null, redirectPath);
        }
    }

    const isAllMonths = !monthParam;
    let month = parseInt(monthParam);
    if (!isAllMonths && (!month || month < 1 || month > 12)) month = 1;

    // Sauvegarde du template HTML original pour la duplication
    const pageTemplate = document.querySelector('.page').cloneNode(true);

    // Fonction de rendu d'une page unique (Mois spécifique)
    const renderPage = (targetYear, targetMonth, container) => {
        updateLegends(targetYear, targetMonth, container);
        updateZoneTitles(targetYear, targetMonth, container);

        const calendar = container.querySelector('ami-calendar-grid');
        const prayerTable = container.querySelector('ami-prayer-table');

        if (calendar) {
            calendar.setAttribute('year', targetYear);
            calendar.setAttribute('month', targetMonth);
            if (calendar.render) calendar.render();
        }
        if (prayerTable) {
            prayerTable.setAttribute('year', targetYear);
            prayerTable.setAttribute('month', targetMonth);
        }
    };

    // Orchestrateur du rendu (Mode Année complète ou Mois unique)
    const renderApp = () => {
        initAdhan();

        if (isAllMonths) {
            // Mode "Année complète" : On génère 12 pages
            document.body.innerHTML = '';
            for (let m = 1; m <= 12; m++) {
                const pageClone = pageTemplate.cloneNode(true);
                document.body.appendChild(pageClone);
                renderPage(year, m, pageClone);
            }
        } else {
            // Restauration si nécessaire (cas de re-rendu après fetch)
            if (!document.querySelector('.page')) {
                document.body.innerHTML = '';
                document.body.appendChild(pageTemplate.cloneNode(true));
            }
            renderPage(year, month, document);
        }
    };

    // 1. Rendu immédiat (avec config locale config.js)
    renderApp();

    // 2. Mise à jour asynchrone via API (si connecté)
    fetchExternalData().then((shouldUpdate) => {
        if (shouldUpdate) renderApp();
    });
});

/**
 * Met à jour l'affichage des légendes (Changement d'heure, Aïd) selon le mois.
 * @param {number} year
 * @param {number} month
 * @param {HTMLElement|Document} container
 */
function updateLegends(year, month, container = document) {
    // 1. Changement d'heure (Mars/Octobre)
    const legendDst = container.querySelector('.legend-dst');
    if (legendDst && (month === 3 || month === 10)) {
        legendDst.style.display = 'flex';
        const legendIcon = legendDst.querySelector('.icon');
        const legendText = legendDst.querySelector('span:last-child');

        const isSummer = month === 3;
        if (legendText) legendText.textContent = isSummer ? "Heure d'été (+1h)" : "Heure d'hiver (-1h)";

        // Note: Les icônes sont gérées via CSS/SVG, ici on pourrait changer la classe si nécessaire
        // mais le code actuel semble utiliser des images statiques dans le HTML pour la légende.
        if (legendIcon) {
            legendIcon.classList.toggle('icon-clock-plus', isSummer);
            legendIcon.classList.toggle('icon-clock-minus', !isSummer);
        }
    }

    // 2. Légende Aïd (si présent dans le mois)
    let hasEid = false;
    let eidName = '';
    let hasPublicHoliday = false;
    let newMoonMonthName = null;
    const holidayNames = new Set();
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const hijriDate = getHijriDateSafe(new Date(year, jsMonth, d));
        const info = getDayInfo(new Date(year, jsMonth, d), hijriDate);
        if (info.isEid) {
            hasEid = true;
            eidName = info.label;
        }
        if (info.isPublicHoliday) hasPublicHoliday = true;
        if (info.isHoliday && info.holidayName) holidayNames.add(info.holidayName);
        if (info.isNewMoon) newMoonMonthName = hijriDate.monthNameFR;
    }

    // Mise à jour DOM Légendes
    const legendEid = container.querySelector('.legend-eid');
    if (legendEid) {
        legendEid.style.display = hasEid ? 'flex' : 'none';
        if (hasEid) legendEid.querySelector('span:last-child').textContent = eidName || 'Aïd';
    }

    const legendHoliday = container.querySelector('.legend-holiday');
    if (legendHoliday) {
        legendHoliday.style.display = holidayNames.size > 0 ? 'flex' : 'none';
        if (holidayNames.size > 0) legendHoliday.querySelector('span:last-child').textContent = Array.from(holidayNames).join(' / ');
    }

    const legendPublic = container.querySelector('.legend-public');
    if (legendPublic) legendPublic.style.display = hasPublicHoliday ? 'flex' : 'none';

    const legendMoon = container.querySelector('.legend-moon');
    if (legendMoon) {
        legendMoon.style.display = newMoonMonthName ? 'flex' : 'none';
        if (newMoonMonthName) legendMoon.querySelector('span:last-child').textContent = newMoonMonthName;
    }
}

/**
 * Met à jour les titres (Mois Grégorien, Mois Hégirien, Année).
 * @param {number} year
 * @param {number} month
 * @param {HTMLElement|Document} container
 */
function updateZoneTitles(year, month, container = document) {
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (!TEXTS) return;

    container.querySelector('.greg-month-fr').textContent = TEXTS.fr.months[jsMonth];
    container.querySelector('.greg-month-ta').textContent = TEXTS.ta.months[jsMonth];
    container.querySelector('.year-display').textContent = year;

    const hijriStart = getHijriDateSafe(new Date(year, jsMonth, 1));
    const hijriEnd = getHijriDateSafe(new Date(year, jsMonth, daysInMonth));

    let hijriFrStr = '',
        hijriArStr = '';
    if (hijriStart.monthNameFR && hijriEnd.monthNameFR) {
        if (hijriStart.monthNameFR === hijriEnd.monthNameFR) {
            hijriFrStr = `${hijriStart.monthNameFR} ${hijriStart.year}`;
            hijriArStr = `${hijriStart.monthNameAR} ${hijriStart.yearAr}`;
        } else {
            hijriFrStr = `${hijriStart.monthNameFR} / ${hijriEnd.monthNameFR} ${hijriEnd.year}`;
            hijriArStr = `${hijriStart.monthNameAR} / ${hijriEnd.monthNameAR} ${hijriEnd.yearAr}`;
        }
    }
    container.querySelector('.hijri-month-fr').textContent = hijriFrStr;
    container.querySelector('.hijri-month-ar').textContent = hijriArStr;
}

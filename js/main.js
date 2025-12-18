// ==========================================
// 3. INITIALISATION & UI
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    let year = parseInt(urlParams.get('year')) || 2027;
    let month = parseInt(urlParams.get('month'));
    if (!month || month < 1 || month > 12) month = 1;

    // Fonction pour lancer le rendu de l'application
    const renderApp = () => {
        updateLegends(year, month);
        initAdhan();
        updateZoneTitles(year, month);

        const calendar = document.querySelector('ami-calendar-grid');
        const prayerTable = document.querySelector('ami-prayer-table');

        if (calendar) {
            calendar.setAttribute('year', year);
            calendar.setAttribute('month', month);
            // Force le re-rendu manuel si les attributs n'ont pas changé mais que la config a changé
            if (calendar.render) calendar.render();
        }
        if (prayerTable) {
            prayerTable.setAttribute('year', year);
            prayerTable.setAttribute('month', month);
        }
    };

    // 1. Rendu immédiat (avec config locale config.js)
    renderApp();

    // 2. Mise à jour asynchrone via API (si connecté)
    fetchExternalData().then(() => renderApp());
});

/**
 * Met à jour l'affichage des légendes (Changement d'heure, Aïd) selon le mois.
 * @param {number} year
 * @param {number} month
 */
function updateLegends(year, month) {
    // 1. Légende Changement d'heure (Mars/Octobre)
    const legendDst = document.getElementById('legend-dst');
    if (legendDst && (month === 3 || month === 10)) {
        legendDst.style.display = 'flex';
        const legendIcon = legendDst.querySelector('.icon');
        const legendText = legendDst.querySelector('span:last-child');
        if (month === 3) {
            // Mars : Été
            if (legendIcon) {
                legendIcon.classList.remove('icon-clock-minus');
                legendIcon.classList.add('icon-clock-plus');
            }
            if (legendText) legendText.textContent = "Heure d'été (+1h)";
        } else {
            // Octobre : Hiver
            if (legendIcon) {
                legendIcon.classList.remove('icon-clock-plus');
                legendIcon.classList.add('icon-clock-minus');
            }
            if (legendText) legendText.textContent = "Heure d'hiver (-1h)";
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
    const legendEid = document.getElementById('legend-eid');
    if (legendEid) {
        if (hasEid) {
            legendEid.style.display = 'flex';
            const textSpan = legendEid.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = eidName || 'Aïd';
        } else {
            legendEid.style.display = 'none';
        }
    }

    const legendHoliday = document.getElementById('legend-holiday');
    if (legendHoliday) {
        if (holidayNames.size > 0) {
            legendHoliday.style.display = 'flex';
            const textSpan = legendHoliday.querySelector('span:last-child');
            if (textSpan) {
                textSpan.textContent = Array.from(holidayNames).join(' / ');
            }
        } else {
            legendHoliday.style.display = 'none';
        }
    }

    const legendPublic = document.getElementById('legend-public');
    if (legendPublic) {
        legendPublic.style.display = hasPublicHoliday ? 'flex' : 'none';
    }

    const legendMoon = document.getElementById('legend-moon');
    if (legendMoon) {
        if (newMoonMonthName) {
            legendMoon.style.display = 'flex';
            const textSpan = legendMoon.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = newMoonMonthName;
        } else {
            legendMoon.style.display = 'none';
        }
    }
}

function updateZoneTitles(year, month) {
    const jsMonth = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (!TEXTS) return;

    document.getElementById('greg-month-fr').textContent = TEXTS.fr.months[jsMonth];
    document.getElementById('greg-month-ta').textContent = TEXTS.ta.months[jsMonth];
    document.getElementById('year-display').textContent = year;

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
    document.getElementById('hijri-month-fr').textContent = hijriFrStr;
    document.getElementById('hijri-month-ar').textContent = hijriArStr;
}

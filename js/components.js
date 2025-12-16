// ==========================================
// 2. COMPOSANTS WEB (Custom Elements)
// ==========================================

/**
 * Composant affichant la grille mensuelle du calendrier.
 */
class CalendarGrid extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.render();
    }
    static get observedAttributes() {
        return ['year', 'month'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        const year = parseInt(this.getAttribute('year'));
        const month = parseInt(this.getAttribute('month'));
        if (!year || !month) return;

        const jsMonth = month - 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        let startOffset = (new Date(year, jsMonth, 1).getDay() || 7) - 1;
        const gridCells = new Array(35).fill(null);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, jsMonth, day);
            const hijri = getHijriDateSafe(date);
            const dayInfo = getDayInfo(date, hijri);
            let pos = startOffset + day - 1;
            if (pos >= 35) pos -= 35;
            gridCells[pos] = { day, hijri, dayInfo };
        }

        let html = '';
        for (let i = 0; i < 35; i++) {
            const cell = gridCells[i];
            if (!cell) {
                html += `<div class="day-cell-visual empty"></div>`;
                continue;
            }
            const { day, hijri, dayInfo } = cell;
            let classes = ['day-cell-visual'];
            if (dayInfo.isEid) classes.push('is-friday');
            if (dayInfo.isHoliday && !dayInfo.isEid) classes.push('is-holiday');
            if (dayInfo.isPublicHoliday && !dayInfo.isEid) classes.push('is-public-holiday');

            let content = `<span class="vis-greg">${day}</span><span class="vis-hij">${hijri.day || ''}</span>`;
            if (dayInfo.isNewMoon) content += `<span class="new-moon-icon" title="Nouvelle lune"></span>`;
            if (dayInfo.isDST) {
                const style = dayInfo.isNewMoon ? 'left: 18px;' : '';
                const iconClass = dayInfo.dstType === 'winter' ? 'icon-clock-minus' : 'icon-clock-plus';
                content += `<span class="dst-icon ${iconClass}" style="${style}" title="${dayInfo.label}"></span>`;
            }
            if (dayInfo.label) {
                let labelClass = 'event-label';
                if (dayInfo.isEid) labelClass += ' eid-label';
                if (dayInfo.isDST) labelClass += ' dst-label';
                content += `<div class="${labelClass}">${dayInfo.label}</div>`;
            }
            html += `<div class="${classes.join(' ')}">${content}</div>`;
        }
        this.innerHTML = html;
        this.className = 'days-grid-visual';
    }
}
if (!customElements.get('ami-calendar-grid')) {
    customElements.define('ami-calendar-grid', CalendarGrid);
}

/**
 * Composant affichant le tableau des horaires de prières.
 */
class PrayerTable extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.render();
    }
    static get observedAttributes() {
        return ['year', 'month'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        const year = parseInt(this.getAttribute('year'));
        const month = parseInt(this.getAttribute('month'));
        const TEXTS = window.TEXTS;
        if (!year || !month || !TEXTS) return;

        const tbody = this.querySelector('tbody');
        if (!tbody) return;

        const jsMonth = month - 1;
        const daysInMonth = new Date(year, month, 0).getDate();

        let html = '';

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, jsMonth, day);
            const dayOfWeekIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
            const isFriday = date.getDay() === 5;
            let hijri = getHijriDateSafe(date);
            let times = getPrayerTimesSafe(date);
            const dateStr = `${TEXTS.fr.daysShort[dayOfWeekIdx]} ${day.toString().padStart(2, '0')}`;
            const rowClass = isFriday ? 'class="is-friday"' : '';

            html += `
                <tr ${rowClass}>
                    <td class="col-date-greg">${dateStr}</td>
                    <td>${times.fajr}</td>
                    <td>${times.sunrise}</td>
                    <td>${times.dhuhr}</td>
                    <td>${times.asr}</td>
                    <td>${times.maghrib}</td>
                    <td>${times.isha}</td>
                    <td class="col-hijri">${hijri.day}</td>
                </tr>`;
        }
        tbody.innerHTML = html;
    }
}
if (!customElements.get('ami-prayer-table')) {
    customElements.define('ami-prayer-table', PrayerTable);
}
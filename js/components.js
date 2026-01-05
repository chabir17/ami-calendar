import { getHijriDateSafe, getDayInfo, getPrayerTimesSafe } from './services.js';

// ==========================================
// 2. COMPOSANTS WEB (Custom Elements : Grille & Tableau)
// ==========================================

/**
 * Composant affichant la grille mensuelle du calendrier.
 */
class CalendarGrid extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.queueRender();
    }
    static get observedAttributes() {
        return ['year', 'month'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.queueRender();
    }

    queueRender() {
        if (this._renderPending) return;
        this._renderPending = true;
        requestAnimationFrame(() => {
            this.render();
            this._renderPending = false;
        });
    }

    render() {
        const year = parseInt(this.getAttribute('year'));
        const month = parseInt(this.getAttribute('month'));
        if (!year || !month) return;

        const jsMonth = month - 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        // Décalage pour le 1er jour (Lundi = 0 ... Dimanche = 6)
        let startOffset = (new Date(year, jsMonth, 1).getDay() || 7) - 1;

        // Création d'une grille fixe de 35 cellules (5 lignes x 7 jours)
        const gridCells = new Array(35).fill(null);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, jsMonth, day);
            const hijri = getHijriDateSafe(date);
            const dayInfo = getDayInfo(date, hijri);
            let pos = startOffset + day - 1;
            // Layout compact : si > 35 cases, on boucle au début
            if (pos >= 35) pos -= 35;
            gridCells[pos] = { day, hijri, dayInfo };
        }

        // Nettoyage et préparation
        this.innerHTML = '';
        this.className = 'days-grid-visual';
        const template = document.getElementById('calendar-cell-template');

        // Si le template n'existe pas (ex: erreur chargement), on arrête
        if (!template) return;

        for (let i = 0; i < 35; i++) {
            const cell = gridCells[i];

            if (!cell) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'day-cell-visual empty';
                this.appendChild(emptyDiv);
                continue;
            }

            // Clonage du template
            const clone = template.content.cloneNode(true);
            const root = clone.querySelector('.day-cell-visual');
            const { day, hijri, dayInfo } = cell;

            // Classes CSS
            if (dayInfo.isEid) root.classList.add('is-friday');
            if (dayInfo.isHoliday) root.classList.add('is-holiday');
            if (dayInfo.isPublicHoliday) root.classList.add('is-public-holiday');

            // Contenu Textuel
            root.querySelector('.vis-greg').textContent = day;
            root.querySelector('.vis-hij').textContent = hijri.day || '';

            // Icônes & Labels (gestion via attribut hidden)
            if (dayInfo.isNewMoon) root.querySelector('.new-moon-icon').hidden = false;

            if (dayInfo.isDST) {
                const dstIcon = root.querySelector('.dst-icon');
                dstIcon.hidden = false;
                dstIcon.textContent = dayInfo.dstType === 'winter' ? '🕒' : '🕑';
                if (dayInfo.isNewMoon) dstIcon.style.left = '18px';
            }

            if (dayInfo.label) {
                const labelDiv = root.querySelector('.event-label');
                labelDiv.hidden = false;
                labelDiv.textContent = dayInfo.label;
                if (dayInfo.isEid) labelDiv.classList.add('eid-label');
                if (dayInfo.isDST) labelDiv.classList.add('dst-label');
            }

            this.appendChild(clone);
        }
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
        this.queueRender();
    }
    static get observedAttributes() {
        return ['year', 'month'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.queueRender();
    }

    queueRender() {
        if (this._renderPending) return;
        this._renderPending = true;
        requestAnimationFrame(() => {
            this.render();
            this._renderPending = false;
        });
    }

    render() {
        const year = parseInt(this.getAttribute('year'));
        const month = parseInt(this.getAttribute('month'));
        if (!year || !month || !window.TEXTS) return;

        const tbody = this.querySelector('tbody');
        if (!tbody) return;

        const jsMonth = month - 1;
        const daysInMonth = new Date(year, month, 0).getDate();

        tbody.innerHTML = '';
        const template = document.getElementById('prayer-row-template');
        if (!template) return;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, jsMonth, day);
            const dayOfWeekIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
            const isFriday = date.getDay() === 5;
            let hijri = getHijriDateSafe(date);
            let times = getPrayerTimesSafe(date);

            const clone = template.content.cloneNode(true);
            const tr = clone.querySelector('tr');

            if (isFriday) tr.classList.add('is-friday');

            // Remplissage des données via sélecteurs
            tr.querySelector('.day-name').textContent = window.TEXTS.fr.daysShort[dayOfWeekIdx];
            tr.querySelector('.day-num').textContent = day.toString().padStart(2, '0');
            tr.querySelector('.fajr').textContent = times.fajr;
            tr.querySelector('.sunrise').textContent = times.sunrise;
            tr.querySelector('.dhuhr').textContent = times.dhuhr;
            tr.querySelector('.asr').textContent = times.asr;
            tr.querySelector('.maghrib').textContent = times.maghrib;
            tr.querySelector('.isha').textContent = times.isha;
            tr.querySelector('.col-hijri').textContent = hijri.day.padStart(2, '0');

            tbody.appendChild(clone);
        }
    }
}
if (!customElements.get('ami-prayer-table')) {
    customElements.define('ami-prayer-table', PrayerTable);
}

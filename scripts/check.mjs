// Vérification avant livraison : nombre de pages PDF et débordement de la couverture.
// Usage : npm run check [-- 2026 2027 …]   (années par défaut : 2025 à 2030)
// Prérequis : Chrome (macOS), pdfinfo (poppler), accès internet (fériés et vacances).
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SERVE_PORT = 3459;
const CDP_PORT = 9339;
const BASE = `http://localhost:${SERVE_PORT}`;
const years = process.argv.slice(2).map(Number).filter(Boolean);
if (!years.length) years.push(2025, 2026, 2027, 2028, 2029, 2030);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tmp = mkdtempSync(join(tmpdir(), 'ami-check-'));
const failures = [];
const report = (ok, label, detail = '') => {
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
    if (!ok) failures.push(label);
};

const server = spawn('node_modules/.bin/serve', ['-l', String(SERVE_PORT), '.'], { stdio: 'ignore' });
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${join(tmp, 'profile')}`, 'about:blank'], { stdio: 'ignore' });

async function waitFor(url) {
    for (let i = 0; i < 50; i++) {
        try {
            if ((await fetch(url)).ok) return;
        } catch {
            /* pas encore prêt */
        }
        await sleep(200);
    }
    throw new Error(`Injoignable : ${url}`);
}

// Ouvre la page en média « print », laisse le temps aux API, imprime en PDF et mesure la couverture.
async function inspect(path, { cover = false, quotes = false } = {}) {
    const tab = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    let id = 0;
    const pending = {};
    ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        pending[m.id]?.(m);
    };
    const send = (method, params) =>
        new Promise((r) => {
            pending[++id] = r;
            ws.send(JSON.stringify({ id, method, params }));
        });
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    // Navigation par CDP (/json/new perd tout ce qui suit un « & »). Pas de « /index.html » : serve redirige et perd la requête.
    await send('Page.navigate', { url: BASE + path });
    await sleep(3500);

    let measure = null;
    if (cover) {
        const expression = `(() => {
            const p = document.querySelector('.cover-page');
            const limit = p.getBoundingClientRect().bottom - parseFloat(getComputedStyle(p).paddingBottom);
            const bottom = s => Math.round(p.querySelector(s).getBoundingClientRect().bottom);
            const clipped = [...p.querySelectorAll('*')].filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').length;
            return JSON.stringify({ limit: Math.round(limit), body: bottom('.cover-body'), identity: bottom('.cover-identity'), verse: bottom('.cover-verse'), clipped });
        })()`;
        measure = JSON.parse((await send('Runtime.evaluate', { expression, returnByValue: true })).result.result.value);
    }

    // Citations du mois : une par page, sur une seule ligne (aucune ne déborde de son encart)
    let quoteInfo = null;
    if (quotes) {
        const expression = `JSON.stringify([...document.querySelectorAll('.month-quote')].map(q => ({ source: q.querySelector('.month-quote-source')?.textContent, overflow: q.scrollWidth > q.clientWidth + 1 })))`;
        quoteInfo = JSON.parse((await send('Runtime.evaluate', { expression, returnByValue: true })).result.result.value);
    }

    const { result } = await send('Page.printToPDF', { preferCSSPageSize: true, printBackground: true });
    const pdf = join(tmp, `p${Date.now()}.pdf`);
    writeFileSync(pdf, Buffer.from(result.data, 'base64'));
    ws.close();
    const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf]).toString())[1]);
    return { pages, measure, quoteInfo, pdf };
}

// Couverture d'encre approchée (CMJN naïf depuis le RGB, moyenne de la page, en %) : sert à comparer des versions entre elles,
// pas à prédire la consommation réelle (pas de profil ICC du copieur). Une valeur par page.
function inkCoverage(pdf) {
    const prefix = join(tmp, `ink-${Date.now()}`);
    execFileSync('pdftoppm', ['-r', '30', pdf, prefix]); // PPM (P6) : lisible sans dépendance
    return readdirSync(tmp)
        .filter((f) => f.startsWith(prefix.split('/').pop()) && f.endsWith('.ppm'))
        .sort()
        .map((f) => {
            const buf = readFileSync(join(tmp, f));
            const [w, h] = buf.toString('latin1', 0, 20).split(/\s+/).slice(1, 3).map(Number);
            const data = buf.subarray(buf.length - w * h * 3);
            let total = 0;
            for (let i = 0; i < data.length; i += 3) {
                const [r, g, b] = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
                const k = 1 - Math.max(r, g, b);
                total += k + (k < 1 ? (1 - r - k + (1 - g - k) + (1 - b - k)) / (1 - k) : 0);
            }
            return (100 * total) / (w * h);
        });
}

/** Contrôles statiques : jetons CSS jamais utilisés, fichiers référencés qui n'existent pas (assets, icônes des clients). */
function checkStatic() {
    const read = (f) => readFileSync(f, 'utf8');
    const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
    const sources = [
        ...readdirSync('css').map((f) => `css/${f}`),
        ...readdirSync('js')
            .filter((f) => f.endsWith('.js'))
            .map((f) => `js/${f}`),
        'index.html',
        'ramadan.html'
    ].map((f) => stripComments(read(f)));
    const tokens = [...stripComments(read('css/variables.css')).matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
    const unused = tokens.filter((t) => !sources.some((s) => new RegExp(`var\\(\\s*${t}(?![a-z0-9-])`).test(s)));
    report(!unused.length, 'Jetons CSS', unused.length ? `inutilisés : ${unused.join(', ')}` : `${tokens.length} utilisés`);

    const missing = new Set();
    for (const s of sources)
        for (const [, p] of s.matchAll(/(?:href|src)="(assets\/[^"#]+)|url\('\.\.\/(assets\/[^')]+)'\)/g)) if (p && !p.includes('${') && !existsSync(p)) missing.add(p);
    for (const f of readdirSync('clients').filter((f) => f.endsWith('.json'))) {
        for (const [, icon] of read(`clients/${f}`).matchAll(/"[a-z0-9]+_icon":\s*"([a-z-]+)"/g))
            if (!existsSync(`assets/icons/icon-${icon}.svg`)) missing.add(`assets/icons/icon-${icon}.svg (clients/${f})`);
    }
    report(!missing.size, 'Fichiers référencés', missing.size ? `introuvables : ${[...missing].join(', ')}` : 'tous présents');
}

try {
    checkStatic();
    await waitFor(BASE + '/index.html');
    await waitFor(`http://127.0.0.1:${CDP_PORT}/json/version`);

    for (const y of years) {
        const { pages, pdf, quoteInfo } = await inspect(`/?year=${y}&mosque=ami93120`, { quotes: true });
        report(pages === 13, `${y} : calendrier annuel`, `${pages} page(s), 13 attendues`);
        const overflowing = quoteInfo.filter((q) => q.overflow || !q.source);
        report(quoteInfo.length === 12 && !overflowing.length, `${y} : citations du mois`, `${quoteInfo.length} sur 12 pages, ${overflowing.length} qui débordent`);
        console.log(`     ${quoteInfo.map((q) => q.source).join(' | ')}`);
        const ink = inkCoverage(pdf);
        console.log(
            `     encre (approx., CMJN cumulés) : moyenne ${(ink.reduce((a, b) => a + b, 0) / ink.length).toFixed(1)} %, page la plus chargée ${Math.max(...ink).toFixed(1)} %`
        );
        const { pages: coverPages, measure: m } = await inspect(`/?year=${y}&month=cover`, { cover: true });
        const fits = m.body <= m.limit + 1 && m.identity <= m.limit + 1 && m.verse <= m.limit + 1 && m.clipped === 0;
        report(coverPages === 1 && fits, `${y} : couverture`, `${coverPages} page(s), verset à ${m.verse} / limite ${m.limit}, ${m.clipped} élément(s) rogné(s)`);
    }
    const { pages } = await inspect('/ramadan?year=2028');
    report(pages === 1, 'Feuille du Ramadan', `${pages} page(s), 1 attendue`);
} finally {
    chrome.kill();
    server.kill();
    await sleep(300);
    rmSync(tmp, { recursive: true, force: true });
}

console.log(failures.length ? `\n${failures.length} échec(s)` : '\nTout est conforme.');
process.exit(failures.length ? 1 : 0);

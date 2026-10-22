// Vérification avant livraison : nombre de pages PDF et débordement de la couverture.
// Usage : npm run check [-- 2026 2027 …]   (années par défaut : 2025 à 2030)
// Prérequis : Chrome (macOS), pdfinfo (poppler), accès internet (fériés et vacances).
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
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
async function inspect(path, { cover = false } = {}) {
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

    const { result } = await send('Page.printToPDF', { preferCSSPageSize: true, printBackground: true });
    const pdf = join(tmp, `p${Date.now()}.pdf`);
    writeFileSync(pdf, Buffer.from(result.data, 'base64'));
    ws.close();
    const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf]).toString())[1]);
    return { pages, measure };
}

try {
    await waitFor(BASE + '/index.html');
    await waitFor(`http://127.0.0.1:${CDP_PORT}/json/version`);

    for (const y of years) {
        const { pages } = await inspect(`/?year=${y}&mosque=ami93120`);
        report(pages === 13, `${y} : calendrier annuel`, `${pages} page(s), 13 attendues`);
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

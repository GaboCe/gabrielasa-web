// Saca las capturas del portfolio (compu y celu) desde las webs reales
// y deja un informe de cada link en img/webs/links.json.
// Se corre solo en GitHub Actions (ver .github/workflows/capturas.yml).
import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const webs = [
  { id: 'aires',     url: 'https://aires.gabrielasa.com.ar/' },
  { id: 'marderock', url: 'https://marderock.com.ar/' },
  { id: 'fotos',     url: 'https://fotos.gabrielasa.com.ar/' },
  { id: 'canciones', url: 'https://canciones.gabrielasa.com.ar/' },
  { id: 'aleperalta',url: 'https://gaboce.github.io/AlePeraltapagina/' },
  { id: 'lm',        url: 'https://lmservicios.pages.dev/' },
  { id: 'otramirada', url: 'https://otra-mirada.pages.dev/' },
];

mkdirSync('img/webs', { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const informe = [];

async function captura(w, ctxOpts, file) {
  const ctx = await browser.newContext({ ...ctxOpts, locale: 'es-AR', reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  let status = 0, final = '', title = '', error = '';
  try {
    const r = await page.goto(w.url, { waitUntil: 'networkidle', timeout: 45000 });
    status = r ? r.status() : 0;
    await page.waitForTimeout(4500); // deja terminar animaciones de entrada, fuentes y la remera 3D
    final = page.url();
    title = await page.title();
    await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
  } catch (e) { error = String(e).slice(0, 300); }
  await ctx.close();
  return { status, final, title, error };
}

for (const w of webs) {
  const pc = await captura(w, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, `img/webs/${w.id}-pc.jpg`);
  const cel = await captura(w, { ...devices['iPhone 13'], deviceScaleFactor: 2 }, `img/webs/${w.id}-cel.jpg`);
  informe.push({ id: w.id, url: w.url, pc, cel });
  console.log(w.id, pc.status, pc.final, pc.title, pc.error || '');
}
await browser.close();
writeFileSync('img/webs/links.json', JSON.stringify({ fecha: new Date().toISOString(), webs: informe }, null, 2));

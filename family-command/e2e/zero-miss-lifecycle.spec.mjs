import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium, webkit } from 'playwright';

const root = resolve('family-command');
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + sep)) return res.writeHead(403).end();
  try {
    const bytes = await readFile(file);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' })[extname(file)] || 'application/octet-stream');
    res.end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const engine = process.env.FC_BROWSER || 'webkit';
const browser = await ({ chromium, webkit })[engine].launch({ headless: true });
const failures = [];
async function check(name, fn) {
  try { await fn(); console.log('PASS ' + name); }
  catch (e) { failures.push(name + ': ' + e.message); console.error('FAIL ' + name + ': ' + e.message); }
}
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Europe/Zurich', serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.addInitScript({ content: readFileSync('family-command/e2e/mock-private-core.js', 'utf8') });
  await context.route('https://lmrvapstojcecljjdgds.supabase.co/**', route => route.fulfill({ json: { ok: true, commands: [], documents: [], snapshots: [], skipped: true } }));
  const page = await context.newPage(), errors = [], assets = new Map();
  page.setDefaultTimeout(8000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => {
    const url = new URL(r.url());
    if (url.hostname === '127.0.0.1' && /\.(js|css)$/.test(url.pathname)) assets.set(url.pathname, (assets.get(url.pathname) || 0) + 1);
  });
  await page.clock.install({ time: new Date('2026-09-08T15:00:00+02:00') });
  let zeroCssLoaded=false;
  page.on('response',r=>{if(new URL(r.url()).pathname==='/zero-miss-v978.css')zeroCssLoaded=true;});
  await page.route('**/zero-miss-v978.css?*',async route=>{await new Promise(r=>setTimeout(r,250));await route.continue();});
  await page.goto(`http://127.0.0.1:${server.address().port}/?access=test`);
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');
  assert.ok(zeroCssLoaded,'the app becomes visible only after its final styles load');
  await page.waitForFunction(() => window.__fcZeroMissV978API && window.__fcReferenceDashboard39?.rebuild);
  await page.evaluate(() => {
    todayISO = () => '2026-09-08';
    data.events = [
      { id: 'doctor', title: 'Kontrolle beim Kinderarzt mit anschliessender Besprechung', date: todayISO(), time: '16:00', personIds: ['child-a'] },
      { id: 'practice', title: 'Fahrradtraining', date: todayISO(), time: '17:00', personIds: ['child-a'], note: 'Mitnehmen: Velohelm' },
      { id: 'third', title: 'Bibliothek', date: todayISO(), time: '18:00', personIds: ['child-a'] },
      { id: 'fourth', title: 'Telefonat', date: todayISO(), time: '19:00', personIds: ['child-a'] },
      { id: 'fifth', title: 'Elternabend', date: todayISO(), time: '20:00', personIds: ['oli'] },
      { id: 'sixth', title: 'Schulprojekt', date: todayISO(), personIds: ['child-b'] },
      { id: 'past', title: 'Vergangener Termin', date: todayISO(), time: '08:00', personIds: ['child-a'] },
      { id: 'tomorrow', title: 'Schwimmkurs', date: '2026-09-09', time: '09:00', personIds: ['child-b'], note: 'Mitnehmen: Badehose' }
    ];
    data.todos = [{ id: 'independent', title: 'Anna', date: '2026-09-07', done: false }];
    data.homework = [];
    data.pendencies = [
      { id: 'debt', title: 'Anna schuldet CHF 10', date: '2020-01-01', amount: 10, currency: 'CHF', done: false },
      { id: 'other', title: 'Rückzahlung bestätigen', amount: 20, done: false },
      { id: 'third-pend', title: 'Unterschrift einholen', done: false },
      { id: 'fourth-pend', title: 'Offene Rückmeldung', done: false },
      { id: 'done', title: 'Bereits bezahlt', done: true }
    ];
    data.schedules = { 'child-a': { 2: [{ start: '08:00', end: '12:00', label: 'Schule' }] } };
    data.reminders = [];
    __fcV9.invalidate(); renderToday();
  });
  const dashboard = page.locator('#today > .fc38-dashboard');
  await page.waitForTimeout(150);
  await check('independent open debts are never suppressed by similar task titles or old dates', async () => {
    assert.match(await dashboard.innerText(), /Anna schuldet CHF 10/);
    assert.doesNotMatch(await dashboard.innerText(), /Bereits bezahlt|Vergangener Termin/);
    assert.equal(await dashboard.locator('.fc978-pendency').count(), 3);
    await dashboard.locator('.fc978-pendency').first().click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-pend') === 'debt');
    assert.equal(await page.locator('[data-pend="fourth-pend"]').count(), 1);
    await page.locator('.fc9-nav [data-screen="today"]').click();
  });
  await check('school ending cannot hide a later child appointment; packing and overflow stay reachable', async () => {
    const child = dashboard.locator('[data-focus-child="child-a"]');
    assert.match(await child.innerText(), /Kontrolle beim Kinderarzt/);
    assert.match(await child.innerText(), /Velohelm/);
    assert.equal((await child.innerText()).match(/Fahrradtraining/g)?.length, 1, 'one preparation label per child event');
    assert.equal(await child.locator('[data-events]').count(), 1, 'additional child events have an explicit route');
    assert.match(await dashboard.locator('.fc38-tomorrow').innerText(), /Badehose/);
  });
  await check('each today event has one detail row; extra events remain accessible', async () => {
    assert.equal(await dashboard.locator('[data-focus-event="doctor"]').count(), 1);
    assert.equal(await dashboard.locator('[data-event="doctor"]').count(), 1, 'one additional child context, no duplicate day summary');
    assert.equal(await dashboard.locator('.fc978-today-detail').count(), 1);
    await dashboard.locator('.fc978-today-detail .fc38-show-more').click();
    assert.match(await page.locator('#events').innerText(), /Elternabend|Schulprojekt/);
    await page.locator('.fc9-nav [data-screen="today"]').click();
  });
  await check('minute refresh, resume, explicit rebuild and cloud changes retain the complete dashboard', async () => {
    const before = await page.evaluate(() => JSON.stringify(data));
    await page.locator('.fc38-school').evaluate(el => { el.open = true; });
    for (const update of ['force', 'minute', 'resume']) {
      if (update === 'force') await page.evaluate(() => __fcReferenceDashboard39.rebuild(true));
      if (update === 'minute') await page.clock.fastForward(61000);
      if (update === 'resume') await page.evaluate(() => dispatchEvent(new Event('pageshow')));
      assert.equal(await dashboard.locator('.fc978-digest').count(), 1, update);
      assert.equal(await dashboard.locator('.fc978-pendency').count(), 3, update);
      assert.equal(await page.locator('.fc38-school').evaluate(el => el.open), true);
    }
    assert.equal(await page.evaluate(() => JSON.stringify(data)), before, 'rendering never changes canonical state');
    await page.evaluate(() => { data.pendencies[0].title = 'Rückzahlung von Anna'; dispatchEvent(new Event('fc:cloud-status')); });
    assert.match(await dashboard.innerText(), /Rückzahlung von Anna/);
    await page.evaluate(() => { data.pendencies[0].done = true; dispatchEvent(new Event('fc:cloud-status')); });
    assert.doesNotMatch(await dashboard.innerText(), /Rückzahlung von Anna/);
    await page.locator('.fc38-school').evaluate(el => { el.open = false; });
  });
  await check('responsive content remains readable, reachable and free of render churn', async () => {
    for (const width of [390, 393, 402, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const m = await dashboard.evaluate(root => {
        const rect = el => el.getBoundingClientRect();
        const buttons = [...root.querySelectorAll('.fc978-pendency,.fc978-child-events button,.fc978-digest-head button')];
        const nav = document.querySelector('.fc9-nav');
        return { overflow: document.documentElement.scrollWidth > innerWidth, digest: root.querySelectorAll('.fc978-digest').length,
          small: buttons.filter(b => rect(b).height < 44 || rect(b).width < 44).map(b => b.textContent),
          clipped: [...root.querySelectorAll('.fc978-child-events b,.fc978-pendency b')].filter(b => b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1).map(b => b.textContent),
          nav: rect(nav).left >= 0 && rect(nav).right <= innerWidth + 1 && rect(nav).bottom <= innerHeight + 1 };
      });
      assert.equal(m.overflow, false, `${width}px horizontal overflow`);
      assert.equal(m.digest, 1); assert.deepEqual(m.small, [], `${width}px touch targets`);
      assert.deepEqual(m.clipped, [], `${width}px clipped text`); assert.equal(m.nav, true);
      if(width>=1024){
        const empty=await dashboard.locator('.fc38-priority').evaluate(el=>el.getBoundingClientRect().bottom-el.lastElementChild.getBoundingClientRect().bottom);
        assert.ok(empty<24,`${width}px priority card must not stretch into an empty second grid row`);
        const events=await dashboard.locator('.fc978-today-detail').boundingBox(),tomorrow=await dashboard.locator('.fc38-tomorrow').boundingBox();
        assert.ok(Math.abs(events.y-tomorrow.y)<2,'today and tomorrow share the next desktop row');
        assert.ok(events.x+events.width<=tomorrow.x,'today and tomorrow must occupy separate columns without overlap');
      }
      if (process.env.FC_QA_DIR) {
        await mkdir(process.env.FC_QA_DIR, { recursive: true });
        await page.screenshot({ path: resolve(process.env.FC_QA_DIR, `zero-miss-${engine}-${width}.png`), fullPage: true });
      }
    }
    assert.deepEqual(await page.evaluate(() => __fcV9.health().dup), []);
    await page.evaluate(() => { window.fcQaRoot = document.querySelector('#today > .fc38-dashboard'); window.fcQaDigest = fcQaRoot.querySelector('.fc978-digest'); });
    await page.clock.fastForward(2000);
    assert.equal(await page.evaluate(() => fcQaRoot === document.querySelector('#today > .fc38-dashboard') && fcQaDigest === fcQaRoot.querySelector('.fc978-digest')), true, 'idle app does not rebuild repeatedly');
  });
  await check('open pendencies prevent a false all-done status, and explicit completion clears them', async () => {
    await page.evaluate(() => { data.todos = []; data.events = []; renderToday(); });
    assert.doesNotMatch(await dashboard.locator('.fc38-priority').innerText(), /Alles erledigt|nichts Dringendes/);
    await dashboard.locator('.fc978-pendency').first().click();
    await page.locator('[data-pend="other"]').click();
    assert.equal(await page.evaluate(() => data.pendencies.find(x => x.id === 'other').done), true);
    await page.locator('.fc9-nav [data-screen="today"]').click();
    assert.doesNotMatch(await dashboard.innerText(), /Rückzahlung bestätigen/);
    await page.evaluate(() => { data.pendencies.forEach(x => { x.done = true; }); renderToday(); });
    assert.match(await dashboard.locator('.fc38-priority').innerText(), /Alles erledigt/);
    assert.equal(await dashboard.locator('.fc978-pendency').count(), 0);
  });
  await check('managed boot loads each JS/CSS once and does not load the retired glance layer', async () => {
    assert.equal(assets.get('/zero-miss-v978.js'), 1); assert.equal(assets.get('/zero-miss-v978.css'), 1);
    assert.deepEqual([...assets].filter(([path]) => path.includes('today-glance-v976')), []);
    assert.deepEqual([...assets].filter(([, count]) => count > 1), []);
    assert.deepEqual(errors, []);
  });
} finally { await browser.close(); await new Promise(r => server.close(r)); }
assert.deepEqual(failures, [], `${engine} zero-miss lifecycle`);

import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';

// Browser plugin not available: Playwright/WebKit runs the actual app with the
// existing generic local fixture. No production family data or access key.
// Flow: boot -> header -> all five tabs -> quick-add -> unchanged clear header.
const port = 4206;
const base = `http://127.0.0.1:${port}`;
const output = process.env.FC_HEADER_ARTIFACTS || path.join(os.tmpdir(), 'fc-header-rendering');
mkdirSync(output, { recursive: true });
const seed = readFileSync('family-command/e2e/mock-private-core.js', 'utf8');
const server = spawn('python3', ['-m', 'http.server', String(port), '--directory', 'family-command'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
async function ready() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + '/index.html')).ok) return; } catch {}
    await sleep(100);
  }
  throw new Error('Header test server did not start');
}
async function inspect(page) {
  return page.evaluate(() => {
    const box = e => { const r = e?.getBoundingClientRect(); return r ? { x:r.x, y:r.y, width:r.width, height:r.height, bottom:r.bottom, right:r.right } : null; };
    const style = (e, pseudo) => {
      const s = getComputedStyle(e, pseudo);
      return { node:e.id || e.className || e.tagName, pseudo, display:s.display, content:s.content, position:s.position, top:s.top, height:s.height, zIndex:s.zIndex, filter:s.filter, backdrop:s.backdropFilter || s.webkitBackdropFilter, transform:s.transform, scale:s.scale, opacity:s.opacity, shadow:s.textShadow, mask:s.maskImage, background:s.backgroundImage, paddingTop:s.paddingTop, font:s.font, fontSmoothing:s.getPropertyValue('-webkit-font-smoothing'), textRendering:s.textRendering, rect:box(e) };
    };
    const title = document.querySelector('.fc9-brand > b');
    const ancestors = [];
    for (let e = title; e; e = e.parentElement) ancestors.push(style(e));
    const effects = [];
    for (const e of document.querySelectorAll('body, #fcApp, .fc9-shell, .fc9-topbar, .fc9-topbar-in, .fc9-brand, .fc9-mark, .fc9-main, .fc9-nav')) {
      for (const pseudo of [null, '::before', '::after']) {
        const s = style(e, pseudo);
        if (s.display !== 'none' && (!pseudo || (s.content !== 'none' && s.content !== 'normal')) && ((s.filter && s.filter !== 'none') || (s.backdrop && s.backdrop !== 'none'))) effects.push(s);
      }
    }
    const mark = document.querySelector('.fc9-mark');
    const image = mark?.querySelector('img');
    const top = document.querySelector('.fc9-topbar-in');
    const nav = document.querySelector('.fc9-nav');
    return { title:document.title, url:location.href, viewport:innerWidth, header:box(top), titleBox:box(title), titleStyle:style(title), status:box(document.querySelector('.fc9-header-status')), today:box(document.querySelector('.fc9-header-today')), sync:box(document.querySelector('#fcCloudStatus')), ancestors, effects, mark:mark ? style(mark) : null, image:image ? { src:image.getAttribute('src'), display:getComputedStyle(image).display, complete:image.complete, naturalWidth:image.naturalWidth, rect:box(image) } : null, nav:box(nav), navButtons:[...nav.querySelectorAll('button')].map(box), overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, stylesheets:[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>x.href) };
  });
}
try {
  await ready();
  browser = await webkit.launch({ headless:true });
  for (const width of [402, 375, 390, 430, 1280]) {
    const mobile = width < 720;
    const context = await browser.newContext({ viewport:{ width, height:900 }, deviceScaleFactor:mobile ? 3 : 1, isMobile:mobile, hasTouch:mobile, serviceWorkers:'block' });
    await context.addInitScript({ content:seed });
    const unexpectedRequests = [], mockedRequests = [], badResponses = [];
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin === base) return route.continue();
      const prefix = '/functions/v1/';
      const endpoint = url.hostname === 'lmrvapstojcecljjdgds.supabase.co' && url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : '';
      let body;
      if (endpoint === 'family-command-backups/list' && request.method() === 'GET') body = { snapshots:[] };
      else if (endpoint === 'family-command-backups/snapshot' && request.method() === 'POST') body = { skipped:true, snapshot:{ id:'header-fixture', created_at:'2026-09-06T00:00:00Z', reason:'startup' } };
      else if (endpoint === 'family-command-chat-commands' && ['GET','POST'].includes(request.method())) body = { ok:true, commands:[] };
      else if (endpoint === 'family-command-documents/list' && request.method() === 'GET') body = { documents:[] };
      if (body) {
        mockedRequests.push({ endpoint, method:request.method() });
        return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(body) });
      }
      unexpectedRequests.push({ url:request.url(), method:request.method() });
      return route.abort('blockedbyclient');
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) badResponses.push({ url:response.url(), status:response.status() }); });
    const consoleErrors = [];
    page.on('console', message => { if(message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(base + '/?access=test', { waitUntil:'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.fcReady === '1' && document.querySelector('.fc9-brand > b'));
    await page.waitForFunction(() => document.documentElement.dataset.fcHeaderRelease === 'v9657');
    if (mobile) await page.waitForSelector('.fc9-header-status');
    await page.evaluate(() => window.__fcLoadExtrasNow());
    await page.waitForFunction(() => document.documentElement.dataset.fcExtras === 'ready');
    await page.evaluate(() => document.fonts.ready);
    await sleep(3000);
    const report = await inspect(page);
    writeFileSync(path.join(output, `header-${width}.json`), JSON.stringify({ ...report, errors, consoleErrors }, null, 2));
    await page.screenshot({ path:path.join(output, `app-${width}.png`) });
    await page.locator('.fc9-topbar').screenshot({ path:path.join(output, `header-${width}.png`) });
    console.log('header-rendering', JSON.stringify(report));
    assert.equal(report.title, 'Familienzentrale');
    assert.equal(new URL(report.url).origin, base, 'Correct local app, not an error page');
    assert.ok(await page.locator('#today').innerText(), 'First meaningful screen is not blank');
    assert.equal(report.mark.background, 'none', 'No substitute house background behind the original image');
    assert.equal(await page.locator('.fc9-mark').evaluate(e => getComputedStyle(e, '::before').content), 'none', 'No house pseudo-glyph covering the family logo');
    assert.equal(report.overflow, false, 'No horizontal page overflow');
    assert.ok(report.image?.display !== 'none' && report.image?.rect.width > 0, 'The original family logo must be a visible image, not a replacement house background');
    assert.ok(report.image.complete && report.image.naturalWidth >= 180, 'Family logo must finish loading at sufficient source resolution');
    assert.match(report.image.src, /(?:apple-touch-icon\.png|icon\.svg)/, 'Reuse the existing family/house/calendar brand asset');
    if (mobile) {
      assert.ok(report.header.height <= 86, `Compact header including a separate status row: ${report.header.height}`);
      assert.ok(report.titleBox.y >= report.header.y + 24, 'Title stays clear of the upper iPhone edge');
      assert.notEqual(report.titleStyle.fontSmoothing, 'antialiased', 'Do not force grayscale antialiasing on iPhone title');
      assert.equal(report.titleStyle.textRendering, 'auto', 'Use Safari native text rendering for title');
      assert.ok(report.sync && Math.abs(report.sync.y - report.today.y) <= 1, 'Real cloud badge and today anchor share one row');
      assert.ok(report.sync.right <= report.today.x, 'Cloud status and date must not overlap');
      assert.equal(await page.locator('.fc9-header-status > #fcCloudStatus').count(), 1, 'Real cloud node is outside the brand');
      assert.equal(await page.locator('#fcCloudStatus').getAttribute('role'), 'status');
      assert.equal(await page.locator('#fcCloudStatus').getAttribute('aria-live'), 'polite');
      await page.evaluate(() => { window.__headerTestStatusNode = document.getElementById('fcCloudStatus'); });
      await page.evaluate(() => document.documentElement.style.setProperty('--fc-header-safe-top', '59px'));
      const safe = await inspect(page);
      assert.ok(Math.abs(safe.header.height - report.header.height - 59) <= 1, 'Safe area is applied exactly once');
      assert.ok(Math.abs(safe.titleBox.y - report.titleBox.y - 59) <= 1, 'Safe-area padding moves the title, not a scale/transform');
      writeFileSync(path.join(output, `safe-area-${width}.json`), JSON.stringify(safe, null, 2));
      await page.evaluate(() => document.documentElement.style.removeProperty('--fc-header-safe-top'));
      for (const a of report.ancestors) {
        assert.equal(a.filter, 'none', `No text/ancestor filter: ${a.node}`);
        assert.ok(!a.backdrop || a.backdrop === 'none', `No text/ancestor backdrop filter: ${a.node}`);
        assert.equal(a.transform, 'none', `No scaled/composited title ancestor: ${a.node}`);
        assert.equal(a.shadow, 'none', `No title/ancestor text shadow: ${a.node}`);
      }
      assert.ok(report.titleBox.bottom <= report.status.y + 1, 'Title and status must not overlap');
      assert.ok(report.navButtons.every(b => b.height >= 44), 'Navigation touch targets retained');
      for (const screen of ['tomorrow', 'events', 'homework', 'more', 'today']) {
        await page.locator(`.fc9-nav button[data-screen="${screen}"]`).click();
        await page.waitForFunction(id => document.getElementById(id)?.classList.contains('active'), screen);
        assert.ok(await page.locator(`#${screen}`).innerText(), `Meaningful ${screen} content`);
        assert.equal(await page.locator('.fc9-header-status').count(), 1, 'No duplicate header after navigation');
        assert.equal(await page.evaluate(() => document.getElementById('fcCloudStatus') === window.__headerTestStatusNode), true, 'Preserve the live cloud node identity');
      }
      await page.locator('#fc9Add').click();
      await page.waitForSelector('.fc9-modal');
      assert.ok(await page.locator('.fc9-modal').innerText(), 'Quick-add still opens');
      await page.locator('.fc9-modal .fc9-close').click();
      await page.waitForSelector('.fc9-modal', { state:'detached' });
      await page.locator('.fc9-header-today').press('Enter');
      await page.waitForSelector('.fc-dc-modal');
      assert.ok(await page.locator('.fc-dc-modal').innerText(), 'Keyboard activation still opens the daily check');
      await page.locator('.fc-dc-modal [data-close]').click();
      await page.waitForSelector('.fc-dc-modal', { state:'detached' });
      if (width === 402) {
        await page.setViewportSize({ width:1280, height:900 });
        await page.waitForSelector('.fc9-header-status', { state:'detached' });
        assert.equal(await page.locator('.fc9-brand > #fcCloudStatus').count(), 1, 'Restore the cloud node for desktop');
        assert.notEqual(await page.locator('.fc-today-anchor').getAttribute('aria-hidden'), 'true', 'Restore desktop anchor accessibility');
        assert.equal(await page.locator('.fc-today-anchor').evaluate(e => e.tabIndex), 0);
        await page.setViewportSize({ width, height:900 });
        await page.waitForSelector('.fc9-header-status > #fcCloudStatus');
        assert.equal(await page.locator('#fcCloudStatus').count(), 1, 'No duplicated cloud node after resize');
        await page.locator('.fc9-header-today').click();
        await page.waitForSelector('.fc-dc-modal');
        await page.locator('.fc-dc-modal [data-close]').click();
      }
      const after = await inspect(page);
      assert.ok(after.header.height <= 86, 'Header remains compact after interaction and resize');
      writeFileSync(path.join(output, `interactions-${width}.json`), JSON.stringify({ navigation:'passed', quickAdd:'passed', dailyCheck:'passed', safeArea:'passed', resize:width === 402 ? 'passed' : 'not-run', errors, consoleErrors, after }, null, 2));
    }
    writeFileSync(path.join(output, `network-${width}.json`), JSON.stringify({ mockedRequests, unexpectedRequests, badResponses, errors, consoleErrors }, null, 2));
    assert.deepEqual(unexpectedRequests, [], 'All backend requests are explicit local fixtures, never live calls');
    assert.deepEqual(badResponses, [], 'No failed local resources or mocked responses');
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    assert.deepEqual(consoleErrors, [], 'No console errors in the target flow');
    await context.close();
  }
  console.log('V9.65.7 header rendering and navigation regression: ok');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

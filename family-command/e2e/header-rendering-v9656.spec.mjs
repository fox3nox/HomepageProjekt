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
      return { node:e.id || e.className || e.tagName, pseudo, display:s.display, content:s.content, position:s.position, top:s.top, height:s.height, zIndex:s.zIndex, filter:s.filter, backdrop:s.backdropFilter || s.webkitBackdropFilter, transform:s.transform, scale:s.scale, opacity:s.opacity, shadow:s.textShadow, mask:s.maskImage, background:s.backgroundImage, paddingTop:s.paddingTop, font:s.font, rect:box(e) };
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
    return { title:document.title, url:location.href, viewport:innerWidth, header:box(top), titleBox:box(title), status:box(document.querySelector('.fc9-header-status')), today:box(document.querySelector('.fc9-header-today')), sync:box(document.querySelector('.fc9-sync')), ancestors, effects, mark:mark ? style(mark) : null, image:image ? { src:image.getAttribute('src'), display:getComputedStyle(image).display, complete:image.complete, naturalWidth:image.naturalWidth, rect:box(image) } : null, nav:box(nav), navButtons:[...nav.querySelectorAll('button')].map(box), overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, stylesheets:[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>x.href) };
  });
}
try {
  await ready();
  browser = await webkit.launch({ headless:true });
  for (const width of [402, 375, 390, 430, 1280]) {
    const mobile = width < 720;
    const context = await browser.newContext({ viewport:{ width, height:900 }, deviceScaleFactor:mobile ? 3 : 1, isMobile:mobile, hasTouch:mobile, serviceWorkers:'block' });
    await context.addInitScript({ content:seed });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/?access=test', { waitUntil:'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.fcReady === '1' && document.querySelector('.fc9-brand > b'));
    await page.waitForFunction(() => document.documentElement.dataset.fcHeaderCrisp === 'v9654');
    if (mobile) await page.waitForSelector('.fc9-header-status');
    await page.evaluate(() => document.fonts.ready);
    await sleep(1200);
    const report = await inspect(page);
    writeFileSync(path.join(output, `header-${width}.json`), JSON.stringify({ ...report, errors }, null, 2));
    await page.screenshot({ path:path.join(output, `app-${width}.png`) });
    await page.locator('.fc9-topbar').screenshot({ path:path.join(output, `header-${width}.png`) });
    console.log('header-rendering', JSON.stringify(report));
    assert.equal(report.title, 'Familienzentrale');
    assert.equal(report.overflow, false, 'No horizontal page overflow');
    assert.ok(report.image?.display !== 'none' && report.image?.rect.width > 0, 'The original family logo must be a visible image, not a replacement house background');
    assert.ok(report.image.complete && report.image.naturalWidth >= 180, 'Family logo must finish loading at sufficient source resolution');
    assert.match(report.image.src, /(?:apple-touch-icon\.png|icon\.svg)/, 'Reuse the existing family/house/calendar brand asset');
    if (mobile) {
      assert.ok(report.header.height - parseFloat(report.ancestors.find(x => x.node === 'fc9-topbar-in').paddingTop) <= 86, 'Compact header including a separate status row');
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
      }
      await page.locator('#fc9Add').click();
      await page.waitForSelector('.fc9-modal');
      assert.ok(await page.locator('.fc9-modal').innerText(), 'Quick-add still opens');
      await page.locator('.fc9-modal .fc9-close').click();
      await page.waitForSelector('.fc9-modal', { state:'detached' });
    }
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    await context.close();
  }
  console.log('V9.65.6 header rendering and navigation regression: ok');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

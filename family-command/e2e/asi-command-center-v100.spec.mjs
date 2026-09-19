import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('../asi-command-center-v100.css',import.meta.url),'utf8');
const loader=await readFile(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const dashboard=await readFile(new URL('../reference-dashboard-v36.js',import.meta.url),'utf8');
const app=await readFile(new URL('../v9-app.js',import.meta.url),'utf8');
const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');

assert.match(app,/\['today','Übersicht'\],\['events','Plan'\],\['more','Familie'\]/,'only three primary destinations stay in the bottom navigation');
assert.match(css,/\.fc-search-entry\{display:none!important\}/,'the duplicate mobile search field leaves the content flow');
assert.match(css,/fc38-focus[\s\S]*min-height:112px!important/,'the next action has unmistakable visual priority');
assert.match(css,/fc986-child-main[\s\S]*grid-template-columns:minmax\(0,1fr\) auto/,'child names and school times use a stable two-column row');
assert.match(css,/fc986-school-times[\s\S]*flex-direction:column/,'multiple school blocks remain readable without overlap');
assert.match(css,/@media\(max-width:374px\)/,'narrow iPhones have an explicit reflow rule');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/,'motion preferences remain respected');
assert.doesNotMatch(css,/linear-gradient|radial-gradient|backdrop-filter/,'the final visual layer stays calm and flat');
assert.match(dashboard,/live\?'Kinder heute':'Kinder morgen'/,'child context names the actual day');
assert.match(dashboard,/data-open="\$\{live\?'events':'tomorrow'\}"/,'the child-detail action opens the matching live or tomorrow destination');
assert.match(loader,/finalCss\('asi-command-center-v100\.css','fc100asi'\)/,'the redesign loads after every historical style layer');
assert.match(loader,/fcAsiCommandCenter='v100'/,'runtime exposes the active visual release');
assert.match(index,/20260919-v1000/,'the boot version invalidates stale iPhone assets');
assert.match(sw,/family-command-v126-asi-command-center/,'the service worker uses a new atomic cache');
assert.match(sw,/asi-command-center-v100\.css/,'the final visual layer is available offline');

const coreMatch=sw.match(/const CORE=\[(.*?)\];/s);
assert.ok(coreMatch,'service worker core contract exists');
const core=[...coreMatch[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
assert.equal(new Set(core).size,core.length,'every offline core asset is listed once');

console.log('PASS V10 ASI command center source contract');

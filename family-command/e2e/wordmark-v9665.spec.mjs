import fs from 'node:fs';
import assert from 'node:assert/strict';
const css=fs.readFileSync(new URL('../header-crisp-v9654.css',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
for(const f of ['fc-wordmark-2x.png','fc-wordmark-3x.png']){const p=new URL('../'+f,import.meta.url);const b=fs.readFileSync(p);assert.ok(b.length>500,f+' missing/too small');assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10],f+' must be PNG')}
// V9.66.9 replaced the bitmap wordmark with unscaled native text.
assert.match(css,/font-size:18px!important/);
assert.match(css,/-webkit-text-fill-color:#0b203b!important/);
assert.match(css,/background-image:none!important/);
assert.match(css,/transform:none!important/);
assert.ok(!loader.includes('header-binary-text-v9664.js'));
assert.match(loader,/fcHeaderRelease='v9669'/);
assert.match(sw,/fc-wordmark-2x\.png/);assert.match(sw,/fc-wordmark-3x\.png/);
console.log('Native V9.66.9 wordmark and retained asset regression ok');

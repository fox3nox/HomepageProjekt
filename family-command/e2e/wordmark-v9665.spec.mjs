import fs from 'node:fs';
import assert from 'node:assert/strict';
const css=fs.readFileSync(new URL('../header-crisp-v9654.css',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
for(const f of ['fc-wordmark-2x.png','fc-wordmark-3x.png']){const p=new URL('../'+f,import.meta.url);const b=fs.readFileSync(p);assert.ok(b.length>500,f+' missing/too small');assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10],f+' must be PNG')}
assert.match(css,/image-set\([^)]*fc-wordmark-2x\.png[^)]*2x[^)]*fc-wordmark-3x\.png[^)]*3x/);
assert.match(css,/font-size:0!important/);
assert.match(css,/-webkit-text-fill-color:transparent!important/);
assert.ok(!loader.includes('header-binary-text-v9664.js'));
assert.match(loader,/fcHeaderRelease='v9665'/);
assert.match(sw,/fc-wordmark-2x\.png/);assert.match(sw,/fc-wordmark-3x\.png/);
console.log('V9.66.5 static wordmark asset regression ok');

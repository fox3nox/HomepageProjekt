import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync(new URL('../sharp-header-v9643.css',import.meta.url),'utf8');
assert.match(css,/\.fc9-topbar\s*\{[\s\S]*position:relative!important;/,'mobile header must not use sticky compositing');
assert.match(css,/top:auto!important/,'sticky top offset must be neutralized');
assert.match(css,/-webkit-font-smoothing:auto!important/,'use native iOS font rasterization');
assert.match(css,/text-rendering:auto!important/,'avoid forced geometric text rendering');
assert.doesNotMatch(css,/-webkit-font-smoothing:antialiased/,'do not force grayscale antialiasing on header text');
console.log('ok sharp header V9.64.5');

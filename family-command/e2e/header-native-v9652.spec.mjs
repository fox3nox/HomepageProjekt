import fs from 'node:fs';
import assert from 'node:assert/strict';

const css=fs.readFileSync(new URL('../header-native-v9652.css',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

assert.match(css,/\.fc9-topbar\{all:revert!important/,'header root must reset legacy cascade');
assert.match(css,/backdrop-filter:none!important/,'header must not use backdrop blur');
assert.match(css,/transform:none!important/,'header must not be transformed/composited');
assert.match(css,/font-synthesis:none!important/,'header text must avoid synthetic font weights');
assert.match(css,/header-logo-v9646\.svg/,'selected clean app logo must remain wired');
assert.match(loader,/finalCss\('header-native-v9652\.css','fc9652native'\)/,'native header must be appended as final CSS layer');
assert.ok(loader.indexOf("finalCss('header-native-v9652.css'")>loader.indexOf("finalCss('sharp-header-v9643.css'"),'native header must load after legacy sharp-header layer');
assert.match(loader,/fcNativeHeader='v9652'/,'runtime marker must expose native header version');
assert.match(sw,/header-native-v9652\.css/,'native header must be available offline');
console.log('V9.65.2 native header regression: OK');

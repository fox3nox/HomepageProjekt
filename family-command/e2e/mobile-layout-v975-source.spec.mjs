import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../mobile-layout-v975.css',import.meta.url),'utf8');
const loader=await readFile(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
for(const contract of [
  '#today .fc38-task',
  'display:flex!important',
  '#today .fc38-taskcopy',
  'word-break:normal!important',
  '#tomorrow .fc674-tomorrow-children .fc9-person',
  'height:auto!important',
  'max-height:none!important',
  '.fc674-inline-pack',
  'scroll-padding-bottom:34px!important'
])assert.ok(css.includes(contract),`missing V9.75 mobile layout contract: ${contract}`);
assert.ok(loader.includes("finalCss('mobile-layout-v975.css','fc975mobilelayout')"),'V9.75 mobile layout must load after legacy layers');
assert.ok(loader.includes("fcMobileLayout='v975'"),'V9.75 mobile layout marker missing');
console.log('V9.75 mobile layout source regression: ok');

import fs from 'node:fs';
const loader=fs.readFileSync(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../header-crisp-v9654.css',import.meta.url),'utf8');
if(!loader.includes("finalCss('header-crisp-v9654.css','fc9654crisp')"))throw new Error('V9.65.8 crisp header stylesheet is not loaded last');
for(const token of [
  'filter:none!important',
  'transform:none!important',
  '-webkit-font-smoothing:auto!important',
  'text-rendering:auto!important',
  'font-size:19px!important',
  'line-height:20px!important',
  'font-weight:800!important',
  'color:#071d4f!important',
  'overflow:visible!important',
  'text-overflow:clip!important'
])if(!css.includes(token))throw new Error(`missing native crisp/title guard: ${token}`);
for(const forbidden of ['-webkit-font-smoothing:antialiased!important','text-rendering:geometricPrecision!important'])if(css.includes(forbidden))throw new Error(`forced soft rendering must be removed: ${forbidden}`);
console.log('V9.65.8 strong native header title regression ok');

import fs from 'node:fs';
const loader=fs.readFileSync(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../header-crisp-v9654.css',import.meta.url),'utf8');
if(!loader.includes("finalCss('header-crisp-v9654.css','fc9654crisp')"))throw new Error('V9.65.9 crisp header stylesheet is not loaded last');
for(const token of [
  'filter:none!important',
  'transform:none!important',
  '-webkit-font-smoothing:auto!important',
  'text-rendering:auto!important',
  'font-size:20px!important',
  'line-height:21px!important',
  'font-weight:700!important',
  'color:#061a47!important',
  '-webkit-text-stroke:.3px #061a47!important',
  'paint-order:stroke fill!important',
  'letter-spacing:0!important',
  'overflow:visible!important',
  'text-overflow:clip!important'
])if(!css.includes(token))throw new Error(`missing hardened title guard: ${token}`);
for(const forbidden of ['-webkit-font-smoothing:antialiased!important','text-rendering:geometricPrecision!important','font-weight:800!important','letter-spacing:-.15px!important'])if(css.includes(forbidden))throw new Error(`soft/synthetic title rendering must be removed: ${forbidden}`);
console.log('V9.65.9 hardened native header title regression ok');

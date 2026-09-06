import fs from 'node:fs';
const loader=fs.readFileSync(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../header-crisp-v9654.css',import.meta.url),'utf8');
if(!loader.includes("finalCss('header-crisp-v9654.css','fc9654crisp')"))throw new Error('V9.65.4 crisp header stylesheet is not loaded last');
for(const token of ['filter:none!important','transform:none!important','-webkit-font-smoothing:antialiased!important','text-rendering:geometricPrecision!important'])if(!css.includes(token))throw new Error(`missing crisp guard: ${token}`);
console.log('V9.65.4 header crisp regression ok');

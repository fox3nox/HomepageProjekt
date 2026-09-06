import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const base='https://example.test/HomepageProjekt/family-command/';
const links=[
  {rel:'stylesheet',href:base+'v9-global-polish.css?v=20260904-v9617',dataset:{}},
  {rel:'stylesheet',href:base+'v9-unified-design-v958.css?v=20260904-v9617',dataset:{}},
  {rel:'stylesheet',href:base+'v9-final-unity-v9618.css?v=20260904-v9617',dataset:{}},
  {rel:'stylesheet',href:base+'v9-design-system-v9619.css?v=20260904-v9617',dataset:{}},
  {rel:'stylesheet',href:base+'v9-layout-final-v9622.css?v=20260904-v9617',dataset:{}},
  {rel:'stylesheet',href:base+'sharp-header-v9643.css?v=20260904-v9617',dataset:{}},
  {rel:'stylesheet',href:base+'header-native-v9652.css?v=20260904-v9617',dataset:{}}
];
const scripts=[];
const documentElement={dataset:{}};
const document={
  readyState:'complete',
  documentElement,
  querySelector(selector){
    const m=selector.match(/^script\[data-([^\]]+)\]$/);
    return m?scripts.find(s=>s.dataset?.[m[1]])||null:null;
  },
  querySelectorAll(selector){return selector==='link[rel="stylesheet"]'?links:[]},
  createElement(tag){return {tagName:String(tag).toUpperCase(),dataset:{},rel:'',href:'',src:'',async:true}},
  head:{appendChild(node){const i=links.indexOf(node);if(i>=0)links.splice(i,1);links.push(node);return node}},
  body:{appendChild(node){scripts.push(node);return node}},
  addEventListener(){throw new Error('DOMContentLoaded listener must not be needed when readyState=complete')}
};
const window={};
const location={href:base,hostname:'example.test'};
vm.runInNewContext(source,{window,document,location,URL,console});

const byFile=file=>links.filter(l=>new URL(l.href,base).pathname.endsWith('/'+file));
assert.equal(byFile('v9-global-polish.css').length,1,'existing stylesheet must be reused instead of duplicated');
assert.equal(byFile('v9-global-polish.css')[0].dataset.fc44,'1','reused stylesheet must receive loader marker');
assert.equal(byFile('v9-unified-design-v958.css').length,1);
assert.equal(byFile('v9-final-unity-v9618.css').length,1);
assert.equal(byFile('v9-design-system-v9619.css').length,1);
assert.equal(byFile('v9-layout-final-v9622.css').length,1);
assert.equal(byFile('sharp-header-v9643.css').length,1);
assert.equal(byFile('header-native-v9652.css').length,1);
assert.equal(byFile('header-structure-v9654.css').length,1);
assert.equal(byFile('header-crisp-v9654.css').length,1);
assert.deepEqual(links.slice(-8).map(l=>new URL(l.href,base).pathname.split('/').pop()),[
  'v9-unified-design-v958.css','v9-final-unity-v9618.css','v9-design-system-v9619.css','v9-layout-final-v9622.css','sharp-header-v9643.css','header-native-v9652.css','header-structure-v9654.css','header-crisp-v9654.css'
],'crisp header guard must be the final cascade layer after deterministic header structure');
assert.equal(documentElement.dataset.fcDesignSystem,'v9619');
assert.equal(documentElement.dataset.fcFinalLayout,'v9622');
assert.equal(documentElement.dataset.fcSharpHeader,'v9644');
assert.equal(documentElement.dataset.fcNativeHeader,'v9652');
assert.equal(documentElement.dataset.fcHeaderStructure,'v9654');
assert.equal(documentElement.dataset.fcHeaderCrisp,'v9654');
assert.match(source,/20260903-v9520/,'loader must keep the established compatible asset version');
assert.equal(scripts.filter(s=>String(s.src).includes('header-structure-v9654.js')).length,1,'header structure runtime must be loaded exactly once');
console.log('ok reference loader dedupe V9.65.4');

// All existing header links, including reused ones, must leave the old HTTP cache.
for(const file of ['sharp-header-v9643.css','header-native-v9652.css','header-structure-v9654.css','header-crisp-v9654.css'])assert.equal(new URL(byFile(file)[0].href,base).searchParams.get('v'),'20260906-v9656',file);
assert.equal(new URL(scripts.find(s=>s.src.includes('header-structure-v9654.js')).src,base).searchParams.get('v'),'20260906-v9656');
assert.equal(documentElement.dataset.fcHeaderRelease,'v9656');

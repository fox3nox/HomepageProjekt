import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
function runtime(fail=''){
 const stores=new Map([['family-command-previous',new Map([['/index.html','previous complete release']])]]),listeners={},calls=[];
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {async put(key,value){store.set(key,value)},async match(key){return store.get(key)}}},async keys(){return [...stores.keys()]},async delete(name){return stores.delete(name)}};
 const self={location:{href:'https://example.test/sw.js',origin:'https://example.test'},addEventListener(name,fn){listeners[name]=fn},async skipWaiting(){calls.push('skipWaiting')},clients:{async claim(){calls.push('claim')}}};
 const ctx=vm.createContext({self,caches,URL,Response,fetch:async path=>new Response(path,{status:String(path).includes(fail)&&fail?503:200})});vm.runInContext(source,ctx);
 const dispatch=event=>new Promise((resolve,reject)=>listeners[event]({waitUntil:promise=>promise.then(resolve,reject)}));
 return {stores,calls,dispatch,core:[...vm.runInContext('CORE',ctx)],cache:vm.runInContext('CACHE',ctx)};
}
test('every managed boot and reference asset belongs to the offline release',()=>{
 const {core}=runtime(),required=new Set();
 for(const file of ['index.html','reference-mobile-v35.js'])for(const [,name] of readFileSync(new URL('../'+file,import.meta.url),'utf8').matchAll(/'([a-z0-9-]+\.(?:js|css))'/g))required.add('./'+name);
 // Private rules are authenticated code in the existing private local cache.
 required.delete('./family-command-private-config.js');
 assert.deepEqual([...required].filter(path=>!core.includes(path)),[]);
 assert.equal(core.length,new Set(core).size,'no duplicate offline downloads');
});
test('failed required asset cannot activate a partial release or remove the previous cache',async()=>{
 const r=runtime('priority-person-v979.js');await assert.rejects(r.dispatch('install'),/Incomplete offline release/);
 assert.deepEqual([...r.stores.keys()],['family-command-previous']);assert.deepEqual(r.calls,[]);
});
test('complete release caches all required files before activation removes previous release',async()=>{
 const r=runtime();await r.dispatch('install');assert.equal(r.stores.get(r.cache).size,r.core.length);
 assert.deepEqual(r.calls,['skipWaiting']);assert.ok(r.stores.has('family-command-previous'));
 await r.dispatch('activate');assert.deepEqual([...r.stores.keys()],[r.cache]);assert.deepEqual(r.calls,['skipWaiting','claim']);
});

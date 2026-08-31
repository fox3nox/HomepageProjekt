import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const store=new Map([
  ['fc-private-access-v1','test'],
  ['fc-chat-todos-v2',JSON.stringify([{id:'todo-chat-af182519-2680',sourceCommandId:'af182519-2680-43ae-a6e0-b931b1483ee7',clientRef:'chat-2026-08-28-fruchtfliegenfalle-landi-bezahlt-v2',title:'Fruchtfliegenfalle',date:'2026-08-29'}])]
]);
globalThis.window=globalThis;
globalThis.data={todos:[],_syncDeleted:{todos:{'af182519-2680-43ae-a6e0-b931b1483ee7':'2026-08-31T18:00:00Z','chat-2026-08-28-fruchtfliegenfalle-landi-bezahlt-v2':'2026-08-31T18:00:00Z'}}};
globalThis.document={cookie:'',visibilityState:'visible',addEventListener(){}};
globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};
globalThis.save=()=>{};
globalThis.addEventListener=()=>{};
globalThis.fetch=async (_url,init={})=>({ok:true,json:async()=>init.method==='POST'?{ok:true}:{ok:true,commands:[{id:'af182519-2680-43ae-a6e0-b931b1483ee7',command_type:'todo_add',client_ref:'chat-2026-08-28-fruchtfliegenfalle-landi-bezahlt-v2',created_at:'2026-08-28T16:44:59Z',payload:{date:'2026-08-29',title:'Fruchtfliegenfalle',section:'day',priority:true}}]}});
vm.runInThisContext(fs.readFileSync(new URL('../chat-command-sync.js',import.meta.url),'utf8'),{filename:'chat-command-sync.js'});
await new Promise(r=>setTimeout(r,30));
assert.equal(data.todos.length,0,'tombstoned chat todo must not be recreated');
assert.equal(JSON.parse(store.get('fc-chat-todos-v2')||'[]').length,0,'tombstoned cached todo must be purged');
await window.__fcChatCommandSync.sync();
assert.equal(data.todos.length,0,'server replay must still be ignored');
console.log('chat-command deletion resurrection regression: OK');
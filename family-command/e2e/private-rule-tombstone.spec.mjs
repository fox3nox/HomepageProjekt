import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const deletedTodo={
  id:'todo-landi-fruchtfliege-20260829',
  clientRef:'chat-2026-08-28-fruchtfliegenfalle-landi-bezahlt-v2',
  sourceCommandId:'af182519-2680-43ae-a6e0-b931b1483ee7',
  title:'deleted todo',date:'2026-08-29',done:false
};

globalThis.window=globalThis;
globalThis.data={
  todos:[{...deletedTodo}],
  events:[],
  _syncDeleted:{todos:{
    'todo-landi-fruchtfliege-20260829':'2026-08-31T17:57:22Z',
    'chat-2026-08-28-fruchtfliegenfalle-landi-bezahlt-v2':'2026-08-31T17:57:22Z',
    'af182519-2680-43ae-a6e0-b931b1483ee7':'2026-08-31T17:57:22Z'
  }}
};
let saves=0;
globalThis.save=()=>{saves++};
window.FC_PRIVATE_RULES={version:'old-cached-rule',mutations:[
  {op:'upsert',collection:'todos',matchAny:[{id:deletedTodo.id},{clientRef:deletedTodo.clientRef},{sourceCommandId:deletedTodo.sourceCommandId}],value:{...deletedTodo}},
  {op:'upsert',collection:'events',matchAny:[{id:'safe-event'}],value:{id:'safe-event',title:'Allowed event',date:'2026-09-01',time:'13:40'}}
]};

const code=readFileSync('family-command/v9-data.js','utf8');
Function(code)();

assert.equal(window.__fcV9Data?.tombstoneGuard,true,'V9 data must expose tombstone guard health');
assert.equal(data.todos.length,0,'a tombstoned todo must be purged and must not be recreated by an old cached private upsert');
assert.equal(data.events.length,1,'unrelated private rules must still apply');
assert.equal(data.events[0].id,'safe-event');
assert.equal(saves,1,'cleanup and valid mutations should persist once');

console.log('private rule tombstone regression: ok');

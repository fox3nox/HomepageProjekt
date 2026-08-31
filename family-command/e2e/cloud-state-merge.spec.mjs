import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const store=new Map([['fc-private-access-v1','test']]);
globalThis.window=globalThis;
globalThis.location={hostname:'localhost'};
globalThis.document={cookie:'',addEventListener(){},querySelector(){return null}};
globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};
globalThis.data={people:[],events:[],todos:[],homework:[],schedules:{},common:{}};
globalThis.save=()=>{};
vm.runInThisContext(fs.readFileSync(new URL('../cloud-state.js',import.meta.url),'utf8'),{filename:'cloud-state.js'});

const merge=(base,remote,local)=>window.__fcCloudState.mergeStates(remote,local,base);
const shell=x=>({people:[],events:[],todos:[],homework:[],reminders:[],pendencies:[],schedules:{},common:{},...x});

// Independent edits to different fields of the same event must both survive.
{
  const base=shell({events:[{id:'e1',title:'Elternabend',note:'Alt',date:'2026-09-01'}]});
  const remote=shell({events:[{id:'e1',title:'Elternabend neu',note:'Alt',date:'2026-09-01'}]});
  const local=shell({events:[{id:'e1',title:'Elternabend',note:'Mit Unterlagen',date:'2026-09-01'}]});
  const out=merge(base,remote,local).events[0];
  assert.equal(out.title,'Elternabend neu');
  assert.equal(out.note,'Mit Unterlagen');
}

// A true same-field conflict is resolved in favour of canonical cloud state.
{
  const base=shell({events:[{id:'e1',title:'A'}]});
  const remote=shell({events:[{id:'e1',title:'B'}]});
  const local=shell({events:[{id:'e1',title:'C'}]});
  assert.equal(merge(base,remote,local).events[0].title,'B');
}

// Completion is monotonic even when another device edits another todo field.
{
  const base=shell({todos:[{id:'t1',title:'Mitnehmen',done:false}]});
  const remote=shell({todos:[{id:'t1',title:'Mitnehmen heute',done:false}]});
  const local=shell({todos:[{id:'t1',title:'Mitnehmen',done:true,completedAt:'2026-08-31T06:00:00Z'}]});
  const out=merge(base,remote,local).todos[0];
  assert.equal(out.title,'Mitnehmen heute');
  assert.equal(out.done,true);
  assert.equal(out.completedAt,'2026-08-31T06:00:00Z');
}

// Schedule edits to different fields of the same slot must merge instead of replacing the whole schedule.
{
  const base=shell({schedules:{fynn:{1:[{start:'08:20',end:'11:50',label:'Schule',depart:'07:55'}]}}});
  const remote=shell({schedules:{fynn:{1:[{start:'08:20',end:'11:50',label:'Sport',depart:'07:55'}]}}});
  const local=shell({schedules:{fynn:{1:[{start:'08:20',end:'11:50',label:'Schule',depart:'07:50'}]}}});
  const slot=merge(base,remote,local).schedules.fynn[1][0];
  assert.equal(slot.label,'Sport');
  assert.equal(slot.depart,'07:50');
}

// A deletion on one device wins when the other side left the base record unchanged.
{
  const base=shell({events:[{id:'delete-me',title:'Alt'}]});
  const remote=shell({events:[{id:'delete-me',title:'Alt'}]});
  const local=shell({events:[]});
  assert.equal(merge(base,remote,local).events.length,0);
}

console.log('V9.19 three-way cloud merge regression: OK');

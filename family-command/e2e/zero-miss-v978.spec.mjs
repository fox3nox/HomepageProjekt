import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const js=await readFile(new URL('../zero-miss-v978.js',import.meta.url),'utf8');
const css=await readFile(new URL('../zero-miss-v978.css',import.meta.url),'utf8');
const loader=await readFile(new URL('../reference-mobile-v35.js',import.meta.url),'utf8');
const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
const data={
 people:[{id:'jayden',name:'Jayden'},{id:'fynn',name:'Fynn'},{id:'oli',name:'Oli'}],
 events:[
  {id:'bike',title:'Praktisches Fahrradfahren',date:'2026-09-08',personIds:['jayden']},
  {id:'call',title:'Freiwilliges Telefongespräch',date:'2026-09-08',time:'10:00',personIds:['fynn']},
  {id:'doctor',title:'Psychiatrisches Ambulatorium',date:'2026-09-08',time:'14:30',personIds:['oli']},
  {id:'old',title:'Alter Termin',date:'2026-09-08',time:'07:00',personIds:['oli']}
 ],
 todos:[{id:'todo',title:'Noch offen',date:'2026-09-07',done:false}],homework:[],
 pendencies:[
  {id:'rebi',title:'Rebi schuldet mir CHF 10',amount:10,currency:'CHF',done:false},
  {id:'jayden-debt',title:'Jayden schuldet mir CHF 10',amount:10,currency:'CHF',done:false}
 ]
};
const noop=()=>{};
const sandbox={window:{__fcV9:{eventIsPast:e=>e.id==='old'}},document:{readyState:'loading',addEventListener:noop},addEventListener:noop,setTimeout:noop,clearTimeout:noop,data,todayISO:()=> '2026-09-08'};sandbox.window.window=sandbox.window;vm.createContext(sandbox);vm.runInContext(js,sandbox);
const api=sandbox.window.__fcZeroMissV978API;
assert.ok(api,'zero-miss API must install');
assert.deepEqual([...api.events().map(x=>x.id)],['call','doctor','bike'],'remaining today events must include timed and all-day family information and exclude past events');
assert.deepEqual([...api.pendencies().map(x=>x.id)],['rebi','jayden-debt'],'all open pendencies must remain visible');
assert.equal(api.work().length,1,'overdue unfinished work must remain part of the daily state');
assert.match(js,/HEUTE UNBEDINGT WISSEN/);
assert.match(js,/BLEIBT OFFEN, BIS ERLEDIGT/);
assert.match(await readFile(new URL('../reference-dashboard-v36.js',import.meta.url),'utf8'),/fc978-child-events/,'the canonical renderer includes child events without a second DOM scan');
assert.match(css,/fc978-pendency/);
assert.match(loader,/zero-miss-v978\.css/);
assert.match(loader,/zero-miss-v978\.js/);
assert.doesNotMatch(loader,/today-glance-v976/,'duplicate V9.76 glance renderer must no longer load');
assert.match(sw,/family-command-v118/);
assert.match(sw,/zero-miss-v978\.css/);
assert.match(sw,/zero-miss-v978\.js/);
assert.doesNotMatch(sw,/today-glance-v976/,'retired duplicate glance must not be precached');
assert.match(index,/20260908-v9800/,'boot must invalidate the previous mobile loader cache');
console.log('V9.78 zero-miss dashboard regression: ok');

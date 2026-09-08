import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const data={people:[{id:'jayden',name:'Jayden'},{id:'fynn',name:'Fynn'},{id:'oli',name:'Oli'}],events:[
{id:'bike',title:'Praktisches Fahrradfahren',date:'2026-09-08',personIds:['jayden']},
{id:'call',title:'Freiwilliges Telefongespräch',date:'2026-09-08',time:'10:00',personIds:['fynn']},
{id:'doctor',title:'Psychiatrisches Ambulatorium',date:'2026-09-08',time:'09:00',personIds:['oli']},
{id:'old',title:'Alter Termin',date:'2026-09-08',time:'07:00',personIds:['oli']}
]};
const noop=()=>{};const sandbox={window:{__fcV9:{eventIsPast:e=>e.id==='old'}},document:{readyState:'loading',addEventListener:noop},MutationObserver:class{observe(){}},setTimeout:noop,clearTimeout:noop,data,todayISO:()=> '2026-09-08',eventsOn:()=>data.events};sandbox.window.window=sandbox.window;vm.createContext(sandbox);vm.runInContext(await readFile(new URL('../today-glance-v976.js',import.meta.url),'utf8'),sandbox);const ids=sandbox.window.__fcTodayGlanceV976.importantEvents().map(e=>e.id);assert.deepEqual([...ids],['bike','call','doctor']);console.log('today glance important events: ok');

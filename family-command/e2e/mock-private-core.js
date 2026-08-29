/* Deterministic private-core mock for Family Command V9 browser tests */
const STORE='fc-e2e-state';
let data={version:1,people:[
{id:'oli',name:'Oli',role:'Elternteil',color:'#263a67',teachers:[],notes:[]},
{id:'jayden',name:'Jayden',role:'Kind',school:'Schule',color:'#3478f6',teachers:[],notes:[]},
{id:'fynn',name:'Fynn',role:'Kind',school:'Schule',color:'#d97914',teachers:[],notes:[]},
{id:'eliyah',name:'Eliyah',role:'Kindergarten',school:'Kindergarten',color:'#16a477',teachers:[],notes:[]}
],schedules:{jayden:{5:[{start:'08:20',end:'11:50',depart:'07:55',label:'Schule'}]},fynn:{5:[{start:'08:20',end:'11:50',depart:'07:55',label:'Schule'}]},eliyah:{5:[{start:'08:20',end:'11:50',depart:'08:10',label:'Kindergarten'}]}},reminders:[],events:[
{id:'coffee',personIds:['oli'],title:'Kaffee bei Tanja',date:'2026-08-27',time:'08:20',end:'',note:'Kurzer Kaffee.'},
{id:'srk',personIds:['oli'],title:'SRK Betreuung – Frau Roth Nicole',date:'2026-08-29',time:'07:20',end:'17:15',note:'SRK Kinderbetreuung zu Hause.'},
{id:'visit',personIds:['jayden'],title:'Besuchswoche',date:'2026-08-31',endDate:'2026-09-04',time:'',end:'',note:'Eltern dürfen den Unterricht besuchen.'}
],todos:[],homework:[{id:'hw1',personId:'jayden',dueDate:'2026-08-31',subject:'Mathe',title:'Seite 42',note:'Heft mitnehmen',done:false}],pendencies:[{id:'pend1',personId:'oli',title:'Klassenfotos',amount:31.8,currency:'CHF',note:'Noch offen',done:false}],common:{school:{name:'Schulverwaltung',address:'Herzogenbuchsee',phone:'062 000 00 00'},care:[]}};
function save(){localStorage.setItem(STORE,JSON.stringify(data))}
function person(id){return data.people.find(p=>p.id===id)}
function todayISO(){return '2026-08-28'}
function scheduleFor(id,day){return data.schedules?.[id]?.[day]||[]}
function remindersFor(day){return data.reminders.filter(r=>(r.days||[]).includes(day))}
function eventsOn(date){return data.events.filter(e=>e.date===date||(e.endDate&&e.date<=date&&e.endDate>=date)).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))}
function schoolBreakFor(){return null}
function syncPush(){return Promise.resolve()}
function toast(t){let e=document.getElementById('toast');if(!e){e=document.createElement('div');e.id='toast';document.body.appendChild(e)}e.textContent=t}
function exportData(){}
function pushSnapshot(){return{people:data.people,events:data.events,tasks:[],rules:[]}}

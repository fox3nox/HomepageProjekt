/* Familienzentrale V9.5 · minimal generic runtime · no private UI bundle */
'use strict';

const APP_VERSION='2026-08-30-family-v5';
const STORE='family-command-personal-v4';
const DID='fc-push-device-v2',DTOK='fc-push-token-v2';
let swreg=null;

function clone(v){return JSON.parse(JSON.stringify(v))}
function emptyState(){return{version:APP_VERSION,people:[],schedules:{},reminders:[],events:[],todos:[],homework:[],pendencies:[],common:{school:{},care:[]}}}
function validState(v){return !!v&&typeof v==='object'&&!Array.isArray(v)&&Array.isArray(v.people)&&Array.isArray(v.events)&&v.schedules&&typeof v.schedules==='object'}
function load(){try{const v=JSON.parse(localStorage.getItem(STORE)||'null');if(validState(v)){v.version=APP_VERSION;return v}}catch(e){}const v=emptyState();try{localStorage.setItem(STORE,JSON.stringify(v))}catch(e){}return v}
var data=load();

function save(){data.version=APP_VERSION;try{localStorage.setItem(STORE,JSON.stringify(data))}catch(e){console.error('fc_local_save',e)}try{if(typeof syncPush==='function')syncPush()}catch(e){}return data}
function person(id){return(data.people||[]).find(p=>String(p.id)===String(id))||null}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function todayISO(){if((location.hostname==='localhost'||location.hostname==='127.0.0.1')&&new URLSearchParams(location.search).get('access')==='test')return'2026-08-28';return iso(new Date())}
function fmtDate(s,o={}){if(!s)return'';try{return new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:o.year?'numeric':undefined,weekday:o.weekday?'short':undefined}).format(new Date(String(s)+'T12:00:00'))}catch(e){return String(s)}}
function scheduleFor(id,day){return data.schedules?.[id]?.[day]||[]}
function remindersFor(day){return(data.reminders||[]).filter(r=>(r.days||[]).map(Number).includes(Number(day)))}
function eventsOn(date){return(data.events||[]).filter(e=>String(e.date)===String(date)||(e.endDate&&String(e.date)<=String(date)&&String(e.endDate)>=String(date))).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')))}
function schoolBreakFor(id,date){return(data.events||[]).find(e=>(e.personIds||[]).map(String).includes(String(id))&&/(ferien|osterwochenende|auffahrt|pfingsten)/i.test(String(e.title||''))&&String(e.date||'')<=String(date)&&String(e.endDate||e.date||'')>=String(date))||null}
function toast(text){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=String(text||'');el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),1800)}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`familienzentrale-${todayISO()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0)}

function b64(a){return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomToken(n){const a=new Uint8Array(n);crypto.getRandomValues(a);return b64(a)}
function device(){let id='',token='';try{id=localStorage.getItem(DID)||'';token=localStorage.getItem(DTOK)||''}catch(e){}if(!id){id=crypto.randomUUID?.()||randomToken(18);try{localStorage.setItem(DID,id)}catch(e){}}if(!token){token=randomToken(32);try{localStorage.setItem(DTOK,token)}catch(e){}}return{id,token}}
function key(s){const p='='.repeat((4-String(s).length%4)%4),raw=atob((String(s)+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
function isIOS(){return/iphone|ipad|ipod/i.test(navigator.userAgent)}
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
async function reg(){if(swreg)return swreg;if(!('serviceWorker'in navigator))throw new Error('Service Worker nicht unterstützt');swreg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});await navigator.serviceWorker.ready;return swreg}
async function pushSub(){return(await reg()).pushManager.getSubscription()}
function setPushStatus(t){const e=document.getElementById('pushStatus');if(e)e.textContent=String(t||'')}
async function syncPush(){return false}

function reminderTasks(daysAhead=180){const out=[],start=new Date();start.setHours(12,0,0,0);for(let i=0;i<daysAhead;i++){const d=new Date(start);d.setDate(start.getDate()+i);const day=d.getDay(),date=iso(d);for(const r of(data.reminders||[])){if(!(r.days||[]).map(Number).includes(day))continue;for(const item of(r.items||[]))out.push({id:`rem-${r.id}-${date}-${item}`,personId:r.personId,title:`${person(r.personId)?.name||'Person'}: ${item}`,date,note:'Morgen-Check',done:false})}}return out}
function homeworkTasks(){return(data.homework||[]).map(h=>({id:`hw-${h.id}`,personId:h.personId,title:`HAUSAUFGABE: ${[h.subject,h.title].filter(Boolean).join(' · ')}`,date:h.dueDate,note:h.note||'',done:!!h.done}))}
function todoTasks(){return(data.todos||[]).filter(t=>!t.archived).map(t=>({id:`todo-${t.id||t.clientRef||t.sourceCommandId}`,personId:t.personId||'',title:t.title||'To-do',date:t.date||'',note:t.note||'',done:!!t.done}))}
function pushSnapshot(){const rules=[];for(const[pid,days]of Object.entries(data.schedules||{}))for(const[day,slots]of Object.entries(days||{}))for(const s of(Array.isArray(slots)?slots:[]))rules.push({id:`${pid}-${day}-${s.start||''}`,personId:pid,title:s.label||'',day:Number(day),time:s.depart||s.start||'',start:s.start||'',end:s.end||'',note:s.note||''});return{people:(data.people||[]).map(p=>({id:p.id,name:p.name,color:p.color})),settings:{travel:0,prep:0,pickup:0,evening:'19:00'},events:(data.events||[]).map(e=>({id:e.id,personId:(e.personIds||[]).join(','),title:e.title,date:e.date,endDate:e.endDate||'',time:e.time||'',end:e.end||'',note:e.note||'',reminderLead:Number.isFinite(Number(e.reminderLead))?Number(e.reminderLead):0})),tasks:[...reminderTasks(),...homeworkTasks(),...todoTasks()],rules}}

window.__fcCoreRuntime={version:'1.0.0',store:STORE,validState,emptyState,health:()=>({version:'1.0.0',people:(data.people||[]).length,events:(data.events||[]).length,todos:(data.todos||[]).length,legacyBundle:false})};

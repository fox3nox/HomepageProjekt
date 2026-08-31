/* Familienzentrale V9.26 · canonical Supabase state + three-way offline merge + durable delete tombstones + visible sync status */
(()=>{
'use strict';
if(window.__fcCloudStateInstalled)return;
window.__fcCloudStateInstalled=true;

const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-state-v2';
const ACCESS='fc-private-access-v1',DEVICE='fc-cloud-device-v1',DELETED='_syncDeleted';
const SYNC_ARRAYS=['people','events','todos','homework','reminders','pendencies'];
const LOCAL_TEST=location.hostname==='127.0.0.1'||location.hostname==='localhost';
let revision=0,busy=false,pending=false,timer=0,status='idle',lastError='',lastSync=0,baseState=null,lastConflictCount=0,uiRetry=0,lastObservedState=null;
const rawSave=typeof save==='function'?save:(typeof window.save==='function'?window.save:null);

function clone(v){if(v===undefined)return undefined;return JSON.parse(JSON.stringify(v))}
function eq(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(_){return a===b}}
function plain(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function accessKey(){try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.slice('fc_private_access='.length))}catch(_){}try{return localStorage.getItem(ACCESS)||''}catch(_){return''}}
function deviceId(){try{let id=localStorage.getItem(DEVICE)||'';if(!id){id='web-'+(crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36));localStorage.setItem(DEVICE,id)}return id}catch(_){return'web-browser'}}
function current(){try{return typeof data!=='undefined'&&data&&typeof data==='object'?data:null}catch(_){return null}}
function valid(s){return !!s&&typeof s==='object'&&!Array.isArray(s)&&Array.isArray(s.people)&&Array.isArray(s.events)&&s.schedules&&typeof s.schedules==='object'}
function replaceState(next){const cur=current();if(!cur||!valid(next))return false;Object.keys(cur).forEach(k=>delete cur[k]);Object.assign(cur,clone(next));lastObservedState=clone(next);try{rawSave?.()}catch(e){console.error('fc_cloud_local_save',e)}return true}
function identities(x){return [...new Set([String(x?.id||''),String(x?.clientRef||''),String(x?.sourceCommandId||'')].filter(Boolean))]}
function sameRecord(a,b){const aa=new Set(identities(a));return identities(b).some(k=>aa.has(k))}
function completed(x){return !!x?.done||!!String(x?.completedAt||'').trim()}
function deletedMap(s,kind){return plain(s?.[DELETED]?.[kind])?s[DELETED][kind]:{}}
function isDeletedBy(state,kind,record){return identities(record).some(id=>deletedMap(state,kind)[id])}
function preserveDeletionHistory(previous,next){
  if(!plain(previous)||!plain(next))return next;
  const oldRoot=plain(previous[DELETED])?previous[DELETED]:{};
  if(!plain(next[DELETED]))next[DELETED]={};
  for(const [kind,map] of Object.entries(oldRoot)){
    if(!plain(map))continue;
    next[DELETED][kind]={...map,...(plain(next[DELETED][kind])?next[DELETED][kind]:{})};
  }
  return next;
}
function applyDeletionMarks(previous,next){
  if(!plain(previous)||!plain(next))return next;
  preserveDeletionHistory(previous,next);
  const now=new Date().toISOString();
  for(const kind of SYNC_ARRAYS){
    const before=Array.isArray(previous[kind])?previous[kind]:[],after=Array.isArray(next[kind])?next[kind]:[];
    if(!plain(next[DELETED][kind]))next[DELETED][kind]={};
    for(const old of before){
      if(after.some(x=>sameRecord(x,old)))continue;
      for(const id of identities(old))next[DELETED][kind][id]=next[DELETED][kind][id]||now;
    }
  }
  return next;
}

function health(){return{version:'2.5.0',status,revision,lastSync,lastError,busy,pending,deviceId:deviceId(),canonical:true,localCache:true,identityMerge:true,completionInvariant:true,threeWayMerge:true,deleteTombstones:true,allIdentityTombstones:true,preservesDeleteHistory:true,canonicalWriteAck:true,lastConflictCount,visibleSyncStatus:true,v9ReadyRecovery:true}}
function statusView(){
  if(status==='syncing'||status==='queued')return{label:'↻ Speichert…',tone:'busy',title:'Änderungen werden mit Supabase synchronisiert.'};
  if(status==='offline-cache')return{label:'⚠ Offline',tone:'offline',title:'Änderungen bleiben lokal gespeichert und werden später erneut synchronisiert.'};
  if(status==='local-only')return{label:'• Lokal',tone:'local',title:'Die App arbeitet derzeit nur mit dem lokalen Stand.'};
  if(status==='synced'||status==='test')return{label:'✓ Gesichert',tone:'ok',title:lastSync?'Zuletzt erfolgreich synchronisiert.':'Mit Supabase verbunden.'};
  return{label:'• Verbinden…',tone:'idle',title:'Synchronisationsstatus wird geprüft.'};
}
function ensureSyncUi(){
  if(typeof document==='undefined'||typeof document.querySelector!=='function')return null;
  const brand=document.querySelector('.fc9-brand');
  if(!brand){if(uiRetry<30){uiRetry++;setTimeout(ensureSyncUi,100)}return null}
  uiRetry=0;
  if(!document.getElementById('fc-cloud-status-style')){const s=document.createElement('style');s.id='fc-cloud-status-style';s.textContent='.fc-cloud-status{display:inline-flex!important;align-items:center;width:max-content;max-width:100%;margin-top:2px!important;padding:1px 5px;border-radius:999px;font-size:8px!important;font-weight:800;line-height:1.45;letter-spacing:.01em;overflow:visible!important;text-overflow:clip!important}.fc-cloud-status[data-tone="ok"]{color:#168b68!important;background:#eaf7f2}.fc-cloud-status[data-tone="busy"]{color:#5268c9!important;background:#eef2ff}.fc-cloud-status[data-tone="offline"]{color:#a34842!important;background:#fff0ee}.fc-cloud-status[data-tone="local"],.fc-cloud-status[data-tone="idle"]{color:#7a8798!important;background:#eef1f5}';document.head.appendChild(s)}
  let el=document.getElementById('fcCloudStatus');if(!el){el=document.createElement('span');el.id='fcCloudStatus';el.className='fc-cloud-status';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('aria-atomic','true');brand.appendChild(el)}return el;
}
function renderSyncUi(){const el=ensureSyncUi();if(!el)return;const v=statusView();el.textContent=v.label;el.dataset.tone=v.tone;el.title=v.title;el.setAttribute('aria-label','Cloud-Status: '+v.label.replace(/[↻⚠✓•]/g,'').trim())}
function renderTransientUiStatus(next){const keep=status;status=next;renderSyncUi();status=keep}
function setStatus(next,error){status=next;if(error!==undefined)lastError=error||'';renderSyncUi();try{window.dispatchEvent?.(new CustomEvent('fc:cloud-status',{detail:health()}))}catch(_){}}

function mergeValue(base,remote,local,path=''){
  if(eq(local,base))return clone(remote);
  if(eq(remote,base))return clone(local);
  if(eq(remote,local))return clone(remote);
  if(plain(base)||plain(remote)||plain(local))return mergeObject(plain(base)?base:{},plain(remote)?remote:{},plain(local)?local:{},path);
  lastConflictCount++;
  return clone(remote);
}
function mergeObject(base={},remote={},local={},path=''){
  const out={},keys=new Set([...Object.keys(base||{}),...Object.keys(remote||{}),...Object.keys(local||{})]);
  for(const k of keys){const v=mergeValue(base?.[k],remote?.[k],local?.[k],path?path+'.'+k:k);if(v!==undefined)out[k]=v}
  return out;
}
function mergeTodoRecord(base,remote,local){const out=mergeObject(base||{},remote||{},local||{},'todos');if(completed(base)||completed(remote)||completed(local)){out.done=true;out.completedAt=String(local?.completedAt||remote?.completedAt||base?.completedAt||out.completedAt||'')}return out}
function mergePresent(base,remote,local,kind){if(!base){if(remote&&local)return kind==='todos'?mergeTodoRecord({},remote,local):mergeObject({},remote,local,kind);return clone(remote||local)}if(!remote&&!local)return null;if(!remote){if(eq(local,base))return null;lastConflictCount++;return clone(local)}if(!local){if(eq(remote,base))return null;lastConflictCount++;return clone(remote)}return kind==='todos'?mergeTodoRecord(base,remote,local):mergeObject(base,remote,local,kind)}
function takeMatch(arr,target,used){for(let i=0;i<arr.length;i++){if(used.has(i))continue;if(sameRecord(arr[i],target)){used.add(i);return arr[i]}}return null}
function mergeArray(base=[],remote=[],local=[],kind=''){base=Array.isArray(base)?base.filter(Boolean):[];remote=Array.isArray(remote)?remote.filter(Boolean):[];local=Array.isArray(local)?local.filter(Boolean):[];const out=[],ur=new Set(),ul=new Set();for(const b of base){const r=takeMatch(remote,b,ur),l=takeMatch(local,b,ul),m=mergePresent(b,r,l,kind);if(m)out.push(m)}for(let i=0;i<remote.length;i++){if(ur.has(i))continue;const r=remote[i],l=takeMatch(local,r,ul),m=mergePresent(null,r,l,kind);if(m)out.push(m)}for(let i=0;i<local.length;i++){if(ul.has(i))continue;out.push(clone(local[i]))}return out}
function slotKey(s){return String(s?.id||`${s?.start||''}|${s?.end||''}`)}
function slotMap(arr){const m=new Map();for(const s of Array.isArray(arr)?arr:[]){if(!s)continue;let k=slotKey(s),n=1;while(m.has(k))k=slotKey(s)+'#'+(++n);m.set(k,s)}return m}
function mergeSlots(base=[],remote=[],local=[]){const b=slotMap(base),r=slotMap(remote),l=slotMap(local),keys=new Set([...b.keys(),...r.keys(),...l.keys()]),out=[];for(const k of keys){const m=mergePresent(b.get(k)||null,r.get(k)||null,l.get(k)||null,'schedule');if(m)out.push(m)}return out.sort((a,z)=>String(a.start||'99:99').localeCompare(String(z.start||'99:99'))||String(a.end||'').localeCompare(String(z.end||'')))}
function mergeSchedules(base={},remote={},local={}){const out={},people=new Set([...Object.keys(base||{}),...Object.keys(remote||{}),...Object.keys(local||{})]);for(const pid of people){const bd=base?.[pid]||{},rd=remote?.[pid]||{},ld=local?.[pid]||{},days=new Set([...Object.keys(bd),...Object.keys(rd),...Object.keys(ld)]),merged={};for(const day of days)merged[day]=mergeSlots(bd?.[day],rd?.[day],ld?.[day]);out[pid]=merged}return out}
function mergeStates(remote,local,base=baseState){
  lastConflictCount=0;base=plain(base)?base:{};
  const out=mergeObject(base,remote||{},local||{},'state');
  out[DELETED]=mergeObject(base?.[DELETED]||{},remote?.[DELETED]||{},local?.[DELETED]||{},DELETED);
  for(const k of SYNC_ARRAYS)out[k]=mergeArray(base?.[k],remote?.[k],local?.[k],k).filter(record=>!isDeletedBy(out,k,record));
  out.schedules=mergeSchedules(base?.schedules,remote?.schedules,local?.schedules);out.common=mergeObject(base?.common||{},remote?.common||{},local?.common||{},'common');return out
}
function notifyRender(){try{window.__fcV9?.invalidate?.(['today','tomorrow','events','homework','more','people'])}catch(_){}try{const screen=window.__fcV9?.state?.screen||document.querySelector('.fc9-screen.active')?.id;if(screen)window.__fcV9?.render?.(screen,true)}catch(_){}}

async function request(method='GET',body=null){const headers=new Headers();headers.set('x-fc-access',accessKey());if(body!==null)headers.set('content-type','application/json');const r=await fetch(BASE,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store'}),j=await r.json().catch(()=>({}));return{r,j}}
async function pull(){const {r,j}=await request();if(!r.ok||!j.ok)throw new Error(j.error||('HTTP '+r.status));return j}
async function write(snapshot,base,attempt=0){
  const {r,j}=await request('POST',{state:snapshot,baseRevision:base,deviceId:deviceId()});
  if(r.ok&&j.ok){
    revision=Number(j.revision||base+1);
    const canonical=valid(j.state)?j.state:snapshot,changed=!eq(canonical,current());
    if(changed){replaceState(canonical);notifyRender()}else lastObservedState=clone(canonical);
    baseState=clone(canonical);lastObservedState=clone(canonical);lastSync=Date.now();setStatus('synced','');return true;
  }
  if(r.status===409&&j.conflict&&valid(j.state)&&attempt<1){revision=Number(j.revision||0);const merged=mergeStates(j.state,snapshot,baseState);replaceState(merged);notifyRender();return write(merged,revision,attempt+1)}
  throw new Error(j.error||('HTTP '+r.status));
}
async function pushNow(reason='save'){
  if(LOCAL_TEST&&accessKey()==='test'){lastSync=Date.now();setStatus('test','');return true}
  const state=current();if(!valid(state)||!accessKey())return false;
  if(busy){pending=true;return false}busy=true;setStatus('syncing');
  try{return await write(clone(state),revision)}catch(e){setStatus('offline-cache',e?.message||String(e));console.error('fc_cloud_push',reason,e);return false}finally{busy=false;if(pending){pending=false;schedule('queued',120)}}
}
function schedule(reason='save',delay=320){
  clearTimeout(timer);
  if(LOCAL_TEST&&accessKey()==='test'){renderTransientUiStatus('queued');timer=setTimeout(()=>pushNow(reason),delay);return}
  if(reason!=='bootstrap-retry'&&status!=='offline-cache')setStatus('queued');
  timer=setTimeout(()=>pushNow(reason),delay);
}
function installSaveWrapper(){if(!rawSave||window.__fcCloudSaveWrapped)return;window.__fcCloudSaveWrapped=true;const wrapped=function(...args){const cur=current();if(cur&&lastObservedState)applyDeletionMarks(lastObservedState,cur);const out=rawSave.apply(this,args);if(cur)lastObservedState=clone(cur);schedule('save');return out};window.save=wrapped;try{save=wrapped}catch(_){}}
async function bootstrap(){
  installSaveWrapper();ensureSyncUi();
  if(LOCAL_TEST&&accessKey()==='test'){revision=1;baseState=clone(current()||{});lastObservedState=clone(current()||{});lastSync=Date.now();setStatus('test','');return{ok:true,test:true,revision}}
  if(!accessKey()||!valid(current())){lastObservedState=clone(current()||{});setStatus('local-only');return{ok:false,reason:'state-or-access-missing'}}
  try{const remote=await pull();revision=Number(remote.revision||0);if(valid(remote.state)){replaceState(remote.state);baseState=clone(remote.state);lastObservedState=clone(remote.state);lastSync=Date.now();setStatus('synced','');return{ok:true,source:'cloud',revision}}lastObservedState=clone(current()||{});const ok=await write(clone(current()),0);return{ok,source:'local-bootstrap',revision}}
  catch(e){lastObservedState=clone(current()||{});setStatus('offline-cache',e?.message||String(e));console.error('fc_cloud_bootstrap',e);schedule('bootstrap-retry',1800);return{ok:false,source:'local-cache',error:lastError}}
}
window.__fcCloudState={version:'2.5.0',bootstrap,pushNow,schedule,health,mergeStates,applyDeletionMarks,preserveDeletionHistory,renderSyncUi,get revision(){return revision}};
if(typeof window.addEventListener==='function'){
  window.addEventListener('online',()=>{if(status==='offline-cache'||status==='local-only')pushNow('online')});
  window.addEventListener('offline',()=>setStatus('offline-cache',lastError||'Keine Netzwerkverbindung.'));
}
if(typeof document!=='undefined'&&typeof document.addEventListener==='function'){
  document.addEventListener('fc:v9-ready',renderSyncUi);
  document.addEventListener('visibilitychange',()=>{renderSyncUi();if(document.visibilityState==='visible'&&status==='offline-cache')pushNow('visibility')});
}
})();

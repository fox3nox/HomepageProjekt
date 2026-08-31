/* Familienzentrale V9.19 · canonical Supabase state + three-way offline merge */
(()=>{
'use strict';
if(window.__fcCloudStateInstalled)return;
window.__fcCloudStateInstalled=true;

const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-state-v2';
const ACCESS='fc-private-access-v1',DEVICE='fc-cloud-device-v1';
const LOCAL_TEST=location.hostname==='127.0.0.1'||location.hostname==='localhost';
let revision=0,busy=false,pending=false,timer=0,status='idle',lastError='',lastSync=0,baseState=null,lastConflictCount=0;
const rawSave=typeof save==='function'?save:(typeof window.save==='function'?window.save:null);

function clone(v){if(v===undefined)return undefined;return JSON.parse(JSON.stringify(v))}
function eq(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(_){return a===b}}
function plain(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function accessKey(){try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.slice('fc_private_access='.length))}catch(_){}try{return localStorage.getItem(ACCESS)||''}catch(_){return''}}
function deviceId(){try{let id=localStorage.getItem(DEVICE)||'';if(!id){id='web-'+(crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36));localStorage.setItem(DEVICE,id)}return id}catch(_){return'web-browser'}}
function current(){try{return typeof data!=='undefined'&&data&&typeof data==='object'?data:null}catch(_){return null}}
function valid(s){return !!s&&typeof s==='object'&&!Array.isArray(s)&&Array.isArray(s.people)&&Array.isArray(s.events)&&s.schedules&&typeof s.schedules==='object'}
function replaceState(next){const cur=current();if(!cur||!valid(next))return false;Object.keys(cur).forEach(k=>delete cur[k]);Object.assign(cur,clone(next));try{rawSave?.()}catch(e){console.error('fc_cloud_local_save',e)}return true}
function identities(x){return [...new Set([String(x?.id||''),String(x?.clientRef||''),String(x?.sourceCommandId||'')].filter(Boolean))]}
function sameRecord(a,b){const aa=new Set(identities(a));return identities(b).some(k=>aa.has(k))}
function completed(x){return !!x?.done||!!String(x?.completedAt||'').trim()}

function mergeValue(base,remote,local,path=''){
  if(eq(local,base))return clone(remote);
  if(eq(remote,base))return clone(local);
  if(eq(remote,local))return clone(remote);
  if(plain(base)||plain(remote)||plain(local))return mergeObject(plain(base)?base:{},plain(remote)?remote:{},plain(local)?local:{},path);
  lastConflictCount++;
  return clone(remote); // true same-field conflict: canonical cloud wins
}
function mergeObject(base={},remote={},local={},path=''){
  const out={},keys=new Set([...Object.keys(base||{}),...Object.keys(remote||{}),...Object.keys(local||{})]);
  for(const k of keys){const v=mergeValue(base?.[k],remote?.[k],local?.[k],path?path+'.'+k:k);if(v!==undefined)out[k]=v}
  return out;
}
function mergeTodoRecord(base,remote,local){
  const out=mergeObject(base||{},remote||{},local||{},'todos');
  if(completed(base)||completed(remote)||completed(local)){
    out.done=true;
    out.completedAt=String(local?.completedAt||remote?.completedAt||base?.completedAt||out.completedAt||'');
  }
  return out;
}
function mergePresent(base,remote,local,kind){
  if(!base){if(remote&&local)return kind==='todos'?mergeTodoRecord({},remote,local):mergeObject({},remote,local,kind);return clone(remote||local)}
  if(!remote&&!local)return null;
  if(!remote){if(eq(local,base))return null;lastConflictCount++;return clone(local)}
  if(!local){if(eq(remote,base))return null;lastConflictCount++;return clone(remote)}
  return kind==='todos'?mergeTodoRecord(base,remote,local):mergeObject(base,remote,local,kind);
}
function takeMatch(arr,target,used){for(let i=0;i<arr.length;i++){if(used.has(i))continue;if(sameRecord(arr[i],target)){used.add(i);return arr[i]}}return null}
function mergeArray(base=[],remote=[],local=[],kind=''){
  base=Array.isArray(base)?base.filter(Boolean):[];remote=Array.isArray(remote)?remote.filter(Boolean):[];local=Array.isArray(local)?local.filter(Boolean):[];
  const out=[],ur=new Set(),ul=new Set();
  for(const b of base){const r=takeMatch(remote,b,ur),l=takeMatch(local,b,ul),m=mergePresent(b,r,l,kind);if(m)out.push(m)}
  for(let i=0;i<remote.length;i++){if(ur.has(i))continue;const r=remote[i],l=takeMatch(local,r,ul),m=mergePresent(null,r,l,kind);if(m)out.push(m)}
  for(let i=0;i<local.length;i++){if(ul.has(i))continue;out.push(clone(local[i]))}
  return out;
}
function slotKey(s){return String(s?.id||`${s?.start||''}|${s?.end||''}`)}
function slotMap(arr){const m=new Map();for(const s of Array.isArray(arr)?arr:[]){if(!s)continue;let k=slotKey(s),n=1;while(m.has(k))k=slotKey(s)+'#'+(++n);m.set(k,s)}return m}
function mergeSlots(base=[],remote=[],local=[]){
  const b=slotMap(base),r=slotMap(remote),l=slotMap(local),keys=new Set([...b.keys(),...r.keys(),...l.keys()]),out=[];
  for(const k of keys){const m=mergePresent(b.get(k)||null,r.get(k)||null,l.get(k)||null,'schedule');if(m)out.push(m)}
  return out.sort((a,z)=>String(a.start||'99:99').localeCompare(String(z.start||'99:99'))||String(a.end||'').localeCompare(String(z.end||'')));
}
function mergeSchedules(base={},remote={},local={}){
  const out={},people=new Set([...Object.keys(base||{}),...Object.keys(remote||{}),...Object.keys(local||{})]);
  for(const pid of people){const bd=base?.[pid]||{},rd=remote?.[pid]||{},ld=local?.[pid]||{},days=new Set([...Object.keys(bd),...Object.keys(rd),...Object.keys(ld)]),merged={};for(const day of days)merged[day]=mergeSlots(bd?.[day],rd?.[day],ld?.[day]);out[pid]=merged}
  return out;
}
function mergeStates(remote,local,base=baseState){
  lastConflictCount=0;base=plain(base)?base:{};
  const out=mergeObject(base,remote||{},local||{},'state');
  for(const k of ['people','events','todos','homework','reminders','pendencies'])out[k]=mergeArray(base?.[k],remote?.[k],local?.[k],k);
  out.schedules=mergeSchedules(base?.schedules,remote?.schedules,local?.schedules);
  out.common=mergeObject(base?.common||{},remote?.common||{},local?.common||{},'common');
  return out;
}
function notifyRender(){try{window.__fcV9?.invalidate?.(['today','tomorrow','events','homework','more','people'])}catch(_){}try{const screen=window.__fcV9?.state?.screen||document.querySelector('.fc9-screen.active')?.id;if(screen)window.__fcV9?.render?.(screen,true)}catch(_){}}

async function request(method='GET',body=null){const headers=new Headers();headers.set('x-fc-access',accessKey());if(body!==null)headers.set('content-type','application/json');const r=await fetch(BASE,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store'}),j=await r.json().catch(()=>({}));return{r,j}}
async function pull(){const {r,j}=await request();if(!r.ok||!j.ok)throw new Error(j.error||('HTTP '+r.status));return j}
async function write(snapshot,base,attempt=0){
  const {r,j}=await request('POST',{state:snapshot,baseRevision:base,deviceId:deviceId()});
  if(r.ok&&j.ok){revision=Number(j.revision||base+1);baseState=clone(snapshot);lastSync=Date.now();status='synced';lastError='';return true}
  if(r.status===409&&j.conflict&&valid(j.state)&&attempt<1){revision=Number(j.revision||0);const merged=mergeStates(j.state,snapshot,baseState);replaceState(merged);notifyRender();return write(merged,revision,attempt+1)}
  throw new Error(j.error||('HTTP '+r.status));
}
async function pushNow(reason='save'){
  if(LOCAL_TEST&&accessKey()==='test'){status='test';lastSync=Date.now();return true}
  const state=current();if(!valid(state)||!accessKey())return false;
  if(busy){pending=true;return false}busy=true;status='syncing';
  try{return await write(clone(state),revision)}catch(e){lastError=e?.message||String(e);status='offline-cache';console.error('fc_cloud_push',reason,e);return false}finally{busy=false;if(pending){pending=false;schedule('queued',120)}}
}
function schedule(reason='save',delay=320){clearTimeout(timer);timer=setTimeout(()=>pushNow(reason),delay)}
function installSaveWrapper(){if(!rawSave||window.__fcCloudSaveWrapped)return;window.__fcCloudSaveWrapped=true;const wrapped=function(...args){const out=rawSave.apply(this,args);schedule('save');return out};window.save=wrapped;try{save=wrapped}catch(_){}}
async function bootstrap(){
  installSaveWrapper();
  if(LOCAL_TEST&&accessKey()==='test'){revision=1;baseState=clone(current()||{});status='test';return{ok:true,test:true,revision}}
  if(!accessKey()||!valid(current())){status='local-only';return{ok:false,reason:'state-or-access-missing'}}
  try{const remote=await pull();revision=Number(remote.revision||0);if(valid(remote.state)){replaceState(remote.state);baseState=clone(remote.state);status='synced';lastSync=Date.now();return{ok:true,source:'cloud',revision}}const ok=await write(clone(current()),0);return{ok,source:'local-bootstrap',revision}}
  catch(e){lastError=e?.message||String(e);status='offline-cache';console.error('fc_cloud_bootstrap',e);schedule('bootstrap-retry',1800);return{ok:false,source:'local-cache',error:lastError}}
}
function health(){return{version:'2.2.0',status,revision,lastSync,lastError,busy,pending,deviceId:deviceId(),canonical:true,localCache:true,identityMerge:true,completionInvariant:true,threeWayMerge:true,lastConflictCount}}
window.__fcCloudState={version:'2.2.0',bootstrap,pushNow,schedule,health,mergeStates,get revision(){return revision}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&status==='offline-cache')pushNow('visibility')});
})();

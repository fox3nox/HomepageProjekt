/* Familienzentrale V9.18 · canonical Supabase state + local offline cache */
(()=>{
'use strict';
if(window.__fcCloudStateInstalled)return;
window.__fcCloudStateInstalled=true;

const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-state-v2';
const ACCESS='fc-private-access-v1',DEVICE='fc-cloud-device-v1';
const LOCAL_TEST=location.hostname==='127.0.0.1'||location.hostname==='localhost';
let revision=0,busy=false,pending=false,timer=0,status='idle',lastError='',lastSync=0,baseState=null;
const rawSave=typeof save==='function'?save:(typeof window.save==='function'?window.save:null);

function clone(v){return JSON.parse(JSON.stringify(v))}
function accessKey(){try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.slice('fc_private_access='.length))}catch(_){}try{return localStorage.getItem(ACCESS)||''}catch(_){return''}}
function deviceId(){try{let id=localStorage.getItem(DEVICE)||'';if(!id){id='web-'+(crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36));localStorage.setItem(DEVICE,id)}return id}catch(_){return'web-browser'}}
function current(){try{return typeof data!=='undefined'&&data&&typeof data==='object'?data:null}catch(_){return null}}
function valid(s){return !!s&&typeof s==='object'&&!Array.isArray(s)&&Array.isArray(s.people)&&Array.isArray(s.events)&&s.schedules&&typeof s.schedules==='object'}
function replaceState(next){const cur=current();if(!cur||!valid(next))return false;Object.keys(cur).forEach(k=>delete cur[k]);Object.assign(cur,clone(next));try{rawSave?.()}catch(e){console.error('fc_cloud_local_save',e)}return true}
function identities(x){const out=[String(x?.id||''),String(x?.clientRef||''),String(x?.sourceCommandId||'')].filter(Boolean);return [...new Set(out)]}
function sameRecord(a,b){const aa=new Set(identities(a));return identities(b).some(k=>aa.has(k))}
function mergeTodo(remote,local){const r=clone(remote||{}),l=clone(local||{}),out={...r,...l};const completed=!!r.done||!!l.done||!!String(r.completedAt||'').trim()||!!String(l.completedAt||'').trim();if(completed){out.done=true;out.completedAt=String(l.completedAt||r.completedAt||'')}return out}
function mergeArray(remote=[],local=[],kind=''){const out=(Array.isArray(remote)?remote:[]).filter(Boolean).map(clone);for(const raw of Array.isArray(local)?local:[]){if(!raw)continue;const x=clone(raw),i=out.findIndex(r=>sameRecord(r,x));if(i<0){out.push(x);continue}out[i]=kind==='todos'?mergeTodo(out[i],x):{...out[i],...x}}return out}
function mergeStates(remote,local){const out={...clone(remote||{}),...clone(local||{})};for(const k of ['people','events','todos','homework','reminders','pendencies'])out[k]=mergeArray(remote?.[k],local?.[k],k);out.schedules=clone(local?.schedules||remote?.schedules||{});out.common={...(remote?.common||{}),...(local?.common||{})};return out}
function notifyRender(){try{window.__fcV9?.invalidate?.(['today','tomorrow','events','homework','more','people'])}catch(_){}try{const screen=window.__fcV9?.state?.screen||document.querySelector('.fc9-screen.active')?.id;if(screen)window.__fcV9?.render?.(screen,true)}catch(_){}}

async function request(method='GET',body=null){const headers=new Headers();headers.set('x-fc-access',accessKey());if(body!==null)headers.set('content-type','application/json');const r=await fetch(BASE,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store'}),j=await r.json().catch(()=>({}));return{r,j}}
async function pull(){const {r,j}=await request();if(!r.ok||!j.ok)throw new Error(j.error||('HTTP '+r.status));return j}
async function write(snapshot,base,attempt=0){const {r,j}=await request('POST',{state:snapshot,baseRevision:base,deviceId:deviceId()});if(r.ok&&j.ok){revision=Number(j.revision||base+1);baseState=clone(snapshot);lastSync=Date.now();status='synced';lastError='';return true}if(r.status===409&&j.conflict&&valid(j.state)&&attempt<1){revision=Number(j.revision||0);const merged=mergeStates(j.state,snapshot);replaceState(merged);notifyRender();return write(merged,revision,attempt+1)}throw new Error(j.error||('HTTP '+r.status))}

async function pushNow(reason='save'){
  if(LOCAL_TEST&&accessKey()==='test'){status='test';lastSync=Date.now();return true}
  const state=current();if(!valid(state)||!accessKey())return false;
  if(busy){pending=true;return false}busy=true;status='syncing';
  try{return await write(clone(state),revision)}catch(e){lastError=e?.message||String(e);status='offline-cache';console.error('fc_cloud_push',reason,e);return false}finally{busy=false;if(pending){pending=false;schedule('queued',120)}}
}
function schedule(reason='save',delay=320){clearTimeout(timer);timer=setTimeout(()=>pushNow(reason),delay)}

function installSaveWrapper(){
  if(!rawSave||window.__fcCloudSaveWrapped)return;
  window.__fcCloudSaveWrapped=true;
  const wrapped=function(...args){const out=rawSave.apply(this,args);schedule('save');return out};
  window.save=wrapped;try{save=wrapped}catch(_){}
}

async function bootstrap(){
  installSaveWrapper();
  if(LOCAL_TEST&&accessKey()==='test'){revision=1;baseState=clone(current()||{});status='test';return{ok:true,test:true,revision}}
  if(!accessKey()||!valid(current())){status='local-only';return{ok:false,reason:'state-or-access-missing'}}
  try{
    const remote=await pull();revision=Number(remote.revision||0);
    if(valid(remote.state)){
      replaceState(remote.state);baseState=clone(remote.state);status='synced';lastSync=Date.now();return{ok:true,source:'cloud',revision};
    }
    const ok=await write(clone(current()),0);return{ok,source:'local-bootstrap',revision};
  }catch(e){lastError=e?.message||String(e);status='offline-cache';console.error('fc_cloud_bootstrap',e);schedule('bootstrap-retry',1800);return{ok:false,source:'local-cache',error:lastError}}
}

function health(){return{version:'2.1.0',status,revision,lastSync,lastError,busy,pending,deviceId:deviceId(),canonical:true,localCache:true,identityMerge:true,completionInvariant:true}}
window.__fcCloudState={version:'2.1.0',bootstrap,pushNow,schedule,health,mergeStates,get revision(){return revision}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&status==='offline-cache')pushNow('visibility')});
})();

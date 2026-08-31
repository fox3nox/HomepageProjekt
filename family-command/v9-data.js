/* Familienzentrale V9.25 · generic idempotent private-data mutation engine with tombstone guard */
(()=>{
'use strict';
if(window.__fcV9DataInstalled)return;
window.__fcV9DataInstalled=true;

const cfg=()=>window.FC_PRIVATE_RULES||{};
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const normalize=s=>String(s??'').trim().toLowerCase();

function persist(){try{if(typeof save==='function')save()}catch(e){console.error('fc9_data_save',e)}}
function equalValue(a,b){if(Array.isArray(a)||Array.isArray(b)||a&&typeof a==='object'||b&&typeof b==='object'){try{return JSON.stringify(a)===JSON.stringify(b)}catch(_){return a===b}}return a===b}
function match(row,selector={}){
  if(!row||!selector||typeof selector!=='object')return false;
  for(const [k,v] of Object.entries(selector)){
    if(k==='titleIncludes'){if(!normalize(row.title).includes(normalize(v)))return false;continue}
    if(k==='title'){if(normalize(row.title)!==normalize(v))return false;continue}
    if(!equalValue(row[k],v))return false;
  }
  return true;
}
function matchAny(row,list){return Array.isArray(list)&&list.length?list.some(s=>match(row,s)):false}
function ensureCollection(name){const state=D();if(!Array.isArray(state[name]))state[name]=[];return state[name]}
function assignChanged(target,value){let changed=false;for(const [k,v] of Object.entries(value||{})){if(!equalValue(target[k],v)){target[k]=v;changed=true}}return changed}
function identities(row){return [...new Set([String(row?.id||''),String(row?.clientRef||''),String(row?.sourceCommandId||'')].filter(Boolean))]}
function tombstones(collection){const state=D();const raw=state?._syncDeleted?.[collection];return raw&&typeof raw==='object'&&!Array.isArray(raw)?new Set(Object.keys(raw).map(String)):new Set()}
function isTombstoned(collection,row){const dead=tombstones(collection);return identities(row).some(k=>dead.has(k))}
function ruleCandidate(rule){return {...(rule?.match||{}),...(Array.isArray(rule?.matchAny)&&rule.matchAny.length?rule.matchAny[0]:{}),...(rule?.value||{})}}
function purgeTombstonedCollection(collection){const state=D(),rows=ensureCollection(collection),dead=tombstones(collection);if(!dead.size)return false;const kept=rows.filter(row=>!identities(row).some(k=>dead.has(k)));if(kept.length===rows.length)return false;state[collection]=kept;return true}

function applyRemove(rule){
  const state=D(),rows=ensureCollection(rule.collection),before=rows.length;
  state[rule.collection]=rows.filter(row=>!(rule.match&&match(row,rule.match))&&!matchAny(row,rule.matchAny));
  return state[rule.collection].length!==before;
}

function applyUpsert(rule){
  const candidate=ruleCandidate(rule);
  if(isTombstoned(rule.collection,candidate))return false;
  const rows=ensureCollection(rule.collection),selectors=Array.isArray(rule.matchAny)?rule.matchAny:[],selector=rule.match||null;
  let row=rows.find(x=>(selector&&match(x,selector))||matchAny(x,selectors)),changed=false;
  if(row&&isTombstoned(rule.collection,row))return false;
  if(!row){
    row={};
    if(rule.collection==='todos'){
      row.createdAt=new Date().toISOString();row.completedAt='';row.order=Math.max(0,...rows.map(x=>Number(x?.order||0)))+10;
    }
    rows.push(row);changed=true;
  }
  return assignChanged(row,rule.value)||changed;
}

function applyDedupe(rule){
  const state=D(),rows=ensureCollection(rule.collection),matches=rows.filter(x=>match(x,rule.match||{})&&!isTombstoned(rule.collection,x));
  if(matches.length<2)return false;
  const canonical=matches.find(x=>String(x?.id||'')===String(rule.canonicalId||''))||matches[0];
  for(const field of (rule.preferLongest||[])){
    const richest=[...matches].sort((a,b)=>String(b?.[field]||'').length-String(a?.[field]||'').length)[0];
    if(String(richest?.[field]||'').length>String(canonical?.[field]||'').length)canonical[field]=richest[field];
  }
  const remove=new Set(matches.filter(x=>x!==canonical));
  state[rule.collection]=rows.filter(x=>!remove.has(x));
  return true;
}

function applyRule(rule){
  if(!rule||!rule.op||!rule.collection)return false;
  if(rule.op==='remove')return applyRemove(rule);
  if(rule.op==='upsert')return applyUpsert(rule);
  if(rule.op==='dedupe')return applyDedupe(rule);
  return false;
}

function applyAll(){
  let changed=false,count=0;
  const collections=new Set((cfg().mutations||[]).map(r=>r?.collection).filter(Boolean));
  for(const collection of collections){if(purgeTombstonedCollection(collection)){changed=true;count++}}
  for(const rule of (cfg().mutations||[])){try{if(applyRule(rule)){changed=true;count++}}catch(e){console.error('fc9_private_rule',rule?.op,rule?.collection,e)}}
  if(changed)persist();
  return{changed,count};
}

const result=applyAll();
window.__fcV9Data={version:4,privateConfigVersion:String(cfg().version||''),applyAll,changed:result.changed,appliedMutations:result.count,tombstoneGuard:true};
})();

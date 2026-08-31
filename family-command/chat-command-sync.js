/* Family Command · durable Chat → app bridge · V9.17 · 2026-08-31 */
(()=>{
  'use strict';
  if(window.__fcChatCommandSyncInstalled)return;window.__fcChatCommandSyncInstalled=true;
  const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-chat-commands';
  const CACHE='fc-chat-todos-v2',DISMISSED='fc-chat-todos-dismissed-v1';
  const SUPERSEDED=new Set(['chat-2026-08-28-fruchtfliegenfalle-landi']);

  function accessKey(){try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.split('=').slice(1).join('='))}catch(e){}try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}}
  function read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch(e){return fallback}}
  function write(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}}
  function dismissed(){return new Set(read(DISMISSED,[]).map(String))}
  function cacheRows(){return Array.isArray(read(CACHE,[]))?read(CACHE,[]):[]}
  function saveCache(rows){write(CACHE,rows.slice(-100))}
  function todos(){try{if(!Array.isArray(data.todos))data.todos=[];return data.todos}catch(e){return[]}}
  function hasCompletedAt(t){return !!String(t?.completedAt||'').trim()}
  function repairCompletionInvariant(){let changed=false;for(const t of todos()){if(t&&!t.done&&hasCompletedAt(t)){t.done=true;changed=true}}return changed}
  function normalizeTodo(raw={}){const completedAt=String(raw.completedAt||'');return{id:String(raw.id||''),sourceCommandId:String(raw.sourceCommandId||''),clientRef:String(raw.clientRef||''),title:String(raw.title||'').trim(),date:String(raw.date||''),section:['morning','day','evening'].includes(raw.section)?raw.section:'day',priority:!!raw.priority,done:!!raw.done||!!completedAt.trim(),archived:!!raw.archived,order:Number(raw.order||0),createdAt:String(raw.createdAt||new Date().toISOString()),completedAt}}
  function fromCommand(cmd){const p=cmd?.payload||{},sid=String(cmd?.id||''),ref=String(cmd?.client_ref||'');if(cmd?.command_type!=='todo_add'||!sid||!p.title||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(p.date||''))||SUPERSEDED.has(ref))return null;return normalizeTodo({id:'todo-chat-'+sid.slice(0,12),sourceCommandId:sid,clientRef:ref,title:p.title,date:p.date,section:p.section,priority:p.priority,done:false,order:0,createdAt:cmd.created_at||new Date().toISOString()})}
  function identities(t){const out=[String(t?.id||''),String(t?.sourceCommandId||''),String(t?.clientRef||'')].filter(Boolean);if(!out.length&&t?.date&&t?.title)out.push(`${t.date}|${t.title}`);return [...new Set(out)]}
  function keyOf(t){return identities(t)[0]||''}
  function sameTodo(a,b){const aa=new Set(identities(a));return identities(b).some(k=>aa.has(k))}
  function mergeIntoData(incoming){
    const rows=todos(),dead=dismissed(),k=keyOf(incoming);if(!k||dead.has(k)||SUPERSEDED.has(incoming.clientRef))return false;
    let t=rows.find(x=>sameTodo(x,incoming));let changed=false;
    if(!t){const max=Math.max(0,...rows.map(x=>Number(x.order||0)));t={...incoming,order:incoming.order||max+10};rows.push(t);return true}
    for(const f of ['title','date','section','priority','sourceCommandId','clientRef'])if(incoming[f]!==undefined&&t[f]!==incoming[f]){t[f]=incoming[f];changed=true}
    if(!t.done&&hasCompletedAt(t)){t.done=true;changed=true}
    return changed;
  }
  function upsertCache(incoming){
    const rows=cacheRows().filter(x=>!SUPERSEDED.has(String(x.clientRef||''))),i=rows.findIndex(x=>sameTodo(x,incoming));
    if(i>=0){const prev=normalizeTodo(rows[i]);rows[i]={...prev,...incoming,done:prev.done||incoming.done,completedAt:prev.completedAt||incoming.completedAt}}
    else rows.push(incoming);
    saveCache(rows);return rows
  }
  function hydrateLocal(){let changed=repairCompletionInvariant();const dead=dismissed();for(const raw of cacheRows()){const t=normalizeTodo(raw),k=keyOf(t);if(!k||dead.has(k)||SUPERSEDED.has(t.clientRef))continue;changed=mergeIntoData(t)||changed}return changed}
  function allMerged(){
    repairCompletionInvariant();
    const dead=dismissed(),canonical=todos().map(normalizeTodo).filter(t=>!SUPERSEDED.has(t.clientRef)),out=[];
    for(const raw of cacheRows()){
      const t=normalizeTodo(raw),k=keyOf(t);if(!k||dead.has(k)||SUPERSEDED.has(t.clientRef))continue;
      if(canonical.some(c=>sameTodo(c,t)))continue;
      if(!out.some(x=>sameTodo(x,t)))out.push(t);
    }
    for(const t of canonical){const k=keyOf(t);if(!k||dead.has(k))continue;const i=out.findIndex(x=>sameTodo(x,t));if(i>=0)out[i]={...out[i],...t};else out.push(t)}
    return out
  }
  function getTodosFor(date,{includeOverdue=false,includeDone=false}={}){return allMerged().filter(t=>!t.archived&&(includeDone||!t.done)&&(String(t.date)===String(date)||(includeOverdue&&!t.done&&String(t.date)<String(date)))).sort((a,b)=>Number(!!b.priority)-Number(!!a.priority)||Number(a.order||0)-Number(b.order||0)||String(a.createdAt).localeCompare(String(b.createdAt)))}
  function dismiss(todo){const target=typeof todo==='string'?{id:todo}:todo||{},keys=identities(target);if(!keys.length)return;const s=dismissed();keys.forEach(k=>s.add(k));write(DISMISSED,[...s]);saveCache(cacheRows().filter(x=>!sameTodo(x,target)))}
  async function request(init={}){const h=new Headers(init.headers||{});h.set('x-fc-access',accessKey());return fetch(BASE,{...init,headers:h,cache:'no-store'})}
  function refreshVisible(){try{window.__fcV9?.invalidate?.(['today','tomorrow','homework'])}catch(e){}try{const active=window.__fcV9?.state?.screen;if(active)window.__fcV9?.render?.(active,true)}catch(e){}}
  async function sync(){
    try{
      if(typeof data==='undefined'||!data||!accessKey())return false;
      let changed=repairCompletionInvariant();
      const r=await request(),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok||!Array.isArray(j.commands))return false;
      const ids=[];
      for(const cmd of j.commands){const t=fromCommand(cmd);if(!t)continue;upsertCache(t);changed=mergeIntoData(t)||changed;ids.push(String(cmd.id))}
      if(changed){try{if(typeof save==='function')save()}catch(e){console.error('fc_chat_save',e)}refreshVisible()}
      if(ids.length)await request({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids})});return changed;
    }catch(e){console.error('fc_chat_command_sync',e);return false}
  }

  const hydrated=hydrateLocal();if(hydrated){try{if(typeof save==='function')save()}catch(e){}queueMicrotask(refreshVisible)}
  window.__fcChatCommandSync={version:5,sync,hydrateLocal,getTodosFor,dismiss,all:allMerged,cacheKey:CACHE,canonicalTodos:true,completionInvariant:true};
  queueMicrotask(sync);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});window.addEventListener('pageshow',()=>sync());
})();

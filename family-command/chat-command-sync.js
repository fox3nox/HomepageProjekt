/* Family Command · durable chat command bridge · 2026-08-28 */
(()=>{
  'use strict';
  if(window.__fcChatCommandSyncInstalled)return;window.__fcChatCommandSyncInstalled=true;
  const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-chat-commands';
  function accessKey(){try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.split('=').slice(1).join('='))}catch(e){}try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}}
  async function request(path='',init={}){const headers=new Headers(init.headers||{});headers.set('x-fc-access',accessKey());return fetch(BASE+path,{...init,headers,cache:'no-store'})}
  function todos(){try{if(!Array.isArray(data.todos))data.todos=[];return data.todos}catch(e){return[]}}
  function applyTodo(cmd){
    const p=cmd?.payload||{},title=String(p.title||'').trim(),date=String(p.date||'').trim();
    if(!title||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date))return{ok:false,changed:false};
    const rows=todos(),sid=String(cmd.id||''),cref=String(cmd.client_ref||'');
    let t=rows.find(x=>String(x.sourceCommandId||'')===sid||(cref&&String(x.clientRef||'')===cref));
    let changed=false;
    if(!t){
      const max=Math.max(0,...rows.map(x=>Number(x.order||0)));
      t={id:'todo-chat-'+sid.slice(0,12),title,date,section:['morning','day','evening'].includes(p.section)?p.section:'day',priority:!!p.priority,done:false,order:max+10,createdAt:new Date().toISOString(),completedAt:'',sourceCommandId:sid,clientRef:cref};
      rows.push(t);changed=true;
    }else{
      const next={title,date,section:['morning','day','evening'].includes(p.section)?p.section:'day',priority:!!p.priority};
      for(const [k,v] of Object.entries(next)){if(t[k]!==v){t[k]=v;changed=true}}
      if(!t.sourceCommandId){t.sourceCommandId=sid;changed=true}if(cref&&!t.clientRef){t.clientRef=cref;changed=true}
    }
    return{ok:true,changed};
  }
  function refreshVisible(){
    const active=document.querySelector('.screen.active')?.id||'today';
    try{window.__fcV8Shell?.invalidate?.(['today','tomorrow'])}catch(e){}
    try{window.__fcV8Shell?.render?.(active)}catch(e){}
    setTimeout(()=>{try{if(active==='today')window.__fcTomorrowPreview?.render?.();if(active==='today'||active==='tomorrow')window.__fcV8?.enhance?.(active)}catch(e){}},0);
  }
  async function sync(){
    try{
      if(typeof data==='undefined'||!data||!accessKey())return;
      const r=await request(),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok||!Array.isArray(j.commands))return;
      const applied=[];let changed=false;
      for(const cmd of j.commands){let res={ok:false,changed:false};if(cmd.command_type==='todo_add')res=applyTodo(cmd);if(res.ok){applied.push(cmd.id);changed=changed||res.changed}}
      if(changed){try{if(typeof save==='function')save()}catch(e){console.error('fc_chat_save',e)}refreshVisible()}
      if(applied.length)await request('',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:applied})});
    }catch(e){console.error('fc_chat_command_sync',e)}
  }
  window.__fcChatCommandSync={version:2,sync};
  sync();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});window.addEventListener('pageshow',()=>sync());
})();

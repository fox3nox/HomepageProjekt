/* Family Command · Chat command bridge · 2026-08-28 */
(()=>{
  'use strict';
  if(window.__fcChatCommandSyncInstalled)return;window.__fcChatCommandSyncInstalled=true;
  const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-chat-commands';
  function accessKey(){try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.split('=').slice(1).join('='))}catch(e){}try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}}
  async function request(path='',init={}){const headers=new Headers(init.headers||{});headers.set('x-fc-access',accessKey());return fetch(BASE+path,{...init,headers,cache:'no-store'})}
  function todos(){try{if(!Array.isArray(data.todos))data.todos=[];return data.todos}catch(e){return[]}}
  function applyTodo(cmd){const p=cmd?.payload||{},title=String(p.title||'').trim(),date=String(p.date||'').trim();if(!title||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date))return false;const rows=todos();if(rows.some(x=>String(x.sourceCommandId||'')===String(cmd.id)||String(x.clientRef||'')===String(cmd.client_ref||'')))return true;const max=Math.max(0,...rows.map(x=>Number(x.order||0)));rows.push({id:'todo-chat-'+String(cmd.id).slice(0,12),title,date,section:['morning','day','evening'].includes(p.section)?p.section:'day',priority:!!p.priority,done:false,order:max+10,createdAt:new Date().toISOString(),completedAt:'',sourceCommandId:String(cmd.id),clientRef:String(cmd.client_ref||'')});return true}
  async function sync(){try{if(typeof data==='undefined'||!data||!accessKey())return;const r=await request();const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok||!Array.isArray(j.commands))return;const applied=[];let changed=false;for(const cmd of j.commands){let ok=false;if(cmd.command_type==='todo_add')ok=applyTodo(cmd);if(ok){applied.push(cmd.id);changed=true}}
    if(changed){try{if(typeof save==='function')save()}catch(e){}try{window.__fcTodo?.render?.()}catch(e){}try{window.__fcV8?.enhance?.()}catch(e){}try{window.__fcV8Shell?.post?.(document.querySelector('.screen.active')?.id||'today')}catch(e){}}
    if(applied.length)await request('',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:applied})});
  }catch(e){console.error('fc_chat_command_sync',e)}}
  window.__fcChatCommandSync={version:1,sync};
  sync();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
})();

/* Family Command · document multi-link compatibility · V8.5 */
(()=>{
  'use strict';
  if(window.__fcMultiLinkInstalled)return;window.__fcMultiLinkInstalled=true;
  const DOC='/functions/v1/family-command-documents/list',baseFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){const u=typeof input==='string'?input:(input instanceof Request?input.url:'');const r=await baseFetch(input,init);if(!u.includes(DOC)||!r.ok)return r;try{const j=await r.clone().json();if(!Array.isArray(j.documents))return r;const expanded=[];for(const d of j.documents){const links=Array.isArray(d.links)&&d.links.length?d.links:(d.source_kind&&d.source_id?[{source_kind:d.source_kind,source_id:d.source_id}]:[]);if(!links.length)expanded.push(d);else for(const l of links)expanded.push({...d,source_kind:l.source_kind,source_id:l.source_id,links})}return new Response(JSON.stringify({...j,documents:expanded}),{status:r.status,statusText:r.statusText,headers:r.headers})}catch(e){return r}};
  function dedupeDocs(){const root=document.getElementById('docList');if(!root)return;const seen=new Set();root.querySelectorAll('.pro-doc-row').forEach(row=>{const b=row.querySelector('[onclick*="fcOpenOriginal"]'),s=b?.getAttribute('onclick')||'',m=s.match(/fcOpenOriginal\((['"]?)(.*?)\1\)/),id=m?.[2]||'';if(id&&seen.has(id))row.remove();else if(id)seen.add(id)})}
  function dedupePicker(){const root=document.getElementById('fcDocPicker');if(!root)return;const seen=new Set();root.querySelectorAll('.fc-picker-existing[data-doc]').forEach(b=>{const id=String(b.dataset.doc||'');if(id&&seen.has(id))b.remove();else if(id)seen.add(id)})}
  function dedupeUi(){dedupeDocs();dedupePicker()}
  try{if(typeof renderDocs==='function'){const old=renderDocs;const wrap=async function(...a){const x=await old.apply(this,a);dedupeUi();return x};window.renderDocs=wrap;try{renderDocs=wrap}catch(e){}}}catch(e){}
  window.__fcMultiLinkHealth={version:3,expandedList:true,dedupeUi,observer:false};
})();

/* Document metadata adapter. Provider credentials and original files stay behind
   the existing authenticated Edge Function. IDs and links remain canonical. */
(()=>{'use strict';
if(window.__fcDocumentLibrary)return;
const endpoint='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-documents/list';
let documents=[],pending=null,loadedAt=0;
const key=()=>{try{return localStorage.getItem('fc-private-access-v1')||''}catch{return''}};
const state=()=>{try{return typeof data!=='undefined'?data:{}}catch{return{}}};
function linkedRecord(link){
  const d=state(),kind=link.source_kind||link.sourceKind,id=String(link.source_id||link.sourceId||'');
  return(kind==='event'?d.events:kind==='homework'?d.homework:kind==='todo'?d.todos:[])?.find(x=>String(x.id)===id);
}
function linkedIds(link){
  const d=state(),kind=link.source_kind||link.sourceKind,id=String(link.source_id||link.sourceId||'');
  if(kind==='person')return[id];
  if(kind==='event')return(d.events||[]).find(e=>String(e.id)===id)?.personIds||[];
  if(kind==='homework')return[(d.homework||[]).find(h=>String(h.id)===id)?.personId];
  if(kind==='todo')return[(d.todos||[]).find(t=>String(t.id)===id)?.personId];
  return[];
}
function normalize(d){
  const explicit=d._fcExplicitPersonIds||[d.person_id,...(Array.isArray(d.personIds)?d.personIds:[]),...(Array.isArray(d.person_ids)?d.person_ids:[])];
  const personIds=[...new Set([...explicit,...(d.links||[]).flatMap(linkedIds)].filter(Boolean).map(String))];
  const searchText=(d.links||[]).map(linkedRecord).filter(Boolean).map(x=>[x.title,x.note,x.date,x.dueDate].filter(Boolean).join(' ')).join(' ');
  return{...d,id:String(d.id),provider:d.provider==='paperless'?'paperless':'supabase',externalId:String(d.externalId||d.id),personIds,searchText,_fcExplicitPersonIds:explicit};
}
const current=()=>documents.map(normalize);
async function list({refresh=false}={}){
  if(pending){await pending;return current()}
  if(!refresh&&loadedAt&&Date.now()-loadedAt<60000)return current();
  pending=(async()=>{const r=await fetch(endpoint,{headers:{'x-fc-access':key()},cache:'no-store'}),body=await r.json();
    if(!r.ok||!Array.isArray(body.documents))throw new Error('Dokumente momentan nicht erreichbar.');
    documents=body.documents;loadedAt=Date.now();
  })();
  try{await pending;return current()}finally{pending=null}
}
window.__fcDocumentLibrary={list,normalize,cached:current,invalidate:()=>{loadedAt=0}};
})();

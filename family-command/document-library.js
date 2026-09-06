/* Document metadata adapter. Provider credentials and original files stay behind
   the existing authenticated Edge Function. IDs and links remain canonical. */
(()=>{'use strict';
if(window.__fcDocumentLibrary)return;
const endpoint='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-documents/list';
let documents=[],pending=null,loadedAt=0;
const key=()=>{try{return localStorage.getItem('fc-private-access-v1')||''}catch{return''}};
function normalize(d){
  const personIds=[...new Set([d.person_id,...(d.personIds||[]),...(d.links||[]).filter(l=>l.source_kind==='person').map(l=>l.source_id)].filter(Boolean).map(String))];
  return{...d,id:String(d.id),provider:d.provider==='paperless'?'paperless':'supabase',externalId:String(d.externalId||d.id),personIds};
}
async function list({refresh=false}={}){
  if(pending)return pending;
  if(!refresh&&loadedAt&&Date.now()-loadedAt<60000)return documents;
  pending=(async()=>{const r=await fetch(endpoint,{headers:{'x-fc-access':key()},cache:'no-store'}),body=await r.json();
    if(!r.ok||!Array.isArray(body.documents))throw new Error('Dokumente momentan nicht erreichbar.');
    documents=body.documents.map(normalize);loadedAt=Date.now();return documents;
  })();
  try{return await pending}finally{pending=null}
}
window.__fcDocumentLibrary={list,normalize,cached:()=>documents.slice(),invalidate:()=>{loadedAt=0}};
})();

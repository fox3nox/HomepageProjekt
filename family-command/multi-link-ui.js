/* Family Command · multi-link original compatibility · 2026-08-23 */
(()=>{
  const DOC='/functions/v1/family-command-documents/list';
  if(window.__fcMultiLinkInstalled)return;window.__fcMultiLinkInstalled=true;
  const baseFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const u=typeof input==='string'?input:(input instanceof Request?input.url:'');
    const r=await baseFetch(input,init);
    if(!u.includes(DOC)||!r.ok)return r;
    try{
      const j=await r.clone().json();if(!Array.isArray(j.documents))return r;
      const expanded=[];
      for(const d of j.documents){const links=Array.isArray(d.links)&&d.links.length?d.links:(d.source_kind&&d.source_id?[{source_kind:d.source_kind,source_id:d.source_id}]:[]);if(!links.length){expanded.push(d);continue}for(const l of links)expanded.push({...d,source_kind:l.source_kind,source_id:l.source_id,links})}
      return new Response(JSON.stringify({...j,documents:expanded}),{status:r.status,statusText:r.statusText,headers:r.headers});
    }catch(e){return r}
  };
  function dedupeDocs(){const root=document.getElementById('docList');if(!root)return;const seen=new Set();root.querySelectorAll('.pro-doc-row').forEach(row=>{const b=row.querySelector('[onclick*="fcOpenOriginal"]'),s=b?.getAttribute('onclick')||'',m=s.match(/fcOpenOriginal\((['"]?)(.*?)\1\)/),id=m?.[2]||'';if(id&&seen.has(id))row.remove();else if(id)seen.add(id)});}
  try{if(typeof renderDocs==='function'){const old=renderDocs;const wrap=async function(...a){const x=await old.apply(this,a);dedupeDocs();return x};window.renderDocs=wrap;try{renderDocs=wrap}catch(e){}}}catch(e){}
  const ob=new MutationObserver(()=>queueMicrotask(dedupeDocs));try{ob.observe(document.body,{subtree:true,childList:true})}catch(e){}
  window.__fcMultiLinkHealth={version:1,expandedList:true,dedupeDocs:true};
})();

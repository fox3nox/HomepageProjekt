/* Family Command · document multi-link runtime · V9.16 */
(()=>{
  'use strict';
  if(window.__fcMultiLinkInstalled)return;window.__fcMultiLinkInstalled=true;

  // V9.16: document links stay attached to the canonical document object.
  // Never expand one document into one visible list row per link.
  function dedupeById(items){
    const seen=new Set(),out=[];
    for(const item of Array.isArray(items)?items:[]){
      const id=String(item?.id||item?.document_id||'');
      if(id&&seen.has(id))continue;
      if(id)seen.add(id);
      out.push(item);
    }
    return out;
  }

  function dedupeDocs(){
    for(const root of [document.getElementById('docList'),document.querySelector('.fc9-doc-list')].filter(Boolean)){
      const seen=new Set();
      root.querySelectorAll('[data-doc],.pro-doc-row').forEach(row=>{
        let id=String(row.dataset?.doc||'');
        if(!id){const b=row.querySelector('[onclick*="fcOpenOriginal"]'),s=b?.getAttribute('onclick')||'',m=s.match(/fcOpenOriginal\((['"]?)(.*?)\1\)/);id=m?.[2]||''}
        if(id&&seen.has(id))row.remove();else if(id)seen.add(id);
      });
    }
  }
  function dedupePicker(){
    const root=document.getElementById('fcDocPicker');if(!root)return;
    const seen=new Set();root.querySelectorAll('.fc-picker-existing[data-doc]').forEach(b=>{const id=String(b.dataset.doc||'');if(id&&seen.has(id))b.remove();else if(id)seen.add(id)});
  }
  function dedupeUi(){dedupeDocs();dedupePicker()}

  window.__fcMultiLinkHealth={version:4,expandedList:false,canonicalDocuments:true,dedupeById,dedupeUi,observer:false};
})();

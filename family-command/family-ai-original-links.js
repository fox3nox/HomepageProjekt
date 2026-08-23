/* Family Command · Family AI multi-original links · 2026-08-23 */
(()=>{
  if(window.__fcFamilyAiOriginalLinksV1)return;window.__fcFamilyAiOriginalLinksV1=true;
  const DOC_UPLOAD='/functions/v1/family-command-documents/upload';
  const baseFetch=window.fetch.bind(window);

  function aiTimestamp(id){
    const m=String(id||'').match(/^(?:hw-)?ai-(\d{10,})-/);return m?Number(m[1]):0;
  }
  function recentAiLinks(firstId){
    const first=aiTimestamp(firstId),now=Date.now();if(!first||now-first>10000)return[];
    const links=[];
    for(const e of (Array.isArray(data?.events)?data.events:[])){
      const ts=aiTimestamp(e?.id);if(ts>=first&&ts<=now&&ts-first<=3000)links.push({sourceKind:'event',sourceId:String(e.id)});
    }
    for(const h of (Array.isArray(data?.homework)?data.homework:[])){
      const ts=aiTimestamp(h?.id);if(ts>=first&&ts<=now&&ts-first<=3000)links.push({sourceKind:'homework',sourceId:String(h.id)});
    }
    const seen=new Set();return links.filter(x=>{const k=x.sourceKind+'|'+x.sourceId;if(seen.has(k))return false;seen.add(k);return true});
  }

  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:(input instanceof Request?input.url:'');
    const form=init?.body instanceof FormData?init.body:null;
    const isAiUpload=url.includes(DOC_UPLOAD)&&form&&aiTimestamp(form.get('sourceId'));
    if(isAiUpload){
      const links=recentAiLinks(form.get('sourceId'));
      if(links.length>1)form.set('links',JSON.stringify(links));
    }
    const r=await baseFetch(input,init);
    if(isAiUpload&&!r.ok){
      setTimeout(()=>{try{toast('Einträge gespeichert · Original konnte nicht gespeichert werden')}catch(e){}},120);
    }
    return r;
  };

  window.__fcFamilyAiOriginalLinksHealth={version:1,multiLink:true,maxBatchWindowMs:3000};
})();

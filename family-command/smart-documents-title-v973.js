/* Family Command · semantic document title helper v9.73 */
(()=>{
  'use strict';
  const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
  const dateLabel=value=>{const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}.${m[2]}.${m[1]}`:''};
  function title({items=[],summary='',people=[],manualIds=[]}={}){
    const list=Array.isArray(items)?items.filter(Boolean):[];
    const first=list[0]||{};
    const ids=[...new Set((manualIds.length?manualIds:list.flatMap(x=>Array.isArray(x.personIds)?x.personIds:[x.personId])).filter(Boolean).map(String))];
    const names=ids.map(id=>people.find(p=>String(p.id)===id)?.name||id).filter(Boolean);
    const eventTitle=norm(first.title);
    const summaryTitle=norm(summary).replace(/[.!?]+$/,'');
    let subject=eventTitle||summaryTitle||'Dokument';
    if(subject.length>72)subject=subject.slice(0,72).replace(/\s+\S*$/,'').trim();
    const date=dateLabel(first.date);
    const parts=[subject];
    if(names.length)parts.push(names.join(' + '));
    if(date)parts.push(date);
    return parts.join(' · ').slice(0,180);
  }
  window.__fcSemanticDocumentTitleV973={title};
})();

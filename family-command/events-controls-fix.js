/* Family Command · Termine interaction hardening · 2026-08-23 */
(()=>{
  if(window.__fcEventsControlsV2)return;window.__fcEventsControlsV2=true;
  const root=()=>document.getElementById('events');
  const currentFilter=()=>typeof window.fcEventFilter==='string'&&window.fcEventFilter?window.fcEventFilter:'all';
  const filterIds=()=>['all',...(Array.isArray(data?.people)?data.people.map(p=>String(p.id)):[])];
  const escH=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateH=s=>{try{return new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(String(s)+'T12:00:00'))}catch(e){return String(s||'')}};

  function eventById(id){return (data?.events||[]).find(e=>String(e.id)===String(id))||null}
  function rsvpStatus(e){
    const st=String(e?.rsvpStatus||'offen'),who=String(e?.rsvpFor||'').trim(),when=e?.rsvpDate?dateH(e.rsvpDate):'';
    if(st==='angemeldet')return '✓ '+(who?who+' ':'')+'angemeldet'+(when?' · '+when:'');
    if(st==='abgemeldet')return '✓ '+(who?who+' ':'')+'abgemeldet'+(when?' · '+when:'');
    return '⚠️ Hast du dich schon an- oder abgemeldet?';
  }
  function addRsvpCards(){
    const r=root();if(!r)return;
    r.querySelectorAll('.pro-event[data-event-id]').forEach(card=>{
      const e=eventById(card.dataset.eventId),existing=card.querySelector('.fc-rsvp-box');
      if(!e||e.rsvpRequired!==true){existing?.remove();return}
      const done=String(e.rsvpStatus||'offen')!=='offen';
      const sig=[String(e.id),String(e.rsvpStatus||'offen'),String(e.rsvpDate||''),String(e.rsvpFor||'')].join('|');
      if(existing?.dataset.rsvpSig===sig)return;
      existing?.remove();
      const box=document.createElement('div');box.className='fc-rsvp-box '+(done?'done':'open');box.dataset.rsvpId=String(e.id);box.dataset.rsvpSig=sig;
      box.innerHTML='<div class="fc-rsvp-copy"><b>'+(done?'Rückmeldung erledigt':'Rückmeldung nötig')+'</b><span>'+escH(rsvpStatus(e))+'</span></div><div class="fc-rsvp-actions">'+(done?'<button type="button" data-rsvp-action="offen">Ändern</button>':'<button type="button" class="primary" data-rsvp-action="angemeldet">Angemeldet</button><button type="button" data-rsvp-action="abgemeldet">Abgemeldet</button>')+'</div>';
      const body=card.querySelector('.pro-event-body')||card;body.appendChild(box);
    });
  }

  function bindControls(){
    const r=root();if(!r)return;
    const ids=filterIds();
    [...r.querySelectorAll('.pro-filters .pro-filter')].forEach((b,i)=>{
      b.type='button';b.dataset.fcPersonFilter=ids[i]||'all';b.removeAttribute('onclick');
      b.setAttribute('aria-pressed',String((ids[i]||'all')===currentFilter()));
    });
    const sections=[...r.querySelectorAll('.pro-month')];
    [...r.querySelectorAll('.pro-month-jump button')].forEach((b,i)=>{
      b.type='button';b.dataset.fcMonthTarget=sections[i]?.id||'';b.removeAttribute('onclick');
      if(sections[i])b.setAttribute('aria-label','Zu '+(sections[i].querySelector('h2')?.textContent||'Monat')+' springen');
    });
    addRsvpCards();
    runAudit();
  }

  function jumpToMonth(button){
    const r=root();if(!r)return;
    let target=button.dataset.fcMonthTarget?document.getElementById(button.dataset.fcMonthTarget):null;
    if(!target){const bs=[...r.querySelectorAll('.pro-month-jump button')],ss=[...r.querySelectorAll('.pro-month')];target=ss[bs.indexOf(button)]||null}
    if(!target)return;
    r.querySelectorAll('.pro-month-jump button').forEach(x=>x.classList.toggle('fc-month-selected',x===button));
    const header=document.querySelector('.topbar');const offset=(header?.getBoundingClientRect().height||0)+14;
    const y=Math.max(0,window.scrollY+target.getBoundingClientRect().top-offset);
    try{window.scrollTo({top:y,behavior:'smooth'})}catch(e){window.scrollTo(0,y)}
    target.classList.add('fc-month-flash');setTimeout(()=>target.classList.remove('fc-month-flash'),700);
  }

  let desired=currentFilter(),running=false,rerenderPromise=null;
  try{
    if(typeof renderEvents==='function'){
      const base=renderEvents;
      const hardened=async function(filter){
        if(typeof filter==='string'&&filter)desired=filter;else desired=currentFilter();
        window.fcEventFilter=desired;
        if(running)return rerenderPromise||Promise.resolve();
        running=true;
        rerenderPromise=(async()=>{
          try{
            while(true){
              const target=desired;window.fcEventFilter=target;
              await Promise.resolve(base.call(this,target));
              bindControls();
              if(target===desired)break;
            }
          }catch(e){console.error('fc_events_render_hardened',e);try{toast('Termine konnten nicht vollständig geladen werden')}catch(_){}}
          finally{running=false;rerenderPromise=null}
        })();
        return rerenderPromise;
      };
      window.renderEvents=hardened;try{renderEvents=hardened}catch(e){}
    }
  }catch(e){console.error('fc_events_wrap_failed',e)}

  const onControl=e=>{
    const r=root();if(!r||!r.contains(e.target))return;
    const f=e.target.closest?.('.pro-filter[data-fc-person-filter]');
    if(f){e.preventDefault();e.stopPropagation();const id=f.dataset.fcPersonFilter||'all';window.fcEventFilter=id;desired=id;Promise.resolve(window.renderEvents(id));return}
    const m=e.target.closest?.('.pro-month-jump button');
    if(m){e.preventDefault();e.stopPropagation();jumpToMonth(m)}
  };
  document.addEventListener('click',onControl,true);

  function runAudit(){
    const r=root();if(!r)return;
    const ids=filterIds(),filterButtons=[...r.querySelectorAll('.pro-filters .pro-filter')],monthButtons=[...r.querySelectorAll('.pro-month-jump button')],monthSections=[...r.querySelectorAll('.pro-month')];
    const duplicateDomIds=[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>id&&a.indexOf(id)!==i);
    const events=Array.isArray(data?.events)?data.events:[],eventIds=events.map(e=>String(e.id||'')),duplicateEventIds=[...new Set(eventIds.filter((id,i,a)=>id&&a.indexOf(id)!==i))];
    const invalidEvents=events.filter(e=>!e?.id||!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date||''))||!Array.isArray(e.personIds));
    window.__fcEventsAudit={
      ok:filterButtons.length===ids.length&&monthButtons.length===monthSections.length&&!duplicateEventIds.length&&!invalidEvents.length,
      filterButtons:filterButtons.length,expectedFilters:ids.length,monthButtons:monthButtons.length,monthSections:monthSections.length,
      duplicateDomIds:[...new Set(duplicateDomIds)],duplicateEventIds,invalidEventCount:invalidEvents.length,filter:currentFilter(),checkedAt:new Date().toISOString()
    };
  }

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;queueMicrotask(()=>{queued=false;bindControls()});
  });
  try{observer.observe(root()||document.body,{childList:true,subtree:true})}catch(e){}
  const style=document.createElement('style');style.id='fc-events-controls-v2-style';style.textContent=`
    #events .pro-filters,#events .pro-month-jump{position:relative!important;z-index:40!important;pointer-events:auto!important;isolation:isolate}
    #events .pro-filter,#events .pro-month-jump button{position:relative!important;z-index:41!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(38,54,81,.10)!important;cursor:pointer!important;min-height:38px}
    #events .pro-filter:active,#events .pro-month-jump button:active{transform:scale(.97)}
    #events .pro-month-jump button.fc-month-selected{outline:2px solid #263651;outline-offset:1px}
    #events .pro-month{scroll-margin-top:110px!important}
    #events .pro-month.fc-month-flash{animation:fcMonthFlash .7s ease}
    @keyframes fcMonthFlash{0%,100%{box-shadow:none}35%{box-shadow:0 0 0 4px rgba(66,106,163,.22)}}
    #events .fc-rsvp-box{margin-top:10px;padding:10px 11px;border-radius:13px;border:1px solid #efc46d;background:#fff8e8;display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap;position:relative;z-index:12}
    #events .fc-rsvp-box.done{border-color:#b9ddc5;background:#f1faf4}.fc-rsvp-copy{min-width:0;flex:1 1 180px}.fc-rsvp-copy b{display:block;font-size:10px}.fc-rsvp-copy span{display:block;margin-top:3px;font-size:10px;line-height:1.35}.fc-rsvp-actions{display:flex;gap:6px;flex-wrap:wrap}.fc-rsvp-actions button{pointer-events:auto!important;touch-action:manipulation!important;border:1px solid #d7b45f;background:#fff;color:#6b4b08;border-radius:10px;padding:7px 9px;font-size:9px;font-weight:850}.fc-rsvp-actions button.primary{background:#7a560b;color:#fff;border-color:#7a560b}
    @media(max-width:430px){#events .pro-filter,#events .pro-month-jump button{min-height:42px}.fc-rsvp-actions{width:100%}.fc-rsvp-actions button{flex:1 1 0}}
  `;document.head.appendChild(style);

  bindControls();
  if(root()?.classList.contains('active'))Promise.resolve(window.renderEvents(currentFilter()));
})();

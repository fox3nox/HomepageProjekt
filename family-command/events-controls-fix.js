/* Family Command · Termine controls stable v4 · 2026-08-23 */
(()=>{
  if(window.__fcEventsControlsV4)return;window.__fcEventsControlsV4=true;
  const root=()=>document.getElementById('events');
  const filterIds=()=>['all',...(Array.isArray(data?.people)?data.people.map(p=>String(p.id)):[])];
  const normalizeFilter=value=>{const ids=filterIds(),v=String(value||'');return ids.includes(v)?v:'all'};
  const currentFilter=()=>normalizeFilter(typeof window.fcEventFilter==='string'?window.fcEventFilter:'all');
  const escH=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateH=s=>{try{return new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(String(s)+'T12:00:00'))}catch(e){return String(s||'')}};
  let selectedMonth='';

  function setFilter(value){
    const id=normalizeFilter(value);window.fcEventFilter=id;try{fcEventFilter=id}catch(e){}return id;
  }
  function inlineArg(button,name){
    const s=String(button?.getAttribute?.('onclick')||''),m=s.match(new RegExp(name+'\\((.+)\\)'));
    if(!m)return'';const raw=m[1].trim();try{return String(JSON.parse(raw))}catch(e){}return raw.replace(/^['"]|['"]$/g,'');
  }
  function filterForButton(button){
    const direct=String(button?.dataset?.fcPersonFilter||'');if(filterIds().includes(direct))return direct;
    const fromInline=inlineArg(button,'renderEvents');if(filterIds().includes(fromInline))return fromInline;
    const txt=String(button?.textContent||'').trim();if(/^alle$/i.test(txt))return'all';
    const p=(data?.people||[]).find(x=>String(x.name||'').trim()===txt);return p?String(p.id):'';
  }
  function monthForButton(button){
    const direct=String(button?.dataset?.fcMonthTarget||'');if(direct&&document.getElementById(direct))return direct;
    const fromInline=inlineArg(button,'fcProJumpMonth');if(fromInline&&document.getElementById(fromInline))return fromInline;
    const r=root();if(!r)return'';
    const buttons=[...r.querySelectorAll('.pro-month-jump button')],sections=[...r.querySelectorAll('.pro-month')],i=buttons.indexOf(button);
    return i>=0?String(sections[i]?.id||''):'';
  }
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
      (card.querySelector('.pro-event-body')||card).appendChild(box);
    });
  }

  function bindControls(){
    const r=root();if(!r)return;
    const active=currentFilter();
    r.querySelectorAll('.pro-filters .pro-filter').forEach(button=>{
      const id=filterForButton(button);if(!id)return;
      button.type='button';button.dataset.fcPersonFilter=id;button.removeAttribute('onclick');
      const on=id===active;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));
      button.setAttribute('aria-label',id==='all'?'Alle Termine anzeigen':'Termine für '+String(button.textContent||'').trim()+' anzeigen');
    });
    r.querySelectorAll('.pro-month-jump button').forEach(button=>{
      const id=monthForButton(button);if(!id)return;
      button.type='button';button.dataset.fcMonthTarget=id;button.removeAttribute('onclick');
      const target=document.getElementById(id);button.classList.toggle('fc-month-selected',!!selectedMonth&&selectedMonth===id);
      if(target)button.setAttribute('aria-label','Zu '+(target.querySelector('h2')?.textContent||'Monat')+' springen');
    });
    addRsvpCards();runAudit();
  }

  function jumpToMonth(button){
    const id=monthForButton(button),target=id?document.getElementById(id):null;if(!target)return false;
    selectedMonth=id;
    root()?.querySelectorAll('.pro-month-jump button').forEach(x=>x.classList.toggle('fc-month-selected',monthForButton(x)===id));
    try{target.scrollIntoView({behavior:'smooth',block:'start',inline:'nearest'})}catch(e){target.scrollIntoView()}
    target.classList.add('fc-month-flash');setTimeout(()=>target.classList.remove('fc-month-flash'),700);return true;
  }

  try{
    if(typeof renderEvents==='function'){
      const base=renderEvents;
      const stable=async function(filter){
        const id=setFilter(typeof filter==='string'&&filter?filter:currentFilter());
        const out=await Promise.resolve(base.call(this,id));bindControls();return out;
      };
      window.renderEvents=stable;try{renderEvents=stable}catch(e){}
    }
  }catch(e){console.error('fc_events_stable_wrap',e)}

  function handleControl(e){
    const r=root();if(!r||!r.contains(e.target))return;
    const f=e.target.closest?.('.pro-filter[data-fc-person-filter]');
    if(f){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const id=setFilter(f.dataset.fcPersonFilter);r.querySelectorAll('.pro-filter[data-fc-person-filter]').forEach(x=>{const on=x.dataset.fcPersonFilter===id;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on))});
      Promise.resolve(window.renderEvents(id)).catch(err=>{console.error('fc_event_filter',err);try{toast('Termine konnten nicht geladen werden')}catch(_){}});return;
    }
    const m=e.target.closest?.('.pro-month-jump button[data-fc-month-target]');
    if(m){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();jumpToMonth(m)}
  }
  document.addEventListener('click',handleControl,true);

  function runAudit(){
    const r=root();if(!r)return;
    const ids=filterIds(),filterButtons=[...r.querySelectorAll('.pro-filters .pro-filter')],monthButtons=[...r.querySelectorAll('.pro-month-jump button')],monthSections=[...r.querySelectorAll('.pro-month')];
    const duplicateDomIds=[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>id&&a.indexOf(id)!==i);
    const events=Array.isArray(data?.events)?data.events:[],eventIds=events.map(e=>String(e.id||'')),duplicateEventIds=[...new Set(eventIds.filter((id,i,a)=>id&&a.indexOf(id)!==i))];
    const invalidEvents=events.filter(e=>!e?.id||!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date||''))||!Array.isArray(e.personIds));
    const filterTargets=filterButtons.map(filterForButton),monthTargets=monthButtons.map(monthForButton);
    const activeFilters=filterButtons.filter(b=>b.classList.contains('active')).length;
    window.__fcEventsAudit={
      version:4,ok:filterButtons.length===ids.length&&filterTargets.every(x=>ids.includes(x))&&monthButtons.length===monthSections.length&&monthTargets.every(id=>!!id&&!!document.getElementById(id))&&activeFilters===1&&!duplicateEventIds.length&&!invalidEvents.length,
      filterButtons:filterButtons.length,expectedFilters:ids.length,filterTargets,activeFilters,monthButtons:monthButtons.length,monthSections:monthSections.length,monthTargets,
      duplicateDomIds:[...new Set(duplicateDomIds)],duplicateEventIds,invalidEventCount:invalidEvents.length,filter:currentFilter(),selectedMonth,checkedAt:new Date().toISOString()
    };
  }

  let queued=false;
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;bindControls()})});
  try{observer.observe(root()||document.body,{childList:true,subtree:true})}catch(e){}
  const style=document.createElement('style');style.id='fc-events-controls-v4-style';style.textContent=`
    #events .pro-filters,#events .pro-month-jump{position:relative!important;z-index:40!important;pointer-events:auto!important;isolation:isolate}
    #events .pro-filter,#events .pro-month-jump button{position:relative!important;z-index:41!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(38,54,81,.10)!important;cursor:pointer!important;min-height:42px}
    #events .pro-filter:active,#events .pro-month-jump button:active{transform:scale(.97)}
    #events .pro-month-jump button.fc-month-selected{outline:2px solid #263651;outline-offset:1px}
    #events .pro-month{scroll-margin-top:110px!important}
    #events .pro-month.fc-month-flash{animation:fcMonthFlash .7s ease}
    @keyframes fcMonthFlash{0%,100%{box-shadow:none}35%{box-shadow:0 0 0 4px rgba(66,106,163,.22)}}
    #events .fc-rsvp-box{margin-top:10px;padding:10px 11px;border-radius:13px;border:1px solid #efc46d;background:#fff8e8;display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap;position:relative;z-index:12}
    #events .fc-rsvp-box.done{border-color:#b9ddc5;background:#f1faf4}.fc-rsvp-copy{min-width:0;flex:1 1 180px}.fc-rsvp-copy b{display:block;font-size:10px}.fc-rsvp-copy span{display:block;margin-top:3px;font-size:10px;line-height:1.35}.fc-rsvp-actions{display:flex;gap:6px;flex-wrap:wrap}.fc-rsvp-actions button{pointer-events:auto!important;touch-action:manipulation!important;border:1px solid #d7b45f;background:#fff;color:#6b4b08;border-radius:10px;padding:7px 9px;font-size:9px;font-weight:850}.fc-rsvp-actions button.primary{background:#7a560b;color:#fff;border-color:#7a560b}
    @media(max-width:430px){#events .pro-filter,#events .pro-month-jump button{min-height:44px}.fc-rsvp-actions{width:100%}.fc-rsvp-actions button{flex:1 1 0}}
  `;document.head.appendChild(style);

  bindControls();
})();

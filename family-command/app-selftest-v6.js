/* Family Command · runtime self-test + data rules v6.3 · 2026-08-24 */
(()=>{
  if(window.__fcSelfTestInstalled)return;window.__fcSelfTestInstalled=true;

  const state={runs:0,last:null,recentRuntimeErrors:[]};
  let timer=0;

  function saveAndSync(){
    try{if(typeof save==='function')save()}catch(e){}
    try{if(typeof syncPush==='function')syncPush()}catch(e){}
  }

  function applySocialMigration(){
    const FLAG='fc-migration-social-20261027-v1';
    try{if(localStorage.getItem(FLAG)==='done')return false}catch(e){}
    try{
      if(typeof data==='undefined'||!Array.isArray(data?.events))return false;
      let event=data.events.find(e=>String(e.id)==='oli-social')||data.events.find(e=>String(e.date)==='2026-10-26'&&String(e.time||'')==='14:00'&&/sozial/i.test(String(e.title||'')));
      if(!event){event={id:'oli-social',personIds:['oli']};data.events.push(event)}
      event.id='oli-social';event.personIds=['oli'];event.title='Termin Sozialabteilung Herzogenbuchsee';event.date='2026-10-27';event.time='10:00';event.end='';event.endDate='';
      event.note='Termin zur Klärung der Finanzierung der Kinderbetreuung an Samstagen ab 01.01.2027. Sozialabteilung Herzogenbuchsee. Frau Kuert, Sozialarbeiterin von Frau Hager, nimmt ebenfalls teil. Ersetzt den Termin vom 26.10.2026 um 14:00 Uhr.';
      saveAndSync();
      try{localStorage.setItem(FLAG,'done')}catch(e){}
      return true;
    }catch(e){console.error('fc_data_migration_social_20261027',e);return false}
  }

  function dayOf(date){try{return new Date(String(date)+'T12:00:00').getDay()}catch(e){return-1}}
  function mins(t){const m=String(t||'').match(/^(\d{2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):9999}
  function personName(pid){try{return (data?.people||[]).find(p=>String(p.id)===String(pid))?.name||pid}catch(e){return pid}}

  function applyFamilyScheduleRules(){
    try{
      if(typeof data==='undefined'||!data?.schedules)return false;
      let changed=false;
      for(const pid of ['jayden','fynn']){
        const days=data.schedules?.[pid]||{};
        for(const slots of Object.values(days))for(const slot of (Array.isArray(slots)?slots:[])){
          if(String(slot.start||'')>='12:00'&&slot.depart!=='13:00'){slot.depart='13:00';changed=true}
        }
      }
      for(const day of [1,3]){
        const slot=data.schedules?.eliyah?.[day]?.[0];if(!slot)continue;
        const wanted='Tagesschule holt Eliyah nach dem Kindergarten ab';
        if(slot.note!==wanted){slot.note=wanted;changed=true}
        if(!/Tagesschule/i.test(String(slot.label||''))){slot.label=(slot.label||'Kindergarten')+' · Tagesschule';changed=true}
      }
      try{
        let rules={};try{rules=JSON.parse(localStorage.getItem('fc-pickup-rules-v1')||'{}')}catch(e){}
        for(const d of [2,4,5])rules['eliyah|'+d]=true;
        rules['eliyah|3']=false;
        localStorage.setItem('fc-pickup-rules-v1',JSON.stringify(rules));
      }catch(e){}

      if(typeof pushSnapshot==='function'&&!window.__fcSchedulePushWrapped){
        window.__fcSchedulePushWrapped=true;
        const raw=pushSnapshot;
        const wrapped=function(){
          const s=raw();
          for(const r of (Array.isArray(s?.rules)?s.rules:[])){
            if((r.personId==='jayden'||r.personId==='fynn')&&String(r.start||'')==='13:30')r.time='13:00';
            if(r.personId==='eliyah'&&(Number(r.day)===1||Number(r.day)===3))r.note='Tagesschule holt Eliyah nach dem Kindergarten ab';
          }
          if(Array.isArray(s?.tasks))s.tasks=s.tasks.filter(t=>!(String(t?.id||'').startsWith('pickup-eliyah-')&&dayOf(t.date)===3));
          return s;
        };
        window.pushSnapshot=wrapped;try{pushSnapshot=wrapped}catch(e){}
        changed=true;
      }
      if(changed)saveAndSync();
      return changed;
    }catch(e){console.error('fc_family_schedule_rules',e);return false}
  }

  function patchScheduleCards(root,date){
    if(!root||!date)return;
    const day=dayOf(date);
    for(const pid of ['jayden','fynn']){
      const name=personName(pid),slots=data?.schedules?.[pid]?.[day]||[],pm=slots.filter(s=>String(s.start||'')>='12:00');
      if(!pm.length)continue;
      const card=[...root.querySelectorAll('.v6-kid,.v6-week-kid')].find(c=>String(c.textContent||'').includes(name));if(!card)continue;
      const meta=card.querySelector('.v6-week-meta');if(meta){const text=pm.map(s=>`${s.depart||'13:00'} los · ${s.start}–${s.end}`).join(' · ');meta.innerHTML='Nachmittag: <strong>'+text+'</strong>'}
    }
    if(day===1||day===3){
      const name=personName('eliyah'),card=[...root.querySelectorAll('.v6-kid,.v6-week-kid')].find(c=>String(c.textContent||'').includes(name));
      if(card&&!card.querySelector('.fc-ts-pickup-note')){const note=document.createElement('div');note.className='fc-ts-pickup-note';note.innerHTML='Nach Kindergarten: <strong>Abholung durch Tagesschule</strong>';card.appendChild(note)}
    }
  }

  function patchTodayFocus(){
    const root=document.getElementById('today');if(!root)return;
    const now=new Date(),cur=now.getHours()*60+now.getMinutes(),day=now.getDay(),candidates=[];
    for(const pid of ['jayden','fynn'])for(const s of (data?.schedules?.[pid]?.[day]||[])){
      if(String(s.start||'')<'12:00')continue;const depart=s.depart||'13:00',m=mins(depart);if(m>=cur)candidates.push({pid,time:depart,m})
    }
    if(!candidates.length)return;candidates.sort((a,b)=>a.m-b.m);const target=candidates[0].m,same=candidates.filter(x=>x.m===target),shown=mins(root.querySelector('.v6-focus-time b')?.textContent||'');
    if(shown<target)return;
    const names=same.map(x=>personName(x.pid));const title=names.length>1?names.join(' & ')+' los zur Schule':names[0]+' los zur Schule';
    const h=root.querySelector('.v6-focus h2'),p=root.querySelector('.v6-focus p');if(h)h.textContent=title;if(p)p.textContent='Von zuhause wieder zur Schule loslaufen.';
    let box=root.querySelector('.v6-focus-time');if(!box){box=document.createElement('div');box.className='v6-focus-time';root.querySelector('.v6-focus')?.appendChild(box)}
    const diff=target-cur;box.innerHTML='<b>'+same[0].time+'</b><span>'+(diff<=0?'jetzt':diff<60?'in '+diff+' Min.':'in '+Math.floor(diff/60)+' Std.'+(diff%60?' '+diff%60+' Min.':''))+'</span>';
  }

  function installScheduleUIPatches(){
    if(window.__fcScheduleUIPatches)return;window.__fcScheduleUIPatches=true;
    if(typeof renderToday==='function'){
      const base=renderToday;window.renderToday=function(...args){const r=base.apply(this,args);const date=typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);patchScheduleCards(document.getElementById('today'),date);patchTodayFocus();return r};try{renderToday=window.renderToday}catch(e){}
    }
    if(typeof renderWeek==='function'){
      const base=renderWeek;window.renderWeek=function(...args){const r=base.apply(this,args);const date=window.selectedWeekDay||(typeof selectedWeekDay!=='undefined'?selectedWeekDay:'')||(typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10));patchScheduleCards(document.getElementById('week'),date);return r};try{renderWeek=window.renderWeek}catch(e){}
    }
    const style=document.createElement('style');style.id='fc-schedule-rules-style';style.textContent='.fc-ts-pickup-note{margin-top:8px;padding:7px 9px;border:1px solid rgba(62,211,159,.18);background:rgba(62,211,159,.08);border-radius:9px;color:#87d9b6;font-size:9px;line-height:1.35}.fc-ts-pickup-note strong{color:#b4f1d4}';document.head.appendChild(style);
    try{if(document.getElementById('today')?.classList.contains('active'))window.renderToday()}catch(e){}
    try{if(document.getElementById('week')?.classList.contains('active'))window.renderWeek()}catch(e){}
  }

  function connectionBadge(){
    let badge=document.getElementById('fcConnectionBadge');if(badge)return badge;
    badge=document.createElement('span');badge.id='fcConnectionBadge';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');badge.hidden=true;badge.textContent='Offline';
    const tools=document.querySelector('.aitools')||document.querySelector('.topbar-in');if(tools)tools.insertBefore(badge,tools.lastElementChild||null);
    const style=document.createElement('style');style.id='fc-selftest-style';style.textContent='#fcConnectionBadge{min-height:30px;display:inline-flex;align-items:center;padding:0 9px;border-radius:999px;border:1px solid rgba(255,181,75,.26);background:rgba(255,181,75,.09);color:#ffc36c;font-size:9px;font-weight:800;white-space:nowrap}#fcConnectionBadge[hidden]{display:none!important}';document.head.appendChild(style);return badge;
  }
  function updateConnection(){const badge=connectionBadge();if(!badge)return;const offline=navigator.onLine===false;badge.hidden=!offline;document.documentElement.dataset.fcOffline=offline?'1':'0'}
  function duplicateIds(){const ids=[...document.querySelectorAll('[id]')].map(x=>x.id).filter(Boolean);return[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))]}
  function brokenInlineHandlers(){const out=[];document.querySelectorAll('[onclick],[onchange]').forEach(el=>{for(const attr of ['onclick','onchange']){const src=String(el.getAttribute(attr)||'').trim();if(!src)continue;if(src.endsWith('(')){out.push({tag:el.tagName.toLowerCase(),attr,reason:'truncated'});continue}try{const fn=attr==='onclick'?el.onclick:el.onchange;if(typeof fn!=='function')out.push({tag:el.tagName.toLowerCase(),attr,reason:'not-compiled'})}catch(e){out.push({tag:el.tagName.toLowerCase(),attr,reason:'compile-error'})}}});return out.slice(0,20)}
  function missingFunctions(){const names=['renderToday','renderWeek','renderEvents','renderHomeworkScreen','renderMore','fcOpenEventDetails','fcOpenFamilyAI','fcPrintDay','fcPrintWeek'];return names.filter(name=>typeof window[name]!=='function')}
  function peopleCount(){try{return typeof data!=='undefined'&&Array.isArray(data?.people)?data.people.length:null}catch(e){return null}}
  function activeOverflow(){const el=document.querySelector('.screen.active');return el?el.scrollWidth>el.clientWidth+3:false}
  function run(){
    const active=document.querySelectorAll('.screen.active').length,activeNav=document.querySelectorAll('.navbtn.active').length,missing=missingFunctions(),dup=duplicateIds(),handlers=brokenInlineHandlers(),screen=document.querySelector('.screen.active')?.id||'';
    const weekButtons=screen==='week'?document.querySelectorAll('#week .v6-day').length:null,pc=screen==='events'?peopleCount():null,expectedFilters=pc===null?null:pc+1,eventFilters=screen==='events'?document.querySelectorAll('#events .v6-filter').length:null,overflow=activeOverflow(),navOk=screen==='people'?activeNav<=1:activeNav===1,critical=[];
    if(active!==1)critical.push('active-screen');if(!navOk)critical.push('active-nav');if(missing.length)critical.push('missing-functions');if(handlers.length)critical.push('broken-handlers');if(screen==='week'&&weekButtons!==5)critical.push('week-controls');if(screen==='events'&&expectedFilters!==null&&eventFilters!==expectedFilters)critical.push('event-filters');if(overflow)critical.push('horizontal-overflow');
    const report={version:'6.3',ok:critical.length===0,screen,activeScreens:active,activeNav,missingFunctions:missing,duplicateIds:dup,brokenHandlers:handlers,weekButtons,eventFilters,expectedFilters,horizontalOverflow:overflow,runtimeErrorCount:state.recentRuntimeErrors.length,critical,checkedAt:new Date().toISOString()};state.runs++;state.last=report;window.__fcAppSelfTest=report;document.documentElement.dataset.fcHealth=report.ok?'ok':'warn';if(!report.ok)console.warn('Family Command self-test',report);return report;
  }
  function scheduleTest(){clearTimeout(timer);timer=setTimeout(run,100)}

  window.addEventListener('online',()=>{updateConnection();scheduleTest()});window.addEventListener('offline',updateConnection);
  window.addEventListener('error',e=>{state.recentRuntimeErrors.push({type:'error',source:String(e.filename||'').split('/').pop()||'',line:Number(e.lineno)||0});state.recentRuntimeErrors=state.recentRuntimeErrors.slice(-5);scheduleTest()});
  window.addEventListener('unhandledrejection',()=>{state.recentRuntimeErrors.push({type:'promise'});state.recentRuntimeErrors=state.recentRuntimeErrors.slice(-5);scheduleTest()});
  try{const root=document.querySelector('.content')||document.body;const observer=new MutationObserver(scheduleTest);observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});window.__fcSelfTestObserver=observer}catch(e){}

  window.fcRunSelfTest=run;
  applySocialMigration();
  applyFamilyScheduleRules();
  installScheduleUIPatches();
  updateConnection();
  requestAnimationFrame(()=>{updateConnection();run()});
})();
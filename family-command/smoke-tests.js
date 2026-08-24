/* Family Command · non-destructive interaction smoke tests · 2026-08-24 */
(()=>{
  if(window.__fcSmokeTestsInstalled)return;window.__fcSmokeTestsInstalled=true;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const report={version:1,ok:false,tests:[],startedAt:null,finishedAt:null};
  function add(name,ok,detail=''){report.tests.push({name,ok:!!ok,detail:String(detail||'')})}
  function getGlobal(name,fallback=null){try{return window[name]??eval(name)}catch(e){return fallback}}

  async function run(){
    if(report.running)return report;report.running=true;report.startedAt=new Date().toISOString();report.tests=[];
    const original={screen:document.querySelector('.screen.active')?.id||'today',weekOffset:getGlobal('weekOffset',0),selectedWeekDay:getGlobal('selectedWeekDay',null),eventFilter:getGlobal('fcEventFilter','all')};
    try{
      const required=['renderToday','renderWeek','renderEvents','renderMore','renderHomeworkScreen','fcOpenEventDetails'];
      const missing=required.filter(n=>typeof window[n]!=='function');add('core-functions',missing.length===0,missing.join(','));

      if(typeof window.renderWeek==='function'){
        await Promise.resolve(window.renderWeek());await sleep(30);
        const buttons=[...document.querySelectorAll('#week .v6-day')];add('week-five-days',buttons.length===5,String(buttons.length));
        if(buttons.length>=2){const target=buttons[1],label=(target.textContent||'').trim();target.click();await sleep(40);const active=document.querySelector('#week .v6-day.active');add('week-day-switch',active===target||String(active?.textContent||'').trim()===label,String(active?.textContent||''));}
      }else add('week-five-days',false,'renderWeek missing');

      if(typeof window.renderEvents==='function'){
        await Promise.resolve(window.renderEvents('all'));await sleep(50);
        const filters=[...document.querySelectorAll('#events .v6-filter')],expected=(Array.isArray(data?.people)?data.people.length:0)+1;add('event-filter-count',filters.length===expected,`${filters.length}/${expected}`);
        const candidate=filters.find(b=>!/^(Alle)$/i.test((b.textContent||'').trim()));
        if(candidate){const label=(candidate.textContent||'').trim();candidate.click();await sleep(60);const active=document.querySelector('#events .v6-filter.active');add('event-filter-switch',String(active?.textContent||'').trim()===label,String(active?.textContent||''));}else add('event-filter-switch',false,'no person filter');
      }else add('event-filter-count',false,'renderEvents missing');

      if(typeof window.renderMore==='function'){
        await Promise.resolve(window.renderMore());await sleep(30);add('more-renders',!!document.querySelector('#more .v6-page,#more .settings-stack,#more .fc-backup-card'),'more screen');
      }

      const dup=[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>id&&a.indexOf(id)!==i);add('no-duplicate-ids',dup.length===0,[...new Set(dup)].join(','));
      const activeOverflow=()=>{const s=document.querySelector('.screen.active');return s?s.scrollWidth>s.clientWidth+3:false};add('no-active-horizontal-overflow',!activeOverflow(),activeOverflow()?'overflow':'');
    }catch(e){add('smoke-runner',false,e instanceof Error?e.message:String(e))}
    finally{
      try{window.weekOffset=original.weekOffset;weekOffset=original.weekOffset}catch(e){}
      try{window.selectedWeekDay=original.selectedWeekDay;selectedWeekDay=original.selectedWeekDay}catch(e){}
      try{window.fcEventFilter=original.eventFilter;fcEventFilter=original.eventFilter}catch(e){}
      try{if(typeof window.renderWeek==='function')window.renderWeek()}catch(e){}
      try{if(typeof window.renderEvents==='function')window.renderEvents(original.eventFilter||'all')}catch(e){}
      try{if(typeof window.openScreen==='function')window.openScreen(original.screen)}catch(e){}
      report.ok=report.tests.every(t=>t.ok);report.finishedAt=new Date().toISOString();report.running=false;window.__fcSmokeTest={...report,tests:report.tests.map(x=>({...x}))};document.documentElement.dataset.fcSmoke=report.ok?'ok':'warn';
      if(!report.ok)console.warn('Family Command smoke tests',window.__fcSmokeTest);else console.info('Family Command smoke tests OK');
    }
    return window.__fcSmokeTest;
  }

  window.fcRunSmokeTests=run;
  setTimeout(()=>run().catch(e=>console.error('fc_smoke_tests',e)),4200);
})();

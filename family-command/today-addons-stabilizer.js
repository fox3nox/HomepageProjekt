/* Family Command · stable Today/Tomorrow addons + grouped focus · 2026-08-25 */
(()=>{
  if(window.__fcTodayAddonsStabilizerInstalled)return;
  window.__fcTodayAddonsStabilizerInstalled=true;
  let queued=false,repairing=false;

  const mins=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const nowMins=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
  const todayISO2=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const people=()=>{try{return (data?.people||[]).filter(p=>p.id!=='oli')}catch(e){return[]}};
  const personBy=id=>{try{return typeof person==='function'?person(id):(data?.people||[]).find(p=>String(p.id)===String(id))}catch(e){return null}};
  const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):(data?.schedules?.[pid]?.[day]||[])}catch(e){return[]}};
  const holiday=(pid,date)=>{try{return typeof schoolBreakFor==='function'?schoolBreakFor(pid,date):(typeof schoolHolidayOn==='function'?schoolHolidayOn(date):null)}catch(e){return null}};
  const eventsAt=date=>{try{return typeof eventsOn==='function'?(eventsOn(date)||[]):(data?.events||[]).filter(e=>e.date===date||((e.endDate||'')&&e.date<=date&&e.endDate>=date))}catch(e){return[]}};
  const eventPeople=e=>(e?.personIds||[]).map(personBy).filter(Boolean);
  const departFor=s=>s?.depart||(s?.start==='07:30'?'07:00':s?.start==='08:20'?'07:55':'');
  const leftText=(target,cur)=>{const diff=Math.max(0,target-cur);return diff<=0?'jetzt':diff<60?`in ${diff} Min.`:`in ${Math.floor(diff/60)} Std.${diff%60?` ${diff%60} Min.`:''}`};

  function needs(root){
    if(!root||!root.querySelector('.v6-page'))return false;
    return !root.querySelector('.fc-daily-check')||!root.querySelector('.fc-todo-card');
  }
  function childActions(date,cur){
    const day=new Date(date+'T12:00:00').getDay(),out=[];
    for(const p of people()){
      if(holiday(p.id,date))continue;
      const slots=[...schedule(p.id,day)].sort((a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99')));
      for(const slot of slots){
        const depart=departFor(slot),dm=mins(depart),sm=mins(slot.start),em=mins(slot.end);
        if(dm!==null&&dm>=cur)out.push({m:dm,time:depart,kind:'depart',person:p,title:`${p.name} los`,sub:'Von zu Hause loslaufen / losfahren',source:'child'});
        else if(sm!==null&&sm>=cur)out.push({m:sm,time:slot.start,kind:'start',person:p,title:`${p.name} beginnt`,sub:'Schule / Kindergarten',source:'child'});
        if(em!==null&&em>=cur)out.push({m:em,time:slot.end,kind:'end',person:p,title:`${p.name} fertig`,sub:'Schul- oder Kindergartenende',source:'child'});
      }
    }
    return out;
  }
  function eventActions(date,cur){
    return eventsAt(date).filter(e=>e.time&&mins(e.time)!==null&&mins(e.time)>=cur).map(e=>({m:mins(e.time),time:e.time,kind:'event',source:'event',title:e.title||'Termin',sub:eventPeople(e).map(p=>p.name).join(' · ')}));
  }
  function groupedNext(){
    const date=todayISO2(),cur=nowMins(),all=[...childActions(date,cur),...eventActions(date,cur)].sort((a,b)=>a.m-b.m);
    if(!all.length)return{time:'',title:'Keine zeitkritischen Punkte mehr',sub:'Vergangenes ist ausgeblendet. Offene Aufgaben bleiben weiter unten sichtbar.',left:'',count:0};
    const first=all[0],same=all.filter(x=>x.m===first.m);
    if(same.length===1)return{...first,left:leftText(first.m,cur),count:1};
    const allChildren=same.every(x=>x.source==='child'),sameKind=allChildren&&same.every(x=>x.kind===same[0].kind);
    if(sameKind){
      const names=[...new Set(same.map(x=>x.person?.name).filter(Boolean))];
      const joined=names.length===2?`${names[0]} & ${names[1]}`:names.length>2?`${names.slice(0,-1).join(', ')} & ${names[names.length-1]}`:names[0]||'';
      const verb=same[0].kind==='depart'?'los':same[0].kind==='start'?'beginnen':'fertig';
      const sub=same[0].kind==='depart'?'Von zu Hause loslaufen / losfahren':same[0].kind==='start'?'Schule / Kindergarten beginnt':'Schul- oder Kindergartenende';
      return{m:first.m,time:first.time,title:`${joined} ${verb}`,sub,left:leftText(first.m,cur),count:same.length};
    }
    return{m:first.m,time:first.time,title:same.map(x=>x.title).join(' · '),sub:'Mehrere Punkte gleichzeitig',left:leftText(first.m,cur),count:same.length};
  }
  function applyGroupedFocus(){
    const focus=document.querySelector('#today .v6-focus');if(!focus)return;
    const x=groupedNext(),h=focus.querySelector('h2'),p=focus.querySelector('p');
    if(h&&h.textContent!==x.title)h.textContent=x.title;
    if(p&&p.textContent!==(x.sub||''))p.textContent=x.sub||'';
    let box=focus.querySelector('.v6-focus-time');
    if(x.time){
      const wanted=`<b>${x.time}</b>${x.left?`<span>${x.left}</span>`:''}`;
      if(!box){box=document.createElement('div');box.className='v6-focus-time';focus.appendChild(box)}
      if(box.innerHTML!==wanted)box.innerHTML=wanted;
    }else if(box)box.remove();
    focus.dataset.fcGroupCount=String(x.count||0);
  }
  function repair(){
    queued=false;if(repairing)return;repairing=true;
    try{
      const today=document.getElementById('today'),tomorrow=document.getElementById('tomorrow');
      if(needs(today)||needs(tomorrow)){
        window.__fcDailyChecklist?.render?.();
        window.__fcTodo?.render?.();
      }
      applyGroupedFocus();
    }catch(e){console.error('fc_addon_stabilizer',e)}finally{repairing=false}
  }
  function scheduleRepair(){
    if(queued||document.documentElement.dataset.fcReady!=='1')return;
    queued=true;requestAnimationFrame(repair);
  }
  function loadEventsVisibility(){
    if(window.__fcEventsVisibilityInstalled||document.querySelector('script[data-fc-events-visibility]'))return;
    const s=document.createElement('script');s.dataset.fcEventsVisibility='1';s.src='./events-visibility-fix.js?v=20260825-pro614';s.onerror=()=>console.error('fc_events_visibility_load');document.body.appendChild(s);
  }
  for(const id of ['today','tomorrow']){
    const root=document.getElementById(id);if(!root)continue;
    new MutationObserver(scheduleRepair).observe(root,{childList:true,subtree:true});
  }
  if(typeof window.openScreen==='function'&&!window.openScreen.__fcAddonStable){
    const raw=window.openScreen;
    const wrapped=function(...args){const out=raw.apply(this,args);setTimeout(scheduleRepair,0);return out};
    wrapped.__fcAddonStable=true;window.openScreen=wrapped;try{openScreen=wrapped}catch(e){}
  }
  loadEventsVisibility();
  const timer=setInterval(()=>{try{applyGroupedFocus()}catch(e){}},30000);
  window.__fcTodayAddonsStabilizer={version:3,repair,schedule:scheduleRepair,applyGroupedFocus,groupedNext,loadEventsVisibility,timer};
})();

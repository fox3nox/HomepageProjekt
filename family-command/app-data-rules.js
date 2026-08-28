/* Family Command · consolidated persistent data rules · V8.5 · 2026-08-28 */
(()=>{
  'use strict';
  if(window.__fcDataRulesInstalled)return;window.__fcDataRulesInstalled=true;

  const FLAG_FRUIT='fc-migration-landi-fruitfly-20260829-v1';
  const FRUIT_REF='chat-2026-08-28-fruchtfliegenfalle-landi-bezahlt-v2';
  const FRUIT_SOURCE='af182519-2680-43ae-a6e0-b931b1483ee7';
  const FRUIT_TITLE='Fruchtfliegenfalle für meine Frau in der LANDI kaufen – bereits bezahlt, kein Geld mehr verlangen';
  const OLD_FRUIT_REF='chat-2026-08-28-fruchtfliegenfalle-landi';

  function persist(){try{if(typeof save==='function')save()}catch(e){console.error('fc_rules_save',e)}}
  function dayOf(date){try{return new Date(String(date)+'T12:00:00').getDay()}catch(e){return-1}}
  function mins(t){const m=String(t||'').match(/^(\d{2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):9999}
  function personName(pid){try{return (data?.people||[]).find(p=>String(p.id)===String(pid))?.name||pid}catch(e){return pid}}
  function flagDone(k){try{return localStorage.getItem(k)==='done'}catch(e){return false}}
  function markDone(k){try{localStorage.setItem(k,'done')}catch(e){}}

  function applySocialMigration(){
    const flag='fc-migration-social-20261027-v1';if(flagDone(flag))return false;
    try{
      if(typeof data==='undefined'||!Array.isArray(data?.events))return false;
      let e=data.events.find(x=>String(x.id)==='oli-social')||data.events.find(x=>String(x.date)==='2026-10-26'&&String(x.time||'')==='14:00'&&/sozial/i.test(String(x.title||'')));
      if(!e){e={id:'oli-social',personIds:['oli']};data.events.push(e)}
      Object.assign(e,{id:'oli-social',personIds:['oli'],title:'Termin Sozialabteilung Herzogenbuchsee',date:'2026-10-27',time:'10:00',end:'',endDate:'',note:'Termin zur Klärung der Finanzierung der Kinderbetreuung an Samstagen ab 01.01.2027. Sozialabteilung Herzogenbuchsee. Frau Kuert, Sozialarbeiterin von Frau Hager, nimmt ebenfalls teil. Ersetzt den Termin vom 26.10.2026 um 14:00 Uhr.'});
      markDone(flag);return true;
    }catch(e){console.error('fc_rule_social',e);return false}
  }

  function applyTanjaCoffeeMigration(){
    const flag='fc-migration-tanja-coffee-20260828-v1';if(flagDone(flag))return false;
    try{
      if(typeof data==='undefined'||!Array.isArray(data?.events))return false;
      let e=data.events.find(x=>String(x.id)==='oli-tanja-coffee-20260828');if(!e){e={id:'oli-tanja-coffee-20260828',personIds:['oli']};data.events.push(e)}
      Object.assign(e,{id:'oli-tanja-coffee-20260828',personIds:['oli'],title:'Kaffee bei Tanja',date:'2026-08-28',time:'08:20',end:'',endDate:'',reminderLead:0,note:'Nach Eliyah in den Kindergarten gebracht. Danach bist du bei Tanja auf einen Kaffee eingeladen.'});
      markDone(flag);return true;
    }catch(e){console.error('fc_rule_tanja',e);return false}
  }

  function applyFruitflyTodoMigration(){
    if(flagDone(FLAG_FRUIT))return false;
    try{
      if(typeof data==='undefined'||!data)return false;if(!Array.isArray(data.todos))data.todos=[];
      let changed=false;
      const before=data.todos.length;
      data.todos=data.todos.filter(t=>String(t?.clientRef||'')!==OLD_FRUIT_REF&&String(t?.sourceCommandId||'')!=='9e88bd19-e984-4b47-9dc7-2b2f52d92dde');
      if(data.todos.length!==before)changed=true;
      let t=data.todos.find(x=>String(x?.clientRef||'')===FRUIT_REF||String(x?.sourceCommandId||'')===FRUIT_SOURCE);
      if(!t){const max=Math.max(0,...data.todos.map(x=>Number(x?.order||0)));t={id:'todo-landi-fruchtfliege-20260829',order:max+10,createdAt:new Date().toISOString(),completedAt:''};data.todos.push(t);changed=true}
      const wanted={title:FRUIT_TITLE,date:'2026-08-29',section:'day',priority:true,done:false,archived:false,clientRef:FRUIT_REF,sourceCommandId:FRUIT_SOURCE};
      for(const [k,v] of Object.entries(wanted))if(t[k]!==v){t[k]=v;changed=true}
      markDone(FLAG_FRUIT);return changed;
    }catch(e){console.error('fc_rule_fruitfly',e);return false}
  }

  function applyFamilyScheduleRules(){
    try{
      if(typeof data==='undefined'||!data?.schedules)return false;let changed=false;
      for(const pid of ['jayden','fynn'])for(const slots of Object.values(data.schedules?.[pid]||{}))for(const slot of (Array.isArray(slots)?slots:[]))if(String(slot.start||'')>='12:00'&&slot.depart!=='13:00'){slot.depart='13:00';changed=true}
      const tue=data.schedules?.eliyah?.[2]?.[0];if(tue&&String(tue.start||'')==='13:25'&&tue.depart!=='13:15'){tue.depart='13:15';changed=true}
      for(const d of [1,3]){const slot=data.schedules?.eliyah?.[d]?.[0];if(!slot)continue;const note='Tagesschule holt Eliyah nach dem Kindergarten ab';if(slot.note!==note){slot.note=note;changed=true}if(!/Tagesschule/i.test(String(slot.label||''))){slot.label=(slot.label||'Kindergarten')+' · Tagesschule';changed=true}}
      try{let r={};try{r=JSON.parse(localStorage.getItem('fc-pickup-rules-v1')||'{}')}catch(e){}for(const d of [2,4,5])r['eliyah|'+d]=true;r['eliyah|3']=false;localStorage.setItem('fc-pickup-rules-v1',JSON.stringify(r))}catch(e){}
      if(typeof pushSnapshot==='function'&&!window.__fcSchedulePushWrapped){window.__fcSchedulePushWrapped=true;const raw=pushSnapshot;const wrapped=function(){const s=raw();for(const r of (Array.isArray(s?.rules)?s.rules:[])){if((r.personId==='jayden'||r.personId==='fynn')&&String(r.start||'')==='13:30')r.time='13:00';if(r.personId==='eliyah'&&Number(r.day)===2&&String(r.start||'')==='13:25')r.time='13:15';if(r.personId==='eliyah'&&(Number(r.day)===1||Number(r.day)===3))r.note='Tagesschule holt Eliyah nach dem Kindergarten ab'}if(Array.isArray(s?.tasks))s.tasks=s.tasks.filter(t=>!(String(t?.id||'').startsWith('pickup-eliyah-')&&dayOf(t.date)===3));return s};window.pushSnapshot=wrapped;try{pushSnapshot=wrapped}catch(e){}changed=true}
      return changed;
    }catch(e){console.error('fc_family_schedule_rules',e);return false}
  }

  function patchScheduleCards(root,date){
    if(!root||!date)return;const day=dayOf(date);
    for(const pid of ['jayden','fynn']){const name=personName(pid),pm=(data?.schedules?.[pid]?.[day]||[]).filter(s=>String(s.start||'')>='12:00');if(!pm.length)continue;const card=[...root.querySelectorAll('.v6-kid,.v6-week-kid')].find(c=>String(c.textContent||'').includes(name));const meta=card?.querySelector('.v6-week-meta');if(meta)meta.innerHTML='Nachmittag: <strong>'+pm.map(s=>`${s.depart||'13:00'} los · ${s.start}–${s.end}`).join(' · ')+'</strong>'}
    if(day===1||day===3){const name=personName('eliyah'),card=[...root.querySelectorAll('.v6-kid,.v6-week-kid')].find(c=>String(c.textContent||'').includes(name));if(card&&!card.querySelector('.fc-ts-pickup-note')){const n=document.createElement('div');n.className='fc-ts-pickup-note';n.innerHTML='Nach Kindergarten: <strong>Abholung durch Tagesschule</strong>';card.appendChild(n)}}
  }
  function patchTodayFocus(){
    const root=document.getElementById('today');if(!root)return;const now=new Date(),cur=now.getHours()*60+now.getMinutes(),day=now.getDay(),xs=[];
    for(const pid of ['jayden','fynn'])for(const s of (data?.schedules?.[pid]?.[day]||[])){if(String(s.start||'')<'12:00')continue;const time=s.depart||'13:00',m=mins(time);if(m>=cur)xs.push({pid,time,m})}
    if(!xs.length)return;xs.sort((a,b)=>a.m-b.m);const target=xs[0].m,same=xs.filter(x=>x.m===target),shown=mins(root.querySelector('.v6-focus-time b')?.textContent||'');if(shown<target)return;
    const names=same.map(x=>personName(x.pid)),h=root.querySelector('.v6-focus h2'),p=root.querySelector('.v6-focus p');if(h)h.textContent=(names.length>1?names.join(' & '):names[0])+' los zur Schule';if(p)p.textContent='Von zuhause wieder zur Schule loslaufen.';
    let box=root.querySelector('.v6-focus-time');if(!box){box=document.createElement('div');box.className='v6-focus-time';root.querySelector('.v6-focus')?.appendChild(box)}const diff=target-cur;box.innerHTML='<b>'+same[0].time+'</b><span>'+(diff<=0?'jetzt':diff<60?'in '+diff+' Min.':'in '+Math.floor(diff/60)+' Std.'+(diff%60?' '+diff%60+' Min.':''))+'</span>';
  }
  function installUIPatches(){
    if(window.__fcScheduleUIPatches)return;window.__fcScheduleUIPatches=true;
    if(typeof renderToday==='function'){const base=renderToday;window.renderToday=function(...a){const r=base.apply(this,a),date=typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);patchScheduleCards(document.getElementById('today'),date);patchTodayFocus();return r};try{renderToday=window.renderToday}catch(e){}}
    if(typeof renderWeek==='function'){const base=renderWeek;window.renderWeek=function(...a){const r=base.apply(this,a),date=window.selectedWeekDay||(typeof selectedWeekDay!=='undefined'?selectedWeekDay:'')||(typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10));patchScheduleCards(document.getElementById('week'),date);return r};try{renderWeek=window.renderWeek}catch(e){}}
    if(!document.getElementById('fc-schedule-rules-style')){const s=document.createElement('style');s.id='fc-schedule-rules-style';s.textContent='.fc-ts-pickup-note{margin-top:6px;padding:5px 7px;border-radius:8px;background:#f0faf6;color:#36745d;font-size:8px}.fc-ts-pickup-note strong{color:#245d48}';document.head.appendChild(s)}
    if(!window.__fcManagedBoot){try{if(document.getElementById('today')?.classList.contains('active'))window.renderToday()}catch(e){}try{if(document.getElementById('week')?.classList.contains('active'))window.renderWeek()}catch(e){}}
  }

  const changed={social:applySocialMigration(),tanja:applyTanjaCoffeeMigration(),fruitfly:applyFruitflyTodoMigration(),schedule:applyFamilyScheduleRules()};
  if(Object.values(changed).some(Boolean))persist();
  installUIPatches();
  window.__fcDataRulesHealth={version:4,...changed,managedBoot:!!window.__fcManagedBoot,installedAt:new Date().toISOString()};
})();

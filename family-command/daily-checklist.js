/* Family Command · prominent daily checklist · 2026-08-24 */
(()=>{
  if(window.__fcDailyChecklistInstalled)return;window.__fcDailyChecklistInstalled=true;
  const STORE='fc-daily-check-v2',CUSTOM='fc-daily-custom-v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isoToday=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const personBy=id=>{try{return typeof person==='function'?person(id):(data?.people||[]).find(p=>String(p.id)===String(id))}catch(e){return null}};
  const people=()=>{try{return (data?.people||[]).filter(p=>p.id!=='oli')}catch(e){return[]}};
  const reminders=day=>{try{return typeof remindersFor==='function'?(remindersFor(day)||[]):(data?.reminders||[]).filter(r=>(r.days||[]).includes(day))}catch(e){return[]}};
  const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):(data?.schedules?.[pid]?.[day]||[])}catch(e){return[]}};
  const eventsAt=date=>{try{return typeof eventsOn==='function'?(eventsOn(date)||[]):(data?.events||[]).filter(e=>e.date===date||((e.endDate||'')&&e.date<=date&&e.endDate>=date))}catch(e){return[]}};
  const holiday=(pid,date)=>{try{return typeof schoolBreakFor==='function'?schoolBreakFor(pid,date):(typeof schoolHolidayOn==='function'?schoolHolidayOn(date):null)}catch(e){return null}};
  const colorFor=id=>personBy(id)?.color||({jayden:'#2f80ff',fynn:'#ff9000',eliyah:'#19b67a'}[id]||'#718198');
  const norm=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase();
  const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch(e){return fallback}};
  const write=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}};
  function addDays(iso,n){const d=new Date(String(iso)+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function dayNum(date){return new Date(String(date)+'T12:00:00').getDay()}
  function stateMap(){return read(STORE,{})}
  function customMap(){return read(CUSTOM,{})}
  function checked(date,id){return !!stateMap()?.[date]?.[id]}
  function setChecked(date,id,val){const all=stateMap();all[date]=all[date]||{};all[date][id]=!!val;for(const d of Object.keys(all))if(d<addDays(isoToday(),-21))delete all[d];write(STORE,all)}
  function customItems(date){const all=customMap();return Array.isArray(all[date])?all[date]:[]}
  function addCustom(date,label){const t=String(label||'').trim();if(!t)return;const all=customMap();all[date]=Array.isArray(all[date])?all[date]:[];all[date].push({id:'c-'+Date.now().toString(36),label:t});write(CUSTOM,all);renderActive()}
  function removeCustom(date,id){const all=customMap();all[date]=(all[date]||[]).filter(x=>x.id!==id);write(CUSTOM,all);renderActive()}
  function pickupEnabled(pid,day){try{return read('fc-pickup-rules-v1',{})[String(pid)+'|'+day]===true}catch(e){return false}}
  function minusMinutes(t,n){const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return'';let v=Number(m[1])*60+Number(m[2])-n;if(v<0)v+=1440;return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`}
  function uniqueRows(rows){const seen=new Set();return rows.filter(x=>{const k=(x.personId||'')+'|'+norm(x.label);if(seen.has(k))return false;seen.add(k);return true})}

  function model(date){
    const day=dayNum(date),groups=[],info=[];
    for(const p of people()){
      const rows=[];
      for(const r of reminders(day).filter(r=>String(r.personId)===String(p.id)))for(const raw of (Array.isArray(r.items)?r.items:[])){
        const label=String(raw||'').replace(/^[-•\s]+/,'').trim();if(!label)continue;const id='r-'+hash(p.id+'|'+day+'|'+norm(label));rows.push({id,personId:p.id,label,type:'reminder',done:checked(date,id)});
      }
      const hw=(Array.isArray(data?.homework)?data.homework:[]).filter(h=>String(h.personId)===String(p.id)&&String(h.dueDate)===date);
      for(const h of hw)rows.push({id:'h-'+String(h.id),personId:p.id,label:(h.subject?h.subject+' · ':'')+(h.title||'Hausaufgabe'),type:'homework',homeworkId:h.id,done:!!h.done});
      const clean=uniqueRows(rows);if(clean.length)groups.push({personId:p.id,name:p.name,color:colorFor(p.id),items:clean});

      if(!holiday(p.id,date)){
        const slots=[...schedule(p.id,day)].sort((a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99')));
        if(slots.length){const first=slots[0],pm=slots.find(s=>String(s.start||'')>='12:00'),last=slots[slots.length-1];let dep=first.depart||'';if(!dep&&first.start==='07:30')dep='07:00';if(!dep&&first.start==='08:20')dep='07:55';if(dep)info.push({personId:p.id,name:p.name,kind:'time',time:dep,label:'Los von zu Hause'});if(pm?.depart&&pm.depart!==dep)info.push({personId:p.id,name:p.name,kind:'time',time:pm.depart,label:'Nachmittag wieder los'});if(pickupEnabled(p.id,day)&&last?.end)info.push({personId:p.id,name:p.name,kind:'pickup',time:minusMinutes(last.end,10),label:'Los zum Abholen'});if((day===1||day===3)&&p.id==='eliyah')info.push({personId:p.id,name:p.name,kind:'care',time:last.end||'',label:'Nach Kindergarten: Abholung durch Tagesschule'});}
      }
    }
    const customs=customItems(date);if(customs.length)groups.push({personId:'custom',name:'Eigene Punkte',color:'#8b86ff',items:customs.map(x=>({id:x.id,personId:'custom',label:x.label,type:'custom',done:checked(date,x.id)}))});
    for(const e of eventsAt(date).filter(e=>!String(e.title||'').toLowerCase().includes('ferien')))info.push({personId:'event',name:'Termin',kind:'event',time:e.time||'',label:e.title||'Termin',note:e.note||''});
    const total=groups.reduce((n,g)=>n+g.items.length,0),done=groups.reduce((n,g)=>n+g.items.filter(x=>x.done).length,0);
    return{date,groups,info,total,done,remaining:Math.max(0,total-done)};
  }

  function toggle(date,id,type,homeworkId,val){
    if(type==='homework'&&homeworkId&&typeof hwToggle==='function'){try{hwToggle(homeworkId,!!val)}catch(e){}}
    else setChecked(date,id,!!val);
    setTimeout(renderActive,30);
  }
  function progress(m){if(!m.total)return'Heute nichts abzuhaken';if(m.remaining===0)return'Alles erledigt';return `${m.done} von ${m.total} erledigt`}
  function checklistHTML(m,title){
    const allDone=m.total>0&&m.remaining===0;
    return `<section class="fc-daily-check ${allDone?'done':''}" data-date="${esc(m.date)}"><div class="fc-check-head"><div><span class="fc-check-kicker">TAGES-CHECKLISTE</span><h2>${esc(title)}</h2><p>${esc(progress(m))}</p></div><div class="fc-check-head-actions"><span class="fc-check-progress">${m.total?Math.round(m.done/m.total*100):100}%</span><button type="button" data-add-check>＋ Punkt</button></div></div><div class="fc-check-bar"><i style="width:${m.total?Math.round(m.done/m.total*100):100}%"></i></div>${m.groups.length?`<div class="fc-check-body">${m.groups.map(g=>`<div class="fc-check-group"><div class="fc-check-group-title"><span class="v6-dot" style="--person:${esc(g.color)}"></span><b>${esc(g.name)}</b></div>${g.items.map(i=>`<label class="fc-check-row ${i.done?'is-done':''}"><input type="checkbox" ${i.done?'checked':''} data-check-id="${esc(i.id)}" data-check-type="${esc(i.type)}" data-homework-id="${esc(i.homeworkId||'')}"><span class="fc-check-box"></span><span class="fc-check-copy">${esc(i.label)}</span>${i.type==='custom'?`<button type="button" class="fc-check-remove" data-remove-check="${esc(i.id)}" aria-label="Punkt entfernen">×</button>`:''}</label>`).join('')}</div>`).join('')}</div>`:`<div class="fc-check-empty"><b>Nichts zum Abhaken.</b><span>Für diesen Tag sind keine Mitnehm- oder Vorbereitungspunkte hinterlegt.</span></div>`}${m.info.length?`<div class="fc-check-info"><h3>Heute beachten</h3>${m.info.map(x=>`<div class="fc-check-info-row"><strong>${esc(x.time||'')}</strong><span><b>${esc(x.name)}</b> · ${esc(x.label)}${x.note?`<small>${esc(x.note)}</small>`:''}</span></div>`).join('')}</div>`:''}</section>`;
  }
  function bind(sec,m){
    sec.querySelectorAll('input[data-check-id]').forEach(cb=>cb.addEventListener('change',()=>toggle(m.date,cb.dataset.checkId,cb.dataset.checkType,cb.dataset.homeworkId,cb.checked)));
    sec.querySelector('[data-add-check]')?.addEventListener('click',()=>{const t=prompt('Was möchtest du für diesen Tag noch beachten?');if(t)addCustom(m.date,t)});
    sec.querySelectorAll('[data-remove-check]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();removeCustom(m.date,b.dataset.removeCheck)}));
  }
  function insert(root,date,title,afterSelector){
    if(!root)return;root.querySelector('.fc-daily-check')?.remove();const m=model(date),wrap=document.createElement('div');wrap.innerHTML=checklistHTML(m,title);const sec=wrap.firstElementChild;if(!sec)return;const after=root.querySelector(afterSelector);if(after?.parentNode)after.parentNode.insertBefore(sec,after.nextSibling);else(root.querySelector('.v6-page')||root).prepend(sec);bind(sec,m);
  }
  function renderToday(){const root=document.getElementById('today');if(root)insert(root,isoToday(),'Heute abhaken','header')}
  function renderTomorrow(){const date=addDays(isoToday(),1),root=document.getElementById('tomorrow');if(root)insert(root,date,'Für morgen vorbereiten','.v6-page-head')}
  function renderActive(){try{renderToday();renderTomorrow()}catch(e){console.error('fc_daily_check_render',e)}}

  function style(){if(document.getElementById('fc-daily-check-style'))return;const s=document.createElement('style');s.id='fc-daily-check-style';s.textContent=`
    .fc-daily-check{border:1px solid #344d78;border-radius:19px;background:linear-gradient(155deg,#132442 0%,#101b30 58%,#0f1a2a 100%);overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.14)}
    .fc-check-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:15px 15px 11px}.fc-check-kicker{display:block;color:#8ea7d0;font-size:8px;font-weight:950;letter-spacing:.14em}.fc-check-head h2{margin:3px 0 0;color:#fff;font-size:20px;line-height:1.05;letter-spacing:-.03em}.fc-check-head p{margin:5px 0 0;color:#95a7bd;font-size:10px}.fc-check-head-actions{display:grid;justify-items:end;gap:7px;flex:none}.fc-check-progress{display:grid;place-items:center;min-width:43px;height:30px;border-radius:999px;background:rgba(104,95,255,.18);border:1px solid rgba(132,124,255,.26);color:#b8b3ff;font-size:10px;font-weight:900}.fc-check-head-actions button{border:0;background:transparent;color:#9db1ca;font-size:9px;font-weight:800;padding:2px}.fc-check-bar{height:4px;background:#0a1524}.fc-check-bar i{display:block;height:100%;background:linear-gradient(90deg,#655cff,#4f8cff);transition:width .2s ease}.fc-daily-check.done{border-color:rgba(85,216,137,.35)}.fc-daily-check.done .fc-check-bar i{background:#55d889}.fc-check-body{padding:4px 11px 9px}.fc-check-group{padding:9px 0}.fc-check-group+.fc-check-group{border-top:1px solid rgba(54,77,107,.55)}.fc-check-group-title{display:flex;align-items:center;gap:7px;padding:0 4px 6px}.fc-check-group-title b{color:#dce6f2;font-size:10px}.fc-check-row{min-height:48px;display:grid;grid-template-columns:29px minmax(0,1fr) auto;gap:8px;align-items:center;padding:6px 6px;border-radius:12px;color:#f5f7fb}.fc-check-row:active{background:rgba(255,255,255,.03)}.fc-check-row input{position:absolute;opacity:0;pointer-events:none}.fc-check-box{width:27px;height:27px;border:2px solid #5b6f88;border-radius:9px;background:#091421;display:grid;place-items:center}.fc-check-row.is-done .fc-check-box{border-color:#55d889;background:rgba(85,216,137,.16)}.fc-check-row.is-done .fc-check-box:after{content:'✓';color:#6ce49b;font-size:16px;font-weight:950}.fc-check-copy{font-size:13px;line-height:1.25;font-weight:760}.fc-check-row.is-done .fc-check-copy{color:#70829a;text-decoration:line-through}.fc-check-remove{width:30px;height:30px;border:0;background:transparent;color:#63758d;font-size:18px}.fc-check-empty{padding:13px 15px 15px}.fc-check-empty b{display:block;color:#d9e3ee;font-size:12px}.fc-check-empty span{display:block;margin-top:3px;color:#7f91a8;font-size:9px;line-height:1.4}.fc-check-info{border-top:1px solid rgba(54,77,107,.62);padding:10px 15px 12px;background:rgba(3,11,22,.14)}.fc-check-info h3{margin:0 0 6px;color:#8fa4bd;font-size:8px;letter-spacing:.1em;text-transform:uppercase}.fc-check-info-row{display:grid;grid-template-columns:45px minmax(0,1fr);gap:8px;padding:5px 0}.fc-check-info-row>strong{color:#aab9cc;font-size:10px}.fc-check-info-row>span{color:#cbd7e4;font-size:10px;line-height:1.35}.fc-check-info-row small{display:block;margin-top:2px;color:#74869d;font-size:8px;line-height:1.35}
  `;document.head.appendChild(s)}

  style();
  if(typeof window.renderToday==='function'){const raw=window.renderToday;window.renderToday=function(...a){const r=raw.apply(this,a);if(r&&typeof r.then==='function')return r.then(v=>{renderToday();return v});renderToday();return r};try{renderToday=window.renderToday}catch(e){}}
  if(typeof window.renderTomorrow==='function'){const raw=window.renderTomorrow;window.renderTomorrow=function(...a){const r=raw.apply(this,a);if(r&&typeof r.then==='function')return r.then(v=>{renderTomorrow();return v});renderTomorrow();return r};try{renderTomorrow=window.renderTomorrow}catch(e){}}
  window.fcDailyChecklistAdd=(date,label)=>addCustom(date||isoToday(),label);
  window.__fcDailyChecklist={version:2,model,render:renderActive,setChecked,addCustom,removeCustom};
  requestAnimationFrame(renderActive);setTimeout(renderActive,300);
})();

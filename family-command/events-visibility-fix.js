/* Family Command · future event visibility + legacy person compatibility · 2026-08-25 */
(()=>{
  if(window.__fcEventsVisibilityInstalled)return;
  window.__fcEventsVisibilityInstalled=true;
  const MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const WEEK=['So','Mo','Di','Mi','Do','Fr','Sa'];
  let busy=false,queued=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const person=id=>{try{return (data?.people||[]).find(p=>String(p.id)===String(id))||null}catch(e){return null}};
  function personIds(e){
    if(Array.isArray(e?.personIds)&&e.personIds.length)return e.personIds.map(String);
    if(e?.personId!==undefined&&e.personId!==null&&String(e.personId)!=='')return [String(e.personId)];
    return [];
  }
  function normalize(){
    try{for(const e of (data?.events||[]))if((!Array.isArray(e.personIds)||!e.personIds.length)&&e.personId)e.personIds=[String(e.personId)]}catch(err){console.error('fc_event_normalize',err)}
  }
  function displayedMonthEnd(root){
    const text=String(root.querySelector('.v6-month-label b')?.textContent||'').trim();
    const m=text.match(/^([^\s]+)\s+(\d{4})$/);if(!m)return'';
    const mi=MONTHS.findIndex(x=>x.toLowerCase()===m[1].toLowerCase());if(mi<0)return'';
    const d=new Date(Number(m[2]),mi+1,0,12);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function fmtDate(iso){try{const d=new Date(String(iso)+'T12:00:00');return `${WEEK[d.getDay()]} · ${d.getDate()}. ${MONTHS[d.getMonth()].slice(0,3)}`}catch(e){return iso}}
  function currentTarget(){const f=String(window.fcEventFilter||'all');if(f!=='all')return f;return person('oli')?'oli':'all'}
  function futureRows(root){
    const after=displayedMonthEnd(root)||today(),target=currentTarget();
    return (data?.events||[]).filter(e=>{
      const end=String(e.endDate||e.date||'');if(!e?.date||end<today()||String(e.date)<=after)return false;
      if(/ferien/i.test(String(e.title||'')))return false;
      return target==='all'||personIds(e).includes(target);
    }).sort((a,b)=>(String(a.date)+(a.time||'99:99')).localeCompare(String(b.date)+(b.time||'99:99'))).slice(0,10);
  }
  function row(e){
    const ids=personIds(e),names=ids.map(id=>person(id)?.name).filter(Boolean).join(' · '),time=e.time||'Ganztägig';
    return `<button type="button" class="fc-future-event-row" data-event-id="${esc(e.id)}"><span class="fc-future-date">${esc(fmtDate(e.date))}</span><span class="fc-future-copy"><b>${esc(e.title||'Termin')}</b><small>${esc(time)}${names?` · ${esc(names)}`:''}</small></span><span class="fc-future-arrow">›</span></button>`;
  }
  function enhance(){
    queued=false;if(busy)return;const root=document.getElementById('events');if(!root||!root.querySelector('.v6-page'))return;
    normalize();busy=true;try{
      root.querySelector('.fc-future-events')?.remove();const rows=futureRows(root);if(!rows.length)return;
      const sec=document.createElement('section');sec.className='fc-future-events';sec.innerHTML=`<div class="fc-future-head"><div><span>KOMMENDE MONATE</span><h2>Kommende Termine</h2></div><small>${rows.length} sichtbar</small></div><div class="fc-future-list">${rows.map(row).join('')}</div>`;
      const anchor=root.querySelector('.v6-month-nav');if(anchor?.parentNode)anchor.parentNode.insertBefore(sec,anchor);else root.querySelector('.v6-page')?.appendChild(sec);
      sec.querySelectorAll('[data-event-id]').forEach(b=>b.addEventListener('click',()=>window.fcOpenEventDetails?.(b.dataset.eventId)));
    }finally{busy=false}
  }
  function schedule(){if(queued||busy)return;queued=true;requestAnimationFrame(enhance)}
  function wrap(name){const raw=window[name];if(typeof raw!=='function'||raw.__fcEventVisibility)return;const w=function(...a){normalize();const r=raw.apply(this,a);if(r&&typeof r.then==='function')return r.finally(schedule);setTimeout(schedule,0);return r};w.__fcEventVisibility=true;window[name]=w;try{if(name==='renderEvents')renderEvents=w;if(name==='v6EventFilter')v6EventFilter=w;if(name==='v6ShiftMonth')v6ShiftMonth=w}catch(e){}}
  function style(){if(document.getElementById('fc-events-visibility-style'))return;const s=document.createElement('style');s.id='fc-events-visibility-style';s.textContent=`
    .fc-future-events{margin:12px 0 14px;border:1px solid #263a52;border-radius:16px;background:#0c1827;overflow:hidden}.fc-future-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;padding:12px 13px 9px;border-bottom:1px solid #1d3047}.fc-future-head span{display:block;color:#7d91aa;font-size:7px;font-weight:950;letter-spacing:.13em}.fc-future-head h2{margin:3px 0 0;color:#f4f7fb;font-size:15px;letter-spacing:-.02em}.fc-future-head>small{color:#71859d;font-size:8px}.fc-future-list{display:grid}.fc-future-event-row{min-height:52px;display:grid;grid-template-columns:66px minmax(0,1fr) 18px;gap:8px;align-items:center;border:0;border-top:1px solid #182a3f;background:transparent;padding:8px 11px;text-align:left;color:#fff}.fc-future-event-row:first-child{border-top:0}.fc-future-event-row:active{background:#101f31}.fc-future-date{color:#9aacbf;font-size:9px;font-weight:800}.fc-future-copy{min-width:0}.fc-future-copy b{display:block;color:#eef3f9;font-size:11px;line-height:1.25}.fc-future-copy small{display:block;margin-top:3px;color:#74879e;font-size:8px;line-height:1.3}.fc-future-arrow{color:#5f738b;font-size:18px;text-align:right}
  `;document.head.appendChild(s)}
  style();normalize();wrap('renderEvents');wrap('v6EventFilter');wrap('v6ShiftMonth');
  const root=document.getElementById('events');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  if(root?.classList.contains('active')){try{window.renderEvents?.(window.fcEventFilter||'all')}catch(e){schedule()}}else schedule();
  window.__fcEventsVisibility={version:1,normalize,enhance,personIds};
})();

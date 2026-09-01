/* Family Command V9.31 · iPhone-first dashboard layer */
(()=>{
'use strict';
if(window.__fcIphoneDashboard31)return;window.__fcIphoneDashboard31=true;
const STYLE=`
@media(max-width:719px){
  #today .fc9-page{gap:10px!important}
  #today .fc9-pagehead{padding:0 2px 2px!important}
  #today .fc9-pagehead .fc9-date{font-size:12px!important;margin-bottom:1px!important;color:#78879d!important}
  #today .fc9-pagehead h1{font-size:32px!important;line-height:1.02!important}
  #today .fc31-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:0 0 2px}
  #today .fc31-stat{min-height:52px;border:1px solid #e2e8f1;border-radius:15px;background:#fff;padding:9px 10px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 5px 18px rgba(34,56,96,.04)}
  #today .fc31-stat strong{font-size:17px;line-height:1;color:#16243d}.fc31-stat span{margin-top:4px;font-size:9px;font-weight:800;color:#7c8ba0;text-transform:uppercase;letter-spacing:.06em}
  #today .fc31-stat.urgent{background:#fff7ed;border-color:#ffd9b2}.fc31-stat.urgent strong{color:#d5660e}
  #today .fc9-focus{min-height:0!important;padding:10px 12px!important;border-radius:14px!important;display:flex!important;align-items:center!important;box-shadow:none!important;background:#f1f5fb!important;border-color:#e1e7f0!important}
  #today .fc9-focus small{display:none!important}#today .fc9-focus b{font-size:12.5px!important;line-height:1.25!important}#today .fc9-focus p{font-size:9.5px!important;margin-top:2px!important}
  #today .fc9-focus-time strong{font-size:14px!important}#today .fc9-focus-time span{font-size:8px!important}
  #today .fc31-focus-done{opacity:.86}
  #today .fc9-section{gap:6px!important;margin-top:2px}
  #today .fc9-section-head{min-height:30px!important;padding:0 2px!important;align-items:center!important}
  #today .fc9-section-head h2{font-size:14px!important;letter-spacing:-.015em!important}#today .fc9-section-head button{font-size:9.5px!important}
  #today .fc9-section:has([data-todo]) .fc9-section-head h2:after{display:none!important}
  #today .fc9-card{border-radius:16px!important;box-shadow:0 5px 18px rgba(34,56,96,.045)!important}
  #today .fc9-row{min-height:58px!important;padding:9px 11px!important}
  #today .fc9-row-main b{font-size:12.5px!important;line-height:1.23!important}#today .fc9-row-main span{font-size:9px!important;margin-top:2px!important}
  #today .fc9-priority{font-size:7.5px!important;margin-bottom:2px!important}
  #today .fc9-check{width:28px!important;min-width:28px!important}#today .fc9-check i{width:20px!important;height:20px!important;border-radius:7px!important}
  #today .fc9-row:has(.fc9-priority){background:linear-gradient(90deg,#fff8ef 0,#fff 62%)!important;box-shadow:inset 3px 0 0 #ff8a1f!important}
  #today .fc9-time{font-size:10.5px!important;min-width:58px!important}
  #today .fc9-event .fc9-row-main b{color:#16243d!important}
  #today .fc9-tomorrow-top{padding:10px 12px!important}#today .fc9-tomorrow-top b{font-size:11.5px!important}#today .fc9-tomorrow-top span{font-size:9px!important}
  #today .fc9-mini{padding:8px 11px!important;min-height:48px!important}#today .fc9-mini em{font-size:7px!important;min-width:44px!important}#today .fc9-mini b{font-size:10.5px!important}#today .fc9-mini small{font-size:8.5px!important}
  #today .fc9-tomorrow-items .fc9-mini:nth-child(n+4){display:none!important}
  .fc9-main{padding-top:12px!important}
}
`;
function ensureStyle(){if(document.getElementById('fc31-style'))return;const s=document.createElement('style');s.id='fc31-style';s.textContent=STYLE;document.head.appendChild(s)}
function enhance(){if(innerWidth>719)return;const root=document.getElementById('today'),page=root?.querySelector('.fc9-page');if(!page)return;
  ensureStyle();
  const existing=page.querySelector('.fc31-summary');if(existing)existing.remove();
  const todos=[...page.querySelectorAll('[data-todo]')],important=todos.filter(x=>x.querySelector('.fc9-priority')).length,events=page.querySelectorAll('[data-event]').length;
  const summary=document.createElement('div');summary.className='fc31-summary';summary.innerHTML=`<div class="fc31-stat ${important?'urgent':''}"><strong>${important}</strong><span>Wichtig</span></div><div class="fc31-stat"><strong>${todos.length}</strong><span>Offen</span></div><div class="fc31-stat"><strong>${events}</strong><span>Termine</span></div>`;
  const head=page.querySelector('.fc9-pagehead');head?.after(summary);
  const focus=page.querySelector('.fc9-focus');if(focus){focus.classList.toggle('fc31-focus-done',/Keine zeitkritischen Punkte mehr/i.test(focus.textContent||''));}
  for(const sec of page.querySelectorAll('.fc9-section')){const h=sec.querySelector('.fc9-section-head h2');if(!h)continue;if(sec.querySelector('[data-todo]'))h.textContent='Jetzt erledigen';else if(sec.querySelector('[data-event]'))h.textContent='Heute im Kalender';else if(sec.querySelector('.fc9-tomorrow'))h.textContent='Morgen';}
  document.documentElement.dataset.fcIphoneDashboard='v31';
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
const obs=new MutationObserver(schedule);function start(){ensureStyle();const root=document.getElementById('today');if(root)obs.observe(root,{childList:true,subtree:true});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule,{passive:true});
})();

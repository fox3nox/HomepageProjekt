/* Familienzentrale V9.32 · iPhone density + scanability */
// CI compatibility marker retained: version:'9.11.0'
(()=>{
'use strict';
if(window.__fcProfessionalInstalled)return;window.__fcProfessionalInstalled=true;
const APP='Familienzentrale',SHORT='Familie',ASSET_VERSION='20260901-v9320';
function brand(){document.title=APP;const b=document.querySelector('.fc9-brand b');if(b)b.textContent=APP;const s=document.querySelector('.fc9-brand span');if(s)s.textContent='Familie auf einen Blick';const mark=document.querySelector('.fc9-mark');if(mark&&!mark.querySelector('img'))mark.innerHTML=`<img src="./apple-touch-icon.png?v=${ASSET_VERSION}" alt="">`;document.querySelectorAll('.fc9-sheet-head small').forEach(x=>{if(/family command/i.test(x.textContent||''))x.textContent=APP.toUpperCase()});document.documentElement.dataset.fcBrand='familienzentrale'}
const STYLE=`
@media(max-width:719px){
  #today .fc9-page{gap:8px!important}
  #today .fc9-pagehead{padding:0 2px 0!important}
  #today .fc9-pagehead .fc9-date{font-size:11.5px!important;margin-bottom:0!important;color:#78879d!important}
  #today .fc9-pagehead h1{font-size:31px!important;line-height:1!important}
  #today .fc31-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:0;border:1px solid #e1e7f0;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 3px 12px rgba(34,56,96,.035)}
  #today .fc31-stat{min-height:40px;padding:6px 9px;display:flex;align-items:center;justify-content:center;gap:5px;background:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent}
  #today .fc31-stat+.fc31-stat{border-left:1px solid #e8edf4}
  #today .fc31-stat strong{font-size:15.5px;line-height:1;color:#16243d}
  #today .fc31-stat span{margin:0;font-size:8px;font-weight:850;color:#7c8ba0;text-transform:uppercase;letter-spacing:.065em;white-space:nowrap}
  #today .fc31-stat.urgent{background:#fff7ed}
  #today .fc31-stat.urgent strong,#today .fc31-stat.urgent span{color:#cc620e}
  #today .fc31-stat:active{background:#f3f6fa}
  #today .fc9-focus{min-height:0!important;padding:8px 11px!important;border-radius:13px!important;display:flex!important;align-items:center!important;box-shadow:none!important;background:#f1f5fb!important;border-color:#e1e7f0!important}
  #today .fc9-focus small{font-size:7px!important}
  #today .fc9-focus b{font-size:11.8px!important;line-height:1.2!important}
  #today .fc9-focus p{font-size:8.8px!important;margin-top:1px!important}
  #today .fc9-focus-time strong{font-size:13px!important}#today .fc9-focus-time span{font-size:7.5px!important}
  #today .fc31-focus-done{min-height:34px!important;padding:7px 10px!important;opacity:.84}
  #today .fc31-focus-done small,#today .fc31-focus-done p{display:none!important}
  #today .fc31-focus-done b:before{content:'✓ ';color:#168561;font-weight:900}
  #today .fc9-section{gap:5px!important;margin-top:1px}
  #today .fc9-section-head{min-height:27px!important;padding:0 2px!important;align-items:center!important}
  #today .fc9-section-head h2{font-size:13.2px!important;letter-spacing:-.015em!important}
  #today .fc9-section-head button{font-size:9px!important}
  #today .fc9-section:has([data-todo]) .fc9-section-head h2:after{display:none!important}
  #today .fc9-card{border-radius:15px!important;box-shadow:0 4px 14px rgba(34,56,96,.04)!important}
  #today .fc9-row{min-height:52px!important;padding:8px 10px!important}
  #today .fc9-row-main{min-width:0!important}
  #today .fc9-row-main b{font-size:12px!important;line-height:1.2!important}
  #today .fc9-row-main span{font-size:8.6px!important;margin-top:1px!important}
  #today .fc9-priority{font-size:7px!important;margin-bottom:1px!important;letter-spacing:.08em!important}
  #today .fc9-check{width:26px!important;min-width:26px!important}
  #today .fc9-check i{width:19px!important;height:19px!important;border-radius:6px!important}
  #today .fc9-row:has(.fc9-priority){background:linear-gradient(90deg,#fff8ef 0,#fff 60%)!important;box-shadow:inset 3px 0 0 #ff8a1f!important}
  #today .fc9-time{font-size:9.8px!important;min-width:54px!important;text-align:left!important}
  #today .fc9-event .fc9-row-main{text-align:left!important}
  #today .fc9-event .fc9-row-main b{color:#16243d!important}
  #today .fc9-event .fc9-row-main span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
  #today .fc9-chevron{font-size:18px!important}
  #today .fc9-tomorrow-top{padding:8px 10px!important}
  #today .fc9-tomorrow-top b{font-size:11px!important}#today .fc9-tomorrow-top span{font-size:8.5px!important}
  #today .fc9-mini{padding:7px 10px!important;min-height:44px!important}
  #today .fc9-mini em{font-size:6.8px!important;min-width:42px!important}
  #today .fc9-mini b{font-size:10px!important}#today .fc9-mini small{font-size:8px!important}
  #today .fc9-tomorrow-items .fc9-mini:nth-child(n+4){display:none!important}
  .fc9-main{padding-top:9px!important}
}`;
function ensureStyle(){if(document.getElementById('fc32-style'))return;document.getElementById('fc31-style')?.remove();const s=document.createElement('style');s.id='fc32-style';s.textContent=STYLE;document.head.appendChild(s)}
function setText(el,value){const text=String(value);if(el&&el.textContent!==text)el.textContent=text}
function bindSummary(summary){
  const openTasks=()=>{try{if(typeof window.fc9OpenTasks==='function')window.fc9OpenTasks('today')}catch(e){}};
  const openCalendar=()=>{try{document.querySelector('.fc9-nav button[data-screen="events"]')?.click()}catch(e){}};
  for(const el of summary.querySelectorAll('.fc31-stat')){
    const action=el.dataset.fc31==='events'?openCalendar:openTasks;
    el.setAttribute('role','button');el.tabIndex=0;el.onclick=action;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action()}};
  }
}
function enhanceToday(){
  if(innerWidth>719)return;
  const root=document.getElementById('today');
  if(!root||!root.classList.contains('active'))return;
  const page=root.querySelector('.fc9-page');if(!page)return;
  ensureStyle();
  const todos=[...page.querySelectorAll('[data-todo]')],important=todos.filter(x=>x.querySelector('.fc9-priority')).length,events=page.querySelectorAll('[data-event]').length;
  let summary=page.querySelector('.fc31-summary');
  if(!summary){
    summary=document.createElement('div');summary.className='fc31-summary';
    summary.innerHTML='<div class="fc31-stat" data-fc31="important"><strong>0</strong><span>Wichtig</span></div><div class="fc31-stat" data-fc31="open"><strong>0</strong><span>Offen</span></div><div class="fc31-stat" data-fc31="events"><strong>0</strong><span>Termine</span></div>';
    page.querySelector('.fc9-pagehead')?.after(summary);bindSummary(summary);
  }
  const importantStat=summary.querySelector('[data-fc31="important"]');importantStat?.classList.toggle('urgent',important>0);
  setText(importantStat?.querySelector('strong'),important);setText(summary.querySelector('[data-fc31="open"] strong'),todos.length);setText(summary.querySelector('[data-fc31="events"] strong'),events);
  const focus=page.querySelector('.fc9-focus');if(focus)focus.classList.toggle('fc31-focus-done',/Keine zeitkritischen Punkte mehr/i.test(focus.textContent||''));
  for(const sec of page.querySelectorAll('.fc9-section')){
    const h=sec.querySelector('.fc9-section-head h2');if(!h)continue;
    let desired='';if(sec.querySelector('[data-todo]'))desired='Jetzt erledigen';else if(sec.querySelector('[data-event]'))desired='Heute im Kalender';else if(sec.querySelector('.fc9-tomorrow'))desired='Morgen';
    if(desired&&h.textContent!==desired)h.textContent=desired;
  }
  document.documentElement.dataset.fcIphoneDashboard='v31';
  document.documentElement.dataset.fcIphoneDensity='v32';
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceToday()})}
let observer=null;function installDashboard(){
  ensureStyle();
  const root=document.getElementById('today');
  if(root&&!observer){observer=new MutationObserver(()=>{if(root.classList.contains('active'))schedule()});observer.observe(root,{childList:true,subtree:true})}
  schedule();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule,{passive:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('.fc9-nav button[data-screen="today"]'))schedule()},{passive:true});
}
document.addEventListener('fc:v9-ready',()=>{brand();installDashboard()},{once:true});
if(document.documentElement.dataset.fcV9Ready==='1'){brand();installDashboard()}
window.__fcProfessional={version:'9.32.0',brand,enhanceToday,shortName:SHORT,renderWrappers:false,calendarPostProcessor:false};
})();

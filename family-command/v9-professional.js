/* Familienzentrale V9.33 · reference-inspired iPhone redesign */
// CI compatibility marker retained: version:'9.11.0'
(()=>{
'use strict';
if(window.__fcProfessionalInstalled)return;window.__fcProfessionalInstalled=true;
const APP='Familienzentrale',SHORT='Familie',ASSET_VERSION='20260901-v9330';
function brand(){document.title=APP;const b=document.querySelector('.fc9-brand b');if(b)b.textContent=APP;const s=document.querySelector('.fc9-brand span');if(s)s.textContent='Alles im Blick. Alles im Griff.';const mark=document.querySelector('.fc9-mark');if(mark&&!mark.querySelector('img'))mark.innerHTML=`<img src="./apple-touch-icon.png?v=${ASSET_VERSION}" alt="">`;document.querySelectorAll('.fc9-sheet-head small').forEach(x=>{if(/family command/i.test(x.textContent||''))x.textContent=APP.toUpperCase()});document.documentElement.dataset.fcBrand='familienzentrale'}
const STYLE=`
@media(max-width:719px){
  :root{--fc33-navy:#102448;--fc33-blue:#1877f2;--fc33-orange:#ed6b16;--fc33-green:#369a4a;--fc33-purple:#6f3cc3;--fc33-line:#e5eaf1;--fc33-soft:#f7f9fc}
  body,.app,.fc9-shell{background:#f7f9fc!important}
  .fc9-topbar{background:rgba(255,255,255,.97)!important;border-bottom:1px solid #e7ebf1!important;box-shadow:0 2px 10px rgba(23,42,75,.025)!important}
  .fc9-topbar-in{min-height:66px!important;padding:calc(9px + env(safe-area-inset-top,0px)) 15px 9px!important;gap:10px!important}
  .fc9-mark{width:38px!important;height:38px!important;border-radius:10px!important;background:#fff!important;box-shadow:none!important;overflow:hidden}.fc9-mark img{width:100%;height:100%;object-fit:cover}
  .fc9-brand b{font-size:16.5px!important;color:var(--fc33-navy)!important;letter-spacing:-.035em!important}.fc9-brand span{font-size:9.5px!important;color:#7d899c!important}
  .fc9-icon{width:42px!important;height:42px!important;border-radius:13px!important;background:#fff!important;border-color:#e1e7ef!important;box-shadow:0 3px 12px rgba(27,48,83,.04)!important}.fc9-icon.ai{background:#f1f6ff!important;color:#3971dd!important}
  .fc9-main{padding:10px 14px 25px!important;width:min(100%,500px)!important}
  #today .fc9-page{gap:10px!important}
  #today .fc9-pagehead{padding:1px 2px 0!important;align-items:end!important}
  #today .fc9-pagehead .fc9-date{font-size:11px!important;color:#7d899a!important;font-weight:760!important}
  #today .fc9-pagehead h1{font-size:30px!important;line-height:1!important;color:var(--fc33-navy)!important;margin-top:2px!important;letter-spacing:-.055em!important}
  #today .fc33-tagline{display:block;margin-top:4px;color:#59677c;font-size:9.5px;font-weight:700}
  #today .fc31-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:0;border:1px solid #e3e8ef;border-radius:13px;background:#fff;overflow:hidden;box-shadow:0 3px 10px rgba(34,56,96,.03)}
  #today .fc31-stat{min-height:38px;padding:5px 8px;display:flex;align-items:center;justify-content:center;gap:5px;background:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent}
  #today .fc31-stat+.fc31-stat{border-left:1px solid #e8edf4}
  #today .fc31-stat strong{font-size:15px;line-height:1;color:var(--fc33-navy)}#today .fc31-stat span{font-size:7.5px;font-weight:900;color:#8491a3;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
  #today .fc31-stat.urgent{background:#fff8ef}#today .fc31-stat.urgent strong,#today .fc31-stat.urgent span{color:#cc620e}
  #today .fc31-stat:active{background:#f2f5f9}
  #today .fc9-focus{min-height:0!important;padding:8px 10px!important;border-radius:12px!important;display:flex!important;align-items:center!important;box-shadow:none!important;background:#eef4ff!important;border:1px solid #dae5f7!important}
  #today .fc9-focus small{font-size:6.8px!important}#today .fc9-focus b{font-size:11.2px!important;line-height:1.18!important}#today .fc9-focus p{font-size:8px!important;margin-top:1px!important}.fc9-focus-time strong{font-size:13px!important}
  #today .fc31-focus-done{display:none!important}
  #today .fc9-section{gap:6px!important;margin-top:0!important}
  #today .fc9-section-head{min-height:27px!important;padding:0 2px!important;align-items:center!important}
  #today .fc9-section-head h2{font-size:14px!important;letter-spacing:-.025em!important;color:var(--fc33-navy)!important}
  #today .fc9-section-head button{font-size:8.8px!important;color:#64738a!important;font-weight:760!important}
  #today .fc33-priority-section,#today .fc33-overview-section,#today .fc33-family-section,#today .fc33-tomorrow-section,#today .fc33-homework-section{background:#fff;border:1px solid #e4e9f0;border-radius:16px;padding:11px;box-shadow:0 4px 16px rgba(29,49,81,.035);gap:7px!important}
  #today .fc33-priority-section>.fc9-section-head,#today .fc33-overview-section>.fc9-section-head,#today .fc33-family-section>.fc9-section-head,#today .fc33-tomorrow-section>.fc9-section-head,#today .fc33-homework-section>.fc9-section-head{padding:0!important}
  #today .fc33-priority-section .fc9-card,#today .fc33-overview-section .fc9-card,#today .fc33-family-section .fc9-card,#today .fc33-tomorrow-section .fc9-card,#today .fc33-homework-section .fc9-card{border:1px solid #edf0f4!important;border-radius:11px!important;box-shadow:none!important}
  #today .fc33-kicker{display:flex;align-items:center;gap:6px;color:var(--fc33-orange);font-size:7.4px;font-weight:950;letter-spacing:.075em;text-transform:uppercase}
  #today .fc33-count{display:inline-grid;place-items:center;min-width:17px;height:17px;padding:0 5px;border-radius:999px;background:#ff4b55;color:#fff;font-size:8px;letter-spacing:0}
  #today .fc9-row{min-height:48px!important;padding:7px 9px!important;background:#fff;gap:8px!important}
  #today .fc9-row-main{min-width:0!important;text-align:left!important}
  #today .fc9-row-main b{font-size:11.5px!important;line-height:1.19!important;color:#172743!important}
  #today .fc9-row-main span{font-size:8.2px!important;line-height:1.25!important;margin-top:2px!important;color:#7a8799!important}
  #today .fc9-priority{display:inline-flex!important;width:max-content;padding:2px 5px;border-radius:999px;background:#fff3e8;color:#d35f0b!important;font-size:6.7px!important;letter-spacing:.055em!important;margin:0 0 2px!important}
  #today .fc9-check{width:24px!important;min-width:24px!important;height:24px!important}#today .fc9-check i{width:19px!important;height:19px!important;border-radius:4px!important;border-width:1.6px!important}
  #today .fc9-row:has(.fc9-priority){background:#fff!important;box-shadow:none!important;border-left:0!important}
  #today .fc33-task-icon{font-size:16px;line-height:1;align-self:center;filter:saturate(.9)}
  #today .fc33-task-row{grid-template-columns:auto auto minmax(0,1fr) auto!important}
  #today .fc33-task-row .fc9-danger{display:none!important}
  #today .fc33-overview-section .fc9-row{position:relative;grid-template-columns:66px minmax(0,1fr) 14px!important;border-left:0!important}
  #today .fc33-overview-section .fc9-row:before{content:'';position:absolute;left:72px;top:0;bottom:0;width:1px;background:#edf0f4}
  #today .fc33-overview-section .fc9-time{width:60px!important;min-width:60px!important;font-size:9px!important;color:#355fbd!important;text-align:left!important;padding-right:7px!important}
  #today .fc33-overview-section .fc9-row-main{padding-left:9px!important}
  #today .fc33-overview-section .fc9-row-main b{font-size:11.3px!important}.fc33-overview-section .fc9-row-main span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
  #today .fc33-overview-section .fc9-chevron{font-size:16px!important;color:#9aa6b6!important}
  #today .fc33-family-section .fc9-person{min-height:50px!important;padding:7px 8px!important;grid-template-columns:auto minmax(0,1fr) auto!important;gap:8px!important;border-left:0!important}
  #today .fc33-avatar{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--person,#8090a5) 15%,#fff);border:1px solid color-mix(in srgb,var(--person,#8090a5) 40%,#fff);color:var(--person,#8090a5);font-size:11px;font-weight:900;box-shadow:inset 0 0 0 2px #fff}
  #today .fc33-family-section .fc9-person b{font-size:11px!important;color:#172743!important}.fc33-family-section .fc9-person span{font-size:8.2px!important}.fc33-family-section .fc9-person-time{font-size:9px!important}
  #today .fc33-homework-section .fc9-row{min-height:47px!important}
  #today .fc33-tomorrow-section{background:#fbfdff!important}
  #today .fc33-tomorrow-section .fc9-tomorrow{padding:0!important;border-color:#e7edf5!important}
  #today .fc9-tomorrow-top{padding:7px 9px!important;background:#f7faff!important}.fc9-tomorrow-top b{font-size:10.5px!important;color:#17315c!important}.fc9-tomorrow-top span{font-size:8px!important}
  #today .fc9-mini{padding:7px 9px!important;min-height:42px!important;grid-template-columns:48px minmax(0,1fr)!important}.fc9-mini em{font-size:6.5px!important}.fc9-mini b{font-size:9.8px!important;line-height:1.22!important}.fc9-mini small{font-size:7.7px!important}.fc9-tomorrow-items .fc9-mini:nth-child(n+4){display:none!important}
  #today .fc33-family-section:before,#today .fc33-overview-section:before{display:none}
  .fc9-nav{background:rgba(255,255,255,.98)!important;border-top:1px solid #e5e9ef!important}.fc9-nav button{min-height:54px!important;font-size:8.5px!important}.fc9-nav button.active{color:#1a5dc8!important}.fc9-nav button.active:before{display:none!important}
}`;
function ensureStyle(){if(document.getElementById('fc33-style'))return;document.getElementById('fc32-style')?.remove();document.getElementById('fc31-style')?.remove();const s=document.createElement('style');s.id='fc33-style';s.textContent=STYLE;document.head.appendChild(s)}
function setText(el,value){const text=String(value);if(el&&el.textContent!==text)el.textContent=text}
function bindSummary(summary){const openTasks=()=>{try{if(typeof window.fc9OpenTasks==='function')window.fc9OpenTasks('today')}catch(e){}};const openCalendar=()=>{try{document.querySelector('.fc9-nav button[data-screen="events"]')?.click()}catch(e){}};for(const el of summary.querySelectorAll('.fc31-stat')){const action=el.dataset.fc31==='events'?openCalendar:openTasks;el.setAttribute('role','button');el.tabIndex=0;el.onclick=action;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action()}}}}
function taskIcon(title=''){const s=String(title).toLowerCase();if(/pok[eé]mon|geschenk|geburtstag/.test(s))return'🎁';if(/kaufen|maggi|einkauf/.test(s))return'🛒';if(/schule|pet|flasche|rucksack/.test(s))return'🎒';if(/geld|chf|schuldet/.test(s))return'💰';return'✓'}
function decorateTasks(sec){if(!sec)return;const rows=[...sec.querySelectorAll('[data-todo]')];for(const row of rows){row.classList.add('fc33-task-row');if(!row.querySelector('.fc33-task-icon')){const title=row.querySelector('.fc9-row-main b')?.textContent||'';const icon=document.createElement('span');icon.className='fc33-task-icon';icon.setAttribute('aria-hidden','true');icon.textContent=taskIcon(title);row.querySelector('.fc9-check')?.after(icon)}}let kicker=sec.querySelector('.fc33-kicker');if(!kicker){kicker=document.createElement('div');kicker.className='fc33-kicker';sec.querySelector('.fc9-section-head')?.after(kicker)}const count=String(rows.length);if(kicker.dataset.count!==count){kicker.dataset.count=count;kicker.innerHTML=`<span>NOCH ERLEDIGEN</span><span class="fc33-count">${count}</span>`}}
function decoratePeople(sec){if(!sec)return;for(const row of sec.querySelectorAll('.fc9-person')){const old=row.querySelector('.fc9-dot');if(old&&!row.querySelector('.fc33-avatar')){const name=row.querySelector('b')?.textContent?.trim()||'?';const avatar=document.createElement('span');avatar.className='fc33-avatar';avatar.textContent=(name[0]||'?').toUpperCase();old.replaceWith(avatar)}}}
function sectionBy(page,selector){return [...page.querySelectorAll(':scope > .fc9-section')].find(sec=>sec.querySelector(selector))||null}
function reorder(page,focus,summary,todoSec,hwSec,eventSec,peopleSec,tomSec){const ordered=[focus&&!focus.classList.contains('fc31-focus-done')?focus:null,todoSec,hwSec,eventSec,peopleSec,tomSec].filter(Boolean);let anchor=summary;for(const node of ordered){if(anchor.nextElementSibling!==node)anchor.after(node);anchor=node}}
function enhanceToday(){if(innerWidth>719)return;const root=document.getElementById('today');if(!root||!root.classList.contains('active'))return;const page=root.querySelector('.fc9-page');if(!page)return;ensureStyle();const todos=[...page.querySelectorAll('[data-todo]')],important=todos.filter(x=>x.querySelector('.fc9-priority')).length,events=page.querySelectorAll('[data-event]').length;const head=page.querySelector('.fc9-pagehead');if(head&&!head.querySelector('.fc33-tagline')){const t=document.createElement('span');t.className='fc33-tagline';t.textContent='Das Wichtigste zuerst';head.querySelector('h1')?.after(t)}let summary=page.querySelector('.fc31-summary');if(!summary){summary=document.createElement('div');summary.className='fc31-summary';summary.innerHTML='<div class="fc31-stat" data-fc31="important"><strong>0</strong><span>Wichtig</span></div><div class="fc31-stat" data-fc31="open"><strong>0</strong><span>Offen</span></div><div class="fc31-stat" data-fc31="events"><strong>0</strong><span>Termine</span></div>';head?.after(summary);bindSummary(summary)}const importantStat=summary.querySelector('[data-fc31="important"]');importantStat?.classList.toggle('urgent',important>0);setText(importantStat?.querySelector('strong'),important);setText(summary.querySelector('[data-fc31="open"] strong'),todos.length);setText(summary.querySelector('[data-fc31="events"] strong'),events);const focus=page.querySelector('.fc9-focus');if(focus)focus.classList.toggle('fc31-focus-done',/Keine zeitkritischen Punkte mehr/i.test(focus.textContent||''));const todoSec=sectionBy(page,'[data-todo]'),hwSec=sectionBy(page,'[data-hw]'),eventSec=sectionBy(page,'[data-event]'),peopleSec=sectionBy(page,'.fc9-person-list'),tomSec=sectionBy(page,'.fc9-tomorrow');if(todoSec){todoSec.classList.add('fc33-priority-section');setText(todoSec.querySelector('.fc9-section-head h2'),'Heute – Das Wichtigste zuerst');decorateTasks(todoSec)}if(hwSec){hwSec.classList.add('fc33-homework-section');setText(hwSec.querySelector('.fc9-section-head h2'),'Schulaufgaben')}if(eventSec){eventSec.classList.add('fc33-overview-section');setText(eventSec.querySelector('.fc9-section-head h2'),'Heute im Überblick')}if(peopleSec){peopleSec.classList.add('fc33-family-section');setText(peopleSec.querySelector('.fc9-section-head h2'),'Schule & Familie heute');decoratePeople(peopleSec)}if(tomSec){tomSec.classList.add('fc33-tomorrow-section');setText(tomSec.querySelector('.fc9-section-head h2'),'Morgen – Vorschau')}reorder(page,focus,summary,todoSec,hwSec,eventSec,peopleSec,tomSec);document.documentElement.dataset.fcIphoneDashboard='v31';document.documentElement.dataset.fcIphoneDensity='v32';document.documentElement.dataset.fcReferenceDesign='v33'}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceToday()})}
let observer=null;function installDashboard(){ensureStyle();const root=document.getElementById('today');if(root&&!observer){observer=new MutationObserver(()=>{if(root.classList.contains('active'))schedule()});observer.observe(root,{childList:true})}schedule();window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule,{passive:true});document.addEventListener('click',e=>{if(e.target.closest?.('.fc9-nav button[data-screen="today"]'))schedule()},{passive:true})}
document.addEventListener('fc:v9-ready',()=>{brand();installDashboard()},{once:true});if(document.documentElement.dataset.fcV9Ready==='1'){brand();installDashboard()}
window.__fcProfessional={version:'9.33.0',brand,enhanceToday,shortName:SHORT,renderWrappers:false,calendarPostProcessor:false};
})();

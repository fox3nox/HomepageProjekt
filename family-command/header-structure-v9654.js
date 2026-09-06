/* Family Command V9.65.4 · deterministic mobile header structure */
(()=>{
'use strict';
if(window.__fcHeaderStructureV9654)return;window.__fcHeaderStructureV9654=true;
const mobile=()=>matchMedia('(max-width:719px)').matches;
let busy=false;
function ensure(){
  if(!mobile()||busy)return;
  const top=document.querySelector('.fc9-topbar-in'),brand=top?.querySelector('.fc9-brand'),actions=top?.querySelector('.fc9-head-actions');
  if(!top||!brand||!actions)return;
  busy=true;
  try{
    let status=top.querySelector(':scope > .fc9-header-status');
    if(!status){status=document.createElement('div');status.className='fc9-header-status';actions.before(status)}
    const hiddenAnchor=brand.querySelector('.fc-today-anchor');
    let today=status.querySelector('.fc9-header-today');
    if(!today){today=document.createElement('button');today.type='button';today.className='fc9-header-today';today.setAttribute('aria-label','Tagescheck für heute öffnen');status.appendChild(today)}
    if(hiddenAnchor){
      hiddenAnchor.classList.add('fc9-anchor-source');
      hiddenAnchor.setAttribute('aria-hidden','true');
      hiddenAnchor.tabIndex=-1;
      const html=hiddenAnchor.innerHTML;
      if(today.innerHTML!==html)today.innerHTML=html;
      today.onclick=()=>hiddenAnchor.click();
    }
    const sync=[...top.querySelectorAll('.fc9-sync')].find(x=>!status.contains(x));
    if(sync)status.prepend(sync);
    const direct=[...brand.children];
    const title=direct.find(x=>x.tagName==='B');
    const subtitle=direct.find(x=>x.tagName==='SPAN'&&!x.classList.contains('fc-today-anchor'));
    for(const child of direct){if(child!==title&&child!==subtitle&&child!==hiddenAnchor)child.style.display='none'}
    document.documentElement.dataset.fcHeaderStructure='v9654';
  }finally{busy=false}
}
let timer=0;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(ensure,16)});
function install(){ensure();const top=document.querySelector('.fc9-topbar');if(top)obs.observe(top,{childList:true,subtree:true,characterData:true});setInterval(ensure,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
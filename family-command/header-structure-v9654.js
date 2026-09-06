/* Family Command V9.66.9 · preserve cloud status, header actions and visible brand title */
(()=>{
'use strict';
if(window.__fcHeaderStructureV9654)return;window.__fcHeaderStructureV9654=true;
const media=matchMedia('(max-width:719px)'),anchorState=new WeakMap();
let busy=false,timer=0;
function restoreAnchor(anchor){if(!anchor)return;anchor.classList.remove('fc9-anchor-source');const previous=anchorState.get(anchor);if(previous){for(const [name,value] of Object.entries(previous)){if(value===null)anchor.removeAttribute(name);else anchor.setAttribute(name,value)}anchorState.delete(anchor)}}
function ensure(){
  if(busy)return;
  const top=document.querySelector('.fc9-topbar-in'),brand=top?.querySelector('.fc9-brand'),actions=top?.querySelector('.fc9-head-actions');
  if(!top||!brand||!actions)return;
  busy=true;
  try{
    const title=brand.querySelector(':scope > b');if(title&&title.textContent!=='Familienzentrale')title.textContent='Familienzentrale';
    const subtitle=brand.querySelector(':scope > span:not(.fc-today-anchor)');if(subtitle&&subtitle.textContent!=='Alles im Blick. Alles im Griff.')subtitle.textContent='Alles im Blick. Alles im Griff.';
    let status=top.querySelector(':scope > .fc9-header-status');const anchor=brand.querySelector('.fc-today-anchor');
    if(!media.matches){if(status){for(const sync of status.querySelectorAll('#fcCloudStatus,.fc9-sync'))brand.appendChild(sync);status.remove()}restoreAnchor(anchor);return}
    if(!status){status=document.createElement('div');status.className='fc9-header-status';actions.before(status)}
    let today=status.querySelector('.fc9-header-today');if(!today){today=document.createElement('button');today.type='button';today.className='fc9-header-today';today.setAttribute('aria-label','Tagescheck für heute öffnen');status.appendChild(today)}
    if(anchor){if(!anchorState.has(anchor))anchorState.set(anchor,{'aria-hidden':anchor.getAttribute('aria-hidden'),tabindex:anchor.getAttribute('tabindex')});anchor.classList.add('fc9-anchor-source');if(anchor.getAttribute('aria-hidden')!=='true')anchor.setAttribute('aria-hidden','true');if(anchor.tabIndex!==-1)anchor.tabIndex=-1;if(today.innerHTML!==anchor.innerHTML)today.innerHTML=anchor.innerHTML;today.onclick=()=>anchor.click()}
    for(const sync of top.querySelectorAll('#fcCloudStatus,.fc9-sync')){if(!status.contains(sync))status.prepend(sync);if(sync.style.display==='none')sync.style.removeProperty('display')}
    document.documentElement.dataset.fcHeaderStructure='v9669';
  }finally{busy=false}
}
const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(ensure,16)});
function install(){ensure();const top=document.querySelector('.fc9-topbar');if(top)obs.observe(top,{childList:true,subtree:true,characterData:true});media.addEventListener('change',ensure);setInterval(ensure,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

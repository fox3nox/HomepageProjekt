/* Familienzentrale V9.48 · mobile viewport behavior companion */
(()=>{
'use strict';
if(window.__fcIphoneLayoutV948)return;window.__fcIphoneLayoutV948=true;
if(!window.matchMedia('(max-width:719px)').matches)return;
function main(){return document.querySelector('.fc9-main')}
function active(){return document.querySelector('.fc9-screen.active')?.id||''}
function resetScroll(){const m=main();if(m)m.scrollTop=0;try{window.scrollTo(0,0)}catch(_){}}
function start(){const m=main();if(!m)return;let last=active();const observer=new MutationObserver(()=>{const next=active();if(next&&next!==last){last=next;requestAnimationFrame(resetScroll)}});observer.observe(m,{subtree:true,attributes:true,attributeFilter:['class']});document.documentElement.dataset.fcIphoneLayoutBehavior='v48'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

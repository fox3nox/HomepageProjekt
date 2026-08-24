/* Family Command · stable six-tab navigation · 2026-08-24 */
(()=>{
  if(window.__fcSixNavInstalled)return;window.__fcSixNavInstalled=true;

  const ICONS={
    tomorrow:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.6"/><path d="M12 2.8v2.3M12 18.9v2.3M2.8 12h2.3M18.9 12h2.3M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6"/></svg>',
    homework:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2.2"/><path d="M9 4V2.8h6V4M8.4 10.5l1.8 1.8 3.3-3.3M8.5 16h7"/></svg>'
  };

  function setButton(btn,id,label,icon){
    if(!btn)return null;btn.type='button';btn.classList.add('navbtn');btn.dataset.screen=id;btn.setAttribute('aria-label',label);
    let ico=btn.querySelector('.ico');if(!ico){ico=document.createElement('span');ico.className='ico';btn.prepend(ico)}ico.innerHTML=icon;ico.dataset.fcV3='1';
    let lab=[...btn.querySelectorAll(':scope > span')].find(x=>!x.classList.contains('ico'));if(!lab){lab=document.createElement('span');btn.appendChild(lab)}lab.textContent=label;return btn;
  }

  function ensure(){
    const nav=document.querySelector('.bottomnav-in');if(!nav)return false;

    let hw=nav.querySelector('.navbtn[data-screen="homework"]');
    const people=nav.querySelector('.navbtn[data-screen="people"]');
    if(!hw&&people)hw=setButton(people,'homework','Aufgaben',ICONS.homework);

    let tom=nav.querySelector('.navbtn[data-screen="tomorrow"]');
    if(!tom){
      tom=document.createElement('button');setButton(tom,'tomorrow','Morgen',ICONS.tomorrow);
      const today=nav.querySelector('.navbtn[data-screen="today"]');
      if(today?.nextSibling)nav.insertBefore(tom,today.nextSibling);else if(today)nav.appendChild(tom);else nav.prepend(tom);
    }else setButton(tom,'tomorrow','Morgen',ICONS.tomorrow);

    nav.dataset.fcSixNav='1';
    document.documentElement.dataset.fcSixNav='1';
    return true;
  }

  function openTomorrow(e){
    const b=e.target?.closest?.('.navbtn[data-screen="tomorrow"]');if(!b)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(typeof window.fcOpenTomorrow==='function')window.fcOpenTomorrow();
    else if(typeof window.openScreen==='function')window.openScreen('tomorrow');
  }

  function style(){if(document.getElementById('fc-six-nav-style'))return;const s=document.createElement('style');s.id='fc-six-nav-style';s.textContent=`
    .bottomnav-in[data-fc-six-nav="1"]{grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:0!important}
    .bottomnav-in[data-fc-six-nav="1"] .navbtn{font-size:8.5px!important;padding-left:0!important;padding-right:0!important}
    .bottomnav-in[data-fc-six-nav="1"] .navbtn .ico{width:29px!important}
    @media(max-width:360px){.bottomnav-in[data-fc-six-nav="1"] .navbtn{font-size:8px!important}.bottomnav-in[data-fc-six-nav="1"] .navbtn .ico{width:27px!important}}
  `;document.head.appendChild(s)}

  style();ensure();
  document.addEventListener('click',openTomorrow,true);
  try{const nav=document.querySelector('.bottomnav-in');if(nav){let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(ensure,30)}).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['data-screen']})}}catch(e){}
  requestAnimationFrame(ensure);setTimeout(ensure,250);setTimeout(ensure,1000);
  window.__fcSixNav={version:1,ensure};
})();

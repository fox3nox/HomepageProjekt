/* Family Command · balanced UI · 2026-08-21 */
(()=>{
  const css=document.createElement('style');
  css.id='fc-balanced-ui';
  css.textContent=`
  :root{
    --bg:#f3f6fa!important;
    --surface:#ffffff!important;
    --text:#172033!important;
    --muted:#667085!important;
    --line:#dce3ec!important;
    --accent:#426aa3!important;
    --accent-soft:#edf3fb!important;
    --shadow:0 6px 18px rgba(23,32,51,.055)!important;
    --r:18px!important;
  }
  html,body{background:var(--bg)!important;color:var(--text)!important}
  body{letter-spacing:-.005em}

  /* App shell */
  .topbar{background:rgba(243,246,250,.94)!important;border-bottom:1px solid rgba(214,222,232,.88)!important;backdrop-filter:blur(20px)!important}
  .topbar-in{padding-top:14px!important;padding-bottom:12px!important}
  .mark{background:#172033!important;border-radius:12px!important;box-shadow:0 4px 12px rgba(23,32,51,.10)!important}
  .brand h1{font-weight:850!important;color:#172033!important}
  .brand p{color:#7a8494!important}
  .iconbtn{background:#fff!important;border:1px solid #d7dee8!important;color:#315f96!important;box-shadow:0 2px 8px rgba(23,32,51,.04)!important}
  .content{padding-top:20px!important}

  .bottomnav{background:rgba(255,255,255,.96)!important;border-top:1px solid #dbe2eb!important;box-shadow:0 -5px 20px rgba(23,32,51,.045)!important}
  .navbtn{color:#667085!important;font-weight:650!important}
  .navbtn.active{color:#172033!important;font-weight:900!important}
  .navbtn .ico{opacity:.9}

  /* Main overview */
  .pc-wrap{gap:16px!important}
  .pc-hero{background:linear-gradient(145deg,#172033,#22334d)!important;border-radius:22px!important;box-shadow:0 10px 26px rgba(23,32,51,.14)!important;padding:18px!important}
  .pc-date{color:#cbd6e7!important;font-weight:800!important}
  .pc-title h2{color:#fff!important;font-weight:900!important;letter-spacing:-.035em!important}
  .pc-nexttime b{color:#fff!important}
  .pc-nexttime span{color:#d5deea!important}
  .pc-next{background:rgba(255,255,255,.96)!important;border:1px solid rgba(255,255,255,.75)!important;border-radius:14px!important;box-shadow:none!important}
  .pc-next small{color:#68758a!important}
  .pc-next b{color:#172033!important;font-weight:900!important}
  .pc-next span{color:#5f6b7c!important}
  .pc-next.fc-pickup-next{background:#fff5f5!important;border:1px solid #e7a1a1!important;color:#852d2d!important;box-shadow:none!important}
  .pc-next.fc-pickup-next small{color:#a14a4a!important}
  .pc-next.fc-pickup-next b{color:#7e2828!important;text-shadow:none!important}
  .pc-next.fc-pickup-next span{color:#994646!important}
  .pc-next.fc-ts-next{background:#f1f6fb!important;border-color:#afc7e0!important;color:#254e79!important}
  .pc-next.fc-ts-next small,.pc-next.fc-ts-next span{color:#527293!important}
  .pc-next.fc-ts-next b{color:#254e79!important}
  .fc-after-next{margin-top:9px!important;color:#dce5f0!important}
  .fc-after-next small{color:#aab8ca!important}
  .fc-after-next span{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.12)!important;color:#e8edf5!important}
  .pc-actions{gap:8px!important}
  .pc-actions button{min-height:45px!important;border-radius:12px!important;font-size:11px!important}
  .pc-actions .light{background:#fff!important;color:#172033!important;border:0!important}
  .pc-actions .dark{background:rgba(255,255,255,.10)!important;color:#fff!important;border:1px solid rgba(255,255,255,.18)!important}

  /* Month badge: visible, not loud */
  .fc-month-badge{background:#fff!important;border:1px solid #d9e0e9!important;border-left:4px solid var(--fc-month,#b76a35)!important;border-radius:11px!important;box-shadow:none!important;color:#354052!important;padding:7px 10px!important}
  .fc-month-badge span{color:#7a8494!important;font-size:8px!important}
  .fc-month-badge b{color:#243044!important;font-size:14px!important}
  .fc-month-badge em{color:#7a8494!important}

  /* Section titles */
  .pc-head{padding:0 2px!important}
  .pc-head h3{font-size:17px!important;color:#172033!important;font-weight:900!important;letter-spacing:-.02em!important}
  .pc-head span{color:#778295!important;font-weight:650!important}

  /* Child cards: friendly color cues, clean surfaces */
  .pc-kids{gap:10px!important}
  .pc-kid{background:#fff!important;border:1px solid var(--pc-border)!important;border-left:5px solid var(--pc-main)!important;border-radius:17px!important;padding:13px 13px 12px 15px!important;box-shadow:0 3px 12px rgba(23,32,51,.035)!important}
  .pc-kid:before{display:none!important}
  .pc-name{font-size:16px!important;font-weight:900!important;color:var(--pc-text)!important;display:flex!important;align-items:center!important;gap:8px!important}
  .pro-dot{width:10px!important;height:10px!important;border-radius:99px!important;display:inline-block!important;box-shadow:0 0 0 3px rgba(255,255,255,.9)!important}
  .pc-edit{background:#f7f9fc!important;border:1px solid #dce3ec!important;color:#536074!important;border-radius:9px!important}
  .pc-mainrow{gap:7px!important}
  .pc-cell{background:#f8fafc!important;border:1px solid #e3e8ef!important;border-radius:11px!important}
  .pc-cell.primary{background:var(--pc-soft)!important;border-color:var(--pc-border)!important}
  .pc-cell span{color:#6e7a8d!important;font-weight:850!important}
  .pc-cell b{color:#172033!important;font-weight:900!important}
  .pc-cell.primary b{color:var(--pc-text)!important}
  .pc-pm{color:#667085!important}
  .pc-pm b{color:#344054!important}
  .pc-chip{background:#fff8e8!important;color:#79551a!important;border:1px solid #ead49b!important;font-weight:800!important}
  .fc-live-status{background:#f4f7fb!important;border:1px solid #dbe3ed!important;color:#556275!important;font-size:8px!important;font-weight:850!important}
  .fc-live-status.school{background:#eef8f3!important;border-color:#b9dfcb!important;color:#276748!important}
  .fc-live-status.travel{background:#fff8e8!important;border-color:#ead49b!important;color:#7a5a1c!important}
  .fc-live-status.break{background:#fff6ee!important;border-color:#eccaaa!important;color:#86502b!important}
  .fc-live-status.done,.fc-live-status.free,.fc-live-status.holiday{background:#f4f6f8!important;border-color:#dce2e8!important;color:#6c7685!important}

  .fc-pickup-alert{background:#fff5f5!important;border:1px solid #edb2b2!important;border-left:4px solid #c65e5e!important;color:#7c3030!important;border-radius:11px!important;box-shadow:none!important}
  .fc-pickup-alert small,.fc-pickup-alert span{color:#985050!important}
  .fc-pickup-alert b{color:#7c3030!important}
  .fc-ts-alert,.fc-tagesschule-alert{background:#f2f7fc!important;border:1px solid #b7cee4!important;border-left:4px solid #507ca8!important;color:#315a82!important;border-radius:11px!important;box-shadow:none!important}
  .fc-ts-alert small,.fc-ts-alert span,.fc-tagesschule-alert small,.fc-tagesschule-alert span{color:#5a7896!important}
  .fc-ts-alert b,.fc-tagesschule-alert b{color:#315a82!important}

  /* Completed / past */
  .fc-child-finished{background:#f8fafc!important;border-color:#e0e6ed!important}
  .fc-finished-summary{background:#f0f7f3!important;border:1px solid #c5dfd0!important;color:#39654e!important;border-radius:10px!important}
  .fc-past-cell{background:#f7f9fb!important;border-color:#e4e8ed!important}
  .fc-past-events,.fc-past-forget{background:#f8fafc!important;border-color:#e2e7ed!important}

  /* Reminders / homework */
  .pc-forget{background:#fffaf0!important;border:1px solid #ead9a8!important;border-radius:16px!important}
  .pc-forget-title{color:#755a25!important}
  .pc-forget-item{background:#fff!important;border-color:#eadfbe!important;color:#554423!important;border-radius:10px!important}
  .fc-homework-alert{border-radius:12px!important;box-shadow:none!important}
  .fc-homework-alert.urgent{background:#fff4f5!important;border:1px solid #e7a9b0!important;color:#81373f!important}
  .fc-homework-alert.today{background:#f6f3fb!important;border:1px solid #cec2df!important;color:#5d4b77!important}
  .hw-inline,.hw-screen{color:#172033!important}
  .hw-inline-head button,.hw-save{background:#426aa3!important;color:#fff!important;border-radius:11px!important}
  .hw-row{background:#fff!important;border-radius:13px!important;box-shadow:none!important}
  .hw-date{color:#526071!important}
  .hw-date.over{color:#a2474f!important}
  .hw-hero{background:linear-gradient(145deg,#263651,#344968)!important;border-radius:20px!important;box-shadow:0 8px 22px rgba(23,32,51,.10)!important}
  .hw-hero button{background:#fff!important;color:#2c4361!important}
  .hw-stats>div{background:#fff!important;border:1px solid #dfe5ec!important;border-radius:13px!important}
  .hw-section,.hw-done{background:#fff!important;border:1px solid #dfe5ec!important;border-radius:16px!important}

  /* Seven day view */
  .fc-7day{gap:8px!important}
  .fc-7day-box{background:#fff!important;border:1px solid #dfe5ec!important;border-radius:16px!important;box-shadow:0 2px 10px rgba(23,32,51,.025)!important}
  .fc-7day-row{border-bottom-color:#edf0f4!important}
  .fc-7day-date b{color:#344054!important}
  .fc-7day-date span{color:#7a8494!important}
  .fc-7day-items span{color:#4f5d70!important}

  /* Week */
  .pc-weektop h3{color:#172033!important;font-weight:900!important}
  .pc-weekcontrols button{background:#fff!important;border-color:#dce3ec!important;color:#42526a!important;border-radius:9px!important}
  .pc-day{background:#fff!important;border-color:#dce3ec!important;border-radius:11px!important;box-shadow:none!important}
  .pc-day.active{background:#263651!important;border-color:#263651!important;color:#fff!important}
  .pc-day.active span{color:#dbe4ef!important}
  .pc-day.active em{color:#c8d7e8!important}
  .fc-week-marks i{box-shadow:none!important}
  .fc-week-marks .e{background:#b95d64!important}
  .fc-week-marks .h{background:#74608c!important}

  /* Events: clear months, restrained color */
  .pro-events{display:grid!important;gap:14px!important}
  .pro-page-head{background:#fff!important;border:1px solid #dce3ec!important;border-radius:17px!important;padding:14px 15px!important;box-shadow:0 3px 12px rgba(23,32,51,.03)!important}
  .pro-page-head h1{font-size:23px!important;color:#172033!important;margin:0!important;letter-spacing:-.03em!important}
  .pro-page-head p{color:#7a8494!important;margin:3px 0 0!important;font-size:10px!important}
  .pro-page-head>button{background:#426aa3!important;color:#fff!important;border:0!important;border-radius:10px!important;padding:9px 11px!important;font-weight:850!important}
  .pro-filters{display:flex!important;gap:7px!important;overflow:auto!important;padding-bottom:2px!important}
  .pro-filter{background:#fff!important;border:1px solid #dce3ec!important;color:#5d697b!important;border-radius:999px!important;padding:8px 12px!important;font-weight:800!important;white-space:nowrap!important}
  .pro-filter.active{background:#263651!important;border-color:#263651!important;color:#fff!important}
  .pro-month-jump{display:flex!important;gap:7px!important;overflow:auto!important;padding:1px 0 3px!important}
  .pro-month-jump button{background:#fff!important;border:1px solid #dce3ec!important;border-bottom:3px solid var(--a)!important;color:#455267!important;border-radius:11px!important;padding:8px 11px!important;min-width:64px!important}
  .pro-month-jump button b{display:block!important;font-size:12px!important;color:#28374b!important}
  .pro-month-jump button span{display:block!important;font-size:8px!important;color:#7b8594!important;margin-top:2px!important}
  .pro-month{background:transparent!important;border:0!important;border-radius:0!important;padding:0!important;overflow:visible!important;scroll-margin-top:100px!important}
  .pro-month+.pro-month{margin-top:8px!important}
  .pro-month-head{position:sticky!important;top:72px!important;z-index:5!important;background:rgba(243,246,250,.96)!important;backdrop-filter:blur(12px)!important;border:0!important;border-left:4px solid var(--a)!important;border-radius:9px!important;padding:9px 11px!important;margin:0 0 8px!important;box-shadow:0 1px 0 rgba(23,32,51,.05)!important}
  .pro-month-head h2{font-size:19px!important;line-height:1.1!important;margin:0!important;color:#243044!important;font-weight:900!important;letter-spacing:-.025em!important}
  .pro-month-head h2 span{font-size:11px!important;color:#788394!important;margin-left:5px!important;font-weight:750!important}
  .pro-month-head p{font-size:9px!important;color:#7a8494!important;margin:2px 0 0!important}
  .pro-event-list{display:grid!important;gap:8px!important}
  .pro-event{background:#fff!important;border:1px solid #dfe5ec!important;border-left:4px solid var(--a)!important;border-radius:15px!important;padding:11px!important;box-shadow:0 3px 10px rgba(23,32,51,.025)!important;display:grid!important;grid-template-columns:52px 1fr!important;gap:10px!important}
  .pro-event-date{background:#f6f8fb!important;border:1px solid #e1e6ec!important;border-radius:10px!important;color:#46546a!important;min-height:57px!important;display:grid!important;place-content:center!important;text-align:center!important}
  .pro-event-date b{font-size:21px!important;line-height:.95!important;color:#27364a!important}
  .pro-event-date span{font-size:9px!important;color:var(--a)!important;font-weight:900!important;margin-top:3px!important}
  .pro-event-date em{font-size:7px!important;color:#8892a1!important;font-style:normal!important;font-weight:800!important;margin-top:2px!important}
  .pro-event-top h3{color:#172033!important;font-weight:900!important;font-size:14px!important;margin:2px 0 0!important}
  .pro-event-top small{color:var(--a)!important;font-size:8px!important;font-weight:850!important}
  .pro-event-top time{color:#455267!important;font-weight:900!important;font-size:11px!important}
  .pro-event-body>p{color:#6c7788!important;font-size:10px!important;line-height:1.42!important}
  .pro-people span{background:#f6f8fb!important;border:1px solid #e2e7ed!important;color:#526071!important;border-radius:999px!important;padding:4px 7px!important}
  .pro-event-actions button{background:#f7f9fb!important;border:1px solid #dfe5ec!important;color:#546176!important;border-radius:8px!important;font-weight:800!important}
  .pro-event-actions .pro-original{background:#edf4fb!important;border-color:#c9d9e9!important;color:#315f8d!important}
  .pro-event-actions .muted{background:transparent!important;border-color:transparent!important;color:#98a2b3!important}

  /* More / documents */
  .settings-stack{gap:11px!important}
  .setting{background:#fff!important;border:1px solid #dfe5ec!important;border-radius:16px!important;padding:14px!important;box-shadow:0 2px 9px rgba(23,32,51,.02)!important}
  .setting h4{font-size:14px!important;color:#243044!important;font-weight:900!important}
  .setting p{color:#6f7a8a!important;line-height:1.5!important}
  .action{background:#315f96!important;border-radius:11px!important}
  .action.secondary{background:#edf3fb!important;color:#315f96!important}
  .action.light{background:#f4f6f8!important;color:#344054!important}
  .pro-setting-head>span{background:#edf4f1!important;color:#3e6958!important;border:1px solid #cce0d7!important;border-radius:999px!important;font-weight:800!important}
  .pro-doc-fields input,.pro-doc-fields select{background:#fff!important;border:1px solid #dce3ec!important;border-radius:10px!important;color:#344054!important}
  .pro-file-pick{background:#f8fafc!important;border:1px dashed #cbd5df!important;border-radius:12px!important}
  .pro-file-pick strong{background:#edf3fb!important;color:#315f96!important;border-radius:8px!important}
  .pro-doc-row{background:#f9fbfd!important;border:1px solid #e1e6ec!important;border-radius:12px!important}
  .pro-doc-icon{background:#eaf0f6!important;color:#4c6078!important;border-radius:8px!important}
  .pro-doc-open b{color:#27364a!important}
  .pro-doc-open small,.pro-doc-open em{color:#7a8494!important}
  .pro-doc-delete{color:#98a2b3!important}

  /* Forms, modals, quick menu */
  .modal{background:rgba(23,32,51,.38)!important}
  .sheet{border-radius:22px 22px 0 0!important}
  .field input,.field select,.field textarea{border-color:#dce3ec!important;border-radius:10px!important}
  .field label{color:#737f90!important}
  .fcq-modal,.pro-modal{background:rgba(23,32,51,.42)!important}
  .fcq-sheet,.pro-sheet{background:#fff!important;border-radius:20px!important;box-shadow:0 18px 46px rgba(23,32,51,.18)!important}
  .fcq-grid button{background:#f8fafc!important;border:1px solid #dfe5ec!important;border-radius:13px!important}
  .fcq-grid button.event{background:#fff6f6!important;border-color:#ecd0d0!important}
  .fcq-grid button.hw{background:#f7f5fa!important;border-color:#d9d0e3!important}
  .pro-picker-list button{background:#f8fafc!important;border:1px solid #e0e6ed!important;border-radius:11px!important}

  /* Keep warning colors semantic, not decorative */
  .toast{background:#263651!important;border-radius:11px!important;box-shadow:0 8px 20px rgba(23,32,51,.18)!important}

  @media(max-width:470px){
    .pc-hero{padding:16px!important;border-radius:20px!important}
    .pc-title h2{font-size:25px!important}
    .pc-kid{border-radius:16px!important}
    .pc-name{font-size:15px!important}
    .pro-page-head{border-radius:15px!important}
    .pro-event{grid-template-columns:48px 1fr!important;padding:10px!important;gap:9px!important}
    .pro-event-date{min-height:54px!important}
    .pro-event-date b{font-size:20px!important}
    .pro-month-head{top:69px!important}
  }
  `;
  document.head.appendChild(css);

  // Light-touch cleanup after every render. Preserve structure/functions, only tone down visual noise.
  function balance(root){
    if(!root)return;
    root.querySelectorAll('.pc-head h3').forEach(h=>{h.textContent=(h.textContent||'').replace(/^\s*[📅📚🌙🔭👦⚠️]+\s*/u,'')});
    root.querySelectorAll('.fc-7day .pc-head h3').forEach(h=>{h.textContent='Nächste 7 Tage'});
    root.querySelectorAll('.hw-inline-head h3').forEach(h=>{h.textContent='Hausaufgaben'});
  }
  const rt=renderToday;renderToday=function(){rt();balance(document.getElementById('today'))};
  const rw=renderWeek;renderWeek=function(){rw();balance(document.getElementById('week'))};
  if(typeof renderHomeworkScreen==='function'){
    const rh=renderHomeworkScreen;renderHomeworkScreen=function(){rh();balance(document.getElementById('homework'))};
  }
  balance(document.getElementById('today'));
  balance(document.getElementById('week'));
})();

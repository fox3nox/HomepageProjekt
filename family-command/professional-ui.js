/* Family Command · unified professional UI · 2026-08-23 */
(()=>{
  if(window.__fcProfessionalUIV1)return;
  window.__fcProfessionalUIV1=true;

  const ICONS={
    today:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.8 10.4 12 3.8l8.2 6.6v8.1a1.7 1.7 0 0 1-1.7 1.7h-4.2v-5.7H9.7v5.7H5.5a1.7 1.7 0 0 1-1.7-1.7z"/></svg>',
    week:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.2" width="17" height="15" rx="2.2"/><path d="M7.5 3.5v3.4M16.5 3.5v3.4M3.5 9.2h17M7.3 12.7h2.2M11 12.7h2.2M14.7 12.7h2.2M7.3 16.2h2.2M11 16.2h2.2"/></svg>',
    people:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.2" r="3.2"/><path d="M3.8 19.2c.4-3.3 2.2-5.2 5.2-5.2s4.8 1.9 5.2 5.2M15 6.2a3 3 0 0 1 0 5.8M16 14.1c2.4.3 3.8 2 4.2 4.6"/></svg>',
    events:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.2" width="17" height="15" rx="2.2"/><path d="M7.5 3.5v3.4M16.5 3.5v3.4M3.5 9.2h17M8 13h3M8 16.5h6.5"/></svg>',
    more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>'
  };

  const css=document.createElement('style');
  css.id='fc-professional-ui-v1';
  css.textContent=`
  :root{
    --fc-bg:#f6f8fb;
    --fc-surface:#ffffff;
    --fc-surface-2:#f9fbfd;
    --fc-text:#172033;
    --fc-text-2:#344054;
    --fc-muted:#697586;
    --fc-faint:#98a2b3;
    --fc-line:#dde4ec;
    --fc-line-strong:#cad5e2;
    --fc-primary:#315f96;
    --fc-primary-strong:#263f61;
    --fc-primary-soft:#edf3fb;
    --fc-success:#287354;
    --fc-success-soft:#eef8f3;
    --fc-warning:#805d19;
    --fc-warning-soft:#fff8e8;
    --fc-danger:#9a424a;
    --fc-danger-soft:#fff4f5;
    --fc-shadow-sm:0 2px 8px rgba(23,32,51,.035);
    --fc-shadow:0 8px 26px rgba(23,32,51,.07);
    --fc-shadow-lg:0 20px 60px rgba(15,23,42,.22);
    --fc-r-sm:12px;
    --fc-r:16px;
    --fc-r-lg:22px;
    --fc-touch:44px;
    --fc-safe-bottom:env(safe-area-inset-bottom,0px);
    --fc-safe-top:env(safe-area-inset-top,0px);
  }
  *{box-sizing:border-box}
  html{background:var(--fc-bg);color-scheme:light;-webkit-text-size-adjust:100%}
  body{background:var(--fc-bg)!important;color:var(--fc-text)!important;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display",Inter,"Segoe UI",sans-serif!important;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overscroll-behavior-y:none}
  button,input,select,textarea{font:inherit}
  button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  button:not(:disabled),[role="button"]:not([aria-disabled="true"]),label[for]{cursor:pointer}
  button:disabled,input:disabled,select:disabled,textarea:disabled{opacity:.55;cursor:not-allowed}
  :focus-visible{outline:3px solid rgba(49,95,150,.28)!important;outline-offset:2px!important}
  ::selection{background:#dce9f7;color:#172033}
  .app{min-height:100dvh!important;padding-bottom:calc(84px + var(--fc-safe-bottom))!important}
  .content{width:min(100%,940px)!important;max-width:940px!important;margin:0 auto!important;padding:20px 16px 40px!important;background:transparent!important}
  .screen{min-width:0!important;max-width:100%!important}
  .screen.active{animation:fcScreenIn .18s ease both}
  @keyframes fcScreenIn{from{opacity:.5;transform:translateY(2px)}to{opacity:1;transform:none}}

  /* top bar */
  .topbar{position:sticky!important;top:0!important;z-index:500!important;background:rgba(246,248,251,.92)!important;border-bottom:1px solid rgba(221,228,236,.88)!important;backdrop-filter:saturate(160%) blur(18px)!important;-webkit-backdrop-filter:saturate(160%) blur(18px)!important}
  .topbar-in{width:min(100%,940px)!important;max-width:940px!important;margin:auto!important;min-height:64px!important;padding:calc(10px + var(--fc-safe-top)) 16px 10px!important;display:flex!important;align-items:center!important;gap:10px!important}
  .brand{display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important}
  .mark{width:38px!important;height:38px!important;min-width:38px!important;border-radius:12px!important;background:var(--fc-primary-strong)!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:13px!important;font-weight:900!important;letter-spacing:-.04em!important;box-shadow:none!important}
  .brand>div:last-child{min-width:0!important}
  .brand h1{margin:0!important;color:var(--fc-text)!important;font-size:16px!important;line-height:1.15!important;font-weight:900!important;letter-spacing:-.025em!important;white-space:nowrap!important}
  .brand p{margin:3px 0 0!important;color:var(--fc-muted)!important;font-size:10px!important;line-height:1.25!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:380px!important}
  .aitools{margin-left:auto!important;display:flex!important;align-items:center!important;gap:7px!important;flex:none!important}
  .iconbtn,.aibtn{height:40px!important;min-height:40px!important;border:1px solid var(--fc-line)!important;background:#fff!important;color:var(--fc-text-2)!important;border-radius:12px!important;box-shadow:var(--fc-shadow-sm)!important}
  .iconbtn{width:40px!important;font-size:22px!important;font-weight:500!important;display:grid!important;place-items:center!important;padding:0!important}
  .aibtn{padding:0 10px!important;gap:6px!important}
  .aibtn i{font-style:normal!important;background:var(--fc-primary)!important;color:#fff!important;border-radius:7px!important;padding:5px 6px!important;font-size:8px!important;font-weight:1000!important;letter-spacing:.02em!important}
  .aibtn b{font-size:10px!important;font-weight:900!important;white-space:nowrap!important}

  /* bottom nav */
  .bottomnav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:1000!important;background:rgba(255,255,255,.94)!important;border-top:1px solid rgba(221,228,236,.95)!important;backdrop-filter:saturate(170%) blur(20px)!important;-webkit-backdrop-filter:saturate(170%) blur(20px)!important;padding:6px 10px calc(6px + var(--fc-safe-bottom))!important;box-shadow:0 -8px 24px rgba(23,32,51,.035)!important;transform:none!important;width:auto!important;border-radius:0!important}
  .bottomnav-in{width:min(100%,620px)!important;max-width:620px!important;margin:auto!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:2px!important}
  .navbtn{min-width:0!important;min-height:50px!important;border:0!important;background:transparent!important;color:#788395!important;border-radius:12px!important;padding:5px 2px 4px!important;display:grid!important;grid-template-rows:24px auto!important;place-items:center!important;gap:1px!important;font-size:9px!important;line-height:1.1!important;font-weight:750!important}
  .navbtn .ico{width:31px!important;height:25px!important;border-radius:9px!important;display:grid!important;place-items:center!important;font-size:0!important;line-height:1!important;transition:background .16s ease,color .16s ease,transform .16s ease!important}
  .navbtn .ico svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .navbtn.active{color:var(--fc-primary-strong)!important;font-weight:900!important}
  .navbtn.active .ico{background:var(--fc-primary-soft)!important;color:var(--fc-primary)!important}
  .navbtn:active .ico{transform:scale(.94)}
  .navbtn span:last-child{max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}

  /* shared surfaces */
  .card,.setting,.info-card,.term-card,.hw-section,.hw-done,.fc-7day-box,.fcp-today,.fcp-box{background:var(--fc-surface)!important;border:1px solid var(--fc-line)!important;border-radius:var(--fc-r)!important;box-shadow:var(--fc-shadow-sm)!important}
  .section{margin-top:22px!important}
  .section-head,.pc-head{margin-bottom:10px!important;padding:0 2px!important}
  .section-head h3,.pc-head h3{margin:0!important;color:var(--fc-text)!important;font-size:17px!important;line-height:1.2!important;font-weight:900!important;letter-spacing:-.02em!important}
  .section-head span,.pc-head span{color:var(--fc-muted)!important;font-size:10px!important}
  .action{min-height:44px!important;border:0!important;border-radius:12px!important;background:var(--fc-primary)!important;color:#fff!important;font-size:12px!important;font-weight:900!important;box-shadow:none!important}
  .action.secondary{background:var(--fc-primary-soft)!important;color:var(--fc-primary)!important}
  .action.light{background:#f3f6f9!important;color:var(--fc-text-2)!important}
  .empty,.pro-empty,.fcp-empty{color:var(--fc-muted)!important;font-size:11px!important;line-height:1.5!important}

  /* Today / command center */
  .pc-wrap{display:grid!important;gap:16px!important}
  .pc-hero{background:var(--fc-primary-strong)!important;color:#fff!important;border-radius:var(--fc-r-lg)!important;padding:19px!important;box-shadow:0 14px 34px rgba(38,63,97,.16)!important;overflow:hidden!important}
  .pc-date{color:#cbd7e6!important;font-size:10px!important;font-weight:850!important;letter-spacing:.03em!important}
  .pc-title h2{margin:6px 0 4px!important;color:#fff!important;font-size:27px!important;line-height:1.06!important;font-weight:950!important;letter-spacing:-.04em!important}
  .pc-title p,.pc-nexttime span{color:#d7e0ec!important}
  .pc-nexttime b{color:#fff!important;font-weight:950!important}
  .pc-next{margin-top:14px!important;background:#fff!important;border:0!important;border-radius:14px!important;padding:12px!important;color:var(--fc-text)!important;box-shadow:none!important}
  .pc-next small{color:var(--fc-muted)!important;font-size:8px!important;font-weight:900!important;letter-spacing:.06em!important}
  .pc-next b{color:var(--fc-text)!important;font-size:13px!important;font-weight:950!important}
  .pc-next span{color:var(--fc-muted)!important}
  .pc-next.fc-pickup-next{background:#fff6f6!important;border:1px solid #efc4c7!important;color:#7d3239!important}
  .pc-next.fc-pickup-next b,.pc-next.fc-pickup-next span,.pc-next.fc-pickup-next small{color:inherit!important}
  .pc-next.fc-ts-next{background:#f3f7fb!important;border:1px solid #cbdbea!important;color:#315a82!important}
  .pc-next.fc-ts-next b,.pc-next.fc-ts-next span,.pc-next.fc-ts-next small{color:inherit!important}
  .pc-actions{display:flex!important;gap:8px!important;flex-wrap:wrap!important}
  .pc-actions button{min-height:44px!important;border-radius:12px!important;font-size:10px!important;font-weight:900!important}
  .pc-actions .light{background:#fff!important;color:var(--fc-text)!important}
  .pc-actions .dark{background:rgba(255,255,255,.09)!important;color:#fff!important;border:1px solid rgba(255,255,255,.16)!important}
  .fc-after-next span{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.12)!important;color:#e8eef6!important}
  .fc-month-badge{background:#fff!important;border:1px solid var(--fc-line)!important;border-left:4px solid var(--fc-month,#b76a35)!important;border-radius:12px!important;color:var(--fc-text-2)!important;box-shadow:none!important}
  .fc-month-badge span,.fc-month-badge em{color:var(--fc-muted)!important}.fc-month-badge b{color:var(--fc-text)!important}

  .pc-kids{display:grid!important;gap:10px!important}
  .pc-kid{position:relative!important;background:#fff!important;border:1px solid var(--pc-border,var(--fc-line))!important;border-left:5px solid var(--pc-main,var(--fc-primary))!important;border-radius:16px!important;padding:13px!important;box-shadow:var(--fc-shadow-sm)!important;overflow:hidden!important;height:auto!important;min-width:0!important}
  .pc-kid:before{display:none!important}
  .pc-kidtop{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important}
  .pc-name{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;flex:1 1 130px!important;color:var(--pc-text,var(--fc-text))!important;font-size:15px!important;font-weight:950!important}
  .pro-dot{width:9px!important;height:9px!important;min-width:9px!important;border-radius:50%!important}
  .pc-edit{min-width:36px!important;min-height:36px!important;border:1px solid var(--fc-line)!important;background:#f8fafc!important;color:var(--fc-muted)!important;border-radius:10px!important}
  .fc-live-status{max-width:100%!important;border:1px solid var(--fc-line)!important;background:#f5f7fa!important;color:#59677a!important;border-radius:999px!important;padding:4px 7px!important;font-size:8px!important;font-weight:900!important;white-space:normal!important;text-align:center!important}
  .fc-live-status.school{background:var(--fc-success-soft)!important;border-color:#bedfce!important;color:#256348!important}.fc-live-status.travel{background:var(--fc-warning-soft)!important;border-color:#ead7a1!important;color:#77571c!important}
  .pc-mainrow{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}
  .pc-cell{min-width:0!important;min-height:66px!important;height:auto!important;background:#f8fafc!important;border:1px solid #e4e9ef!important;border-radius:11px!important;padding:9px!important;overflow:hidden!important}
  .pc-cell.primary{background:var(--pc-soft,#f2f6fb)!important;border-color:var(--pc-border,var(--fc-line))!important}
  .pc-cell span{color:var(--fc-muted)!important;font-size:8px!important;font-weight:900!important;letter-spacing:.04em!important}.pc-cell b{color:var(--fc-text)!important;white-space:normal!important;font-weight:950!important}.pc-cell.primary b{color:var(--pc-text,var(--fc-text))!important}
  .pc-chip{background:var(--fc-warning-soft)!important;border:1px solid #ead7a1!important;color:#77571c!important;border-radius:999px!important;font-weight:850!important}
  .fc-pickup-alert{background:var(--fc-danger-soft)!important;border:1px solid #e8b6bb!important;border-left:4px solid #b65b63!important;color:#7c353c!important;border-radius:12px!important;box-shadow:none!important}
  .fc-ts-alert,.fc-tagesschule-alert{background:#f2f7fc!important;border:1px solid #bfd1e3!important;border-left:4px solid #5b7fa2!important;color:#315a82!important;border-radius:12px!important;box-shadow:none!important}
  .pc-forget{background:#fffbf2!important;border:1px solid #eadbad!important;border-radius:15px!important;box-shadow:none!important}.pc-forget-item{background:#fff!important;border-color:#e8dfc4!important;border-radius:10px!important}

  /* Pendenzen are secondary to the command center */
  .fcp-today{margin:0!important;padding:12px!important;display:grid!important;gap:8px!important;box-shadow:none!important}
  .fcp-minihead small{font-size:8px!important;font-weight:1000!important;letter-spacing:.1em!important;color:var(--fc-muted)!important}.fcp-minihead h3{color:var(--fc-text)!important;font-size:16px!important}
  .fcp-minihead button,.fcp-boxhead button{min-width:40px!important;min-height:40px!important;border:1px solid var(--fc-line)!important;background:var(--fc-primary-soft)!important;color:var(--fc-primary)!important;border-radius:11px!important;font-weight:900!important}
  .fcp-row{min-width:0!important;background:#fafbfd!important;border:1px solid #e5eaf0!important;border-radius:12px!important;padding:9px!important;gap:8px!important}.fcp-title b{color:var(--fc-text)!important}.fcp-title strong{color:var(--fc-primary)!important}.fcp-main p{color:var(--fc-muted)!important}
  .fcp-check{min-width:28px!important;min-height:28px!important;display:grid!important;place-items:center!important}.fcp-check span{width:22px!important;height:22px!important;border-color:#a7b3c2!important}.fcp-check input:checked+span{background:var(--fc-primary)!important;border-color:var(--fc-primary)!important}

  /* Week */
  .pc-weektop{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:10px!important;flex-wrap:wrap!important}.pc-weektop h3{color:var(--fc-text)!important;font-size:20px!important;font-weight:950!important;letter-spacing:-.025em!important}
  .pc-weekcontrols{display:flex!important;gap:6px!important;flex-wrap:wrap!important}.pc-weekcontrols button{min-width:40px!important;min-height:40px!important;background:#fff!important;border:1px solid var(--fc-line)!important;color:var(--fc-text-2)!important;border-radius:10px!important}
  .pc-weekbar{display:flex!important;gap:7px!important;max-width:100%!important;overflow-x:auto!important;padding:1px 1px 5px!important;scrollbar-width:none!important;scroll-snap-type:x proximity}.pc-weekbar::-webkit-scrollbar{display:none}
  .pc-day{min-width:68px!important;min-height:58px!important;flex:0 0 auto!important;background:#fff!important;border:1px solid var(--fc-line)!important;border-radius:12px!important;box-shadow:none!important;scroll-snap-align:start}.pc-day.active{background:var(--fc-primary-strong)!important;border-color:var(--fc-primary-strong)!important;color:#fff!important}.pc-day.active span,.pc-day.active em{color:#d7e1ed!important}
  .week-stack{display:grid!important;gap:9px!important}.schedule-row{background:#fff!important;border:1px solid var(--fc-line)!important;border-radius:14px!important;padding:12px!important;box-shadow:var(--fc-shadow-sm)!important}.slot{background:#f8fafc!important;border-color:#e4e9ef!important;border-radius:10px!important}.slot.special{background:var(--fc-primary-soft)!important;border-color:#cfdaea!important;color:#315a82!important}
  .fc-7day-box{overflow:hidden!important;box-shadow:none!important}.fc-7day-row{display:grid!important;grid-template-columns:58px minmax(0,1fr)!important;gap:8px!important;align-items:start!important;border-bottom-color:#edf1f5!important}.fc-7day-items span{white-space:normal!important;overflow:visible!important}

  /* Homework */
  .hw-inline,.hw-screen{color:var(--fc-text)!important}.hw-inline-head,.hw-sectionhead{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;flex-wrap:wrap!important}.hw-inline-head h3,.hw-sectionhead h3{color:var(--fc-text)!important;font-weight:950!important}
  .hw-inline-head button,.hw-save{min-height:40px!important;background:var(--fc-primary)!important;color:#fff!important;border-radius:11px!important;font-weight:900!important}
  .hw-row{min-width:0!important;height:auto!important;display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:9px!important;align-items:start!important;background:#fff!important;border:1px solid var(--fc-line)!important;border-radius:13px!important;box-shadow:none!important;overflow:hidden!important}.hw-main{min-width:0!important}.hw-topline{display:flex!important;align-items:flex-start!important;gap:4px 8px!important;flex-wrap:wrap!important}.hw-task,.hw-note,.hw-due{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.hw-del{grid-column:2!important;justify-self:start!important;position:static!important}
  .hw-hero{background:var(--fc-primary-strong)!important;border-radius:20px!important;box-shadow:var(--fc-shadow)!important}.hw-stats>div{background:#fff!important;border:1px solid var(--fc-line)!important;border-radius:12px!important}.fc-homework-alert{box-shadow:none!important;border-width:1px!important;border-radius:12px!important}.fc-homework-alert.urgent{background:var(--fc-danger-soft)!important;border-color:#e8b6bb!important;color:#7c353c!important}.fc-homework-alert.today{background:#f6f5fb!important;border-color:#d1cbe2!important;color:#565070!important}

  /* Events */
  .pro-events{display:grid!important;gap:13px!important;min-width:0!important}.pro-page-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;background:#fff!important;border:1px solid var(--fc-line)!important;border-radius:16px!important;padding:13px 14px!important;box-shadow:var(--fc-shadow-sm)!important}.pro-page-head h1{margin:0!important;color:var(--fc-text)!important;font-size:23px!important;line-height:1.1!important;font-weight:950!important;letter-spacing:-.035em!important}.pro-page-head p{margin:4px 0 0!important;color:var(--fc-muted)!important;font-size:10px!important}.pro-page-head>button{min-height:40px!important;border:0!important;background:var(--fc-primary)!important;color:#fff!important;border-radius:11px!important;padding:8px 11px!important;font-size:10px!important;font-weight:900!important;white-space:nowrap!important}
  .pro-filters,.pro-month-jump{display:flex!important;gap:7px!important;max-width:100%!important;overflow-x:auto!important;padding:1px 1px 3px!important;scrollbar-width:none!important;overscroll-behavior-x:contain!important}.pro-filters::-webkit-scrollbar,.pro-month-jump::-webkit-scrollbar{display:none}
  .pro-filter{min-height:42px!important;flex:0 0 auto!important;border:1px solid var(--fc-line)!important;background:#fff!important;color:#59677a!important;border-radius:999px!important;padding:8px 12px!important;font-size:10px!important;font-weight:900!important;white-space:nowrap!important}.pro-filter.active{background:var(--fc-primary-strong)!important;border-color:var(--fc-primary-strong)!important;color:#fff!important}
  .pro-month-jump button{min-width:64px!important;min-height:46px!important;flex:0 0 auto!important;background:#fff!important;border:1px solid var(--fc-line)!important;border-bottom:3px solid var(--a)!important;border-radius:11px!important;padding:7px 10px!important;color:var(--fc-text-2)!important}.pro-month-jump b{display:block!important;font-size:11px!important;font-weight:950!important;color:var(--fc-text)!important}.pro-month-jump span{display:block!important;margin-top:1px!important;font-size:8px!important;color:var(--fc-muted)!important}.pro-month-jump button.fc-month-selected{outline:2px solid var(--fc-primary)!important;outline-offset:1px!important;background:#f8fbff!important}
  .pro-month{min-width:0!important;max-width:100%!important;background:transparent!important;border:0!important;border-radius:0!important;overflow:visible!important;scroll-margin-top:92px!important}.pro-month+.pro-month{margin-top:7px!important}.pro-month-head{position:sticky!important;top:calc(64px + var(--fc-safe-top))!important;z-index:20!important;background:rgba(246,248,251,.95)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important;border:0!important;border-left:4px solid var(--a)!important;border-radius:9px!important;padding:8px 10px!important;margin:0 0 7px!important;box-shadow:0 1px 0 rgba(23,32,51,.04)!important}.pro-month-head h2{margin:0!important;color:var(--fc-text)!important;font-size:18px!important;line-height:1.1!important;font-weight:950!important;letter-spacing:-.025em!important}.pro-month-head h2 span{font-size:10px!important;color:var(--fc-muted)!important}.pro-month-head p{margin:2px 0 0!important;font-size:8px!important;color:var(--fc-muted)!important}
  .pro-event-list{display:grid!important;gap:8px!important}.pro-event{min-width:0!important;max-width:100%!important;height:auto!important;display:grid!important;grid-template-columns:60px minmax(0,1fr)!important;align-items:start!important;gap:11px!important;background:#fff!important;border:1px solid var(--fc-line)!important;border-left:4px solid var(--a)!important;border-radius:14px!important;padding:11px!important;box-shadow:var(--fc-shadow-sm)!important;overflow:hidden!important}.pro-event-date{align-self:start!important;min-height:76px!important;height:auto!important;display:grid!important;place-content:center!important;text-align:center!important;background:#f7f9fc!important;border:1px solid #e3e8ef!important;border-radius:10px!important;color:var(--fc-text-2)!important}.pro-event-date b{font-size:21px!important;line-height:.95!important;color:var(--fc-text)!important;font-weight:950!important}.pro-event-date span{margin-top:3px!important;color:var(--a)!important;font-size:8px!important;font-weight:1000!important}.pro-event-date em{margin-top:2px!important;color:var(--fc-muted)!important;font-size:7px!important;font-style:normal!important;font-weight:850!important}
  .pro-event-body{min-width:0!important;display:flex!important;flex-direction:column!important}.pro-event-top{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:start!important;gap:7px 10px!important}.pro-event-top>div{min-width:0!important}.pro-event-top small{display:block!important;color:var(--a)!important;font-size:8px!important;font-weight:900!important}.pro-event-top h3{display:block!important;position:static!important;margin:2px 0 0!important;color:var(--fc-text)!important;font-size:15px!important;line-height:1.18!important;font-weight:950!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.pro-event-top time{position:static!important;align-self:start!important;color:var(--fc-text-2)!important;font-size:10px!important;font-weight:950!important;white-space:nowrap!important}.pro-event-body>p{position:static!important;margin:6px 0 0!important;color:var(--fc-muted)!important;font-size:10px!important;line-height:1.45!important;white-space:normal!important}.pro-event-foot{position:static!important;width:100%!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:8px!important;margin-top:9px!important}.pro-people{width:100%!important;display:flex!important;gap:5px 6px!important;flex-wrap:wrap!important}.pro-people span{display:inline-flex!important;align-items:center!important;gap:5px!important;width:auto!important;max-width:100%!important;background:#f5f7fa!important;border:1px solid #e2e7ed!important;border-radius:999px!important;padding:4px 7px!important;color:#526071!important;font-size:9px!important;font-weight:800!important;white-space:normal!important}.pro-people i{width:7px!important;height:7px!important;min-width:7px!important;border-radius:50%!important}.pro-event-actions{width:100%!important;display:flex!important;gap:6px!important;flex-wrap:wrap!important}.pro-event-actions button{min-height:34px!important;width:auto!important;border:1px solid var(--fc-line)!important;background:#f8fafc!important;color:#59677a!important;border-radius:9px!important;padding:7px 9px!important;font-size:9px!important;font-weight:850!important}.pro-event-actions .pro-original{background:var(--fc-primary-soft)!important;border-color:#cfdbea!important;color:var(--fc-primary)!important}.pro-event-actions .muted{background:transparent!important;border-color:transparent!important;color:#8b95a4!important}
  #events .fc-rsvp-box{border-radius:12px!important}.fc-rsvp-actions button{min-height:38px!important}

  /* More / documents */
  .settings-stack{display:grid!important;gap:10px!important}.setting{padding:14px!important;box-shadow:none!important}.setting h4{margin:0!important;color:var(--fc-text)!important;font-size:14px!important;font-weight:950!important}.setting p{color:var(--fc-muted)!important;font-size:10px!important;line-height:1.5!important}.pro-setting-head{display:flex!important;align-items:flex-start!important;gap:10px!important;flex-wrap:wrap!important}.pro-setting-head>div{min-width:0!important;flex:1 1 220px!important}.pro-setting-head>span{background:var(--fc-success-soft)!important;border:1px solid #c8dfd3!important;color:#3e6958!important;border-radius:999px!important;padding:4px 7px!important;font-size:8px!important;font-weight:900!important}
  .pro-doc-fields{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:10px!important}.pro-doc-fields #docEventLink{grid-column:1/-1!important}.pro-doc-fields input,.pro-doc-fields select{min-width:0!important;width:100%!important;min-height:42px!important;background:#fff!important;border:1px solid var(--fc-line)!important;border-radius:10px!important;padding:9px 10px!important;color:var(--fc-text-2)!important;font-size:11px!important}
  .pro-file-pick{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:wrap!important;margin-top:8px!important;background:#f8fafc!important;border:1px dashed var(--fc-line-strong)!important;border-radius:12px!important;padding:11px!important}.pro-file-pick>div{min-width:0!important;flex:1 1 180px!important}.pro-file-pick b{color:var(--fc-text)!important}.pro-file-pick span{display:block!important;color:var(--fc-muted)!important;overflow-wrap:anywhere!important}.pro-file-pick strong{background:var(--fc-primary-soft)!important;color:var(--fc-primary)!important;border-radius:8px!important;padding:7px 9px!important}
  .pro-doc-list{display:grid!important;gap:7px!important}.pro-doc-row{min-width:0!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;background:#fafbfd!important;border:1px solid #e3e8ef!important;border-radius:11px!important;padding:8px!important}.pro-doc-open{min-width:0!important;display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:9px!important;text-align:left!important}.pro-doc-open div{min-width:0!important}.pro-doc-open b,.pro-doc-open small,.pro-doc-open em{display:block!important;white-space:normal!important;overflow:visible!important}.pro-doc-icon{background:#eaf0f6!important;color:#4c6078!important;border-radius:8px!important}.pro-doc-delete{min-height:36px!important;border:0!important;background:transparent!important;color:#8f5358!important}

  /* forms */
  .modal,.fcq-modal,.pro-modal,.fcp-modal,.aimodal,.fc-detail-modal{background:rgba(15,23,42,.48)!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important}
  .sheet,.fcq-sheet,.pro-sheet,.fcp-sheet,.aisheet,.fc-detail-sheet{background:#fff!important;box-shadow:var(--fc-shadow-lg)!important}
  .sheet{border-radius:22px 22px 0 0!important;padding:17px 16px calc(22px + var(--fc-safe-bottom))!important}.sheet h3{color:var(--fc-text)!important;font-weight:950!important}
  .field label{color:var(--fc-muted)!important;font-size:9px!important;font-weight:900!important}.field input,.field select,.field textarea,.fcp-sheet input,.fcp-sheet textarea{width:100%!important;min-width:0!important;min-height:44px!important;border:1px solid var(--fc-line)!important;border-radius:11px!important;background:#fff!important;color:var(--fc-text)!important;padding:10px 11px!important}.field textarea,.fcp-sheet textarea{min-height:86px!important}
  .fcp-sheet{border-radius:21px!important}.fcp-head button,.fc-detail-close,.fc-picker-close,.aix{min-width:40px!important;min-height:40px!important;width:40px!important;height:40px!important;border:0!important;background:#f1f4f7!important;color:#536174!important;border-radius:50%!important}
  .toast{max-width:calc(100vw - 28px)!important;bottom:calc(88px + var(--fc-safe-bottom))!important;background:#263651!important;color:#fff!important;border-radius:12px!important;padding:10px 13px!important;font-size:10px!important;line-height:1.35!important;box-shadow:0 10px 26px rgba(23,32,51,.2)!important;white-space:normal!important;text-align:center!important}

  /* Family AI */
  .aisheet{width:min(680px,100%)!important;max-height:94dvh!important;margin:auto!important;border-radius:24px 24px 0 0!important;padding:16px 14px calc(22px + var(--fc-safe-bottom))!important;background:#f7f9fc!important}.aisheet header strong{color:var(--fc-text)!important;font-size:19px!important;font-weight:950!important}.aisheet header strong i{background:var(--fc-primary)!important}.aisheet header p{color:var(--fc-muted)!important}.aisheet nav{background:#e9eef5!important;border-radius:12px!important;padding:4px!important}.aisheet nav button{min-height:38px!important;border-radius:9px!important;color:var(--fc-muted)!important}.aisheet nav button.active{background:#fff!important;color:var(--fc-primary-strong)!important;box-shadow:var(--fc-shadow-sm)!important}#aibody{background:#fff!important;border:1px solid var(--fc-line)!important;border-radius:15px!important}.aitext,#aictx,.aiitem input,.aiitem select,.aiitem textarea{min-height:42px!important;border:1px solid var(--fc-line)!important;background:#fbfcfe!important;border-radius:10px!important;color:var(--fc-text)!important}.aigo{min-height:44px!important;background:var(--fc-primary)!important;border-radius:11px!important;font-weight:900!important}.fc-ai-budget{margin:0 0 10px!important;background:#f8fafc!important;border-color:var(--fc-line)!important;color:var(--fc-muted)!important;border-radius:11px!important}.fc-ai-budget.blocked{background:var(--fc-danger-soft)!important;border-color:#efc4c7!important;color:#8e3941!important}

  /* Details */
  .fc-detail-sheet,.fc-picker-sheet{border-radius:22px!important}.fc-detail-sheet h2{color:var(--fc-text)!important;font-weight:950!important}.fc-detail-grid>div,.fc-detail-rem{background:#f8fafc!important;border-color:var(--fc-line)!important}.fc-detail-people span{background:var(--fc-primary-soft)!important;border-color:#cfdaea!important;color:var(--fc-primary)!important}.fc-detail-note{border-color:var(--fc-line)!important}.fc-detail-doc{min-height:52px!important}.fc-detail-upload,.fc-picker-upload{min-height:58px!important}

  /* defensive layout */
  .screen,.content,.pc-wrap,.pc-section,.pc-kid,.pc-mainrow,.pc-cell,.hw-screen,.hw-section,.hw-row,.hw-main,.fc-7day,.fc-7day-row,.fc-7day-items,.pro-events,.pro-month,.pro-event,.pro-event-body,.pro-event-top,.pro-event-foot,.pro-people,.pro-event-actions,.pro-doc-row,.pro-doc-open,.pro-setting-head,.setting,.card,.term-card{min-width:0!important;max-width:100%!important}
  h1,h2,h3,h4,b,strong,p,span,small,em,time,button,label{overflow-wrap:anywhere;word-break:normal}
  .row2,.fields,.fcq-grid{min-width:0!important}

  @media(max-width:520px){
    .content{padding:16px 13px 34px!important}
    .topbar-in{padding-left:13px!important;padding-right:13px!important}
    .brand p{max-width:210px!important}
    .pro-event{grid-template-columns:56px minmax(0,1fr)!important;gap:9px!important;padding:10px!important}.pro-event-date{min-height:72px!important}.pro-event-top{grid-template-columns:minmax(0,1fr)!important;gap:3px!important}.pro-event-top time{justify-self:start!important;margin-top:2px!important}.pro-event-top h3{font-size:15px!important}.pro-event-actions button{min-height:38px!important}
    .pro-doc-fields{grid-template-columns:1fr!important}.pro-doc-fields #docEventLink{grid-column:auto!important}
    .row2{grid-template-columns:1fr!important}
  }
  @media(max-width:420px){
    .brand p{display:none!important}.aibtn b{display:none!important}.aibtn{width:40px!important;padding:0!important;justify-content:center!important}.aibtn i{padding:6px!important}
    .pc-title h2{font-size:25px!important}.pc-mainrow{grid-template-columns:repeat(3,minmax(0,1fr))!important}.pc-cell{padding:8px 6px!important}.pc-cell b{font-size:13px!important}.pc-cell.primary b{font-size:17px!important}
    .pro-page-head{align-items:flex-start!important}.pro-page-head>button{max-width:120px!important;white-space:normal!important;text-align:center!important}
    .fc-7day-row{grid-template-columns:50px minmax(0,1fr)!important}
    .fcp-row{grid-template-columns:26px minmax(0,1fr)!important}.fcp-del{grid-column:2!important;justify-self:start!important}.fcp-title{flex-direction:column!important;gap:3px!important}.fcp-title strong{white-space:normal!important}
  }
  @media(max-width:360px){
    .content{padding-left:10px!important;padding-right:10px!important}.topbar-in{padding-left:10px!important;padding-right:10px!important}.mark{width:35px!important;height:35px!important;min-width:35px!important}.brand h1{font-size:15px!important}.pc-mainrow{grid-template-columns:1fr 1fr!important}.pc-mainrow .pc-cell:last-child{grid-column:1/-1!important}.navbtn{font-size:8px!important}.pro-event{grid-template-columns:50px minmax(0,1fr)!important}.pro-event-date{min-height:68px!important}
  }
  @media(min-width:760px){
    .bottomnav{left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:640px!important;border:1px solid var(--fc-line)!important;border-bottom:0!important;border-radius:18px 18px 0 0!important}.content{padding-top:24px!important}.pc-hero{padding:24px!important}.pc-title h2{font-size:32px!important}
  }
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
  `;
  document.head.appendChild(css);

  function setNavIcons(){
    const nav=document.querySelector('.bottomnav');
    if(nav){nav.setAttribute('aria-label','Hauptnavigation');}
    document.querySelectorAll('.navbtn[data-screen]').forEach(btn=>{
      const id=btn.dataset.screen;
      btn.type='button';
      const ico=btn.querySelector('.ico');
      if(ico&&ICONS[id]&&ico.dataset.fcSvg!=='1'){ico.innerHTML=ICONS[id];ico.dataset.fcSvg='1'}
      const active=btn.classList.contains('active');
      btn.setAttribute('aria-current',active?'page':'false');
      const label=(btn.querySelector('span:last-child')?.textContent||id).trim();
      btn.setAttribute('aria-label',label);
    });
  }

  function markScreens(){
    document.querySelectorAll('.screen').forEach(s=>s.setAttribute('aria-hidden',String(!s.classList.contains('active'))));
    setNavIcons();
  }

  function enhanceButtons(root=document){
    root.querySelectorAll?.('button:not([type])').forEach(b=>b.type='button');
    root.querySelectorAll?.('button').forEach(b=>{
      const t=(b.textContent||'').trim();
      if((t==='×'||t==='✕')&&!b.getAttribute('aria-label'))b.setAttribute('aria-label','Schliessen');
    });
  }

  function enhanceDialogs(root=document){
    const selectors=['.modal.open','.fcq-modal','.pro-modal','.fcp-modal','.aimodal','.fc-detail-modal'];
    selectors.forEach(sel=>root.querySelectorAll?.(sel).forEach(m=>{
      const sheet=m.querySelector('.sheet,.fcq-sheet,.pro-sheet,.fcp-sheet,.aisheet,.fc-detail-sheet')||m.firstElementChild;
      if(sheet){sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true')}
    }));
  }

  function reorderToday(){
    const root=document.getElementById('today');if(!root)return;
    const pend=root.querySelector(':scope > .fcp-today'),hero=root.querySelector('.pc-hero');
    if(pend&&hero&&hero.parentElement){
      const wrap=hero.parentElement;
      if(pend.parentElement===root&&wrap===root)hero.insertAdjacentElement('afterend',pend);
      else if(pend.parentElement===root&&wrap!==root)wrap.insertAdjacentElement('afterend',pend);
    }
  }

  function enhanceImages(root=document){root.querySelectorAll?.('img:not([loading])').forEach(img=>{if(!img.closest('.topbar'))img.loading='lazy'})}

  function syncOnline(){document.documentElement.classList.toggle('fc-offline',!navigator.onLine)}

  function enhance(){
    markScreens();enhanceButtons();enhanceDialogs();enhanceImages();reorderToday();
    const quick=document.getElementById('quickAdd');if(quick){quick.type='button';quick.setAttribute('aria-label','Schnell hinzufügen');quick.setAttribute('aria-haspopup','dialog')}
    const ai=document.getElementById('fcAiBtn');if(ai){ai.type='button';ai.setAttribute('aria-label','Family AI öffnen');ai.setAttribute('aria-haspopup','dialog')}
    const toast=document.getElementById('toast');if(toast){toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true')}
  }

  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    const visible=[...document.querySelectorAll('.fc-detail-modal,.aimodal,.fcp-modal,.pro-modal,.fcq-modal,.modal.open')].filter(x=>x.offsetParent!==null);
    const top=visible.at(-1);if(!top)return;
    const close=top.querySelector('.fc-detail-close,.aix,.fcp-head button,.pro-sheet-head button,.fcq-close,#closeEvent,[aria-label="Schliessen"]');
    if(close){e.preventDefault();close.click()}
  });

  window.addEventListener('online',syncOnline);window.addEventListener('offline',syncOnline);syncOnline();
  window.addEventListener('error',e=>{try{window.__fcQuality=window.__fcQuality||{errors:[]};window.__fcQuality.errors.push({type:'error',message:String(e.message||'runtime error'),at:new Date().toISOString()});window.__fcQuality.errors=window.__fcQuality.errors.slice(-20)}catch(_){}});
  window.addEventListener('unhandledrejection',e=>{try{window.__fcQuality=window.__fcQuality||{errors:[]};window.__fcQuality.errors.push({type:'promise',message:String(e.reason?.message||e.reason||'promise rejection'),at:new Date().toISOString()});window.__fcQuality.errors=window.__fcQuality.errors.slice(-20)}catch(_){}});

  let raf=0;
  const observer=new MutationObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance()})});
  try{observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}catch(e){}
  enhance();requestAnimationFrame(enhance);

  window.__fcProfessionalAudit=()=>{
    const activeScreens=[...document.querySelectorAll('.screen.active')];
    const activeNav=[...document.querySelectorAll('.navbtn.active')];
    const duplicateIds=[...document.querySelectorAll('[id]')].map(x=>x.id).filter((x,i,a)=>x&&a.indexOf(x)!==i);
    const smallButtons=[...document.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect();return b.offsetParent!==null&&(r.width<32||r.height<32)}).length;
    return{version:1,activeScreens:activeScreens.length,activeNav:activeNav.length,duplicateIds:[...new Set(duplicateIds)],smallVisibleButtons:smallButtons,eventsAudit:window.__fcEventsAudit||null,runtimeHealth:window.__fcRuntimeHealth||null,errors:window.__fcQuality?.errors||[],online:navigator.onLine,checkedAt:new Date().toISOString()};
  };
})();
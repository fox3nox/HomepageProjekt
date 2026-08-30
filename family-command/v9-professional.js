/* Familienzentrale V9.11 · branding polish · no render wrappers */
(()=>{
'use strict';
if(window.__fcProfessionalInstalled)return;window.__fcProfessionalInstalled=true;
const APP='Familienzentrale',SHORT='Familie',ASSET_VERSION='20260830-v9110';
function brand(){document.title=APP;const b=document.querySelector('.fc9-brand b');if(b)b.textContent=APP;const s=document.querySelector('.fc9-brand span');if(s)s.textContent='Familie auf einen Blick';const mark=document.querySelector('.fc9-mark');if(mark&&!mark.querySelector('img'))mark.innerHTML=`<img src="./apple-touch-icon.png?v=${ASSET_VERSION}" alt="">`;document.querySelectorAll('.fc9-sheet-head small').forEach(x=>{if(/family command/i.test(x.textContent||''))x.textContent=APP.toUpperCase()});document.documentElement.dataset.fcBrand='familienzentrale'}
document.addEventListener('fc:v9-ready',brand,{once:true});
if(document.documentElement.dataset.fcV9Ready==='1')brand();
window.__fcProfessional={version:'9.11.0',brand,shortName:SHORT,renderWrappers:false,calendarPostProcessor:false};
})();

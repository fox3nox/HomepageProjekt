/* Familienzentrale V9.36 · compatibility loader for the new reference dashboard */
(()=>{
'use strict';
if(window.__fcReferenceMobileV35)return;window.__fcReferenceMobileV35=true;
const V='20260901-v9360';
function load(){
  if(!document.querySelector('link[data-fc36]')){const l=document.createElement('link');l.rel='stylesheet';l.href=`./reference-dashboard-v36.css?v=${V}`;l.dataset.fc36='1';document.head.appendChild(l)}
  if(!document.querySelector('script[data-fc36]')){const s=document.createElement('script');s.src=`./reference-dashboard-v36.js?v=${V}`;s.dataset.fc36='1';s.async=false;document.body.appendChild(s)}
  document.documentElement.dataset.fcReferenceLayout='v36';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();

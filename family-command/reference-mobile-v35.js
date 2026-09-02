/* Familienzentrale V9.43 · compatibility loader for reference dashboard + global design system + final polish */
(()=>{
'use strict';
if(window.__fcReferenceMobileV35)return;window.__fcReferenceMobileV35=true;
const V='20260902-v9430';
function css(file,key){if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=`./${file}?v=${V}`;l.dataset[key]='1';document.head.appendChild(l)}
function load(){css('reference-dashboard-v36.css','fc36');css('global-design-v37.css','fc37');css('v9-global-polish.css','fc43');if(!document.querySelector('script[data-fc36]')){const s=document.createElement('script');s.src=`./reference-dashboard-v36.js?v=${V}`;s.dataset.fc36='1';s.async=false;document.body.appendChild(s)}document.documentElement.dataset.fcReferenceLayout='v43';document.documentElement.dataset.fcGlobalDesign='v43'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
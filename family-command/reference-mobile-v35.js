/* Familienzentrale V9.47 · compatibility loader for reference dashboard + global design system + responsive product layer */
(()=>{
'use strict';
if(window.__fcReferenceMobileV35)return;window.__fcReferenceMobileV35=true;
const V='20260903-v9470';
function css(file,key){if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=`./${file}?v=${V}`;l.dataset[key]='1';document.head.appendChild(l)}
function script(file,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=`./${file}?v=${V}`;s.dataset[key]='1';s.async=false;document.body.appendChild(s)}
function load(){css('reference-dashboard-v36.css','fc36');css('global-design-v37.css','fc37');css('v9-global-polish.css','fc44');css('v9-global-polish-final.css','fc44final');css('v9-product-design.css','fc45');css('v9-product-design-fixes.css','fc45fix');css('v9-responsive-v946.css','fc46responsive');css('mobile-school-day-v947.css','fc47school');script('reference-dashboard-v36.js','fc36');script('mobile-school-day-v947.js','fc47schooljs');document.documentElement.dataset.fcReferenceLayout='v38';document.documentElement.dataset.fcGlobalDesign='v37';document.documentElement.dataset.fcGlobalPolish='v47'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
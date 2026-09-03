/* Family Command V9.55 · minimal recipe/meal bridge */
(()=>{
'use strict';
if(window.__fcRecipeMealBridgeInstalled)return;window.__fcRecipeMealBridgeInstalled=true;
const api=window.__fcMealPlanner;if(!api)return;
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateObj=v=>new Date(String(v)+'T12:00:00');
function weekKey(v){const d=dateObj(v),n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);return iso(d)}
function copyIngredients(recipe){return (Array.isArray(recipe?.ingredients)?recipe.ingredients:[]).filter(x=>x&&String(x.name||'').trim()).map(x=>({name:String(x.name).trim(),quantity:String(x.quantity||''),category:String(x.category||'Lebensmittel')}))}
function persist(){try{if(typeof save==='function')save()}catch(e){console.error('fc_recipe_meal_save',e)}try{window.__fcV9?.invalidate?.(['more'])}catch(_){}}
api.planRecipe=function(date,type,recipe,replace=false){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date))||!['breakfast','lunch','dinner'].includes(type)||!recipe?.title)return{ok:false};const s=api.store?.();if(!s)return{ok:false};if(!s.weeks||typeof s.weeks!=='object'||Array.isArray(s.weeks))s.weeks={};const wk=weekKey(date),now=new Date().toISOString(),w=s.weeks[wk]||(s.weeks[wk]={id:wk,createdAt:now,days:{}});if(!w.days||typeof w.days!=='object'||Array.isArray(w.days))w.days={};const day=w.days[date]||(w.days[date]={}),existing=day[type];if(existing&&!replace)return{ok:false,conflict:true,title:existing.title||'Eine Mahlzeit'};day[type]={id:existing?.id||`meal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,createdAt:existing?.createdAt||now,updatedAt:now,title:String(recipe.title).trim(),note:String(recipe.note||''),ingredients:copyIngredients(recipe),recipeId:String(recipe.id||''),source:'recipe'};w.updatedAt=now;persist();try{api.render?.()}catch(_){}return{ok:true,replaced:!!existing,week:wk,date,type}}
api.health=(()=>{const original=api.health;return()=>({...original?.(),recipePlanning:true})})();
document.documentElement.dataset.fcRecipeMealBridge='v55';
})();
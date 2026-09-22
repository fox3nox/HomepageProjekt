// Navigate through the visible product controls. V11 first, V9 fallback.
export async function openView(page,id){
 const isV11=await page.evaluate(()=>Boolean(window.__fcV11));
 if(isV11){
   const target={today:'today',tomorrow:'plan',events:'plan',homework:'tasks',docs:'docs',people:'more',more:'more'}[id]||'today';
   const button=page.locator(`[data-fc11-screen="${target}"]`).filter({visible:true}).first();
   if(await button.count())await button.click();else await page.evaluate(target=>window.__fcV11?.open?.(target),target);
   if(id==='tomorrow')await page.evaluate(()=>{const d=new Date((typeof todayISO==='function'?todayISO():new Date().toLocaleDateString('en-CA'))+'T12:00:00');d.setDate(d.getDate()+1);window.__fcV11.state.planDate=d.toLocaleDateString('en-CA');window.__fcV11.render()});
   await page.waitForFunction(target=>document.documentElement.dataset.fc11Screen===target,target);
   return;
 }
 const parent={tomorrow:'today',homework:'events',people:'more'}[id]||id;
 await page.locator(`.fc9-nav button[data-screen="${parent}"]`).click();
 if(id==='tomorrow'||id==='homework')await page.locator(`.fc9-screen.active [data-view="${id}"]`).click();
 await page.waitForFunction(id=>document.querySelector('.fc9-screen.active')?.id===id,id);
}

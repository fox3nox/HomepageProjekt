// Use the same visible controls as a person; no hidden legacy navigation buttons.
export async function openView(page,id){
 const parent={tomorrow:'today',homework:'events',people:'more'}[id]||id;
 await page.locator(`.fc9-nav button[data-screen="${parent}"]`).click();
 if(id==='tomorrow'||id==='homework')await page.locator(`.fc9-screen.active [data-view="${id}"]`).click();
 await page.waitForFunction(id=>document.querySelector('.fc9-screen.active')?.id===id,id);
}

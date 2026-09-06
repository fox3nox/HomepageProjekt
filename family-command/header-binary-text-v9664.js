/* Family Command V9.66.4 · physical-pixel header text for iPhone */
(()=>{
'use strict';
if(window.__fcHeaderBinaryTextV9664)return;window.__fcHeaderBinaryTextV9664=true;
const media=matchMedia('(max-width:719px)');
const SKIP=new Set(['SCRIPT','STYLE','SVG','CANVAS','IMG']);
let busy=false,timer=0;
function rgb(color){
  const m=color.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)/i);return m?[+m[1],+m[2],+m[3]]:[10,24,48];
}
function draw(host,text){
  const s=getComputedStyle(host),dpr=Math.max(1,devicePixelRatio||1),fs=parseFloat(s.fontSize)||16,lh=parseFloat(s.lineHeight)||Math.ceil(fs*1.2),ls=s.letterSpacing==='normal'?0:(parseFloat(s.letterSpacing)||0);
  const probe=document.createElement('canvas').getContext('2d');
  probe.font=`${s.fontStyle} ${s.fontWeight} ${fs}px ${s.fontFamily}`;probe.textBaseline='alphabetic';
  const chars=[...text],width=Math.max(1,Math.ceil(chars.reduce((n,ch,i)=>n+probe.measureText(ch).width+(i?ls:0),0)+2));
  const height=Math.max(1,Math.ceil(lh));
  let c=host.querySelector(':scope > canvas.fc-hardtext-canvas');if(!c){c=document.createElement('canvas');c.className='fc-hardtext-canvas';c.setAttribute('aria-hidden','true');host.appendChild(c)}
  c.width=Math.ceil(width*dpr);c.height=Math.ceil(height*dpr);c.style.cssText=`position:absolute;left:0;top:50%;width:${width}px;height:${height}px;transform:translateY(-50%);pointer-events:none;image-rendering:pixelated;z-index:1;`;
  const ctx=c.getContext('2d',{alpha:true,willReadFrequently:true});ctx.clearRect(0,0,c.width,c.height);ctx.scale(dpr,dpr);ctx.font=probe.font;ctx.textBaseline='alphabetic';ctx.fillStyle='#fff';
  const metrics=probe.measureText('Mg'),ascent=metrics.actualBoundingBoxAscent||fs*.8,descent=metrics.actualBoundingBoxDescent||fs*.2,base=(height+ascent-descent)/2;
  let x=1;for(const ch of chars){ctx.fillText(ch,x,base);x+=probe.measureText(ch).width+ls}
  const img=ctx.getImageData(0,0,c.width,c.height),data=img.data,[r,g,b]=rgb(s.color);for(let i=0;i<data.length;i+=4){const a=data[i+3]>=96?255:0;data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=a}ctx.putImageData(img,0,0);
  host.style.width=`${width}px`;host.style.minWidth=`${width}px`;host.style.height=`${height}px`;
}
function wrapTextNode(node){
  if(!node.parentElement||!node.nodeValue||!node.nodeValue.trim()||node.parentElement.closest('.fc-hardtext-host')||SKIP.has(node.parentElement.tagName))return;
  const host=document.createElement('span');host.className='fc-hardtext-host';host.style.cssText='position:relative;display:inline-block;vertical-align:baseline;color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;';
  node.parentNode.insertBefore(host,node);host.appendChild(node);draw(host,node.nodeValue);
}
function refresh(){
  if(busy)return;busy=true;try{
    const top=document.querySelector('.fc9-topbar');if(!top)return;
    if(!media.matches){for(const h of top.querySelectorAll('.fc-hardtext-host')){const t=[...h.childNodes].find(n=>n.nodeType===3);if(t)h.replaceWith(t)}return}
    const walker=document.createTreeWalker(top,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue?.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(wrapTextNode);
    for(const h of top.querySelectorAll('.fc-hardtext-host')){const t=[...h.childNodes].find(n=>n.nodeType===3);if(t)draw(h,t.nodeValue)}
    document.documentElement.dataset.fcHeaderRelease='v9664';document.documentElement.dataset.fcBinaryHeaderText='v9664';
  }finally{busy=false}}
}
const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(refresh,30)});
function install(){refresh();const top=document.querySelector('.fc9-topbar');if(top)obs.observe(top,{subtree:true,childList:true,characterData:true});media.addEventListener('change',refresh);addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(refresh,60)},{passive:true});setInterval(refresh,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

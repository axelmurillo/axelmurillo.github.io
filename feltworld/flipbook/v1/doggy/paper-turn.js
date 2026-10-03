/* Temporary CSS paper mesh. The canonical spread stays in the reading order. */
(() => {
 'use strict';
 const supported=()=>typeof CSS!=='undefined'&&CSS.supports('transform-style','preserve-3d')&&CSS.supports('backface-visibility','hidden')&&CSS.supports('transform','translate3d(0,0,0)');
 function create({host,direction,front,back,underlay,stationary}) {
  const bounds=host.getBoundingClientRect(),width=bounds.width/2,height=bounds.height,count=bounds.width<650?8:12,step=width/count;
  const layer=document.createElement('div');layer.className='paper-turn';layer.setAttribute('aria-hidden','true');
  underlay.classList.add('paper-underlay');stationary.className='stationary';stationary.style[direction===1?'left':'right']='0';
  const shadow=document.createElement('div');shadow.className='paper-shadow';
  const leaf=document.createElement('div');leaf.className='leaf paper-leaf '+(direction===1?'forward':'backward');
  const strips=[];
  for(let j=0;j<count;j++){
   const strip=document.createElement('div');strip.className='paper-strip';strip.style.width=(step+.35)+'px';strip.style.transformOrigin=direction===1?'left center':step+'px center';
   for(const [name,template,offset] of [['front',front,direction===1?j*step:width-(j+1)*step],['back',back,direction===1?width-(j+1)*step:j*step]]){
    const face=document.createElement('div');face.className='face '+name;
    if(name==='back'){face.style.transformOrigin='left center';face.style.transform=`translateX(${step}px) rotateY(180deg)`;}
    const content=template.cloneNode(true);Object.assign(content.style,{width:width+'px',height:height+'px',transform:`translateX(${-offset}px)`});face.append(content);strip.append(face);
   }
   leaf.append(strip);strips.push(strip);
  }
  layer.append(underlay,stationary,shadow,leaf);host.append(layer);
  function progress(p){
   const curl=Math.sin(Math.PI*p);let x=0,z=0;
   strips.forEach((strip,j)=>{
    const fraction=(j+.5)/count,angle=Math.PI*p-.18*curl+.92*curl*Math.pow(fraction,1.4);
    const left=direction===1?x:width-x-step;
    strip.style.transform=`translate3d(${left}px,0,${z}px) rotateY(${direction===1?-angle:angle}rad)`;
    strip.style.setProperty('--shade',(curl*(.08+.22*fraction)).toFixed(3));
    x+=step*Math.cos(angle);z+=step*Math.sin(angle);
   });
   // Keep the opposite page still; the curved sheet covers it progressively.
   stationary.hidden=false;
   const extent=Math.max(0,Math.min(width,Math.abs(x)));
   Object.assign(shadow.style,{left:(direction===1?width+Math.min(0,x):width-Math.max(0,x))+'px',width:extent+'px',opacity:String(curl*.38)});
  }
  progress(0);return {layer,leaf,stationary,progress,remove:()=>layer.remove(),segments:count};
 }
 window.FeltPaperTurn={supported,create};
})();

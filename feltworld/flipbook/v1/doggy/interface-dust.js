// Screen-space companion to the Three.js book dust: fine air and bounded deposits.
// Letter-top ranges are visual approximations, not font-outline collision geometry.
export function setupInterfaceDust(){
 const canvas=document.createElement('canvas');canvas.className='interface-dust';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),coarse=matchMedia('(pointer:coarse)'),magic=document.querySelector('#effects-settings');
 let width=0,height=0,raf=0,last=0,anchors=[],particles=[],dirty=true,turnWave=0,stirs=0,settled=0;
 const enabled=()=>magic.getAttribute('aria-pressed')==='true'&&!reduced.matches&&!document.hidden;
 const mobile=()=>width<600||coarse.matches;
 function measure(){
  anchors=[];const seen=new Set();
  const add=(x,y)=>{const key=Math.round(x)+','+Math.round(y);if(x>0&&x<width&&y>0&&y<height&&!seen.has(key)){seen.add(key);anchors.push({x,y});}};
  document.querySelectorAll('header .volume,header h1,header .hint,header a,footer button,footer #position,footer summary').forEach(el=>{
   if(!el.getClientRects().length)return;
   const style=getComputedStyle(el),r=el.getBoundingClientRect();
   if(el.matches('button')){for(let n=0;n<4;n++){const u=(n+1)/5;add(r.left+u*r.width,r.top+2+(style.borderRadius==='50%'?Math.abs(u-.5)*8:0));}}
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
   while(node=walker.nextNode())for(let n=0;n<node.length;n++){
    if(!node.textContent[n].trim())continue;const range=document.createRange();range.setStart(node,n);range.setEnd(node,n+1);const b=range.getBoundingClientRect();
    // Font line boxes contain ascender space; leave the bright grain just above the ink.
    if(b.width>0)add(b.left+b.width*.5,b.top+b.height*.19);
   }
  });dirty=false;canvas.dataset.anchors=String(anchors.length);
 }
 function resize(){width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio,mobile()?1.25:1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);dirty=true;
  const count=mobile()?320:820;
  particles=Array.from({length:count},(_,i)=>({x:Math.random()*width,y:Math.random()*height,vx:0,vy:0,phase:i*.91,size:.45+Math.random()*.7,home:(i%(mobile()?80:170))/(mobile()?80:170),landing:i<(mobile()?80:170),rest:false,delay:Math.random()*4,gold:i%3===0}));
  canvas.dataset.population=String(count);canvas.dataset.mobile=String(mobile());
 }
 function lift(p,power,dx=0,dy=0){p.rest=false;p.delay=2+Math.random()*4;p.vx+=(Math.random()-.5)*power+dx;p.vy-=power*(.25+Math.random()*.55)-dy;}
 function stir(x,y,power){if(!enabled())return;stirs++;canvas.dataset.stirs=String(stirs);for(const p of particles){const d=Math.hypot(p.x-x,p.y-y);if(d<100)lift(p,power*(1-d/100),(p.x-x)*.1,(p.y-y)*.05);}}
 let previousPointer=null;
 window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const prev=previousPointer;previousPointer={x:e.clientX,y:e.clientY};if(prev&&Math.hypot(e.clientX-prev.x,e.clientY-prev.y)>2)stir(e.clientX,e.clientY,28);},{passive:true});
 window.addEventListener('pointerdown',e=>stir(e.clientX,e.clientY,e.pointerType==='touch'?85:55),{passive:true});
 window.addEventListener('felt-turn',e=>{if(enabled()&&e.detail.start){turnWave=1;for(const p of particles)lift(p,65+Math.random()*35,e.detail.direction*12);}});
 window.addEventListener('scroll',()=>{dirty=true;},{passive:true});window.addEventListener('resize',resize);
 const ro=new ResizeObserver(()=>dirty=true);ro.observe(document.querySelector('main'));
 new MutationObserver(()=>dirty=true).observe(document.querySelector('header'),{subtree:true,childList:true,characterData:true});
 new MutationObserver(()=>{dirty=true;state();}).observe(magic,{attributes:true,attributeFilter:['aria-pressed']});
 document.fonts?.ready.then(()=>dirty=true);
 function draw(time){raf=0;if(!enabled())return;if(time-last<32){raf=requestAnimationFrame(draw);return;}const dt=Math.min(.06,Math.max(0,(time-last)/1000));last=time;if(dirty)measure();ctx.clearRect(0,0,width,height);settled=0;const t=time*.001;turnWave=Math.max(0,turnWave-dt*.35);
  for(let i=0;i<particles.length;i++){
   const p=particles[i],home=anchors[Math.floor(p.home*anchors.length)];p.delay-=dt;
   if(p.rest&&home){p.x=home.x+Math.sin(p.phase)*1.4;p.y=home.y-1-(i%3)*.5;settled++;}
   else{
    p.vx*=Math.exp(-dt*1.8);p.vy*=Math.exp(-dt*1.2);
    if(p.landing&&home&&p.delay<0){const dx=home.x-p.x,dy=home.y-p.y;p.x+=dx*Math.min(1,dt*.85);p.y+=dy*Math.min(1,dt*.85);if(Math.hypot(dx,dy)<2.5){p.rest=true;}}
    else{p.x+=(Math.sin(t*.3+p.phase)*4+p.vx)*dt;p.y+=(3+Math.cos(t*.2+p.phase)*2+p.vy)*dt;}
    if(p.x<-15)p.x=width+10;if(p.x>width+15)p.x=-10;if(p.y>height+15)p.y=-10;if(p.y<-60)p.y=height+10;
   }
   const shimmer=Math.pow(Math.max(0,Math.sin(t*(.8+(i%7)*.09)+p.phase)),12);
   ctx.globalAlpha=(p.rest?.58:.22)+shimmer*.34+turnWave*.08;ctx.fillStyle=p.gold?'#efcc87':'#e7eaf1';ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
   if(i%47===0&&shimmer>.25){ctx.globalAlpha=shimmer*.5;ctx.strokeStyle=p.gold?'#fff0cc':'#fff';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(p.x-2.3,p.y);ctx.lineTo(p.x+2.3,p.y);ctx.moveTo(p.x,p.y-2.3);ctx.lineTo(p.x,p.y+2.3);ctx.stroke();}
  }
  canvas.dataset.settled=String(settled);canvas.dataset.frames=String(Number(canvas.dataset.frames||0)+1);raf=requestAnimationFrame(draw);
 }
 function state(){cancelAnimationFrame(raf);raf=0;canvas.hidden=!enabled();canvas.dataset.active=String(enabled());if(enabled()){dirty=true;last=performance.now();raf=requestAnimationFrame(draw);}else ctx.clearRect(0,0,width,height);}
 reduced.addEventListener('change',state);coarse.addEventListener('change',resize);document.addEventListener('visibilitychange',state);resize();state();
}

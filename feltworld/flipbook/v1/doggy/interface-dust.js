// Screen-space companion to the Three.js book dust: fine air and bounded deposits.
// Letter-top ranges are visual approximations, not font-outline collision geometry.
export function setupInterfaceDust(){
 const canvas=document.createElement('canvas');canvas.className='interface-dust';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),coarse=matchMedia('(pointer:coarse)'),magic=document.querySelector('#effects-settings');
 let width=0,height=0,raf=0,last=0,anchors=[],particles=[],dirty=true,turnWave=0,stirs=0,settled=0,meteors=[],nextMeteor=0,totalMeteors=0;
 const enabled=()=>magic.getAttribute('aria-pressed')==='true'&&!reduced.matches&&!document.hidden;
 const mobile=()=>width<600||coarse.matches;
 const controlIds=new WeakMap();let nextControlId=0,anchorRevision=0,anchorByKey=new Map();
 const controlSelector='.site-header > a,.reader-intro .volume,.reader-intro h1,.scene-caption p,.controls button,.controls #position,.reader-tools summary,.reader-tools[open] .tool-menu a,.reader-tools[open] .tool-menu button';
 function visible(el){
  if(!el.getClientRects().length||el.closest('[hidden],[inert],.sr-only,.visually-hidden'))return false;
  for(let parent=el;parent&&parent!==document.body;parent=parent.parentElement){
   const style=getComputedStyle(parent),r=parent.getBoundingClientRect();
   if(style.display==='none'||style.visibility!=='visible'||Number(style.opacity)<.02||r.width<=1||r.height<=1)return false;
   if(style.clipPath==='inset(50%)')return false;
  }return true;
 }
 function measure(){
  const previous=anchorByKey;anchors=[];anchorByKey=new Map();const seen=new Set(),controls=new Set();
  const add=(owner,x,y,slot)=>{
   if(anchors.length>=240||x<=0||x>=width||y<=0||y>=height)return;
   const r=owner.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)return;
   // A covered/clipped control is not a landing surface, even if its text Range exists.
   const hit=document.elementFromPoint(x,y);if(!hit||!owner.contains(hit))return;
   const pixel=Math.round(x/3)+','+Math.round(y/3);if(seen.has(pixel))return;seen.add(pixel);
   if(!controlIds.has(owner))controlIds.set(owner,++nextControlId);
   const control=controlIds.get(owner),key=control+':'+slot,anchor={x,y,key,control,owner};
   anchors.push(anchor);anchorByKey.set(key,anchor);controls.add(control);
  };
  document.querySelectorAll(controlSelector).forEach(el=>{
   if(!visible(el))return;const style=getComputedStyle(el),r=el.getBoundingClientRect();
   // Use the drawn cog, never its clipped accessibility-label line box.
   const icon=el.matches('summary')?el.querySelector('svg'):null;
   if(icon){const q=icon.getBoundingClientRect();for(let n=0;n<4;n++)add(el,q.left+(n+1)*q.width/5,q.top+1,'icon'+n);}
   if(el.matches('button'))for(let n=0;n<4;n++){const u=(n+1)/5;add(el,r.left+u*r.width,r.top+2+(style.borderRadius==='50%'?Math.abs(u-.5)*8:0),'edge'+n);}
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node,slot=0;
   while(node=walker.nextNode()){
    if(!visible(node.parentElement))continue;
    for(let n=0;n<node.length;n++,slot++){
     if(!node.textContent[n].trim())continue;const range=document.createRange();range.setStart(node,n);range.setEnd(node,n+1);const b=range.getBoundingClientRect();
     if(b.width>0)add(el,b.left+b.width*.5,b.top+b.height*.19,'text'+slot);
    }
   }
  });
  // A stable per-control key follows layout changes; one grain per site prevents clumps.
  const occupied=new Set();for(const p of particles){
   const old=previous.get(p.anchorKey);let home=anchorByKey.get(p.anchorKey);
   if(home&&occupied.has(home.key))home=null;
   if(!home&&p.landing&&anchors.length){const start=Math.floor(p.home*anchors.length);for(let n=0;n<anchors.length;n++){const candidate=anchors[(start+n)%anchors.length];if(!occupied.has(candidate.key)){home=candidate;break;}}}
   if(p.rest&&(!home||!old||home.control!==old.control))lift(p,12);
   p.anchorKey=home?.key;if(home&&p.landing)occupied.add(home.key);
  }
  dirty=false;canvas.dataset.anchors=String(anchors.length);canvas.dataset.anchorControls=String(controls.size);canvas.dataset.anchorRevision=String(++anchorRevision);canvas.dataset.anchorMenuOpen=String(!!document.querySelector('.reader-tools')?.open);canvas.dataset.anchorViewport=width+'x'+height;
 }
 function resize(){
  const previousWidth=width,previousHeight=height;width=Math.max(1,innerWidth);height=Math.max(1,innerHeight);
  const ratio=Math.min(devicePixelRatio,mobile()?1.25:1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);dirty=true;
  const count=mobile()?160:450,quota=mobile()?35:85;
  // Keep surviving grains and their control memory; a viewport is not a new sky.
  const keep=Math.min(count,particles.length),sx=previousWidth?width/previousWidth:1,sy=previousHeight?height/previousHeight:1;
  for(let i=0;i<keep;i++){
   const p=particles[i];p.x=Math.max(-15,Math.min(width+15,p.x*sx));p.y=Math.max(-60,Math.min(height+15,p.y*sy));
   const landing=i<quota;if(p.landing&&!landing&&p.rest)lift(p,12);
   p.landing=landing;if(!landing)p.anchorKey=undefined;
  }
  if(particles.length>count)particles.length=count;
  for(let i=particles.length;i<count;i++)particles.push({x:Math.random()*width,y:Math.random()*height,vx:0,vy:0,phase:i*.91,size:.45+Math.random()*.7,home:(i%quota)/quota,landing:i<quota,rest:false,delay:Math.random()*4,gold:i%3===0});
  previousPointer=null;canvas.dataset.population=String(count);canvas.dataset.mobile=String(mobile());
 }
 function lift(p,power,dx=0,dy=0){p.rest=false;p.delay=2+Math.random()*4;p.vx+=(Math.random()-.5)*power+dx;p.vy-=power*(.25+Math.random()*.55)-dy;}
 function stir(x,y,power){if(!enabled())return;stirs++;canvas.dataset.stirs=String(stirs);for(const p of particles){const d=Math.hypot(p.x-x,p.y-y);if(d<100)lift(p,power*(1-d/100),(p.x-x)*.1,(p.y-y)*.05);}}
 let previousPointer=null;
 window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const prev=previousPointer;previousPointer={x:e.clientX,y:e.clientY};if(prev&&Math.hypot(e.clientX-prev.x,e.clientY-prev.y)>2)stir(e.clientX,e.clientY,28);},{passive:true});
 window.addEventListener('pointerdown',e=>stir(e.clientX,e.clientY,e.pointerType==='touch'?85:55),{passive:true});
 window.addEventListener('felt-turn',e=>{if(enabled()&&e.detail.start){turnWave=1;for(const p of particles)lift(p,65+Math.random()*35,e.detail.direction*12);}});
 window.addEventListener('scroll',()=>{dirty=true;},{passive:true});window.addEventListener('resize',resize);
 const ro=new ResizeObserver(()=>dirty=true);ro.observe(document.querySelector('main'));
 const layoutObserver=new MutationObserver(()=>dirty=true);
 for(const el of document.querySelectorAll('header,.controls')){layoutObserver.observe(el,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['open','hidden','class','style','aria-hidden','disabled']});ro.observe(el);}
 document.addEventListener('toggle',event=>{if(event.target.matches('details'))dirty=true;},true);
 for(const eventName of ['transitionend','animationend'])document.addEventListener(eventName,event=>{if(event.target.closest?.('header,.controls'))dirty=true;},true);
 new MutationObserver(()=>{dirty=true;state();}).observe(magic,{attributes:true,attributeFilter:['aria-pressed']});
 document.fonts?.ready.then(()=>dirty=true);document.fonts?.addEventListener('loadingdone',()=>dirty=true);
 if(location.search.includes('dustQA=1'))canvas.__dustSnapshot=()=>({width,height,anchors:anchors.map(a=>({x:a.x,y:a.y,key:a.key,control:a.owner.id||a.owner.getAttribute('aria-label')||a.owner.tagName,href:a.owner.getAttribute('href')})),landing:particles.filter(p=>p.landing).map(p=>({id:particles.indexOf(p),x:p.x,y:p.y,phase:p.phase,rest:p.rest,anchorKey:p.anchorKey}))});
 function drawMeteors(time,dt){
  const light=document.documentElement.dataset.theme==='light'||(document.documentElement.dataset.theme==='system'&&matchMedia('(prefers-color-scheme:light)').matches);
  if(time>=nextMeteor){
   const depth=Math.floor(Math.random()*3),scale=[.45,.75,1.15][depth];
   const angle=Math.random()<.75?(-.08-Math.random()*.55):(Math.random()*Math.PI*2),direction=Math.random()<.2?-1:1;
   meteors.push({x:Math.random()*width,y:Math.random()*height,age:0,life:1.5+Math.random(),speed:(mobile()?90:140)*scale,length:55*scale,depth,dx:Math.cos(angle)*direction,dy:Math.sin(angle)*direction});
   nextMeteor=time+(mobile()?1200:650)+Math.random()*900;totalMeteors++;canvas.dataset.meteorsEmitted=String(totalMeteors);
  }
  meteors=meteors.filter(m=>m.age<m.life);
  for(const m of meteors){m.age+=dt;m.x+=m.speed*m.dx*dt;m.y+=m.speed*m.dy*dt;
   const fade=Math.sin(Math.PI*Math.min(1,m.age/m.life));
   ctx.globalAlpha=fade*[.28,.48,.72][m.depth];
   const gradient=ctx.createLinearGradient(m.x-m.length*m.dx,m.y-m.length*m.dy,m.x,m.y);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,light?'#667fa9':'#f8e4b7');ctx.strokeStyle=gradient;ctx.lineWidth=[.65,1,1.5][m.depth];ctx.beginPath();ctx.moveTo(m.x-m.length*m.dx,m.y-m.length*m.dy);ctx.lineTo(m.x,m.y);ctx.stroke();
   ctx.fillStyle=light?'#647a99':'#fff5dc';ctx.beginPath();ctx.arc(m.x,m.y,[.8,1.1,1.6][m.depth],0,Math.PI*2);ctx.fill();
  }
  canvas.dataset.meteorLayers='3';canvas.dataset.meteors=String(meteors.length);
 }
 function draw(time){raf=0;if(!enabled())return;if(time-last<32){raf=requestAnimationFrame(draw);return;}const dt=Math.min(.06,Math.max(0,(time-last)/1000));last=time;if(dirty)measure();ctx.clearRect(0,0,width,height);settled=0;const t=time*.001;turnWave=Math.max(0,turnWave-dt*.35);
  for(let i=0;i<particles.length;i++){
   const p=particles[i],home=anchorByKey.get(p.anchorKey);p.delay-=dt;
   if(p.rest&&home){p.x=home.x+Math.sin(p.phase)*1.4;p.y=home.y-1-(i%3)*.5;settled++;}
   else{
    p.vx*=Math.exp(-dt*1.8);p.vy*=Math.exp(-dt*1.2);
    if(p.landing&&home&&p.delay<0){const dx=home.x-p.x,dy=home.y-p.y;p.x+=dx*Math.min(1,dt*.85);p.y+=dy*Math.min(1,dt*.85);if(Math.hypot(dx,dy)<2.5){p.rest=true;}}
    else{p.x+=(Math.sin(t*.3+p.phase)*4+p.vx)*dt;p.y+=(3+Math.cos(t*.2+p.phase)*2+p.vy)*dt;}
    if(p.x<-15)p.x=width+10;if(p.x>width+15)p.x=-10;if(p.y>height+15)p.y=-10;if(p.y<-60)p.y=height+10;
   }
   const shimmer=Math.pow(Math.max(0,Math.sin(t*(.8+(i%7)*.09)+p.phase)),12);
   ctx.globalAlpha=(p.rest?.58:.22)+shimmer*.34+turnWave*.08;const light=document.documentElement.dataset.theme==='light'||(document.documentElement.dataset.theme==='system'&&matchMedia('(prefers-color-scheme:light)').matches);ctx.fillStyle=light?(p.gold?'#977039':'#7182a1'):(p.gold?'#efcc87':'#e7eaf1');ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
   if(i%47===0&&shimmer>.25){ctx.globalAlpha=shimmer*.5;ctx.strokeStyle=p.gold?'#fff0cc':'#fff';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(p.x-2.3,p.y);ctx.lineTo(p.x+2.3,p.y);ctx.moveTo(p.x,p.y-2.3);ctx.lineTo(p.x,p.y+2.3);ctx.stroke();}
  }
  drawMeteors(time,dt);canvas.dataset.settled=String(settled);canvas.dataset.frames=String(Number(canvas.dataset.frames||0)+1);raf=requestAnimationFrame(draw);
 }
 function state(){cancelAnimationFrame(raf);raf=0;canvas.hidden=!enabled();canvas.dataset.active=String(enabled());if(enabled()){dirty=true;last=performance.now();raf=requestAnimationFrame(draw);}else ctx.clearRect(0,0,width,height);}
 reduced.addEventListener('change',state);coarse.addEventListener('change',resize);document.addEventListener('visibilitychange',state);resize();state();
}

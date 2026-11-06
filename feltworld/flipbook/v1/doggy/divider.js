(()=>{
 const ns='http://www.w3.org/2000/svg',rules=[];
 let current=0,count=1;
 function visiblePosition(){const n=(document.querySelector('#position')?.textContent||'').match(/\d+/g);if(n?.length>=2){current=Number(n[0])-1;count=Number(n[1]);}}
 visiblePosition();
 function progress(){return count>1?Math.max(0,Math.min(1,current/(count-1))):0;}
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),motion=document.querySelector('#motion-settings'),effects=document.querySelector('#effects-settings');
 let displayed=progress();
 function permitted(){return !reduced.matches&&!document.hidden&&[motion,effects].every(el=>!el||el.getAttribute('aria-pressed')==='true');}
 function paint(){for(const draw of rules)draw();}
 function snap(){displayed=progress();paint();}
 function turnPosition(detail,amount){return detail.count>1?Math.max(0,Math.min(1,(detail.fromIndex+(detail.toIndex-detail.fromIndex)*amount)/(detail.count-1))):0;}
 function tracked(detail){return Number.isInteger(detail?.fromIndex)&&Number.isInteger(detail.toIndex)&&Number.isInteger(detail.count);}
 for(const [index,el] of [...document.querySelectorAll('.site-header,.reading-copy')].entries()){
  const svg=document.createElementNS(ns,'svg');svg.classList.add('reader-rule');svg.setAttribute('aria-hidden','true');
  svg.innerHTML=`<defs><clipPath id="reader-gold-clip-${index}"><rect class="reader-gold-extent" x="0" y="-16" width="0" height="42"/></clipPath></defs><path class="reader-rule-base" stroke="var(--line)" stroke-opacity=".35"/><path class="reader-rule-gold" stroke="var(--gold)" clip-path="url(#reader-gold-clip-${index})"/><path class="reader-rule-corners" stroke="var(--gold)"/>${index===0?'<g class="reader-progress-stitch" visibility="hidden"><path d="M-4 -3.6 Q0 -.45 4 3.6" stroke="#b84b20" stroke-width="2.2" style="stroke-width:2.2px" stroke-linecap="round"/><path d="M-3.9 3.6 Q.3 .15 3.9 -3.6" stroke="#d65b27" stroke-width="2.2" style="stroke-width:2.2px" stroke-linecap="round"/></g>':''}`;
  (el.matches('.reading-copy')?el.querySelector('summary'):el).append(svg);
  let w=20;
  const draw=()=>{
   const p=displayed,x=8+(w-16)*p;
   svg.querySelector('.reader-gold-extent').setAttribute('width',String(p===1?w:x));
   const stitch=svg.querySelector('.reader-progress-stitch');
   if(stitch){stitch.setAttribute('transform',`translate(${x} 8.5)`);stitch.setAttribute('visibility',p>0&&p<1?'visible':'hidden');}
   svg.dataset.readingPosition=String(p);
  };
  const resize=()=>{
   w=Math.max(20,el.getBoundingClientRect().width);
   svg.setAttribute('viewBox',`0 0 ${w} 9`);
   const shape=`M.5 .5 V4.5 Q.5 8.5 4.5 8.5 H${w-4.5} Q${w-.5} 8.5 ${w-.5} 4.5 V.5`;
   svg.querySelector('.reader-rule-base').setAttribute('d',shape);svg.querySelector('.reader-rule-gold').setAttribute('d',shape);
   svg.querySelector('.reader-rule-corners').setAttribute('d',`M.5 .5 V4.5 Q.5 8.5 4.5 8.5 H8 M${w-8} 8.5 H${w-4.5} Q${w-.5} 8.5 ${w-.5} 4.5 V.5`);
   draw();
  };
  new ResizeObserver(resize).observe(el);rules.push(draw);resize();
 }
 window.addEventListener('felt-scene',e=>{current=e.detail.index;count=e.detail.count;snap();});
 window.addEventListener('felt-turn',e=>{
  if(!tracked(e.detail)||!permitted())return;
  displayed=turnPosition(e.detail,Math.max(0,Math.min(1,e.detail.progress)));paint();
 });
 window.addEventListener('felt-turn-end',e=>{
  if(!tracked(e.detail))return;
  displayed=turnPosition(e.detail,e.detail.committed?1:0);paint();
 });
 const preferencesChanged=()=>{if(!permitted())snap();};
 for(const el of [motion,effects])if(el)new MutationObserver(preferencesChanged).observe(el,{attributes:true,attributeFilter:['aria-pressed']});
 if(reduced.addEventListener)reduced.addEventListener('change',preferencesChanged);else reduced.addListener(preferencesChanged);
 document.addEventListener('visibilitychange',preferencesChanged);
})();

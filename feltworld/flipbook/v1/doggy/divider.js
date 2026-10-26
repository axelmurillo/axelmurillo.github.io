(()=>{
 const ns='http://www.w3.org/2000/svg',rules=[];
 let current=0,count=1;
 function visiblePosition(){const n=(document.querySelector('#position')?.textContent||'').match(/\d+/g);if(n?.length>=2){current=Number(n[0])-1;count=Number(n[1]);}}
 visiblePosition();
 function progress(){return count>1?Math.max(0,Math.min(1,current/(count-1))):0;}
 for(const [index,el] of [...document.querySelectorAll('.site-header,.reading-copy')].entries()){
  const svg=document.createElementNS(ns,'svg');svg.classList.add('reader-rule');svg.setAttribute('aria-hidden','true');
  svg.innerHTML=`<defs><clipPath id="reader-gold-clip-${index}"><rect class="reader-gold-extent" x="0" y="-16" width="0" height="42"/></clipPath></defs><path class="reader-rule-base" stroke="var(--line)" stroke-opacity=".35"/><path class="reader-rule-gold" stroke="var(--gold)" clip-path="url(#reader-gold-clip-${index})"/><path class="reader-rule-corners" stroke="var(--gold)"/>${index===0?'<g class="reader-progress-stitch" visibility="hidden"><path d="M-2.5 -2.2 Q0 -.3 2.5 2.2 M-2.4 2.2 Q.2 .1 2.4 -2.2" stroke="var(--gold)" stroke-width="1.15" stroke-linecap="round"/></g>':''}`;
  (el.matches('.reading-copy')?el.querySelector('summary'):el).append(svg);
  const draw=()=>{
   const w=Math.max(20,el.getBoundingClientRect().width),p=progress();
   svg.setAttribute('viewBox',`0 0 ${w} 9`);
   const shape=`M.5 .5 V4.5 Q.5 8.5 4.5 8.5 H${w-4.5} Q${w-.5} 8.5 ${w-.5} 4.5 V.5`;
   svg.querySelector('.reader-rule-base').setAttribute('d',shape);svg.querySelector('.reader-rule-gold').setAttribute('d',shape);
   svg.querySelector('.reader-rule-corners').setAttribute('d',`M.5 .5 V4.5 Q.5 8.5 4.5 8.5 H8 M${w-8} 8.5 H${w-4.5} Q${w-.5} 8.5 ${w-.5} 4.5 V.5`);
   const x=8+(w-16)*p;svg.querySelector('.reader-gold-extent').setAttribute('width',String(p===1?w:x));
   const stitch=svg.querySelector('.reader-progress-stitch');
   if(stitch){stitch.setAttribute('transform',`translate(${x} 8.5)`);stitch.setAttribute('visibility',current>0&&current<count-1?'visible':'hidden');}
   svg.dataset.readingPosition=String(p);
  };
  new ResizeObserver(draw).observe(el);rules.push(draw);draw();
 }
 window.addEventListener('felt-scene',e=>{current=e.detail.index;count=e.detail.count;for(const draw of rules)draw();});
})();

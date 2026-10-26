// Decorative motion never owns the book's layout, tilt or page-turn transforms.
(()=>{
 const root=document.documentElement,book=document.querySelector('#book'),tools=document.querySelector('.reader-tools'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const effects=document.querySelector('#effects-settings'),motion=document.querySelector('#motion-settings'),depth=document.querySelector('#depth-settings');
 let timer=0,animation=null,interacted=false,invited=false;
 function permitted(){return !reduced.matches&&!document.hidden&&[effects,motion,depth].every(el=>el?.getAttribute('aria-pressed')==='true')&&!tools.open&&!book.matches('.turning,.dragging,.zoomed')&&!document.body.classList.contains('reader-loading');}
 function cancel(){clearTimeout(timer);timer=0;if(animation){animation.cancel();animation=null;}book.dataset.invitation=invited?'settled':interacted?'declined':'quiet';}
 function sync(){
  root.dataset.readerEffects=effects.getAttribute('aria-pressed')==='true'?'on':'off';
  if(!permitted()||!book.querySelector('.cover.front')){cancel();return;}
  if(timer||animation||invited||interacted)return;
  book.dataset.invitation='waiting';
  timer=setTimeout(()=>{
   timer=0;const cover=book.querySelector('.cover.front');
   if(!cover||interacted||!permitted()||typeof cover.animate!=='function')return;
   invited=true;book.dataset.invitation='opening-hint';
   cover.style.transformOrigin='4% 50%';
   animation=cover.animate([
    {transform:'perspective(1200px) rotateY(0deg)',offset:0},
    {transform:'perspective(1200px) rotateY(-.9deg)',offset:.3},
    {transform:'perspective(1200px) rotateY(0deg)',offset:.55},
    {transform:'perspective(1200px) rotateY(-.35deg)',offset:.73},
    {transform:'perspective(1200px) rotateY(0deg)',offset:1}
   ],{duration:1650,easing:'ease-in-out',iterations:1});
   animation.onfinish=()=>{animation=null;book.dataset.invitation='settled';};
  },4500);
 }
 function rest(){interacted=true;cancel();}
 for(const name of ['pointerdown','keydown','focusin','wheel','touchstart'])document.addEventListener(name,rest,{passive:true,capture:true});
 window.addEventListener('scroll',rest,{passive:true});window.addEventListener('resize',rest,{passive:true});window.addEventListener('blur',cancel);
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);tools.addEventListener('toggle',sync);
 new MutationObserver(sync).observe(book,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 for(const el of [effects,motion,depth])new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:['aria-pressed','disabled']});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 sync();
})();

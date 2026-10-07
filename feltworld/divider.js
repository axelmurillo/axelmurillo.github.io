// Keep corner geometry in CSS pixels rather than stretching a fixed viewBox.
(()=>{
 const dividers=[...document.querySelectorAll('.landing-divider,.bottom-divider')];
 function shape(el){const svg=el.querySelector('svg'),w=el.getBoundingClientRect().width;if(!svg||w<8)return;svg.setAttribute('viewBox','0 0 '+w+' 6');svg.querySelector('path').setAttribute('d','M.5 .5 V1.5 Q.5 4.5 3.5 4.5 H'+(w-3.5)+' Q'+(w-.5)+' 4.5 '+(w-.5)+' 1.5 V.5');const stops=svg.querySelectorAll('stop');stops[1].setAttribute('offset',String(10/w));stops[2].setAttribute('offset',String(10/w));stops[3].setAttribute('offset',String(1-10/w));stops[4].setAttribute('offset',String(1-10/w));}
 const observer=new ResizeObserver(entries=>entries.forEach(e=>shape(e.target)));dividers.forEach(el=>{observer.observe(el);shape(el)});
})();

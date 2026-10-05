import {setupInterfaceDust} from './interface-dust.js';
import './graphics.js';
import { setupAtmosphere } from './atmosphere.js';
const book=document.querySelector('#book'),stage=document.querySelector('.stage'),depth=document.querySelector('#depth-settings'),motion=document.querySelector('#motion-settings'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const magic=setupAtmosphere();
setupInterfaceDust();
function sync(){const title=document.querySelector('#scene').textContent;document.querySelector('#plain-words').textContent=[...document.querySelectorAll('#spread .story-copy')].map(x=>x.getAttribute('aria-label')||x.textContent).filter(Boolean).join('\n\n')||'This is a quiet illustrated page.';magic.scene(title);}
new MutationObserver(sync).observe(document.querySelector('#spread'),{childList:true,subtree:true,characterData:true});sync();
let depthOff=false;try{depthOff=localStorage.getItem('felt-reader-depth-v2')==='off';}catch{}
let frame=0,x=0,y=0,tx=0,ty=0,inside=false;
function enabled(){return !depthOff&&!reduced.matches&&motion.getAttribute('aria-pressed')==='true';}
function animate(){frame=0;if(book.classList.contains('turning'))return;x+=(tx-x)*.1;y+=(ty-y)*.1;if(Math.abs(tx-x)+Math.abs(ty-y)<.02){x=tx;y=ty;}book.style.transform=`translate3d(0,${(-Math.hypot(x,y)*.45).toFixed(2)}px,0) rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg)`;book.dataset.tilt=`${x.toFixed(3)},${y.toFixed(3)}`;if(x!==tx||y!==ty)frame=requestAnimationFrame(animate);}
function wake(){if(!frame)frame=requestAnimationFrame(animate);}
function centre(){inside=false;tx=ty=0;wake();}
function updateDepth(){const on=enabled();depth.textContent=on?'Depth on':'Depth off';depth.setAttribute('aria-pressed',String(on));depth.disabled=reduced.matches;depth.title=reduced.matches?'Your device requests reduced motion':'Pause or enable cursor-following book depth';if(!on){cancelAnimationFrame(frame);frame=0;x=y=tx=ty=0;book.style.transform='';book.dataset.tilt='0,0';}}
depth.onclick=()=>{depthOff=!depthOff;try{localStorage.setItem('felt-reader-depth-v2',depthOff?'off':'on');}catch{}updateDepth();};reduced.addEventListener('change',updateDepth);new MutationObserver(updateDepth).observe(motion,{attributes:true,attributeFilter:['aria-pressed']});updateDepth();
// Use actual pointer events instead of relying on hover media-query reporting in embedded browsers.
window.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||!enabled()||book.classList.contains('turning'))return;const r=stage.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){if(inside)centre();return;}inside=true;const b=book.getBoundingClientRect();tx=Math.max(-2.5,Math.min(2.5,(.5-(event.clientY-b.top)/b.height)*5));ty=Math.max(-3,Math.min(3,((event.clientX-b.left)/b.width-.5)*6));wake();},{passive:true});stage.addEventListener('pointerleave',centre);window.addEventListener('blur',centre);
new MutationObserver(()=>{if(book.classList.contains('turning')){cancelAnimationFrame(frame);frame=0;}else if(enabled())wake();}).observe(book,{attributes:true,attributeFilter:['class']});

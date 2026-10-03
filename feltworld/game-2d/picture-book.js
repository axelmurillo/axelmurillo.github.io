import { PAGES, CUTOUTS } from './picture-book-data.js';
import { SITE } from './site-config.js';
import { updateSiteNotices } from './site.js';
import { StoryAudio } from './audio.js';

const $=s=>document.querySelector(s), book=$('#book'), spread=$('#spread'), layer=$('#play-layer');
const mobile=matchMedia('(max-width:760px)'), motion=matchMedia('(prefers-reduced-motion:reduce)');
const LAST=PAGES.length+1, sounds=new StoryAudio();
sounds.enabled=false;
let cursor=0, turning=false, autoTimer=null, wandering=false, wanderTimer=null, selected=null, fringe='silver', swipe=null, suppressClick=false;
const pieces=new Map(CUTOUTS.map(p=>[p.id,{...p,visible:p.family==='friend'}]));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=n=>n<=0?0:n>=LAST?LAST:mobile.matches?n:n%2?n:n-1;
const gentle=()=>motion.matches||$('#gentle-turns').checked;
$('#gentle-turns').checked=motion.matches;
const pageHTML=(n,side)=>{
  const p=PAGES[n-1];
  if(!p)return '<article class="page blank" aria-hidden="true"></article>';
  return `<article class="page ${side}" data-page="${n}"><div class="page-head"><p class="eyebrow">${escape(p.chapter)}</p><h2>${escape(p.title)}</h2></div><figure class="artwork"><button class="artwork-button" data-art="${n}" aria-label="Look closer at ${escape(p.title)}"><img src="${p.src}" alt="${escape(p.title)}" draggable="false"><span class="look-closer">Look closer ↗</span></button></figure><p class="page-caption">${escape(p.caption)}</p><span class="page-number">${n}</span><button class="corner prev" data-turn="-1" aria-label="Previous pages">‹</button><button class="corner next" data-turn="1" aria-label="Next pages">›</button></article>`;
};
const castHTML=()=>`<div class="cover-cast" aria-hidden="true">${CUTOUTS.filter(p=>p.family==='friend').map(p=>`<span class="sprite ${p.id}" data-fringe="silver"></span>`).join('')}</div>`;
function coverHTML(back=false){
  return `<article class="page cover-page ${back?'left back-cover':'right'}" data-cover="${back?'back':'front'}">${back?'<h2>See you in Feltworld.</h2><p>Every little kindness leaves a little light.</p>':`<h1>${escape(SITE.name)}</h1><p class="cover-subtitle">A world of felt.<br>A world of feeling.</p>`}<div class="cover-image"><img src="assets/scenes-v5/village-lit.png" alt="A snowy village of real porcelain teacup and teapot homes" draggable="false">${castHTML()}</div>${back?'<a class="back-to-game" href="index.html">Back to the game →</a>':'<p class="cover-caption">Little friends. A world worth caring for.</p>'}<button class="corner ${back?'prev':'next'}" data-turn="${back?-1:1}" aria-label="${back?'Open the back cover':'Open the book'}">${back?'‹':'›'}</button></article>`;
}
function sheetHTML(n){
  if(n===0)return mobile.matches?coverHTML():`<article class="page left blank" aria-hidden="true"></article>${coverHTML()}`;
  if(n===LAST)return mobile.matches?coverHTML(true):`${coverHTML(true)}<article class="page right blank" aria-hidden="true"></article>`;
  return mobile.matches?pageHTML(n,'right'):pageHTML(n,'left')+pageHTML(n+1,'right');
}
function hasLandscape(){return cursor>0&&cursor<LAST&&(PAGES[cursor-1].kind==='scene'||(!mobile.matches&&PAGES[cursor]?.kind==='scene'));}
function render(){
  book.classList.toggle('closed-front',cursor===0);book.classList.toggle('closed-back',cursor===LAST);
  spread.innerHTML=sheetHTML(cursor);book.dataset.page=cursor;
  $('#page-status').textContent=cursor===0?'Front cover':cursor===LAST?'Back cover':mobile.matches?`Page ${cursor} of ${PAGES.length}`:`Pages ${cursor}–${Math.min(cursor+1,PAGES.length)} of ${PAGES.length}`;
  $('#previous').disabled=cursor===0||turning;$('#next').disabled=cursor===LAST||turning;
  $('#reading-hint').textContent=cursor===0?'Open the cover. Tap the corners, swipe, or use the arrow keys.':cursor===LAST?'Close this little book, or wander back through its pages.':'Tap a picture to look closer. Turn a corner, swipe, or use the arrow keys.';
  $('#play-hint').textContent=hasLandscape()?'Drag a friend, or select one and tap where it should go. Tap that friend again to stop placing it.':'The cut-outs come out on the landscape pages. Try “The river” in Contents.';
  $('#wander-toggle').disabled=!hasLandscape();layer.hidden=!hasLandscape();renderPieces();
  for(let n=cursor;n<=cursor+3&&n<=PAGES.length;n++)if(n>0){const preload=new Image();preload.src=PAGES[n-1].src;}
  updateSiteNotices();
}
function rememberPage(){history.replaceState(null,'',cursor===0?'#cover':cursor===LAST?'#back-cover':`#page-${cursor}`);}
function stopAuto(){clearTimeout(autoTimer);autoTimer=null;$('#auto-button').setAttribute('aria-pressed','false');$('#auto-button').textContent='Auto turn';}
function scheduleAuto(){clearTimeout(autoTimer);if($('#auto-button').getAttribute('aria-pressed')!=='true'||document.hidden||turning||$('dialog[open]'))return;if(cursor===LAST){stopAuto();return;}autoTimer=setTimeout(()=>turn(1,true),9000);}
function cloneFace(markup,back=false){const face=document.createElement('div');face.className=`leaf-face ${back?'back':'front'}`;face.innerHTML=markup;face.inert=true;face.setAttribute('aria-hidden','true');return face;}
async function go(n,{automatic=false,animate=true}={}){
  if(turning)return;
  n=normalize(n);if(n===cursor)return;
  if(!automatic)stopAuto();
  const restoreFocus=spread.contains(document.activeElement);
  selected=null;const previous=cursor,direction=n>cursor?1:-1;
  turning=true;book.classList.add('turning');$('#previous').disabled=$('#next').disabled=true;
  if(sounds.enabled&&!automatic){try{await sounds.start();sounds.effect('page');}catch{sounds.enabled=false;updateSoundButton();}}
  const duration=gentle()?0:720;
  if(animate&&duration){
    const leaf=document.createElement('div');leaf.className=`turn-leaf ${direction>0?'forward':'backward'}`;
    if(mobile.matches){spread.innerHTML=sheetHTML(n);leaf.append(cloneFace(sheetHTML(previous)),cloneFace('<article class="page"></article>',true));}
    else if(previous===0||previous===LAST||n===0||n===LAST){
      spread.innerHTML=sheetHTML(n);
      leaf.append(cloneFace(previous===0?coverHTML():previous===LAST?coverHTML(true):pageHTML(direction>0?previous+1:previous,direction>0?'right':'left')),cloneFace(n===0?coverHTML():n===LAST?coverHTML(true):pageHTML(direction>0?n:n+1,direction>0?'left':'right'),true));
      book.classList.remove('closed-front','closed-back');
    }else{
      spread.innerHTML=direction>0?pageHTML(previous,'left')+pageHTML(n+1,'right'):pageHTML(n,'left')+pageHTML(previous+1,'right');
      leaf.append(cloneFace(pageHTML(direction>0?previous+1:previous,direction>0?'right':'left')),cloneFace(pageHTML(direction>0?n:n+1,direction>0?'left':'right'),true));
    }
    book.append(leaf);
    try{await leaf.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${direction>0?-180:180}deg)`}],{duration,easing:'cubic-bezier(.35,.04,.25,1)',fill:'forwards'}).finished;}catch{}
    leaf.remove();
  }
  cursor=normalize(n);turning=false;book.classList.remove('turning');render();if(restoreFocus)book.focus({preventScroll:true});rememberPage();scheduleAuto();
}
function turn(direction,automatic=false){const step=mobile.matches?1:2;const n=direction>0?(cursor===0?1:cursor+step):(cursor===LAST?(mobile.matches?PAGES.length:PAGES.length-1):cursor===1?0:cursor-step);return go(n,{automatic});}
$('#previous').addEventListener('click',()=>turn(-1));$('#next').addEventListener('click',()=>turn(1));
book.addEventListener('click',e=>{
  if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();return;}
  if(turning){e.preventDefault();return;}
  if(selected&&hasLandscape()&&!e.target.closest('.piece,.corner')){const r=book.getBoundingClientRect();movePiece(selected,(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100/(mobile.matches ? .9 : 1));e.preventDefault();e.stopImmediatePropagation();return;}
  const corner=e.target.closest('[data-turn]');if(corner){turn(Number(corner.dataset.turn));return;}
  const art=e.target.closest('[data-art]');if(art)showArt(Number(art.dataset.art));
},true);
book.addEventListener('keydown',e=>{
  if(e.target.closest('.piece')||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key==='ArrowRight'){e.preventDefault();turn(1);}else if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}else if(e.key==='Home'){e.preventDefault();go(0);}else if(e.key==='End'){e.preventDefault();go(LAST);}else if(e.key==='Escape'){selected=null;renderPieces();}
});
book.addEventListener('pointerdown',e=>{if(e.target.closest('.piece,.corner')||e.pointerType==='mouse')return;swipe={x:e.clientX,y:e.clientY,id:e.pointerId};});
book.addEventListener('pointerup',e=>{if(!swipe||swipe.id!==e.pointerId)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4){suppressClick=true;turn(dx<0?1:-1);setTimeout(()=>suppressClick=false,400);}});
book.addEventListener('pointercancel',()=>swipe=null);
mobile.addEventListener('change',()=>{if(turning)return;cursor=normalize(cursor);render();rememberPage();});
motion.addEventListener('change',()=>{if(motion.matches){$('#gentle-turns').checked=true;setWander(false);}});
$('#gentle-turns').addEventListener('change',()=>{if(gentle())setWander(false);});
$('#auto-button').addEventListener('click',()=>{if($('#auto-button').getAttribute('aria-pressed')==='true')stopAuto();else{$('#auto-button').setAttribute('aria-pressed','true');$('#auto-button').textContent='Pause auto turn';scheduleAuto();}});
function updateSoundButton(){$('#sound-toggle').setAttribute('aria-pressed',sounds.enabled);$('#sound-toggle').textContent=sounds.enabled?'Page sounds on':'Page sounds off';}
$('#sound-toggle').addEventListener('click',async()=>{sounds.enabled=!sounds.enabled;try{if(sounds.enabled)await sounds.start();else{sounds.playing=false;await sounds.context?.suspend();}}catch{sounds.enabled=false;}updateSoundButton();});

function showArt(n){const p=PAGES[n-1];if(!p)return;stopAuto();$('#art-title').textContent=p.title;$('#art-chapter').textContent=p.chapter;$('#large-art').src=p.src;$('#large-art').alt=p.title;$('#art-caption').textContent=p.caption;$('#original-art').href=$('#save-art').href=p.src;$('#save-art').download=p.src.split('/').pop();$('#art-dialog').showModal();}
function contents(){
  $('#contents-grid').innerHTML=`<button class="contents-card" data-jump="0"><img src="assets/scenes-v5/village-lit.png" alt="" loading="lazy"><small>Front cover</small><strong>Feltworld</strong></button>`+PAGES.map((p,i)=>`<button class="contents-card" data-jump="${i+1}"><img src="${p.src}" alt="" loading="lazy"><small>${i+1} · ${escape(p.chapter)}</small><strong>${escape(p.title)}</strong></button>`).join('')+`<button class="contents-card" data-jump="${LAST}"><img src="assets/scenes-v4/sunflower-bloom.png" alt="" loading="lazy"><small>Back cover</small><strong>See you in Feltworld</strong></button>`;
  const chapters=new Map();PAGES.forEach((p,i)=>{if(!chapters.has(p.chapter))chapters.set(p.chapter,i+1);});
  $('#chapter-links').innerHTML=Array.from(chapters,([name,n])=>`<button data-jump="${n}">${escape(name)}</button>`).join('');
}
contents();$('#contents-button').addEventListener('click',()=>{stopAuto();$('#contents-dialog').showModal();});
$('#contents-dialog').addEventListener('click',e=>{const button=e.target.closest('[data-jump]');if(button){$('#contents-dialog').close();go(Number(button.dataset.jump),{animate:false});}});
for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}

function renderPieces(){
  layer.innerHTML='';
  for(const p of pieces.values()){
    const tray=$(`[data-piece-toggle="${p.id}"]`);tray?.setAttribute('aria-pressed',p.visible);
    if(!p.visible)continue;
    const button=document.createElement('button');button.className='piece';button.dataset.piece=p.id;button.setAttribute('aria-label',`${p.name}, movable cut-out. Arrow keys move, Home resets.`);button.setAttribute('aria-pressed',p.id===selected);
    button.style.cssText=`--size:${p.size}%;left:${p.x}%;top:${mobile.matches?p.y*.9:p.y}%;--delay:${CUTOUTS.findIndex(c=>c.id===p.id)*.17}s`;
    button.innerHTML=`<span class="sprite ${p.id}" data-fringe="${fringe}" aria-hidden="true"></span>`;
    button.addEventListener('pointerdown',e=>startDrag(e,p.id));
    button.addEventListener('click',e=>{e.stopPropagation();if(button.dataset.dragged==='true'){button.dataset.dragged='false';return;}stopAuto();selected=selected===p.id?null:p.id;for(const b of layer.querySelectorAll('.piece'))b.setAttribute('aria-pressed',b.dataset.piece===selected);});
    button.addEventListener('keydown',e=>{const shifts={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(shifts[e.key]){e.preventDefault();e.stopPropagation();stopAuto();const d=e.shiftKey?7:2;movePiece(p.id,p.x+shifts[e.key][0]*d,p.y+shifts[e.key][1]*d);}else if(e.key==='Home'){e.preventDefault();e.stopPropagation();const original=CUTOUTS.find(c=>c.id===p.id);movePiece(p.id,original.x,original.y);}else if(e.key==='Escape'){e.stopPropagation();selected=null;button.setAttribute('aria-pressed','false');}});
    layer.append(button);
  }
}
function movePiece(id,x,y){const p=pieces.get(id);p.x=Math.max(7,Math.min(93,x));p.y=Math.max(29,Math.min(88,y));const el=$(`[data-piece="${id}"]`);if(el){el.style.left=`${p.x}%`;el.style.top=`${mobile.matches?p.y*.9:p.y}%`;}}
function startDrag(e,id){
  if(e.button!==0)return;e.preventDefault();e.stopPropagation();stopAuto();
  const el=e.currentTarget,r=book.getBoundingClientRect(),p=pieces.get(id),actual=el.getBoundingClientRect();
  p.x=(actual.left+actual.width/2-r.left)/r.width*100;p.y=(actual.top+actual.height-r.top)/r.height*100/(mobile.matches ? .9 : 1);
  const start={x:e.clientX,y:e.clientY,px:p.x,py:p.y};
  el.setPointerCapture(e.pointerId);el.classList.add('dragging');movePiece(id,p.x,p.y);let dragged=false;
  const move=event=>{if(Math.hypot(event.clientX-start.x,event.clientY-start.y)>4)dragged=true;movePiece(id,start.px+(event.clientX-start.x)/r.width*100,start.py+(event.clientY-start.y)/r.height*100/(mobile.matches ? .9 : 1));};
  const end=()=>{el.classList.remove('dragging');el.dataset.dragged=String(dragged);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end);el.removeEventListener('pointercancel',end);};
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
}
$('#piece-tray').innerHTML=CUTOUTS.map(p=>`<button data-piece-toggle="${p.id}" aria-pressed="${p.family==='friend'}"><span class="tray-sprite sprite ${p.id}" data-fringe="silver" aria-hidden="true"></span>${p.name}</button>`).join('');
$('#piece-tray').addEventListener('click',e=>{const b=e.target.closest('[data-piece-toggle]');if(!b)return;stopAuto();const p=pieces.get(b.dataset.pieceToggle);p.visible=!p.visible;if(!p.visible&&selected===p.id)selected=null;renderPieces();});
$('#reset-pieces').addEventListener('click',()=>{stopAuto();setWander(false);selected=null;for(const original of CUTOUTS)Object.assign(pieces.get(original.id),original,{visible:original.family==='friend'});renderPieces();});
$('#fringe-colour').addEventListener('change',e=>{fringe=e.target.value;for(const s of document.querySelectorAll('.sprite.gnome'))s.dataset.fringe=fringe;});
function setWander(v){wandering=v&&!gentle();layer.classList.toggle('wandering',wandering);$('#wander-toggle').setAttribute('aria-pressed',wandering);$('#wander-toggle').textContent=wandering?'Keep them still':'Let them wander';clearInterval(wanderTimer);wanderTimer=null;if(wandering)wanderTimer=setInterval(()=>{if(document.hidden||turning||!hasLandscape()||$('dialog[open]'))return;for(const p of pieces.values())if(p.visible&&p.id!==selected&&!$(`[data-piece="${p.id}"]`)?.classList.contains('dragging'))movePiece(p.id,p.x+(Math.random()-.5)*10,p.y+(Math.random()-.5)*3);},3200);}
$('#wander-toggle').addEventListener('click',()=>{stopAuto();setWander(!wandering);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(autoTimer);sounds.context?.suspend();}else scheduleAuto();});
window.addEventListener('hashchange',()=>{const n=location.hash==='#back-cover'?LAST:Number(location.hash.match(/^#page-(\d+)$/)?.[1]||0);go(n,{animate:false});});
window.addEventListener('pagehide',e=>{clearInterval(wanderTimer);clearTimeout(autoTimer);if(e.persisted)sounds.context?.suspend();else sounds.destroy();});
window.addEventListener('pageshow',e=>{if(e.persisted){setWander(wandering);scheduleAuto();updateSiteNotices();}});
cursor=normalize(location.hash==='#back-cover'?LAST:Number(location.hash.match(/^#page-(\d+)$/)?.[1]||0));render();

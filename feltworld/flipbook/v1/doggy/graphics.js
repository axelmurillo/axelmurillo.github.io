import {foldSpec,foldPoint,paperMesh,foldNormal} from './paper-shape.js?v=c9af725c2db9';
import * as THREE from './vendor/three.module.js';
const fallback=window.FeltPaperTurn,book=document.querySelector('#book'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let renderer,contextLost=false;
try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;});renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;});}catch{document.documentElement.dataset.pageRenderer='css-fallback';}
const printedPages=new Map();
const printKey=(page,w,h)=>w+'|'+h+'|'+((page.classList.contains('closing-flyleaf')||page.classList.contains('opening-flyleaf'))?'opaque-flyleaf|':'')+page.innerHTML;
async function prepare({host,front,back}) {
 const pages=[front,back];
 await Promise.all(pages.flatMap(page=>[...page.querySelectorAll('img')].map(img=>img.decode())));
 const w=host.clientWidth/2,h=host.clientHeight;
 // Capture a completed bitmap rather than drawing a freshly cloned HTML image.
 const artwork=await Promise.all(pages.map(async page=>{
  const img=page.querySelector('img');
  return typeof createImageBitmap==='function'?await createImageBitmap(img):img;
 }));
 const measure=document.createElement('div');measure.style.cssText='position:absolute;inset:0;visibility:hidden;pointer-events:none';
 measure.append(...pages);host.append(measure);const transform=host.style.transform;
 try{host.style.transform='none';pages.forEach((page,i)=>{
  page.style.width=w+'px';page.style.height=h+'px';
  const canvas=rasterPage(page,w,h,artwork[i]);
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
  printedPages.set(printKey(page,w,h),pixels);
  while(printedPages.size>8)printedPages.delete(printedPages.keys().next().value);
 });document.documentElement.dataset.pageSnapshot='canvas-print';}
 finally{host.style.transform=transform;measure.remove();artwork.forEach(img=>img.close?.());}
}
function creasePrint(w){
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*4);canvas.height=4;
 const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,canvas.width,0);
 for(const [stop,color] of [[0,'#00000000'],[.486,'#00000000'],[.495,'#1b110a20'],[.4994,'#1b110a48'],[.5004,'#ffffff22'],[.5045,'#1b110a24'],[.514,'#00000000'],[1,'#00000000']])gradient.addColorStop(stop,color);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,canvas.width,4);
 return canvas;
}
function texture(page,w,h){
 let pixels=printedPages.get(printKey(page,w,h));
 if(!pixels){const canvas=rasterPage(page,w,h);pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);}
 // Upload explicit RGBA bytes rather than another GPU-backed canvas surface.
 const palette=new Set();for(let n=0;n<pixels.data.length;n+=Math.max(4,Math.floor(pixels.data.length/4096/4)*4))if(pixels.data[n+3]>10)palette.add([pixels.data[n]>>4,pixels.data[n+1]>>4,pixels.data[n+2]>>4].join(','));document.documentElement.dataset.printColors=palette.size;if(!palette.size)throw Error('Printed illustration has no decoded pixels');
 const tex=new THREE.DataTexture(pixels.data,pixels.width,pixels.height,THREE.RGBAFormat);
 tex.flipY=true;tex.needsUpdate=true;tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearFilter;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}
export function rasterPage(page,w,h,bitmap){
 document.documentElement.dataset.printedSnapshot='canvas-print';
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*2);canvas.height=Math.round(h*2);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.scale(2,2);if((page.classList.contains('closing-flyleaf')||page.classList.contains('opening-flyleaf'))){ctx.fillStyle=getComputedStyle(page).backgroundColor;ctx.fillRect(0,0,w,h);}const img=page.querySelector('img');if(!img?.complete||!img.naturalWidth)throw Error('Illustration is still loading');const art=bitmap??window.decodedArt?.(img.getAttribute('src'))??img;if(img.classList.contains('tree-fill-image')){const sh=img.naturalHeight,sw=sh*1.5,sx=(img.naturalWidth-sw)/2+(img.classList.contains('right')?sw/2:0);ctx.drawImage(art,sx,0,sw/2,sh,0,0,w,h);}else if(getComputedStyle(img).objectFit==='contain'){const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;ctx.fillStyle='#17191c';ctx.fillRect(0,0,w,h);ctx.drawImage(art,(w-iw)/2,(h-ih)/2,iw,ih);}else ctx.drawImage(art,0,0,w,h);
 // reader.css shades both paper edges. Preserve that existing DOM shading in
 // the print snapshot too, or the moving gutter brightens at the handoff.
 const edges=ctx.createLinearGradient(0,0,w,0);for(const [stop,color] of [[0,'#20160b16'],[.03,'#20160b00'],[.97,'#20160b00'],[1,'#20160b16']])edges.addColorStop(stop,color);ctx.fillStyle=edges;ctx.fillRect(0,0,w,h);
 // Read the already-laid-out DOM caption, including its private edits. The canonical text remains in the DOM.
 const pageRect=page.getBoundingClientRect();for(const line of page.querySelectorAll('.tape-line')){const style=getComputedStyle(line),saved=line.style.transform;line.style.transform='none';const rect=line.getBoundingClientRect();line.style.transform=saved;const angle=parseFloat(style.getPropertyValue('--tilt'))*Math.PI/180||0,scale=rect.width/line.offsetWidth||1;ctx.save();ctx.translate(rect.left-pageRect.left+rect.width/2,rect.top-pageRect.top+rect.height/2);ctx.translate((parseFloat(style.getPropertyValue('--shift'))||0)*scale,0);ctx.rotate(angle);ctx.scale(scale,scale);const lw=line.offsetWidth,lh=line.offsetHeight;ctx.translate(-lw/2,-lh/2);ctx.beginPath();const poly=line.style.getPropertyValue('--tear').slice(8,-1).split(/,(?![^()]*\))/);function coord(v,total){v=v.trim();if(v.startsWith('calc'))return total-parseFloat(v.split('-')[1]);return v.endsWith('%')?parseFloat(v)*total/100:parseFloat(v);}poly.forEach((point,j)=>{const match=point.trim().match(/^(calc\([^)]*\)|[^ ]+)\s+(.+)$/);if(!match)return;const x=coord(match[1],lw),y=coord(match[2],lh);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.globalAlpha=parseFloat(getComputedStyle(line.closest('.story-copy')).getPropertyValue('--tape-opacity'))||.78;ctx.fillStyle=style.getPropertyValue('--paper')||'#eadbb7';ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=style.color;ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(line.textContent,lw/2,lh/2);ctx.restore();}
 return canvas;}
function create(options){if(!renderer||contextLost||reduced.matches)return fallback.create(options);let frontTex,backTex,layer,turnScene;
try{const {host,direction,front,back,underlay,stationary}=options;const rect={width:host.clientWidth,height:host.clientHeight},w=rect.width/2,h=rect.height;
 // Measure caption clones in the actual book container so text wrapping and container units agree.
 const measure=document.createElement('div');measure.style.cssText=`position:absolute;inset:0;visibility:hidden;pointer-events:none`;front.style.width=back.style.width=w+'px';front.style.height=back.style.height=h+'px';measure.append(front,back);host.append(measure);const frozenTransform=host.style.transform;try{host.style.transform="none";frontTex=texture(front,w,h);const frontColors=document.documentElement.dataset.printColors;backTex=texture(back,w,h);document.documentElement.dataset.printColors=frontColors+','+document.documentElement.dataset.printColors;}finally{host.style.transform=frozenTransform;measure.remove();}
 layer=document.createElement('div');layer.className='paper-turn';layer.setAttribute('aria-hidden','true');underlay.classList.add('paper-underlay');stationary.className='stationary';stationary.style[direction===1?'left':'right']='0';const startPage=front.cloneNode(true);startPage.classList.add("turn-start-page");startPage.style.width="50%";startPage.style[direction===1?"right":"left"]="0";layer.append(underlay,stationary,startPage);const innerCrease=document.createElement('div');innerCrease.className='turn-crease';innerCrease.setAttribute('aria-hidden','true');layer.append(innerCrease);host.append(layer);
 const turnPad=Math.ceil(Math.max(180,h*.55));renderer.setSize(rect.width+turnPad*2,h+turnPad*2);renderer.domElement.className='three-leaf';renderer.domElement.style.left=renderer.domElement.style.top=-turnPad+'px';layer.append(renderer.domElement);
 const scene=turnScene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-(rect.width+turnPad*2)/2,(rect.width+turnPad*2)/2,(h+turnPad*2)/2,-(h+turnPad*2)/2,1,5000);camera.position.z=2000;camera.lookAt(0,0,0);
 scene.add(new THREE.AmbientLight(0xffffff,1.7));
 const shadowLights=[-1,1].map(side=>{const source=new THREE.DirectionalLight(0xffedcf,1);source.position.set(side*w*.65,h*.22,Math.max(420,w*1.25));source.castShadow=true;source.shadow.mapSize.set(1024,1024);Object.assign(source.shadow.camera,{left:-w*1.7,right:w*1.7,top:h,bottom:-h,near:1,far:3000});source.shadow.bias=-.00005;source.shadow.normalBias=.05;scene.add(source);return source;});const [light,fill]=shadowLights;
 const receiverGeometry=new THREE.PlaneGeometry(w*2,h);const receiverMaterial=new THREE.ShadowMaterial({opacity:.48});const receiver=new THREE.Mesh(receiverGeometry,receiverMaterial);receiver.position.z=-.25;receiver.receiveShadow=true;scene.add(receiver);
 // The spine belongs to the stationary pages, inside the depth-tested scene.
 const spineCanvas=creasePrint(w);
 const spineTexture=new THREE.CanvasTexture(spineCanvas);spineTexture.colorSpace=THREE.SRGBColorSpace;const spineGeometry=new THREE.PlaneGeometry(w*2,h),spineMaterial=new THREE.MeshBasicMaterial({map:spineTexture,transparent:true,depthWrite:false,depthTest:true,toneMapped:false});const spine=new THREE.Mesh(spineGeometry,spineMaterial);spine.position.z=-.6;scene.add(spine);host.classList.add('physical-crease');
 const geometry=new THREE.BufferGeometry(),reverse=new THREE.BufferGeometry();
 const mat=new THREE.MeshBasicMaterial({map:frontTex,side:THREE.FrontSide,toneMapped:false,vertexColors:true}),backMat=new THREE.MeshBasicMaterial({map:backTex,side:THREE.BackSide,toneMapped:false,vertexColors:true});
 const face=new THREE.Mesh(geometry,mat),rear=new THREE.Mesh(reverse,backMat);mat.shadowSide=backMat.shadowSide=THREE.DoubleSide;face.castShadow=rear.castShadow=true;scene.add(face,rear);
 // A bound-edge alpha layer shares the page mesh and depth test. Unlike a
 // screen overlay it folds with the material and cannot show through the page.
 function pageCrease(side){const tex=new THREE.CanvasTexture(creasePrint(w));tex.colorSpace=THREE.SRGBColorSpace;tex.repeat.x=.5;tex.offset.x=side==='left'?0:.5;return tex;}
 const frontCreaseTexture=pageCrease(direction===1?'right':'left'),backCreaseTexture=pageCrease(direction===1?'left':'right');
 const creaseMaterial=map=>new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const frontCreaseMaterial=creaseMaterial(frontCreaseTexture),backCreaseMaterial=creaseMaterial(backCreaseTexture);
 const frontCrease=new THREE.Mesh(geometry,frontCreaseMaterial),backCrease=new THREE.Mesh(reverse,backCreaseMaterial);frontCrease.renderOrder=backCrease.renderOrder=1;scene.add(frontCrease,backCrease);
 const rimGeometry=new THREE.BufferGeometry(),rimMaterial=new THREE.MeshBasicMaterial({color:0xe9d8b6,side:THREE.DoubleSide,toneMapped:false}),rim=new THREE.Mesh(rimGeometry,rimMaterial);scene.add(rim);
 function upload(target,name,array,size){const current=target.getAttribute(name);if(current&&current.array.length===array.length){current.array.set(array);current.needsUpdate=true;}else target.setAttribute(name,new THREE.BufferAttribute(new Float32Array(array),size));}
 const shadow=document.createElement('div');shadow.className='paper-shadow';layer.insertBefore(shadow,renderer.domElement);shadow.style.filter='blur(8px)';
 function progress(p,grab={}){if(location.search.includes('shadowQA=1')&&window.__freezeShadowProgress!=null)p=window.__freezeShadowProgress;if(contextLost)throw Error('Page graphics context lost');const curl=Math.sin(Math.PI*p);receiverMaterial.opacity=.46*Math.pow(curl,1.2);const spec=foldSpec(w,h,p,options.anchorY??.5,grab.pullY??0),vertices=paperMesh(w,h,spec);
 const positions=[],backs=[],normals=[],colors=[],frontUV=[],rearUV=[];
 for(const source of vertices){
  const q=foldPoint(source.x,source.y,spec),n=foldNormal(source.x,source.y,spec),u=direction===1?source.x/w:1-source.x/w,v=source.y/h+.5;
  positions.push(direction*q.x,q.y,q.z);backs.push(direction*(q.x-n.x*.12),q.y-n.y*.12,q.z-n.z*.12);
  normals.push(n.x,direction*n.y,direction*n.z);const shade=.86+.14*Math.abs(n.z);colors.push(shade,shade,shade);
  frontUV.push(u,v);rearUV.push(1-u,v);
 }
 for(const [target,data,uv] of [[geometry,positions,frontUV],[reverse,backs,rearUV]]){upload(target,'position',data,3);upload(target,'normal',normals,3);upload(target,'color',colors,3);upload(target,'uv',uv,2);target.computeBoundingSphere();}
 // A thin edge follows the same material map as the print, including the curl.
 const edge=[],boundary=[];for(let i=0;i<=48;i++)boundary.push({x:w*i/48,y:-h/2});for(let i=1;i<=48;i++)boundary.push({x:w,y:-h/2+h*i/48});for(let i=47;i>=0;i--)boundary.push({x:w*i/48,y:h/2});for(let i=47;i>=0;i--)boundary.push({x:0,y:-h/2+h*i/48});
 const rimPair=source=>{const q=foldPoint(source.x,source.y,spec),n=foldNormal(source.x,source.y,spec);return [[direction*q.x,q.y,q.z],[direction*(q.x-n.x*.12),q.y-n.y*.12,q.z-n.z*.12]];};
 for(let i=0;i<boundary.length-1;i++){const [a,b]=rimPair(boundary[i]),[c,d]=rimPair(boundary[i+1]);edge.push(...a,...b,...c,...b,...d,...c);}
 upload(rimGeometry,'position',edge,3);rimGeometry.computeBoundingSphere();
 mat.side=direction===1?THREE.FrontSide:THREE.BackSide;backMat.side=direction===1?THREE.BackSide:THREE.FrontSide;frontCreaseMaterial.side=mat.side;backCreaseMaterial.side=backMat.side;const ease=x=>x*x*(3-2*x);const entry=ease(Math.min(1,p/.06)),exit=ease(Math.max(0,Math.min(1,(p-.94)/.06)));renderer.domElement.style.opacity='1';startPage.style.visibility='hidden';startPage.style.opacity='0';stationary.style.opacity='1';if(location.search.includes('shadowQA=1'))window.__shadowProbe={creaseDraw:(enabled)=>{frontCrease.visible=backCrease.visible=enabled;renderer.render(scene,camera);},draw:(enabled)=>{light.castShadow=fill.castShadow=enabled;renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},progress:(at,grasp=grab)=>progress(at,grasp),direction,state:{p,anchorY:options.anchorY??.5,pullY:grab.pullY??0,spec}};renderer.render(scene,camera);shadow.style.display='none';}

 progress(0);document.documentElement.dataset.pageRenderer='three';document.documentElement.dataset.paperStudy='managed-cylinder-v2';return {layer,leaf:renderer.domElement,stationary,progress,segments:48,remove(){host.classList.remove("physical-crease");spineGeometry.dispose();spineMaterial.dispose();spineTexture.dispose();frontCreaseMaterial.dispose();backCreaseMaterial.dispose();frontCreaseTexture.dispose();backCreaseTexture.dispose();layer.remove();geometry.dispose();reverse.dispose();rimGeometry.dispose();rimMaterial.dispose();receiverGeometry.dispose();receiverMaterial.dispose();mat.dispose();backMat.dispose();frontTex.dispose();backTex.dispose();}};
}catch(error){book.classList.remove("physical-crease");layer?.remove();const disposed=new Set();turnScene?.traverse(object=>{for(const resource of [object.geometry,...(Array.isArray(object.material)?object.material:[object.material])])if(resource&&!disposed.has(resource)){disposed.add(resource);resource.dispose();}});frontTex?.dispose();backTex?.dispose();console.warn('Using accessible CSS paper fallback',error);return fallback.create(options);}}
if(renderer){window.FeltPaperTurn={supported:fallback.supported,create,prepare};document.documentElement.dataset.pageRenderer='three-ready';}
// Use the same pixels at rest and during turns. CSS and canvas gradients can
// interpolate differently, causing a visible handoff even with identical stops.
const restingCrease=book.querySelector(':scope > .crease');
function syncRestingCrease(){if(!restingCrease)return;restingCrease.style.backgroundImage=`url("${creasePrint(book.clientWidth/2).toDataURL()}")`;restingCrease.style.backgroundSize='100% 100%';restingCrease.style.backgroundRepeat='no-repeat';book.classList.add('shared-crease');}
new ResizeObserver(syncRestingCrease).observe(book);syncRestingCrease();
// Persistent Three.js book body. The DOM is the accessible printed surface; WebGL supplies its physical binding and paper below.
let bodyRenderer;
try{bodyRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});bodyRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));bodyRenderer.shadowMap.enabled=true;bodyRenderer.shadowMap.type=THREE.PCFSoftShadowMap;bodyRenderer.domElement.className='three-book-body';bodyRenderer.domElement.setAttribute('aria-hidden','true');book.prepend(bodyRenderer.domElement);document.documentElement.classList.add('three-book-ready');}catch{ /* CSS binding remains available without WebGL. */ }
// Private material preview: a single cached cloth print, shared by every resize.
// No cover print/lettering is sampled; only the exposed open binding changes.
let wornBoardTexture,wornBackBoardTexture;
function boardCloth(back=false){
 if(back&&wornBackBoardTexture)return wornBackBoardTexture;
 if(!back&&wornBoardTexture)return wornBoardTexture;
 const canvas=document.createElement('canvas'),w=768,h=512;canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(w,h),data=pixels.data;
 const noise=(x,y)=>{let n=Math.imul(x+71,374761393)^Math.imul(y+29,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const n=noise(x,y),edge=Math.min(x,y,w-1-x,h-1-y);
  const corner=Math.min(Math.hypot(x,y),Math.hypot(w-1-x,y),Math.hypot(x,h-1-y),Math.hypot(w-1-x,h-1-y));
  const weave=(x%3===0?.8:-.25)+(y%3===0?.7:-.2);
  const mottle=Math.sin(x*.027+y*.009)*1.8+Math.sin(y*.039-x*.012)*1.4;
  const grain=(n-.5)*6+weave+mottle;
  const rubbed=Math.max(0,1-edge/2.8)*(.12+n*.2);
  const corners=Math.max(0,1-corner/30)*Math.max(0,1-edge/17)*(.48+n*.33);
  const wear=Math.min(.8,rubbed+corners),i=(y*w+x)*4;
  data[i]=(48+grain)*(1-wear)+(180+grain)*wear;
  data[i+1]=(69+grain)*(1-wear)+(158+grain)*wear;
  data[i+2]=(103+grain)*(1-wear)+(119+grain)*wear;data[i+3]=255;
  // Mirrored lower binding wear; the approved front-half arithmetic is retained.
  // UV v=0 is the lower board edge, corresponding to the canvas bottom.
  if((x<w/2||back)&&y>h-18){
   const wearX=x<w/2?x:w-1-x,wearNoise=x<w/2?n:noise(wearX,y);
   const depth=h-1-y,fade=Math.min(1,(w/2-wearX)/14),
    waviness=Math.sin(wearX*.043)*.7+Math.sin(wearX*.119)*.35,
    rub=Math.exp(-Math.pow((depth-2.1-waviness)/1.45,2)),
    patch=.24+.16*Math.sin(wearX*.071)+.13*Math.sin(wearX*.183),
    amount=Math.max(0,rub*(patch+wearNoise*.21))*fade,
    crease=Math.exp(-Math.pow((depth-6.2-waviness)/1.65,2))*.29*fade,
    hinge=Math.exp(-Math.pow((wearX-w/2+17)/9,2))*Math.exp(-depth/9)*.18;
   for(let c=0;c<3;c++)data[i+c]=(data[i+c]*(1-amount)+[181,158,116][c]*amount)*(1-crease-hinge);
  }
  // Pale exposed fibres at both head and foot of the spine, on both halves.
  // Fixed noise breaks the rubbed area into worn strands without changing alpha.
  const spineDistance=Math.abs(x-w/2),bottomDepth=Math.min(y,h-1-y),wearY=y<h/2?h-1-y:y;
  if(spineDistance<60&&bottomDepth<18){
   const taper=Math.pow(1-spineDistance/60,.65),
    fringe=3+noise(x,19)*6+Math.sin(x*.63)*1.5,
    edgeWear=Math.max(0,1-bottomDepth/fringe),
    strands=noise(Math.floor(x/2),Math.floor(wearY/3)),
    worn=taper*Math.min(.97,edgeWear*(.78+strands*.24)),
    fibre=(strands>.73&&bottomDepth<fringe+3)?taper*.36:0,
    amount=Math.max(worn,fibre);
   for(let c=0;c<3;c++)data[i+c]=data[i+c]*(1-amount)+[239,229,207][c]*amount;
  }
 }
 ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=Math.min(4,bodyRenderer.capabilities.getMaxAnisotropy());
 if(back)wornBackBoardTexture=texture;else wornBoardTexture=texture;
 return texture;
}
function openWornBoard(scene,width,height,resources,back=false){
 const w=width+12,h=height+12,x=w/2,y=h/2,r=Math.max(4,Math.min(10,height*.017));
 const outline=new THREE.Shape();
 // Subpixel edge wander and unequal corner radii avoid a die-cut rectangle.
 outline.moveTo(-x+r,-y);outline.lineTo(-x*.56,-y+.35);
 outline.quadraticCurveTo(-x*.1,-y-.35,x*.3,-y+.15);outline.lineTo(x-r,-y+.15);
 outline.quadraticCurveTo(x,-y+.15,x,-y+r*.95);outline.lineTo(x-.3,y*.28);
 outline.lineTo(x,y-r*1.1);outline.quadraticCurveTo(x,y-.1,x-r*1.1,y);
 outline.lineTo(x*.48,y-.3);outline.quadraticCurveTo(-x*.12,y+.3,-x*.63,y-.15);
 outline.lineTo(-x+r*.9,y-.15);outline.quadraticCurveTo(-x,y-.15,-x,y-r*.9);
 outline.lineTo(-x+.35,-y*.25);outline.lineTo(-x,-y+r);
 outline.quadraticCurveTo(-x,-y,-x+r,-y);outline.closePath();
 const geometry=new THREE.ExtrudeGeometry(outline,{depth:4,steps:1,bevelEnabled:true,bevelThickness:.35,bevelSize:.5,bevelSegments:1,curveSegments:5});
 geometry.translate(0,0,-2);
 const positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 for(let i=0;i<positions.count;i++)uv.setXY(i,(positions.getX(i)+x)/w,(positions.getY(i)+y)/h);
 const material=new THREE.MeshStandardMaterial({map:boardCloth(back),color:0xffffff,roughness:1,metalness:0});
 resources.push(geometry,material);const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(0,-6,-16);mesh.castShadow=true;scene.add(mesh);
}
let bodyResources=[],paperTurnOpening=null;
function drawBody(view={}){if(!bodyRenderer)return;bodyResources.forEach(x=>x.dispose());bodyResources=[];const width=view.width??book.clientWidth,height=view.height??book.clientHeight,pad=48;bodyRenderer.setSize(width+pad*2,height+pad*2);const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-(width+pad*2)/2,(width+pad*2)/2,(height+pad*2)/2,-(height+pad*2)/2,1,4000);camera.position.set(0,0,2000);camera.lookAt(0,0,0);scene.add(new THREE.AmbientLight(0xf4f1e7,1.8));const light=new THREE.DirectionalLight(0xffe7c4,1.6);light.position.set(-width*.6,height*.8,1200);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-width,right:width,top:height,bottom:-height,near:1,far:3000});light.shadow.normalBias=.3;scene.add(light);
 const board=new THREE.MeshStandardMaterial({roughness:1,color:0x344559}),paper=new THREE.MeshStandardMaterial({color:0xe8dcc6,roughness:1});bodyResources.push(board,paper);
 function box(w,h,d,x,y,z,material){const geometry=new THREE.BoxGeometry(w,h,d);bodyResources.push(geometry);const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
 const lining=view.lining??(view.opening?'front':null)??paperTurnOpening??(book.classList.contains('opening-proof')?'front':book.classList.contains('closing-proof')?'back':null);
 const cover=view.cover??book.classList.contains('cover-mode');
 if(cover)box(width+12,height+12,4,0,-6,-16,board);else openWornBoard(scene,width,height,bodyResources,lining==='back');

 if(cover){box(width-4,height-4,6,2,-3,-7,paper);}else{for(const side of (lining==='front'?[1]:lining==='back'?[-1]:[-1,1]))for(let j=0;j<3;j++)box(width/2-2,height-2,1.5,side*width/4,-j*1.6,-j*2-2,paper);}
 const floorGeometry=new THREE.PlaneGeometry(width+pad*2,height+pad*2),floorMaterial=new THREE.ShadowMaterial({opacity:.12});bodyResources.push(floorGeometry,floorMaterial);const floor=new THREE.Mesh(floorGeometry,floorMaterial);floor.position.z=-25;floor.receiveShadow=true;scene.add(floor);bodyRenderer.render(scene,camera);}
// Split one rendered support at the hinge. The left board travels with its reverse;
// the right support stays beneath the flyleaf. Both match the resting body pixels.
window.FeltOpeningBacking={paperTurn(opening){if(paperTurnOpening===opening)return;paperTurnOpening=opening;drawBody();},attach(sheet,inner,width,height,front=true){
 if(!bodyRenderer)return null;
 drawBody({width,height,cover:false,lining:front?'front':'back'});
 const canvas=bodyRenderer.domElement,pad=48,ratio=canvas.width/(width+pad*2);
 const moving=document.createElement('canvas');moving.className='opening-board-support';
 moving.width=Math.round((width/2+pad)*ratio);moving.height=canvas.height;
 const sourceX=front?0:Math.round((width/2+pad)*ratio);
 moving.getContext('2d').drawImage(canvas,sourceX,0,moving.width,moving.height,0,0,moving.width,moving.height);
 Object.assign(moving.style,{left:(front?-pad:0)+'px',top:-pad+'px',width:(width/2+pad)+'px',height:(height+pad*2)+'px'});
 inner.classList.add('opening-board-reverse');inner.prepend(moving);
 canvas.style.clipPath=front?'inset(0 0 0 50%)':'inset(0 50% 0 0)';sheet.prepend(canvas);
 let restored=false;
 return ()=>{if(restored)return;restored=true;book.prepend(canvas);canvas.style.clipPath='';moving.remove();};
}};
new ResizeObserver(drawBody).observe(book);new MutationObserver(drawBody).observe(document.querySelector('#position'),{childList:true,subtree:true,characterData:true});drawBody();

// Warm the two neighbouring leaves so a drag uses the same print texture as button navigation.
window.addEventListener('felt-scene',event=>{const i=event.detail.index;if(i===0||i===event.detail.count-1)return;requestAnimationFrame(()=>{for(const direction of [-1,1]){const target=i+direction;if(target<=0||target>=event.detail.count-1)continue;prepare({host:book,front:window.page(i,direction===1?'right':'left'),back:window.page(target,direction===1?'left':'right')}).catch(()=>{});}});});


import {foldSpec,foldPoint,paperMesh,foldNormal} from './paper-shape.js?v=c9af725c2db9';
import * as THREE from './vendor/three.module.js';
const fallback=window.FeltPaperTurn,book=document.querySelector('#book'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let renderer,contextLost=false;
try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;});renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;});}catch{document.documentElement.dataset.pageRenderer='css-fallback';}
// A transparent endpaper scan describes a physical leaf, not holes over another print.
const physicalMasks=new Map(),maskTextures=new WeakMap();
function pageArt(page){const image=page.querySelector('img');return window.decodedArt?.(image.getAttribute('src'))||image;}
function sharedPhysicalLeaf(front,back){
 const a=endpaperPrint(front),b=endpaperPrint(back);if(!a&&!b)return false;
 front.classList.add('structural-print-face');back.classList.add('structural-print-face');
 if(a!==b){
  const native=a?front:back,other=a?back:front,img=native.querySelector('img'),key=img.getAttribute('src')+'|reverse-alpha';let mask=physicalMasks.get(key);
  if(!mask){
   const art=pageArt(native),w=art.naturalWidth||art.width,h=art.naturalHeight||art.height;if(!w||!h)throw Error('Physical leaf alpha is not decoded');
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.translate(w,0);ctx.scale(-1,1);ctx.drawImage(art,0,0,w,h);
   ctx.globalCompositeOperation='source-in';ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
   mask={canvas,url:canvas.toDataURL('image/png'),key};physicalMasks.set(key,mask);while(physicalMasks.size>4){const oldest=physicalMasks.keys().next().value;maskTextures.get(physicalMasks.get(oldest).canvas)?.dispose();physicalMasks.delete(oldest);}
  }
  other.__physicalClipCanvas=mask.canvas;other.dataset.physicalClipKey=mask.key;
  Object.assign(other.style,{maskImage:`url("${mask.url}")`,maskSize:'100% 100%',maskPosition:'center',maskRepeat:'no-repeat'});
 }
 return true;
}
function structuralReceiverMask(underlay,stationary,front,back,direction,w,h){
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*2));canvas.height=Math.max(1,Math.round(h));const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const target=[...underlay.querySelectorAll('.page')][direction===1?1:0];
 ctx.drawImage(pageArt(endpaperPrint(front)?front:target),direction===1?w:0,0,w,h);
 ctx.drawImage(pageArt(endpaperPrint(back)?back:stationary),direction===1?0:w,0,w,h);
 ctx.globalCompositeOperation='source-in';ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.NoColorSpace;tex.generateMipmaps=false;tex.minFilter=tex.magFilter=THREE.LinearFilter;return tex;
}
function clipReceiver(material,mask,w,h){
 material.onBeforeCompile=shader=>{
  shader.uniforms.structuralMask={value:mask};shader.uniforms.structuralSize={value:new THREE.Vector2(w*2,h)};
  shader.vertexShader='uniform vec2 structuralSize;varying vec2 structuralUV;\n'+shader.vertexShader.replace('void main() {','void main() { structuralUV=position.xy/structuralSize+.5;');
  shader.fragmentShader='uniform sampler2D structuralMask;varying vec2 structuralUV;\n'+shader.fragmentShader.replace('#include <tonemapping_fragment>','gl_FragColor.a *= texture2D(structuralMask,structuralUV).a;\n#include <tonemapping_fragment>');
 };material.customProgramCacheKey=()=> 'structural-leaf-receiver-v1';
}
function alphaTexture(canvas){
 let texture=maskTextures.get(canvas);if(texture)return texture;
 texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.NoColorSpace;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=THREE.LinearFilter;maskTextures.set(canvas,texture);return texture;
}
function nativeAlpha(material,texture){
 material.alphaMap=texture;
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>','#ifdef USE_ALPHAMAP\n diffuseColor.a *= texture2D(alphaMap,vAlphaMapUv).a;\n#endif');};
 material.customProgramCacheKey=()=> 'native-sheet-alpha-v2';
}
// Bridge only the beginning/end of a structural turn to ordinary story paper.
// The native cut edge changes geometrically; printed RGB never stretches or fades.
function handoffAmount(options,p){
 const t=Math.max(0,Math.min(1,options.physicalExit?(p-.9)/.1:options.physicalEntry?p/.1:0)),q=t*t*(3-2*t);
 return options.physicalEntry?1-q:q;
}
function physicalHandoffBridge(options,layer){
 if(!options.physicalExit&&!options.physicalEntry)return {progress(){},remove(){}};
 const {host,underlay,stationary,direction,back}=options,pages=[...underlay.querySelectorAll('.page')],revealed=pages[direction===1?1:0],covered=pages[direction===1?0:1];
 if(options.physicalExit){covered.style.maskImage=back.style.maskImage;covered.style.maskRepeat='no-repeat';}
 const support=options.physicalExit?[revealed,covered]:[stationary];
 const masked=[...support,...layer.querySelectorAll('.paper-strip [data-physical-clip-key]')];
 // The body is already painted at the correct open dimensions. Keep its layer
 // mounted for the whole turn; progress changes only a compositor clip value.
 host.style.setProperty('--binding-bridge-inset',((1-handoffAmount(options,0))*50)+'%');host.classList.add('endpaper-story-bridge');drawBody(true);
 return {progress(p){const q=handoffAmount(options,p);
  for(const page of masked){page.style.maskSize=`${100+q*18}% ${100+q*18}%`;page.style.maskPosition='center';}
  if(options.physicalExit)covered.style.visibility=q>0?'visible':'hidden';
  host.style.setProperty('--binding-bridge-inset',((1-q)*50)+'%');
 },remove(){host.classList.remove('endpaper-story-bridge');host.style.removeProperty('--binding-bridge-inset');drawBody();}};
}
function fallbackTurn(options){const paper=fallback.create(options),bridge=physicalHandoffBridge(options,paper.layer);return {...paper,progress(p,...args){bridge.progress(p);paper.progress(p,...args)},remove(){bridge.remove();paper.remove()}};}
const printedPages=new Map(),pendingPrints=new Map(),printedTextures=new Map();
const printKey=(page,w,h)=>w+'|'+h+'|'+page.innerHTML;
const busy=()=>!!window.FeltTurnState?.busy||book.classList.contains('turning');
let warmEpoch=0;
async function prepare({host,front,back,warm=false}) {
 const epoch=warmEpoch,w=host.clientWidth/2,h=host.clientHeight,pages=[front,back];
 if(warm&&busy())return;
 const keys=pages.map(page=>printKey(page,w,h));
 if(keys.every(key=>printedPages.has(key))){if(!warm)drawBody(true);return;}
 const jobKey=(warm?'warm|':'foreground|')+keys.join('||');if(pendingPrints.has(jobKey))return pendingPrints.get(jobKey);
 const work=(async()=>{
  await Promise.all(pages.flatMap(page=>[...page.querySelectorAll('img')].map(img=>img.decode())));
  if(warm&&(busy()||epoch!==warmEpoch))return;
  sharedPhysicalLeaf(front,back);
  const missing=pages.map((page,i)=>({page,key:keys[i]})).filter(item=>!printedPages.has(item.key));
  const artwork=await Promise.all(missing.map(async({page})=>{const img=page.querySelector('img');return typeof createImageBitmap==='function'?await createImageBitmap(img):img;}));
  if(warm&&(busy()||epoch!==warmEpoch)){artwork.forEach(img=>img.close?.());return;}
  // Measure a private offscreen book, never reset the visible host transform.
  const measure=document.createElement('div');measure.className='book';measure.setAttribute('aria-hidden','true');
  measure.style.cssText=`position:fixed;left:-100000px;top:0;width:${w*2}px;height:${h}px;max-width:none;aspect-ratio:auto;visibility:hidden;pointer-events:none;transform:none;contain:layout paint`;
  missing.forEach(({page})=>{page.style.width=w+'px';page.style.height=h+'px';measure.append(page)});document.body.append(measure);
  try{missing.forEach(({page,key},i)=>{const canvas=rasterPage(page,w,h,artwork[i],false);printedPages.set(key,canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height));while(printedPages.size>8)printedPages.delete(printedPages.keys().next().value);});document.documentElement.dataset.pageSnapshot='canvas-print';}
  finally{measure.remove();artwork.forEach(img=>img.close?.());}
  if(!warm)drawBody(true);
 })();pendingPrints.set(jobKey,work);try{return await work;}finally{pendingPrints.delete(jobKey);}
}
function creasePrint(w){
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*4);canvas.height=4;
 const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,canvas.width,0);
 for(const [stop,color] of [[0,'#00000000'],[.486,'#00000000'],[.495,'#1b110a20'],[.4994,'#1b110a48'],[.5004,'#ffffff22'],[.5045,'#1b110a24'],[.514,'#00000000'],[1,'#00000000']])gradient.addColorStop(stop,color);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,canvas.width,4);
 return canvas;
}
function texture(page,w,h){
 const key=printKey(page,w,h),cached=printedTextures.get(key);if(cached){printedTextures.delete(key);printedTextures.set(key,cached);document.documentElement.dataset.printColors=cached.userData.printColors;return cached;}let pixels=printedPages.get(key);
 if(!pixels){const canvas=rasterPage(page,w,h,undefined,false);pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);printedPages.set(key,pixels);while(printedPages.size>8)printedPages.delete(printedPages.keys().next().value);}
 // Upload explicit RGBA bytes rather than another GPU-backed canvas surface.
 const palette=new Set();for(let n=0;n<pixels.data.length;n+=Math.max(4,Math.floor(pixels.data.length/4096/4)*4))if(pixels.data[n+3]>10)palette.add([pixels.data[n]>>4,pixels.data[n+1]>>4,pixels.data[n+2]>>4].join(','));document.documentElement.dataset.printColors=palette.size;if(!palette.size)throw Error('Printed illustration has no decoded pixels');
 const tex=new THREE.DataTexture(pixels.data,pixels.width,pixels.height,THREE.RGBAFormat);
 tex.flipY=true;tex.needsUpdate=true;tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearFilter;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;tex.userData.printColors=palette.size;printedTextures.set(key,tex);while(printedTextures.size>6){const oldest=printedTextures.keys().next().value;printedTextures.get(oldest).dispose();printedTextures.delete(oldest);}return tex;
}
function endpaperPrint(page){return !!page?.matches?.('.endpaper-board,.endpaper-leaf');}
export function rasterPage(page,w,h,bitmap,clip=true){
 const structural=endpaperPrint(page);
 document.documentElement.dataset.printedSnapshot='canvas-print';
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*2);canvas.height=Math.round(h*2);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.scale(2,2);const img=page.querySelector('img');if(!img?.complete||!img.naturalWidth)throw Error('Illustration is still loading');const art=bitmap??window.decodedArt?.(img.getAttribute('src'))??img;if(img.classList.contains('tree-fill-image')){const sh=img.naturalHeight,sw=sh*1.5,sx=(img.naturalWidth-sw)/2+(img.classList.contains('right')?sw/2:0);ctx.drawImage(art,sx,0,sw/2,sh,0,0,w,h);}else if(getComputedStyle(img).objectFit==='contain'){const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;if(!structural){ctx.fillStyle='#17191c';ctx.fillRect(0,0,w,h);}ctx.drawImage(art,(w-iw)/2,(h-ih)/2,iw,ih);}else ctx.drawImage(art,0,0,w,h);
 // reader.css shades both paper edges. Preserve that existing DOM shading in
 // the print snapshot too, or the moving gutter brightens at the handoff.
 if(!structural){const edges=ctx.createLinearGradient(0,0,w,0);for(const [stop,color] of [[0,'#20160b16'],[.03,'#20160b00'],[.97,'#20160b00'],[1,'#20160b16']])edges.addColorStop(stop,color);ctx.fillStyle=edges;ctx.fillRect(0,0,w,h);}
 // Read the already-laid-out DOM caption, including its private edits. The canonical text remains in the DOM.
 const pageRect=page.getBoundingClientRect();for(const line of page.querySelectorAll('.tape-line')){const style=getComputedStyle(line),saved=line.style.transform;line.style.transform='none';const rect=line.getBoundingClientRect();line.style.transform=saved;const angle=parseFloat(style.getPropertyValue('--tilt'))*Math.PI/180||0,scale=rect.width/line.offsetWidth||1;ctx.save();ctx.translate(rect.left-pageRect.left+rect.width/2,rect.top-pageRect.top+rect.height/2);ctx.translate((parseFloat(style.getPropertyValue('--shift'))||0)*scale,0);ctx.rotate(angle);ctx.scale(scale,scale);const lw=line.offsetWidth,lh=line.offsetHeight;ctx.translate(-lw/2,-lh/2);ctx.beginPath();const poly=line.style.getPropertyValue('--tear').slice(8,-1).split(/,(?![^()]*\))/);function coord(v,total){v=v.trim();if(v.startsWith('calc'))return total-parseFloat(v.split('-')[1]);return v.endsWith('%')?parseFloat(v)*total/100:parseFloat(v);}poly.forEach((point,j)=>{const match=point.trim().match(/^(calc\([^)]*\)|[^ ]+)\s+(.+)$/);if(!match)return;const x=coord(match[1],lw),y=coord(match[2],lh);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.globalAlpha=parseFloat(getComputedStyle(line.closest('.story-copy')).getPropertyValue('--tape-opacity'))||.78;ctx.fillStyle=style.getPropertyValue('--paper')||'#eadbb7';ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=style.color;ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(line.textContent,lw/2,lh/2);ctx.restore();}
 if(clip&&page.__physicalClipCanvas){ctx.save();ctx.globalCompositeOperation='destination-in';ctx.drawImage(page.__physicalClipCanvas,0,0,w,h);ctx.restore();}
 return canvas;}
function create(options){const physical=sharedPhysicalLeaf(options.front,options.back);if(!renderer||contextLost||reduced.matches)return fallbackTurn(options);let frontTex,backTex,layer,turnScene,receiverMask,exitMask,exitBridge;
try{const {host,direction,front,back,underlay,stationary}=options;const rect={width:host.clientWidth,height:host.clientHeight},w=rect.width/2,h=rect.height;
 // Measure caption clones in the actual book container so text wrapping and container units agree.
 front.style.width=back.style.width=w+'px';front.style.height=back.style.height=h+'px';drawBody(true);frontTex=texture(front,w,h);const frontColors=document.documentElement.dataset.printColors;backTex=texture(back,w,h);document.documentElement.dataset.printColors=frontColors+','+document.documentElement.dataset.printColors;
 layer=document.createElement('div');layer.className='paper-turn';layer.style.visibility='hidden';layer.setAttribute('aria-hidden','true');underlay.classList.add('paper-underlay');stationary.className='stationary';stationary.style[direction===1?'left':'right']='0';const startPage=front.cloneNode(true);startPage.classList.add("turn-start-page");startPage.style.width="50%";startPage.style[direction===1?"right":"left"]="0";layer.append(underlay,stationary,startPage);const innerCrease=document.createElement('div');innerCrease.className='turn-crease';innerCrease.setAttribute('aria-hidden','true');layer.append(innerCrease);host.append(layer);
 const turnPad=Math.ceil(Math.max(180,h*.55));const rw=rect.width+turnPad*2,rh=h+turnPad*2;if(renderer.domElement.dataset.logicalSize!==rw+'|'+rh){renderer.setSize(rw,rh);renderer.domElement.dataset.logicalSize=rw+'|'+rh;}renderer.domElement.className='three-leaf';renderer.domElement.style.left=renderer.domElement.style.top=-turnPad+'px';layer.append(renderer.domElement);
 const scene=turnScene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-(rect.width+turnPad*2)/2,(rect.width+turnPad*2)/2,(h+turnPad*2)/2,-(h+turnPad*2)/2,1,5000);camera.position.z=2000;camera.lookAt(0,0,0);
 scene.add(new THREE.AmbientLight(0xffffff,1.7));
 const shadowLights=[-1,1].map(side=>{const source=new THREE.DirectionalLight(0xffedcf,1);source.position.set(side*w*.65,h*.22,Math.max(420,w*1.25));source.castShadow=true;source.shadow.mapSize.set(1024,1024);Object.assign(source.shadow.camera,{left:-w*1.7,right:w*1.7,top:h,bottom:-h,near:1,far:3000});source.shadow.bias=-.00005;source.shadow.normalBias=.05;scene.add(source);return source;});const [light,fill]=shadowLights;
 const receiverGeometry=new THREE.PlaneGeometry(w*2,h);const receiverMaterial=new THREE.ShadowMaterial({opacity:.48});if(physical){receiverMask=structuralReceiverMask(underlay,stationary,front,back,direction,w,h);clipReceiver(receiverMaterial,receiverMask,w,h);}const receiver=new THREE.Mesh(receiverGeometry,receiverMaterial);receiver.position.z=-.25;receiver.receiveShadow=true;scene.add(receiver);
 // The spine belongs to the stationary pages, inside the depth-tested scene.
 const spineCanvas=creasePrint(w);
 const spineTexture=new THREE.CanvasTexture(spineCanvas);spineTexture.colorSpace=THREE.SRGBColorSpace;const spineGeometry=new THREE.PlaneGeometry(w*2,h),spineMaterial=new THREE.MeshBasicMaterial({map:spineTexture,alphaMap:receiverMask||null,transparent:true,depthWrite:false,depthTest:true,toneMapped:false});if(receiverMask)nativeAlpha(spineMaterial,receiverMask);const spine=new THREE.Mesh(spineGeometry,spineMaterial);spine.position.z=-.6;scene.add(spine);
 const geometry=new THREE.BufferGeometry(),reverse=new THREE.BufferGeometry();
 const alphaFront=endpaperPrint(front)||!!front.__physicalClipCanvas,alphaBack=endpaperPrint(back)||!!back.__physicalClipCanvas;
 const mat=new THREE.MeshBasicMaterial({map:frontTex,side:THREE.FrontSide,toneMapped:false,vertexColors:true,transparent:alphaFront,alphaTest:alphaFront ? .001 : 0,depthWrite:!alphaFront}),backMat=new THREE.MeshBasicMaterial({map:backTex,side:THREE.BackSide,toneMapped:false,vertexColors:true,transparent:alphaBack,alphaTest:alphaBack ? .001 : 0,depthWrite:!alphaBack});
 for(const [page,material] of [[front,mat],[back,backMat]])if(page.__physicalClipCanvas){const mask=alphaTexture(page.__physicalClipCanvas);mask.repeat.set(1,1);mask.offset.set(0,0);mask.updateMatrix();nativeAlpha(material,mask);if((options.physicalExit&&page===back)||(options.physicalEntry&&page===front))exitMask=mask;}
 const face=new THREE.Mesh(geometry,mat),rear=new THREE.Mesh(reverse,backMat);mat.shadowSide=backMat.shadowSide=THREE.DoubleSide;face.castShadow=rear.castShadow=true;scene.add(face,rear);
 // A bound-edge alpha layer shares the page mesh and depth test. Unlike a
 // screen overlay it folds with the material and cannot show through the page.
 function pageCrease(side){const tex=new THREE.CanvasTexture(creasePrint(w));tex.colorSpace=THREE.SRGBColorSpace;tex.repeat.x=.5;tex.offset.x=side==='left'?0:.5;return tex;}
 const frontCreaseTexture=pageCrease(direction===1?'right':'left'),backCreaseTexture=pageCrease(direction===1?'left':'right');
 const creaseMaterial=map=>new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const frontCreaseMaterial=creaseMaterial(frontCreaseTexture),backCreaseMaterial=creaseMaterial(backCreaseTexture);
 const frontCrease=new THREE.Mesh(geometry,frontCreaseMaterial),backCrease=new THREE.Mesh(reverse,backCreaseMaterial);frontCrease.renderOrder=backCrease.renderOrder=1;frontCrease.visible=!alphaFront;backCrease.visible=!alphaBack;scene.add(frontCrease,backCrease);
 const rimGeometry=new THREE.BufferGeometry(),rimMaterial=new THREE.MeshBasicMaterial({color:0xe9d8b6,side:THREE.DoubleSide,toneMapped:false}),rim=new THREE.Mesh(rimGeometry,rimMaterial);rim.visible=!physical;scene.add(rim);
 const capacity=1024,arrays={front:new Float32Array(capacity*3),back:new Float32Array(capacity*3),normal:new Float32Array(capacity*3),color:new Float32Array(capacity*3),uv:new Float32Array(capacity*2),backUV:new Float32Array(capacity*2)};
 const attribute=(array,size)=>new THREE.BufferAttribute(array,size).setUsage(THREE.DynamicDrawUsage);
 const commonNormal=attribute(arrays.normal,3),commonColor=attribute(arrays.color,3);
 for(const [target,position,uv] of [[geometry,arrays.front,arrays.uv],[reverse,arrays.back,arrays.backUV]]){target.setAttribute('position',attribute(position,3));target.setAttribute('normal',commonNormal);target.setAttribute('color',commonColor);target.setAttribute('uv',attribute(uv,2));}
 face.frustumCulled=rear.frustumCulled=frontCrease.frustumCulled=backCrease.frustumCulled=false;
 const boundary=[];if(!physical){for(let i=0;i<=48;i++)boundary.push({x:w*i/48,y:-h/2});for(let i=1;i<=48;i++)boundary.push({x:w,y:-h/2+h*i/48});for(let i=47;i>=0;i--)boundary.push({x:w*i/48,y:h/2});for(let i=47;i>=0;i--)boundary.push({x:0,y:-h/2+h*i/48});}
 const edge=new Float32Array(Math.max(0,boundary.length-1)*18),rimFront=new Float32Array(boundary.length*3),rimBack=new Float32Array(boundary.length*3);
 if(!physical){rimGeometry.setAttribute('position',attribute(edge,3));rim.frustumCulled=false;}
 const shadow=document.createElement('div');shadow.className='paper-shadow';layer.insertBefore(shadow,renderer.domElement);shadow.style.filter='blur(8px)';
 exitBridge=physicalHandoffBridge(options,layer);
 function progress(p,grab={},warming=false){if(location.search.includes('shadowQA=1')&&window.__freezeShadowProgress!=null)p=window.__freezeShadowProgress;if(!warming)exitBridge.progress(p);if(exitMask){const q=handoffAmount(options,p),repeat=1/(1+.18*q);exitMask.repeat.set(repeat,repeat);exitMask.offset.set((1-repeat)/2,(1-repeat)/2);exitMask.updateMatrix();}if(contextLost)throw Error('Page graphics context lost');const curl=Math.sin(Math.PI*p);receiverMaterial.opacity=.46*Math.pow(curl,1.2);const spec=foldSpec(w,h,p,options.anchorY??.5,grab.pullY??0),vertices=paperMesh(w,h,spec);
 if(vertices.length>capacity)throw Error('Fold mesh exceeds reserved capacity');
 for(let i=0;i<vertices.length;i++){
  const source=vertices[i],q=foldPoint(source.x,source.y,spec),n=foldNormal(source.x,source.y,spec),u=direction===1?source.x/w:1-source.x/w,v=source.y/h+.5,j=i*3,k=i*2,shade=.86+.14*Math.abs(n.z);
  arrays.front[j]=direction*q.x;arrays.front[j+1]=q.y;arrays.front[j+2]=q.z;arrays.back[j]=direction*(q.x-n.x*.12);arrays.back[j+1]=q.y-n.y*.12;arrays.back[j+2]=q.z-n.z*.12;
  arrays.normal[j]=n.x;arrays.normal[j+1]=direction*n.y;arrays.normal[j+2]=direction*n.z;arrays.color[j]=arrays.color[j+1]=arrays.color[j+2]=shade;arrays.uv[k]=u;arrays.uv[k+1]=v;arrays.backUV[k]=1-u;arrays.backUV[k+1]=v;
 }
 for(const target of [geometry,reverse]){target.setDrawRange(0,vertices.length);for(const [name,size] of [['position',3],['normal',3],['color',3],['uv',2]]){const attr=target.getAttribute(name);attr.clearUpdateRanges();attr.addUpdateRange(0,vertices.length*size);attr.needsUpdate=true;}}
 if(!physical){
  for(let i=0;i<boundary.length;i++){const source=boundary[i],q=foldPoint(source.x,source.y,spec),n=foldNormal(source.x,source.y,spec),j=i*3;rimFront[j]=direction*q.x;rimFront[j+1]=q.y;rimFront[j+2]=q.z;rimBack[j]=direction*(q.x-n.x*.12);rimBack[j+1]=q.y-n.y*.12;rimBack[j+2]=q.z-n.z*.12;}
  let e=0;for(let i=0;i<boundary.length-1;i++)for(const [array,index] of [[rimFront,i],[rimBack,i],[rimFront,i+1],[rimBack,i],[rimBack,i+1],[rimFront,i+1]]){const j=index*3;edge[e++]=array[j];edge[e++]=array[j+1];edge[e++]=array[j+2];}
  rimGeometry.getAttribute('position').needsUpdate=true;
 }
 mat.side=direction===1?THREE.FrontSide:THREE.BackSide;backMat.side=direction===1?THREE.BackSide:THREE.FrontSide;frontCreaseMaterial.side=mat.side;backCreaseMaterial.side=backMat.side;const ease=x=>x*x*(3-2*x);const entry=ease(Math.min(1,p/.06)),exit=ease(Math.max(0,Math.min(1,(p-.94)/.06)));renderer.domElement.style.opacity='1';startPage.style.visibility='hidden';startPage.style.opacity='0';stationary.style.opacity='1';if(location.search.includes('shadowQA=1'))window.__shadowProbe={creaseDraw:(enabled)=>{frontCrease.visible=backCrease.visible=enabled;renderer.render(scene,camera);},draw:(enabled)=>{light.castShadow=fill.castShadow=enabled;renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},progress:(at,grasp=grab)=>progress(at,grasp),direction,state:{p,anchorY:options.anchorY??.5,pullY:grab.pullY??0,spec}};renderer.render(scene,camera);shadow.style.display='none';}

 renderer.compile(scene,camera);progress(.5,{},true);progress(0);host.classList.add('physical-crease');layer.style.visibility='';document.documentElement.dataset.pageRenderer='three';document.documentElement.dataset.paperStudy='managed-cylinder-v2';return {layer,leaf:renderer.domElement,stationary,progress,segments:48,remove(){exitBridge.remove();host.classList.remove("physical-crease");spineGeometry.dispose();spineMaterial.dispose();spineTexture.dispose();receiverMask?.dispose();frontCreaseMaterial.dispose();backCreaseMaterial.dispose();frontCreaseTexture.dispose();backCreaseTexture.dispose();layer.remove();geometry.dispose();reverse.dispose();rimGeometry.dispose();rimMaterial.dispose();receiverGeometry.dispose();receiverMaterial.dispose();mat.dispose();backMat.dispose();}};
}catch(error){book.classList.remove("physical-crease");layer?.remove();const disposed=new Set();turnScene?.traverse(object=>{for(const resource of [object.geometry,...(Array.isArray(object.material)?object.material:[object.material])])if(resource&&!disposed.has(resource)){disposed.add(resource);resource.dispose();}});receiverMask?.dispose();exitBridge?.remove();console.warn('Using accessible CSS paper fallback',error);return fallbackTurn(options);}}
window.FeltPaperTurn={...fallback,create,...(renderer?{prepare}:{})};if(renderer)document.documentElement.dataset.pageRenderer='three-ready';
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
let wornBoardTexture;
function boardCloth(){
 if(wornBoardTexture)return wornBoardTexture;
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
 }
 ctx.putImageData(pixels,0,0);wornBoardTexture=new THREE.CanvasTexture(canvas);
 wornBoardTexture.colorSpace=THREE.SRGBColorSpace;
 wornBoardTexture.anisotropy=Math.min(4,bodyRenderer.capabilities.getMaxAnisotropy());
 return wornBoardTexture;
}
function openWornBoard(scene,width,height,resources){
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
 const material=new THREE.MeshStandardMaterial({map:boardCloth(),color:0xffffff,roughness:1,metalness:0});
 resources.push(geometry,material);const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(0,-6,-16);mesh.castShadow=true;scene.add(mesh);
}
let bodyResources=[],bodyKey='',bodyPending=false;
function drawBody(allowBusy=false){if(!bodyRenderer)return;const structural=book.matches('.endpaper-mode,.endpaper-transition')&&!book.classList.contains('endpaper-story-bridge');bodyRenderer.domElement.style.visibility=structural?'hidden':'';const nextKey=book.clientWidth+'|'+book.clientHeight+'|'+book.classList.contains('cover-mode');if(nextKey===bodyKey)return;if(busy()&&!allowBusy){bodyPending=true;return;}bodyPending=false;bodyKey=nextKey;bodyResources.forEach(x=>x.dispose());bodyResources=[];const width=book.clientWidth,height=book.clientHeight,pad=48;const bw=width+pad*2,bh=height+pad*2;if(bodyRenderer.domElement.dataset.logicalSize!==bw+'|'+bh){bodyRenderer.setSize(bw,bh);bodyRenderer.domElement.dataset.logicalSize=bw+'|'+bh;}const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-(width+pad*2)/2,(width+pad*2)/2,(height+pad*2)/2,-(height+pad*2)/2,1,4000);camera.position.set(0,0,2000);camera.lookAt(0,0,0);scene.add(new THREE.AmbientLight(0xf4f1e7,1.8));const light=new THREE.DirectionalLight(0xffe7c4,1.6);light.position.set(-width*.6,height*.8,1200);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-width,right:width,top:height,bottom:-height,near:1,far:3000});light.shadow.normalBias=.3;scene.add(light);
 const board=new THREE.MeshStandardMaterial({roughness:1,color:0x344559}),paper=new THREE.MeshStandardMaterial({color:0xe8dcc6,roughness:1});bodyResources.push(board,paper);
 function box(w,h,d,x,y,z,material){const geometry=new THREE.BoxGeometry(w,h,d);bodyResources.push(geometry);const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
 if(book.classList.contains('cover-mode'))box(width+12,height+12,4,0,-6,-16,board);else openWornBoard(scene,width,height,bodyResources);
 const cover=book.classList.contains('cover-mode');if(cover){box(width-4,height-4,6,2,-3,-7,paper);}else{for(const side of [-1,1])for(let j=0;j<3;j++)box(width/2-2,height-2,1.5,side*width/4,-j*1.6,-j*2-2,paper);}
 const floorGeometry=new THREE.PlaneGeometry(width+pad*2,height+pad*2),floorMaterial=new THREE.ShadowMaterial({opacity:.12});bodyResources.push(floorGeometry,floorMaterial);const floor=new THREE.Mesh(floorGeometry,floorMaterial);floor.position.z=-25;floor.receiveShadow=true;scene.add(floor);bodyRenderer.render(scene,camera);}
new ResizeObserver(()=>drawBody()).observe(book);new MutationObserver(()=>drawBody()).observe(document.querySelector('#position'),{childList:true,subtree:true,characterData:true});window.addEventListener('felt-turn-end',()=>{if(bodyPending)requestAnimationFrame(()=>drawBody())});drawBody();

// Decode/print neighbouring leaves only during a true idle window. Starting any
// gesture invalidates asynchronous warm jobs before they can touch layout/GPU.
window.addEventListener('felt-turn-start',()=>{warmEpoch++});
window.addEventListener('felt-scene',event=>{const i=event.detail.index,epoch=++warmEpoch;if(i===0||i===event.detail.count-1)return;const warm=async()=>{if(epoch!==warmEpoch||busy())return;drawBody();for(const direction of [-1,1]){if(epoch!==warmEpoch||busy())return;const target=i+direction;if(target<=0||target>=event.detail.count-1)continue;try{await prepare({host:book,front:window.page(i,direction===1?'right':'left'),back:window.page(target,direction===1?'left':'right'),warm:true})}catch{}}};if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:2000});else setTimeout(warm,250);});

/* Reader structure: insert spreads here with explicit physical face kinds. */
(() => {
 'use strict';
 const nativeKinds=new Set(['board','flyleaf','blank']);
 function createModel(input){
  const seen=new Set();
  const scenes=Object.freeze(input.map(([id,title,meta={}])=>{if(!id||seen.has(id))throw Error('Reader scene IDs must be unique');seen.add(id);return Object.freeze([id,title,Object.freeze({...meta,assets:meta.assets?Object.freeze({...meta.assets}):undefined})]);}));
  const kinds=new Set(['story','board','flyleaf','blank']);
  for(const [, ,meta] of scenes){if(meta.cover&&!['front','back'].includes(meta.cover))throw Error('Unknown cover role');for(const side of ['left','right'])if(meta[side]&&!kinds.has(meta[side]))throw Error('Unknown physical face kind');}
  if(scenes[0]?.[2].cover!=='front'||scenes.at(-1)?.[2].cover!=='back'||scenes.filter(x=>x[2].cover).length!==2)throw Error('Keep one front and back cover around the inserted spreads');
  const entry=i=>{if(!scenes[i])throw RangeError('Unknown reader scene');return scenes[i];};
  const coverSide=i=>entry(i)[2].cover||null;
  const isCover=i=>!!coverSide(i);
  const faceKind=(i,side)=>isCover(i)?'cover':entry(i)[2][side]||'story';
  const isNative=(i,side)=>nativeKinds.has(faceKind(i,side));
  const isStructural=i=>!isCover(i)&&(isNative(i,'left')||isNative(i,'right'));
  const bindingSide=i=>faceKind(i,'left')==='board'?'front':faceKind(i,'right')==='board'?'back':'';
  const source=(i,side)=>isCover(i)?entry(i)[2].src:entry(i)[2].assets?.[side]||`${entry(i)[0]}-part-${side==='left'?1:2}-${side}.png`;
  function plan(from,to,direction=Math.sign(to-from)){
   entry(from);entry(to);if(!direction)throw Error('A turn needs a direction');
   const frontSide=direction===1?'right':'left',backSide=direction===1?'left':'right';
   const frontNative=!isCover(from)&&isNative(from,frontSide),backNative=!isCover(to)&&isNative(to,backSide);
   return Object.freeze({from,to,direction,frontSide,backSide,stationarySide:backSide,revealedSide:frontSide,boundary:isCover(from)||isCover(to),structural:isStructural(from)||isStructural(to),physicalEntry:!frontNative&&backNative,physicalExit:frontNative&&!backNative,frontNative,backNative});
  }
  return Object.freeze({scenes,coverSide,isCover,faceKind,isNative,isStructural,bindingSide,source,plan});
 }
 const scenes=[['cover-front','Front cover',{cover:'front',src:'covers/front-cover-study-v3.png?v=private-cover-20261026'}],['00-front-endpapers','Front endpapers',{left:'board',right:'flyleaf'}],['00-thread-room','The thread room'],['10-wide-felt-world','A wide world of felt'],['11-peaceful-tree-home','A peaceful tree home'],['06-tree-fortress-sanctuary','Inside their sanctuary'],['05-tree-fortress-exterior','Lumi and Kitty’s tree-fortress'],['08-jack-search','Jack searches for Doggy'],['09-nomie-search-mansion','Nomie searches outside her home'],['07-doggy-alone','Doggy waits in the snow'],['12-first-small-kindness','The first small kindness'],['13-lumi-awakening','Lumi awakens'],['04-trio-lake','The quiet lake'],['14-quiet-journey','The quiet journey'],['01-woodland-bridge','Woodland bridge'],['03-manor-welcome','A welcome at the home'],['02-manor-interior','Inside the home'],['99-back-endpapers','Back endpapers',{left:'flyleaf',right:'board'}],['cover-back','Back cover',{cover:'back',src:'covers/back-cover-study-v3.png?v=private-cover-20261026'}]];
 window.FeltBookModel=Object.freeze({...createModel(scenes),createModel});
})();

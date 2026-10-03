export const WORLD_CAST=[
  {id:'cottage',name:'Teacup Cottage',role:'Nomie’s pottery home',bio:'A real glazed porcelain cup on a saucer. It has a painted floral pattern, a sturdy ceramic handle and warm little windows. Help Nomie keep its lamps on.'},
  {id:'manor',name:'Teapot Manor',role:'The village’s pottery mansion',bio:'A big glossy porcelain teapot with a spout, handle and lid. It is the village’s meeting place. The buildings are ceramic; the hills, trees, snow and creatures around them are felt.'},
  {id:'world',name:'Feltworld',role:'The home you are saving',bio:'A soft world of wool, stitched flowers and snowy felt hills. The river, forest, gardens and pottery homes depend on each other. Your choices change what happens to them.'},
];
export const RESULTS={
 'river-clean':'Rubbish cleared · fish free · water flowing', 'river-listen':'Fish guided around the rubbish · river still blocked', 'river-rush':'More rubbish collects · fish still trapped',
 'forest-share':'Food grows beside the old tree', 'forest-shelter':'A woodland shelter is built', 'forest-cut':'The old tree falls · its stump is left behind',
 'garden-plant':'Flowers bloom · bees return', 'garden-water':'Rain fills old cups · flowers perk up', 'garden-hoard':'The flower bed stays empty',
 'village-sun':'Sunflower lamps light both pottery homes', 'village-listen':'Repaired windows and lanterns light up', 'village-burn':'Smoke covers the pottery homes',
 'storm-help':'A warm shelter protects the family', 'storm-garden':'New roots hold the garden soil', 'storm-run':'Floodwater washes away the path · family still stranded',
 'heart-seed':'New roots spread · the world begins to bloom', 'heart-light':'Glimmers light the whole valley', 'heart-song':'Lumi’s microphone sends a wave of light', 'heart-force':'The Sunflower dims · light leaves the valley',
};
// Every location has its own camera-matched before and outcome paintings.
export const LOCATIONS=['river','forest','garden','village','storm','heart'];
export const OUTCOMES={
 'river-clean':['river-clear','clean-river'], 'river-listen':['river-channel','free-fish'], 'river-rush':['river-polluted','extra-rubbish'],
 'forest-share':['forest-food','woodland-food'], 'forest-shelter':['forest-shelter','warm-shelter'], 'forest-cut':['forest-cut','tree-stump'],
 'garden-plant':['garden-bloom','returning-bees'], 'garden-water':['garden-water','rainwater-cups'], 'garden-hoard':['garden-bare','wilted-garden'],
 'village-sun':['village-sun','sunflower-lamps'], 'village-listen':['village-lit','lit-pottery-homes'], 'village-burn':['village-smoke','village-smoke'],
 'storm-help':['storm-shelter','warm-shelter'], 'storm-garden':['storm-roots','new-roots'], 'storm-run':['storm-flood','flooded-path'],
 'heart-seed':['sunflower-bloom','heart-light'], 'heart-light':['sunflower-bloom','glimmer-light'], 'heart-song':['sunflower-bloom','microphone-song'], 'heart-force':['sunflower-dim','damaged-heart'],
};
export const sceneURL=name=>`assets/${name==='village-lit'?'scenes-v5':name.startsWith('sunflower-')?'scenes-v4':'scenes-v3'}/${name}.png`;
export function sceneVisual(s,cover=false,chapter=Math.min(s.chapter,5)){
 const location=LOCATIONS[chapter],baseline=location==='heart'?'sunflower-before':`${location}-before`;
 if(cover)return {location:'village',baseline:'village-lit',background:'village-lit',result:null,feature:null};
 const record=s.history.find(h=>h.chapter===chapter);
 let outcome=record?OUTCOMES[record.id]:null;
 if(s.repairs.includes(location==='village'?'village':location))outcome={river:['river-clear','clean-river'],forest:['forest-food','woodland-food'],village:['village-lit','lit-pottery-homes']}[location]||outcome;
 if(s.phase==='ending'&&chapter===5){outcome=s.repairs.length===3||s.health>=45&&s.karma>=0?['sunflower-bloom','heart-light']:['sunflower-dim','damaged-heart'];}
 let summary=RESULTS[record?.id]||'';
 if(s.repairs.includes(location))summary={river:'River repaired · clean water flowing',forest:'Woodland repaired · food growing beside new trees',village:'Village repaired · pottery homes lit'}[location]||summary;
 if(s.phase==='ending'&&chapter===5)summary=outcome[0]==='sunflower-bloom'?'Sunflower blooms · new roots spread':'The Sunflower still needs care';
 return {location,baseline,background:outcome?.[0]||baseline,result:record?.id||null,feature:outcome?.[1]||null,summary};
}
export function sceneLayers(s,cover=false){
 if(cover)return '';
 const v=sceneVisual(s),free=['river-clear','river-channel'].includes(v.background);
 const fish=v.location==='river'?`<div class="felt-prop story-prop prop-fish ${free?'free':'trapped'}" data-feature="${free?'free-fish':'trapped-fish'}"></div>`:'';
 const rain=v.location==='storm'&&v.background!=='storm-shelter'?'<div class="heavy-rain"></div>':'';
 const song=v.result==='heart-song'?'<div class="song-rings" aria-hidden="true"><i></i><i></i><i></i></div>':'';
 const glimmers=v.result==='heart-light'?'<div class="offered-glimmers" aria-hidden="true">✦ <span>✦</span> ✦</div>':'';
 return `<div class="world-layers ${s.phase==='reflection'?'responding':''} ${s.history.at(-1)?.karma<0?'hurt':'helped'}" data-scene-result="${v.result||''}" ${v.feature?`data-feature="${v.feature}"`:''}>${fish}${rain}${song}${glimmers}</div>`;
}

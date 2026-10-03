export function simplifyStory(chapters, endings, cast) {
  const pages=[
    ['A fish needs help','“Let’s get this fish home.”',s=>'Lumi finds a fish stuck behind rubbish. The river carries water to the gardens and pottery homes. The Sunflower is a glowing flower that keeps their home alive. Its light is fading, but the fish needs help now. What do you do?'],
    ['Who lives in this tree?','“Someone lives here. Be careful.”',s=>`${s.flags.riverClear?'The river is clean again.':s.flags.riverHurt?'The river is still blocked.':'The fish is safe, but rubbish is still in the water.'} Kitty finds hungry animals living in an old tree. You could plant food, build a shelter, or cut the tree for supplies.`],
    ['Let’s grow a garden','“Flowers could bring the bees back.”',s=>`Doggy finds an empty garden. ${s.flags.forestFed?'The animals you helped bring good soil.':s.flags.treeLost?'Loose soil blows in from where you cut down the tree.':'The few flowers left need water.'} Will you use a seed here, catch rainwater, or keep the last seed?`],
    ['Lights out at the tea set','“Let’s help our neighbours.”',s=>`Nomie lives in Teacup Cottage beside Teapot Manor. Both homes are made of glazed pottery. Their lamps are running out of power. ${s.flags.shelter||s.flags.forestFed?'The animals you helped offer to lend a paw.':'The neighbours are ready to help.'} Nomie wants to grow sunflowers to power the lights.`],
    ['Help in the rain','“Don’t leave them in this storm.”',s=>`Heavy rain hits the valley. A family is stuck on the hillside. ${s.flags.treeLost?'The tree is gone, so the soil is slipping.':'The tree’s roots hold the soil in place.'} Your friends need to reach the Sunflower before its light goes out. Do you stop to help?`],
    ['Help the Sunflower bloom','“Let’s help our home.”',s=>`The Sunflower is a glowing flower that keeps this felt world alive. Its light is fading. ${s.karma>=6?'The people and places you helped are stronger. They can help you too.':s.karma<0?'The valley is badly hurt. You have one more chance to help.':'Some parts of the valley are getting better.'} What will you give the Sunflower?`],
  ];
  pages.forEach(([title,quote,story],i)=>Object.assign(chapters[i],{title,quote,story}));
  const words={
    'river-clean':['Clear the rubbish','Free the fish and let the river flow.','You clear the rubbish. The fish swims home, clean water reaches the village, and you find a seed.'],
    'river-listen':['Make a way around it','Build a small channel for the fish.','The fish swims through your channel. It is safe, but the river still needs cleaning.'],
    'river-rush':['Leave it and hurry on','Cross quickly. Leave the fish behind.','You cross quickly. The fish is still trapped and the water gets dirtier.'],
    'forest-share':['Plant food for the animals','Use one seed beside their tree.','You plant a seed. Food grows and the animals can stay in their home.'],
    'forest-shelter':['Build a shelter','Use fallen branches. Keep the living tree.','You build a warm shelter. The animals are safe and the tree stays standing.'],
    'forest-cut':['Cut the tree for supplies','Gain two seeds, but destroy their home.','You gain supplies, but the animals lose their home. The soil starts to loosen.'],
    'garden-plant':['Plant flowers for the bees','Use one seed to grow a flower bed.','Doggy plants your seed. Flowers grow and the bees come back.'],
    'garden-water':['Catch rain in old cups','Reuse pottery to water the flowers.','You fill old cups with rain. The flowers perk up without using a seed.'],
    'garden-hoard':['Take the last seed','Keep it. Leave the garden empty.','You keep the seed. The garden stays bare and the bees have less food.'],
    'village-sun':['Build sunflower lamps','Use one seed to light both pottery homes.','The sunflower lamps light Teacup Cottage and Teapot Manor without smoke.'],
    'village-listen':['Mend the lamps together','Share tools and repair what you have.','The neighbours repair the lamps. Both pottery homes glow again.'],
    'village-burn':['Burn wood for quick light','Light the lamps, but make smoke.','The lamps light up, but smoke fills the village. Nomie has trouble breathing.'],
    'storm-help':['Help the stranded family','Stop and build a shelter.','You share scarves and make a shelter. The family is safe from the rain.'],
    'storm-garden':['Protect the plants','Use one seed to hold the soil together.','New roots stop the garden washing away. The family is still out in the rain.'],
    'storm-run':['Keep going without them','Save supplies and collect two seeds.','You reach the top with more seeds. The family is still waiting in the storm.'],
    'heart-seed':['Plant a seed beside the Sunflower','Use one seed to help the world recover.','You plant a seed. New roots send life back to the river, gardens and homes.'],
    'heart-light':['Use your collected light','Give six glimmers to the Sunflower.','Your six glimmers warm the Sunflower. Its light returns to the valley.'],
    'heart-song':['Sing together with Lumi','Use the crystal microphone to ask for help.','Lumi lifts the crystal microphone. Your friends and neighbours sing together. The Sunflower grows brighter.'],
    'heart-force':['Pull magic out of it','Take power, but hurt the Sunflower.','The Sunflower flashes, then dims. You took more power from a world that was already weak.'],
  };
  for(const page of chapters)for(const c of page.choices){const [title,detail,reply]=words[c.id];Object.assign(c,{title,detail,reply});if(c.bonus){const old=c.bonus;const bonusWords={'garden-water':'The river you cleaned brings fresh water to the garden.','village-listen':'The woodland animals you helped repair the lamps too.','storm-help':'Your earlier shelter and neighbours keep everyone safe.','heart-seed':'Your clean river and living trees carry the new life further.','heart-song':'The neighbours and family you helped join Lumi’s song.'};c.bonus=s=>{const b=old(s);return {...b,text:b.text?bonusWords[c.id]||b.text:''};};}}
  endings.bloom.text='You saved your home. The fish can swim, the woods have food and shelter, and the bees have flowers. Teacup Cottage and Teapot Manor shine with clean light. Your four friends can stay here together.';
  endings.hope.text='The Sunflower is alive. Parts of the valley still need work, but the world can recover. Your friends stay to clean the river, grow food and mend the pottery homes.';
  endings.mend.text='The Sunflower is alive, but the world is badly hurt. Your friends stay to help. You can go back and fix what went wrong.';
  cast[0].gift='A voice, and a crystal microphone.';cast[0].bio='Lumi has soft, cloud-fluffy blue fur, starry eyes, a star-covered scarf and a crystal microphone. Lumi helps you care for the river.';
  cast[1].gift='A careful cat in a well-loved scarf.';cast[1].bio='Kitty has soft near-black wool with a few silver strands, a curled tail and a glittering textured black nose. His right iris fades from yellow nearest his ear to emerald nearest his nose. He wears a worn red, navy and cream scarf without a star. He helps protect the woods.';
  cast[2].gift='A puppy who loves to plant.';cast[2].bio='Doggy has clear blue eyes, cream fur, soft ears and a golden star on a colourful scarf. She helps gardens grow.';
  cast[3].gift='Your guide with a star lantern.';cast[3].bio='Nomie has faceted crystal-grey eyes, a warm honey-beige face, cool brown-to-silver balayage braids, a magical colour-changing fringe and a comically enormous upward-pointed red gnome hat, a brown satchel and a star lantern. She lives in Teacup Cottage and helps repair the village.';
}

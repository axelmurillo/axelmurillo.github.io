import { simplifyStory } from './plain-story.js';
export const CAST = [
  { id: 'blue', catalogue: 'CR-001', name: 'Lumi', kind: 'the blue creature', gift: 'A heart big enough to listen.', bio: 'Lumi hears the quiet things: tired rivers, sleepy seeds, and the little voice that says kindness is worth the extra mile.' },
  { id: 'cat', catalogue: 'CR-002', name: 'Kitty', pronouns: 'he/him', kind: 'the little cat', gift: 'Courage, with a curious tail.', bio: 'Kitty notices what everyone else walks past. A small paw can protect an old forest, and a brave question can change a whole village.' },
  { id: 'puppy', catalogue: 'CR-003', name: 'Doggy', pronouns: 'she/her', kind: 'the puppy', gift: 'Hope that keeps on growing.', bio: 'Doggy believes every forgotten corner can become a garden. Sometimes the best treasure is a seed you give away.' },
  { id: 'gnome', catalogue: 'CR-004', name: 'Nomie', kind: 'the gnome girl', gift: 'Small hands. Wonderful ideas.', bio: 'Nomie mends lanterns, stitches warm scarves, and brings neighbours together. She knows saving a planet is something we do together.' },
];

const choice = (id, title, detail, health, karma, seeds, flag, reply, extra = {}) => ({ id, title, detail, health, karma, seeds, flag, reply, ...extra });
export const CHAPTERS = [
  { title: 'The river that lost its song', place: 'Whispering River', lead: 'blue', theme: 'river', subtitle: 'Sometimes the world only needs someone to stop and listen.',
    story: s => `Once, the river sang all the way to the sea. Now its song catches on a tangle of discarded ribbons and bottles. Lumi kneels beside a stranded little fish. Beyond the river, the planet’s Sunflower is fading. The bridge is close. The fish is closer.`,
    quote: '“We could hurry… but who will help if we do?”',
    choices: [
      choice('river-clean', 'Untangle the river', 'Take the time to clear the rubbish and free the fish.', 12, 2, 1, 'riverClear', 'Together, you lift the rubbish out. The fish darts home, the river finds its song, and a floating seed settles into Lumi’s paw.'),
      choice('river-listen', 'Ask the river for a way', 'Listen carefully and guide the fish around the blockage.', 7, 1, 0, 'riverHeard', 'You build a tiny channel with smooth stones. The fish is safe. The river still needs cleaning, but it has learned that someone is listening.'),
      choice('river-rush', 'Take the quicker crossing', 'Leave the blockage behind and hurry toward the Sunflower.', -8, -1, 0, 'riverHurt', 'You reach the other bank quickly. Behind you, the water grows still. Lumi looks back: a shortcut can leave a long shadow.'),
    ] },
  { title: 'A home beneath the branches', place: 'Ancient Woodland', lead: 'cat', theme: 'forest', subtitle: 'What we shelter today will shelter us tomorrow.',
    story: s => `${s.flags.riverClear ? 'The river’s renewed song follows you into the woods.' : s.flags.riverHurt ? 'The silent river follows you into the woods like an unanswered question.' : 'A soft trickle follows you into the woods.'} Kitty discovers hungry woodland creatures beneath an ancient tree. Its roots hold the hillside together. One of your seeds could grow their food. Its wood could fill your pockets.`,
    quote: '“This tree is more than wood. Someone calls it home.”',
    choices: [
      choice('forest-share', 'Share a precious seed', 'Plant food for the woodland families. Uses one seed.', 15, 3, -1, 'forestFed', 'The creatures gather around the new shoot. Kitty’s whiskers twitch with pride. You have less to carry, and more friends in the forest.'),
      choice('forest-shelter', 'Build with fallen branches', 'Make a warm shelter without harming the old tree.', 8, 2, 0, 'shelter', 'You gather only fallen wood and make a snug shelter. The old tree stands, and tiny paws tuck safely beneath your handiwork.'),
      choice('forest-cut', 'Cut down the ancient tree', 'Take its valuable wood and gather two seeds from its branches.', -12, -2, 2, 'treeLost', 'Your pockets are fuller. But roots loosen, nests fall quiet, and Kitty watches the creatures search for somewhere else to belong.'),
    ] },
  { title: 'The garden everyone forgot', place: 'Moonflower Orchard', lead: 'puppy', theme: 'garden', subtitle: 'Hope is something you plant before you can see it.',
    story: s => `Doggy finds an orchard with no fruit, no bees, and one stubborn moonflower. ${s.flags.forestFed ? 'A woodland friend brings a handful of rich soil in thanks for your seed.' : s.flags.treeLost ? 'Dust from the bare hillside drifts across the empty beds.' : 'The orchard waits patiently for a little care.'} The puppy digs a small hole, then looks up at you. What will you leave here?`,
    quote: '“What if we leave it lovelier than we found it?”',
    choices: [
      choice('garden-plant', 'Plant a moonflower meadow', 'Give one seed to the bees and butterflies.', 12, 2, -1, 'pollinators', 'You plant the seed and Doggy pats the soil. A shy bee returns. Then another. The planet remembers how to make something sweet.'),
      choice('garden-water', 'Collect rain in old teacups', 'Reuse what is here and water the surviving flowers.', 8, 1, 0, 'rainGarden', 'Broken teacups become little rain barrels. Nothing new is taken; something old becomes useful again.', { bonus: s => s.flags.riverClear ? { health: 5, text: 'The clean river you restored brings fresh water too. Your earlier kindness returns.' } : { health: 0, text: '' } }),
      choice('garden-hoard', 'Keep every seed for yourself', 'Gather the moonflower’s last seed and leave the beds empty.', -5, -1, 1, 'gardenEmpty', 'Doggy places the last seed in your bag. The empty garden has nothing left to offer the bees. Having more is not always the same as helping more.'),
    ] },
  { title: 'A thousand little lanterns', place: 'Teapot Village', lead: 'gnome', theme: 'village', subtitle: 'A brighter future belongs to everybody.',
    story: s => `At Teapot Village, the lanterns are going dark. Nomie has a plan: grow sunflowers and collect their magic as clean light. ${s.flags.shelter || s.flags.forestFed ? 'The woodland families you helped arrive, ready to lend a paw.' : 'The villagers are worried. They need a reason to trust one another.'} There is also a pile of fuel, and an old habit of burning first and asking later.`,
    quote: '“One lantern is lovely. A village full of them is hope.”',
    choices: [
      choice('village-sun', 'Grow sunlight for everyone', 'Give one seed to Nomie’s shared sunflower lanterns.', 10, 2, -1, 'cleanLight', 'Nomie stitches petals around the first lantern. The village glows with borrowed sunshine, and the air stays clear.'),
      choice('village-listen', 'Bring the neighbours together', 'Listen, repair old lanterns, and share what everyone already has.', 7, 2, 0, 'community', 'You sit in a circle and listen. Old lanterns are mended, tools are shared, and nobody is left in the dark.', { bonus: s => s.flags.shelter || s.flags.forestFed ? { health: 4, text: 'Your woodland friends help with the repairs. Care travels in circles.' } : { health: 0, text: '' } }),
      choice('village-burn', 'Burn whatever you can find', 'Make fast light, at the cost of smoke and clean air.', -10, -2, 1, 'smoke', 'The lamps flare brightly, then the sky fills with smoke. Nomie coughs. A bright moment can still cast a shadow tomorrow.'),
    ] },
  { title: 'The night the sky came down', place: 'Stormy Hillside', lead: 'all', theme: 'storm', subtitle: 'Kindness matters most when it asks something of us.',
    story: s => `A wild storm rolls over the hillside. Lumi holds the map, Kitty scouts a path, Doggy guards the seeds, and Nomie steadies a lantern. ${s.flags.treeLost ? 'Without the ancient tree’s roots, the hillside begins to slip.' : 'The ancient roots hold firm under your feet.'} In the rain, a family calls for help. The Sunflower cannot wait forever. Neither can they.`,
    quote: '“We promised to save the planet. They are part of it.”',
    choices: [
      choice('storm-help', 'Make room for everyone', 'Stop to shelter the stranded family, even if it takes longer.', 10, 3, 0, 'rescued', 'You share scarves, lantern light, and shelter. The family is safe. Four little heroes become a whole hillside of helpers.', { bonus: s => s.flags.shelter || s.flags.community ? { health: 5, text: 'The shelter and friendships you made earlier protect everyone through the storm.' } : { health: 0, text: '' } }),
      choice('storm-garden', 'Save the young gardens', 'Use one seed to anchor new roots against the rain.', 5, 0, -1, 'stormRoots', 'Doggy plants roots in the rushing rain. The gardens hold, but the stranded family must find their own way. You cannot care for everything at once.'),
      choice('storm-run', 'Protect only your supplies', 'Keep moving and gather seeds washed down the hillside.', -8, -2, 2, 'stormAlone', 'You reach the summit with your supplies. The unanswered voices fade into the rain. Saving something is different from saving everyone.'),
    ] },
  { title: 'The heart of a little planet', place: 'Sunflower Summit', lead: 'all', theme: 'heart', subtitle: 'Every little choice has brought you here.',
    story: s => `At the summit, the Sunflower flickers inside a tired little planet. ${s.karma >= 6 ? 'The river, the forest, and the village answer with a gentle chorus. The kindness you gave away has found its way back.' : s.karma < 0 ? 'The hills are quiet. The planet remembers what was taken, but there is still time to give something back.' : 'A few lights answer from the valley. Even unfinished kindness can begin again.'} Your friends stand beside you. What will you offer?`,
    quote: '“The world remembers. What shall we ask it to remember?”',
    choices: [
      choice('heart-seed', 'Give the Sunflower a new beginning', 'Plant one seed and trust the life you helped along the way.', 18, 3, -1, 'heartPlanted', 'Your seed takes root in the Sunflower. Lumi, Kitty, Doggy, and Nomie hold hands and paws. Life begins to travel through the planet again.', { bonus: s => s.flags.riverClear && s.flags.forestFed ? { health: 6, text: 'Clean water and living forest roots carry your gift around the entire planet.' } : { health: 0, text: '' } }),
      choice('heart-light', 'Give back your gathered starlight', 'Offer six found glimmers to warm the Sunflower.', 16, 2, 0, 'heartLit', 'You open your palms. Every little glimmer you noticed becomes one warm light. The Sunflower answers.', { requiresGlimmers: 6 }),
      choice('heart-song', 'Sing the planet awake together', 'Offer the voices and friendship you have built.', 8, 1, 0, 'heartSung', 'Four small voices rise into the dawn. The planet listens. A song cannot undo every wound, but it can promise that tomorrow will be different.', { bonus: s => s.flags.community && s.flags.rescued ? { health: 8, text: 'The neighbours and family you helped join the song. Together, your voices reach every valley.' } : { health: 0, text: '' } }),
      choice('heart-force', 'Force the Sunflower to bloom', 'Take its remaining magic for a sudden, dazzling burst.', -15, -3, 0, 'heartForced', 'The Sunflower shines for a moment, then dims. Nomie cups its last spark gently. Life grows by being cared for, not by being commanded.'),
    ] },
];

export const freshState = () => ({ version: 1, chapter: 0, phase: 'choice', health: 30, karma: 0, seeds: 2, glimmers: 0, flags: {}, collected: [], history: [], repairs: [], events: [] });
export const available = (c, s) => s.seeds + c.seeds >= 0 && (!c.requiresGlimmers || s.glimmers >= c.requiresGlimmers);
export const endingFor = s => s.health >= 75 && s.karma >= 6 ? 'bloom' : s.health >= 45 && s.karma >= 0 ? 'hope' : 'mend';
export const ENDINGS = {
  bloom: { title: 'And the world bloomed again.', label: 'THE BLOOMING WORLD', text: 'Rivers sing. Forests stretch their roots. Gardens hum with bees. From the tiniest village to the farthest sea, your choices have become a living promise. The planet is saved, and four little friends have shown that a small kindness can travel a very long way.' },
  hope: { title: 'A brighter tomorrow took root.', label: 'THE GROWING WORLD', text: 'The Sunflower lives. Some valleys still need care, but gardens are growing and lights are returning. Your friends stay to finish the work, one shared seed and one mended lantern at a time. The planet has a future because you gave it a beginning.' },
  mend: { title: 'There was still a spark.', label: 'THE WORLD THAT NEEDS YOU', text: 'The Sunflower is alive, but fragile. The planet carries the weight of what was left behind. Lumi, Kitty, Doggy, and Nomie choose to stay. A story need not end where it went wrong. You can return, make amends, and help the world grow again.' },
};
export const REPAIRS = [
  { id: 'river', title: 'Return to clean the river', text: 'Lumi and you collect every bottle and ribbon. The water begins to move again.' },
  { id: 'forest', title: 'Replant and shelter the woodland', text: 'Kitty finds safe homes, Doggy plants new roots, and the hillside begins to heal.' },
  { id: 'village', title: 'Help Nomie rebuild together', text: 'Your whole team repairs the village. The last spark becomes a light worth sharing.' },
];
simplifyStory(CHAPTERS, ENDINGS, CAST);
export function transition(state, event, replay = false) {
  const s = structuredClone(state);
  if (!event || typeof event.type !== 'string') throw new Error('Invalid action');
  if (event.type === 'collect') {
    if (s.phase !== 'choice' || !Number.isInteger(event.spot) || event.spot < 0 || event.spot > 2) throw new Error('Not a collectable');
    const key = `${s.chapter}:${event.spot}`;
    if (s.collected.includes(key)) throw new Error('Already collected');
    s.collected.push(key); s.glimmers++;
    if (s.collected.filter(k => k.startsWith(`${s.chapter}:`)).length === 3) s.seeds++;
  } else if (event.type === 'choose') {
    if (s.phase !== 'choice') throw new Error('This page already has a choice');
    const c = CHAPTERS[s.chapter].choices.find(c => c.id === event.id);
    if (!c || !available(c, s)) throw new Error('Choice unavailable');
    const bonus = c.bonus?.(s) || { health: 0, text: '' };
    s.health = Math.max(0, Math.min(100, s.health + c.health + bonus.health));
    s.karma += c.karma; s.seeds += c.seeds; s.flags[c.flag] = true;
    if (c.requiresGlimmers) s.glimmers -= c.requiresGlimmers;
    s.history.push({ chapter: s.chapter, id: c.id, title: c.title, reply: c.reply, bonus: bonus.text, health: c.health + bonus.health, karma: c.karma, seeds: c.seeds });
    s.phase = 'reflection';
  } else if (event.type === 'next') {
    if (s.phase !== 'reflection') throw new Error('Choose before turning the page');
    s.chapter++; s.phase = s.chapter === CHAPTERS.length ? 'ending' : 'choice';
  } else if (event.type === 'repair') {
    if (s.phase !== 'ending' || s.repairs.includes(event.id) || !REPAIRS.some(r => r.id === event.id) || (endingFor(s) !== 'mend' && !s.repairs.length)) throw new Error('Repair unavailable');
    s.repairs.push(event.id); s.health = Math.min(100, s.health + 22); s.karma += 4;
  } else throw new Error('Unknown action');
  if (!replay) s.events.push(event);
  return s;
}
export function restoreSave(raw) {
  const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (saved?.version !== 1 || !Array.isArray(saved.events) || saved.events.length > 80) throw new Error('Unsupported save');
  let s = freshState();
  for (const event of saved.events) s = transition(s, event);
  return s;
}

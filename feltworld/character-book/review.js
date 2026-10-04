'use strict';

const allViews = [
  { id: 'front', label: 'Front', description: 'from the front' },
  { id: 'front-left', label: 'Front left', description: 'at a front three-quarter angle facing image-left, showing their fronts and anatomical right sides' },
  { id: 'left', label: 'Left side', description: 'in profile facing image-left, showing their anatomical right sides' },
  { id: 'back-left', label: 'Rear left', description: 'at a rear three-quarter angle turned toward image-left, showing their backs and anatomical right sides' },
  { id: 'back', label: 'Back', description: 'from the back' },
  { id: 'back-right', label: 'Rear right', description: 'at a rear three-quarter angle turned toward image-right, showing their backs and anatomical left sides' },
  { id: 'right', label: 'Right side', description: 'in profile facing image-right, showing their anatomical left sides' },
  { id: 'front-right', label: 'Front right', description: 'at a front three-quarter angle facing image-right, showing their fronts and anatomical left sides' },
];

const byId = id => document.getElementById(id);
const mainImage = byId('main-image');
const angleSelect = byId('angle-select');
const angleButtons = byId('angle-buttons');
const dialog = byId('image-dialog');
const dialogImage = byId('dialog-image');
const zoomArea = byId('zoom-area');
const zoomButton = byId('zoom-button');
let currentIndex = 0;
let enlarged = false;

const query = new URLSearchParams(location.search);
const isNomie = ['nomie', 'nami'].includes(query.get('character'));
// Jack's approved bagless views retain their native image dimensions.
const isJack = query.get('character') === 'jack';
const jackTinkerer = isJack && query.get('appearance') === 'tinkerer';
const jackCasual = isJack && query.get('appearance') === 'casual';
const placeholderCharacter = ['doggy','kitty'].includes(query.get('character')) ? query.get('character') : null;
const placeholderName = placeholderCharacter === 'doggy' ? 'Doggy' : 'Kitty';
const isLumi = query.get('character') === 'lumi';
// Retired Rainbow magic & hat links resolve to the approved hatless Rainbow Magic.
if (isNomie && query.get('appearance') === 'magic-hat') {
  query.set('appearance', 'magic');
  history.replaceState(null, '', location.pathname + '?' + query.toString() + location.hash);
}
const nomieAppearance = isNomie && ['hat', 'magic'].includes(query.get('appearance')) ? query.get('appearance') : 'natural';
const nomieNatural = isNomie && nomieAppearance === 'natural';
const nomieHat = isNomie && nomieAppearance === 'hat';
const nomieCasting = isNomie && nomieAppearance === 'magic';
const appearance = isLumi && ['hat-scarf', 'original', 'merkabah'].includes(query.get('appearance')) ? query.get('appearance') : 'plain';
const isMerkabah = isLumi && appearance === 'merkabah';
const views = allViews;
for (const option of [...angleSelect.options]) { if (!views.some(view => view.id === option.value)) option.remove(); }
const isDressed = isLumi && appearance === 'hat-scarf';
const isOriginal = isLumi && appearance === 'original';
const viewCount = views.length;
const imageRevision = jackCasual ? '20261004-jack-casual-v1' : jackTinkerer ? '20261004-jack-tinkerer-v1' : isJack ? '20261004-jack-crossed-arms-v2' : nomieCasting ? '20261004-nomie-magic-v5-approved' : isMerkabah ? '20261004-lumi-merkabah-v4' : nomieHat ? '20261004-nomie-hat-v2-approved' : isNomie ? '20261004-nomie-natural-v7' : isDressed ? '20261004-lumi-v35-aligned' : isOriginal ? '20261004-lumi-original-v4' : isLumi ? '20261004-lumi-v22' : '20261004-group-cast-v7';
const characterName = placeholderCharacter ? placeholderName : isJack ? 'Jack' : isNomie ? 'Nomie' : isLumi ? 'Lumi' : 'all five characters';
const imageSize = placeholderCharacter ? [600,600] : isJack ? null : nomieCasting ? null : isMerkabah ? [400, 560] : nomieHat ? null : isNomie ? null : isDressed ? [480, 600] : isOriginal ? null : isLumi ? [362, 543] : [1536, 1024];
for (const link of document.querySelectorAll('[data-character]')) {
  if (link.dataset.character === (placeholderCharacter || (isJack ? 'jack' : isNomie ? 'nomie' : isLumi ? 'lumi' : 'all'))) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
}
document.body.classList.toggle('single-character', !!placeholderCharacter || isJack || isLumi || isNomie);
document.body.classList.toggle('dressed-character', isDressed);
byId('appearance-nav').hidden = !isLumi;
byId('nomie-appearance-nav').hidden = !isNomie;
byId('jack-appearance-nav').hidden = !isJack;
for (const link of document.querySelectorAll('[data-jack-appearance]')) {
 if (link.dataset.jackAppearance === (jackCasual ? 'casual' : jackTinkerer ? 'tinkerer' : 'bagless')) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
}
for (const link of document.querySelectorAll('[data-nomie-appearance]')) {
 if (link.dataset.nomieAppearance === nomieAppearance) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
}
for (const link of document.querySelectorAll('[data-appearance]')) {
  if (link.dataset.appearance === appearance) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
}
document.querySelector('.navigation').hidden = false;
angleButtons.hidden = false;
byId('view-help').textContent = 'Use the arrows or choose an angle. Tap the image to enlarge.';
byId('character-caption').textContent = placeholderCharacter ? `${placeholderName} · Angle artwork to come` : jackCasual ? 'Jack · Casual' : jackTinkerer ? 'Jack · Magical tinkerer' : isJack ? 'Jack · Crossed arms' : nomieCasting ? 'Nomie · Rainbow magic' : isMerkabah ? 'Lumi · Rainbow & crystal merkabah' : nomieHat ? 'Nomie · Natural braids & hat' : isNomie ? 'Nomie · Natural hair · Floral scarf' : isDressed ? 'Lumi · Hat & scarf' : isOriginal ? 'Lumi · Original' : isLumi ? 'Lumi · Plain · No clothing or accessories' : 'Kitty, Lumi, Doggy, Nomie and Jack';
byId('merkabah-sheet').hidden = !isMerkabah;
byId('lumi-sheet').hidden = !isLumi || appearance !== 'plain';
const imageFolder = jackCasual ? 'jack-casual-v1/' : jackTinkerer ? 'jack-tinkerer-v1/' : isJack ? 'jack-crossed-arms-v2/' : nomieCasting ? 'nomie-magic-v5/' : isMerkabah ? 'lumi-merkabah-v4/' : nomieHat ? 'nomie-natural-hat-v2/' : isNomie ? 'nomie-natural-v7/' : isDressed ? 'lumi-hat-scarf-v35/' : isOriginal ? 'lumi-original-v4/' : isLumi ? 'lumi-plain-v22/' : 'group-cast-v7/';
const placeholderURL = view => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect x="50" y="50" width="500" height="500" rx="8" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-opacity=".5" stroke-dasharray="5 8"/><text x="300" y="275" text-anchor="middle" font-family="system-ui,sans-serif" font-size="30" fill="#888888">${placeholderName}</text><text x="300" y="320" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" fill="#888888">${view.label}</text><text x="300" y="355" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="#888888">Image placeholder</text></svg>`);
const imageURL = view => placeholderCharacter ? placeholderURL(view) : `images/${imageFolder}${view.id}.png?v=${imageRevision}`;
const displayURL = view => (nomieCasting || nomieNatural || nomieHat || (isJack && !jackCasual && !jackTinkerer)) ? imageURL(view) : `display-images/${imageFolder}${view.id}.webp?v=display-20261004`;
const imageAlt = view => placeholderCharacter ? `${placeholderName}, ${view.label.toLowerCase()} image placeholder. Character artwork has not been added yet.` : jackCasual ? `Jack, ${view.label.toLowerCase()} view, in a cream T-shirt, short green gnome cap, grey jersey sweatpants with a charcoal right-knee patch and oatmeal left-knee patch, and knitted socks; one dark band on his right middle finger where visible, orange pendant at the front.` : jackTinkerer ? `Jack, ${view.label.toLowerCase()} view, with brass goggles, a wood-and-brass mallet and a leather tool bag carrying human-sized sewing finds: needle, buttons, spool, thimble, measuring tape and closed safety pin.` : isJack ? `Jack, viewed ${view.description}, in his green-and-orange gnome hat, woodland outfit and boots, with crossed arms, brown knee patches and no bag; his orange pendant is visible from the front.` : nomieCasting ? `Nomie, ${view.label.toLowerCase()} view, gently casting magic with open palms and long loose rainbow wool hair fading from a light pastel crown to richer coloured lengths with opalescent holographic highlights; mature longer-legged proportions, sage-grey floral dress and brown boots, no scarf, hat or handheld accessories.` : isMerkabah ? `Rainbow Lumi, viewed ${view.description}, gently glowing with a glass-crystal merkabah floating above his head across a clear air gap.` : nomieHat ? `Nomie, ${view.label.toLowerCase()} view, wearing her tall red floral felt hat, red floral scarf, sage-grey floral dress, cream knitted socks and fitted brown boots; natural brown-blonde hair, exactly two rear braids, longer legs and slimmer empty hands.` : isNomie ? `Nomie, ${view.label.toLowerCase()} view, with natural brown-to-blonde hair, two rear braids, red floral scarf, sage-grey floral dress and brown boots; no hat or handheld accessories.` : isDressed ? `Blue Lumi, viewed ${view.description}, wearing the multicoloured floppy hat with coral pompom and matching scarf with one golden star centred on the scarf front; swept hairstyle visible.` : isOriginal ? `Original Lumi, viewed ${view.description}, cropped from the original full-cast artwork.` : isLumi ? `Plain Lumi, viewed ${view.description}, without clothing or accessories.` : `Lumi, Kitty, Doggy, Nomie and Jack together, viewed ${view.description}, in their current default outfits.`;

function setImageSize(img) {
  const size = imageSize || [img.naturalWidth, img.naturalHeight];
  if (size[0] && size[1]) { img.width = size[0]; img.height = size[1]; }
}
for (const img of [mainImage, dialogImage]) {
  setImageSize(img);
  img.addEventListener('load', () => setImageSize(img));
}

for (const [index, view] of views.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'angle-button';
  button.dataset.index = String(index);
  button.setAttribute('aria-label', `Show ${view.label.toLowerCase()} view of ${characterName}`);
  button.setAttribute('aria-pressed', 'false');
  const thumbnail = document.createElement('img');
  thumbnail.src = displayURL(view);
  thumbnail.alt = '';
  setImageSize(thumbnail);
  thumbnail.addEventListener('load', () => setImageSize(thumbnail));
  thumbnail.loading = 'lazy';
  thumbnail.decoding = 'async';
  const label = document.createElement('span');
  label.textContent = view.label;
  button.append(thumbnail, label);
  button.addEventListener('click', () => showView(index));
  angleButtons.append(button);
}

function setZoom(value) {
  enlarged = value;
  zoomArea.classList.toggle('is-zoomed', enlarged);
  zoomButton.setAttribute('aria-pressed', String(enlarged));
  zoomButton.textContent = enlarged ? 'Fit image' : 'Zoom in';
  zoomArea.scrollTo(0, 0);
}

let mainLoadVersion = 0;
let detailLoadVersion = 0;
function loadMain(view) {
  const version = ++mainLoadVersion;
  mainImage.hidden = true;
  byId('enlarge-button').disabled = true;
  byId('enlarge-button').setAttribute('aria-busy', 'true');
  byId('image-loader').hidden = false;
  byId('image-loader').textContent = 'Loading image…';
  byId('image-status').textContent = `Loading ${characterName} · ${view.label.toLowerCase()}…`;
  const pending = new Image();
  pending.onload = async () => {
    try { await pending.decode(); } catch {}
    if (version !== mainLoadVersion) return;
    mainImage.src = pending.src;
    mainImage.hidden = false;
    byId('image-loader').hidden = true;
    byId('enlarge-button').disabled = false;
    byId('enlarge-button').setAttribute('aria-busy', 'false');
    byId('image-status').textContent = '';
    // Only the two neighbouring small display files are warmed in the background.
    if (!navigator.connection?.saveData) for (const offset of [-1,1]) {
      const nearby = new Image(); nearby.src = displayURL(views[(currentIndex + offset + views.length) % views.length]);
    }
  };
  pending.onerror = () => {
    if (version !== mainLoadVersion) return;
    byId('image-loader').textContent = 'Image unavailable';
    byId('enlarge-button').setAttribute('aria-busy', 'false');
    byId('image-status').textContent = 'This image could not be loaded. Try another angle or refresh.';
  };
  pending.src = displayURL(view);
}
function loadDetail(view) {
  const version = ++detailLoadVersion;
  dialogImage.hidden = true;
  byId('detail-status').hidden = false;
  byId('detail-status').textContent = 'Loading full-resolution image…';
  zoomButton.disabled = true;
  const pending = new Image();
  pending.onload = async () => {
    try { await pending.decode(); } catch {}
    if (version !== detailLoadVersion || !dialog.open) return;
    dialogImage.src = pending.src;
    dialogImage.hidden = false;
    byId('detail-status').hidden = true;
    zoomButton.disabled = false;
  };
  pending.onerror = () => {
    if (version !== detailLoadVersion) return;
    byId('detail-status').textContent = 'The full-resolution image could not be loaded. Close and try again.';
  };
  pending.src = imageURL(view);
}

function showView(index, updateHash = true) {
  currentIndex = (index + views.length) % views.length;
  const view = views[currentIndex];
  const src = imageURL(view);
  const alt = imageAlt(view);
  byId('view-title').textContent = view.label;
  byId('view-count').textContent = `${currentIndex + 1} / ${viewCount}`;
  byId('view-count').setAttribute('aria-label', `Image ${currentIndex + 1} of ${viewCount}`);
  byId('dialog-title').textContent = view.label;
  byId('enlarge-button').setAttribute('aria-label', `Enlarge ${view.label.toLowerCase()} view of ${characterName}`);
  byId('original-link').href = src;
  byId('download-link').href = src;
  byId('download-link').download = `${jackCasual ? "jack-casual-" : jackTinkerer ? "jack-tinkerer-" : isJack ? "jack-bagless-" : nomieCasting ? "nomie-rainbow-magic-" : isMerkabah ? "lumi-merkabah-" : nomieHat ? "nomie-natural-hat-" : isNomie ? "nomie-natural-" : isDressed ? "lumi-hat-scarf-" : isOriginal ? "lumi-original-" : isLumi ? "lumi-plain-" : ""}${view.id}.png`;
  byId('image-status').textContent = '';
  mainImage.alt = alt;
  loadMain(view);
  dialogImage.alt = alt;
  if (dialog.open) loadDetail(view);
  angleSelect.value = view.id;
  for (const button of angleButtons.children) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.index) === currentIndex));
  }
  document.title = `${placeholderCharacter ? placeholderName + " · " : isJack ? "Jack · " : isNomie ? "Nomie · " : isLumi ? "Lumi · " : ""}${view.label} · Character book`;
  setZoom(false);
  if (updateHash && location.hash !== `#${view.id}`) {
    history.replaceState(null, '', `#${view.id}`);
  }
}

function readHash() {
  const index = views.findIndex(view => `#${view.id}` === location.hash);
  showView(index < 0 ? 0 : index, false);
}

byId('previous-button').addEventListener('click', () => showView(currentIndex - 1));
byId('next-button').addEventListener('click', () => showView(currentIndex + 1));
angleSelect.addEventListener('change', () => showView(views.findIndex(view => view.id === angleSelect.value)));
window.addEventListener('hashchange', readHash);
mainImage.addEventListener('error', () => {
  byId('image-status').textContent = 'This image could not be loaded. Try another angle or refresh.';
});
mainImage.addEventListener('load', () => { byId('image-status').textContent = ''; });

byId('enlarge-button').addEventListener('click', () => {
  if (typeof dialog.showModal !== 'function') {
    window.open(imageURL(views[currentIndex]), '_blank', 'noopener');
    return;
  }
  setZoom(false);
  dialog.showModal();
  loadDetail(views[currentIndex]);
  document.body.classList.add('dialog-open');
});
byId('close-button').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  ++detailLoadVersion;
  document.body.classList.remove('dialog-open');
  setZoom(false);
  byId('enlarge-button').focus();
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});
zoomButton.addEventListener('click', () => setZoom(!enlarged));

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const tag = event.target.tagName;
  if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return;
  if (dialog.open) return; // Arrow keys pan a zoomed image inside the dialog.
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showView(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});

readHash();

if (placeholderCharacter) { byId('original-link').hidden = true; byId('download-link').hidden = true; }



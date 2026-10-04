'use strict';

const allViews = [
  { id: 'front', label: 'Front', description: 'from the front' },
  { id: 'front-left', label: 'Left three-quarter', description: 'at a front three-quarter angle facing image-left, showing their fronts and anatomical right sides' },
  { id: 'left', label: 'Left side', description: 'in profile facing image-left, showing their anatomical right sides' },
  { id: 'back-left', label: 'Left rear three-quarter', description: 'at a rear three-quarter angle turned toward image-left, showing their backs and anatomical right sides' },
  { id: 'back', label: 'Back', description: 'from the back' },
  { id: 'back-right', label: 'Right rear three-quarter', description: 'at a rear three-quarter angle turned toward image-right, showing their backs and anatomical left sides' },
  { id: 'right', label: 'Right side', description: 'in profile facing image-right, showing their anatomical left sides' },
  { id: 'front-right', label: 'Right three-quarter', description: 'at a front three-quarter angle facing image-right, showing their fronts and anatomical left sides' },
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
const isLumi = query.get('character') === 'lumi';
const nomieAppearance = isNomie && ['hat', 'magic-hat', 'magic'].includes(query.get('appearance')) ? query.get('appearance') : 'natural';
const nomieHat = isNomie && ['hat', 'magic-hat'].includes(nomieAppearance);
const nomieCasting = isNomie && nomieAppearance === 'magic';
const nomieMagic = isNomie && nomieAppearance === 'magic-hat';
const appearance = isLumi && ['hat-scarf', 'original', 'merkabah'].includes(query.get('appearance')) ? query.get('appearance') : 'plain';
const isMerkabah = isLumi && appearance === 'merkabah';
const views = allViews;
for (const option of [...angleSelect.options]) { if (!views.some(view => view.id === option.value)) option.remove(); }
const isDressed = isLumi && appearance === 'hat-scarf';
const isOriginal = isLumi && appearance === 'original';
const viewCount = views.length;
const imageRevision = nomieCasting ? '20261004-nomie-casting-v4-cropfix' : isMerkabah ? '20261004-lumi-merkabah-v4' : nomieHat ? '20261004-nomie-hat-v1' : isNomie ? '20261004-nomie-v6' : isDressed ? '20261004-lumi-v35-aligned' : isOriginal ? '20261004-lumi-original-v4' : isLumi ? '20261004-lumi-v22' : '20261004-group-cast-v7';
const characterName = isNomie ? 'Nomie' : isLumi ? 'Lumi' : 'all five characters';
const imageSize = nomieCasting ? [384, 600] : isMerkabah ? [400, 560] : nomieHat ? [400, 660] : isNomie ? [314, 600] : isDressed ? [480, 600] : isOriginal ? null : isLumi ? [362, 543] : [1536, 1024];
for (const link of document.querySelectorAll('[data-character]')) {
  if (link.dataset.character === (isNomie ? 'nomie' : isLumi ? 'lumi' : 'all')) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
}
document.body.classList.toggle('single-character', isLumi || isNomie);
document.body.classList.toggle('dressed-character', isDressed);
byId('appearance-nav').hidden = !isLumi;
byId('nomie-appearance-nav').hidden = !isNomie;
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
byId('character-caption').textContent = nomieCasting ? 'Nomie · Rainbow magic' : isMerkabah ? 'Lumi · Rainbow & crystal merkabah' : nomieMagic ? 'Nomie · Rainbow magic & hat' : nomieHat ? 'Nomie · Natural braids & hat' : isNomie ? 'Nomie · Natural hair · Floral scarf' : isDressed ? 'Lumi · Hat & scarf' : isOriginal ? 'Lumi · Original' : isLumi ? 'Lumi · Plain · No clothing or accessories' : 'Kitty, Lumi, Doggy, Nomie and Jack';
byId('merkabah-sheet').hidden = !isMerkabah;
byId('lumi-sheet').hidden = !isLumi || appearance !== 'plain';
const imageFolder = nomieCasting ? 'nomie-magic-casting-v4/' : isMerkabah ? 'lumi-merkabah-v4/' : nomieMagic ? 'nomie-magic-hat-v1/' : nomieHat ? 'nomie-natural-hat-v1/' : isNomie ? 'nomie-natural-v6/' : isDressed ? 'lumi-hat-scarf-v35/' : isOriginal ? 'lumi-original-v4/' : isLumi ? 'lumi-plain-v22/' : 'group-cast-v7/';
const imageURL = view => `images/${imageFolder}${view.id}.png?v=${imageRevision}`;
const imageAlt = view => nomieCasting ? `Nomie, viewed ${view.description}, gently casting magic with open palms and long luminous flowing pastel rainbow hair; sage-grey floral dress and brown boots, no scarf, hat or handheld accessories.` : isMerkabah ? `Rainbow Lumi, viewed ${view.description}, gently glowing with a glass-crystal merkabah floating above his head across a clear air gap.` : nomieHat ? `Nomie, viewed ${view.description}, wearing her tall red floral gnome hat, red floral scarf, sage-grey dress and brown boots, with ${nomieMagic ? 'long loose pastel rainbow hair and gentle loving magical shimmer' : 'natural brown-blonde hair and two rear braids'}.` : isNomie ? `Nomie, viewed ${view.description}, with natural brown-to-blonde hair, two rear braids, red floral scarf, sage-grey floral dress and brown boots; no hat or handheld accessories.` : isDressed ? `Blue Lumi, viewed ${view.description}, wearing the multicoloured floppy hat with coral pompom and matching scarf with one golden star centred on the scarf front; swept hairstyle visible.` : isOriginal ? `Original Lumi, viewed ${view.description}, cropped from the original full-cast artwork.` : isLumi ? `Plain Lumi, viewed ${view.description}, without clothing or accessories.` : `Lumi, Kitty, Doggy, Nomie and Jack together, viewed ${view.description}, in their current default outfits.`;

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
  thumbnail.src = imageURL(view);
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
  byId('download-link').download = `${nomieCasting ? "nomie-rainbow-magic-" : isMerkabah ? "lumi-merkabah-" : nomieMagic ? "nomie-magic-hat-" : nomieHat ? "nomie-natural-hat-" : isNomie ? "nomie-natural-" : isDressed ? "lumi-hat-scarf-" : isOriginal ? "lumi-original-" : isLumi ? "lumi-plain-" : ""}${view.id}.png`;
  byId('image-status').textContent = '';
  mainImage.alt = alt;
  mainImage.src = src;
  dialogImage.alt = alt;
  dialogImage.src = src;
  angleSelect.value = view.id;
  for (const button of angleButtons.children) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.index) === currentIndex));
  }
  document.title = `${isNomie ? "Nomie · " : isLumi ? "Lumi · " : ""}${view.label} · Character book`;
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
  document.body.classList.add('dialog-open');
});
byId('close-button').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
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

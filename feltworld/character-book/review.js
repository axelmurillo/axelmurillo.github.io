'use strict';

const views = [
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

const imageRevision = '20261002-detail-v4';
const imageURL = view => `images/${view.id}.png?v=${imageRevision}`;
const imageAlt = view => `Lumi, Kitty, Doggy, Nomie and Jack together, viewed ${view.description}, in their current default outfits.`;

for (const [index, view] of views.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'angle-button';
  button.dataset.index = String(index);
  button.setAttribute('aria-label', `Show ${view.label.toLowerCase()} view of all five characters`);
  button.setAttribute('aria-pressed', 'false');
  const thumbnail = document.createElement('img');
  thumbnail.src = imageURL(view);
  thumbnail.alt = '';
  thumbnail.width = 1536;
  thumbnail.height = 1024;
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
  byId('view-count').textContent = `${currentIndex + 1} / ${views.length}`;
  byId('view-count').setAttribute('aria-label', `Image ${currentIndex + 1} of ${views.length}`);
  byId('dialog-title').textContent = view.label;
  byId('enlarge-button').setAttribute('aria-label', `Enlarge ${view.label.toLowerCase()} view of all five characters`);
  byId('original-link').href = src;
  byId('download-link').href = src;
  byId('download-link').download = `${view.id}.png`;
  byId('image-status').textContent = '';
  mainImage.alt = alt;
  mainImage.src = src;
  dialogImage.alt = alt;
  dialogImage.src = src;
  angleSelect.value = view.id;
  for (const button of angleButtons.children) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.index) === currentIndex));
  }
  document.title = `${view.label} · Character review`;
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

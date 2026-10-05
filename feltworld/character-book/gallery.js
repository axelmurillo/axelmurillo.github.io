'use strict';
// A preview-only preference key leaves every existing reader/gallery preference alone.
const themeSelect = document.getElementById('theme-select');
const themeKey = 'felt-character-cosmos-theme-v1';
let preferredTheme = 'dark';
try { preferredTheme = localStorage.getItem(themeKey) || 'dark'; } catch {}
function applyTheme(value) {
  const theme = ['system', 'light', 'dark'].includes(value) ? value : 'system';
  document.documentElement.dataset.theme = theme;
  themeSelect.value = theme;
}
applyTheme(preferredTheme);
themeSelect.addEventListener('change', () => {
  applyTheme(themeSelect.value);
  try { localStorage.setItem(themeKey, themeSelect.value); } catch {}
});
let enlargementInvoker = document.getElementById('enlarge-button');
document.getElementById('enlarge-button').addEventListener('click', () => {
  if (document.activeElement !== document.getElementById('enlarge-secondary')) enlargementInvoker = document.getElementById('enlarge-button');
});
document.getElementById('image-dialog').addEventListener('close', () => enlargementInvoker.focus({preventScroll:true}));
document.getElementById('enlarge-secondary').addEventListener('click', () => {
  document.getElementById('enlarge-button').click();
  enlargementInvoker = document.getElementById('enlarge-secondary');
});
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  document.getElementById('gallery').focus({preventScroll:true});
});
document.getElementById('dialog-previous').addEventListener('click', () => showView(currentIndex - 1));
document.getElementById('dialog-next').addEventListener('click', () => showView(currentIndex + 1));
const angleAnnouncement = document.getElementById('angle-announcement');
const angleTitle = document.getElementById('view-title');
new MutationObserver(() => {
  angleAnnouncement.textContent = `${angleTitle.textContent}, ${currentIndex + 1} of ${viewCount}`;
}).observe(angleTitle, {childList:true});
// Each character/appearance opens at its front; explicit angle deep links still work.
document.querySelectorAll('[data-character], [data-appearance], [data-jack-appearance], [data-nomie-appearance]').forEach(link => {
  link.addEventListener('click', () => { link.hash = 'front'; });
});
// Short visual labels keep the compact control readable without reducing its font.
const conciseAngles = {'front-left':'Front left','back-left':'Rear left','back-right':'Rear right','front-right':'Front right'};
Array.from(document.getElementById('angle-select').options).forEach(option => {
  if (!conciseAngles[option.value]) return;
  option.setAttribute('aria-label', option.textContent);
  option.title = option.textContent;
  option.textContent = conciseAngles[option.value];
});

// Pan the zoomed canvas directly with mouse, pen or touch.
const panArea = document.getElementById('zoom-area');
let panGesture = null;
function stopPan() {
  if (panGesture && panArea.hasPointerCapture(panGesture.id)) panArea.releasePointerCapture(panGesture.id);
  panGesture = null;
  panArea.classList.remove('is-panning');
}
panArea.addEventListener('pointerdown', event => {
  if (!panArea.classList.contains('is-zoomed') || !event.isPrimary || event.button !== 0) return;
  event.preventDefault();
  panArea.focus({preventScroll:true});
  panGesture = {id:event.pointerId, x:event.clientX, y:event.clientY, left:panArea.scrollLeft, top:panArea.scrollTop};
  panArea.setPointerCapture(event.pointerId);
  panArea.classList.add('is-panning');
});
panArea.addEventListener('pointermove', event => {
  if (!panGesture || event.pointerId !== panGesture.id) return;
  panArea.scrollLeft = panGesture.left + panGesture.x - event.clientX;
  panArea.scrollTop = panGesture.top + panGesture.y - event.clientY;
});
['pointerup','pointercancel','lostpointercapture'].forEach(type => panArea.addEventListener(type, stopPan));
panArea.addEventListener('keydown', event => {
  if (!panArea.classList.contains('is-zoomed') || event.altKey || event.ctrlKey || event.metaKey) return;
  const moves = {ArrowLeft:[-80,0], ArrowRight:[80,0], ArrowUp:[0,-80], ArrowDown:[0,80]};
  if (!moves[event.key]) return;
  event.preventDefault();
  panArea.scrollBy(...moves[event.key]);
});
let wasZoomed = false;
new MutationObserver(() => {
  const nowZoomed = panArea.classList.contains('is-zoomed');
  if (nowZoomed === wasZoomed) return;
  wasZoomed = nowZoomed;
  stopPan();
  if (panArea.classList.contains('is-zoomed')) {
    panArea.scrollLeft = (panArea.scrollWidth - panArea.clientWidth) / 2;
    panArea.scrollTop = (panArea.scrollHeight - panArea.clientHeight) / 2;
    panArea.focus({preventScroll:true});
  } else {
    panArea.scrollLeft = 0;
    panArea.scrollTop = 0;
  }
}).observe(panArea, {attributes:true, attributeFilter:['class']});

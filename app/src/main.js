// Neon Coast Cover Studio — wires the editor: photos, layout, grade, lettering,
// per-panel crop, effects and PNG export in the three common post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, renderCoverToCanvas, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const panelSelect = document.getElementById('panel');
const panelPhotoSelect = document.getElementById('panelPhoto');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panX');
const panYInput = document.getElementById('panY');
const sizeSelect = document.getElementById('size');

export const EXPORT_SIZES = [
  { label: '1080x1080', w: 1080, h: 1080 },
  { label: '1080x1350', w: 1080, h: 1350 },
  { label: '1920x1080', w: 1920, h: 1080 },
];

/** The whole cover state: layout, grade, lettering, the two photos and each
 *  panel's crop (which photo, zoom, pan). */
export const state = {
  layout: 'grid',
  grade: 'sunset',
  caption: 'Vice City Nights',
  subtitle: 'Neon Coast · Est. 2026',
  photos: [null, null],
  panels: [
    { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
    { photo: 1, zoom: 1.15, ox: 0, oy: 0 },
    { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
    { photo: 1, zoom: 1.15, ox: 0, oy: 0 },
  ],
  grain: true,
  vignette: true,
};

function redraw() {
  drawCover(canvas, state);
  syncPanelControls();
}

/** The panel picker only offers panels the current layout actually shows. */
function syncPanelControls() {
  const count = LAYOUTS[state.layout].panels;
  [...panelSelect.options].forEach((opt) => {
    opt.disabled = Number(opt.value) >= count;
  });
  if (Number(panelSelect.value) >= count) panelSelect.value = '0';
  const panel = state.panels[Number(panelSelect.value)];
  panelPhotoSelect.value = String(panel.photo);
  zoomInput.value = String(panel.zoom);
  panXInput.value = String(panel.ox);
  panYInput.value = String(panel.oy);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

async function loadSample(slot, name) {
  state.photos[slot] = await loadImage(`samples/${name}.jpg`);
  redraw();
}

function downloadCanvas(exportCanvas, filename) {
  return new Promise((resolve) => {
    exportCanvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve();
    }, 'image/png');
  });
}

async function exportSize(size) {
  const out = renderCoverToCanvas(size.w, size.h, state);
  await downloadCanvas(out, `neon-coast-cover-${size.label}.png`);
  return out;
}

document.getElementById('photoA').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.photos[0] = await loadImage(URL.createObjectURL(file));
  redraw();
});
document.getElementById('photoB').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.photos[1] = await loadImage(URL.createObjectURL(file));
  redraw();
});
document.getElementById('samples').addEventListener('click', async () => {
  await loadSample(0, 'pier');
  await loadSample(1, 'boulevard');
  status.textContent = 'Sample photos loaded — pier in Photo A, boulevard in Photo B.';
});

document.getElementById('layouts').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-layout]');
  if (!btn) return;
  state.layout = btn.dataset.layout;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b === btn));
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-grade]');
  if (!btn) return;
  state.grade = btn.dataset.grade;
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b === btn));
  redraw();
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
panelSelect.addEventListener('change', syncPanelControls);
panelPhotoSelect.addEventListener('change', () => {
  state.panels[Number(panelSelect.value)].photo = Number(panelPhotoSelect.value);
  redraw();
});
zoomInput.addEventListener('input', () => { state.panels[Number(panelSelect.value)].zoom = Number(zoomInput.value); redraw(); });
panXInput.addEventListener('input', () => { state.panels[Number(panelSelect.value)].ox = Number(panXInput.value); redraw(); });
panYInput.addEventListener('input', () => { state.panels[Number(panelSelect.value)].oy = Number(panYInput.value); redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });
sizeSelect.addEventListener('change', () => {
  const [w, h] = sizeSelect.value.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  redraw();
});
document.getElementById('export').addEventListener('click', async () => {
  const [w, h] = sizeSelect.value.split('x').map(Number);
  await exportSize({ label: `${w}x${h}`, w, h });
  status.textContent = `Saved neon-coast-cover-${w}x${h}.png`;
});
document.getElementById('exportAll').addEventListener('click', async () => {
  for (const size of EXPORT_SIZES) {
    await exportSize(size);
    await new Promise((r) => setTimeout(r, 250));
  }
  status.textContent = 'Saved all 3 sizes: 1080x1080, 1080x1350 and 1920x1080.';
});

/** Applies a named preset (from shots.js) onto the live state and redraws. */
export function applyPreset(preset) {
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.caption = preset.caption;
  state.subtitle = preset.subtitle;
  captionInput.value = preset.caption;
  subtitleInput.value = preset.subtitle;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === preset.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === preset.grade));
  if (preset.size) {
    sizeSelect.value = preset.size;
    const [w, h] = preset.size.split('x').map(Number);
    canvas.width = w;
    canvas.height = h;
  }
  if (preset.panels) state.panels = preset.panels.map((p) => ({ ...p }));
  redraw();
}

/** Screenshot hooks: export the true PNG bytes, and switch scenes in place. */
window.__exportPNG = async (w, h, presetName) => {
  if (presetName) {
    const { PRESETS } = await import('./shots.js');
    if (PRESETS[presetName]) applyPreset(PRESETS[presetName]);
  }
  return renderCoverToCanvas(w, h, state).toDataURL('image/png');
};
window.__setShot = async (name) => {
  const query = new URLSearchParams();
  await runShot(name, query, { applyPreset, loadSample, redraw });
  window.__shotReady = true;
};

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), { applyPreset, loadSample, redraw });
} else {
  // First visit: load the samples so the editor opens with a cover, not a blank.
  loadSample(0, 'pier').then(() => loadSample(1, 'boulevard'));
  redraw();
}

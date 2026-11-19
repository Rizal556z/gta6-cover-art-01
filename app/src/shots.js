// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// ?shot=editor shows the page with a sample photo loaded, ?shot=variant and
// ?shot=portrait show other covers. `photo` picks the sample for Photo A and
// `caption` the words; window.__shotReady is set once painted.
export const PRESETS = {
  cover: {
    layout: 'hero', grade: 'sunset', caption: 'Vice City Nights', subtitle: 'Neon Coast · Est. 2026',
    size: '1920x1080',
    panels: [
      { photo: 0, zoom: 1.0, ox: 0, oy: 1.0 },
      { photo: 1, zoom: 1.2, ox: 0, oy: 1.05 },
      { photo: 0, zoom: 1.35, ox: 0.08, oy: 0.85 },
      { photo: 1, zoom: 1.3, ox: -0.06, oy: 1.15 },
    ],
  },
  editor: {
    layout: 'grid', grade: 'sunset', caption: 'Sunset Heist', subtitle: 'Neon Coast · Est. 2026',
    size: '1080x1080',
    panels: [
      { photo: 0, zoom: 1.15, ox: 0, oy: 0.05 },
      { photo: 1, zoom: 1.15, ox: 0, oy: 0.3 },
      { photo: 1, zoom: 1.4, ox: 0.1, oy: 0.35 },
      { photo: 0, zoom: 1.3, ox: -0.08, oy: 0.08 },
    ],
  },
  variant: {
    layout: 'grid', grade: 'neon', caption: 'Boulevard Queen', subtitle: 'Vice City · After Dark',
    size: '1080x1080',
    panels: [
      { photo: 1, zoom: 1.0, ox: 0, oy: 0.2 },
      { photo: 0, zoom: 1.05, ox: 0, oy: 0.05 },
      { photo: 0, zoom: 1.15, ox: 0.06, oy: 0.08 },
      { photo: 1, zoom: 1.15, ox: -0.05, oy: 0.3 },
    ],
  },
  portrait: {
    layout: 'split', grade: 'warm', caption: 'Golden Hour', subtitle: 'Vice City · Golden Hour',
    size: '1080x1350',
    panels: [
      { photo: 0, zoom: 1.1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.25, ox: 0, oy: 0 },
      { photo: 0, zoom: 1.3, ox: 0.07, oy: 0 },
      { photo: 1, zoom: 1.2, ox: 0, oy: 0 },
    ],
  },
};

/** Sets up a named shot: cover-only scenes hide the controls, editor scenes
 *  keep them. Loads the samples, applies the preset, then marks the shot ready. */
export async function runShot(shot, query, api) {
  const preset = PRESETS[shot] || PRESETS.editor;
  if (shot === 'cover' || shot === 'variant' || shot === 'portrait') {
    document.body.classList.add('shot-cover');
  } else {
    document.body.classList.remove('shot-cover');
  }
  const photoA = query.get('photo') ?? 'pier';
  const photoB = photoA === 'pier' ? 'boulevard' : 'pier';
  await api.loadSample(0, photoA);
  await api.loadSample(1, photoB);
  const override = { ...preset };
  if (query.get('caption')) override.caption = query.get('caption');
  if (query.get('subtitle')) override.subtitle = query.get('subtitle');
  if (query.get('layout')) override.layout = query.get('layout');
  if (query.get('grade')) override.grade = query.get('grade');
  api.applyPreset(override);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

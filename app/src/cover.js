// Neon Coast Cover Studio — the cover renderer. Draws a GTA 6-style multi-panel
// poster onto any canvas: panel photos with per-panel crop and zoom, a Vice City
// colour grade, bold caption lettering, film grain and a vignette. No network,
// no fonts to load — heavy system weights only, so the cover is original art.

/** Colour grades: panel tint, caption ink, accent bar and caption-band colour. */
export const GRADES = {
  sunset: { name: 'Vice Sunset', tintTop: 'rgba(255,122,61,0.10)', tintBottom: 'rgba(255,46,136,0.42)', glow: 'rgba(255,170,80,0.28)', caption: '#ffffff', accent: '#ff7a3d', band: '#170a24', sub: '#ffd9c2' },
  neon: { name: 'Neon Nights', tintTop: 'rgba(123,92,255,0.16)', tintBottom: 'rgba(255,46,136,0.46)', glow: 'rgba(64,224,255,0.22)', caption: '#ffffff', accent: '#40e0ff', band: '#0d0620', sub: '#c9f4ff' },
  warm: { name: 'Warm Gold', tintTop: 'rgba(255,190,80,0.14)', tintBottom: 'rgba(214,120,20,0.40)', glow: 'rgba(255,220,120,0.26)', caption: '#fff8ec', accent: '#ffc53d', band: '#241204', sub: '#ffe9b8' },
  mono: { name: 'Mono Vice', tintTop: 'rgba(200,200,220,0.06)', tintBottom: 'rgba(40,20,70,0.48)', glow: 'rgba(220,220,255,0.14)', caption: '#ffffff', accent: '#e8e8f2', band: '#101014', sub: '#cfcfe0' },
};

/** Layouts: how many panels, and where each panel sits (fractions of the cover). */
export const LAYOUTS = {
  grid: { panels: 4, name: 'Grid · 4 panels' },
  hero: { panels: 4, name: 'Hero + 3' },
  split: { panels: 3, name: 'Split · 3 panels' },
  full: { panels: 1, name: 'Full bleed' },
};

/** Panel rectangles for a layout at cover size w x h. The caption band is the
 *  bottom slice of the cover; panels fill the space above it. */
export function panelRects(layout, w, h) {
  const gap = Math.max(3, Math.round(Math.min(w, h) * 0.012));
  const bandH = layout === 'full' ? 0 : Math.round(h * 0.16);
  const top = 0;
  const ph = h - bandH;
  const rect = (x, y, rw, rh) => ({ x, y, w: rw, h: rh });
  if (layout === 'grid') {
    const cw = (w - gap * 3) / 2, ch = (ph - gap * 3) / 2;
    return [rect(gap, top + gap, cw, ch), rect(gap * 2 + cw, top + gap, cw, ch),
      rect(gap, top + gap * 2 + ch, cw, ch), rect(gap * 2 + cw, top + gap * 2 + ch, cw, ch)];
  }
  if (layout === 'hero') {
    const heroH = Math.round(ph * 0.62);
    const cw = (w - gap * 4) / 3, ch = ph - heroH - gap * 3;
    return [rect(gap, top + gap, w - gap * 2, heroH),
      rect(gap, top + heroH + gap * 2, cw, ch), rect(gap * 2 + cw, top + heroH + gap * 2, cw, ch),
      rect(gap * 3 + cw * 2, top + heroH + gap * 2, cw, ch)];
  }
  if (layout === 'split') {
    const leftW = Math.round(w * 0.58);
    const cw = w - leftW - gap * 3, ch = (ph - gap * 3) / 2;
    return [rect(gap, top + gap, leftW, ph - gap * 2),
      rect(leftW + gap * 2, top + gap, cw, ch), rect(leftW + gap * 2, top + gap * 2 + ch, cw, ch)];
  }
  return [rect(0, 0, w, h)];
}

/** One reusable grain tile, painted once and stamped at low alpha over the cover. */
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 128; t.height = 128;
  const c = t.getContext('2d');
  const img = c.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  grainTile = t;
  return t;
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
function drawPanelPhoto(ctx, photo, rect, panel, gradeName) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!photo) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#3a2150'); g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    const iw = photo.naturalWidth, ih = photo.naturalHeight;
    const base = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
    const pw = iw * base, ph = ih * base;
    const cx = rect.x + rect.w / 2 + (panel.ox || 0) * rect.w;
    const cy = rect.y + rect.h / 2 + (panel.oy || 0) * rect.h;
    if (gradeName === 'mono') ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.04)';
    ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
    ctx.filter = 'none';
  }
  ctx.restore();
}

/** The grade tint washed over one panel, top to bottom. */
function drawPanelTint(ctx, rect, grade) {
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, grade.tintTop);
  g.addColorStop(1, grade.tintBottom);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** The caption band: accent bar, big bold caption, subtitle. `band` is its rect. */
function drawLettering(ctx, band, caption, subtitle, grade, w) {
  const text = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim();
  if (!text && !sub) return;
  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  const pad = Math.round(w * 0.035);
  const barW = Math.round(w * 0.012);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(band.x + pad, band.y + Math.round(band.h * 0.22), barW, Math.round(band.h * 0.56));
  const tx = band.x + pad + barW + Math.round(w * 0.02);
  const maxW = band.x + band.w - pad - tx;
  if (text) {
    let size = Math.round(band.h * 0.52);
    ctx.font = `italic 900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    while (size > 14 && ctx.measureText(text).width > maxW) {
      size -= 2;
      ctx.font = `italic 900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = grade.caption;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = Math.round(size * 0.12);
    ctx.shadowOffsetY = Math.round(size * 0.04);
    ctx.fillText(text, tx, band.y + band.h * (sub ? 0.38 : 0.52));
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  if (sub) {
    const subSize = Math.max(12, Math.round(band.h * 0.17));
    ctx.font = `700 ${subSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = grade.sub;
    ctx.fillText(sub.toUpperCase(), tx, band.y + band.h * 0.80);
  }
  ctx.restore();
}

/** Renders the whole cover onto `canvas` from `state`:
 *  { layout, grade, caption, subtitle, photos: [img|null, img|null],
 *    panels: [{photo, zoom, ox, oy} x 4], grain, vignette } */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = state.layout || 'grid';
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0d0714';
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(layout, w, h);
  const count = LAYOUTS[layout].panels;
  for (let i = 0; i < count; i += 1) {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[panel.photo] || null;
    drawPanelPhoto(ctx, photo, rects[i], panel, state.grade);
    drawPanelTint(ctx, rects[i], grade);
  }

  // Warm sun glow in the top corner, then a vignette to pull the eye inward.
  const glow = ctx.createRadialGradient(w * 0.82, h * 0.08, 0, w * 0.82, h * 0.08, Math.max(w, h) * 0.55);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  if (layout === 'full') {
    const scrim = ctx.createLinearGradient(0, h * 0.55, 0, h);
    scrim.addColorStop(0, 'rgba(10,5,20,0)');
    scrim.addColorStop(1, 'rgba(10,5,20,0.82)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h);
    drawLettering(ctx, { x: 0, y: Math.round(h * 0.78), w, h: Math.round(h * 0.22) }, state.caption, state.subtitle, grade, w);
  } else {
    drawLettering(ctx, { x: 0, y: h - Math.round(h * 0.16), w, h: Math.round(h * 0.16) }, state.caption, state.subtitle, grade, w);
  }

  if (state.vignette !== false) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  if (state.grain !== false) {
    const tile = getGrainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/** Renders the cover at export size and returns the fresh canvas. */
export function renderCoverToCanvas(width, height, state) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}

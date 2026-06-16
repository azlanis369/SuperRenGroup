// scripts/generate-demo-images.mjs
// Generates premium, realistic-looking SVG scenes for demo property listings.
// Plain Node ESM, no external deps. Run: node scripts/generate-demo-images.mjs
//
// The goal is imagery that looks like a polished real-estate hero shot — sky,
// light, buildings with depth and lit windows, greenery — beautiful even though
// it is sample data. No loud "DEMO" watermark; the app labels demo data in-UI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROPERTIES_DIR = path.join(ROOT, 'public', 'demo', 'properties');
const AGENTS_DIR = path.join(ROOT, 'public', 'demo', 'agents');
const DEMO_DIR = path.join(ROOT, 'public', 'demo');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape XML special characters for safe insertion into text nodes. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Zero-pad a number to two digits. */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Seeded PRNG (mulberry32) so each image is rich but reproducible. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Wrap text to at most `maxLines` lines of `maxChars` characters each.
 * The final line is truncated with an ellipsis if content remains.
 */
function wrapTitle(title, maxChars = 30, maxLines = 2) {
  const words = String(title ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length) {
    let last = lines[lines.length - 1];
    if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines.length ? lines : [''];
}

// Time-of-day skies for variety. Chosen deterministically per image.
const SKIES = [
  { name: 'day', top: '#7fb6e8', mid: '#bfe0f5', low: '#eaf6fd', sun: '#fffdf2', sunO: 0.55 },
  { name: 'golden', top: '#6f9fd6', mid: '#cfd9ec', low: '#ffe7c2', sun: '#fff2cf', sunO: 0.8 },
  { name: 'dusk', top: '#3f5f8f', mid: '#8aa0c6', low: '#ffd4a6', sun: '#ffe0b0', sunO: 0.7 },
  { name: 'clear', top: '#5fa3df', mid: '#a9d6f3', low: '#e6f4fc', sun: '#ffffff', sunO: 0.45 },
];

const HORIZON = 560; // ground line
const W = 1200;
const H = 800;

/** Soft clouds scattered across the upper sky. */
function clouds(rng) {
  let s = '';
  const n = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const cx = 80 + rng() * (W - 160);
    const cy = 70 + rng() * 220;
    const r = 26 + rng() * 30;
    const o = 0.18 + rng() * 0.22;
    s += `<g fill="#ffffff" opacity="${o.toFixed(2)}">`;
    s += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${(r * 1.8).toFixed(0)}" ry="${r.toFixed(0)}"/>`;
    s += `<ellipse cx="${(cx - r).toFixed(0)}" cy="${(cy + r * 0.3).toFixed(0)}" rx="${(r * 1.1).toFixed(0)}" ry="${(r * 0.7).toFixed(0)}"/>`;
    s += `<ellipse cx="${(cx + r * 1.1).toFixed(0)}" cy="${(cy + r * 0.25).toFixed(0)}" rx="${(r * 1.2).toFixed(0)}" ry="${(r * 0.75).toFixed(0)}"/>`;
    s += `</g>`;
  }
  return s;
}

/** Hazy distant skyline along the horizon for depth. */
function skyline(rng) {
  let s = `<g fill="#9bb4cf" opacity="0.35">`;
  let x = -20;
  while (x < W + 20) {
    const w = 40 + rng() * 70;
    const h = 60 + rng() * 150;
    s += `<rect x="${x.toFixed(0)}" y="${(HORIZON - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`;
    x += w + 6 + rng() * 16;
  }
  s += `</g>`;
  return s;
}

/** A leafy tree at (x, baseY). */
function tree(x, baseY, scale = 1) {
  const tw = 14 * scale;
  const th = 60 * scale;
  const r = 46 * scale;
  return (
    `<g>` +
    `<rect x="${(x - tw / 2).toFixed(0)}" y="${(baseY - th).toFixed(0)}" width="${tw.toFixed(0)}" height="${th.toFixed(0)}" rx="${(tw / 2).toFixed(0)}" fill="#6b4a2b"/>` +
    `<circle cx="${x.toFixed(0)}" cy="${(baseY - th - r * 0.4).toFixed(0)}" r="${r.toFixed(0)}" fill="#3f7d4e"/>` +
    `<circle cx="${(x - r * 0.7).toFixed(0)}" cy="${(baseY - th + r * 0.1).toFixed(0)}" r="${(r * 0.75).toFixed(0)}" fill="#4a8c59"/>` +
    `<circle cx="${(x + r * 0.7).toFixed(0)}" cy="${(baseY - th + r * 0.05).toFixed(0)}" r="${(r * 0.8).toFixed(0)}" fill="#357045"/>` +
    `<circle cx="${x.toFixed(0)}" cy="${(baseY - th - r * 0.5).toFixed(0)}" r="${(r * 0.7).toFixed(0)}" fill="#56a067"/>` +
    `</g>`
  );
}

/** Lit / unlit window grid helper. */
function windows(rng, x, y, cols, rows, cw, ch, gx, gy, litColor = '#ffd27a') {
  let s = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + c * (cw + gx);
      const wy = y + r * (ch + gy);
      const lit = rng() < 0.45;
      const fill = lit ? litColor : 'rgba(255,255,255,0.22)';
      const o = lit ? 0.9 : 0.5;
      s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="${cw}" height="${ch}" rx="1.5" fill="${fill}" opacity="${o}"/>`;
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

/** Glass condo towers (project). */
function towerScene(rng, gradId) {
  let s = '';
  // Back tower
  s += `<rect x="180" y="170" width="150" height="${HORIZON - 170}" rx="6" fill="url(#${gradId}-b)"/>`;
  s += windows(rng, 198, 196, 4, 9, 22, 26, 8, 18);
  // Secondary tower right
  s += `<rect x="820" y="230" width="140" height="${HORIZON - 230}" rx="6" fill="url(#${gradId}-b)"/>`;
  s += windows(rng, 838, 256, 4, 7, 20, 26, 8, 20);
  // Main hero tower (front, centred)
  s += `<rect x="470" y="110" width="220" height="${HORIZON - 110}" rx="8" fill="url(#${gradId}-a)"/>`;
  s += `<rect x="470" y="110" width="220" height="14" rx="6" fill="rgba(255,255,255,0.35)"/>`; // rooftop trim
  s += `<rect x="566" y="80" width="28" height="34" fill="rgba(255,255,255,0.3)"/>`; // antenna base
  s += windows(rng, 492, 140, 6, 13, 24, 24, 9, 11);
  // vertical mullion sheen
  s += `<rect x="470" y="110" width="14" height="${HORIZON - 110}" fill="rgba(255,255,255,0.12)"/>`;
  return s;
}

/** Row of landed terrace / semi-D houses (subsale). */
function landedScene(rng) {
  let s = '';
  const roof = '#9c4b32';
  const roofDark = '#7e3a26';
  const wall = '#f1e7d6';
  const wall2 = '#e6d8c1';
  const units = [
    { x: 150, w: 230, wall },
    { x: 400, w: 230, wall: wall2 },
    { x: 650, w: 230, wall },
    { x: 900, w: 200, wall: wall2 },
  ];
  for (const u of units) {
    const topW = u.x + u.w;
    const roofY = 360;
    const wallTop = 410;
    // roof
    s += `<polygon points="${u.x - 12},${wallTop} ${u.x + u.w / 2},${roofY} ${topW + 12},${wallTop}" fill="${roof}"/>`;
    s += `<polygon points="${u.x - 12},${wallTop} ${u.x + u.w / 2},${roofY} ${u.x + u.w / 2},${wallTop}" fill="${roofDark}"/>`;
    // wall
    s += `<rect x="${u.x}" y="${wallTop}" width="${u.w}" height="${HORIZON - wallTop}" fill="${u.wall}"/>`;
    // door
    const dw = 44;
    s += `<rect x="${u.x + u.w / 2 - dw / 2}" y="${HORIZON - 90}" width="${dw}" height="90" rx="3" fill="#5b4632"/>`;
    s += `<rect x="${u.x + u.w / 2 - dw / 2 + dw - 12}" y="${HORIZON - 48}" width="5" height="10" fill="#d4af37"/>`;
    // windows (lit warm)
    const winLit = rng() < 0.6 ? '#ffd27a' : '#cfe6f5';
    s += `<rect x="${u.x + 22}" y="${wallTop + 28}" width="58" height="46" rx="3" fill="${winLit}" stroke="#ffffff" stroke-width="3"/>`;
    s += `<rect x="${u.x + u.w - 80}" y="${wallTop + 28}" width="58" height="46" rx="3" fill="${winLit}" stroke="#ffffff" stroke-width="3"/>`;
    // small hedge
    s += `<rect x="${u.x}" y="${HORIZON - 22}" width="${u.w}" height="22" fill="#3f7d4e"/>`;
  }
  return s;
}

/** Mid-rise apartment block with balconies (rental). */
function midriseScene(rng, gradId) {
  let s = '';
  // Two staggered blocks
  s += `<rect x="700" y="300" width="300" height="${HORIZON - 300}" rx="6" fill="url(#${gradId}-b)"/>`;
  s += windows(rng, 724, 326, 6, 5, 26, 26, 14, 20);
  // Front block with balconies
  const x = 200;
  const top = 250;
  s += `<rect x="${x}" y="${top}" width="420" height="${HORIZON - top}" rx="6" fill="url(#${gradId}-a)"/>`;
  const cols = 5;
  const rows = 5;
  const cw = 64;
  const ch = 40;
  const gx = 16;
  const gy = 18;
  const startX = x + 22;
  const startY = top + 26;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = startX + c * (cw + gx);
      const wy = startY + r * (ch + gy);
      const lit = rng() < 0.5;
      s += `<rect x="${wx}" y="${wy}" width="${cw}" height="${ch}" rx="2" fill="${lit ? '#ffd27a' : '#bcd9ec'}" opacity="0.92"/>`;
      // balcony rail
      s += `<rect x="${wx - 3}" y="${wy + ch}" width="${cw + 6}" height="8" rx="2" fill="rgba(255,255,255,0.4)"/>`;
    }
  }
  return s;
}

/** 3.5-storey commercial shoplot block (commercial / office). */
function shoplotScene(rng, gradId) {
  let s = '';
  const x = 230;
  const top = 200;
  const w = 740;
  // building body
  s += `<rect x="${x}" y="${top}" width="${w}" height="${HORIZON - top}" rx="6" fill="url(#${gradId}-a)"/>`;
  // floor slabs
  const floors = 4;
  const fh = (HORIZON - top) / floors;
  for (let f = 1; f < floors; f++) {
    s += `<rect x="${x}" y="${(top + f * fh - 6).toFixed(0)}" width="${w}" height="8" fill="rgba(255,255,255,0.28)"/>`;
  }
  // upper glass windows per floor
  for (let f = 0; f < floors - 1; f++) {
    const wy = top + f * fh + 16;
    s += windows(rng, x + 24, wy, 9, 1, 60, Math.max(22, fh - 40), 18, 0, '#bfe6ff');
  }
  // ground-floor storefront (taller, glassy)
  const gfY = top + (floors - 1) * fh + 8;
  s += `<rect x="${x + 16}" y="${gfY}" width="${w - 32}" height="${HORIZON - gfY - 6}" rx="3" fill="rgba(190,230,255,0.85)"/>`;
  // storefront columns
  for (let i = 0; i <= 6; i++) {
    s += `<rect x="${(x + 16 + i * ((w - 32) / 6)).toFixed(0)}" y="${gfY}" width="8" height="${HORIZON - gfY - 6}" fill="rgba(255,255,255,0.55)"/>`;
  }
  // signage band
  s += `<rect x="${x}" y="${top - 6}" width="${w}" height="34" rx="4" fill="rgba(212,175,55,0.85)"/>`;
  return s;
}

// Category → palette + subject
const CATS = {
  project: { a1: '#1d4e7a', a2: '#3f86c4', b1: '#2a5d86', b2: '#4f93cf', subject: towerScene, label: 'PROJECT' },
  subsale: { a1: '#2f7d6b', a2: '#57b39a', b1: '#2f7d6b', b2: '#57b39a', subject: null, label: 'SUBSALE' },
  rental: { a1: '#3a6ea5', a2: '#6fa8d6', b1: '#4a7cae', b2: '#82b6dd', subject: midriseScene, label: 'RENTAL' },
  commercial: { a1: '#41566f', a2: '#6b8198', b1: '#41566f', b2: '#6b8198', subject: shoplotScene, label: 'COMMERCIAL' },
};

/**
 * Build a 1200x800 realistic property scene SVG.
 * @param {{title:string, area:string, category:string, index:number}} opts
 */
export function propertySvg({ title, area, category, index }) {
  const cat = CATS[category] || CATS.project;
  const idx = Number.isFinite(index) ? Math.max(1, Math.trunc(index)) : 1;
  const rng = mulberry32(idx * 2654435761 + category.length * 97 + (title || '').length);
  const sky = SKIES[idx % SKIES.length];
  const gid = `g-${category}-${idx}`;
  const label = (cat.label || category).toUpperCase();
  const lines = wrapTitle(title, 30, 2);

  let subject = '';
  if (category === 'subsale') subject = landedScene(rng);
  else if (cat.subject) subject = cat.subject(rng, gid);

  const titleTspans = lines
    .map((line, i) => `<tspan x="70" dy="${i === 0 ? 0 : 56}">${esc(line)}</tspan>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)} — ${esc(area)}">
  <defs>
    <linearGradient id="sky-${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky.top}"/>
      <stop offset="0.6" stop-color="${sky.mid}"/>
      <stop offset="1" stop-color="${sky.low}"/>
    </linearGradient>
    <radialGradient id="sun-${gid}" cx="0.78" cy="0.22" r="0.5">
      <stop offset="0" stop-color="${sky.sun}" stop-opacity="${sky.sunO}"/>
      <stop offset="1" stop-color="${sky.sun}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${gid}-a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${cat.a2}"/>
      <stop offset="1" stop-color="${cat.a1}"/>
    </linearGradient>
    <linearGradient id="${gid}-b" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${cat.b2}"/>
      <stop offset="1" stop-color="${cat.b1}"/>
    </linearGradient>
    <linearGradient id="ground-${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6ba368"/>
      <stop offset="1" stop-color="#4d7a4c"/>
    </linearGradient>
    <linearGradient id="scrim-${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#06121f" stop-opacity="0"/>
      <stop offset="1" stop-color="#06121f" stop-opacity="0.78"/>
    </linearGradient>
  </defs>

  <!-- Sky -->
  <rect width="${W}" height="${HORIZON}" fill="url(#sky-${gid})"/>
  <rect width="${W}" height="${H}" fill="url(#sun-${gid})"/>
  ${clouds(rng)}
  ${skyline(rng)}

  <!-- Ground -->
  <rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#ground-${gid})"/>
  <rect y="${HORIZON}" width="${W}" height="46" fill="rgba(255,255,255,0.06)"/>

  <!-- Subject -->
  ${subject}

  <!-- Foreground greenery -->
  ${tree(96, HORIZON + 150, 1.25)}
  ${tree(1120, HORIZON + 140, 1.1)}

  <!-- Bottom scrim for legibility -->
  <rect y="${H - 250}" width="${W}" height="250" fill="url(#scrim-${gid})"/>

  <!-- Category pill -->
  <rect x="60" y="52" width="${70 + label.length * 12}" height="42" rx="21" fill="rgba(6,18,31,0.42)"/>
  <text x="84" y="79" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" letter-spacing="2" fill="#ffffff">${esc(label)}</text>

  <!-- Title + area -->
  <text x="70" y="${H - 96}" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="800" fill="#ffffff">${titleTspans}</text>
  <text x="70" y="${H - 44}" font-family="Inter, system-ui, sans-serif" font-size="27" font-weight="500" fill="rgba(255,255,255,0.9)">📍 ${esc(area)}</text>

  <!-- Brand mark -->
  <text x="${W - 60}" y="${H - 44}" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="rgba(255,255,255,0.82)">Super Ren <tspan fill="#e7c875">Group</tspan></text>
</svg>
`;
}

/** Build a 400x400 agent avatar. Clean monogram on a premium gradient. */
function agentSvg({ initials, index }) {
  const idx = Number.isFinite(index) ? Math.max(1, Math.trunc(index)) : 1;
  const hue = (200 + idx * 28) % 360;
  const gradId = `agrad-${idx}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="Agent ${esc(initials)}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue}, 42%, 38%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 24) % 360}, 46%, 22%)"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#${gradId})"/>
  <circle cx="200" cy="200" r="190" fill="rgba(255,255,255,0.05)"/>
  <circle cx="320" cy="80" r="120" fill="rgba(255,255,255,0.06)"/>
  <text x="200" y="234" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="150" font-weight="800" fill="#ffffff">${esc(initials)}</text>
</svg>
`;
}

/** Build the 1200x630 branded Open Graph fallback SVG. */
function ogSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Super Ren Group">
  <defs>
    <linearGradient id="og-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#13314f"/>
      <stop offset="1" stop-color="#0a1d30"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#og-grad)"/>
  <circle cx="120" cy="120" r="280" fill="rgba(212,175,55,0.06)"/>
  <circle cx="1080" cy="560" r="240" fill="rgba(212,175,55,0.08)"/>
  <rect x="540" y="208" width="120" height="120" rx="22" fill="rgba(212,175,55,0.14)"/>
  <path d="M566 300 L566 250 L600 232 L634 250 L634 300" fill="none" stroke="#d4af37" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="600" y="408" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="800" fill="#ffffff">Super Ren <tspan fill="#d4af37">Group</tspan></text>
  <text x="600" y="460" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="500" letter-spacing="3" fill="rgba(255,255,255,0.7)">Property CRM · Chester Properties HQ</text>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const AREAS = [
  'KLCC', 'Mont Kiara', 'Bangsar', 'Cheras', 'Setapak', 'Wangsa Maju',
  'Kepong', 'Bukit Jalil', 'Petaling Jaya', 'Damansara', 'Subang Jaya',
  'Shah Alam', 'Klang', 'Puchong', 'Seri Kembangan', 'Kajang', 'Bangi',
  'Semenyih', 'Cyberjaya', 'Putrajaya', 'Rawang', 'Ampang', 'Gombak',
];

const TITLE_TEMPLATES = {
  project: [
    'The Skyline Residences', 'Aurora Serviced Suites', 'Vista Tower Premier',
    'Emerald Park Residency', 'The Arc @ {area}', 'Lumina Heights',
    'Pavilion Court Suites', 'Tropic Garden Residences', 'The Crest {area}',
    'Solaris Sky Suites', 'Zenith Residency', 'Greenfield Boulevard',
  ],
  subsale: [
    '2-Storey Terrace House', 'Cozy Link Home', 'Renovated Semi-D',
    'Spacious Corner Terrace', 'Freehold Bungalow Lot', 'Modern Townhouse',
    'Double-Storey Terrace', 'Landed Family Home', 'Refurbished Terrace Unit',
    'Premium Cluster Home', 'Endlot Terrace House', 'Garden Terrace Residence',
  ],
  rental: [
    'Furnished Studio Unit', 'Cozy 2-Room Apartment', 'Affordable Walk-Up Flat',
    'Serviced Room for Rent', 'Bright 3-Room Apartment', 'Compact City Studio',
    'Budget Family Flat', 'Comfy Shared Suite', 'Value Apartment Unit',
    'Convenient Transit Flat', 'Tidy Mid-Floor Unit', 'Practical Starter Home',
  ],
};

const AGENT_INITIALS = ['AH', 'NA', 'DL', 'SH', 'FI', 'MT', 'HZ', 'KR'];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function run() {
  fs.mkdirSync(PROPERTIES_DIR, { recursive: true });
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.mkdirSync(DEMO_DIR, { recursive: true });

  let propertyCount = 0;
  let agentCount = 0;

  for (const category of ['project', 'subsale', 'rental']) {
    const templates = TITLE_TEMPLATES[category];
    for (let i = 1; i <= 12; i++) {
      const area = AREAS[(i - 1) % AREAS.length];
      const title = templates[(i - 1) % templates.length].replace(/\{area\}/g, area);
      const svg = propertySvg({ title, area, category, index: i });
      fs.writeFileSync(path.join(PROPERTIES_DIR, `${category}-${pad2(i)}.svg`), svg, 'utf8');
      propertyCount++;
    }
  }

  // Dedicated commercial hero for the real Excella shoplot listing.
  fs.writeFileSync(
    path.join(PROPERTIES_DIR, 'commercial-excella.svg'),
    propertySvg({
      title: 'Excella Business Park',
      area: 'Ampang, Selangor',
      category: 'commercial',
      index: 7,
    }),
    'utf8',
  );
  propertyCount++;

  AGENT_INITIALS.forEach((initials, i) => {
    const svg = agentSvg({ initials, index: i + 1 });
    fs.writeFileSync(path.join(AGENTS_DIR, `agent-${pad2(i + 1)}.svg`), svg, 'utf8');
    agentCount++;
  });

  fs.writeFileSync(path.join(DEMO_DIR, 'og-default.svg'), ogSvg(), 'utf8');

  console.log('Demo image generation complete:');
  console.log(`  properties: ${propertyCount} files -> ${path.relative(ROOT, PROPERTIES_DIR)}/`);
  console.log(`  agents:     ${agentCount} files -> ${path.relative(ROOT, AGENTS_DIR)}/agent-NN.svg`);
  console.log(`  og:         1 file  -> ${path.relative(ROOT, path.join(DEMO_DIR, 'og-default.svg'))}`);
  console.log(`  total:      ${propertyCount + agentCount + 1} files`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) run();

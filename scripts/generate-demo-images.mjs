// scripts/generate-demo-images.mjs
// Generates premium-looking SVG placeholder images for DEMO property listings.
// Plain Node ESM, no external deps. Run: node scripts/generate-demo-images.mjs

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

/**
 * Wrap text to at most `maxLines` lines of `maxChars` characters each.
 * The final line is truncated with an ellipsis if content remains.
 */
function wrapTitle(title, maxChars = 28, maxLines = 2) {
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
  // Truncate the last line if there is leftover content.
  const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length) {
    let last = lines[lines.length - 1];
    if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines.length ? lines : [''];
}

const CATEGORY_PALETTES = {
  project: { from: '#0F2A43', to: '#1d4e7a', accent: '#5b9bd5' },
  subsale: { from: '#0f3d3a', to: '#2f7d6b', accent: '#5fc9a8' },
  rental: { from: '#7a4f1d', to: '#b5852f', accent: '#e0b35e' },
};

/** Stylized property silhouette per category, anchored near the bottom. */
function silhouette(category, baseX) {
  const fill = 'rgba(255,255,255,0.10)';
  const fill2 = 'rgba(255,255,255,0.16)';
  const groundY = 660;
  if (category === 'project') {
    // Stylized condo tower with a couple of neighbours.
    const x = baseX;
    let s = '';
    s += `<rect x="${x}" y="300" width="120" height="${groundY - 300}" rx="6" fill="${fill2}"/>`;
    s += `<rect x="${x + 140}" y="380" width="90" height="${groundY - 380}" rx="6" fill="${fill}"/>`;
    s += `<rect x="${x - 110}" y="420" width="90" height="${groundY - 420}" rx="6" fill="${fill}"/>`;
    // Window grid on main tower.
    let win = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 3; c++) {
        win += `<rect x="${x + 14 + c * 34}" y="${320 + r * 40}" width="20" height="24" rx="2" fill="rgba(255,255,255,0.18)"/>`;
      }
    }
    return s + win;
  }
  if (category === 'rental') {
    // Simpler low-rise block.
    const x = baseX;
    let s = '';
    s += `<rect x="${x}" y="430" width="260" height="${groundY - 430}" rx="8" fill="${fill2}"/>`;
    s += `<rect x="${x + 280}" y="490" width="140" height="${groundY - 490}" rx="8" fill="${fill}"/>`;
    let win = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        win += `<rect x="${x + 22 + c * 46}" y="${460 + r * 56}" width="28" height="34" rx="3" fill="rgba(255,255,255,0.18)"/>`;
      }
    }
    return s + win;
  }
  // subsale (default): house with a pitched roof / terrace feel.
  const x = baseX;
  let s = '';
  s += `<polygon points="${x},480 ${x + 150},390 ${x + 300},480" fill="${fill2}"/>`;
  s += `<rect x="${x + 20}" y="480" width="260" height="${groundY - 480}" rx="6" fill="${fill}"/>`;
  s += `<rect x="${x + 120}" y="560" width="60" height="${groundY - 560}" rx="4" fill="rgba(255,255,255,0.20)"/>`;
  s += `<rect x="${x + 56}" y="520" width="48" height="48" rx="4" fill="rgba(255,255,255,0.18)"/>`;
  s += `<rect x="${x + 196}" y="520" width="48" height="48" rx="4" fill="rgba(255,255,255,0.18)"/>`;
  // A neighbouring terrace unit.
  s += `<polygon points="${x + 300},480 ${x + 430},400 ${x + 560},480" fill="${fill}"/>`;
  s += `<rect x="${x + 318}" y="480" width="224" height="${groundY - 480}" rx="6" fill="${fill}"/>`;
  return s;
}

/**
 * Build a 1200x800 premium property placeholder SVG.
 * @param {{title:string, area:string, category:string, index:number}} opts
 * @returns {string} SVG markup
 */
export function propertySvg({ title, area, category, index }) {
  const palette = CATEGORY_PALETTES[category] || CATEGORY_PALETTES.project;
  const idx = Number.isFinite(index) ? Math.max(1, Math.trunc(index)) : 1;
  const gradId = `grad-${category}-${idx}`;
  const label = String(category || 'demo').toUpperCase();
  const lines = wrapTitle(title, 28, 2);
  const baseX = 420 + ((idx * 67) % 220) - 110; // vary silhouette position by index
  const accentX = 80 + ((idx * 53) % 900);

  const titleTspans = lines
    .map(
      (line, i) =>
        `<tspan x="80" dy="${i === 0 ? 0 : 60}">${esc(line)}</tspan>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${esc(title)} — ${esc(area)} (demo image)">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.from}"/>
      <stop offset="1" stop-color="${palette.to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#${gradId})"/>
  <circle cx="${accentX}" cy="140" r="320" fill="rgba(255,255,255,0.05)"/>
  <circle cx="${1100 - (accentX % 300)}" cy="700" r="240" fill="rgba(255,255,255,0.06)"/>
  <circle cx="980" cy="120" r="160" fill="${palette.accent}" opacity="0.10"/>
  ${silhouette(category, baseX)}
  <rect x="0" y="540" width="1200" height="260" fill="rgba(0,0,0,0.18)"/>
  <!-- Category pill, top-left -->
  <rect x="60" y="56" width="${110 + label.length * 11}" height="44" rx="22" fill="rgba(255,255,255,0.16)"/>
  <text x="${82}" y="84" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="#ffffff">${esc(label)}</text>
  <!-- Index badge, top-right -->
  <circle cx="1120" cy="80" r="34" fill="rgba(255,255,255,0.18)"/>
  <text x="1120" y="90" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="800" fill="#ffffff">${esc(pad2(idx))}</text>
  <!-- DEMO IMAGE watermark -->
  <text x="600" y="430" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="120" font-weight="800" letter-spacing="6" fill="rgba(255,255,255,0.08)">DEMO IMAGE</text>
  <!-- Title + area -->
  <text x="80" y="650" font-family="Inter, system-ui, sans-serif" font-size="52" font-weight="800" fill="#ffffff">${titleTspans}</text>
  <text x="80" y="${720 + (lines.length - 1) * 0}" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="500" fill="rgba(255,255,255,0.82)">${esc(area)}</text>
  <!-- Brand watermark, bottom-right -->
  <text x="1140" y="760" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="600" fill="rgba(255,255,255,0.45)">Super Ren Group</text>
</svg>
`;
}

/** Build a 400x400 agent avatar placeholder SVG. */
function agentSvg({ initials, index }) {
  const idx = Number.isFinite(index) ? Math.max(1, Math.trunc(index)) : 1;
  const hue = (idx * 43) % 360;
  const gradId = `agrad-${idx}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="Demo agent ${esc(initials)}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue}, 55%, 42%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 40) % 360}, 60%, 28%)"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#${gradId})"/>
  <circle cx="200" cy="200" r="190" fill="rgba(255,255,255,0.06)"/>
  <circle cx="320" cy="80" r="110" fill="rgba(255,255,255,0.07)"/>
  <text x="200" y="232" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="150" font-weight="800" fill="#ffffff">${esc(initials)}</text>
  <rect x="160" y="330" width="80" height="34" rx="17" fill="rgba(0,0,0,0.30)"/>
  <text x="200" y="354" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" letter-spacing="2" fill="#ffffff">DEMO</text>
</svg>
`;
}

/** Build the 1200x630 branded Open Graph fallback SVG. */
function ogSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Super Ren Group — Demo">
  <defs>
    <linearGradient id="og-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0F2A43"/>
      <stop offset="1" stop-color="#1d4e7a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#og-grad)"/>
  <circle cx="120" cy="120" r="280" fill="rgba(255,255,255,0.05)"/>
  <circle cx="1080" cy="560" r="220" fill="rgba(255,255,255,0.06)"/>
  <text x="600" y="300" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="72" font-weight="800" fill="#ffffff">Super Ren Group</text>
  <text x="600" y="370" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="500" letter-spacing="6" fill="rgba(255,255,255,0.75)">DEMO</text>
  <text x="600" y="430" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="500" fill="rgba(255,255,255,0.55)">Real Estate CRM</text>
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
    'The Skyline Residences',
    'Aurora Serviced Suites',
    'Vista Tower Premier',
    'Emerald Park Residency',
    'The Arc @ {area}',
    'Lumina Heights',
    'Pavilion Court Suites',
    'Tropic Garden Residences',
    'The Crest {area}',
    'Solaris Sky Suites',
    'Zenith Residency',
    'Greenfield Boulevard',
  ],
  subsale: [
    '2-Storey Terrace House',
    'Cozy Link Home',
    'Renovated Semi-D',
    'Spacious Corner Terrace',
    'Freehold Bungalow Lot',
    'Modern Townhouse',
    'Double-Storey Terrace',
    'Landed Family Home',
    'Refurbished Terrace Unit',
    'Premium Cluster Home',
    'Endlot Terrace House',
    'Garden Terrace Residence',
  ],
  rental: [
    'Furnished Studio Unit',
    'Cozy 2-Room Apartment',
    'Affordable Walk-Up Flat',
    'Serviced Room for Rent',
    'Bright 3-Room Apartment',
    'Compact City Studio',
    'Budget Family Flat',
    'Comfy Shared Suite',
    'Value Apartment Unit',
    'Convenient Transit Flat',
    'Tidy Mid-Floor Unit',
    'Practical Starter Home',
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

  AGENT_INITIALS.forEach((initials, i) => {
    const svg = agentSvg({ initials, index: i + 1 });
    fs.writeFileSync(path.join(AGENTS_DIR, `agent-${pad2(i + 1)}.svg`), svg, 'utf8');
    agentCount++;
  });

  fs.writeFileSync(path.join(DEMO_DIR, 'og-default.svg'), ogSvg(), 'utf8');

  console.log('Demo image generation complete:');
  console.log(`  properties: ${propertyCount} files -> ${path.relative(ROOT, PROPERTIES_DIR)}/{project|subsale|rental}-NN.svg`);
  console.log(`  agents:     ${agentCount} files -> ${path.relative(ROOT, AGENTS_DIR)}/agent-NN.svg`);
  console.log(`  og:         1 file  -> ${path.relative(ROOT, path.join(DEMO_DIR, 'og-default.svg'))}`);
  console.log(`  total:      ${propertyCount + agentCount + 1} files`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) run();

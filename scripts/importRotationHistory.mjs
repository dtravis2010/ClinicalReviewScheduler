#!/usr/bin/env node
/**
 * Import historical rotations into the new `rotations` Firestore collection.
 *
 * Usage:
 *   node scripts/importRotationHistory.mjs --xlsx ./CR_SCHEDULE_HISTORY.xlsx
 *   node scripts/importRotationHistory.mjs --seed
 *   node scripts/importRotationHistory.mjs --seed --dry-run
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { DAR_COLUMN_IDS, DEFAULT_CLUSTERS, ROTATION_COLLECTIONS, ROTATION_STATUS } from '../src/constants/rotation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const MONTHS = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  JANUARY: '01', FEBRUARY: '02', MARCH: '03', APRIL: '04',
  JUNE: '06', JULY: '07', AUGUST: '08', SEPTEMBER: '09', OCTOBER: '10',
  NOVEMBER: '11', DECEMBER: '12',
};

const args = parseArgs(process.argv.slice(2));
if (!args.xlsx && !args.seed) {
  console.error('usage: importRotationHistory.mjs --xlsx <path> | --seed [--dry-run]');
  process.exit(2);
}

const DRY_RUN = !!args['dry-run'];
const EMIT_JSON = args['emit-json'];
let db = null;
if (!DRY_RUN && !EMIT_JSON) {
  const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  });
  db = getFirestore(app);
}

const rotations = args.seed ? loadSeed() : loadXlsx(args.xlsx);
console.log(`Parsed ${rotations.length} rotation(s).`);

if (EMIT_JSON) {
  const outPath = path.resolve(typeof EMIT_JSON === 'string' ? EMIT_JSON : 'src/data/historicalRotations.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  // Sort newest first so the app can use the list directly.
  const sorted = [...rotations].sort((a, b) => b.id.localeCompare(a.id));
  fs.writeFileSync(outPath, JSON.stringify(sorted, null, 2));
  console.log(`Wrote ${sorted.length} rotations to ${outPath}`);
  process.exit(0);
}

for (const rot of rotations) {
  console.log(`  ${rot.id} (${rot.label}) — ${Object.keys(rot.assignments).length} assignments`);
  if (DRY_RUN) continue;
  await setDoc(
    doc(db, ROTATION_COLLECTIONS.ROTATIONS, rot.id),
    { ...rot, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: false },
  );
}

console.log(DRY_RUN ? 'Dry-run only — nothing written.' : 'Import complete.');
process.exit(0);

// ---------------------------------------------------------------------------

function loadSeed() {
  const seedPath = path.join(
    __dirname, '..', '.handoff', 'design_handoff_rotation_intelligence',
    'historical_data', 'extracted_recent_rotations.json',
  );
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${seedPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  return raw.map(normalizeSeedEntry).filter(Boolean);
}

function loadXlsx(filePath) {
  const wb = XLSX.readFile(filePath, { cellStyles: false, cellHTML: false });
  const out = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const parsed = parseSheet(sheetName, sheet);
    if (parsed) out.push(parsed);
  }
  return out;
}

function parseSheet(sheetName, sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  if (!rows.length) return null;
  const headerIdx = findHeaderRow(rows);
  if (headerIdx < 0) {
    console.warn(`  sheet "${sheetName}" — no recognizable header, skipping`);
    return null;
  }
  const headers = rows[headerIdx].map(cellToString);
  const colMap = mapColumns(headers);
  if (colMap.team === undefined) {
    console.warn(`  sheet "${sheetName}" — no TEAM MEMBER column, skipping`);
    return null;
  }
  const subRow = rows[headerIdx + 1] || [];
  const clusters = extractClusters(colMap, subRow);
  const assignments = {};
  for (let r = headerIdx + 1; r < rows.length; r += 1) {
    const row = rows[r];
    const name = cellToString(row?.[colMap.team]).trim().toUpperCase();
    if (!name || name === 'TEAM MEMBER') continue;
    if (/^DAR\s*\d/i.test(name)) continue;
    assignments[name] = extractAssignment(row, colMap);
  }
  return {
    id: rotationIdFromName(sheetName),
    label: prettyLabel(sheetName),
    status: ROTATION_STATUS.PUBLISHED,
    clusters,
    assignments,
  };
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const joined = rows[i].map(cellToString).join('|').toUpperCase();
    if (joined.includes('TEAM MEMBER') && joined.includes('DAR 1')) return i;
  }
  return -1;
}

function mapColumns(headers) {
  const m = {};
  headers.forEach((h, i) => {
    const s = String(h || '').toUpperCase().replace(/\s+/g, ' ').trim();
    if (s === 'TEAM MEMBER') m.team = i;
    else if (/^DAR\s*1\b/.test(s)) m.dar1 = i;
    else if (/^DAR\s*2\b/.test(s)) m.dar2 = i;
    else if (/^DAR\s*3\b/.test(s)) m.dar3 = i;
    else if (/^DAR\s*4\b/.test(s)) m.dar4 = i;
    else if (/^DAR\s*5\b/.test(s)) m.dar5 = i;
    else if (s.startsWith('TRAINING DAR') || s === 'TRAIN DAR') m.trn = i;
    else if (s === 'CPOE') m.cpoe = i;
    else if (s.startsWith('NEW INCOMING') || s === 'INCOMING') m.inc = i;
    else if (s.startsWith('CROSS')) m.cross = i;
    else if (s.startsWith('SPECIAL')) m.spec = i;
  });
  return m;
}

function extractClusters(colMap, subRow) {
  const out = {};
  for (const id of [...DAR_COLUMN_IDS, 'trn']) {
    const idx = colMap[id];
    if (idx === undefined) continue;
    const entities = String(subRow[idx] || '')
      .split(/[\/,]/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s && s !== 'X' && !/^DAR/i.test(s));
    const fallback = DEFAULT_CLUSTERS[id];
    out[id] = {
      label: fallback?.label || id.toUpperCase(),
      entities: entities.length ? entities : (fallback?.entities || []),
    };
  }
  return out;
}

function extractAssignment(row, colMap) {
  const a = {};
  for (const id of DAR_COLUMN_IDS) {
    if (colMap[id] === undefined) continue;
    const cell = cellToString(row[colMap[id]]).trim();
    if (cell && cell.toUpperCase().startsWith('X')) {
      a.dar = id;
      break;
    }
  }
  if (colMap.trn !== undefined) {
    const cell = cellToString(row[colMap.trn]).trim().toUpperCase();
    if (cell.startsWith('X')) a.trn = true;
    else if (cell.includes('CPOE')) a.cpoe = true;
  }
  if (colMap.cpoe !== undefined) {
    const cell = cellToString(row[colMap.cpoe]).trim();
    if (cell) a.cpoe = true;
  }
  if (colMap.inc !== undefined) {
    const cell = cellToString(row[colMap.inc]).trim();
    if (cell) a.incoming = cell;
  }
  if (colMap.cross !== undefined) {
    const cell = cellToString(row[colMap.cross]).trim();
    if (cell) a.cross = cell;
  }
  if (colMap.spec !== undefined) {
    const cell = cellToString(row[colMap.spec]).trim();
    if (cell) a.spec = cell;
  }
  return a;
}

function normalizeSeedEntry(entry) {
  if (!entry || !entry.rotation) return null;
  const assignments = {};
  const src = entry.assignments || {};
  for (const [name, row] of Object.entries(src)) {
    assignments[name.toUpperCase()] = seedRowToAssignment(row);
  }
  return {
    id: rotationIdFromName(entry.rotation),
    label: prettyLabel(entry.rotation),
    status: ROTATION_STATUS.PUBLISHED,
    clusters: { ...DEFAULT_CLUSTERS },
    assignments,
  };
}

function seedRowToAssignment(row) {
  const a = {};
  for (const [k, v] of Object.entries(row || {})) {
    const value = String(v || '').trim();
    if (!value) continue;
    if (/^DAR(\d)$/.test(k)) {
      const n = k.replace('DAR', 'dar');
      if (value.toUpperCase().startsWith('X')) a.dar = n;
    } else if (k === 'TrainDAR') {
      if (value.toUpperCase().startsWith('X')) a.trn = true;
      else if (value.toUpperCase().includes('CPOE')) a.cpoe = true;
    } else if (k === 'CPOE') {
      a.cpoe = true;
    } else if (k === 'NewIncoming') {
      a.incoming = value;
    } else if (k === 'CrossTrain') {
      a.cross = value;
    } else if (k === 'SpecialProj') {
      a.spec = value;
    }
  }
  return a;
}

function rotationIdFromName(raw) {
  const s = String(raw).toUpperCase();
  const months = [...s.matchAll(/\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T(?:EMBER)?)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\b/g)]
    .map(m => MONTHS[m[1]] || MONTHS[m[1].slice(0, 3)] || null)
    .filter(Boolean);
  const yearMatch = s.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  const month = months[0] || '01';
  return `${year}-${month}`;
}

function prettyLabel(raw) {
  return String(raw).replace(/\s+/g, ' ').replace(/AND/gi, '·').trim();
}

function cellToString(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return String(v);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) { out[key] = next; i += 1; }
    else out[key] = true;
  }
  return out;
}

/**
 * Rotation Intelligence engine — pure functions.
 *
 * The engine never touches Firebase. Everything is data in / data out so it
 * can be unit-tested and re-run client-side for previews.
 *
 * The core entry point is `proposeRotation({ members, history, rules, target })`
 * which returns an `assignments` object plus a parallel `reasons` map that
 * the UI can render under each cell.
 */

import { DAR_COLUMN_IDS, DEFAULT_CLUSTERS, ENTITIES, SIDE_ROLE_LABELS } from '../constants/rotation';

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------

export function darIn(rotation, name) {
  const row = rotation?.assignments?.[name];
  if (!row) return null;
  if (typeof row.dar === 'string' && row.dar) return row.dar;
  if (row.trn === true) return 'trn';
  return null;
}

export function entitiesCoveredIn(rotation, name) {
  const row = rotation?.assignments?.[name];
  if (!row || !row.incoming) return [];
  return splitEntityCell(row.incoming);
}

export function splitEntityCell(text) {
  if (!text) return [];
  return String(text)
    .split(/[\/,]/)
    .map(s => s.trim().toUpperCase())
    .filter(s => s && s !== 'X');
}

export function lastOwnershipMap(historyNewestFirst, name) {
  const map = {};
  historyNewestFirst.forEach((rot, idx) => {
    const cluster = darIn(rot, name);
    if (cluster && map[cluster] === undefined) {
      map[cluster] = idx + 1;
    }
  });
  return map;
}

export function sideRolesIn(rotation, name) {
  const row = rotation?.assignments?.[name];
  if (!row) return [];
  const collected = new Set();
  if (Array.isArray(row.side)) row.side.forEach(s => s && collected.add(s.toUpperCase()));
  for (const field of ['spec', 'cross']) {
    const v = row?.[field];
    if (!v) continue;
    SIDE_ROLE_LABELS.forEach(label => {
      if (String(v).toUpperCase().includes(label)) collected.add(label);
    });
  }
  return [...collected];
}

// ---------------------------------------------------------------------------
// Promotion logic
// ---------------------------------------------------------------------------

export function promotionSuggestion(member, rules, entityList = ENTITIES) {
  if (!member || member.level === 'perm' || member.level === 'float') return null;
  if (member.level === 'incoming') {
    const covered = new Set(member.coveredEntities || []);
    const allCovered = entityList.every(e => covered.has(e));
    return allCovered ? 'dar' : null;
  }
  if (member.level === 'dar') {
    const owned = new Set(member.darClustersOwned || []);
    const all = DAR_COLUMN_IDS.every(d => owned.has(d));
    return all ? 'cpoe' : null;
  }
  if (member.level === 'cpoe') {
    const threshold = rules?.promoteFromCpoeAfter ?? 2;
    return (member.cpoeRotationsCount || 0) >= threshold ? 'float' : null;
  }
  return null;
}

export function deriveMemberPatches(rotation, members) {
  const out = {};
  const memberByName = new Map(members.map(m => [m.name, m]));
  for (const name of Object.keys(rotation.assignments || {})) {
    const m = memberByName.get(name);
    if (!m) continue;
    const patch = {};
    const dar = darIn(rotation, name);
    if (dar && dar !== 'trn') {
      const owned = new Set(m.darClustersOwned || []);
      if (!owned.has(dar)) patch.darClustersOwned = [...owned, dar];
    }
    const newCovered = entitiesCoveredIn(rotation, name);
    if (newCovered.length) {
      const covered = new Set(m.coveredEntities || []);
      newCovered.forEach(e => covered.add(e));
      patch.coveredEntities = [...covered];
    }
    const row = rotation.assignments[name];
    if (row?.cpoe === true || row?.cpoe === 'CPOE') {
      patch.cpoeRotationsCount = (m.cpoeRotationsCount || 0) + 1;
    }
    if (Object.keys(patch).length) out[name] = patch;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The proposal engine
// ---------------------------------------------------------------------------

export function proposeRotation({ members, history = [], rules, target, seed = 0 }) {
  const clusters = target?.clusters || rules?.clusters || DEFAULT_CLUSTERS;
  const assignments = {};
  const reasons = {};
  const rng = mulberry32(seed || 1);

  const claimedClusters = new Set();
  const ordered = [...members].sort((a, b) => a.name.localeCompare(b.name));

  // 1) Permanent roles
  for (const m of ordered) {
    const perm = (rules?.permanentRoles || []).find(p => p.name === m.name) ||
      (m.permanentRole ? { name: m.name, role: m.permanentRole } : null);
    if (perm) {
      assignments[m.name] = { spec: perm.role };
      reasons[m.name] = { spec: `Permanent: ${perm.role}` };
    }
  }

  // 2) DAR rung — assign first because their slots are scarce.
  const darPeople = ordered.filter(m => m.level === 'dar' && !assignments[m.name]);
  darPeople.sort((a, b) => {
    const aOwned = (a.darClustersOwned || []).length;
    const bOwned = (b.darClustersOwned || []).length;
    if (aOwned !== bOwned) return aOwned - bOwned;
    return a.name.localeCompare(b.name);
  });
  for (const m of darPeople) {
    const owned = new Set(m.darClustersOwned || []);
    const recent = lastOwnershipMap(history, m.name);
    const candidates = DAR_COLUMN_IDS
      .filter(c => !claimedClusters.has(c))
      .filter(c => (recent[c] || Infinity) > (rules?.noRepeatDarRotations ?? 2))
      .sort((a, b) => {
        const aNew = owned.has(a) ? 1 : 0;
        const bNew = owned.has(b) ? 1 : 0;
        if (aNew !== bNew) return aNew - bNew;
        const aAgo = recent[a] || Infinity;
        const bAgo = recent[b] || Infinity;
        return bAgo - aAgo;
      });
    const pick = candidates[0];
    if (pick) {
      claimedClusters.add(pick);
      assignments[m.name] = { dar: pick };
      reasons[m.name] = {
        dar: owned.has(pick)
          ? `last on ${labelFor(pick)} ${recent[pick]} rotation${recent[pick] === 1 ? '' : 's'} ago`
          : `never owned ${labelFor(pick)}`,
      };
    } else {
      reasons[m.name] = { dar: 'no eligible DAR cluster — supervisor pick' };
      assignments[m.name] = {};
    }
  }

  // 3) CPOE rung
  for (const m of ordered) {
    if (assignments[m.name]) continue;
    if (m.level !== 'cpoe') continue;
    assignments[m.name] = { cpoe: true };
    reasons[m.name] = { cpoe: 'on CPOE rung' };
  }

  // 4) Incoming rung
  for (const m of ordered) {
    if (assignments[m.name]) continue;
    if (m.level !== 'incoming') continue;
    const covered = new Set(m.coveredEntities || []);
    const next = ENTITIES.find(e => !covered.has(e));
    if (next) {
      assignments[m.name] = { incoming: next };
      reasons[m.name] = { incoming: `incoming · ${next} not yet covered` };
    } else {
      assignments[m.name] = { incoming: ENTITIES[Math.floor(rng() * ENTITIES.length)] };
      reasons[m.name] = { incoming: 'all entities covered — recommend promotion to DAR' };
    }
  }

  // 5) Float pool
  const floatPool = ordered.filter(m => m.level === 'float' && !assignments[m.name]);
  for (const m of floatPool) {
    assignments[m.name] = { spec: 'FLOAT' };
    reasons[m.name] = { spec: 'Float pool — covers PTO/sick' };
  }

  // 6) Orphans
  for (const m of ordered) {
    if (!assignments[m.name]) {
      assignments[m.name] = {};
      reasons[m.name] = { spec: 'no rule matched — manual assignment needed' };
    }
  }

  // 7) Rotating side-roles
  const prev = history[0];
  const darAssigned = ordered.filter(m => assignments[m.name]?.dar);
  const rotatingLabels = (rules?.sideRoles || [])
    .map(s => s.label)
    .filter(l => SIDE_ROLE_LABELS.includes(l));
  for (const label of rotatingLabels) {
    const ranked = [...darAssigned].sort((a, b) => {
      const aHad = sideRolesIn(prev, a.name).includes(label) ? 1 : 0;
      const bHad = sideRolesIn(prev, b.name).includes(label) ? 1 : 0;
      if (aHad !== bHad) return aHad - bHad;
      return a.name.localeCompare(b.name);
    });
    const pick = ranked.find(m => {
      const a = assignments[m.name];
      return (a.side?.length || 0) < (rules?.maxSideRolesPerPerson ?? 1);
    });
    if (pick) {
      const a = assignments[pick.name];
      a.side = [...(a.side || []), label];
      reasons[pick.name] = {
        ...reasons[pick.name],
        side: prev ? `side-role: didn't hold ${label} last rotation` : `side-role: ${label}`,
      };
    }
  }

  // Attach reasons to rows
  for (const name of Object.keys(assignments)) {
    if (reasons[name]) assignments[name].reasons = reasons[name];
  }

  // Sanity
  const sanity = [];
  for (const c of DAR_COLUMN_IDS) {
    if (!claimedClusters.has(c)) {
      sanity.push(`${labelFor(c)} is unowned — promote someone from Incoming or assign manually`);
    }
  }
  return { assignments, sanity, clusters };
}

function labelFor(id) {
  if (id === 'trn') return 'Training DAR';
  if (id.startsWith('dar')) return `DAR ${id.slice(3)}`;
  return id.toUpperCase();
}

function mulberry32(a) {
  let t = a >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

export function diffAssignments(current = {}, proposed = {}) {
  const names = new Set([...Object.keys(current), ...Object.keys(proposed)]);
  const fields = ['dar', 'cpoe', 'incoming', 'cross', 'spec', 'side'];
  const out = [];
  for (const name of names) {
    const a = current[name] || {};
    const b = proposed[name] || {};
    for (const f of fields) {
      const av = JSON.stringify(a[f] ?? null);
      const bv = JSON.stringify(b[f] ?? null);
      if (av !== bv) out.push({ name, field: f, before: a[f] ?? null, after: b[f] ?? null });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fairness heatmap
// ---------------------------------------------------------------------------

export function ownershipMatrix(history, memberNames) {
  const matrix = {};
  for (const name of memberNames) {
    matrix[name] = {};
    for (const c of DAR_COLUMN_IDS) matrix[name][c] = 0;
  }
  for (const rot of history) {
    for (const name of memberNames) {
      const c = darIn(rot, name);
      if (c && DAR_COLUMN_IDS.includes(c)) matrix[name][c] += 1;
    }
  }
  return matrix;
}

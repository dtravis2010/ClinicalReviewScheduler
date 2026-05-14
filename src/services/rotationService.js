import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, orderBy, limit as fbLimit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ROTATION_COLLECTIONS, ROTATION_STATUS, RULES_DOC_ID, DEFAULT_RULES, TEAM_ROSTER } from '../constants/rotation';
import { validateRotation, validateTeamMember } from '../schemas/rotationSchema';
import { logger } from '../utils/logger';
import bundledRotations from '../data/historicalRotations.json';

// 6+ years of rotation history shipped with the build (38 rotations, 2020-06
// through 2026-05). Used when Firestore is empty/unavailable so the app is
// useful out of the box.
const BUNDLED_ROTATIONS = bundledRotations;

// ---------------------------------------------------------------------------
// Rotations
// ---------------------------------------------------------------------------

export async function listRotations({ count = 50 } = {}) {
  if (!db) return BUNDLED_ROTATIONS.slice(0, count);
  try {
    const q = query(
      collection(db, ROTATION_COLLECTIONS.ROTATIONS),
      orderBy('effectiveDate', 'desc'),
      fbLimit(count),
    );
    const snap = await getDocs(q);
    const remote = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (remote.length > 0) return remote;
    // Firestore reachable but empty — fall back to the bundled history so the
    // app is useful before the supervisor runs the importer.
    return BUNDLED_ROTATIONS.slice(0, count);
  } catch (err) {
    logger.error('listRotations failed, using bundled history', err);
    return BUNDLED_ROTATIONS.slice(0, count);
  }
}

export async function getRotation(rotationId) {
  if (!rotationId) return null;
  const fromBundle = BUNDLED_ROTATIONS.find(r => r.id === rotationId);
  if (!db) return fromBundle || null;
  try {
    const ref = doc(db, ROTATION_COLLECTIONS.ROTATIONS, rotationId);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  } catch (err) {
    logger.error('getRotation failed', err);
  }
  return fromBundle || null;
}

export async function saveRotation(rotation, { validate = true } = {}) {
  if (!db) throw new Error('Firestore unavailable');
  if (validate) {
    const result = validateRotation(rotation);
    if (!result.success) {
      logger.error('Rotation validation failed', result.errors);
      throw new Error('Invalid rotation document');
    }
  }
  const payload = {
    ...rotation,
    updatedAt: serverTimestamp(),
    createdAt: rotation.createdAt || serverTimestamp(),
  };
  await setDoc(doc(db, ROTATION_COLLECTIONS.ROTATIONS, rotation.id), payload, { merge: false });
  return payload;
}

export async function publishRotation(rotationId) {
  const rotation = await getRotation(rotationId);
  if (!rotation) throw new Error(`Rotation ${rotationId} not found`);
  rotation.status = ROTATION_STATUS.PUBLISHED;
  return saveRotation(rotation);
}

export async function deleteRotation(rotationId) {
  if (!db) return;
  await deleteDoc(doc(db, ROTATION_COLLECTIONS.ROTATIONS, rotationId));
}

// ---------------------------------------------------------------------------
// Team members
// ---------------------------------------------------------------------------

function bundledTeamMembers() {
  // Derive a sensible starting state from the most recent bundled rotation so
  // the team page is populated even without Firestore.
  const latest = BUNDLED_ROTATIONS[0];
  const haveDar = new Set();
  const haveCpoe = new Set();
  const haveIncoming = new Set();
  const haveSpec = new Set();
  if (latest?.assignments) {
    for (const [name, row] of Object.entries(latest.assignments)) {
      if (row.dar) haveDar.add(name);
      if (row.cpoe) haveCpoe.add(name);
      if (row.incoming) haveIncoming.add(name);
      if (row.spec) haveSpec.add(name);
    }
  }
  return TEAM_ROSTER.map(p => {
    let level = 'incoming';
    let permanentRole = null;
    const spec = latest?.assignments?.[p.name]?.spec;
    if (spec === 'SPECIAL PROJECT') { level = 'perm'; permanentRole = 'SPECIAL PROJECT'; }
    else if (spec === 'FLOAT') level = 'float';
    else if (haveCpoe.has(p.name)) level = 'cpoe';
    else if (haveDar.has(p.name)) level = 'dar';
    return {
      name: p.name,
      tag: p.tag,
      level,
      permanentRole,
      coveredEntities: [],
      darClustersOwned: [],
      cpoeRotationsCount: 0,
      archived: false,
    };
  });
}

export async function listTeamMembers() {
  if (!db) return bundledTeamMembers();
  try {
    const snap = await getDocs(collection(db, ROTATION_COLLECTIONS.TEAM_MEMBERS));
    const remote = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return remote.length > 0 ? remote : bundledTeamMembers();
  } catch (err) {
    logger.error('listTeamMembers failed, using bundled roster', err);
    return bundledTeamMembers();
  }
}

export async function getTeamMember(name) {
  if (!db || !name) return null;
  const snap = await getDoc(doc(db, ROTATION_COLLECTIONS.TEAM_MEMBERS, name));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveTeamMember(member, { validate = true } = {}) {
  if (!db) throw new Error('Firestore unavailable');
  if (validate) {
    const result = validateTeamMember(member);
    if (!result.success) {
      logger.error('Team member validation failed', result.errors);
      throw new Error('Invalid team member document');
    }
  }
  await setDoc(doc(db, ROTATION_COLLECTIONS.TEAM_MEMBERS, member.name), member, { merge: true });
  return member;
}

export async function seedTeamMembersIfEmpty() {
  const existing = await listTeamMembers();
  if (existing.length > 0) return existing;
  const seeded = [];
  for (const person of TEAM_ROSTER) {
    const docObj = {
      name: person.name,
      level: 'incoming',
      permanentRole: null,
      coveredEntities: [],
      darClustersOwned: [],
      cpoeRotationsCount: 0,
      joinedDate: null,
      archived: false,
      tag: person.tag,
    };
    await saveTeamMember(docObj, { validate: false });
    seeded.push(docObj);
  }
  return seeded;
}

// ---------------------------------------------------------------------------
// Rules singleton
// ---------------------------------------------------------------------------

export async function getRules() {
  if (!db) return DEFAULT_RULES;
  const snap = await getDoc(doc(db, ROTATION_COLLECTIONS.RULES, RULES_DOC_ID));
  if (!snap.exists()) return DEFAULT_RULES;
  return { ...DEFAULT_RULES, ...snap.data() };
}

export async function saveRules(rules) {
  if (!db) throw new Error('Firestore unavailable');
  await setDoc(doc(db, ROTATION_COLLECTIONS.RULES, RULES_DOC_ID), rules, { merge: true });
  return rules;
}

// ---------------------------------------------------------------------------
// Volume snapshots
// ---------------------------------------------------------------------------

export async function saveVolumeSnapshot(snapshot) {
  if (!db) throw new Error('Firestore unavailable');
  await setDoc(
    doc(db, ROTATION_COLLECTIONS.VOLUME_SNAPSHOTS, snapshot.id),
    snapshot,
    { merge: false },
  );
  return snapshot;
}

export async function listVolumeSnapshots({ count = 20 } = {}) {
  if (!db) return [];
  try {
    const q = query(
      collection(db, ROTATION_COLLECTIONS.VOLUME_SNAPSHOTS),
      orderBy('takenAt', 'desc'),
      fbLimit(count),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    logger.error('listVolumeSnapshots failed', err);
    return [];
  }
}

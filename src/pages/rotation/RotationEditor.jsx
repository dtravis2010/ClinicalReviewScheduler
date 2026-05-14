import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Save, Upload, RotateCw, GitCompare, Check } from 'lucide-react';
import RotationShell from '../../components/rotation/RotationShell';
import RotationGrid from '../../components/rotation/RotationGrid';
import {
  getRotation, saveRotation,
  listRotations, listTeamMembers, getRules, seedTeamMembersIfEmpty,
  saveTeamMember,
} from '../../services/rotationService';
import { proposeRotation, diffAssignments, deriveMemberPatches } from '../../utils/rotationEngine';
import { ROTATION_STATUS, TEAM_ROSTER, DEFAULT_CLUSTERS } from '../../constants/rotation';
import { logger } from '../../utils/logger';
import { AuditService } from '../../services/auditService';

export default function RotationEditor() {
  const { rotationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const source = searchParams.get('source');

  const [rotation, setRotation] = useState(null);
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [rules, setRules] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [seed, setSeed] = useState(1);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { load(); }, [rotationId]);

  async function load() {
    try {
      await seedTeamMembersIfEmpty();
      const [existing, hist, mems, rls] = await Promise.all([
        getRotation(rotationId),
        listRotations({ count: 50 }),
        listTeamMembers(),
        getRules(),
      ]);
      const ordered = hist.filter(r => r.id !== rotationId);
      setHistory(ordered);
      setMembers(mems.length ? mems : TEAM_ROSTER.map(p => ({ ...p, level: 'incoming' })));
      setRules(rls);

      let doc = existing;
      if (!doc) {
        const fromCache = sessionStorage.getItem(`rotation:proposal:${rotationId}`);
        const seeded = fromCache ? JSON.parse(fromCache) : {};
        doc = {
          id: rotationId,
          label: rotationId,
          status: ROTATION_STATUS.DRAFT,
          clusters: { ...DEFAULT_CLUSTERS, ...(rls?.clusters || {}) },
          assignments: seeded,
        };
      }
      setRotation(doc);
      if (source === 'auto') {
        const result = proposeRotation({
          members: mems, history: ordered, rules: rls, seed: 1,
        });
        setProposal(result);
      }
    } catch (err) {
      logger.error('RotationEditor.load failed', err);
    }
  }

  function handleCellChange(name, colId, value) {
    setRotation(prev => {
      if (!prev) return prev;
      const assignments = { ...(prev.assignments || {}) };
      const row = { ...(assignments[name] || {}) };
      applyEdit(row, colId, value);
      assignments[name] = row;
      return { ...prev, assignments };
    });
    setDirty(true);
  }

  function handleReroll() {
    setSeed(s => s + 1);
    const result = proposeRotation({
      members, history, rules, seed: seed + 1,
    });
    setProposal(result);
  }

  function handleAcceptAll() {
    if (!proposal) return;
    setRotation(prev => ({
      ...prev,
      assignments: { ...prev.assignments, ...proposal.assignments },
    }));
    setProposal(null);
    setDirty(true);
  }

  function handleAcceptRow(name) {
    if (!proposal?.assignments?.[name]) return;
    setRotation(prev => ({
      ...prev,
      assignments: { ...prev.assignments, [name]: proposal.assignments[name] },
    }));
    setDirty(true);
  }

  async function handleSave() {
    if (!rotation) return;
    setSaving(true);
    try {
      await saveRotation(rotation, { validate: false });
      setDirty(false);
      await AuditService.log({
        action: 'save_rotation_draft',
        entityType: 'rotation',
        entityId: rotation.id,
      }).catch(() => {});
    } catch (err) {
      logger.error('Save failed', err);
      alert('Save failed — see console.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!rotation) return;
    if (!confirm(`Publish rotation ${rotation.id}? Team member records will be updated from the assignments.`)) return;
    setSaving(true);
    try {
      const published = { ...rotation, status: ROTATION_STATUS.PUBLISHED };
      await saveRotation(published, { validate: false });
      const patches = deriveMemberPatches(published, members);
      for (const [name, patch] of Object.entries(patches)) {
        const current = members.find(m => m.name === name);
        if (!current) continue;
        await saveTeamMember({ ...current, ...patch }, { validate: false });
      }
      await AuditService.log({
        action: 'publish_rotation',
        entityType: 'rotation',
        entityId: rotation.id,
        after: { status: ROTATION_STATUS.PUBLISHED, memberPatches: patches },
      }).catch(() => {});
      setRotation(published);
      setDirty(false);
      alert('Published.');
    } catch (err) {
      logger.error('Publish failed', err);
      alert('Publish failed — see console.');
    } finally {
      setSaving(false);
    }
  }

  const diff = useMemo(() => {
    if (!proposal || !rotation) return [];
    return diffAssignments(rotation.assignments, proposal.assignments);
  }, [proposal, rotation]);

  if (!rotation) {
    return <RotationShell title="Loading…"><div className="text-slate-400">Loading rotation…</div></RotationShell>;
  }

  const memberList = (members.length ? members : TEAM_ROSTER).map(m => ({
    name: m.name, tag: m.tag,
  }));

  return (
    <RotationShell
      title={`${rotation.label || rotation.id}`}
      actions={
        <>
          {proposal && (
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex items-center gap-1.5 bg-thr-green-500 hover:bg-thr-green-600 text-white px-3 py-1.5 rounded-lg text-body-sm font-semibold"
            >
              <Check className="w-4 h-4" /> Accept all
            </button>
          )}
          {proposal && (
            <button
              type="button"
              onClick={handleReroll}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-body-sm"
            >
              <RotateCw className="w-4 h-4" /> Reroll
            </button>
          )}
          {proposal && (
            <button
              type="button"
              onClick={() => setShowDiff(s => !s)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-body-sm"
            >
              <GitCompare className="w-4 h-4" /> Diff ({diff.length})
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-body-sm"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={saving}
            className="flex items-center gap-1.5 bg-thr-blue-600 hover:bg-thr-blue-700 text-white px-3 py-1.5 rounded-lg text-body-sm font-semibold"
          >
            <Upload className="w-4 h-4" /> Publish
          </button>
        </>
      }
    >
      {proposal?.sanity?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 mb-4 text-body-sm text-amber-900 dark:text-amber-100">
          <div className="font-semibold mb-1">Sanity warnings</div>
          <ul className="list-disc list-inside">
            {proposal.sanity.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {showDiff && proposal && (
        <DiffPanel diff={diff} onAcceptRow={handleAcceptRow} />
      )}

      <RotationGrid
        rotation={rotation}
        proposal={proposal?.assignments}
        members={memberList}
        history={history}
        editable
        onCellChange={handleCellChange}
      />

      <div className="mt-6 flex items-center justify-between text-caption text-slate-400">
        <div>
          {source === 'auto' && proposal && 'Suggestions shown inline — hover any cell for the reason.'}
          {source === 'clone' && 'Cloned from previous rotation. Edit as needed.'}
        </div>
        <button
          type="button"
          onClick={() => navigate('/rotation/overview')}
          className="hover:underline"
        >
          Back to overview
        </button>
      </div>
    </RotationShell>
  );
}

function applyEdit(row, colId, value) {
  const v = (value || '').trim();
  if (colId === 'cpoe') row.cpoe = !!v;
  else if (colId === 'inc') row.incoming = v || null;
  else if (colId === 'cross') row.cross = v || null;
  else if (colId === 'spec') row.spec = v || null;
  else if (colId === 'trn') row.trn = v.toUpperCase().startsWith('X');
  else if (colId.startsWith('dar')) {
    row.dar = v.toUpperCase().startsWith('X') ? colId : (row.dar === colId ? null : row.dar);
  }
}

function DiffPanel({ diff, onAcceptRow }) {
  if (!diff.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
      <div className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
        Proposed changes ({diff.length})
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700 text-body-sm">
        {diff.map((d, i) => (
          <li key={i} className="py-2 flex items-center gap-3">
            <span className="font-semibold w-32 truncate">{d.name}</span>
            <span className="text-slate-500 w-16">{d.field}</span>
            <span className="text-slate-400 line-through">{fmt(d.before)}</span>
            <span className="text-slate-400">→</span>
            <span className="text-thr-green-700 font-semibold">{fmt(d.after)}</span>
            <button
              type="button"
              onClick={() => onAcceptRow(d.name)}
              className="ml-auto text-thr-blue-600 hover:underline text-caption"
            >
              Accept row
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

import { useEffect, useMemo, useState } from 'react';
import RotationShell from '../../components/rotation/RotationShell';
import { getRules, saveRules, saveVolumeSnapshot, listVolumeSnapshots } from '../../services/rotationService';
import { DAR_COLUMN_IDS, DEFAULT_CLUSTERS, ENTITIES } from '../../constants/rotation';
import { Save, Upload } from 'lucide-react';

export default function ClusterRebalance() {
  const [rules, setRules] = useState(null);
  const [clusters, setClusters] = useState(() => ({ ...DEFAULT_CLUSTERS }));
  const [volumes, setVolumes] = useState({});
  const [csvText, setCsvText] = useState('');
  const [snapshots, setSnapshots] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await getRules();
    setRules(r);
    setClusters({ ...DEFAULT_CLUSTERS, ...(r?.clusters || {}) });
    const snaps = await listVolumeSnapshots({ count: 5 });
    setSnapshots(snaps);
    if (snaps[0]) setVolumes(snaps[0].perEntity || {});
  }

  function parseCsv() {
    const out = {};
    csvText.split(/\r?\n/).forEach(line => {
      const [code, qty] = line.split(/[,\t]/).map(s => s?.trim());
      if (code && qty && !isNaN(Number(qty))) out[code.toUpperCase()] = Number(qty);
    });
    setVolumes(out);
  }

  async function saveSnapshotAction() {
    const id = `vol-${new Date().toISOString().slice(0, 10)}-${Date.now()}`;
    const snap = {
      id,
      takenAt: new Date().toISOString(),
      source: 'manual',
      perEntity: volumes,
    };
    await saveVolumeSnapshot(snap);
    setSnapshots([snap, ...snapshots]);
  }

  function moveEntity(entity, fromCluster, toCluster) {
    setClusters(prev => {
      const next = { ...prev };
      if (fromCluster && next[fromCluster]) {
        next[fromCluster] = {
          ...next[fromCluster],
          entities: next[fromCluster].entities.filter(e => e !== entity),
        };
      }
      if (next[toCluster]) {
        next[toCluster] = {
          ...next[toCluster],
          entities: [...new Set([...next[toCluster].entities, entity])],
        };
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveRules({ ...rules, clusters });
      alert('Cluster composition saved — effective next rotation.');
    } finally {
      setSaving(false);
    }
  }

  const totals = useMemo(() => {
    const out = {};
    for (const id of DAR_COLUMN_IDS) {
      const c = clusters[id];
      if (!c) continue;
      out[id] = c.entities.reduce((a, e) => a + (volumes[e] || 0), 0);
    }
    return out;
  }, [clusters, volumes]);

  const avg = useMemo(() => {
    const vals = Object.values(totals).filter(v => v > 0);
    if (!vals.length) return 0;
    return vals.reduce((a, v) => a + v, 0) / vals.length;
  }, [totals]);

  return (
    <RotationShell
      title="Cluster rebalance"
      actions={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-thr-blue-600 hover:bg-thr-blue-700 text-white px-3 py-1.5 rounded-lg text-body-sm font-semibold"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save · effective next rotation'}
        </button>
      }
    >
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
          📊 Pull latest Epic numbers
        </div>
        <p className="text-body-sm text-slate-500 mb-3">
          Paste CSV (one line per entity: <code className="font-mono text-caption">ENTITY,weekly_count</code>).
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="THP,420&#10;FW,310&#10;HEB,280"
          rows={5}
          className="w-full font-mono text-body-sm px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={parseCsv}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-body-sm"
          >
            <Upload className="w-4 h-4" /> Parse
          </button>
          <button
            type="button"
            onClick={saveSnapshotAction}
            disabled={!Object.keys(volumes).length}
            className="flex items-center gap-1.5 bg-thr-green-500 hover:bg-thr-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-body-sm"
          >
            Save snapshot
          </button>
          {snapshots[0] && (
            <span className="ml-auto text-caption text-slate-400 self-center">
              latest: {new Date(snapshots[0].takenAt).toLocaleString()}
            </span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAR_COLUMN_IDS.map(id => {
          const c = clusters[id] || { label: id, entities: [] };
          const total = totals[id] || 0;
          const pct = avg ? Math.round((total / avg) * 100) : 0;
          const heavy = pct > 130;
          const light = pct > 0 && pct < 70;
          return (
            <div
              key={id}
              className={`rounded-xl border-2 p-4 ${
                heavy ? 'border-red-300 bg-red-50' :
                light ? 'border-amber-300 bg-amber-50' :
                'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{c.label}</h3>
                {avg > 0 && (
                  <span className={`text-caption font-bold ${heavy ? 'text-red-600' : light ? 'text-amber-700' : 'text-slate-500'}`}>
                    {pct}% of avg
                  </span>
                )}
              </div>
              <div className="text-caption text-slate-500 mb-2">
                weekly volume: <strong className="text-slate-800 dark:text-slate-100">{total}</strong>
              </div>
              {heavy && (
                <div className="text-caption font-semibold text-red-700 mb-2">running heavy</div>
              )}
              {light && (
                <div className="text-caption text-amber-800 mb-2">
                  has room — can absorb ~{Math.max(1, Math.round(avg - total))}/wk
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {c.entities.map(e => (
                  <EntityChip
                    key={e}
                    code={e}
                    volume={volumes[e]}
                    fromCluster={id}
                    onMove={moveEntity}
                  />
                ))}
                <AddEntityButton currentClusterId={id} clusters={clusters} onMove={moveEntity} />
              </div>
            </div>
          );
        })}
      </div>
    </RotationShell>
  );
}

function EntityChip({ code, volume, fromCluster, onMove }) {
  return (
    <div className="group inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 rounded-full text-caption">
      <span className="font-mono font-semibold">{code}</span>
      {volume !== undefined && <span className="text-slate-500">· {volume}/wk</span>}
      <select
        value=""
        onChange={(e) => e.target.value && onMove(code, fromCluster, e.target.value)}
        className="opacity-0 group-hover:opacity-100 text-caption bg-transparent border-0 cursor-pointer"
        aria-label={`move ${code}`}
      >
        <option value="">↪</option>
        {DAR_COLUMN_IDS.filter(d => d !== fromCluster).map(d => (
          <option key={d} value={d}>{d.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}

function AddEntityButton({ currentClusterId, clusters, onMove }) {
  const allInClusters = new Set(
    Object.values(clusters).flatMap(c => c.entities),
  );
  const orphans = ENTITIES.filter(e => !allInClusters.has(e));
  if (!orphans.length) return null;
  return (
    <select
      value=""
      onChange={(e) => e.target.value && onMove(e.target.value, null, currentClusterId)}
      className="text-caption bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 rounded-full px-2 py-1"
    >
      <option value="">+ add</option>
      {orphans.map(e => <option key={e} value={e}>{e}</option>)}
    </select>
  );
}

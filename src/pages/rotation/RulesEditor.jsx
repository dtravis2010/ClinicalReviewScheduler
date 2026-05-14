import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RotationShell from '../../components/rotation/RotationShell';
import { getRules, saveRules } from '../../services/rotationService';
import { LEVELS, DEFAULT_RULES } from '../../constants/rotation';
import { Save, Trash2, Plus, ArrowRight } from 'lucide-react';

export default function RulesEditor() {
  const [rules, setRules] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await getRules();
    setRules(r || DEFAULT_RULES);
  }

  function update(patch) {
    setRules(prev => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    if (!rules) return;
    setSaving(true);
    try {
      await saveRules(rules);
      alert('Rules saved.');
    } catch (e) {
      console.error(e);
      alert('Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (!rules) {
    return <RotationShell title="Rules"><div className="text-slate-400">Loading…</div></RotationShell>;
  }

  return (
    <RotationShell
      title="Auto-rotate rules"
      actions={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-thr-blue-600 hover:bg-thr-blue-700 text-white px-3 py-1.5 rounded-lg text-body-sm font-semibold"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save rules'}
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Skill ladder">
          <div className="flex items-center gap-2 flex-wrap">
            {LEVELS.map((l, i) => (
              <span
                key={l.id}
                className="px-2.5 py-1 rounded-full text-caption font-semibold text-white"
                style={{ background: l.color }}
              >
                {i + 1}. {l.label}
              </span>
            ))}
          </div>
          <p className="text-caption text-slate-500 mt-3">Order is fixed.</p>
        </Section>

        <Section title="Fairness thresholds">
          <NumberInput
            label="No repeat DAR for N rotations"
            value={rules.noRepeatDarRotations}
            onChange={(v) => update({ noRepeatDarRotations: v })}
          />
          <NumberInput
            label="Promote from CPOE after N rotations"
            value={rules.promoteFromCpoeAfter}
            onChange={(v) => update({ promoteFromCpoeAfter: v })}
          />
          <NumberInput
            label="Max DAR per person per rotation"
            value={rules.maxDarPerPerson}
            onChange={(v) => update({ maxDarPerPerson: v })}
          />
          <NumberInput
            label="Max side-roles per person per rotation"
            value={rules.maxSideRolesPerPerson}
            onChange={(v) => update({ maxSideRolesPerPerson: v })}
          />
        </Section>

        <Section title="★ Permanent roles">
          <PairList
            pairs={rules.permanentRoles || []}
            keyA="name" keyB="role"
            labelA="Person" labelB="Role"
            onChange={(permanentRoles) => update({ permanentRoles })}
          />
        </Section>

        <Section title="Float pool">
          <StringList
            list={rules.floatPool || []}
            label="Person"
            onChange={(floatPool) => update({ floatPool })}
          />
        </Section>

        <Section title="↻ Rotating side-roles">
          <PairList
            pairs={rules.sideRoles || []}
            keyA="label" keyB="description"
            labelA="Label" labelB="Description"
            onChange={(sideRoles) => update({ sideRoles })}
          />
        </Section>

        <Section title="DAR clusters">
          <p className="text-body-sm text-slate-500 mb-3">
            Cluster compositions live with the rules, but past rotations keep
            their snapshot. Use Cluster Rebalance to change them.
          </p>
          <Link
            to="/rotation/rules/clusters"
            className="inline-flex items-center gap-1.5 text-thr-blue-600 hover:underline"
          >
            Open cluster rebalance <ArrowRight className="w-4 h-4" />
          </Link>
        </Section>
      </div>
    </RotationShell>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <h2 className="text-h3 font-semibold mb-3 text-slate-800 dark:text-slate-100">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-body-sm text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="number"
        min={0}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-right"
      />
    </label>
  );
}

function StringList({ list, label, onChange }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="space-y-2">
      {list.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex-1 font-mono text-body-sm">{v}</span>
          <button
            type="button"
            onClick={() => onChange(list.filter((_, ix) => ix !== i))}
            className="text-slate-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onClick={() => { onChange([...list, draft.trim()]); setDraft(''); }}
          className="bg-thr-blue-600 text-white px-3 py-1 rounded text-body-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PairList({ pairs, keyA, keyB, labelA, labelB, onChange }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  return (
    <div className="space-y-2">
      {pairs.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex-1 font-mono text-body-sm">{p[keyA]}</span>
          <span className="text-slate-400">→</span>
          <span className="flex-1 text-body-sm">{p[keyB]}</span>
          <button
            type="button"
            onClick={() => onChange(pairs.filter((_, ix) => ix !== i))}
            className="text-slate-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          type="text" placeholder={labelA} value={a}
          onChange={(e) => setA(e.target.value)}
          className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
        />
        <input
          type="text" placeholder={labelB} value={b}
          onChange={(e) => setB(e.target.value)}
          className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
        />
        <button
          type="button"
          disabled={!a.trim() || !b.trim()}
          onClick={() => {
            onChange([...pairs, { [keyA]: a.trim(), [keyB]: b.trim() }]);
            setA(''); setB('');
          }}
          className="bg-thr-blue-600 text-white px-3 py-1 rounded text-body-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

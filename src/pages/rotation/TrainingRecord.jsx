import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import RotationShell from '../../components/rotation/RotationShell';
import { getTeamMember, saveTeamMember, listRotations, getRules } from '../../services/rotationService';
import { LEVELS, DAR_COLUMN_IDS, ENTITIES, TAG_COLORS } from '../../constants/rotation';
import { darIn, promotionSuggestion } from '../../utils/rotationEngine';
import { ArrowLeft, Check, Star } from 'lucide-react';

export default function TrainingRecord() {
  const { name } = useParams();
  const decoded = decodeURIComponent(name);
  const [member, setMember] = useState(null);
  const [history, setHistory] = useState([]);
  const [rules, setRules] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [decoded]);

  async function load() {
    const [m, hist, rls] = await Promise.all([
      getTeamMember(decoded),
      listRotations({ count: 50 }),
      getRules(),
    ]);
    setMember(m);
    setHistory(hist);
    setRules(rls);
  }

  async function setLevel(level) {
    if (!member) return;
    setSaving(true);
    try {
      const next = { ...member, level };
      await saveTeamMember(next, { validate: false });
      setMember(next);
    } finally {
      setSaving(false);
    }
  }

  if (!member) {
    return <RotationShell title={decoded}><div className="text-slate-400">Loading…</div></RotationShell>;
  }

  const covered = new Set(member.coveredEntities || []);
  const owned = new Set(member.darClustersOwned || []);
  const promo = promotionSuggestion(member, rules);
  const memberHistory = history.slice(0, 12);

  return (
    <RotationShell
      title={
        <span style={{ color: TAG_COLORS[member.tag] || '#212529' }}>
          {member.name}
        </span>
      }
      actions={
        <Link
          to="/rotation/team"
          className="flex items-center gap-1.5 text-body-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to team
        </Link>
      }
    >
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <div className="text-caption uppercase tracking-wider text-slate-400 mb-2">Skill ladder</div>
        <div className="flex items-center gap-2 flex-wrap">
          {LEVELS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevel(l.id)}
              disabled={saving}
              className={`px-3 py-1.5 rounded-lg border text-body-sm transition ${
                member.level === l.id
                  ? 'border-thr-blue-500 bg-thr-blue-50 text-thr-blue-700 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        {promo && (
          <div className="mt-3 flex items-center gap-2 text-thr-green-700 text-body-sm">
            <Star className="w-4 h-4" /> Ready for promotion to <strong>{promo}</strong>
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <div className="text-caption uppercase tracking-wider text-slate-400 mb-2">DAR clusters owned</div>
        <div className="grid grid-cols-5 gap-3">
          {DAR_COLUMN_IDS.map(d => (
            <div
              key={d}
              className={`rounded-lg border px-3 py-3 text-center ${
                owned.has(d)
                  ? 'border-thr-green-500 bg-thr-green-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="font-bold">DAR {d.slice(3)}</div>
              <div className="text-caption mt-1">
                {owned.has(d) ? <Check className="w-4 h-4 mx-auto text-thr-green-700" /> : 'never'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <div className="text-caption uppercase tracking-wider text-slate-400 mb-2">
          Entities covered ({covered.size}/{ENTITIES.length})
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {ENTITIES.map(e => (
            <div
              key={e}
              className={`text-center px-2 py-2 rounded-lg text-caption font-mono ${
                covered.has(e)
                  ? 'bg-thr-green-50 text-thr-green-800 border border-thr-green-200'
                  : 'bg-slate-50 text-slate-400 border border-slate-200'
              }`}
            >
              {e}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="text-caption uppercase tracking-wider text-slate-400 mb-2">Rotation history</div>
        <table className="w-full text-body-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Rotation</th>
              <th className="py-2">DAR</th>
              <th className="py-2">Incoming</th>
              <th className="py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {memberHistory.map(rot => {
              const row = rot.assignments?.[member.name];
              return (
                <tr key={rot.id} className="border-t border-slate-100">
                  <td className="py-2">{rot.label || rot.id}</td>
                  <td className="py-2 font-semibold">
                    {darIn(rot, member.name) ? darLabel(darIn(rot, member.name)) : '—'}
                  </td>
                  <td className="py-2">{row?.incoming || '—'}</td>
                  <td className="py-2 text-slate-500">{row?.spec || row?.cross || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </RotationShell>
  );
}

function darLabel(id) {
  if (id === 'trn') return 'Training';
  return `DAR ${id.slice(3)}`;
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Copy, ArrowRight } from 'lucide-react';
import RotationShell from '../../components/rotation/RotationShell';
import { listRotations, listTeamMembers, getRules, seedTeamMembersIfEmpty } from '../../services/rotationService';
import { proposeRotation } from '../../utils/rotationEngine';
import { logger } from '../../utils/logger';

export default function LandingPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      await seedTeamMembersIfEmpty();
      const [rots, mems, rls] = await Promise.all([
        listRotations({ count: 50 }),
        listTeamMembers(),
        getRules(),
      ]);
      setHistory(rots);
      setMembers(mems);
      setRules(rls);
    } catch (err) {
      logger.error('Rotation overview load failed', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAutoDraft() {
    if (!members.length || !rules) return;
    const result = proposeRotation({ members, history, rules });
    const nextId = nextRotationId(history);
    sessionStorage.setItem(`rotation:proposal:${nextId}`, JSON.stringify(result.assignments));
    navigate(`/rotation/editor/${nextId}?source=auto`);
  }

  function handleCloneLast() {
    if (!history.length) return;
    const last = history[0];
    const nextId = nextRotationId(history);
    sessionStorage.setItem(`rotation:proposal:${nextId}`, JSON.stringify(last.assignments));
    navigate(`/rotation/editor/${nextId}?source=clone&from=${last.id}`);
  }

  const currentTitle = nextRotationTitle(history);

  return (
    <RotationShell title="Build the next rotation">
      <div className="bg-gradient-to-br from-thr-blue-500 to-thr-green-500 dark:from-thr-blue-700 dark:to-thr-green-700 rounded-2xl p-8 text-white shadow-soft-lg mb-8">
        <div className="text-caption uppercase tracking-wider text-thr-blue-100 mb-2">
          {loading ? '...' : `${history.length} past rotations imported`}
        </div>
        <h2 className="text-h1 font-bold mb-3">{currentTitle}</h2>
        <p className="text-thr-blue-50 max-w-xl mb-6">
          Auto-draft uses 6+ years of rotation history to suggest who owns each
          DAR cluster, who covers New Incoming, and which DAR person carries
          the 3:01PM email this rotation.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAutoDraft}
            disabled={loading || !members.length || !rules}
            className="flex items-center gap-2 bg-white text-thr-blue-700 hover:bg-thr-blue-50 px-5 py-3 rounded-xl font-semibold disabled:opacity-60"
          >
            <Sparkles className="w-5 h-5" />
            Auto-draft from history
          </button>
          <button
            type="button"
            onClick={handleCloneLast}
            disabled={loading || !history.length}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-5 py-3 rounded-xl font-medium disabled:opacity-60"
          >
            <Copy className="w-5 h-5" />
            Open last rotation to clone
          </button>
        </div>
      </div>

      <section>
        <h3 className="text-h3 font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Recent rotations
        </h3>
        {loading ? (
          <div className="text-slate-400">Loading…</div>
        ) : history.length === 0 ? (
          <EmptyImportPrompt />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {history.slice(0, 12).map(rot => (
              <button
                key={rot.id}
                onClick={() => navigate(`/rotation/editor/${rot.id}`)}
                className="text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-card-hover transition"
              >
                <div className="text-caption uppercase tracking-wide text-slate-500">{rot.id}</div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">{rot.label}</div>
                <div className="text-caption text-thr-blue-600 flex items-center gap-1 mt-2">
                  Open <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </RotationShell>
  );
}

function EmptyImportPrompt() {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
      <div className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
        No rotation history yet
      </div>
      <div className="text-body-sm text-amber-800 dark:text-amber-200 mb-3">
        Run the importer to load the team's historical workbook:
      </div>
      <code className="block text-caption bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 rounded font-mono">
        node scripts/importRotationHistory.mjs --seed
      </code>
    </div>
  );
}

function nextRotationId(history) {
  if (!history.length) return defaultNextId();
  const last = history[0].id;
  const [y, m] = last.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() + 2);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

function nextRotationTitle(history) {
  const id = nextRotationId(history);
  const [y, m] = id.split('-').map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long' });
  const next = new Date(y, m - 1, 1);
  next.setMonth(next.getMonth() + 1);
  const next2 = next.toLocaleString('en-US', { month: 'long' });
  return `${monthName}–${next2} ${y}`;
}

function defaultNextId() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

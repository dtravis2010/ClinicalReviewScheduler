import { useEffect, useMemo, useState } from 'react';
import RotationShell from '../../components/rotation/RotationShell';
import { listRotations, listTeamMembers, seedTeamMembersIfEmpty } from '../../services/rotationService';
import { DAR_COLUMN_IDS, TAG_COLORS } from '../../constants/rotation';
import { ownershipMatrix } from '../../utils/rotationEngine';

const WINDOWS = [
  { id: 6, label: 'Last 6 rotations' },
  { id: 12, label: 'Last 12 rotations' },
  { id: 999, label: 'All-time' },
];

export default function FairnessHeatmap() {
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [windowSize, setWindowSize] = useState(6);

  useEffect(() => { load(); }, []);

  async function load() {
    await seedTeamMembersIfEmpty();
    const [rots, mems] = await Promise.all([
      listRotations({ count: 50 }),
      listTeamMembers(),
    ]);
    setHistory(rots);
    setMembers(mems);
  }

  const slice = history.slice(0, windowSize);
  const matrix = useMemo(
    () => ownershipMatrix(slice, members.map(m => m.name)),
    [slice, members],
  );

  return (
    <RotationShell
      title="Cluster fairness"
      actions={
        <select
          value={windowSize}
          onChange={(e) => setWindowSize(Number(e.target.value))}
          className="text-body-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
        >
          {WINDOWS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
        </select>
      }
    >
      <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-body-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left border-b border-slate-200 dark:border-slate-700">Team Member</th>
              {DAR_COLUMN_IDS.map(d => (
                <th key={d} className="px-3 py-2 text-center border-b border-slate-200 dark:border-slate-700">
                  DAR {d.slice(3)}
                </th>
              ))}
              <th className="px-3 py-2 text-center border-b border-slate-200 dark:border-slate-700">Never on</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const row = matrix[m.name] || {};
              const never = DAR_COLUMN_IDS.filter(d => !row[d]);
              return (
                <tr key={m.name} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-3 py-2">
                    <span style={{ color: TAG_COLORS[m.tag] || '#212529' }} className="font-semibold">
                      {m.name}
                    </span>
                  </td>
                  {DAR_COLUMN_IDS.map(d => (
                    <td key={d} className="px-3 py-2 text-center">
                      <HeatCell count={row[d] || 0} />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    {never.length === 0 ? (
                      <span className="text-thr-green-700 font-semibold">—</span>
                    ) : (
                      <span className="text-caption text-red-600 font-semibold">
                        {never.map(d => d.slice(3)).join(', ')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Legend />
    </RotationShell>
  );
}

function HeatCell({ count }) {
  const color = count === 0
    ? 'bg-white border border-slate-200 text-slate-300'
    : count === 1
      ? 'bg-thr-green-50 border-thr-green-100 text-thr-green-800'
      : count === 2
        ? 'bg-thr-green-200 border-thr-green-300 text-thr-green-900'
        : 'bg-thr-green-500 border-thr-green-600 text-white';
  return (
    <div className={`inline-flex w-9 h-9 items-center justify-center rounded-lg font-bold border ${color}`}>
      {count || ''}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 mt-4 text-caption text-slate-500">
      <span>Never</span>
      <HeatCell count={0} />
      <HeatCell count={1} />
      <HeatCell count={2} />
      <HeatCell count={3} />
      <span>3+ times</span>
    </div>
  );
}

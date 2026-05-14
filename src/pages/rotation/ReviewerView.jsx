import { useEffect, useState } from 'react';
import RotationShell from '../../components/rotation/RotationShell';
import { listRotations } from '../../services/rotationService';
import { ROTATION_STATUS } from '../../constants/rotation';
import { darIn } from '../../utils/rotationEngine';

export default function ReviewerView() {
  const [rotations, setRotations] = useState([]);
  const [name, setName] = useState(() => localStorage.getItem('reviewer:name') || '');

  useEffect(() => { listRotations({ count: 12 }).then(setRotations); }, []);
  useEffect(() => { localStorage.setItem('reviewer:name', name); }, [name]);

  const current = rotations.find(r => r.status === ROTATION_STATUS.PUBLISHED);
  const upper = name.trim().toUpperCase();
  const myRow = current?.assignments?.[upper];
  const myDar = current ? darIn(current, upper) : null;
  const cluster = myDar && current?.clusters?.[myDar];

  return (
    <RotationShell title="My rotation">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <label className="text-caption uppercase tracking-wider text-slate-400">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ALYSSA"
          className="block w-full md:w-72 mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-h3"
        />
      </div>

      {!current && (
        <div className="text-slate-400">No published rotation yet.</div>
      )}

      {current && upper && !myRow && (
        <div className="text-slate-500">
          No assignment found for <strong>{upper}</strong> in {current.label}.
        </div>
      )}

      {current && upper && myRow && (
        <div className="bg-gradient-to-br from-thr-blue-500 to-thr-green-500 text-white rounded-2xl p-8 shadow-soft-lg">
          <div className="text-caption uppercase tracking-wider text-thr-blue-100 mb-2">
            {current.label}
          </div>
          <h2 className="text-h1 font-bold mb-3 text-white">
            {myDar ? `You have DAR ${myDar === 'trn' ? 'Training' : myDar.slice(3)} this rotation` :
              myRow.cpoe ? 'You are on CPOE this rotation' :
              myRow.incoming ? `You are on New Incoming: ${myRow.incoming}` :
              myRow.spec || 'No primary assignment listed'}
          </h2>
          {cluster && (
            <div className="text-thr-blue-50">
              Entities: {cluster.entities.join(' / ')}
            </div>
          )}
          {myRow.side?.length > 0 && (
            <div className="mt-3 text-thr-blue-50">
              Side-roles: {myRow.side.join(', ')}
            </div>
          )}
        </div>
      )}

      {current && upper && (
        <section className="mt-6">
          <h3 className="text-h3 font-semibold mb-2 text-slate-800 dark:text-slate-100">Last 4 rotations</h3>
          <table className="w-full text-body-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-2">Rotation</th>
                <th className="px-3 py-2">DAR</th>
                <th className="px-3 py-2">Incoming</th>
              </tr>
            </thead>
            <tbody>
              {rotations.slice(0, 4).map(rot => (
                <tr key={rot.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{rot.label || rot.id}</td>
                  <td className="px-3 py-2 font-semibold">{darIn(rot, upper) ? labelOf(darIn(rot, upper)) : '—'}</td>
                  <td className="px-3 py-2">{rot.assignments?.[upper]?.incoming || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </RotationShell>
  );
}

function labelOf(d) {
  if (d === 'trn') return 'Training';
  return `DAR ${d.slice(3)}`;
}

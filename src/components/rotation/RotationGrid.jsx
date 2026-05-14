import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { COLUMN_DEFS, DAR_COLUMN_IDS, TAG_COLORS } from '../../constants/rotation';
import { darIn } from '../../utils/rotationEngine';

export default function RotationGrid({
  rotation, proposal, members, history = [], editable = true, onCellChange,
}) {
  const [hoverName, setHoverName] = useState(null);
  const assignments = rotation?.assignments || {};
  const clusters = rotation?.clusters || {};

  const namedMembers = useMemo(
    () => members.map(m => ({ ...m, tag: m.tag || 'black' })),
    [members],
  );

  return (
    <div className="overflow-x-auto rounded-xl bg-white dark:bg-slate-800 shadow-card">
      <table className="min-w-full text-body-sm border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-slate-100 bg-slate-700 border border-slate-600 min-w-[160px]">
              TEAM MEMBER
            </th>
            {COLUMN_DEFS.map(col => {
              const sub = clusters?.[col.id]?.entities;
              return (
                <th
                  key={col.id}
                  className="px-2 py-2 text-center font-semibold text-thr-blue-900 bg-thr-blue-100 border border-thr-blue-200 align-top"
                >
                  <div className="text-caption uppercase tracking-wide">{col.label}</div>
                  {sub?.length ? (
                    <div className="text-[10px] font-medium mt-1 text-thr-blue-700">
                      {sub.join(' / ')}
                    </div>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {namedMembers.map(person => (
            <RotationRow
              key={person.name}
              person={person}
              row={assignments[person.name] || {}}
              proposed={proposal?.[person.name]}
              history={history}
              editable={editable}
              onCellChange={onCellChange}
              hovered={hoverName === person.name}
              onHover={(active) => setHoverName(active ? person.name : null)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RotationRow({ person, row, proposed, history, editable, onCellChange, hovered, onHover }) {
  return (
    <tr
      className={`${hovered ? 'bg-thr-blue-50/60 dark:bg-slate-700/40' : ''} group`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <td className="px-3 py-2 border border-slate-200 dark:border-slate-700 whitespace-nowrap relative">
        <span
          className="font-semibold tracking-wide"
          style={{ color: TAG_COLORS[person.tag] || '#212529' }}
        >
          {person.name}
        </span>
        {hovered && history.length > 0 && (
          <HistoryPopover history={history} name={person.name} />
        )}
      </td>
      {COLUMN_DEFS.map(col => (
        <RotationCell
          key={col.id}
          col={col}
          name={person.name}
          row={row}
          proposed={proposed}
          editable={editable}
          onCellChange={onCellChange}
        />
      ))}
    </tr>
  );
}

function RotationCell({ col, name, row, proposed, editable, onCellChange }) {
  const value = readValue(col.id, row);
  const proposedValue = proposed ? readValue(col.id, proposed) : null;
  const reason = proposed?.reasons?.[reasonFieldFor(col.id)] || row?.reasons?.[reasonFieldFor(col.id)];
  const showGhost = !value && proposedValue;
  const isDar = col.kind === 'dar';

  return (
    <td
      className="px-2 py-2 border border-slate-200 dark:border-slate-700 text-center align-top min-w-[88px] relative"
      title={reason || ''}
    >
      {editable ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onCellChange?.(name, col.id, e.target.value)}
          maxLength={isDar ? 1 : 60}
          className={`w-full bg-transparent text-center outline-none focus:bg-thr-blue-50 dark:focus:bg-slate-700 rounded ${
            value ? 'font-bold' : 'text-slate-300'
          }`}
        />
      ) : (
        <span className={value ? 'font-bold' : 'text-slate-300'}>{value || ''}</span>
      )}
      {showGhost && (
        <div className="absolute inset-x-1 bottom-0.5 flex items-center justify-center gap-0.5 pointer-events-none">
          <Sparkles className="w-3 h-3 text-thr-green-600" />
          <span className="text-[10px] font-semibold text-thr-green-700 truncate">
            {proposedValue}
          </span>
        </div>
      )}
      {reason && (value || proposedValue) && (
        <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[110px] mx-auto">
          {reason}
        </div>
      )}
    </td>
  );
}

function readValue(colId, row) {
  if (!row) return null;
  if (colId === 'cpoe') return row.cpoe ? 'CPOE' : null;
  if (colId === 'inc') return row.incoming || null;
  if (colId === 'cross') return row.cross || null;
  if (colId === 'spec') return row.spec || null;
  if (colId === 'trn') return row.trn ? 'X' : null;
  if (DAR_COLUMN_IDS.includes(colId)) return row.dar === colId ? 'X' : null;
  return null;
}

function reasonFieldFor(colId) {
  if (DAR_COLUMN_IDS.includes(colId)) return 'dar';
  if (colId === 'inc') return 'incoming';
  return colId;
}

function HistoryPopover({ history, name }) {
  const last6 = history.slice(0, 6);
  const owned = last6.map(rot => ({ id: rot.id, label: rot.label || rot.id, dar: darIn(rot, name) }));
  const ownedClusters = new Set(owned.map(o => o.dar).filter(Boolean));
  const pattern = ownedClusters.size === 0
    ? 'no DAR history in window'
    : DAR_COLUMN_IDS
        .filter(d => !ownedClusters.has(d))
        .map(d => `never on DAR ${d.slice(3)}`)
        .slice(0, 2)
        .join(' · ') || 'rotated through everything';

  return (
    <div className="absolute left-full top-0 z-20 ml-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-soft-md p-3">
      <div className="text-caption text-slate-500 mb-1">Last 6 rotations</div>
      <ul className="space-y-1 mb-2">
        {owned.map(o => (
          <li key={o.id} className="flex justify-between text-body-sm">
            <span className="text-slate-600">{o.label}</span>
            <span className="font-semibold text-slate-800">
              {o.dar ? labelOf(o.dar) : '—'}
            </span>
          </li>
        ))}
      </ul>
      <div className="text-caption italic text-thr-blue-700">{pattern}</div>
    </div>
  );
}

function labelOf(darId) {
  if (darId === 'trn') return 'Training';
  return `DAR ${darId.slice(3)}`;
}

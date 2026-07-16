import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { UserSearch, CheckCircle2, Sparkles } from 'lucide-react';
import { getActiveEmployees, getEntityShortCode } from '../utils/scheduleUtils';

/**
 * MyAssignments component
 * Lets a clinician pick their name and see a plain-language summary of
 * everywhere they are assigned in the current published schedule.
 * Controlled: selection state lives in the parent so it can also
 * highlight the matching row in the schedule grid.
 */
export default function MyAssignments({
  schedule,
  employees = [],
  entities = [],
  selectedEmployeeId,
  onSelectEmployee
}) {
  const activeEmployees = useMemo(() => {
    const active = getActiveEmployees(employees);
    return [...active].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [employees]);

  const summary = useMemo(() => {
    if (!schedule || !selectedEmployeeId) return null;

    const assignment = schedule.assignments?.[selectedEmployeeId];
    const items = [];
    if (!assignment) return items;

    const darEntities = schedule.darEntities || {};
    const incomingEntities = schedule.incomingEntities || {};
    const headerTexts = schedule.headerTexts || {};

    (assignment.dars || []).forEach((darIdx) => {
      const entityList = darEntities[darIdx];
      const names = Array.isArray(entityList) ? entityList.join(', ') : (entityList || '');
      items.push({
        label: headerTexts[`dar-${darIdx}`] || `DAR ${darIdx + 1}`,
        detail: names,
        tone: 'green'
      });
    });

    (assignment.incoming || []).forEach((incIdx) => {
      const entityList = incomingEntities[incIdx];
      const codes = getEntityShortCode(entityList, entities);
      const names = Array.isArray(entityList) ? entityList.join(', ') : (entityList || '');
      items.push({
        label: headerTexts[`inc-${incIdx}`] || `New Incoming ${incIdx + 1}`,
        detail: codes || names,
        tone: 'blue'
      });
    });

    if (assignment.cpoe) {
      items.push({ label: 'CPOE', detail: '', tone: 'green' });
    }

    const crossTraining = assignment.crossTraining;
    const crossText = Array.isArray(crossTraining) ? crossTraining.join(', ') : crossTraining;
    if (crossText && String(crossText).trim()) {
      items.push({ label: 'Cross-Training', detail: String(crossText).trim(), tone: 'blue' });
    }

    const special = assignment.specialProjects;
    if (special && typeof special === 'object' && !Array.isArray(special)) {
      if (special.threePEmail) items.push({ label: '3P Email', detail: '', tone: 'purple' });
      if (special.threePBackupEmail) items.push({ label: '3P Backup Email', detail: '', tone: 'purple' });
      if (special.float) items.push({ label: 'Float', detail: '', tone: 'orange' });
      if (special.other && special.other.trim()) {
        items.push({ label: 'Special Project', detail: special.other.trim(), tone: 'purple' });
      }
    } else if (special && String(special).trim()) {
      items.push({ label: 'Special Project', detail: String(special).trim(), tone: 'purple' });
    }

    if (assignment.threePPrimary) items.push({ label: '3P Primary', detail: '', tone: 'purple' });
    if (assignment.threePBackup) items.push({ label: '3P Backup', detail: '', tone: 'purple' });
    if (assignment.float) items.push({ label: 'Float', detail: '', tone: 'orange' });

    return items;
  }, [schedule, selectedEmployeeId, entities]);

  const toneClasses = {
    green: 'bg-thr-green-50 text-thr-green-700 border-thr-green-200 dark:bg-thr-green-900/30 dark:text-thr-green-300 dark:border-thr-green-800',
    blue: 'bg-thr-blue-50 text-thr-blue-600 border-thr-blue-200 dark:bg-thr-blue-900/30 dark:text-thr-blue-300 dark:border-thr-blue-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
  };

  return (
    <section
      aria-label="Find my assignments"
      className="mb-6 card dark:bg-gray-800 dark:border-gray-700 print:hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <UserSearch className="w-5 h-5 text-thr-blue-500 dark:text-thr-blue-400" aria-hidden="true" />
          <h2 className="text-base font-semibold whitespace-nowrap">Find my assignments</h2>
        </div>
        <select
          value={selectedEmployeeId || ''}
          onChange={(e) => onSelectEmployee(e.target.value || null)}
          aria-label="Select your name to see your assignments"
          className="w-full sm:w-64 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-thr-blue-500 focus:border-thr-blue-500"
        >
          <option value="">Select your name…</option>
          {activeEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>

      {selectedEmployeeId && summary && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700" role="status" aria-live="polite">
          {summary.length > 0 ? (
            <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
              {summary.map((item, idx) => (
                <li
                  key={`${item.label}-${idx}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${toneClasses[item.tone] || toneClasses.blue}`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.detail && (
                    <span className="font-normal opacity-80">— {item.detail}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 m-0">
              <Sparkles className="w-4 h-4 text-thr-green-500" aria-hidden="true" />
              No assignments for you on this schedule.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

MyAssignments.propTypes = {
  schedule: PropTypes.shape({
    assignments: PropTypes.object,
    darEntities: PropTypes.object,
    incomingEntities: PropTypes.object,
    headerTexts: PropTypes.object
  }),
  employees: PropTypes.array,
  entities: PropTypes.array,
  selectedEmployeeId: PropTypes.string,
  onSelectEmployee: PropTypes.func.isRequired
};

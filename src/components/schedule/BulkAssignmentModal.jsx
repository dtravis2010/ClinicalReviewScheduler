import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, Users, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * BulkAssignmentModal component
 * Allows assigning multiple employees to an entity or task at once
 */
export default function BulkAssignmentModal({
  isOpen,
  onClose,
  selectedEmployees,
  employees,
  entities,
  darColumns,
  onApply
}) {
  const [assignmentType, setAssignmentType] = useState('dar'); // 'dar', 'cpoe', 'newIncoming', 'crossTraining', 'specialProjects'
  const [selectedDarIndex, setSelectedDarIndex] = useState(0);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [previewResults, setPreviewResults] = useState(null);

  // Get selected employee objects
  const selectedEmployeeObjects = useMemo(() => {
    return employees.filter(emp => selectedEmployees.has(emp.id));
  }, [employees, selectedEmployees]);

  // Validate assignments and generate preview
  const generatePreview = () => {
    const results = {
      successful: [],
      failed: []
    };

    selectedEmployeeObjects.forEach(employee => {
      let canAssign = false;
      let reason = '';

      switch (assignmentType) {
        case 'dar':
          // Check if employee has DAR skill
          canAssign = employee.skills?.includes('DAR') || employee.skills?.includes('Trace');
          reason = canAssign ? '' : 'Employee does not have DAR/Trace skill';
          break;
        case 'cpoe':
          canAssign = employee.skills?.includes('CPOE');
          reason = canAssign ? '' : 'Employee does not have CPOE skill';
          break;
        case 'newIncoming':
        case 'crossTraining':
        case 'specialProjects':
          // These can be assigned to anyone
          canAssign = selectedEntities.length > 0;
          reason = canAssign ? '' : 'No entities selected';
          break;
        default:
          canAssign = false;
          reason = 'Invalid assignment type';
      }

      if (canAssign) {
        results.successful.push({
          employeeId: employee.id,
          employeeName: employee.name,
          type: assignmentType,
          darIndex: assignmentType === 'dar' ? selectedDarIndex : null,
          entities: selectedEntities
        });
      } else {
        results.failed.push({
          employeeId: employee.id,
          employeeName: employee.name,
          reason
        });
      }
    });

    setPreviewResults(results);
  };

  const handleApply = () => {
    if (previewResults) {
      onApply(previewResults.successful);
      onClose();
      // Reset state
      setPreviewResults(null);
      setSelectedEntities([]);
    }
  };

  const handleEntityToggle = (entityName) => {
    setSelectedEntities(prev => {
      if (prev.includes(entityName)) {
        return prev.filter(e => e !== entityName);
      } else {
        return [...prev, entityName];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-thr-blue-100 dark:bg-thr-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-thr-blue-600 dark:text-thr-blue-400" />
            </div>
            <div>
              <h2 className="text-h4 text-slate-900 dark:text-slate-100">Bulk Assignment</h2>
              <p className="text-caption text-slate-500 dark:text-slate-400">
                Assign {selectedEmployees.size} employee{selectedEmployees.size > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Assignment Type Selection */}
          <div>
            <label htmlFor="assignment-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Assignment Type
            </label>
            <select
              id="assignment-type"
              value={assignmentType}
              onChange={(e) => {
                setAssignmentType(e.target.value);
                setPreviewResults(null);
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-thr-blue-500 focus:border-transparent"
            >
              <option value="dar">DAR (Daily Appointment Review)</option>
              <option value="cpoe">CPOE</option>
              <option value="newIncoming">New Incoming Items</option>
              <option value="crossTraining">Cross-Training</option>
              <option value="specialProjects">Special Projects</option>
            </select>
          </div>

          {/* DAR Column Selection (only for DAR type) */}
          {assignmentType === 'dar' && (
            <div>
              <label htmlFor="dar-column" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                DAR Column
              </label>
              <select
                id="dar-column"
                value={selectedDarIndex}
                onChange={(e) => {
                  setSelectedDarIndex(parseInt(e.target.value));
                  setPreviewResults(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-thr-blue-500 focus:border-transparent"
              >
                {darColumns.map((col, idx) => (
                  <option key={idx} value={idx}>{col}</option>
                ))}
              </select>
            </div>
          )}

          {/* Entity Selection (for non-DAR, non-CPOE types) */}
          {['newIncoming', 'crossTraining', 'specialProjects'].includes(assignmentType) && (
            <div>
              <label id="select-entities-label" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Entities
              </label>
              <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2" role="group" aria-labelledby="select-entities-label">
                {entities.map(entity => (
                  <label key={entity.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedEntities.includes(entity.name)}
                      onChange={() => handleEntityToggle(entity.name)}
                      className="w-4 h-4 text-thr-blue-500 rounded focus:ring-2 focus:ring-thr-blue-500"
                    />
                    <span className="text-sm text-slate-900 dark:text-slate-100">{entity.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview Button */}
          <button
            onClick={generatePreview}
            className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Preview Assignments
          </button>

          {/* Preview Results */}
          {previewResults && (
            <div className="space-y-4">
              {/* Successful Assignments */}
              {previewResults.successful.length > 0 && (
                <div className="border border-thr-green-200 dark:border-thr-green-800 rounded-lg p-4 bg-thr-green-50 dark:bg-thr-green-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-thr-green-600 dark:text-thr-green-400" />
                    <h3 className="font-medium text-thr-green-900 dark:text-thr-green-100">
                      Successful ({previewResults.successful.length})
                    </h3>
                  </div>
                  <ul className="space-y-1 text-sm text-thr-green-800 dark:text-thr-green-200">
                    {previewResults.successful.map((result, idx) => (
                      <li key={idx}>✓ {result.employeeName}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Failed Assignments */}
              {previewResults.failed.length > 0 && (
                <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h3 className="font-medium text-red-900 dark:text-red-100">
                      Failed ({previewResults.failed.length})
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                    {previewResults.failed.map((result, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{result.employeeName}:</span> {result.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!previewResults || previewResults.successful.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              previewResults && previewResults.successful.length > 0
                ? 'bg-thr-blue-500 hover:bg-thr-blue-600 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            Apply Assignments
          </button>
        </div>
      </div>
    </div>
  );
}

BulkAssignmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedEmployees: PropTypes.instanceOf(Set).isRequired,
  employees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    skills: PropTypes.arrayOf(PropTypes.string)
  })).isRequired,
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  darColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  onApply: PropTypes.func.isRequired
};

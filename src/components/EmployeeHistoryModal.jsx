import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Calendar, Clock } from 'lucide-react';

export default function EmployeeHistoryModal({ employee, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [employee]);

  async function loadHistory() {
    try {
      // Get all published schedules
      const schedulesRef = collection(db, 'schedules');
      const q = query(
        schedulesRef,
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const scheduleHistory = [];

      snapshot.docs.forEach(doc => {
        const scheduleData = doc.data();
        const assignment = scheduleData.assignments?.[employee.id];

        if (assignment) {
          scheduleHistory.push({
            id: doc.id,
            scheduleName: scheduleData.name,
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            publishedAt: scheduleData.publishedAt?.toDate(),
            assignment
          });
        }
      });

      setHistory(scheduleHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Assignment History
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {employee.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-thr-blue-500"></div>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {item.scheduleName}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {item.startDate} - {item.endDate}
                        </div>
                        {item.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Published {formatDate(item.publishedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Entity:</span>
                      <p className="text-gray-900 mt-1">
                        {item.assignment.entity || 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">DAR Assignments:</span>
                      <p className="text-gray-900 mt-1">
                        {item.assignment.dars?.length > 0
                          ? `DAR ${item.assignment.dars.map(d => d + 1).join(', ')}`
                          : 'None'}
                      </p>
                    </div>
                    {item.assignment.specialProjects && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Special Projects:</span>
                        <p className="text-gray-900 mt-1">
                          {item.assignment.specialProjects}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">3PM Email:</span>
                      <div className="flex gap-4 mt-1">
                        {item.assignment.email3pmPrimary && (
                          <span className="text-gray-900">Primary</span>
                        )}
                        {item.assignment.email3pmBackup && (
                          <span className="text-gray-900">Backup</span>
                        )}
                        {!item.assignment.email3pmPrimary && !item.assignment.email3pmBackup && (
                          <span className="text-gray-500">Not assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No assignment history found</p>
              <p className="text-sm text-gray-500 mt-2">
                This employee hasn't been assigned to any published schedules yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-outline w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

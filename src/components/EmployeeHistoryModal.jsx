import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Clock } from 'lucide-react';
import Modal from './Modal';

export default function EmployeeHistoryModal({ employee, onClose, isOpen = true }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employee && isOpen) {
      loadHistory();
    }
  }, [employee, isOpen]);

  async function loadHistory() {
    setLoading(true);
    try {
      // Get recent published schedules (limited to avoid performance issues)
      const schedulesRef = collection(db, 'schedules');
      const q = query(
        schedulesRef,
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(100) // Limit to last 100 published schedules
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
      logger.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assignment History - ${employee?.name || ''}`}
      size="lg"
    >
      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-thr-blue-500 dark:border-thr-blue-400"></div>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <div 
                key={item.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.scheduleName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        <span>{item.startDate} - {item.endDate}</span>
                      </div>
                      {item.publishedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          <span>Published {formatDate(item.publishedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Entity:</span>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {item.assignment.entity || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">DAR Assignments:</span>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {item.assignment.dars?.length > 0
                        ? `DAR ${item.assignment.dars.map(d => d + 1).join(', ')}`
                        : 'None'}
                    </p>
                  </div>
                  {item.assignment.specialProjects && (
                    <div className="col-span-1 sm:col-span-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Special Projects:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">
                        {item.assignment.specialProjects}
                      </p>
                    </div>
                  )}
                  <div className="col-span-1 sm:col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">3PM Email:</span>
                    <div className="flex gap-4 mt-1">
                      {item.assignment.email3pmPrimary && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-thr-blue-100 text-thr-blue-800 dark:bg-thr-blue-900/30 dark:text-thr-blue-300">
                          Primary
                        </span>
                      )}
                      {item.assignment.email3pmBackup && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Backup
                        </span>
                      )}
                      {!item.assignment.email3pmPrimary && !item.assignment.email3pmBackup && (
                        <span className="text-gray-500 dark:text-gray-400">Not assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-400">No assignment history found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              This employee hasn't been assigned to any published schedules yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button 
          onClick={onClose} 
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 dark:focus:ring-offset-gray-900"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

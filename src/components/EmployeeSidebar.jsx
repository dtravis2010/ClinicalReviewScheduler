import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Mail,
  Calendar,
  Star,
  Clock,
  TrendingUp,
  Building2,
  FileText,
} from 'lucide-react';

/**
 * Employee Sidebar - Slide-out panel with glassmorphism effect
 * 
 * Features:
 * - Full-height side panel sliding from the right
 * - THR-blue header with employee name + avatar
 * - Info cards: Skills & training tags, Assignment history, Entity experience, Notes
 * - Progress bars showing coverage balance in THR colors
 * - Smooth animation
 */
export default function EmployeeSidebar({ employee, isOpen, onClose, assignments = [] }) {
  const sidebarRef = useRef(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;

    const focusableElements = sidebarRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get last 3 assignments for this employee
  const recentAssignments = assignments
    .filter((a) => a.employeeId === employee?.id)
    .slice(0, 3);

  // Calculate skill coverage percentages (mock data for now)
  const skillCoverage = {
    DAR: Math.floor(Math.random() * 40) + 60,
    CR: Math.floor(Math.random() * 40) + 60,
    CPOE: Math.floor(Math.random() * 40) + 60,
  };

  const sidebarContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
        className="sidebar-panel animate-slide-in-right"
      >
        {/* Header with Glassmorphism */}
        <div className="sidebar-header relative overflow-hidden">
          {/* Glassmorphism overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-soft">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 id="sidebar-title" className="text-xl font-bold text-white">
                  {employee?.name || 'Employee Details'}
                </h2>
                <p className="text-white/80 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {employee?.email || 'No email provided'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Skills & Training Tags */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-thr-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Skills & Training</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {employee?.skills?.map((skill) => (
                <span
                  key={skill}
                  className={`skill-tag ${
                    skill === 'DAR'
                      ? 'skill-tag-dar'
                      : skill === 'Float'
                      ? 'skill-tag-float'
                      : skill === 'CPOE'
                      ? 'skill-tag-cpoe'
                      : skill === 'Trace'
                      ? 'bg-role-cr/10 text-role-cr'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {skill}
                </span>
              ))}
              {(!employee?.skills || employee.skills.length === 0) && (
                <span className="text-sm text-slate-500 dark:text-slate-400">No skills assigned</span>
              )}
            </div>
          </div>

          {/* Assignment History (Mini Timeline) */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-thr-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Assignments</h3>
            </div>
            <div className="space-y-3">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((assignment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                  >
                    <div className="w-2 h-2 rounded-full bg-thr-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {assignment.role} - {assignment.entity}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {assignment.date}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No recent assignments
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Coverage Balance (Progress Bars) */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-thr-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Coverage Balance</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(skillCoverage).map(([skill, percentage]) => (
                <div key={skill}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {skill}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {percentage}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entity Experience */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-thr-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Entity Experience</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Mock entity experience data */}
              {['THFR', 'THAM', 'THSW'].map((entity) => (
                <span
                  key={entity}
                  className="px-3 py-1.5 rounded-lg bg-thr-blue-50 dark:bg-thr-blue-900/20 text-thr-blue-600 dark:text-thr-blue-400 text-sm font-medium"
                >
                  {entity}
                </span>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-thr-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notes</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {employee?.notes || 'No notes available for this employee.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(sidebarContent, document.body);
}

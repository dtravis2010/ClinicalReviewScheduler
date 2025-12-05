import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Building2,
} from 'lucide-react';

/**
 * Presentation Mode - Full-screen beautifully formatted "broadcast" version
 * 
 * Phase 3 Premium Polish Feature:
 * - Enlarged typography
 * - Auto-aligned columns
 * - Entity icons along the side
 * - Clean airspace
 * - Fade transitions when switching weeks
 * - Perfect for huddles, team meetings, leadership presentations
 */
export default function PresentationMode({
  isOpen,
  onClose,
  schedule,
  employees = [],
  assignments = {},
  darEntities = {},
}) {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle ESC key to close
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

  // Handle arrow keys for week navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousWeek();
      } else if (e.key === 'ArrowRight') {
        handleNextWeek();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentWeek]);

  // Prevent body scroll
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

  const handlePreviousWeek = useCallback(() => {
    if (currentWeek > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentWeek(prev => prev - 1);
        setIsTransitioning(false);
      }, 200);
    }
  }, [currentWeek]);

  const handleNextWeek = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentWeek(prev => prev + 1);
      setIsTransitioning(false);
    }, 200);
  }, []);

  if (!isOpen) return null;

  const activeEmployees = employees.filter(e => !e.archived);
  const darColumns = ['DAR 1', 'DAR 2', 'DAR 3', 'DAR 4', 'DAR 5', 'DAR 6'];

  // Format entity list for display
  const formatEntityList = (entityList) => {
    if (Array.isArray(entityList)) {
      return entityList.join(' / ');
    }
    return entityList || '';
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
      {/* Presentation Header */}
      <header className="bg-gradient-to-r from-thr-blue-500 to-thr-blue-600 px-8 py-4 flex items-center justify-between shadow-soft-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div className="text-white">
            <h1 className="text-2xl font-bold">
              {schedule?.name || 'Clinical Review Schedule'}
            </h1>
            <p className="text-white/80 text-sm">
              {schedule?.startDate} - {schedule?.endDate} • Week {currentWeek + 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <button
              onClick={handlePreviousWeek}
              disabled={currentWeek === 0}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-medium px-2">
              Week {currentWeek + 1}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Exit presentation mode"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-auto p-8 transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-thr-blue-500/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-thr-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Team Members</p>
                <p className="text-3xl font-bold text-white">{activeEmployees.length}</p>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-thr-green-500/20 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-thr-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">DAR Slots</p>
                <p className="text-3xl font-bold text-white">6</p>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Coverage</p>
                <p className="text-3xl font-bold text-white">100%</p>
              </div>
            </div>
          </div>

          {/* Schedule Table - Presentation Style */}
          <div className="bg-slate-800/50 rounded-3xl overflow-hidden shadow-soft-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-thr-blue-500/20">
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Team Member
                  </th>
                  {darColumns.map((dar, idx) => (
                    <th key={idx} className="px-4 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">
                      <div>{dar}</div>
                      <div className="text-xs font-normal text-slate-400 mt-1">
                        {formatEntityList(darEntities[idx])}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">
                    CPOE
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">
                    Special
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {activeEmployees.map((employee, idx) => {
                  const assignment = assignments[employee.id] || {};
                  
                  return (
                    <tr
                      key={employee.id}
                      className={`transition-colors ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-transparent'} hover:bg-slate-700/30`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500 to-thr-green-500 flex items-center justify-center shadow-soft">
                            <span className="text-white font-bold text-sm">
                              {employee.name?.charAt(0)}
                            </span>
                          </div>
                          <span className="text-lg font-semibold text-white">
                            {employee.name}
                          </span>
                        </div>
                      </td>
                      {darColumns.map((_, darIdx) => {
                        const isAssigned = assignment.dars?.includes(darIdx);
                        
                        return (
                          <td key={darIdx} className="px-4 py-5 text-center">
                            {isAssigned ? (
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-thr-green-500/20 text-thr-green-400">
                                <span className="text-xl">✓</span>
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-5 text-center">
                        <span className="text-slate-300">
                          {formatEntityList(assignment.cpoe) || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-slate-300">
                          {formatEntityList(assignment.specialProjects) || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between text-slate-500 text-sm">
            <p>Clinical Review Scheduler • Texas Health Resources</p>
            <p>Use ← → keys to navigate weeks • Press ESC to exit</p>
          </div>
        </div>
      </main>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/**
 * Button to trigger Presentation Mode
 */
export function PresentationModeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn-pill bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
      title="Enter Presentation Mode"
    >
      <Maximize2 className="w-4 h-4" />
      <span>Present</span>
    </button>
  );
}

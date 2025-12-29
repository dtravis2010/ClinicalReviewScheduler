import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Users, Eye, Edit3, Circle } from 'lucide-react';

/**
 * Realtime Presence Component
 * Displays active users viewing/editing the current context
 *
 * Features:
 * - Shows user avatars with online indicators
 * - Highlights users editing the same cell
 * - Compact mode for inline display
 * - Expandable mode for detailed view
 *
 * @param {Object} props
 * @param {Array} activeUsers - List of active users from usePresence hook
 * @param {String} currentCellId - Current cell being edited (optional)
 * @param {Boolean} compact - Display in compact mode
 * @param {Boolean} showDetails - Show user details on hover
 */
const RealtimePresence = ({
  activeUsers = [],
  currentCellId = null,
  compact = false,
  showDetails = true,
}) => {
  // Group users by activity
  const { editingUsers, viewingUsers } = useMemo(() => {
    const editing = activeUsers.filter(u => u.context?.editingCell);
    const viewing = activeUsers.filter(u => !u.context?.editingCell);
    return { editingUsers: editing, viewingUsers: viewing };
  }, [activeUsers]);

  // Find users editing the same cell
  const usersEditingSameCell = useMemo(() => {
    if (!currentCellId) return [];
    return editingUsers.filter(u => u.context?.cellId === currentCellId);
  }, [editingUsers, currentCellId]);

  if (activeUsers.length === 0) return null;

  // Get user initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get user color (deterministic based on userId)
  const getUserColor = (userId) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* User Avatars */}
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 3).map((user) => {
            const isEditing = user.context?.editingCell;
            const editingSameCell = currentCellId && user.context?.cellId === currentCellId;

            return (
              <div
                key={user.userId}
                className="relative group"
                title={`${user.userName}${isEditing ? ' (editing)' : ' (viewing)'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full ${getUserColor(user.userId)} text-white flex items-center justify-center text-xs font-semibold border-2 ${
                    editingSameCell ? 'border-yellow-400 animate-pulse' : 'border-white dark:border-slate-800'
                  } relative z-10`}
                >
                  {getInitials(user.userName)}
                </div>

                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 z-20">
                  <Circle className={`w-3 h-3 ${isEditing ? 'fill-green-500 text-green-500' : 'fill-blue-400 text-blue-400'}`} />
                </div>

                {/* Tooltip */}
                {showDetails && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30">
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-soft-xl">
                      <div className="font-semibold">{user.userName}</div>
                      <div className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                        {isEditing ? (
                          <>
                            <Edit3 className="w-3 h-3" />
                            {editingSameCell ? 'Editing this cell' : 'Editing'}
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            Viewing
                          </>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
                  </div>
                )}
              </div>
            );
          })}

          {activeUsers.length > 3 && (
            <div
              className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-slate-800"
              title={`${activeUsers.length - 3} more`}
            >
              +{activeUsers.length - 3}
            </div>
          )}
        </div>

        {/* Count */}
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'} active
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg border border-slate-200 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-thr-blue-600" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          Active Users ({activeUsers.length})
        </h3>
      </div>

      {/* Warning for same cell editing */}
      {usersEditingSameCell.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Edit3 className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                Concurrent Editing Detected
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {usersEditingSameCell.map(u => u.userName).join(', ')} {usersEditingSameCell.length === 1 ? 'is' : 'are'} editing the same cell
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editing Users */}
      {editingUsers.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Edit3 className="w-3 h-3" />
            Editing
          </div>

          <div className="space-y-2">
            {editingUsers.map((user) => {
              const editingSameCell = currentCellId && user.context?.cellId === currentCellId;

              return (
                <div
                  key={user.userId}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    editingSameCell
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-slate-50 dark:bg-slate-900/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full ${getUserColor(user.userId)} text-white flex items-center justify-center text-sm font-semibold`}
                    >
                      {getInitials(user.userName)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {user.userName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {editingSameCell ? 'Editing this cell' : `Editing ${user.context?.cellId || 'a cell'}`}
                    </div>
                  </div>

                  {editingSameCell && (
                    <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 animate-pulse">
                      Same Cell!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Viewing Users */}
      {viewingUsers.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Eye className="w-3 h-3" />
            Viewing
          </div>

          <div className="space-y-2">
            {viewingUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50"
              >
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full ${getUserColor(user.userId)} text-white flex items-center justify-center text-sm font-semibold`}
                  >
                    {getInitials(user.userName)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <Circle className="w-3 h-3 fill-blue-400 text-blue-400" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {user.userName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Viewing schedule
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

RealtimePresence.propTypes = {
  activeUsers: PropTypes.arrayOf(PropTypes.shape({
    userId: PropTypes.string.isRequired,
    userName: PropTypes.string,
    userEmail: PropTypes.string,
    status: PropTypes.string,
    context: PropTypes.shape({
      page: PropTypes.string,
      scheduleId: PropTypes.string,
      cellId: PropTypes.string,
      editingCell: PropTypes.bool,
    }),
  })).isRequired,
  currentCellId: PropTypes.string,
  compact: PropTypes.bool,
  showDetails: PropTypes.bool,
};

export default RealtimePresence;

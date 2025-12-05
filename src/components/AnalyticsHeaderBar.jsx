import { BarChart2, PieChart, Activity, TrendingUp } from 'lucide-react';

/**
 * Analytics Header Bar - Visual enhancement for schedule view
 * 
 * Features (UI placeholders only, no AI calculations):
 * - Assignment Balance bar
 * - Circular role distribution chart placeholder
 * - Heat map showing assignment density
 * - Minimal, modern styling with transparent backgrounds
 * - Soft gradient fills
 * - Animated counters placeholder
 */
export default function AnalyticsHeaderBar({
  totalEmployees = 0,
  totalAssignments = 0,
  roleDistribution = {},
  coveragePercentage = 0,
}) {
  // Role colors for visual indicators
  const roleColors = {
    DAR: 'bg-role-dar',
    CR: 'bg-role-cr',
    CPOE: 'bg-role-cpoe',
    Fax: 'bg-role-fax',
    Float: 'bg-role-float',
  };

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Assignment Balance */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-thr-blue-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Balance
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {totalAssignments}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                / {totalEmployees * 6}
              </span>
            </div>
          </div>
        </div>

        {/* Role Distribution Mini */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-green-500/10 to-thr-green-500/5 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-thr-green-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Roles
            </p>
            <div className="flex items-center gap-1">
              {Object.entries(roleColors).slice(0, 4).map(([role, color]) => (
                <div
                  key={role}
                  className={`w-2 h-2 rounded-full ${color}`}
                  title={role}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Coverage Percentage */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Coverage
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {coveragePercentage}%
              </span>
              <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-thr-blue-500 to-thr-green-500 transition-all duration-500"
                  style={{ width: `${coveragePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Week Trend
            </p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-thr-green-600 dark:text-thr-green-400">
                +12%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                vs last week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Density Heat Map (Placeholder) */}
      <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Daily Distribution
        </p>
        <div className="flex items-center gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => {
            // Mock heat intensity
            const intensity = [30, 60, 80, 45, 70][idx];
            return (
              <div key={day} className="flex-1 text-center">
                <div
                  className="h-6 rounded-lg transition-all duration-200"
                  style={{
                    background: `rgba(0, 92, 151, ${intensity / 100})`,
                  }}
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

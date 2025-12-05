import { LucideIcon } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, description, trend, color = 'blue' }) {
  const colorClasses = {
    blue: {
      bg: 'bg-thr-blue-50 dark:bg-thr-blue-900/20',
      text: 'text-thr-blue-600 dark:text-thr-blue-400',
      icon: 'text-thr-blue-500 dark:text-thr-blue-400'
    },
    green: {
      bg: 'bg-thr-green-50 dark:bg-thr-green-900/20',
      text: 'text-thr-green-600 dark:text-thr-green-400',
      icon: 'text-thr-green-500 dark:text-thr-green-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      icon: 'text-purple-500 dark:text-purple-400'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'text-orange-500 dark:text-orange-400'
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      text: 'text-teal-600 dark:text-teal-400',
      icon: 'text-teal-500 dark:text-teal-400'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="card hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {description}
            </p>
          )}
          {trend && (
            <p className={`text-sm font-medium mt-2 ${trend.positive ? 'text-thr-green-600 dark:text-thr-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colors.bg}`}>
          <Icon className={`w-8 h-8 ${colors.icon}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

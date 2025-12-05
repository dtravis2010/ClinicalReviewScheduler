export default function Skeleton({ variant = 'text', className = '', count = 1 }) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  const variantClasses = {
    text: 'h-4 w-full',
    'text-lg': 'h-6 w-3/4',
    'text-xl': 'h-8 w-1/2',
    card: 'h-32 w-full',
    table: 'h-12 w-full',
    circle: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24',
    input: 'h-10 w-full'
  };

  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.text} ${className}`;

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={classes} />
        ))}
      </div>
    );
  }

  return <div className={classes} />;
}

// Specialized skeleton components for complex layouts
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" className="w-8 h-8" />
              <div className="space-y-2">
                <Skeleton variant="text-xl" className="w-48" />
                <Skeleton variant="text" className="w-32" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton variant="button" className="w-32" />
              <Skeleton variant="button" className="w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 py-4">
            <Skeleton variant="text" className="w-32 h-8" />
            <Skeleton variant="text" className="w-32 h-8" />
            <Skeleton variant="text" className="w-32 h-8" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton variant="text-lg" className="w-64" />
            <Skeleton variant="button" className="w-40" />
          </div>
          <Skeleton variant="card" className="h-96" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton variant="text" className="w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton variant="text" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" className="w-8 h-8" />
              <div className="space-y-2">
                <Skeleton variant="text-xl" className="w-64" />
                <Skeleton variant="text" className="w-48" />
              </div>
            </div>
            <Skeleton variant="button" className="w-36" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton variant="text-lg" className="w-48" />
              <Skeleton variant="text" className="w-32" />
            </div>
            <Skeleton variant="button" className="w-24" />
          </div>
        </div>

        <div className="card">
          <Skeleton variant="card" className="h-96" />
        </div>
      </div>
    </div>
  );
}

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 4000,
        className: 'dark:bg-slate-800 dark:text-slate-100',
        style: {
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '420px',
        },
        // Success toast styling (teal/green theme)
        success: {
          duration: 3000,
          className: 'bg-thr-green-50 dark:bg-thr-green-900/30 text-thr-green-800 dark:text-thr-green-200 border border-thr-green-200 dark:border-thr-green-800',
          iconTheme: {
            primary: '#00a862',
            secondary: '#fff',
          },
        },
        // Error toast styling
        error: {
          duration: 5000,
          className: 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800',
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
        // Loading toast styling (blue theme)
        loading: {
          className: 'bg-thr-blue-50 dark:bg-thr-blue-900/30 text-thr-blue-800 dark:text-thr-blue-200 border border-thr-blue-200 dark:border-thr-blue-800',
          iconTheme: {
            primary: '#0066cc',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

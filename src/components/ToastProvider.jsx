import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          fontSize: '14px',
          fontWeight: '500',
        },
        // Success toast styling (teal/green theme)
        success: {
          duration: 3000,
          style: {
            background: '#e6f7f0',
            color: '#00653b',
            border: '1px solid #00a862',
          },
          iconTheme: {
            primary: '#00a862',
            secondary: '#fff',
          },
        },
        // Error toast styling
        error: {
          duration: 5000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #ef4444',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
        // Loading toast styling (blue theme)
        loading: {
          style: {
            background: '#e6f0ff',
            color: '#003d7a',
            border: '1px solid #0066cc',
          },
          iconTheme: {
            primary: '#0066cc',
            secondary: '#fff',
          },
        },
        // Custom toast styling (warning/info - blue theme)
        custom: {
          style: {
            background: '#e6f0ff',
            color: '#003d7a',
            border: '1px solid #0066cc',
          },
        },
      }}
    />
  );
}

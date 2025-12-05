import { AlertTriangle } from 'lucide-react';

export default function ConfigurationError({ error }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-amber-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Configuration Required
        </h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 text-sm">
            {error}
          </p>
        </div>
        <div className="text-gray-600 text-sm space-y-4">
          <p>
            <strong>For Administrators:</strong> Please configure the Firebase environment 
            variables in your deployment settings. See the <code className="bg-gray-100 px-1 py-0.5 rounded">.env.example</code> file 
            for the required variables.
          </p>
          <p>
            <strong>For GitHub Pages deployment:</strong> Add the required secrets to your 
            repository settings under Settings → Secrets and variables → Actions.
          </p>
        </div>
      </div>
    </div>
  );
}

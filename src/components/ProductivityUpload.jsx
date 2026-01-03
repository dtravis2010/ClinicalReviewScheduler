import { useState } from 'react';
import PropTypes from 'prop-types';
import { Upload, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { ProductivityService } from '../services/productivityService';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

/**
 * ProductivityUpload - Component for uploading trace report CSV files
 */
export default function ProductivityUpload({ onUploadComplete }) {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ProductivityService.uploadTraceReport(
        file,
        { start: startDate, end: endDate },
        currentUser?.uid
      );

      setSuccess(`Successfully uploaded report with ${result.entitiesCount} entities`);
      setFile(null);
      setStartDate('');
      setEndDate('');

      // Reset file input
      const fileInput = document.getElementById('trace-report-upload');
      if (fileInput) fileInput.value = '';

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(result);
      }

      logger.info('Trace report uploaded successfully', result);
    } catch (err) {
      logger.error('Error uploading trace report:', err);
      setError(err.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-thr-blue-100 dark:bg-thr-blue-900/30 rounded-xl">
          <FileSpreadsheet className="w-6 h-6 text-thr-blue-600 dark:text-thr-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Upload New Incoming Productivity Report
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upload trace report CSV to track entity productivity
          </p>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-thr-blue-500 dark:focus:ring-thr-blue-400 bg-white dark:bg-slate-700 dark:text-slate-100"
            disabled={uploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-thr-blue-500 dark:focus:ring-thr-blue-400 bg-white dark:bg-slate-700 dark:text-slate-100"
            disabled={uploading}
          />
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Trace Report CSV
        </label>
        <input
          id="trace-report-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-600 dark:text-slate-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-thr-blue-50 file:text-thr-blue-700
            dark:file:bg-thr-blue-900/30 dark:file:text-thr-blue-300
            hover:file:bg-thr-blue-100 dark:hover:file:bg-thr-blue-900/50
            file:cursor-pointer cursor-pointer
            border border-slate-300 dark:border-slate-600 rounded-lg
            bg-white dark:bg-slate-700"
          disabled={uploading}
        />
        {file && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !file || !startDate || !endDate}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-thr-blue-500 hover:bg-thr-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 transition-colors"
      >
        {uploading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload Report
          </>
        )}
      </button>

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-4 bg-thr-green-50 dark:bg-thr-green-900/30 border border-thr-green-200 dark:border-thr-green-700 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-thr-green-600 dark:text-thr-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-thr-green-700 dark:text-thr-green-300">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          CSV Format Requirements:
        </h4>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li>• Must include columns: TeamName, ClearedFromListCount, InboundFaxCount, NewInboundItemsRemainingLast60Days</li>
          <li>• Enterprise Women's locations will be automatically combined with parent entities</li>
          <li>• Date range should match the report period (e.g., Jan 1 - Dec 29, 2025)</li>
        </ul>
      </div>
    </div>
  );
}

ProductivityUpload.propTypes = {
  onUploadComplete: PropTypes.func
};

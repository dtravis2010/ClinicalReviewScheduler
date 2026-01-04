import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Save, Calendar, Database } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { ProductivityService } from '../services/productivityService';
import { logger } from '../utils/logger';
import * as XLSX from 'xlsx';

export default function ProductivityImport({ employees = [], entities = [] }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dataType, setDataType] = useState('entity'); // 'entity' or 'employee'
  const { showSuccess, showError } = useToast();

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        rows.push(row);
      }
    }

    return { headers, data: rows };
  }

  function parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Use first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }

          // First row is headers
          const headers = jsonData[0];
          const rows = jsonData.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, idx) => {
              obj[header] = row[idx] !== undefined ? String(row[idx]) : '';
            });
            return obj;
          });

          resolve({ headers, data: rows });
        } catch (err) {
          reject(new Error(`Failed to parse Excel file: ${err.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  function mapDataToProductivity(rawData, type) {
    if (type === 'entity') {
      return rawData.map(row => {
        // Try to map common column names
        const entityName = row['Entity'] || row['entity'] || row['Facility'] || row['facility'] || row['Name'] || row['name'];
        const casesReviewed = parseFloat(row['Cases Reviewed'] || row['cases_reviewed'] || row['Cases'] || row['cases'] || 0);
        const avgReviewTime = parseFloat(row['Avg Review Time'] || row['avg_review_time'] || row['Review Time'] || row['review_time'] || 0);
        const backlog = parseFloat(row['Backlog'] || row['backlog'] || 0);
        const qualityScore = parseFloat(row['Quality Score'] || row['quality_score'] || row['Quality'] || row['quality'] || 0);

        return {
          name: entityName,
          casesReviewed,
          avgReviewTime,
          backlog,
          qualityScore,
          rawData: row
        };
      }).filter(item => item.name);
    } else {
      return rawData.map(row => {
        const employeeName = row['Employee'] || row['employee'] || row['Name'] || row['name'] || row['Team Member'] || row['team_member'];
        const casesReviewed = parseFloat(row['Cases Reviewed'] || row['cases_reviewed'] || row['Cases'] || row['cases'] || 0);
        const avgReviewTime = parseFloat(row['Avg Review Time'] || row['avg_review_time'] || row['Review Time'] || row['review_time'] || 0);
        const qualityScore = parseFloat(row['Quality Score'] || row['quality_score'] || row['Quality'] || row['quality'] || 0);
        const productivityRate = parseFloat(row['Productivity Rate'] || row['productivity_rate'] || row['Productivity'] || row['productivity'] || 0);

        return {
          name: employeeName,
          casesReviewed,
          avgReviewTime,
          qualityScore,
          productivityRate,
          rawData: row
        };
      }).filter(item => item.name);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setImporting(true);

    try {
      let parsed;

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        parsed = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsed = await parseExcel(file);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      const mappedData = mapDataToProductivity(parsed.data, dataType);

      setData({
        headers: parsed.headers,
        rawData: parsed.data,
        mappedData,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        type: dataType
      });

      showSuccess(`Successfully imported ${mappedData.length} ${dataType} records`);
    } catch (err) {
      logger.error('File upload error:', err);
      setError(err.message || 'Failed to parse file');
      setData(null);
      showError(err.message || 'Failed to parse file');
    } finally {
      setImporting(false);
    }
  }

  async function handleSaveToFirestore() {
    if (!data || !startDate || !endDate) {
      showError('Please select start and end dates before saving');
      return;
    }

    setSaving(true);

    try {
      const periodData = {
        startDate,
        endDate,
        uploadedBy: 'Current User', // Replace with actual user when auth is available
        fileName: data.fileName,
        type: data.type,
        uploadedAt: data.uploadedAt
      };

      if (data.type === 'entity') {
        await ProductivityService.savePeriodData(
          periodData,
          data.mappedData,
          []
        );
      } else {
        await ProductivityService.savePeriodData(
          periodData,
          [],
          data.mappedData
        );
      }

      showSuccess(`Productivity data saved for period ${startDate} to ${endDate}`);
      clearData();
    } catch (err) {
      logger.error('Save error:', err);
      showError(err.message || 'Failed to save productivity data');
    } finally {
      setSaving(false);
    }
  }

  function clearData() {
    setData(null);
    setError(null);
    setStartDate('');
    setEndDate('');
  }

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Import Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Type
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="entity">Entity Productivity</option>
              <option value="employee">Employee Productivity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-thr-blue-400 dark:hover:border-thr-blue-500 transition-colors">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
          id="productivity-upload"
        />
        <label
          htmlFor="productivity-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Upload Productivity Data
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports CSV and Excel (.xlsx, .xls) files
            </p>
          </div>
          {importing && (
            <div className="flex items-center gap-2 text-thr-blue-600 dark:text-thr-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-thr-blue-600"></div>
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Error</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
          <button onClick={clearData} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success and Data Display */}
      {data && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Data Imported Successfully
                </p>
                <div className="text-xs text-green-700 dark:text-green-300 mt-2 grid grid-cols-2 gap-2">
                  <p><strong>File:</strong> {data.fileName}</p>
                  <p><strong>Type:</strong> {data.type === 'entity' ? 'Entity' : 'Employee'} Productivity</p>
                  <p><strong>Records:</strong> {data.mappedData.length}</p>
                  <p><strong>Imported:</strong> {new Date(data.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={clearData} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleSaveToFirestore}
              disabled={saving || !startDate || !endDate}
              className="flex items-center gap-2 px-4 py-2 bg-thr-blue-600 hover:bg-thr-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Save to Database</span>
                </>
              )}
            </button>
          </div>

          {/* Data Preview Table */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-thr-blue-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Data Preview
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Cases Reviewed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Avg Review Time
                    </th>
                    {data.type === 'entity' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Backlog
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Quality Score
                        </th>
                      </>
                    )}
                    {data.type === 'employee' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Quality Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Productivity Rate
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {data.mappedData.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.casesReviewed || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.avgReviewTime ? `${item.avgReviewTime.toFixed(1)} min` : '—'}
                      </td>
                      {data.type === 'entity' && (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.backlog || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.qualityScore ? `${item.qualityScore.toFixed(1)}%` : '—'}
                          </td>
                        </>
                      )}
                      {data.type === 'employee' && (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.qualityScore ? `${item.qualityScore.toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.productivityRate ? `${item.productivityRate.toFixed(1)}%` : '—'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.mappedData.length > 10 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  Showing first 10 of {data.mappedData.length} records
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-2">Import Guidelines:</p>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Supported formats: CSV, Excel (.xlsx, .xls)</li>
          <li>First row must contain column headers</li>
          <li><strong>Entity columns:</strong> Entity/Facility Name, Cases Reviewed, Avg Review Time, Backlog, Quality Score</li>
          <li><strong>Employee columns:</strong> Employee Name, Cases Reviewed, Avg Review Time, Quality Score, Productivity Rate</li>
          <li>Select the correct date range for the productivity period</li>
          <li>Data will be stored in Firestore for historical tracking and analytics</li>
        </ul>
      </div>
    </div>
  );
}

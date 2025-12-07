import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function ProductivityImport({ employees }) {
  const [csvData, setCsvData] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // Toggle quote mode
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());
    return result;
  }

  function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse headers using robust CSV line parser
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        data.push(row);
      }
    }

    return { headers, data };
  }

  function matchEmployeeToData(employeeName, dataRow) {
    // Try to match by name (case-insensitive, flexible matching)
    const normalizedEmployeeName = employeeName.toLowerCase().replace(/\s+/g, ' ');

    // Check common column names for employee identifiers
    const possibleNameFields = ['name', 'employee', 'employee name', 'team member', 'user'];

    for (const field of possibleNameFields) {
      if (dataRow[field]) {
        const dataName = dataRow[field].toLowerCase().replace(/\s+/g, ' ');
        if (normalizedEmployeeName.includes(dataName) || dataName.includes(normalizedEmployeeName)) {
          return true;
        }
      }
    }

    return false;
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setImporting(true);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      // Try to match parsed data with employees
      const matchedData = employees.map(employee => {
        const match = parsed.data.find(row => matchEmployeeToData(employee.name, row));
        return {
          employee: employee.name,
          data: match || null,
          matched: !!match
        };
      });

      setCsvData({
        headers: parsed.headers,
        rawData: parsed.data,
        matchedData,
        fileName: file.name,
        uploadedAt: new Date().toLocaleString()
      });
    } catch (err) {
      setError(err.message || 'Failed to parse CSV file');
      setCsvData(null);
    } finally {
      setImporting(false);
    }
  }

  function clearData() {
    setCsvData(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-thr-blue-400 transition-colors">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <Upload className="w-12 h-12 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Upload Productivity CSV
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Click to browse or drag and drop your CSV file
            </p>
          </div>
          {importing && (
            <div className="flex items-center gap-2 text-thr-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-thr-blue-600"></div>
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error parsing CSV</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
          <button onClick={clearData} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Data Display */}
      {csvData && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  CSV Imported Successfully
                </p>
                <div className="text-xs text-green-700 mt-2 space-y-1">
                  <p><strong>File:</strong> {csvData.fileName}</p>
                  <p><strong>Uploaded:</strong> {csvData.uploadedAt}</p>
                  <p><strong>Total Rows:</strong> {csvData.rawData.length}</p>
                  <p><strong>Matched Employees:</strong> {csvData.matchedData.filter(m => m.matched).length} of {employees.length}</p>
                </div>
              </div>
              <button onClick={clearData} className="text-green-600 hover:text-green-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Matched Data Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Employee Productivity Data
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    {csvData.headers.slice(0, 5).map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvData.matchedData.map((item, idx) => (
                    <tr key={idx} className={item.matched ? '' : 'bg-yellow-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.employee}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.matched ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            No Match
                          </span>
                        )}
                      </td>
                      {csvData.headers.slice(0, 5).map((header, hidx) => (
                        <td key={hidx} className="px-4 py-3 text-sm text-gray-700">
                          {item.data?.[header] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw Data Preview */}
          {csvData.headers.length > 5 && (
            <details className="border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 bg-gray-50 cursor-pointer text-sm font-medium text-gray-900 hover:bg-gray-100">
                View All Columns ({csvData.headers.length} total)
              </summary>
              <div className="p-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvData.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-2 text-left font-medium text-gray-700 uppercase"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.rawData.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        {csvData.headers.map((header, hidx) => (
                          <td key={hidx} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                            {row[header] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.rawData.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing first 10 of {csvData.rawData.length} rows
                  </p>
                )}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-900 font-medium mb-2">CSV Import Guidelines:</p>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>CSV should contain employee names in a column (Name, Employee, or Team Member)</li>
          <li>File will be automatically matched with existing employees</li>
          <li>Supported formats: .csv files with comma-separated values</li>
          <li>First row should contain column headers</li>
        </ul>
      </div>
    </div>
  );
}

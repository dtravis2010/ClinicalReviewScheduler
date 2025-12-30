import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, RefreshCw, Calendar, Award, AlertCircle } from 'lucide-react';
import { ProductivityService } from '../services/productivityService';
import { logger } from '../utils/logger';

/**
 * ProductivityViewer - Displays entity productivity data from uploaded reports
 */
export default function ProductivityViewer() {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [entityData, setEntityData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodData(selectedPeriod);
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      setError(null);
      const periodsData = await ProductivityService.getAllPeriods(12);

      // Filter to only show newIncoming reports
      const newIncomingPeriods = periodsData.filter(p => p.reportType === 'newIncoming');

      setPeriods(newIncomingPeriods);

      // Auto-select the most recent period
      if (newIncomingPeriods.length > 0) {
        setSelectedPeriod(newIncomingPeriods[0].id);
      }
    } catch (err) {
      logger.error('Error loading periods:', err);
      setError('Failed to load productivity reports');
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodData = async (periodId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductivityService.getPeriodData(periodId);

      // Sort entities by clearedFromList (descending)
      const sortedEntities = data.entities.sort((a, b) =>
        (b.clearedFromList || 0) - (a.clearedFromList || 0)
      );

      setEntityData(sortedEntities);
    } catch (err) {
      logger.error('Error loading period data:', err);
      setError('Failed to load productivity data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate totals
  const totals = entityData.reduce((acc, entity) => ({
    cleared: acc.cleared + (entity.clearedFromList || 0),
    inbound: acc.inbound + (entity.inboundFaxCount || 0),
    remaining: acc.remaining + (entity.remaining || 0)
  }), { cleared: 0, inbound: 0, remaining: 0 });

  // Find top performers
  const topPerformers = entityData.slice(0, 3);

  if (loading && periods.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 rounded-xl border-2 border-thr-blue-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No Productivity Data Yet
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Upload a trace report above to see entity productivity metrics
        </p>
      </div>
    );
  }

  const currentPeriod = periods.find(p => p.id === selectedPeriod);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select Report Period
          </label>
          <select
            value={selectedPeriod || ''}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-thr-blue-500 dark:focus:ring-thr-blue-400 bg-white dark:bg-slate-700 dark:text-slate-100"
          >
            {periods.map(period => (
              <option key={period.id} value={period.id}>
                {formatDate(period.startDate)} - {formatDate(period.endDate)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={loadPeriods}
          className="mt-6 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-thr-green-50 to-white dark:from-thr-green-900/20 dark:to-slate-800 p-4 rounded-xl border border-thr-green-200 dark:border-thr-green-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Cleared</p>
            <TrendingUp className="w-5 h-5 text-thr-green-600 dark:text-thr-green-400" />
          </div>
          <p className="text-3xl font-bold text-thr-green-700 dark:text-thr-green-300">
            {formatNumber(totals.cleared)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Items cleared from list
          </p>
        </div>

        <div className="bg-gradient-to-br from-thr-blue-50 to-white dark:from-thr-blue-900/20 dark:to-slate-800 p-4 rounded-xl border border-thr-blue-200 dark:border-thr-blue-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Inbound</p>
            <Calendar className="w-5 h-5 text-thr-blue-600 dark:text-thr-blue-400" />
          </div>
          <p className="text-3xl font-bold text-thr-blue-700 dark:text-thr-blue-300">
            {formatNumber(totals.inbound)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inbound faxes received
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-800 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Remaining</p>
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {formatNumber(totals.remaining)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Items still pending (last 60 days)
          </p>
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-slate-800 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Top 3 Performers
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topPerformers.map((entity, index) => (
              <div key={entity.id} className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${
                  index === 0 ? 'text-yellow-600 dark:text-yellow-400' :
                  index === 1 ? 'text-slate-400 dark:text-slate-500' :
                  'text-orange-600 dark:text-orange-400'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {entity.name}
                  </p>
                  <p className="text-lg font-bold text-thr-green-600 dark:text-thr-green-400">
                    {formatNumber(entity.clearedFromList)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Entity Productivity Details
          </h4>
          {currentPeriod && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)} • {entityData.length} entities
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Cleared from List
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Inbound Faxes
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Completion %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center">
                    <div className="w-8 h-8 mx-auto border-2 border-thr-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : entityData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No entity data found for this period
                  </td>
                </tr>
              ) : (
                entityData.map((entity, index) => {
                  const completionRate = entity.inboundFaxCount > 0
                    ? ((entity.clearedFromList / entity.inboundFaxCount) * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={entity.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {entity.name}
                          </span>
                          {entity.sources && entity.sources.length > 1 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400" title={`Combined: ${entity.sources.join(', ')}`}>
                              ({entity.sources.length})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg font-bold text-thr-green-600 dark:text-thr-green-400">
                          {formatNumber(entity.clearedFromList)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                        {formatNumber(entity.inboundFaxCount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${
                          entity.remaining > 50 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {formatNumber(entity.remaining)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-thr-green-500 dark:bg-thr-green-400 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(completionRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-12 text-right">
                            {completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

ProductivityViewer.propTypes = {};

import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Settings as SettingsIcon, Save, Building2, BarChart3, Plus, Minus } from 'lucide-react';
import EntityManagement from './EntityManagement';
import ProductivityImport from './ProductivityImport';

export default function Settings({ employees = [], onUpdate }) {
  const [darConfig, setDarConfig] = useState({});
  const [darCount, setDarCount] = useState(5); // Default to 5 DARs
  const [entities, setEntities] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate DAR columns dynamically based on count
  const darColumns = Array.from({ length: darCount }, (_, i) => `DAR ${i + 1}`);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await Promise.all([loadDarConfig(), loadEntities()]);
    } catch (error) {
      logger.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDarConfig() {
    try {
      const configDoc = await getDoc(doc(db, 'settings', 'darConfig'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        const config = data.config || {};
        
        // Convert array format to string format for display
        const displayConfig = {};
        Object.keys(config).forEach(key => {
          if (Array.isArray(config[key])) {
            displayConfig[key] = config[key].join('/');
          } else {
            displayConfig[key] = config[key] || '';
          }
        });
        
        setDarConfig(displayConfig);
        setDarCount(data.darCount || 5); // Default to 5 if not set
      }
    } catch (error) {
      logger.error('Error loading DAR config:', error);
    }
  }

  async function loadEntities() {
    try {
      const entitiesRef = collection(db, 'entities');
      const snapshot = await getDocs(entitiesRef);
      const entitiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntities(entitiesList);
    } catch (error) {
      logger.error('Error loading entities:', error);
    }
  }

  function handleDarConfigChange(darIndex, value) {
    // Auto-uppercase entity codes for consistency
    const uppercasedValue = value.toUpperCase();
    setDarConfig(prev => ({
      ...prev,
      [darIndex]: uppercasedValue
    }));
    setHasChanges(true);
  }

  function handleDarCountChange(newCount) {
    // Limit between 3 and 8 DARs
    const count = Math.max(3, Math.min(8, newCount));
    setDarCount(count);
    setHasChanges(true);
  }

  async function saveDarConfig() {
    try {
      // Convert string format to array format for storage
      const configToSave = {};
      Object.keys(darConfig).forEach(key => {
        const value = darConfig[key];
        if (typeof value === 'string' && value.trim()) {
          // Split by '/' and trim each entity code
          // Filter out empty strings to avoid saving invalid entity codes
          configToSave[key] = value.split('/').map(code => code.trim()).filter(code => code);
        } else if (Array.isArray(value)) {
          configToSave[key] = value;
        } else {
          configToSave[key] = [];
        }
      });
      
      await setDoc(doc(db, 'settings', 'darConfig'), {
        config: configToSave,
        darCount: darCount,
        updatedAt: new Date()
      });
      setHasChanges(false);
      alert('DAR configuration saved successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      logger.error('Error saving DAR config:', error);
      alert('Failed to save DAR configuration');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 rounded-xl border-2 border-thr-blue-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-h2 text-slate-900 dark:text-slate-100">Settings</h2>
        <p className="text-body-sm text-slate-600 dark:text-slate-400 mt-1">
          Configure DAR assignments and manage entities
        </p>
      </div>

      {/* DAR Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-thr-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Default DAR Entity Assignments
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Set default entity codes for each DAR column. These will be used when creating new schedules.
              </p>
            </div>
          </div>
          
          {/* DAR Count Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">DAR Columns:</span>
            <button
              onClick={() => handleDarCountChange(darCount - 1)}
              disabled={darCount <= 3}
              className={`p-2 rounded-lg border transition-colors ${
                darCount <= 3 
                  ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              aria-label="Remove DAR column"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold text-slate-900 dark:text-slate-100">{darCount}</span>
            <button
              onClick={() => handleDarCountChange(darCount + 1)}
              disabled={darCount >= 8}
              className={`p-2 rounded-lg border transition-colors ${
                darCount >= 8 
                  ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              aria-label="Add DAR column"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {darColumns.map((dar, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {dar}
              </label>
              <input
                type="text"
                value={darConfig[idx] || ''}
                onChange={(e) => handleDarConfigChange(idx, e.target.value)}
                className="input-field"
                placeholder="e.g., THDN/THD/THFM"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Enter entity codes separated by slashes (e.g., THDN/THD)
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            {hasChanges && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                Unsaved changes
              </span>
            )}
          </div>
          <button
            onClick={saveDarConfig}
            disabled={!hasChanges}
            className={`btn-primary flex items-center gap-2 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save className="w-4 h-4" />
            Save DAR Configuration
          </button>
        </div>
      </div>

      {/* Entity Management */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-green-500/10 to-thr-green-500/5 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-thr-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Entity Management
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage all locations and facilities
            </p>
          </div>
        </div>
        <EntityManagement entities={entities} onUpdate={loadEntities} />
      </div>

      {/* Productivity Import */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Productivity Data Import
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Import and view employee productivity metrics from CSV files
            </p>
          </div>
        </div>
        <ProductivityImport employees={employees} />
      </div>
    </div>
  );
}

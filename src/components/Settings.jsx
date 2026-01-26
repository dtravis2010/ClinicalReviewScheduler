import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Settings as SettingsIcon, Save, Building2, BarChart3, Plus, Minus, User, TrendingUp, HelpCircle } from 'lucide-react';
import EntityManagement from './EntityManagement';
import ProductivityImport from './ProductivityImport';
import ProductivityUpload from './ProductivityUpload';
import ProductivityViewer from './ProductivityViewer';
import ColumnEntityConfig from './ColumnEntityConfig';
import UserPreferencesPanel from './UserPreferencesPanel';
import Button from './atoms/Button';
import Tooltip from './Tooltip';
import { useToast } from '../hooks/useToast';

export default function Settings({ employees = [], onUpdate }) {
  const { showSuccess, showError } = useToast();
  const [darConfig, setDarConfig] = useState({});
  const [darCount, setDarCount] = useState(5); // Default to 5 DARs
  const [incomingConfig, setIncomingConfig] = useState({});
  const [incomingCount, setIncomingCount] = useState(1); // Default to 1 Incoming
  const [entities, setEntities] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [productivityRefreshKey, setProductivityRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await Promise.all([loadDarConfig(), loadIncomingConfig(), loadEntities()]);
    } catch (error) {
      logger.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDarConfig() {
    try {
      if (!db) throw new Error('No DB');
      const configDoc = await getDoc(doc(db, 'settings', 'darConfig'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setDarConfig(data.config || {});
        setDarCount(data.darCount || 5);
      }
    } catch (error) {
      console.warn('Using local DAR config (DB unavailable)');
      const local = JSON.parse(sessionStorage.getItem('demo_darConfig') || '{}');
      setDarConfig(local.config || {});
      setDarCount(local.darCount || 5);
    }
  }

  async function loadIncomingConfig() {
    try {
      if (!db) throw new Error('No DB');
      const configDoc = await getDoc(doc(db, 'settings', 'incomingConfig'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setIncomingConfig(data.config || {});
        setIncomingCount(data.incomingCount || 1);
      }
    } catch (error) {
      console.warn('Using local Incoming config (DB unavailable)');
      const local = JSON.parse(sessionStorage.getItem('demo_incomingConfig') || '{}');
      setIncomingConfig(local.config || {});
      setIncomingCount(local.incomingCount || 1);
    }
  }

  async function loadEntities() {
    try {
      if (!db) throw new Error('No DB');
      const entitiesRef = collection(db, 'entities');
      const snapshot = await getDocs(entitiesRef);
      const entitiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntities(entitiesList);
    } catch (error) {
      console.warn('Using local entities (DB unavailable)');
      const local = JSON.parse(sessionStorage.getItem('demo_entities') || '[]');
      setEntities(local);
    }
  }

  // Handle DAR config change
  const handleDarConfigChange = useCallback((darIndex, entityNames) => {
    setDarConfig(prev => ({ ...prev, [darIndex]: entityNames }));
    setHasChanges(true);
  }, []);

  // Handle Incoming config change
  const handleIncomingConfigChange = useCallback((index, entityNames) => {
    setIncomingConfig(prev => ({ ...prev, [index]: entityNames }));
    setHasChanges(true);
  }, []);

  function handleDarCountChange(newCount) {
    const count = Math.max(3, Math.min(8, newCount));
    setDarCount(count);
    setHasChanges(true);
  }

  function handleIncomingCountChange(newCount) {
    const count = Math.max(1, Math.min(5, newCount));
    setIncomingCount(count);
    setHasChanges(true);
  }

  async function saveSettings() {
    setIsSaving(true);
    try {
        try {
            if (!db) throw new Error('No DB');
            await Promise.all([
                setDoc(doc(db, 'settings', 'darConfig'), {
                config: darConfig,
                darCount: darCount,
                updatedAt: new Date()
                }),
                setDoc(doc(db, 'settings', 'incomingConfig'), {
                config: incomingConfig,
                incomingCount: incomingCount,
                updatedAt: new Date()
                })
            ]);
        } catch (dbError) {
             console.warn('Saving settings locally (DB unavailable)');
             sessionStorage.setItem('demo_darConfig', JSON.stringify({
                 config: darConfig,
                 darCount: darCount,
                 updatedAt: new Date()
             }));
             sessionStorage.setItem('demo_incomingConfig', JSON.stringify({
                 config: incomingConfig,
                 incomingCount: incomingCount,
                 updatedAt: new Date()
             }));
        }
      setHasChanges(false);
      showSuccess('Settings saved successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      logger.error('Error saving settings:', error);
      showError('Failed to save settings');
    } finally {
      setIsSaving(false);
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
          Configure DAR assignments, manage entities, and customize your preferences
        </p>
      </div>

      {/* User Preferences */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              User Preferences
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Customize your display, notifications, and accessibility settings
            </p>
          </div>
        </div>
        <UserPreferencesPanel />
      </div>

      {/* DAR Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-thr-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Default DAR Entity Assignments
                <Tooltip content="DAR (Daily Activity Report) - Configure which entities are assigned to each DAR column in new schedules" position="right">
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
                </Tooltip>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Set default entity codes for each DAR column. These will be used when creating new schedules.
              </p>
            </div>
          </div>

          {/* DAR Count Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">
              DAR Columns:
            </span>
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

        {/* Entity-based DAR Configuration */}
        <div className="mt-6">
          <ColumnEntityConfig
            columnCount={darCount}
            columnConfig={darConfig}
            entities={entities}
            onConfigChange={handleDarConfigChange}
            labelPrefix="DAR"
          />
        </div>
      </div>

      {/* Incoming Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-thr-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Default Incoming Entity Assignments
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Set default entity codes for each Incoming column.
              </p>
            </div>
          </div>

          {/* Incoming Count Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Incoming Columns:</span>
            <button
              onClick={() => handleIncomingCountChange(incomingCount - 1)}
              disabled={incomingCount <= 1}
              className={`p-2 rounded-lg border transition-colors ${
                incomingCount <= 1
                  ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold text-slate-900 dark:text-slate-100">{incomingCount}</span>
            <button
              onClick={() => handleIncomingCountChange(incomingCount + 1)}
              disabled={incomingCount >= 5}
              className={`p-2 rounded-lg border transition-colors ${
                incomingCount >= 5
                  ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Entity-based Incoming Configuration */}
        <div className="mt-6">
          <ColumnEntityConfig
            columnCount={incomingCount}
            columnConfig={incomingConfig}
            entities={entities}
            onConfigChange={handleIncomingConfigChange}
            labelPrefix="Incoming"
          />
        </div>
      </div>

      {/* Save Bar */}
      <div className="fixed bottom-6 right-6 z-50">
         {hasChanges && (
            <Button
              onClick={saveSettings}
              variant="primary"
              size="lg"
              icon={<Save className="w-5 h-5" />}
              loading={isSaving}
              disabled={isSaving}
              className="shadow-soft-lg hover:shadow-glow transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Save Settings
            </Button>
         )}
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              This is your single entity bank. Changes here are used across DAR defaults and the New Incoming/Cross-Training selectors.
            </p>
          </div>
        </div>
        <EntityManagement
          entities={entities}
          onUpdate={() => {
            loadEntities();
            if (onUpdate) onUpdate();
          }}
        />
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

      {/* New Incoming Productivity Upload */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              New Incoming Productivity Tracking
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Upload monthly trace reports to track entity productivity for New Incoming Items
            </p>
          </div>
        </div>
        <ProductivityUpload onUploadComplete={() => {
          logger.info('Productivity report uploaded');
          setProductivityRefreshKey(prev => prev + 1);
        }} />

        {/* Productivity Data Viewer */}
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
          <ProductivityViewer key={productivityRefreshKey} />
        </div>
      </div>
    </div>
  );
}

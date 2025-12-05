import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Settings as SettingsIcon, Save, Building2 } from 'lucide-react';
import EntityManagement from './EntityManagement';

export default function Settings({ onUpdate }) {
  const [darConfig, setDarConfig] = useState({});
  const [entities, setEntities] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  const darColumns = ['DAR 1', 'DAR 2', 'DAR 3', 'DAR 4', 'DAR 5', 'DAR 6'];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await Promise.all([loadDarConfig(), loadEntities()]);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDarConfig() {
    try {
      const configDoc = await getDoc(doc(db, 'settings', 'darConfig'));
      if (configDoc.exists()) {
        setDarConfig(configDoc.data().config || {});
      }
    } catch (error) {
      console.error('Error loading DAR config:', error);
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
      console.error('Error loading entities:', error);
    }
  }

  function handleDarConfigChange(darIndex, value) {
    setDarConfig(prev => ({
      ...prev,
      [darIndex]: value
    }));
    setHasChanges(true);
  }

  async function saveDarConfig() {
    try {
      await setDoc(doc(db, 'settings', 'darConfig'), {
        config: darConfig,
        updatedAt: new Date()
      });
      setHasChanges(false);
      alert('DAR configuration saved successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving DAR config:', error);
      alert('Failed to save DAR configuration');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-thr-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure DAR assignments and manage entities
        </p>
      </div>

      {/* DAR Configuration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="w-6 h-6 text-thr-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Default DAR Entity Assignments
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Set default entity codes for each DAR column. These will be used when creating new schedules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {darColumns.map((dar, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {dar}
              </label>
              <input
                type="text"
                value={darConfig[idx] || ''}
                onChange={(e) => handleDarConfigChange(idx, e.target.value)}
                className="input-field"
                placeholder="e.g., THFR/FM/THFM"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter entity codes separated by slashes
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            {hasChanges && (
              <span className="text-sm text-yellow-600 font-medium">
                Unsaved changes
              </span>
            )}
          </div>
          <button
            onClick={saveDarConfig}
            disabled={!hasChanges}
            className={`btn-primary ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save DAR Configuration
          </button>
        </div>
      </div>

      {/* Entity Management */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-6 h-6 text-thr-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Entity Management
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage all locations and facilities
            </p>
          </div>
        </div>
        <EntityManagement entities={entities} onUpdate={loadEntities} />
      </div>
    </div>
  );
}

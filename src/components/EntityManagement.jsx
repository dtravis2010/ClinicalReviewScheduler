import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit2, Trash2, X, Save, Building2 } from 'lucide-react';

export default function EntityManagement({ entities, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: ''
  });

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      code: ''
    });
    setEditingEntity(null);
    setShowAddModal(false);
  }

  function handleEdit(entity) {
    setFormData({
      name: entity.name || '',
      description: entity.description || '',
      code: entity.code || ''
    });
    setEditingEntity(entity);
    setShowAddModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Entity name is required');
      return;
    }

    try {
      if (editingEntity) {
        // Update existing entity
        const entityRef = doc(db, 'entities', editingEntity.id);
        await updateDoc(entityRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Add new entity
        await addDoc(collection(db, 'entities'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving entity:', error);
      alert('Failed to save entity');
    }
  }

  async function handleDelete(entity) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${entity.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'entities', entity.id));
      onUpdate();
    } catch (error) {
      console.error('Error deleting entity:', error);
      alert('Failed to delete entity');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Entity Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage locations and entities for assignment
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Entity
        </button>
      </div>

      {/* Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map(entity => (
          <div key={entity.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-thr-blue-500" />
                <h3 className="font-semibold text-gray-900">{entity.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(entity)}
                  className="text-thr-blue-600 hover:text-thr-blue-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(entity)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {entity.code && (
              <div className="text-xs text-gray-500 mb-2">
                Code: <span className="font-mono">{entity.code}</span>
              </div>
            )}

            {entity.description && (
              <p className="text-sm text-gray-600">{entity.description}</p>
            )}
          </div>
        ))}

        {entities.length === 0 && (
          <div className="col-span-full card text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No entities yet. Click "Add Entity" to get started.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEntity ? 'Edit Entity' : 'Add New Entity'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Entity Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Texas Health Arlington Memorial"
                  required
                />
              </div>

              <div>
                <label className="label">Entity Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-field"
                  placeholder="e.g., THAM"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional short code for the entity
                </p>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Optional description or notes about this entity..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingEntity ? 'Update Entity' : 'Add Entity'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit2, Trash2, Save, Building2, Check, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useFormValidation, validationPresets } from '../hooks/useFormValidation';
import { useToast } from '../hooks/useToast';

export default function EntityManagement({ entities, onUpdate }) {
  const { showSuccess, showError, showConfirm } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const {
    values: formData,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    resetForm: resetValidation,
    setValues
  } = useFormValidation(
    {
      name: '',
      description: '',
      code: ''
    },
    {
      name: validationPresets.entityName
    }
  );

  function resetForm() {
    resetValidation({
      name: '',
      description: '',
      code: ''
    });
    setEditingEntity(null);
    setShowAddModal(false);
    setIsSubmitting(false);
  }

  function handleEdit(entity) {
    setValues({
      name: entity.name || '',
      description: entity.description || '',
      code: entity.code || ''
    });
    setEditingEntity(entity);
    setShowAddModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

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
      showSuccess(editingEntity ? 'Entity updated successfully!' : 'Entity added successfully!');
    } catch (error) {
      console.error('Error saving entity:', error);
      showError('Failed to save entity');
      setIsSubmitting(false);
    }
  }

  async function handleDelete(entity) {
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${entity.name}? This action cannot be undone.`,
      { confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'entities', entity.id));
      onUpdate();
      showSuccess('Entity deleted successfully!');
    } catch (error) {
      console.error('Error deleting entity:', error);
      showError('Failed to delete entity');
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
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editingEntity ? 'Edit Entity' : 'Add New Entity'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Entity Name *</label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`input-field pr-10 ${
                  touched.name && errors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : touched.name && formData.name
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                placeholder="e.g., Texas Health Arlington Memorial"
              />
              {touched.name && !errors.name && formData.name && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="label">Entity Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
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
              onChange={(e) => handleChange('description', e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Optional description or notes about this entity..."
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingEntity ? 'Update Entity' : 'Add Entity'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-outline flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
